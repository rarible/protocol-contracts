// SPDX-License-Identifier: MIT

pragma solidity 0.7.6;
pragma abicoder v2;

import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
import "./ERC1155BurnableUpgradeable.sol";
import "./ERC1155DefaultApproval.sol";
import "./ERC1155Lazy.sol";
import "../HasContractURI.sol";

abstract contract ERC1155Base is OwnableUpgradeable, ERC1155DefaultApproval, ERC1155BurnableUpgradeable, ERC1155Lazy, HasContractURI {

    string public name;
    string public symbol;

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

    function burn(address account, uint256 id, uint256 value) public virtual override {
        address creator = address(id >> 96);
        if (creator == _msgSender() && _isNotExist(id)) {
            //token not exists, burn Lazy by creator only
            ERC1155Lazy._setBurned(id, value);
            return;
        }
        uint256 burnMinted = value;
        if (creator == _msgSender()) {
            //calculate Lazy value available for burn
            uint256 balanceLazy = ERC1155Lazy._getSupply(id) - ERC1155Lazy._getMinted(id);
            uint256 burnLazy = value;
            burnMinted = 0;
            if (value > balanceLazy) {//need to burn more than available
                burnLazy = balanceLazy;
                burnMinted = value - burnLazy;
            }
            //token exists, burn Lazy by creator only
            ERC1155Lazy._setBurned(id, burnLazy);
        }
        if (burnMinted > 0) {
            //token exists, burn Minted
            ERC1155BurnableUpgradeable.burn(account, id, burnMinted);
        }
    }

    function burnBatch(address account, uint256[] memory ids, uint256[] memory amounts) public virtual override {
        require(account != address(0), "ERC1155: burn from the zero address");
        require(ids.length == amounts.length, "ERC1155: ids and amounts length mismatch");
        require(
            account == _msgSender() || isApprovedForAll(account, _msgSender()),
            "ERC1155: caller is not owner nor approved"
        );
        address operator = _msgSender();

        _beforeTokenTransfer(operator, account, address(0), ids, amounts, "");

        for (uint i = 0; i < ids.length; i++) {
            burn(account, ids[i], amounts[i]);
        }
        emit TransferBatch(operator, account, address(0), ids, amounts);
    }

    uint256[50] private __gap;
}
