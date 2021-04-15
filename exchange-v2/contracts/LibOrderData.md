#### Features

`Order` data can be generic. `dataType` field defines format of that data.

LibOrderData defines function parse which parses data field (according to dataType) and converts any version of the data to the latest supported by contract. 
(see [LibOrder](LibOrder.md) `Order.data` field)

