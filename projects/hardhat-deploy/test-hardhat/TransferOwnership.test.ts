import { expect } from "chai";
import { deployments, ethers } from "hardhat";
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import { getContractsWithProxy, transferOwnership } from "../sdk/transfer-ownership";

describe("Ownership checks", function () {
  let expectedOwner: string;
  let deployer: SignerWithAddress;
  let newOwner: SignerWithAddress;

  before(async () => {
    const [deployer, transferOwner] = await ethers.getSigners();
    expectedOwner = deployer.address;
    newOwner = transferOwner.address;

    // Run all deployment scripts tagged with "all"
    await deployments.fixture(["all"]);
  });

  it("should verify ownership of all deployed contracts", async () => {
    const allDeployments = await deployments.all();

    for (const [contractName, deployment] of Object.entries(allDeployments)) {
        if (contractName.endsWith("_Proxy") || contractName.endsWith("_Implementation") || contractName == "AssetMatcherCollection") {
            continue;
        }

        const contract = await hre.ethers.getContractAt(
            deployment.abi,
            deployment.address,
            deployer
        );

        const currentOwner = await contract.owner();
        expect(currentOwner).to.equal(expectedOwner);
    }

    const contractsWithProxy = await getContractsWithProxy(deployments);
    const transferredContracts = await transferOwnership(hre, deployments, contractsWithProxy, deployer, newOwner);

    for (const contractName of transferredContracts) {
        const contract = await hre.ethers.getContractAt(
            allDeployments[contractName].abi,
            allDeployments[contractName].address,
            deployer
        );
        expect(await contract.owner()).to.equal(newOwner);
    }

    for (const contractName of contractsWithProxy) {
        const contract = await hre.ethers.getContractAt(
            allDeployments[contractName].abi,
            allDeployments[contractName].address,
            deployer
        );
        expect(await contract.owner()).to.equal(expectedOwner);
    }
  });
});
