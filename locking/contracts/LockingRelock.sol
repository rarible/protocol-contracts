// SPDX-License-Identifier: MIT

pragma solidity 0.7.6;
pragma abicoder v2;

import "./LockingBase.sol";

abstract contract LockingRelock is LockingBase {
    using SafeMathUpgradeable for uint;
    using LibBrokenLine for LibBrokenLine.BrokenLine;

    function relock(uint id, address newDelegate, uint newAmount, uint newSlopePeriod, uint newCliff) external notStopped notMigrating returns (uint) {
        address account = verifyLockOwner(id);
        uint time = roundTimestamp(getBlockNumber());
        verification(account, id, newAmount, newSlopePeriod, newCliff, time);

        address _delegate = locks[id].delegate;
        accounts[account].locked.update(time);

        rebalance(id, account, accounts[account].locked.initial.bias, removeLines(id, account, _delegate, time), newAmount);

        counter++;

        addLines(account, newDelegate, newAmount, newSlopePeriod, newCliff, time);
        emit Relock(id, account, newDelegate, counter, time, newAmount, newSlopePeriod, newCliff);

        // IVotesUpgradeable events
        emit DelegateChanged(account, _delegate, newDelegate);
        emit DelegateVotesChanged(_delegate, 0, accounts[_delegate].balance.actualValue(time));
        emit DelegateVotesChanged(newDelegate, 0, accounts[newDelegate].balance.actualValue(time));

        return counter;
    }

    /**
     * @dev Verification parameters:
     *      1. amount > 0, slope > 0
     *      2. cliff period and slope period less or equal two years
     *      3. newFinishTime more or equal oldFinishTime
     */
    function verification(address account, uint id, uint newAmount, uint newSlopePeriod, uint newCliff, uint toTime) internal view {
        require(newAmount > 0, "zero amount");
        require(newCliff <= MAX_CLIFF_PERIOD, "cliff too big");
        require(newSlopePeriod <= MAX_SLOPE_PERIOD, "slope period too big");
        require(newSlopePeriod > 0, "slope period equal 0");

        //check Line with new parameters don`t finish earlier than old Line
        uint newEnd = toTime.add(newCliff).add(newSlopePeriod);
        LibBrokenLine.LineData memory lineData = accounts[account].locked.initiatedLines[id];
        LibBrokenLine.Line memory line = lineData.line;
        uint oldSlopePeriod = divUp(line.bias, line.slope);
        uint oldEnd = line.start.add(lineData.cliff).add(oldSlopePeriod);
        require(oldEnd <= newEnd, "new line period lock too short");

        //check Line with new parameters don`t cut corner old Line
        uint oldCliffEnd = line.start.add(lineData.cliff);
        uint newCliffEnd = toTime.add(newCliff);
        if (oldCliffEnd > newCliffEnd) {
            uint balance = oldCliffEnd.sub(newCliffEnd);
            uint newSlope = divUp(newAmount, newSlopePeriod);
            uint newBias = newAmount.sub(balance.mul(newSlope));
            require(newBias >= line.bias, "detect cut deposit corner");
        }
    }

    function removeLines(uint id, address account, address delegate, uint toTime) internal returns (uint residue) {
        updateLines(account, delegate, toTime);
        accounts[delegate].balance.remove(id, toTime);
        totalSupplyLine.remove(id, toTime);
        (residue,,) = accounts[account].locked.remove(id, toTime);
    }

    function rebalance(uint id, address account, uint bias, uint residue, uint newAmount) internal {
        require(residue <= newAmount, "Impossible to relock: less amount, then now is");
        uint addAmount = newAmount.sub(residue);
        uint amount = accounts[account].amount;
        uint balance = amount.sub(bias);
        if (addAmount > balance) {
            //need more, than balance, so need transfer tokens to this
            uint transferAmount = addAmount.sub(balance);
            accounts[account].amount = accounts[account].amount.add(transferAmount);
            require(token.transferFrom(locks[id].account, address(this), transferAmount), "transfer failed");
        }
    }

    uint256[50] private __gap;
}
