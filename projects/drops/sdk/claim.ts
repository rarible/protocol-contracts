import { Signer, BigNumber, BytesLike } from "ethers";
import { Drop__factory } from "../typechain-types";

export type AllowlistProof = {
  proof: BytesLike[];
  quantityLimitPerWallet: number | BigNumber;
  pricePerToken: number | BigNumber;
  currency: string;
};

/**
 * Claims tokens from a drop contract.
 *
 * @param contractAddress The deployed Drop contract address.
 * @param receiver The address that will receive the claimed tokens.
 * @param quantity Number of tokens to claim.
 * @param currency The currency address (0xEeee... for native).
 * @param pricePerToken Price per token to pay.
 * @param allowlistProof The allowlist proof struct.
 * @param data Extra encoded data (optional).
 * @param signer Signer to execute the transaction.
 */
export async function claim(
  contractAddress: string,
  receiver: string,
  quantity: number | BigNumber,
  currency: string,
  pricePerToken: number | BigNumber,
  allowlistProof: AllowlistProof,
  data: BytesLike,
  signer: Signer
) {
  const contract = Drop__factory.connect(contractAddress, signer);

  const tx = await contract.claim(
    receiver,
    BigNumber.from(quantity),
    currency,
    BigNumber.from(pricePerToken),
    allowlistProof,
    data
  );

  console.log(`Claiming tokens... tx hash: ${tx.hash}`);
  const receipt = await tx.wait();
  console.log("✅ Claim successful.");
  return receipt;
}
