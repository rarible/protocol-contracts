import { Signer, ContractFactory, Overrides } from "ethers";
import type { Provider, TransactionRequest } from "@ethersproject/providers";
import type { PromiseOrValue } from "../../../../../common";
import type { LibClone, LibCloneInterface } from "../../../../../lib/solady/src/utils/LibClone";
type LibCloneConstructorParams = [signer?: Signer] | ConstructorParameters<typeof ContractFactory>;
export declare class LibClone__factory extends ContractFactory {
    constructor(...args: LibCloneConstructorParams);
    deploy(overrides?: Overrides & {
        from?: PromiseOrValue<string>;
    }): Promise<LibClone>;
    getDeployTransaction(overrides?: Overrides & {
        from?: PromiseOrValue<string>;
    }): TransactionRequest;
    attach(address: string): LibClone;
    connect(signer: Signer): LibClone__factory;
    static readonly bytecode = "0x60566037600b82828239805160001a607314602a57634e487b7160e01b600052600060045260246000fd5b30600052607381538281f3fe73000000000000000000000000000000000000000030146080604052600080fdfea2646970667358221220719f0e848e844023cfa2dbc9c00e644cad026bf1d23c2661a954ac41aab98e0764736f6c63430008140033";
    static readonly abi: readonly [{
        readonly inputs: readonly [];
        readonly name: "DeploymentFailed";
        readonly type: "error";
    }, {
        readonly inputs: readonly [];
        readonly name: "ETHTransferFailed";
        readonly type: "error";
    }, {
        readonly inputs: readonly [];
        readonly name: "SaltDoesNotStartWith";
        readonly type: "error";
    }];
    static createInterface(): LibCloneInterface;
    static connect(address: string, signerOrProvider: Signer | Provider): LibClone;
}
export {};
