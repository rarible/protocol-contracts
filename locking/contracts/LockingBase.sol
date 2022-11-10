// SPDX-License-Identifier: MIT

pragma solidity 0.7.6;
pragma abicoder v2;

import "@openzeppelin/contracts-upgradeable/token/ERC20/IERC20Upgradeable.sol";
import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";

import "./libs/LibBrokenLine.sol";

import "./IVotesUpgradeable.sol";

abstract contract LockingBase is OwnableUpgradeable, IVotesUpgradeable {

    using SafeMathUpgradeable for uint;
    using LibBrokenLine for LibBrokenLine.BrokenLine;

    uint256 constant public WEEK = 50400; //blocks one week = 50400, day = 7200, goerli = 50
    
    uint256 constant MAX_CLIFF_PERIOD = 103;
    uint256 constant MAX_SLOPE_PERIOD = 104;

    uint256 constant ST_FORMULA_DIVIDER =  1 * (10 ** 8);           //stFormula divider          100000000
    uint256 constant ST_FORMULA_CONST_MULTIPLIER = 2 * (10 ** 7);   //stFormula const multiplier  20000000
    uint256 constant ST_FORMULA_CLIFF_MULTIPLIER = 8 * (10 ** 7);   //stFormula cliff multiplier  80000000
    uint256 constant ST_FORMULA_SLOPE_MULTIPLIER = 4 * (10 ** 7);   //stFormula slope multiplier  40000000

    /**
     * @dev ERC20 token to lock
     */
    IERC20Upgradeable public token;
    /**
     * @dev counter for Lock identifiers
     */
    uint public counter;

    /**
     * @dev true if contract entered stopped state
     */
    bool public stopped;

    /**
     * @dev address to migrate Locks to (zero if not in migration state)
     */
    address public migrateTo;

    /**
     * @dev minimal cliff period in weeks, minCliffPeriod < MAX_CLIFF_PERIOD
     */

    uint public minCliffPeriod;

    /**
     * @dev minimal slope period in weeks, minSlopePeriod < MAX_SLOPE_PERIOD
     */
    uint public minSlopePeriod;

    /**
     * @dev locking epoch start in weeks
     */
    uint public startingPointWeek;

    /**
     * @dev represents one user Lock
     */
    struct Lock {
        address account;
        address delegate;
    }

    /**
     * @dev describes state of accounts's balance.
     *      balance - broken line describes lock
     *      locked - broken line describes how many tokens are locked
     *      amount - total currently locked tokens (including tokens which can be withdrawed)
     */
    struct Account {
        LibBrokenLine.BrokenLine balance;
        LibBrokenLine.BrokenLine locked;
        uint amount;
    }

    mapping(address => Account) accounts;
    mapping(uint => Lock) locks;
    LibBrokenLine.BrokenLine public totalSupplyLine;

    /**
     * @dev Emitted when create Lock with parameters (account, delegate, amount, slopePeriod, cliff)
     */
    event LockCreate(uint indexed id, address indexed account, address indexed delegate, uint time, uint amount, uint slopePeriod, uint cliff);
    /**
     * @dev Emitted when change Lock parameters (newDelegate, newAmount, newSlopePeriod, newCliff) for Lock with given id
     */
    event Relock(uint indexed id, address indexed account, address indexed delegate, uint counter, uint time, uint amount, uint slopePeriod, uint cliff);
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
    event StopLocking(address indexed account);
    /**
     * @dev Start run contract functions, accept withdraw, account - msg.sender
     */
    event StartLocking(address indexed account);
    /**
     * @dev StartMigration initiate migration to another contract, account - msg.sender, to - address delegate to
     */
    event StartMigration(address indexed account, address indexed to);
    /**
     * @dev set newMinCliffPeriod
     */
    event SetMinCliffPeriod(uint indexed newMinCliffPeriod);
    /**
     * @dev set newMinSlopePeriod
     */
    event SetMinSlopePeriod(uint indexed newMinSlopePeriod);
    /**
     * @dev set startingPointWeek
     */
    event SetStartingPointWeek(uint indexed newStartingPointWeek);

    function __LockingBase_init_unchained(IERC20Upgradeable _token, uint _startingPointWeek, uint _minCliffPeriod, uint _minSlopePeriod) internal initializer {
        token = _token;
        startingPointWeek = _startingPointWeek;

        //setting min cliff and slope
        require(_minCliffPeriod <= MAX_CLIFF_PERIOD, "cliff too big");
        require(_minSlopePeriod <= MAX_SLOPE_PERIOD, "period too big");
        minCliffPeriod = _minCliffPeriod;
        minSlopePeriod = _minSlopePeriod;
    }

    function addLines(address account, address _delegate, uint amount, uint slopePeriod, uint cliff, uint time) internal {
        require(slopePeriod <= amount, "Wrong value slopePeriod");
        updateLines(account, _delegate, time);
        (uint stAmount, uint stSlope) = getLock(amount, slopePeriod, cliff);
        LibBrokenLine.Line memory line = LibBrokenLine.Line(time, stAmount, stSlope);
        totalSupplyLine.add(counter, line, cliff);
        accounts[_delegate].balance.add(counter, line, cliff);
        uint slope = divUp(amount, slopePeriod);
        line = LibBrokenLine.Line(time, amount, slope);
        accounts[account].locked.add(counter, line, cliff);
        locks[counter].account = account;
        locks[counter].delegate = _delegate;
    }

    function updateLines(address account, address _delegate, uint time) internal {
        totalSupplyLine.update(time);
        accounts[_delegate].balance.update(time);
        accounts[account].locked.update(time);
    }

    /**
     * Сalculate and return (newAmount, newSlope), using formula:
     * locking = (tokens * (
     *      ST_FORMULA_CONST_MULTIPLIER
     *      + ST_FORMULA_CLIFF_MULTIPLIER * (cliffPeriod - minCliffPeriod))/(MAX_CLIFF_PERIOD - minCliffPeriod)
     *      + ST_FORMULA_SLOPE_MULTIPLIER * (slopePeriod - minSlopePeriod))/(MAX_SLOPE_PERIOD - minSlopePeriod)
     *      )) / ST_FORMULA_DIVIDER
     **/
    function getLock(uint amount, uint slopePeriod, uint cliff) public view returns (uint lockAmount, uint lockSlope) {
        require(cliff >= minCliffPeriod, "cliff period < minimal lock period");
        require(slopePeriod >= minSlopePeriod, "slope period < minimal lock period");

        uint cliffSide = (cliff - minCliffPeriod).mul(ST_FORMULA_CLIFF_MULTIPLIER).div(MAX_CLIFF_PERIOD - minCliffPeriod);
        uint slopeSide = (slopePeriod - minSlopePeriod).mul(ST_FORMULA_SLOPE_MULTIPLIER).div(MAX_SLOPE_PERIOD - minSlopePeriod);
        uint multiplier = cliffSide.add(slopeSide).add(ST_FORMULA_CONST_MULTIPLIER);

        lockAmount = amount.mul(multiplier).div(ST_FORMULA_DIVIDER);
        lockSlope = divUp(lockAmount, slopePeriod);
    }

    function divUp(uint a, uint b) internal pure returns (uint) {
        return ((a.sub(1)).div(b)).add(1);
    }
    
    function roundTimestamp(uint ts) view public returns (uint) {
        if (ts < getEpochShift()) {
            return 0;
        }
        uint shifted = ts.sub(getEpochShift());
        return shifted.div(WEEK).sub(startingPointWeek);
    }

    /**
    * @notice method returns the amount of blocks to shift locking epoch to.
    * By the time of development, the default weekly-epoch calculated by main-net block number
    * would start at about 11-35 UTC on Tuesday
    * we move it to 00-00 UTC Thursday by adding 10800 blocks (approx)
    */
    function getEpochShift() internal view virtual returns (uint) {
        return 10800;
    }

    function verifyLockOwner(uint id) internal view returns (address account) {
        account = locks[id].account;
        require(account == msg.sender, "caller not a lock owner");
    }

    function getBlockNumber() internal virtual view returns (uint) {
        return block.number;
    }

    function setStartingPointWeek(uint newStartingPointWeek) public notStopped notMigrating onlyOwner {
        require(newStartingPointWeek < roundTimestamp(getBlockNumber()) , "wrong newStartingPointWeek");
        startingPointWeek = newStartingPointWeek;

        emit SetStartingPointWeek(newStartingPointWeek);
    } 

    function setMinCliffPeriod(uint newMinCliffPeriod) external  notStopped notMigrating onlyOwner {
        require(newMinCliffPeriod < MAX_CLIFF_PERIOD, "new cliff period > 2 years");
        minCliffPeriod = newMinCliffPeriod;

        emit SetMinCliffPeriod(newMinCliffPeriod);
    }

    function setMinSlopePeriod(uint newMinSlopePeriod) external  notStopped notMigrating onlyOwner {
        require(newMinSlopePeriod < MAX_SLOPE_PERIOD, "new slope period > 2 years");
        minSlopePeriod = newMinSlopePeriod;

        emit SetMinSlopePeriod(newMinSlopePeriod);
    }

    /**
     * @dev Throws if stopped
     */
    modifier notStopped() {
        require(!stopped, "stopped");
        _;
    }

    /**
     * @dev Throws if not stopped
     */
    modifier isStopped() {
        require(stopped, "not stopped");
        _;
    }

    modifier notMigrating() {
        require(migrateTo == address(0), "migrating");
        _;
    }

    function updateAccountLines(address account, uint time) public notStopped notMigrating onlyOwner {
        accounts[account].balance.update(time);
        accounts[account].locked.update(time);
    }

    function updateTotalSupplyLine(uint time) public notStopped notMigrating onlyOwner {
        totalSupplyLine.update(time);
    }

    function updateAccountLinesBlockNumber(address account, uint256 blockNumber) external notStopped notMigrating onlyOwner {
        uint256 time = roundTimestamp(blockNumber);
        updateAccountLines(account, time);
    }
    
    function updateTotalSupplyLineBlockNumber(uint256 blockNumber) external notStopped notMigrating onlyOwner {
        uint256 time = roundTimestamp(blockNumber);
        updateTotalSupplyLine(time);
    }

    //add minCliffPeriod, decrease __gap
    //add minSlopePeriod, decrease __gap
    uint256[48] private __gap;

}
