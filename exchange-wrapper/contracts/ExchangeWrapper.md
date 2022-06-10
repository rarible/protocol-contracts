# ExchangeWrapper contract

## Features

`ExchangeWrapper` contract is a top-level wrapper over `ExchangeV2` and `WyvernExchangeWithBulkCancellations` contracts. It performs single or array transfers of Rarible and OpenSea orders.

## Algorithm

`ExchangeWrapper` working with ETH transfers only.

To start transfer, use:

* `singlePurchase(PurchaseDetails purchaseDetails, uint[] fees)` for one order transfer
* `bulkPurchase(PurchaseDetails[] purchaseDetails, uint[] fees)` for multiple orders transfer

The main difference is that `singlePurchase` method process a single structure, but `bulkPurchase` method process an array of `PurchaseDetails`.

For correct operation, each order must be packed into a structure:

```
struct PurchaseDetails {
  Markets marketId;
  uint256 amount;
  bytes data;
}
```

* `marketId` – defines the type of marketplace from `enum Markets`:

   ```
   enum Markets {
     ExchangeV2,
     WyvernExchange
   }
  ```

* `amount` – cost in WEI
* `data` – orders data for transfer

For OpenSea orders `tradeData` field encoded as shown in the [example](../test/contracts/v2/ExchangeBulkV2Test.sol) of the `getDataWyvernAtomicMatch` method. It is important that for OpenSea orders it is necessary to form a sell order. You don't need to sign it. You need to set `order.maker` ==  `ExchangeWrapper.address` in the sale order, and set the buyer's address in the `calldataBuy` field.

For Rarible orders `tradeData` field encoded as shown in the [example](../test/contracts/v2/ExchangeBulkV2Test.sol) of the `getDataExchangeV2SellOrders` method. It is important that it is not necessary to form a sell order for Rarible orders, it will be formed inside the `bulkTransfer` method.

In the `singlePurchase` and `bulkPurchase` methods, the `uint` array is passed – this is the commission's array. Each element of the array contains the commission value and the address to. The first 12 bytes is the commission value. Provided 100 is 1%, 10000 is 100%. The next 20 bytes is the address to whom to transfer the commission.

It is allowed to transfer mixed orders of Rarible and OpenSea encapsulated in the structure of the `PurchaseDetails` to the `bulkPurchase` method.

## Tests

See tests [here](../test/v2/ExchangeBulkV2.rarible.test.js).
