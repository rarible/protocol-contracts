// SPDX-License-Identifier: MIT

pragma solidity 0.7.6;
pragma abicoder v2;

import "@rarible/libraries/contracts/LibOrderDataV1.sol";
import "@rarible/libraries/contracts/LibOrderDataV2.sol";
import "@rarible/libraries/contracts/LibOrderDataV3.sol";

contract RaribleTestHelper{

    function encode(LibOrderDataV1.DataV1 memory data) pure external returns (bytes memory) {
        return abi.encode(data);
    }

    function encodeV2(LibOrderDataV2.DataV2 memory data) pure external returns (bytes memory) {
        return abi.encode(data);
    }

    function encodeV3_SELL(LibOrderDataV3.DataV3_SELL memory data) pure external returns (bytes memory) {
        return abi.encode(data);
    }

    function encodeV3_BUY(LibOrderDataV3.DataV3_BUY memory data) pure external returns (bytes memory) {
        return abi.encode(data);
    }

    function encodeOriginFeeIntoUint(address account, uint96 value) external pure returns(uint){
        return (uint(value) << 160) + uint(account);
    }
}
