// SPDX-License-Identifier: MIT

pragma solidity >=0.6.2 <0.8.0;

import "../../contracts/RoyaltiesV1.sol";

contract RoyaltiesV1Test {
    RoyaltiesV1 immutable royalties;

    constructor(RoyaltiesV1 _royalties) {
        royalties = _royalties;
    }

    event Test(address account, uint value);

    function royaltiesTest(uint id) public {
        address payable[] memory recipients = royalties.getFeeRecipients(id);
        uint[] memory values = royalties.getFeeBps(id);

        require(recipients.length == values.length);
        for (uint i = 0; i < recipients.length; ++i) {
            emit Test(recipients[i], values[i]);
        }
    }
}
