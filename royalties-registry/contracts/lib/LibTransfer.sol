// SPDX-License-Identifier: MIT

pragma solidity >=0.6.9 <0.8.0;

library LibTransfer {
    function transferEth(address to, uint value) internal {
        (bool success,) = to.call{ value: value }("");
        require(success, "transfer failed");
    }
}
