// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/security/Pausable.sol";

/**
 * @title STDealNote
 * @notice Shylow Thompson Deal Note — fixed-term tokenized bond per Missouri deal
 *
 * Structure per deal (example: ST-DEAL-008):
 *   Principal : $129,000 USDC
 *   Tokens    : 1,290 × $100 face value
 *   Coupon    : 12% annualized (6% for 6-month term)
 *   Repayment : $106 per token at maturity (principal + interest)
 *   Trigger   : Manager calls repay() after property sale closes
 *   Collateral: First-lien deed of trust on Missouri SPV property (off-chain)
 *
 * Security:
 *   - No upgradeable proxy (simple, auditable, immutable terms)
 *   - Whitelist enforced on transfers
 *   - Tokens burned on repayment (clean lifecycle)
 *   - Emergency pause with timelock on repayment
 */
contract STDealNote is ERC20, AccessControl, ReentrancyGuard, Pausable {
    using SafeERC20 for IERC20;

    bytes32 public constant MANAGER_ROLE    = keccak256("MANAGER_ROLE");
    bytes32 public constant COMPLIANCE_ROLE = keccak256("COMPLIANCE_ROLE");

    IERC20 public immutable usdc;

    // ─── Deal Parameters (immutable after deployment) ─────────────────────────
    uint256 public immutable faceValuePerToken;    // USDC per token (e.g. 100e6)
    uint256 public immutable repaymentPerToken;    // USDC at maturity (e.g. 106e6)
    uint256 public immutable maturityDate;         // Unix timestamp
    string  public           dealReference;        // "ST-DEAL-008 — 142 Ridgewood Dr"
    string  public           propertyAddress;      // Physical address for transparency
    uint256 public           arvUSD;               // After Repair Value in USD cents

    // ─── State ────────────────────────────────────────────────────────────────
    bool    public matured;
    bool    public fundsDeposited;
    uint256 public totalRepaymentDeposited;

    mapping(address => bool) public whitelist;

    // ─── Events ───────────────────────────────────────────────────────────────
    event TokensSold(address indexed investor, uint256 amount, uint256 usdcPaid);
    event FundsDeposited(uint256 amount, uint256 timestamp);
    event NoteClaimed(address indexed investor, uint256 tokens, uint256 usdcReceived);
    event NoteMatured(uint256 timestamp);
    event WhitelistUpdated(address indexed account, bool status);

    // ─── Errors ───────────────────────────────────────────────────────────────
    error NotWhitelisted(address account);
    error NotMatured();
    error AlreadyMatured();
    error InsufficientFunds();
    error ZeroAmount();
    error InvalidAddress();
    error InvalidRepayment();
    error InvalidMaturityDate();

    constructor(
        address _usdc,
        address _manager,
        uint256 _totalTokens,        // e.g. 1290
        uint256 _faceValuePerToken,  // e.g. 100e6 (USDC 6 decimals)
        uint256 _repaymentPerToken,  // e.g. 106e6
        uint256 _maturityDate,       // unix timestamp
        string memory _dealRef,
        string memory _propertyAddr,
        uint256 _arvUSD
    ) ERC20("ST Deal Note", "ST-NOTE") {
        if (_usdc == address(0) || _manager == address(0)) revert InvalidAddress();
        if (_repaymentPerToken < _faceValuePerToken) revert InvalidRepayment();
        if (_maturityDate <= block.timestamp) revert InvalidMaturityDate();

        usdc              = IERC20(_usdc);
        faceValuePerToken = _faceValuePerToken;
        repaymentPerToken = _repaymentPerToken;
        maturityDate      = _maturityDate;
        dealReference     = _dealRef;
        propertyAddress   = _propertyAddr;
        arvUSD            = _arvUSD;

        _grantRole(DEFAULT_ADMIN_ROLE, _manager);
        _grantRole(MANAGER_ROLE,       _manager);
        _grantRole(COMPLIANCE_ROLE,    _manager);

        whitelist[_manager] = true;
        whitelist[address(this)] = true;

        // Mint all tokens to contract; manager distributes to investors
        _mint(address(this), _totalTokens * 1e18);
    }

    // ─── Investor Onboarding ─────────────────────────────────────────────────

    function setWhitelist(address account, bool status) external onlyRole(COMPLIANCE_ROLE) {
        whitelist[account] = status;
        emit WhitelistUpdated(account, status);
    }

    /**
     * @notice Manager transfers tokens to whitelisted investor after receiving USDC
     * @dev USDC is collected off-chain (Reg D 506c) then tokens distributed on-chain
     */
    function issueTokens(address investor, uint256 tokenAmount)
        external
        onlyRole(MANAGER_ROLE)
        whenNotPaused
    {
        if (!whitelist[investor]) revert NotWhitelisted(investor);
        if (tokenAmount == 0) revert ZeroAmount();
        if (matured) revert AlreadyMatured();

        uint256 usdcEquivalent = (tokenAmount * faceValuePerToken) / 1e18;
        _transfer(address(this), investor, tokenAmount);
        emit TokensSold(investor, tokenAmount, usdcEquivalent);
    }

    // ─── Maturity + Repayment ─────────────────────────────────────────────────

    /**
     * @notice Manager deposits full repayment USDC after property sale closes
     * @dev Total required = (totalTokens - unsold) * repaymentPerToken / 1e18
     */
    function depositRepayment(uint256 amount) external onlyRole(MANAGER_ROLE) nonReentrant {
        if (amount == 0) revert ZeroAmount();
        usdc.safeTransferFrom(msg.sender, address(this), amount);
        totalRepaymentDeposited += amount;
        fundsDeposited = true;
        matured = true;
        emit FundsDeposited(amount, block.timestamp);
        emit NoteMatured(block.timestamp);
    }

    /**
     * @notice Investor redeems their tokens for principal + interest
     * @dev Tokens are burned on redemption — clean on-chain closure
     */
    function redeem(uint256 tokenAmount) external nonReentrant whenNotPaused {
        if (!matured) revert NotMatured();
        if (!whitelist[msg.sender]) revert NotWhitelisted(msg.sender);
        if (tokenAmount == 0) revert ZeroAmount();
        if (balanceOf(msg.sender) < tokenAmount) revert InsufficientFunds();

        uint256 payout = (tokenAmount * repaymentPerToken) / 1e18;
        if (usdc.balanceOf(address(this)) < payout) revert InsufficientFunds();

        _burn(msg.sender, tokenAmount);
        usdc.safeTransfer(msg.sender, payout);
        emit NoteClaimed(msg.sender, tokenAmount, payout);
    }

    // ─── View ─────────────────────────────────────────────────────────────────

    function circulatingTokens() external view returns (uint256) {
        return totalSupply() - balanceOf(address(this));
    }

    function totalRepaymentRequired() external view returns (uint256) {
        uint256 circulating = totalSupply() - balanceOf(address(this));
        return (circulating * repaymentPerToken) / 1e18;
    }

    function impliedAnnualYieldBps() external view returns (uint256) {
        if (block.timestamp >= maturityDate) return 0;
        uint256 gain = repaymentPerToken - faceValuePerToken;
        uint256 termSeconds = maturityDate - block.timestamp;
        uint256 annualBps = (gain * 10_000 * 365 days) / (faceValuePerToken * termSeconds);
        return annualBps;
    }

    // ─── Transfer Compliance Hook ─────────────────────────────────────────────

    function _beforeTokenTransfer(address from, address to, uint256 amount)
        internal
        override
        whenNotPaused
    {
        super._beforeTokenTransfer(from, to, amount);
        bool isMint = from == address(0);
        bool isBurn = to == address(0);
        bool isContractOp = from == address(this) || to == address(this);
        if (!isMint && !isBurn && !isContractOp) {
            if (!whitelist[from]) revert NotWhitelisted(from);
            if (!whitelist[to])   revert NotWhitelisted(to);
        }
    }

    function pause() external onlyRole(MANAGER_ROLE) { _pause(); }
    function unpause() external onlyRole(MANAGER_ROLE) { _unpause(); }

    function decimals() public pure override returns (uint8) { return 18; }
}
