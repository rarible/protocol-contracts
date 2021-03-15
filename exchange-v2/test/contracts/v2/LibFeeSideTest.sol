pragma solidity ^0.7.0;
pragma abicoder v2;

import "../../../contracts/exchange/v2/LibFeeSide.sol";

contract LibFeeSideTest {
    function getFeeSideTest(bytes4 maker, bytes4 taker) external pure returns (LibFeeSide.FeeSide){
        return LibFeeSide.getFeeSide(maker, taker);
    }
}
