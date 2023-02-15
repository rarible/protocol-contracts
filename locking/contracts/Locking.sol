// SPDX-License-Identifier: MIT

pragma solidity 0.7.6;
pragma abicoder v2;

import "./INextVersionLock.sol";
import "./LockingBase.sol";
import "./LockingRelock.sol";
import "./LockingVotes.sol";
import "./ILocking.sol";

contract Locking is ILocking, LockingBase, LockingRelock, LockingVotes {
    using SafeMathUpgradeable96 for uint96;
    using SafeMathUpgradeable32 for uint32;

    using LibBrokenLine for LibBrokenLine.BrokenLine;

    function __Locking_init(IERC20Upgradeable _token, uint32 _startingPointWeek, uint32 _minCliffPeriod, uint32 _minSlopePeriod) external initializer {
        __LockingBase_init_unchained(_token, _startingPointWeek, _minCliffPeriod, _minSlopePeriod);
        __Ownable_init_unchained();
        __Context_init_unchained();
    }

    function stop() external onlyOwner notStopped {
        stopped = true;
        emit StopLocking(msg.sender);
    }

    function start() external onlyOwner isStopped {
        stopped = false;
        emit StartLocking(msg.sender);
    }

    function startMigration(address to) external onlyOwner {
        migrateTo = to;
        emit StartMigration(msg.sender, to);
    }

    function lock(address account, address _delegate, uint96 amount, uint32 slopePeriod, uint32 cliff) external notStopped notMigrating override returns (uint) {
        require(amount > 0, "zero amount");
        require(cliff <= MAX_CLIFF_PERIOD, "cliff too big");
        require(slopePeriod <= MAX_SLOPE_PERIOD, "period too big");

        counter++;

        uint32 currentBlock = getBlockNumber();
        uint32 time = roundTimestamp(currentBlock);
        addLines(account, _delegate, amount, slopePeriod, cliff, time, currentBlock);
        accounts[account].amount = accounts[account].amount.add(amount);

        require(token.transferFrom(msg.sender, address(this), amount), "transfer failed");

        emit LockCreate(counter, account, _delegate, time, amount, slopePeriod, cliff);
        return counter;
    }

    function withdraw() external {
        uint96 value = getAvailableForWithdraw(msg.sender);
        if (value > 0) {
            accounts[msg.sender].amount = accounts[msg.sender].amount.sub(value);
            require(token.transfer(msg.sender, value), "transfer failed");
        }
        emit Withdraw(msg.sender, value);
    }

    // Amount available for withdrawal
    function getAvailableForWithdraw(address account) public view returns (uint96) {
        uint96 value = accounts[account].amount;
        if (!stopped) {
            uint32 currentBlock = getBlockNumber();
            uint32 time = roundTimestamp(currentBlock);
            uint96 bias = accounts[account].locked.actualValue(time, currentBlock);
            value = value.sub(bias);
        }
        return value;
    }

    //Remaining locked amount
    function locked(address account) external view returns (uint) {
        return accounts[account].amount;
    }

    //For a given Line id, the owner and delegate addresses.
    function getAccountAndDelegate(uint id) external view returns (address _account, address _delegate) {
        _account = locks[id].account;
        _delegate = locks[id].delegate;
    }

    //Getting "current week" of the contract.
    function getWeek() external view returns (uint) {
        return roundTimestamp(getBlockNumber());
    }

    function delegateTo(uint id, address newDelegate) external notStopped notMigrating {
        address account = verifyLockOwner(id);
        address _delegate = locks[id].delegate;
        uint32 currentBlock = getBlockNumber();
        uint32 time = roundTimestamp(currentBlock);
        accounts[_delegate].balance.update(time);
        (uint96 bias, uint96 slope, uint32 cliff) = accounts[_delegate].balance.remove(id, time, currentBlock);
        LibBrokenLine.Line memory line = LibBrokenLine.Line(time, bias, slope, cliff);
        accounts[newDelegate].balance.update(time);
        accounts[newDelegate].balance.addOneLine(id, line, currentBlock);
        locks[id].delegate = newDelegate;
        emit Delegate(id, account, newDelegate, time);

    }

    function totalSupply() external view returns (uint) {
        if ((totalSupplyLine.initial.bias == 0) || (stopped)) {
            return 0;
        }
        uint32 currentBlock = getBlockNumber();
        uint32 time = roundTimestamp(currentBlock);
        return totalSupplyLine.actualValue(time, currentBlock);
    }

    function balanceOf(address account) external view returns (uint) {
        if ((accounts[account].balance.initial.bias == 0) || (stopped)) {
            return 0;
        }
        uint32 currentBlock = getBlockNumber();
        uint32 time = roundTimestamp(currentBlock);
        return accounts[account].balance.actualValue(time, currentBlock);
    }

    function migrate(uint[] memory id) external {
        if (migrateTo == address(0)) {
            return;
        }
        uint32 currentBlock = getBlockNumber();
        uint32 time = roundTimestamp(currentBlock);
        INextVersionLock nextVersionLock = INextVersionLock(migrateTo);
        for (uint256 i = 0; i < id.length; ++i) {
            address account = verifyLockOwner(id[i]);
            address _delegate = locks[id[i]].delegate;
            updateLines(account, _delegate, time);
            //save data Line before remove
            LibBrokenLine.Line memory line = accounts[account].locked.initiatedLines[id[i]];
            (uint96 residue,,) = accounts[account].locked.remove(id[i], time, currentBlock);

            accounts[account].amount = accounts[account].amount.sub(residue);

            accounts[_delegate].balance.remove(id[i], time, currentBlock);
            totalSupplyLine.remove(id[i], time, currentBlock);
            nextVersionLock.initiateData(id[i], line, account, _delegate);

            require(token.transfer(migrateTo, residue), "transfer failed");
        }
        emit Migrate(msg.sender, id);
    }

    function name() public view virtual returns (string memory) {
        return "Rarible Vote-Escrow";
    }

    function symbol() public view virtual returns (string memory) {
        return "veRARI";
    }

    function decimals() public view virtual returns (uint8) {
        return 18;
    }

    uint256[50] private __gap;
}