# ExchangeWrapper contract

## Features

`ExchangeWrapper` contract is a top-level wrapper over `ExchangeV2`, `WyvernExchangeWithBulkCancellations`, `SeaPort`, `X2Y2`, `LooksRare` contracts. 
It performs single or array transfers of Rarible, Wyvern, SeaPort, X2Y2, LooksRare `Orders`.

`ExchangeWrapper` can be paused and up-paused by owner.
## Algorithm

`ExchangeWrapper` working with ETH transfers only.

To start transfer, use:

* `singlePurchase(PurchaseDetails purchaseDetails, address feeRecipientFirst, address feeRecipientSecond)` for one order transfer
* `bulkPurchase(PurchaseDetails[] purchaseDetails, address feeRecipientFirst, address feeRecipientSecond, bool allowFai)` for multiple orders transfer

The main difference is that `singlePurchase` method process a single structure, but `bulkPurchase` method process an array of `PurchaseDetails` structure.

For correct operation, each order must be packed into a structure:

```
struct PurchaseDetails {
  Markets marketId;
  uint256 amount;
  uint fees;
  bytes data;
}
```

* `marketId` – defines the type of marketplace from `enum Markets`:

   ```
   enum Markets {
     ExchangeV2,
     WyvernExchange,
     SeaPortAdvancedOrders,
     X2Y2,
     LooksRareOrders
   }
  ```

* `amount` – cost in WEI
* `data` – orders data for transfer
* `fees` - 2 fees (in base points) that are going to be taken on top of order amount encoded in one value type uint256
  bytes (29,30) used for the first value (goes to feeRecipientFirst)
  bytes (31,32) are used for the second value (goes to feeRecipientSecond)

For Wyvern orders `data` field encoded as shown in the [example](../test/contracts/WrapperHelper.sol) of the `getDataWyvernAtomicMatch` method. For Wyvern orders it is necessary to form a sell order. Don't need to sign it, because field `order.maker` ==  `ExchangeWrapper.address` in the sale order (maker == msg.sender), and set the buyer's address in the `calldataBuy` field.

For Rarible orders `data` field encoded as shown in the [example](../test/contracts/WrapperHelper.sol) of the `getDataExchangeV2SellOrders` method. It is not necessary to form a sell order for Rarible orders, it will be formed inside the `bulkTransfer` method.

For SeaPort orders `data` field encoded as shown in the [example](../test/contracts/WrapperHelper.sol) of the `getDataSeaPortFulfillAvailableAdvancedOrders` method. 

For X2Y2 orders `data` field encoded as shown in the [example](../test/contracts/WrapperHelper.sol) of the `encodeData` method. 

For LooksRare orders `data` field encoded as shown in the [example](../test/contracts/WrapperHelper.sol) of the `getDataWrapperMatchAskWithTakerBidUsingETHAndWETH` method. 

When executing the method `bulkPurchase`, all commissions are summed up and transferred only to the two recipients specified in the parameters `feeRecipientFirst` and `feeRecipientSecond`. 

In the `bulkPurchase` method, last input parameter is flag `allowFail` - true if fails while executing orders are allowed, false if fail of a single order means fail of the whole batch.

It is allowed to transfer mixed orders of all supported marketplaces, encapsulated in the structure of the `PurchaseDetails` to the `bulkPurchase` method.

## Tests

See tests [here](../../deploy/test/wrapper/ExchangeWrapper.test.js).
