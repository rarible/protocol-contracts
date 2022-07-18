// SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;
pragma abicoder v2;

import "./ERC721UpgradeableMinimal.sol";
import "@rarible/royalties/contracts/impl/RoyaltiesV2Impl.sol";
import "@rarible/royalties-upgradeable/contracts/RoyaltiesV2Upgradeable.sol";
import "@rarible/lazy-mint/contracts/erc-721/IERC721LazyMint.sol";
import "../Mint721Validator.sol";
import "@openzeppelin/contracts-upgradeable/utils/math/SafeMathUpgradeable.sol";
import "./ERC721URI.sol";

abstract contract ERC721LazyMinimal is IERC721LazyMint, ERC721UpgradeableMinimal, Mint721Validator, RoyaltiesV2Upgradeable, RoyaltiesV2Impl, ERC721URI {
    using SafeMathUpgradeable for uint;

    bytes4 private constant _INTERFACE_ID_ERC165 = 0x01ffc9a7;
    bytes4 private constant _INTERFACE_ID_ERC721 = 0x80ac58cd;
    bytes4 private constant _INTERFACE_ID_ERC721_METADATA = 0x5b5e139f;
    bytes4 private constant _INTERFACE_ID_ERC721_ENUMERABLE = 0x780e9d63;

    // tokenId => creators
    mapping(uint256 => LibPart.Part[]) private creators;

    function __ERC721Lazy_init_unchained() internal initializer {

    }

    function supportsInterface(bytes4 interfaceId) public view virtual override(IERC165Upgradeable, ERC721UpgradeableMinimal, RoyaltiesV2Upgradeable) returns (bool) {
        return interfaceId == LibERC721LazyMint._INTERFACE_ID_MINT_AND_TRANSFER
        || interfaceId == LibRoyaltiesV2._INTERFACE_ID_ROYALTIES
        || interfaceId == LibRoyalties2981._INTERFACE_ID_ROYALTIES
        || interfaceId == _INTERFACE_ID_ERC165
        || interfaceId == _INTERFACE_ID_ERC721
        || interfaceId == _INTERFACE_ID_ERC721_METADATA
        || interfaceId == _INTERFACE_ID_ERC721_ENUMERABLE;
    }

    function transferFromOrMint(
        LibERC721LazyMint.Mint721Data memory data,
        address from,
        address to
    ) override external {
        if (_exists(data.tokenId)) {
            safeTransferFrom(from, to, data.tokenId);
        } else {
            mintAndTransfer(data, to);
        }
    }

    function mintAndTransfer(LibERC721LazyMint.Mint721Data memory data, address to) public override virtual {
        address minter = address(uint160(data.tokenId >> 96));
        address sender = _msgSender();

        require(minter == data.creators[0].account, "tokenId incorrect");
        require(data.creators.length == data.signatures.length);
        require(minter == sender || isApprovedForAll(minter, sender), "ERC721: transfer caller is not owner nor approved");

        bytes32 hash = LibERC721LazyMint.hash(data);
        for (uint i = 0; i < data.creators.length; i++) {
            address creator = data.creators[i].account;
            if (creator != sender) {
                validate(creator, hash, data.signatures[i]);
            }
        }

        _safeMint(to, data.tokenId);
        _saveRoyalties(data.tokenId, data.royalties);
        _saveCreators(data.tokenId, data.creators);
        _setTokenURI(data.tokenId, data.tokenURI);
    }

    function _emitMintEvent(address to, uint tokenId) internal override virtual {
        address minter = address(uint160(tokenId >> 96));
        if (minter != to) {
            emit Transfer(address(0), minter, tokenId);
            emit Transfer(minter, to, tokenId);
        } else {
            emit Transfer(address(0), to, tokenId);
        }
    }

    function _saveCreators(uint tokenId, LibPart.Part[] memory _creators) internal {
        LibPart.Part[] storage creatorsOfToken = creators[tokenId];
        uint total = 0;
        for (uint i = 0; i < _creators.length; i++) {
            require(_creators[i].account != address(0x0), "Account should be present");
            require(_creators[i].value != 0, "Creator share should be positive");
            creatorsOfToken.push(_creators[i]);
            total = total.add(_creators[i].value);
        }
        require(total == 10000, "total amount of creators share should be 10000");
        emit Creators(tokenId, _creators);
    }

    function updateAccount(uint256 _id, address _from, address _to) external {
        require(_msgSender() == _from, "not allowed");
        super._updateAccount(_id, _from, _to);
    }

    function getCreators(uint256 _id) external view returns (LibPart.Part[] memory) {
        return creators[_id];
    }

    function tokenURI(uint256 tokenId) public view virtual override(ERC721UpgradeableMinimal, ERC721URI) returns (string memory) {
        return ERC721URI.tokenURI(tokenId);
    }

    function _clearMetadata(uint256 tokenId) internal override(ERC721UpgradeableMinimal, ERC721URI) virtual {
        return ERC721URI._clearMetadata(tokenId);
    }

    uint256[50] private __gap;
}
