// SPDX-License-Identifier: MIT

pragma solidity >=0.6.2 <0.8.0;
pragma abicoder v2;

import "@openzeppelin/contracts-upgradeable/math/SafeMathUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/token/ERC20/ERC20Upgradeable.sol";
import "@rarible/lib-broken-line/contracts/LibBrokenLine.sol";
import "@rarible/lib-broken-line/contracts/LibIntMapping.sol";
import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
import "./INextVersionStake.sol";

contract Staking is OwnableUpgradeable{
    using SafeMathUpgradeable for uint;
    using LibBrokenLine for LibBrokenLine.BrokenLine;

    uint256 constant WEEK = 604800;                         //seconds one week
    uint256 constant STARTING_POINT_WEEK = 2676;            //starting point week (Staking Epoch begining)
    uint256 constant TWO_YEAR_WEEKS = 104;                  //two year weeks
    uint256 constant ST_FORMULA_MULTIPLIER = 1081000;       //stFormula multiplier = TWO_YEAR_WEEKS^2 * 100
    uint256 constant ST_FORMULA_COMPENSATE = 1135050;       //stFormula compensate = (0.7+0.35) * ST_FORMULA_MULTIPLIER
    uint256 constant ST_FORMULA_SLOPE_MULTIPLIER = 465;     //stFormula slope multiplier = 0.93 * 0.5 * 100
    uint256 constant ST_FORMULA_CLIFF_MULTIPLIER = 930;     //stFormula cliff multiplier = 0.93 * 100
    ERC20Upgradeable public token;
    bool private stopLock;                  //flag stop locking. Extremely situation stop execution contract methods, allow withdraw()
    uint public id;                         //id Line, successfully added to BrokenLine
    address public migrateTo;               //address migrate to

    struct Lockers {                        //initiate addresses, user (or contract), who locks and whom delegate
        address locker;                     //locker address (lock creator)
        address delegate;                   //delegate address (delegate creator)
    }

    struct Locks {
        LibBrokenLine.BrokenLine balance;   //line of stRari balance
        LibBrokenLine.BrokenLine locked;    //locked amount (RARI)
        uint amount;                        //user RARI (lockedAmount + amountready for transferBack)
    }

    mapping (address => Locks) locks;                   //address User - Lock
    mapping (uint => Lockers) deposits;                 //idLock address User
    LibBrokenLine.BrokenLine public totalSupplyLine;    //total stRARI balance

    function __Staking_init(ERC20Upgradeable _token) external initializer {
        token = _token;
        __Ownable_init_unchained();
    }

    function setStopLock(bool value) external onlyOwner{
        stopLock = value;
    }

    function startMigration(address to) external onlyOwner {
        migrateTo = to;
    }

    function stopMigration() external onlyOwner {
        migrateTo = address(0);
    }

    function stake(address account, address delegator, uint amount, uint slope, uint cliff) external returns (uint) {
        if (stopLock) {
            return 0;
        }
        require(amount > 0, "Lock amount Rari mast be > 0");
        require(cliff <= TWO_YEAR_WEEKS, "Cliff period more, than two years");
        require(amount.div(slope) <= TWO_YEAR_WEEKS, "Slope period more, than two years");

        uint blockTime = roundTimestamp(block.timestamp);
        (uint stAmount, uint stSlope) = getStake(amount, slope, cliff);
        LibBrokenLine.Line memory line = LibBrokenLine.Line(blockTime, stAmount, stSlope);
        id++;
        totalSupplyLine.add(id, line, cliff);
        locks[delegator].balance.add(id, line, cliff);
        line = LibBrokenLine.Line(blockTime, amount, slope);
        locks[account].locked.add(id, line, cliff);
        deposits[id].locker = account;
        deposits[id].delegate = delegator;
        locks[account].amount = locks[account].amount.add(amount);
        require(token.transferFrom(account, address(this), amount), "Failure while transferring, while stake");
        return id;
    }

    function reStake(uint idLock, address newDelegator, uint newAmount, uint newSlope, uint newCliff) external returns (uint) {
        if (stopLock) {
            return 0;
        }
        address account = deposits[idLock].locker;
        address delegator = deposits[idLock].delegate;
        uint blockTime = roundTimestamp(block.timestamp);
        verification(account, idLock, newAmount, newSlope, newCliff, blockTime);
        removeLines(idLock, account, delegator, newAmount, blockTime);
        return addLines(account, newDelegator, newAmount, newSlope, newCliff, blockTime);
    }

    function withdraw() external {
        uint blockTime = roundTimestamp(block.timestamp);
        locks[msg.sender].locked.update(blockTime);
        uint value = locks[msg.sender].amount;
        if (!stopLock) {
            uint bias = locks[msg.sender].locked.initial.bias;
            value = value.sub(bias);
        }
        if (value > 0) {
            locks[msg.sender].amount = locks[msg.sender].amount.sub(value);
            require(token.transfer(msg.sender, value), "Failure while transferring, withdraw");
        }
    }

    function delegate(uint idLock, address newDelegator) external {
        if (stopLock) {
            return;
        }
        address from = deposits[idLock].delegate;
        require(from != address(0), "Delegate from address by idLock not found");
        LibBrokenLine.LineData memory lineData = locks[from].balance.initiatedLines[idLock];
        require(lineData.line.bias != 0, "Line already finished nothing to delegate");
        uint blockTime = roundTimestamp(block.timestamp);
        (uint bias, uint slope) = locks[from].balance.remove(idLock, blockTime);
        LibBrokenLine.Line memory line = LibBrokenLine.Line(blockTime, bias, slope);
        uint cliff = lineData.cliff;
        locks[newDelegator].balance.add(idLock, line, cliff);
        deposits[idLock].delegate = newDelegator;
    }

    function totalSupply() external returns (uint) {
        if ((totalSupplyLine.initial.bias == 0) || (stopLock)) {
            return 0;
        }
        uint blockTime = roundTimestamp(block.timestamp);
        totalSupplyLine.update(blockTime);
        return totalSupplyLine.initial.bias;
    }

    function balanceOf(address account) external returns (uint) {
        if ((locks[account].balance.initial.bias == 0) || (stopLock)) {
            return 0;
        }
        uint blockTime = roundTimestamp(block.timestamp);
        locks[account].balance.update(blockTime);
        return locks[account].balance.initial.bias;
    }

    function migrate(uint[] memory idLock) external {
        if (migrateTo == address(0)) {
            return;
        }
        uint blockTime = roundTimestamp(block.timestamp);
        INextVersionStake nextVersionStake = INextVersionStake(migrateTo);
        for (uint256 i = 0; i < idLock.length; i++) {
            address account = deposits[idLock[i]].locker;
            require(msg.sender == account, "Migrate call not from owner idLock");
            address delegator = deposits[idLock[i]].delegate;
            LibBrokenLine.LineData memory lineData = locks[account].locked.initiatedLines[idLock[i]];
            (uint residue, ) = locks[account].locked.remove(idLock[i], blockTime);

            require(token.transfer(migrateTo, residue), "Failure while transferring in staking migration");
            locks[account].amount = locks[account].amount.sub(residue);

            locks[delegator].balance.remove(idLock[i], blockTime);
            totalSupplyLine.remove(idLock[i], blockTime);
            try nextVersionStake.initiateData(idLock[i], lineData, account, delegator) {
            } catch {
                revert("Contract not support or contain an error in interface INextVersionStake");
            }
        }
    }

    function verification(address account, uint idLock, uint newAmount, uint newSlope, uint newCliff, uint toTime) internal view {
        require(account != address(0), "Line with idLock already deleted");
        require(newAmount > 0, "Lock amount Rari mast be > 0");
        require(newCliff <= TWO_YEAR_WEEKS, "Cliff period more, than two years");
        uint period = newAmount.div(newSlope);
        require(period <= TWO_YEAR_WEEKS, "Slope period more, than two years");
        uint end = toTime.add(newCliff).add(period);
        LibBrokenLine.LineData memory lineData = locks[account].locked.initiatedLines[idLock];
        LibBrokenLine.Line memory line = lineData.line;
        uint oldPeriod = line.bias.div(line.slope);
        uint oldEnd = line.start.add(lineData.cliff).add(oldPeriod);
        require(oldEnd <= end, "New line period stake too short");
    }

    function removeLines(uint idLock, address account, address delegator, uint newAmount, uint toTime) internal {
        uint bias = locks[account].locked.initial.bias;
        uint balance = locks[account].amount.sub(bias);
        (uint residue, ) = locks[account].locked.remove(idLock, toTime);        //original: (uint residue, uint slope), but slope not need here
        require(residue <= newAmount, "Impossible to restake: less amount, then now is");

        uint addAmount = newAmount.sub(residue);
        if (addAmount > balance) { //need more, than balance, so need transfer ERC20 to this
            require(token.transferFrom(deposits[idLock].locker, address(this), addAmount.sub(balance)), "Failure while transferring");
            locks[account].amount = locks[account].amount.sub(residue);
            locks[account].amount = locks[account].amount.add(newAmount);
        }
        locks[delegator].balance.remove(idLock, toTime);
        totalSupplyLine.remove(idLock, toTime);
    }

    function addLines(address account, address newDelegator, uint newAmount, uint newSlope, uint newCliff, uint blockTime) internal returns (uint) {
        (uint stAmount, uint stSlope) = getStake(newAmount, newSlope, newCliff);
        LibBrokenLine.Line memory line = LibBrokenLine.Line(blockTime, stAmount, stSlope);
        id++;
        totalSupplyLine.add(id, line, newCliff);
        locks[newDelegator].balance.add(id, line, newCliff);
        line = LibBrokenLine.Line(blockTime, newAmount, newSlope);
        locks[account].locked.add(id, line, newCliff);
        deposits[id].locker = account;
        deposits[id].delegate = newDelegator;
        return id;
    }

    //original formula: (0,7+9,3*(cliffPeriod/104)^2+0,5*(0,7+9,3*(slopePeriod/104)^2))
    //calculate and return (newAmount, newSlope), using formula k=((1135050+930*(cliffPeriod)^2+465*(slopePeriod)^2)/1081000, newAmount=k*amount
    function getStake(uint amount, uint slope, uint cliff) internal pure returns (uint, uint) {
        uint cliffSide = cliff.mul(cliff).mul(ST_FORMULA_CLIFF_MULTIPLIER);

        uint slopePeriod = amount.div(slope);
        uint slopeSide = slopePeriod.mul(slopePeriod).mul(ST_FORMULA_SLOPE_MULTIPLIER);
        uint multiplier = cliffSide.add(slopeSide).add(ST_FORMULA_COMPENSATE).div(ST_FORMULA_MULTIPLIER);
        uint newAmount = amount.mul(multiplier);
        uint newSlope = newAmount.div(slopePeriod);
        return(newAmount, newSlope);
    }

    function roundTimestamp(uint ts) pure internal returns (uint) {
        return ts.div(WEEK).sub(STARTING_POINT_WEEK);
    }
}