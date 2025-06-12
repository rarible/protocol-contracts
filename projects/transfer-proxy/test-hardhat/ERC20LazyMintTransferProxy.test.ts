import { expect } from "chai";
import { ethers } from "hardhat";
import { ERC20TransferProxy } from "../typechain-types";
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";

describe("ERC20TransferProxy Initialization", function () {
  let erc20TransferProxy: ERC20TransferProxy;
  let deployer: SignerWithAddress;
  let secondDeployer: SignerWithAddress;

  beforeEach(async () => {
    const accounts = await ethers.getSigners();
    deployer = accounts[0];
    secondDeployer = accounts[1];
  });

  it("should deploy and initialize ERC20TransferProxy correctly", async () => {
    const ERC20TransferProxy = await ethers.getContractFactory("ERC20TransferProxy");
    erc20TransferProxy = await ERC20TransferProxy.deploy();
    await erc20TransferProxy.deployed();
    await erc20TransferProxy.__ERC20TransferProxy_init();

    const secondERC20TransferProxy = await ERC20TransferProxy.connect(secondDeployer).deploy();
    await secondERC20TransferProxy.deployed();
    await secondERC20TransferProxy.connect(secondDeployer).__ERC20TransferProxy_init_proxy(deployer.address);

    expect(await erc20TransferProxy.owner()).to.equal(await secondERC20TransferProxy.owner());
  });
});
