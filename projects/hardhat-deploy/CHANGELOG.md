# Change Log

All notable changes to this project will be documented in this file.
See [Conventional Commits](https://conventionalcommits.org) for commit guidelines.

## [0.8.5](https://github.com/rariblecom/protocol-contracts/compare/v0.8.1...v0.8.5) (2024-04-27)

### Bug Fixes

- add parameters ([88f1d9c](https://github.com/rariblecom/protocol-contracts/commit/88f1d9c3a77fd61699b05d6927faad7b901733fc))
- support orders with zero price ([162238d](https://github.com/rariblecom/protocol-contracts/commit/162238de3f6df5cfb7760dfce6dd245b85360eb3))

### Features

- add camp_sepolia ([32c30eb](https://github.com/rariblecom/protocol-contracts/commit/32c30eba633936bf7a7137c4a53f41dc6aee4bd3))
- add celo alfajores ([#271](https://github.com/rariblecom/protocol-contracts/issues/271)) ([10a795e](https://github.com/rariblecom/protocol-contracts/commit/10a795e80039677193d5eeccfa14f64e0bcf0448))
- add config for camp and sei ([983664b](https://github.com/rariblecom/protocol-contracts/commit/983664bc0eb0a434b166541ec5eb19044e4189e1))
- add config for sei and camp ([9815c1a](https://github.com/rariblecom/protocol-contracts/commit/9815c1aa90543667549d9ed4ba183e1fc2be4e14))
- add configs for palm, match ([cfeee8e](https://github.com/rariblecom/protocol-contracts/commit/cfeee8e12fdd06664fcb021a5f3efa44708c6f92))
- add deploy operator role for proxy ([5e28f3d](https://github.com/rariblecom/protocol-contracts/commit/5e28f3d9532ed6823302a0cd1a1fb24e0bb12544))
- add deploy sepolia via factory ([bfa0b5c](https://github.com/rariblecom/protocol-contracts/commit/bfa0b5c5b8ca1259edb1ba4cbe8f5e497e26feca))
- add deploy support for factory ([f9a1160](https://github.com/rariblecom/protocol-contracts/commit/f9a11605766a943f56d004c07d6a4c32b1d26cd1))
- add docs lisk, sepolia and camp (testnets) ([135b871](https://github.com/rariblecom/protocol-contracts/commit/135b8710b4598eb84abc86c5ab6290caab2b549c))
- add example .env ([a6d84c3](https://github.com/rariblecom/protocol-contracts/commit/a6d84c31397c7b518031c353e3306070dc8d5e5a))
- add lisk and sepolia ([8c1e7e0](https://github.com/rariblecom/protocol-contracts/commit/8c1e7e0da60710d0a369cc9bff214e2b092c4720))
- add lisk and sepolia networks ([4cacb4b](https://github.com/rariblecom/protocol-contracts/commit/4cacb4b10e58bff5f5028786792f2229e452a466))
- add lisk deploy ([6c5f6ba](https://github.com/rariblecom/protocol-contracts/commit/6c5f6ba32a56664ee5b50dd26de3bbbb98924f36))
- add lisk sepolia ([bf35501](https://github.com/rariblecom/protocol-contracts/commit/bf3550122d60d66912f411b6b180bb667c86676d))
- add loading contracts ([d432688](https://github.com/rariblecom/protocol-contracts/commit/d432688fa078689c5e1bf8659d6b7817d3932938))
- add migration for SetProtocolFeeAction ([f9c4aca](https://github.com/rariblecom/protocol-contracts/commit/f9c4aca5bd01cff077f8a15a4467fa0e3c88ca05))
- add new ([a75d810](https://github.com/rariblecom/protocol-contracts/commit/a75d810e4d244a37c53eeee3b3e0b8b9b5965b91))
- add oasis testnet, xai testnet. PT-4570 deploy contracts to oasis testnet ([ed0e2ce](https://github.com/rariblecom/protocol-contracts/commit/ed0e2ced1269ce67e29c4795e08193324628aca4))
- add ownership ([098e6ea](https://github.com/rariblecom/protocol-contracts/commit/098e6ea957640fc7aa1aa51df92c7e121d12e589))
- add ownership tests ([01971d0](https://github.com/rariblecom/protocol-contracts/commit/01971d07b251975aaf8c94a8a67ef376f408d72b))
- add proxy deploy support ([40270b0](https://github.com/rariblecom/protocol-contracts/commit/40270b07cdb2e061a3a349535f7bb9717e686eb7))
- add reading owner from env ([d1db0fa](https://github.com/rariblecom/protocol-contracts/commit/d1db0fae222672830ad7d27f4d24df4597c30dfb))
- add sei deploy ([862f6a2](https://github.com/rariblecom/protocol-contracts/commit/862f6a2907bf6c518880b178cb8b0a034ac107ba))
- add sepolia deploy via create2 ([3dfc3ce](https://github.com/rariblecom/protocol-contracts/commit/3dfc3ce449b31fccb545bcda4606165c039b5b36))
- add tests for nothing to feel, one order free the other isn't ([7b51920](https://github.com/rariblecom/protocol-contracts/commit/7b519201dcb9c5b3dc5e4a837698ceed3060cd5e))
- change token factories back, optomise ERC1155 size ([8e25ae2](https://github.com/rariblecom/protocol-contracts/commit/8e25ae2ae5c03166ef3524935c827f168f6d0445))
- deploy contracts on palm_testnet ([18fccde](https://github.com/rariblecom/protocol-contracts/commit/18fccded3260b1aebc568ebe4f8b9b9883fd47da))
- fix getNetworkApiUrl() and getNetworkExplorerUrl() ([50f884b](https://github.com/rariblecom/protocol-contracts/commit/50f884b1d2e25f69d3d4c4dfa96a343e14ade288))
- fix hardhat-migrations, change createToken() and getAddress() in token factories ([8930c47](https://github.com/rariblecom/protocol-contracts/commit/8930c47eec9da0b3bcbe5c6a467cae3e803085e2))
- PT-4321 deploy contracts on oasys testnet, prepare config for oasys mainnet ([dfd934b](https://github.com/rariblecom/protocol-contracts/commit/dfd934bfb2c28915fd491c04dc5d10a36418310f))
- PT-4543 deploy contracts on fief_playground_testnet ([f71e0dd](https://github.com/rariblecom/protocol-contracts/commit/f71e0dd84abc948290ca9c5dfac12580917b4f10))
- PT-4639 fix network config for frame ([514629b](https://github.com/rariblecom/protocol-contracts/commit/514629bd6e6604092cc11077cff02ca885a5142d))
- PT-4662 get rid of nothing to fill tests ([4059dcb](https://github.com/rariblecom/protocol-contracts/commit/4059dcb20c100e159643e40929392b05f90f7038))
- PT-4671 deploy contracts on mantle sepolia ([d5033ef](https://github.com/rariblecom/protocol-contracts/commit/d5033efaf19222c60f900914300ee93be1069d45))
- PT-4705 deploy contract on kroma_sepolia ([36ac439](https://github.com/rariblecom/protocol-contracts/commit/36ac439fef8f85b6e230b481c080bfff7ff5065b))
- PT-4749 upgrade exchangeV2 with upgradeExecutor ([7e18442](https://github.com/rariblecom/protocol-contracts/commit/7e18442b90bae4ee8a18c797b9126dad2650f896))
- PT-4844 deploy contract on match_testnet ([73aef7a](https://github.com/rariblecom/protocol-contracts/commit/73aef7a61c47804f8348b12c8f553c7b39a254b8))
- PT-4914 deploy contract on zkLink testnet, prepare config for mainnet ([8796c0a](https://github.com/rariblecom/protocol-contracts/commit/8796c0a9ac266fdd97ff4bf0a752fbf4b607dd28))
- PT-4962 deploy contracts on 5ire_testnet ([c752e6d](https://github.com/rariblecom/protocol-contracts/commit/c752e6d7b8a268006a84c1307e0ed70c88a6da3b))
- PT-5051 deploy contracts on oasys_testnet_saakuru ([b558424](https://github.com/rariblecom/protocol-contracts/commit/b558424aea3de4125336e4c393cc7f76515555b9))
- PT-5072 add seaport 1.6 to exchange wrapper, deploy wrapper to sepolia ([c6f10f1](https://github.com/rariblecom/protocol-contracts/commit/c6f10f151740dd76da0e997b8bf499f03cba00a9))
- PT-5076 deploy contracts to astar_zkyoto_testnet ([de82643](https://github.com/rariblecom/protocol-contracts/commit/de826431eb30ea6e11d3a74e5c5b0f3a4aa43aa9))
- PT-5095 deploy contracts on polygon_amoy_testnet ([e89dfd7](https://github.com/rariblecom/protocol-contracts/commit/e89dfd7386d45e0eb31c28024354dc9f66c6008d))
- rename ([a2c6a83](https://github.com/rariblecom/protocol-contracts/commit/a2c6a83b94a89fc9aaddfa1e754cbf5c1280b8c7))
- test networks lisk, camp and sei ([962c022](https://github.com/rariblecom/protocol-contracts/commit/962c0225649a9c7c501bf4b879abdec30be1b877))
- tidy up network configs, support frame ([82a88fc](https://github.com/rariblecom/protocol-contracts/commit/82a88fcd81af7638c1234aafd233742d66ecbea1))
- update wrapper on arbitrum testnet, base testnet, polygon testnet ([572add8](https://github.com/rariblecom/protocol-contracts/commit/572add81b96f0ea00224f1934411b824031d0b87))

## [0.8.4-beta.3](https://github.com/rariblecom/protocol-contracts/compare/v0.8.4-beta.2...v0.8.4-beta.3) (2024-01-19)

**Note:** Version bump only for package @rarible/hardhat-deploy

## [0.8.4-beta.2](https://github.com/rariblecom/protocol-contracts/compare/v0.8.4-beta.1...v0.8.4-beta.2) (2024-01-19)

**Note:** Version bump only for package @rarible/hardhat-deploy

## [0.8.4-beta.1](https://github.com/rariblecom/protocol-contracts/compare/v0.8.3...v0.8.4-beta.1) (2024-01-19)

**Note:** Version bump only for package @rarible/hardhat-deploy

## [0.8.3](https://github.com/rariblecom/protocol-contracts/compare/v0.8.2...v0.8.3) (2024-01-18)

**Note:** Version bump only for package @rarible/hardhat-deploy

## [0.8.2](https://github.com/rariblecom/protocol-contracts/compare/v0.8.1...v0.8.2) (2024-01-18)

### Features

- refactoring structure ([10a0d67](https://github.com/rariblecom/protocol-contracts/commit/10a0d673d9a589aa8e341ea5e3aa9c0657cabe2d))

## [0.8.1](https://github.com/rarible/protocol-contracts/compare/v0.7.15...v0.8.1) (2023-11-20)

### Features

- add hardhat-deploy package ([704d1e1](https://github.com/rarible/protocol-contracts/commit/704d1e15fad6026bf25d0fd2319f3b0254b5c15f))
- add verify ([1644fbd](https://github.com/rarible/protocol-contracts/commit/1644fbd31d2a0c2593cb874373af4734df43ad06))
- fix verify settings ([9ac59a7](https://github.com/rarible/protocol-contracts/commit/9ac59a7621f272b43a8458413f83faad7bed52b6))
- packages sync ([58487ea](https://github.com/rarible/protocol-contracts/commit/58487ea1c48cea8ebea68185c0e612ffd31bea2f))
- PT-4067-undeprecated protocol fee, deprecated V3 orders ([747e585](https://github.com/rarible/protocol-contracts/commit/747e585ff9dad2411af83014c4f5c9adbe2d8d61))
- PT-4236 make hardhat-deploy/ package with migrations in hardhat. only necessary migrations: RoyaltiesRegistry, ExchangeV2, 4 TransferProxies, Collection asset matcher, rarible collections + factories. supports configurations to deploy contracts with supported meta transaction or not. added integration tests + verification after deploy. ([a28af59](https://github.com/rarible/protocol-contracts/commit/a28af5965f398d9c75eb38041c2d1dbcc5651cdd))
- set version ([419b05a](https://github.com/rarible/protocol-contracts/commit/419b05a732e611b67d2a598f0f6d8a20231e1c64))
- undeprecate protocol fee ([9c589a5](https://github.com/rarible/protocol-contracts/commit/9c589a57028b2f541245f0e96557c535d1740bf9))

# [0.8.0](https://github.com/rarible/protocol-contracts/compare/v0.7.15...v0.8.0) (2023-11-20)

### Features

- add hardhat-deploy package ([704d1e1](https://github.com/rarible/protocol-contracts/commit/704d1e15fad6026bf25d0fd2319f3b0254b5c15f))
- add verify ([1644fbd](https://github.com/rarible/protocol-contracts/commit/1644fbd31d2a0c2593cb874373af4734df43ad06))
- fix verify settings ([9ac59a7](https://github.com/rarible/protocol-contracts/commit/9ac59a7621f272b43a8458413f83faad7bed52b6))
- packages sync ([58487ea](https://github.com/rarible/protocol-contracts/commit/58487ea1c48cea8ebea68185c0e612ffd31bea2f))
- PT-4067-undeprecated protocol fee, deprecated V3 orders ([747e585](https://github.com/rarible/protocol-contracts/commit/747e585ff9dad2411af83014c4f5c9adbe2d8d61))
- PT-4236 make hardhat-deploy/ package with migrations in hardhat. only necessary migrations: RoyaltiesRegistry, ExchangeV2, 4 TransferProxies, Collection asset matcher, rarible collections + factories. supports configurations to deploy contracts with supported meta transaction or not. added integration tests + verification after deploy. ([a28af59](https://github.com/rarible/protocol-contracts/commit/a28af5965f398d9c75eb38041c2d1dbcc5651cdd))
- set version ([419b05a](https://github.com/rarible/protocol-contracts/commit/419b05a732e611b67d2a598f0f6d8a20231e1c64))
