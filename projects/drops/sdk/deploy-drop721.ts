import { Signer, BytesLike } from "ethers";
import { RaribleCloneFactory } from "../typechain-types";
import { DropERC721__factory } from "@rarible/external-contracts/js/factories/DropERC721__factory";
import { getCloneFactory } from "./clone-factory";

export async function deployDrop721(
  signer: Signer,
  cloneFactoryAddress: string,
  contractImplementation: string,
  // Arguments to initialize the DropERC721 contract:
  defaultAdmin: string,
  name: string,
  symbol: string,
  contractURI: string,
  trustedForwarders: string[] = [],
  saleRecipient: string,
  royaltyRecipient: string,
  royaltyBps: number,
  platformFeeBps: number,
  platformFeeRecipient: string,
  // Additional optional arguments
  salt: BytesLike,
  extraData: BytesLike = "0x"
): Promise<string> {
  // 1. Encode the initializer data for the logic contract
  const initData = DropERC721__factory.createInterface().encodeFunctionData(
    "initialize",
    [
      defaultAdmin,
      name,
      symbol,
      contractURI,
      trustedForwarders,
      saleRecipient,
      royaltyRecipient,
      royaltyBps,
      platformFeeBps,
      platformFeeRecipient,
    ],
  );

  // 2. Get the clone factory contract
  const cloneFactory: RaribleCloneFactory = getCloneFactory(signer, cloneFactoryAddress);

  // 3. Deploy the proxy by calling the factory's deployProxyByImplementationV2 function.
  const tx = await cloneFactory.deployProxyByImplementationV2(
    contractImplementation,
    initData,
    salt,
    extraData
  );

  // 4. Wait for the transaction to be mined
  const receipt = await tx.wait();

  // 5. Attempt to read the ProxyDeployedV2 event from logs to get the deployed address
  const event = receipt.events?.find((e) => e.event === "ProxyDeployedV2");
  if (!event || !event.args) {
    throw new Error("ProxyDeployedV2 event not found in transaction logs.");
  }

  const proxyAddress: string = event.args.proxy;
  return proxyAddress;
}