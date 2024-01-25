import { expect } from "chai";
import { ethers } from "hardhat";
import { ERC721RaribleFactoryC2 } from "../typechain/ERC721RaribleFactoryC2";

describe("ERC721RaribleFactoryC2", function () {
  let factory: ERC721RaribleFactoryC2;
  let signers: any[];

  beforeEach(async function () {
    signers = await ethers.getSigners();
    const factoryContract = await ethers.getContractFactory("ERC721RaribleFactoryC2");
    factory = (await factoryContract.deploy(/* constructor arguments */)) as ERC721RaribleFactoryC2;
    await factory.deployed();
  });

  it("should deploy a token", async function () {
    const name = "Test Token";
    const symbol = "TT";
    const baseURI = "http://test.uri/";
    const contractURI = "http://contract.uri/";
    const salt = 0;

    // Call createToken function
    await factory.createToken(name, symbol, baseURI, contractURI, salt);

    // Test for emitted event or resulting state changes
    // ...
  });

  it("should compute correct addresses", async function () {
    const name = "Test Token";
    const symbol = "TT";
    const baseURI = "http://test.uri/";
    const contractURI = "http://contract.uri/";
    const salt = 0;

    // Compute the expected address
    const expectedAddress = await factory.getAddress(name, symbol, baseURI, contractURI, salt);

    // Test that the computed address matches your expectations
    // ...
  });

  // Add more tests for different functionalities
});
