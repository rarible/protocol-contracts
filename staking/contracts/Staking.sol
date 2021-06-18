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

    /**
     * @dev ERC20 token to lock
     */
    IERC20Upgradeable public token;
    /**
     * @dev counter for Stake identifiers
     */
    uint public counter;

    /**
     * @dev true if contract entered stopped state
     */
    bool private stopped;
    /**
     * @dev address to migrate Stakes to (zero if not in migration state)
     */
    address public migrateTo;

    /**
     * @dev represents one user Stake
     */
    struct Stake {
        address account;
        address delegate;
    }

    /**
     * @dev describes state of accounts's balance.
     *      balance - broken line describes stake
     *      locked - broken line describes how many tokens are locked
     *      amount - total currently locked tokens (including tokens which can be withdrawed)
     */
    struct Account {
        LibBrokenLine.BrokenLine balance;
        LibBrokenLine.BrokenLine locked;
        uint amount;
    }

    mapping(address => Account) accounts;
    mapping(uint => Stake) stakes;
    LibBrokenLine.BrokenLine public totalSupplyLine;

    /**
     * @dev Emitted when create Lock with parameters (account, delegate, amount, slope, cliff)
     */
    event StakeCreate(uint indexed id, address indexed account, address indexed delegate, uint time, uint amount, uint slope, uint cliff);
    /**
     * @dev Emitted when change Lock parameters (newDelegate, newAmount, newSlope, newCliff) for Lock with given id
     */
    event Restake(uint indexed id, address indexed delegate, uint time, uint amount, uint slope, uint cliff);
    /**
     * @dev Emitted when to set newDelegate address for Lock with given id
     */
    event Delegate(uint indexed id, address indexed delegate, uint time);
    /**
     * @dev Emitted when withdraw amount of Rari, account - msg.sender, amount - amount Rari
     */
    event Withdraw(address indexed account, uint amount);
    /**
     * @dev Emitted when migrate Locks with given id, account - msg.sender
     */
    event Migrate(address indexed account, uint[] id);

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

        uint time = roundTimestamp(block.timestamp);
        addLines(account, delegate, amount, slope, cliff, time);
        accounts[account].amount = accounts[account].amount.add(amount);
        emit StakeCreate(counter, account, delegate, time, amount, slope, cliff);
        return counter;
    }

    function restake(uint id, address newDelegate, uint newAmount, uint newSlope, uint newCliff) external notStopped returns (uint) {
        address account = stakes[id].account;
        address delegate = stakes[id].delegate;
        uint time = roundTimestamp(block.timestamp);
        verification(account, id, newAmount, newSlope, newCliff, time);
        removeLines(id, account, delegate, newAmount, time);

        counter++;

        addLines(account, newDelegate, newAmount, newSlope, newCliff, time);
        emit Restake(id, newDelegate, time, newAmount, newSlope, newCliff);
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
            address account = stakes[id[i]].account;
            require(msg.sender == account, "Migrate call not from owner id");
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

    function removeLines(uint id, address account, address delegate, uint newAmount, uint toTime) internal {
        uint bias = accounts[account].locked.initial.bias;
        uint balance = accounts[account].amount.sub(bias);
        (uint residue,,) = accounts[account].locked.remove(id, toTime);
        //original: (uint residue, uint slope), but slope not need here
        require(residue <= newAmount, "Impossible to restake: less amount, then now is");

        uint addAmount = newAmount.sub(residue);
        if (addAmount > balance) {//need more, than balance, so need transfer ERC20 to this
            require(token.transferFrom(stakes[id].account, address(this), addAmount.sub(balance)), "Failure while transferring");
            accounts[account].amount = accounts[account].amount.sub(residue);
            accounts[account].amount = accounts[account].amount.add(newAmount);
        }
        accounts[delegate].balance.remove(id, toTime);
        totalSupplyLine.remove(id, toTime);
    }

    function addLines(address account, address delegate, uint amount, uint slope, uint cliff, uint time) internal {
        (uint stAmount, uint stSlope) = getStake(amount, slope, cliff);
        LibBrokenLine.Line memory line = LibBrokenLine.Line(time, stAmount, stSlope);
        totalSupplyLine.add(counter, line, cliff);
        accounts[delegate].balance.add(counter, line, cliff);
        line = LibBrokenLine.Line(time, amount, slope);
        accounts[account].locked.add(counter, line, cliff);
        stakes[counter].account = account;
        stakes[counter].delegate = delegate;
    }

    //original formula: (0,7+9,3*(cliffPeriod/104)^2+0,5*(0,7+9,3*(slopePeriod/104)^2))
    //calculate and return (newAmount, newSlope), using formula k=((1135050+930*(cliffPeriod)^2+465*(slopePeriod)^2)/1081000, newAmount=k*amount
    function getStake(uint amount, uint slope, uint cliff) internal pure returns (uint stakeAmount, uint stakeSlope) {
        uint cliffSide = cliff.mul(cliff).mul(ST_FORMULA_CLIFF_MULTIPLIER);

        uint slopePeriod = amount.div(slope);
        uint slopeSide = slopePeriod.mul(slopePeriod).mul(ST_FORMULA_SLOPE_MULTIPLIER);
        uint multiplier = cliffSide.add(slopeSide).add(ST_FORMULA_COMPENSATE).div(ST_FORMULA_MULTIPLIER);
        stakeAmount = amount.mul(multiplier);
        stakeSlope = slope.mul(multiplier);
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