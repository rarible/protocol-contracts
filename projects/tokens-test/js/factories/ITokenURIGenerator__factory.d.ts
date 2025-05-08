import { Signer } from "ethers";
import type { Provider } from "@ethersproject/providers";
import type { ITokenURIGenerator, ITokenURIGeneratorInterface } from "../ITokenURIGenerator";
export declare class ITokenURIGenerator__factory {
    static readonly abi: readonly [{
        readonly inputs: readonly [{
            readonly internalType: "uint256";
            readonly name: "tokenId";
            readonly type: "uint256";
        }];
        readonly name: "tokenURI";
        readonly outputs: readonly [{
            readonly internalType: "string";
            readonly name: "";
            readonly type: "string";
        }];
        readonly stateMutability: "view";
        readonly type: "function";
    }];
    static createInterface(): ITokenURIGeneratorInterface;
    static connect(address: string, signerOrProvider: Signer | Provider): ITokenURIGenerator;
}
