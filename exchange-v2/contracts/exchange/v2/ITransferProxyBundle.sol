// SPDX-License-Identifier: MIT

pragma solidity >=0.6.9 <0.8.0;
pragma abicoder v2;

import "./LibBundle.sol";

interface ITransferProxyBundle {
    function transfer(LibBundle.Bundle calldata bundle, address from, address to) external;
}
