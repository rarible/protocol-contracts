import type { BaseContract, BigNumber, BytesLike, CallOverrides, ContractTransaction, Overrides, PopulatedTransaction, Signer, utils } from "ethers";
import type { FunctionFragment, Result, EventFragment } from "@ethersproject/abi";
import type { Listener, Provider } from "@ethersproject/providers";
import type { TypedEventFilter, TypedEvent, TypedListener, OnEvent, PromiseOrValue } from "./common";
export interface IOwnableInterface extends utils.Interface {
    functions: {
        "owner()": FunctionFragment;
        "setOwner(address)": FunctionFragment;
    };
    getFunction(nameOrSignatureOrTopic: "owner" | "setOwner"): FunctionFragment;
    encodeFunctionData(functionFragment: "owner", values?: undefined): string;
    encodeFunctionData(functionFragment: "setOwner", values: [PromiseOrValue<string>]): string;
    decodeFunctionResult(functionFragment: "owner", data: BytesLike): Result;
    decodeFunctionResult(functionFragment: "setOwner", data: BytesLike): Result;
    events: {
        "OwnerUpdated(address,address)": EventFragment;
    };
    getEvent(nameOrSignatureOrTopic: "OwnerUpdated"): EventFragment;
}
export interface OwnerUpdatedEventObject {
    prevOwner: string;
    newOwner: string;
}
export type OwnerUpdatedEvent = TypedEvent<[
    string,
    string
], OwnerUpdatedEventObject>;
export type OwnerUpdatedEventFilter = TypedEventFilter<OwnerUpdatedEvent>;
export interface IOwnable extends BaseContract {
    connect(signerOrProvider: Signer | Provider | string): this;
    attach(addressOrName: string): this;
    deployed(): Promise<this>;
    interface: IOwnableInterface;
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
        /**
         * Returns the owner of the contract.
         */
        owner(overrides?: CallOverrides): Promise<[string]>;
        /**
         * Lets a module admin set a new owner for the contract. The new owner must be a module admin.
         */
        setOwner(_newOwner: PromiseOrValue<string>, overrides?: Overrides & {
            from?: PromiseOrValue<string>;
        }): Promise<ContractTransaction>;
    };
    /**
     * Returns the owner of the contract.
     */
    owner(overrides?: CallOverrides): Promise<string>;
    /**
     * Lets a module admin set a new owner for the contract. The new owner must be a module admin.
     */
    setOwner(_newOwner: PromiseOrValue<string>, overrides?: Overrides & {
        from?: PromiseOrValue<string>;
    }): Promise<ContractTransaction>;
    callStatic: {
        /**
         * Returns the owner of the contract.
         */
        owner(overrides?: CallOverrides): Promise<string>;
        /**
         * Lets a module admin set a new owner for the contract. The new owner must be a module admin.
         */
        setOwner(_newOwner: PromiseOrValue<string>, overrides?: CallOverrides): Promise<void>;
    };
    filters: {
        "OwnerUpdated(address,address)"(prevOwner?: PromiseOrValue<string> | null, newOwner?: PromiseOrValue<string> | null): OwnerUpdatedEventFilter;
        OwnerUpdated(prevOwner?: PromiseOrValue<string> | null, newOwner?: PromiseOrValue<string> | null): OwnerUpdatedEventFilter;
    };
    estimateGas: {
        /**
         * Returns the owner of the contract.
         */
        owner(overrides?: CallOverrides): Promise<BigNumber>;
        /**
         * Lets a module admin set a new owner for the contract. The new owner must be a module admin.
         */
        setOwner(_newOwner: PromiseOrValue<string>, overrides?: Overrides & {
            from?: PromiseOrValue<string>;
        }): Promise<BigNumber>;
    };
    populateTransaction: {
        /**
         * Returns the owner of the contract.
         */
        owner(overrides?: CallOverrides): Promise<PopulatedTransaction>;
        /**
         * Lets a module admin set a new owner for the contract. The new owner must be a module admin.
         */
        setOwner(_newOwner: PromiseOrValue<string>, overrides?: Overrides & {
            from?: PromiseOrValue<string>;
        }): Promise<PopulatedTransaction>;
    };
}
