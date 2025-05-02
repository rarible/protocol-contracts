import type { BaseContract, BigNumber, BigNumberish, BytesLike, CallOverrides, ContractTransaction, Overrides, PopulatedTransaction, Signer, utils } from "ethers";
import type { FunctionFragment, Result, EventFragment } from "@ethersproject/abi";
import type { Listener, Provider } from "@ethersproject/providers";
import type { TypedEventFilter, TypedEvent, TypedListener, OnEvent, PromiseOrValue } from "./common";
export interface ERC1155RaribleFactoryC2Interface extends utils.Interface {
    functions: {
        "beacon()": FunctionFragment;
        "owner()": FunctionFragment;
        "renounceOwnership()": FunctionFragment;
        "transferOwnership(address)": FunctionFragment;
        "createToken(string,string,string,string,address[],uint256)": FunctionFragment;
        "createToken(string,string,string,string,uint256)": FunctionFragment;
        "getAddress(string,string,string,string,address[],uint256)": FunctionFragment;
        "getAddress(string,string,string,string,uint256)": FunctionFragment;
    };
    getFunction(nameOrSignatureOrTopic: "beacon" | "owner" | "renounceOwnership" | "transferOwnership" | "createToken(string,string,string,string,address[],uint256)" | "createToken(string,string,string,string,uint256)" | "getAddress(string,string,string,string,address[],uint256)" | "getAddress(string,string,string,string,uint256)"): FunctionFragment;
    encodeFunctionData(functionFragment: "beacon", values?: undefined): string;
    encodeFunctionData(functionFragment: "owner", values?: undefined): string;
    encodeFunctionData(functionFragment: "renounceOwnership", values?: undefined): string;
    encodeFunctionData(functionFragment: "transferOwnership", values: [PromiseOrValue<string>]): string;
    encodeFunctionData(functionFragment: "createToken(string,string,string,string,address[],uint256)", values: [
        PromiseOrValue<string>,
        PromiseOrValue<string>,
        PromiseOrValue<string>,
        PromiseOrValue<string>,
        PromiseOrValue<string>[],
        PromiseOrValue<BigNumberish>
    ]): string;
    encodeFunctionData(functionFragment: "createToken(string,string,string,string,uint256)", values: [
        PromiseOrValue<string>,
        PromiseOrValue<string>,
        PromiseOrValue<string>,
        PromiseOrValue<string>,
        PromiseOrValue<BigNumberish>
    ]): string;
    encodeFunctionData(functionFragment: "getAddress(string,string,string,string,address[],uint256)", values: [
        PromiseOrValue<string>,
        PromiseOrValue<string>,
        PromiseOrValue<string>,
        PromiseOrValue<string>,
        PromiseOrValue<string>[],
        PromiseOrValue<BigNumberish>
    ]): string;
    encodeFunctionData(functionFragment: "getAddress(string,string,string,string,uint256)", values: [
        PromiseOrValue<string>,
        PromiseOrValue<string>,
        PromiseOrValue<string>,
        PromiseOrValue<string>,
        PromiseOrValue<BigNumberish>
    ]): string;
    decodeFunctionResult(functionFragment: "beacon", data: BytesLike): Result;
    decodeFunctionResult(functionFragment: "owner", data: BytesLike): Result;
    decodeFunctionResult(functionFragment: "renounceOwnership", data: BytesLike): Result;
    decodeFunctionResult(functionFragment: "transferOwnership", data: BytesLike): Result;
    decodeFunctionResult(functionFragment: "createToken(string,string,string,string,address[],uint256)", data: BytesLike): Result;
    decodeFunctionResult(functionFragment: "createToken(string,string,string,string,uint256)", data: BytesLike): Result;
    decodeFunctionResult(functionFragment: "getAddress(string,string,string,string,address[],uint256)", data: BytesLike): Result;
    decodeFunctionResult(functionFragment: "getAddress(string,string,string,string,uint256)", data: BytesLike): Result;
    events: {
        "Create1155RaribleProxy(address)": EventFragment;
        "Create1155RaribleUserProxy(address)": EventFragment;
        "OwnershipTransferred(address,address)": EventFragment;
    };
    getEvent(nameOrSignatureOrTopic: "Create1155RaribleProxy"): EventFragment;
    getEvent(nameOrSignatureOrTopic: "Create1155RaribleUserProxy"): EventFragment;
    getEvent(nameOrSignatureOrTopic: "OwnershipTransferred"): EventFragment;
}
export interface Create1155RaribleProxyEventObject {
    proxy: string;
}
export type Create1155RaribleProxyEvent = TypedEvent<[
    string
], Create1155RaribleProxyEventObject>;
export type Create1155RaribleProxyEventFilter = TypedEventFilter<Create1155RaribleProxyEvent>;
export interface Create1155RaribleUserProxyEventObject {
    proxy: string;
}
export type Create1155RaribleUserProxyEvent = TypedEvent<[
    string
], Create1155RaribleUserProxyEventObject>;
export type Create1155RaribleUserProxyEventFilter = TypedEventFilter<Create1155RaribleUserProxyEvent>;
export interface OwnershipTransferredEventObject {
    previousOwner: string;
    newOwner: string;
}
export type OwnershipTransferredEvent = TypedEvent<[
    string,
    string
], OwnershipTransferredEventObject>;
export type OwnershipTransferredEventFilter = TypedEventFilter<OwnershipTransferredEvent>;
export interface ERC1155RaribleFactoryC2 extends BaseContract {
    connect(signerOrProvider: Signer | Provider | string): this;
    attach(addressOrName: string): this;
    deployed(): Promise<this>;
    interface: ERC1155RaribleFactoryC2Interface;
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
        beacon(overrides?: CallOverrides): Promise<[string]>;
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
        "createToken(string,string,string,string,address[],uint256)"(_name: PromiseOrValue<string>, _symbol: PromiseOrValue<string>, baseURI: PromiseOrValue<string>, contractURI: PromiseOrValue<string>, operators: PromiseOrValue<string>[], salt: PromiseOrValue<BigNumberish>, overrides?: Overrides & {
            from?: PromiseOrValue<string>;
        }): Promise<ContractTransaction>;
        "createToken(string,string,string,string,uint256)"(_name: PromiseOrValue<string>, _symbol: PromiseOrValue<string>, baseURI: PromiseOrValue<string>, contractURI: PromiseOrValue<string>, salt: PromiseOrValue<BigNumberish>, overrides?: Overrides & {
            from?: PromiseOrValue<string>;
        }): Promise<ContractTransaction>;
        "getAddress(string,string,string,string,address[],uint256)"(_name: PromiseOrValue<string>, _symbol: PromiseOrValue<string>, baseURI: PromiseOrValue<string>, contractURI: PromiseOrValue<string>, operators: PromiseOrValue<string>[], _salt: PromiseOrValue<BigNumberish>, overrides?: CallOverrides): Promise<[string]>;
        "getAddress(string,string,string,string,uint256)"(_name: PromiseOrValue<string>, _symbol: PromiseOrValue<string>, baseURI: PromiseOrValue<string>, contractURI: PromiseOrValue<string>, _salt: PromiseOrValue<BigNumberish>, overrides?: CallOverrides): Promise<[string]>;
    };
    beacon(overrides?: CallOverrides): Promise<string>;
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
    "createToken(string,string,string,string,address[],uint256)"(_name: PromiseOrValue<string>, _symbol: PromiseOrValue<string>, baseURI: PromiseOrValue<string>, contractURI: PromiseOrValue<string>, operators: PromiseOrValue<string>[], salt: PromiseOrValue<BigNumberish>, overrides?: Overrides & {
        from?: PromiseOrValue<string>;
    }): Promise<ContractTransaction>;
    "createToken(string,string,string,string,uint256)"(_name: PromiseOrValue<string>, _symbol: PromiseOrValue<string>, baseURI: PromiseOrValue<string>, contractURI: PromiseOrValue<string>, salt: PromiseOrValue<BigNumberish>, overrides?: Overrides & {
        from?: PromiseOrValue<string>;
    }): Promise<ContractTransaction>;
    "getAddress(string,string,string,string,address[],uint256)"(_name: PromiseOrValue<string>, _symbol: PromiseOrValue<string>, baseURI: PromiseOrValue<string>, contractURI: PromiseOrValue<string>, operators: PromiseOrValue<string>[], _salt: PromiseOrValue<BigNumberish>, overrides?: CallOverrides): Promise<string>;
    "getAddress(string,string,string,string,uint256)"(_name: PromiseOrValue<string>, _symbol: PromiseOrValue<string>, baseURI: PromiseOrValue<string>, contractURI: PromiseOrValue<string>, _salt: PromiseOrValue<BigNumberish>, overrides?: CallOverrides): Promise<string>;
    callStatic: {
        beacon(overrides?: CallOverrides): Promise<string>;
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
        "createToken(string,string,string,string,address[],uint256)"(_name: PromiseOrValue<string>, _symbol: PromiseOrValue<string>, baseURI: PromiseOrValue<string>, contractURI: PromiseOrValue<string>, operators: PromiseOrValue<string>[], salt: PromiseOrValue<BigNumberish>, overrides?: CallOverrides): Promise<void>;
        "createToken(string,string,string,string,uint256)"(_name: PromiseOrValue<string>, _symbol: PromiseOrValue<string>, baseURI: PromiseOrValue<string>, contractURI: PromiseOrValue<string>, salt: PromiseOrValue<BigNumberish>, overrides?: CallOverrides): Promise<void>;
        "getAddress(string,string,string,string,address[],uint256)"(_name: PromiseOrValue<string>, _symbol: PromiseOrValue<string>, baseURI: PromiseOrValue<string>, contractURI: PromiseOrValue<string>, operators: PromiseOrValue<string>[], _salt: PromiseOrValue<BigNumberish>, overrides?: CallOverrides): Promise<string>;
        "getAddress(string,string,string,string,uint256)"(_name: PromiseOrValue<string>, _symbol: PromiseOrValue<string>, baseURI: PromiseOrValue<string>, contractURI: PromiseOrValue<string>, _salt: PromiseOrValue<BigNumberish>, overrides?: CallOverrides): Promise<string>;
    };
    filters: {
        "Create1155RaribleProxy(address)"(proxy?: null): Create1155RaribleProxyEventFilter;
        Create1155RaribleProxy(proxy?: null): Create1155RaribleProxyEventFilter;
        "Create1155RaribleUserProxy(address)"(proxy?: null): Create1155RaribleUserProxyEventFilter;
        Create1155RaribleUserProxy(proxy?: null): Create1155RaribleUserProxyEventFilter;
        "OwnershipTransferred(address,address)"(previousOwner?: PromiseOrValue<string> | null, newOwner?: PromiseOrValue<string> | null): OwnershipTransferredEventFilter;
        OwnershipTransferred(previousOwner?: PromiseOrValue<string> | null, newOwner?: PromiseOrValue<string> | null): OwnershipTransferredEventFilter;
    };
    estimateGas: {
        beacon(overrides?: CallOverrides): Promise<BigNumber>;
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
        "createToken(string,string,string,string,address[],uint256)"(_name: PromiseOrValue<string>, _symbol: PromiseOrValue<string>, baseURI: PromiseOrValue<string>, contractURI: PromiseOrValue<string>, operators: PromiseOrValue<string>[], salt: PromiseOrValue<BigNumberish>, overrides?: Overrides & {
            from?: PromiseOrValue<string>;
        }): Promise<BigNumber>;
        "createToken(string,string,string,string,uint256)"(_name: PromiseOrValue<string>, _symbol: PromiseOrValue<string>, baseURI: PromiseOrValue<string>, contractURI: PromiseOrValue<string>, salt: PromiseOrValue<BigNumberish>, overrides?: Overrides & {
            from?: PromiseOrValue<string>;
        }): Promise<BigNumber>;
        "getAddress(string,string,string,string,address[],uint256)"(_name: PromiseOrValue<string>, _symbol: PromiseOrValue<string>, baseURI: PromiseOrValue<string>, contractURI: PromiseOrValue<string>, operators: PromiseOrValue<string>[], _salt: PromiseOrValue<BigNumberish>, overrides?: CallOverrides): Promise<BigNumber>;
        "getAddress(string,string,string,string,uint256)"(_name: PromiseOrValue<string>, _symbol: PromiseOrValue<string>, baseURI: PromiseOrValue<string>, contractURI: PromiseOrValue<string>, _salt: PromiseOrValue<BigNumberish>, overrides?: CallOverrides): Promise<BigNumber>;
    };
    populateTransaction: {
        beacon(overrides?: CallOverrides): Promise<PopulatedTransaction>;
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
        "createToken(string,string,string,string,address[],uint256)"(_name: PromiseOrValue<string>, _symbol: PromiseOrValue<string>, baseURI: PromiseOrValue<string>, contractURI: PromiseOrValue<string>, operators: PromiseOrValue<string>[], salt: PromiseOrValue<BigNumberish>, overrides?: Overrides & {
            from?: PromiseOrValue<string>;
        }): Promise<PopulatedTransaction>;
        "createToken(string,string,string,string,uint256)"(_name: PromiseOrValue<string>, _symbol: PromiseOrValue<string>, baseURI: PromiseOrValue<string>, contractURI: PromiseOrValue<string>, salt: PromiseOrValue<BigNumberish>, overrides?: Overrides & {
            from?: PromiseOrValue<string>;
        }): Promise<PopulatedTransaction>;
        "getAddress(string,string,string,string,address[],uint256)"(_name: PromiseOrValue<string>, _symbol: PromiseOrValue<string>, baseURI: PromiseOrValue<string>, contractURI: PromiseOrValue<string>, operators: PromiseOrValue<string>[], _salt: PromiseOrValue<BigNumberish>, overrides?: CallOverrides): Promise<PopulatedTransaction>;
        "getAddress(string,string,string,string,uint256)"(_name: PromiseOrValue<string>, _symbol: PromiseOrValue<string>, baseURI: PromiseOrValue<string>, contractURI: PromiseOrValue<string>, _salt: PromiseOrValue<BigNumberish>, overrides?: CallOverrides): Promise<PopulatedTransaction>;
    };
}
