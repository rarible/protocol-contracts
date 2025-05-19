const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("TWCreateX", function () {
  let twCreateX, Simple, simpleBytecode, deployer;

  before(async function () {
    [deployer] = await ethers.getSigners();

    const TWCreateX = await ethers.getContractFactory("TWCreateX");
    twCreateX = await TWCreateX.deploy();
    await twCreateX.deployed();

    Simple = await ethers.getContractFactory("Simple");
    simpleBytecode = Simple.bytecode; // Correct way to get raw initCode
  });

  function getSaltWithCaller(caller, uniqueByte = 0x01) {
    const callerBytes = caller.slice(2).padStart(40, "0"); // 20 bytes
    const rest = uniqueByte.toString(16).padStart(24, "0"); // 12 bytes = 32 - 20
    return "0x" + callerBytes + rest;
  }

  it("should deploy using deployCreate2", async () => {
    const salt = getSaltWithCaller(deployer.address, 0x01);

    const tx = await twCreateX["deployCreate2(bytes32,bytes)"](salt, simpleBytecode);
    const receipt = await tx.wait();

    const deploymentAddress = receipt.events[0].args[0];
    expect(await twCreateX.hasBeenDeployed(deploymentAddress)).to.equal(true);
  });

  it("should deploy using safeCreate2 and revert if already deployed", async () => {
    const salt = getSaltWithCaller(deployer.address, 0x02);

    await twCreateX.safeCreate2(salt, simpleBytecode);

    await expect(
      twCreateX.safeCreate2(salt, simpleBytecode)
    ).to.be.revertedWithCustomError(twCreateX, "FailedContractCreation");
  });

  it("should return the correct address using findCreate2AddressViaHash", async () => {
    const salt = getSaltWithCaller(deployer.address, 0x03);
    const initCodeHash = ethers.utils.keccak256(simpleBytecode);

    const predictedAddress = await twCreateX.findCreate2AddressViaHash(salt, initCodeHash);
    const tx = await twCreateX["deployCreate2(bytes32,bytes)"](salt, simpleBytecode);
    const receipt = await tx.wait();

    const deploymentAddress = receipt.events[0].args[0];
    expect(predictedAddress).to.equal(deploymentAddress);
  });

  it("should return the correct address using findCreate2Address", async () => {
    const salt = getSaltWithCaller(deployer.address, 0x04);

    const predictedAddress = await twCreateX.findCreate2Address(salt, simpleBytecode);
    await twCreateX["deployCreate2(bytes32,bytes)"](salt, simpleBytecode);

    expect(await twCreateX.hasBeenDeployed(predictedAddress)).to.equal(true);
  });

  it("should detect if a contract has been deployed", async () => {
    const salt = getSaltWithCaller(deployer.address, 0x05);

    const predictedAddress = await twCreateX.findCreate2Address(salt, simpleBytecode);
    expect(await twCreateX.hasBeenDeployed(predictedAddress)).to.equal(false);

    await twCreateX["deployCreate2(bytes32,bytes)"](salt, simpleBytecode);
    expect(await twCreateX.hasBeenDeployed(predictedAddress)).to.equal(true);
  });
});
