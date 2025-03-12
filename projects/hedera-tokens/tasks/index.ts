// //The purpose of this script is to demonstrate how to create a non fungible token with fix fee using the precompiled contract
// //The token is created with a 10% royalties fee for the feeCollector account and fallback fee of 0.0001Hbar, 
// //the treasury and the supply key is the contract 
// const {ethers} = require("hardhat");


// async function main() {
//     signers = await ethers.getSigners(); 
//     [deployer, otherWallet, feeCollector] = signers;

//     const tokenCreateFactory = await ethers.getContractFactory(
//         "NonFungiblePrecompiled"
//         );
//     const tokenCreateContract = await tokenCreateFactory.deploy(
//       {gasLimit: 1_000_000}
//       );
//     const tokenCreateAddress = await tokenCreateContract.getAddress();
//     // const tokenCreateCustomContract = await ethers.getContractAt("TokenCreateContract", "0xA093479E2E72985277e7d08845da7C74DeDCd49E");
//     console.log("TokenCreateContract deployed to:", tokenCreateAddress);

//     //Create a non fungible token with precompiled contract, all keys are set to the contract and the contract is the treasury
//     const createTokenTx = await tokenCreateContract.createNonFungibleTokenWithCustomFeesPublic(
//       tokenCreateAddress, // treasury
//       feeCollector.address, // feeCollector
//       true, // isRoyalties
//       false, // isFixed
//       0,  // amount for fixedFee
//       '0x0000000000000000000000000000000000000000', //address for token of fixedFee, if set to 0x0, the fee will be in hbars
//       false, // if true the fee will be in Hbar
//       false, // if true use the current token for fixed fee
//       {
//         value: "30000000000000000000", // = 30 hbars
//         gasLimit: 1_000_000,
//       }
//     ); 
//     const txReceipt = await createTokenTx.wait();
//     const tokenAddress = txReceipt.logs.filter(
//       (e) => e.fragment.name === "CreatedToken"
//     )[0].args[0];
//     console.log("Token created at address", tokenAddress);

//     //Since the contract is defined as the supplykey, we can mint tokens
//     //Here we mint 100 new tokens to the treasury -> the contract, new totalsupply is 1100
//     const mintTokenTx = await tokenCreateContract.mintTokenPublic(
//       tokenAddress,
//       0,
//       ["0x"], 
//       {
//         gasLimit: 1_000_000,
//       }
//     );
//     const mintFungibleTokenReceipt = await mintTokenTx.wait();
//     const { serialNumbers } = mintFungibleTokenReceipt.logs.filter(
//         (e) => e.fragment.name === "MintedToken"
//       )[0].args;
//     console.log("Minted token to treasury", serialNumbers);

//     //We can transfer tokens from the treasury to another account, first the account need to associate the token
//     //We will use the IHRC719 so that an account can associate a token using a smart contract
//     const associateTokenInterface = await ethers.getContractAt("IHRC719", tokenAddress)
//     const associateTokenTx = await associateTokenInterface.associate(
//       {
//         gasLimit: 1_000_000,
//       }
//     );
//     console.log("Token associated to account tx hash", associateTokenTx.hash);

//     //We can now transfer tokens from the treasury to another account
//     const transferTokenTx = await tokenCreateContract.transferNFTsPublic(
//       tokenAddress,
//       [tokenCreateAddress],
//       [deployer.address],
//       [1],
//       {
//         gasLimit: 1_000_000,
//       }
//     );
//     console.log("Token transfer tx hash", transferTokenTx.hash);

//     //We can use the ERC20 interface also to interact with the token
//     const tokenInterface = await ethers.getContractAt("IERC721", tokenAddress);
//     const balanceOfDeployer = await tokenInterface.balanceOf(deployer.address);
//     console.log("Balance of deployer", balanceOfDeployer.toString());

//     //Here since the transfer is from the treasury, the fees are not applied
//     //If we want the fee to be applied the transfer must take place between 2 accounts that are not part of the feeCollector.
//     // let associate first the token with the otherWallet
//     const associateTokenWithOWTx = await associateTokenInterface.connect(otherWallet).associate(
//       {
//         gasLimit: 1_000_000,
//       }
//     );
//     console.log("Token associated to account tx hash", associateTokenWithOWTx.hash);

//     //Since we want to use the transferTokensPublic function, we need to approve the contract to spend the tokens
//     const approveContract = await tokenInterface.approve(tokenCreateAddress, 1, {gasLimit: 1_000_000});
//     console.log("Approval tx hash", approveContract.hash);
//     const approveContractReceipt = await approveContract.wait();
//     const event = approveContractReceipt.logs.map(
//       (e) => e.fragment.name === 'Approval' && e
//     )[0];
//     const [owner, approved, tokenId] = event.args;
//     console.log("Owner: ", owner, " approved: ", approved, " tokenId: ", tokenId);

//     //We also need to give approval to the contract to spend the Hbars for transfering the NFT
//     //We will use the IHRC632 to approve the contract to spend the Hbars on behalf of the account
//     const hbarApprovePublic = await ethers.getContractAt("IHRC632", otherWallet.address)
//     const approveContractHbar = await hbarApprovePublic.connect(otherWallet).hbarApprove(tokenCreateAddress, BigInt(100e8), {gasLimit: 2_000_000});
//     console.log("Hbar approval tx hash", approveContractHbar.hash);

//     //Balance of the deployer and contract before transfer
//     const deployerBalanceBeforeTransfer = await ethers.provider.getBalance(deployer.address);
//     console.log("Hbar Balance of deployer before the Transfer", deployerBalanceBeforeTransfer.toString());
//     const contractBalanceBeforeTransfer = await ethers.provider.getBalance(tokenCreateAddress);
//     console.log("Hbar Balance of contract before the Transfer", contractBalanceBeforeTransfer.toString());

//     let cryptoTransfers = {
//         transfers: [
//           {
//             accountID: otherWallet.address,
//             amount: -20e8,
//             isApproval: false,
//           },
//           {
//             accountID: deployer.address,
//             amount: 20e8,
//             isApproval: false,
//           },
//         ],
//       };
//       let tokenTransferList = [
//         {
//           token: tokenAddress,
//           transfers: [],
//           nftTransfers: [
//             {
//               senderAccountID: deployer.address,
//               receiverAccountID: otherWallet.address,
//               serialNumber: 1,
//               isApproval: false,
//             },
//           ],
//         },
//       ];

//     const transferTokenToOWTx = await tokenCreateContract.cryptoTransferPublic(
//       cryptoTransfers,
//       tokenTransferList,
//         {
//           gasLimit: 1_000_000,
//         }
//       );
//     console.log("Token transfer tx hash", transferTokenToOWTx.hash);


//     await delay(5000);
//     //Balance of the deployer and contract after transfer
//     const deployerBalanceAfterTransfer = await ethers.provider.getBalance(deployer.address);
//     console.log("Hbar Balance of deployer after the Transfer", deployerBalanceAfterTransfer.toString());
//     const contractBalanceAfterTransfer = await ethers.provider.getBalance(tokenCreateAddress);
//     console.log("Hbar Balance of contract after the Transfer", contractBalanceAfterTransfer.toString());
//     //Balance should be 10% of the amount transferred
//     const otherWalletTokenBalanceAfterTransfer = await tokenInterface.balanceOf(otherWallet.address);
//     console.log("NFT balance of otherWallet after the Transfer", otherWalletTokenBalanceAfterTransfer.toString());

// }

// function delay(ms) {
//   return new Promise(resolve => setTimeout(resolve, ms));
// }

// main();