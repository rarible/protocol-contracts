import { Signer } from "ethers";
import type { Provider } from "@ethersproject/providers";
import type { RoyaltiesV2Upgradeable, RoyaltiesV2UpgradeableInterface } from "../RoyaltiesV2Upgradeable";
export declare class RoyaltiesV2Upgradeable__factory {
    static readonly abi: readonly [{
        readonly anonymous: false;
        readonly inputs: readonly [{
            readonly indexed: false;
            readonly internalType: "uint256";
            readonly name: "tokenId";
            readonly type: "uint256";
        }, {
            readonly components: readonly [{
                readonly internalType: "address payable";
                readonly name: "account";
                readonly type: "address";
            }, {
                readonly internalType: "uint96";
                readonly name: "value";
                readonly type: "uint96";
            }];
            readonly indexed: false;
            readonly internalType: "struct LibPart.Part[]";
            readonly name: "royalties";
            readonly type: "tuple[]";
        }];
        readonly name: "RoyaltiesSet";
        readonly type: "event";
    }, {
        readonly inputs: readonly [{
            readonly internalType: "uint256";
            readonly name: "id";
            readonly type: "uint256";
        }];
        readonly name: "getRaribleV2Royalties";
        readonly outputs: readonly [{
            readonly components: readonly [{
                readonly internalType: "address payable";
                readonly name: "account";
                readonly type: "address";
            }, {
                readonly internalType: "uint96";
                readonly name: "value";
                readonly type: "uint96";
            }];
            readonly internalType: "struct LibPart.Part[]";
            readonly name: "";
            readonly type: "tuple[]";
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
    static createInterface(): RoyaltiesV2UpgradeableInterface;
    static connect(address: string, signerOrProvider: Signer | Provider): RoyaltiesV2Upgradeable;
}
