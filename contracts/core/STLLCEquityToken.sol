// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts-upgradeable/token/ERC20/ERC20Upgradeable.sol";
import "@openzeppelin/contracts-upgradeable/access/AccessControlUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/security/PausableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/security/ReentrancyGuardUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";

/**
 * @title STLLCEquityToken
 * @notice Shylow Thompson LLC — tokenized equity on Polygon
 * @dev ERC-20 with compliance whitelist, profit distribution, and governance votes
 *
 * Token economics:
 *   Total supply : 10,000 STLLC
 *   Manager share: 8,000 (80%) — Shylow Thompson
 *   Investor pool : 2,000 (20%) — sold via Reg D 506(c)
 *   Price at raise: $100 per token → $200,000 raised
 *   Distribution  : 20% of quarterly net profit in USDC, pro-rata
 *
 * Security model:
 *   - UUPS upgradeable proxy (emergency patch path)
 *   - Pausable (emergency stop)
 *   - KYC whitelist enforced on every transfer (ERC-3643 inspired)
 *   - Role-based access control (manager, compliance, pauser)
 *   - ReentrancyGuard on all state-mutating external calls
 */
contract STLLCEquityToken is
    Initializable,
    ERC20Upgradeable,
    AccessControlUpgradeable,
    PausableUpgradeable,
    ReentrancyGuardUpgradeable,
    UUPSUpgradeable
{
    using SafeERC20 for IERC20;

    // ─── Roles ────────────────────────────────────────────────────────────────
    bytes32 public constant MANAGER_ROLE     = keccak256("MANAGER_ROLE");
    bytes32 public constant COMPLIANCE_ROLE  = keccak256("COMPLIANCE_ROLE");
    bytes32 public constant PAUSER_ROLE      = keccak256("PAUSER_ROLE");
    bytes32 public constant UPGRADER_ROLE    = keccak256("UPGRADER_ROLE");

    // ─── State ────────────────────────────────────────────────────────────────
    IERC20 public usdc;

    /// @notice Manager wallet (set during initialize)
    address public managerAddress;

    /// @notice KYC-verified, accredited investor wallets
    mapping(address => bool) public whitelist;

    /// @notice Claimed distribution amounts per wallet
    mapping(address => uint256) public claimedDistributions;

    /// @notice Total USDC ever deposited for distribution
    uint256 public totalDistributed;

    /// @notice Accumulated USDC per token (scaled 1e18)
    uint256 public accumulatedPerToken;

    /// @notice Snapshot of accumulatedPerToken at last claim per address
    mapping(address => uint256) public rewardDebt;

    /// @notice Rewards settled during transfers but not yet claimed
    mapping(address => uint256) public pendingSettled;

    /// @notice Distribution history for transparency
    struct Distribution {
        uint256 amount;
        uint256 timestamp;
        string  dealReference;
        uint256 accPerTokenSnapshot;
    }
    Distribution[] public distributionHistory;

    /// @notice Governance: extraordinary vote proposals
    struct Proposal {
        string  description;
        uint256 forVotes;
        uint256 againstVotes;
        uint256 deadline;
        bool    executed;
        mapping(address => bool) hasVoted;
    }
    mapping(uint256 => Proposal) public proposals;
    uint256 public proposalCount;

    /// @notice Minimum token balance required to create a proposal
    uint256 public proposalThreshold;

    /// @notice Minimum % of investor tokens that must vote (quorum)
    uint256 public quorumBps; // basis points of INVESTOR_SUPPLY

    uint256 public constant TOTAL_SUPPLY      = 10_000 * 1e18;
    uint256 public constant INVESTOR_SUPPLY   = 2_000  * 1e18;
    uint256 public constant MANAGER_SUPPLY    = 8_000  * 1e18;
    uint256 private constant PRECISION        = 1e18;

    // ─── Events ───────────────────────────────────────────────────────────────
    event WhitelistUpdated(address indexed account, bool status);
    event DistributionDeposited(uint256 amount, string dealRef, uint256 timestamp);
    event RewardClaimed(address indexed account, uint256 amount);
    event ProposalCreated(uint256 indexed id, address proposer, string description, uint256 deadline);
    event VoteCast(uint256 indexed id, address voter, bool support, uint256 weight);
    event ProposalExecuted(uint256 indexed id);

    // ─── Errors ───────────────────────────────────────────────────────────────
    error NotWhitelisted(address account);
    error InsufficientBalance();
    error ZeroAmount();
    error InvalidAddress();
    error AlreadyVoted();
    error VotingEnded();
    error VotingActive();
    error ProposalNotFound();
    error BelowThreshold();
    error QuorumNotReached();
    error InvalidVotingPeriod();

    /// @custom:oz-upgrades-unsafe-allow constructor
    constructor() { _disableInitializers(); }

    /**
     * @notice Initialize the contract (called once via proxy)
     * @param _usdc     USDC token address on deployment chain
     * @param _manager  Shylow Thompson wallet — receives 8,000 tokens
     */
    function initialize(address _usdc, address _manager) external initializer {
        if (_usdc == address(0) || _manager == address(0)) revert InvalidAddress();

        __ERC20_init("Shylow Thompson LLC Equity", "STLLC");
        __AccessControl_init();
        __Pausable_init();
        __ReentrancyGuard_init();
        __UUPSUpgradeable_init();

        usdc = IERC20(_usdc);
        managerAddress = _manager;
        proposalThreshold = 100 * 1e18;  // 100 tokens to propose
        quorumBps = 1500;                 // 15% of investor supply

        // Grant roles to manager
        _grantRole(DEFAULT_ADMIN_ROLE, _manager);
        _grantRole(MANAGER_ROLE,    _manager);
        _grantRole(COMPLIANCE_ROLE, _manager);
        _grantRole(PAUSER_ROLE,     _manager);
        _grantRole(UPGRADER_ROLE,   _manager);

        // Whitelist manager
        whitelist[_manager] = true;

        // Mint: 8,000 to manager, 2,000 stay in contract for investor distribution
        _mint(_manager,    MANAGER_SUPPLY);
        _mint(address(this), INVESTOR_SUPPLY);
    }

    // ─── Compliance ───────────────────────────────────────────────────────────

    /**
     * @notice Add or remove an address from the KYC whitelist
     * @dev Only COMPLIANCE_ROLE. Reg D 506(c) — accredited investors only.
     */
    function setWhitelist(address account, bool status)
        external
        onlyRole(COMPLIANCE_ROLE)
    {
        if (account == address(0)) revert InvalidAddress();
        whitelist[account] = status;
        emit WhitelistUpdated(account, status);
    }

    /// @notice Batch whitelist update for onboarding efficiency
    function batchSetWhitelist(address[] calldata accounts, bool status)
        external
        onlyRole(COMPLIANCE_ROLE)
    {
        for (uint256 i = 0; i < accounts.length; ) {
            whitelist[accounts[i]] = status;
            emit WhitelistUpdated(accounts[i], status);
            unchecked { ++i; }
        }
    }

    // ─── Token Distribution (Investor Sale) ───────────────────────────────────

    /**
     * @notice Transfer investor tokens to a whitelisted buyer
     * @dev Manager calls this after receiving USDC off-chain (Reg D compliance)
     */
    function distributeInvestorTokens(address investor, uint256 amount)
        external
        onlyRole(MANAGER_ROLE)
        whenNotPaused
    {
        if (!whitelist[investor]) revert NotWhitelisted(investor);
        if (amount == 0) revert ZeroAmount();
        // Settle any pending rewards before balance changes
        _settleRewards(investor);
        _transfer(address(this), investor, amount);
    }

    // ─── Profit Distribution ─────────────────────────────────────────────────

    /**
     * @notice Deposit quarterly profit share into the contract
     * @dev Manager approves USDC then calls this. 20% of net quarterly profit.
     *      Uses a per-token accumulator pattern (gas-efficient, no loops).
     * @param amount      USDC amount (6 decimals on Polygon)
     * @param dealRef     Human-readable reference e.g. "Q1-2026 — 3 Jefferson Co. deals"
     */
    function depositDistribution(uint256 amount, string calldata dealRef)
        external
        onlyRole(MANAGER_ROLE)
        nonReentrant
        whenNotPaused
    {
        if (amount == 0) revert ZeroAmount();

        // Pull USDC from manager wallet
        usdc.safeTransferFrom(msg.sender, address(this), amount);

        // Update accumulator: divide by circulating investor tokens
        uint256 circulatingInvestor = INVESTOR_SUPPLY - balanceOf(address(this));
        if (circulatingInvestor > 0) {
            accumulatedPerToken += (amount * PRECISION) / circulatingInvestor;
        }

        totalDistributed += amount;

        distributionHistory.push(Distribution({
            amount:              amount,
            timestamp:           block.timestamp,
            dealReference:       dealRef,
            accPerTokenSnapshot: accumulatedPerToken
        }));

        emit DistributionDeposited(amount, dealRef, block.timestamp);
    }

    /**
     * @notice Claim accumulated USDC distribution
     * @dev Investor calls this to pull their share. Pull pattern avoids push attack vectors.
     */
    function claimRewards() external nonReentrant whenNotPaused {
        if (!whitelist[msg.sender]) revert NotWhitelisted(msg.sender);
        uint256 pending = pendingRewards(msg.sender) + pendingSettled[msg.sender];
        if (pending == 0) revert ZeroAmount();

        rewardDebt[msg.sender] = accumulatedPerToken;
        pendingSettled[msg.sender] = 0;
        claimedDistributions[msg.sender] += pending;

        usdc.safeTransfer(msg.sender, pending);
        emit RewardClaimed(msg.sender, pending);
    }

    /**
     * @notice View pending unclaimed USDC for an address
     */
    function pendingRewards(address account) public view returns (uint256) {
        uint256 bal = balanceOf(account);
        if (bal == 0) return 0;
        // Only investor tokens (not manager's 8,000) accrue distributions
        if (account == _getManagerAddress()) {
            // Manager gets paid separately via salary/fee, not token distributions
            return 0;
        }
        uint256 accumulated = (bal * (accumulatedPerToken - rewardDebt[account])) / PRECISION;
        return accumulated;
    }

    // ─── Governance ───────────────────────────────────────────────────────────

    /**
     * @notice Create a governance proposal (extraordinary matters only)
     * @dev Requires proposalThreshold tokens. Token holders vote on:
     *      - Sale of the business
     *      - Changing profit-share percentage
     *      - Admitting new managing partner
     *      - Debt exceeding $500K
     *      - Operating agreement amendments
     */
    function createProposal(string calldata description, uint256 votingPeriod)
        external
        whenNotPaused
        returns (uint256 id)
    {
        if (balanceOf(msg.sender) < proposalThreshold) revert BelowThreshold();
        if (votingPeriod < 1 days || votingPeriod > 14 days) revert InvalidVotingPeriod();

        id = proposalCount++;
        Proposal storage p = proposals[id];
        p.description = description;
        p.deadline    = block.timestamp + votingPeriod;

        emit ProposalCreated(id, msg.sender, description, p.deadline);
    }

    /**
     * @notice Cast vote on a proposal
     */
    function castVote(uint256 id, bool support) external whenNotPaused {
        Proposal storage p = proposals[id];
        if (p.deadline == 0) revert ProposalNotFound();
        if (block.timestamp > p.deadline) revert VotingEnded();
        if (p.hasVoted[msg.sender]) revert AlreadyVoted();

        uint256 weight = balanceOf(msg.sender);
        if (weight == 0) revert InsufficientBalance();

        p.hasVoted[msg.sender] = true;
        if (support) {
            p.forVotes += weight;
        } else {
            p.againstVotes += weight;
        }

        emit VoteCast(id, msg.sender, support, weight);
    }

    /**
     * @notice Check if a proposal passed (quorum + majority)
     */
    function proposalPassed(uint256 id) public view returns (bool) {
        Proposal storage p = proposals[id];
        if (p.deadline == 0 || block.timestamp <= p.deadline) return false;
        uint256 quorum = (INVESTOR_SUPPLY * quorumBps) / 10_000;
        return (p.forVotes + p.againstVotes >= quorum) && (p.forVotes > p.againstVotes);
    }

    // ─── ERC-3643 Inspired Transfer Hook ─────────────────────────────────────

    /**
     * @dev Override _beforeTokenTransfer to enforce whitelist compliance
     *      Mint (from=0) and burn (to=0) bypass whitelist for contract operations
     */
    function _beforeTokenTransfer(address from, address to, uint256 amount)
        internal
        override(ERC20Upgradeable)
        whenNotPaused
    {
        super._beforeTokenTransfer(from, to, amount);

        bool isMint = from == address(0);
        bool isBurn = to == address(0);
        bool isContractOp = from == address(this) || to == address(this);

        if (!isMint && !isBurn && !isContractOp) {
            if (!whitelist[from]) revert NotWhitelisted(from);
            if (!whitelist[to])   revert NotWhitelisted(to);
            // Settle pending rewards before balance change
            _settleRewards(from);
            _settleRewards(to);
        }
    }

    // ─── Emergency Controls ───────────────────────────────────────────────────

    function pause() external onlyRole(PAUSER_ROLE) { _pause(); }
    function unpause() external onlyRole(PAUSER_ROLE) { _unpause(); }

    /**
     * @notice Emergency USDC withdrawal (multisig required in production)
     */
    function emergencyWithdraw(address to, uint256 amount)
        external
        onlyRole(DEFAULT_ADMIN_ROLE)
        whenPaused
    {
        usdc.safeTransfer(to, amount);
    }

    // ─── Internal Helpers ─────────────────────────────────────────────────────

    function _settleRewards(address account) internal {
        uint256 pending = pendingRewards(account);
        if (pending > 0) {
            pendingSettled[account] += pending;
        }
        rewardDebt[account] = accumulatedPerToken;
    }

    function _getManagerAddress() internal view returns (address) {
        return managerAddress;
    }

    // ─── View Helpers ─────────────────────────────────────────────────────────

    function distributionCount() external view returns (uint256) {
        return distributionHistory.length;
    }

    function getDistribution(uint256 index) external view returns (
        uint256 amount,
        uint256 timestamp,
        string memory dealReference
    ) {
        Distribution storage d = distributionHistory[index];
        return (d.amount, d.timestamp, d.dealReference);
    }

    function _authorizeUpgrade(address newImpl)
        internal
        override
        onlyRole(UPGRADER_ROLE)
    {}
}
