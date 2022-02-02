// SPDX-License-Identifier: MIT

pragma solidity 0.7.6;
pragma abicoder v2;

import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
import "./ERC721BurnableUpgradeableMinimal.sol";
import "./ERC721DefaultApprovalMinimal.sol";
import "./ERC721LazyMinimal.sol";
import "../HasContractURI.sol";
import "../access/MinterAccessControl.sol";

abstract contract ERC721BaseMinimal is OwnableUpgradeable, ERC721DefaultApprovalMinimal, ERC721BurnableUpgradeableMinimal, ERC721LazyMinimal, HasContractURI, MinterAccessControl {

    function _isApprovedOrOwner(address spender, uint256 tokenId) internal virtual override(ERC721UpgradeableMinimal, ERC721DefaultApprovalMinimal) view returns (bool) {
        return ERC721DefaultApprovalMinimal._isApprovedOrOwner(spender, tokenId);
    }

    function isApprovedForAll(address owner, address operator) public view virtual override(ERC721DefaultApprovalMinimal, ERC721UpgradeableMinimal, IERC721Upgradeable) returns (bool) {
        return ERC721DefaultApprovalMinimal.isApprovedForAll(owner, operator);
    }

    function supportsInterface(bytes4 interfaceId) public view virtual override(ERC165Upgradeable, ERC721LazyMinimal) returns (bool) {
        return super.supportsInterface(interfaceId);
    }

    function tokenURI(uint256 tokenId) public view virtual override(ERC721UpgradeableMinimal, ERC721LazyMinimal) returns (string memory) {
        return ERC721LazyMinimal.tokenURI(tokenId);
    }

    function _clearMetadata(uint256 tokenId) internal override(ERC721UpgradeableMinimal, ERC721LazyMinimal) virtual {
        return ERC721LazyMinimal._clearMetadata(tokenId);
    }

    function _emitMintEvent(address to, uint tokenId) internal override(ERC721UpgradeableMinimal, ERC721LazyMinimal) virtual {
        return ERC721LazyMinimal._emitMintEvent(to, tokenId);
    }

    // changed from 50 to 40 from adding inheritance MinterAccessControl, 1 variable + 9 gap there
    uint256[40] private __gap;
}
