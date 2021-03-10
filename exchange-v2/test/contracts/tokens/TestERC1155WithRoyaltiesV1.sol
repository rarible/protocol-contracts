// SPDX-License-Identifier: MIT

pragma solidity >=0.6.0 <0.8.0;
pragma experimental ABIEncoderV2;

import "@openzeppelin/contracts-upgradeable/token/ERC1155/ERC1155Upgradeable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/Initializable.sol";
import "@rarible/royalties/contracts/impl/RoyaltiesV1Impl.sol";
import "@rarible/royalties/contracts/LibRoyaltiesV1.sol";
import "@rarible/royalties/contracts/LibFee.sol";

contract TestERC1155WithRoyaltiesV1 is Initializable, RoyaltiesV1Impl, ERC1155Upgradeable {
    function initialize() public initializer {
        _registerInterface(LibRoyaltiesV1._INTERFACE_ID_FEES);
    }
    function mint(address to, uint tokenId, LibFee.Fee[] memory _fees, uint amount) external {
        _mint(to, tokenId, amount, "");
        _saveFees(tokenId, _fees);
    }
}
