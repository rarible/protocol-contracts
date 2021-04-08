// SPDX-License-Identifier: MIT

pragma solidity >=0.6.9 <0.8.0;
pragma abicoder v2;

import "../../../contracts/exchange/v2/TransferExecutor.sol";

contract TransferExecutorTest is Initializable, OwnableUpgradeable, TransferExecutor {

    function __TransferExecutorTest_init(INftTransferProxy _transferProxy, IErc20TransferProxy _erc20TransferProxy) external initializer {
        __Ownable_init_unchained();
        __TransferExecutor_init_unchained(_transferProxy, _erc20TransferProxy);
    }

    function transferTest(LibAsset.Asset calldata asset, address from, address to) payable external {
        TransferExecutor.transfer(asset, from, to, 0x00000000, 0x00000000);
    }
}
