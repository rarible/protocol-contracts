// SPDX-License-Identifier: MIT

pragma solidity >=0.6.2 <0.8.0;

library LibFee {
    struct Fee {
        address payable account;
        uint value;
    }
}
