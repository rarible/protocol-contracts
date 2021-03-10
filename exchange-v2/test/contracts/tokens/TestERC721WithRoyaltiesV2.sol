// SPDX-License-Identifier: MIT

pragma solidity >=0.6.0 <0.8.0;
pragma experimental ABIEncoderV2;

import "@openzeppelin/contracts-upgradeable/token/ERC721/ERC721Upgradeable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/Initializable.sol";
import "@rarible/royalties/contracts/impl/RoyaltiesV2Impl.sol";
import "@rarible/royalties/contracts/LibRoyaltiesV2.sol";
import "@rarible/royalties/contracts/LibFee.sol";

contract TestERC721WithRoyaltiesV2 is Initializable, RoyaltiesV2Impl, ERC721Upgradeable {
    function initialize() public initializer {
        _registerInterface(LibRoyaltiesV2._INTERFACE_ID_FEES);
    }
    function mint(address to, uint tokenId, LibFee.Fee[] memory _fees) external {
        _mint(to, tokenId);
        _saveFees(tokenId, _fees);
    }
}
