import { expect } from "chai";
import { ethers } from "hardhat";
import { RaribleCreateX } from "../typechain-types"; // adjust the path if needed
import { ContractFactory, Signer } from "ethers";

describe("RaribleCreateX", function () {
  let createX: RaribleCreateX;
  let SimpleFactory: ContractFactory;
  let simpleBytecode: string;
  let deployer: Signer;
  let deployerAddress: string;

  before(async function () {
    [deployer] = await ethers.getSigners();
    deployerAddress = await deployer.getAddress();

    const CreateXFactory = await ethers.getContractFactory("RaribleCreateX");
    createX = (await CreateXFactory.deploy()) as RaribleCreateX;
    await createX.deployed();

    SimpleFactory = await ethers.getContractFactory("Simple");
    simpleBytecode = SimpleFactory.bytecode; // Raw initCode
  });

  function getSaltWithCaller(caller: string, uniqueByte: number = 0x01): string {
    const callerBytes = caller.slice(2).padStart(40, "0"); // 20 bytes
    const rest = uniqueByte.toString(16).padStart(24, "0"); // 12 bytes = 32 - 20
    return "0x" + callerBytes + rest;
  }

  it("should deploy using deployCreate2", async () => {
    const salt = getSaltWithCaller(deployerAddress, 0x01);

    const tx = await createX["deployCreate2(bytes32,bytes)"](salt, simpleBytecode);
    const receipt = await tx.wait();

    const deploymentAddress = receipt.events?.[0].args?.[0];
    expect(await createX.hasBeenDeployed(deploymentAddress)).to.equal(true);
  });

  it("should deploy using safeCreate2 and revert if already deployed", async () => {
    const salt = getSaltWithCaller(deployerAddress, 0x02);

    await createX.safeCreate2(salt, simpleBytecode);

    await expect(
      createX.safeCreate2(salt, simpleBytecode)
    ).to.be.revertedWithCustomError(createX, "FailedContractCreation");
  });

  it("should return the correct address using findCreate2AddressViaHash", async () => {
    const salt = getSaltWithCaller(deployerAddress, 0x03);
    const initCodeHash = ethers.utils.keccak256(simpleBytecode);

    const predictedAddress = await createX.findCreate2AddressViaHash(salt, initCodeHash);
    const tx = await createX["deployCreate2(bytes32,bytes)"](salt, simpleBytecode);
    const receipt = await tx.wait();

    const deploymentAddress = receipt.events?.[0].args?.[0];
    expect(predictedAddress).to.equal(deploymentAddress);
  });

  it("should return the correct address using findCreate2Address", async () => {
    const salt = getSaltWithCaller(deployerAddress, 0x04);

    const predictedAddress = await createX.findCreate2Address(salt, simpleBytecode);
    await createX["deployCreate2(bytes32,bytes)"](salt, simpleBytecode);

    expect(await createX.hasBeenDeployed(predictedAddress)).to.equal(true);
  });

  it("should detect if a contract has been deployed", async () => {
    const salt = getSaltWithCaller(deployerAddress, 0x05);

    const predictedAddress = await createX.findCreate2Address(salt, simpleBytecode);
    expect(await createX.hasBeenDeployed(predictedAddress)).to.equal(false);

    await createX["deployCreate2(bytes32,bytes)"](salt, simpleBytecode);
    expect(await createX.hasBeenDeployed(predictedAddress)).to.equal(true);
  });
});
