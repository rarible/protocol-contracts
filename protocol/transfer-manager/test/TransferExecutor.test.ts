// protocol/transfer-manager/test/TransferExecutor.test.ts
import { expect } from "chai";
import { network } from "hardhat";

const connection = await network.connect();
const { ethers } = connection;

import type * as ethersTypes from "ethers";
import {
  type TransferExecutorTest,
  TransferExecutorTest__factory,
  type TransferProxyTest,
  TransferProxyTest__factory,
  type ERC20TransferProxyTest,
  ERC20TransferProxyTest__factory,
  type TestERC20,
  TestERC20__factory,
  type TestERC20ZRX,
  TestERC20ZRX__factory,
  type TestERC721,
  TestERC721__factory,
  type TestERC1155,
  TestERC1155__factory,
} from "../types/ethers-contracts";
import { Asset } from "@rarible/common-sdk/src/order";
import { ETH, ERC20, ERC721, ERC1155, enc } from "@rarible/common-sdk/src/assets";

const ZERO = "0x0000000000000000000000000000000000000000";

describe("TransferExecutor", function () {
  let testing: TransferExecutorTest;
  let transferProxy: TransferProxyTest;
  let erc20TransferProxy: ERC20TransferProxyTest;

  let erc20Token: TestERC20;
  let erc20ZRXToken: TestERC20ZRX;
  let erc721Token: TestERC721;
  let erc1155Token: TestERC1155;

  let accounts: ethersTypes.Signer[];
  let deployer: ethersTypes.Signer;

  before(async function () {
    accounts = await ethers.getSigners();
    [deployer] = accounts as [ethersTypes.Signer, ...ethersTypes.Signer[]];

    // Proxies
    transferProxy = await new TransferProxyTest__factory(deployer).deploy();
    await transferProxy.waitForDeployment();

    erc20TransferProxy = await new ERC20TransferProxyTest__factory(deployer).deploy();
    await erc20TransferProxy.waitForDeployment();

    // TransferExecutorTest
    testing = await new TransferExecutorTest__factory(deployer).deploy();
    await testing.waitForDeployment();

    await testing.__TransferExecutorTest_init(
      await deployer.getAddress(),
      await transferProxy.getAddress(),
      await erc20TransferProxy.getAddress(),
    );

    // Tokens
    erc20Token = await new TestERC20__factory(deployer).deploy();
    await erc20Token.waitForDeployment();

    erc20ZRXToken = await new TestERC20ZRX__factory(deployer).deploy();
    await erc20ZRXToken.waitForDeployment();

    erc721Token = await new TestERC721__factory(deployer).deploy();
    await erc721Token.waitForDeployment();

    erc1155Token = await new TestERC1155__factory(deployer).deploy();
    await erc1155Token.waitForDeployment();
  });

  it("supports ETH transfers", async function () {
    const sender = accounts[0];
    const recipient = accounts[5];

    const recipientAddress = await recipient.getAddress();

    const before = await ethers.provider.getBalance(recipientAddress);

    const tx = await testing
      .connect(sender)
      .transferTest(Asset(ETH, "0x", 500n), ZERO, recipientAddress, { value: 500n });

    await tx.wait();

    const after = await ethers.provider.getBalance(recipientAddress);
    expect(after - before).to.equal(500n);
  });

  it("supports ERC20 transfers", async function () {
    const from = accounts[5];
    const to = accounts[6];

    const fromAddress = await from.getAddress();
    const toAddress = await to.getAddress();

    await erc20Token.connect(deployer).mintTo(fromAddress, 100n);
    await erc20Token.connect(from).approve(await erc20TransferProxy.getAddress(), 100n);

    await testing.transferTest(Asset(ERC20, enc(await erc20Token.getAddress()), 40n), fromAddress, toAddress);

    expect(await erc20Token.balanceOf(fromAddress)).to.equal(60n);
    expect(await erc20Token.balanceOf(toAddress)).to.equal(40n);
  });

  it("supports ERC20 ZRX-like tokens", async function () {
    const from = accounts[0];
    const to = accounts[6];

    const fromAddress = await from.getAddress();
    const toAddress = await to.getAddress();

    await erc20ZRXToken.connect(from).approve(await erc20TransferProxy.getAddress(), 100n);

    await testing
      .connect(from)
      .transferTest(Asset(ERC20, enc(await erc20ZRXToken.getAddress()), 40n), fromAddress, toAddress);

    expect(await erc20ZRXToken.balanceOf(toAddress)).to.equal(40n);
  });

  it("supports ERC721 transfers and validates value", async function () {
    const from = accounts[5];
    const to = accounts[6];

    const fromAddress = await from.getAddress();
    const toAddress = await to.getAddress();

    await erc721Token.connect(deployer).mint(fromAddress, 1n);
    await erc721Token.connect(from).setApprovalForAll(await transferProxy.getAddress(), true);

    // value = 2 -> must revert (same semantics as old expectThrow)
    let reverted = false;
    try {
      await testing.transferTest(Asset(ERC721, enc(await erc721Token.getAddress(), 1n), 2n), fromAddress, toAddress);
    } catch {
      reverted = true;
    }
    expect(reverted).to.equal(true);

    // value = 1 -> ok
    await testing.transferTest(Asset(ERC721, enc(await erc721Token.getAddress(), 1n), 1n), fromAddress, toAddress);

    expect(await erc721Token.ownerOf(1n)).to.equal(toAddress);
  });

  it("supports ERC1155 transfers", async function () {
    const from = accounts[5];
    const to = accounts[6];

    const fromAddress = await from.getAddress();
    const toAddress = await to.getAddress();

    await erc1155Token.connect(deployer).mint(fromAddress, 1n, 100n);
    await erc1155Token.connect(from).setApprovalForAll(await transferProxy.getAddress(), true);

    await testing.transferTest(Asset(ERC1155, enc(await erc1155Token.getAddress(), 1n), 40n), fromAddress, toAddress);

    expect(await erc1155Token.balanceOf(fromAddress, 1n)).to.equal(60n);
    expect(await erc1155Token.balanceOf(toAddress, 1n)).to.equal(40n);
  });
});
