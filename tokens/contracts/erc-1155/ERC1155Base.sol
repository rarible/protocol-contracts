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
            _burnExisted(account, id, value);
        } else {
            _burnLazy(account, id, value);
        }
    }

    function _burnLazy(address account, uint256 id, uint256 value) internal {
        require(account == _msgSender(), "ERC1155: caller is not burner");
        address minter = address(id >> 96);
        require(minter == _msgSender(), "ERC1155: caller is not token owner");
        ERC1155Lazy._setBurned(id, value);
    }

    function _burnExisted(address account, uint256 id, uint256 value) internal {
        address owner = address(id >> 96);
        if (owner == _msgSender()) {
            uint256 balance = ERC1155Lazy._getSupply(id) - ERC1155Lazy._getMinted(id);
            uint256 burnLazy = value;
            uint256 burnMinted = 0;
            if (value > balance){
                burnLazy = balance;
                burnMinted = value - burnLazy;
            }
            _burnLazy(account, id, burnLazy);
            if (burnMinted > 0) {
                ERC1155BurnableUpgradeable.burn(account, id, burnMinted);
            }
        } else {
            ERC1155BurnableUpgradeable.burn(account, id, value);
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
                _burnExisted(account, ids[i], amounts[i]);
            } else {
                _burnLazy(account, ids[i], amounts[i]);
            }
        }
        emit TransferBatch(operator, account, address(0), ids, amounts);
    }

    uint256[50] private __gap;
}
