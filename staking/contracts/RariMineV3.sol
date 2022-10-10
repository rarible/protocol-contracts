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

contract RariMineV3 is OwnableUpgradeable, IRariMine {
    using SafeMathUpgradeable for uint;
    using LibString for string;
    using LibUint for uint;
    using LibAddress for address;

    IERC20Upgradeable public token;
    address           public tokenOwner;
    IStaking          public staking;

    uint256 public claimFormulaClaim;
    uint256 public claimCliffWeeks;
    uint256 public claimSlopeWeeks;
    uint256 constant CLAIM_FORMULA_DIVIDER = 10000; 

    uint8   public constant VERSION        = 1;
    
    mapping(address => uint) public claimed;

    event SetClaimFormulaClaim(uint256 indexed newClaimFormulaClaim);
    event SetClaimCliffWeeks(uint256 indexed newClaimCliffWeeks);
    event SetClaimSlopeWeeks(uint256 indexed newClaimSlopeWeeks);

    function __RariMineV3_init(IERC20Upgradeable _token, 
                                address _tokenOwner, 
                                IStaking _staking, 
                                uint256 _claimCliffWeeks, 
                                uint256 _claimSlopeWeeks, 
                                uint256 _claimFormulaClaim) external initializer {
        __RariMineV3_init_unchained(_token, _tokenOwner, _staking, _claimCliffWeeks, _claimSlopeWeeks, _claimFormulaClaim);
        __Ownable_init_unchained();
        __Context_init_unchained();
    }

    function __RariMineV3_init_unchained(IERC20Upgradeable _token, 
                                        address _tokenOwner, 
                                        IStaking _staking, 
                                        uint256 _claimCliffWeeks, 
                                        uint256 _claimSlopeWeeks, 
                                        uint256 _claimFormulaClaim) internal initializer {
        token = _token;
        tokenOwner = _tokenOwner;
        staking = _staking;
        claimCliffWeeks = _claimCliffWeeks;
        claimSlopeWeeks = _claimSlopeWeeks;
        claimFormulaClaim = _claimFormulaClaim;
    }

    function claim(Balance memory _balance, uint8 v, bytes32 r, bytes32 s) public {
        require(prepareMessage(_balance, address(this)).recover(v, r, s) == owner(), "owner should sign balances");

        address recipient = _balance.recipient;
        if (_msgSender() == recipient) {
            uint toClaim = _balance.value.sub(claimed[recipient], "nothing to claim");
            claimed[recipient] = claimed[recipient].add(_balance.value);

            // claim rari tokens
            uint claimAmount = toClaim.mul(claimFormulaClaim).div(CLAIM_FORMULA_DIVIDER);
            if(claimAmount > 0) {
                require(token.transferFrom(tokenOwner, recipient, claimAmount), "transfer to msg sender is not successful");
                emit Claim(recipient, claimAmount);
                emit Value(recipient, _balance.value);
            }

            // stake some tokens
            uint stakeAmount = toClaim.sub(claimAmount);
            uint slope = LibStakingMath.divUp(stakeAmount, claimSlopeWeeks);
            require(token.transferFrom(tokenOwner, address(this), stakeAmount), "transfer to RariMine is not successful");
            require(token.approve(address(staking), stakeAmount), "approve is not successful");
            staking.stake(_msgSender(), _msgSender(), stakeAmount, slope, claimCliffWeeks);
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
        return toString(keccak256(abi.encode(_balance, _address, VERSION, id)));
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

    function balanceOf(address account) public view returns (uint256) {
        return claimed[account];
    }

    function setClaimFormulaClaim(uint256 _value) public onlyOwner {
        claimFormulaClaim = _value;
        emit SetClaimCliffWeeks(claimFormulaClaim);
    }

    function setClaimCliffWeeks(uint256 _value) external onlyOwner {
        claimCliffWeeks = _value;
        emit SetClaimCliffWeeks(_value);
    }

    function setClaimSlopeWeeks(uint256 _value) public onlyOwner {
        claimSlopeWeeks = _value;
        emit SetClaimCliffWeeks(_value);
    }

    uint256[48] private __gap;
}