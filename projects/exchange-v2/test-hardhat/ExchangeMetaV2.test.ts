import { expect } from "chai";
import { ethers } from "hardhat";
import { ERC20TransferProxyTest, TestRoyaltiesRegistry, TransferProxyTest, ERC721LazyMintTransferProxyTest, ERC1155LazyMintTransferProxyTest, ExchangeMetaV2 } from "../typechain-types";
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";

const ERC721_LAZY = "0xd8f960c1"
const ERC1155_LAZY = "0x1cdfaa40"
const COLLECTION_ID = "0xf63c2825"

describe("ExchangeMetaV2 Initialization", function () {
  let exchangeV2: ExchangeMetaV2;
  let transferProxy: TransferProxyTest;
  let erc20TransferProxy: ERC20TransferProxyTest;
  let royaltiesRegistry: TestRoyaltiesRegistry;
  let erc721LazyMintTransferProxy: ERC721LazyMintTransferProxyTest;
  let erc1155LazyMintTransferProxy: ERC1155LazyMintTransferProxyTest;
  let deployer: SignerWithAddress;
  let secondDeployer: SignerWithAddress;
  let symbolicAssetMatcher: SignerWithAddress;
  const protocol = ethers.Wallet.createRandom().address;

  beforeEach(async () => {
    const accounts = await ethers.getSigners();
    deployer = accounts[0];
    secondDeployer = accounts[1];
    symbolicAssetMatcher = accounts[2];

    // Deploy TransferProxy
    const TransferProxy = await ethers.getContractFactory("TransferProxyTest");
    transferProxy = await TransferProxy.deploy();
    await transferProxy.deployed();

    // Deploy ERC20TransferProxy
    const ERC20TransferProxy = await ethers.getContractFactory("ERC20TransferProxyTest");
    erc20TransferProxy = await ERC20TransferProxy.deploy();
    await erc20TransferProxy.deployed();

    // Deploy RoyaltiesRegistry 
    const RoyaltiesRegistry = await ethers.getContractFactory("TestRoyaltiesRegistry");
    royaltiesRegistry = await RoyaltiesRegistry.deploy();
    await royaltiesRegistry.deployed();

    // Deploy ERC721LazyMintTransferProxy
    const ERC721LazyMintTransferProxy = await ethers.getContractFactory("ERC721LazyMintTransferProxyTest");
    erc721LazyMintTransferProxy = await ERC721LazyMintTransferProxy.deploy();
    await erc721LazyMintTransferProxy.deployed();

    // Deploy ERC1155LazyMintTransferProxy  
    const ERC1155LazyMintTransferProxy = await ethers.getContractFactory("ERC1155LazyMintTransferProxyTest");
    erc1155LazyMintTransferProxy = await ERC1155LazyMintTransferProxy.deploy();
    await erc1155LazyMintTransferProxy.deployed();
  });

  it("should deploy and initialize ExchangeMetaV2 correctly", async () => {
    // Deploy ExchangeMetaV2 and initialize
    const ExchangeMetaV2 = await ethers.getContractFactory("ExchangeMetaV2");
    exchangeV2 = await ExchangeMetaV2.deploy();
    await exchangeV2.deployed();
    await exchangeV2.__ExchangeV2_init(
      transferProxy.address,
      erc20TransferProxy.address,
      0,
      protocol,
      royaltiesRegistry.address
    );

    const secondExchangeMetaV2 = await ExchangeMetaV2.connect(secondDeployer).deploy();
    await secondExchangeMetaV2.deployed();
    await secondExchangeMetaV2.connect(secondDeployer).__ExchangeV2_init_proxy(
      transferProxy.address,
      erc20TransferProxy.address,
      0,
      protocol,
      royaltiesRegistry.address,
      deployer.address,
      [ERC721_LAZY, ERC1155_LAZY],
      [erc721LazyMintTransferProxy.address, erc1155LazyMintTransferProxy.address],
      COLLECTION_ID,
      symbolicAssetMatcher.address
    );

    expect(await exchangeV2.owner()).to.equal(await secondExchangeMetaV2.owner());
    expect(await exchangeV2.royaltiesRegistry()).to.equal(await secondExchangeMetaV2.royaltiesRegistry());
  });
});
