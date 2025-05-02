import { Signer, ContractFactory, Overrides } from "ethers";
import type { Provider, TransactionRequest } from "@ethersproject/providers";
import type { PromiseOrValue } from "../common";
import type { TWCloneFactory, TWCloneFactoryInterface } from "../TWCloneFactory";
type TWCloneFactoryConstructorParams = [signer?: Signer] | ConstructorParameters<typeof ContractFactory>;
export declare class TWCloneFactory__factory extends ContractFactory {
    constructor(...args: TWCloneFactoryConstructorParams);
    deploy(overrides?: Overrides & {
        from?: PromiseOrValue<string>;
    }): Promise<TWCloneFactory>;
    getDeployTransaction(overrides?: Overrides & {
        from?: PromiseOrValue<string>;
    }): TransactionRequest;
    attach(address: string): TWCloneFactory;
    connect(signer: Signer): TWCloneFactory__factory;
    static readonly bytecode = "0x608060405234801561001057600080fd5b5061081f806100206000396000f3fe608060405234801561001057600080fd5b50600436106100365760003560e01c806311b804ab1461003b578063d057c8b114610077575b600080fd5b61004e610049366004610616565b61008a565b60405173ffffffffffffffffffffffffffffffffffffffff909116815260200160405180910390f35b61004e61008536600461066d565b6101f0565b6040517fffffffffffffffffffffffffffffffffffffffff0000000000000000000000003360601b1660208201526034810182905260009081906054016040516020818303038152906040528051906020012090506100e98582610341565b60405173ffffffffffffffffffffffffffffffffffffffff808316825291935033918716907f9e0862c4ebff2150fbbfd3f8547483f55bdec0c34fd977d3fccaa55d6c4ce7849060200160405180910390a38351156101e85760008273ffffffffffffffffffffffffffffffffffffffff1685604051610169919061070f565b6000604051808303816000865af19150503d80600081146101a6576040519150601f19603f3d011682016040523d82523d6000602084013e6101ab565b606091505b50509050806101e6576040517fd853e20800000000000000000000000000000000000000000000000000000000815260040160405180910390fd5b505b509392505050565b6000806101fd8486610356565b90506102098682610341565b91503373ffffffffffffffffffffffffffffffffffffffff168273ffffffffffffffffffffffffffffffffffffffff168773ffffffffffffffffffffffffffffffffffffffff167fce771ab142d4dae572f01bd7e3eb77c8241179ce1a8128451099727badfba64e87898860405161028393929190610775565b60405180910390a48451156103385760008273ffffffffffffffffffffffffffffffffffffffff16866040516102b9919061070f565b6000604051808303816000865af19150503d80600081146102f6576040519150601f19603f3d011682016040523d82523d6000602084013e6102fb565b606091505b5050905080610336576040517fd853e20800000000000000000000000000000000000000000000000000000000815260040160405180910390fd5b505b50949350505050565b600061034f600084846104bc565b9392505050565b600082811a60f81b7f01000000000000000000000000000000000000000000000000000000000000008116158015917f020000000000000000000000000000000000000000000000000000000000000081161515917f0400000000000000000000000000000000000000000000000000000000000000909116151590849084906103dd5750825b156104125786866040516020016103f59291906107a0565b60405160208183030381529060405280519060200120905061048d565b83801561041d575082155b15610433576040805160208101899052016103f5565b8315801561043e5750825b15610458578646876040516020016103f5939291906107c1565b8646604051602001610474929190918252602082015260400190565b6040516020818303038152906040528051906020012090505b81156104b2576040805160208101839052338183015281518082038301905260600190525b9695505050505050565b60006c5af43d3d93803e602a57fd5bf36021528260145273602c3d8160093d39f33d3d3d3d363d3d37363d73600052816035600c86f59050806105075763301164256000526004601cfd5b60006021529392505050565b803573ffffffffffffffffffffffffffffffffffffffff8116811461053757600080fd5b919050565b7f4e487b7100000000000000000000000000000000000000000000000000000000600052604160045260246000fd5b600082601f83011261057c57600080fd5b813567ffffffffffffffff808211156105975761059761053c565b604051601f83017fffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffe0908116603f011681019082821181831017156105dd576105dd61053c565b816040528381528660208588010111156105f657600080fd5b836020870160208301376000602085830101528094505050505092915050565b60008060006060848603121561062b57600080fd5b61063484610513565b9250602084013567ffffffffffffffff81111561065057600080fd5b61065c8682870161056b565b925050604084013590509250925092565b6000806000806080858703121561068357600080fd5b61068c85610513565b9350602085013567ffffffffffffffff808211156106a957600080fd5b6106b58883890161056b565b94506040870135935060608701359150808211156106d257600080fd5b506106df8782880161056b565b91505092959194509250565b60005b838110156107065781810151838201526020016106ee565b50506000910152565b600082516107218184602087016106eb565b9190910192915050565b600081518084526107438160208601602086016106eb565b601f017fffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffe0169290920160200192915050565b83815260606020820152600061078e606083018561072b565b82810360408401526104b2818561072b565b8281526040602082015260006107b9604083018461072b565b949350505050565b8381528260208201526060604082015260006107e0606083018461072b565b9594505050505056fea2646970667358221220ec35305985a022a047d2df481451454a1f2162a7efa71a75aa9c62349dd84b3c64736f6c63430008140033";
    static readonly abi: readonly [{
        readonly inputs: readonly [];
        readonly name: "ProxyDeploymentFailed";
        readonly type: "error";
    }, {
        readonly anonymous: false;
        readonly inputs: readonly [{
            readonly indexed: true;
            readonly internalType: "address";
            readonly name: "implementation";
            readonly type: "address";
        }, {
            readonly indexed: false;
            readonly internalType: "address";
            readonly name: "proxy";
            readonly type: "address";
        }, {
            readonly indexed: true;
            readonly internalType: "address";
            readonly name: "deployer";
            readonly type: "address";
        }];
        readonly name: "ProxyDeployed";
        readonly type: "event";
    }, {
        readonly anonymous: false;
        readonly inputs: readonly [{
            readonly indexed: true;
            readonly internalType: "address";
            readonly name: "implementation";
            readonly type: "address";
        }, {
            readonly indexed: true;
            readonly internalType: "address";
            readonly name: "proxy";
            readonly type: "address";
        }, {
            readonly indexed: true;
            readonly internalType: "address";
            readonly name: "deployer";
            readonly type: "address";
        }, {
            readonly indexed: false;
            readonly internalType: "bytes32";
            readonly name: "inputSalt";
            readonly type: "bytes32";
        }, {
            readonly indexed: false;
            readonly internalType: "bytes";
            readonly name: "data";
            readonly type: "bytes";
        }, {
            readonly indexed: false;
            readonly internalType: "bytes";
            readonly name: "extraData";
            readonly type: "bytes";
        }];
        readonly name: "ProxyDeployedV2";
        readonly type: "event";
    }, {
        readonly inputs: readonly [{
            readonly internalType: "address";
            readonly name: "_implementation";
            readonly type: "address";
        }, {
            readonly internalType: "bytes";
            readonly name: "_data";
            readonly type: "bytes";
        }, {
            readonly internalType: "bytes32";
            readonly name: "_salt";
            readonly type: "bytes32";
        }];
        readonly name: "deployProxyByImplementation";
        readonly outputs: readonly [{
            readonly internalType: "address";
            readonly name: "deployedProxy";
            readonly type: "address";
        }];
        readonly stateMutability: "nonpayable";
        readonly type: "function";
    }, {
        readonly inputs: readonly [{
            readonly internalType: "address";
            readonly name: "implementation";
            readonly type: "address";
        }, {
            readonly internalType: "bytes";
            readonly name: "data";
            readonly type: "bytes";
        }, {
            readonly internalType: "bytes32";
            readonly name: "salt";
            readonly type: "bytes32";
        }, {
            readonly internalType: "bytes";
            readonly name: "extraData";
            readonly type: "bytes";
        }];
        readonly name: "deployProxyByImplementationV2";
        readonly outputs: readonly [{
            readonly internalType: "address";
            readonly name: "deployedProxy";
            readonly type: "address";
        }];
        readonly stateMutability: "nonpayable";
        readonly type: "function";
    }];
    static createInterface(): TWCloneFactoryInterface;
    static connect(address: string, signerOrProvider: Signer | Provider): TWCloneFactory;
}
export {};
