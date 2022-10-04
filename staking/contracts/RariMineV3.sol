// SPDX-License-Identifier: MIT

/**
 *Submitted for verification at Etherscan.io on 2020-07-20
*/

pragma solidity 0.7.6;
pragma abicoder v2;

import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/utils/AddressUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/token/ERC20/IERC20Upgradeable.sol";

import "./libs/LibString.sol";
import "./libs/LibAddress.sol";
import "./libs/LibUint.sol";
import "./libs/LibStakingMath.sol";
import "./IRariMine.sol";
import "./IStaking.sol";
import "./IERC20Read.sol";

contract RariMineV3 is OwnableUpgradeable, IRariMine, IERC20Read {
    using SafeMathUpgradeable for uint;
    using LibString for string;
    using LibUint for uint;
    using LibAddress for address;

    IERC20Upgradeable public token;
    address           public tokenOwner;
    IStaking          public staking;

    string   private _name;
    string   private _symbol;
    uint8    private _decimals;
    uint256  private _totalSupply;

    uint256 constant CLAIM_FORMULA_STAKE   = 60000000;  // 60% to stake
    uint256 constant CLAIM_FORMULA_CLAIM   = 40000000;  // 40% to withdraw
    uint256 constant CLAIM_FORMULA_DIVIDER = 100000000; //  
    uint256 constant CLAIM_CLIFF_WEEKS     = 42;        // the meaning of life, the universe, and everything
    uint256 constant CLAIM_SLOPE_WEEKS     = 42;        // the meaning of life, the universe, and everything
    uint8   public constant VERSION               = 1;

    mapping(address => uint) public claimed;

    function __RariMineV3_init(IERC20Upgradeable _token, address _tokenOwner, IStaking _staking) external initializer {
        __RariMineV3_init_unchained(_token, _tokenOwner, _staking);
        __Ownable_init_unchained();
        __Context_init_unchained();
    }

    function __RariMineV3_init_unchained(IERC20Upgradeable _token, address _tokenOwner, IStaking _staking) internal initializer {
        token = _token;
        tokenOwner = _tokenOwner;
        staking = _staking;
        _decimals = 18;
        _name = "Rari Mine Claimed Tokens";
        _symbol = "RariMineCT";
    }

    function claim(Balance memory _balance, uint8 v, bytes32 r, bytes32 s) public {
        require(prepareMessage(_balance, address(this)).recover(v, r, s) == owner(), "owner should sign balances");

        address recipient = _balance.recipient;
        if (_msgSender() == recipient) {
            uint toClaim = _balance.value.sub(claimed[recipient]);
            require(toClaim > 0, "nothing to claim");
            claimed[recipient] += _balance.value;
            _totalSupply += _balance.value;

            // claim rari tokens
            uint claimAmount = toClaim.mul(CLAIM_FORMULA_CLAIM).div(CLAIM_FORMULA_DIVIDER);
            require(token.transferFrom(tokenOwner, _msgSender(), claimAmount), "transfer to msg sender is not successful");
            emit Claim(recipient, claimAmount);
            emit Value(recipient, _balance.value);

            // stake some tokens
            uint stakeAmount = toClaim.sub(claimAmount);
            uint slope = LibStakingMath.divUp(stakeAmount, CLAIM_SLOPE_WEEKS);
            require(token.transferFrom(tokenOwner, address(this), stakeAmount), "transfer to RariMine is not successful");
            require(token.approve(address(staking), stakeAmount), "approve is not successful");
            staking.stake(_msgSender(), _msgSender(), stakeAmount, slope, CLAIM_CLIFF_WEEKS);
            return;
        }
        
        revert("_msgSender() is not the receipient");
    }

    function doOverride(Balance[] memory _balances) public onlyOwner {
        for (uint i = 0; i < _balances.length; i++) {
            claimed[_balances[i].recipient] = _balances[i].value;
            emit Value(_balances[i].recipient, _balances[i].value);
        }
    }

    function prepareMessage(Balance memory _balance, address _address) internal pure returns (string memory) {
        uint256 id;
        assembly {
            id := chainid()
        }
        return toString(keccak256(abi.encode(_balance, _address, id, VERSION)));
    }

    function toString(bytes32 value) internal pure returns (string memory) {
        bytes memory alphabet = "0123456789abcdef";
        bytes memory str = new bytes(64);
        for (uint256 i = 0; i < 32; i++) {
            str[i*2] = alphabet[uint8(value[i] >> 4)];
            str[1+i*2] = alphabet[uint8(value[i] & 0x0f)];
        }
        return string(str);
    }

    /**
     * @dev Returns the amount of tokens of released to the users.
     */
    function totalSupply() external override view returns (uint256) {
        return _totalSupply;
    }
    /**
     * @dev Returns the amount of tokens owned by `account`.
     */
    function balanceOf(address account) external override view returns (uint256) {
        return claimed[account];
    }

    /**
     * @dev Returns the token name.
     */
    function name() public override view returns (string memory) {
        return _name;
    }

    /**
     * @dev Returns the token decimals.
     */
    function decimals() public override view returns (uint8) {
        return _decimals;
    }

    /**
     * @dev Returns the token symbol.
     */
    function symbol() public override view returns (string memory) {
        return _symbol;
    }

    uint256[48] private __gap;
}