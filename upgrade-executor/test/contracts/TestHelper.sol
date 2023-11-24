

// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "../../src/actions/ProxyUpgradeAction.sol";
import "../../src/actions/SetProtocolFeeAction.sol";
import "../../src/UpgradeExecutor.sol";

contract TestHelper {

    function encodeProxyUpgradeCall(address admin, address payable target, address newLogic) external pure returns(bytes memory) {
        return abi.encodeWithSelector(ProxyUpgradeAction.perform.selector, admin, target, newLogic);
    }

    function encodeProtocolFeeCall(address _receiver, uint48 _buyerAmount, uint48 _sellerAmount) external pure returns(bytes memory) {
        return abi.encodeWithSelector(SetProtocolFeeAction.perform.selector, _receiver, _buyerAmount, _sellerAmount);
    }

    function encodeUpgradeActionCall(address upgrade, bytes memory data) external pure returns(bytes memory) {
        return abi.encodeWithSelector(UpgradeExecutor.execute.selector, upgrade, data);
    }

}