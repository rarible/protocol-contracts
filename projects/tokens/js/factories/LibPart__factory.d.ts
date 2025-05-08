import { Signer, ContractFactory, Overrides } from "ethers";
import type { Provider, TransactionRequest } from "@ethersproject/providers";
import type { PromiseOrValue } from "../common";
import type { LibPart, LibPartInterface } from "../LibPart";
type LibPartConstructorParams = [signer?: Signer] | ConstructorParameters<typeof ContractFactory>;
export declare class LibPart__factory extends ContractFactory {
    constructor(...args: LibPartConstructorParams);
    deploy(overrides?: Overrides & {
        from?: PromiseOrValue<string>;
    }): Promise<LibPart>;
    getDeployTransaction(overrides?: Overrides & {
        from?: PromiseOrValue<string>;
    }): TransactionRequest;
    attach(address: string): LibPart;
    connect(signer: Signer): LibPart__factory;
    static readonly bytecode = "0x60aa610024600b82828239805160001a607314601757fe5b30600052607381538281f3fe730000000000000000000000000000000000000000301460806040526004361060335760003560e01c806364d4c819146038575b600080fd5b603e6050565b60408051918252519081900360200190f35b7f397e04204c1e1a60ee8724b71f8244e10ab5f2e9009854d80f602bda21b59ebb8156fea264697066735822122069be0583fcc8af5fcc671f81feb8fbe8b0e068eb880e32c0cdbc410f6d01c05064736f6c63430007060033";
    static readonly abi: readonly [{
        readonly inputs: readonly [];
        readonly name: "TYPE_HASH";
        readonly outputs: readonly [{
            readonly internalType: "bytes32";
            readonly name: "";
            readonly type: "bytes32";
        }];
        readonly stateMutability: "view";
        readonly type: "function";
    }];
    static createInterface(): LibPartInterface;
    static connect(address: string, signerOrProvider: Signer | Provider): LibPart;
}
export {};
