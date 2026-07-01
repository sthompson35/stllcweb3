// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/token/ERC1155/ERC1155.sol";
import "@openzeppelin/contracts/token/ERC1155/extensions/ERC1155Supply.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/security/Pausable.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";

/**
 * @title KhakiSolLoyalty
 * @notice ERC-1155 multi-token loyalty system for KhakiSol tactical gear
 *
 * Token types (ERC-1155 token IDs):
 *   ID 0: SHTX Currency Token  — fungible, 1e18 decimals (semi-fungible)
 *   ID 1: Scout Badge          — semi-fungible (multiple per holder ok)
 *   ID 2: Operator Badge       — semi-fungible
 *   ID 3: Trooper Badge        — semi-fungible
 *   ID 4: Commander Badge      — 1-of-1 per wallet (exclusive)
 *   ID 5: Founding Member      — 1-of-100, commemorative
 *   ID 6+: Product Edition NFT — 1-of-1 per limited drop
 *
 * Benefits:
 *   - All badge types in one contract (gas-efficient batch operations)
 *   - Shopify webhook → n8n → mintBadge() on purchase milestone
 *   - Batch transfer to airdrop community efficiently
 *   - ERC-2981 royalties on secondary sales of product NFTs
 *
 * Integration:
 *   - n8n workflow calls mintReward() on Shopify purchase events
 *   - Sequence Builder manages this contract via API
 */
