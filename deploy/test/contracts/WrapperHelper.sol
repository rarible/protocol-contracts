// SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;
pragma abicoder v2;

import {IERC721Upgradeable} from "@openzeppelin/contracts-upgradeable/token/ERC721/IERC721Upgradeable.sol";
import {IERC1155Upgradeable} from "@openzeppelin/contracts-upgradeable/token/ERC1155/IERC1155Upgradeable.sol";
import {IWyvernExchange} from "../../contracts/ExchangeWrapperImport.sol";
import {IExchangeV2} from "../../contracts/ExchangeWrapperImport.sol";
import {LibOrder} from "../../contracts/ExchangeWrapperImport.sol";

interface IERC1155 {
    function safeTransferFrom(address from, address to, uint256 id, uint256 amount, bytes calldata data) external;
}

interface IERC721 {
    function safeTransferFrom(address from, address to, uint256 tokenId) external;
    function transferFrom(address from, address to, uint256 tokenId) external;
    function safeTransferFrom(address from, address to, uint256 tokenId, bytes calldata data) external;
}

interface IMatchERC721{
    function matchERC721UsingCriteria(
        address from,
        address to,
        IERC721 token,
        uint256 tokenId,
        bytes32 root,
        bytes32[] calldata proof
    ) external returns (bool);
}

interface IMatchERC1155{
    /*This method  Merkle validator https://etherscan.io/address/0xbaf2127b49fc93cbca6269fade0f7f31df4c88a7#code
    */
    function matchERC1155UsingCriteria(
        address from,
        address to,
        IERC1155 token,
        uint256 tokenId,
        uint256 amount,
        bytes32 root,
        bytes32[] calldata proof
    ) external returns (bool);
}

/*Interface with error*/
interface IWyvernExchangeError {
    /*method is not exist in WyvernBulkExchange contract*/
    function atomicMatchError_(
        address[14] memory addrs,
        uint[18] memory uints,
        uint8[8] memory feeMethodsSidesKindsHowToCalls,
        bytes memory calldataBuy,
        bytes memory calldataSell,
        bytes memory replacementPatternBuy,
        bytes memory replacementPatternSell,
        bytes memory staticExtradataBuy,
        bytes memory staticExtradataSell,
        uint8[2] memory vs,
        bytes32[5] memory rssMetadata)
    external
    payable;
}

contract WrapperHelper {

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

    function getDataWyvernAtomicMatchWithError(WyvernOrders memory _openSeaBuy) external pure returns(bytes memory _data) {
        _data = abi.encodeWithSelector(IWyvernExchangeError.atomicMatchError_.selector, _openSeaBuy.addrs, _openSeaBuy.uints, _openSeaBuy.feeMethodsSidesKindsHowToCalls, _openSeaBuy.calldataBuy, _openSeaBuy.calldataSell, _openSeaBuy.replacementPatternBuy, _openSeaBuy.replacementPatternSell, _openSeaBuy.staticExtradataBuy, _openSeaBuy.staticExtradataSell, _openSeaBuy.vs, _openSeaBuy.rssMetadata);
    }

    function getDataERC721UsingCriteria(
        address from,
        address to,
        IERC721Upgradeable token,
        uint256 tokenId
    ) external pure returns(bytes memory _data) {
        _data = abi.encodeWithSelector(IMatchERC721.matchERC721UsingCriteria.selector, from, to, token, tokenId);
    }

    function getDataERC1155UsingCriteria(
        address from,
        address to,
        IERC1155Upgradeable token,
        uint256 tokenId,
        uint256 amount
    ) external pure returns(bytes memory _data) {
        _data = abi.encodeWithSelector(IMatchERC1155.matchERC1155UsingCriteria.selector, from, to, token, tokenId, amount);
    }

    function encodeOriginFeeIntoUint(address account, uint96 value) external pure returns(uint){
        return (uint(value) << 160) + uint(account);
    }

    function getDataExchangeV2SellOrders(LibOrder.Order memory orderLeft, bytes memory signatureLeft, uint purchaseAmount) external pure returns(bytes memory _data) {
        _data = abi.encode(orderLeft, signatureLeft, purchaseAmount);
    }
}