// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";

/**
 * @title STDealTrackRecord
 * @notice ERC-721 Soulbound NFT — one per closed Missouri deal
 *         Implements ERC-5192 minimal soulbound interface
 *
 * Each NFT contains:
 *   - Property address and county
 *   - Deal type (wholesale/fix-and-flip/land)
 *   - Purchase price, ARV, net profit
 *   - Timeline (contract to close in days)
 *   - Investor return (if deal note was used)
 *   - IPFS link to closing documents
 *   - Signed by title company wallet (optional verifier)
 *
 * Soulbound: cannot be transferred after minting.
 * The track record is permanently attached to the manager's wallet.
 * Institutional investors verify on-chain — no PDF needed.
 *
 * ERC-5192: locked() returns true for all tokens
 */
contract STDealTrackRecord is ERC721, ERC721URIStorage, AccessControl {
    bytes32 public constant MINTER_ROLE   = keccak256("MINTER_ROLE");
    bytes32 public constant VERIFIER_ROLE = keccak256("VERIFIER_ROLE");

    uint256 private _tokenIdCounter;

    // ERC-5192 event
    event Locked(uint256 tokenId);

    // Deal record stored on-chain for direct querying
    struct DealRecord {
        string  dealId;           // e.g. "ST-DEAL-008"
        string  propertyAddress;  // "142 Ridgewood Dr, De Soto, MO 63020"
        string  county;           // "Jefferson"
        string  dealType;         // "fix-and-flip" | "wholesale" | "land"
        uint256 purchasePriceUSD; // in USD cents
        uint256 arvUSD;           // After Repair Value in USD cents
        uint256 netProfitUSD;     // net profit in USD cents
        uint256 daysToClose;      // contract date to closing
        uint256 investorReturnBps;// basis points returned to note holders (0 if no note)
        uint256 closedAt;         // block timestamp
        bool    verifiedByTitle;  // title company countersigned
        string  ipfsDocHash;      // IPFS CID of closing package
    }

    mapping(uint256 => DealRecord) public dealRecords;
    mapping(uint256 => bool)       public verified;

    // Aggregate stats (updated on each mint)
    uint256 public totalDeals;
    uint256 public totalProfitUSD;  // cents
    uint256 public totalARVUSD;     // cents

    event DealMinted(uint256 indexed tokenId, string dealId, address recipient);
    event DealVerified(uint256 indexed tokenId, address verifier);

    error Soulbound();
    error InvalidAddress();
    error ZeroAmount();

    constructor(address admin) ERC721("ST Deal Track Record", "STTR") {
        if (admin == address(0)) revert InvalidAddress();
        _grantRole(DEFAULT_ADMIN_ROLE, admin);
        _grantRole(MINTER_ROLE,        admin);
    }

    /**
     * @notice Mint a soulbound deal record NFT to manager wallet
     * @dev Called after every successful deal close
     */
    function mintDealRecord(
        address recipient,
        string calldata tokenURI_,
        DealRecord calldata record
    ) external onlyRole(MINTER_ROLE) returns (uint256 tokenId) {
        if (recipient == address(0)) revert InvalidAddress();

        tokenId = _tokenIdCounter;
        _tokenIdCounter++;

        _safeMint(recipient, tokenId);
        _setTokenURI(tokenId, tokenURI_);
        dealRecords[tokenId] = record;

        // Update aggregates
        totalDeals++;
        totalProfitUSD += record.netProfitUSD;
        totalARVUSD    += record.arvUSD;

        emit DealMinted(tokenId, record.dealId, recipient);
        emit Locked(tokenId); // ERC-5192
    }

    /**
     * @notice Title company or attorney verifies the deal record
     */
    function verifyDeal(uint256 tokenId) external onlyRole(VERIFIER_ROLE) {
        dealRecords[tokenId].verifiedByTitle = true;
        verified[tokenId] = true;
        emit DealVerified(tokenId, msg.sender);
    }

    // ─── ERC-5192 Soulbound ───────────────────────────────────────────────────

    /// @notice All tokens are permanently locked (soulbound)
    function locked(uint256 /*tokenId*/) external pure returns (bool) {
        return true;
    }

    /// @dev Block all transfers — soulbound
    function _beforeTokenTransfer(
        address from,
        address to,
        uint256 tokenId,
        uint256 batchSize
    ) internal override {
        // Allow mint (from == 0) only
        if (from != address(0)) revert Soulbound();
        super._beforeTokenTransfer(from, to, tokenId, batchSize);
    }

    // ─── View Helpers ─────────────────────────────────────────────────────────

    function averageProfitPerDeal() external view returns (uint256) {
        if (totalDeals == 0) return 0;
        return totalProfitUSD / totalDeals;
    }

    function totalTokensMinted() external view returns (uint256) {
        return _tokenIdCounter;
    }

    // ─── Required Overrides ───────────────────────────────────────────────────

    function tokenURI(uint256 tokenId)
        public view override(ERC721, ERC721URIStorage) returns (string memory)
    {
        return super.tokenURI(tokenId);
    }

    function supportsInterface(bytes4 interfaceId)
        public view override(ERC721, ERC721URIStorage, AccessControl) returns (bool)
    {
        // ERC-5192 interface ID
        return interfaceId == 0xb45a3c0e || super.supportsInterface(interfaceId);
    }

    function _burn(uint256 tokenId) internal override(ERC721, ERC721URIStorage) {
        super._burn(tokenId);
    }
}
