// SPDX-License-Identifier: MIT

pragma solidity >=0.6.2 <0.8.0;
pragma abicoder v2;

import "@openzeppelin/contracts-upgradeable/math/SafeMathUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/token/ERC20/IERC20Upgradeable.sol";
import "@rarible/lib-broken-line/contracts/LibBrokenLine.sol";
import "@rarible/lib-broken-line/contracts/LibIntMapping.sol";
import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
import "./INextVersionStake.sol";

contract Staking is OwnableUpgradeable {
    using SafeMathUpgradeable for uint;
    using LibBrokenLine for LibBrokenLine.BrokenLine;

    uint256 constant WEEK = 604800;                         //seconds one week
    uint256 constant STARTING_POINT_WEEK = 2676;            //starting point week (Staking Epoch begining)
    uint256 constant TWO_YEAR_WEEKS = 104;                  //two year weeks
    uint256 constant ST_FORMULA_MULTIPLIER = 1081000;       //stFormula multiplier = TWO_YEAR_WEEKS^2 * 100
    uint256 constant ST_FORMULA_COMPENSATE = 1135050;       //stFormula compensate = (0.7+0.35) * ST_FORMULA_MULTIPLIER
    uint256 constant ST_FORMULA_SLOPE_MULTIPLIER = 465;     //stFormula slope multiplier = 0.93 * 0.5 * 100
    uint256 constant ST_FORMULA_CLIFF_MULTIPLIER = 930;     //stFormula cliff multiplier = 0.93 * 100
    uint256 constant SPLIT_LOCK_MAX_PERCENT = 100;          //max percent 100%

    /**
     * @dev ERC20 token to lock
     */
    IERC20Upgradeable public token;
    /**
     * @dev counter for locks identifiers
     */
    uint public counter;

    /**
     * @dev true if contract entered not working state
     */
    bool private stopped;
    address public migrateTo;               //address migrate to

    /**
     * @dev locker - who locked ERC20 tokens. gelegate - who gets staked tokens
     */
    struct Lockers {
        address locker;
        address delegate;
    }

    /**
     * @dev describes state of user's balance.
     *      balance - broken line describes stake
     *      locked - broken line describes locked user's tokens
     *      amount - total currently locked tokens
     */
    struct Locks {
        LibBrokenLine.BrokenLine balance;
        LibBrokenLine.BrokenLine locked;
        uint amount;
    }

    /**
     * @dev key is user address
     */
    mapping(address => Locks) locks;
    /**
     * @dev key is lock id. value is locker + gelegate
     */
    mapping(uint => Lockers) deposits;
    /**
     * @dev totalSupply broken line
     */
    LibBrokenLine.BrokenLine public totalSupplyLine;

    /**
     * @dev Emitted when create Lock with parameters (account, delegate, amount, slope, cliff)
     */
    event Stake(address account, address delegate, uint amount, uint slope, uint cliff);
    /**
     * @dev Emitted when change Lock parameters (newDelegate, newAmount, newSlope, newCliff) for Lock with given id
     */
    event ReStake(uint id, address newDelegate, uint newAmount, uint newSlope, uint newCliff);
    /**
     * @dev Emitted when to set newDelegate address for Lock with given id
     */
    event Delegate(uint id, address newDelegate);
    /**
     * @dev Emitted when withdraw amount of Rari, account - msg.sender, amount - amount Rari
     */
    event Withdraw(address account, uint amount);
    /**
     * @dev Emitted when migrate Locks with given id, account - msg.sender
     */
    event Migrate(address account, uint[] id);
    /**
     * @dev Emitted when split Locks into two Locks
     */
    event Split(uint id, address delegateFirst, address delegateSecond, uint shareFirst, uint shareSecond);

    function __Staking_init(IERC20Upgradeable _token) external initializer {
        token = _token;
        __Ownable_init_unchained();
    }

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
        require(token.transferFrom(account, address(this), amount), "transfer failed");

        counter++;

        uint blockTime = roundTimestamp(block.timestamp);
        addLines(account, delegate, amount, slope, cliff, blockTime);
        locks[account].amount = locks[account].amount.add(amount);
        emit Stake(account, delegate, amount, slope, cliff);
        return counter;
    }

    function reStake(uint id, address newDelegate, uint newAmount, uint newSlope, uint newCliff) external notStopped returns (uint) {
        address account = deposits[id].locker;
        address delegate = deposits[id].delegate;
        uint blockTime = roundTimestamp(block.timestamp);
        verification(account, id, newAmount, newSlope, newCliff, blockTime);
        removeLines(id, account, delegate, newAmount, blockTime);

        counter++;

        addLines(account, newDelegate, newAmount, newSlope, newCliff, blockTime);
        emit ReStake(id, newDelegate, newAmount, newSlope, newCliff);
        return counter;
    }

    function withdraw() external {
        uint value = locks[msg.sender].amount;
        if (!stopped) {
            uint blockTime = roundTimestamp(block.timestamp);
            locks[msg.sender].locked.update(blockTime);
            uint bias = locks[msg.sender].locked.initial.bias;
            value = value.sub(bias);
        }
        if (value > 0) {
            locks[msg.sender].amount = locks[msg.sender].amount.sub(value);
            require(token.transfer(msg.sender, value), "Failure while transferring, withdraw");
        }
        emit Withdraw(msg.sender, value);
    }

    function depute(uint id, address newDelegate) external notStopped {
        address from = deposits[id].delegate;
        require(from != address(0), "deposit not exists");
        LibBrokenLine.LineData memory lineData = locks[from].balance.initiatedLines[id];
        require(lineData.line.bias != 0, "deposit already finished");
        uint blockTime = roundTimestamp(block.timestamp);
        (uint bias, uint slope, uint cliff) = locks[from].balance.remove(id, blockTime);
        LibBrokenLine.Line memory line = LibBrokenLine.Line(blockTime, bias, slope);
        locks[newDelegate].balance.add(id, line, cliff);
        deposits[id].delegate = newDelegate;
        emit Delegate(id, newDelegate);
    }

    function totalSupply() external returns (uint) {
        if ((totalSupplyLine.initial.bias == 0) || (stopped)) {
            return 0;
        }
        uint blockTime = roundTimestamp(block.timestamp);
        totalSupplyLine.update(blockTime);
        return totalSupplyLine.initial.bias;
    }

    function balanceOf(address account) external returns (uint) {
        if ((locks[account].balance.initial.bias == 0) || (stopped)) {
            return 0;
        }
        uint blockTime = roundTimestamp(block.timestamp);
        locks[account].balance.update(blockTime);
        return locks[account].balance.initial.bias;
    }

    function migrate(uint[] memory id) external {
        if (migrateTo == address(0)) {
            return;
        }
        uint blockTime = roundTimestamp(block.timestamp);
        INextVersionStake nextVersionStake = INextVersionStake(migrateTo);
        for (uint256 i = 0; i < id.length; i++) {
            address account = deposits[id[i]].locker;
            require(msg.sender == account, "Migrate call not from owner id");
            address delegate = deposits[id[i]].delegate;
            LibBrokenLine.LineData memory lineData = locks[account].locked.initiatedLines[id[i]];
            (uint residue,,) = locks[account].locked.remove(id[i], blockTime);

            require(token.transfer(migrateTo, residue), "Failure while transferring in staking migration");
            locks[account].amount = locks[account].amount.sub(residue);

            locks[delegate].balance.remove(id[i], blockTime);
            totalSupplyLine.remove(id[i], blockTime);
            try nextVersionStake.initiateData(id[i], lineData, account, delegate) {
            } catch {
                revert("Contract not support or contain an error in interface INextVersionStake");
            }
        }
        emit Migrate(msg.sender, id);
    }

    function split(uint id, address delegateFirst, address delegateSecond, uint shareFirst, uint shareSecond) external returns (uint idFirst, uint idSecond){
        address account = deposits[id].locker;
        address delegate = deposits[id].delegate;

        require(account != address(0), "deposit not exists");
        require(delegate != address(0), "deposit not exists");      //  TODO need it require?
        require(delegateFirst != address(0), "delegate not exists");
        require(delegateSecond != address(0), "delegate not exists");
        require(shareFirst > 0, "share unacceptable value");
        require(shareSecond > 0, "share unacceptable value");
        require(shareSecond.add(shareSecond) == SPLIT_LOCK_MAX_PERCENT, "share unacceptable values");

        uint blockTime = roundTimestamp(block.timestamp);
        LibBrokenLine.Line memory line;
        line.start = blockTime;
        uint cliff;
        (line.bias, line.slope, cliff) = locks[account].locked.remove(id, blockTime);
        require(line.bias > 0, "deposit finished, nothing to split");
        locks[account].amount = locks[account].amount.sub(line.bias);
        locks[delegate].balance.remove(id, blockTime);
        totalSupplyLine.remove(id, blockTime);
        deposits[id].locker = address(0); //  TODO need it?
        deposits[id].delegate = address(0); //  TODO need it?

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
        locks[account].amount = locks[account].amount.add(newAmount);
        newId = counter;
    }

    function verification(address account, uint id, uint newAmount, uint newSlope, uint newCliff, uint toTime) internal view {
        require(account != address(0), "Line with id already deleted");
        require(newAmount > 0, "Lock amount Rari mast be > 0");
        require(newCliff <= TWO_YEAR_WEEKS, "Cliff period more, than two years");
        uint period = newAmount.div(newSlope);
        require(period <= TWO_YEAR_WEEKS, "Slope period more, than two years");
        uint end = toTime.add(newCliff).add(period);
        LibBrokenLine.LineData memory lineData = locks[account].locked.initiatedLines[id];
        LibBrokenLine.Line memory line = lineData.line;
        uint oldPeriod = line.bias.div(line.slope);
        uint oldEnd = line.start.add(lineData.cliff).add(oldPeriod);
        require(oldEnd <= end, "New line period stake too short");
    }

    function removeLines(uint id, address account, address delegate, uint newAmount, uint toTime) internal {
        uint bias = locks[account].locked.initial.bias;
        uint balance = locks[account].amount.sub(bias);
        (uint residue,,) = locks[account].locked.remove(id, toTime);
        //original: (uint residue, uint slope), but slope not need here
        require(residue <= newAmount, "Impossible to restake: less amount, then now is");

        uint addAmount = newAmount.sub(residue);
        if (addAmount > balance) {//need more, than balance, so need transfer ERC20 to this
            require(token.transferFrom(deposits[id].locker, address(this), addAmount.sub(balance)), "Failure while transferring");
            locks[account].amount = locks[account].amount.sub(residue);
            locks[account].amount = locks[account].amount.add(newAmount);
        }
        locks[delegate].balance.remove(id, toTime);
        totalSupplyLine.remove(id, toTime);
    }

    function addLines(address account, address delegate, uint amount, uint slope, uint cliff, uint blockTime) internal {
        (uint stAmount, uint stSlope) = getStake(amount, slope, cliff);
        LibBrokenLine.Line memory line = LibBrokenLine.Line(blockTime, stAmount, stSlope);
        totalSupplyLine.add(counter, line, cliff);
        locks[delegate].balance.add(counter, line, cliff);
        line = LibBrokenLine.Line(blockTime, amount, slope);
        locks[account].locked.add(counter, line, cliff);
        deposits[counter].locker = account;
        deposits[counter].delegate = delegate;
    }

    //original formula: (0,7+9,3*(cliffPeriod/104)^2+0,5*(0,7+9,3*(slopePeriod/104)^2))
    //calculate and return (newAmount, newSlope), using formula k=((1135050+930*(cliffPeriod)^2+465*(slopePeriod)^2)/1081000, newAmount=k*amount
    function getStake(uint amount, uint slope, uint cliff) internal pure returns (uint stakeAmount, uint stakeSlope) {
        uint cliffSide = cliff.mul(cliff).mul(ST_FORMULA_CLIFF_MULTIPLIER);

        uint slopePeriod = amount.div(slope);
        uint slopeSide = slopePeriod.mul(slopePeriod).mul(ST_FORMULA_SLOPE_MULTIPLIER);
        uint multiplier = cliffSide.add(slopeSide).add(ST_FORMULA_COMPENSATE).div(ST_FORMULA_MULTIPLIER);
        stakeAmount = amount.mul(multiplier);
        stakeSlope = stakeAmount.div(slopePeriod);
    }

    function roundTimestamp(uint ts) pure internal returns (uint) {
        return ts.div(WEEK).sub(STARTING_POINT_WEEK);
    }

    /**
     * @dev Throws if stopped
     */
    modifier notStopped() {
        require(!stopped, "stopped");
        _;
    }
}