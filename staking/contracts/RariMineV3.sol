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
import "./IRariMine.sol";

contract RariMineV3 is OwnableUpgradeable, IRariMine {
    using SafeMathUpgradeable for uint;
    using LibString for string;
    using LibUint for uint;
    using LibAddress for address;

    IERC20Upgradeable public token;
    address public tokenOwner;
    mapping(address => uint) public claimed;

    function __RariMineV3_init(IERC20Upgradeable _token, address _tokenOwner) external initializer {
        __RariMineV3_init_unchained(_token, _tokenOwner);
        __Ownable_init_unchained();
        __Context_init_unchained();
    }

    function __RariMineV3_init_unchained(IERC20Upgradeable _token, address _tokenOwner) internal initializer {
        token = _token;
        tokenOwner = _tokenOwner;
    }

    function claim(Balance[] memory _balances, uint8 v, bytes32 r, bytes32 s) public {
        require(prepareMessage(_balances).recover(v, r, s) == owner(), "owner should sign balances");

        for (uint i = 0; i < _balances.length; i++) {
            address recipient = _balances[i].recipient;
            if (msg.sender == recipient) {
                uint toClaim = _balances[i].value.sub(claimed[recipient]);
                require(toClaim > 0, "nothing to claim");
                claimed[recipient] = _balances[i].value;
                require(token.transferFrom(tokenOwner, msg.sender, toClaim), "transfer is not successful");
                emit Claim(recipient, toClaim);
                emit Value(recipient, _balances[i].value);
                return;
            }
        }
        revert("msg.sender not found in receipients");
    }

    function doOverride(Balance[] memory _balances) public onlyOwner {
        for (uint i = 0; i < _balances.length; i++) {
            claimed[_balances[i].recipient] = _balances[i].value;
            emit Value(_balances[i].recipient, _balances[i].value);
        }
    }

    function prepareMessage(Balance[] memory _balances) internal pure returns (string memory) {
        return toString(keccak256(abi.encode(_balances)));
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
}