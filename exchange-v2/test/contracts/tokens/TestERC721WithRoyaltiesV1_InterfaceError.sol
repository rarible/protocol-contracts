// SPDX-License-Identifier: MIT

pragma solidity >=0.6.0 <0.8.0;
pragma experimental ABIEncoderV2;

import "@openzeppelin/contracts-upgradeable/token/ERC721/ERC721Upgradeable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/Initializable.sol";
import "@rarible/royalties/contracts/LibRoyaltiesV1.sol";
import "@rarible/royalties/contracts/LibFee.sol";
import "@rarible/royalties/contracts/RoyaltiesV1.sol";
import "@rarible/royalties/contracts/impl/AbstractRoyalties.sol";

contract TestERC721WithRoyaltiesV1_InterfaceError is Initializable, AbstractRoyalties,  RoyaltiesV1, ERC721Upgradeable {

    function mint(address to, uint tokenId, LibFee.Fee[] memory _fees) external {
        _registerInterface(LibRoyaltiesV1._INTERFACE_ID_FEES);
        _mint(to, tokenId);
        _saveFees(tokenId, _fees);
    }

    function getFeeRecipients(uint256 id) public override pure returns (address payable[] memory) {
        require(false, "getFeeRecipients failed");
        address payable[] memory mem1;
        return mem1;
    }

    function getFeeBps(uint256 id) public override pure returns (uint[] memory) {
        require(false, "getFeeBps failed");
        uint[] memory result;
        return result;
    }

    function _onRoyaltiesSet(uint256 _id, LibFee.Fee[] memory _fees) override internal {}
}
