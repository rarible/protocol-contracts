// SPDX-License-Identifier: MIT

pragma solidity ^0.7.0;
pragma abicoder v2;

import "./StakingBase.sol";

contract StakingSplit is StakingBase {
    using SafeMathUpgradeable for uint;
    using LibBrokenLine for LibBrokenLine.BrokenLine;

    function split(uint id, address delegateOne, address delegateTwo, uint shareOne, uint shareTwo) external returns (uint idFirst, uint idSecond) {
        address account =  verifyStakeOwner(id);
        require(shareOne > 0, "share unacceptable value");
        require(shareTwo > 0, "share unacceptable value");
        require(shareOne.add(shareTwo) == SPLIT_LOCK_MAX_PERCENT, "share unacceptable values");

        uint time = roundTimestamp(block.timestamp);
        (uint bias, uint slope, uint cliff) = removeLines2(id, account, time);

        counter++;
        idFirst = initiateLines(account, delegateOne, bias, slope, cliff, shareOne, time);

        counter++;
        idSecond = initiateLines(account, delegateTwo, bias, slope, cliff, shareTwo, time);
        emit Split(id, delegateOne, delegateTwo, shareOne, shareTwo);
    }

    function removeLines2(uint id, address account, uint toTime) internal returns (uint residue, uint slope, uint cliff) {
        address delegate = stakes[id].delegate;
        accounts[delegate].balance.remove(id, toTime);
        totalSupplyLine.remove(id, toTime);
        (residue, slope, cliff) = accounts[account].locked.remove(id, toTime);
    }

    function initiateLines(address account, address delegate, uint bias, uint slope, uint cliff, uint share, uint toTime) internal returns (uint newId){
        uint newAmount = bias.mul(share).div(SPLIT_LOCK_MAX_PERCENT);
        require(newAmount > 0, "split, amount unacceptable value");
        uint period = bias.div(slope);
        uint newSlope = newAmount.div(period);
        addLines(account, delegate, newAmount, newSlope, cliff, toTime);
        newId = counter;
    }
}
