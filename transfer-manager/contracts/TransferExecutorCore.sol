// SPDX-License-Identifier: MIT

pragma solidity 0.7.6;

import "@rarible/royalties/contracts/IRoyaltiesProvider.sol";
import "@rarible/lib-asset/contracts/LibAsset.sol";
import "@rarible/libraries/contracts/BpLibrary.sol";

import "@openzeppelin/contracts-upgradeable/proxy/Initializable.sol";
import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/math/SafeMathUpgradeable.sol";

import "./lib/LibTransfer.sol";

contract TransferExecutorCore is Initializable, OwnableUpgradeable{
    using BpLibrary for uint;
    using SafeMathUpgradeable for uint;

    IRoyaltiesProvider public royaltiesRegistry;

    address public defaultFeeReceiver;
    mapping(address => address) public feeReceivers;

    mapping (bytes4 => address) proxies;

    event ProxyChange(bytes4 indexed assetType, address proxy);

    function __TransferExecutorCore_init_unchained(
        address newDefaultFeeReceiver,
        IRoyaltiesProvider newRoyaltiesProvider,
        address transferProxy,
        address erc20TransferProxy
    ) internal initializer {
        defaultFeeReceiver = newDefaultFeeReceiver;
        royaltiesRegistry = newRoyaltiesProvider;
        proxies[LibAsset.ERC20_ASSET_CLASS] = erc20TransferProxy;
        proxies[LibAsset.ERC721_ASSET_CLASS] = transferProxy;
        proxies[LibAsset.ERC1155_ASSET_CLASS] = transferProxy;
    }

    function setRoyaltiesRegistry(IRoyaltiesProvider newRoyaltiesRegistry) external onlyOwner {
        royaltiesRegistry = newRoyaltiesRegistry;
    }

    function setDefaultFeeReceiver(address payable newDefaultFeeReceiver) external onlyOwner {
        defaultFeeReceiver = newDefaultFeeReceiver;
    }

    function setFeeReceiver(address token, address wallet) external onlyOwner {
        feeReceivers[token] = wallet;
    }

    function getFeeReceiver(address token) public view returns (address) {
        address wallet = feeReceivers[token];
        if (wallet != address(0)) {
            return wallet;
        }
        return defaultFeeReceiver;
    }

    function setTransferProxy(bytes4 assetType, address proxy) external onlyOwner {
        proxies[assetType] = proxy;
        emit ProxyChange(assetType, proxy);
    }

    function subFeeInBp(uint value, uint total, uint feeInBp) internal pure returns (uint newValue, uint realFee) {
        return subFee(value, total.bp(feeInBp));
    }

    function subFee(uint value, uint fee) internal pure returns (uint newValue, uint realFee) {
        if (value > fee) {
            newValue = value.sub(fee);
            realFee = fee;
        } else {
            newValue = 0;
            realFee = value;
        }
    }

    function parseFeeData(uint data) public pure returns(address, uint96) {
        return (address(data), uint96(data >> 160));
    }
}