import { Signer } from "ethers";
import type { Provider } from "@ethersproject/providers";
import type { IERC4906, IERC4906Interface } from "../IERC4906";
export declare class IERC4906__factory {
    static readonly abi: readonly [{
        readonly anonymous: false;
        readonly inputs: readonly [{
            readonly indexed: false;
            readonly internalType: "uint256";
            readonly name: "_fromTokenId";
            readonly type: "uint256";
        }, {
            readonly indexed: false;
            readonly internalType: "uint256";
            readonly name: "_toTokenId";
            readonly type: "uint256";
        }];
        readonly name: "BatchMetadataUpdate";
        readonly type: "event";
    }, {
        readonly anonymous: false;
        readonly inputs: readonly [{
            readonly indexed: false;
            readonly internalType: "uint256";
            readonly name: "_tokenId";
            readonly type: "uint256";
        }];
        readonly name: "MetadataUpdate";
        readonly type: "event";
    }];
    static createInterface(): IERC4906Interface;
    static connect(address: string, signerOrProvider: Signer | Provider): IERC4906;
}
