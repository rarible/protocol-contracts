/*
<ai_context>
SDK utility to set protocol fee for ExchangeV2. 
Usage: Import and call setProtocolFee(exchangeAddress, newFeeBps, recipientAddress, signer).
</ai_context>
*/
import { Contract } from "ethers";
import { ExchangeV2__factory } from "@rarible/exchange-v2/typechain-types";

/**
 * Sets the protocol fee and optionally recipient on ExchangeV2 contract.
 * @param exchangeAddress ExchangeV2 contract address
 * @param newFeeBps Fee in basis points (e.g. 300 for 3%)
 * @param recipient Recipient address (if not provided, the ExchangeV2 contract's current feeRecipient is used)
 * @param signerOrProvider Ethers.js Signer (or provider for readonly, but must be signer to set)
 */
export async function setProtocolFee(
  exchangeAddress: string,
  sellerFeeBps: number,
  buyerFeeBps: number,
  recipient: string,
  signerOrProvider: any
) {
  // Attach to ExchangeV2
  const contract = ExchangeV2__factory.connect(exchangeAddress, signerOrProvider);
  const owner = await contract.owner();
  if (owner !== signerOrProvider.address) {
    console.log(`Owner: ${owner}`);
    console.log(`Signer: ${signerOrProvider.address}`);
    throw new Error("Only the owner can set the protocol fee");
  }
  let tx = await contract.setAllProtocolFeeData(recipient, buyerFeeBps, sellerFeeBps);
  const receipt = await tx.wait();
  return receipt;
}