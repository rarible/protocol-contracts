import { Signer, BytesLike, BigNumber, providers, ContractReceipt } from "ethers";
import { getCloneFactory } from "./clone-factory";
import { TWCloneFactory } from "../typechain-types";

// If you have a factory for OpenEditionERC721FlatFee, import it here:
import { OpenEditionERC721FlatFee__factory } from "../typechain-types/factories/OpenEditionERC721FlatFee__factory";

/*
<ai_context>
This file is the deploy-contracts utility. We add a method to:
- create the init data
- call the clone factory
- return the deployed address
</ai_context>
*/

export async function deployContract(
  signer: Signer,
  cloneFactoryAddress: string,
  contractImplementation: string,
  // Arguments to initialize the OpenEditionERC721FlatFee contract:
  defaultAdmin: string,
  name: string,
  symbol: string,
  contractURI: string,
  trustedForwarders: string[],
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
  const initData = OpenEditionERC721FlatFee__factory.createInterface().encodeFunctionData(
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
  const cloneFactory: TWCloneFactory = getCloneFactory(signer, cloneFactoryAddress);

  // 3. Deploy the proxy by calling the factory's deployProxyByImplementationV2 function.
  //    This returns a transaction object typed by TypeChain.
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