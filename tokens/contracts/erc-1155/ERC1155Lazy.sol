// SPDX-License-Identifier: MIT

pragma solidity >=0.6.2 <0.8.0;
pragma abicoder v2;

import "@openzeppelin/contracts-upgradeable/token/ERC1155/ERC1155Upgradeable.sol";
import "@rarible/royalties/contracts/impl/RoyaltiesV2Impl.sol";
import "@rarible/royalties-upgradeable/contracts/RoyaltiesV2Upgradeable.sol";
import "@rarible/lazy-mint/contracts/erc-1155/IERC1155LazyMint.sol";
import "./Mint1155Validator.sol";
import "./ERC1155BaseURI.sol";

abstract contract ERC1155Lazy is IERC1155LazyMint, ERC1155BaseURI, Mint1155Validator, RoyaltiesV2Upgradeable, RoyaltiesV2Impl {
    using SafeMathUpgradeable for uint;

    event Supply(
        uint256 tokenId,
        uint256 value
    );
    event Creators(
        uint256 tokenId,
        LibPart.Part[] creators
    );

    mapping (uint256 => LibPart.Part[]) public creators;
    mapping (uint => uint) private supply;
    mapping (uint => uint) private minted;

    function __ERC1155Lazy_init_unchained() internal initializer {
        _registerInterface(0x6db15a0f);
    }

    function mintAndTransfer(LibERC1155LazyMint.Mint1155Data memory data, address to, uint256 _amount) public override virtual {
        address minter = address(data.tokenId >> 96);
        address sender = _msgSender();

        require(minter == data.creators[0].account, "tokenId incorrect");
        require(data.creators.length == data.signatures.length);
        require(minter == sender || isApprovedForAll(minter, sender), "ERC1155: transfer caller is not approved");

        require(data.supply > 0, "supply incorrect");
        require(_amount > 0, "amount incorrect");
        require(bytes(data.uri).length > 0, "uri should be set");

        if (supply[data.tokenId] == 0) {
            for (uint i = 0; i < data.creators.length; i++) {
                validate(sender, data, i);
            }

            _saveSupply(data.tokenId, data.supply);
            _saveRoyalties(data.tokenId, data.royalties);
            _saveCreators(data.tokenId, data.creators);
            _setTokenURI(data.tokenId, data.uri);
        }

        _mint(to, data.tokenId, _amount, "");

        emit Mint(data.tokenId, data.uri, data.creators, _amount);
    }

    function _mint(address account, uint256 id, uint256 amount, bytes memory data) internal virtual override {
        uint newMinted = amount.add(minted[id]);
        require(newMinted <= supply[id], "more than supply");
        minted[id] = newMinted;
        super._mint(account, id, amount, data);
    }

    function _saveSupply(uint tokenId, uint _supply) internal {
        require(supply[tokenId] == 0);
        supply[tokenId] = _supply;
        emit Supply(tokenId, _supply);
    }

    function _saveCreators(uint tokenId, LibPart.Part[] memory _creators) internal {
        LibPart.Part[] storage creators = creators[tokenId];
        //todo check sum is 10000
        for(uint i=0; i < _creators.length; i++) {
            creators.push(_creators[i]);
        }
        emit Creators(tokenId, _creators);
    }

    function getCreators(uint256 _id) external view returns (LibPart.Part[] memory) {
        return creators[_id];
    }
    uint256[50] private __gap;
}
