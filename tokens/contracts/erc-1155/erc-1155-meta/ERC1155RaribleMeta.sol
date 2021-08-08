// SPDX-License-Identifier: MIT

pragma solidity 0.7.6;
pragma abicoder v2;

import "../../../../exchange-v2/contracts/EIP712MetaTransaction.sol";
import "./ERC1155RaribleBase.sol";

contract ERC1155RaribleMeta is ERC1155RaribleBase, EIP712MetaTransaction {

    event CreateERC1155RaribleMeta(address owner, string name, string symbol);

    function __ERC1155RaribleMeta_init(string memory _name, string memory _symbol, string memory baseURI, string memory contractURI) external initializer {
        __ERC1155RaribleBase_init(_name, _symbol, baseURI, contractURI);
        __MetaTransaction_init_unchained("ERC1155RaribleMeta", "1");
        emit CreateERC1155RaribleMeta(_msgSender(), _name, _symbol);
    }

    function _msgSender() internal view virtual override(ContextUpgradeable, EIP712MetaTransaction) returns (address payable) {
        return super._msgSender();
    }
}
