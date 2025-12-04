// we import what we need from the @rocketh alias, see ../rocketh.ts
import {deployScript, artifacts} from '#rocketh';
import { getConfig } from '../sdk/utils.js';

export default deployScript(
	async ({deployViaProxy, deploy, get, namedAccounts, network}) => {
		const {deployer} = namedAccounts;

		console.log('deployer', deployer);

		// Get deployed transfer proxies
		const transferProxyDeployment = await get('TransferProxy');
		const erc721LazyMintTransferProxyDeployment = await get('ERC721LazyMintTransferProxy');

		const { deploy_meta, deploy_non_meta } = getConfig(network.chain.name);

		// Deploy ERC721 with meta support if needed
		if (deploy_meta) {
			await deployERC721TokenAndFactory({
				tokenName: 'ERC721RaribleMeta',
				beaconName: 'ERC721RaribleMinimalBeaconMeta',
				tokenArtifact: artifacts.ERC721RaribleMeta,
				beaconArtifact: artifacts.ERC721RaribleMinimalBeaconMeta,
				deployViaProxy,
				deploy,
        get,
				deployer,
				transferProxyAddress: transferProxyDeployment.address,
				erc721LazyMintTransferProxyAddress: erc721LazyMintTransferProxyDeployment.address,
			});
		}

		if (deploy_non_meta) {
			await deployERC721TokenAndFactory({
				tokenName: 'ERC721RaribleMinimal',
				beaconName: 'ERC721RaribleMinimalBeacon',
				tokenArtifact: artifacts.ERC721RaribleMinimal,
				beaconArtifact: artifacts.ERC721RaribleMinimalBeacon,
				deployViaProxy,
				deploy,
        get,
				deployer,
				transferProxyAddress: transferProxyDeployment.address,
				erc721LazyMintTransferProxyAddress: erc721LazyMintTransferProxyDeployment.address,
			});
		}
	},
	{tags: ['all', 'tokens', 'erc721', 'all-with-sanity-check', '004'], dependencies: ['002']},
);

interface DeployERC721Params {
	tokenName: string;
	beaconName: string;
	tokenArtifact: any;
	beaconArtifact: any;
	deployViaProxy: any;
	deploy: any;
  get: any;
	deployer: string;
	transferProxyAddress: string;
	erc721LazyMintTransferProxyAddress: string;
}

async function deployERC721TokenAndFactory({
	tokenName,
	beaconName,
	tokenArtifact,
	beaconArtifact,
	deployViaProxy,
	deploy,
  get,
	deployer,
	transferProxyAddress,
	erc721LazyMintTransferProxyAddress,
}: DeployERC721Params) {
	// Deploy token via proxy
	const erc721Deployment = await deployViaProxy(
		tokenName,
		{
			account: deployer,
			artifact: tokenArtifact,
			args: [],
		},
		{
			owner: deployer,
			linkedData: {
				deployer,
			},
			execute: {
				methodName: '__ERC721Rarible_init',
				args: ['Rarible', 'RARI', 'ipfs:/', '', transferProxyAddress, erc721LazyMintTransferProxyAddress, deployer],
			},
			proxyContract: 'SharedAdminOptimizedTransparentProxy',
			deterministic: false,
		}
	);
	// Get implementation address (rocketh names it with _Implementation suffix)
	const erc721Implementation = await get(tokenName + "_Implementation");
  

	// Deploy beacon with implementation address
	const beaconDeployment = await deploy(beaconName, {
		account: deployer,
		artifact: beaconArtifact,
		args: [erc721Implementation.address, deployer],
		linkedData: {
			deployer,
		},
	});

	// Deploy factory
	await deploy('ERC721RaribleFactoryC2', {
		account: deployer,
		artifact: artifacts.ERC721RaribleFactoryC2,
		args: [beaconDeployment.address, transferProxyAddress, erc721LazyMintTransferProxyAddress],
		linkedData: {
			deployer,
		},
	});
}
