# Change Log

All notable changes to this project will be documented in this file.
See [Conventional Commits](https://conventionalcommits.org) for commit guidelines.

## [0.8.3](https://github.com/rarible/protocol-contracts/compare/v0.8.2...v0.8.3) (2024-01-18)

**Note:** Version bump only for package @rarible/tokens

## [0.8.2](https://github.com/rarible/protocol-contracts/compare/v0.8.1...v0.8.2) (2024-01-18)

### Features

- refactoring structure ([10a0d67](https://github.com/rarible/protocol-contracts/commit/10a0d673d9a589aa8e341ea5e3aa9c0657cabe2d))

## [0.8.1](https://github.com/rarible/protocol-contracts/compare/v0.7.15...v0.8.1) (2023-11-20)

### Features

- undeprecate protocol fee ([9c589a5](https://github.com/rarible/protocol-contracts/commit/9c589a57028b2f541245f0e96557c535d1740bf9))

# [0.8.0](https://github.com/rarible/protocol-contracts/compare/v0.7.15...v0.8.0) (2023-11-20)

**Note:** Version bump only for package @rarible/tokens

## [0.7.15](https://github.com/rarible/protocol-contracts/compare/v0.7.14-beta.3...v0.7.15) (2023-10-10)

**Note:** Version bump only for package @rarible/tokens

## [0.7.14-beta.2](https://github.com/rarible/protocol-contracts/compare/v0.7.14-beta.1...v0.7.14-beta.2) (2023-10-10)

### Features

- add build & remove genrated src ([3854f0c](https://github.com/rarible/protocol-contracts/commit/3854f0c2581a721e079215ad0cdcec4680bca9fd))

## [0.7.7](https://github.com/rarible/protocol-contracts/compare/v0.3.0-beta7...v0.7.7) (2023-10-07)

### Features

- version increase ([29be236](https://github.com/rarible/protocol-contracts/commit/29be236fdfefbabf0922457a9fdc3e0a219088bd))

# 0.7.0 (2021-12-17)

### Bug Fixes

- deployed new contracts to e2e ([e79f06c](https://github.com/rarible/protocol-contracts/commit/e79f06c5723b5b2f06d09698d53b7dd928a64dfc))
- deployed new contracts to rinkeby ([c0ac431](https://github.com/rarible/protocol-contracts/commit/c0ac431f4b71a1cbd072b5bce1e347dc36e65ef9))
- deployed new contracts to ropsten ([4aced99](https://github.com/rarible/protocol-contracts/commit/4aced9924ece047cdffc9366fa528ff7b4ba2366))
- deployed token factories on rinkeby ([f71cf01](https://github.com/rarible/protocol-contracts/commit/f71cf01debab7c35973d7402538b7fcc3b36384d))
- deployed token factories on ropsten, e2e ([61b91c3](https://github.com/rarible/protocol-contracts/commit/61b91c355a8bfb86e6b3650c993de4be161daa15))
- deployed tokens and factories on mainnet ([4123cbf](https://github.com/rarible/protocol-contracts/commit/4123cbf4a3078fc62a93b891f5c7c7b06e7d9834))
- ERC-1271 magicvalue fix ([552b944](https://github.com/rarible/protocol-contracts/commit/552b944ec8ba8f0389939c4bb38b94b3cea323f5))
- err. calculation 1155Lazy for burn, code refactoring ([30ee700](https://github.com/rarible/protocol-contracts/commit/30ee70015b15c144aacbb68563d17b2c5af40621))
- Fee renamed to Part, RoyaltiesV2 updated ([1da6863](https://github.com/rarible/protocol-contracts/commit/1da686390f1190230bc7805d40005a017e4a14ea))
- fix comments ([0b69760](https://github.com/rarible/protocol-contracts/commit/0b697600414bfb9dc7278e70fc57326e66798693))
- fix supportsInterface in tokens ([51fa04c](https://github.com/rarible/protocol-contracts/commit/51fa04ccebf12a92ca12805fc28885daac4d8abd))
- fix tests for mint validators ([21f158c](https://github.com/rarible/protocol-contracts/commit/21f158c430af330ba283593bbf6f6545bb863f6f))
- gas optimization in factories ([6b35ec9](https://github.com/rarible/protocol-contracts/commit/6b35ec98df3bbc2d1c4e9381cbc8cc23c34d1ade))
- tests ([fadbe54](https://github.com/rarible/protocol-contracts/commit/fadbe547656ea121decb22fb1a9ca17cfeef496e))
- tests ([16a18c5](https://github.com/rarible/protocol-contracts/commit/16a18c50fb3b1a2ca0219731d4f7880a62b0911c))
- versions ([0ad5588](https://github.com/rarible/protocol-contracts/commit/0ad55889363d61af06dfcddda7859762bcfa7820))
- **RPC-108:** fix incorrect creator Transfer event ([ad3c4a7](https://github.com/rarible/protocol-contracts/commit/ad3c4a788eb32af7876cc5a415e6763aed7bfaeb))

### Features

- add beaconProxy create ([09ead60](https://github.com/rarible/protocol-contracts/commit/09ead609f9cee20912e368a736b87141139e32cc))
- add erc721 Factory ([55dfd67](https://github.com/rarible/protocol-contracts/commit/55dfd670ea1bbfaec4a1e33d3058112ab1a5b549))
- add factory plus test for ERC1155Rarible token ([6e8e04e](https://github.com/rarible/protocol-contracts/commit/6e8e04e8255dd7d3b286460f6a367c9b43cab50d))
- add factory plus test for ERC1155RaribleUser token ([e80c283](https://github.com/rarible/protocol-contracts/commit/e80c28362f8cd74253e383a6aa40aaa572c6450f))
- add factory plus test for ERC721Rarible ([1375e61](https://github.com/rarible/protocol-contracts/commit/1375e612aa168b8a7927d9f37d6b5169db90efe9))
- add safe burn before/after for 1155Rarible ([7563488](https://github.com/rarible/protocol-contracts/commit/75634880ea21b24f7f2ce0ac85651c570b29e432))
- add TokenProxy, implementation is ([3d0fb06](https://github.com/rarible/protocol-contracts/commit/3d0fb06782accc18aca7dd49246626dad04084b4))
- call mintAndTransfer from factory ([fa140c1](https://github.com/rarible/protocol-contracts/commit/fa140c1cc1787f064e41963cdd872d0c3fd7b9cb))
- correct token owner, test works! ([33ed442](https://github.com/rarible/protocol-contracts/commit/33ed442295f6bee236f128d7caf0785829d84e30))
- delete pureBurn, use burn, burnBatch, send separate event, for Lazy Burned ([5e36e1b](https://github.com/rarible/protocol-contracts/commit/5e36e1b2826693fa89d7efde4afbc224b8514c14))
- delete unnecessary contract ([df32927](https://github.com/rarible/protocol-contracts/commit/df32927e50e6ff43203b5bddd7c2cd61d3c67c5c))
- Exchange address[] to LibPart[] for creators 1155Lazy ([b0bb577](https://github.com/rarible/protocol-contracts/commit/b0bb5775c1b8d9ff0ca5e3d15d30af910eddf73b))
- if Lazy berned, emit event BurnLazy ([70bacec](https://github.com/rarible/protocol-contracts/commit/70bacecd6b342e57d8d92cadbbdfd7d89bb1bd02))
- tokens ([e3e204c](https://github.com/rarible/protocol-contracts/commit/e3e204c161d18f4bb4d36bc72fdbbae98619a120))
- work commit ([da9112d](https://github.com/rarible/protocol-contracts/commit/da9112d9f0641da72014d5a68680417819805399))

# 0.6.0 (2021-12-17)

### Bug Fixes

- deployed new contracts to e2e ([e79f06c](https://github.com/rarible/protocol-contracts/commit/e79f06c5723b5b2f06d09698d53b7dd928a64dfc))
- deployed new contracts to rinkeby ([c0ac431](https://github.com/rarible/protocol-contracts/commit/c0ac431f4b71a1cbd072b5bce1e347dc36e65ef9))
- deployed new contracts to ropsten ([4aced99](https://github.com/rarible/protocol-contracts/commit/4aced9924ece047cdffc9366fa528ff7b4ba2366))
- deployed token factories on rinkeby ([f71cf01](https://github.com/rarible/protocol-contracts/commit/f71cf01debab7c35973d7402538b7fcc3b36384d))
- deployed token factories on ropsten, e2e ([61b91c3](https://github.com/rarible/protocol-contracts/commit/61b91c355a8bfb86e6b3650c993de4be161daa15))
- deployed tokens and factories on mainnet ([4123cbf](https://github.com/rarible/protocol-contracts/commit/4123cbf4a3078fc62a93b891f5c7c7b06e7d9834))
- ERC-1271 magicvalue fix ([552b944](https://github.com/rarible/protocol-contracts/commit/552b944ec8ba8f0389939c4bb38b94b3cea323f5))
- err. calculation 1155Lazy for burn, code refactoring ([30ee700](https://github.com/rarible/protocol-contracts/commit/30ee70015b15c144aacbb68563d17b2c5af40621))
- Fee renamed to Part, RoyaltiesV2 updated ([1da6863](https://github.com/rarible/protocol-contracts/commit/1da686390f1190230bc7805d40005a017e4a14ea))
- fix comments ([0b69760](https://github.com/rarible/protocol-contracts/commit/0b697600414bfb9dc7278e70fc57326e66798693))
- fix supportsInterface in tokens ([51fa04c](https://github.com/rarible/protocol-contracts/commit/51fa04ccebf12a92ca12805fc28885daac4d8abd))
- fix tests for mint validators ([21f158c](https://github.com/rarible/protocol-contracts/commit/21f158c430af330ba283593bbf6f6545bb863f6f))
- gas optimization in factories ([6b35ec9](https://github.com/rarible/protocol-contracts/commit/6b35ec98df3bbc2d1c4e9381cbc8cc23c34d1ade))
- tests ([fadbe54](https://github.com/rarible/protocol-contracts/commit/fadbe547656ea121decb22fb1a9ca17cfeef496e))
- tests ([16a18c5](https://github.com/rarible/protocol-contracts/commit/16a18c50fb3b1a2ca0219731d4f7880a62b0911c))
- versions ([0ad5588](https://github.com/rarible/protocol-contracts/commit/0ad55889363d61af06dfcddda7859762bcfa7820))
- **RPC-108:** fix incorrect creator Transfer event ([ad3c4a7](https://github.com/rarible/protocol-contracts/commit/ad3c4a788eb32af7876cc5a415e6763aed7bfaeb))

### Features

- add beaconProxy create ([09ead60](https://github.com/rarible/protocol-contracts/commit/09ead609f9cee20912e368a736b87141139e32cc))
- add erc721 Factory ([55dfd67](https://github.com/rarible/protocol-contracts/commit/55dfd670ea1bbfaec4a1e33d3058112ab1a5b549))
- add factory plus test for ERC1155Rarible token ([6e8e04e](https://github.com/rarible/protocol-contracts/commit/6e8e04e8255dd7d3b286460f6a367c9b43cab50d))
- add factory plus test for ERC1155RaribleUser token ([e80c283](https://github.com/rarible/protocol-contracts/commit/e80c28362f8cd74253e383a6aa40aaa572c6450f))
- add factory plus test for ERC721Rarible ([1375e61](https://github.com/rarible/protocol-contracts/commit/1375e612aa168b8a7927d9f37d6b5169db90efe9))
- add safe burn before/after for 1155Rarible ([7563488](https://github.com/rarible/protocol-contracts/commit/75634880ea21b24f7f2ce0ac85651c570b29e432))
- add TokenProxy, implementation is ([3d0fb06](https://github.com/rarible/protocol-contracts/commit/3d0fb06782accc18aca7dd49246626dad04084b4))
- call mintAndTransfer from factory ([fa140c1](https://github.com/rarible/protocol-contracts/commit/fa140c1cc1787f064e41963cdd872d0c3fd7b9cb))
- correct token owner, test works! ([33ed442](https://github.com/rarible/protocol-contracts/commit/33ed442295f6bee236f128d7caf0785829d84e30))
- delete pureBurn, use burn, burnBatch, send separate event, for Lazy Burned ([5e36e1b](https://github.com/rarible/protocol-contracts/commit/5e36e1b2826693fa89d7efde4afbc224b8514c14))
- delete unnecessary contract ([df32927](https://github.com/rarible/protocol-contracts/commit/df32927e50e6ff43203b5bddd7c2cd61d3c67c5c))
- Exchange address[] to LibPart[] for creators 1155Lazy ([b0bb577](https://github.com/rarible/protocol-contracts/commit/b0bb5775c1b8d9ff0ca5e3d15d30af910eddf73b))
- if Lazy berned, emit event BurnLazy ([70bacec](https://github.com/rarible/protocol-contracts/commit/70bacecd6b342e57d8d92cadbbdfd7d89bb1bd02))
- tokens ([e3e204c](https://github.com/rarible/protocol-contracts/commit/e3e204c161d18f4bb4d36bc72fdbbae98619a120))
- work commit ([da9112d](https://github.com/rarible/protocol-contracts/commit/da9112d9f0641da72014d5a68680417819805399))
