import { expect } from "chai";
import { ethers } from "hardhat";
import { TransferProxy } from "../typechain-types";
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";

describe("TransferProxy Initialization", function () {
  let transferProxy: TransferProxy;
  let deployer: SignerWithAddress;
  let secondDeployer: SignerWithAddress;

  beforeEach(async () => {
    const accounts = await ethers.getSigners();
    deployer = accounts[0];
    secondDeployer = accounts[1];
  });

  it("should deploy and initialize TransferProxy correctly", async () => {
    const TransferProxy = await ethers.getContractFactory("TransferProxy");
    transferProxy = await TransferProxy.deploy();
    await transferProxy.deployed();
    await transferProxy.__TransferProxy_init();

    const secondTransferProxy = await TransferProxy.connect(secondDeployer).deploy();
    await secondTransferProxy.deployed();
    await secondTransferProxy.connect(secondDeployer).__TransferProxy_init_proxy(deployer.address);

    expect(await transferProxy.owner()).to.equal(await secondTransferProxy.owner());
  });
});
