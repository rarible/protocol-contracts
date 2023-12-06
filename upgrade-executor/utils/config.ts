import * as fs from 'fs';
import * as yaml from 'js-yaml';

export interface IContractsTransfer {
    ownable: { [key: string]: string };
    accessControl: { [key: string]: string };
}

export async function loadContractsTransferSettings(filePath: string): Promise<IContractsTransfer> {
    try {
        const fileContents = await fs.promises.readFile(filePath, 'utf8');
        const data = yaml.load(fileContents) as any;
        const settings: IContractsTransfer = {
            ownable: { ...data.contracts.ownable },
            accessControl: { ...data.contracts.accessControl }
        };

        return settings;
    } catch (e) {
        console.error(e);
        throw e; // re-throw the error to be handled by the caller
    }
}
