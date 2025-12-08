# Upgrade Executor

The Upgrade Executor is a governance contract that serves as the owner of all Rarible protocol contracts. It enables secure, on-chain governance for protocol upgrades and parameter changes through the RARI DAO.

## Overview

The `UpgradeExecutor` contract uses a delegatecall pattern to execute "action" contracts. This design allows:

- Multiple operations to be batched in a single transaction
- Complex upgrade logic to be encapsulated in separate action contracts
- Governance proposals to be executed atomically

**Deployed Address (Mainnet):** `0xb23BCD4F668365B1c9Ec4B4DF79915bF8c76C5b5`

## Architecture

```
┌─────────────────┐     ┌──────────────────┐     ┌──────────────────┐
│   RARI DAO      │────▶│ UpgradeExecutor  │────▶│  Action Contract │
│   (Tally)       │     │  (delegatecall)  │     │  (stateless)     │
└─────────────────┘     └──────────────────┘     └──────────────────┘
                                                          │
                                                          ▼
                                                 ┌─────────────────┐
                                                 │ Target Contract │
                                                 │ (Exchange, etc) │
                                                 └─────────────────┘
```

## Roles

| Role | Description |
|------|-------------|
| `ADMIN_ROLE` | Can manage roles. The UpgradeExecutor itself holds this role. |
| `EXECUTOR_ROLE` | Can call the `execute()` function. Typically held by the DAO timelock. |

## Available Actions

### SetProtocolFeeAction

Sets protocol fee parameters on the Exchange contract.

```solidity
contract SetProtocolFeeAction {
    function perform(address _receiver, uint48 _buyerAmount, uint48 _sellerAmount) external;
}
```

### ProxyUpgradeAction

Upgrades a proxy contract to a new implementation.

```solidity
contract ProxyUpgradeAction {
    function perform(address admin, address payable target, address newLogic) public;
}
```

### OwnershipTransferAction

Transfers ownership of an Ownable contract.

```solidity
contract OwnershipTransferAction {
    function perform(address target, address newOwner) public;
}
```

### TimelockAdminshipTransferAndRenounceAction

Transfers timelock admin role and renounces the old admin.

```solidity
contract TimelockAdminshipTransferAndRenounceAction {
    function perform(address target, address newOwner) public;
}
```

## Real Governance Examples (Tally)

