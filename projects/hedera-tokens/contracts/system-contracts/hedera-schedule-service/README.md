## Hedera Schedule Service (HSS) System Contract Functions

The Hedera Schedule Service (HSS) System Contract is accessible at address `0x16b` on the Hedera network. This contract interface introduces a new schedule transaction proxy contract to interact with other contracts for functionality such as creating and signing scheduled transactions. It also enables querying information about certain scheduled transactions.

The table below outlines the available Hedera Schedule Service System Contract functions:

| Function Name     | Function Selector Hash | Consensus Node Release Version                                               | HIP                                            | Method Interface                                                           |
| -----------------  | ---------------------- | ---------------------------------------------------------------------------- | ---------------------------------------------- | -------------------------------------------------------------------------- |
| `authorizeSchedule` | `0xf0637961`           | [0.57](https://docs.hedera.com/hedera/networks/release-notes/services#release-v0.57) | [HIP 755](https://hips.hedera.com/hip/hip-755) | `authorizeSchedule(address schedule) external returns (int64 responseCode)`                                           |
| `signSchedule`     | `0x358eeb03`           | [0.59](https://docs.hedera.com/hedera/networks/release-notes/services#release-v0.59) | [HIP 755](https://hips.hedera.com/hip/hip-755) | `signSchedule(address schedule, bytes memory signatureMap) external returns (int64 responseCode`                              |
| `scheduleNative` | `0xca829811`           | [0.59](https://docs.hedera.com/hedera/networks/release-notes/services#release-v0.59) | [HIP 756](https://hips.hedera.com/hip/hip-756) | `scheduleNative(address systemContractAddress, bytes memory callData, address payer) external returns (int64 responseCode, address scheduleAddress)` |
| `getScheduledCreateFungibleTokenInfo`    | `0xda2d5f8f`           | [0.59](https://docs.hedera.com/hedera/networks/release-notes/services#release-v0.59) | [HIP 756](https://hips.hedera.com/hip/hip-756) | `getScheduledCreateFungibleTokenInfo(address scheduleAddress) external returns (int64 responseCode, IHederaTokenService.FungibleTokenInfo memory fungibleTokenInfo)` |
| `getScheduledCreateNonFungibleTokenInfo`    | `0xd68c902c`           | [0.59](https://docs.hedera.com/hedera/networks/release-notes/services#release-v0.59) | [HIP 756](https://hips.hedera.com/hip/hip-756) | `getScheduledCreateNonFungibleTokenInfo(address scheduleAddress) external returns (int64 responseCode, IHederaTokenService.NonFungibleTokenInfo memory nonFungibleTokenInfo)` |

The Hedera network also make facade contract calls available to EOAs for improved experience.
Facade function allow for EOAs to make calls without requiring a deployed contract
The table below outlines the available Hedera Schedule Service (HSS) System Contract facade functions:

| Function Name                          | Function Selector Hash | Consensus Node Release Version                                               | HIP                                            | Method Interface                                                                                |
| -------------------------------------- | ---------------------- | ---------------------------------------------------------------------------- | ---------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | 
| `signSchedule`   | `0x06d15889`  | [0.57](https://docs.hedera.com/hedera/networks/release-notes/services#release-v0.57)  | [HIP 755](https://hips.hedera.com/hip/hip-755) | `signSchedule() external returns (int64 responseCode)` 