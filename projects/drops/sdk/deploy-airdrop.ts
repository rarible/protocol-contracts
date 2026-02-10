import { Signer, BytesLike } from "ethers";
import { RaribleCloneFactory } from "../typechain-types";
import { Airdrop__factory } from "@rarible/external-contracts/js/factories/Airdrop__factory";
import { getCloneFactory } from "./clone-factory";

/*
<ai_context>
This file is the deploy-contracts utility for Airdrop. We add a method to:
- create the init data
- call the clone factory
- return the deployed address
</ai_context>
*/

export async function deployAirdrop(
  signer: Signer,
  cloneFactoryAddress: string,
  contractImplementation: string,
  // Arguments to initialize the Airdrop contract:
  defaultAdmin: string,
  contractURI: string,
  // Additional optional arguments
  salt: BytesLike,
  extraData: BytesLike = "0x"
): Promise<string> {
  // 1. Encode the initializer data for the logic contract
  const initData = Airdrop__factory.createInterface().encodeFunctionData(
    "initialize",
    [
      defaultAdmin,
      contractURI,
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
