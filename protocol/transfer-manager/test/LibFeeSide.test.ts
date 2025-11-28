// protocol/transfer-manager/test/LibFeeSide.test.ts
import { expect } from "chai";
import { network } from "hardhat";

const connection = await network.connect();
const { ethers } = connection;

import {
  type LibFeeSideTest,
  LibFeeSideTest__factory,
} from "../types/ethers-contracts";
import { ETH, ERC20, ERC721, ERC1155 } from "../src/assets";

describe("LibFeeSide", function () {
  let lib: LibFeeSideTest;

  const FEE_SIDE_NONE = 0n;
  const FEE_SIDE_MAKE = 1n;
  const FEE_SIDE_TAKE = 2n;

  before(async function () {
    const [deployer] = await ethers.getSigners();
    lib = await new LibFeeSideTest__factory(deployer).deploy();
    await lib.waitForDeployment();
  });

  it("ETH, ERC20 -> MAKE wins", async function () {
    const fee = await lib.getFeeSideTest(ETH, ERC20);
    expect(fee).to.equal(FEE_SIDE_MAKE);
  });

  it("ERC20, ETH -> TAKE wins", async function () {
    const fee = await lib.getFeeSideTest(ERC20, ETH);
    expect(fee).to.equal(FEE_SIDE_TAKE);
  });

  it("ERC20, ERC1155 -> MAKE wins", async function () {
    const fee = await lib.getFeeSideTest(ERC20, ERC1155);
    expect(fee).to.equal(FEE_SIDE_MAKE);
  });

  it("ERC1155, ERC20 -> TAKE wins", async function () {
    const fee = await lib.getFeeSideTest(ERC1155, ERC20);
    expect(fee).to.equal(FEE_SIDE_TAKE);
  });

  it("ERC1155, ETH -> TAKE wins", async function () {
    const fee = await lib.getFeeSideTest(ERC1155, ETH);
    expect(fee).to.equal(FEE_SIDE_TAKE);
  });

  it("ETH, ERC1155 -> MAKE wins", async function () {
    const fee = await lib.getFeeSideTest(ETH, ERC1155);
    expect(fee).to.equal(FEE_SIDE_MAKE);
  });

  it("ERC721, ETH -> TAKE wins", async function () {
    const fee = await lib.getFeeSideTest(ERC721, ETH);
    expect(fee).to.equal(FEE_SIDE_TAKE);
  });

  it("ERC20, ERC721 -> MAKE wins", async function () {
    const fee = await lib.getFeeSideTest(ERC20, ERC721);
    expect(fee).to.equal(FEE_SIDE_MAKE);
  });

  it("ERC1155, ERC721 -> MAKE wins", async function () {
    const fee = await lib.getFeeSideTest(ERC1155, ERC721);
    expect(fee).to.equal(FEE_SIDE_MAKE);
  });

  it("ERC721, ERC721 -> NONE wins", async function () {
    const fee = await lib.getFeeSideTest(ERC721, ERC721);
    expect(fee).to.equal(FEE_SIDE_NONE);
  });

  it("ETH, not Asset -> MAKE wins", async function () {
    const fee = await lib.getFeeSideTest(ETH, "0x12345678");
    expect(fee).to.equal(FEE_SIDE_MAKE);
  });

  it("not Asset, ERC1155 -> TAKE wins", async function () {
    const fee = await lib.getFeeSideTest("0x12345678", ERC1155);
    expect(fee).to.equal(FEE_SIDE_TAKE);
  });

  it("not Asset, not Asset -> NONE wins", async function () {
    const fee = await lib.getFeeSideTest("0x12345678", "0x87654321");
    expect(fee).to.equal(FEE_SIDE_NONE);
  });

  it("MAKE == TAKE -> MAKE wins", async function () {
    const fee = await lib.getFeeSideTest(ETH, ETH);
    expect(fee).to.equal(FEE_SIDE_MAKE);
  });
});
