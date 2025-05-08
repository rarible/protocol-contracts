import { Signer, ContractFactory, Overrides } from "ethers";
import type { Provider, TransactionRequest } from "@ethersproject/providers";
import type { PromiseOrValue } from "../common";
import type { LibERC1155LazyMint, LibERC1155LazyMintInterface } from "../LibERC1155LazyMint";
type LibERC1155LazyMintConstructorParams = [signer?: Signer] | ConstructorParameters<typeof ContractFactory>;
export declare class LibERC1155LazyMint__factory extends ContractFactory {
    constructor(...args: LibERC1155LazyMintConstructorParams);
    deploy(overrides?: Overrides & {
        from?: PromiseOrValue<string>;
    }): Promise<LibERC1155LazyMint>;
    getDeployTransaction(overrides?: Overrides & {
        from?: PromiseOrValue<string>;
    }): TransactionRequest;
    attach(address: string): LibERC1155LazyMint;
    connect(signer: Signer): LibERC1155LazyMint__factory;
    static readonly bytecode = "0x60fb610025600b82828239805160001a60731461001857fe5b30600052607381538281f3fe7300000000000000000000000000000000000000003014608060405260043610603d5760003560e01c80637987105f14604257806390c20c4314605a575b600080fd5b6048607d565b60408051918252519081900360200190f35b606060a1565b604080516001600160e01b03199092168252519081900360200190f35b7ffb988707ebb338694f318760b0fd5cfe756d00a2ade251fda110b80c336a3c7f81565b7f1cdfaa400bc064c91b5cc20e571cfcc92103980be96e01fb36dda1962d8d78cb8156fea26469706673582212205294a33578a4eacd7b52a584ecb6dc24e8e3e764177c557859925f7b2c89907264736f6c63430007060033";
    static readonly abi: readonly [{
        readonly inputs: readonly [];
        readonly name: "ERC1155_LAZY_ASSET_CLASS";
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
    static createInterface(): LibERC1155LazyMintInterface;
    static connect(address: string, signerOrProvider: Signer | Provider): LibERC1155LazyMint;
}
export {};
