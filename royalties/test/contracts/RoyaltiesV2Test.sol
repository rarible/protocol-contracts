// SPDX-License-Identifier: MIT

pragma solidity >=0.6.2 <0.8.0;
pragma abicoder v2;

import "../../contracts/RoyaltiesV2.sol";

contract RoyaltiesV2Test {
    RoyaltiesV2 immutable fees;

    constructor(RoyaltiesV2 _fees) {
        fees = _fees;
    }

    event Test(address account, uint value);

    function feesTest(uint id) public {
        LibPart.Part[] memory result = fees.getRoyalties(id);

        for (uint i = 0; i < result.length; i++) {
            emit Test(result[i].account, result[i].value);
        }
    }
}
