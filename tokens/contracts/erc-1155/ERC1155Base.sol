// SPDX-License-Identifier: MIT

pragma solidity 0.7.6;
pragma abicoder v2;

import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
import "./ERC1155BurnableUpgradeable.sol";
import "./ERC1155DefaultApproval.sol";
import "./ERC1155Lazy.sol";
import "../HasContractURI.sol";
import "../access/MintControl.sol";

abstract contract ERC1155Base is OwnableUpgradeable, ERC1155DefaultApproval, ERC1155BurnableUpgradeable, ERC1155Lazy, HasContractURI, MintControl {

    string public name;
    string public symbol;

    function setDefaultApproval(address operator, bool hasApproval) external onlyOwner {
        _setDefaultApproval(operator, hasApproval);
    }

    function isApprovedForAll(address _owner, address _operator) public override(ERC1155Upgradeable, ERC1155DefaultApproval, IERC1155Upgradeable) view returns (bool) {
        return ERC1155DefaultApproval.isApprovedForAll(_owner, _operator);
    }

    function _mint(address account, uint256 id, uint256 amount, bytes memory data) internal virtual override(ERC1155Upgradeable, ERC1155Lazy) {
        ERC1155Lazy._mint(account, id, amount, data);
    }

    function __ERC1155Base_init_unchained(string memory _name, string memory _symbol) internal initializer {
        name = _name;
        symbol = _symbol;
    }

    function uri(uint id) external view override(ERC1155BaseURI, ERC1155Upgradeable) virtual returns (string memory) {
        return _tokenURI(id);
    }

    function supportsInterface(bytes4 interfaceId) public view virtual override(ERC1155Lazy, ERC165Upgradeable) returns (bool) {
        return super.supportsInterface(interfaceId);
    }

    function mintAndTransfer(LibERC1155LazyMint.Mint1155Data memory data, address to, uint256 _amount) public override validateMinter {
        super.mintAndTransfer(data, to, _amount);
    }

    uint256[50] private __gap;
}
