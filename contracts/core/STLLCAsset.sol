// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721Royalty.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/Strings.sol";

/// @title STLLCAsset
/// @notice Minimal production-style ERC-721 for Sequence Builder custom contract upload.
/// @dev Fits the stllcweb3 model: one token = one unique asset record.
contract STLLCAsset is ERC721URIStorage, ERC721Royalty, Ownable {
    using Strings for uint256;

    uint256 public nextTokenId = 1;
    string private _contractBaseURI;

    event AssetMinted(uint256 indexed tokenId, address indexed to, string tokenURI);
    event BaseURIUpdated(string newBaseURI);
    event DefaultRoyaltyUpdated(address indexed receiver, uint96 feeNumerator);

    constructor(
        string memory name_,
        string memory symbol_,
        address initialOwner,
        address royaltyReceiver,
        uint96 royaltyFeeNumerator,
        string memory contractBaseURI_
    ) ERC721(name_, symbol_) {
        require(initialOwner != address(0), "owner=0");
        _transferOwnership(initialOwner);
        _setDefaultRoyalty(royaltyReceiver, royaltyFeeNumerator);
        _contractBaseURI = contractBaseURI_;
    }

    function mintAsset(address to, string calldata metadataURI) external onlyOwner returns (uint256 tokenId) {
        require(to != address(0), "to=0");
        tokenId = nextTokenId++;
        _safeMint(to, tokenId);
        _setTokenURI(tokenId, metadataURI);
        emit AssetMinted(tokenId, to, metadataURI);
    }

    function batchMintAssets(address to, string[] calldata metadataURIs) external onlyOwner returns (uint256[] memory tokenIds) {
        require(to != address(0), "to=0");
        uint256 length = metadataURIs.length;
        require(length > 0, "empty");

        tokenIds = new uint256[](length);
        for (uint256 i = 0; i < length; i++) {
            uint256 tokenId = nextTokenId++;
            _safeMint(to, tokenId);
            _setTokenURI(tokenId, metadataURIs[i]);
            tokenIds[i] = tokenId;
            emit AssetMinted(tokenId, to, metadataURIs[i]);
        }
    }

    function setDefaultRoyalty(address receiver, uint96 feeNumerator) external onlyOwner {
        _setDefaultRoyalty(receiver, feeNumerator);
        emit DefaultRoyaltyUpdated(receiver, feeNumerator);
    }

    function deleteDefaultRoyalty() external onlyOwner {
        _deleteDefaultRoyalty();
        emit DefaultRoyaltyUpdated(address(0), 0);
    }

    function setContractBaseURI(string calldata newBaseURI) external onlyOwner {
        _contractBaseURI = newBaseURI;
        emit BaseURIUpdated(newBaseURI);
    }

    function contractURI() external view returns (string memory) {
        return _contractBaseURI;
    }

    function supportsInterface(bytes4 interfaceId)
        public
        view
        override(ERC721URIStorage, ERC721Royalty)
        returns (bool)
    {
        return super.supportsInterface(interfaceId);
    }

    function tokenURI(uint256 tokenId)
        public
        view
        override(ERC721URIStorage, ERC721)
        returns (string memory)
    {
        return super.tokenURI(tokenId);
    }

    function _burn(uint256 tokenId)
        internal
        override(ERC721URIStorage, ERC721Royalty)
    {
        super._burn(tokenId);
    }
}
