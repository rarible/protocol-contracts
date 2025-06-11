import { expect } from "chai";
import { ethers } from "hardhat";
import { ERC721LazyMintTransferProxy } from "../typechain-types";
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";

describe("ERC721LazyMintTransferProxy Initialization", function () {
  let erc721LazyMintTransferProxy: ERC721LazyMintTransferProxy;
  let deployer: SignerWithAddress;
  let secondDeployer: SignerWithAddress;

  beforeEach(async () => {
    const accounts = await ethers.getSigners();
    deployer = accounts[0];
    secondDeployer = accounts[1];
  });

  it("should deploy and initialize ERC721LazyMintTransferProxy correctly", async () => {
    const ERC721LazyMintTransferProxy = await ethers.getContractFactory("ERC721LazyMintTransferProxy");
    erc721LazyMintTransferProxy = await ERC721LazyMintTransferProxy.connect(secondDeployer).deploy();
    await erc721LazyMintTransferProxy.deployed();
    await erc721LazyMintTransferProxy.connect(secondDeployer).__ERC721LazyMintTransferProxy_init_proxy(deployer.address);

    expect(await erc721LazyMintTransferProxy.owner()).to.equal(deployer.address);
  });
});
