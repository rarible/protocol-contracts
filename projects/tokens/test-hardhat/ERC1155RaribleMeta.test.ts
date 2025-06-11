import { expect } from "chai";
import { ethers } from "hardhat";
import { ERC1155LazyMintTransferProxyTest, ERC1155RaribleMeta } from "../typechain-types";
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";

describe.only("ERC1155RaribleMeta Initialization", function () {
  let token: ERC1155RaribleMeta;
  let secondToken: ERC1155RaribleMeta;
  let erc1155LazyMintTransferProxy: ERC1155LazyMintTransferProxyTest;
  let deployer: SignerWithAddress;
  let secondDeployer: SignerWithAddress;
  let whiteListProxy: SignerWithAddress;

  const name = 'FreeMintable';

  beforeEach(async () => {
    const accounts = await ethers.getSigners();
    deployer = accounts[0];
    secondDeployer = accounts[1];
    whiteListProxy = accounts[2];

    // Deploy ERC1155LazyMintTransferProxy  
    const ERC1155LazyMintTransferProxy = await ethers.getContractFactory("ERC1155LazyMintTransferProxyTest");
    erc1155LazyMintTransferProxy = await ERC1155LazyMintTransferProxy.deploy();
    await erc1155LazyMintTransferProxy.deployed();
  });

  it("should deploy and initialize ERC1155RaribleMeta correctly", async () => {
    const ERC1155Rarible = await ethers.getContractFactory("ERC1155RaribleMeta");
    token = await ERC1155Rarible.deploy();
    await token.__ERC1155Rarible_init(name, "TST", "ipfs:/", "ipfs:/", whiteListProxy.address, erc1155LazyMintTransferProxy.address);

    secondToken = await ERC1155Rarible.connect(secondDeployer).deploy();
    await secondToken.connect(secondDeployer).__ERC1155Rarible_init_proxy(name, "TST", "ipfs:/", "ipfs:/", whiteListProxy.address, erc1155LazyMintTransferProxy.address, deployer.address);

    expect(await token.owner()).to.equal(await secondToken.owner());
  });
});
