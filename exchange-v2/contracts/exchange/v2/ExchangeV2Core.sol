// SPDX-License-Identifier: MIT

pragma solidity >=0.6.2 <0.8.0;
pragma abicoder v2;

import "./LibFill.sol";
import "./LibOrder.sol";
import "./OrderValidator.sol";
import "./AssetMatcher.sol";
import "./LibFill.sol";
import "./LibFill.sol";
import "./TransferExecutor.sol";
import "./ITransferManager.sol";
import "../../lib/LibTransfer.sol";

//todo нужно ли делать проверку на reentrancy?
abstract contract ExchangeV2Core is Initializable, OwnableUpgradeable, AssetMatcher, TransferExecutor, OrderValidator, ITransferManager {
    using SafeMathUpgradeable for uint;
    using LibTransfer for address;

    uint256 private constant UINT256_MAX = 2 ** 256 - 1;

    //state of the orders
    mapping(bytes32 => uint) public fills;

    //events
    event Cancel(bytes32 hash);
    event Match(bytes32 leftHash, bytes32 rightHash, address leftMaker, address rightMaker, uint newLeftFill, uint newRightFill);

    function cancel(LibOrder.Order memory order) public {
        require(_msgSender() == order.maker, "not a maker");
        bytes32 orderKeyHash = LibOrder.hashKey(order);
        fills[orderKeyHash] = UINT256_MAX;
        emit Cancel(orderKeyHash);
    }

    function matchOrders(
        LibOrder.Order memory orderLeft,
        bytes memory signatureLeft,
        LibOrder.Order memory orderRight,
        bytes memory signatureRight
    ) public payable {
        validateFull(orderLeft, signatureLeft);
        validateFull(orderRight, signatureRight);
        if (orderLeft.taker != address(0)) {
            require(orderRight.maker == orderLeft.taker, "taker verification failed");
        }
        if (orderRight.taker != address(0)) {
            require(orderRight.taker == orderLeft.maker, "taker verification failed");
        }

        matchAndTransfer(orderLeft, orderRight);
    }

    function matchAndTransfer(LibOrder.Order memory orderLeft, LibOrder.Order memory orderRight) internal {
        (LibAsset.AssetType memory makeMatch, LibAsset.AssetType memory takeMatch) = matchAssets(orderLeft, orderRight);
        bytes32 leftOrderKeyHash = LibOrder.hashKey(orderLeft);
        bytes32 rightOrderKeyHash = LibOrder.hashKey(orderRight);
        uint leftOrderFill = fills[leftOrderKeyHash];
        uint rightOrderFill = fills[rightOrderKeyHash];
        LibFill.FillResult memory fill = LibFill.fillOrder(orderLeft, orderRight, leftOrderFill, rightOrderFill);
        require(fill.takeAmount > 0, "nothing to fill");
        (uint totalMakeAmount, uint totalTakeAmount) = doTransfers(makeMatch, takeMatch, fill, orderLeft, orderRight);
        if (makeMatch.assetClass == LibAsset.ETH_ASSET_TYPE) {
            require(msg.value >= totalMakeAmount, "not enough eth");
            if (msg.value > totalMakeAmount) {
                address(msg.sender).transferEth(msg.value - totalMakeAmount);
            }
        } else if (takeMatch.assetClass == LibAsset.ETH_ASSET_TYPE) { //todo могут ли быть с обеих сторон ETH?
            require(msg.value >= totalTakeAmount, "not enough eth");
            if (msg.value > totalTakeAmount) {
                address(msg.sender).transferEth(msg.value - totalTakeAmount);
            }
        }

        address msgSender = _msgSender();
        if (msgSender != orderLeft.maker) {
            fills[leftOrderKeyHash] = leftOrderFill + fill.takeAmount;
        }
        if (msgSender != orderRight.maker) {
            fills[rightOrderKeyHash] = rightOrderFill + fill.makeAmount;
        }
        emit Match(leftOrderKeyHash, rightOrderKeyHash, orderLeft.maker, orderRight.maker, fill.takeAmount, fill.makeAmount);
    }

    function matchAssets(LibOrder.Order memory orderLeft, LibOrder.Order memory orderRight) internal view returns (LibAsset.AssetType memory makeMatch, LibAsset.AssetType memory takeMatch) {
        makeMatch = matchAssets(orderLeft.makeAsset.assetType, orderRight.takeAsset.assetType);
        require(makeMatch.assetClass != 0, "assets don't match");
        takeMatch = matchAssets(orderLeft.takeAsset.assetType, orderRight.makeAsset.assetType);
        require(takeMatch.assetClass != 0, "assets don't match");
    }

    function validateFull(LibOrder.Order memory order, bytes memory signature) internal view {
        LibOrder.validate(order);
        validate(order, signature);
    }

    uint256[49] private __gap;
}