contract KhakiSolLoyalty is
    ERC1155,
    ERC1155Supply,
    AccessControl,
    Pausable,
    ReentrancyGuard
{
    bytes32 public constant MINTER_ROLE   = keccak256("MINTER_ROLE");
    bytes32 public constant PAUSER_ROLE   = keccak256("PAUSER_ROLE");

    // Token type IDs
    uint256 public constant SHTX_CURRENCY    = 0;
    uint256 public constant SCOUT_BADGE      = 1;
    uint256 public constant OPERATOR_BADGE   = 2;
    uint256 public constant TROOPER_BADGE    = 3;
    uint256 public constant COMMANDER_BADGE  = 4;
    uint256 public constant FOUNDING_MEMBER  = 5;
    uint256 public constant PRODUCT_NFT_BASE = 6; // IDs 6+ are product drops

    uint256 public constant MAX_FOUNDING     = 100;
    uint256 public constant MAX_COMMANDER    = 1; // per wallet

    uint256 private _nextProductId = PRODUCT_NFT_BASE;

    // ERC-2981 royalty
    address public royaltyRecipient;
    uint256 public royaltyBps; // basis points e.g. 500 = 5%

    // Badge purchase thresholds (USD cents)
    mapping(uint256 => uint256) public badgeThreshold;

    // Commander badge: max 1 per wallet
    mapping(address => bool) public hasCommanderBadge;

    // Per-token URI storage for product drops
    mapping(uint256 => string) private _tokenURIs;

    // Product drop metadata
    struct ProductDrop {
        string  name;
        string  sku;
        uint256 maxSupply;
        uint256 priceUSDCents;
        bool    active;
    }
    mapping(uint256 => ProductDrop) public productDrops;

    event BadgeMinted(address indexed to, uint256 badgeType, uint256 amount);
    event ProductDropCreated(uint256 tokenId, string name, uint256 maxSupply);
    event ProductNFTMinted(address indexed to, uint256 tokenId, string sku);
    event RoyaltyUpdated(address recipient, uint256 bps);

    error ExceedsMaxSupply();
    error AlreadyHasCommanderBadge();
    error InvalidTokenId();
    error InvalidAddress();
    error ZeroAmount();
    error DropNotActive();

    constructor(address admin, string memory baseURI) ERC1155(baseURI) {
        if (admin == address(0)) revert InvalidAddress();

        _grantRole(DEFAULT_ADMIN_ROLE, admin);
        _grantRole(MINTER_ROLE,        admin);
        _grantRole(PAUSER_ROLE,        admin);

        royaltyRecipient = admin;
        royaltyBps       = 500; // 5% on secondary sales

        // Set badge unlock thresholds (USD cents)
        badgeThreshold[SCOUT_BADGE]     = 4999;  // $49.99 first purchase
        badgeThreshold[OPERATOR_BADGE]  = 19999; // $200 cumulative
        badgeThreshold[TROOPER_BADGE]   = 49999; // $500 cumulative
        badgeThreshold[COMMANDER_BADGE] = 99999; // $1,000 cumulative
    }

    // ─── Loyalty Minting ─────────────────────────────────────────────────────

    /**
     * @notice Mint SHTX currency tokens for a KhakiSol purchase
     * @dev Called by n8n automation on Shopify order webhook
     */
    function mintSHTX(address customer, uint256 shtxAmount)
        external
        onlyRole(MINTER_ROLE)
        whenNotPaused
    {
        if (customer == address(0)) revert InvalidAddress();
        if (shtxAmount == 0) revert ZeroAmount();
        _mint(customer, SHTX_CURRENCY, shtxAmount, "");
        emit BadgeMinted(customer, SHTX_CURRENCY, shtxAmount);
    }

    /**
     * @notice Mint a loyalty badge based on purchase milestone
     * @param customer   Buyer wallet
     * @param badgeType  SCOUT_BADGE | OPERATOR_BADGE | TROOPER_BADGE | COMMANDER_BADGE
     */
    function mintBadge(address customer, uint256 badgeType)
        external
        onlyRole(MINTER_ROLE)
        whenNotPaused
    {
        if (customer == address(0)) revert InvalidAddress();
        if (badgeType < SCOUT_BADGE || badgeType > COMMANDER_BADGE) revert InvalidTokenId();

        if (badgeType == COMMANDER_BADGE) {
            if (hasCommanderBadge[customer]) revert AlreadyHasCommanderBadge();
            hasCommanderBadge[customer] = true;
        }

        _mint(customer, badgeType, 1, "");
        emit BadgeMinted(customer, badgeType, 1);
    }

    /**
     * @notice Batch mint for efficient airdrop campaigns
     */
    function batchMintBadges(
        address[] calldata customers,
        uint256   badgeType,
        uint256   amount
    ) external onlyRole(MINTER_ROLE) whenNotPaused {
        for (uint256 i = 0; i < customers.length; ) {
            _mint(customers[i], badgeType, amount, "");
            emit BadgeMinted(customers[i], badgeType, amount);
            unchecked { ++i; }
        }
    }

    // ─── Product NFT Drops ────────────────────────────────────────────────────

    /**
     * @notice Register a new limited product drop (limited colorway, custom build, etc.)
     */
    function createProductDrop(
        string calldata name,
        string calldata sku,
        uint256 maxSupply,
        uint256 priceUSDCents,
        string calldata tokenURI_
    ) external onlyRole(DEFAULT_ADMIN_ROLE) returns (uint256 tokenId) {
        tokenId = _nextProductId++;
        productDrops[tokenId] = ProductDrop({
            name:          name,
            sku:           sku,
            maxSupply:     maxSupply,
            priceUSDCents: priceUSDCents,
            active:        true
        });
        _setURI(tokenId, tokenURI_);
        emit ProductDropCreated(tokenId, name, maxSupply);
    }

    /**
     * @notice Mint a product NFT to buyer after Shopify order confirmed
     */
    function mintProductNFT(address buyer, uint256 tokenId)
        external
        onlyRole(MINTER_ROLE)
        whenNotPaused
    {
        ProductDrop storage drop = productDrops[tokenId];
        if (!drop.active) revert DropNotActive();
        if (totalSupply(tokenId) >= drop.maxSupply) revert ExceedsMaxSupply();

        _mint(buyer, tokenId, 1, "");
        emit ProductNFTMinted(buyer, tokenId, drop.sku);
    }

    // ─── Founding Member ─────────────────────────────────────────────────────

    function mintFoundingMember(address recipient)
        external
        onlyRole(MINTER_ROLE)
        whenNotPaused
    {
        if (totalSupply(FOUNDING_MEMBER) >= MAX_FOUNDING) revert ExceedsMaxSupply();
        _mint(recipient, FOUNDING_MEMBER, 1, "");
        emit BadgeMinted(recipient, FOUNDING_MEMBER, 1);
    }

    // ─── ERC-2981 Royalty ─────────────────────────────────────────────────────

    function royaltyInfo(uint256 /*tokenId*/, uint256 salePrice)
        external
        view
        returns (address receiver, uint256 royaltyAmount)
    {
        return (royaltyRecipient, (salePrice * royaltyBps) / 10_000);
    }

    function setRoyalty(address recipient, uint256 bps)
        external
        onlyRole(DEFAULT_ADMIN_ROLE)
    {
        royaltyRecipient = recipient;
        royaltyBps       = bps;
        emit RoyaltyUpdated(recipient, bps);
    }

    // ─── Required Overrides ───────────────────────────────────────────────────

    function _beforeTokenTransfer(
        address operator,
        address from,
        address to,
        uint256[] memory ids,
        uint256[] memory amounts,
        bytes memory data
    ) internal override(ERC1155, ERC1155Supply) whenNotPaused {
        super._beforeTokenTransfer(operator, from, to, ids, amounts, data);
    }

    function supportsInterface(bytes4 interfaceId)
        public view override(ERC1155, AccessControl) returns (bool)
    {
        return interfaceId == 0x2a55205a || super.supportsInterface(interfaceId); // ERC-2981
    }

    function pause() external onlyRole(PAUSER_ROLE) { _pause(); }
    function unpause() external onlyRole(PAUSER_ROLE) { _unpause(); }

    function _setURI(uint256 tokenId, string memory tokenURI_) internal {
        _tokenURIs[tokenId] = tokenURI_;
        emit URI(tokenURI_, tokenId);
    }

    function uri(uint256 tokenId) public view override returns (string memory) {
        string memory tokenURI_ = _tokenURIs[tokenId];
        if (bytes(tokenURI_).length > 0) return tokenURI_;
        return super.uri(tokenId);
    }
}
