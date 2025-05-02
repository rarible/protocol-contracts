import { Signer, ContractFactory, Overrides } from "ethers";
import type { Provider, TransactionRequest } from "@ethersproject/providers";
import type { PromiseOrValue } from "../common";
import type { ERC721UpgradeableMinimal, ERC721UpgradeableMinimalInterface } from "../ERC721UpgradeableMinimal";
type ERC721UpgradeableMinimalConstructorParams = [signer?: Signer] | ConstructorParameters<typeof ContractFactory>;
export declare class ERC721UpgradeableMinimal__factory extends ContractFactory {
    constructor(...args: ERC721UpgradeableMinimalConstructorParams);
    deploy(overrides?: Overrides & {
        from?: PromiseOrValue<string>;
    }): Promise<ERC721UpgradeableMinimal>;
    getDeployTransaction(overrides?: Overrides & {
        from?: PromiseOrValue<string>;
    }): TransactionRequest;
    attach(address: string): ERC721UpgradeableMinimal;
    connect(signer: Signer): ERC721UpgradeableMinimal__factory;
    static readonly bytecode = "0x608060405234801561001057600080fd5b50610f6e806100206000396000f3fe608060405234801561001057600080fd5b50600436106100cf5760003560e01c80636352211e1161008c578063a22cb46511610066578063a22cb465146102bc578063b88d4fde146102ea578063c87b56dd146103b0578063e985e9c5146103cd576100cf565b80636352211e1461025f57806370a082311461027c57806395d89b41146102b4576100cf565b806301ffc9a7146100d457806306fdde031461010f578063081812fc1461018c578063095ea7b3146101c557806323b872dd146101f357806342842e0e14610229575b600080fd5b6100fb600480360360208110156100ea57600080fd5b50356001600160e01b0319166103fb565b604080519115158252519081900360200190f35b61011761041a565b6040805160208082528351818301528351919283929083019185019080838360005b83811015610151578181015183820152602001610139565b50505050905090810190601f16801561017e5780820380516001836020036101000a031916815260200191505b509250505060405180910390f35b6101a9600480360360208110156101a257600080fd5b50356104b0565b604080516001600160a01b039092168252519081900360200190f35b6101f1600480360360408110156101db57600080fd5b506001600160a01b038135169060200135610512565b005b6101f16004803603606081101561020957600080fd5b506001600160a01b038135811691602081013590911690604001356105ed565b6101f16004803603606081101561023f57600080fd5b506001600160a01b03813581169160208101359091169060400135610644565b6101a96004803603602081101561027557600080fd5b503561065f565b6102a26004803603602081101561029257600080fd5b50356001600160a01b03166106b9565b60408051918252519081900360200190f35b61011761071c565b6101f1600480360360408110156102d257600080fd5b506001600160a01b038135169060200135151561077d565b6101f16004803603608081101561030057600080fd5b6001600160a01b0382358116926020810135909116916040820135919081019060808101606082013564010000000081111561033b57600080fd5b82018360208201111561034d57600080fd5b8035906020019184600183028401116401000000008311171561036f57600080fd5b91908080601f016020809104026020016040519081016040528093929190818152602001838380828437600092019190915250929550610882945050505050565b610117600480360360208110156103c657600080fd5b50356108e0565b6100fb600480360360408110156103e357600080fd5b506001600160a01b03813581169160200135166108e6565b6001600160e01b03191660009081526033602052604090205460ff1690565b60658054604080516020601f60026000196101006001881615020190951694909404938401819004810282018101909252828152606093909290918301828280156104a65780601f1061047b576101008083540402835291602001916104a6565b820191906000526020600020905b81548152906001019060200180831161048957829003601f168201915b5050505050905090565b60006104bb82610914565b6104f65760405162461bcd60e51b815260040180806020018281038252602c815260200180610e92602c913960400191505060405180910390fd5b506000908152606960205260409020546001600160a01b031690565b600061051d8261065f565b9050806001600160a01b0316836001600160a01b031614156105705760405162461bcd60e51b8152600401808060200182810382526021815260200180610ee76021913960400191505060405180910390fd5b806001600160a01b0316610582610931565b6001600160a01b031614806105a357506105a38161059e610931565b6108e6565b6105de5760405162461bcd60e51b8152600401808060200182810382526038815260200180610e076038913960400191505060405180910390fd5b6105e88383610935565b505050565b6105fe6105f8610931565b826109a3565b6106395760405162461bcd60e51b8152600401808060200182810382526031815260200180610f086031913960400191505060405180910390fd5b6105e8838383610a47565b6105e883838360405180602001604052806000815250610882565b6000818152606760205260408120546001600160a01b0316806106b35760405162461bcd60e51b8152600401808060200182810382526029815260200180610e696029913960400191505060405180910390fd5b92915050565b60006001600160a01b0382166107005760405162461bcd60e51b815260040180806020018281038252602a815260200180610e3f602a913960400191505060405180910390fd5b506001600160a01b031660009081526068602052604090205490565b60668054604080516020601f60026000196101006001881615020190951694909404938401819004810282018101909252828152606093909290918301828280156104a65780601f1061047b576101008083540402835291602001916104a6565b610785610931565b6001600160a01b0316826001600160a01b031614156107eb576040805162461bcd60e51b815260206004820152601960248201527f4552433732313a20617070726f766520746f2063616c6c657200000000000000604482015290519081900360640190fd5b80606a60006107f8610931565b6001600160a01b03908116825260208083019390935260409182016000908120918716808252919093529120805460ff19169215159290921790915561083c610931565b6001600160a01b03167f17307eab39ab6107e8899845ad3d59bd9653f200f220920489ca2b5937696c318360405180821515815260200191505060405180910390a35050565b61089361088d610931565b836109a3565b6108ce5760405162461bcd60e51b8152600401808060200182810382526031815260200180610f086031913960400191505060405180910390fd5b6108da84848484610b77565b50505050565b50606090565b6001600160a01b039182166000908152606a6020908152604080832093909416825291909152205460ff1690565b6000908152606760205260409020546001600160a01b0316151590565b3390565b600081815260696020526040902080546001600160a01b0319166001600160a01b038416908117909155819061096a8261065f565b6001600160a01b03167f8c5be1e5ebec7d5bd14f71427d1e84f3dd0314c0f7b2291e5b200ac8c7c3b92560405160405180910390a45050565b60006109ae82610914565b6109e95760405162461bcd60e51b815260040180806020018281038252602c815260200180610ddb602c913960400191505060405180910390fd5b60006109f48361065f565b9050806001600160a01b0316846001600160a01b03161480610a2f5750836001600160a01b0316610a24846104b0565b6001600160a01b0316145b80610a3f5750610a3f81856108e6565b949350505050565b826001600160a01b0316610a5a8261065f565b6001600160a01b031614610a9f5760405162461bcd60e51b8152600401808060200182810382526029815260200180610ebe6029913960400191505060405180910390fd5b6001600160a01b038216610ae45760405162461bcd60e51b8152600401808060200182810382526024815260200180610db76024913960400191505060405180910390fd5b610aef8383836105e8565b610afa600082610935565b6001600160a01b038084166000818152606860209081526040808320805460001901905593861680835284832080546001019055858352606790915283822080546001600160a01b031916821790559251849392917fddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef91a4505050565b610b82848484610a47565b610b8e84848484610bc9565b6108da5760405162461bcd60e51b8152600401808060200182810382526032815260200180610d856032913960400191505060405180910390fd5b6000610bdd846001600160a01b0316610d7e565b15610d7357836001600160a01b031663150b7a02610bf9610931565b8786866040518563ffffffff1660e01b815260040180856001600160a01b03168152602001846001600160a01b0316815260200183815260200180602001828103825283818151815260200191508051906020019080838360005b83811015610c6c578181015183820152602001610c54565b50505050905090810190601f168015610c995780820380516001836020036101000a031916815260200191505b5095505050505050602060405180830381600087803b158015610cbb57600080fd5b505af1925050508015610ce057506040513d6020811015610cdb57600080fd5b505160015b610d59573d808015610d0e576040519150601f19603f3d011682016040523d82523d6000602084013e610d13565b606091505b508051610d515760405162461bcd60e51b8152600401808060200182810382526032815260200180610d856032913960400191505060405180910390fd5b805181602001fd5b6001600160e01b031916630a85bd0160e11b149050610a3f565b506001949350505050565b3b15159056fe4552433732313a207472616e7366657220746f206e6f6e20455243373231526563656976657220696d706c656d656e7465724552433732313a207472616e7366657220746f20746865207a65726f20616464726573734552433732313a206f70657261746f7220717565727920666f72206e6f6e6578697374656e7420746f6b656e4552433732313a20617070726f76652063616c6c6572206973206e6f74206f776e6572206e6f7220617070726f76656420666f7220616c6c4552433732313a2062616c616e636520717565727920666f7220746865207a65726f20616464726573734552433732313a206f776e657220717565727920666f72206e6f6e6578697374656e7420746f6b656e4552433732313a20617070726f76656420717565727920666f72206e6f6e6578697374656e7420746f6b656e4552433732313a207472616e73666572206f6620746f6b656e2074686174206973206e6f74206f776e4552433732313a20617070726f76616c20746f2063757272656e74206f776e65724552433732313a207472616e736665722063616c6c6572206973206e6f74206f776e6572206e6f7220617070726f766564a2646970667358221220decfc9521c26b27eeb55fab43805b7d8872f4e792358ccff2ddfbd16055221f564736f6c63430007060033";
    static readonly abi: readonly [{
        readonly anonymous: false;
        readonly inputs: readonly [{
            readonly indexed: true;
            readonly internalType: "address";
            readonly name: "owner";
            readonly type: "address";
        }, {
            readonly indexed: true;
            readonly internalType: "address";
            readonly name: "approved";
            readonly type: "address";
        }, {
            readonly indexed: true;
            readonly internalType: "uint256";
            readonly name: "tokenId";
            readonly type: "uint256";
        }];
        readonly name: "Approval";
        readonly type: "event";
    }, {
        readonly anonymous: false;
        readonly inputs: readonly [{
            readonly indexed: true;
            readonly internalType: "address";
            readonly name: "owner";
            readonly type: "address";
        }, {
            readonly indexed: true;
            readonly internalType: "address";
            readonly name: "operator";
            readonly type: "address";
        }, {
            readonly indexed: false;
            readonly internalType: "bool";
            readonly name: "approved";
            readonly type: "bool";
        }];
        readonly name: "ApprovalForAll";
        readonly type: "event";
    }, {
        readonly anonymous: false;
        readonly inputs: readonly [{
            readonly indexed: true;
            readonly internalType: "address";
            readonly name: "from";
            readonly type: "address";
        }, {
            readonly indexed: true;
            readonly internalType: "address";
            readonly name: "to";
            readonly type: "address";
        }, {
            readonly indexed: true;
            readonly internalType: "uint256";
            readonly name: "tokenId";
            readonly type: "uint256";
        }];
        readonly name: "Transfer";
        readonly type: "event";
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
    }, {
        readonly inputs: readonly [{
            readonly internalType: "address";
            readonly name: "owner";
            readonly type: "address";
        }];
        readonly name: "balanceOf";
        readonly outputs: readonly [{
            readonly internalType: "uint256";
            readonly name: "";
            readonly type: "uint256";
        }];
        readonly stateMutability: "view";
        readonly type: "function";
    }, {
        readonly inputs: readonly [{
            readonly internalType: "uint256";
            readonly name: "tokenId";
            readonly type: "uint256";
        }];
        readonly name: "ownerOf";
        readonly outputs: readonly [{
            readonly internalType: "address";
            readonly name: "";
            readonly type: "address";
        }];
        readonly stateMutability: "view";
        readonly type: "function";
    }, {
        readonly inputs: readonly [];
        readonly name: "name";
        readonly outputs: readonly [{
            readonly internalType: "string";
            readonly name: "";
            readonly type: "string";
        }];
        readonly stateMutability: "view";
        readonly type: "function";
    }, {
        readonly inputs: readonly [];
        readonly name: "symbol";
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
            readonly internalType: "address";
            readonly name: "to";
            readonly type: "address";
        }, {
            readonly internalType: "uint256";
            readonly name: "tokenId";
            readonly type: "uint256";
        }];
        readonly name: "approve";
        readonly outputs: readonly [];
        readonly stateMutability: "nonpayable";
        readonly type: "function";
    }, {
        readonly inputs: readonly [{
            readonly internalType: "uint256";
            readonly name: "tokenId";
            readonly type: "uint256";
        }];
        readonly name: "getApproved";
        readonly outputs: readonly [{
            readonly internalType: "address";
            readonly name: "";
            readonly type: "address";
        }];
        readonly stateMutability: "view";
        readonly type: "function";
    }, {
        readonly inputs: readonly [{
            readonly internalType: "address";
            readonly name: "operator";
            readonly type: "address";
        }, {
            readonly internalType: "bool";
            readonly name: "approved";
            readonly type: "bool";
        }];
        readonly name: "setApprovalForAll";
        readonly outputs: readonly [];
        readonly stateMutability: "nonpayable";
        readonly type: "function";
    }, {
        readonly inputs: readonly [{
            readonly internalType: "address";
            readonly name: "owner";
            readonly type: "address";
        }, {
            readonly internalType: "address";
            readonly name: "operator";
            readonly type: "address";
        }];
        readonly name: "isApprovedForAll";
        readonly outputs: readonly [{
            readonly internalType: "bool";
            readonly name: "";
            readonly type: "bool";
        }];
        readonly stateMutability: "view";
        readonly type: "function";
    }, {
        readonly inputs: readonly [{
            readonly internalType: "address";
            readonly name: "from";
            readonly type: "address";
        }, {
            readonly internalType: "address";
            readonly name: "to";
            readonly type: "address";
        }, {
            readonly internalType: "uint256";
            readonly name: "tokenId";
            readonly type: "uint256";
        }];
        readonly name: "transferFrom";
        readonly outputs: readonly [];
        readonly stateMutability: "nonpayable";
        readonly type: "function";
    }, {
        readonly inputs: readonly [{
            readonly internalType: "address";
            readonly name: "from";
            readonly type: "address";
        }, {
            readonly internalType: "address";
            readonly name: "to";
            readonly type: "address";
        }, {
            readonly internalType: "uint256";
            readonly name: "tokenId";
            readonly type: "uint256";
        }];
        readonly name: "safeTransferFrom";
        readonly outputs: readonly [];
        readonly stateMutability: "nonpayable";
        readonly type: "function";
    }, {
        readonly inputs: readonly [{
            readonly internalType: "address";
            readonly name: "from";
            readonly type: "address";
        }, {
            readonly internalType: "address";
            readonly name: "to";
            readonly type: "address";
        }, {
            readonly internalType: "uint256";
            readonly name: "tokenId";
            readonly type: "uint256";
        }, {
            readonly internalType: "bytes";
            readonly name: "_data";
            readonly type: "bytes";
        }];
        readonly name: "safeTransferFrom";
        readonly outputs: readonly [];
        readonly stateMutability: "nonpayable";
        readonly type: "function";
    }];
    static createInterface(): ERC721UpgradeableMinimalInterface;
    static connect(address: string, signerOrProvider: Signer | Provider): ERC721UpgradeableMinimal;
}
export {};
