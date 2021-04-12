// SPDX-License-Identifier: MIT

pragma solidity >=0.6.9 <0.8.0;
pragma abicoder v2;

import "../../../contracts/LibFeeSide.sol";

contract LibFeeSideTest {
    function getFeeSideTest(bytes4 maker, bytes4 taker) external pure returns (LibFeeSide.FeeSide){
        return LibFeeSide.getFeeSide(maker, taker);
    }
}
