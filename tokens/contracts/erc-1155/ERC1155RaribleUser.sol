// SPDX-License-Identifier: MIT

pragma solidity 0.7.6;
pragma abicoder v2;

import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/token/ERC1155/ERC1155BurnableUpgradeable.sol";
import "./ERC1155Lazy.sol";
import "../HasContractURI.sol";

contract ERC1155RaribleUser is OwnableUpgradeable, ERC1155BurnableUpgradeable, ERC1155Lazy, HasContractURI {

    event CreateERC1155RaribleUser(address owner, string name, string symbol);

    string public name;
    string public symbol;

    function __ERC1155RaribleUser_init(string memory _name, string memory _symbol, string memory baseURI, string memory contractURI, address[] memory operators) external initializer {
        initializeERC1155RaribleUser(_name, _symbol, baseURI, contractURI, operators);
        emit CreateERC1155RaribleUser(_msgSender(), _name, _symbol);
    }

    function initializeERC1155RaribleUser(string memory _name, string memory _symbol, string memory baseURI, string memory contractURI, address[] memory operators) internal {
        __Ownable_init_unchained();
        __ERC1155Lazy_init_unchained();
        __ERC165_init_unchained();
        __Context_init_unchained();
        __Mint1155Validator_init_unchained();
        __ERC1155_init_unchained("");
        __HasContractURI_init_unchained(contractURI);
        __ERC1155Burnable_init_unchained();
        __RoyaltiesV2Upgradeable_init_unchained();
        __ERC1155RaribleUser_init_unchained(_name, _symbol);
        _setBaseURI(baseURI);
        for(uint i = 0; i < operators.length; i++) {
            setApprovalForAll(operators[i], true);
        }
    }

    function __ERC1155RaribleUser_init_unchained(string memory _name, string memory _symbol) internal initializer {
        name = _name;
        symbol = _symbol;
    }

    function _mint(address account, uint256 tokenId, uint256 amount, bytes memory data) internal virtual override(ERC1155Upgradeable, ERC1155Lazy) {
        ERC1155Lazy._mint(account, tokenId, amount, data);
    }

    function uri(uint tokenId) external view override(ERC1155BaseURI, ERC1155Upgradeable) virtual returns (string memory) {
        return _tokenURI(tokenId);
    }

    function mintAndTransfer(LibERC1155LazyMint.Mint1155Data memory data, address to, uint256 _amount) public override {
        require(owner() == data.creators[0].account, "minter is not the owner");
        super.mintAndTransfer(data, to, _amount);
    }

    function supportsInterface(bytes4 interfaceId) public view virtual override(ERC1155Lazy, ERC165Upgradeable) returns (bool) {
        return super.supportsInterface(interfaceId);
    }

    uint256[50] private __gap;
}
