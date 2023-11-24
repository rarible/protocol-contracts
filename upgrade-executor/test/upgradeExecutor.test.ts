import { ethers, network } from "hardhat";
import { expect } from "chai";

describe("Upgrade Executor", function () {
  let upgradeExecutor: any;
  let testHelper: any;
  let signers: any;

  before(async () => {
    signers = await ethers.getSigners();
    
    //deploy upgradeExecutor
    const UpgradeExecutor = await ethers.getContractFactory('UpgradeExecutor');
    upgradeExecutor = await UpgradeExecutor.deploy()

    //initialize upgradeExecutor
    await upgradeExecutor.initialize(signers[0].address, [signers[0].address]);

    //deploy testHelper
    const TestHelper = await ethers.getContractFactory('TestHelper');
    testHelper = await TestHelper.deploy()
  });

  it("should be able to set protocol fee using UpgradeExecutor", async function () {
    const ExchangeProtocolFee = await ethers.getContractFactory('ExchangeProtocolFee')
    const exchangeProtocolFee = await ExchangeProtocolFee.deploy();
    await exchangeProtocolFee.transferOwnership(upgradeExecutor.address)

    const SetProtocolFeeAction = await ethers.getContractFactory('SetProtocolFeeAction')
    const setProtocolFeeAction = await SetProtocolFeeAction.deploy(exchangeProtocolFee.address);

    //check that protocol fee is 0
    const feeFirst = await exchangeProtocolFee.protocolFee()
    expect(feeFirst.receiver).to.equal(ethers.constants.AddressZero);
    expect(feeFirst.buyerAmount).to.equal(0);
    expect(feeFirst.sellerAmount).to.equal(0);

    //prepare calldata
    const feeReceiver = signers[0].address;
    const buyerAmount = 100;
    const sellerAmount = 200;
    const actionProtocolFeeCalldata = await testHelper.encodeProtocolFeeCall(feeReceiver, buyerAmount, sellerAmount)

    //exectute call
    await upgradeExecutor.execute(setProtocolFeeAction.address, actionProtocolFeeCalldata)

    //check that protocol fee changed
    const feeSecond = await exchangeProtocolFee.protocolFee()
    expect(feeSecond.receiver).to.equal(feeReceiver);
    expect(feeSecond.buyerAmount).to.equal(buyerAmount);
    expect(feeSecond.sellerAmount).to.equal(sellerAmount);
  });

  it("should be able to set upgrade proxies UpgradeExecutor", async function () {
    const ProxyUpgradeAction = await ethers.getContractFactory('ProxyUpgradeAction')
    const proxyUpgradeAction = await ProxyUpgradeAction.deploy();

    const ProxyAdmin = await ethers.getContractFactory('ProxyAdmin')
    const proxyAdmin = await ProxyAdmin.deploy();
    await proxyAdmin.transferOwnership(upgradeExecutor.address)

    const TransparentUpgradeableProxy = await ethers.getContractFactory('TransparentUpgradeableProxy')
    const transparentUpgradeableProxy = await TransparentUpgradeableProxy.deploy(upgradeExecutor.address, proxyAdmin.address, "0x");

    //check that impl was set
    const implFirst = await proxyAdmin.getProxyImplementation(transparentUpgradeableProxy.address)
    expect(implFirst).to.equal(upgradeExecutor.address);

    //prepare calldata
    const newImpl = testHelper.address
    const actionUpgradeProxydata = await testHelper.encodeProxyUpgradeCall(proxyAdmin.address, transparentUpgradeableProxy.address, newImpl)

    //exectute call
    await upgradeExecutor.execute(proxyUpgradeAction.address, actionUpgradeProxydata)

    //check that impl has changed
    const implSecond = await proxyAdmin.getProxyImplementation(transparentUpgradeableProxy.address)
    expect(implSecond).to.equal(newImpl);
  });
});