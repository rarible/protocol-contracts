import { ethers, network } from "hardhat";
import { expect } from "chai";
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import {
  getWrapperSettings,
  nonZeroAddress,
  zeroAddress,
  twoAddress,
} from "../../hardhat-deploy/utils/exchangeWrapperSettings";

describe("Upgrade Executor, ExchangeWrapperUpgradeable", function () {
  let signers: SignerWithAddress[];
  let deployer: SignerWithAddress;

  let raribleExchangeWrapperUpgradeable: any;
  let upgradeExecutor: any;
  let proxyAdmin: any;
  let transparentUpgradeableProxy: any;
  let proxyInstance: any;
  let wrapperSettings: any;

  beforeEach(async () => {
    signers = await ethers.getSigners();
    deployer = signers[0];

    /* 1. Get dependencies/settings for the ExchangeWrapperUpgradeable implementation deployment */
    const exchangeV2Address = zeroAddress;
    wrapperSettings = getWrapperSettings(network.name);
    wrapperSettings.marketplaces[1] = exchangeV2Address;

    /* 2. Deploy an initial ExchangeWrapperUpgradeable Implementation */
    const RaribleExchangeWrapperUpgradeable = await ethers.getContractFactory(
      "RaribleExchangeWrapperUpgradeable"
    );
    raribleExchangeWrapperUpgradeable =
      await RaribleExchangeWrapperUpgradeable.deploy();

    /* 3. Deploy the UpgradeExecutor contract */
    const UpgradeExecutor = await ethers.getContractFactory("UpgradeExecutor");
    upgradeExecutor = await UpgradeExecutor.deploy([deployer.address]);

    /* 4. Deploy the ProxyAdmin contract */
    const ProxyAdmin = await ethers.getContractFactory("ProxyAdmin");
    proxyAdmin = await ProxyAdmin.deploy();

    /* 5. Transfer the ownership of the ProxyAdmin to the UpgradeExecutor */
    await proxyAdmin.transferOwnership(upgradeExecutor.address);

    /* 6 Encode initialization data */
    const initializeData =
      raribleExchangeWrapperUpgradeable.interface.encodeFunctionData(
        "__ExchangeWrapper_init_proxy",
        [
          wrapperSettings.marketplaces,
          wrapperSettings.weth,
          wrapperSettings.transferProxies,
          upgradeExecutor.address,
        ]
      );

    /* 7. Deploy the TransparentUpgradeableProxy contract */
    const TransparentUpgradeableProxy = await ethers.getContractFactory(
      "TransparentUpgradeableProxy"
    );
    transparentUpgradeableProxy = await TransparentUpgradeableProxy.deploy(
      raribleExchangeWrapperUpgradeable.address,
      proxyAdmin.address,
      initializeData
    );
    proxyInstance = await ethers.getContractAt(
      "RaribleExchangeWrapperUpgradeable",
      transparentUpgradeableProxy.address
    );
  });

  it("Should be able to upgrade the ExchangeWrapper and use new functionality", async function () {
    /* 1. Deploy the ProxyUpgradeAction contract */
    const ProxyUpgradeAction = await ethers.getContractFactory(
      "ProxyUpgradeAction"
    );
    const proxyUpgradeAction = await ProxyUpgradeAction.deploy();

    /* 2. Check that the first implementation is correctly set */
    const implFirst = await proxyAdmin.getProxyImplementation(
      transparentUpgradeableProxy.address
    );
    expect(implFirst).to.equal(raribleExchangeWrapperUpgradeable.address);

    /* 3. Check that immutable variables are correctly set */
    const weth = await proxyInstance.weth();
    expect(weth).to.equal(wrapperSettings.weth);
    const exchangeV2 = await proxyInstance.exchangeV2();
    expect(exchangeV2).to.equal(wrapperSettings.marketplaces[1]);

    /* 4. Deploy a new Implementation of the ExchangeWrapper */
    const RaribleExchangeWrapperUpgradeableV2 = await ethers.getContractFactory(
      "RaribleExchangeWrapperUpgradeableV2"
    );
    const raribleUpgradableExchangeWrapperV2 =
      await RaribleExchangeWrapperUpgradeableV2.deploy();

    /* 5. Deploy the TestHelper contract */
    const TestHelper = await ethers.getContractFactory("TestHelper");
    const testHelper = await TestHelper.deploy();

    /* 6. Prepare the data to upgrade the Proxy */
    const newImpl = raribleUpgradableExchangeWrapperV2.address;
    const actionUpgradeProxydata = await testHelper.encodeProxyUpgradeCall(
      proxyAdmin.address,
      transparentUpgradeableProxy.address,
      newImpl
    );

    /* 7. Execute the upgrade */
    await upgradeExecutor.execute(
      proxyUpgradeAction.address,
      actionUpgradeProxydata
    );

    /* 8. Check that the second implementation is correctly set */
    const implSecond = await proxyAdmin.getProxyImplementation(
      transparentUpgradeableProxy.address
    );
    expect(implSecond).to.equal(newImpl);
  });

  it("Should be able to update marketplaces addresses", async function () {
    /* 1. Deploy the UpdateAddressAction contract */
    const UpdateAddressAction = await ethers.getContractFactory(
      "UpdateAddressAction"
    );
    const updateAddressAction = await UpdateAddressAction.deploy();

    /* 2. Deploy the TestHelperV7 contract */
    const TestHelperV7 = await ethers.getContractFactory("TestHelperV7");
    const testHelperV7 = await TestHelperV7.deploy();

    /* 3. Prepare the data to upgrade the Proxy */
    const actionUpdateAdressData = await testHelperV7.encodeAddressUpdateCall(
      transparentUpgradeableProxy.address,
      0,
      nonZeroAddress
    );

    /* 4. Execute the update */
    await upgradeExecutor.execute(
      updateAddressAction.address,
      actionUpdateAdressData
    );

    /* 5. Check that the new marketplace is correctly set */
    const proxyInstance = await ethers.getContractAt(
      "RaribleExchangeWrapperUpgradeable",
      transparentUpgradeableProxy.address
    );
    const exchangeAddress = await proxyInstance.exchangeV2();
    expect(exchangeAddress).to.equal(nonZeroAddress);

    /* 6. Update the marketplace again */
    const actionUpdateAdressData2 = await testHelperV7.encodeAddressUpdateCall(
      transparentUpgradeableProxy.address,
      0,
      twoAddress
    );

    /* 7. Execute the update */
    await upgradeExecutor.execute(
      updateAddressAction.address,
      actionUpdateAdressData2
    );

    /* 8. Check that the new marketplace is correctly set */
    const newMarketplace2 = await proxyInstance.exchangeV2();
    expect(newMarketplace2).to.equal(twoAddress);
  });
});
