// <ai_context> Test suite for RoyaltiesV2 implementation using RoyaltiesV2TestImpl and RoyaltiesV2Test contracts. Covers basic royalty saving, retrieval, and updating. Uses TypeChain for typed contract interactions. </ai_context>
import { expect } from "chai";
import { network } from "hardhat";
const connection = await network.connect();
const { ethers } = connection;
import { type RoyaltiesV2TestImpl, RoyaltiesV2TestImpl__factory, type RoyaltiesV2Test, RoyaltiesV2Test__factory } from "../types/ethers-contracts";

describe("RoyaltiesV2", function () {
  let impl: RoyaltiesV2TestImpl;
  let testing: RoyaltiesV2Test;
  before(async function () {
    const [ownerSigner] = await ethers.getSigners();
    impl = await new RoyaltiesV2TestImpl__factory(ownerSigner).deploy();
    await impl.waitForDeployment();
    testing = await new RoyaltiesV2Test__factory(ownerSigner).deploy(impl);
    await testing.waitForDeployment();
  });
  it("simple impl works", async function () {
    const tokenId = 10n;
    const [, acc1] = await ethers.getSigners();
    const addr1 = await acc1.getAddress();
    await impl.saveRoyalties(tokenId, [{ account: addr1, value: 100n }]);
    const result = await impl.getRaribleV2Royalties(tokenId);
    expect(result.length).to.equal(1);
    expect(result[0].account).to.equal(addr1);
    expect(result[0].value).to.equal(100n);
    const tx = await testing.royaltiesTest(tokenId);
    const receipt = await tx.wait();
    console.log("used gas", receipt?.gasUsed.toString());
  });
  it("update allows to change royalty recipient", async function () {
    const tokenId = 2n;
    const [, acc1, acc2] = await ethers.getSigners();
    const addr1 = await acc1.getAddress();
    const addr2 = await acc2.getAddress();
    await impl.saveRoyalties(tokenId, [{ account: addr1, value: 100n }]);
    await impl.updateAccount(tokenId, addr1, addr2);
    const result = await impl.getRaribleV2Royalties(tokenId);
    expect(result.length).to.equal(1);
    expect(result[0].account).to.equal(addr2);
    expect(result[0].value).to.equal(100n);
  });
});