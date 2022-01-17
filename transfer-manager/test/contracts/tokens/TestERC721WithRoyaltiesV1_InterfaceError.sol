// SPDX-License-Identifier: MIT

pragma solidity 0.7.6;
pragma abicoder v2;

import "@openzeppelin/contracts-upgradeable/token/ERC721/ERC721Upgradeable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/Initializable.sol";
import "@rarible/royalties/contracts/LibRoyaltiesV1.sol";
import "@rarible/royalties/contracts/RoyaltiesV1.sol";
import "@rarible/royalties/contracts/impl/AbstractRoyalties.sol";

contract TestERC721WithRoyaltiesV1_InterfaceError is Initializable, AbstractRoyalties,  RoyaltiesV1, ERC721Upgradeable {

    function mint(address to, uint tokenId, LibPart.Part[] memory _fees) external {
        _registerInterface(LibRoyaltiesV1._INTERFACE_ID_FEES);
        _mint(to, tokenId);
        _saveRoyalties(tokenId, _fees);
    }

    function getFeeRecipients(uint256) public override pure returns (address payable[] memory) {
        revert("getFeeRecipients failed");
    }

    function getFeeBps(uint256) public override pure returns (uint[] memory) {
        revert("getFeeBps failed");
    }

    function _onRoyaltiesSet(uint256 _id, LibPart.Part[] memory _fees) override internal {}
}
