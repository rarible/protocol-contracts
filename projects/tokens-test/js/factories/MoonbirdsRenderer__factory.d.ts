import { Signer, ContractFactory, Overrides } from "ethers";
import type { Provider, TransactionRequest } from "@ethersproject/providers";
import type { PromiseOrValue } from "../common";
import type { MoonbirdsRenderer, MoonbirdsRendererInterface } from "../MoonbirdsRenderer";
type MoonbirdsRendererConstructorParams = [signer?: Signer] | ConstructorParameters<typeof ContractFactory>;
export declare class MoonbirdsRenderer__factory extends ContractFactory {
    constructor(...args: MoonbirdsRendererConstructorParams);
    deploy(overrides?: Overrides & {
        from?: PromiseOrValue<string>;
    }): Promise<MoonbirdsRenderer>;
    getDeployTransaction(overrides?: Overrides & {
        from?: PromiseOrValue<string>;
    }): TransactionRequest;
    attach(address: string): MoonbirdsRenderer;
    connect(signer: Signer): MoonbirdsRenderer__factory;
    static readonly bytecode = "0x608060405234801561001057600080fd5b50610579806100206000396000f3fe608060405234801561001057600080fd5b50600436106100625760003560e01c80630dbc4e74146100675780631db6151a146100f957806327b3a84b146101165780636b1e676b146101335780636c24a45714610164578063c87b56dd14610067575b600080fd5b6100846004803603602081101561007d57600080fd5b5035610181565b6040805160208082528351818301528351919283929083019185019080838360005b838110156100be5781810151838201526020016100a6565b50505050905090810190601f1680156100eb5780820380516001836020036101000a031916815260200191505b509250505060405180910390f35b6100846004803603602081101561010f57600080fd5b5035610196565b6100846004803603602081101561012c57600080fd5b5035610225565b6101506004803603602081101561014957600080fd5b5035610247565b604080519115158252519081900360200190f35b6100846004803603602081101561017a57600080fd5b503561024d565b6040805160208101909152600081525b919050565b60606101a1826102ff565b6040516020018060356103db823960350182805190602001908083835b602083106101dd5780518252601f1990920191602091820191016101be565b5181516020939093036101000a6000190180199091169216919091179052632e706e6760e01b92019182525060408051808303601b1901815260049092019052949350505050565b606060405180610120016040528060fc815260200161041060fc913992915050565b50600190565b6060610258826102ff565b60405160200180603861050c823960380180683f746f6b656e49643d60b81b81525060090182805190602001908083835b602083106102a85780518252601f199092019160209182019101610289565b5181516020939093036101000a600019018019909116921691909117905272267573654e6577417274776f726b3d7472756560681b92019182525060408051808303600c1901815260139092019052949350505050565b60608161032457506040805180820190915260018152600360fc1b6020820152610191565b8160005b811561033c57600101600a82049150610328565b60008167ffffffffffffffff8111801561035557600080fd5b506040519080825280601f01601f191660200182016040528015610380576020820181803683370190505b50859350905060001982015b83156103d157600a840660300160f81b828280600190039350815181106103af57fe5b60200101906001600160f81b031916908160001a905350600a8404935061038c565b5094935050505056fe68747470733a2f2f636f6c6c656374696f6e2d6173736574732e70726f6f662e78797a2f6d6f6f6e62697264732f696d616765732f5b7b2274726169745f74797065223a224261636b67726f756e64222c2276616c7565223a22426c7565227d2c7b2274726169745f74797065223a224265616b222c2276616c7565223a2253686f7274227d2c7b2274726169745f74797065223a22426f6479222c2276616c7565223a224372657363656e74227d2c7b2274726169745f74797065223a224665617468657273222c2276616c7565223a22507572706c65227d2c7b2274726169745f74797065223a2245796573222c2276616c7565223a224f70656e227d2c7b2274726169745f74797065223a224865616477656172222c2276616c7565223a2253706163652048656c6d6574227d5d68747470733a2f2f636f6c6c656374696f6e2d6173736574732e70726f6f662e78797a2f6d6f6f6e62697264732f656d6265642e68746d6ca264697066735822122047c429711e02061f5bf49499d7300b67130236e882d217f54abc2705a7b906f764736f6c63430007060033";
    static readonly abi: readonly [{
        readonly inputs: readonly [{
            readonly internalType: "uint256";
            readonly name: "tokenId";
            readonly type: "uint256";
        }];
        readonly name: "tokenURI";
        readonly outputs: readonly [{
            readonly internalType: "string";
            readonly name: "";
            readonly type: "string";
        }];
        readonly stateMutability: "view";
        readonly type: "function";
    }, {
        readonly inputs: readonly [{
            readonly internalType: "uint256";
            readonly name: "tokenId";
            readonly type: "uint256";
        }];
        readonly name: "attributesJson";
        readonly outputs: readonly [{
            readonly internalType: "string";
            readonly name: "";
            readonly type: "string";
        }];
        readonly stateMutability: "view";
        readonly type: "function";
    }, {
        readonly inputs: readonly [{
            readonly internalType: "uint256";
            readonly name: "tokenId";
            readonly type: "uint256";
        }];
        readonly name: "artworkUri";
        readonly outputs: readonly [{
            readonly internalType: "string";
            readonly name: "";
            readonly type: "string";
        }];
        readonly stateMutability: "view";
        readonly type: "function";
    }, {
        readonly inputs: readonly [{
            readonly internalType: "uint256";
            readonly name: "tokenId";
            readonly type: "uint256";
        }];
        readonly name: "alternateArtworkUri";
        readonly outputs: readonly [{
            readonly internalType: "string";
            readonly name: "";
            readonly type: "string";
        }];
        readonly stateMutability: "view";
        readonly type: "function";
    }, {
        readonly inputs: readonly [{
            readonly internalType: "uint256";
            readonly name: "tokenId";
            readonly type: "uint256";
        }];
        readonly name: "animationUri";
        readonly outputs: readonly [{
            readonly internalType: "string";
            readonly name: "";
            readonly type: "string";
        }];
        readonly stateMutability: "view";
        readonly type: "function";
    }, {
        readonly inputs: readonly [{
            readonly internalType: "uint256";
            readonly name: "tokenId";
            readonly type: "uint256";
        }];
        readonly name: "useNewArtwork";
        readonly outputs: readonly [{
            readonly internalType: "bool";
            readonly name: "";
            readonly type: "bool";
        }];
        readonly stateMutability: "view";
        readonly type: "function";
    }];
    static createInterface(): MoonbirdsRendererInterface;
    static connect(address: string, signerOrProvider: Signer | Provider): MoonbirdsRenderer;
}
export {};
