// SPDX-License-Identifier: MIT
pragma solidity ^0.8.30;
import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
import "./ERC1155BurnableUpgradeable.sol";
import "./ERC1155DefaultApproval.sol";
import "./ERC1155Lazy.sol";
import "../HasContractURI.sol";
import "./ERC1155Upgradeable.sol";
abstract contract ERC1155Base is
    OwnableUpgradeable,
    ERC1155DefaultApproval,
    ERC1155BurnableUpgradeable,
    ERC1155Lazy,
    HasContractURI
{
    string public name;
    string public symbol;
    event BurnLazy(address indexed operator, address indexed account, uint256 id, uint256 amount);
    event BurnLazyBatch(address indexed operator, address indexed account, uint256[] ids, uint256[] amounts);
    event BaseUriChanged(string newBaseURI);
    function isApprovedForAll(
        address _owner,
        address _operator
    ) public view override(ERC1155Upgradeable, ERC1155DefaultApproval, IERC1155) returns (bool) {
        return ERC1155DefaultApproval.isApprovedForAll(_owner, _operator);
    }
    function supportsInterface(
        bytes4 interfaceId
    ) public view virtual override(ERC1155Lazy, HasContractURI, ERC1155Upgradeable) returns (bool) {
        return super.supportsInterface(interfaceId);
    }
    function burnBatch(address account, uint256[] memory ids, uint256[] memory amounts) public virtual override {
        require(ids.length == amounts.length, "ids != amounts");
        uint256[] memory leftToBurns = new uint256[](ids.length);
        uint256[] memory lazyToBurns = new uint256[](ids.length);
        for (uint i = 0; i < ids.length; ++i) {
            (leftToBurns[i], lazyToBurns[i]) = _burnLazy(ids[i], amounts[i]);
        }
        ERC1155BurnableUpgradeable.burnBatch(account, ids, leftToBurns);
        emit BurnLazyBatch(_msgSender(), account, ids, lazyToBurns);
    }

    /**
     * @dev xref:ROOT:erc1155.adoc#batch-operations[Batched] version of {_burn}.
     *
     * Requirements:
     *
     * - `ids` and `amounts` must have the same length.
     */
    function _burnBatch(address account, uint256[] memory ids, uint256[] memory amounts) internal virtual override {
        require(account != address(0), "ERC1155: burn from the zero address");
        require(ids.length == amounts.length, "ERC1155: ids and amounts length mismatch");
        address operator = _msgSender();
        _beforeTokenTransfer(operator, account, address(0), ids, amounts, "");
        for (uint i = 0; i < ids.length; ++i) {
            uint256 amount = amounts[i];
            if (_balances[ids[i]][account] < amount) {
                revert("ERC1155: burn amount exceeds balance");
            }
            _balances[ids[i]][account] -= amount;
        }
        emit TransferBatch(operator, account, address(0), ids, amounts);
    }

    function burn(address account, uint256 id, uint256 amount) public virtual override {
        (uint256 leftToBurn, uint256 lazyToBurn) = _burnLazy(id, amount);
        if (leftToBurn > 0) {
            //token exists, burn Minted
            ERC1155BurnableUpgradeable.burn(account, id, leftToBurn);
        }
        if (lazyToBurn > 0) {
            emit BurnLazy(_msgSender(), account, id, lazyToBurn);
        }
    }

    /**
     * @dev Destroys `amount` tokens of token type `id` from `account`
     *
     * Requirements:
     *
     * - `account` cannot be the zero address.
     * - `account` must have at least `amount` tokens of token type `id`.
     */
    function _burn(address account, uint256 id, uint256 amount) internal virtual override {
        require(account != address(0), "ERC1155: burn from the zero address");
        address operator = _msgSender();
        _beforeTokenTransfer(operator, account, address(0), _asSingletonArray(id), _asSingletonArray(amount), "");
        if (_balances[id][account] < amount) {
            revert("ERC1155: burn amount exceeds balance");
        }
        _balances[id][account] -= amount;
        emit TransferSingle(operator, account, address(0), id, amount);
    }

    function _burnLazy(uint256 id, uint256 amount) internal returns (uint256 leftToBurn, uint256 lazyToBurn) {
        leftToBurn = amount;
        lazyToBurn = 0;
        address creator = address(uint160(id >> 96));
        if (creator == _msgSender()) {
            lazyToBurn = amount;
            uint supply = ERC1155Lazy._getSupply(id);
            uint minted = ERC1155Lazy._getMinted(id);
            if (supply < minted) {
                revert("ERC1155: burn amount exceeds balance");
            }
            if (supply != 0) {
                //calculate Lazy amount available for burn
                uint256 lazyBalance = supply - minted;
                if (amount > lazyBalance) {
                    //need to burn more than available
                    lazyToBurn = lazyBalance;
                }
            }
            ERC1155Lazy._addMinted(id, lazyToBurn);
            leftToBurn = amount - lazyToBurn;
        }
    }
    function _mint(
        address account,
        uint256 id,
        uint256 amount,
        bytes memory data
    ) internal virtual override(ERC1155Upgradeable, ERC1155Lazy) {
        ERC1155Lazy._mint(account, id, amount, data);
    }
    function __ERC1155Base_init_unchained(string memory _name, string memory _symbol) internal {
        name = _name;
        symbol = _symbol;
    }
    function uri(uint id) external view virtual override(ERC1155BaseURI, ERC1155Upgradeable) returns (string memory) {
        return _tokenURI(id);
    }
    function setBaseURI(string memory newBaseURI) external onlyOwner {
        super._setBaseURI(newBaseURI);
        emit BaseUriChanged(newBaseURI);
    }
    uint256[50] private __gap;
}
