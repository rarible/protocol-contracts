// SPDX-License-Identifier: MIT

pragma solidity >=0.6.2 <0.8.0;
pragma abicoder v2;

import "./INextVersionStake.sol";
import "./StakingBase.sol";
import "./StakingRestake.sol";

contract Staking is StakingBase, StakingRestake {
    using SafeMathUpgradeable for uint;
    using LibBrokenLine for LibBrokenLine.BrokenLine;

    function stop() external onlyOwner notStopped {
        stopped = true;
    }

    function startMigration(address to) external onlyOwner {
        migrateTo = to;
    }

    function stake(address account, address delegate, uint amount, uint slope, uint cliff) external notStopped returns (uint) {
        require(amount > 0, "amount negative");
        require(cliff <= TWO_YEAR_WEEKS, "cliff too big");
        require(amount.div(slope) <= TWO_YEAR_WEEKS, "period too big");
        require(token.transferFrom(msg.sender, address(this), amount), "transfer failed");

        counter++;

        uint time = roundTimestamp(block.timestamp);
        addLines(account, delegate, amount, slope, cliff, time);
        accounts[account].amount = accounts[account].amount.add(amount);
        emit StakeCreate(counter, account, delegate, time, amount, slope, cliff);
        return counter;
    }

    function withdraw() external {
        uint value = accounts[msg.sender].amount;
        if (!stopped) {
            uint time = roundTimestamp(block.timestamp);
            accounts[msg.sender].locked.update(time);
            uint bias = accounts[msg.sender].locked.initial.bias;
            value = value.sub(bias);
        }
        if (value > 0) {
            accounts[msg.sender].amount = accounts[msg.sender].amount.sub(value);
            require(token.transfer(msg.sender, value), "Failure while transferring, withdraw");
        }
        emit Withdraw(msg.sender, value);
    }

    function delegateTo(uint id, address newDelegate) external notStopped {
        verifyStakeOwner(id);
        address from = stakes[id].delegate;
        require(from != address(0), "deposit not exists");
        LibBrokenLine.LineData memory lineData = accounts[from].balance.initiatedLines[id];
        require(lineData.line.bias != 0, "deposit already finished");
        uint time = roundTimestamp(block.timestamp);
        (uint bias, uint slope, uint cliff) = accounts[from].balance.remove(id, time);
        LibBrokenLine.Line memory line = LibBrokenLine.Line(time, bias, slope);
        accounts[newDelegate].balance.add(id, line, cliff);
        stakes[id].delegate = newDelegate;
        emit Delegate(id, newDelegate, time);
    }

    function totalSupply() external returns (uint) {
        if ((totalSupplyLine.initial.bias == 0) || (stopped)) {
            return 0;
        }
        uint time = roundTimestamp(block.timestamp);
        totalSupplyLine.update(time);
        return totalSupplyLine.initial.bias;
    }

    function balanceOf(address account) external returns (uint) {
        if ((accounts[account].balance.initial.bias == 0) || (stopped)) {
            return 0;
        }
        uint time = roundTimestamp(block.timestamp);
        accounts[account].balance.update(time);
        return accounts[account].balance.initial.bias;
    }

    function migrate(uint[] memory id) external {
        if (migrateTo == address(0)) {
            return;
        }
        uint time = roundTimestamp(block.timestamp);
        INextVersionStake nextVersionStake = INextVersionStake(migrateTo);
        for (uint256 i = 0; i < id.length; i++) {
            address account = verifyStakeOwner(id[i]);
            address delegate = stakes[id[i]].delegate;
            LibBrokenLine.LineData memory lineData = accounts[account].locked.initiatedLines[id[i]];
            (uint residue,,) = accounts[account].locked.remove(id[i], time);

            require(token.transfer(migrateTo, residue), "Failure while transferring in staking migration");
            accounts[account].amount = accounts[account].amount.sub(residue);

            accounts[delegate].balance.remove(id[i], time);
            totalSupplyLine.remove(id[i], time);
            try nextVersionStake.initiateData(id[i], lineData, account, delegate) {
            } catch {
                revert("Contract not support or contain an error in interface INextVersionStake");
            }
        }
        emit Migrate(msg.sender, id);
    }
}