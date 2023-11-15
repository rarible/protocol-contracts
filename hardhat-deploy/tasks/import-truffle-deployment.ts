import { task } from 'hardhat/config';
import fs from 'fs/promises';
import path from 'path';
import { HardhatRuntimeEnvironment } from 'hardhat/types';
import { DeploymentsExtension } from 'hardhat-deploy/types';
import "hardhat-deploy";
import { Console } from 'console';


task(
  'import-truffle-deployments',
  'Saves Truffle deployments to Hardhat. Use --network to choose the deployments path to save to'
)
  .addParam('artifacts', 'Artifacts path to export from')
  .setAction(
    async (
      taskArgs: { artifacts: string },
      hre: HardhatRuntimeEnvironment
    ) => {
      const { deployments, network } = hre;
      const { log, save, getExtendedArtifact } = deployments as DeploymentsExtension;

      const chainId = network.config.chainId!;
      const ARTIFACTS_PATH = path.resolve(taskArgs.artifacts);
      const artifacts = await fs.readdir(ARTIFACTS_PATH);
      console.log(JSON.stringify(artifacts));
      const ignoreList = ["CryptoPunksMarket", "ExchangeOrdersHolderV1", "ExchangeStateV1", "ExchangeV1", "Locking", "TransferProxyForDeprecated"];
      const truffleDeployedAddresses = await Promise.all(
        artifacts.map(async (artifactPath) => {
          const file = await import(ARTIFACTS_PATH + '/' + artifactPath);
          const address = file.networks[chainId]?.address;
          console.log( address);
          if (address && !ignoreList.includes(file.contractName)) return [file.contractName, address];
          else return [];
        })
      ).then((result) => result.filter((p) => p.length !== 0));

      await Promise.all(
        truffleDeployedAddresses.map(async ([name, address]) => {
            console.log(name, address)
          await save(name, {
            address,
            ...(await getExtendedArtifact(name))
          });
        })
      );

      console.log(`Done! Exported ${truffleDeployedAddresses.length} deployed contracts`);
    }
  );

export default {}; // This export is necessary to satisfy TypeScript's module system
