// SPDX-License-Identifier: MIT

pragma solidity 0.7.6;
pragma abicoder v2;

import "./ERC1155Base.sol";
import "../IsPrivateCollection.sol";
import "../access/MinterAccessControl.sol";

contract ERC1155Rarible is ERC1155Base, IsPrivateCollection, MinterAccessControl {
    event CreateERC1155Rarible(address owner, string name, string symbol);
    event CreateERC1155RaribleUser(address owner, string name, string symbol);

    function __ERC1155RaribleUser_init(string memory _name, string memory _symbol, string memory baseURI, string memory contractURI, address[] memory operators, address transferProxy, address lazyTransferProxy) external virtual {
        __ERC1155Rarible_init_unchained(_name, _symbol, baseURI, contractURI, transferProxy, lazyTransferProxy);
        
        isPrivate = true;
        emit CreateERC1155RaribleUser(_msgSender(), _name, _symbol);
    }
    
    function __ERC1155RaribleUser_init_proxy(string memory _name, string memory _symbol, string memory baseURI, string memory contractURI, address[] memory operators, address transferProxy, address lazyTransferProxy, address initialOwner) external virtual {
        __ERC1155Rarible_init_unchained(_name, _symbol, baseURI, contractURI, transferProxy, lazyTransferProxy);
        
        isPrivate = true;

        transferOwnership(initialOwner);

        emit CreateERC1155RaribleUser(initialOwner, _name, _symbol);
    }

    function __ERC1155Rarible_init(string memory _name, string memory _symbol, string memory baseURI, string memory contractURI, address transferProxy, address lazyTransferProxy) external virtual {
        __ERC1155Rarible_init_unchained(_name, _symbol, baseURI, contractURI, transferProxy, lazyTransferProxy);

        isPrivate = false;
        emit CreateERC1155Rarible(_msgSender(), _name, _symbol);
    }

    function __ERC1155Rarible_init_proxy(string memory _name, string memory _symbol, string memory baseURI, string memory contractURI, address transferProxy, address lazyTransferProxy, address initialOwner) external virtual {
        __ERC1155Rarible_init_unchained(_name, _symbol, baseURI, contractURI, transferProxy, lazyTransferProxy);

        isPrivate = false;

        transferOwnership(initialOwner);

        emit CreateERC1155Rarible(initialOwner, _name, _symbol);
    }


    function __ERC1155Rarible_init_unchained(string memory _name, string memory _symbol, string memory baseURI, string memory contractURI, address transferProxy, address lazyTransferProxy) internal initializer {
        __Ownable_init_unchained();
        __ERC1155Lazy_init_unchained();
        __ERC165_init_unchained();
        __Context_init_unchained();
        __Mint1155Validator_init_unchained();
        __ERC1155_init_unchained("");
        __HasContractURI_init_unchained(contractURI);
        __ERC1155Burnable_init_unchained();
        __RoyaltiesV2Upgradeable_init_unchained();
        __ERC1155Base_init_unchained(_name, _symbol);
        __MinterAccessControl_init_unchained();
        _setBaseURI(baseURI);

        //setting default approver for transferProxies
        _setDefaultApproval(transferProxy, true);
        _setDefaultApproval(lazyTransferProxy, true);
    }

    function mintAndTransfer(LibERC1155LazyMint.Mint1155Data memory data, address to, uint256 _amount) public override {
        if (isPrivate){
          require(owner() == data.creators[0].account || isMinter(data.creators[0].account), "not owner or minter");
        }
        super.mintAndTransfer(data, to, _amount);
    }
}
