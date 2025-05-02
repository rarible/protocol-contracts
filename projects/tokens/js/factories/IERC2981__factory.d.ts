import { Signer } from "ethers";
import type { Provider } from "@ethersproject/providers";
import type { IERC2981, IERC2981Interface } from "../IERC2981";
export declare class IERC2981__factory {
    static readonly abi: readonly [{
        readonly inputs: readonly [{
            readonly internalType: "uint256";
            readonly name: "_tokenId";
            readonly type: "uint256";
        }, {
            readonly internalType: "uint256";
            readonly name: "_salePrice";
            readonly type: "uint256";
        }];
        readonly name: "royaltyInfo";
        readonly outputs: readonly [{
            readonly internalType: "address";
            readonly name: "receiver";
            readonly type: "address";
        }, {
            readonly internalType: "uint256";
            readonly name: "royaltyAmount";
            readonly type: "uint256";
        }];
        readonly stateMutability: "view";
        readonly type: "function";
    }];
    static createInterface(): IERC2981Interface;
    static connect(address: string, signerOrProvider: Signer | Provider): IERC2981;
}
