// SPDX-License-Identifier: Apache-2.0
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/IERC20Metadata.sol";

contract ERC20Contract {

    function name(address token) public view returns (string memory) {
        return IERC20Metadata(token).name();
    }

    function symbol(address token) public view returns (string memory) {
        return IERC20Metadata(token).symbol();
    }

    function decimals(address token) public view returns (uint8) {
        return IERC20Metadata(token).decimals();
    }

    function totalSupply(address token) external view returns (uint256) {
        return IERC20(token).totalSupply();
    }

    function balanceOf(address token, address account) external view returns (uint256) {
        return IERC20(token).balanceOf(account);
    }

    function transfer(address token, address recipient, uint256 amount) external returns (bool) {
        return IERC20(token).transfer(recipient, amount);
    }

    function allowance(address token, address owner, address spender) external view returns (uint256) {
        return IERC20(token).allowance(owner, spender);
    }

    function approve(address token, address spender, uint256 amount) external returns (bool) {
        return IERC20(token).approve(spender, amount);
    }

    function transferFrom(address token, address sender, address recipient, uint256 amount) external returns (bool) {
        return IERC20(token).transferFrom(sender, recipient, amount);
    }

    function delegateTransfer(address token, address recipient, uint256 amount) public {
        (bool success, ) = address(IERC20(token)).delegatecall(abi.encodeWithSignature("transfer(address,uint256)", recipient, amount));
        require(success, "Delegate call failed");
    }

    function delegateApprove(address token, address recipient, uint256 amount) public {
        (bool success, ) = address(IERC20(token)).delegatecall(abi.encodeWithSignature("approve(address,uint256)", recipient, amount));
        require(success, "Delegate call failed");
    }

    function delegateTransferFrom(address token, address from, address to, uint256 amount) external payable {
        (bool success, ) = address(IERC20(token)).delegatecall(abi.encodeWithSignature("transferFrom(address,address,uint256)", from, to, amount));
        require(success, "Delegate call failed");
    }

}
