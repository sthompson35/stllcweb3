// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/ERC20Burnable.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/security/Pausable.sol";

/**
 * @title SHTXUtilityToken
 * @notice SHTX — Shylow Thompson community utility token
 *         Shared across STLLCweb3 ecosystem and KhakiSol
 *
 * Utility (NOT a security — no investment return):
 *   - Early deal notification access for STLLC investor community
 *   - KhakiSol loyalty rewards (earn on purchases, redeem for discounts)
 *   - YouTube community access gating
 *   - Event and whitelist priority
 *
 * Tokenomics:
 *   Max supply  : 10,000,000 SHTX
 *   Community   : 4,000,000 (40%) — earned via platform activity
 *   KhakiSol    : 3,000,000 (30%) — loyalty rewards pool
 *   Team/ops    : 2,000,000 (20%) — 24-month linear vest
 *   Reserve     : 1,000,000 (10%) — DAO treasury
 *
 * Security:
 *   - Mintable only by MINTER_ROLE (controlled platform contracts)
 *   - Burnable by holder (loyalty redemption burns supply)
 *   - Rate-limited minting to prevent abuse
 *   - No financial value guarantee
 */
contract SHTXUtilityToken is ERC20, ERC20Burnable, AccessControl, Pausable {

    bytes32 public constant MINTER_ROLE  = keccak256("MINTER_ROLE");
    bytes32 public constant PAUSER_ROLE  = keccak256("PAUSER_ROLE");

    uint256 public constant MAX_SUPPLY   = 10_000_000 * 1e18;

    // Rate limiting: max mint per address per day
    uint256 public constant DAILY_MINT_LIMIT = 10_000 * 1e18;
    mapping(address => uint256) public lastMintDay;
    mapping(address => uint256) public mintedToday;

    // Utility tiers — unlock platform features
    struct Tier {
        string  name;
        uint256 minBalance;
        string  benefit;
    }
    Tier[] public tiers;

    // KhakiSol purchase → SHTX reward rate (SHTX per USD cent)
    uint256 public rewardRatePerCent; // e.g. 10 = 10 SHTX per $1 spent

    event TokensMinted(address indexed to, uint256 amount, string reason);
    event RewardRateUpdated(uint256 newRate);
    event TierAdded(uint256 index, string name, uint256 minBalance);

    error ExceedsMaxSupply();
    error DailyLimitExceeded();
    error InvalidAddress();
    error ZeroAmount();

    constructor(address admin) ERC20("SHTX Utility Token", "SHTX") {
        if (admin == address(0)) revert InvalidAddress();

        _grantRole(DEFAULT_ADMIN_ROLE, admin);
        _grantRole(MINTER_ROLE,        admin);
        _grantRole(PAUSER_ROLE,        admin);

        rewardRatePerCent = 10; // 10 SHTX per $1 of KhakiSol purchase

        // Define utility tiers
        tiers.push(Tier("Scout",    100  * 1e18, "Deal newsletter access"));
        tiers.push(Tier("Operator", 500  * 1e18, "Early deal notifications + Discord"));
        tiers.push(Tier("Trooper",  2000 * 1e18, "Whitelist priority on deal notes"));
        tiers.push(Tier("Commander",5000 * 1e18, "Direct access + KhakiSol 20% discount"));
    }

    /**
     * @notice Mint SHTX for community activity (purchases, referrals, content)
     * @param to     Recipient wallet
     * @param amount Amount to mint
     * @param reason Human-readable reason for on-chain transparency
     */
    function mint(address to, uint256 amount, string calldata reason)
        external
        onlyRole(MINTER_ROLE)
        whenNotPaused
    {
        if (to == address(0)) revert InvalidAddress();
        if (amount == 0) revert ZeroAmount();
        if (totalSupply() + amount > MAX_SUPPLY) revert ExceedsMaxSupply();

        // Rate limit per minter
        uint256 today = block.timestamp / 1 days;
        if (lastMintDay[msg.sender] < today) {
            mintedToday[msg.sender] = 0;
            lastMintDay[msg.sender] = today;
        }
        mintedToday[msg.sender] += amount;
        if (mintedToday[msg.sender] > DAILY_MINT_LIMIT) revert DailyLimitExceeded();

        _mint(to, amount);
        emit TokensMinted(to, amount, reason);
    }

    /**
     * @notice Calculate SHTX reward for a KhakiSol purchase
     * @param purchaseUSDCents Purchase amount in USD cents (e.g. 4995 = $49.95)
     */
    function calculatePurchaseReward(uint256 purchaseUSDCents)
        external
        view
        returns (uint256 shtxReward)
    {
        return purchaseUSDCents * rewardRatePerCent * 1e18 / 100;
    }

    /**
     * @notice Get the utility tier for a given holder
     */
    function getTier(address holder) external view returns (string memory tierName, string memory benefit) {
        uint256 bal = balanceOf(holder);
        for (uint256 i = tiers.length; i > 0; ) {
            unchecked { --i; }
            if (bal >= tiers[i].minBalance) {
                return (tiers[i].name, tiers[i].benefit);
            }
        }
        return ("None", "Hold SHTX to unlock platform benefits");
    }

    function setRewardRate(uint256 rate) external onlyRole(DEFAULT_ADMIN_ROLE) {
        rewardRatePerCent = rate;
        emit RewardRateUpdated(rate);
    }

    function pause() external onlyRole(PAUSER_ROLE) { _pause(); }
    function unpause() external onlyRole(PAUSER_ROLE) { _unpause(); }

    function _beforeTokenTransfer(address from, address to, uint256 amount)
        internal
        override
        whenNotPaused
    {
        super._beforeTokenTransfer(from, to, amount);
    }
}
