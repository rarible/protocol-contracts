import type { BaseContract, BigNumber, BytesLike, CallOverrides, PopulatedTransaction, Signer, utils } from "ethers";
import type { FunctionFragment, Result } from "@ethersproject/abi";
import type { Listener, Provider } from "@ethersproject/providers";
import type { TypedEventFilter, TypedEvent, TypedListener, OnEvent } from "./common";
export interface LibERC1155LazyMintInterface extends utils.Interface {
    functions: {
        "ERC1155_LAZY_ASSET_CLASS()": FunctionFragment;
        "MINT_AND_TRANSFER_TYPEHASH()": FunctionFragment;
    };
    getFunction(nameOrSignatureOrTopic: "ERC1155_LAZY_ASSET_CLASS" | "MINT_AND_TRANSFER_TYPEHASH"): FunctionFragment;
    encodeFunctionData(functionFragment: "ERC1155_LAZY_ASSET_CLASS", values?: undefined): string;
    encodeFunctionData(functionFragment: "MINT_AND_TRANSFER_TYPEHASH", values?: undefined): string;
    decodeFunctionResult(functionFragment: "ERC1155_LAZY_ASSET_CLASS", data: BytesLike): Result;
    decodeFunctionResult(functionFragment: "MINT_AND_TRANSFER_TYPEHASH", data: BytesLike): Result;
    events: {};
}
export interface LibERC1155LazyMint extends BaseContract {
    connect(signerOrProvider: Signer | Provider | string): this;
    attach(addressOrName: string): this;
    deployed(): Promise<this>;
    interface: LibERC1155LazyMintInterface;
    queryFilter<TEvent extends TypedEvent>(event: TypedEventFilter<TEvent>, fromBlockOrBlockhash?: string | number | undefined, toBlock?: string | number | undefined): Promise<Array<TEvent>>;
    listeners<TEvent extends TypedEvent>(eventFilter?: TypedEventFilter<TEvent>): Array<TypedListener<TEvent>>;
    listeners(eventName?: string): Array<Listener>;
    removeAllListeners<TEvent extends TypedEvent>(eventFilter: TypedEventFilter<TEvent>): this;
    removeAllListeners(eventName?: string): this;
    off: OnEvent<this>;
    on: OnEvent<this>;
    once: OnEvent<this>;
    removeListener: OnEvent<this>;
    functions: {
        ERC1155_LAZY_ASSET_CLASS(overrides?: CallOverrides): Promise<[string]>;
        MINT_AND_TRANSFER_TYPEHASH(overrides?: CallOverrides): Promise<[string]>;
    };
    ERC1155_LAZY_ASSET_CLASS(overrides?: CallOverrides): Promise<string>;
    MINT_AND_TRANSFER_TYPEHASH(overrides?: CallOverrides): Promise<string>;
    callStatic: {
        ERC1155_LAZY_ASSET_CLASS(overrides?: CallOverrides): Promise<string>;
        MINT_AND_TRANSFER_TYPEHASH(overrides?: CallOverrides): Promise<string>;
    };
    filters: {};
    estimateGas: {
        ERC1155_LAZY_ASSET_CLASS(overrides?: CallOverrides): Promise<BigNumber>;
        MINT_AND_TRANSFER_TYPEHASH(overrides?: CallOverrides): Promise<BigNumber>;
    };
    populateTransaction: {
        ERC1155_LAZY_ASSET_CLASS(overrides?: CallOverrides): Promise<PopulatedTransaction>;
        MINT_AND_TRANSFER_TYPEHASH(overrides?: CallOverrides): Promise<PopulatedTransaction>;
    };
}
