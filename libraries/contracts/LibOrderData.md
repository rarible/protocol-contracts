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
    - no `protocolFee`
    - `originFees` from buy-order is taken from the buyer, `originFees` from sell-order is taken from the seller. e.g. sell order is `1 ERC721` => `100 ETH`, buy order is `100 ETH` => `1 ERC721`. Buy order has `originFees` = [`{5% to addr1}`,`{10% to addr2}`]. Sell order has `originFees` = [`{5% to addr3}`]. Then, total amount that buyer needs to send is `100 ETH` + `5%*100ETH` + `10%*100ETH` = `115 ETH` (15% more than order value, buy-order `origin fees` are added. So buyer pays for their `origin fees`). From this amount `5 ETH` will be transfered to addr1, `10 ETH` to addr2 (now we have `100ETH` left) and `5ETH` to addr3 (it is seller `origin fee`, so it is taken from their part).
    - after that NFT `royalties` are taken
    - what's left after that is distributed according to sell-order `payouts`
- `"V2"`
  - fields
    - `LibPart.Part[] payouts`, works the same as in `V1` orders
    - `LibPart.Part[] originFees`, works the same as in `V1` orders
    - `bool isMakeFill`
      - if false, order's `fill` (what part of order is completed, stored on-chain) is calculated from take side (in `V1` orders it always works like that)
      - if true, `fill` is calculated from the make side of the order
    - fees logic, works the same as in `V1` orders
- `"V3"` two types of `V3` orders. 
  - `"V3_BUY"`
    - fields
      - `LibPart.Part[] payouts`, works the same as in `V1` orders
      - `uint originFee`, instead of array there can only be 1 originFee, and address + amount is encoded into uint, not using `LibPart.Part` struct
      - `bool isMakeFill`, works the same as in `V2` orders
  - `"V3_SELL"`
    - fields
      - `LibPart.Part[] payouts`, works the same as in `V1` orders
      - `uint originFee`, instead of array there can only be 1 originFee, and address + amount is encoded into uint, not using `LibPart.Part` struct
      - `bool isMakeFill`, works the same as in `V2` orders
      - `uint maxFeesBasePoint`
        - maximum amount of fees that can be taken from payment (e.g. 10%)
        - chosen by seller, that's why it's only present in `V3_SELL` orders
        - `maxFeesBasePoint` should be more than `0`
        - `maxFeesBasePoint` should be more than `protocolFee`
        - `maxFeesBasePoint` should not be bigger than `10%`
  - `V3` orders can only be matched if buy-order is `V3_BUY` and the sell-order is `V3_SELL`
  - fees logic
    - `V3` orders' fees work differently from all previous orders types
    - `prtocolFee` is used and taken from seller side
    - `originFees` are taken from seller side only.
    - sum of `prtocolFee` + buy-order `originFees` + sell-order `originFees` should not be bigger than `maxFeesBasePoint`
    - example:
      - `prtocolFee` is 3%
      - sell order is `1 ERC721` => `100 ETH`
        - `maxFeesBasePoint` is 10 %
        - Sell order has `originFee` = `{2% to addr3}`
      - buy order is `100 ETH` => `1 ERC721`
        - Buy order has `originFee` = `{5% to addr1}`. 
      - total amount for buyer is not affected by fees. it remains `100 ETH`
      - so, `3% * 100 ETH` is transfered as protocolFee, `97 ETH `remaining
      - `5% * 100 ETH` is taken as buy order's origin fee, `92 ETH` remaining
      - `2% * 100 ETH` is taken as sell order's origin, `90 ETH` remaining
      - after that NFT `royalties` are taken (same as with previous orders' types)
      - what's left after that is distributed according to sell-order `payouts` (same as with previous orders' types)



## Data parsing

LibOrderData defines function parse which parses data field (according to dataType) and converts any version of the data to the GenericOrderData struct. 
(see [LibOrder](LibOrder.md) `Order.data` field)



