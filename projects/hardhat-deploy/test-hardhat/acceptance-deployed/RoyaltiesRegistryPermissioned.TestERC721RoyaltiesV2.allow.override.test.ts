
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
    let royaltyRecipient2: Wallet;
    let erc721: TestERC721RoyaltiesV2;
    const tokenId = 1;
    const price = ethers.utils.parseEther("0.01");
    const numberOfBlocksToWait = 1;
    let protocolFeeBpsBuyerAmount = 0
    let protocolFeeBpsSellerAmount = 0

    // Helpers to manage nonces incrementally
    let sellerCurrentNonce: number;
    let buyerCurrentNonce: number;

    async function getAndIncrementSellerNonce() {
        return sellerCurrentNonce++;
    }

    async function getAndIncrementBuyerNonce() {
        return buyerCurrentNonce++;
    }

    this.beforeAll(async function () {
        [owner] = await ethers.getSigners();
        const PRIVATE_KEY1 = process.env.PRIVATE_KEY1;
        const PRIVATE_KEY2 = process.env.PRIVATE_KEY2;
        const PRIVATE_KEY_ROYALTY = process.env.PRIVATE_KEY_ROYALTY;
        const PRIVATE_KEY_ROYALTY2 = process.env.PRIVATE_KEY_ROYALTY2;
        if (!PRIVATE_KEY1 || !PRIVATE_KEY2 || !PRIVATE_KEY_ROYALTY || !PRIVATE_KEY_ROYALTY2) {
          throw new Error("PRIVATE_KEY1 and PRIVATE_KEY2 must be set in your .env");
        }
    
        // Set up seller and buyer as Wallet signers
        seller = new Wallet(PRIVATE_KEY1, ethers.provider);
        buyer = new Wallet(PRIVATE_KEY2, ethers.provider);
        whitelister = new Wallet(PRIVATE_KEY1, ethers.provider);
        royaltyRecipient = new Wallet(PRIVATE_KEY_ROYALTY, ethers.provider);
        royaltyRecipient2 = new Wallet(PRIVATE_KEY_ROYALTY2, ethers.provider);
        console.log("Royalty recipient 2 address", royaltyRecipient2.address);
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

        // Fetch base pending nonces once
        sellerCurrentNonce = await ethers.provider.getTransactionCount(seller.address, 'pending');
        buyerCurrentNonce = await ethers.provider.getTransactionCount(buyer.address, 'pending');

        // Deploy with explicit nonce and gas bump (using seller/owner nonce)
        const gasPrice = (await ethers.provider.getGasPrice()).mul(2);
        erc721 = await TestERC721RoyaltiesV2Factory.deploy( {
            nonce: await getAndIncrementSellerNonce(),
            gasPrice,
        }) as TestERC721RoyaltiesV2;
        const deployRes = await erc721.deployed();
        console.log("Deployed erc721NoRoyalties", deployRes.deployTransaction.hash);
        await deployRes.deployTransaction.wait(numberOfBlocksToWait);

        (await erc721.connect(owner).initialize({
            nonce: await getAndIncrementSellerNonce(),
            gasPrice,
        })).wait(numberOfBlocksToWait);

        (await registry.connect(whitelister).setRoyaltiesAllowed(erc721.address, true, {
            nonce: await getAndIncrementSellerNonce(),
            gasPrice,
        })).wait(numberOfBlocksToWait);

        await registry.connect(whitelister).setRoyaltiesByToken(erc721.address, [{account: royaltyRecipient2.address, value: 800}], {
            nonce: await getAndIncrementSellerNonce(),
            gasPrice,
        });

        protocolFeeBpsBuyerAmount = parseInt((await exchange.protocolFee()).buyerAmount.toFixed());
        protocolFeeBpsSellerAmount = parseInt((await exchange.protocolFee()).sellerAmount.toFixed());
    });

    describe("getRoyalties Scenarios - Allowed", function () {
        it("1: ERC721 with royalties - allowed: one royalty", async function () {
            // Reset nonces for this block
            sellerCurrentNonce = await ethers.provider.getTransactionCount(seller.address, 'pending');
            buyerCurrentNonce = await ethers.provider.getTransactionCount(buyer.address, 'pending');

            const gasPrice = (await ethers.provider.getGasPrice()).mul(2);

            // Mint with overrides (seller/owner)
            const mintTx = await erc721.connect(owner).mint(seller.address, tokenId, [{account: royaltyRecipient.address, value: 1000}], {
                nonce: await getAndIncrementSellerNonce(),
                gasPrice,
            });
            await mintTx.wait(numberOfBlocksToWait);

            // Approve with overrides (seller)
            const approveTx = await erc721.connect(seller).approve(transferProxy.address, tokenId, {
                nonce: await getAndIncrementSellerNonce(),
                gasPrice,
            });
            await approveTx.wait(numberOfBlocksToWait+3);
            
            expect(await exchange.royaltiesRegistry()).to.equal(registry.address, "Exchange should have the correct royalties registry");

            (await registry.connect(whitelister).setRoyaltiesAllowed(erc721.address, true, {
                nonce: await getAndIncrementSellerNonce(),
                gasPrice,
            })).wait(numberOfBlocksToWait);

            const result = await registry.callStatic.getRoyalties(erc721.address, tokenId);
            const resultOld = await oldRegistry.callStatic.getRoyalties(erc721.address, tokenId);
            const oldType = await oldRegistry.callStatic.getRoyaltiesType(erc721.address);
            const type = await registry.callStatic.getRoyaltiesType(erc721.address);
            console.log("Old type", oldType);
            console.log("Type", type);
            console.log("Result old", JSON.stringify(resultOld));
            console.log("Result", JSON.stringify(result));
            expect(oldType).to.equal(type, "Types should be the same");
            expect(resultOld.length).to.equal(result.length, "Results should be the same");
            expect(resultOld[0].account).to.equal(result[0].account, "Recipients should be the same");
            expect(resultOld[0].value).to.equal(result[0].value, "Values should be the same");
            expect(result.length).to.equal(1, "Should return one royalty when allowed");
            expect(result[0].account).to.equal(royaltyRecipient.address, "Royalty recipient should be the correct address");
            expect(result[0].value).to.equal(1000, "Royalty value should be the correct value");
        });
    });

    describe("should trade without royalties", function () {
        it("should trade without royalties", async function () {
            // Reset nonces for this block
            sellerCurrentNonce = await ethers.provider.getTransactionCount(seller.address, 'pending');
            buyerCurrentNonce = await ethers.provider.getTransactionCount(buyer.address, 'pending');

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
            const royaltyRecipient2BalanceBefore = await royaltyRecipient2.getBalance();

            // Execute order (as buyer), send ETH for order value, with overrides
            const tx = await exchange.connect(buyer).matchOrders(
                sellOrder,
                sellSig,
                buyOrder,
                buySig,
                { 
                    value: price,
                    nonce: await getAndIncrementBuyerNonce(),
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
            const royaltyRecipient2BalanceAfter = await royaltyRecipient2.getBalance();

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
            expect(royaltyRecipientBalanceAfter).to.equal(royaltyRecipientBalanceBefore, "Royalty must not be received by first recipient");
            expect(royaltyRecipient2BalanceAfter).to.equal(royaltyRecipient2BalanceBefore.add(royaltyAmount), "Royalty must be received by second recipient");
        });
    });
});