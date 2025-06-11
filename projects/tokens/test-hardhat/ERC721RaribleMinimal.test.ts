import { expect } from "chai";
import { ethers } from "hardhat";
import { ERC721LazyMintTransferProxyTest, ERC721RaribleMinimal } from "../typechain-types";
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";

describe("ERC721RaribleMinimal Initialization", function () {
  let token: ERC721RaribleMinimal;
  let secondToken: ERC721RaribleMinimal;
  let erc721LazyMintTransferProxy: ERC721LazyMintTransferProxyTest;
  let deployer: SignerWithAddress;
  let secondDeployer: SignerWithAddress;
  let whiteListProxy: SignerWithAddress;

  const name = 'FreeMintable';

  beforeEach(async () => {
    const accounts = await ethers.getSigners();
    deployer = accounts[0];
    secondDeployer = accounts[1];
    whiteListProxy = accounts[2];

    // Deploy ERC721LazyMintTransferProxy  
    const ERC721LazyMintTransferProxy = await ethers.getContractFactory("ERC721LazyMintTransferProxyTest");
    erc721LazyMintTransferProxy = await ERC721LazyMintTransferProxy.deploy();
    await erc721LazyMintTransferProxy.deployed();
  });

  it("should deploy and initialize ERC721RaribleMinimal correctly", async () => {
    const ERC721Rarible = await ethers.getContractFactory("ERC721RaribleMinimal");
    token = await ERC721Rarible.deploy();
    await token.__ERC721Rarible_init(name, "TST", "ipfs:/", "ipfs:/", whiteListProxy.address, erc721LazyMintTransferProxy.address);

    secondToken = await ERC721Rarible.connect(secondDeployer).deploy();
    await secondToken.connect(secondDeployer).__ERC721Rarible_init_proxy(name, "TST", "ipfs:/", "ipfs:/", whiteListProxy.address, erc721LazyMintTransferProxy.address, deployer.address);

    expect(await token.owner()).to.equal(await secondToken.owner());
  });
});
