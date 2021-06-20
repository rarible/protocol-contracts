// SPDX-License-Identifier: MIT

pragma solidity ^0.7.0;
pragma abicoder v2;

import "./StakingBase.sol";

contract StakingRestake is StakingBase {
    using SafeMathUpgradeable for uint;
    using LibBrokenLine for LibBrokenLine.BrokenLine;

    function restake(uint id, address newDelegate, uint newAmount, uint newSlope, uint newCliff) external notStopped returns (uint) {
        address account = verifyStakeOwner(id);
        uint time = roundTimestamp(block.timestamp);
        verification(account, id, newAmount, newSlope, newCliff, time);

        uint bias = accounts[account].locked.initial.bias;
        uint balance = accounts[account].amount.sub(bias);

        address delegate = stakes[id].delegate;
        uint residue = removeLines(id, account, delegate, time);
        rebalance(id, account, residue, newAmount, balance);

        counter++;

        addLines(account, newDelegate, newAmount, newSlope, newCliff, time);
        emit Restake(id, newDelegate, time, newAmount, newSlope, newCliff);
        return counter;
    }

    /**
     * @dev Verification parameters:
     *      1. amount > 0, slope > 0
     *      2. cliff period and slope period less or equal two years
     *      3. newFinishTime more or equal noldFinishTime
     */
    function verification(address account, uint id, uint newAmount, uint newSlope, uint newCliff, uint toTime) internal view {
        require(newAmount > 0, "zero amount");
        require(newCliff <= TWO_YEAR_WEEKS, "cliff too big");
        uint period = newAmount.div(newSlope);
        require(period <= TWO_YEAR_WEEKS, "slope too big");
        uint newEnd = toTime.add(newCliff).add(period);
        LibBrokenLine.LineData memory lineData = accounts[account].locked.initiatedLines[id];
        LibBrokenLine.Line memory line = lineData.line;
        period = line.bias.div(line.slope);
        uint oldEnd = line.start.add(lineData.cliff).add(period);
        require(oldEnd <= newEnd, "new line period stake too short");
    }

    function removeLines(uint id, address account, address delegate, uint toTime) internal returns (uint residue) {
        accounts[delegate].balance.remove(id, toTime);
        totalSupplyLine.remove(id, toTime);
        (residue,,) = accounts[account].locked.remove(id, toTime);
    }

    function rebalance(uint id, address account, uint residue, uint newAmount, uint balance) internal {
        require(residue <= newAmount, "Impossible to restake: less amount, then now is");
        uint addAmount = newAmount.sub(residue);
        if (addAmount > balance) {
            uint transferAmount = addAmount.sub(balance);    //need more, than balance, so need transfer tokens to this
            require(token.transferFrom(stakes[id].account, address(this), transferAmount), "transfer failed");
            accounts[account].amount = accounts[account].amount.add(transferAmount);
        }
    }
}
