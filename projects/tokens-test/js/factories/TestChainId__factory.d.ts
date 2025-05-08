import { Signer, ContractFactory, Overrides } from "ethers";
import type { Provider, TransactionRequest } from "@ethersproject/providers";
import type { PromiseOrValue } from "../common";
import type { TestChainId, TestChainIdInterface } from "../TestChainId";
type TestChainIdConstructorParams = [signer?: Signer] | ConstructorParameters<typeof ContractFactory>;
export declare class TestChainId__factory extends ContractFactory {
    constructor(...args: TestChainIdConstructorParams);
    deploy(overrides?: Overrides & {
        from?: PromiseOrValue<string>;
    }): Promise<TestChainId>;
    getDeployTransaction(overrides?: Overrides & {
        from?: PromiseOrValue<string>;
    }): TransactionRequest;
    attach(address: string): TestChainId;
    connect(signer: Signer): TestChainId__factory;
    static readonly bytecode = "0x6080604052348015600f57600080fd5b50607f8061001e6000396000f3fe6080604052348015600f57600080fd5b506004361060285760003560e01c8063564b81ef14602d575b600080fd5b60336045565b60408051918252519081900360200190f35b469056fea264697066735822122083a3c7577608057b94e95987022c0242abebad5b79c82108f03475d373fe19a164736f6c63430007060033";
    static readonly abi: readonly [{
        readonly inputs: readonly [];
        readonly name: "getChainID";
        readonly outputs: readonly [{
            readonly internalType: "uint256";
            readonly name: "id";
            readonly type: "uint256";
        }];
        readonly stateMutability: "pure";
        readonly type: "function";
    }];
    static createInterface(): TestChainIdInterface;
    static connect(address: string, signerOrProvider: Signer | Provider): TestChainId;
}
export {};
