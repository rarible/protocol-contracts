#### Features

OrderValidator is [EIP-712](https://github.com/ethereum/EIPs/blob/master/EIPS/eip-712.md) Order signature validator. It also supports [EIP-1271](https://github.com/ethereum/EIPs/blob/master/EIPS/eip-1271.md) signature validation.

##### Algorithm 

If msg sender is `order.maker`, then order validation is not needed. 

Otherwise, `Order` hash is calculated using [EIP-712](https://github.com/ethereum/EIPs/blob/master/EIPS/eip-712.md). Types for calculating hashes can be found [here](./LibOrder.md).

If `order.maker` is a contract, then signature is checked using [EIP-1271](https://github.com/ethereum/EIPs/blob/master/EIPS/eip-1271.md) (calling `isValidSignature` function). If contract returns any value not equal to MAGICVALUE(0x1626ba7e) the function reverts.

Otherwise signer is recovered using ECDSA. If signer is not `Order.maker`, then function reverts.
