## Rarible protocol Exchange smart contracts

### Architecture

Rarible exchange smart contracts are built using openzeppelin's upgradeable smart contracts library. So the smart contract code can be updated to support new features, fix bugs etc.

Smart contracts are heavily tested, tests are provided in the test folder.

Functionality is divided into parts (each responsible for the part of algorithm).

Essentially, ExchangeV2 is a smart contract for decentralized exchange of any assets presented on Ethereum (or EVM compatible) blockchain.

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
- `Asset` leftAsset (see [LibAsset](../asset/contracts/LibAsset.md))
- `address` taker (can be zero address)
- `Asset` rightAsset (see [LibAsset](../asset/contracts/LibAsset.md))
- `uint` salt - random number to distinguish different maker's Orders (if salt = 0, then transaction should be executed by order.maker. then fill of the order is not saved)
- `uint` start - Order can't be matched before this date (optional)
- `uint` end - Order can't be matched after this date (optional)
- `bytes4` dataType - type of data, usually hash of some string, e.g.: "v1", "v2" (see more [here](./contracts/LibOrderData.md))
- `bytes` data - generic data, can be anything, extendable part of the order (see more [here](./contracts/LibOrderData.md))

#### Order validation

- check start/end date of the orders
- check if taker of the order is blank or taker = order.taker
- check if order is signed by its maker or maker of the order is executing the transaction
- if maker of the order is a contract, then ERC-1271 check is performed

TODO: currently, only off-chain orders are supported, this part of the smart contract ca be easily updated to support on-chain order books.

#### Asset matching

Purpose of this is to validate that **make asset** of the **left** order matches **take asset** from the **right** order and vice versa.
New types of assets can be added without smart contract upgrade. This is done using custom IAssetMatcher.

There are possible improvements to protocol using these custom matchers:

- support for parametric assets. For example, user can put order to exchange 10ETH to any NFT from popular collection.
- support for NFT bundles

#### Order execution

Order execution is done by TransferManager. There are 2 variants:

- SimpleTransferManager (it simply transfers assets from maker to taker and vice versa)
- RaribleTransferManager (sophisticated version, it takes in account protocol commissions, royalties etc)

TODO: There are plans to extend RaribleTransferManager to support more royalty schemes and add new features like custom fees, multiple order beneficiaries.

This part of the algorithm can be extended with custom ITransferExecutor. In future, new executors will be added to support new asset types, for example, executor for handling bundles can be added.

TODO: possible improvements:

- support bundles
- support random boxes

#### Fees

RaribleTransferManager supports these types of fees:
- protocol fees (are taken from both sides of the deal)
- origin fees (origin and origin fee is set for every order. it can be different for two orders involved)
- royalties (authors of the work will receive part of each sale)

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