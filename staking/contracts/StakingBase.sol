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
    uint256 constant ST_FORMULA_CONST_MULTIPLIER = 10000000;   //stFormula const multiplier
    uint256 constant ST_FORMULA_CLIFF_MULTIPLIER = 60000000;   //stFormula cliff multiplier
    uint256 constant ST_FORMULA_SLOPE_MULTIPLIER = 30000000;   //stFormula slope multiplier

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
     * @dev minimal cliff period in weeks, minCliffPeriod < TWO_YEAR_WEEKS
     */

    uint public minCliffPeriod;
    /**
     * @dev minimal slope period in weeks, minSlopePeriod < TWO_YEAR_WEEKS
     */
    uint public minSlopePeriod;

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
     * @dev set newMinCliffPeriod, require newMinCliffPeriod < TWO_YEAR_WEEKS = 104
     */
    event SetMinCliffPeriod(uint indexed newMinCliffPeriod);
    /**
     * @dev set newMinSlopePeriod, require newMinSlopePeriod < TWO_YEAR_WEEKS = 104
     */
    event SetMinSlopePeriod(uint indexed newMinSlopePeriod);

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
     * staking = (tokens * (
     *      ST_FORMULA_CONST_MULTIPLIER
     *      + ST_FORMULA_CLIFF_MULTIPLIER * (cliffPeriod - minCliffPeriod))/(TWO_YEAR_WEEKS - minCliffPeriod)
     *      + ST_FORMULA_SLOPE_MULTIPLIER * (slopePeriod - minSlopePeriod))/(TWO_YEAR_WEEKS - minSlopePeriod)
     *      )) / ST_FORMULA_DIVIDER
     **/
    function getStake(uint amount, uint slope, uint cliff) public view returns (uint stakeAmount, uint stakeSlope) {
        uint slopePeriod = divUp(amount, slope);
        require(cliff >= minCliffPeriod, "cliff period < minimal stake period");
        require(slopePeriod >= minSlopePeriod, "slope period < minimal stake period");

        uint cliffSide = (cliff - minCliffPeriod).mul(ST_FORMULA_CLIFF_MULTIPLIER).div(TWO_YEAR_WEEKS - minCliffPeriod);
        uint slopeSide = (slopePeriod - minSlopePeriod).mul(ST_FORMULA_SLOPE_MULTIPLIER).div(TWO_YEAR_WEEKS - minSlopePeriod);
        uint multiplier = cliffSide.add(slopeSide).add(ST_FORMULA_CONST_MULTIPLIER);

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
