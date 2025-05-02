import type { BaseContract, BigNumber, BigNumberish, BytesLike, CallOverrides, PopulatedTransaction, Signer, utils } from "ethers";
import type { FunctionFragment, Result } from "@ethersproject/abi";
import type { Listener, Provider } from "@ethersproject/providers";
import type { TypedEventFilter, TypedEvent, TypedListener, OnEvent, PromiseOrValue } from "./common";
export interface MoonbirdsRendererInterface extends utils.Interface {
    functions: {
        "tokenURI(uint256)": FunctionFragment;
        "attributesJson(uint256)": FunctionFragment;
        "artworkUri(uint256)": FunctionFragment;
        "alternateArtworkUri(uint256)": FunctionFragment;
        "animationUri(uint256)": FunctionFragment;
        "useNewArtwork(uint256)": FunctionFragment;
    };
    getFunction(nameOrSignatureOrTopic: "tokenURI" | "attributesJson" | "artworkUri" | "alternateArtworkUri" | "animationUri" | "useNewArtwork"): FunctionFragment;
    encodeFunctionData(functionFragment: "tokenURI", values: [PromiseOrValue<BigNumberish>]): string;
    encodeFunctionData(functionFragment: "attributesJson", values: [PromiseOrValue<BigNumberish>]): string;
    encodeFunctionData(functionFragment: "artworkUri", values: [PromiseOrValue<BigNumberish>]): string;
    encodeFunctionData(functionFragment: "alternateArtworkUri", values: [PromiseOrValue<BigNumberish>]): string;
    encodeFunctionData(functionFragment: "animationUri", values: [PromiseOrValue<BigNumberish>]): string;
    encodeFunctionData(functionFragment: "useNewArtwork", values: [PromiseOrValue<BigNumberish>]): string;
    decodeFunctionResult(functionFragment: "tokenURI", data: BytesLike): Result;
    decodeFunctionResult(functionFragment: "attributesJson", data: BytesLike): Result;
    decodeFunctionResult(functionFragment: "artworkUri", data: BytesLike): Result;
    decodeFunctionResult(functionFragment: "alternateArtworkUri", data: BytesLike): Result;
    decodeFunctionResult(functionFragment: "animationUri", data: BytesLike): Result;
    decodeFunctionResult(functionFragment: "useNewArtwork", data: BytesLike): Result;
    events: {};
}
export interface MoonbirdsRenderer extends BaseContract {
    connect(signerOrProvider: Signer | Provider | string): this;
    attach(addressOrName: string): this;
    deployed(): Promise<this>;
    interface: MoonbirdsRendererInterface;
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
        tokenURI(tokenId: PromiseOrValue<BigNumberish>, overrides?: CallOverrides): Promise<[string]>;
        attributesJson(tokenId: PromiseOrValue<BigNumberish>, overrides?: CallOverrides): Promise<[string]>;
        artworkUri(tokenId: PromiseOrValue<BigNumberish>, overrides?: CallOverrides): Promise<[string]>;
        alternateArtworkUri(tokenId: PromiseOrValue<BigNumberish>, overrides?: CallOverrides): Promise<[string]>;
        animationUri(tokenId: PromiseOrValue<BigNumberish>, overrides?: CallOverrides): Promise<[string]>;
        useNewArtwork(tokenId: PromiseOrValue<BigNumberish>, overrides?: CallOverrides): Promise<[boolean]>;
    };
    tokenURI(tokenId: PromiseOrValue<BigNumberish>, overrides?: CallOverrides): Promise<string>;
    attributesJson(tokenId: PromiseOrValue<BigNumberish>, overrides?: CallOverrides): Promise<string>;
    artworkUri(tokenId: PromiseOrValue<BigNumberish>, overrides?: CallOverrides): Promise<string>;
    alternateArtworkUri(tokenId: PromiseOrValue<BigNumberish>, overrides?: CallOverrides): Promise<string>;
    animationUri(tokenId: PromiseOrValue<BigNumberish>, overrides?: CallOverrides): Promise<string>;
    useNewArtwork(tokenId: PromiseOrValue<BigNumberish>, overrides?: CallOverrides): Promise<boolean>;
    callStatic: {
        tokenURI(tokenId: PromiseOrValue<BigNumberish>, overrides?: CallOverrides): Promise<string>;
        attributesJson(tokenId: PromiseOrValue<BigNumberish>, overrides?: CallOverrides): Promise<string>;
        artworkUri(tokenId: PromiseOrValue<BigNumberish>, overrides?: CallOverrides): Promise<string>;
        alternateArtworkUri(tokenId: PromiseOrValue<BigNumberish>, overrides?: CallOverrides): Promise<string>;
        animationUri(tokenId: PromiseOrValue<BigNumberish>, overrides?: CallOverrides): Promise<string>;
        useNewArtwork(tokenId: PromiseOrValue<BigNumberish>, overrides?: CallOverrides): Promise<boolean>;
    };
    filters: {};
    estimateGas: {
        tokenURI(tokenId: PromiseOrValue<BigNumberish>, overrides?: CallOverrides): Promise<BigNumber>;
        attributesJson(tokenId: PromiseOrValue<BigNumberish>, overrides?: CallOverrides): Promise<BigNumber>;
        artworkUri(tokenId: PromiseOrValue<BigNumberish>, overrides?: CallOverrides): Promise<BigNumber>;
        alternateArtworkUri(tokenId: PromiseOrValue<BigNumberish>, overrides?: CallOverrides): Promise<BigNumber>;
        animationUri(tokenId: PromiseOrValue<BigNumberish>, overrides?: CallOverrides): Promise<BigNumber>;
        useNewArtwork(tokenId: PromiseOrValue<BigNumberish>, overrides?: CallOverrides): Promise<BigNumber>;
    };
    populateTransaction: {
        tokenURI(tokenId: PromiseOrValue<BigNumberish>, overrides?: CallOverrides): Promise<PopulatedTransaction>;
        attributesJson(tokenId: PromiseOrValue<BigNumberish>, overrides?: CallOverrides): Promise<PopulatedTransaction>;
        artworkUri(tokenId: PromiseOrValue<BigNumberish>, overrides?: CallOverrides): Promise<PopulatedTransaction>;
        alternateArtworkUri(tokenId: PromiseOrValue<BigNumberish>, overrides?: CallOverrides): Promise<PopulatedTransaction>;
        animationUri(tokenId: PromiseOrValue<BigNumberish>, overrides?: CallOverrides): Promise<PopulatedTransaction>;
        useNewArtwork(tokenId: PromiseOrValue<BigNumberish>, overrides?: CallOverrides): Promise<PopulatedTransaction>;
    };
}
