pragma solidity ^0.7.0;

import "../../../contracts/exchange/v2/TransferExecutor.sol";
pragma abicoder v2;

contract TransferExecutorTest is Initializable, OwnableUpgradeable, TransferExecutor {

    function __TransferExecutorTest_init(TransferProxy _transferProxy, ERC20TransferProxy _erc20TransferProxy) external initializer {
        __Ownable_init_unchained();
        __TransferExecutor_init_unchained(_transferProxy, _erc20TransferProxy);
    }

    function transferTest(LibAsset.Asset calldata asset, address from, address to) payable external {
        TransferExecutor.transfer(asset, from, to, 0x00000000);
    }
}
