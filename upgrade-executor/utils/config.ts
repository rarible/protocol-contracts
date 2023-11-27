import * as fs from 'fs';
import * as yaml from 'js-yaml';

export interface IContractsTransfer {
    adminProxy: string;
    contracts: { [key: string]: string };
    nonupgradable: { [key: string]: string };
}

export async function loadContractsTransferSettings(filePath: string): Promise<IContractsTransfer> {
    try {
        const fileContents = await fs.promises.readFile(filePath, 'utf8');
        const data = yaml.load(fileContents) as any;

        const settings: IContractsTransfer = {
            adminProxy: data.contracts.AdminProxy,
            contracts: { ...data.contracts.transparentProxies },
            nonupgradable: { ...data.nonupgradable }
        };

        return settings;
    } catch (e) {
        console.error(e);
        throw e; // re-throw the error to be handled by the caller
    }
}
