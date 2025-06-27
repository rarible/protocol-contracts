import { expect } from "chai";
import { ethers } from "hardhat";
import { ERC721LazyMintTransferProxyTest, ERC721RaribleMinimal } from "../typechain-types";
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import { getValueFromMapping } from "./utils/getValueFromMapping";

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
    expect(await secondToken.name()).to.equal(name);
    expect(await secondToken.symbol()).to.equal("TST");
    expect(await secondToken.baseURI()).to.equal("ipfs:/");
    expect(await secondToken.contractURI()).to.equal("ipfs:/");
    // 0: 0x0000000000000000000000000000000000000000000000000000000000000001 => initialized
    expect(await ethers.provider.getStorageAt(secondToken.address, 0)).to.equal("0x0000000000000000000000000000000000000000000000000000000000000001");
    // 151: 0x1bb8ef16ee1a1c8ef99a67bf7ac490914e4236ccf6d65032b714e8174abe564b => _HASHED_NAME
    expect(await ethers.provider.getStorageAt(secondToken.address, 151)).to.equal("0x1bb8ef16ee1a1c8ef99a67bf7ac490914e4236ccf6d65032b714e8174abe564b");
    // 152: 0xc89efdaa54c0f20c7adf612882df0950f5a951637e0307cdcb4c672f298b8bc6 => _HASHED_VERSION
    expect(await ethers.provider.getStorageAt(secondToken.address, 152)).to.equal("0xc89efdaa54c0f20c7adf612882df0950f5a951637e0307cdcb4c672f298b8bc6");
    // 303: defaultApprovals mapping(address,bool)
    expect(await getValueFromMapping(secondToken, whiteListProxy.address, "address", 303)).to.equal("0x0000000000000000000000000000000000000000000000000000000000000001");
    expect(await getValueFromMapping(secondToken, erc721LazyMintTransferProxy.address, "address", 303)).to.equal("0x0000000000000000000000000000000000000000000000000000000000000001");
  });
});
