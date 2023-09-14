// SPDX-License-Identifier: MIT

pragma solidity 0.7.6;
pragma abicoder v2;

import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
import "./ERC721BurnableUpgradeable.sol";
import "./ERC721DefaultApproval.sol";
import "./ERC721Lazy.sol";
import "../HasContractURI.sol";

import "../operator-filter-registry/OperatorFiltererUpgradeable.sol";

abstract contract ERC721Base is OwnableUpgradeable, ERC721DefaultApproval, ERC721BurnableUpgradeable, ERC721Lazy, HasContractURI, OperatorFiltererUpgradeable {

    event BaseUriChanged(string newBaseURI);

    function _isApprovedOrOwner(address spender, uint256 tokenId) internal virtual override(ERC721Upgradeable, ERC721DefaultApproval) view returns (bool) {
        return ERC721DefaultApproval._isApprovedOrOwner(spender, tokenId);
    }

    function isApprovedForAll(address owner, address operator) public view virtual override(ERC721DefaultApproval, ERC721Upgradeable, IERC721Upgradeable) returns (bool) {
        return ERC721DefaultApproval.isApprovedForAll(owner, operator);
    }

    function supportsInterface(bytes4 interfaceId) public view virtual override(ERC165Upgradeable, ERC721Lazy) returns (bool) {
        return super.supportsInterface(interfaceId);
    }

    function _mint(address to, uint256 tokenId) internal override(ERC721Lazy, ERC721Upgradeable) {
        super._mint(to, tokenId);
    }

    function setBaseURI(string memory newBaseURI) external onlyOwner {
        super._setBaseURI(newBaseURI);

        emit BaseUriChanged(newBaseURI);
    }

    /**
     * @dev See {IERC721-setApprovalForAll}.
     *      Added modifier ensures that the operator is allowed by the OperatorFilterRegistry.
     */
    function setApprovalForAll(address operator, bool approved) public override(ERC721Upgradeable, IERC721Upgradeable) onlyAllowedOperatorApproval(operator) {
        super.setApprovalForAll(operator, approved);
    }

    /**
     * @dev See {IERC721-approve}.
     *      Added modifier ensures that the operator is allowed by the OperatorFilterRegistry.
     */
    function approve(address operator, uint256 tokenId) public override(ERC721Upgradeable, IERC721Upgradeable) onlyAllowedOperatorApproval(operator) {
        super.approve(operator, tokenId);
    }

    /**
     * @dev See {IERC721-transferFrom}.
     *      Added modifier ensures that the operator is allowed by the OperatorFilterRegistry.
     */
    function transferFrom(address from, address to, uint256 tokenId) public override(ERC721Upgradeable, IERC721Upgradeable) onlyAllowedOperator(from) {
        super.transferFrom(from, to, tokenId);
    }

    /**
     * @dev See {IERC721-safeTransferFrom}.
     *      Added modifier ensures that the operator is allowed by the OperatorFilterRegistry.
     */
    function safeTransferFrom(address from, address to, uint256 tokenId) public override(ERC721Upgradeable, IERC721Upgradeable) onlyAllowedOperator(from) {
        super.safeTransferFrom(from, to, tokenId);
    }

    /**
     * @dev See {IERC721-safeTransferFrom}.
     *      Added modifier ensures that the operator is allowed by the OperatorFilterRegistry.
     */
    function safeTransferFrom(address from, address to, uint256 tokenId, bytes memory data)
        public
        override(ERC721Upgradeable, IERC721Upgradeable)
        onlyAllowedOperator(from)
    {
        super.safeTransferFrom(from, to, tokenId, data);
    }

    uint256[50] private __gap;
}
