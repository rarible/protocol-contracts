// SPDX-License-Identifier: MIT

pragma solidity 0.7.6;
pragma abicoder v2;

import "@rarible/meta-tx/contracts/EIP712MetaTransaction.sol";
import "../ERC721RaribleUser.sol";

contract ERC721RaribleUserMeta is ERC721RaribleUser, EIP712MetaTransaction {

    event CreateERC721RaribleUserMeta(address owner, string name, string symbol);

    function __ERC721RaribleUserMeta_init(string memory _name, string memory _symbol, string memory baseURI, string memory contractURI, address[] memory operators) external initializer {
        __ERC721RaribleUser_init_unchained(_name, _symbol, baseURI, contractURI, operators);
        __MetaTransaction_init_unchained("ERC721RaribleUserMeta", "1");
        emit CreateERC721RaribleUserMeta(_msgSender(), _name, _symbol);
    }

    function _msgSender() internal view virtual override(ContextUpgradeable, EIP712MetaTransaction) returns (address payable) {
        return super._msgSender();
    }
}
