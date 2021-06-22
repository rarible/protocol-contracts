// SPDX-License-Identifier: MIT

pragma solidity ^0.7.0;
pragma abicoder v2;

import "./StakingBase.sol";

contract StakingSplit is StakingBase {
    using SafeMathUpgradeable for uint;
    using LibBrokenLine for LibBrokenLine.BrokenLine;

    function split(uint id, address delegateOne, address delegateTwo, uint shareOne, uint shareTwo) external returns (uint idFirst, uint idSecond) {
        address account = verifyStakeOwner(id);
        require(shareOne > 0, "share unacceptable value");
        require(shareTwo > 0, "share unacceptable value");
        require(shareOne.add(shareTwo) == SPLIT_LOCK_MAX_PERCENT, "share unacceptable values");

        uint time = roundTimestamp(block.timestamp);
        address delegate = stakes[id].delegate;
        (uint residue, uint slope, uint cliff) = removeLines(id, account, delegate, time);
        accounts[account].amount = accounts[account].amount.sub(residue);

        counter++;
        idFirst = initiateLines(account, delegateOne, residue, slope, cliff, shareOne, time);

        counter++;
        idSecond = initiateLines(account, delegateTwo, residue, slope, cliff, shareTwo, time);
        emit Split(id, delegateOne, delegateTwo, shareOne, shareTwo);
    }

    function initiateLines(address account, address delegate, uint bias, uint slope, uint cliff, uint share, uint toTime) internal returns (uint newId) {
        uint newAmount = bias.mul(share).div(SPLIT_LOCK_MAX_PERCENT);
        require(newAmount > 0, "split, amount unacceptable value");
        uint period = bias.div(slope);
        uint newSlope = newAmount.div(period);
        addLines(account, delegate, newAmount, newSlope, cliff, toTime);
        accounts[account].amount = accounts[account].amount.add(newAmount);
        newId = counter;
    }
}
