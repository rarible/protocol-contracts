#### Features

`TransferExecutor.transfer` function should be able to transfer any supported Asset (see more at [LibAsset](../../asset/contracts/LibAsset.md)) from one side of the order to the other side of the order.

Transfer is made using different types of contracts. There are 3 types of transfer proxies used by `TransferExecutor`:
- INftTransferProxy - this proxy is used to transfer NFTs (ERC-721 and ERC-1155)
- IERC20TransferProxy - this proxy is used to transfer ERC20 tokens
- ITransferProxy - this is generic proxy used to transfer all other types of Assets

`TransferExecutor` has setTransferProxy to register new types of transfer proxies (when new types of Assets gets registered)
