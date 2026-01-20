# Native Split Payments

EVM Native Split Payments Contract - allows any user to atomically split a native currency payment (ETH/MATIC/etc) to multiple recipients in a single transaction.

## Features

- **Permissionless**: Any address can call payment methods
- **Atomic**: All-or-nothing execution - if any transfer fails, entire transaction reverts
- **No stuck funds**: Contract rejects arbitrary deposits via `receive()` and `fallback()`
- **Exact matching**: Sum of payout amounts must equal `msg.value`

## Functions

### `pay2(address to1, uint256 a1, address to2, uint256 a2)`

Splits `msg.value` into 2 exact payouts.

### `payMany(address[] recipients, uint256[] amounts)`

Splits `msg.value` into N exact payouts (N = 1..6).

## Events

```solidity
event Payment(address indexed payer, address indexed to, uint256 amount);
```

## Custom Errors

- `InvalidValue()` - msg.value == 0
- `InvalidAmount()` - any payout amount is 0
- `LengthMismatch()` - recipients.length != amounts.length
- `InvalidLength()` - payMany length is 0 or > 6
- `ZeroAddress()` - any recipient is address(0)
- `SelfAddress()` - any recipient is address(this)
- `InvalidTotal()` - sum of amounts != msg.value
- `TransferFailed(address to, uint256 amount)` - native transfer failed

## Development

### Install dependencies

```bash
yarn install
```

### Compile

```bash
yarn compile
```

### Run tests

```bash
yarn test
```

### Deploy

```bash
NETWORK=<network> yarn deploy --network <network>
```

## Security

- Contract is stateless (no balance retention, no storage mutation)
- No admin privileges, no ownership, no upgradability
- Uses low-level `call{value}` for transfers (not `transfer()` or `send()`)
- Recipient contracts can cause DoS by reverting, which is expected under atomicity requirements

## License

MIT
