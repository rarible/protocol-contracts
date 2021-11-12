// SPDX-License-Identifier: MIT

pragma solidity 0.7.6;
pragma abicoder v2;

import "@rarible/meta-tx/contracts/EIP712MetaTransaction.sol";
import "../ERC721RaribleMinimal.sol";

contract ERC721RaribleMeta is ERC721RaribleMinimal, EIP712MetaTransaction {

    event CreateERC721RaribleMeta(address owner, string name, string symbol);
    event CreateERC721RaribleUserMeta(address owner, string name, string symbol);

    function __ERC721RaribleUserMeta_init(string memory _name, string memory _symbol, string memory baseURI, string memory contractURI, address[] memory operators, address transferProxy, address lazyTransferProxy) external initializer {
        __ERC721Rarible_init_unchained(_name, _symbol, baseURI, contractURI, transferProxy, lazyTransferProxy);

        for(uint i = 0; i < operators.length; i++) {
            setApprovalForAll(operators[i], true);
        }

        __MetaTransaction_init_unchained("ERC721RaribleUserMeta", "1");

        isPrivate = true;

        emit CreateERC721RaribleUserMeta(_msgSender(), _name, _symbol);
    }

    function __ERC721RaribleMeta_init(string memory _name, string memory _symbol, string memory baseURI, string memory contractURI, address transferProxy, address lazyTransferProxy) external initializer {
        __ERC721Rarible_init_unchained(_name, _symbol, baseURI, contractURI, transferProxy, lazyTransferProxy);

        __MetaTransaction_init_unchained("ERC721RaribleMeta", "1");

        isPrivate = false;

        emit CreateERC721RaribleMeta(_msgSender(), _name, _symbol);
    }

    function _msgSender() internal view virtual override(ContextUpgradeable, EIP712MetaTransaction) returns (address payable) {
        return super._msgSender();
    }
}
