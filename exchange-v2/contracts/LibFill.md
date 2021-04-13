#### Features

This library provides `fillOrder` function. It calculates fill of both orders (part of the Order that can be filled).
 
It takes these parameters:
- `Order` leftOrder - left order (sent to matchOrders)
- `Order` rightOrder - right order (sent to matchOrders)
- `uint` leftOrderFill - previous fill for the left `Order` (zero if it's not filled)
- `uint` rightOrderFill - previous fill for the right `Order` (zero if it's not filled)

If orders are fully filled, then left order's make value is equal to right's order take value and left order's take value is equal to right order's make value.

There are 3 cases to calculate new fills:
1. Left order's take value > right order's make value
2. Right order's take value > left order's make value
3. Otherwise

See tests [here](../test/v2/LibFill.test.js) for all possible variants