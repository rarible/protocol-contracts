import { DeployFunction } from "hardhat-deploy/types";
import { HardhatRuntimeEnvironment } from "hardhat/types";
import { EndpointId } from "@layerzerolabs/lz-definitions";
import { RariOFT__factory } from "../typechain-types";
import { CREATE3Factory__factory, CREATE3Factory } from "../typechain-types";
import { getLedgerSigner } from "@rarible/deploy-utils";

const deployRariOFT: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
  const { getNamedAccounts, network, ethers } = hre;
  const { deployer } = await getNamedAccounts();
  if (network.name !== "base_sepolia") {
    console.log("Skipping: Not base_sepolia");
    return;
  }
  // Use CREATE3 for deterministic deployment
  const create3FactoryAddr = "0x4A6B3E61fE44352f8ae9728e94C560F5493e1BAF";
  const create3 = CREATE3Factory__factory.connect(create3FactoryAddr, getLedgerSigner(ethers.provider, "m/44'/60'/0'/0/0"));
  const factory = await ethers.getContractFactory("RariOFT") as RariOFT__factory;
  const endpointAddress = "0x6EDCE65403992e310A62460808c4b910D972f10f";
  const creationBytecode = factory.getDeployTransaction(endpointAddress, deployer).data as string;
  const salt = ethers.utils.keccak256(ethers.utils.toUtf8Bytes("RariOFT-v1"));
  const expectedAddr = await create3.getDeployed(deployer, salt);
  const code = await ethers.provider.getCode(expectedAddr);
  if (code === "0x") {
    const tx = await create3.deploy(salt, creationBytecode, { gasLimit: 5000000 });
    await tx.wait();
    console.log("RariOFT deployed to:", expectedAddr);
  } else {
    console.log("RariOFT already deployed at:", expectedAddr);
  }

  // Verify the contract on Basescan (assuming @nomicfoundation/hardhat-verify is installed and configured)
  try {
    await hre.run("verify:verify", {
      address: expectedAddr,
      constructorArguments: [endpointAddress, deployer],
      contract: "src/RariOFT.sol:RariOFT" // Adjust the path if your contract file is in a different location
    });
    console.log("RariOFT verified on Basescan");
  } catch (error: any) {
    if (error.message.includes("already verified")) {
      console.log("RariOFT already verified");
    } else {
      console.error("Verification failed:", error);
    }
  }
};
deployRariOFT.tags = ["001", "RariOFTBaseSepolia"];
export default deployRariOFT;