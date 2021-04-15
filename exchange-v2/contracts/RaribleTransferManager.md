### Features

[RaribleTransferManager](./RaribleTransferManager.sol) is [ITransferManager](./ITransferManager.sol).
It's responsible for transferring all Assets. This manager supports different types of fees, also it supports different beneficiaries (specified in Order.data)  

Types of fees supported:
- protocol fee (controlled by `protocolFee` field) 
- origin fee (is coming from Order.data)
- royalties (provided by external IRoyaltiesProvider)

### Algorithm

At first, fee side of the deal should be calculated (Asset with can be interpreted like money). All fees and royalties will be take in that Asset.

Then fees are transferred to different types of agents
