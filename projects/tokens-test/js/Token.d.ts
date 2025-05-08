import type { BaseContract, BigNumber, BigNumberish, BytesLike, CallOverrides, ContractTransaction, Overrides, PopulatedTransaction, Signer, utils } from "ethers";
import type { FunctionFragment, Result, EventFragment } from "@ethersproject/abi";
import type { Listener, Provider } from "@ethersproject/providers";
import type { TypedEventFilter, TypedEvent, TypedListener, OnEvent, PromiseOrValue } from "./common";
export interface TokenInterface extends utils.Interface {
    functions: {
        "totalSupply()": FunctionFragment;
        "balanceOf(address)": FunctionFragment;
        "transfer(address,uint256)": FunctionFragment;
        "transferFrom(address,address,uint256)": FunctionFragment;
        "approve(address,uint256)": FunctionFragment;
        "allowance(address,address)": FunctionFragment;
    };
    getFunction(nameOrSignatureOrTopic: "totalSupply" | "balanceOf" | "transfer" | "transferFrom" | "approve" | "allowance"): FunctionFragment;
    encodeFunctionData(functionFragment: "totalSupply", values?: undefined): string;
    encodeFunctionData(functionFragment: "balanceOf", values: [PromiseOrValue<string>]): string;
    encodeFunctionData(functionFragment: "transfer", values: [PromiseOrValue<string>, PromiseOrValue<BigNumberish>]): string;
    encodeFunctionData(functionFragment: "transferFrom", values: [
        PromiseOrValue<string>,
        PromiseOrValue<string>,
        PromiseOrValue<BigNumberish>
    ]): string;
    encodeFunctionData(functionFragment: "approve", values: [PromiseOrValue<string>, PromiseOrValue<BigNumberish>]): string;
    encodeFunctionData(functionFragment: "allowance", values: [PromiseOrValue<string>, PromiseOrValue<string>]): string;
    decodeFunctionResult(functionFragment: "totalSupply", data: BytesLike): Result;
    decodeFunctionResult(functionFragment: "balanceOf", data: BytesLike): Result;
    decodeFunctionResult(functionFragment: "transfer", data: BytesLike): Result;
    decodeFunctionResult(functionFragment: "transferFrom", data: BytesLike): Result;
    decodeFunctionResult(functionFragment: "approve", data: BytesLike): Result;
    decodeFunctionResult(functionFragment: "allowance", data: BytesLike): Result;
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
export interface Token extends BaseContract {
    connect(signerOrProvider: Signer | Provider | string): this;
    attach(addressOrName: string): this;
    deployed(): Promise<this>;
    interface: TokenInterface;
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
         */
        totalSupply(overrides?: CallOverrides): Promise<[BigNumber]>;
        /**
         * @param _owner The address from which the balance will be retrieved
         */
        balanceOf(_owner: PromiseOrValue<string>, overrides?: CallOverrides): Promise<[BigNumber]>;
        /**
         * send `_value` token to `_to` from `msg.sender`
         * @param _to The address of the recipient
         * @param _value The amount of token to be transferred
         */
        transfer(_to: PromiseOrValue<string>, _value: PromiseOrValue<BigNumberish>, overrides?: Overrides & {
            from?: PromiseOrValue<string>;
        }): Promise<ContractTransaction>;
        /**
         * send `_value` token to `_to` from `_from` on the condition it is approved by `_from`
         * @param _from The address of the sender
         * @param _to The address of the recipient
         * @param _value The amount of token to be transferred
         */
        transferFrom(_from: PromiseOrValue<string>, _to: PromiseOrValue<string>, _value: PromiseOrValue<BigNumberish>, overrides?: Overrides & {
            from?: PromiseOrValue<string>;
        }): Promise<ContractTransaction>;
        /**
         * `msg.sender` approves `_addr` to spend `_value` tokens
         * @param _spender The address of the account able to transfer the tokens
         * @param _value The amount of wei to be approved for transfer
         */
        approve(_spender: PromiseOrValue<string>, _value: PromiseOrValue<BigNumberish>, overrides?: Overrides & {
            from?: PromiseOrValue<string>;
        }): Promise<ContractTransaction>;
        /**
         * @param _owner The address of the account owning tokens
         * @param _spender The address of the account able to transfer the tokens
         */
        allowance(_owner: PromiseOrValue<string>, _spender: PromiseOrValue<string>, overrides?: CallOverrides): Promise<[BigNumber]>;
    };
    /**
     */
    totalSupply(overrides?: CallOverrides): Promise<BigNumber>;
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
     * send `_value` token to `_to` from `_from` on the condition it is approved by `_from`
     * @param _from The address of the sender
     * @param _to The address of the recipient
     * @param _value The amount of token to be transferred
     */
    transferFrom(_from: PromiseOrValue<string>, _to: PromiseOrValue<string>, _value: PromiseOrValue<BigNumberish>, overrides?: Overrides & {
        from?: PromiseOrValue<string>;
    }): Promise<ContractTransaction>;
    /**
     * `msg.sender` approves `_addr` to spend `_value` tokens
     * @param _spender The address of the account able to transfer the tokens
     * @param _value The amount of wei to be approved for transfer
     */
    approve(_spender: PromiseOrValue<string>, _value: PromiseOrValue<BigNumberish>, overrides?: Overrides & {
        from?: PromiseOrValue<string>;
    }): Promise<ContractTransaction>;
    /**
     * @param _owner The address of the account owning tokens
     * @param _spender The address of the account able to transfer the tokens
     */
    allowance(_owner: PromiseOrValue<string>, _spender: PromiseOrValue<string>, overrides?: CallOverrides): Promise<BigNumber>;
    callStatic: {
        /**
         */
        totalSupply(overrides?: CallOverrides): Promise<BigNumber>;
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
         * send `_value` token to `_to` from `_from` on the condition it is approved by `_from`
         * @param _from The address of the sender
         * @param _to The address of the recipient
         * @param _value The amount of token to be transferred
         */
        transferFrom(_from: PromiseOrValue<string>, _to: PromiseOrValue<string>, _value: PromiseOrValue<BigNumberish>, overrides?: CallOverrides): Promise<boolean>;
        /**
         * `msg.sender` approves `_addr` to spend `_value` tokens
         * @param _spender The address of the account able to transfer the tokens
         * @param _value The amount of wei to be approved for transfer
         */
        approve(_spender: PromiseOrValue<string>, _value: PromiseOrValue<BigNumberish>, overrides?: CallOverrides): Promise<boolean>;
        /**
         * @param _owner The address of the account owning tokens
         * @param _spender The address of the account able to transfer the tokens
         */
        allowance(_owner: PromiseOrValue<string>, _spender: PromiseOrValue<string>, overrides?: CallOverrides): Promise<BigNumber>;
    };
    filters: {
        "Approval(address,address,uint256)"(_owner?: PromiseOrValue<string> | null, _spender?: PromiseOrValue<string> | null, _value?: null): ApprovalEventFilter;
        Approval(_owner?: PromiseOrValue<string> | null, _spender?: PromiseOrValue<string> | null, _value?: null): ApprovalEventFilter;
        "Transfer(address,address,uint256)"(_from?: PromiseOrValue<string> | null, _to?: PromiseOrValue<string> | null, _value?: null): TransferEventFilter;
        Transfer(_from?: PromiseOrValue<string> | null, _to?: PromiseOrValue<string> | null, _value?: null): TransferEventFilter;
    };
    estimateGas: {
        /**
         */
        totalSupply(overrides?: CallOverrides): Promise<BigNumber>;
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
         * send `_value` token to `_to` from `_from` on the condition it is approved by `_from`
         * @param _from The address of the sender
         * @param _to The address of the recipient
         * @param _value The amount of token to be transferred
         */
        transferFrom(_from: PromiseOrValue<string>, _to: PromiseOrValue<string>, _value: PromiseOrValue<BigNumberish>, overrides?: Overrides & {
            from?: PromiseOrValue<string>;
        }): Promise<BigNumber>;
        /**
         * `msg.sender` approves `_addr` to spend `_value` tokens
         * @param _spender The address of the account able to transfer the tokens
         * @param _value The amount of wei to be approved for transfer
         */
        approve(_spender: PromiseOrValue<string>, _value: PromiseOrValue<BigNumberish>, overrides?: Overrides & {
            from?: PromiseOrValue<string>;
        }): Promise<BigNumber>;
        /**
         * @param _owner The address of the account owning tokens
         * @param _spender The address of the account able to transfer the tokens
         */
        allowance(_owner: PromiseOrValue<string>, _spender: PromiseOrValue<string>, overrides?: CallOverrides): Promise<BigNumber>;
    };
    populateTransaction: {
        /**
         */
        totalSupply(overrides?: CallOverrides): Promise<PopulatedTransaction>;
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
         * send `_value` token to `_to` from `_from` on the condition it is approved by `_from`
         * @param _from The address of the sender
         * @param _to The address of the recipient
         * @param _value The amount of token to be transferred
         */
        transferFrom(_from: PromiseOrValue<string>, _to: PromiseOrValue<string>, _value: PromiseOrValue<BigNumberish>, overrides?: Overrides & {
            from?: PromiseOrValue<string>;
        }): Promise<PopulatedTransaction>;
        /**
         * `msg.sender` approves `_addr` to spend `_value` tokens
         * @param _spender The address of the account able to transfer the tokens
         * @param _value The amount of wei to be approved for transfer
         */
        approve(_spender: PromiseOrValue<string>, _value: PromiseOrValue<BigNumberish>, overrides?: Overrides & {
            from?: PromiseOrValue<string>;
        }): Promise<PopulatedTransaction>;
        /**
         * @param _owner The address of the account owning tokens
         * @param _spender The address of the account able to transfer the tokens
         */
        allowance(_owner: PromiseOrValue<string>, _spender: PromiseOrValue<string>, overrides?: CallOverrides): Promise<PopulatedTransaction>;
    };
}
