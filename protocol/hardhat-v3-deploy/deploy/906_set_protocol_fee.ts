// we import what we need from the @rocketh alias, see ../rocketh.ts
import {deployScript, artifacts} from '#rocketh';
import { getConfig } from '../sdk/utils.js';

// Protocol fee configuration
const FEE_RECEIVER = '0x053F171c0D0Cc9d76247D4d1CdDb280bf1131390';
const BUYER_FEE_BPS = 0;
const SELLER_FEE_BPS = 200;

// Helper to create a deployment object with address and abi
function createDeployment(address: string, artifact: any) {
	return {
		address,
		abi: artifact.abi,
	};
}

export default deployScript(
	async ({execute, get, namedAccounts, network}) => {
		const {deployer} = namedAccounts;

		console.log('deployer', deployer);

		const { deploy_meta, deploy_non_meta } = getConfig(network.chain.name);

		let contractName: string;
		let exchangeAddress: string;

		if (deploy_meta) {
			contractName = 'ExchangeMetaV2';
			const exchange = await get('ExchangeMetaV2');
			exchangeAddress = exchange.address;
		} else if (deploy_non_meta) {
			contractName = 'ExchangeV2';
			const exchange = await get('ExchangeV2');
			exchangeAddress = exchange.address;
		} else {
			throw new Error('No exchange deployment configured for this network');
		}

		// Create deployment object with abi for execute
		const exchangeWithAbi = createDeployment(exchangeAddress, artifacts.ExchangeV2);

		// Set protocol fee
		console.log(`Setting protocol fee on ${contractName}...`);
		console.log(`Fee receiver: ${FEE_RECEIVER}`);
		console.log(`Buyer fee: ${BUYER_FEE_BPS} bps`);
		console.log(`Seller fee: ${SELLER_FEE_BPS} bps`);

		const receipt = await execute(exchangeWithAbi, {
			account: deployer,
			functionName: 'setAllProtocolFeeData',
			args: [FEE_RECEIVER, BUYER_FEE_BPS, SELLER_FEE_BPS],
		});

		console.log(`Protocol fee set. Tx hash: ${receipt.transactionHash}`);
	},
	{tags: ['all', 'set-protocol-fee', '906']},
);
