// SPDX-License-Identifier: MIT

pragma solidity >=0.6.2 <0.8.0;
pragma abicoder v2;

import "@openzeppelin/contracts-upgradeable/token/ERC721/ERC721Upgradeable.sol";
import "@rarible/royalties/contracts/impl/RoyaltiesV2Impl.sol";
import "@rarible/royalties-upgradeable/contracts/RoyaltiesV2Upgradeable.sol";
import "@rarible/lazy-mint/contracts/erc-721/IERC721LazyMint.sol";
import "./Mint721Validator.sol";

abstract contract ERC721Lazy is IERC721LazyMint, ERC721Upgradeable, Mint721Validator, RoyaltiesV2Upgradeable, RoyaltiesV2Impl {

    // tokenId => creators
    mapping(uint256 => LibPart.Part[]) private creators;

    function __ERC721Lazy_init_unchained() internal initializer {
        _registerInterface(0x8486f69f);
    }

    function mintAndTransfer(LibERC721LazyMint.Mint721Data memory data, address to) public override virtual {
        address minter = address(data.tokenId >> 96);
        address sender = _msgSender();

        require(minter == data.creators[0].account, "tokenId incorrect");
        require(data.creators.length == data.signatures.length);
        require(minter == sender || isApprovedForAll(minter, sender), "ERC721: transfer caller is not owner nor approved");

        for (uint i = 0; i < data.creators.length; i++) {
            address creator = data.creators[i].account;
            if (creator != sender) {
                validate(data, i);
            }
        }

        _mint(to, data.tokenId);
        _setTokenURI(data.tokenId, data.uri);
        _saveRoyalties(data.tokenId, data.royalties);
        LibPart.Part[] storage creators = creators[data.tokenId];
        //todo check sum is 10000
        for(uint i=0; i < data.creators.length; i++) {
            creators.push(data.creators[i]);
        }

        emit Mint(data.tokenId, data.uri, creators);
    }

    function updateAccount(uint256 _id, address _from, address _to) external {
        require(_msgSender() == _from, "not allowed");
        super._updateAccount(_id, _from, _to);
    }

    function getCreators(uint256 _id) external view returns (LibPart.Part[] memory) {
        return creators[_id];
    }
    uint256[50] private __gap;
}
