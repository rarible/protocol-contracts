import { Signer, BytesLike, ethers } from "ethers";
import { getCloneFactory } from "./clone-factory";
import { RaribleCloneFactory } from "../typechain-types";

/*
<ai_context>
This file is the deploy utility for OpenEditionERC721C (Creator Token version).
OpenEditionERC721C has a simpler initialize signature without platform fee params.
</ai_context>
*/

// OpenEditionERC721C initialize ABI (8 params, no platform fee)
const OPEN_EDITION_ERC721C_INIT_ABI = [
  "function initialize(address _defaultAdmin, string memory _name, string memory _symbol, string memory _contractURI, address[] memory _trustedForwarders, address _saleRecipient, address _royaltyRecipient, uint128 _royaltyBps)"
];

export async function deployOEC(
  signer: Signer,
  cloneFactoryAddress: string,
  contractImplementation: string,
  // Arguments to initialize the OpenEditionERC721C contract:
  defaultAdmin: string,
  name: string,
  symbol: string,
  contractURI: string,
  trustedForwarders: string[] = [],
  saleRecipient: string,
  royaltyRecipient: string,
  royaltyBps: number,
  // Additional optional arguments
  salt: BytesLike,
  extraData: BytesLike = "0x"
): Promise<string> {
  // 1. Encode the initializer data for the logic contract
  const iface = new ethers.utils.Interface(OPEN_EDITION_ERC721C_INIT_ABI);
  const initData = iface.encodeFunctionData("initialize", [
    defaultAdmin,
    name,
    symbol,
    contractURI,
    trustedForwarders,
    saleRecipient,
    royaltyRecipient,
    royaltyBps,
  ]);

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
