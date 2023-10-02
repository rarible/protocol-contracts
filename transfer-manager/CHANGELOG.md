# Change Log

All notable changes to this project will be documented in this file.
See [Conventional Commits](https://conventionalcommits.org) for commit guidelines.

# 0.8.0 (2023-10-02)


### Bug Fixes

* fix run executor tests ([4d81cac](https://github.com/rarible/protocol-contracts/commit/4d81cacaaa5c7b615a92e52f37807384885b1b25))
* after merge, AuctionHouse uses separate RaribleTransferManager ([e562b99](https://github.com/rarible/protocol-contracts/commit/e562b997f5636af9589fe34daa13e15e114c6097))
* calculate correct origin fee ([8664083](https://github.com/rarible/protocol-contracts/commit/8664083d93c70ff116286e305a2cd797d598481e))
* correct versions in package.json ([1d35f71](https://github.com/rarible/protocol-contracts/commit/1d35f71e7d8b8604f2d16c1fd4a7136850cb35f8))
* RPC-181 5.7 read proxy address from transfer manager ([3397d4f](https://github.com/rarible/protocol-contracts/commit/3397d4fb0f7d7bdf503b4fe7cb7a21001e86b48d))
* RPC-191 optimize sellAsset and BuyAsset, only ERC721 auctions ([ab6b73d](https://github.com/rarible/protocol-contracts/commit/ab6b73debb4e1b24f7d076df545f494176d40195))
* tests ([490a190](https://github.com/rarible/protocol-contracts/commit/490a19091ef4dcac8181cf52e6fb1ba7aaddf784))
* use uint instead of LIbPart, use internal transfer manager, move minimal step to storage ([2102b23](https://github.com/rarible/protocol-contracts/commit/2102b2369429e55a3dd72079dba4fb3100e3bd7d))


### Features

* add group same transfers in RTM ([1812dfb](https://github.com/rarible/protocol-contracts/commit/1812dfb0a920df04eb95c525be7da0f94e2d8ad7))
* add natspec comments ([a171838](https://github.com/rarible/protocol-contracts/commit/a17183855b3f0227453f3be66964f16eed7d3ec8))
* BRAVO-1850 create new orders V3 with fees only on seller side, use new type in acutions, make previous types not use protocolFee ([27adb62](https://github.com/rarible/protocol-contracts/commit/27adb621783c016970a3149053f69c3175a0aac5))
* finish BRAVO-1966, full refactor package structure, tests ([ad908d2](https://github.com/rarible/protocol-contracts/commit/ad908d24ead38e602835dcc31d7d8245a843286b))
* fix exchange audit ([cedb07d](https://github.com/rarible/protocol-contracts/commit/cedb07d69d4155cfe37171ae4672e893c7df218f))
* fix RTM for exchangeV2 and auction ([db9a9df](https://github.com/rarible/protocol-contracts/commit/db9a9df15d4b3414a48cb2aac53a01a926df6065))
* get rid of protocol fee in exchangeV2 ([d0a53b8](https://github.com/rarible/protocol-contracts/commit/d0a53b8a38bf6d7022af1f8752a7525344176f4f))
* make protocolFee private ([124c523](https://github.com/rarible/protocol-contracts/commit/124c5230b0c6cc4238489f3206ecd2cb4de62d51))
* require origin fees <= 10000 ([d2a6d7f](https://github.com/rarible/protocol-contracts/commit/d2a6d7f5c7f10392b8c460dce9c4fd0bcf5d1f67))
* RPC-191 refactor transfer executor auction ([f4d3282](https://github.com/rarible/protocol-contracts/commit/f4d328233868aa8d9b32ac17f8be2ec5edebf0ad))
* version bump ([8838a89](https://github.com/rarible/protocol-contracts/commit/8838a89c10147325d4aa83aa9ef725fabae85041))
* add transfer error messsage ([5c54432](https://github.com/rarible/protocol-contracts/commit/5c544325fb3f2c05be0441b991f6b984f7ad0705))
* use RTM for auctions ([7fb54c9](https://github.com/rarible/protocol-contracts/commit/7fb54c902aff9eb330214867059c362e51037033))
* add base for transfer constant and event, fix tests ([01c2dad](https://github.com/rarible/protocol-contracts/commit/01c2dad7044f64ec86bc546609c5922ea6d5dc8c))
* More fix in ExchangeV2 ([7d6fc54](https://github.com/rarible/protocol-contracts/commit/7d6fc54c8f6569f101890daa4a606a8622b6a113))
* RaribleTransferManager in separate module ([9679d43](https://github.com/rarible/protocol-contracts/commit/9679d4312c65628807574f7e3f717b978ff8b774))
* RTM now compile again, after ITransferManager change ([cca38e6](https://github.com/rarible/protocol-contracts/commit/cca38e6cf67d09d9819bb7a74610b029f3dc2ea6))
