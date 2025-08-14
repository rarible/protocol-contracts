import { DeployFunction } from "hardhat-deploy/types";
import { HardhatRuntimeEnvironment } from "hardhat/types";
import { EndpointId } from "@layerzerolabs/lz-definitions";
import { RariOFT__factory } from "../typechain-types";
const deployRariOFT: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
  const { getNamedAccounts, network, ethers } = hre;
  const { deployer } = await getNamedAccounts();
  if (network.name !== "base_sepolia") {
    console.log("Skipping: Not base_sepolia");
    return;
  }
  const lzEndpoint = EndpointId.BASESEP_V2_TESTNET; // V2 testnet endpoint
  // Use CREATE3 for deterministic deployment
  const create3FactoryAddr = "0x4A6B3E61fE44352f8ae9728e94C560F5493e1BAF";
  const create3ABI = [
    "function deploy(bytes32 salt, bytes memory creationBytecode) external returns (address)",
    "function getDeployed(bytes32 salt) external view returns (address)"
  ];
  const create3 = await ethers.getContractAt(create3ABI, create3FactoryAddr);
  const factory = await ethers.getContractFactory("RariOFT") as RariOFT__factory;
  const creationBytecode = factory.getDeployTransaction(lzEndpoint.toString(), deployer).data as string;
  const salt = ethers.utils.keccak256(ethers.utils.toUtf8Bytes("RariOFT-v1"));
  const expectedAddr = await create3.getDeployed(salt);
  const code = await ethers.provider.getCode(expectedAddr);
  if (code === "0x") {
    const tx = await create3.deploy(salt, creationBytecode, { gasLimit: 5000000 });
    await tx.wait();
    console.log("RariOFT deployed to:", expectedAddr);
  } else {
    console.log("RariOFT already deployed at:", expectedAddr);
  }
};
deployRariOFT.tags = ["001", "RariOFTBaseSepolia"];
export default deployRariOFT;