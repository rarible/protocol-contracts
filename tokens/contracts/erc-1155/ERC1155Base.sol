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

    function burn(address account, uint256 id, uint256 value) public virtual override {
        uint256 burnMinted = _burnLazy(account, id, value);
        if (burnMinted > 0) {
            //token exists, burn Minted
            ERC1155BurnableUpgradeable.pureBurn(account, id, burnMinted);
        }
        emit TransferSingle(_msgSender(), account, address(0), id, value);
    }

    function burnBatch(address account, uint256[] memory ids, uint256[] memory amounts) public virtual override {
        require(ids.length == amounts.length, "ERC1155: ids and amounts length mismatch");
        address operator = _msgSender();

        _beforeTokenTransfer(operator, account, address(0), ids, amounts, "");
        uint256 burnMinted;
        for (uint i = 0; i < ids.length; i++) {
            burnMinted = _burnLazy(account, ids[i], amounts[i]);
            if (burnMinted > 0) {
                //token exists, burn Minted
                ERC1155BurnableUpgradeable.pureBurn(account, ids[i], burnMinted);
            }
        }
        emit TransferBatch(operator, account, address(0), ids, amounts);
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

    function _burnLazy(address account, uint256 id, uint256 value) internal returns (uint256 burnResidue) {
        address creator = address(id >> 96);
        uint supply = ERC1155Lazy._getSupply(id);
        if (creator == _msgSender() && supply == 0) {
            //token not exists, burn Lazy by creator
            ERC1155Lazy._setBurned(id, value);
            return 0;
        }
        burnResidue = value;
        if (creator == _msgSender()) {
            //calculate Lazy value available for burn
            uint256 balanceLazy = supply - ERC1155Lazy._getMinted(id);
            uint256 burnLazy = value;
            burnResidue = 0;
            if (burnLazy > balanceLazy) {//need to burn more than available
                burnLazy = balanceLazy;
                burnResidue = value - burnLazy;
            }
            //token exists, burn Lazy by creator
            ERC1155Lazy._setBurned(id, burnLazy);
        }
    }

    uint256[50] private __gap;
}
