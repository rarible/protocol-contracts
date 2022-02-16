// SPDX-License-Identifier: MIT

pragma solidity ^0.7.6;

import "@rarible/exchange-interfaces/contracts/IWETH.sol";
/*Test Wrapped Ether contract
*https://etherscan.io/address/0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2#code
*/

contract WETHTest is IWETH {
    string public name     = "Wrapped Ether";
    string public symbol   = "WETH";
    uint8  public decimals = 18;

    event  Withdrawal(address indexed src, uint wad);

    mapping (address => uint)                       public  balanceOf;
    mapping (address => mapping (address => uint))  public  allowance;

    function withdraw(uint wad) public override {
        require(balanceOf[msg.sender] >= wad, "balance less than need");
        balanceOf[msg.sender] -= wad;
        msg.sender.transfer(wad);
        emit Withdrawal(msg.sender, wad);
    }
}