All governance proposals are created and executed through [Tally](https://www.tally.xyz/gov/rari-foundation). Below are real examples from the RARI Foundation DAO.

### Example 1: Set Rarible ExchangeV2 Protocol Fee

**Real Proposal:** [Set Rarible ExchangeV2 Protocol Fee](https://www.tally.xyz/gov/rari-foundation/proposal/24573162031860288524847391930314236095749684778105607842870834604070608008760)

This proposal sets the protocol fee parameters on the Rarible ExchangeV2 contract, defining the fee receiver address and the fee amounts for buyers and sellers.

**How it works:**

1. A `SetProtocolFeeAction` contract is deployed with the ExchangeV2 address:

```solidity
SetProtocolFeeAction action = new SetProtocolFeeAction(exchangeV2Address);
```

2. The action's `perform()` function is encoded with fee parameters:

```javascript
const actionInterface = new ethers.utils.Interface([
  "function perform(address _receiver, uint48 _buyerAmount, uint48 _sellerAmount)"
]);

const actionCalldata = actionInterface.encodeFunctionData("perform", [
  "0xFeeReceiverAddress",  // Protocol fee receiver address
  100,                      // Buyer fee in basis points (100 = 1%)
  100                       // Seller fee in basis points (100 = 1%)
]);
```

3. The UpgradeExecutor's `execute()` function is called via governance:

```javascript
const upgradeExecutorInterface = new ethers.utils.Interface([
  "function execute(address upgrade, bytes upgradeCallData)"
]);

const proposalCalldata = upgradeExecutorInterface.encodeFunctionData("execute", [
  actionAddress,    // SetProtocolFeeAction contract address
  actionCalldata    // Encoded perform() call from step 2
]);

// Proposal targets:
// - Target: 0xb23BCD4F668365B1c9Ec4B4DF79915bF8c76C5b5 (UpgradeExecutor)
// - Value: 0
// - Calldata: proposalCalldata
```

### Example 2: Rarible ExchangeV2 Account Abstraction Support

**Real Proposal:** [Rarible ExchangeV2 Account Abstraction Support](https://www.tally.xyz/gov/rari-foundation/proposal/16280736551534483184234752485158684446128826941141683028488944082454101619519)

This proposal upgrades the ExchangeV2 proxy to a new implementation that supports ERC-4337 account abstraction, enabling smart contract wallets to interact with the exchange.

**How it works:**

1. A new Exchange implementation with AA support is deployed:

```solidity
// New implementation contract with account abstraction support
ExchangeV2 newImplementation = new ExchangeV2(); // with AA features
```

2. A `ProxyUpgradeAction` contract is deployed:

```solidity
ProxyUpgradeAction upgradeAction = new ProxyUpgradeAction();
```

3. The upgrade action is encoded:

```javascript
const actionInterface = new ethers.utils.Interface([
  "function perform(address admin, address payable target, address newLogic)"
]);

const actionCalldata = actionInterface.encodeFunctionData("perform", [
  "0x7e9c956e3EFA81Ace71905Ff0dAEf1A71f42CBC5",  // ProxyAdmin address
  "0x9757F2d2b135150BBeb65308D4a91804107cd8D6",  // ExchangeV2 proxy address
  "0xNewImplementationAddress"                     // New implementation with AA
]);
```

4. The governance proposal calls UpgradeExecutor:

```javascript
const upgradeExecutorInterface = new ethers.utils.Interface([
  "function execute(address upgrade, bytes upgradeCallData)"
]);

const proposalCalldata = upgradeExecutorInterface.encodeFunctionData("execute", [
  upgradeActionAddress,
  actionCalldata
]);

// Proposal targets:
// - Target: 0xb23BCD4F668365B1c9Ec4B4DF79915bF8c76C5b5 (UpgradeExecutor)
// - Value: 0
// - Calldata: proposalCalldata
```

**What Account Abstraction enables:**
- Smart contract wallets can execute trades
- Support for ERC-4337 UserOperations
- Gasless transactions via paymasters
- Enhanced wallet recovery options

## Creating a Governance Proposal

1. **Deploy Action Contract**: Deploy the appropriate action contract for your upgrade
2. **Encode Calldata**: Prepare the calldata for both the action and UpgradeExecutor
3. **Submit on Tally**: Create proposal at [tally.xyz/gov/rari-foundation](https://www.tally.xyz/gov/rari-foundation)
4. **Voting Period**: RARI token holders vote on the proposal
5. **Execution**: After passing, the proposal is queued and executed through the timelock

## Security Considerations

⚠️ **Important**: Action contracts are executed via `delegatecall`, meaning they run in the context of the UpgradeExecutor. Action contracts must:

- Be stateless (no storage modifications to the action contract itself)
- Only modify state of target contracts through external calls
- Be thoroughly audited before deployment

## Development

### Running Tests

```bash
cd projects/upgrade-executor
yarn test
```

### Deploying Actions

```bash
npx hardhat deploy --network mainnet
```

### Transfer Ownership Task

```bash
npx hardhat transferOwnership --new-owner <address> --settings-file settings.yaml --network mainnet
```

## Links

- [RARI DAO on Tally](https://www.tally.xyz/gov/rari-foundation)
- [UpgradeExecutor on Etherscan](https://etherscan.io/address/0xb23BCD4F668365B1c9Ec4B4DF79915bF8c76C5b5)

### Real Proposal Examples

- [Set Rarible ExchangeV2 Protocol Fee](https://www.tally.xyz/gov/rari-foundation/proposal/24573162031860288524847391930314236095749684778105607842870834604070608008760)
- [Rarible ExchangeV2 Account Abstraction Support](https://www.tally.xyz/gov/rari-foundation/proposal/16280736551534483184234752485158684446128826941141683028488944082454101619519)
