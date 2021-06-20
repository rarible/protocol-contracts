// SPDX-License-Identifier: MIT

pragma solidity ^0.7.0;
pragma abicoder v2;

import "./StakingBase.sol";

contract StakingRestake is StakingBase {
    using SafeMathUpgradeable for uint;
    using LibBrokenLine for LibBrokenLine.BrokenLine;

    function restake(uint id, address newDelegate, uint newAmount, uint newSlope, uint newCliff) external notStopped returns (uint) {
        address account = stakes[id].account;
        require(account == msg.sender, "call not from owner id");
        address delegate = stakes[id].delegate;
        uint time = roundTimestamp(block.timestamp);
        verification(account, id, newAmount, newSlope, newCliff, time);

        uint bias = accounts[account].locked.initial.bias;
        uint balance = accounts[account].amount.sub(bias);

        uint residue = removeLines(id, account, delegate, time);
        rebalance(id, account, residue, newAmount, balance);

        counter++;

        addLines(account, newDelegate, newAmount, newSlope, newCliff, time);
        emit Restake(id, newDelegate, time, newAmount, newSlope, newCliff);
        return counter;
    }

    function verification(address account, uint id, uint newAmount, uint newSlope, uint newCliff, uint toTime) internal view {
        require(account != address(0), "Line with id already deleted");
        require(newAmount > 0, "Lock amount Rari mast be > 0");
        require(newCliff <= TWO_YEAR_WEEKS, "Cliff period more, than two years");
        uint period = newAmount.div(newSlope);
        require(period <= TWO_YEAR_WEEKS, "Slope period more, than two years");
        uint end = toTime.add(newCliff).add(period);
        LibBrokenLine.LineData memory lineData = accounts[account].locked.initiatedLines[id];
        LibBrokenLine.Line memory line = lineData.line;
        uint oldPeriod = line.bias.div(line.slope);
        uint oldEnd = line.start.add(lineData.cliff).add(oldPeriod);
        require(oldEnd <= end, "New line period stake too short");
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
            require(token.transferFrom(stakes[id].account, address(this), transferAmount), "Failure while transferring");
            accounts[account].amount = accounts[account].amount.add(transferAmount);
        }
    }
}
