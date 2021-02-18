// SPDX-License-Identifier: MIT

pragma solidity >=0.6.2 <0.8.0;

import "../../contracts/RoyaltiesV1.sol";

contract RoyaltiesV1Test {
    RoyaltiesV1 immutable fees;

    constructor(RoyaltiesV1 _fees) {
        fees = _fees;
    }

    event Test(address account, uint value);

    function feesTest(uint id) public {
        address payable[] memory recipients = fees.getFeeRecipients(id);
        uint[] memory values = fees.getFeeBps(id);

        require(recipients.length == values.length);
        for (uint i = 0; i < recipients.length; i++) {
            emit Test(recipients[i], values[i]);
        }
    }
}
