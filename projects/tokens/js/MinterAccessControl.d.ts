import type { BaseContract, BigNumber, BytesLike, CallOverrides, ContractTransaction, Overrides, PopulatedTransaction, Signer, utils } from "ethers";
import type { FunctionFragment, Result, EventFragment } from "@ethersproject/abi";
import type { Listener, Provider } from "@ethersproject/providers";
import type { TypedEventFilter, TypedEvent, TypedListener, OnEvent, PromiseOrValue } from "./common";
export interface MinterAccessControlInterface extends utils.Interface {
    functions: {
        "owner()": FunctionFragment;
        "renounceOwnership()": FunctionFragment;
        "transferOwnership(address)": FunctionFragment;
        "addMinter(address)": FunctionFragment;
        "addMinters(address[])": FunctionFragment;
        "removeMinter(address)": FunctionFragment;
        "isMinter(address)": FunctionFragment;
    };
    getFunction(nameOrSignatureOrTopic: "owner" | "renounceOwnership" | "transferOwnership" | "addMinter" | "addMinters" | "removeMinter" | "isMinter"): FunctionFragment;
    encodeFunctionData(functionFragment: "owner", values?: undefined): string;
    encodeFunctionData(functionFragment: "renounceOwnership", values?: undefined): string;
    encodeFunctionData(functionFragment: "transferOwnership", values: [PromiseOrValue<string>]): string;
    encodeFunctionData(functionFragment: "addMinter", values: [PromiseOrValue<string>]): string;
    encodeFunctionData(functionFragment: "addMinters", values: [PromiseOrValue<string>[]]): string;
    encodeFunctionData(functionFragment: "removeMinter", values: [PromiseOrValue<string>]): string;
    encodeFunctionData(functionFragment: "isMinter", values: [PromiseOrValue<string>]): string;
    decodeFunctionResult(functionFragment: "owner", data: BytesLike): Result;
    decodeFunctionResult(functionFragment: "renounceOwnership", data: BytesLike): Result;
    decodeFunctionResult(functionFragment: "transferOwnership", data: BytesLike): Result;
    decodeFunctionResult(functionFragment: "addMinter", data: BytesLike): Result;
    decodeFunctionResult(functionFragment: "addMinters", data: BytesLike): Result;
    decodeFunctionResult(functionFragment: "removeMinter", data: BytesLike): Result;
    decodeFunctionResult(functionFragment: "isMinter", data: BytesLike): Result;
    events: {
        "MinterStatusChanged(address,bool)": EventFragment;
        "OwnershipTransferred(address,address)": EventFragment;
    };
    getEvent(nameOrSignatureOrTopic: "MinterStatusChanged"): EventFragment;
    getEvent(nameOrSignatureOrTopic: "OwnershipTransferred"): EventFragment;
}
export interface MinterStatusChangedEventObject {
    minter: string;
    status: boolean;
}
export type MinterStatusChangedEvent = TypedEvent<[
    string,
    boolean
], MinterStatusChangedEventObject>;
export type MinterStatusChangedEventFilter = TypedEventFilter<MinterStatusChangedEvent>;
export interface OwnershipTransferredEventObject {
    previousOwner: string;
    newOwner: string;
}
export type OwnershipTransferredEvent = TypedEvent<[
    string,
    string
], OwnershipTransferredEventObject>;
export type OwnershipTransferredEventFilter = TypedEventFilter<OwnershipTransferredEvent>;
export interface MinterAccessControl extends BaseContract {
    connect(signerOrProvider: Signer | Provider | string): this;
    attach(addressOrName: string): this;
    deployed(): Promise<this>;
    interface: MinterAccessControlInterface;
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
         * Returns the address of the current owner.
         */
        owner(overrides?: CallOverrides): Promise<[string]>;
        /**
         * Leaves the contract without owner. It will not be possible to call `onlyOwner` functions anymore. Can only be called by the current owner. NOTE: Renouncing ownership will leave the contract without an owner, thereby removing any functionality that is only available to the owner.
         */
        renounceOwnership(overrides?: Overrides & {
            from?: PromiseOrValue<string>;
        }): Promise<ContractTransaction>;
        /**
         * Transfers ownership of the contract to a new account (`newOwner`). Can only be called by the current owner.
         */
        transferOwnership(newOwner: PromiseOrValue<string>, overrides?: Overrides & {
            from?: PromiseOrValue<string>;
        }): Promise<ContractTransaction>;
        /**
         * Add `minter` to the list of allowed minters.
         */
        addMinter(minter: PromiseOrValue<string>, overrides?: Overrides & {
            from?: PromiseOrValue<string>;
        }): Promise<ContractTransaction>;
        /**
         * Add `minters` to the list of allowed minters.
         */
        addMinters(minters: PromiseOrValue<string>[], overrides?: Overrides & {
            from?: PromiseOrValue<string>;
        }): Promise<ContractTransaction>;
        /**
         * Revoke `_minter` from the list of allowed minters.
         */
        removeMinter(_minter: PromiseOrValue<string>, overrides?: Overrides & {
            from?: PromiseOrValue<string>;
        }): Promise<ContractTransaction>;
        /**
         * Returns `true` if `account` has been granted to minters.
         */
        isMinter(account: PromiseOrValue<string>, overrides?: CallOverrides): Promise<[boolean]>;
    };
    /**
     * Returns the address of the current owner.
     */
    owner(overrides?: CallOverrides): Promise<string>;
    /**
     * Leaves the contract without owner. It will not be possible to call `onlyOwner` functions anymore. Can only be called by the current owner. NOTE: Renouncing ownership will leave the contract without an owner, thereby removing any functionality that is only available to the owner.
     */
    renounceOwnership(overrides?: Overrides & {
        from?: PromiseOrValue<string>;
    }): Promise<ContractTransaction>;
    /**
     * Transfers ownership of the contract to a new account (`newOwner`). Can only be called by the current owner.
     */
    transferOwnership(newOwner: PromiseOrValue<string>, overrides?: Overrides & {
        from?: PromiseOrValue<string>;
    }): Promise<ContractTransaction>;
    /**
     * Add `minter` to the list of allowed minters.
     */
    addMinter(minter: PromiseOrValue<string>, overrides?: Overrides & {
        from?: PromiseOrValue<string>;
    }): Promise<ContractTransaction>;
    /**
     * Add `minters` to the list of allowed minters.
     */
    addMinters(minters: PromiseOrValue<string>[], overrides?: Overrides & {
        from?: PromiseOrValue<string>;
    }): Promise<ContractTransaction>;
    /**
     * Revoke `_minter` from the list of allowed minters.
     */
    removeMinter(_minter: PromiseOrValue<string>, overrides?: Overrides & {
        from?: PromiseOrValue<string>;
    }): Promise<ContractTransaction>;
    /**
     * Returns `true` if `account` has been granted to minters.
     */
    isMinter(account: PromiseOrValue<string>, overrides?: CallOverrides): Promise<boolean>;
    callStatic: {
        /**
         * Returns the address of the current owner.
         */
        owner(overrides?: CallOverrides): Promise<string>;
        /**
         * Leaves the contract without owner. It will not be possible to call `onlyOwner` functions anymore. Can only be called by the current owner. NOTE: Renouncing ownership will leave the contract without an owner, thereby removing any functionality that is only available to the owner.
         */
        renounceOwnership(overrides?: CallOverrides): Promise<void>;
        /**
         * Transfers ownership of the contract to a new account (`newOwner`). Can only be called by the current owner.
         */
        transferOwnership(newOwner: PromiseOrValue<string>, overrides?: CallOverrides): Promise<void>;
        /**
         * Add `minter` to the list of allowed minters.
         */
        addMinter(minter: PromiseOrValue<string>, overrides?: CallOverrides): Promise<void>;
        /**
         * Add `minters` to the list of allowed minters.
         */
        addMinters(minters: PromiseOrValue<string>[], overrides?: CallOverrides): Promise<void>;
        /**
         * Revoke `_minter` from the list of allowed minters.
         */
        removeMinter(_minter: PromiseOrValue<string>, overrides?: CallOverrides): Promise<void>;
        /**
         * Returns `true` if `account` has been granted to minters.
         */
        isMinter(account: PromiseOrValue<string>, overrides?: CallOverrides): Promise<boolean>;
    };
    filters: {
        "MinterStatusChanged(address,bool)"(minter?: PromiseOrValue<string> | null, status?: PromiseOrValue<boolean> | null): MinterStatusChangedEventFilter;
        MinterStatusChanged(minter?: PromiseOrValue<string> | null, status?: PromiseOrValue<boolean> | null): MinterStatusChangedEventFilter;
        "OwnershipTransferred(address,address)"(previousOwner?: PromiseOrValue<string> | null, newOwner?: PromiseOrValue<string> | null): OwnershipTransferredEventFilter;
        OwnershipTransferred(previousOwner?: PromiseOrValue<string> | null, newOwner?: PromiseOrValue<string> | null): OwnershipTransferredEventFilter;
    };
    estimateGas: {
        /**
         * Returns the address of the current owner.
         */
        owner(overrides?: CallOverrides): Promise<BigNumber>;
        /**
         * Leaves the contract without owner. It will not be possible to call `onlyOwner` functions anymore. Can only be called by the current owner. NOTE: Renouncing ownership will leave the contract without an owner, thereby removing any functionality that is only available to the owner.
         */
        renounceOwnership(overrides?: Overrides & {
            from?: PromiseOrValue<string>;
        }): Promise<BigNumber>;
        /**
         * Transfers ownership of the contract to a new account (`newOwner`). Can only be called by the current owner.
         */
        transferOwnership(newOwner: PromiseOrValue<string>, overrides?: Overrides & {
            from?: PromiseOrValue<string>;
        }): Promise<BigNumber>;
        /**
         * Add `minter` to the list of allowed minters.
         */
        addMinter(minter: PromiseOrValue<string>, overrides?: Overrides & {
            from?: PromiseOrValue<string>;
        }): Promise<BigNumber>;
        /**
         * Add `minters` to the list of allowed minters.
         */
        addMinters(minters: PromiseOrValue<string>[], overrides?: Overrides & {
            from?: PromiseOrValue<string>;
        }): Promise<BigNumber>;
        /**
         * Revoke `_minter` from the list of allowed minters.
         */
        removeMinter(_minter: PromiseOrValue<string>, overrides?: Overrides & {
            from?: PromiseOrValue<string>;
        }): Promise<BigNumber>;
        /**
         * Returns `true` if `account` has been granted to minters.
         */
        isMinter(account: PromiseOrValue<string>, overrides?: CallOverrides): Promise<BigNumber>;
    };
    populateTransaction: {
        /**
         * Returns the address of the current owner.
         */
        owner(overrides?: CallOverrides): Promise<PopulatedTransaction>;
        /**
         * Leaves the contract without owner. It will not be possible to call `onlyOwner` functions anymore. Can only be called by the current owner. NOTE: Renouncing ownership will leave the contract without an owner, thereby removing any functionality that is only available to the owner.
         */
        renounceOwnership(overrides?: Overrides & {
            from?: PromiseOrValue<string>;
        }): Promise<PopulatedTransaction>;
        /**
         * Transfers ownership of the contract to a new account (`newOwner`). Can only be called by the current owner.
         */
        transferOwnership(newOwner: PromiseOrValue<string>, overrides?: Overrides & {
            from?: PromiseOrValue<string>;
        }): Promise<PopulatedTransaction>;
        /**
         * Add `minter` to the list of allowed minters.
         */
        addMinter(minter: PromiseOrValue<string>, overrides?: Overrides & {
            from?: PromiseOrValue<string>;
        }): Promise<PopulatedTransaction>;
        /**
         * Add `minters` to the list of allowed minters.
         */
        addMinters(minters: PromiseOrValue<string>[], overrides?: Overrides & {
            from?: PromiseOrValue<string>;
        }): Promise<PopulatedTransaction>;
        /**
         * Revoke `_minter` from the list of allowed minters.
         */
        removeMinter(_minter: PromiseOrValue<string>, overrides?: Overrides & {
            from?: PromiseOrValue<string>;
        }): Promise<PopulatedTransaction>;
        /**
         * Returns `true` if `account` has been granted to minters.
         */
        isMinter(account: PromiseOrValue<string>, overrides?: CallOverrides): Promise<PopulatedTransaction>;
    };
}
