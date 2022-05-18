// SPDX-License-Identifier: MIT

pragma solidity 0.7.6;

library LibTransfer {
    function transferEth(address to, uint value) internal {
        (bool success,) = to.call{ value: value }("");
        require(success, "transfer failed");
    }
}
