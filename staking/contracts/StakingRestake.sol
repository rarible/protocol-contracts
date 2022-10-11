// SPDX-License-Identifier: MIT

pragma solidity 0.7.6;
pragma abicoder v2;

import "./StakingBase.sol";

abstract contract StakingRestake is StakingBase {
    using SafeMathUpgradeable for uint;
    using LibBrokenLine for LibBrokenLine.BrokenLine;

    function restake(uint id, address newDelegate, uint newAmount, uint newSlope, uint newCliff) external notStopped notMigrating returns (uint) {
        address account = verifyStakeOwner(id);
        uint time = roundTimestamp(getBlockNumber());
        verification(account, id, newAmount, newSlope, newCliff, time);

        address delegate = stakes[id].delegate;
        accounts[account].locked.update(time);

        rebalance(id, account, accounts[account].locked.initial.bias, removeLines(id, account, delegate, time), newAmount);

        counter++;

        addLines(account, newDelegate, newAmount, newSlope, newCliff, time);
        emit Restake(id, account, newDelegate, counter, time, newAmount, newSlope, newCliff);

        // IVotesUpgradeable events
        emit DelegateChanged(account, delegate, newDelegate);
        emit DelegateVotesChanged(delegate, 0, accounts[delegate].balance.actualValue(time));
        emit DelegateVotesChanged(newDelegate, 0, accounts[newDelegate].balance.actualValue(time));

        return counter;
    }

    /**
     * @dev Verification parameters:
     *      1. amount > 0, slope > 0
     *      2. cliff period and slope period less or equal two years
     *      3. newFinishTime more or equal oldFinishTime
     */
    function verification(address account, uint id, uint newAmount, uint newSlope, uint newCliff, uint toTime) internal view {
        require(newAmount > 0, "zero amount");
        require(newCliff <= MAX_CLIFF_PERIOD, "cliff too big");
        uint period = divUp(newAmount, newSlope);
        require(period <= MAX_SLOPE_PERIOD, "slope too big");
        uint newEnd = toTime.add(newCliff).add(period);
        LibBrokenLine.LineData memory lineData = accounts[account].locked.initiatedLines[id];
        LibBrokenLine.Line memory line = lineData.line;
        period = divUp(line.bias, line.slope);
        uint oldEnd = line.start.add(lineData.cliff).add(period);
        require(oldEnd <= newEnd, "new line period stake too short");
        //check Line with new parameters don`t cut corner old Line
        uint oldCliffEnd = line.start.add(lineData.cliff);
        uint newCliffEnd = toTime.add(newCliff);
        if (oldCliffEnd > newCliffEnd) {
            uint balance = oldCliffEnd.sub(newCliffEnd);
            uint oldBias = line.bias;
            uint newBias = newAmount.sub(balance.mul(newSlope));
            require(newBias >= oldBias, "detect cut deposit corner");
        }
    }

    function removeLines(uint id, address account, address delegate, uint toTime) internal returns (uint residue) {
        updateLines(account, delegate, toTime);
        accounts[delegate].balance.remove(id, toTime);
        totalSupplyLine.remove(id, toTime);
        (residue,,) = accounts[account].locked.remove(id, toTime);
    }

    function rebalance(uint id, address account, uint bias, uint residue, uint newAmount) internal {
        require(residue <= newAmount, "Impossible to restake: less amount, then now is");
        uint addAmount = newAmount.sub(residue);
        uint amount = accounts[account].amount;
        uint balance = amount.sub(bias);
        if (addAmount > balance) {
            //need more, than balance, so need transfer tokens to this
            uint transferAmount = addAmount.sub(balance);
            require(token.transferFrom(stakes[id].account, address(this), transferAmount), "transfer failed");
            accounts[account].amount = accounts[account].amount.add(transferAmount);
        }
    }

    uint256[50] private __gap;
}
