pragma solidity ^0.5.0;
pragma experimental ABIEncoderV2;

import "openzeppelin-solidity/contracts/token/ERC20/ERC20Mintable.sol";

contract SimpleERC20 is ERC20Mintable {
    struct Mint {
        address a;
        uint value;
    }

    function mint(address account, uint256 amount) public returns (bool) {
        _mint(account, amount);
        return true;
    }

    function mint(Mint[] calldata mints) external {
        for (uint i = 0; i < mints.length; i++) {
            _mint(mints[i].a, mints[i].value);
        }
    }
}
//0x6195472C27B8Fd914b2F989939b24Ba206874cAb