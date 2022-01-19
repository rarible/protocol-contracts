### Features

[RaribleTransferManager](RaribleTransferManager.sol) is [ITransferManager](../../exchange-v2/contracts/ITransferManager.sol).
It's responsible for transferring all Assets. This manager supports different types of fees, also it supports different beneficiaries (specified in Order.data)  

Types of fees supported:
- protocol fee (controlled by `protocolFee` field) 
- origin fee (is coming from `Order.data`)
- royalties (provided by external `IRoyaltiesProvider`)

### Algorithm
The transfering of assets takes places inside `doTransfers`, it takes following parameters as arguments:
- `LibAsset.AssetType` `makeMatch` - `AssetType` of a make-side asset of the order
- `LibAsset.AssetType` `takeMatch` - `AssetType` of a take-side asset of the order
- `LibFill.FillResult` `fill` - values from both sides to be transfered by this match
- `LibOrder.Order` `leftOrder` - left order data
- `LibOrder.Order` `rightOrder` - right order data

Then, in this method the following actions are done:

1. At first, fee side of the deal is calculated (Asset that can be interpreted as money). All fees and royalties will be taken in that Asset.
    - to do so, we use `LibFeeSide.getFeeSide`, it takes assetClasses of both sides as arguments (e.g. "`ETH`" and "`ERC20`") and tries to determine which side is the fee side
    - firstly it checks both assets for being `ETH`, if assetClass of any side is `ETH` then that side is the fee-side
    - if there is no `ETH` in this match, both sides are checked for being `ERC20`
    - then both sides are checked for being `ERC1155`
    - if there are no `ETH`, `ERC20` or `ERC1155` in this match, then the fee side is `NONE`
    - checks are made from make to take side, e.g. if both sides are `ERC20` then the make side is the fee side

2. then transfers are made:
    - if fee side is make:
        - `doTransfersWithFees` is called for the make side,
        - `transferPayouts` for the take side
    - fee side is take 
        - `doTransfersWithFees` is called for the take side,
        - `transferPayouts` for the make side
    - fee side is NONE:
        - `transferPayouts` is called for both sides

- `doTransfersWithFees` 
    - calculates total amount of asset that is going to be transfered
    - transfers protocol fee to protocol/community
        - now protocol fee is set at 3%
        - both users pay protocol fee and origin fees (from their order), so if the fee side value is 100 eth, the user that sends ether should send at least 
            ```
            amount + (protocol fee + origin fees) * amount = 100 + 0,03*100 = 103 ETH
            ```
            and the user that gets ether will get
            ```
            amount - (protocol fee + origin fees) * amount = 100 - 0,03*100 = 97 ETH
            ``` 
    - then royalties are transfered
        - royalty is a fee that transfered to creator of `ERC1155`/`ERC721` token from every purchase
        - royalties can't be over 50 %
    - after that, origin fees are tranfered
        - origin fees can be added to any order, it's an array of address + value
    - finally, `transferPayouts` is executed as the final action of `doTransfersWithFees`

![Fees](../../exchange-v2/images/fees.svg)

- `transferPayouts`
    - tranfers assets to payout address
    - orders can have any number of payout addresses, e.g. payouts can be split 50/50 between 2 accounts, or any other way
    - payuots are set in order by order maker
    - if `transferPayouts` called in the end of `doTransfersWithFees`, then it tranfers all that's left after paying fees
    - if `transferPayouts` called for the nft side (non fee side), then it tranfers full amount of this asset


So, to sum it all up, lets try to calculate all fees for a simple example
- there are 2 orders
    1. `ETH 100` => `1 ERC721`, `orderMaker` = acc1, `origins` = [[acc2, 3%], [acc3, 10%]], `payouts` = [[acc1, 100%]] 
    2. `1 ERC721` => `100 ETH`, `orderMaker` = acc4, `origins` = [[]], `payouts` = [[acc4, 70%], [acc5, 30%]]
- royalty is set to 30%
- these are new orders, so they don't have previous fills
- fee side here is ETH, so we do
    - `transferPayouts`(1 ERC721)
        - there is only one payout address and 1 token, so it simply gets tranfered to acc1
    - `doTransfersWithFees`(100 ETH)
        - let's assume protocol fee = 3%
        - let's calculate ETH amount to be sent by acc1
            - 100 ETH + 3% protocolFee + 3% acc2-origin + 10% acc3-origin = 100 + 0,16*100 = 116 ETH
        - so acc1 needs to send 116 ETH, from which 3 is going to be his part of the protocol fee, 3 sent to acc2 as origin, 10 sent to acc3 as origin too
        - 3 more ETH are taken as acc4 prtocol fee, 97 left
        - 30 ETH payed as royalty to nft creator, 67 left
        - right order doesn't have origins, so we skip it
        - what's left is divided between acc4 and acc5, as it says in right order payouts (`payouts` = [[acc4, 70%], [acc5, 30%]]), so 20,1 ETH goes to acc5, 46,9 ETH to acc4



    
