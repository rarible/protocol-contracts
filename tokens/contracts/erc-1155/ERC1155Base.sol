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

    function supportsInterface(bytes4 interfaceId) public view virtual override(ERC1155Lazy, ERC165Upgradeable) returns (bool) {
        return super.supportsInterface(interfaceId);
    }

    function burnBatch(address account, uint256[] memory ids, uint256[] memory amounts) public virtual override {
        require(ids.length == amounts.length, "ERC1155: ids and amounts length mismatch");
        address operator = _msgSender();

        _beforeTokenTransfer(operator, account, address(0), ids, amounts, "");
        uint256 leftToBurn;
        for (uint i = 0; i < ids.length; i++) {
            leftToBurn = _burnLazy(ids[i], amounts[i]);
            if (leftToBurn > 0) {
                //token exists, burn Minted
                ERC1155BurnableUpgradeable.pureBurn(account, ids[i], leftToBurn);
            }
        }
        emit TransferBatch(operator, account, address(0), ids, amounts);
    }

    function burn(address account, uint256 id, uint256 amount) public virtual override {
        uint256 leftToBurn = _burnLazy(id, amount);
        if (leftToBurn > 0) {
            //token exists, burn Minted
            ERC1155BurnableUpgradeable.pureBurn(account, id, leftToBurn);
        }
        emit TransferSingle(_msgSender(), account, address(0), id, amount);
    }

    function _burnLazy(uint256 id, uint256 amount) internal returns (uint256 leftToBurn) {
        leftToBurn = amount;
        address creator = address(id >> 96);
        if (creator == _msgSender()) {
            uint256 lazyToBurn = amount;
            uint supply = ERC1155Lazy._getSupply(id);
            if (supply != 0) {
                //calculate Lazy amount available for burn
                uint256 lazyBalance = supply - ERC1155Lazy._getMinted(id);
                if (amount > lazyBalance) {//need to burn more than available
                    lazyToBurn = lazyBalance;
                }
            }
            ERC1155Lazy._addMinted(id, lazyToBurn);
            leftToBurn = amount - lazyToBurn;
        }
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

    uint256[50] private __gap;
}
