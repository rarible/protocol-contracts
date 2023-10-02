# Change Log

All notable changes to this project will be documented in this file.
See [Conventional Commits](https://conventionalcommits.org) for commit guidelines.

# 0.8.0 (2023-10-02)


### Bug Fixes

* Add __gap in MinterAccessControl ([3a68904](https://github.com/rarible/protocol-contracts/commit/3a689049e1efc7c201f85bfb8916044c8873811a))
* changed minterAccessControl inheritance placement to keep tokens upgradeadble, fixed meta tokens initialization to save gas and contract size ([7d4a497](https://github.com/rarible/protocol-contracts/commit/7d4a497a8e4ddd3c914d770d94d33fbdf34ee080))
* make creators in ERC1155Lazy, close issue [#132](https://github.com/rarible/protocol-contracts/issues/132) ([38801b1](https://github.com/rarible/protocol-contracts/commit/38801b18c67e24eb02c38eb0f7af9de850185c68))
* minter access control typos and tests ([eb3607e](https://github.com/rarible/protocol-contracts/commit/eb3607e22bf9f7bc4dae59c4b08fa945ea1f2ef7))
* Moved MinterAccessControl to Lazy classes ([325a4a0](https://github.com/rarible/protocol-contracts/commit/325a4a050c9300288b0b731a8aa7fddd7f107764))
* Rename MintControl to MinterAccessControl ([78f93c3](https://github.com/rarible/protocol-contracts/commit/78f93c3c084aaa28faa078857ceea3b5f539b74a))
* tests in tokens ([8329724](https://github.com/rarible/protocol-contracts/commit/832972494aec08a25d58a42d48dd65cd58337b65))
* deployed new contracts to e2e ([e79f06c](https://github.com/rarible/protocol-contracts/commit/e79f06c5723b5b2f06d09698d53b7dd928a64dfc))
* deployed new contracts to rinkeby ([c0ac431](https://github.com/rarible/protocol-contracts/commit/c0ac431f4b71a1cbd072b5bce1e347dc36e65ef9))
* deployed new contracts to ropsten ([4aced99](https://github.com/rarible/protocol-contracts/commit/4aced9924ece047cdffc9366fa528ff7b4ba2366))
* deployed token factories on rinkeby ([f71cf01](https://github.com/rarible/protocol-contracts/commit/f71cf01debab7c35973d7402538b7fcc3b36384d))
* deployed token factories on ropsten, e2e ([61b91c3](https://github.com/rarible/protocol-contracts/commit/61b91c355a8bfb86e6b3650c993de4be161daa15))
* deployed tokens and factories on mainnet ([4123cbf](https://github.com/rarible/protocol-contracts/commit/4123cbf4a3078fc62a93b891f5c7c7b06e7d9834))
* err. calculation 1155Lazy for burn, code refactoring ([30ee700](https://github.com/rarible/protocol-contracts/commit/30ee70015b15c144aacbb68563d17b2c5af40621))
* fix comments ([0b69760](https://github.com/rarible/protocol-contracts/commit/0b697600414bfb9dc7278e70fc57326e66798693))
* Update tests ([9e6f220](https://github.com/rarible/protocol-contracts/commit/9e6f220108f342d13b4e71bc67ee18073a3b6d06))
* Use past for events ([71378cb](https://github.com/rarible/protocol-contracts/commit/71378cba55e1124b30b3761b084a4d413b8ef1aa))
* validate minter and not sender in MinterAccessControl ([88dd056](https://github.com/rarible/protocol-contracts/commit/88dd0564bf1c286e4df1ac09df5d9bb593122bd5))
* ERC-1271 magicvalue fix ([552b944](https://github.com/rarible/protocol-contracts/commit/552b944ec8ba8f0389939c4bb38b94b3cea323f5))
* Fee renamed to Part, RoyaltiesV2 updated ([1da6863](https://github.com/rarible/protocol-contracts/commit/1da686390f1190230bc7805d40005a017e4a14ea))
* fix supportsInterface in tokens ([51fa04c](https://github.com/rarible/protocol-contracts/commit/51fa04ccebf12a92ca12805fc28885daac4d8abd))
* fix tests for mint validators ([21f158c](https://github.com/rarible/protocol-contracts/commit/21f158c430af330ba283593bbf6f6545bb863f6f))
* gas optimization in factories ([6b35ec9](https://github.com/rarible/protocol-contracts/commit/6b35ec98df3bbc2d1c4e9381cbc8cc23c34d1ade))
* tests ([fadbe54](https://github.com/rarible/protocol-contracts/commit/fadbe547656ea121decb22fb1a9ca17cfeef496e))
* tests ([16a18c5](https://github.com/rarible/protocol-contracts/commit/16a18c50fb3b1a2ca0219731d4f7880a62b0911c))
* versions ([0ad5588](https://github.com/rarible/protocol-contracts/commit/0ad55889363d61af06dfcddda7859762bcfa7820))
* **RPC-108:** fix incorrect creator Transfer event ([ad3c4a7](https://github.com/rarible/protocol-contracts/commit/ad3c4a788eb32af7876cc5a415e6763aed7bfaeb))


### Features

* finish BRAVO-1966, full refactor package structure, tests ([ad908d2](https://github.com/rarible/protocol-contracts/commit/ad908d24ead38e602835dcc31d7d8245a843286b))
* finish PT-1649 lazy mint ([68911e9](https://github.com/rarible/protocol-contracts/commit/68911e97487b3e2149a6251eb41cb7843f1427ce))
* fix ERC1155 size, get rid of operators ([d18276c](https://github.com/rarible/protocol-contracts/commit/d18276c4bb46a1f676b47b8795e9da61edef365d))
* fix exchange audit ([cedb07d](https://github.com/rarible/protocol-contracts/commit/cedb07d69d4155cfe37171ae4672e893c7df218f))
* function "addMinters" added to allow batch addition of minters ([98925e3](https://github.com/rarible/protocol-contracts/commit/98925e35ec67d2b3e37c747b1f552c0f89b3a804))
* version bump ([8838a89](https://github.com/rarible/protocol-contracts/commit/8838a89c10147325d4aa83aa9ef725fabae85041))
* add beaconProxy create ([09ead60](https://github.com/rarible/protocol-contracts/commit/09ead609f9cee20912e368a736b87141139e32cc))
* add erc721 Factory ([55dfd67](https://github.com/rarible/protocol-contracts/commit/55dfd670ea1bbfaec4a1e33d3058112ab1a5b549))
* add factory plus test for ERC1155Rarible token ([6e8e04e](https://github.com/rarible/protocol-contracts/commit/6e8e04e8255dd7d3b286460f6a367c9b43cab50d))
* add factory plus test for ERC1155RaribleUser token ([e80c283](https://github.com/rarible/protocol-contracts/commit/e80c28362f8cd74253e383a6aa40aaa572c6450f))
* add factory plus test for ERC721Rarible ([1375e61](https://github.com/rarible/protocol-contracts/commit/1375e612aa168b8a7927d9f37d6b5169db90efe9))
* add safe burn before/after for 1155Rarible ([7563488](https://github.com/rarible/protocol-contracts/commit/75634880ea21b24f7f2ce0ac85651c570b29e432))
* add TokenProxy, implementation is ([3d0fb06](https://github.com/rarible/protocol-contracts/commit/3d0fb06782accc18aca7dd49246626dad04084b4))
* call mintAndTransfer from factory ([fa140c1](https://github.com/rarible/protocol-contracts/commit/fa140c1cc1787f064e41963cdd872d0c3fd7b9cb))
* correct token owner, test works! ([33ed442](https://github.com/rarible/protocol-contracts/commit/33ed442295f6bee236f128d7caf0785829d84e30))
* delete pureBurn, use burn, burnBatch, send separate event, for Lazy Burned ([5e36e1b](https://github.com/rarible/protocol-contracts/commit/5e36e1b2826693fa89d7efde4afbc224b8514c14))
* delete unnecessary contract ([df32927](https://github.com/rarible/protocol-contracts/commit/df32927e50e6ff43203b5bddd7c2cd61d3c67c5c))
* Exchange address[] to LibPart[] for creators 1155Lazy ([b0bb577](https://github.com/rarible/protocol-contracts/commit/b0bb5775c1b8d9ff0ca5e3d15d30af910eddf73b))
* if Lazy berned, emit event BurnLazy ([70bacec](https://github.com/rarible/protocol-contracts/commit/70bacecd6b342e57d8d92cadbbdfd7d89bb1bd02))
* tokens ([e3e204c](https://github.com/rarible/protocol-contracts/commit/e3e204c161d18f4bb4d36bc72fdbbae98619a120))
* work commit ([da9112d](https://github.com/rarible/protocol-contracts/commit/da9112d9f0641da72014d5a68680417819805399))





# 0.7.0 (2021-12-17)


### Bug Fixes

* deployed new contracts to e2e ([e79f06c](https://github.com/rarible/protocol-contracts/commit/e79f06c5723b5b2f06d09698d53b7dd928a64dfc))
* deployed new contracts to rinkeby ([c0ac431](https://github.com/rarible/protocol-contracts/commit/c0ac431f4b71a1cbd072b5bce1e347dc36e65ef9))
* deployed new contracts to ropsten ([4aced99](https://github.com/rarible/protocol-contracts/commit/4aced9924ece047cdffc9366fa528ff7b4ba2366))
* deployed token factories on rinkeby ([f71cf01](https://github.com/rarible/protocol-contracts/commit/f71cf01debab7c35973d7402538b7fcc3b36384d))
* deployed token factories on ropsten, e2e ([61b91c3](https://github.com/rarible/protocol-contracts/commit/61b91c355a8bfb86e6b3650c993de4be161daa15))
* deployed tokens and factories on mainnet ([4123cbf](https://github.com/rarible/protocol-contracts/commit/4123cbf4a3078fc62a93b891f5c7c7b06e7d9834))
* ERC-1271 magicvalue fix ([552b944](https://github.com/rarible/protocol-contracts/commit/552b944ec8ba8f0389939c4bb38b94b3cea323f5))
* err. calculation 1155Lazy for burn, code refactoring ([30ee700](https://github.com/rarible/protocol-contracts/commit/30ee70015b15c144aacbb68563d17b2c5af40621))
* Fee renamed to Part, RoyaltiesV2 updated ([1da6863](https://github.com/rarible/protocol-contracts/commit/1da686390f1190230bc7805d40005a017e4a14ea))
* fix comments ([0b69760](https://github.com/rarible/protocol-contracts/commit/0b697600414bfb9dc7278e70fc57326e66798693))
* fix supportsInterface in tokens ([51fa04c](https://github.com/rarible/protocol-contracts/commit/51fa04ccebf12a92ca12805fc28885daac4d8abd))
* fix tests for mint validators ([21f158c](https://github.com/rarible/protocol-contracts/commit/21f158c430af330ba283593bbf6f6545bb863f6f))
* gas optimization in factories ([6b35ec9](https://github.com/rarible/protocol-contracts/commit/6b35ec98df3bbc2d1c4e9381cbc8cc23c34d1ade))
* tests ([fadbe54](https://github.com/rarible/protocol-contracts/commit/fadbe547656ea121decb22fb1a9ca17cfeef496e))
* tests ([16a18c5](https://github.com/rarible/protocol-contracts/commit/16a18c50fb3b1a2ca0219731d4f7880a62b0911c))
* versions ([0ad5588](https://github.com/rarible/protocol-contracts/commit/0ad55889363d61af06dfcddda7859762bcfa7820))
* **RPC-108:** fix incorrect creator Transfer event ([ad3c4a7](https://github.com/rarible/protocol-contracts/commit/ad3c4a788eb32af7876cc5a415e6763aed7bfaeb))


### Features

* add beaconProxy create ([09ead60](https://github.com/rarible/protocol-contracts/commit/09ead609f9cee20912e368a736b87141139e32cc))
* add erc721 Factory ([55dfd67](https://github.com/rarible/protocol-contracts/commit/55dfd670ea1bbfaec4a1e33d3058112ab1a5b549))
* add factory plus test for ERC1155Rarible token ([6e8e04e](https://github.com/rarible/protocol-contracts/commit/6e8e04e8255dd7d3b286460f6a367c9b43cab50d))
* add factory plus test for ERC1155RaribleUser token ([e80c283](https://github.com/rarible/protocol-contracts/commit/e80c28362f8cd74253e383a6aa40aaa572c6450f))
* add factory plus test for ERC721Rarible ([1375e61](https://github.com/rarible/protocol-contracts/commit/1375e612aa168b8a7927d9f37d6b5169db90efe9))
* add safe burn before/after for 1155Rarible ([7563488](https://github.com/rarible/protocol-contracts/commit/75634880ea21b24f7f2ce0ac85651c570b29e432))
* add TokenProxy, implementation is ([3d0fb06](https://github.com/rarible/protocol-contracts/commit/3d0fb06782accc18aca7dd49246626dad04084b4))
* call mintAndTransfer from factory ([fa140c1](https://github.com/rarible/protocol-contracts/commit/fa140c1cc1787f064e41963cdd872d0c3fd7b9cb))
* correct token owner, test works! ([33ed442](https://github.com/rarible/protocol-contracts/commit/33ed442295f6bee236f128d7caf0785829d84e30))
* delete pureBurn, use burn, burnBatch, send separate event, for Lazy Burned ([5e36e1b](https://github.com/rarible/protocol-contracts/commit/5e36e1b2826693fa89d7efde4afbc224b8514c14))
* delete unnecessary contract ([df32927](https://github.com/rarible/protocol-contracts/commit/df32927e50e6ff43203b5bddd7c2cd61d3c67c5c))
* Exchange address[] to LibPart[] for creators 1155Lazy ([b0bb577](https://github.com/rarible/protocol-contracts/commit/b0bb5775c1b8d9ff0ca5e3d15d30af910eddf73b))
* if Lazy berned, emit event BurnLazy ([70bacec](https://github.com/rarible/protocol-contracts/commit/70bacecd6b342e57d8d92cadbbdfd7d89bb1bd02))
* tokens ([e3e204c](https://github.com/rarible/protocol-contracts/commit/e3e204c161d18f4bb4d36bc72fdbbae98619a120))
* work commit ([da9112d](https://github.com/rarible/protocol-contracts/commit/da9112d9f0641da72014d5a68680417819805399))





# 0.6.0 (2021-12-17)


### Bug Fixes

* deployed new contracts to e2e ([e79f06c](https://github.com/rarible/protocol-contracts/commit/e79f06c5723b5b2f06d09698d53b7dd928a64dfc))
* deployed new contracts to rinkeby ([c0ac431](https://github.com/rarible/protocol-contracts/commit/c0ac431f4b71a1cbd072b5bce1e347dc36e65ef9))
* deployed new contracts to ropsten ([4aced99](https://github.com/rarible/protocol-contracts/commit/4aced9924ece047cdffc9366fa528ff7b4ba2366))
* deployed token factories on rinkeby ([f71cf01](https://github.com/rarible/protocol-contracts/commit/f71cf01debab7c35973d7402538b7fcc3b36384d))
* deployed token factories on ropsten, e2e ([61b91c3](https://github.com/rarible/protocol-contracts/commit/61b91c355a8bfb86e6b3650c993de4be161daa15))
* deployed tokens and factories on mainnet ([4123cbf](https://github.com/rarible/protocol-contracts/commit/4123cbf4a3078fc62a93b891f5c7c7b06e7d9834))
* ERC-1271 magicvalue fix ([552b944](https://github.com/rarible/protocol-contracts/commit/552b944ec8ba8f0389939c4bb38b94b3cea323f5))
* err. calculation 1155Lazy for burn, code refactoring ([30ee700](https://github.com/rarible/protocol-contracts/commit/30ee70015b15c144aacbb68563d17b2c5af40621))
* Fee renamed to Part, RoyaltiesV2 updated ([1da6863](https://github.com/rarible/protocol-contracts/commit/1da686390f1190230bc7805d40005a017e4a14ea))
* fix comments ([0b69760](https://github.com/rarible/protocol-contracts/commit/0b697600414bfb9dc7278e70fc57326e66798693))
* fix supportsInterface in tokens ([51fa04c](https://github.com/rarible/protocol-contracts/commit/51fa04ccebf12a92ca12805fc28885daac4d8abd))
* fix tests for mint validators ([21f158c](https://github.com/rarible/protocol-contracts/commit/21f158c430af330ba283593bbf6f6545bb863f6f))
* gas optimization in factories ([6b35ec9](https://github.com/rarible/protocol-contracts/commit/6b35ec98df3bbc2d1c4e9381cbc8cc23c34d1ade))
* tests ([fadbe54](https://github.com/rarible/protocol-contracts/commit/fadbe547656ea121decb22fb1a9ca17cfeef496e))
* tests ([16a18c5](https://github.com/rarible/protocol-contracts/commit/16a18c50fb3b1a2ca0219731d4f7880a62b0911c))
* versions ([0ad5588](https://github.com/rarible/protocol-contracts/commit/0ad55889363d61af06dfcddda7859762bcfa7820))
* **RPC-108:** fix incorrect creator Transfer event ([ad3c4a7](https://github.com/rarible/protocol-contracts/commit/ad3c4a788eb32af7876cc5a415e6763aed7bfaeb))


### Features

* add beaconProxy create ([09ead60](https://github.com/rarible/protocol-contracts/commit/09ead609f9cee20912e368a736b87141139e32cc))
* add erc721 Factory ([55dfd67](https://github.com/rarible/protocol-contracts/commit/55dfd670ea1bbfaec4a1e33d3058112ab1a5b549))
* add factory plus test for ERC1155Rarible token ([6e8e04e](https://github.com/rarible/protocol-contracts/commit/6e8e04e8255dd7d3b286460f6a367c9b43cab50d))
* add factory plus test for ERC1155RaribleUser token ([e80c283](https://github.com/rarible/protocol-contracts/commit/e80c28362f8cd74253e383a6aa40aaa572c6450f))
* add factory plus test for ERC721Rarible ([1375e61](https://github.com/rarible/protocol-contracts/commit/1375e612aa168b8a7927d9f37d6b5169db90efe9))
* add safe burn before/after for 1155Rarible ([7563488](https://github.com/rarible/protocol-contracts/commit/75634880ea21b24f7f2ce0ac85651c570b29e432))
* add TokenProxy, implementation is ([3d0fb06](https://github.com/rarible/protocol-contracts/commit/3d0fb06782accc18aca7dd49246626dad04084b4))
* call mintAndTransfer from factory ([fa140c1](https://github.com/rarible/protocol-contracts/commit/fa140c1cc1787f064e41963cdd872d0c3fd7b9cb))
* correct token owner, test works! ([33ed442](https://github.com/rarible/protocol-contracts/commit/33ed442295f6bee236f128d7caf0785829d84e30))
* delete pureBurn, use burn, burnBatch, send separate event, for Lazy Burned ([5e36e1b](https://github.com/rarible/protocol-contracts/commit/5e36e1b2826693fa89d7efde4afbc224b8514c14))
* delete unnecessary contract ([df32927](https://github.com/rarible/protocol-contracts/commit/df32927e50e6ff43203b5bddd7c2cd61d3c67c5c))
* Exchange address[] to LibPart[] for creators 1155Lazy ([b0bb577](https://github.com/rarible/protocol-contracts/commit/b0bb5775c1b8d9ff0ca5e3d15d30af910eddf73b))
* if Lazy berned, emit event BurnLazy ([70bacec](https://github.com/rarible/protocol-contracts/commit/70bacecd6b342e57d8d92cadbbdfd7d89bb1bd02))
* tokens ([e3e204c](https://github.com/rarible/protocol-contracts/commit/e3e204c161d18f4bb4d36bc72fdbbae98619a120))
* work commit ([da9112d](https://github.com/rarible/protocol-contracts/commit/da9112d9f0641da72014d5a68680417819805399))
