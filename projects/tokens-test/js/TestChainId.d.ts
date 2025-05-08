import type { BaseContract, BigNumber, BytesLike, CallOverrides, PopulatedTransaction, Signer, utils } from "ethers";
import type { FunctionFragment, Result } from "@ethersproject/abi";
import type { Listener, Provider } from "@ethersproject/providers";
import type { TypedEventFilter, TypedEvent, TypedListener, OnEvent } from "./common";
export interface TestChainIdInterface extends utils.Interface {
    functions: {
        "getChainID()": FunctionFragment;
    };
    getFunction(nameOrSignatureOrTopic: "getChainID"): FunctionFragment;
    encodeFunctionData(functionFragment: "getChainID", values?: undefined): string;
    decodeFunctionResult(functionFragment: "getChainID", data: BytesLike): Result;
    events: {};
}
export interface TestChainId extends BaseContract {
    connect(signerOrProvider: Signer | Provider | string): this;
    attach(addressOrName: string): this;
    deployed(): Promise<this>;
    interface: TestChainIdInterface;
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
        getChainID(overrides?: CallOverrides): Promise<[BigNumber] & {
            id: BigNumber;
        }>;
    };
    getChainID(overrides?: CallOverrides): Promise<BigNumber>;
    callStatic: {
        getChainID(overrides?: CallOverrides): Promise<BigNumber>;
    };
    filters: {};
    estimateGas: {
        getChainID(overrides?: CallOverrides): Promise<BigNumber>;
    };
    populateTransaction: {
        getChainID(overrides?: CallOverrides): Promise<PopulatedTransaction>;
    };
}
