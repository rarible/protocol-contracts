/* <ai_context>
This test verifies behavior of the permissioned royalties registry.
It covers four specific scenarios where collections are not in the allow list,
expecting empty royalties in each case.
Additionally, it tests behavior when allowed for comparison.
It also includes integration tests with ExchangeV2 to verify royalties in trades.
</ai_context> */
import { expect } from "chai";
import { ethers } from "hardhat";
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import { RoyaltiesRegistryPermissioned, TestERC721WithRoyaltiesV1OwnableUpgradeable, TestERC721WithRoyaltiesV2OwnableUpgradeable, TestERC721WithRoyaltyV2981, TestERC721RoyaltiesV2, TestERC721, RoyaltiesRegistryPermissioned__factory } from "../typechain-types";
import { LibPart } from "@rarible/royalties-registry/typechain-types/contracts/RoyaltiesRegistryPermissioned";
import { upgrades } from "hardhat";
import { ExchangeV2, ExchangeV2__factory, TransferProxy, TransferProxy__factory, ERC20TransferProxy, ERC20TransferProxy__factory, ERC721LazyMintTransferProxy, ERC721LazyMintTransferProxy__factory, ERC1155LazyMintTransferProxy, ERC1155LazyMintTransferProxy__factory, AssetMatcherCollection, AssetMatcherCollection__factory } from "../typechain-types";
import { ZERO, ETH, ERC721, ERC721_LAZY, ERC1155_LAZY, ERC20, COLLECTION } from "@rarible/exchange-v2/sdk/utils";
import { createSellOrder, createBuyOrder, signOrderWithWallet } from "@rarible/exchange-v2/sdk/listingUtils";
describe("RoyaltiesRegistryPermissioned in hardhat-deploy", function () {
    let registry: RoyaltiesRegistryPermissioned;
    let owner: SignerWithAddress;
    let whitelister: SignerWithAddress;
    let user: SignerWithAddress;
    let erc721V2: TestERC721WithRoyaltiesV2OwnableUpgradeable;
    let erc721NoRoyalties: TestERC721;
    let erc721V2981: TestERC721WithRoyaltyV2981;
    const tokenId = 1;
    beforeEach(async function () {
        [owner, whitelister, user] = await ethers.getSigners();
        let registryAddress: string;
        if (hre.network.name === "sepolia") {
            registryAddress = "0x3B8550A43A665871daBC656572e4862E5f940ed7";
            registry = await ethers.getContractAt("RoyaltiesRegistryPermissioned", registryAddress) as RoyaltiesRegistryPermissioned;
        } else {
            const RoyaltiesRegistryPermissionedFactory = await ethers.getContractFactory("RoyaltiesRegistryPermissioned") as RoyaltiesRegistryPermissioned__factory;
            registry = await upgrades.deployProxy(
                RoyaltiesRegistryPermissionedFactory,
                [owner.address],
                {
                    initializer: "__RoyaltiesRegistry_init",
                    kind: "transparent",
                }
            ) as RoyaltiesRegistryPermissioned;
            await registry.deployed();
            await registry.connect(owner).grantRole(await registry.WHITELISTER_ROLE(), whitelister.address);
        }
        // Deploy mocks
        console.log("TestERC721WithRoyaltiesV2OwnableUpgradeable");
        const TestERC721V2Factory = await ethers.getContractFactory("TestERC721WithRoyaltiesV2OwnableUpgradeable");
        erc721V2 = await TestERC721V2Factory.deploy() as TestERC721WithRoyaltiesV2OwnableUpgradeable;
        await erc721V2.connect(owner).initialize();
        console.log("TestERC721WithRoyaltyV2981");
        const TestERC721V2981Factory = await ethers.getContractFactory("TestERC721WithRoyaltyV2981");
        erc721V2981 = await TestERC721V2981Factory.deploy() as TestERC721WithRoyaltyV2981;
        await erc721V2981.connect(owner).initialize();
        console.log("TestERC721");
        const TestERC721Factory = await ethers.getContractFactory("TestERC721");
        erc721NoRoyalties = await TestERC721Factory.deploy("Test No Royalties", "TNR") as TestERC721;
    });
    describe("getRoyalties Scenarios - Not Allowed", function () {
        it("1: ERC721 with Rarible royalties (one recipient) - not allowed: empty", async function () {
            const oneRoyalty: LibPart.PartStruct[] = [
                { account: user.address, value: 1000 },
            ];
            await erc721V2.connect(owner).mint(user.address, tokenId, oneRoyalty);
            const result = await registry.callStatic.getRoyalties(erc721V2.address, tokenId);
            expect(result.length).to.equal(0, "Should return empty when not allowed");
        });
        it("2: ERC721 without royalties - not allowed: empty", async function () {
            await erc721NoRoyalties.connect(owner).mint(user.address, tokenId);
            const result = await registry.callStatic.getRoyalties(erc721NoRoyalties.address, tokenId);
            expect(result.length).to.equal(0, "Should return empty when not allowed");
        });
        it("3: ERC721 with EIP-2981 - not allowed: empty", async function () {
            await erc721V2981.connect(owner).mint(user.address, tokenId);
            const result = await registry.callStatic.getRoyalties(erc721V2981.address, tokenId);
            expect(result.length).to.equal(0, "Should return empty when not allowed");
        });
        it("4: ERC721 with Rarible royalties (two recipients) - not allowed: empty", async function () {
            const twoRoyalties: LibPart.PartStruct[] = [
                { account: user.address, value: 1000 },
                { account: whitelister.address, value: 500 },
            ];
            await erc721V2.connect(owner).mint(user.address, tokenId, twoRoyalties);
            const result = await registry.callStatic.getRoyalties(erc721V2.address, tokenId);
            expect(result.length).to.equal(0, "Should return empty when not allowed");
        });
    });
    if (hre.network.name !== "sepolia") { // Skip 'allowed' tests on Sepolia since we can't grant roles on existing registry
        describe("getRoyalties Scenarios - Allowed (for verification)", function () {
            it("1: ERC721 with Rarible royalties (one recipient) - allowed: one royalty", async function () {
                const oneRoyalty: LibPart.PartStruct[] = [
                    { account: user.address, value: 1000 },
                ];
                await erc721V2.connect(owner).mint(user.address, tokenId, oneRoyalty);
                await registry.connect(whitelister).setRoyaltiesAllowed(erc721V2.address, true);
                const result = await registry.callStatic.getRoyalties(erc721V2.address, tokenId);
                expect(result.length).to.equal(1);
                expect(result[0].account).to.equal(oneRoyalty[0].account);
                expect(result[0].value).to.equal(oneRoyalty[0].value);
            });
            it("2: ERC721 without royalties - allowed: empty", async function () {
                await erc721NoRoyalties.connect(owner).mint(user.address, tokenId);
                await registry.connect(whitelister).setRoyaltiesAllowed(erc721NoRoyalties.address, true);
                const result = await registry.callStatic.getRoyalties(erc721NoRoyalties.address, tokenId);
                expect(result.length).to.equal(0, "Should return empty even when allowed (no royalties)");
            });
            it("3: ERC721 with EIP-2981 - allowed: one royalty", async function () {
                await erc721V2981.connect(owner).mint(user.address, tokenId);
                await registry.connect(whitelister).setRoyaltiesAllowed(erc721V2981.address, true);
                const result = await registry.callStatic.getRoyalties(erc721V2981.address, tokenId);
                expect(result.length).to.equal(1);
                expect(result[0].value).to.equal(1000); // Default in mock
            });
            it("4: ERC721 with Rarible royalties (two recipients) - allowed: two royalties", async function () {
                const twoRoyalties: LibPart.PartStruct[] = [
                    { account: user.address, value: 1000 },
                    { account: whitelister.address, value: 500 },
                ];
                await erc721V2.connect(owner).mint(user.address, tokenId, twoRoyalties);
                await registry.connect(whitelister).setRoyaltiesAllowed(erc721V2.address, true);
                const result = await registry.callStatic.getRoyalties(erc721V2.address, tokenId);
                expect(result.length).to.equal(2);
                expect(result[0].account).to.equal(twoRoyalties[0].account);
                expect(result[0].value).to.equal(twoRoyalties[0].value);
                expect(result[1].account).to.equal(twoRoyalties[1].account);
                expect(result[1].value).to.equal(twoRoyalties[1].value);
            });
        });
    }
    describe("Integration with Exchange - Royalties in Trade", function () {
        let exchange: ExchangeV2;
        let transferProxy: TransferProxy;
        let erc20TransferProxy: ERC20TransferProxy;
        let erc721LazyMintTransferProxy: ERC721LazyMintTransferProxy;
        let erc1155LazyMintTransferProxy: ERC1155LazyMintTransferProxy;
        let assetMatcherCollection: AssetMatcherCollection;
        let seller: SignerWithAddress;
        let buyer: SignerWithAddress;
        let royaltyRecipient: SignerWithAddress;
        const price = ethers.utils.parseEther("1");
        const tokenId = 42;
        beforeEach(async function () {
            [seller, buyer, royaltyRecipient] = await ethers.getSigners();
            // Deploy proxies
            transferProxy = await (new TransferProxy__factory(owner)).deploy();
            await transferProxy.__OperatorRole_init();
            erc20TransferProxy = await (new ERC20TransferProxy__factory(owner)).deploy();
            await erc20TransferProxy.__OperatorRole_init();
            erc721LazyMintTransferProxy = await (new ERC721LazyMintTransferProxy__factory(owner)).deploy();
            await erc721LazyMintTransferProxy.__OperatorRole_init();
            erc1155LazyMintTransferProxy = await (new ERC1155LazyMintTransferProxy__factory(owner)).deploy();
            await erc1155LazyMintTransferProxy.__OperatorRole_init();
            assetMatcherCollection = await (new AssetMatcherCollection__factory(owner)).deploy();
            // Deploy Exchange
            exchange = await (new ExchangeV2__factory(owner)).deploy();
            await exchange.__ExchangeV2_init(
                transferProxy.address,
                erc20TransferProxy.address,
                0,
                ZERO,
                registry.address
            );
            // Add operators
            await transferProxy.addOperator(exchange.address);
            await erc20TransferProxy.addOperator(exchange.address);
            await erc721LazyMintTransferProxy.addOperator(exchange.address);
            await erc1155LazyMintTransferProxy.addOperator(exchange.address);
            // Set transfer proxies
            await exchange.setTransferProxy(ERC721_LAZY, erc721LazyMintTransferProxy.address);
            await exchange.setTransferProxy(ERC1155_LAZY, erc1155LazyMintTransferProxy.address);
            await exchange.setTransferProxy(ERC20, erc20TransferProxy.address);
            await exchange.setAssetMatcher(COLLECTION, assetMatcherCollection.address);
        });
        it("royalties not paid if not allowed", async function () {
            const royalties: LibPart.PartStruct[] = [
                { account: royaltyRecipient.address, value: 1000 },
            ];
            await erc721V2.connect(owner).mint(seller.address, tokenId, royalties);
            await erc721V2.connect(seller).setApprovalForAll(transferProxy.address, true);
            const sellOrder = createSellOrder(
                erc721V2.address,
                tokenId.toString(),
                seller.address,
                ETH,
                "0x",
                price.toString(),
                ERC721
            );
            const sellSig = await signOrderWithWallet(sellOrder, seller, exchange.address);
            const buyOrder = createBuyOrder(sellOrder, buyer.address, price.toString());
            const buySig = await signOrderWithWallet(buyOrder, buyer, exchange.address);
            const royaltyBefore = await provider.getBalance(royaltyRecipient.address);
            await exchange.connect(buyer).matchOrders(
                sellOrder,
                sellSig,
                buyOrder,
                buySig,
                { value: price }
            );
            const royaltyAfter = await provider.getBalance(royaltyRecipient.address);
            expect(royaltyAfter).to.equal(royaltyBefore, "No royalties paid when not allowed");
            expect(await erc721V2.ownerOf(tokenId)).to.equal(buyer.address);
        });
        if (hre.network.name !== "sepolia") {
            it("royalties paid if allowed", async function () {
                const royalties: LibPart.PartStruct[] = [
                    { account: royaltyRecipient.address, value: 1000 },
                ];
                await erc721V2.connect(owner).mint(seller.address, tokenId, royalties);
                await registry.connect(whitelister).setRoyaltiesAllowed(erc721V2.address, true);
                await erc721V2.connect(seller).setApprovalForAll(transferProxy.address, true);
                const sellOrder = createSellOrder(
                    erc721V2.address,
                    tokenId.toString(),
                    seller.address,
                    ETH,
                    "0x",
                    price.toString(),
                    ERC721
                );
                const sellSig = await signOrderWithWallet(sellOrder, seller, exchange.address);
                const buyOrder = createBuyOrder(sellOrder, buyer.address, price.toString());
                const buySig = await signOrderWithWallet(buyOrder, buyer, exchange.address);
                const royaltyBefore = await provider.getBalance(royaltyRecipient.address);
                await exchange.connect(buyer).matchOrders(
                    sellOrder,
                    sellSig,
                    buyOrder,
                    buySig,
                    { value: price }
                );
                const royaltyAfter = await provider.getBalance(royaltyRecipient.address);
                const expectedRoyalty = price.mul(1000).div(10000);
                expect(royaltyAfter.sub(royaltyBefore)).to.equal(expectedRoyalty, "Royalties paid when allowed");
                expect(await erc721V2.ownerOf(tokenId)).to.equal(buyer.address);
            });
        }
    });
});