#### Features

This contract provides `gasless` execution methods, which detects as metaTransaction.
For using metaTransaction need to inherit contract EIP712MetaTransaction.

Method `__MetaTransaction_init_unchained` - detect uniq name for signing all transactions, takes these parameters:
- `string` name - contract name;
- `string` version - contract version.

Method `executeMetaTransaction` - for execute function, takes these parameters:
- `address` userAddress - address who execute and pay for transaction;
- `bytes` functionSignature - method signature;
- `bytes32` sigR - signature R;
- `bytes32` sigS - signature S;
- `bytes32` sigV - signature V;
- `bytes`  - return result of function, which `functionSignature` detect in parameter.


Method `getNonce` - return id transaction, for generating uniq signature
- `address` userAddress - address who execute and pay for transaction;
- `uint256` nonce.

Don't forget about method `_msgSender()` - reterns address, who call metaTransaction. Use this method insted of msg.sender.

See tests [here](../test/v2/EIP712MetaTransaction.test.js) to make clear transfer metaTransactions