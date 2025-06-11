import { expect } from "chai";
import { ethers } from "hardhat";
import { RoyaltiesRegistry } from "../typechain-types";
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";

describe("TransferProxy Initialization", function () {
  let royaltiesRegistry: RoyaltiesRegistry;
  let deployer: SignerWithAddress;
  let secondDeployer: SignerWithAddress;

  beforeEach(async () => {
    const accounts = await ethers.getSigners();
    deployer = accounts[0];
    secondDeployer = accounts[1];
  });

  it("should deploy and initialize RoyaltiesRegistry correctly", async () => {
    const RoyaltiesRegistry = await ethers.getContractFactory("RoyaltiesRegistry");
    royaltiesRegistry = await RoyaltiesRegistry.deploy();
    await royaltiesRegistry.deployed();
    await royaltiesRegistry.__RoyaltiesRegistry_init();

    const secondRoyaltiesRegistry = await RoyaltiesRegistry.connect(secondDeployer).deploy();
    await secondRoyaltiesRegistry.deployed();
    await secondRoyaltiesRegistry.connect(secondDeployer).__RoyaltiesRegistry_init_proxy(deployer.address);

    expect(await royaltiesRegistry.owner()).to.equal(await secondRoyaltiesRegistry.owner());
  });
});
