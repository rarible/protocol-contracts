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

    function burn(address account, uint256 id, uint256 value) public virtual override {
        if (_isExist(id)) {
//            ERC1155BurnableUpgradeable.burn(account, id, value);
            burnExisted(account, id, value);
        } else {
//            require(account == _msgSender(), "ERC1155: caller is not burner");
//            address minter = address(id >> 96);
//            require(minter == _msgSender(), "ERC1155: caller is not token owner");
//            ERC1155Lazy._setBurned(id, value);
            burnNotExisted(account, id, value);
        }
    }

    function burnNotExisted(address account, uint256 id, uint256 value) internal {
        require(account == _msgSender(), "ERC1155: caller is not burner");
        address minter = address(id >> 96);
        require(minter == _msgSender(), "ERC1155: caller is not token owner");
        ERC1155Lazy._setBurned(id, value);
    }

    function burnExisted(address account, uint256 id, uint256 value) internal {
        uint256 balance = balanceOf(account, id);
        uint256 burnAmount = value;
        uint256 burnMore = value;
        if (value > balance){
            burnAmount = balance;
            burnMore = value - burnAmount;
        }
        ERC1155BurnableUpgradeable.burn(account, id, burnAmount);
        if (burnMore > 0) {
//todo            require(_getSupply[id] - _getMinted[id] >= burnMore, "Try to burn more available");
//            burnNotExisted(account, id, burnAmount);
            ERC1155Lazy._setBurned(id, value);
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
            if (_isExist(ids[i])) {
                ERC1155Upgradeable._subBalance(account, ids[i], amounts[i]);
            } else {
                address minter = address(ids[i] >> 96);
                require(minter == _msgSender(), "ERC1155: caller is not token owner");
                ERC1155Lazy._setBurned(ids[i], amounts[i]);
            }
        }
        emit TransferBatch(operator, account, address(0), ids, amounts);
    }

    uint256[50] private __gap;
}
