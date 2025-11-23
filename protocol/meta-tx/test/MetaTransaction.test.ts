// <ai_context> Test suite for EIP712MetaTransaction using MetaTxTest contract. Covers meta-transaction execution, nonce management, signature verification, and support detection. Uses TypeChain types for typed contract interactions. </ai_context>
import { expect } from "chai";
import { network } from "hardhat";
const connection = await network.connect();
const { ethers } = connection;
import type * as ethersTypes from "ethers";
import { type MetaTxTest, MetaTxTest__factory, type NoMetaTxTest, NoMetaTxTest__factory, type NoGetNonceTxTest, NoGetNonceTxTest__factory } from "../types/ethers-contracts";
const domainType = [
  { name: "name", type: "string" },
  { name: "version", type: "string" },
  { name: "verifyingContract", type: "address" },
  { name: "salt", type: "bytes32" },
];
const metaTransactionType = [
  { name: "nonce", type: "uint256" },
  { name: "from", type: "address" },
  { name: "functionSignature", type: "bytes" },
];
const ZERO_ADDRESS = "0x0000000000000000000000000000000000000000";
const publicKey = "0x726cDa2Ac26CeE89F645e55b78167203cAE5410E";
const privateKey = "0x68619b8adb206de04f676007b2437f99ff6129b672495a6951499c6c56bc2fa6";
const balanceOfAbi = {
  name: "balanceOf",
  inputs: [{ type: "address" }],
  outputs: [{ type: "uint256" }],
  stateMutability: "view",
};
const sumAbi = {
  name: "sumTest",
  inputs: [{ type: "uint256" }, { type: "uint256" }],
  outputs: [{ type: "uint256" }],
  stateMutability: "nonpayable",
};
const getNonceAbi = {
  name: "getNonce",
  inputs: [{ type: "address" }],
  outputs: [{ type: "uint256" }],
  stateMutability: "view",
};
const executeMetaTransactionAbi = {
  name: "executeMetaTransaction",
  inputs: [
    { type: "address" },
    { type: "bytes" },
    { type: "bytes32" },
    { type: "bytes32" },
    { type: "uint8" },
  ],
  outputs: [{ type: "bytes" }],
  stateMutability: "payable",
};
async function getTransactionData(nonce: bigint, abi: typeof sumAbi, params: any[]) {
  const iface = new ethers.Interface([`function ${abi.name}(${abi.inputs.map((i) => i.type).join(",")}) returns (${abi.outputs.map((o) => o.type).join(",")})`]);
  const functionSignature = iface.encodeFunctionData(abi.name, params);
  const message = {
    nonce,
    from: publicKey,
    functionSignature,
  };
  const wallet = new ethers.Wallet(privateKey);
  const signature = await wallet.signTypedData(domainData, { MetaTransaction: metaTransactionType }, message);
  const sig = ethers.Signature.from(signature);
  return { r: sig.r, s: sig.s, v: sig.v, functionSignature };
}
let domainData: any;
async function areMetaTxSupported(addressContract: string): Promise<boolean> {
  const metaTxIface = new ethers.Interface([
    "function getNonce(address) view returns (uint256)",
    "function executeMetaTransaction(address userAddress, bytes memory functionSignature, bytes32 sigR, bytes32 sigS, uint8 sigV) payable returns (bytes memory)",
  ]);
  let nonce: bigint;
  try {
    const nonceData = metaTxIface.encodeFunctionData("getNonce", [publicKey]);
    const nonceResult = await ethers.provider.call({ to: addressContract, data: nonceData });
    nonce = BigInt(metaTxIface.decodeFunctionResult("getNonce", nonceResult)[0]);
  } catch {
    return false;
  }
  const { r, s, v, functionSignature } = await getTransactionData(nonce, getNonceAbi, [ZERO_ADDRESS]);
  try {
    const execData = metaTxIface.encodeFunctionData("executeMetaTransaction", [publicKey, functionSignature, r, s, Number(v)]);
    await ethers.provider.call({ to: addressContract, data: execData });
  } catch {
    return false;
  }
  return true;
}
describe("EIP712MetaTransaction via MetaTxTest", function () {
  let metaTxTest: MetaTxTest;
  let noMetaTxTest: NoMetaTxTest;
  let noGetNonceTxTest: NoGetNonceTxTest;
  let ownerSigner: ethersTypes.Signer;
  let owner: string;
  let chainId: number;
  before(async function () {
    [ownerSigner] = await ethers.getSigners();
    owner = await ownerSigner.getAddress();
    chainId = Number((await ethers.provider.getNetwork()).chainId);
    const salt = `0x${chainId.toString(16).padStart(64, "0")}`;
    const MetaTxTestFactory = new MetaTxTest__factory(ownerSigner);
    metaTxTest = await MetaTxTestFactory.deploy();
    await metaTxTest.waitForDeployment();
    await metaTxTest.__MetaTxTest_init("MetaTxTest", "1");
    const NoMetaTxTestFactory = new NoMetaTxTest__factory(ownerSigner);
    noMetaTxTest = await NoMetaTxTestFactory.deploy();
    await noMetaTxTest.waitForDeployment();
    const NoGetNonceTxTestFactory = new NoGetNonceTxTest__factory(ownerSigner);
    noGetNonceTxTest = await NoGetNonceTxTestFactory.deploy();
    await noGetNonceTxTest.waitForDeployment();
    domainData = {
      name: "MetaTxTest",
      version: "1",
      verifyingContract: await metaTxTest.getAddress(),
      salt,
    };
  });
  it("Should revert when calling unknown abi-method via metaTx", async function () {
    const nonce = await metaTxTest.getNonce(publicKey);
    const { r, s, v, functionSignature } = await getTransactionData(nonce, balanceOfAbi, [publicKey]);
    await expect(metaTxTest.connect(ownerSigner).executeMetaTransaction(publicKey, functionSignature, r, s, Number(v)))
      .to.be.revertedWith("Function call not successful");
  });
  it("Should execute known abi-method via metaTx", async function () {
    const nonce = await metaTxTest.getNonce(publicKey);
    const { r, s, v, functionSignature } = await getTransactionData(nonce, sumAbi, [5n, 6n]);
    await metaTxTest.connect(ownerSigner).executeMetaTransaction(publicKey, functionSignature, r, s, Number(v));
    const newNonce = await metaTxTest.getNonce(publicKey);
    expect(newNonce).to.equal(nonce + 1n);
  });
  it("Should execute known abi-method (getNonce) via metaTx, for checking contract support metaTx", async function () {
    const nonce = await metaTxTest.getNonce(publicKey);
    const { r, s, v, functionSignature } = await getTransactionData(nonce, getNonceAbi, [ZERO_ADDRESS]);
    await metaTxTest.connect(ownerSigner).executeMetaTransaction(publicKey, functionSignature, r, s, Number(v));
    const newNonce = await metaTxTest.getNonce(publicKey);
    expect(newNonce).to.equal(nonce + 1n);
  });
  it("Should confirm contract supports metaTransaction by method areMetaTxSupported, using contract with MetaTx", async function () {
    const nonceBefore = await metaTxTest.getNonce(ZERO_ADDRESS);
    const result = await areMetaTxSupported(await metaTxTest.getAddress());
    expect(result).to.be.true;
    const nonceAfter = await metaTxTest.getNonce(ZERO_ADDRESS);
    expect(nonceBefore).to.equal(nonceAfter);
  });
  it("Should confirm contract does not support metaTransaction by method areMetaTxSupported, using contract without MetaTx", async function () {
    const result = await areMetaTxSupported(await noMetaTxTest.getAddress());
    expect(result).to.be.false;
  });
  it("Should confirm contract does not support metaTransaction by method areMetaTxSupported, using contract without getNonce()", async function () {
    const result = await areMetaTxSupported(await noGetNonceTxTest.getAddress());
    expect(result).to.be.false;
  });
  it("Should emit event from method called as metaTx", async function () {
    const nonce = await metaTxTest.getNonce(publicKey);
    const { r, s, v, functionSignature } = await getTransactionData(nonce, sumAbi, [5n, 6n]);
    const tx = await metaTxTest.connect(ownerSigner).executeMetaTransaction(publicKey, functionSignature, r, s, Number(v));
    await expect(tx).to.emit(metaTxTest, "SimpleEventSum").withArgs(11n);
  });
  it("Should emit MetaTransactionExecuted event", async function () {
    const nonce = await metaTxTest.getNonce(publicKey);
    const { r, s, v, functionSignature } = await getTransactionData(nonce, sumAbi, [5n, 8n]);
    const tx = await metaTxTest.connect(ownerSigner).executeMetaTransaction(publicKey, functionSignature, r, s, Number(v));
    await expect(tx).to.emit(metaTxTest, "MetaTransactionExecuted")
      .withArgs(publicKey, owner, functionSignature);
  });
  it("Should not increment nonce on direct contract method call", async function () {
    const oldNonce = await metaTxTest.getNonce(publicKey);
    await metaTxTest.connect(ownerSigner).sumTest(3n, 6n);
    const newNonce = await metaTxTest.getNonce(publicKey);
    expect(newNonce).to.equal(oldNonce);
  });
  it("Should revert when trying to call executeMetaTransaction method itself", async function () {
    const nonce = await metaTxTest.getNonce(publicKey);
    const setQuoteData = await getTransactionData(nonce, sumAbi, [3n, 9n]);
    const { r, s, v, functionSignature } = await getTransactionData(nonce, executeMetaTransactionAbi, [publicKey, setQuoteData.functionSignature, setQuoteData.r, setQuoteData.s, setQuoteData.v]);
    await expect(metaTxTest.connect(ownerSigner).executeMetaTransaction(publicKey, functionSignature, r, s, Number(v)))
      .to.be.revertedWith("Wrong functionSignature");
  });
  it("Should revert on transaction replay", async function () {
    const nonce = await metaTxTest.getNonce(publicKey);
    const { r, s, v, functionSignature } = await getTransactionData(nonce, sumAbi, [3n, 9n]);
    await metaTxTest.connect(ownerSigner).executeMetaTransaction(publicKey, functionSignature, r, s, Number(v));
    await expect(metaTxTest.connect(ownerSigner).executeMetaTransaction(publicKey, functionSignature, r, s, Number(v)))
      .to.be.revertedWith("Signer and signature do not match");
  });
  it("Should revert when user address is Zero", async function () {
    const nonce = await metaTxTest.getNonce(publicKey);
    const { r, s, v, functionSignature } = await getTransactionData(nonce, sumAbi, [3n, 9n]);
    await expect(metaTxTest.connect(ownerSigner).executeMetaTransaction(ZERO_ADDRESS, functionSignature, r, s, Number(v)))
      .to.be.revertedWith("Signer and signature do not match");
  });
  it("Should revert when Signer and Signature do not match", async function () {
    const nonce = await metaTxTest.getNonce(publicKey);
    const { r, s, v, functionSignature } = await getTransactionData(nonce, sumAbi, [3n, 9n]);
    const [, otherSigner] = await ethers.getSigners();
    await expect(metaTxTest.connect(ownerSigner).executeMetaTransaction(otherSigner.address, functionSignature, r, s, Number(v)))
      .to.be.revertedWith("Signer and signature do not match");
  });
});