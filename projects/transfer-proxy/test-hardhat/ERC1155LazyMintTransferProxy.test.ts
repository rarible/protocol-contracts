import { expect } from "chai";
import { ethers } from "hardhat";
import { ERC1155LazyMintTransferProxy } from "../typechain-types";
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";

describe("ERC1155LazyMintTransferProxy Initialization", function () {
  let erc1155LazyMintTransferProxy: ERC1155LazyMintTransferProxy;
  let deployer: SignerWithAddress;
  let secondDeployer: SignerWithAddress;

  beforeEach(async () => {
    const accounts = await ethers.getSigners();
    deployer = accounts[0];
    secondDeployer = accounts[1];
  });

  it("should deploy and initialize ERC1155LazyMintTransferProxy correctly", async () => {
    const ERC1155LazyMintTransferProxy = await ethers.getContractFactory("ERC1155LazyMintTransferProxy");
    erc1155LazyMintTransferProxy = await ERC1155LazyMintTransferProxy.connect(secondDeployer).deploy();
    await erc1155LazyMintTransferProxy.deployed();
    await erc1155LazyMintTransferProxy.connect(secondDeployer).__ERC1155LazyMintTransferProxy_init_proxy(deployer.address);

    expect(await erc1155LazyMintTransferProxy.owner()).to.equal(deployer.address);
  });
});
