import { Signer, ContractFactory, Overrides } from "ethers";
import type { Provider, TransactionRequest } from "@ethersproject/providers";
import type { PromiseOrValue } from "../common";
import type { TestERC20, TestERC20Interface } from "../TestERC20";
type TestERC20ConstructorParams = [signer?: Signer] | ConstructorParameters<typeof ContractFactory>;
export declare class TestERC20__factory extends ContractFactory {
    constructor(...args: TestERC20ConstructorParams);
    deploy(overrides?: Overrides & {
        from?: PromiseOrValue<string>;
    }): Promise<TestERC20>;
    getDeployTransaction(overrides?: Overrides & {
        from?: PromiseOrValue<string>;
    }): TransactionRequest;
    attach(address: string): TestERC20;
    connect(signer: Signer): TestERC20__factory;
    static readonly bytecode = "0x608060405234801561001057600080fd5b50610eaa806100206000396000f3fe608060405234801561001057600080fd5b50600436106100cf5760003560e01c806340c10f191161008c578063a457c2d711610066578063a457c2d714610287578063a9059cbb146102b3578063dd62ed3e146102df578063e1c7392a1461030d576100cf565b806340c10f191461022b57806370a082311461025957806395d89b411461027f576100cf565b806306fdde03146100d4578063095ea7b31461015157806318160ddd1461019157806323b872dd146101ab578063313ce567146101e157806339509351146101ff575b600080fd5b6100dc610315565b6040805160208082528351818301528351919283929083019185019080838360005b838110156101165781810151838201526020016100fe565b50505050905090810190601f1680156101435780820380516001836020036101000a031916815260200191505b509250505060405180910390f35b61017d6004803603604081101561016757600080fd5b506001600160a01b0381351690602001356103ab565b604080519115158252519081900360200190f35b6101996103c8565b60408051918252519081900360200190f35b61017d600480360360608110156101c157600080fd5b506001600160a01b038135811691602081013590911690604001356103ce565b6101e9610455565b6040805160ff9092168252519081900360200190f35b61017d6004803603604081101561021557600080fd5b506001600160a01b03813516906020013561045e565b6102576004803603604081101561024157600080fd5b506001600160a01b0381351690602001356104ac565b005b6101996004803603602081101561026f57600080fd5b50356001600160a01b03166104ba565b6100dc6104d5565b61017d6004803603604081101561029d57600080fd5b506001600160a01b038135169060200135610536565b61017d600480360360408110156102c957600080fd5b506001600160a01b03813516906020013561059e565b610199600480360360408110156102f557600080fd5b506001600160a01b03813581169160200135166105b2565b6102576105dd565b60368054604080516020601f60026000196101006001881615020190951694909404938401819004810282018101909252828152606093909290918301828280156103a15780601f10610376576101008083540402835291602001916103a1565b820191906000526020600020905b81548152906001019060200180831161038457829003601f168201915b5050505050905090565b60006103bf6103b8610626565b848461062a565b50600192915050565b60355490565b60006103db848484610716565b61044b846103e7610626565b61044685604051806060016040528060288152602001610ddf602891396001600160a01b038a16600090815260346020526040812090610425610626565b6001600160a01b031681526020810191909152604001600020549190610873565b61062a565b5060019392505050565b60385460ff1690565b60006103bf61046b610626565b84610446856034600061047c610626565b6001600160a01b03908116825260208083019390935260409182016000908120918c16815292529020549061090a565b6104b6828261096b565b5050565b6001600160a01b031660009081526033602052604090205490565b60378054604080516020601f60026000196101006001881615020190951694909404938401819004810282018101909252828152606093909290918301828280156103a15780601f10610376576101008083540402835291602001916103a1565b60006103bf610543610626565b8461044685604051806060016040528060258152602001610e50602591396034600061056d610626565b6001600160a01b03908116825260208083019390935260409182016000908120918d16815292529020549190610873565b60006103bf6105ab610626565b8484610716565b6001600160a01b03918216600090815260346020908152604080832093909416825291909152205490565b6106246040518060400160405280600981526020016805465737445524332360bc1b815250604051806040016040528060048152602001630544532360e41b815250610a5d565b565b3390565b6001600160a01b03831661066f5760405162461bcd60e51b8152600401808060200182810382526024815260200180610e2c6024913960400191505060405180910390fd5b6001600160a01b0382166106b45760405162461bcd60e51b8152600401808060200182810382526022815260200180610d696022913960400191505060405180910390fd5b6001600160a01b03808416600081815260346020908152604080832094871680845294825291829020859055815185815291517f8c5be1e5ebec7d5bd14f71427d1e84f3dd0314c0f7b2291e5b200ac8c7c3b9259281900390910190a3505050565b6001600160a01b03831661075b5760405162461bcd60e51b8152600401808060200182810382526025815260200180610e076025913960400191505060405180910390fd5b6001600160a01b0382166107a05760405162461bcd60e51b8152600401808060200182810382526023815260200180610d466023913960400191505060405180910390fd5b6107ab838383610b0e565b6107e881604051806060016040528060268152602001610d8b602691396001600160a01b0386166000908152603360205260409020549190610873565b6001600160a01b038085166000908152603360205260408082209390935590841681522054610817908261090a565b6001600160a01b0380841660008181526033602090815260409182902094909455805185815290519193928716927fddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef92918290030190a3505050565b600081848411156109025760405162461bcd60e51b81526004018080602001828103825283818151815260200191508051906020019080838360005b838110156108c75781810151838201526020016108af565b50505050905090810190601f1680156108f45780820380516001836020036101000a031916815260200191505b509250505060405180910390fd5b505050900390565b600082820183811015610964576040805162461bcd60e51b815260206004820152601b60248201527f536166654d6174683a206164646974696f6e206f766572666c6f770000000000604482015290519081900360640190fd5b9392505050565b6001600160a01b0382166109c6576040805162461bcd60e51b815260206004820152601f60248201527f45524332303a206d696e7420746f20746865207a65726f206164647265737300604482015290519081900360640190fd5b6109d260008383610b0e565b6035546109df908261090a565b6035556001600160a01b038216600090815260336020526040902054610a05908261090a565b6001600160a01b03831660008181526033602090815260408083209490945583518581529351929391927fddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef9281900390910190a35050565b600054610100900460ff1680610a765750610a76610b13565b80610a84575060005460ff16155b610abf5760405162461bcd60e51b815260040180806020018281038252602e815260200180610db1602e913960400191505060405180910390fd5b600054610100900460ff16158015610aea576000805460ff1961ff0019909116610100171660011790555b610af2610b24565b610afc8383610bc6565b8015610b0e576000805461ff00191690555b505050565b6000610b1e30610c9e565b15905090565b600054610100900460ff1680610b3d5750610b3d610b13565b80610b4b575060005460ff16155b610b865760405162461bcd60e51b815260040180806020018281038252602e815260200180610db1602e913960400191505060405180910390fd5b600054610100900460ff16158015610bb1576000805460ff1961ff0019909116610100171660011790555b8015610bc3576000805461ff00191690555b50565b600054610100900460ff1680610bdf5750610bdf610b13565b80610bed575060005460ff16155b610c285760405162461bcd60e51b815260040180806020018281038252602e815260200180610db1602e913960400191505060405180910390fd5b600054610100900460ff16158015610c53576000805460ff1961ff0019909116610100171660011790555b8251610c66906036906020860190610ca4565b508151610c7a906037906020850190610ca4565b506038805460ff191660121790558015610b0e576000805461ff0019169055505050565b3b151590565b828054600181600116156101000203166002900490600052602060002090601f016020900481019282610cda5760008555610d20565b82601f10610cf357805160ff1916838001178555610d20565b82800160010185558215610d20579182015b82811115610d20578251825591602001919060010190610d05565b50610d2c929150610d30565b5090565b5b80821115610d2c5760008155600101610d3156fe45524332303a207472616e7366657220746f20746865207a65726f206164647265737345524332303a20617070726f766520746f20746865207a65726f206164647265737345524332303a207472616e7366657220616d6f756e7420657863656564732062616c616e6365496e697469616c697a61626c653a20636f6e747261637420697320616c726561647920696e697469616c697a656445524332303a207472616e7366657220616d6f756e74206578636565647320616c6c6f77616e636545524332303a207472616e736665722066726f6d20746865207a65726f206164647265737345524332303a20617070726f76652066726f6d20746865207a65726f206164647265737345524332303a2064656372656173656420616c6c6f77616e63652062656c6f77207a65726fa2646970667358221220c5e5ce127e2b37af8268c07a31473f8911f48c26d3599c679450709e3bb496c164736f6c63430007060033";
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
            readonly name: "spender";
            readonly type: "address";
        }, {
            readonly indexed: false;
            readonly internalType: "uint256";
            readonly name: "value";
            readonly type: "uint256";
        }];
        readonly name: "Approval";
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
            readonly indexed: false;
            readonly internalType: "uint256";
            readonly name: "value";
            readonly type: "uint256";
        }];
        readonly name: "Transfer";
        readonly type: "event";
    }, {
        readonly inputs: readonly [{
            readonly internalType: "address";
            readonly name: "owner";
            readonly type: "address";
        }, {
            readonly internalType: "address";
            readonly name: "spender";
            readonly type: "address";
        }];
        readonly name: "allowance";
        readonly outputs: readonly [{
            readonly internalType: "uint256";
            readonly name: "";
            readonly type: "uint256";
        }];
        readonly stateMutability: "view";
        readonly type: "function";
    }, {
        readonly inputs: readonly [{
            readonly internalType: "address";
            readonly name: "spender";
            readonly type: "address";
        }, {
            readonly internalType: "uint256";
            readonly name: "amount";
            readonly type: "uint256";
        }];
        readonly name: "approve";
        readonly outputs: readonly [{
            readonly internalType: "bool";
            readonly name: "";
            readonly type: "bool";
        }];
        readonly stateMutability: "nonpayable";
        readonly type: "function";
    }, {
        readonly inputs: readonly [{
            readonly internalType: "address";
            readonly name: "account";
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
        readonly inputs: readonly [];
        readonly name: "decimals";
        readonly outputs: readonly [{
            readonly internalType: "uint8";
            readonly name: "";
            readonly type: "uint8";
        }];
        readonly stateMutability: "view";
        readonly type: "function";
    }, {
        readonly inputs: readonly [{
            readonly internalType: "address";
            readonly name: "spender";
            readonly type: "address";
        }, {
            readonly internalType: "uint256";
            readonly name: "subtractedValue";
            readonly type: "uint256";
        }];
        readonly name: "decreaseAllowance";
        readonly outputs: readonly [{
            readonly internalType: "bool";
            readonly name: "";
            readonly type: "bool";
        }];
        readonly stateMutability: "nonpayable";
        readonly type: "function";
    }, {
        readonly inputs: readonly [{
            readonly internalType: "address";
            readonly name: "spender";
            readonly type: "address";
        }, {
            readonly internalType: "uint256";
            readonly name: "addedValue";
            readonly type: "uint256";
        }];
        readonly name: "increaseAllowance";
        readonly outputs: readonly [{
            readonly internalType: "bool";
            readonly name: "";
            readonly type: "bool";
        }];
        readonly stateMutability: "nonpayable";
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
        readonly inputs: readonly [];
        readonly name: "totalSupply";
        readonly outputs: readonly [{
            readonly internalType: "uint256";
            readonly name: "";
            readonly type: "uint256";
        }];
        readonly stateMutability: "view";
        readonly type: "function";
    }, {
        readonly inputs: readonly [{
            readonly internalType: "address";
            readonly name: "recipient";
            readonly type: "address";
        }, {
            readonly internalType: "uint256";
            readonly name: "amount";
            readonly type: "uint256";
        }];
        readonly name: "transfer";
        readonly outputs: readonly [{
            readonly internalType: "bool";
            readonly name: "";
            readonly type: "bool";
        }];
        readonly stateMutability: "nonpayable";
        readonly type: "function";
    }, {
        readonly inputs: readonly [{
            readonly internalType: "address";
            readonly name: "sender";
            readonly type: "address";
        }, {
            readonly internalType: "address";
            readonly name: "recipient";
            readonly type: "address";
        }, {
            readonly internalType: "uint256";
            readonly name: "amount";
            readonly type: "uint256";
        }];
        readonly name: "transferFrom";
        readonly outputs: readonly [{
            readonly internalType: "bool";
            readonly name: "";
            readonly type: "bool";
        }];
        readonly stateMutability: "nonpayable";
        readonly type: "function";
    }, {
        readonly inputs: readonly [{
            readonly internalType: "address";
            readonly name: "to";
            readonly type: "address";
        }, {
            readonly internalType: "uint256";
            readonly name: "amount";
            readonly type: "uint256";
        }];
        readonly name: "mint";
        readonly outputs: readonly [];
        readonly stateMutability: "nonpayable";
        readonly type: "function";
    }, {
        readonly inputs: readonly [];
        readonly name: "init";
        readonly outputs: readonly [];
        readonly stateMutability: "nonpayable";
        readonly type: "function";
    }];
    static createInterface(): TestERC20Interface;
    static connect(address: string, signerOrProvider: Signer | Provider): TestERC20;
}
export {};
