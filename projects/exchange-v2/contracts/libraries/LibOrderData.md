# Features

## Data types, corresponding transfers/fees logic
`Order` data can be generic. `dataType` field defines format of that data.
- `"0xffffffff"` or `"no type"`
  - no data
  - fees logic
    - no fees 
- `"V1"`
  - fields
    - `LibPart.Part[] payouts`
      - array of payouts, i.e. how takeAsset of the order is going to be distributed. (usually 100% goes to order.maker, can be something like 50% goes to maker, 50% to someone else. it can be divided in any other way)
    - `LibPart.Part[] originFees`
      - additional fees (e.g. 5% of the payment goes to additional address)
  - fees logic
    - `originFees` from buy-order is taken from the buyer, `originFees` from sell-order is taken from the seller. e.g. sell order is `1 ERC721` => `100 ETH`, buy order is `100 ETH` => `1 ERC721`. Buy order has `originFees` = [`{5% to addr1}`,`{10% to addr2}`]. Sell order has `originFees` = [`{5% to addr3}`]. Then, total amount that buyer needs to send is `100 ETH` + `5%*100ETH` + `10%*100ETH` = `115 ETH` (15% more than order value, buy-order `origin fees` are added. So buyer pays for their `origin fees`). From this amount `5 ETH` will be transfered to addr1, `10 ETH` to addr2 (now we have `100ETH` left) and `5ETH` to addr3 (it is seller `origin fee`, so it is taken from their part).
    - after that NFT `royalties` are taken
    - what's left after that is distributed according to sell-order `payouts`
    - contract-level protocol fees are not enabled on `V1` orders

- `"V2"`
  - fields
    - `LibPart.Part[] payouts`, works the same as in `V1` orders
    - `LibPart.Part[] originFees`, works the same as in `V1` orders
    - `bool isMakeFill`
      - if false, order's `fill` (what part of order is completed, stored on-chain) is calculated from take side (in `V1` orders it always works like that)
      - if true, `fill` is calculated from the make side of the order
    - fees logic
      - works the same as in `V1` orders
      - contract-level protocol fees are not enabled on `V2` orders

- `"V3"`
  - fields
    - `LibPart.Part[] payouts`, works the same as in `V1` and `V2` orders
    - `LibPart.Part[] originFees`, works the same as in `V1` and `V2` orders
    - `bool isMakeFill`, works the same as in `V2` orders
  - fees logic
    - works the same as in `V1` and `V2` orders, with the difference that the contract-level protocol fee is enabled.
    - `originFees` are taken from both sides, but the protocol fee is also deducted in the following manner:
      - if the protocol fee is set with values greater than zero, it is deducted as `uint48 buyerAmount` percentage for the buyer, and `uint48 sellerAmount` percentage for the seller. 
      - for direct reference on the protocolFee, check [RaribleTransferManager.sol](../../../transfer-manager/contracts/RaribleTransferManager.sol)




## Data parsing

LibOrderData defines function parse which parses data field (according to dataType) and converts any version of the data to the GenericOrderData struct. 
(see [LibOrder](LibOrder.md) `Order.data` field)



