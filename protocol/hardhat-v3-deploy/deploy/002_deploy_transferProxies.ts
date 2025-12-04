// we import what we need from the @rocketh alias, see ../rocketh.ts
import {deployScript, artifacts} from '#rocketh';

export default deployScript(
	async ({deployViaProxy, namedAccounts}) => {
		const {deployer} = namedAccounts;

		console.log('deployer', deployer);

		// Deploy and initialise 4 transfer proxies using common helper
		await deployTransferProxy({
			name: 'TransferProxy',
			artifact: artifacts.TransferProxy,
			initMethod: '__TransferProxy_init',
			deployViaProxy,
			deployer,
		});

		await deployTransferProxy({
			name: 'ERC20TransferProxy',
			artifact: artifacts.ERC20TransferProxy,
			initMethod: '__ERC20TransferProxy_init',
			deployViaProxy,
			deployer,
		});

		await deployTransferProxy({
			name: 'ERC721LazyMintTransferProxy',
			artifact: artifacts.ERC721LazyMintTransferProxy,
			initMethod: '__ERC721LazyMintTransferProxy_init',
			deployViaProxy,
			deployer,
		});

		await deployTransferProxy({
			name: 'ERC1155LazyMintTransferProxy',
			artifact: artifacts.ERC1155LazyMintTransferProxy,
			initMethod: '__ERC1155LazyMintTransferProxy_init',
			deployViaProxy,
			deployer,
		});
	},
	{tags: ['all', 'all-no-tokens', 'all-with-sanity-check', 'deploy-transfer-proxies', '002']},
);

interface DeployTransferProxyParams {
	name: string;
	artifact: any;
	initMethod: string;
	deployViaProxy: any;
	deployer: string;
}

async function deployTransferProxy({
	name,
	artifact,
	initMethod,
	deployViaProxy,
	deployer,
}: DeployTransferProxyParams) {
	await deployViaProxy(
		name,
		{
			account: deployer,
			artifact,
			args: [],
		},
		{
			owner: deployer,
			linkedData: {
				deployer,
			},
			execute: {
				methodName: initMethod,
				args: [deployer],
			},
			proxyContract: 'SharedAdminOptimizedTransparentProxy',
			deterministic: false,
		},
	);
}
