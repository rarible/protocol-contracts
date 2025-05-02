import type { BaseContract, BigNumber, BytesLike, CallOverrides, PopulatedTransaction, Signer, utils } from "ethers";
import type { FunctionFragment, Result } from "@ethersproject/abi";
import type { Listener, Provider } from "@ethersproject/providers";
import type { TypedEventFilter, TypedEvent, TypedListener, OnEvent, PromiseOrValue } from "./common";
export interface ERC1271Interface extends utils.Interface {
    functions: {
        "ERC1271_INTERFACE_ID()": FunctionFragment;
        "ERC1271_RETURN_INVALID_SIGNATURE()": FunctionFragment;
        "ERC1271_RETURN_VALID_SIGNATURE()": FunctionFragment;
        "isValidSignature(bytes32,bytes)": FunctionFragment;
    };
    getFunction(nameOrSignatureOrTopic: "ERC1271_INTERFACE_ID" | "ERC1271_RETURN_INVALID_SIGNATURE" | "ERC1271_RETURN_VALID_SIGNATURE" | "isValidSignature"): FunctionFragment;
    encodeFunctionData(functionFragment: "ERC1271_INTERFACE_ID", values?: undefined): string;
    encodeFunctionData(functionFragment: "ERC1271_RETURN_INVALID_SIGNATURE", values?: undefined): string;
    encodeFunctionData(functionFragment: "ERC1271_RETURN_VALID_SIGNATURE", values?: undefined): string;
    encodeFunctionData(functionFragment: "isValidSignature", values: [PromiseOrValue<BytesLike>, PromiseOrValue<BytesLike>]): string;
    decodeFunctionResult(functionFragment: "ERC1271_INTERFACE_ID", data: BytesLike): Result;
    decodeFunctionResult(functionFragment: "ERC1271_RETURN_INVALID_SIGNATURE", data: BytesLike): Result;
    decodeFunctionResult(functionFragment: "ERC1271_RETURN_VALID_SIGNATURE", data: BytesLike): Result;
    decodeFunctionResult(functionFragment: "isValidSignature", data: BytesLike): Result;
    events: {};
}
export interface ERC1271 extends BaseContract {
    connect(signerOrProvider: Signer | Provider | string): this;
    attach(addressOrName: string): this;
    deployed(): Promise<this>;
    interface: ERC1271Interface;
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
        ERC1271_INTERFACE_ID(overrides?: CallOverrides): Promise<[string]>;
        ERC1271_RETURN_INVALID_SIGNATURE(overrides?: CallOverrides): Promise<[string]>;
        ERC1271_RETURN_VALID_SIGNATURE(overrides?: CallOverrides): Promise<[string]>;
        /**
         * Function must be implemented by deriving contract
         * @param _hash Arbitrary length data signed on the behalf of address(this)
         * @param _signature Signature byte array associated with _data
         */
        isValidSignature(_hash: PromiseOrValue<BytesLike>, _signature: PromiseOrValue<BytesLike>, overrides?: CallOverrides): Promise<[string]>;
    };
    ERC1271_INTERFACE_ID(overrides?: CallOverrides): Promise<string>;
    ERC1271_RETURN_INVALID_SIGNATURE(overrides?: CallOverrides): Promise<string>;
    ERC1271_RETURN_VALID_SIGNATURE(overrides?: CallOverrides): Promise<string>;
    /**
     * Function must be implemented by deriving contract
     * @param _hash Arbitrary length data signed on the behalf of address(this)
     * @param _signature Signature byte array associated with _data
     */
    isValidSignature(_hash: PromiseOrValue<BytesLike>, _signature: PromiseOrValue<BytesLike>, overrides?: CallOverrides): Promise<string>;
    callStatic: {
        ERC1271_INTERFACE_ID(overrides?: CallOverrides): Promise<string>;
        ERC1271_RETURN_INVALID_SIGNATURE(overrides?: CallOverrides): Promise<string>;
        ERC1271_RETURN_VALID_SIGNATURE(overrides?: CallOverrides): Promise<string>;
        /**
         * Function must be implemented by deriving contract
         * @param _hash Arbitrary length data signed on the behalf of address(this)
         * @param _signature Signature byte array associated with _data
         */
        isValidSignature(_hash: PromiseOrValue<BytesLike>, _signature: PromiseOrValue<BytesLike>, overrides?: CallOverrides): Promise<string>;
    };
    filters: {};
    estimateGas: {
        ERC1271_INTERFACE_ID(overrides?: CallOverrides): Promise<BigNumber>;
        ERC1271_RETURN_INVALID_SIGNATURE(overrides?: CallOverrides): Promise<BigNumber>;
        ERC1271_RETURN_VALID_SIGNATURE(overrides?: CallOverrides): Promise<BigNumber>;
        /**
         * Function must be implemented by deriving contract
         * @param _hash Arbitrary length data signed on the behalf of address(this)
         * @param _signature Signature byte array associated with _data
         */
        isValidSignature(_hash: PromiseOrValue<BytesLike>, _signature: PromiseOrValue<BytesLike>, overrides?: CallOverrides): Promise<BigNumber>;
    };
    populateTransaction: {
        ERC1271_INTERFACE_ID(overrides?: CallOverrides): Promise<PopulatedTransaction>;
        ERC1271_RETURN_INVALID_SIGNATURE(overrides?: CallOverrides): Promise<PopulatedTransaction>;
        ERC1271_RETURN_VALID_SIGNATURE(overrides?: CallOverrides): Promise<PopulatedTransaction>;
        /**
         * Function must be implemented by deriving contract
         * @param _hash Arbitrary length data signed on the behalf of address(this)
         * @param _signature Signature byte array associated with _data
         */
        isValidSignature(_hash: PromiseOrValue<BytesLike>, _signature: PromiseOrValue<BytesLike>, overrides?: CallOverrides): Promise<PopulatedTransaction>;
    };
}
