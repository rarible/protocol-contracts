import { Signer, ContractFactory, BigNumberish, Overrides } from "ethers";
import type { Provider, TransactionRequest } from "@ethersproject/providers";
import type { PromiseOrValue } from "../common";
import type { TestDeployContract, TestDeployContractInterface } from "../TestDeployContract";
type TestDeployContractConstructorParams = [signer?: Signer] | ConstructorParameters<typeof ContractFactory>;
export declare class TestDeployContract__factory extends ContractFactory {
    constructor(...args: TestDeployContractConstructorParams);
    deploy(_value1: PromiseOrValue<BigNumberish>, _value2: PromiseOrValue<BigNumberish>, overrides?: Overrides & {
        from?: PromiseOrValue<string>;
    }): Promise<TestDeployContract>;
    getDeployTransaction(_value1: PromiseOrValue<BigNumberish>, _value2: PromiseOrValue<BigNumberish>, overrides?: Overrides & {
        from?: PromiseOrValue<string>;
    }): TransactionRequest;
    attach(address: string): TestDeployContract;
    connect(signer: Signer): TestDeployContract__factory;
    static readonly bytecode = "0x608060405234801561001057600080fd5b506040516101163803806101168339818101604052604081101561003357600080fd5b50805160209091015160009190915560015560c3806100536000396000f3fe6080604052348015600f57600080fd5b506004361060465760003560e01c80633033413b14604b5780635d33a27f14606357806360d586f8146069578063c515205d14606f575b600080fd5b60516075565b60408051918252519081900360200190f35b6051607b565b60516081565b60516087565b60005481565b60015481565b60005490565b6001549056fea264697066735822122084259bdfca1e2a6f343107902e211a3844e8d43d88318f7344ca4c31ba6286c464736f6c63430007060033";
    static readonly abi: readonly [{
        readonly inputs: readonly [{
            readonly internalType: "uint256";
            readonly name: "_value1";
            readonly type: "uint256";
        }, {
            readonly internalType: "uint256";
            readonly name: "_value2";
            readonly type: "uint256";
        }];
        readonly stateMutability: "nonpayable";
        readonly type: "constructor";
    }, {
        readonly inputs: readonly [];
        readonly name: "getValue1";
        readonly outputs: readonly [{
            readonly internalType: "uint256";
            readonly name: "";
            readonly type: "uint256";
        }];
        readonly stateMutability: "view";
        readonly type: "function";
    }, {
        readonly inputs: readonly [];
        readonly name: "getValue2";
        readonly outputs: readonly [{
            readonly internalType: "uint256";
            readonly name: "";
            readonly type: "uint256";
        }];
        readonly stateMutability: "view";
        readonly type: "function";
    }, {
        readonly inputs: readonly [];
        readonly name: "value1";
        readonly outputs: readonly [{
            readonly internalType: "uint256";
            readonly name: "";
            readonly type: "uint256";
        }];
        readonly stateMutability: "view";
        readonly type: "function";
    }, {
        readonly inputs: readonly [];
        readonly name: "value2";
        readonly outputs: readonly [{
            readonly internalType: "uint256";
            readonly name: "";
            readonly type: "uint256";
        }];
        readonly stateMutability: "view";
        readonly type: "function";
    }];
    static createInterface(): TestDeployContractInterface;
    static connect(address: string, signerOrProvider: Signer | Provider): TestDeployContract;
}
export {};
