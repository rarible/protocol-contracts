// SPDX-License-Identifier: MIT

pragma solidity 0.7.6;
pragma abicoder v2;

import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
import "./ERC721BurnableUpgradeableMinimal.sol";
import "./ERC721DefaultApprovalMinimal.sol";
import "./ERC721LazyMinimal.sol";
import "../HasContractURI.sol";

import "../operator-filter-registry/OperatorFiltererUpgradeable.sol";

abstract contract ERC721BaseMinimal is OwnableUpgradeable, ERC721DefaultApprovalMinimal, ERC721BurnableUpgradeableMinimal, ERC721LazyMinimal, HasContractURI, OperatorFiltererUpgradeable {
    event BaseUriChanged(string newBaseURI);

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

    function setBaseURI(string memory newBaseURI) external onlyOwner {
        super._setBaseURI(newBaseURI);

        emit BaseUriChanged(newBaseURI);
    }

    /**
     * @dev See {IERC721-setApprovalForAll}.
     *      Added modifier ensures that the operator is allowed by the OperatorFilterRegistry.
     */
    function setApprovalForAll(address operator, bool approved) public override(ERC721UpgradeableMinimal, IERC721Upgradeable) onlyAllowedOperatorApproval(operator) {
        super.setApprovalForAll(operator, approved);
    }

    /**
     * @dev See {IERC721-approve}.
     *      Added modifier ensures that the operator is allowed by the OperatorFilterRegistry.
     */
    function approve(address operator, uint256 tokenId) public override(ERC721UpgradeableMinimal, IERC721Upgradeable) onlyAllowedOperatorApproval(operator) {
        super.approve(operator, tokenId);
    }

    /**
     * @dev See {IERC721-transferFrom}.
     *      Added modifier ensures that the operator is allowed by the OperatorFilterRegistry.
     */
    function transferFrom(address from, address to, uint256 tokenId) public override(ERC721UpgradeableMinimal, IERC721Upgradeable) onlyAllowedOperator(from) {
        super.transferFrom(from, to, tokenId);
    }

    /**
     * @dev See {IERC721-safeTransferFrom}.
     *      Added modifier ensures that the operator is allowed by the OperatorFilterRegistry.
     */
    function safeTransferFrom(address from, address to, uint256 tokenId) public override(ERC721UpgradeableMinimal, IERC721Upgradeable) onlyAllowedOperator(from) {
        super.safeTransferFrom(from, to, tokenId);
    }

    /**
     * @dev See {IERC721-safeTransferFrom}.
     *      Added modifier ensures that the operator is allowed by the OperatorFilterRegistry.
     */
    function safeTransferFrom(address from, address to, uint256 tokenId, bytes memory data)
        public
        override(ERC721UpgradeableMinimal, IERC721Upgradeable)
        onlyAllowedOperator(from)
    {
        super.safeTransferFrom(from, to, tokenId, data);
    }

    uint256[50] private __gap;
}
