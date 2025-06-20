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
  });
});
