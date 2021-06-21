// SPDX-License-Identifier: MIT

pragma solidity ^0.7.0;
pragma abicoder v2;

import "./StakingBase.sol";

contract StakingSplit is StakingBase {
    using SafeMathUpgradeable for uint;
    using LibBrokenLine for LibBrokenLine.BrokenLine;

    function split(uint id, address delegateFirst, address delegateSecond, uint shareFirst, uint shareSecond) external returns (uint idFirst, uint idSecond) {
        address account = stakes[id].account;
        require(account == msg.sender, "call not from owner id");
        address delegate = stakes[id].delegate;

        require(account != address(0), "deposit not exists");
        require(delegate != address(0), "deposit not exists");      //  TODO need it require?
        require(delegateFirst != address(0), "delegate not exists");
        require(delegateSecond != address(0), "delegate not exists");
        require(shareFirst > 0, "share unacceptable value");
        require(shareSecond > 0, "share unacceptable value");
        require(shareFirst.add(shareSecond) == SPLIT_LOCK_MAX_PERCENT, "share unacceptable values");

        uint blockTime = roundTimestamp(block.timestamp);
        LibBrokenLine.Line memory line;
        line.start = blockTime;
        uint cliff;
        (line.bias, line.slope, cliff) = accounts[account].locked.remove(id, blockTime);
        require(line.bias > 0, "deposit finished, nothing to split");
        accounts[account].amount = accounts[account].amount.sub(line.bias);
        accounts[delegate].balance.remove(id, blockTime);
        totalSupplyLine.remove(id, blockTime);
        stakes[id].account = address(0); //  TODO need it?
        stakes[id].delegate = address(0); //  TODO need it?

        uint period = line.bias.div(line.slope);

        counter++;
        idFirst = initiateLines(account, delegateFirst, line, period, cliff, shareFirst);

        counter++;
        idSecond = initiateLines(account, delegateSecond, line, period, cliff, shareSecond);
        emit Split(id, delegateFirst, delegateSecond, shareFirst, shareSecond);
    }

    function initiateLines(address account, address delegate, LibBrokenLine.Line memory line, uint period, uint cliff, uint share) internal returns (uint newId){
        uint newAmount = line.bias.mul(share).div(SPLIT_LOCK_MAX_PERCENT);
        uint newSlope = newAmount.div(period);
        require(newAmount > 0, "split, amount unacceptable value");
        require(newSlope > 0, "split, slope unacceptable value");
        addLines(account, delegate, newAmount, newSlope, cliff, line.start);
        accounts[account].amount = accounts[account].amount.add(newAmount);
        newId = counter;
    }

}
