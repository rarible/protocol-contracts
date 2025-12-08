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
┌─────────────────┐     ┌──────────────────┐     ┌─────────────────┐
│   RARI DAO      │────▶│ UpgradeExecutor  │────▶│  Action Contract │
│   (Tally)       │     │  (delegatecall)  │     │  (stateless)     │
└─────────────────┘     └──────────────────┘     └─────────────────┘
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

## Governance Examples (Tally)

Governance proposals are created and executed through [Tally](https://www.tally.xyz/gov/rari-foundation).

### Example 1: Set Protocol Fee

**Proposal:** Change protocol fee to 1% for buyers and 1% for sellers

**Tally Reference:** [Example proposal on Tally](https://www.tally.xyz/gov/rari-foundation/proposal/64443561092723928501818567121519051108693422626070463342810224372241233243885)

**Steps:**

1. Deploy `SetProtocolFeeAction` with the Exchange address:

```solidity
SetProtocolFeeAction action = new SetProtocolFeeAction(exchangeV2Address);
```

2. Encode the action call:

```javascript
const actionInterface = new ethers.utils.Interface([
  "function perform(address _receiver, uint48 _buyerAmount, uint48 _sellerAmount)"
]);

const actionCalldata = actionInterface.encodeFunctionData("perform", [
  "0xFeeReceiverAddress",  // Protocol fee receiver
  100,                      // 1% buyer fee (100 basis points)
  100                       // 1% seller fee (100 basis points)
]);
```

3. Create governance proposal to call UpgradeExecutor:

```javascript
const upgradeExecutorInterface = new ethers.utils.Interface([
  "function execute(address upgrade, bytes upgradeCallData)"
]);

const proposalCalldata = upgradeExecutorInterface.encodeFunctionData("execute", [
  actionAddress,    // SetProtocolFeeAction address
  actionCalldata    // Encoded perform() call
]);

// Submit proposal on Tally with:
// - Target: 0xb23BCD4F668365B1c9Ec4B4DF79915bF8c76C5b5 (UpgradeExecutor)
// - Calldata: proposalCalldata
```

### Example 2: Upgrade Exchange to Support Account Abstraction

**Goal:** Upgrade the ExchangeV2 proxy to a new implementation that supports ERC-4337 account abstraction.

**Steps:**

1. Deploy the new Exchange implementation with AA support:

```solidity
// New implementation contract
ExchangeV2WithAA newImplementation = new ExchangeV2WithAA();
```

2. Deploy `ProxyUpgradeAction`:

```solidity
ProxyUpgradeAction upgradeAction = new ProxyUpgradeAction();
```

3. Encode the upgrade action:

```javascript
const actionInterface = new ethers.utils.Interface([
  "function perform(address admin, address payable target, address newLogic)"
]);

const actionCalldata = actionInterface.encodeFunctionData("perform", [
  "0xProxyAdminAddress",           // ProxyAdmin contract
  "0xExchangeV2ProxyAddress",      // ExchangeV2 proxy to upgrade
  "0xNewImplementationAddress"     // New implementation with AA support
]);
```

4. Create governance proposal:

```javascript
const upgradeExecutorInterface = new ethers.utils.Interface([
  "function execute(address upgrade, bytes upgradeCallData)"
]);

const proposalCalldata = upgradeExecutorInterface.encodeFunctionData("execute", [
  upgradeActionAddress,
  actionCalldata
]);

// Submit proposal on Tally:
// Title: "Upgrade ExchangeV2 to Support Account Abstraction (ERC-4337)"
// Description: "This proposal upgrades the Exchange contract to support
//               smart contract wallets and account abstraction..."
// Target: 0xb23BCD4F668365B1c9Ec4B4DF79915bF8c76C5b5
// Calldata: proposalCalldata
```

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
