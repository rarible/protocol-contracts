import type { BaseContract, BigNumber, BigNumberish, BytesLike, CallOverrides, PopulatedTransaction, Signer, utils } from "ethers";
import type { FunctionFragment, Result, EventFragment } from "@ethersproject/abi";
import type { Listener, Provider } from "@ethersproject/providers";
import type { TypedEventFilter, TypedEvent, TypedListener, OnEvent, PromiseOrValue } from "./common";
export declare namespace LibPart {
    type PartStruct = {
        account: PromiseOrValue<string>;
        value: PromiseOrValue<BigNumberish>;
    };
    type PartStructOutput = [string, BigNumber] & {
        account: string;
        value: BigNumber;
    };
}
export interface RoyaltiesV2UpgradeableInterface extends utils.Interface {
    functions: {
        "getRaribleV2Royalties(uint256)": FunctionFragment;
        "supportsInterface(bytes4)": FunctionFragment;
    };
    getFunction(nameOrSignatureOrTopic: "getRaribleV2Royalties" | "supportsInterface"): FunctionFragment;
    encodeFunctionData(functionFragment: "getRaribleV2Royalties", values: [PromiseOrValue<BigNumberish>]): string;
    encodeFunctionData(functionFragment: "supportsInterface", values: [PromiseOrValue<BytesLike>]): string;
    decodeFunctionResult(functionFragment: "getRaribleV2Royalties", data: BytesLike): Result;
    decodeFunctionResult(functionFragment: "supportsInterface", data: BytesLike): Result;
    events: {
        "RoyaltiesSet(uint256,tuple[])": EventFragment;
    };
    getEvent(nameOrSignatureOrTopic: "RoyaltiesSet"): EventFragment;
}
export interface RoyaltiesSetEventObject {
    tokenId: BigNumber;
    royalties: LibPart.PartStructOutput[];
}
export type RoyaltiesSetEvent = TypedEvent<[
    BigNumber,
    LibPart.PartStructOutput[]
], RoyaltiesSetEventObject>;
export type RoyaltiesSetEventFilter = TypedEventFilter<RoyaltiesSetEvent>;
export interface RoyaltiesV2Upgradeable extends BaseContract {
    connect(signerOrProvider: Signer | Provider | string): this;
    attach(addressOrName: string): this;
    deployed(): Promise<this>;
    interface: RoyaltiesV2UpgradeableInterface;
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
        getRaribleV2Royalties(id: PromiseOrValue<BigNumberish>, overrides?: CallOverrides): Promise<[LibPart.PartStructOutput[]]>;
        /**
         * See {IERC165-supportsInterface}. Time complexity O(1), guaranteed to always use less than 30 000 gas.
         */
        supportsInterface(interfaceId: PromiseOrValue<BytesLike>, overrides?: CallOverrides): Promise<[boolean]>;
    };
    getRaribleV2Royalties(id: PromiseOrValue<BigNumberish>, overrides?: CallOverrides): Promise<LibPart.PartStructOutput[]>;
    /**
     * See {IERC165-supportsInterface}. Time complexity O(1), guaranteed to always use less than 30 000 gas.
     */
    supportsInterface(interfaceId: PromiseOrValue<BytesLike>, overrides?: CallOverrides): Promise<boolean>;
    callStatic: {
        getRaribleV2Royalties(id: PromiseOrValue<BigNumberish>, overrides?: CallOverrides): Promise<LibPart.PartStructOutput[]>;
        /**
         * See {IERC165-supportsInterface}. Time complexity O(1), guaranteed to always use less than 30 000 gas.
         */
        supportsInterface(interfaceId: PromiseOrValue<BytesLike>, overrides?: CallOverrides): Promise<boolean>;
    };
    filters: {
        "RoyaltiesSet(uint256,tuple[])"(tokenId?: null, royalties?: null): RoyaltiesSetEventFilter;
        RoyaltiesSet(tokenId?: null, royalties?: null): RoyaltiesSetEventFilter;
    };
    estimateGas: {
        getRaribleV2Royalties(id: PromiseOrValue<BigNumberish>, overrides?: CallOverrides): Promise<BigNumber>;
        /**
         * See {IERC165-supportsInterface}. Time complexity O(1), guaranteed to always use less than 30 000 gas.
         */
        supportsInterface(interfaceId: PromiseOrValue<BytesLike>, overrides?: CallOverrides): Promise<BigNumber>;
    };
    populateTransaction: {
        getRaribleV2Royalties(id: PromiseOrValue<BigNumberish>, overrides?: CallOverrides): Promise<PopulatedTransaction>;
        /**
         * See {IERC165-supportsInterface}. Time complexity O(1), guaranteed to always use less than 30 000 gas.
         */
        supportsInterface(interfaceId: PromiseOrValue<BytesLike>, overrides?: CallOverrides): Promise<PopulatedTransaction>;
    };
}
