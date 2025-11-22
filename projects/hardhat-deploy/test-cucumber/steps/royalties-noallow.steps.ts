/* ai_context: This file contains step definitions for the royalties-noallow.feature using jest-cucumber. It integrates with Hardhat to test the RoyaltiesRegistryPermissioned contract behavior when royalties are not allowed for an ERC721 token. Steps deploy contracts, mint tokens, check royalties, and perform trades to verify no royalties are applied. Uses ethers and deployments from Hardhat. Wallets are created from env private keys for seller and buyer. Nonces are managed manually to avoid conflicts. */

import { defineFeature, loadFeature } from 'jest-cucumber';
import { ethers, deployments } from 'hardhat';
import { Wallet, BigNumber } from 'ethers';
import { expect } from '@jest/globals'; // Use Jest's expect for assertions
import { TestERC721, RoyaltiesRegistryPermissioned, ExchangeV2, TransferProxy } from '../../typechain-types'; // Adjust paths as needed
import { ETH, ERC721 } from '@rarible/exchange-v2/sdk/utils'; // Adjust import
import { createSellOrder, createBuyOrder, signOrderWithWallet } from '@rarible/exchange-v2/sdk/listingUtils'; // Adjust import

const feature = loadFeature('./test-cucumber/features/royalties-noallow.feature');

defineFeature(feature, (test) => {
  let registry: RoyaltiesRegistryPermissioned;
  let exchange: ExchangeV2;
  let transferProxy: TransferProxy;
  let erc721NoRoyalties: TestERC721;
  let seller: Wallet;
  let buyer: Wallet;
  let tokenId: number = 1;
  let price: BigNumber = ethers.utils.parseEther('0.00001');
  let sellerNonce: number;
  let buyerNonce: number;
  let protocolFeeBpsBuyerAmount: number;
  let protocolFeeBpsSellerAmount: number;

  beforeAll(async () => {
    // Load environment variables for private keys
    const PRIVATE_KEY1 = process.env.PRIVATE_KEY1;
    const PRIVATE_KEY2 = process.env.PRIVATE_KEY2;

    if (!PRIVATE_KEY1 || !PRIVATE_KEY2) {
      throw new Error('PRIVATE_KEY1 and PRIVATE_KEY2 must be set in your .env');
    }

    // Initialize wallets
    seller = new Wallet(PRIVATE_KEY1, ethers.provider);
    buyer = new Wallet(PRIVATE_KEY2, ethers.provider);

    // Initialize nonces
    sellerNonce = await ethers.provider.getTransactionCount(seller.address, 'pending');
    buyerNonce = await ethers.provider.getTransactionCount(buyer.address, 'pending');
  });

  test('ERC721 without royalties interface not allowed', ({ given, and, then }) => {
    given('I have the deployed royalties registry and exchange', async () => {
      // Fetch deployed contracts using hardhat-deploy
      const registryAddress = (await deployments.get('RoyaltiesRegistryPermissioned')).address;
      registry = (await ethers.getContractAt('RoyaltiesRegistryPermissioned', registryAddress)) as RoyaltiesRegistryPermissioned;

      const transferProxyAddress = (await deployments.get('TransferProxy')).address;
      transferProxy = (await ethers.getContractAt('TransferProxy', transferProxyAddress)) as TransferProxy;

      const exchangeAddress = (await deployments.get('ExchangeV2')).address;
      exchange = (await ethers.getContractAt('ExchangeV2', exchangeAddress)) as ExchangeV2;

      // Get protocol fees
      const protocolFee = await exchange.protocolFee();
      protocolFeeBpsBuyerAmount = parseInt(protocolFee.buyerAmount.toString());
      protocolFeeBpsSellerAmount = parseInt(protocolFee.sellerAmount.toString());
    });

    and('I deploy an ERC721 contract', async () => {
      const TestERC721Factory = await ethers.getContractFactory('TestERC721');
      const gasPrice = (await ethers.provider.getGasPrice()).mul(2);
      erc721NoRoyalties = (await TestERC721Factory.deploy('Test No Royalties', 'TNR', {
        nonce: sellerNonce++,
        gasPrice,
      })) as TestERC721;
      await erc721NoRoyalties.deployed();
    });

    and('I mint a token to seller', async () => {
      const gasPrice = (await ethers.provider.getGasPrice()).mul(2);
      const mintTx = await erc721NoRoyalties.mint(seller.address, tokenId, {
        nonce: sellerNonce++,
        gasPrice,
      });
      await mintTx.wait();
    });

    then('getRoyalties should return empty array', async () => {
      const result = await registry.callStatic.getRoyalties(erc721NoRoyalties.address, tokenId);
      expect(result.length).toEqual(0);
    });

    and('I can trade without royalties', async () => {
      const gasPrice = (await ethers.provider.getGasPrice()).mul(2);

      // Approve token
      await (await erc721NoRoyalties.connect(seller).approve(transferProxy.address, tokenId, {
        nonce: sellerNonce++,
        gasPrice,
      })).wait();

      // Snapshot balances
      const sellerBalanceBefore = await seller.getBalance();
      const buyerBalanceBefore = await buyer.getBalance();

      // Create and sign orders
      const sellOrder = createSellOrder(
        erc721NoRoyalties.address,
        tokenId.toString(),
        seller.address,
        ETH,
        '0x',
        price.toString(),
        ERC721
      );
      const sellSig = await signOrderWithWallet(sellOrder, seller, exchange.address);

      const buyOrder = createBuyOrder(sellOrder, buyer.address, price.toString());
      const buySig = await signOrderWithWallet(buyOrder, buyer, exchange.address);

      // Execute trade
      const tx = await exchange.connect(buyer).matchOrders(
        sellOrder,
        sellSig,
        buyOrder,
        buySig,
        {
          value: price,
          nonce: buyerNonce++,
          gasPrice,
        }
      );
      const receipt = await tx.wait();

      // Verify ownership
      expect(await erc721NoRoyalties.ownerOf(tokenId)).toEqual(buyer.address);

      // Verify balances
      const sellerBalanceAfter = await seller.getBalance();
      const buyerBalanceAfter = await buyer.getBalance();
      const gasCost = receipt.gasUsed.mul(receipt.effectiveGasPrice);
      const feeSellerAmount = price.mul(protocolFeeBpsSellerAmount).div(10000);
      const feeBuyerAmount = price.mul(protocolFeeBpsBuyerAmount).div(10000);

      expect(sellerBalanceAfter).toEqual(sellerBalanceBefore.add(price).sub(feeSellerAmount));
      expect(buyerBalanceAfter).toEqual(buyerBalanceBefore.sub(price).sub(gasCost).add(feeBuyerAmount));
    });
  });
});