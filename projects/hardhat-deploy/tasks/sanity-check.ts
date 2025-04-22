import { task } from 'hardhat/config';
import dotenv from 'dotenv';
import { HardhatRuntimeEnvironment } from 'hardhat/types';
import { BigNumber } from 'ethers';
import { getConfig } from '../utils/utils';
import { listBuyWithERC20 } from '@rarible/exchange-v2/sdk/listBuyERC20';
import { listBuyWithEth } from '@rarible/exchange-v2/sdk/listBuyETH';
import { getTokenAddress } from '@rarible/exchange-v2/sdk/getTokenAddress';
import { ExchangeMetaV2, ExchangeV2 } from '@rarible/exchange-v2/typechain-types';
import { IERC20Upgradeable } from '@rarible/tokens/js';

dotenv.config();

task('sanity-check', 'Mints tokens from two contracts and transfers them to a new wallet')
    .addParam('factory721', 'Address of the first contract')
    .addParam('factory1155', 'Address of the second contract')
    .addParam('transferAmount', 'Amount to transfer to buyer')
    .addParam('exchange', 'Address of the exchange contract')
    .addOptionalParam("price", "Price in wei", "1000")
    .addOptionalParam('salt', 'Salt for the token creation', "0")
    .setAction(async (taskArgs, hre: HardhatRuntimeEnvironment) => {
    const { ERC1155RaribleFactoryC2__factory, ERC721RaribleFactoryC2__factory } = await import('../typechain-types');

        // Get deployment configuration based on network
        const { deploy_meta, deploy_non_meta } = getConfig(hre.network.name);
        const { deploy } = hre.deployments;
        const signers = await hre.ethers.getSigners();
        const sellerWallet = signers[0];

        // Connect to the factory contracts that will create our tokens
        const factory721 = await ERC721RaribleFactoryC2__factory.connect(taskArgs.factory721, sellerWallet);
        const factory1155 = await ERC1155RaribleFactoryC2__factory.connect(taskArgs.factory1155, sellerWallet);

        // Get deterministic addresses for the tokens that will be created
        const tokenAddress721 = await getTokenAddress(factory721, `721${taskArgs.salt}`);
        const tokenAddress1155 = await getTokenAddress(factory1155, `1155${taskArgs.salt}`);
        
        // Initialize the appropriate token contract based on deployment configuration
        let token721;
        if (deploy_meta && !deploy_non_meta) {
            token721 = await hre.ethers.getContractAt("ERC721RaribleMeta", tokenAddress721);
        } else {
            token721 = await hre.ethers.getContractAt("ERC721RaribleMinimal", tokenAddress721);
        }

        let token1155;
        if (deploy_meta && !deploy_non_meta) {
            token1155 = await hre.ethers.getContractAt("ERC1155RaribleMeta", tokenAddress1155);
        } else {
            token1155 = await hre.ethers.getContractAt("ERC1155Rarible", tokenAddress1155);
        }

        let exchangeContract;
        if (deploy_meta && !deploy_non_meta) {
            exchangeContract = await hre.ethers.getContractAt("ExchangeMetaV2", taskArgs.exchange) as ExchangeMetaV2;
        } else {
            exchangeContract = await hre.ethers.getContractAt("ExchangeV2", taskArgs.exchange) as ExchangeV2;
        }

        console.log('Created 721 token at:', tokenAddress721);
        console.log('Created 1155 token at:', tokenAddress1155);
    
        // Grant permission to the exchange contract to transfer tokens on behalf of the seller
        await token721.setApprovalForAll(taskArgs.exchange, true);
        await token1155.setApprovalForAll(taskArgs.exchange, true);

        // Generate unique token IDs using seller's address as a base
        const tokenIdEth = sellerWallet.address + "b00000000000000000000001";
        const tokenIdErc20 = sellerWallet.address + "b00000000000000000000002";

        // Create a new wallet for the buyer and fund it with ETH
        const buyerWallet = hre.ethers.Wallet.createRandom().connect(hre.ethers.provider);
        await sellerWallet.sendTransaction({
          to: buyerWallet.address,
          value: hre.ethers.utils.parseEther(taskArgs.transferAmount),
        });

        console.log('New buyer address:', buyerWallet.address, "\n");
    
        // Connect to the exchange contract and perform ETH-based listing and purchase
        await listBuyWithEth(
          token721,
          token1155,
          sellerWallet,
          buyerWallet,
          tokenIdEth,
          taskArgs.price,
          exchangeContract
        );

        // Deploy a test ERC20 token contract with proxy
        const erc20Receipt = await deploy("TestERC20", {
          from: sellerWallet.address,
          proxy: {
            execute: {
              init: {
                methodName: "init",
                args: [],
              },
            },
            proxyContract: "OpenZeppelinTransparentProxy",
          },
        });

        // Setup ERC20 token for testing: mint tokens to buyer and approve exchange
        const erc20Contract = await hre.ethers.getContractAt("TestERC20", erc20Receipt.address);
        const mintToBuyerTx = await erc20Contract.mint(buyerWallet.address, BigNumber.from(taskArgs.price).mul(2));
        await mintToBuyerTx.wait();
        const transferProxyAddress = (await hre.deployments.get("ERC20TransferProxy")).address;
        await erc20Contract.connect(buyerWallet).approve(transferProxyAddress, BigNumber.from(taskArgs.price).mul(2));

        // Perform ERC20-based listing and purchase
        await listBuyWithERC20(
          token721,
          token1155,
          sellerWallet,
          buyerWallet,
          tokenIdErc20,
          taskArgs.price,
          exchangeContract,
          erc20Contract as IERC20Upgradeable
        );

        // Return any unused ETH from buyer wallet back to seller
        console.log('Returning unused funds to seller wallet...\n');
        const remainingBalance = await buyerWallet.getBalance();
        const returnFundsEstimation = await buyerWallet.estimateGas({
          to: sellerWallet.address,
          value: remainingBalance,
        });

        // Attempt to return funds with increasing gas price multiplier until successful
        const gasPrice = await hre.ethers.provider.getGasPrice();
        let gasPriceMultiplier = 1;
        let success = false;

        while (!success && gasPriceMultiplier <= 10) {  // limit to 10x to prevent infinite loop
            try {
                // Calculate return amount by subtracting estimated gas costs
                const totalReturnAmount = remainingBalance.sub(
                    returnFundsEstimation.mul(gasPrice).mul(gasPriceMultiplier)
                );
                
                console.log('--------------------------------');
                console.log(`Attempting with ${gasPriceMultiplier}x gas price multiplier`);
                console.log('Gas price:', hre.ethers.utils.formatEther(gasPrice), 'ETH');
                console.log('Return funds estimation:', returnFundsEstimation.toString(), 'gas units');
                console.log('Current buyer balance:', hre.ethers.utils.formatEther(remainingBalance), 'ETH');
                console.log('Amount to return:', hre.ethers.utils.formatEther(totalReturnAmount), 'ETH');

                // Attempt to send the remaining funds back to seller
                const returnFundsTx = await buyerWallet.sendTransaction({
                    to: sellerWallet.address,
                    value: totalReturnAmount,
                });
                await returnFundsTx.wait();
                success = true;
                console.log('Funds returned to seller wallet!\n');
            } catch (error) {
                console.log(`Failed with ${gasPriceMultiplier}x multiplier, trying higher...`);
                gasPriceMultiplier++;
            }
        }

        if (!success) {
            console.log('Failed to return funds after all attempts');
        }
    });
