import { Signer, ContractFactory, Overrides } from "ethers";
import type { Provider, TransactionRequest } from "@ethersproject/providers";
import type { PromiseOrValue } from "../common";
import type { RoyaltiesV2Impl, RoyaltiesV2ImplInterface } from "../RoyaltiesV2Impl";
type RoyaltiesV2ImplConstructorParams = [signer?: Signer] | ConstructorParameters<typeof ContractFactory>;
export declare class RoyaltiesV2Impl__factory extends ContractFactory {
    constructor(...args: RoyaltiesV2ImplConstructorParams);
    deploy(overrides?: Overrides & {
        from?: PromiseOrValue<string>;
    }): Promise<RoyaltiesV2Impl>;
    getDeployTransaction(overrides?: Overrides & {
        from?: PromiseOrValue<string>;
    }): TransactionRequest;
    attach(address: string): RoyaltiesV2Impl;
    connect(signer: Signer): RoyaltiesV2Impl__factory;
    static readonly bytecode = "0x608060405234801561001057600080fd5b506102fe806100206000396000f3fe608060405234801561001057600080fd5b50600436106100365760003560e01c80632a55205a1461003b578063cad96cca14610065575b600080fd5b61004e61004936600461022d565b610085565b60405161005c92919061024e565b60405180910390f35b610078610073366004610215565b61018f565b60405161005c9190610267565b60008281526020819052604081205481906100a557506000905080610188565b60008481526020818152604080832080548251818502810185019093528083529192909190849084015b8282101561011e57600084815260209081902060408051808201909152908401546001600160a01b0381168252600160a01b90046001600160601b0316818301528252600190920191016100cf565b5050505090508060008151811061013157fe5b60209081029190910101515192506000805b825181101561017c5782818151811061015857fe5b6020026020010151602001516001600160601b031682019150806001019050610143565b50612710908502049150505b9250929050565b600081815260208181526040808320805482518185028101850190935280835260609492939192909184015b8282101561020a57600084815260209081902060408051808201909152908401546001600160a01b0381168252600160a01b90046001600160601b0316818301528252600190920191016101bb565b505050509050919050565b600060208284031215610226578081fd5b5035919050565b6000806040838503121561023f578081fd5b50508035926020909101359150565b6001600160a01b03929092168252602082015260400190565b602080825282518282018190526000919060409081850190868401855b828110156102bb57815180516001600160a01b031685528601516001600160601b0316868501529284019290850190600101610284565b509197965050505050505056fea2646970667358221220e0c502fba867806501aa6283337694caf29e5f2fe888004b990d5204491085ec64736f6c63430007060033";
    static readonly abi: readonly [{
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
    }];
    static createInterface(): RoyaltiesV2ImplInterface;
    static connect(address: string, signerOrProvider: Signer | Provider): RoyaltiesV2Impl;
}
export {};
