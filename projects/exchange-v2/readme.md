## Rarible protocol Exchange smart contracts

### Architecture

Rarible exchange smart contracts are built using openzeppelin's upgradeable smart contracts library. So the smart contract code can be updated to support new features, fix bugs etc.

Smart contracts are heavily tested, tests are provided in the test folder.

Functionality is divided into parts (each responsible for the part of algorithm).

Essentially, ExchangeV2 is a smart contract for decentralized exchange of any assets presented on Ethereum (or EVM compatible) blockchain.

### Security Audit

Security Audit was done by ChainSecurity: https://chainsecurity.com/security-audit/rarible-exchange-v2-smart-contracts/

### Algorithms

Main function in the Exchange is matchOrders. It takes two orders (left and right), tries to match them and then fills if there is a match.

Logically, whole process can be divided into stages:

- order validation (check order parameters are valid and caller is authorized to execute the order)
- asset matching (check if assets from left and right order match, extract matching assets)
- calculating fill (finding out what exact values should be filled. orders can be matched partly if one of the sides doesn't want to fill other order fully)
- order execution (execute transfers, save fill of the orders if needed)

#### Domain model

**Order**:

- `address` maker
- `Asset` leftAsset (see [LibAsset](../lib-asset/contracts/LibAsset.md))
- `address` taker (can be zero address)
- `Asset` rightAsset (see [LibAsset](../lib-asset/contracts/LibAsset.md))
- `uint` salt - random number to distinguish different maker's Orders (if salt = 0, then transaction should be executed by order.maker. then fill of the order is not saved)
- `uint` start - Order can't be matched before this date (optional)
- `uint` end - Order can't be matched after this date (optional)
- `bytes4` dataType - type of data, usually hash of some string, e.g.: "v1", "v2" (see more [here](./contracts/libraries/LibOrderData.md))
- `bytes` data - generic data, can be anything, extendable part of the order (see more [here](./contracts/libraries/LibOrderData.md))

#### Order execution

When user signs the order he states the following: 

I would like to exchange my asset (make), up to make asset value, in return I would like to get take asset, not more than take value. Orders can be filled partly, but in this case rate of the exchange should be the same or should be more profitable for me.

This means:
- user can give less than make.value
- user can't receive more than take.value (order is filled when user gets what he wants to receive)

Fill of the order is saved inside smart contract and it relates to the take order part. Fill is stored inside mapping, where key is calculated using these fields: maker, make asset type, take asset type, salt. It means, fill of the orders which differ only in exchange rate, are stored in the same mapping slot.

Also, orders which are fully filled, can be extended: users can sign new orders using the same salt (they can increase make.value and take.value for example).

Order rate priority: if rates for the exchange differ, but orders can be filled (for example, left order is 10X -> 100Y, but right is 100Y -> 5X), then left order dictates exchange rate.

Rounding errors: to calculate fill amounts, mathematical operations are used. When rounding is performed and error is more than 0.1%, rounding error will be thrown and order can't be executed.

#### Order validation

- check start/end date of the orders
- check if taker of the order is blank or taker = order.taker
- check if order is signed by its maker 
    - or maker of the order is executing the transaction
- if maker of the order is a contract, then ERC-1271 check is performed

TODO: currently, only off-chain orders are supported, this part of the smart contract can be easily updated to support on-chain order books.

#### Asset matching

Purpose of this is to validate that **make asset** of the **left** order matches **take asset** from the **right** order and vice versa.
New types of assets can be added without smart contract upgrade. This is done using custom IAssetMatcher.

There are possible improvements to protocol using these custom matchers:

- support for parametric assets. For example, user can put order to exchange 10ETH to any NFT from popular collection.
- support for NFT bundles

#### Transfers execution

Transfers are done by TransferManager. There are 2 variants:

- SimpleTransferManager (it simply transfers assets from maker to taker and vice versa)
- RaribleTransferManager (sophisticated version, it takes in account protocol commissions, royalties etc)

TODO: There are plans to extend RaribleTransferManager to support more royalty schemes and add new features like custom fees, multiple order beneficiaries.

This part of the algorithm can be extended with custom ITransferExecutor. In future, new executors will be added to support new asset types, for example, executor for handling bundles can be added.

TODO: possible improvements:

- support bundles
- support random boxes

#### Executing ETH transfers

Makers of the orders and addresses in payouts field in `order.data` can be contracts. So, these contracts should have payable fallback functions to accept incoming ETH transfers. In other cases tx will fail.

The same applies to origin field, royalties receivers.

#### Fees

RaribleTransferManager supports these types of fees:
- protocol fees (are taken from both sides of the deal)
- origin fees (origin and origin fee is set for every order. it can be different for two orders involved)
- royalties (authors of the work will receive part of each sale)

Royalties of the item can not be more than 30% for security reasons. If royalties are more than 30%, transaction is reverted.

##### Fees calculation, fee side

To take a fee we need to calculate, what side of the deal can be used as money.
There is a simple algorithm to do it:
- if ETH is from any side of the deal, it's used
- if not, then if ERC-20 is in the deal, it's used
- if not, then if ERC-1155 is in the deal, it's used
- otherwise, fee is not taken (for example, two ERC-721 are involved in the deal)

When we established, what part of the deal can be treated as money, then we can establish, that
- buyer is side of the deal who owns money
- seller is other side of the deal

Then total amount of the asset (money side) should be calculated
- protocol fee is added on top of the filled amount
- origin fee of the buyer's order is added on top too

If buyer is using ERC-20 token for payment, then he must approve at least this calculated amount of tokens.

If buyer is using ETH, then he must send this calculated amount of ETH with the tx.

##### Cancelling the order

cancel function can be used to cancel order. Such orders won't be matched and error will be thrown. This function is used by order maker to mark orders unfillable. This function can be invoked only by order maker.

TODO: there is possibility to change authorization for cancel function - add authorization by signature. Possibly, this will be added in the future.

##### Contract events

ExchangeV2 contract emits these events:
- Match (when orders are matched)
- Cancel (when user cancels the order)

TODO: currently, there are no indexed fields in events, because rarible protocol uses internal indexing. Possibly, indexed fields will be added in future.  
