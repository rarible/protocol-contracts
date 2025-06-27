import { Signer } from "ethers";
import type { Provider } from "@ethersproject/providers";
import type { ERC1155Lazy, ERC1155LazyInterface } from "../../erc-1155/ERC1155Lazy";
export declare class ERC1155Lazy__factory {
    static readonly abi: readonly [{
        readonly anonymous: false;
        readonly inputs: readonly [{
            readonly indexed: true;
            readonly internalType: "address";
            readonly name: "account";
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
            readonly indexed: false;
            readonly internalType: "uint256";
            readonly name: "tokenId";
            readonly type: "uint256";
        }, {
            readonly components: readonly [{
                readonly internalType: "address payable";
                readonly name: "account";
                readonly type: "address";
            }, {
                readonly internalType: "uint96";
                readonly name: "value";
                readonly type: "uint96";
            }];
            readonly indexed: false;
            readonly internalType: "struct LibPart.Part[]";
            readonly name: "creators";
            readonly type: "tuple[]";
        }];
        readonly name: "Creators";
        readonly type: "event";
    }, {
        readonly anonymous: false;
        readonly inputs: readonly [{
            readonly indexed: false;
            readonly internalType: "uint256";
            readonly name: "tokenId";
            readonly type: "uint256";
        }, {
            readonly components: readonly [{
                readonly internalType: "address payable";
                readonly name: "account";
                readonly type: "address";
            }, {
                readonly internalType: "uint96";
                readonly name: "value";
                readonly type: "uint96";
            }];
            readonly indexed: false;
            readonly internalType: "struct LibPart.Part[]";
            readonly name: "royalties";
            readonly type: "tuple[]";
        }];
        readonly name: "RoyaltiesSet";
        readonly type: "event";
    }, {
        readonly anonymous: false;
        readonly inputs: readonly [{
            readonly indexed: false;
            readonly internalType: "uint256";
            readonly name: "tokenId";
            readonly type: "uint256";
        }, {
            readonly indexed: false;
            readonly internalType: "uint256";
            readonly name: "value";
            readonly type: "uint256";
        }];
        readonly name: "Supply";
        readonly type: "event";
    }, {
        readonly anonymous: false;
        readonly inputs: readonly [{
            readonly indexed: true;
            readonly internalType: "address";
            readonly name: "operator";
            readonly type: "address";
        }, {
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
            readonly internalType: "uint256[]";
            readonly name: "ids";
            readonly type: "uint256[]";
        }, {
            readonly indexed: false;
            readonly internalType: "uint256[]";
            readonly name: "values";
            readonly type: "uint256[]";
        }];
        readonly name: "TransferBatch";
        readonly type: "event";
    }, {
        readonly anonymous: false;
        readonly inputs: readonly [{
            readonly indexed: true;
            readonly internalType: "address";
            readonly name: "operator";
            readonly type: "address";
        }, {
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
            readonly name: "id";
            readonly type: "uint256";
        }, {
            readonly indexed: false;
            readonly internalType: "uint256";
            readonly name: "value";
            readonly type: "uint256";
        }];
        readonly name: "TransferSingle";
        readonly type: "event";
    }, {
        readonly anonymous: false;
        readonly inputs: readonly [{
            readonly indexed: false;
            readonly internalType: "string";
            readonly name: "value";
            readonly type: "string";
        }, {
            readonly indexed: true;
            readonly internalType: "uint256";
            readonly name: "id";
            readonly type: "uint256";
        }];
        readonly name: "URI";
        readonly type: "event";
    }, {
        readonly inputs: readonly [{
            readonly internalType: "address";
            readonly name: "account";
            readonly type: "address";
        }, {
            readonly internalType: "uint256";
            readonly name: "id";
            readonly type: "uint256";
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
            readonly internalType: "address[]";
            readonly name: "accounts";
            readonly type: "address[]";
        }, {
            readonly internalType: "uint256[]";
            readonly name: "ids";
            readonly type: "uint256[]";
        }];
        readonly name: "balanceOfBatch";
        readonly outputs: readonly [{
            readonly internalType: "uint256[]";
            readonly name: "";
            readonly type: "uint256[]";
        }];
        readonly stateMutability: "view";
        readonly type: "function";
    }, {
        readonly inputs: readonly [];
        readonly name: "baseURI";
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
            readonly name: "_id";
            readonly type: "uint256";
        }];
        readonly name: "getCreators";
        readonly outputs: readonly [{
            readonly components: readonly [{
                readonly internalType: "address payable";
                readonly name: "account";
                readonly type: "address";
            }, {
                readonly internalType: "uint96";
                readonly name: "value";
                readonly type: "uint96";
            }];
            readonly internalType: "struct LibPart.Part[]";
            readonly name: "";
            readonly type: "tuple[]";
        }];
        readonly stateMutability: "view";
        readonly type: "function";
    }, {
        readonly inputs: readonly [{
            readonly internalType: "uint256";
            readonly name: "id";
            readonly type: "uint256";
        }];
        readonly name: "getRaribleV2Royalties";
        readonly outputs: readonly [{
            readonly components: readonly [{
                readonly internalType: "address payable";
                readonly name: "account";
                readonly type: "address";
            }, {
                readonly internalType: "uint96";
                readonly name: "value";
                readonly type: "uint96";
            }];
            readonly internalType: "struct LibPart.Part[]";
            readonly name: "";
            readonly type: "tuple[]";
        }];
        readonly stateMutability: "view";
        readonly type: "function";
    }, {
        readonly inputs: readonly [{
            readonly internalType: "address";
            readonly name: "account";
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
            readonly components: readonly [{
                readonly internalType: "uint256";
                readonly name: "tokenId";
                readonly type: "uint256";
            }, {
                readonly internalType: "string";
                readonly name: "tokenURI";
                readonly type: "string";
            }, {
                readonly internalType: "uint256";
                readonly name: "supply";
                readonly type: "uint256";
            }, {
                readonly components: readonly [{
                    readonly internalType: "address payable";
                    readonly name: "account";
                    readonly type: "address";
                }, {
                    readonly internalType: "uint96";
                    readonly name: "value";
                    readonly type: "uint96";
                }];
                readonly internalType: "struct LibPart.Part[]";
                readonly name: "creators";
                readonly type: "tuple[]";
            }, {
                readonly components: readonly [{
                    readonly internalType: "address payable";
                    readonly name: "account";
                    readonly type: "address";
                }, {
                    readonly internalType: "uint96";
                    readonly name: "value";
                    readonly type: "uint96";
                }];
                readonly internalType: "struct LibPart.Part[]";
                readonly name: "royalties";
                readonly type: "tuple[]";
            }, {
                readonly internalType: "bytes[]";
                readonly name: "signatures";
                readonly type: "bytes[]";
            }];
            readonly internalType: "struct LibERC1155LazyMint.Mint1155Data";
            readonly name: "data";
            readonly type: "tuple";
        }, {
            readonly internalType: "address";
            readonly name: "to";
            readonly type: "address";
        }, {
            readonly internalType: "uint256";
            readonly name: "_amount";
            readonly type: "uint256";
        }];
        readonly name: "mintAndTransfer";
        readonly outputs: readonly [];
        readonly stateMutability: "nonpayable";
        readonly type: "function";
    }, {
        readonly inputs: readonly [{
            readonly internalType: "uint256";
            readonly name: "id";
            readonly type: "uint256";
        }, {
            readonly internalType: "uint256";
            readonly name: "_salePrice";
            readonly type: "uint256";
        }];
        readonly name: "royaltyInfo";
        readonly outputs: readonly [{
            readonly internalType: "address";
            readonly name: "receiver";
            readonly type: "address";
        }, {
            readonly internalType: "uint256";
            readonly name: "royaltyAmount";
            readonly type: "uint256";
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
            readonly internalType: "uint256[]";
            readonly name: "ids";
            readonly type: "uint256[]";
        }, {
            readonly internalType: "uint256[]";
            readonly name: "amounts";
            readonly type: "uint256[]";
        }, {
            readonly internalType: "bytes";
            readonly name: "data";
            readonly type: "bytes";
        }];
        readonly name: "safeBatchTransferFrom";
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
            readonly name: "id";
            readonly type: "uint256";
        }, {
            readonly internalType: "uint256";
            readonly name: "amount";
            readonly type: "uint256";
        }, {
            readonly internalType: "bytes";
            readonly name: "data";
            readonly type: "bytes";
        }];
        readonly name: "safeTransferFrom";
        readonly outputs: readonly [];
        readonly stateMutability: "nonpayable";
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
            readonly components: readonly [{
                readonly internalType: "uint256";
                readonly name: "tokenId";
                readonly type: "uint256";
            }, {
                readonly internalType: "string";
                readonly name: "tokenURI";
                readonly type: "string";
            }, {
                readonly internalType: "uint256";
                readonly name: "supply";
                readonly type: "uint256";
            }, {
                readonly components: readonly [{
                    readonly internalType: "address payable";
                    readonly name: "account";
                    readonly type: "address";
                }, {
                    readonly internalType: "uint96";
                    readonly name: "value";
                    readonly type: "uint96";
                }];
                readonly internalType: "struct LibPart.Part[]";
                readonly name: "creators";
                readonly type: "tuple[]";
            }, {
                readonly components: readonly [{
                    readonly internalType: "address payable";
                    readonly name: "account";
                    readonly type: "address";
                }, {
                    readonly internalType: "uint96";
                    readonly name: "value";
                    readonly type: "uint96";
                }];
                readonly internalType: "struct LibPart.Part[]";
                readonly name: "royalties";
                readonly type: "tuple[]";
            }, {
                readonly internalType: "bytes[]";
                readonly name: "signatures";
                readonly type: "bytes[]";
            }];
            readonly internalType: "struct LibERC1155LazyMint.Mint1155Data";
            readonly name: "data";
            readonly type: "tuple";
        }, {
            readonly internalType: "address";
            readonly name: "from";
            readonly type: "address";
        }, {
            readonly internalType: "address";
            readonly name: "to";
            readonly type: "address";
        }, {
            readonly internalType: "uint256";
            readonly name: "amount";
            readonly type: "uint256";
        }];
        readonly name: "transferFromOrMint";
        readonly outputs: readonly [];
        readonly stateMutability: "nonpayable";
        readonly type: "function";
    }, {
        readonly inputs: readonly [{
            readonly internalType: "uint256";
            readonly name: "_id";
            readonly type: "uint256";
        }, {
            readonly internalType: "address";
            readonly name: "_from";
            readonly type: "address";
        }, {
            readonly internalType: "address";
            readonly name: "_to";
            readonly type: "address";
        }];
        readonly name: "updateAccount";
        readonly outputs: readonly [];
        readonly stateMutability: "nonpayable";
        readonly type: "function";
    }, {
        readonly inputs: readonly [{
            readonly internalType: "uint256";
            readonly name: "id";
            readonly type: "uint256";
        }];
        readonly name: "uri";
        readonly outputs: readonly [{
            readonly internalType: "string";
            readonly name: "";
            readonly type: "string";
        }];
        readonly stateMutability: "view";
        readonly type: "function";
    }];
    static createInterface(): ERC1155LazyInterface;
    static connect(address: string, signerOrProvider: Signer | Provider): ERC1155Lazy;
}
