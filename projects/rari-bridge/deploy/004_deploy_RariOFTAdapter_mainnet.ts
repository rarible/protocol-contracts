import { DeployFunction } from "hardhat-deploy/types";
import { HardhatRuntimeEnvironment } from "hardhat/types";
import { EndpointId } from '@layerzerolabs/lz-definitions';
import { getLedgerSigner } from "@rarible/deploy-utils";
import { RariOFTAdapter__factory, CREATE3Factory__factory } from "../typechain-types";

const deployRariOFTAdapter: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
  const { getNamedAccounts, network, ethers } = hre;
  const { deployer } = await getNamedAccounts();
  if (network.name !== "sepolia") {
    console.log("Skipping: Not sepolia");
    return;
  }
  // Use CREATE3 for deterministic deployment
  const create3FactoryAddr = "0x4A6B3E61fE44352f8ae9728e94C560F5493e1BAF";
  const create3 = CREATE3Factory__factory.connect(create3FactoryAddr, getLedgerSigner(ethers.provider, "m/44'/60'/0'/0/0"));
  const factory = await ethers.getContractFactory("RariOFTAdapter") as RariOFTAdapter__factory;
  const rariToken = "0xfca59cd816ab1ead66534d82bc21e7515ce441cf"; // RARI on Sepolia test
  const endpointAddress = "0x1a44076050125825900e736c501f859c50fE728c";
  const creationBytecode = factory.getDeployTransaction(rariToken, endpointAddress, deployer).data as string;
  const salt = ethers.utils.keccak256(ethers.utils.toUtf8Bytes("RariOFTAdapter-v1-mainnet"));
  const expectedAddr = await create3.getDeployed(deployer, salt);
  const code = await ethers.provider.getCode(expectedAddr);
  if (code === "0x") {
    const tx = await create3.deploy(salt, creationBytecode, { gasLimit: 5000000 });
    await tx.wait();
    console.log("RariOFTAdapter deployed to:", expectedAddr);
  } else {
    console.log("RariOFTAdapter already deployed at:", expectedAddr);
  }
};
deployRariOFTAdapter.tags = ["004", "RariOFTAdapterMainnet"];
export default deployRariOFTAdapter;