// SPDX-License-Identifier: MIT

pragma solidity 0.7.6;
pragma abicoder v2;

import "./ERC1155Upgradeable.sol";
import "@rarible/royalties/contracts/impl/RoyaltiesV2Impl.sol";
import "@rarible/royalties-upgradeable/contracts/RoyaltiesV2Upgradeable.sol";
import "@rarible/lazy-mint/contracts/erc-1155/IERC1155LazyMint.sol";
import "./Mint1155Validator.sol";
import "./ERC1155BaseURI.sol";
import "../access/MinterAccessControl.sol";

abstract contract ERC1155Lazy is IERC1155LazyMint, ERC1155BaseURI, Mint1155Validator, RoyaltiesV2Upgradeable, RoyaltiesV2Impl, MinterAccessControl  {
    using SafeMathUpgradeable for uint;

    bytes4 private constant _INTERFACE_ID_ERC165 = 0x01ffc9a7;
    bytes4 private constant _INTERFACE_ID_ERC1155 = 0xd9b67a26;
    bytes4 private constant _INTERFACE_ID_ERC1155_METADATA_URI = 0x0e89341c;

    mapping(uint256 => LibPart.Part[]) public creators;
    mapping(uint => uint) private supply;
    mapping(uint => uint) private minted;

    function __ERC1155Lazy_init_unchained() internal initializer {

    }

    function supportsInterface(bytes4 interfaceId) public view virtual override(IERC165Upgradeable, ERC165Upgradeable) returns (bool) {
        return interfaceId == LibERC1155LazyMint._INTERFACE_ID_MINT_AND_TRANSFER
        || interfaceId == LibRoyaltiesV2._INTERFACE_ID_ROYALTIES
        || interfaceId == _INTERFACE_ID_ERC165
        || interfaceId == _INTERFACE_ID_ERC1155
        || interfaceId == _INTERFACE_ID_ERC1155_METADATA_URI;
    }

    function transferFromOrMint(
        LibERC1155LazyMint.Mint1155Data memory data,
        address from,
        address to,
        uint256 amount
    ) override external {
        uint balance = balanceOf(from, data.tokenId);
        uint left = amount;
        if (balance != 0) {
            uint transfer = amount;
            if (balance < amount) {
                transfer = balance;
            }
            safeTransferFrom(from, to, data.tokenId, transfer, "");
            left = amount - transfer;
        }
        if (left > 0) {
            mintAndTransfer(data, to, left);
        }
    }

    function mintAndTransfer(LibERC1155LazyMint.Mint1155Data memory data, address to, uint256 _amount) public override virtual validateMinter {
        address minter = address(data.tokenId >> 96);
        address sender = _msgSender();

        require(minter == sender || isApprovedForAll(minter, sender), "ERC1155: transfer caller is not approved");
        require(_amount > 0, "amount incorrect");

        if (supply[data.tokenId] == 0) {
            require(minter == data.creators[0].account, "tokenId incorrect");
            require(data.supply > 0, "supply incorrect");
            require(data.creators.length == data.signatures.length);

            bytes32 hash = LibERC1155LazyMint.hash(data);
            for (uint i = 0; i < data.creators.length; i++) {
                address creator = data.creators[i].account;
                if (creator != sender) {
                    validate(creator, hash, data.signatures[i]);
                }
            }

            _saveSupply(data.tokenId, data.supply);
            _saveRoyalties(data.tokenId, data.royalties);
            _saveCreators(data.tokenId, data.creators);
            _setTokenURI(data.tokenId, data.tokenURI);
        }

        _mint(to, data.tokenId, _amount, "");
        if (minter != to) {
            emit TransferSingle(sender, address(0), minter, data.tokenId, _amount);
            emit TransferSingle(sender, minter, to, data.tokenId, _amount);
        } else {
            emit TransferSingle(sender, address(0), to, data.tokenId, _amount);
        }
    }

    function _mint(address account, uint256 id, uint256 amount, bytes memory data) internal virtual override {
        uint newMinted = amount.add(minted[id]);
        require(newMinted <= supply[id], "more than supply");
        minted[id] = newMinted;

        require(account != address(0), "ERC1155: mint to the zero address");

        address operator = _msgSender();

        _beforeTokenTransfer(operator, address(0), account, _asSingletonArray(id), _asSingletonArray(amount), data);

        _balances[id][account] = _balances[id][account].add(amount);

        _doSafeTransferAcceptanceCheck(operator, address(0), account, id, amount, data);
    }

    function _saveSupply(uint tokenId, uint _supply) internal {
        require(supply[tokenId] == 0);
        supply[tokenId] = _supply;
        emit Supply(tokenId, _supply);
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

    uint256[50] private __gap;
}
