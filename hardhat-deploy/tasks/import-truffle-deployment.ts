import { task } from 'hardhat/config';
import fs from 'fs/promises';
import path from 'path';
import { HardhatRuntimeEnvironment } from 'hardhat/types';
import { DeploymentsExtension } from 'hardhat-deploy/types';
import "hardhat-deploy";
import { Console } from 'console';

/*
npx hardhat import-truffle-deployments --network polygon_dev --artifacts ../deploy/build/contracts 
*/
const adminProxyAddress = "0x83fEAb44931FC867273D2EebCc75965EbE50134A"

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
      console.log(chainId)
      const ARTIFACTS_PATH = path.resolve(taskArgs.artifacts);
      const artifacts = await fs.readdir(ARTIFACTS_PATH);
      console.log(JSON.stringify(artifacts));
      
      const ignoreList = [
        //not in this repo
        "CryptoPunksMarket", 
        "ExchangeOrdersHolderV1", 
        "ExchangeStateV1", 
        "ExchangeV1", 
        "Locking", 
        "TransferProxyForDeprecated", 
        "Migrations",

        //not needed
        "AuctionHouse1155",
        "AuctionHouse721",
        "PunkTransferProxy",
        "TestERC20",
        "Wrapper",

        //proxy
        "RoyaltiesRegistry",
        "ExchangeV2",
        "ERC1155Rarible",
        "ERC721RaribleMinimal",
        "ERC721Rarible",
        "ERC721RaribleMeta",
        "ERC1155RaribleMeta",
        "ExchangeMetaV2",
      ];
      
      const truffleDeployedAddresses = await Promise.all(
        artifacts.map(async (artifactPath) => {
          const file = await import(ARTIFACTS_PATH + '/' + artifactPath);
          const address = file.networks[chainId]?.address;
          if (address && !ignoreList.includes(file.contractName)) return [file.contractName, address];
          else return [];
        })
      ).then((result) => result.filter((p) => p.length !== 0));

      console.log(truffleDeployedAddresses)

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

      const proxy = [ 
        "RoyaltiesRegistry",
        "ExchangeV2",
        "ERC1155Rarible",
        "ERC721RaribleMinimal",
        "ERC721Rarible",
        "ERC721RaribleMeta",
        "ERC1155RaribleMeta",
        "ExchangeMetaV2",
      ]

      const proxyAddresses = await Promise.all(
        artifacts.map(async (artifactPath) => {
          const file = await import(ARTIFACTS_PATH + '/' + artifactPath);
          const address = file.networks[chainId]?.address;
          if (address && proxy.includes(file.contractName)) return [file.contractName, address];
          else return [];
        })
      ).then((result) => result.filter((p) => p.length !== 0));

      //console.log(proxyAddresses) 
      
      console.log()
      console.log("proxies:")
      console.log()
      await save("DefaultProxyAdmin", {
        address: adminProxyAddress,
        ...(await getExtendedArtifact("ProxyAdmin"))
      });

      for (const [contractName, address] of proxyAddresses) {
        await save(contractName + "_Proxy", {
          address: address,
          ...(await getExtendedArtifact("TransparentUpgradeableProxy"))
        });
        console.log(contractName,"==============", address)
        console.log()
      }
    }
  );

export default {}; // This export is necessary to satisfy TypeScript's module system
