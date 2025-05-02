import { Signer, ContractFactory, Overrides } from "ethers";
import type { Provider, TransactionRequest } from "@ethersproject/providers";
import type { PromiseOrValue } from "../common";
import type { LibERC721LazyMint, LibERC721LazyMintInterface } from "../LibERC721LazyMint";
type LibERC721LazyMintConstructorParams = [signer?: Signer] | ConstructorParameters<typeof ContractFactory>;
export declare class LibERC721LazyMint__factory extends ContractFactory {
    constructor(...args: LibERC721LazyMintConstructorParams);
    deploy(overrides?: Overrides & {
        from?: PromiseOrValue<string>;
    }): Promise<LibERC721LazyMint>;
    getDeployTransaction(overrides?: Overrides & {
        from?: PromiseOrValue<string>;
    }): TransactionRequest;
    attach(address: string): LibERC721LazyMint;
    connect(signer: Signer): LibERC721LazyMint__factory;
    static readonly bytecode = "0x60fb610025600b82828239805160001a60731461001857fe5b30600052607381538281f3fe7300000000000000000000000000000000000000003014608060405260043610603d5760003560e01c80637987105f14604257806394d5e89d14605a575b600080fd5b6048607d565b60408051918252519081900360200190f35b606060a1565b604080516001600160e01b03199092168252519081900360200190f35b7ff64326045af5fd7e15297ba939f85b550474d3899daa47d2bc1ffbdb9ced344e81565b7fd8f960c1450658267efb07308b4050c9e705cea25a53b560236c88cb149696be8156fea264697066735822122018d8b140a5ce005f415300ebc1ad875d98186ceb0830a76e4c8e500bdd929cc664736f6c63430007060033";
    static readonly abi: readonly [{
        readonly inputs: readonly [];
        readonly name: "ERC721_LAZY_ASSET_CLASS";
        readonly outputs: readonly [{
            readonly internalType: "bytes4";
            readonly name: "";
            readonly type: "bytes4";
        }];
        readonly stateMutability: "view";
        readonly type: "function";
    }, {
        readonly inputs: readonly [];
        readonly name: "MINT_AND_TRANSFER_TYPEHASH";
        readonly outputs: readonly [{
            readonly internalType: "bytes32";
            readonly name: "";
            readonly type: "bytes32";
        }];
        readonly stateMutability: "view";
        readonly type: "function";
    }];
    static createInterface(): LibERC721LazyMintInterface;
    static connect(address: string, signerOrProvider: Signer | Provider): LibERC721LazyMint;
}
export {};
