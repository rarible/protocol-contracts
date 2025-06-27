import { expect } from "chai";
import { ethers } from "hardhat";
import { ERC1155LazyMintTransferProxyTest, ERC1155Rarible } from "../typechain-types";
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import { getValueFromMapping } from "./utils/getValueFromMapping";

describe("ERC1155Rarible Initialization", function () {
  let token: ERC1155Rarible;
  let secondToken: ERC1155Rarible;
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

  it("should deploy and initialize ERC1155Rarible correctly", async () => {
    const ERC1155Rarible = await ethers.getContractFactory("ERC1155Rarible");
    token = await ERC1155Rarible.deploy();
    await token.__ERC1155Rarible_init(name, "TST", "ipfs:/", "ipfs:/", whiteListProxy.address, erc1155LazyMintTransferProxy.address);

    secondToken = await ERC1155Rarible.connect(secondDeployer).deploy();
    await secondToken.connect(secondDeployer).__ERC1155Rarible_init_proxy(name, "TST", "ipfs:/", "ipfs:/", whiteListProxy.address, erc1155LazyMintTransferProxy.address, deployer.address);

    expect(await token.owner()).to.equal(await secondToken.owner());
    expect(await secondToken.name()).to.equal(name);
    expect(await secondToken.symbol()).to.equal("TST");
    expect(await secondToken.baseURI()).to.equal("ipfs:/");
    expect(await secondToken.contractURI()).to.equal("ipfs:/");
    // 0: 0x0000000000000000000000000000000000000000000000000000000000000001 => initialized
    expect(await ethers.provider.getStorageAt(secondToken.address, 0)).to.equal("0x0000000000000000000000000000000000000000000000000000000000000001");
    // 354: 0x08167dbffed14bc23a2b328ced59a6370a82faa4bd594543394fcfed96746173 => _HASHED_NAME
    expect(await ethers.provider.getStorageAt(secondToken.address, 354)).to.equal("0x08167dbffed14bc23a2b328ced59a6370a82faa4bd594543394fcfed96746173");
    // 355: 0xc89efdaa54c0f20c7adf612882df0950f5a951637e0307cdcb4c672f298b8bc6 => _HASHED_VERSION
    expect(await ethers.provider.getStorageAt(secondToken.address, 355)).to.equal("0xc89efdaa54c0f20c7adf612882df0950f5a951637e0307cdcb4c672f298b8bc6");
    // 201: defaultApprovals mapping(address,bool)
    expect(await getValueFromMapping(secondToken, whiteListProxy.address, "address", 201)).to.equal("0x0000000000000000000000000000000000000000000000000000000000000001");
    expect(await getValueFromMapping(secondToken, erc1155LazyMintTransferProxy.address, "address", 201)).to.equal("0x0000000000000000000000000000000000000000000000000000000000000001");
  });
});
