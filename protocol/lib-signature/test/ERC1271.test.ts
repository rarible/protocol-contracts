// <ai_context> Test suite for ERC1271 implementation using TestERC1271 contract. Covers constants and isValidSignature behavior. </ai_context>
import { expect } from "chai";
import { ZeroHash } from "ethers";
import { network } from "hardhat";
const { ethers } = await network.connect();

describe("ERC1271 via TestERC1271", function () {
  describe("Constants", function () {
    it("Should have correct ERC1271_INTERFACE_ID", async function () {
      const testERC1271 = await ethers.deployContract("TestERC1271");
      expect(await testERC1271.ERC1271_INTERFACE_ID()).to.equal("0xfb855dc9");
    });
    it("Should have correct ERC1271_RETURN_VALID_SIGNATURE", async function () {
      const testERC1271 = await ethers.deployContract("TestERC1271");
      expect(await testERC1271.ERC1271_RETURN_VALID_SIGNATURE()).to.equal("0x1626ba7e");
    });
    it("Should have correct ERC1271_RETURN_INVALID_SIGNATURE", async function () {
      const testERC1271 = await ethers.deployContract("TestERC1271");
      expect(await testERC1271.ERC1271_RETURN_INVALID_SIGNATURE()).to.equal("0x00000000");
    });
  });
  
  describe("isValidSignature", function () {
    it("Should return valid magic value when set to true", async function () {
      const testERC1271 = await ethers.deployContract("TestERC1271");
      await testERC1271.setReturnSuccessfulValidSignature(true);
      const hash = ZeroHash;
      const signature = "0x";
      const result = await testERC1271.isValidSignature(hash, signature);
      expect(result).to.equal("0x1626ba7e");
    });
    it("Should return invalid magic value when set to false", async function () {
      const testERC1271 = await ethers.deployContract("TestERC1271");
      await testERC1271.setReturnSuccessfulValidSignature(false);
      const hash = ZeroHash;
      const signature = "0x";
      const result = await testERC1271.isValidSignature(hash, signature);
      expect(result).to.equal("0x00000000");
    });
    it("Should handle empty hash and signature (valid case)", async function () {
      const testERC1271 = await ethers.deployContract("TestERC1271");
      await testERC1271.setReturnSuccessfulValidSignature(true);
      const hash = ZeroHash;
      const signature = "0x";
      const result = await testERC1271.isValidSignature(hash, signature);
      expect(result).to.equal("0x1626ba7e");
    });
    it("Should default to invalid if not set", async function () {
      const testERC1271 = await ethers.deployContract("TestERC1271");
      const hash = ZeroHash;
      const signature = "0x";
      const result = await testERC1271.isValidSignature(hash, signature);
      expect(result).to.equal("0x00000000");
    });
  });
});