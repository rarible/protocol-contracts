// SPDX-License-Identifier: MIT

pragma solidity 0.7.6;
pragma abicoder v2;

import "@openzeppelin/contracts-upgradeable/token/ERC1155/ERC1155Upgradeable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/Initializable.sol";
import "@rarible/royalties/contracts/LibRoyaltiesV2.sol";
import "@rarible/royalties/contracts/RoyaltiesV2.sol";
import "@rarible/royalties/contracts/impl/AbstractRoyalties.sol";

contract TestERC1155WithRoyaltiesV2_InterfaceError is Initializable, AbstractRoyalties,  RoyaltiesV2, ERC1155Upgradeable {

    function mint(address to, uint tokenId, LibPart.Part[] memory _fees, uint amount) external {
        _registerInterface(LibRoyaltiesV2._INTERFACE_ID_ROYALTIES);
        _mint(to, tokenId, amount, "");
        _saveRoyalties(tokenId, _fees);
    }

    function getRaribleV2Royalties(uint256) override external pure returns (LibPart.Part[] memory) {
        revert("getRaribleV2Royalties failed");
    }

    function _onRoyaltiesSet(uint256 _id, LibPart.Part[] memory _fees) override internal {}
}
