// <ai_context> Test suite for IERC2981 implementation using Royalties2981TestImpl and Royalties2981Test contracts. Covers royaltyInfo functionality and calculateRoyalties check. Uses TypeChain for typed contract interactions. </ai_context>
import { expect } from "chai";
import { network } from "hardhat";
const connection = await network.connect();
const { ethers } = connection;
import { type Royalties2981TestImpl, Royalties2981TestImpl__factory, type Royalties2981Test, Royalties2981Test__factory } from "../types/ethers-contracts";

describe("Royalties 2981", function () {
  let impl: Royalties2981TestImpl;
  let testing: Royalties2981Test;
  before(async function () {
    const [ownerSigner] = await ethers.getSigners();
    impl = await new Royalties2981TestImpl__factory(ownerSigner).deploy();
    await impl.waitForDeployment();
    testing = await new Royalties2981Test__factory(ownerSigner).deploy(impl);
    await testing.waitForDeployment();
  });

  it("simple impl works", async function () {
    const [, acc1] = await ethers.getSigners();
    const getRoyalties = await acc1.getAddress();
    const tokenId = (BigInt(getRoyalties) << 96n) + 1n;
    await impl.setRoyalties(1000); // Set to match expected royaltyAmount=10 for salePrice=100
    const result = await impl.royaltyInfo(tokenId, 100n);
    expect(result.receiver).to.equal(getRoyalties);
    expect(result.royaltyAmount).to.equal(10n);
    const tx = await testing.royaltyInfoTest(tokenId, 100n);
    const receipt = await tx.wait();
    console.log("used gas", receipt?.gasUsed.toString());
  });

  it("calculateRoyalties check", async function () {
    const [, acc1] = await ethers.getSigners();
    const getterRoyalties = await acc1.getAddress();
    const result = await impl.calculateRoyaltiesTest.staticCall(getterRoyalties, 150000n);
    expect(result.length).to.equal(1);
    expect(result[0].account).to.equal(getterRoyalties);
    expect(result[0].value).to.equal(1500n);
  });
});