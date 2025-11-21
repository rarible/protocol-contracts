import { expect } from "chai";
import { ethers, deployments } from "hardhat";
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import { RoyaltiesRegistryPermissioned, TestERC721WithRoyaltiesV1OwnableUpgradeable, TestERC721WithRoyaltiesV2OwnableUpgradeable, TestERC721WithRoyaltyV2981, TestERC721RoyaltiesV2, TestERC721, RoyaltiesRegistryPermissioned__factory } from "../../typechain-types";
import { LibPart } from "@rarible/royalties-registry/typechain-types/contracts/RoyaltiesRegistryPermissioned";
import { upgrades } from "hardhat";
import { ExchangeV2, ExchangeV2__factory, TransferProxy, TransferProxy__factory, ERC20TransferProxy, ERC20TransferProxy__factory, ERC721LazyMintTransferProxy, ERC721LazyMintTransferProxy__factory, ERC1155LazyMintTransferProxy, ERC1155LazyMintTransferProxy__factory, AssetMatcherCollection, AssetMatcherCollection__factory } from "../../typechain-types";
import { ZERO, ETH, ERC721, ERC721_LAZY, ERC1155_LAZY, ERC20, COLLECTION } from "@rarible/exchange-v2/sdk/utils";
import { createSellOrder, createBuyOrder, signOrderWithWallet } from "@rarible/exchange-v2/sdk/listingUtils";
import { BigNumber, Wallet } from "ethers";
import { RoyaltiesRegistry } from "@rarible/royalties-registry/typechain-types";
import { formatEther } from "ethers/lib/utils";
describe("RoyaltiesRegistryPermissioned in hardhat-deploy", function () {
    let registry: RoyaltiesRegistryPermissioned;
    let oldRegistry: RoyaltiesRegistry;
    let transferProxy: TransferProxy;
    let exchange: ExchangeV2;
    let owner: SignerWithAddress;
    let whitelister: Wallet;
    let seller: Wallet;
    let buyer: Wallet;
    let royaltyRecipient: Wallet;
    let erc721: TestERC721RoyaltiesV2;
    const tokenId = 1;
    const price = ethers.utils.parseEther("0.01");
    const numberOfBlocksToWait = 1;
    let protocolFeeBpsBuyerAmount = 0
    let protocolFeeBpsSellerAmount = 0
    type SignerLike = Wallet | SignerWithAddress;
    const nonceTracker: Record<string, number> = {};
    async function initializeNonce(signer: SignerLike) {
        nonceTracker[signer.address] = await ethers.provider.getTransactionCount(signer.address, "pending");
    }
    async function initializeNonces(signers: SignerLike[]) {
        await Promise.all(signers.map(initializeNonce));
    }
    async function getAndIncrementNonce(signer: SignerLike) {
        if (nonceTracker[signer.address] === undefined) {
            await initializeNonce(signer);
        }
        return nonceTracker[signer.address]++;
    }
    this.beforeAll(async function () {
        [owner] = await ethers.getSigners();
        const PRIVATE_KEY1 = process.env.PRIVATE_KEY1;
        const PRIVATE_KEY2 = process.env.PRIVATE_KEY2;
        const PRIVATE_KEY_ROYALTY = process.env.PRIVATE_KEY_ROYALTY;
        const PRIVATE_KEY3 = process.env.PRIVATE_KEY3;
       
        if (!PRIVATE_KEY1 || !PRIVATE_KEY2 || !PRIVATE_KEY_ROYALTY || !PRIVATE_KEY3) {
          throw new Error("PRIVATE_KEY1, PRIVATE_KEY2, PRIVATE_KEY3 and PRIVATE_KEY_ROYALTY must be set in your .env");
        }
   
        // Set up seller and buyer as Wallet signers
        seller = new Wallet(PRIVATE_KEY1, ethers.provider);
        buyer = new Wallet(PRIVATE_KEY2, ethers.provider);
        whitelister = new Wallet(PRIVATE_KEY3, ethers.provider);
        royaltyRecipient = new Wallet(PRIVATE_KEY_ROYALTY, ethers.provider);
        console.log("Seller address", seller.address);
        console.log("Buyer address", buyer.address);
        const registryAddress = (await deployments.get("RoyaltiesRegistryPermissioned")).address;
        console.log("Registry address", registryAddress);
        const transferProxyAddress = (await deployments.get("TransferProxy")).address;
        console.log("Transfer proxy address", transferProxyAddress);
        registry = await ethers.getContractAt("RoyaltiesRegistryPermissioned", registryAddress) as RoyaltiesRegistryPermissioned;
        oldRegistry = await ethers.getContractAt("RoyaltiesRegistry", registryAddress) as RoyaltiesRegistry;
        transferProxy = await ethers.getContractAt("TransferProxy", transferProxyAddress) as TransferProxy;
        const exchangeAddress = (await deployments.get("ExchangeV2")).address;
        console.log("Exchange address", exchangeAddress);
        exchange = await ethers.getContractAt("ExchangeV2", exchangeAddress) as ExchangeV2;
        console.log("Owner", owner.address);
        console.log("owner balance", ethers.utils.formatEther(await owner.getBalance()));
        console.log("seller address", seller.address);
        console.log("buyer address", buyer.address);
        console.log("Seller balance", ethers.utils.formatEther(await seller.getBalance()));
        console.log("Buyer balance", ethers.utils.formatEther(await buyer.getBalance()));
        console.log("TestERC721");
        const TestERC721RoyaltiesV2Factory = await ethers.getContractFactory("TestERC721RoyaltiesV2");
        await initializeNonces([owner, seller, buyer, whitelister]);
        // Deploy with explicit nonce and gas bump (using seller/owner nonce)
        const gasPrice = (await ethers.provider.getGasPrice()).mul(2);
        erc721 = await TestERC721RoyaltiesV2Factory.deploy( {
            nonce: await getAndIncrementNonce(owner),
            gasPrice,
        }) as TestERC721RoyaltiesV2;
        const deployRes = await erc721.deployed();
        console.log("Deployed with royalties tx hash", deployRes.deployTransaction.hash);
        await deployRes.deployTransaction.wait(numberOfBlocksToWait);
        (await erc721.connect(owner).initialize({
            nonce: await getAndIncrementNonce(owner),
            gasPrice,
        })).wait(numberOfBlocksToWait);
        const txStatus = await (await registry.connect(owner).grantRole(await registry.WHITELISTER_ROLE(), whitelister.address, {
            nonce: await getAndIncrementNonce(owner),
            gasPrice,
        })).wait(numberOfBlocksToWait);
        await (await registry.connect(whitelister).setRoyaltiesAllowed(erc721.address, true, {
            nonce: await getAndIncrementNonce(whitelister),
            gasPrice,
        })).wait(numberOfBlocksToWait);
        await (await registry.connect(owner).revokeRole(await registry.WHITELISTER_ROLE(), whitelister.address, {
            nonce: await getAndIncrementNonce(owner),
            gasPrice,
        })).wait(numberOfBlocksToWait);
        protocolFeeBpsBuyerAmount = parseInt((await exchange.protocolFee()).buyerAmount.toFixed());
        protocolFeeBpsSellerAmount = parseInt((await exchange.protocolFee()).sellerAmount.toFixed());
    });
    describe("getRoyalties Scenarios - Allowed", function () {
        it("ERC721 with royalties V2 interface: returns the set royalties", async function () {
            // Reset nonces for this block
            await initializeNonces([owner, seller, buyer, whitelister]);
            const gasPrice = (await ethers.provider.getGasPrice()).mul(2);
            // Mint with overrides (seller/owner)
            const mintTx = await erc721.connect(owner).mint(seller.address, tokenId, [{account: royaltyRecipient.address, value: 1000}], {
                nonce: await getAndIncrementNonce(owner),
                gasPrice,
            });
            await mintTx.wait(numberOfBlocksToWait);
            // Approve with overrides (seller)
            const approveTx = await erc721.connect(seller).approve(transferProxy.address, tokenId, {
                nonce: await getAndIncrementNonce(seller),
                gasPrice,
            });
            await approveTx.wait(numberOfBlocksToWait);
        });
    });
    describe("should trade with royalties", function () {
        it("should trade with royalties", async function () {
            // Reset nonces for this block
            await initializeNonces([owner, seller, buyer, whitelister]);
            const gasPrice = (await ethers.provider.getGasPrice()).mul(2);
            // Create sell order with utility function
            const sellOrder = createSellOrder(
                erc721.address,
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
       
            // Snapshot balances before trade
            const sellerBalanceBefore = await seller.getBalance();
            const buyerBalanceBefore = await buyer.getBalance();
            const royaltyRecipientBalanceBefore = await royaltyRecipient.getBalance();
            // Execute order (as buyer), send ETH for order value, with overrides
            const tx = await exchange.connect(buyer).matchOrders(
                sellOrder,
                sellSig,
                buyOrder,
                buySig,
                {
                    value: price,
                    nonce: await getAndIncrementNonce(buyer),
                    gasPrice,
                }
            );
            console.log("Executing order");
            const receipt = await tx.wait(numberOfBlocksToWait);
            console.log("Trade executed! TX hash:", receipt.transactionHash);
       
            // Confirm NFT ownership
            const newOwner = await erc721.ownerOf(tokenId);
            expect(newOwner.toLowerCase()).to.equal(buyer.address.toLowerCase());
            // Check balances after trade
            const sellerBalanceAfter = await seller.getBalance();
            const buyerBalanceAfter = await buyer.getBalance();
            const royaltyRecipientBalanceAfter = await royaltyRecipient.getBalance();
            console.log("Seller balance difference", ethers.utils.formatEther(sellerBalanceAfter.sub(sellerBalanceBefore)));
            console.log("Buyer balance difference", ethers.utils.formatEther(buyerBalanceAfter.sub(buyerBalanceBefore)));
            console.log("Royalty recipient balance difference", ethers.utils.formatEther(royaltyRecipientBalanceAfter.sub(royaltyRecipientBalanceBefore)));
            // Calculate gas cost
            const gasCost = receipt.gasUsed.mul(receipt.effectiveGasPrice);
            const royaltyAmount = (await erc721.callStatic.royaltyInfo(tokenId, price))[1];
            const feeSellerAmount = price.mul(protocolFeeBpsSellerAmount).div(10000);
            const feeBuyerAmount = price.mul(protocolFeeBpsBuyerAmount).div(10000);
            console.log("Royalty amount", formatEther(royaltyAmount));
            // Assert balance changes exactly, assuming no protocol fees deducted from price
            expect(sellerBalanceAfter).to.be.closeTo(sellerBalanceBefore.add(price).sub(feeSellerAmount).sub(royaltyAmount), ethers.utils.parseEther("0.000001"), "Seller should receive exactly the price");
            expect(buyerBalanceAfter).to.be.closeTo(buyerBalanceBefore.sub(price).sub(gasCost).add(feeBuyerAmount), ethers.utils.parseEther("0.000001"), "Buyer should pay exactly the price plus gas cost");
            expect(royaltyRecipientBalanceAfter).to.equal(royaltyRecipientBalanceBefore.add(royaltyAmount), "Royalty must be received");
        });
    });
});