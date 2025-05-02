import { Signer } from "ethers";
import type { Provider } from "@ethersproject/providers";
import type { RenderingContract, RenderingContractInterface } from "../RenderingContract";
export declare class RenderingContract__factory {
    static readonly abi: readonly [{
        readonly inputs: readonly [];
        readonly name: "renderingContract";
        readonly outputs: readonly [{
            readonly internalType: "contract ITokenURIGenerator";
            readonly name: "";
            readonly type: "address";
        }];
        readonly stateMutability: "view";
        readonly type: "function";
    }, {
        readonly inputs: readonly [{
            readonly internalType: "contract ITokenURIGenerator";
            readonly name: "_contract";
            readonly type: "address";
        }];
        readonly name: "setRenderingContract";
        readonly outputs: readonly [];
        readonly stateMutability: "nonpayable";
        readonly type: "function";
    }];
    static createInterface(): RenderingContractInterface;
    static connect(address: string, signerOrProvider: Signer | Provider): RenderingContract;
}
