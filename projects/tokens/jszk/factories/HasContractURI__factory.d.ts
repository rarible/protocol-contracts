import { Signer } from "ethers";
import type { Provider } from "@ethersproject/providers";
import type { HasContractURI, HasContractURIInterface } from "../HasContractURI";
export declare class HasContractURI__factory {
    static readonly abi: readonly [{
        readonly inputs: readonly [];
        readonly name: "contractURI";
        readonly outputs: readonly [{
            readonly internalType: "string";
            readonly name: "";
            readonly type: "string";
        }];
        readonly stateMutability: "view";
        readonly type: "function";
    }, {
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
    static createInterface(): HasContractURIInterface;
    static connect(address: string, signerOrProvider: Signer | Provider): HasContractURI;
}
