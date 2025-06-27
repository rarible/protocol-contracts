import { expect } from "chai";
import { ethers } from "hardhat";
import { OperatorRole } from "../typechain-types";
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";

describe("OperatorRole Initialization", function () {
  let operatorRole: OperatorRole;
  let deployer: SignerWithAddress;
  let secondDeployer: SignerWithAddress;

  beforeEach(async () => {
    const accounts = await ethers.getSigners();
    deployer = accounts[0];
    secondDeployer = accounts[1];
  });

  it("should deploy and initialize OperatorRole correctly", async () => {
    const OperatorRole = await ethers.getContractFactory("OperatorRole");
    operatorRole = await OperatorRole.deploy();
    await operatorRole.deployed();
    await operatorRole.__OperatorRole_init();

    const secondOperatorRole = await OperatorRole.connect(secondDeployer).deploy();
    await secondOperatorRole.deployed();
    await secondOperatorRole.connect(secondDeployer).__OperatorRole_init_proxy(deployer.address);

    expect(await operatorRole.owner()).to.equal(await secondOperatorRole.owner());
  });
});
