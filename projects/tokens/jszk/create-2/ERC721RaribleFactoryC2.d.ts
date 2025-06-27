import type { BaseContract, BigNumber, BigNumberish, BytesLike, CallOverrides, ContractTransaction, Overrides, PopulatedTransaction, Signer, utils } from "ethers";
import type { FunctionFragment, Result, EventFragment } from "@ethersproject/abi";
import type { Listener, Provider } from "@ethersproject/providers";
import type { TypedEventFilter, TypedEvent, TypedListener, OnEvent, PromiseOrValue } from "../common";
export interface ERC721RaribleFactoryC2Interface extends utils.Interface {
    functions: {
        "beacon()": FunctionFragment;
        "createToken(string,string,string,string,address[],uint256)": FunctionFragment;
        "createToken(string,string,string,string,uint256)": FunctionFragment;
        "getAddress(string,string,string,string,address[],uint256)": FunctionFragment;
        "getAddress(string,string,string,string,uint256)": FunctionFragment;
        "owner()": FunctionFragment;
        "renounceOwnership()": FunctionFragment;
        "transferOwnership(address)": FunctionFragment;
    };
    getFunction(nameOrSignatureOrTopic: "beacon" | "createToken(string,string,string,string,address[],uint256)" | "createToken(string,string,string,string,uint256)" | "getAddress(string,string,string,string,address[],uint256)" | "getAddress(string,string,string,string,uint256)" | "owner" | "renounceOwnership" | "transferOwnership"): FunctionFragment;
    encodeFunctionData(functionFragment: "beacon", values?: undefined): string;
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
    encodeFunctionData(functionFragment: "owner", values?: undefined): string;
    encodeFunctionData(functionFragment: "renounceOwnership", values?: undefined): string;
    encodeFunctionData(functionFragment: "transferOwnership", values: [PromiseOrValue<string>]): string;
    decodeFunctionResult(functionFragment: "beacon", data: BytesLike): Result;
    decodeFunctionResult(functionFragment: "createToken(string,string,string,string,address[],uint256)", data: BytesLike): Result;
    decodeFunctionResult(functionFragment: "createToken(string,string,string,string,uint256)", data: BytesLike): Result;
    decodeFunctionResult(functionFragment: "getAddress(string,string,string,string,address[],uint256)", data: BytesLike): Result;
    decodeFunctionResult(functionFragment: "getAddress(string,string,string,string,uint256)", data: BytesLike): Result;
    decodeFunctionResult(functionFragment: "owner", data: BytesLike): Result;
    decodeFunctionResult(functionFragment: "renounceOwnership", data: BytesLike): Result;
    decodeFunctionResult(functionFragment: "transferOwnership", data: BytesLike): Result;
    events: {
        "Create721RaribleProxy(address)": EventFragment;
        "Create721RaribleUserProxy(address)": EventFragment;
        "OwnershipTransferred(address,address)": EventFragment;
    };
    getEvent(nameOrSignatureOrTopic: "Create721RaribleProxy"): EventFragment;
    getEvent(nameOrSignatureOrTopic: "Create721RaribleUserProxy"): EventFragment;
    getEvent(nameOrSignatureOrTopic: "OwnershipTransferred"): EventFragment;
}
export interface Create721RaribleProxyEventObject {
    proxy: string;
}
export type Create721RaribleProxyEvent = TypedEvent<[
    string
], Create721RaribleProxyEventObject>;
export type Create721RaribleProxyEventFilter = TypedEventFilter<Create721RaribleProxyEvent>;
export interface Create721RaribleUserProxyEventObject {
    proxy: string;
}
export type Create721RaribleUserProxyEvent = TypedEvent<[
    string
], Create721RaribleUserProxyEventObject>;
export type Create721RaribleUserProxyEventFilter = TypedEventFilter<Create721RaribleUserProxyEvent>;
export interface OwnershipTransferredEventObject {
    previousOwner: string;
    newOwner: string;
}
export type OwnershipTransferredEvent = TypedEvent<[
    string,
    string
], OwnershipTransferredEventObject>;
export type OwnershipTransferredEventFilter = TypedEventFilter<OwnershipTransferredEvent>;
export interface ERC721RaribleFactoryC2 extends BaseContract {
    connect(signerOrProvider: Signer | Provider | string): this;
    attach(addressOrName: string): this;
    deployed(): Promise<this>;
    interface: ERC721RaribleFactoryC2Interface;
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
        "createToken(string,string,string,string,address[],uint256)"(_name: PromiseOrValue<string>, _symbol: PromiseOrValue<string>, baseURI: PromiseOrValue<string>, contractURI: PromiseOrValue<string>, operators: PromiseOrValue<string>[], salt: PromiseOrValue<BigNumberish>, overrides?: Overrides & {
            from?: PromiseOrValue<string>;
        }): Promise<ContractTransaction>;
        "createToken(string,string,string,string,uint256)"(_name: PromiseOrValue<string>, _symbol: PromiseOrValue<string>, baseURI: PromiseOrValue<string>, contractURI: PromiseOrValue<string>, salt: PromiseOrValue<BigNumberish>, overrides?: Overrides & {
            from?: PromiseOrValue<string>;
        }): Promise<ContractTransaction>;
        "getAddress(string,string,string,string,address[],uint256)"(_name: PromiseOrValue<string>, _symbol: PromiseOrValue<string>, baseURI: PromiseOrValue<string>, contractURI: PromiseOrValue<string>, operators: PromiseOrValue<string>[], _salt: PromiseOrValue<BigNumberish>, overrides?: CallOverrides): Promise<[string]>;
        "getAddress(string,string,string,string,uint256)"(_name: PromiseOrValue<string>, _symbol: PromiseOrValue<string>, baseURI: PromiseOrValue<string>, contractURI: PromiseOrValue<string>, _salt: PromiseOrValue<BigNumberish>, overrides?: CallOverrides): Promise<[string]>;
        owner(overrides?: CallOverrides): Promise<[string]>;
        renounceOwnership(overrides?: Overrides & {
            from?: PromiseOrValue<string>;
        }): Promise<ContractTransaction>;
        transferOwnership(newOwner: PromiseOrValue<string>, overrides?: Overrides & {
            from?: PromiseOrValue<string>;
        }): Promise<ContractTransaction>;
    };
    beacon(overrides?: CallOverrides): Promise<string>;
    "createToken(string,string,string,string,address[],uint256)"(_name: PromiseOrValue<string>, _symbol: PromiseOrValue<string>, baseURI: PromiseOrValue<string>, contractURI: PromiseOrValue<string>, operators: PromiseOrValue<string>[], salt: PromiseOrValue<BigNumberish>, overrides?: Overrides & {
        from?: PromiseOrValue<string>;
    }): Promise<ContractTransaction>;
    "createToken(string,string,string,string,uint256)"(_name: PromiseOrValue<string>, _symbol: PromiseOrValue<string>, baseURI: PromiseOrValue<string>, contractURI: PromiseOrValue<string>, salt: PromiseOrValue<BigNumberish>, overrides?: Overrides & {
        from?: PromiseOrValue<string>;
    }): Promise<ContractTransaction>;
    "getAddress(string,string,string,string,address[],uint256)"(_name: PromiseOrValue<string>, _symbol: PromiseOrValue<string>, baseURI: PromiseOrValue<string>, contractURI: PromiseOrValue<string>, operators: PromiseOrValue<string>[], _salt: PromiseOrValue<BigNumberish>, overrides?: CallOverrides): Promise<string>;
    "getAddress(string,string,string,string,uint256)"(_name: PromiseOrValue<string>, _symbol: PromiseOrValue<string>, baseURI: PromiseOrValue<string>, contractURI: PromiseOrValue<string>, _salt: PromiseOrValue<BigNumberish>, overrides?: CallOverrides): Promise<string>;
    owner(overrides?: CallOverrides): Promise<string>;
    renounceOwnership(overrides?: Overrides & {
        from?: PromiseOrValue<string>;
    }): Promise<ContractTransaction>;
    transferOwnership(newOwner: PromiseOrValue<string>, overrides?: Overrides & {
        from?: PromiseOrValue<string>;
    }): Promise<ContractTransaction>;
    callStatic: {
        beacon(overrides?: CallOverrides): Promise<string>;
        "createToken(string,string,string,string,address[],uint256)"(_name: PromiseOrValue<string>, _symbol: PromiseOrValue<string>, baseURI: PromiseOrValue<string>, contractURI: PromiseOrValue<string>, operators: PromiseOrValue<string>[], salt: PromiseOrValue<BigNumberish>, overrides?: CallOverrides): Promise<void>;
        "createToken(string,string,string,string,uint256)"(_name: PromiseOrValue<string>, _symbol: PromiseOrValue<string>, baseURI: PromiseOrValue<string>, contractURI: PromiseOrValue<string>, salt: PromiseOrValue<BigNumberish>, overrides?: CallOverrides): Promise<void>;
        "getAddress(string,string,string,string,address[],uint256)"(_name: PromiseOrValue<string>, _symbol: PromiseOrValue<string>, baseURI: PromiseOrValue<string>, contractURI: PromiseOrValue<string>, operators: PromiseOrValue<string>[], _salt: PromiseOrValue<BigNumberish>, overrides?: CallOverrides): Promise<string>;
        "getAddress(string,string,string,string,uint256)"(_name: PromiseOrValue<string>, _symbol: PromiseOrValue<string>, baseURI: PromiseOrValue<string>, contractURI: PromiseOrValue<string>, _salt: PromiseOrValue<BigNumberish>, overrides?: CallOverrides): Promise<string>;
        owner(overrides?: CallOverrides): Promise<string>;
        renounceOwnership(overrides?: CallOverrides): Promise<void>;
        transferOwnership(newOwner: PromiseOrValue<string>, overrides?: CallOverrides): Promise<void>;
    };
    filters: {
        "Create721RaribleProxy(address)"(proxy?: null): Create721RaribleProxyEventFilter;
        Create721RaribleProxy(proxy?: null): Create721RaribleProxyEventFilter;
        "Create721RaribleUserProxy(address)"(proxy?: null): Create721RaribleUserProxyEventFilter;
        Create721RaribleUserProxy(proxy?: null): Create721RaribleUserProxyEventFilter;
        "OwnershipTransferred(address,address)"(previousOwner?: PromiseOrValue<string> | null, newOwner?: PromiseOrValue<string> | null): OwnershipTransferredEventFilter;
        OwnershipTransferred(previousOwner?: PromiseOrValue<string> | null, newOwner?: PromiseOrValue<string> | null): OwnershipTransferredEventFilter;
    };
    estimateGas: {
        beacon(overrides?: CallOverrides): Promise<BigNumber>;
        "createToken(string,string,string,string,address[],uint256)"(_name: PromiseOrValue<string>, _symbol: PromiseOrValue<string>, baseURI: PromiseOrValue<string>, contractURI: PromiseOrValue<string>, operators: PromiseOrValue<string>[], salt: PromiseOrValue<BigNumberish>, overrides?: Overrides & {
            from?: PromiseOrValue<string>;
        }): Promise<BigNumber>;
        "createToken(string,string,string,string,uint256)"(_name: PromiseOrValue<string>, _symbol: PromiseOrValue<string>, baseURI: PromiseOrValue<string>, contractURI: PromiseOrValue<string>, salt: PromiseOrValue<BigNumberish>, overrides?: Overrides & {
            from?: PromiseOrValue<string>;
        }): Promise<BigNumber>;
        "getAddress(string,string,string,string,address[],uint256)"(_name: PromiseOrValue<string>, _symbol: PromiseOrValue<string>, baseURI: PromiseOrValue<string>, contractURI: PromiseOrValue<string>, operators: PromiseOrValue<string>[], _salt: PromiseOrValue<BigNumberish>, overrides?: CallOverrides): Promise<BigNumber>;
        "getAddress(string,string,string,string,uint256)"(_name: PromiseOrValue<string>, _symbol: PromiseOrValue<string>, baseURI: PromiseOrValue<string>, contractURI: PromiseOrValue<string>, _salt: PromiseOrValue<BigNumberish>, overrides?: CallOverrides): Promise<BigNumber>;
        owner(overrides?: CallOverrides): Promise<BigNumber>;
        renounceOwnership(overrides?: Overrides & {
            from?: PromiseOrValue<string>;
        }): Promise<BigNumber>;
        transferOwnership(newOwner: PromiseOrValue<string>, overrides?: Overrides & {
            from?: PromiseOrValue<string>;
        }): Promise<BigNumber>;
    };
    populateTransaction: {
        beacon(overrides?: CallOverrides): Promise<PopulatedTransaction>;
        "createToken(string,string,string,string,address[],uint256)"(_name: PromiseOrValue<string>, _symbol: PromiseOrValue<string>, baseURI: PromiseOrValue<string>, contractURI: PromiseOrValue<string>, operators: PromiseOrValue<string>[], salt: PromiseOrValue<BigNumberish>, overrides?: Overrides & {
            from?: PromiseOrValue<string>;
        }): Promise<PopulatedTransaction>;
        "createToken(string,string,string,string,uint256)"(_name: PromiseOrValue<string>, _symbol: PromiseOrValue<string>, baseURI: PromiseOrValue<string>, contractURI: PromiseOrValue<string>, salt: PromiseOrValue<BigNumberish>, overrides?: Overrides & {
            from?: PromiseOrValue<string>;
        }): Promise<PopulatedTransaction>;
        "getAddress(string,string,string,string,address[],uint256)"(_name: PromiseOrValue<string>, _symbol: PromiseOrValue<string>, baseURI: PromiseOrValue<string>, contractURI: PromiseOrValue<string>, operators: PromiseOrValue<string>[], _salt: PromiseOrValue<BigNumberish>, overrides?: CallOverrides): Promise<PopulatedTransaction>;
        "getAddress(string,string,string,string,uint256)"(_name: PromiseOrValue<string>, _symbol: PromiseOrValue<string>, baseURI: PromiseOrValue<string>, contractURI: PromiseOrValue<string>, _salt: PromiseOrValue<BigNumberish>, overrides?: CallOverrides): Promise<PopulatedTransaction>;
        owner(overrides?: CallOverrides): Promise<PopulatedTransaction>;
        renounceOwnership(overrides?: Overrides & {
            from?: PromiseOrValue<string>;
        }): Promise<PopulatedTransaction>;
        transferOwnership(newOwner: PromiseOrValue<string>, overrides?: Overrides & {
            from?: PromiseOrValue<string>;
        }): Promise<PopulatedTransaction>;
    };
}
