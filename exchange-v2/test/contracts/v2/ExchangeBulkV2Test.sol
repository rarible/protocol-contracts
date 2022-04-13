// SPDX-License-Identifier: MIT

pragma solidity 0.7.6;
pragma abicoder v2;

////import "./ExchangeV2Core.sol";
////import "./RaribleTransferManager.sol";
//import "./lib/LibTransfer.sol";
////import "@rarible/royalties/contracts/IRoyaltiesProvider.sol";
//import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
import "@rarible/exchange-interfaces/contracts/IWyvernExchange.sol";
import "@rarible/exchange-interfaces/contracts/IExchangeV2.sol";

contract ExchangeBulkV2Test {

    struct WyvernOrders {
        address[14] addrs;
        uint[18]  uints;
        uint8[8]  feeMethodsSidesKindsHowToCalls;
        bytes  calldataBuy;
        bytes  calldataSell;
        bytes  replacementPatternBuy;
        bytes  replacementPatternSell;
        bytes  staticExtradataBuy;
        bytes  staticExtradataSell;
        uint8[2]  vs;
        bytes32[5]  rssMetadata;
    }

    struct RaribleBuy {
        LibOrder.Order orderLeft;
        bytes signatureLeft;
        LibOrder.Order orderRight;
        bytes signatureRight;
    }

    function getDataWyvernAtomicMatch(WyvernOrders memory _openSeaBuy) external pure returns(bytes memory _data) {
        _data = abi.encodeWithSelector(IWyvernExchange.atomicMatch_.selector, _openSeaBuy.addrs, _openSeaBuy.uints, _openSeaBuy.feeMethodsSidesKindsHowToCalls, _openSeaBuy.calldataBuy, _openSeaBuy.calldataSell, _openSeaBuy.replacementPatternBuy, _openSeaBuy.replacementPatternSell, _openSeaBuy.staticExtradataBuy, _openSeaBuy.staticExtradataSell, _openSeaBuy.vs, _openSeaBuy.rssMetadata);
    }

    function getDataExchangeV2MatchOrders(RaribleBuy memory _raribleBuy /*LibOrder.Order memory orderLeft, bytes memory signatureLeft, LibOrder.Order memory orderRight, bytes memory signatureRight*/) external pure returns(bytes memory _data) {
        _data = abi.encodeWithSelector(IExchangeV2.matchOrders.selector, _raribleBuy.orderLeft, _raribleBuy.signatureLeft, _raribleBuy.orderRight, _raribleBuy.signatureRight);
    }
}