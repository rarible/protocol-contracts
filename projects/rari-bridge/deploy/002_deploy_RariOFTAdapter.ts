import { DeployFunction } from "hardhat-deploy/types";
import { HardhatRuntimeEnvironment } from "hardhat/types";
import { EndpointId } from '@layerzerolabs/lz-definitions'
const deployRariOFTAdapter: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
  const { getNamedAccounts, network, ethers } = hre;
  const { deployer } = await getNamedAccounts();
  if (network.name !== "sepolia") {
    console.log("Skipping: Not sepolia");
    return;
  }
  const lzEndpoint = EndpointId.SEPOLIA_V2_TESTNET; // V2 testnet endpoint
  const rariToken = "0xfAc63865D9cA6f1E70e9C441d4B01255519F7A54"; // RARI on Sepolia test
  // Use CREATE2 for deterministic deployment
  const create2FactoryAddr = "0x4e59b44847b0135789386f149d2285d9DcddD6Ae";
  const create2ABI = [
    "function deploy(uint256 value, bytes32 salt, bytes memory code) external"
  ];
  const create2 = await ethers.getContractAt(create2ABI, create2FactoryAddr);
  const factory = await ethers.getContractFactory("RariOFTAdapter");
  const creationBytecode = (await factory.getDeployTransaction(rariToken, lzEndpoint.toString(), deployer)).data as string;
  const salt = ethers.utils.keccak256(ethers.utils.toUtf8Bytes("RariOFTAdapter-v1"));
  const codeHash = ethers.utils.keccak256(creationBytecode);
  const expectedAddr = ethers.utils.getCreate2Address(create2FactoryAddr, salt, codeHash);
  const code = await ethers.provider.getCode(expectedAddr);
  if (code === "0x") {
    const tx = await create2.deploy(0, salt, creationBytecode, { gasLimit: 5000000 });
    await tx.wait();
    console.log("RariOFTAdapter deployed to:", expectedAddr);
  } else {
    console.log("RariOFTAdapter already deployed at:", expectedAddr);
  }
};
deployRariOFTAdapter.tags = ["RariOFTAdapterSepolia"];
export default deployRariOFTAdapter;