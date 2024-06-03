import { expect } from "chai";
import { ethers, upgrades } from "hardhat";
import { Contract, Signer } from "ethers";
import { BigNumber } from "ethers";
import { _TypedDataEncoder } from "@ethersproject/hash";
import { id, enc, ETH, ERC20 } from "./utils";

const ZERO = "0x0000000000000000000000000000000000000000";

async function verifyBalanceChange(txPromise: any, expected: BigNumber, account: string) {
  const initialBalance = await ethers.provider.getBalance(account);
  const tx = await txPromise;
  const receipt = await tx.wait();
  const finalBalance = await ethers.provider.getBalance(account);
  const gasUsed = receipt.gasUsed.mul(receipt.effectiveGasPrice);
  expect(finalBalance.add(gasUsed).sub(initialBalance)).to.equal(expected);
}

describe("ExchangeSimpleV2", function () {
  let testing: Contract;
  let transferProxy: Contract;
  let erc20TransferProxy: Contract;
  let t1: Contract;
  let t2: Contract;
  let libOrder: Contract;
  let accounts: Signer[];
  let account1: string;
  let account2: string;

  before(async () => {
    accounts = await ethers.getSigners();
    account1 = await accounts[1].getAddress();
    account2 = await accounts[2].getAddress();

    const LibOrderTest = await ethers.getContractFactory("LibOrderTest");
    libOrder = await LibOrderTest.deploy();

    const TransferProxyTest = await ethers.getContractFactory("TransferProxyTest");
    transferProxy = await TransferProxyTest.deploy();

    const ERC20TransferProxyTest = await ethers.getContractFactory("ERC20TransferProxyTest");
    erc20TransferProxy = await ERC20TransferProxyTest.deploy();

    const ExchangeSimpleV2 = await ethers.getContractFactory("ExchangeSimpleV2");
    testing = await upgrades.deployProxy(ExchangeSimpleV2, [transferProxy.address, erc20TransferProxy.address], { initializer: "__ExchangeSimpleV2_init" });
  });

  beforeEach(async () => {
    const TestERC20 = await ethers.getContractFactory("TestERC20");
    t1 = await TestERC20.deploy();
    t2 = await TestERC20.deploy();
  });

  it("upgrade works", async () => {
    const ExchangeSimpleV2_1 = await ethers.getContractFactory("ExchangeSimpleV2_1");
    await expect(testing.functions['getSomething']()).to.be.reverted;

    const upgraded = await upgrades.upgradeProxy(testing.address, ExchangeSimpleV2_1);
    expect(await upgraded.functions['getSomething']()).to.equal(10);
  });

  describe("matchOrders", () => {
    it("eth orders work, rest is returned to taker", async () => {
      await t1.mint(account1, 100);
      await t1.connect(accounts[1]).approve(erc20TransferProxy.address, 10000000);

      const left = {
        maker: account1,
        makeAsset: { assetType: { assetClass: ERC20, data: enc(t1.address) }, value: 100 },
        taker: ZERO,
        takeAsset: { assetType: { assetClass: ETH, data: "0x" }, value: 200 },
        salt: 1,
        start: 0,
        end: 0,
        dataType: "0xffffffff",
        data: "0x"
      };

      const right = {
        maker: account2,
        makeAsset: { assetType: { assetClass: ETH, data: "0x" }, value: 200 },
        taker: ZERO,
        takeAsset: { assetType: { assetClass: ERC20, data: enc(t1.address) }, value: 100 },
        salt: 1,
        start: 0,
        end: 0,
        dataType: "0xffffffff",
        data: "0x"
      };

      const signature = await getSignature(left, accounts[1]);

      await expect(testing.connect(accounts[2]).matchOrders(left, signature, right, "0x", { value: 199 })).to.be.reverted;
      
      await verifyBalanceChange(
        testing.connect(accounts[2]).matchOrders(left, signature, right, "0x", { value: 200 }),
        BigNumber.from(200),
        account2
      );
      
      expect(await t1.balanceOf(account1)).to.equal(0);
      expect(await t1.balanceOf(account2)).to.equal(100);
    });

    it("only owner can change transfer proxy", async () => {
      await expect(testing.connect(accounts[1]).setTransferProxy("0x00112233", account2)).to.be.reverted;
      await testing.setTransferProxy("0x00112233", account2);
    });

    it("simplest possible exchange works", async () => {
      await t1.mint(account1, 100);
      await t2.mint(account2, 200);
      await t1.connect(accounts[1]).approve(erc20TransferProxy.address, 10000000);
      await t2.connect(accounts[2]).approve(erc20TransferProxy.address, 10000000);

      const left = {
        maker: account1,
        makeAsset: { assetType: { assetClass: ERC20, data: enc(t1.address) }, value: 100 },
        taker: ZERO,
        takeAsset: { assetType: { assetClass: ERC20, data: enc(t2.address) }, value: 200 },
        salt: 1,
        start: 0,
        end: 0,
        dataType: "0xffffffff",
        data: "0x"
      };

      const right = {
        maker: account2,
        makeAsset: { assetType: { assetClass: ERC20, data: enc(t2.address) }, value: 200 },
        taker: ZERO,
        takeAsset: { assetType: { assetClass: ERC20, data: enc(t1.address) }, value: 100 },
        salt: 1,
        start: 0,
        end: 0,
        dataType: "0xffffffff",
        data: "0x"
      };

      const leftSig = await getSignature(left, accounts[1]);
      const rightSig = await getSignature(right, accounts[2]);

      await testing.matchOrders(left, leftSig, right, rightSig);
      
      expect(await t1.balanceOf(account1)).to.equal(0);
      expect(await t1.balanceOf(account2)).to.equal(100);
      expect(await t2.balanceOf(account1)).to.equal(200);
      expect(await t2.balanceOf(account2)).to.equal(0);
    });

    it("cancel", async () => {
      const { left, right } = await prepare2Orders();
      await expect(testing.connect(accounts[2]).cancel(left)).to.be.reverted;
      await testing.connect(accounts[1]).cancel(left);
      await expect(testing.matchOrders(left, await getSignature(left, accounts[1]), right, await getSignature(right, accounts[2]))).to.be.reverted;
    });

    it("order with salt 0 can't be canceled", async () => {
      const { left, right } = await prepare2Orders();
      left.salt = 0;
      await expect(testing.connect(accounts[1]).cancel(left)).to.be.reverted;
    });

    it("doesn't allow to fill more than 100% of the order", async () => {
      const { left, right } = await prepare2Orders();
      right.makeAsset.value = 100;
      right.takeAsset.value = 50;
      right.salt = 0;

      const signature = await getSignature(left, accounts[1]);

      await testing.matchOrders(left, signature, right, "0x");
      await testing.matchOrders(left, signature, right, "0x");

      await expect(testing.matchOrders(left, signature, right, "0x")).to.be.reverted;

      expect(await t1.balanceOf(account1)).to.equal(0);
      expect(await t1.balanceOf(account2)).to.equal(100);
      expect(await t2.balanceOf(account1)).to.equal(200);
      expect(await t2.balanceOf(account2)).to.equal(0);
    });
  });

  describe("validate", () => {
    it("should not let proceed if taker is not correct", async () => {
      const { left, right } = await prepare2Orders();
      left.taker = await accounts[3].getAddress();

      const leftSig = await getSignature(left, accounts[1]);
      const rightSig = await getSignature(right, accounts[2]);

      await expect(testing.matchOrders(left, leftSig, right, rightSig)).to.be.reverted;
      await expect(testing.matchOrders(right, leftSig, left, rightSig)).to.be.reverted;
    });

    it("should not let proceed if one of the signatures is incorrect", async () => {
      const { left, right } = await prepare2Orders();

      await expect(testing.matchOrders(left, await getSignature(left, accounts[2]), right, await getSignature(right, accounts[2]))).to.be.reverted;
      await expect(testing.matchOrders(right, await getSignature(right, accounts[2]), left, await getSignature(left, accounts[2]))).to.be.reverted;
    });

    it("should not let proceed if order dates are wrong", async () => {
      const now = Math.floor(Date.now() / 1000);
      const { left, right } = await prepare2Orders();
      left.start = now + 1000;

      await expect(testing.matchOrders(left, await getSignature(left, accounts[1]), right, await getSignature(right, accounts[2]))).to.be.reverted;
    });
  });

  describe("asset matcher", () => {
    it("should throw if assets do not match", async () => {
      const { left, right } = await prepare2Orders();
      left.takeAsset.assetType.data = enc(account1);

      const leftSig = await getSignature(left, accounts[1]);
      const rightSig = await getSignature(right, accounts[2]);

      await expect(testing.matchOrders(left, leftSig, right, rightSig)).to.be.reverted;
    });
  });

  async function prepare2Orders(t1Amount: number = 100, t2Amount: number = 200) {
    await t1.mint(account1, t1Amount);
    await t2.mint(account2, t2Amount);
    await t1.connect(accounts[1]).approve(erc20TransferProxy.address, 10000000);
    await t2.connect(accounts[2]).approve(erc20TransferProxy.address, 10000000);

    const left = {
      maker: account1,
      makeAsset: { assetType: { assetClass: ERC20, data: enc(t1.address) }, value: t1Amount },
      taker: ZERO,
      takeAsset: { assetType: { assetClass: ERC20, data: enc(t2.address) }, value: t2Amount },
      salt: 1,
      start: 0,
      end: 0,
      dataType: "0xffffffff",
      data: "0x"
    };

    const right = {
      maker: account2,
      makeAsset: { assetType: { assetClass: ERC20, data: enc(t2.address) }, value: t2Amount },
      taker: ZERO,
      takeAsset: { assetType: { assetClass: ERC20, data: enc(t1.address) }, value: t1Amount },
      salt: 1,
      start: 0,
      end: 0,
      dataType: "0xffffffff",
      data: "0x"
    };

    return { left, right };
  }

  async function getSignature(order: any, signer: Signer): Promise<string> {
    const domain = {
        name: "Exchange",
        version: "1",
        chainId: (await ethers.provider.getNetwork()).chainId,
        verifyingContract: testing.address, // Ensure `testing` is defined or replace it with the appropriate contract instance
    };

    const types = {
        Order: [
            { name: "maker", type: "address" },
            { name: "makeAsset", type: "Asset" },
            { name: "taker", type: "address" },
            { name: "takeAsset", type: "Asset" },
            { name: "salt", type: "uint256" },
            { name: "start", type: "uint256" },
            { name: "end", type: "uint256" },
            { name: "dataType", type: "bytes4" },
            { name: "data", type: "bytes" },
        ],
        Asset: [
            { name: "assetType", type: "AssetType" },
            { name: "value", type: "uint256" },
        ],
        AssetType: [
            { name: "assetClass", type: "bytes4" },
            { name: "data", type: "bytes" },
        ],
    };

    const signerAddress = await signer.getAddress();

    const signature = await ethers.provider.send("eth_signTypedData_v4", [
        signerAddress,
        JSON.stringify({
            domain,
            types,
            primaryType: "Order",
            message: order,
        }),
    ]);

    return signature;
}
});
