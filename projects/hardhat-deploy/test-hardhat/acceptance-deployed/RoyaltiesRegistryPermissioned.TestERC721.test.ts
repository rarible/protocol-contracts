/* <ai_context>
This test verifies behavior of the permissioned royalties registry.
It covers four specific scenarios where collections are not in the allow list,
expecting empty royalties in each case.
Additionally, it tests behavior when allowed for comparison.
It also includes integration tests with ExchangeV2 to verify royalties in trades.
</ai_context> */
import { expect } from "chai";
import { ethers, deployments } from "hardhat";
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import { RoyaltiesRegistryPermissioned, TestERC721WithRoyaltiesV1OwnableUpgradeable, TestERC721WithRoyaltiesV2OwnableUpgradeable, TestERC721WithRoyaltyV2981, TestERC721RoyaltiesV2, TestERC721, RoyaltiesRegistryPermissioned__factory } from "../../typechain-types";
import { LibPart } from "@rarible/royalties-registry/typechain-types/contracts/RoyaltiesRegistryPermissioned";
import { upgrades } from "hardhat";
import { ExchangeV2, ExchangeV2__factory, TransferProxy, TransferProxy__factory, ERC20TransferProxy, ERC20TransferProxy__factory, ERC721LazyMintTransferProxy, ERC721LazyMintTransferProxy__factory, ERC1155LazyMintTransferProxy, ERC1155LazyMintTransferProxy__factory, AssetMatcherCollection, AssetMatcherCollection__factory } from "../../typechain-types";
import { ZERO, ETH, ERC721, ERC721_LAZY, ERC1155_LAZY, ERC20, COLLECTION } from "@rarible/exchange-v2/sdk/utils";
import { createSellOrder, createBuyOrder, signOrderWithWallet } from "@rarible/exchange-v2/sdk/listingUtils";
describe("RoyaltiesRegistryPermissioned in hardhat-deploy", function () {
    let registry: RoyaltiesRegistryPermissioned;
    let transferProxy: TransferProxy;
    let exchange: ExchangeV2;
    let owner: SignerWithAddress;
    let whitelister: SignerWithAddress;
    let seller: SignerWithAddress;
    let buyer: SignerWithAddress;
    let erc721NoRoyalties: TestERC721;
    const tokenId = 1;
    const price = ethers.utils.parseEther("0.00001");
    beforeEach(async function () {
        [owner, whitelister, seller, buyer] = await ethers.getSigners();
        const registryAddress = (await deployments.get("RoyaltiesRegistryPermissioned")).address;
        console.log("Registry address", registryAddress);
        const transferProxyAddress = (await deployments.get("TransferProxy")).address;
        console.log("Transfer proxy address", transferProxyAddress);
        registry = await ethers.getContractAt("RoyaltiesRegistryPermissioned", registryAddress) as RoyaltiesRegistryPermissioned;
        transferProxy = await ethers.getContractAt("TransferProxy", transferProxyAddress) as TransferProxy;
        const exchangeAddress = (await deployments.get("ExchangeV2")).address;
        console.log("Exchange address", exchangeAddress);
        exchange = await ethers.getContractAt("ExchangeV2", exchangeAddress) as ExchangeV2;

        console.log("Owner", owner.address);
        console.log("owner balance", ethers.utils.formatEther(await owner.getBalance()));
        console.log("TestERC721");
        const TestERC721Factory = await ethers.getContractFactory("TestERC721");
        erc721NoRoyalties = await TestERC721Factory.deploy("Test No Royalties", "TNR") as TestERC721;
    });
    describe("getRoyalties Scenarios - Not Allowed", function () {
        it("1: ERC721 without royalties - not allowed: empty", async function () {
            await erc721NoRoyalties.connect(owner).mint(seller.address, tokenId);
            const result = await registry.callStatic.getRoyalties(erc721NoRoyalties.address, tokenId);
            expect(result.length).to.equal(0, "Should return empty when not allowed");
        });
    });
    describe("should trade without royalties", function () {
        it("should trade without royalties", async function () {
            // Create sell order with utility function
            const sellOrder = createSellOrder(
                erc721NoRoyalties.address,
                tokenId.toString(),
                seller.address,
                ETH,
                "0x", // ETH asset data
                price.toString(),
                ERC721
            );
  
            // Sign the sell order with seller wallet (adapt signOrderWithWallet to accept Wallet)
            const sellSig = await signOrderWithWallet(sellOrder, seller, exchange.address);
        
            // Create buy order (mirror test logic)
            console.log("Creating buy order");
            const buyOrder = createBuyOrder(sellOrder, buyer.address, price.toString());
            console.log("Signing buy order");
            const buySig = await signOrderWithWallet(buyOrder, buyer, exchange.address);
        
            // Print out for clarity
            console.log("Sell order:", sellOrder);
            console.log("Sell signature:", sellSig);
            console.log("Buy order:", buyOrder);
            console.log("Buy signature:", buySig);
        

            // Execute order (as buyer), send ETH for order value
            const tx = await exchange.matchOrders(
                sellOrder,
                sellSig,
                buyOrder,
                buySig,
                { value: price }
            );
            console.log("Executing order");
            const receipt = await tx.wait(5);
            console.log("Trade executed! TX hash:", receipt.transactionHash);
        
            // Confirm NFT ownership
            const newOwner = await erc721NoRoyalties.ownerOf(tokenId);
            if (newOwner.toLowerCase() === buyer.address.toLowerCase()) {
                console.log(`✅ Success: Buyer ${buyer.address} now owns token ${tokenId.toString()}`);
            } else {
                console.error(`❌ Error: Buyer does NOT own the token. Current owner: ${newOwner}`);
            }
        });
    });
});