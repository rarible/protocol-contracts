pragma solidity >=0.6.2 <0.8.0;

import "../../contracts/SecondarySaleFeesV1.sol";

contract FeesV1Test {
    SecondarySaleFeesV1 immutable fees;

    constructor(SecondarySaleFeesV1 _fees) {
        fees = _fees;
    }

    event Test(address account, uint value);

    function feesTest() public {
        address payable[] memory recipients = fees.getFeeRecipients(0);
        uint[] memory values = fees.getFeeBps(0);

        require(recipients.length == values.length);
        for (uint i = 0; i < recipients.length; i++) {
            emit Test(recipients[i], values[i]);
        }
    }
}
