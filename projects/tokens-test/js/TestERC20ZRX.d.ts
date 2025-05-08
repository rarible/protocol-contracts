import type { BaseContract, BigNumber, BigNumberish, BytesLike, CallOverrides, ContractTransaction, Overrides, PopulatedTransaction, Signer, utils } from "ethers";
import type { FunctionFragment, Result, EventFragment } from "@ethersproject/abi";
import type { Listener, Provider } from "@ethersproject/providers";
import type { TypedEventFilter, TypedEvent, TypedListener, OnEvent, PromiseOrValue } from "./common";
export interface TestERC20ZRXInterface extends utils.Interface {
    functions: {
        "allowance(address,address)": FunctionFragment;
        "approve(address,uint256)": FunctionFragment;
        "balanceOf(address)": FunctionFragment;
        "transfer(address,uint256)": FunctionFragment;
        "transferFrom(address,address,uint256)": FunctionFragment;
        "name()": FunctionFragment;
        "symbol()": FunctionFragment;
        "decimals()": FunctionFragment;
        "totalSupply()": FunctionFragment;
    };
    getFunction(nameOrSignatureOrTopic: "allowance" | "approve" | "balanceOf" | "transfer" | "transferFrom" | "name" | "symbol" | "decimals" | "totalSupply"): FunctionFragment;
    encodeFunctionData(functionFragment: "allowance", values: [PromiseOrValue<string>, PromiseOrValue<string>]): string;
    encodeFunctionData(functionFragment: "approve", values: [PromiseOrValue<string>, PromiseOrValue<BigNumberish>]): string;
    encodeFunctionData(functionFragment: "balanceOf", values: [PromiseOrValue<string>]): string;
    encodeFunctionData(functionFragment: "transfer", values: [PromiseOrValue<string>, PromiseOrValue<BigNumberish>]): string;
    encodeFunctionData(functionFragment: "transferFrom", values: [
        PromiseOrValue<string>,
        PromiseOrValue<string>,
        PromiseOrValue<BigNumberish>
    ]): string;
    encodeFunctionData(functionFragment: "name", values?: undefined): string;
    encodeFunctionData(functionFragment: "symbol", values?: undefined): string;
    encodeFunctionData(functionFragment: "decimals", values?: undefined): string;
    encodeFunctionData(functionFragment: "totalSupply", values?: undefined): string;
    decodeFunctionResult(functionFragment: "allowance", data: BytesLike): Result;
    decodeFunctionResult(functionFragment: "approve", data: BytesLike): Result;
    decodeFunctionResult(functionFragment: "balanceOf", data: BytesLike): Result;
    decodeFunctionResult(functionFragment: "transfer", data: BytesLike): Result;
    decodeFunctionResult(functionFragment: "transferFrom", data: BytesLike): Result;
    decodeFunctionResult(functionFragment: "name", data: BytesLike): Result;
    decodeFunctionResult(functionFragment: "symbol", data: BytesLike): Result;
    decodeFunctionResult(functionFragment: "decimals", data: BytesLike): Result;
    decodeFunctionResult(functionFragment: "totalSupply", data: BytesLike): Result;
    events: {
        "Approval(address,address,uint256)": EventFragment;
        "Transfer(address,address,uint256)": EventFragment;
    };
    getEvent(nameOrSignatureOrTopic: "Approval"): EventFragment;
    getEvent(nameOrSignatureOrTopic: "Transfer"): EventFragment;
}
export interface ApprovalEventObject {
    _owner: string;
    _spender: string;
    _value: BigNumber;
}
export type ApprovalEvent = TypedEvent<[
    string,
    string,
    BigNumber
], ApprovalEventObject>;
export type ApprovalEventFilter = TypedEventFilter<ApprovalEvent>;
export interface TransferEventObject {
    _from: string;
    _to: string;
    _value: BigNumber;
}
export type TransferEvent = TypedEvent<[
    string,
    string,
    BigNumber
], TransferEventObject>;
export type TransferEventFilter = TypedEventFilter<TransferEvent>;
export interface TestERC20ZRX extends BaseContract {
    connect(signerOrProvider: Signer | Provider | string): this;
    attach(addressOrName: string): this;
    deployed(): Promise<this>;
    interface: TestERC20ZRXInterface;
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
         * @param _owner The address of the account owning tokens
         * @param _spender The address of the account able to transfer the tokens
         */
        allowance(_owner: PromiseOrValue<string>, _spender: PromiseOrValue<string>, overrides?: CallOverrides): Promise<[BigNumber] & {
            remaining: BigNumber;
        }>;
        /**
         * `msg.sender` approves `_addr` to spend `_value` tokens
         * @param _spender The address of the account able to transfer the tokens
         * @param _value The amount of wei to be approved for transfer
         */
        approve(_spender: PromiseOrValue<string>, _value: PromiseOrValue<BigNumberish>, overrides?: Overrides & {
            from?: PromiseOrValue<string>;
        }): Promise<ContractTransaction>;
        /**
         * @param _owner The address from which the balance will be retrieved
         */
        balanceOf(_owner: PromiseOrValue<string>, overrides?: CallOverrides): Promise<[BigNumber] & {
            balance: BigNumber;
        }>;
        /**
         * send `_value` token to `_to` from `msg.sender`
         * @param _to The address of the recipient
         * @param _value The amount of token to be transferred
         */
        transfer(_to: PromiseOrValue<string>, _value: PromiseOrValue<BigNumberish>, overrides?: Overrides & {
            from?: PromiseOrValue<string>;
        }): Promise<ContractTransaction>;
        /**
         * ERC20 transferFrom, modified such that an allowance of MAX_UINT represents an unlimited allowance.
         * @param _from Address to transfer from.
         * @param _to Address to transfer to.
         * @param _value Amount to transfer.
         */
        transferFrom(_from: PromiseOrValue<string>, _to: PromiseOrValue<string>, _value: PromiseOrValue<BigNumberish>, overrides?: Overrides & {
            from?: PromiseOrValue<string>;
        }): Promise<ContractTransaction>;
        name(overrides?: CallOverrides): Promise<[string]>;
        symbol(overrides?: CallOverrides): Promise<[string]>;
        decimals(overrides?: CallOverrides): Promise<[number]>;
        /**
         */
        totalSupply(overrides?: CallOverrides): Promise<[BigNumber]>;
    };
    /**
     * @param _owner The address of the account owning tokens
     * @param _spender The address of the account able to transfer the tokens
     */
    allowance(_owner: PromiseOrValue<string>, _spender: PromiseOrValue<string>, overrides?: CallOverrides): Promise<BigNumber>;
    /**
     * `msg.sender` approves `_addr` to spend `_value` tokens
     * @param _spender The address of the account able to transfer the tokens
     * @param _value The amount of wei to be approved for transfer
     */
    approve(_spender: PromiseOrValue<string>, _value: PromiseOrValue<BigNumberish>, overrides?: Overrides & {
        from?: PromiseOrValue<string>;
    }): Promise<ContractTransaction>;
    /**
     * @param _owner The address from which the balance will be retrieved
     */
    balanceOf(_owner: PromiseOrValue<string>, overrides?: CallOverrides): Promise<BigNumber>;
    /**
     * send `_value` token to `_to` from `msg.sender`
     * @param _to The address of the recipient
     * @param _value The amount of token to be transferred
     */
    transfer(_to: PromiseOrValue<string>, _value: PromiseOrValue<BigNumberish>, overrides?: Overrides & {
        from?: PromiseOrValue<string>;
    }): Promise<ContractTransaction>;
    /**
     * ERC20 transferFrom, modified such that an allowance of MAX_UINT represents an unlimited allowance.
     * @param _from Address to transfer from.
     * @param _to Address to transfer to.
     * @param _value Amount to transfer.
     */
    transferFrom(_from: PromiseOrValue<string>, _to: PromiseOrValue<string>, _value: PromiseOrValue<BigNumberish>, overrides?: Overrides & {
        from?: PromiseOrValue<string>;
    }): Promise<ContractTransaction>;
    name(overrides?: CallOverrides): Promise<string>;
    symbol(overrides?: CallOverrides): Promise<string>;
    decimals(overrides?: CallOverrides): Promise<number>;
    /**
     */
    totalSupply(overrides?: CallOverrides): Promise<BigNumber>;
    callStatic: {
        /**
         * @param _owner The address of the account owning tokens
         * @param _spender The address of the account able to transfer the tokens
         */
        allowance(_owner: PromiseOrValue<string>, _spender: PromiseOrValue<string>, overrides?: CallOverrides): Promise<BigNumber>;
        /**
         * `msg.sender` approves `_addr` to spend `_value` tokens
         * @param _spender The address of the account able to transfer the tokens
         * @param _value The amount of wei to be approved for transfer
         */
        approve(_spender: PromiseOrValue<string>, _value: PromiseOrValue<BigNumberish>, overrides?: CallOverrides): Promise<boolean>;
        /**
         * @param _owner The address from which the balance will be retrieved
         */
        balanceOf(_owner: PromiseOrValue<string>, overrides?: CallOverrides): Promise<BigNumber>;
        /**
         * send `_value` token to `_to` from `msg.sender`
         * @param _to The address of the recipient
         * @param _value The amount of token to be transferred
         */
        transfer(_to: PromiseOrValue<string>, _value: PromiseOrValue<BigNumberish>, overrides?: CallOverrides): Promise<boolean>;
        /**
         * ERC20 transferFrom, modified such that an allowance of MAX_UINT represents an unlimited allowance.
         * @param _from Address to transfer from.
         * @param _to Address to transfer to.
         * @param _value Amount to transfer.
         */
        transferFrom(_from: PromiseOrValue<string>, _to: PromiseOrValue<string>, _value: PromiseOrValue<BigNumberish>, overrides?: CallOverrides): Promise<boolean>;
        name(overrides?: CallOverrides): Promise<string>;
        symbol(overrides?: CallOverrides): Promise<string>;
        decimals(overrides?: CallOverrides): Promise<number>;
        /**
         */
        totalSupply(overrides?: CallOverrides): Promise<BigNumber>;
    };
    filters: {
        "Approval(address,address,uint256)"(_owner?: PromiseOrValue<string> | null, _spender?: PromiseOrValue<string> | null, _value?: null): ApprovalEventFilter;
        Approval(_owner?: PromiseOrValue<string> | null, _spender?: PromiseOrValue<string> | null, _value?: null): ApprovalEventFilter;
        "Transfer(address,address,uint256)"(_from?: PromiseOrValue<string> | null, _to?: PromiseOrValue<string> | null, _value?: null): TransferEventFilter;
        Transfer(_from?: PromiseOrValue<string> | null, _to?: PromiseOrValue<string> | null, _value?: null): TransferEventFilter;
    };
    estimateGas: {
        /**
         * @param _owner The address of the account owning tokens
         * @param _spender The address of the account able to transfer the tokens
         */
        allowance(_owner: PromiseOrValue<string>, _spender: PromiseOrValue<string>, overrides?: CallOverrides): Promise<BigNumber>;
        /**
         * `msg.sender` approves `_addr` to spend `_value` tokens
         * @param _spender The address of the account able to transfer the tokens
         * @param _value The amount of wei to be approved for transfer
         */
        approve(_spender: PromiseOrValue<string>, _value: PromiseOrValue<BigNumberish>, overrides?: Overrides & {
            from?: PromiseOrValue<string>;
        }): Promise<BigNumber>;
        /**
         * @param _owner The address from which the balance will be retrieved
         */
        balanceOf(_owner: PromiseOrValue<string>, overrides?: CallOverrides): Promise<BigNumber>;
        /**
         * send `_value` token to `_to` from `msg.sender`
         * @param _to The address of the recipient
         * @param _value The amount of token to be transferred
         */
        transfer(_to: PromiseOrValue<string>, _value: PromiseOrValue<BigNumberish>, overrides?: Overrides & {
            from?: PromiseOrValue<string>;
        }): Promise<BigNumber>;
        /**
         * ERC20 transferFrom, modified such that an allowance of MAX_UINT represents an unlimited allowance.
         * @param _from Address to transfer from.
         * @param _to Address to transfer to.
         * @param _value Amount to transfer.
         */
        transferFrom(_from: PromiseOrValue<string>, _to: PromiseOrValue<string>, _value: PromiseOrValue<BigNumberish>, overrides?: Overrides & {
            from?: PromiseOrValue<string>;
        }): Promise<BigNumber>;
        name(overrides?: CallOverrides): Promise<BigNumber>;
        symbol(overrides?: CallOverrides): Promise<BigNumber>;
        decimals(overrides?: CallOverrides): Promise<BigNumber>;
        /**
         */
        totalSupply(overrides?: CallOverrides): Promise<BigNumber>;
    };
    populateTransaction: {
        /**
         * @param _owner The address of the account owning tokens
         * @param _spender The address of the account able to transfer the tokens
         */
        allowance(_owner: PromiseOrValue<string>, _spender: PromiseOrValue<string>, overrides?: CallOverrides): Promise<PopulatedTransaction>;
        /**
         * `msg.sender` approves `_addr` to spend `_value` tokens
         * @param _spender The address of the account able to transfer the tokens
         * @param _value The amount of wei to be approved for transfer
         */
        approve(_spender: PromiseOrValue<string>, _value: PromiseOrValue<BigNumberish>, overrides?: Overrides & {
            from?: PromiseOrValue<string>;
        }): Promise<PopulatedTransaction>;
        /**
         * @param _owner The address from which the balance will be retrieved
         */
        balanceOf(_owner: PromiseOrValue<string>, overrides?: CallOverrides): Promise<PopulatedTransaction>;
        /**
         * send `_value` token to `_to` from `msg.sender`
         * @param _to The address of the recipient
         * @param _value The amount of token to be transferred
         */
        transfer(_to: PromiseOrValue<string>, _value: PromiseOrValue<BigNumberish>, overrides?: Overrides & {
            from?: PromiseOrValue<string>;
        }): Promise<PopulatedTransaction>;
        /**
         * ERC20 transferFrom, modified such that an allowance of MAX_UINT represents an unlimited allowance.
         * @param _from Address to transfer from.
         * @param _to Address to transfer to.
         * @param _value Amount to transfer.
         */
        transferFrom(_from: PromiseOrValue<string>, _to: PromiseOrValue<string>, _value: PromiseOrValue<BigNumberish>, overrides?: Overrides & {
            from?: PromiseOrValue<string>;
        }): Promise<PopulatedTransaction>;
        name(overrides?: CallOverrides): Promise<PopulatedTransaction>;
        symbol(overrides?: CallOverrides): Promise<PopulatedTransaction>;
        decimals(overrides?: CallOverrides): Promise<PopulatedTransaction>;
        /**
         */
        totalSupply(overrides?: CallOverrides): Promise<PopulatedTransaction>;
    };
}
