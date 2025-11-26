
import type { BaseContract } from "ethers";
import type { HardhatEthers } from "@nomicfoundation/hardhat-ethers/types";
import { ProxyAdmin__factory, type ProxyAdmin } from "../types/ethers-contracts/index.js";

// import { upgrades } from "hardhat";

export type DeployTransparentProxyParams<T extends BaseContract> = {
    contractName: string;
    initFunction?: string;
    initArgs?: unknown[];
    proxyOwner?: string;
    implementationArgs?: unknown[];
    contractAtName?: string;
  };
  
export type DeployTransparentProxyResult<T extends BaseContract> = {
    proxyAdmin: ProxyAdmin;
    implementation: BaseContract;
    proxy: BaseContract;
    instance: T;
  };
  
  export async function deployTransparentProxy<T extends BaseContract>(ethers: HardhatEthers, {
    
    contractName,
    initFunction,
    initArgs = [],
    proxyOwner,
    implementationArgs = [],
    contractAtName,
  }: DeployTransparentProxyParams<T>): Promise<DeployTransparentProxyResult<T>> {
    const [defaultSigner] = await ethers.getSigners();
    const ownerAddress = proxyOwner ?? (await defaultSigner.getAddress());
  
    // 1. Deploy implementation
    const implementation = await ethers.deployContract(contractName, implementationArgs);
    await implementation.waitForDeployment();
  
    // 2. Encode optional initializer
    const initData =
      initFunction != null
        ? implementation.interface.encodeFunctionData(initFunction, initArgs)
        : "0x";
  
    // 3. Deploy TransparentUpgradeableProxy
    const TransparentProxy = await ethers.getContractFactory("TransparentUpgradeableProxy");
    const proxy = await TransparentProxy.deploy(
      await implementation.getAddress(),
      ownerAddress, // ✅ initialOwner for the internally created ProxyAdmin
      initData,
    );
    await proxy.waitForDeployment();
  
    // 4. Find the ProxyAdmin address from the AdminChanged event
    const deployTx = proxy.deploymentTransaction();
    if (!deployTx) {
      throw new Error("Proxy deployment transaction not found");
    }
  
    const receipt = await deployTx.wait();
    const iface = TransparentProxy.interface;
  
    let proxyAdminAddress: string | null = null;
    for (const log of receipt?.logs ?? []) {
      try {
        const parsed = iface.parseLog(log);
        if (parsed?.name === "AdminChanged") {
          // event AdminChanged(address previousAdmin, address newAdmin)
          proxyAdminAddress = parsed.args[1] as string;
          break;
        }
      } catch {
        // Not an AdminChanged log for this contract, ignore
      }
    }
  
    if (!proxyAdminAddress) {
      throw new Error("ProxyAdmin address not found in AdminChanged event");
    }
  
    // 5. Connect to the internally created ProxyAdmin
    const proxyAdmin = ProxyAdmin__factory.connect(proxyAdminAddress, defaultSigner);
  
    // 6. Get typed instance at proxy address
    const instance = (await ethers.getContractAt(
      contractAtName ?? contractName,
      await proxy.getAddress(),
    )) as unknown as T;
  
    return {
      proxyAdmin,
      implementation,
      proxy,
      instance,
    };
  }