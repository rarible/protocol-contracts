// SPDX-License-Identifier: MIT
pragma solidity ^0.8.30;
import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
import "./ERC721BurnableUpgradeableMinimal.sol";
import "./ERC721DefaultApprovalMinimal.sol";
import "./ERC721LazyMinimal.sol";
import "../HasContractURI.sol";
import "./ERC721UpgradeableMinimal.sol";
abstract contract ERC721BaseMinimal is
    OwnableUpgradeable,
    ERC721DefaultApprovalMinimal,
    ERC721BurnableUpgradeableMinimal,
    ERC721LazyMinimal,
    HasContractURI
{
    event BaseUriChanged(string newBaseURI);
    function _isApprovedOrOwner(
        address spender,
        uint256 tokenId
    ) internal view virtual override(ERC721UpgradeableMinimal, ERC721DefaultApprovalMinimal) returns (bool) {
        return ERC721DefaultApprovalMinimal._isApprovedOrOwner(spender, tokenId);
    }
    function isApprovedForAll(
        address owner,
        address operator
    ) public view virtual override(ERC721DefaultApprovalMinimal, ERC721UpgradeableMinimal, IERC721) returns (bool) {
        return ERC721DefaultApprovalMinimal.isApprovedForAll(owner, operator);
    }
    function supportsInterface(
        bytes4 interfaceId
    ) public view virtual override(ERC721LazyMinimal, HasContractURI, ERC721UpgradeableMinimal) returns (bool) {
        return super.supportsInterface(interfaceId);
    }
    function tokenURI(
        uint256 tokenId
    ) public view virtual override(ERC721UpgradeableMinimal, ERC721LazyMinimal) returns (string memory) {
        return ERC721LazyMinimal.tokenURI(tokenId);
    }
    function _clearMetadata(uint256 tokenId) internal virtual override(ERC721UpgradeableMinimal, ERC721LazyMinimal) {
        return ERC721LazyMinimal._clearMetadata(tokenId);
    }
    function _emitMintEvent(
        address to,
        uint tokenId
    ) internal virtual override(ERC721UpgradeableMinimal, ERC721LazyMinimal) {
        return ERC721LazyMinimal._emitMintEvent(to, tokenId);
    }
    function setBaseURI(string memory newBaseURI) external onlyOwner {
        super._setBaseURI(newBaseURI);
        emit BaseUriChanged(newBaseURI);
    }
    uint256[50] private __gap;
}