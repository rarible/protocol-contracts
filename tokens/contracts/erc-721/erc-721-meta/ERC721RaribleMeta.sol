// SPDX-License-Identifier: MIT

pragma solidity 0.7.6;
pragma abicoder v2;

import "@rarible/meta-tx/contracts/EIP712MetaTransaction.sol";
import "../ERC721Rarible.sol";

contract ERC721RaribleMeta is ERC721Rarible, EIP712MetaTransaction {

    event CreateERC721RaribleMeta(address owner, string name, string symbol);

    function __ERC721RaribleMeta_init(string memory _name, string memory _symbol, string memory baseURI, string memory contractURI) external initializer {
        initializeERC721Rarible(_name, _symbol, baseURI, contractURI);
        __MetaTransaction_init_unchained("ERC721RaribleMeta", "1");
        emit CreateERC721RaribleMeta(_msgSender(), _name, _symbol);
    }

    function _msgSender() internal view virtual override(ContextUpgradeable, EIP712MetaTransaction) returns (address payable) {
        return super._msgSender();
    }
}
