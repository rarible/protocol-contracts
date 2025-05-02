import { Signer } from "ethers";
import type { Provider } from "@ethersproject/providers";
import type { EIP712MetaTransaction, EIP712MetaTransactionInterface } from "../EIP712MetaTransaction";
export declare class EIP712MetaTransaction__factory {
    static readonly abi: readonly [{
        readonly anonymous: false;
        readonly inputs: readonly [{
            readonly indexed: false;
            readonly internalType: "address";
            readonly name: "userAddress";
            readonly type: "address";
        }, {
            readonly indexed: false;
            readonly internalType: "address payable";
            readonly name: "relayerAddress";
            readonly type: "address";
        }, {
            readonly indexed: false;
            readonly internalType: "bytes";
            readonly name: "functionSignature";
            readonly type: "bytes";
        }];
        readonly name: "MetaTransactionExecuted";
        readonly type: "event";
    }, {
        readonly inputs: readonly [{
            readonly internalType: "address";
            readonly name: "userAddress";
            readonly type: "address";
        }, {
            readonly internalType: "bytes";
            readonly name: "functionSignature";
            readonly type: "bytes";
        }, {
            readonly internalType: "bytes32";
            readonly name: "sigR";
            readonly type: "bytes32";
        }, {
            readonly internalType: "bytes32";
            readonly name: "sigS";
            readonly type: "bytes32";
        }, {
            readonly internalType: "uint8";
            readonly name: "sigV";
            readonly type: "uint8";
        }];
        readonly name: "executeMetaTransaction";
        readonly outputs: readonly [{
            readonly internalType: "bytes";
            readonly name: "";
            readonly type: "bytes";
        }];
        readonly stateMutability: "payable";
        readonly type: "function";
    }, {
        readonly inputs: readonly [{
            readonly internalType: "address";
            readonly name: "user";
            readonly type: "address";
        }];
        readonly name: "getNonce";
        readonly outputs: readonly [{
            readonly internalType: "uint256";
            readonly name: "nonce";
            readonly type: "uint256";
        }];
        readonly stateMutability: "view";
        readonly type: "function";
    }];
    static createInterface(): EIP712MetaTransactionInterface;
    static connect(address: string, signerOrProvider: Signer | Provider): EIP712MetaTransaction;
}
