// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/token/ERC1155/ERC1155.sol";
import "@openzeppelin/contracts/token/ERC1155/extensions/ERC1155Supply.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/security/Pausable.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";

/**
 * @title STSpreadCollection
 * @notice 15-token ERC-1155 spread monetizable collection
 *
 * Token IDs:
 *   1–5   Tier 1 — Deal Note NFTs   : USDC-yielding real estate positions (Reg D 506c)
 *   6–10  Tier 2 — Product NFTs     : KhakiSol limited drops w/ ERC-2981 royalties
 *   11–15 Tier 3 — Spread Badges    : SHTX-accruing loyalty badges w/ transfer cooldowns
 *
 * Spread monetization per tier:
 *   Tier 1 : interest rate spread — investors buy at face value, redeem at maturity for
 *            face + yield in USDC (e.g. $100 in → $106 out at 6 months)
 *   Tier 2 : royalty spread — 5% of every secondary sale flows back to STLLC
 *   Tier 3 : SHTX accrual spread — badge holders earn SHTX at tier-specific daily rates;
 *            transfer cooldown prevents wash-trading
 */
contract STSpreadCollection is
    ERC1155,
    ERC1155Supply,
    AccessControl,
    Pausable,
    ReentrancyGuard
{
    using SafeERC20 for IERC20;

    // ─── Roles ────────────────────────────────────────────────────────────────
    bytes32 public constant MANAGER_ROLE    = keccak256("MANAGER_ROLE");
    bytes32 public constant COMPLIANCE_ROLE = keccak256("COMPLIANCE_ROLE");
    bytes32 public constant MINTER_ROLE     = keccak256("MINTER_ROLE");
    bytes32 public constant PAUSER_ROLE     = keccak256("PAUSER_ROLE");

    // ─── Token ID Boundaries ─────────────────────────────────────────────────
    uint256 public constant DEAL_NOTE_START   = 1;
    uint256 public constant DEAL_NOTE_END     = 5;
    uint256 public constant PRODUCT_NFT_START = 6;
    uint256 public constant PRODUCT_NFT_END   = 10;
    uint256 public constant BADGE_START       = 11;
    uint256 public constant BADGE_END         = 15;

    IERC20 public immutable usdc;

    // ─── Tier 1: Deal Note NFTs ───────────────────────────────────────────────
    struct DealNote {
        string  dealRef;                  // e.g. "ST-DEAL-009"
        string  propertyAddress;          // physical address or "TBD"
        uint256 faceValueUSDC;            // USDC per token (6 decimals), e.g. 100e6
        uint256 repaymentUSDC;            // USDC per token at maturity, e.g. 106e6
        uint256 maturityDate;             // unix timestamp
        uint256 maxSupply;                // max tokens for this deal
        uint256 arvUSD;                   // After Repair Value in USD cents
        bool    matured;
        bool    fundsDeposited;
        uint256 totalRepaymentDeposited;
    }
    mapping(uint256 => DealNote) public dealNotes;

    // Reg D 506(c) whitelist — only verified accredited investors may hold deal notes
    mapping(address => bool) public dealWhitelist;

    // ─── Tier 2: Product NFTs ─────────────────────────────────────────────────
    struct ProductNFT {
        string  name;
        string  sku;
        uint256 maxSupply;
        uint256 priceUSDCents;
        bool    active;
    }
    mapping(uint256 => ProductNFT) public productNFTs;

    address public royaltyRecipient;
    uint256 public royaltyBps; // basis points, 500 = 5%

    // ─── Tier 3: Spread Badges ────────────────────────────────────────────────
    struct BadgeTier {
        string  name;
        uint256 shtxPerDay;        // SHTX accrual in 1e18 units per day
        uint256 transferCooldown;  // seconds between transfers
        uint256 maxSupply;
    }
    mapping(uint256 => BadgeTier) public badgeTiers;

    // tokenId → holder → last transfer timestamp (for cooldown enforcement)
    mapping(uint256 => mapping(address => uint256)) public lastTransferTime;

    // per-token metadata URIs
    mapping(uint256 => string) private _tokenURIs;

    // ─── Events ───────────────────────────────────────────────────────────────
    event DealNoteIssued(uint256 indexed tokenId, address indexed investor, uint256 amount, uint256 usdcEquivalent);
    event DealRepaymentDeposited(uint256 indexed tokenId, uint256 amount);
    event DealNoteRedeemed(uint256 indexed tokenId, address indexed investor, uint256 tokens, uint256 usdcReceived);
    event DealNoteMatured(uint256 indexed tokenId, uint256 timestamp);
    event ProductNFTMinted(uint256 indexed tokenId, address indexed buyer, string sku);
    event RoyaltyUpdated(address recipient, uint256 bps);
    event BadgeMinted(uint256 indexed tokenId, address indexed recipient, uint256 amount);
    event WhitelistUpdated(address indexed account, bool status);

    // ─── Errors ───────────────────────────────────────────────────────────────
    error InvalidTokenId();
    error InvalidAddress();
    error ZeroAmount();
    error NotWhitelisted(address account);
    error NotMatured();
    error AlreadyMatured();
    error InsufficientFunds();
    error ExceedsMaxSupply();
    error DropNotActive();
    error CooldownActive(uint256 unlockTime);
    error InvalidRepayment();
    error InvalidMaturityDate();

    // ─── Constructor ──────────────────────────────────────────────────────────

    constructor(
        address _usdc,
        address _admin,
        string memory _baseURI
    ) ERC1155(_baseURI) {
        if (_usdc    == address(0)) revert InvalidAddress();
        if (_admin   == address(0)) revert InvalidAddress();

        usdc = IERC20(_usdc);

        _grantRole(DEFAULT_ADMIN_ROLE, _admin);
        _grantRole(MANAGER_ROLE,       _admin);
        _grantRole(COMPLIANCE_ROLE,    _admin);
        _grantRole(MINTER_ROLE,        _admin);
        _grantRole(PAUSER_ROLE,        _admin);

        royaltyRecipient = _admin;
        royaltyBps       = 500;

        dealWhitelist[_admin]        = true;
        dealWhitelist[address(this)] = true;

        _initDealNotes();
        _initProductNFTs();
        _initBadgeTiers();
    }

    // ─── Initialization (placeholders — update via updateDealNote before live) ─

    function _initDealNotes() internal {
        uint256 t6mo  = block.timestamp + 180 days;
        uint256 t9mo  = block.timestamp + 270 days;
        uint256 t12mo = block.timestamp + 365 days;

        // ID 1 - 500 x $100 tokens, 6% yield, 6-month term
        _writeDealNote(1, "ST-DEAL-009", "TBD - Placeholder Property A, MO",
            100e6, 106e6, t6mo,  500,  19_500_000);

        // ID 2 - 750 x $100 tokens, 7% yield, 9-month term
        _writeDealNote(2, "ST-DEAL-010", "TBD - Placeholder Property B, MO",
            100e6, 107e6, t9mo,  750,  22_000_000);

        // ID 3 - 1,000 x $100 tokens, 8% yield, 12-month term
        _writeDealNote(3, "ST-DEAL-011", "TBD - Placeholder Property C, MO",
            100e6, 108e6, t12mo, 1000, 25_000_000);

        // ID 4 - 300 x $250 tokens, 6% yield, 6-month term (larger min position)
        _writeDealNote(4, "ST-DEAL-012", "TBD - Placeholder Property D, MO",
            250e6, 265e6, t6mo,  300,  35_000_000);

        // ID 5 - 200 x $500 tokens, 6% yield, 6-month term (premium deal)
        _writeDealNote(5, "ST-DEAL-013", "TBD - Placeholder Property E, MO",
            500e6, 530e6, t6mo,  200,  55_000_000);
    }

    function _writeDealNote(
        uint256 id,
        string memory dealRef,
        string memory propAddr,
        uint256 face,
        uint256 repay,
        uint256 maturity,
        uint256 maxSup,
        uint256 arv
    ) internal {
        dealNotes[id] = DealNote({
            dealRef:                 dealRef,
            propertyAddress:         propAddr,
            faceValueUSDC:           face,
            repaymentUSDC:           repay,
            maturityDate:            maturity,
            maxSupply:               maxSup,
            arvUSD:                  arv,
            matured:                 false,
            fundsDeposited:          false,
            totalRepaymentDeposited: 0
        });
    }

    function _initProductNFTs() internal {
        // Prices in USD cents
        productNFTs[6]  = ProductNFT("Desert Tan Combat Boot",   "KS-BOOT-001", 250, 18999, true);
        productNFTs[7]  = ProductNFT("Multicam Field Jacket",    "KS-JACK-001", 100, 29999, true);
        productNFTs[8]  = ProductNFT("Operator Pack Gen2",       "KS-PACK-002", 150, 24999, true);
        productNFTs[9]  = ProductNFT("Brokerage Tactical Vest",  "KS-VEST-001",  50, 44999, true);
        productNFTs[10] = ProductNFT("KhakiSol Founder's Watch", "KS-WTCH-001",  25, 79999, true);
    }

    function _initBadgeTiers() internal {
        // shtxPerDay in 1e18 units; cooldown in seconds; maxSupply per tier
        badgeTiers[11] = BadgeTier("Spread Bronze",     5e18,   7 days, 500);
        badgeTiers[12] = BadgeTier("Spread Silver",    15e18,  14 days, 250);
        badgeTiers[13] = BadgeTier("Spread Gold",      50e18,  30 days, 100);
        badgeTiers[14] = BadgeTier("Spread Platinum", 150e18,  60 days,  50);
        badgeTiers[15] = BadgeTier("Spread Diamond",  500e18,  90 days,  10);
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // TIER 1 — DEAL NOTE OPERATIONS
    // ═══════════════════════════════════════════════════════════════════════════

    /**
     * @notice Update deal note parameters before any tokens are issued.
     *         Call this once you have a real property address and final terms.
     */
    function updateDealNote(
        uint256 tokenId,
        string calldata dealRef,
        string calldata propAddr,
        uint256 faceValueUSDC,
        uint256 repaymentUSDC,
        uint256 maturityDate,
        uint256 maxSupply,
        uint256 arvUSD
    ) external onlyRole(MANAGER_ROLE) {
        if (tokenId < DEAL_NOTE_START || tokenId > DEAL_NOTE_END) revert InvalidTokenId();
        if (repaymentUSDC < faceValueUSDC)       revert InvalidRepayment();
        if (maturityDate <= block.timestamp)      revert InvalidMaturityDate();
        DealNote storage note = dealNotes[tokenId];
        if (note.matured)                         revert AlreadyMatured();

        note.dealRef         = dealRef;
        note.propertyAddress = propAddr;
        note.faceValueUSDC   = faceValueUSDC;
        note.repaymentUSDC   = repaymentUSDC;
        note.maturityDate    = maturityDate;
        note.maxSupply       = maxSupply;
        note.arvUSD          = arvUSD;
    }

    /**
     * @notice Add or remove an investor from the Reg D whitelist.
     */
    function setDealWhitelist(address account, bool status)
        external
        onlyRole(COMPLIANCE_ROLE)
    {
        dealWhitelist[account] = status;
        emit WhitelistUpdated(account, status);
    }

    function batchSetDealWhitelist(address[] calldata accounts, bool status)
        external
        onlyRole(COMPLIANCE_ROLE)
    {
        for (uint256 i; i < accounts.length; ) {
            dealWhitelist[accounts[i]] = status;
            emit WhitelistUpdated(accounts[i], status);
            unchecked { ++i; }
        }
    }

    /**
     * @notice Issue deal note tokens to a whitelisted investor.
     * @dev    USDC subscription is collected off-chain (Reg D 506c);
     *         this function distributes tokens after funds are received.
     */
    function issueDealNote(
        uint256 tokenId,
        address investor,
        uint256 amount
    ) external onlyRole(MANAGER_ROLE) whenNotPaused {
        if (tokenId < DEAL_NOTE_START || tokenId > DEAL_NOTE_END) revert InvalidTokenId();
        if (!dealWhitelist[investor]) revert NotWhitelisted(investor);
        if (amount == 0)              revert ZeroAmount();

        DealNote storage note = dealNotes[tokenId];
        if (note.matured)                                    revert AlreadyMatured();
        if (totalSupply(tokenId) + amount > note.maxSupply)  revert ExceedsMaxSupply();

        _mint(investor, tokenId, amount, "");
        emit DealNoteIssued(tokenId, investor, amount, amount * note.faceValueUSDC);
    }

    /**
     * @notice Manager deposits USDC repayment after the property sale closes.
     *         Required amount = totalSupply(tokenId) * repaymentUSDC
     */
    function depositRepayment(uint256 tokenId, uint256 usdcAmount)
        external
        onlyRole(MANAGER_ROLE)
        nonReentrant
    {
        if (tokenId < DEAL_NOTE_START || tokenId > DEAL_NOTE_END) revert InvalidTokenId();
        if (usdcAmount == 0) revert ZeroAmount();

        DealNote storage note = dealNotes[tokenId];
        if (note.matured) revert AlreadyMatured();

        usdc.safeTransferFrom(msg.sender, address(this), usdcAmount);
        note.totalRepaymentDeposited += usdcAmount;
        note.fundsDeposited           = true;
        note.matured                  = true;

        emit DealRepaymentDeposited(tokenId, usdcAmount);
        emit DealNoteMatured(tokenId, block.timestamp);
    }

    /**
     * @notice Investor redeems matured deal note tokens for USDC (principal + yield).
     *         Tokens are burned on redemption — clean on-chain lifecycle.
     */
    function redeemDealNote(uint256 tokenId, uint256 amount)
        external
        nonReentrant
        whenNotPaused
    {
        if (tokenId < DEAL_NOTE_START || tokenId > DEAL_NOTE_END) revert InvalidTokenId();
        if (amount == 0) revert ZeroAmount();

        DealNote storage note = dealNotes[tokenId];
        if (!note.matured)                           revert NotMatured();
        if (!dealWhitelist[msg.sender])              revert NotWhitelisted(msg.sender);
        if (balanceOf(msg.sender, tokenId) < amount) revert InsufficientFunds();

        uint256 payout = amount * note.repaymentUSDC;
        if (usdc.balanceOf(address(this)) < payout)  revert InsufficientFunds();

        _burn(msg.sender, tokenId, amount);
        usdc.safeTransfer(msg.sender, payout);
        emit DealNoteRedeemed(tokenId, msg.sender, amount, payout);
    }

    // ─── Tier 1 Views ─────────────────────────────────────────────────────────

    /// @notice Annualized implied yield in basis points (0 after maturity).
    function dealNoteYieldBps(uint256 tokenId) external view returns (uint256) {
        DealNote storage note = dealNotes[tokenId];
        if (note.matured || block.timestamp >= note.maturityDate) return 0;
        uint256 gain        = note.repaymentUSDC - note.faceValueUSDC;
        uint256 termSeconds = note.maturityDate - block.timestamp;
        return (gain * 10_000 * 365 days) / (note.faceValueUSDC * termSeconds);
    }

    /// @notice Total USDC owed to all current token holders.
    function dealNoteRepaymentRequired(uint256 tokenId) external view returns (uint256) {
        return totalSupply(tokenId) * dealNotes[tokenId].repaymentUSDC;
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // TIER 2 — PRODUCT NFT OPERATIONS
    // ═══════════════════════════════════════════════════════════════════════════

    /**
     * @notice Update product NFT metadata (before or between drops).
     */
    function updateProductNFT(
        uint256 tokenId,
        string calldata name,
        string calldata sku,
        uint256 maxSupply,
        uint256 priceUSDCents,
        bool active
    ) external onlyRole(DEFAULT_ADMIN_ROLE) {
        if (tokenId < PRODUCT_NFT_START || tokenId > PRODUCT_NFT_END) revert InvalidTokenId();
        productNFTs[tokenId] = ProductNFT(name, sku, maxSupply, priceUSDCents, active);
    }

    /**
     * @notice Mint a product NFT to a buyer (called by n8n / Shopify automation).
     */
    function mintProductNFT(address buyer, uint256 tokenId)
        external
        onlyRole(MINTER_ROLE)
        whenNotPaused
    {
        if (tokenId < PRODUCT_NFT_START || tokenId > PRODUCT_NFT_END) revert InvalidTokenId();
        ProductNFT storage p = productNFTs[tokenId];
        if (!p.active)                          revert DropNotActive();
        if (totalSupply(tokenId) >= p.maxSupply) revert ExceedsMaxSupply();

        _mint(buyer, tokenId, 1, "");
        emit ProductNFTMinted(tokenId, buyer, p.sku);
    }

    function setRoyalty(address recipient, uint256 bps)
        external
        onlyRole(DEFAULT_ADMIN_ROLE)
    {
        if (recipient == address(0)) revert InvalidAddress();
        royaltyRecipient = recipient;
        royaltyBps       = bps;
        emit RoyaltyUpdated(recipient, bps);
    }

    /// @notice ERC-2981 royalty info — called by marketplaces on every sale.
    function royaltyInfo(uint256 /*tokenId*/, uint256 salePrice)
        external
        view
        returns (address receiver, uint256 royaltyAmount)
    {
        return (royaltyRecipient, (salePrice * royaltyBps) / 10_000);
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // TIER 3 — SPREAD BADGE OPERATIONS
    // ═══════════════════════════════════════════════════════════════════════════

    /**
     * @notice Mint spread badges to a recipient.
     *         SHTX accrual is tracked off-chain (or via Sequence Indexer events)
     *         and dispensed via SHTXUtilityToken.mintReward().
     */
    function mintBadge(address recipient, uint256 tokenId, uint256 amount)
        external
        onlyRole(MINTER_ROLE)
        whenNotPaused
    {
        if (tokenId < BADGE_START || tokenId > BADGE_END) revert InvalidTokenId();
        BadgeTier storage tier = badgeTiers[tokenId];
        if (totalSupply(tokenId) + amount > tier.maxSupply) revert ExceedsMaxSupply();

        _mint(recipient, tokenId, amount, "");
        emit BadgeMinted(tokenId, recipient, amount);
    }

    /**
     * @notice Update badge tier parameters (e.g. adjust SHTX accrual rate).
     */
    function updateBadgeTier(
        uint256 tokenId,
        string calldata name,
        uint256 shtxPerDay,
        uint256 transferCooldown,
        uint256 maxSupply
    ) external onlyRole(DEFAULT_ADMIN_ROLE) {
        if (tokenId < BADGE_START || tokenId > BADGE_END) revert InvalidTokenId();
        badgeTiers[tokenId] = BadgeTier(name, shtxPerDay, transferCooldown, maxSupply);
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // TRANSFER HOOK — compliance + cooldown enforcement
    // ═══════════════════════════════════════════════════════════════════════════

    function _beforeTokenTransfer(
        address operator,
        address from,
        address to,
        uint256[] memory ids,
        uint256[] memory amounts,
        bytes memory data
    ) internal override(ERC1155, ERC1155Supply) whenNotPaused {
        super._beforeTokenTransfer(operator, from, to, ids, amounts, data);

        bool isMint = from == address(0);
        bool isBurn = to   == address(0);

        for (uint256 i; i < ids.length; ) {
            uint256 id = ids[i];

            // Tier 1: whitelist-restricted transfers (Reg D 506c)
            if (id >= DEAL_NOTE_START && id <= DEAL_NOTE_END) {
                if (!isMint && !isBurn) {
                    if (!dealWhitelist[from]) revert NotWhitelisted(from);
                    if (!dealWhitelist[to])   revert NotWhitelisted(to);
                }
            }

            // Tier 3: transfer cooldown anti-wash-trading
            if (id >= BADGE_START && id <= BADGE_END) {
                if (!isMint && !isBurn) {
                    uint256 cooldown  = badgeTiers[id].transferCooldown;
                    uint256 unlockAt  = lastTransferTime[id][from] + cooldown;
                    if (block.timestamp < unlockAt) revert CooldownActive(unlockAt);
                    lastTransferTime[id][to] = block.timestamp;
                }
                if (isMint) {
                    lastTransferTime[id][to] = block.timestamp;
                }
            }

            unchecked { ++i; }
        }
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // URI + ADMIN
    // ═══════════════════════════════════════════════════════════════════════════

    function setTokenURI(uint256 tokenId, string calldata tokenURI_)
        external
        onlyRole(DEFAULT_ADMIN_ROLE)
    {
        _tokenURIs[tokenId] = tokenURI_;
        emit URI(tokenURI_, tokenId);
    }

    function uri(uint256 tokenId) public view override returns (string memory) {
        string memory tokenURI_ = _tokenURIs[tokenId];
        if (bytes(tokenURI_).length > 0) return tokenURI_;
        return super.uri(tokenId);
    }

    function pause()   external onlyRole(PAUSER_ROLE) { _pause(); }
    function unpause() external onlyRole(PAUSER_ROLE) { _unpause(); }

    function supportsInterface(bytes4 interfaceId)
        public view override(ERC1155, AccessControl) returns (bool)
    {
        // 0x2a55205a = ERC-2981
        return interfaceId == 0x2a55205a || super.supportsInterface(interfaceId);
    }
}
