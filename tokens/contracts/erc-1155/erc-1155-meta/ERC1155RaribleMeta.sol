// SPDX-License-Identifier: MIT

pragma solidity 0.7.6;
pragma abicoder v2;

import "@rarible/meta-tx/contracts/EIP712MetaTransaction.sol";
import "../ERC1155Rarible.sol";

contract ERC1155RaribleMeta is ERC1155Rarible, EIP712MetaTransaction {

    event CreateERC1155RaribleMeta(address owner, string name, string symbol);
    event CreateERC1155RaribleUserMeta(address owner, string name, string symbol);

    function __ERC1155RaribleUserMeta_init(string memory _name, string memory _symbol, string memory baseURI, string memory contractURI, address[] memory operators, address transferProxy, address lazyTransferProxy) external initializer {
        __ERC1155Rarible_init_unchained(_name, _symbol, baseURI, contractURI, transferProxy, lazyTransferProxy);

        for(uint i = 0; i < operators.length; i++) {
            setApprovalForAll(operators[i], true);
        }
        __MetaTransaction_init_unchained("ERC1155RaribleUserMeta", "1", getSalt(_name, _symbol));
        
        isPrivate = true;

        emit CreateERC1155RaribleUserMeta(_msgSender(), _name, _symbol);
    }
    
    function __ERC1155RaribleMeta_init(string memory _name, string memory _symbol, string memory baseURI, string memory contractURI, address transferProxy, address lazyTransferProxy) external initializer {
        __ERC1155Rarible_init_unchained(_name, _symbol, baseURI, contractURI, transferProxy, lazyTransferProxy);

        __MetaTransaction_init_unchained("ERC1155RaribleMeta", "1", getSalt(_name, _symbol));

        isPrivate = false;

        emit CreateERC1155RaribleMeta(_msgSender(), _name, _symbol);
    }

    function _msgSender() internal view virtual override(ContextUpgradeable, EIP712MetaTransaction) returns (address payable) {
        return super._msgSender();
    }
}
