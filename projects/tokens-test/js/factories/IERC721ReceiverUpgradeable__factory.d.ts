import { Signer } from "ethers";
import type { Provider } from "@ethersproject/providers";
import type { IERC721ReceiverUpgradeable, IERC721ReceiverUpgradeableInterface } from "../IERC721ReceiverUpgradeable";
export declare class IERC721ReceiverUpgradeable__factory {
    static readonly abi: readonly [{
        readonly inputs: readonly [{
            readonly internalType: "address";
            readonly name: "operator";
            readonly type: "address";
        }, {
            readonly internalType: "address";
            readonly name: "from";
            readonly type: "address";
        }, {
            readonly internalType: "uint256";
            readonly name: "tokenId";
            readonly type: "uint256";
        }, {
            readonly internalType: "bytes";
            readonly name: "data";
            readonly type: "bytes";
        }];
        readonly name: "onERC721Received";
        readonly outputs: readonly [{
            readonly internalType: "bytes4";
            readonly name: "";
            readonly type: "bytes4";
        }];
        readonly stateMutability: "nonpayable";
        readonly type: "function";
    }];
    static createInterface(): IERC721ReceiverUpgradeableInterface;
    static connect(address: string, signerOrProvider: Signer | Provider): IERC721ReceiverUpgradeable;
}
