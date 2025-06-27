import { expect } from "chai";
import { ethers } from "hardhat";
import { ERC20TransferProxyTest, ExchangeV2, TestRoyaltiesRegistry, TransferProxyTest, ERC721LazyMintTransferProxyTest, ERC1155LazyMintTransferProxyTest } from "../typechain-types";
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import { getValueFromMapping } from "./utils/getValueFromMapping";

const ERC721_LAZY = "0xd8f960c1"
const ERC1155_LAZY = "0x1cdfaa40"
const COLLECTION_ID = "0xf63c2825"

describe("ExchangeV2 Initialization", function () {
  let exchangeV2: ExchangeV2;
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

  it("should deploy and initialize ExchangeV2 correctly", async () => {
    // Deploy ExchangeV2 and initialize
    const ExchangeV2 = await ethers.getContractFactory("ExchangeV2");
    exchangeV2 = await ExchangeV2.deploy();
    await exchangeV2.deployed();
    await exchangeV2.__ExchangeV2_init(
      transferProxy.address,
      erc20TransferProxy.address,
      0,
      protocol,
      royaltiesRegistry.address
    );

    const secondExchangeV2 = await ExchangeV2.connect(secondDeployer).deploy();
    await secondExchangeV2.deployed();
    await secondExchangeV2.connect(secondDeployer).__ExchangeV2_init_proxy(
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

    expect(await exchangeV2.owner()).to.equal(await secondExchangeV2.owner());
    expect(await exchangeV2.royaltiesRegistry()).to.equal(await secondExchangeV2.royaltiesRegistry());
    // 0: 0x0000000000000000000000000000000000000000000000000000000000000001 => initialized
    expect(await ethers.provider.getStorageAt(secondExchangeV2.address, 0)).to.equal("0x0000000000000000000000000000000000000000000000000000000000000001");
    // 201: 0xddd112a261429abc594f5771eb08d7fa47bff456b2e5f1a47907b78573e33d96 => _HASHED_NAME
    expect(await ethers.provider.getStorageAt(secondExchangeV2.address, 201)).to.equal("0xddd112a261429abc594f5771eb08d7fa47bff456b2e5f1a47907b78573e33d96");
    // 202: 0xad7c5bef027816a800da1736444fb58a807ef4c9603b7848673f7e3a68eb14a5 => _HASHED_VERSION
    expect(await ethers.provider.getStorageAt(secondExchangeV2.address, 202)).to.equal("0xad7c5bef027816a800da1736444fb58a807ef4c9603b7848673f7e3a68eb14a5");
    // 151: proxies mapping(bytes4 => address)
    const ERC20_ASSET_CLASS = ethers.utils.hexDataSlice(
      ethers.utils.keccak256(ethers.utils.toUtf8Bytes("ERC20")),
      0,
      4
    );
    expect(await getValueFromMapping(secondExchangeV2, ERC20_ASSET_CLASS, "bytes4", 151)).to.equal(ethers.utils.hexZeroPad(erc20TransferProxy.address, 32).toLowerCase());
    const ERC721_ASSET_CLASS = ethers.utils.hexDataSlice(
      ethers.utils.keccak256(ethers.utils.toUtf8Bytes("ERC721")),
      0,
      4
    );
    expect(await getValueFromMapping(secondExchangeV2, ERC721_ASSET_CLASS, "bytes4", 151)).to.equal(ethers.utils.hexZeroPad(transferProxy.address, 32).toLowerCase());
    const ERC1155_ASSET_CLASS = ethers.utils.hexDataSlice(
      ethers.utils.keccak256(ethers.utils.toUtf8Bytes("ERC1155")),
      0,
      4
    );
    expect(await getValueFromMapping(secondExchangeV2, ERC1155_ASSET_CLASS, "bytes4", 151)).to.equal(ethers.utils.hexZeroPad(transferProxy.address, 32).toLowerCase());
    expect(await getValueFromMapping(secondExchangeV2, ERC721_LAZY, "bytes4", 151)).to.equal(ethers.utils.hexZeroPad(erc721LazyMintTransferProxy.address, 32).toLowerCase());
    expect(await getValueFromMapping(secondExchangeV2, ERC1155_LAZY, "bytes4", 151)).to.equal(ethers.utils.hexZeroPad(erc1155LazyMintTransferProxy.address, 32).toLowerCase());
    // 101: matchers mapping(bytes4 => address)
    expect(await getValueFromMapping(secondExchangeV2, COLLECTION_ID, "bytes4", 101)).to.equal(ethers.utils.hexZeroPad(symbolicAssetMatcher.address, 32).toLowerCase());
  });
});
