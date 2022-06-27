// SPDX-License-Identifier: MIT

pragma solidity >=0.6.9 <0.8.0;
pragma abicoder v2;

import "../libraries/LibSeaPort.sol";

interface ISeaPort {
    function fulfillBasicOrder(LibSeaPort.BasicOrderParameters calldata parameters)
       external
       payable
       returns (bool fulfilled);
}