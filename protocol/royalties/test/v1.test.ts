// <ai_context> Test suite for RoyaltiesV1 implementation using RoyaltiesV1TestImpl and RoyaltiesV1Test contracts. Covers basic royalty saving, retrieval, and updating. Uses TypeChain for typed contract interactions. </ai_context>
import { expect } from "chai";
import { network } from "hardhat";
const connection = await network.connect();
const { ethers } = connection;
import { type RoyaltiesV1TestImpl, RoyaltiesV1TestImpl__factory, type RoyaltiesV1Test, RoyaltiesV1Test__factory } from "../types/ethers-contracts";

describe("RoyaltiesV1", function () {
  let impl: RoyaltiesV1TestImpl;
  let testing: RoyaltiesV1Test;
  before(async function () {
    const [ownerSigner] = await ethers.getSigners();
    impl = await new RoyaltiesV1TestImpl__factory(ownerSigner).deploy();
    await impl.waitForDeployment();
    testing = await new RoyaltiesV1Test__factory(ownerSigner).deploy(impl);
    await testing.waitForDeployment();
  });
  it("simple impl works", async function () {
    const tokenId = 10n;
    const [, acc1] = await ethers.getSigners();
    const addr1 = await acc1.getAddress();
    await impl.saveRoyalties(tokenId, [{ account: addr1, value: 100n }]);
    const recipients = await impl.getFeeRecipients.staticCall(tokenId);
    expect(recipients.length).to.equal(1);
    expect(recipients[0]).to.equal(addr1);
    const values = await impl.getFeeBps(tokenId);
    expect(values.length).to.equal(1);
    expect(values[0]).to.equal(100n);
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
    const recipients = await impl.getFeeRecipients.staticCall(tokenId);

    expect(recipients.length).to.equal(1);
    expect(recipients[0]).to.equal(addr2);

    const values = await impl.getFeeBps(tokenId);
    expect(values.length).to.equal(1);
    expect(values[0]).to.equal(100n);
  });
});