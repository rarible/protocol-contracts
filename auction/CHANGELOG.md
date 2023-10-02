# Change Log

All notable changes to this project will be documented in this file.
See [Conventional Commits](https://conventionalcommits.org) for commit guidelines.

# 0.8.0 (2023-10-02)


### Bug Fixes

* after merge, AuctionHouse uses separate RaribleTransferManager ([e562b99](https://github.com/rarible/protocol-contracts/commit/e562b997f5636af9589fe34daa13e15e114c6097))
* auction duration extension edge cases ([9a4616d](https://github.com/rarible/protocol-contracts/commit/9a4616db540ab1efa1f4bee637f03e932fe5cfd9))
* change event property name in AuctionCreated ([70e921e](https://github.com/rarible/protocol-contracts/commit/70e921e2ac51e8ad634b9fbae49898fc5868619e))
* make startTime < now correct, endTime always sets at first bid + small refactor ([c5dcfc6](https://github.com/rarible/protocol-contracts/commit/c5dcfc6d12e24117664719ab7a3fb190e9e082cd))
* require buyAsset in auctions to be ETH or ERC-20, change tokenToAuctionId to store only ERC-721 ids ([8419109](https://github.com/rarible/protocol-contracts/commit/84191095033fa555ce89986d25fdf6d376b3aff1))
* resolved todo, simplified code ([152c164](https://github.com/rarible/protocol-contracts/commit/152c164b35e547ecc7036d290a821e928ce18388))
* RPC-181 5.1 get rid of payouts in auction data and bid data ([4e4dcbe](https://github.com/rarible/protocol-contracts/commit/4e4dcbef756dca1395535c20dfeb7f2d8132e0fb))
* RPC-181 5.5 use safeamath ([c91b602](https://github.com/rarible/protocol-contracts/commit/c91b6026961372bd7af415f31c09fc9fbf1fb067))
* RPC-181 5.6 optimize gas usage in auction ([2ec6fc6](https://github.com/rarible/protocol-contracts/commit/2ec6fc629f517083860db13c4d8e98d80d77f160))
* RPC-181 5.7 read proxy address from transfer manager ([3397d4f](https://github.com/rarible/protocol-contracts/commit/3397d4fb0f7d7bdf503b4fe7cb7a21001e86b48d))
* RPC-181 5.8 make cancel() nonReentrant ([ebcb2a2](https://github.com/rarible/protocol-contracts/commit/ebcb2a25175ccf68838a38e7ce3b477971a55b7f))
* RPC-181 7.1 add event ProtocolFeeChanged fo auction ([37b7faf](https://github.com/rarible/protocol-contracts/commit/37b7faf27fbeed0cf9c4e3307e40b526017c1c4e))
* RPC-191 change orifinFees to originFee (1 element) for auction and bid data ([ea0afa1](https://github.com/rarible/protocol-contracts/commit/ea0afa1d550d022a0101e90acf332c39c8bc190a))
* RPC-191 optimize sellAsset and BuyAsset, only ERC721 auctions ([ab6b73d](https://github.com/rarible/protocol-contracts/commit/ab6b73debb4e1b24f7d076df545f494176d40195))
* tests ([490a190](https://github.com/rarible/protocol-contracts/commit/490a19091ef4dcac8181cf52e6fb1ba7aaddf784))
* use uint instead of LIbPart, use internal transfer manager, move minimal step to storage ([2102b23](https://github.com/rarible/protocol-contracts/commit/2102b2369429e55a3dd72079dba4fb3100e3bd7d))


### Features

* add ability to change minimal auction duration, add auction temporary migration ([8335565](https://github.com/rarible/protocol-contracts/commit/8335565f8f6d0b0bac1341ae2035d151b6841427))
* add erc1155 auction ([3353094](https://github.com/rarible/protocol-contracts/commit/33530941ca9e4d3e8b0c545225740b1aed045ea2))
* add safeMath to auction ([8dc63e2](https://github.com/rarible/protocol-contracts/commit/8dc63e21b4288b92e730a3c672b01e1db3586ed3))
* add sender to events ([6314043](https://github.com/rarible/protocol-contracts/commit/6314043a5aee5e27727b09b65996445c17666677))
* BRAVO-1850 create new orders V3 with fees only on seller side, use new type in acutions, make previous types not use protocolFee ([58f3bc0](https://github.com/rarible/protocol-contracts/commit/58f3bc0171124c19626945468e5643557b0486a0))
* finish BRAVO-1966, full refactor package structure, tests ([ad908d2](https://github.com/rarible/protocol-contracts/commit/ad908d24ead38e602835dcc31d7d8245a843286b))
* fix exchange audit ([cedb07d](https://github.com/rarible/protocol-contracts/commit/cedb07d69d4155cfe37171ae4672e893c7df218f))
* fix RTM for exchangeV2 and auction ([db9a9df](https://github.com/rarible/protocol-contracts/commit/db9a9df15d4b3414a48cb2aac53a01a926df6065))
* get rid of protocol fee in exchangeV2 ([d0a53b8](https://github.com/rarible/protocol-contracts/commit/d0a53b8a38bf6d7022af1f8752a7525344176f4f))
* make wrapper non-upgradeable ([9c30112](https://github.com/rarible/protocol-contracts/commit/9c301121392dfe573d18a560fe1fb9f2210d578c))
* RPC-191 get rid of transfer event in auction ([f5073e8](https://github.com/rarible/protocol-contracts/commit/f5073e8d6109e2731939902c373e1cd494665123))
* RPC-191 reduce events size ([a23891a](https://github.com/rarible/protocol-contracts/commit/a23891a55ba2a63ce5f02d5136b9478c6cce09bd))
* RPC-191 refactor transfer executor auction ([f4d3282](https://github.com/rarible/protocol-contracts/commit/f4d328233868aa8d9b32ac17f8be2ec5edebf0ad))
* update auction documentation ([e2b44b4](https://github.com/rarible/protocol-contracts/commit/e2b44b4db75703830c974b5db85c432b695fe984))
* use RTM for auctions ([7fb54c9](https://github.com/rarible/protocol-contracts/commit/7fb54c902aff9eb330214867059c362e51037033))
* version bump ([8838a89](https://github.com/rarible/protocol-contracts/commit/8838a89c10147325d4aa83aa9ef725fabae85041))
* add check timeRange in putBid ([ddd6073](https://github.com/rarible/protocol-contracts/commit/ddd6073ec93e3bc24a5af188eae53cf71a90e586))
* add method calculate timeRange ([9280e61](https://github.com/rarible/protocol-contracts/commit/9280e61e92c25ab57d80ac7f2fda26211b0d9e66))
* add method putbid ([272d4d0](https://github.com/rarible/protocol-contracts/commit/272d4d00bbebb4770a18600b5734d2a2ef55c848))
* add pole startTime in auctionStruct ([86e449f](https://github.com/rarible/protocol-contracts/commit/86e449f17c42fd1a6f0ef327b2b223ecfa4c4485))
* add transfer bidFee to bidder if amount of 1155 are sell and fee value > 0 ([a33fd54](https://github.com/rarible/protocol-contracts/commit/a33fd5420ef6ba6c78d50245333b9e7c415be35e))
* add transfer bidFee to bidder if amount of erc20 are sell and fee value > 0 ([89e5eef](https://github.com/rarible/protocol-contracts/commit/89e5eef2787a63e08adba98954fb59bdc09ea2f1))
* merge buyOut ([dd3cf3d](https://github.com/rarible/protocol-contracts/commit/dd3cf3ddaf41d1530975898d12aeaa8ac8d8fa94))
* use buyOut in putBid method ([1089b86](https://github.com/rarible/protocol-contracts/commit/1089b86f9818fd48c9c30db8a0e9e4d987c424ed))
