#### Features

This contract provides burn method, which destroys `amount` tokens of token type `id` from `account`
 
There are 2 cases to understand how to burn 1155 tokens:
1. Burn can run by `token creator`. `Lazy tokens` will burn at first. If number need to burn more than number of `lazy tokens`, missing number of `minted tokens` will be burned (missing number = burnAmount - lazyAmount).  
2. Burn can run by `token owner` (or by address which is approved). Only `minted tokens` can be burned.

See tests [here](../../test/erc-1155/ERC1155Rarible.test.js) for all possible variants