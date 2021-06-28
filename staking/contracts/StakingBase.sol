// SPDX-License-Identifier: MIT

pragma solidity ^0.7.0;
pragma abicoder v2;

import "@openzeppelin/contracts-upgradeable/token/ERC20/IERC20Upgradeable.sol";
import "@rarible/lib-broken-line/contracts/LibBrokenLine.sol";
import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";

contract StakingBase is OwnableUpgradeable {

    using SafeMathUpgradeable for uint;
    using LibBrokenLine for LibBrokenLine.BrokenLine;

    uint256 constant WEEK = 604800;                         //seconds one week
    uint256 constant STARTING_POINT_WEEK = 2676;            //starting point week (Staking Epoch begining)
    uint256 constant TWO_YEAR_WEEKS = 104;                  //two year weeks
    uint256 constant ST_FORMULA_MULTIPLIER = 10816;         //stFormula multiplier = TWO_YEAR_WEEKS^2
    uint256 constant ST_FORMULA_DIVIDER = 1000;             //stFormula divider
    uint256 constant ST_FORMULA_COMPENSATE = 11356800;      //stFormula compensate = (0.7 + 0.35) * ST_FORMULA_MULTIPLIER * 1000
    uint256 constant ST_FORMULA_SLOPE_MULTIPLIER = 4650;    //stFormula slope multiplier = 9.3 * 0.5 * 1000
    uint256 constant ST_FORMULA_CLIFF_MULTIPLIER = 9300;    //stFormula cliff multiplier = 9.3 * 1000

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
    bool internal stopped;
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
     * k = (ST_FORMULA_COMPENSATE + ST_FORMULA_CLIFF_MULTIPLIER * (cliffPeriod)^2 + ST_FORMULA_SLOPE_MULTIPLIER * (slopePeriod)^2) / ST_FORMULA_MULTIPLIER
     * newAmount=k*amount/ST_FORMULA_DIVIDER
     * newSlope=k*slope/ST_FORMULA_DIVIDER
     **/
    function getStake(uint amount, uint slope, uint cliff) internal pure returns (uint stakeAmount, uint stakeSlope) {
        uint cliffSide = cliff.mul(cliff).mul(ST_FORMULA_CLIFF_MULTIPLIER);

        uint slopePeriod = amount.div(slope);
        uint slopeSide = slopePeriod.mul(slopePeriod).mul(ST_FORMULA_SLOPE_MULTIPLIER);
        uint multiplier = cliffSide.add(slopeSide).add(ST_FORMULA_COMPENSATE).div(ST_FORMULA_MULTIPLIER);
        stakeAmount = amount.mul(multiplier).div(ST_FORMULA_DIVIDER);
        stakeSlope = slope.mul(multiplier).div(ST_FORMULA_DIVIDER);
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
}
