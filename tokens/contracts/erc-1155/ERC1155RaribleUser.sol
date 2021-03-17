// SPDX-License-Identifier: MIT

pragma solidity >=0.6.2 <0.8.0;
pragma abicoder v2;

import "./ERC1155Base.sol";

contract ERC1155RaribleUser is ERC1155Base {
    function __ERC1155RaribleUser_init(string memory _name, string memory _symbol, string memory baseURI, string memory contractURI) external initializer {
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
        _setBaseURI(baseURI);
    }

    function mintAndTransfer(LibERC1155LazyMint.Mint1155Data memory data, address to, uint256 _amount) public override {
        require(owner() == data.creators[0], "minter is not the owner");
        super.mintAndTransfer(data, to, _amount);
    }
    uint256[50] private __gap;
}
