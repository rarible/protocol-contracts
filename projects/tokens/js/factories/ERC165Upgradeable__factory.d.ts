import { Signer } from "ethers";
import type { Provider } from "@ethersproject/providers";
import type { ERC165Upgradeable, ERC165UpgradeableInterface } from "../ERC165Upgradeable";
export declare class ERC165Upgradeable__factory {
    static readonly abi: readonly [{
        readonly inputs: readonly [{
            readonly internalType: "bytes4";
            readonly name: "interfaceId";
            readonly type: "bytes4";
        }];
        readonly name: "supportsInterface";
        readonly outputs: readonly [{
            readonly internalType: "bool";
            readonly name: "";
            readonly type: "bool";
        }];
        readonly stateMutability: "view";
        readonly type: "function";
    }];
    static createInterface(): ERC165UpgradeableInterface;
    static connect(address: string, signerOrProvider: Signer | Provider): ERC165Upgradeable;
}
