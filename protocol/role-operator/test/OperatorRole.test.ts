// <ai_context> Test suite for OperatorRole. Covers adding/removing operators and access control. Ported from Truffle to Hardhat with TypeChain. </ai_context>
import { expect } from "chai";
import { network } from "hardhat";
// import { ethers } from "hardhat";
const connection = await network.connect();
const { ethers } = connection;
import { deployTransparentProxy } from "@rarible/test/src/index.js";
import { type OperatorRoleTest, OperatorRoleTest__factory } from "../types/ethers-contracts/index.js";

describe("OperatorRole", function () {
  let testing: OperatorRoleTest;
  beforeEach(async function () {
    const [deployer] = await ethers.getSigners();
    const { instance: operatorRoleInstance } = await deployTransparentProxy<OperatorRoleTest>(ethers, {
      contractName: "OperatorRoleTest",
      initFunction: "__OperatorRoleTest_init",
      initArgs: [deployer.address],
      proxyOwner: deployer.address,
    });
    testing = operatorRoleInstance;
  });
  it("only owner can add/remove operators", async function () {
    const [_, operator, other] = await ethers.getSigners();
    await expect(testing.connect(other).addOperator(operator.address)).to.be.revertedWithCustomError(
      testing,
      "OwnableUnauthorizedAccount",
    );
    await expect(testing.connect(other).removeOperator(operator.address)).to.be.revertedWithCustomError(
      testing,
      "OwnableUnauthorizedAccount",
    );
    await testing.addOperator(operator.address);
    await testing.removeOperator(operator.address);
  });
  it("only operator can call protected functions", async function () {
    const [deployer, operator, other] = await ethers.getSigners();
    await expect(testing.connect(other).getSomething()).to.be.revertedWith("OperatorRole: caller is not the operator");
    await expect(testing.connect(operator).getSomething()).to.be.revertedWith(
      "OperatorRole: caller is not the operator",
    );
    await expect(testing.getSomething()).to.be.revertedWith("OperatorRole: caller is not the operator");
    await testing.addOperator(operator.address);
    expect(await testing.connect(operator).getSomething()).to.equal(10n);
    await expect(testing.getSomething()).to.be.revertedWith("OperatorRole: caller is not the operator");
    await testing.removeOperator(operator.address);
    await expect(testing.connect(operator).getSomething()).to.be.revertedWith(
      "OperatorRole: caller is not the operator",
    );
    await testing.addOperator(deployer.address);
    expect(await testing.getSomething()).to.equal(10n);
  });
});
