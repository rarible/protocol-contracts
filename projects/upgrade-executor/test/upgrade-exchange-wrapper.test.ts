import { ethers, network } from "hardhat";
import { expect } from "chai";
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import {
  getWrapperSettings,
  nonZeroAddress,
  zeroAddress,
} from "../../hardhat-deploy/utils/exchangeWrapperSettings";

describe("Upgrade Executor, ExchangeWrapperUpgradeable", function () {
  let signers: SignerWithAddress[];
  let deployer: SignerWithAddress;

  before(async () => {
    signers = await ethers.getSigners();
    deployer = signers[0];
  });

  it("Should be able to upgrade the ExchangeWrapper and use new functionality", async function () {
    /* 1. Get dependencies/settings for the ExchangeWrapperUpgradeable implementation deployment & construction */
    const exchangeV2Address = zeroAddress;
    const wrapperSettings = getWrapperSettings(network.name);
    wrapperSettings.marketplaces[1] = exchangeV2Address;

    /* 2. Deploy an initial ExchangeWrapperUpgradeable Implementation */
    const RaribleExchangeWrapperUpgradeable = await ethers.getContractFactory(
      "RaribleExchangeWrapperUpgradeable"
    );
    const raribleExchangeWrapperUpgradeable =
      await RaribleExchangeWrapperUpgradeable.deploy();

    /* 3. Deploy the TestHelper contract */
    const TestHelper = await ethers.getContractFactory("TestHelper");
    const testHelper = await TestHelper.deploy();

    /* 4. Deploy the UpgradeExecutor contract */
    const UpgradeExecutor = await ethers.getContractFactory("UpgradeExecutor");
    const upgradeExecutor = await UpgradeExecutor.deploy([deployer.address]);

    /* 5. Deploy the ProxyUpgradeAction contract */
    const ProxyUpgradeAction = await ethers.getContractFactory(
      "ProxyUpgradeAction"
    );
    const proxyUpgradeAction = await ProxyUpgradeAction.deploy();

    /* 6. Deploy the ProxyAdmin contract */
    const ProxyAdmin = await ethers.getContractFactory("ProxyAdmin");
    const proxyAdmin = await ProxyAdmin.deploy();

    /* 7. Transfer the ownership of the ProxyAdmin to the UpgradeExecutor */
    await proxyAdmin.transferOwnership(upgradeExecutor.address);

    /* 8 Encode initialization data */
    const initializeData =
      raribleExchangeWrapperUpgradeable.interface.encodeFunctionData(
        "__ExchangeWrapper_init_proxy",
        [
          wrapperSettings.marketplaces,
          wrapperSettings.weth,
          wrapperSettings.transferProxies,
          deployer.address,
        ]
      );

    /* 9. Deploy the TransparentUpgradeableProxy contract */
    const TransparentUpgradeableProxy = await ethers.getContractFactory(
      "TransparentUpgradeableProxy"
    );
    const transparentUpgradeableProxy =
      await TransparentUpgradeableProxy.deploy(
        raribleExchangeWrapperUpgradeable.address,
        proxyAdmin.address,
        initializeData
      );

    /* 10. Check that the first implementation is correctly set */
    const implFirst = await proxyAdmin.getProxyImplementation(
      transparentUpgradeableProxy.address
    );
    expect(implFirst).to.equal(raribleExchangeWrapperUpgradeable.address);

    /* 11 Check that immutable variables are correctly set */
    const proxyInstance = await ethers.getContractAt(
      "RaribleExchangeWrapperUpgradeable",
      transparentUpgradeableProxy.address
    );

    const weth = await proxyInstance.weth();
    expect(weth).to.equal(wrapperSettings.weth);
    const seaPort_1_6 = await proxyInstance.seaPort_1_6();
    expect(seaPort_1_6).to.equal(wrapperSettings.marketplaces[10]);
    const exchangeV2 = await proxyInstance.exchangeV2();
    expect(exchangeV2).to.equal(wrapperSettings.marketplaces[1]);

    /* 12. Deploy a new Implementation of the ExchangeWrapper */
    const RaribleExchangeWrapperUpgradeableV2 = await ethers.getContractFactory(
      "RaribleExchangeWrapperUpgradeableV2"
    );
    const raribleUpgradableExchangeWrapperV2 =
      await RaribleExchangeWrapperUpgradeableV2.deploy();

    /* 13. Prepare the data to upgrade the Proxy */
    const newImpl = raribleUpgradableExchangeWrapperV2.address;
    const actionUpgradeProxydata = await testHelper.encodeProxyUpgradeCall(
      proxyAdmin.address,
      transparentUpgradeableProxy.address,
      newImpl
    );

    /* 14. Execute the upgrade */
    await upgradeExecutor.execute(
      proxyUpgradeAction.address,
      actionUpgradeProxydata
    );

    /* 15. Check that the second implementation is correctly set */
    const implSecond = await proxyAdmin.getProxyImplementation(
      transparentUpgradeableProxy.address
    );
    expect(implSecond).to.equal(newImpl);

    /* 16. Check that the new immutable variables are correctly set */
    const proxyInstanceV2 = await ethers.getContractAt(
      "RaribleExchangeWrapperUpgradeableV2",
      transparentUpgradeableProxy.address
    );

    const wethV2 = await proxyInstanceV2.weth();
    expect(wethV2).to.equal(wrapperSettings.weth);
    const seaPort_1_6V2 = await proxyInstanceV2.seaPort_1_6();
    expect(seaPort_1_6V2).to.equal(wrapperSettings.marketplaces[10]);
    const exchangeV2V2 = await proxyInstanceV2.exchangeV2();
    expect(exchangeV2V2).to.equal(wrapperSettings.marketplaces[1]);

    /* 17. Initialize the new marketplace variable */
    await proxyInstanceV2.__initializeNewMarket(nonZeroAddress);
    const newMarketplace = await proxyInstanceV2.newMarket();
    expect(newMarketplace).to.equal(nonZeroAddress);
  });
});
