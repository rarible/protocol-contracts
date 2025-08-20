import { task } from "hardhat/config";
import "@nomiclabs/hardhat-ethers";
import { ExchangeV2__factory, ExchangeV2 } from "@rarible/exchange-v2/typechain-types";
import { LedgerSigner } from "@anders-t/ethers-ledger";
import { BigNumber } from "ethers";


// npx hardhat create-protocol-fee-proposal --buyer-fee-bps 0 --seller-fee-bps 200 --recipient 0x053F171c0D0Cc9d76247D4d1CdDb280bf1131390 --network mainnet
task("create-protocol-fee-proposal", "Creates a governance proposal to set the protocol fee on Rarible ExchangeV2")
  .addParam("buyerFeeBps", "Buyer fee in basis points (e.g. 25 for 0.25%)")
  .addParam("sellerFeeBps", "Seller fee in basis points (e.g. 25 for 0.25%)")
  .addParam("recipient", "Fee recipient address")
  .addOptionalParam("exchangeV2", "ExchangeV2 contract address", "0x9757F2d2b135150BBeb65308D4a91804107cd8D6")
  .addOptionalParam("governor", "DAO Governor contract address", "0x6552C8fb228f7776Fc0e4056AA217c139D4baDa1")
  .setAction(async (args, hre) => {
    const { buyerFeeBps, sellerFeeBps, recipient, exchangeV2, governor } = args;

    const buyerFeeBpsInt = parseInt(buyerFeeBps, 10);
    const sellerFeeBpsInt = parseInt(sellerFeeBps, 10);

    console.log(`Creating proposal to set protocol fee for Rarible ExchangeV2 at ${exchangeV2}`);
    console.log(`New buyer fee: ${buyerFeeBps} bps (${(buyerFeeBpsInt / 10000).toFixed(2)}%)`);
    console.log(`New seller fee: ${sellerFeeBps} bps (${(sellerFeeBpsInt / 10000).toFixed(2)}%)`);
    console.log(`New fee recipient: ${recipient}`);

    try {
      const provider = hre.ethers.provider;
      const signer = new LedgerSigner(provider, "m/44'/60'/0'/0/0");

      const governorABI = [
        "function propose(address[] memory targets, uint256[] memory values, bytes[] memory calldatas, string memory description) public returns (uint256)"
      ];

      const governorContract = new hre.ethers.Contract(governor, governorABI, signer);


      // setAllProtocolFeeData(address recipient, uint48 buyerFee, uint48 sellerFee)
      const calldata = ExchangeV2__factory.createInterface().encodeFunctionData("setAllProtocolFeeData", [
        recipient,
        BigNumber.from(buyerFeeBpsInt),
        BigNumber.from(sellerFeeBpsInt)
      ]);
      // -------------------------------------------------------------

      const targets = [exchangeV2];
      const values = [BigNumber.from("0")];
      const calldatas = [calldata];
      const description = `Proposal to set Rarible ExchangeV2 protocol fee to seller ${sellerFeeBps} bps and buyer ${buyerFeeBps} bps with recipient ${recipient}`;

      const tx = await governorContract.connect(signer).propose(targets, values, calldatas, description);
      const receipt = await tx.wait();

      console.log(`✅ Proposal created. Tx hash: ${receipt.transactionHash}`);
    } catch (err: any) {
      console.error(`❌ Error creating proposal: ${err.message || err}`);
    }
  });

export default {};
