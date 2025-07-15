import { expect } from "chai";
import { ethers } from "hardhat";
import { RaribleExchangeWrapperUpgradeable } from "../typechain-types";
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import { TestERC20 } from "../typechain-types";

describe("RaribleExchangeWrapperUpgradeable Initialization", function () {
  let raribleExchangeWrapperUpgradeable: RaribleExchangeWrapperUpgradeable;
  let deployer: SignerWithAddress;
  let secondSigner: SignerWithAddress;
  let symbolicMarketplace: string;
  let weth: TestERC20;
  let symbolicTransferProxy: string;

  beforeEach(async () => {
    const accounts = await ethers.getSigners();
    deployer = accounts[0];
    secondSigner = accounts[1];
    symbolicMarketplace = ethers.Wallet.createRandom().address;
    const WETH = await ethers.getContractFactory("TestERC20");
    weth = await WETH.deploy();
    await weth.deployed();

    symbolicTransferProxy = ethers.Wallet.createRandom().address;
  });

  it("should deploy and initialize RaribleExchangeWrapperUpgradeable correctly", async () => {
    const RaribleExchangeWrapperUpgradeable = await ethers.getContractFactory("RaribleExchangeWrapperUpgradeable");
    raribleExchangeWrapperUpgradeable = await RaribleExchangeWrapperUpgradeable.deploy();
    await raribleExchangeWrapperUpgradeable.deployed();
    await raribleExchangeWrapperUpgradeable.__ExchangeWrapper_init_proxy(
        [
            symbolicMarketplace,
            symbolicMarketplace,
            symbolicMarketplace,
            symbolicMarketplace,
            symbolicMarketplace,
            symbolicMarketplace,
            symbolicMarketplace,
            symbolicMarketplace,
            symbolicMarketplace,
            symbolicMarketplace,
            symbolicMarketplace
        ],
        weth.address,
        [symbolicTransferProxy],
        secondSigner.address
    );

    expect(await raribleExchangeWrapperUpgradeable.owner()).to.equal(secondSigner.address);
    expect(await raribleExchangeWrapperUpgradeable.wyvernExchange()).to.equal(symbolicMarketplace);
    expect(await raribleExchangeWrapperUpgradeable.exchangeV2()).to.equal(symbolicMarketplace);
    expect(await raribleExchangeWrapperUpgradeable.seaPort_1_1()).to.equal(symbolicMarketplace);
    expect(await raribleExchangeWrapperUpgradeable.x2y2()).to.equal(symbolicMarketplace);
    expect(await raribleExchangeWrapperUpgradeable.looksRare()).to.equal(symbolicMarketplace);
    expect(await raribleExchangeWrapperUpgradeable.sudoswap()).to.equal(symbolicMarketplace);
    expect(await raribleExchangeWrapperUpgradeable.seaPort_1_4()).to.equal(symbolicMarketplace);
    expect(await raribleExchangeWrapperUpgradeable.looksRareV2()).to.equal(symbolicMarketplace);
    expect(await raribleExchangeWrapperUpgradeable.blur()).to.equal(symbolicMarketplace);
    expect(await raribleExchangeWrapperUpgradeable.seaPort_1_5()).to.equal(symbolicMarketplace);
    expect(await raribleExchangeWrapperUpgradeable.seaPort_1_6()).to.equal(symbolicMarketplace);
    expect(await raribleExchangeWrapperUpgradeable.weth()).to.equal(weth.address);

    // 0: 0x0000000000000000000000000000000000000000000000000000000000000001 => initialized
    expect(await ethers.provider.getStorageAt(raribleExchangeWrapperUpgradeable.address, 0)).to.equal("0x0000000000000000000000000000000000000000000000000000000000000001");
  });
});
