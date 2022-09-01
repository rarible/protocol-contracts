// SPDX-License-Identifier: MIT

pragma solidity 0.7.6;
pragma abicoder v2;

import "@openzeppelin/contracts-upgradeable/token/ERC20/IERC20Upgradeable.sol";
import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";

import "./lib-broken-line/LibBrokenLine.sol";

contract StakingBase is OwnableUpgradeable {

    using SafeMathUpgradeable for uint;
    using LibBrokenLine for LibBrokenLine.BrokenLine;

    uint256 constant WEEK = 604800;                         //seconds one week
    uint256 constant STARTING_POINT_WEEK = 2676;            //starting point week (Staking Epoch start)
    uint256 constant TWO_YEAR_WEEKS = 104;                  //two year weeks

    uint256 constant ST_FORMULA_DIVIDER = 100000000;        //stFormula divider
    uint256 constant ST_FORMULA_STABLE_MULTIPLIER = 20000000;   //stFormula constant multiplier
    uint256 constant ST_FORMULA_LINEAR_MULTIPLIER = 80000000;   //stFormula linear multiplier

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
    bool public stopped;

    /**
     * @dev address to migrate Stakes to (zero if not in migration state)
     */
    address public migrateTo;

    /**
      *@dev minimal stake period in weeks, minStakePeriod < TWO_YEAR_WEEKS
      */
    uint public minStakePeriod;

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
    event Restake(uint indexed id, address indexed account, address indexed delegate, uint counter, uint time, uint amount, uint slope, uint cliff);
    /**
     * @dev Emitted when to set newDelegate address for Lock with given id
     */
    event Delegate(uint indexed id, address indexed account, address indexed delegate, uint time);
    /**
     * @dev Emitted when withdraw amount of Rari, account - msg.sender, amount - amount Rari
     */
    event Withdraw(address indexed account, uint amount);
    /**
     * @dev Emitted when migrate Locks with given id, account - msg.sender
     */
    event Migrate(address indexed account, uint[] id);
    /**
     * @dev Stop run contract functions, accept withdraw, account - msg.sender
     */
    event StopStaking(address indexed account);
    /**
     * @dev StartMigration initiate migration to another contract, account - msg.sender, to - address delegate to
     */
    event StartMigration(address indexed account, address indexed to);
    /**
     * @dev set minStakePeriod, require newMinStakePeriod < TWO_YEAR_WEEKS = 104
     */
    event SetMinStakePeriod(uint indexed newMinStakePeriod);

    function __StakingBase_init_unchained(IERC20Upgradeable _token) internal initializer {
        token = _token;
    }

    function addLines(address account, address delegate, uint amount, uint slope, uint cliff, uint time) internal {
        updateLines(account, delegate, time);
        (uint stAmount, uint stSlope) = getStake(amount, slope, cliff);
        LibBrokenLine.Line memory line = LibBrokenLine.Line(time, stAmount, stSlope);
        totalSupplyLine.add(counter, line, cliff);
        accounts[delegate].balance.add(counter, line, cliff);
        line = LibBrokenLine.Line(time, amount, slope);
        accounts[account].locked.add(counter, line, cliff);
        stakes[counter].account = account;
        stakes[counter].delegate = delegate;
    }

    function updateLines(address account, address delegate, uint time) internal {
        totalSupplyLine.update(time);
        accounts[delegate].balance.update(time);
        accounts[account].locked.update(time);
    }

    /**
     * Сalculate and return (newAmount, newSlope), using formula:
     * staking = (tokens * (ST_FORMULA_STABLE_MULTIPLIER + ST_FORMULA_LINEAR_MULTIPLIER * (stakePeriod - minStakePeriod))/(TWO_YEAR_WEEKS - minStakePeriod)) / ST_FORMULA_DIVIDER
     **/
    function getStake(uint amount, uint slope, uint cliff) public view returns (uint stakeAmount, uint stakeSlope) {
        uint slopePeriod = divUp(amount, slope);
        uint stakePeriod = slopePeriod.add(cliff);
        require(stakePeriod >= minStakePeriod, "stake period < minimal stake period");

        uint linearSide = (stakePeriod - minStakePeriod).mul(ST_FORMULA_LINEAR_MULTIPLIER).div(TWO_YEAR_WEEKS - minStakePeriod);
        uint multiplier = linearSide.add(ST_FORMULA_STABLE_MULTIPLIER);

        stakeAmount = amount.mul(multiplier).div(ST_FORMULA_DIVIDER);
        stakeSlope = divUp(stakeAmount, slopePeriod);
    }

    function divUp(uint a, uint b) internal pure returns (uint) {
        return ((a.sub(1)).div(b)).add(1);
    }

    function roundTimestamp(uint ts) pure internal returns (uint) {
        return ts.div(WEEK).sub(STARTING_POINT_WEEK);
    }

    function verifyStakeOwner(uint id) internal view returns (address account) {
        account = stakes[id].account;
        require(account == msg.sender, "caller not a stake owner");
    }
    /**
     * @dev Throws if stopped
     */
    modifier notStopped() {
        require(!stopped, "stopped");
        _;
    }

    modifier notMigrating() {
        require(migrateTo == address(0), "migrating");
        _;
    }

    //add minStakePeriod, decrease __gap
    uint256[49] private __gap;

}
