// SPDX-License-Identifier: MIT

pragma solidity >=0.6.2 <0.8.0;
pragma abicoder v2;

import "../../contracts/SecondarySaleFeesV2.sol";

contract FeesV2Test {
    SecondarySaleFeesV2 immutable fees;

    constructor(SecondarySaleFeesV2 _fees) {
        fees = _fees;
    }

    event Test(address account, uint value);

    function feesTest(uint id) public {
        LibFee.Fee[] memory result = fees.getFees(id);

        for (uint i = 0; i < result.length; i++) {
            emit Test(result[i].account, result[i].value);
        }
    }
}
