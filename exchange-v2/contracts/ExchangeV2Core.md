#### Features

The file contains a list of widely used functions: `cancel`, `matchOrders`, `directPurchase`, `directAcceptBid`.   

##### Algorithm `cancel(Order order)`

Two main requirements for function are:
 - If msg sender is `order.maker`,
 - Order.salt not equal to 0.

`Order` hash is calculated using [EIP-712](https://github.com/ethereum/EIPs/blob/master/EIPS/eip-712.md). Value  equal to max uint256 value is set to map `fills` with key == `Order` hash.

##### Algorithm `matchOrders(Order orderLeft, bytes signatureLeft,  Order orderRight, bytes signatureRight)` 

Orders are being validated by `validateOrders()` internal function, if error is find, function being reverted.

Next step is `matchAssets` function, should calculate if Asset types match with each other.

Next step is parsing `Order.data`. After that fumction `setFillEmitMatch()` calculates fills for the matched orders and set them in "fills" mapping. Finally `doTransfers()` function is called.

##### Algorithm `directPurchase(Purchase  direct)` or `directAcceptBid(AcceptBid  direct)`

We recommend use `directPurchase` and `directAcceptBid` methods for reducing the gas consumption. Data from the structures `Purchase` and `AcceptBid` form purchase and sell Orders. Orders are being validated by `validateOrders()` internal function. Further Orders serve as parameters of the function `matchAndTransfer()`.

##### Contract relationship

For better understanding how contracts interconnect and what functions are used, see picture:
![Relationship1](documents/diagram-13983673345763902680.png)