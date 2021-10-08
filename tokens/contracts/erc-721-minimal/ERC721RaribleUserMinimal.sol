// SPDX-License-Identifier: MIT

pragma solidity 0.7.6;
pragma abicoder v2;

import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
import "./ERC721BurnableUpgradeableMinimal.sol";
import "./ERC721LazyMinimal.sol";
import "../HasContractURI.sol";

contract ERC721RaribleUserMinimal is OwnableUpgradeable, ERC721BurnableUpgradeableMinimal, ERC721LazyMinimal, HasContractURI {

    event CreateERC721RaribleUser(address owner, string name, string symbol);

    function __ERC721RaribleUser_init(string memory _name, string memory _symbol, string memory baseURI, string memory contractURI, address[] memory operators) external initializer {
        _setBaseURI(baseURI);
        __ERC721Lazy_init_unchained();
        __Context_init_unchained();
        __ERC165_init_unchained();
        __Ownable_init_unchained();
        __ERC721Burnable_init_unchained();
        __Mint721Validator_init_unchained();
        __HasContractURI_init_unchained(contractURI);
        __RoyaltiesV2Upgradeable_init_unchained();
        __ERC721_init_unchained(_name, _symbol);
        for(uint i = 0; i < operators.length; i++) {
            setApprovalForAll(operators[i], true);
        }
        emit CreateERC721RaribleUser(_msgSender(), _name, _symbol);
    }

    function supportsInterface(bytes4 interfaceId) public view virtual override(ERC165Upgradeable, ERC721LazyMinimal) returns (bool) {
        return super.supportsInterface(interfaceId);
    }

    function mintAndTransfer(LibERC721LazyMint.Mint721Data memory data, address to) public override virtual {
        require(owner() == data.creators[0].account, "minter is not the owner");
        super.mintAndTransfer(data, to);
    }

    function tokenURI(uint256 tokenId) public view virtual override(ERC721UpgradeableMinimal, ERC721LazyMinimal) returns (string memory) {
        return ERC721LazyMinimal.tokenURI(tokenId);
    }

    function _clearMetadata(uint256 tokenId) internal override(ERC721UpgradeableMinimal, ERC721LazyMinimal) virtual {
        return ERC721LazyMinimal._clearMetadata(tokenId);
    }

    function _emitMintEvent(address to, uint tokenId) internal override(ERC721UpgradeableMinimal, ERC721LazyMinimal) virtual {
        return ERC721LazyMinimal._emitMintEvent(to, tokenId);
    }
    
    uint256[50] private __gap;
}
