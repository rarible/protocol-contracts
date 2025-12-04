// we import what we need from the @rocketh alias, see ../rocketh.ts
import {deployScript, artifacts} from '#rocketh';
import { getConfig } from '../sdk/utils.js';

export default deployScript(
	async ({deployViaProxy, deploy, get, namedAccounts, network}) => {
		const {deployer} = namedAccounts;

		console.log('deployer', deployer);

		// Get deployed transfer proxies
		const transferProxyDeployment = await get('TransferProxy');
		const erc1155LazyMintTransferProxyDeployment = await get('ERC1155LazyMintTransferProxy');

		const { deploy_meta, deploy_non_meta } = getConfig(network.chain.name);

		// Deploy ERC1155 with meta support if needed
		if (deploy_meta) {
			await deployERC1155TokenAndFactory({
				tokenName: 'ERC1155RaribleMeta',
				beaconName: 'ERC1155RaribleBeaconMeta',
				tokenArtifact: artifacts.ERC1155RaribleMeta,
				beaconArtifact: artifacts.ERC1155RaribleBeaconMeta,
				deployViaProxy,
				deploy,
				get,
				deployer,
				transferProxyAddress: transferProxyDeployment.address,
				erc1155LazyMintTransferProxyAddress: erc1155LazyMintTransferProxyDeployment.address,
			});
		}

		if (deploy_non_meta) {
			await deployERC1155TokenAndFactory({
				tokenName: 'ERC1155Rarible',
				beaconName: 'ERC1155RaribleBeacon',
				tokenArtifact: artifacts.ERC1155Rarible,
				beaconArtifact: artifacts.ERC1155RaribleBeacon,
				deployViaProxy,
				deploy,
				get,
				deployer,
				transferProxyAddress: transferProxyDeployment.address,
				erc1155LazyMintTransferProxyAddress: erc1155LazyMintTransferProxyDeployment.address,
			});
		}
	},
	{tags: ['all', 'tokens', 'erc1155', 'all-with-sanity-check', '005'], dependencies: ['002']},
);

interface DeployERC1155Params {
	tokenName: string;
	beaconName: string;
	tokenArtifact: any;
	beaconArtifact: any;
	deployViaProxy: any;
	deploy: any;
	get: any;
	deployer: string;
	transferProxyAddress: string;
	erc1155LazyMintTransferProxyAddress: string;
}

async function deployERC1155TokenAndFactory({
	tokenName,
	beaconName,
	tokenArtifact,
	beaconArtifact,
	deployViaProxy,
	deploy,
	get,
	deployer,
	transferProxyAddress,
	erc1155LazyMintTransferProxyAddress,
}: DeployERC1155Params) {
	// Deploy token via proxy
	await deployViaProxy(
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
				methodName: '__ERC1155Rarible_init',
				args: ['Rarible', 'RARI', 'ipfs:/', '', transferProxyAddress, erc1155LazyMintTransferProxyAddress, deployer],
			},
			proxyContract: 'SharedAdminOptimizedTransparentProxy',
			deterministic: false,
		}
	);

	// Get implementation address (rocketh names it with _Implementation suffix)
	const erc1155Implementation = await get(tokenName + "_Implementation");

	// Deploy beacon with implementation address
	const beaconDeployment = await deploy(beaconName, {
		account: deployer,
		artifact: beaconArtifact,
		args: [erc1155Implementation.address, deployer],
		linkedData: {
			deployer,
		},
	});

	// Deploy factory
	await deploy('ERC1155RaribleFactoryC2', {
		account: deployer,
		artifact: artifacts.ERC1155RaribleFactoryC2,
		args: [beaconDeployment.address, transferProxyAddress, erc1155LazyMintTransferProxyAddress],
		linkedData: {
			deployer,
		},
	});
}
