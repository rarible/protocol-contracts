import type { BaseContract, BigNumber, BigNumberish, BytesLike, CallOverrides, ContractTransaction, Overrides, PayableOverrides, PopulatedTransaction, Signer, utils } from "ethers";
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
export declare namespace LibERC1155LazyMint {
    type Mint1155DataStruct = {
        tokenId: PromiseOrValue<BigNumberish>;
        tokenURI: PromiseOrValue<string>;
        supply: PromiseOrValue<BigNumberish>;
        creators: LibPart.PartStruct[];
        royalties: LibPart.PartStruct[];
        signatures: PromiseOrValue<BytesLike>[];
    };
    type Mint1155DataStructOutput = [
        BigNumber,
        string,
        BigNumber,
        LibPart.PartStructOutput[],
        LibPart.PartStructOutput[],
        string[]
    ] & {
        tokenId: BigNumber;
        tokenURI: string;
        supply: BigNumber;
        creators: LibPart.PartStructOutput[];
        royalties: LibPart.PartStructOutput[];
        signatures: string[];
    };
}
export interface ERC1155RaribleMetaInterface extends utils.Interface {
    functions: {
        "addMinter(address)": FunctionFragment;
        "addMinters(address[])": FunctionFragment;
        "balanceOf(address,uint256)": FunctionFragment;
        "balanceOfBatch(address[],uint256[])": FunctionFragment;
        "baseURI()": FunctionFragment;
        "burn(address,uint256,uint256)": FunctionFragment;
        "burnBatch(address,uint256[],uint256[])": FunctionFragment;
        "contractURI()": FunctionFragment;
        "executeMetaTransaction(address,bytes,bytes32,bytes32,uint8)": FunctionFragment;
        "getCreators(uint256)": FunctionFragment;
        "getNonce(address)": FunctionFragment;
        "getRaribleV2Royalties(uint256)": FunctionFragment;
        "isApprovedForAll(address,address)": FunctionFragment;
        "isMinter(address)": FunctionFragment;
        "name()": FunctionFragment;
        "owner()": FunctionFragment;
        "removeMinter(address)": FunctionFragment;
        "renounceOwnership()": FunctionFragment;
        "royaltyInfo(uint256,uint256)": FunctionFragment;
        "safeBatchTransferFrom(address,address,uint256[],uint256[],bytes)": FunctionFragment;
        "safeTransferFrom(address,address,uint256,uint256,bytes)": FunctionFragment;
        "setApprovalForAll(address,bool)": FunctionFragment;
        "setBaseURI(string)": FunctionFragment;
        "supportsInterface(bytes4)": FunctionFragment;
        "symbol()": FunctionFragment;
        "transferFromOrMint((uint256,string,uint256,(address,uint96)[],(address,uint96)[],bytes[]),address,address,uint256)": FunctionFragment;
        "transferOwnership(address)": FunctionFragment;
        "updateAccount(uint256,address,address)": FunctionFragment;
        "uri(uint256)": FunctionFragment;
        "__ERC1155RaribleUser_init(string,string,string,string,address[],address,address)": FunctionFragment;
        "__ERC1155Rarible_init(string,string,string,string,address,address)": FunctionFragment;
        "mintAndTransfer((uint256,string,uint256,(address,uint96)[],(address,uint96)[],bytes[]),address,uint256)": FunctionFragment;
    };
    getFunction(nameOrSignatureOrTopic: "addMinter" | "addMinters" | "balanceOf" | "balanceOfBatch" | "baseURI" | "burn" | "burnBatch" | "contractURI" | "executeMetaTransaction" | "getCreators" | "getNonce" | "getRaribleV2Royalties" | "isApprovedForAll" | "isMinter" | "name" | "owner" | "removeMinter" | "renounceOwnership" | "royaltyInfo" | "safeBatchTransferFrom" | "safeTransferFrom" | "setApprovalForAll" | "setBaseURI" | "supportsInterface" | "symbol" | "transferFromOrMint" | "transferOwnership" | "updateAccount" | "uri" | "__ERC1155RaribleUser_init" | "__ERC1155Rarible_init" | "mintAndTransfer"): FunctionFragment;
    encodeFunctionData(functionFragment: "addMinter", values: [PromiseOrValue<string>]): string;
    encodeFunctionData(functionFragment: "addMinters", values: [PromiseOrValue<string>[]]): string;
    encodeFunctionData(functionFragment: "balanceOf", values: [PromiseOrValue<string>, PromiseOrValue<BigNumberish>]): string;
    encodeFunctionData(functionFragment: "balanceOfBatch", values: [PromiseOrValue<string>[], PromiseOrValue<BigNumberish>[]]): string;
    encodeFunctionData(functionFragment: "baseURI", values?: undefined): string;
    encodeFunctionData(functionFragment: "burn", values: [
        PromiseOrValue<string>,
        PromiseOrValue<BigNumberish>,
        PromiseOrValue<BigNumberish>
    ]): string;
    encodeFunctionData(functionFragment: "burnBatch", values: [
        PromiseOrValue<string>,
        PromiseOrValue<BigNumberish>[],
        PromiseOrValue<BigNumberish>[]
    ]): string;
    encodeFunctionData(functionFragment: "contractURI", values?: undefined): string;
    encodeFunctionData(functionFragment: "executeMetaTransaction", values: [
        PromiseOrValue<string>,
        PromiseOrValue<BytesLike>,
        PromiseOrValue<BytesLike>,
        PromiseOrValue<BytesLike>,
        PromiseOrValue<BigNumberish>
    ]): string;
    encodeFunctionData(functionFragment: "getCreators", values: [PromiseOrValue<BigNumberish>]): string;
    encodeFunctionData(functionFragment: "getNonce", values: [PromiseOrValue<string>]): string;
    encodeFunctionData(functionFragment: "getRaribleV2Royalties", values: [PromiseOrValue<BigNumberish>]): string;
    encodeFunctionData(functionFragment: "isApprovedForAll", values: [PromiseOrValue<string>, PromiseOrValue<string>]): string;
    encodeFunctionData(functionFragment: "isMinter", values: [PromiseOrValue<string>]): string;
    encodeFunctionData(functionFragment: "name", values?: undefined): string;
    encodeFunctionData(functionFragment: "owner", values?: undefined): string;
    encodeFunctionData(functionFragment: "removeMinter", values: [PromiseOrValue<string>]): string;
    encodeFunctionData(functionFragment: "renounceOwnership", values?: undefined): string;
    encodeFunctionData(functionFragment: "royaltyInfo", values: [PromiseOrValue<BigNumberish>, PromiseOrValue<BigNumberish>]): string;
    encodeFunctionData(functionFragment: "safeBatchTransferFrom", values: [
        PromiseOrValue<string>,
        PromiseOrValue<string>,
        PromiseOrValue<BigNumberish>[],
        PromiseOrValue<BigNumberish>[],
        PromiseOrValue<BytesLike>
    ]): string;
    encodeFunctionData(functionFragment: "safeTransferFrom", values: [
        PromiseOrValue<string>,
        PromiseOrValue<string>,
        PromiseOrValue<BigNumberish>,
        PromiseOrValue<BigNumberish>,
        PromiseOrValue<BytesLike>
    ]): string;
    encodeFunctionData(functionFragment: "setApprovalForAll", values: [PromiseOrValue<string>, PromiseOrValue<boolean>]): string;
    encodeFunctionData(functionFragment: "setBaseURI", values: [PromiseOrValue<string>]): string;
    encodeFunctionData(functionFragment: "supportsInterface", values: [PromiseOrValue<BytesLike>]): string;
    encodeFunctionData(functionFragment: "symbol", values?: undefined): string;
    encodeFunctionData(functionFragment: "transferFromOrMint", values: [
        LibERC1155LazyMint.Mint1155DataStruct,
        PromiseOrValue<string>,
        PromiseOrValue<string>,
        PromiseOrValue<BigNumberish>
    ]): string;
    encodeFunctionData(functionFragment: "transferOwnership", values: [PromiseOrValue<string>]): string;
    encodeFunctionData(functionFragment: "updateAccount", values: [
        PromiseOrValue<BigNumberish>,
        PromiseOrValue<string>,
        PromiseOrValue<string>
    ]): string;
    encodeFunctionData(functionFragment: "uri", values: [PromiseOrValue<BigNumberish>]): string;
    encodeFunctionData(functionFragment: "__ERC1155RaribleUser_init", values: [
        PromiseOrValue<string>,
        PromiseOrValue<string>,
        PromiseOrValue<string>,
        PromiseOrValue<string>,
        PromiseOrValue<string>[],
        PromiseOrValue<string>,
        PromiseOrValue<string>
    ]): string;
    encodeFunctionData(functionFragment: "__ERC1155Rarible_init", values: [
        PromiseOrValue<string>,
        PromiseOrValue<string>,
        PromiseOrValue<string>,
        PromiseOrValue<string>,
        PromiseOrValue<string>,
        PromiseOrValue<string>
    ]): string;
    encodeFunctionData(functionFragment: "mintAndTransfer", values: [
        LibERC1155LazyMint.Mint1155DataStruct,
        PromiseOrValue<string>,
        PromiseOrValue<BigNumberish>
    ]): string;
    decodeFunctionResult(functionFragment: "addMinter", data: BytesLike): Result;
    decodeFunctionResult(functionFragment: "addMinters", data: BytesLike): Result;
    decodeFunctionResult(functionFragment: "balanceOf", data: BytesLike): Result;
    decodeFunctionResult(functionFragment: "balanceOfBatch", data: BytesLike): Result;
    decodeFunctionResult(functionFragment: "baseURI", data: BytesLike): Result;
    decodeFunctionResult(functionFragment: "burn", data: BytesLike): Result;
    decodeFunctionResult(functionFragment: "burnBatch", data: BytesLike): Result;
    decodeFunctionResult(functionFragment: "contractURI", data: BytesLike): Result;
    decodeFunctionResult(functionFragment: "executeMetaTransaction", data: BytesLike): Result;
    decodeFunctionResult(functionFragment: "getCreators", data: BytesLike): Result;
    decodeFunctionResult(functionFragment: "getNonce", data: BytesLike): Result;
    decodeFunctionResult(functionFragment: "getRaribleV2Royalties", data: BytesLike): Result;
    decodeFunctionResult(functionFragment: "isApprovedForAll", data: BytesLike): Result;
    decodeFunctionResult(functionFragment: "isMinter", data: BytesLike): Result;
    decodeFunctionResult(functionFragment: "name", data: BytesLike): Result;
    decodeFunctionResult(functionFragment: "owner", data: BytesLike): Result;
    decodeFunctionResult(functionFragment: "removeMinter", data: BytesLike): Result;
    decodeFunctionResult(functionFragment: "renounceOwnership", data: BytesLike): Result;
    decodeFunctionResult(functionFragment: "royaltyInfo", data: BytesLike): Result;
    decodeFunctionResult(functionFragment: "safeBatchTransferFrom", data: BytesLike): Result;
    decodeFunctionResult(functionFragment: "safeTransferFrom", data: BytesLike): Result;
    decodeFunctionResult(functionFragment: "setApprovalForAll", data: BytesLike): Result;
    decodeFunctionResult(functionFragment: "setBaseURI", data: BytesLike): Result;
    decodeFunctionResult(functionFragment: "supportsInterface", data: BytesLike): Result;
    decodeFunctionResult(functionFragment: "symbol", data: BytesLike): Result;
    decodeFunctionResult(functionFragment: "transferFromOrMint", data: BytesLike): Result;
    decodeFunctionResult(functionFragment: "transferOwnership", data: BytesLike): Result;
    decodeFunctionResult(functionFragment: "updateAccount", data: BytesLike): Result;
    decodeFunctionResult(functionFragment: "uri", data: BytesLike): Result;
    decodeFunctionResult(functionFragment: "__ERC1155RaribleUser_init", data: BytesLike): Result;
    decodeFunctionResult(functionFragment: "__ERC1155Rarible_init", data: BytesLike): Result;
    decodeFunctionResult(functionFragment: "mintAndTransfer", data: BytesLike): Result;
    events: {
        "ApprovalForAll(address,address,bool)": EventFragment;
        "BaseUriChanged(string)": EventFragment;
        "BurnLazy(address,address,uint256,uint256)": EventFragment;
        "BurnLazyBatch(address,address,uint256[],uint256[])": EventFragment;
        "CreateERC1155Rarible(address,string,string)": EventFragment;
        "CreateERC1155RaribleUser(address,string,string)": EventFragment;
        "Creators(uint256,tuple[])": EventFragment;
        "DefaultApproval(address,bool)": EventFragment;
        "MetaTransactionExecuted(address,address,bytes)": EventFragment;
        "MinterStatusChanged(address,bool)": EventFragment;
        "OwnershipTransferred(address,address)": EventFragment;
        "RoyaltiesSet(uint256,tuple[])": EventFragment;
        "Supply(uint256,uint256)": EventFragment;
        "TransferBatch(address,address,address,uint256[],uint256[])": EventFragment;
        "TransferSingle(address,address,address,uint256,uint256)": EventFragment;
        "URI(string,uint256)": EventFragment;
    };
    getEvent(nameOrSignatureOrTopic: "ApprovalForAll"): EventFragment;
    getEvent(nameOrSignatureOrTopic: "BaseUriChanged"): EventFragment;
    getEvent(nameOrSignatureOrTopic: "BurnLazy"): EventFragment;
    getEvent(nameOrSignatureOrTopic: "BurnLazyBatch"): EventFragment;
    getEvent(nameOrSignatureOrTopic: "CreateERC1155Rarible"): EventFragment;
    getEvent(nameOrSignatureOrTopic: "CreateERC1155RaribleUser"): EventFragment;
    getEvent(nameOrSignatureOrTopic: "Creators"): EventFragment;
    getEvent(nameOrSignatureOrTopic: "DefaultApproval"): EventFragment;
    getEvent(nameOrSignatureOrTopic: "MetaTransactionExecuted"): EventFragment;
    getEvent(nameOrSignatureOrTopic: "MinterStatusChanged"): EventFragment;
    getEvent(nameOrSignatureOrTopic: "OwnershipTransferred"): EventFragment;
    getEvent(nameOrSignatureOrTopic: "RoyaltiesSet"): EventFragment;
    getEvent(nameOrSignatureOrTopic: "Supply"): EventFragment;
    getEvent(nameOrSignatureOrTopic: "TransferBatch"): EventFragment;
    getEvent(nameOrSignatureOrTopic: "TransferSingle"): EventFragment;
    getEvent(nameOrSignatureOrTopic: "URI"): EventFragment;
}
export interface ApprovalForAllEventObject {
    account: string;
    operator: string;
    approved: boolean;
}
export type ApprovalForAllEvent = TypedEvent<[
    string,
    string,
    boolean
], ApprovalForAllEventObject>;
export type ApprovalForAllEventFilter = TypedEventFilter<ApprovalForAllEvent>;
export interface BaseUriChangedEventObject {
    newBaseURI: string;
}
export type BaseUriChangedEvent = TypedEvent<[
    string
], BaseUriChangedEventObject>;
export type BaseUriChangedEventFilter = TypedEventFilter<BaseUriChangedEvent>;
export interface BurnLazyEventObject {
    operator: string;
    account: string;
    id: BigNumber;
    amount: BigNumber;
}
export type BurnLazyEvent = TypedEvent<[
    string,
    string,
    BigNumber,
    BigNumber
], BurnLazyEventObject>;
export type BurnLazyEventFilter = TypedEventFilter<BurnLazyEvent>;
export interface BurnLazyBatchEventObject {
    operator: string;
    account: string;
    ids: BigNumber[];
    amounts: BigNumber[];
}
export type BurnLazyBatchEvent = TypedEvent<[
    string,
    string,
    BigNumber[],
    BigNumber[]
], BurnLazyBatchEventObject>;
export type BurnLazyBatchEventFilter = TypedEventFilter<BurnLazyBatchEvent>;
export interface CreateERC1155RaribleEventObject {
    owner: string;
    name: string;
    symbol: string;
}
export type CreateERC1155RaribleEvent = TypedEvent<[
    string,
    string,
    string
], CreateERC1155RaribleEventObject>;
export type CreateERC1155RaribleEventFilter = TypedEventFilter<CreateERC1155RaribleEvent>;
export interface CreateERC1155RaribleUserEventObject {
    owner: string;
    name: string;
    symbol: string;
}
export type CreateERC1155RaribleUserEvent = TypedEvent<[
    string,
    string,
    string
], CreateERC1155RaribleUserEventObject>;
export type CreateERC1155RaribleUserEventFilter = TypedEventFilter<CreateERC1155RaribleUserEvent>;
export interface CreatorsEventObject {
    tokenId: BigNumber;
    creators: LibPart.PartStructOutput[];
}
export type CreatorsEvent = TypedEvent<[
    BigNumber,
    LibPart.PartStructOutput[]
], CreatorsEventObject>;
export type CreatorsEventFilter = TypedEventFilter<CreatorsEvent>;
export interface DefaultApprovalEventObject {
    operator: string;
    hasApproval: boolean;
}
export type DefaultApprovalEvent = TypedEvent<[
    string,
    boolean
], DefaultApprovalEventObject>;
export type DefaultApprovalEventFilter = TypedEventFilter<DefaultApprovalEvent>;
export interface MetaTransactionExecutedEventObject {
    userAddress: string;
    relayerAddress: string;
    functionSignature: string;
}
export type MetaTransactionExecutedEvent = TypedEvent<[
    string,
    string,
    string
], MetaTransactionExecutedEventObject>;
export type MetaTransactionExecutedEventFilter = TypedEventFilter<MetaTransactionExecutedEvent>;
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
export interface RoyaltiesSetEventObject {
    tokenId: BigNumber;
    royalties: LibPart.PartStructOutput[];
}
export type RoyaltiesSetEvent = TypedEvent<[
    BigNumber,
    LibPart.PartStructOutput[]
], RoyaltiesSetEventObject>;
export type RoyaltiesSetEventFilter = TypedEventFilter<RoyaltiesSetEvent>;
export interface SupplyEventObject {
    tokenId: BigNumber;
    value: BigNumber;
}
export type SupplyEvent = TypedEvent<[BigNumber, BigNumber], SupplyEventObject>;
export type SupplyEventFilter = TypedEventFilter<SupplyEvent>;
export interface TransferBatchEventObject {
    operator: string;
    from: string;
    to: string;
    ids: BigNumber[];
    values: BigNumber[];
}
export type TransferBatchEvent = TypedEvent<[
    string,
    string,
    string,
    BigNumber[],
    BigNumber[]
], TransferBatchEventObject>;
export type TransferBatchEventFilter = TypedEventFilter<TransferBatchEvent>;
export interface TransferSingleEventObject {
    operator: string;
    from: string;
    to: string;
    id: BigNumber;
    value: BigNumber;
}
export type TransferSingleEvent = TypedEvent<[
    string,
    string,
    string,
    BigNumber,
    BigNumber
], TransferSingleEventObject>;
export type TransferSingleEventFilter = TypedEventFilter<TransferSingleEvent>;
export interface URIEventObject {
    value: string;
    id: BigNumber;
}
export type URIEvent = TypedEvent<[string, BigNumber], URIEventObject>;
export type URIEventFilter = TypedEventFilter<URIEvent>;
export interface ERC1155RaribleMeta extends BaseContract {
    connect(signerOrProvider: Signer | Provider | string): this;
    attach(addressOrName: string): this;
    deployed(): Promise<this>;
    interface: ERC1155RaribleMetaInterface;
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
         * See {IERC1155-balanceOf}. Requirements: - `account` cannot be the zero address.
         */
        balanceOf(account: PromiseOrValue<string>, id: PromiseOrValue<BigNumberish>, overrides?: CallOverrides): Promise<[BigNumber]>;
        /**
         * See {IERC1155-balanceOfBatch}. Requirements: - `accounts` and `ids` must have the same length.
         */
        balanceOfBatch(accounts: PromiseOrValue<string>[], ids: PromiseOrValue<BigNumberish>[], overrides?: CallOverrides): Promise<[BigNumber[]]>;
        /**
         * Returns the base URI set via {_setBaseURI}. This will be automatically added as a prefix in {tokenURI} to each token's URI, or to the token ID if no specific URI is set for that token ID.
         */
        baseURI(overrides?: CallOverrides): Promise<[string]>;
        burn(account: PromiseOrValue<string>, id: PromiseOrValue<BigNumberish>, amount: PromiseOrValue<BigNumberish>, overrides?: Overrides & {
            from?: PromiseOrValue<string>;
        }): Promise<ContractTransaction>;
        burnBatch(account: PromiseOrValue<string>, ids: PromiseOrValue<BigNumberish>[], amounts: PromiseOrValue<BigNumberish>[], overrides?: Overrides & {
            from?: PromiseOrValue<string>;
        }): Promise<ContractTransaction>;
        contractURI(overrides?: CallOverrides): Promise<[string]>;
        executeMetaTransaction(userAddress: PromiseOrValue<string>, functionSignature: PromiseOrValue<BytesLike>, sigR: PromiseOrValue<BytesLike>, sigS: PromiseOrValue<BytesLike>, sigV: PromiseOrValue<BigNumberish>, overrides?: PayableOverrides & {
            from?: PromiseOrValue<string>;
        }): Promise<ContractTransaction>;
        getCreators(_id: PromiseOrValue<BigNumberish>, overrides?: CallOverrides): Promise<[LibPart.PartStructOutput[]]>;
        getNonce(user: PromiseOrValue<string>, overrides?: CallOverrides): Promise<[BigNumber] & {
            nonce: BigNumber;
        }>;
        getRaribleV2Royalties(id: PromiseOrValue<BigNumberish>, overrides?: CallOverrides): Promise<[LibPart.PartStructOutput[]]>;
        isApprovedForAll(_owner: PromiseOrValue<string>, _operator: PromiseOrValue<string>, overrides?: CallOverrides): Promise<[boolean]>;
        /**
         * Returns `true` if `account` has been granted to minters.
         */
        isMinter(account: PromiseOrValue<string>, overrides?: CallOverrides): Promise<[boolean]>;
        name(overrides?: CallOverrides): Promise<[string]>;
        /**
         * Returns the address of the current owner.
         */
        owner(overrides?: CallOverrides): Promise<[string]>;
        /**
         * Revoke `_minter` from the list of allowed minters.
         */
        removeMinter(_minter: PromiseOrValue<string>, overrides?: Overrides & {
            from?: PromiseOrValue<string>;
        }): Promise<ContractTransaction>;
        /**
         * Leaves the contract without owner. It will not be possible to call `onlyOwner` functions anymore. Can only be called by the current owner. NOTE: Renouncing ownership will leave the contract without an owner, thereby removing any functionality that is only available to the owner.
         */
        renounceOwnership(overrides?: Overrides & {
            from?: PromiseOrValue<string>;
        }): Promise<ContractTransaction>;
        royaltyInfo(id: PromiseOrValue<BigNumberish>, _salePrice: PromiseOrValue<BigNumberish>, overrides?: CallOverrides): Promise<[
            string,
            BigNumber
        ] & {
            receiver: string;
            royaltyAmount: BigNumber;
        }>;
        /**
         * See {IERC1155-safeBatchTransferFrom}.
         */
        safeBatchTransferFrom(from: PromiseOrValue<string>, to: PromiseOrValue<string>, ids: PromiseOrValue<BigNumberish>[], amounts: PromiseOrValue<BigNumberish>[], data: PromiseOrValue<BytesLike>, overrides?: Overrides & {
            from?: PromiseOrValue<string>;
        }): Promise<ContractTransaction>;
        /**
         * See {IERC1155-safeTransferFrom}.
         */
        safeTransferFrom(from: PromiseOrValue<string>, to: PromiseOrValue<string>, id: PromiseOrValue<BigNumberish>, amount: PromiseOrValue<BigNumberish>, data: PromiseOrValue<BytesLike>, overrides?: Overrides & {
            from?: PromiseOrValue<string>;
        }): Promise<ContractTransaction>;
        /**
         * See {IERC1155-setApprovalForAll}.
         */
        setApprovalForAll(operator: PromiseOrValue<string>, approved: PromiseOrValue<boolean>, overrides?: Overrides & {
            from?: PromiseOrValue<string>;
        }): Promise<ContractTransaction>;
        setBaseURI(newBaseURI: PromiseOrValue<string>, overrides?: Overrides & {
            from?: PromiseOrValue<string>;
        }): Promise<ContractTransaction>;
        supportsInterface(interfaceId: PromiseOrValue<BytesLike>, overrides?: CallOverrides): Promise<[boolean]>;
        symbol(overrides?: CallOverrides): Promise<[string]>;
        transferFromOrMint(data: LibERC1155LazyMint.Mint1155DataStruct, from: PromiseOrValue<string>, to: PromiseOrValue<string>, amount: PromiseOrValue<BigNumberish>, overrides?: Overrides & {
            from?: PromiseOrValue<string>;
        }): Promise<ContractTransaction>;
        /**
         * Transfers ownership of the contract to a new account (`newOwner`). Can only be called by the current owner.
         */
        transferOwnership(newOwner: PromiseOrValue<string>, overrides?: Overrides & {
            from?: PromiseOrValue<string>;
        }): Promise<ContractTransaction>;
        updateAccount(_id: PromiseOrValue<BigNumberish>, _from: PromiseOrValue<string>, _to: PromiseOrValue<string>, overrides?: Overrides & {
            from?: PromiseOrValue<string>;
        }): Promise<ContractTransaction>;
        uri(id: PromiseOrValue<BigNumberish>, overrides?: CallOverrides): Promise<[string]>;
        __ERC1155RaribleUser_init(_name: PromiseOrValue<string>, _symbol: PromiseOrValue<string>, baseURI: PromiseOrValue<string>, contractURI: PromiseOrValue<string>, operators: PromiseOrValue<string>[], transferProxy: PromiseOrValue<string>, lazyTransferProxy: PromiseOrValue<string>, overrides?: Overrides & {
            from?: PromiseOrValue<string>;
        }): Promise<ContractTransaction>;
        __ERC1155Rarible_init(_name: PromiseOrValue<string>, _symbol: PromiseOrValue<string>, baseURI: PromiseOrValue<string>, contractURI: PromiseOrValue<string>, transferProxy: PromiseOrValue<string>, lazyTransferProxy: PromiseOrValue<string>, overrides?: Overrides & {
            from?: PromiseOrValue<string>;
        }): Promise<ContractTransaction>;
        mintAndTransfer(data: LibERC1155LazyMint.Mint1155DataStruct, to: PromiseOrValue<string>, _amount: PromiseOrValue<BigNumberish>, overrides?: Overrides & {
            from?: PromiseOrValue<string>;
        }): Promise<ContractTransaction>;
    };
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
     * See {IERC1155-balanceOf}. Requirements: - `account` cannot be the zero address.
     */
    balanceOf(account: PromiseOrValue<string>, id: PromiseOrValue<BigNumberish>, overrides?: CallOverrides): Promise<BigNumber>;
    /**
     * See {IERC1155-balanceOfBatch}. Requirements: - `accounts` and `ids` must have the same length.
     */
    balanceOfBatch(accounts: PromiseOrValue<string>[], ids: PromiseOrValue<BigNumberish>[], overrides?: CallOverrides): Promise<BigNumber[]>;
    /**
     * Returns the base URI set via {_setBaseURI}. This will be automatically added as a prefix in {tokenURI} to each token's URI, or to the token ID if no specific URI is set for that token ID.
     */
    baseURI(overrides?: CallOverrides): Promise<string>;
    burn(account: PromiseOrValue<string>, id: PromiseOrValue<BigNumberish>, amount: PromiseOrValue<BigNumberish>, overrides?: Overrides & {
        from?: PromiseOrValue<string>;
    }): Promise<ContractTransaction>;
    burnBatch(account: PromiseOrValue<string>, ids: PromiseOrValue<BigNumberish>[], amounts: PromiseOrValue<BigNumberish>[], overrides?: Overrides & {
        from?: PromiseOrValue<string>;
    }): Promise<ContractTransaction>;
    contractURI(overrides?: CallOverrides): Promise<string>;
    executeMetaTransaction(userAddress: PromiseOrValue<string>, functionSignature: PromiseOrValue<BytesLike>, sigR: PromiseOrValue<BytesLike>, sigS: PromiseOrValue<BytesLike>, sigV: PromiseOrValue<BigNumberish>, overrides?: PayableOverrides & {
        from?: PromiseOrValue<string>;
    }): Promise<ContractTransaction>;
    getCreators(_id: PromiseOrValue<BigNumberish>, overrides?: CallOverrides): Promise<LibPart.PartStructOutput[]>;
    getNonce(user: PromiseOrValue<string>, overrides?: CallOverrides): Promise<BigNumber>;
    getRaribleV2Royalties(id: PromiseOrValue<BigNumberish>, overrides?: CallOverrides): Promise<LibPart.PartStructOutput[]>;
    isApprovedForAll(_owner: PromiseOrValue<string>, _operator: PromiseOrValue<string>, overrides?: CallOverrides): Promise<boolean>;
    /**
     * Returns `true` if `account` has been granted to minters.
     */
    isMinter(account: PromiseOrValue<string>, overrides?: CallOverrides): Promise<boolean>;
    name(overrides?: CallOverrides): Promise<string>;
    /**
     * Returns the address of the current owner.
     */
    owner(overrides?: CallOverrides): Promise<string>;
    /**
     * Revoke `_minter` from the list of allowed minters.
     */
    removeMinter(_minter: PromiseOrValue<string>, overrides?: Overrides & {
        from?: PromiseOrValue<string>;
    }): Promise<ContractTransaction>;
    /**
     * Leaves the contract without owner. It will not be possible to call `onlyOwner` functions anymore. Can only be called by the current owner. NOTE: Renouncing ownership will leave the contract without an owner, thereby removing any functionality that is only available to the owner.
     */
    renounceOwnership(overrides?: Overrides & {
        from?: PromiseOrValue<string>;
    }): Promise<ContractTransaction>;
    royaltyInfo(id: PromiseOrValue<BigNumberish>, _salePrice: PromiseOrValue<BigNumberish>, overrides?: CallOverrides): Promise<[
        string,
        BigNumber
    ] & {
        receiver: string;
        royaltyAmount: BigNumber;
    }>;
    /**
     * See {IERC1155-safeBatchTransferFrom}.
     */
    safeBatchTransferFrom(from: PromiseOrValue<string>, to: PromiseOrValue<string>, ids: PromiseOrValue<BigNumberish>[], amounts: PromiseOrValue<BigNumberish>[], data: PromiseOrValue<BytesLike>, overrides?: Overrides & {
        from?: PromiseOrValue<string>;
    }): Promise<ContractTransaction>;
    /**
     * See {IERC1155-safeTransferFrom}.
     */
    safeTransferFrom(from: PromiseOrValue<string>, to: PromiseOrValue<string>, id: PromiseOrValue<BigNumberish>, amount: PromiseOrValue<BigNumberish>, data: PromiseOrValue<BytesLike>, overrides?: Overrides & {
        from?: PromiseOrValue<string>;
    }): Promise<ContractTransaction>;
    /**
     * See {IERC1155-setApprovalForAll}.
     */
    setApprovalForAll(operator: PromiseOrValue<string>, approved: PromiseOrValue<boolean>, overrides?: Overrides & {
        from?: PromiseOrValue<string>;
    }): Promise<ContractTransaction>;
    setBaseURI(newBaseURI: PromiseOrValue<string>, overrides?: Overrides & {
        from?: PromiseOrValue<string>;
    }): Promise<ContractTransaction>;
    supportsInterface(interfaceId: PromiseOrValue<BytesLike>, overrides?: CallOverrides): Promise<boolean>;
    symbol(overrides?: CallOverrides): Promise<string>;
    transferFromOrMint(data: LibERC1155LazyMint.Mint1155DataStruct, from: PromiseOrValue<string>, to: PromiseOrValue<string>, amount: PromiseOrValue<BigNumberish>, overrides?: Overrides & {
        from?: PromiseOrValue<string>;
    }): Promise<ContractTransaction>;
    /**
     * Transfers ownership of the contract to a new account (`newOwner`). Can only be called by the current owner.
     */
    transferOwnership(newOwner: PromiseOrValue<string>, overrides?: Overrides & {
        from?: PromiseOrValue<string>;
    }): Promise<ContractTransaction>;
    updateAccount(_id: PromiseOrValue<BigNumberish>, _from: PromiseOrValue<string>, _to: PromiseOrValue<string>, overrides?: Overrides & {
        from?: PromiseOrValue<string>;
    }): Promise<ContractTransaction>;
    uri(id: PromiseOrValue<BigNumberish>, overrides?: CallOverrides): Promise<string>;
    __ERC1155RaribleUser_init(_name: PromiseOrValue<string>, _symbol: PromiseOrValue<string>, baseURI: PromiseOrValue<string>, contractURI: PromiseOrValue<string>, operators: PromiseOrValue<string>[], transferProxy: PromiseOrValue<string>, lazyTransferProxy: PromiseOrValue<string>, overrides?: Overrides & {
        from?: PromiseOrValue<string>;
    }): Promise<ContractTransaction>;
    __ERC1155Rarible_init(_name: PromiseOrValue<string>, _symbol: PromiseOrValue<string>, baseURI: PromiseOrValue<string>, contractURI: PromiseOrValue<string>, transferProxy: PromiseOrValue<string>, lazyTransferProxy: PromiseOrValue<string>, overrides?: Overrides & {
        from?: PromiseOrValue<string>;
    }): Promise<ContractTransaction>;
    mintAndTransfer(data: LibERC1155LazyMint.Mint1155DataStruct, to: PromiseOrValue<string>, _amount: PromiseOrValue<BigNumberish>, overrides?: Overrides & {
        from?: PromiseOrValue<string>;
    }): Promise<ContractTransaction>;
    callStatic: {
        /**
         * Add `minter` to the list of allowed minters.
         */
        addMinter(minter: PromiseOrValue<string>, overrides?: CallOverrides): Promise<void>;
        /**
         * Add `minters` to the list of allowed minters.
         */
        addMinters(minters: PromiseOrValue<string>[], overrides?: CallOverrides): Promise<void>;
        /**
         * See {IERC1155-balanceOf}. Requirements: - `account` cannot be the zero address.
         */
        balanceOf(account: PromiseOrValue<string>, id: PromiseOrValue<BigNumberish>, overrides?: CallOverrides): Promise<BigNumber>;
        /**
         * See {IERC1155-balanceOfBatch}. Requirements: - `accounts` and `ids` must have the same length.
         */
        balanceOfBatch(accounts: PromiseOrValue<string>[], ids: PromiseOrValue<BigNumberish>[], overrides?: CallOverrides): Promise<BigNumber[]>;
        /**
         * Returns the base URI set via {_setBaseURI}. This will be automatically added as a prefix in {tokenURI} to each token's URI, or to the token ID if no specific URI is set for that token ID.
         */
        baseURI(overrides?: CallOverrides): Promise<string>;
        burn(account: PromiseOrValue<string>, id: PromiseOrValue<BigNumberish>, amount: PromiseOrValue<BigNumberish>, overrides?: CallOverrides): Promise<void>;
        burnBatch(account: PromiseOrValue<string>, ids: PromiseOrValue<BigNumberish>[], amounts: PromiseOrValue<BigNumberish>[], overrides?: CallOverrides): Promise<void>;
        contractURI(overrides?: CallOverrides): Promise<string>;
        executeMetaTransaction(userAddress: PromiseOrValue<string>, functionSignature: PromiseOrValue<BytesLike>, sigR: PromiseOrValue<BytesLike>, sigS: PromiseOrValue<BytesLike>, sigV: PromiseOrValue<BigNumberish>, overrides?: CallOverrides): Promise<string>;
        getCreators(_id: PromiseOrValue<BigNumberish>, overrides?: CallOverrides): Promise<LibPart.PartStructOutput[]>;
        getNonce(user: PromiseOrValue<string>, overrides?: CallOverrides): Promise<BigNumber>;
        getRaribleV2Royalties(id: PromiseOrValue<BigNumberish>, overrides?: CallOverrides): Promise<LibPart.PartStructOutput[]>;
        isApprovedForAll(_owner: PromiseOrValue<string>, _operator: PromiseOrValue<string>, overrides?: CallOverrides): Promise<boolean>;
        /**
         * Returns `true` if `account` has been granted to minters.
         */
        isMinter(account: PromiseOrValue<string>, overrides?: CallOverrides): Promise<boolean>;
        name(overrides?: CallOverrides): Promise<string>;
        /**
         * Returns the address of the current owner.
         */
        owner(overrides?: CallOverrides): Promise<string>;
        /**
         * Revoke `_minter` from the list of allowed minters.
         */
        removeMinter(_minter: PromiseOrValue<string>, overrides?: CallOverrides): Promise<void>;
        /**
         * Leaves the contract without owner. It will not be possible to call `onlyOwner` functions anymore. Can only be called by the current owner. NOTE: Renouncing ownership will leave the contract without an owner, thereby removing any functionality that is only available to the owner.
         */
        renounceOwnership(overrides?: CallOverrides): Promise<void>;
        royaltyInfo(id: PromiseOrValue<BigNumberish>, _salePrice: PromiseOrValue<BigNumberish>, overrides?: CallOverrides): Promise<[
            string,
            BigNumber
        ] & {
            receiver: string;
            royaltyAmount: BigNumber;
        }>;
        /**
         * See {IERC1155-safeBatchTransferFrom}.
         */
        safeBatchTransferFrom(from: PromiseOrValue<string>, to: PromiseOrValue<string>, ids: PromiseOrValue<BigNumberish>[], amounts: PromiseOrValue<BigNumberish>[], data: PromiseOrValue<BytesLike>, overrides?: CallOverrides): Promise<void>;
        /**
         * See {IERC1155-safeTransferFrom}.
         */
        safeTransferFrom(from: PromiseOrValue<string>, to: PromiseOrValue<string>, id: PromiseOrValue<BigNumberish>, amount: PromiseOrValue<BigNumberish>, data: PromiseOrValue<BytesLike>, overrides?: CallOverrides): Promise<void>;
        /**
         * See {IERC1155-setApprovalForAll}.
         */
        setApprovalForAll(operator: PromiseOrValue<string>, approved: PromiseOrValue<boolean>, overrides?: CallOverrides): Promise<void>;
        setBaseURI(newBaseURI: PromiseOrValue<string>, overrides?: CallOverrides): Promise<void>;
        supportsInterface(interfaceId: PromiseOrValue<BytesLike>, overrides?: CallOverrides): Promise<boolean>;
        symbol(overrides?: CallOverrides): Promise<string>;
        transferFromOrMint(data: LibERC1155LazyMint.Mint1155DataStruct, from: PromiseOrValue<string>, to: PromiseOrValue<string>, amount: PromiseOrValue<BigNumberish>, overrides?: CallOverrides): Promise<void>;
        /**
         * Transfers ownership of the contract to a new account (`newOwner`). Can only be called by the current owner.
         */
        transferOwnership(newOwner: PromiseOrValue<string>, overrides?: CallOverrides): Promise<void>;
        updateAccount(_id: PromiseOrValue<BigNumberish>, _from: PromiseOrValue<string>, _to: PromiseOrValue<string>, overrides?: CallOverrides): Promise<void>;
        uri(id: PromiseOrValue<BigNumberish>, overrides?: CallOverrides): Promise<string>;
        __ERC1155RaribleUser_init(_name: PromiseOrValue<string>, _symbol: PromiseOrValue<string>, baseURI: PromiseOrValue<string>, contractURI: PromiseOrValue<string>, operators: PromiseOrValue<string>[], transferProxy: PromiseOrValue<string>, lazyTransferProxy: PromiseOrValue<string>, overrides?: CallOverrides): Promise<void>;
        __ERC1155Rarible_init(_name: PromiseOrValue<string>, _symbol: PromiseOrValue<string>, baseURI: PromiseOrValue<string>, contractURI: PromiseOrValue<string>, transferProxy: PromiseOrValue<string>, lazyTransferProxy: PromiseOrValue<string>, overrides?: CallOverrides): Promise<void>;
        mintAndTransfer(data: LibERC1155LazyMint.Mint1155DataStruct, to: PromiseOrValue<string>, _amount: PromiseOrValue<BigNumberish>, overrides?: CallOverrides): Promise<void>;
    };
    filters: {
        "ApprovalForAll(address,address,bool)"(account?: PromiseOrValue<string> | null, operator?: PromiseOrValue<string> | null, approved?: null): ApprovalForAllEventFilter;
        ApprovalForAll(account?: PromiseOrValue<string> | null, operator?: PromiseOrValue<string> | null, approved?: null): ApprovalForAllEventFilter;
        "BaseUriChanged(string)"(newBaseURI?: null): BaseUriChangedEventFilter;
        BaseUriChanged(newBaseURI?: null): BaseUriChangedEventFilter;
        "BurnLazy(address,address,uint256,uint256)"(operator?: PromiseOrValue<string> | null, account?: PromiseOrValue<string> | null, id?: null, amount?: null): BurnLazyEventFilter;
        BurnLazy(operator?: PromiseOrValue<string> | null, account?: PromiseOrValue<string> | null, id?: null, amount?: null): BurnLazyEventFilter;
        "BurnLazyBatch(address,address,uint256[],uint256[])"(operator?: PromiseOrValue<string> | null, account?: PromiseOrValue<string> | null, ids?: null, amounts?: null): BurnLazyBatchEventFilter;
        BurnLazyBatch(operator?: PromiseOrValue<string> | null, account?: PromiseOrValue<string> | null, ids?: null, amounts?: null): BurnLazyBatchEventFilter;
        "CreateERC1155Rarible(address,string,string)"(owner?: null, name?: null, symbol?: null): CreateERC1155RaribleEventFilter;
        CreateERC1155Rarible(owner?: null, name?: null, symbol?: null): CreateERC1155RaribleEventFilter;
        "CreateERC1155RaribleUser(address,string,string)"(owner?: null, name?: null, symbol?: null): CreateERC1155RaribleUserEventFilter;
        CreateERC1155RaribleUser(owner?: null, name?: null, symbol?: null): CreateERC1155RaribleUserEventFilter;
        "Creators(uint256,tuple[])"(tokenId?: null, creators?: null): CreatorsEventFilter;
        Creators(tokenId?: null, creators?: null): CreatorsEventFilter;
        "DefaultApproval(address,bool)"(operator?: PromiseOrValue<string> | null, hasApproval?: null): DefaultApprovalEventFilter;
        DefaultApproval(operator?: PromiseOrValue<string> | null, hasApproval?: null): DefaultApprovalEventFilter;
        "MetaTransactionExecuted(address,address,bytes)"(userAddress?: null, relayerAddress?: null, functionSignature?: null): MetaTransactionExecutedEventFilter;
        MetaTransactionExecuted(userAddress?: null, relayerAddress?: null, functionSignature?: null): MetaTransactionExecutedEventFilter;
        "MinterStatusChanged(address,bool)"(minter?: PromiseOrValue<string> | null, status?: PromiseOrValue<boolean> | null): MinterStatusChangedEventFilter;
        MinterStatusChanged(minter?: PromiseOrValue<string> | null, status?: PromiseOrValue<boolean> | null): MinterStatusChangedEventFilter;
        "OwnershipTransferred(address,address)"(previousOwner?: PromiseOrValue<string> | null, newOwner?: PromiseOrValue<string> | null): OwnershipTransferredEventFilter;
        OwnershipTransferred(previousOwner?: PromiseOrValue<string> | null, newOwner?: PromiseOrValue<string> | null): OwnershipTransferredEventFilter;
        "RoyaltiesSet(uint256,tuple[])"(tokenId?: null, royalties?: null): RoyaltiesSetEventFilter;
        RoyaltiesSet(tokenId?: null, royalties?: null): RoyaltiesSetEventFilter;
        "Supply(uint256,uint256)"(tokenId?: null, value?: null): SupplyEventFilter;
        Supply(tokenId?: null, value?: null): SupplyEventFilter;
        "TransferBatch(address,address,address,uint256[],uint256[])"(operator?: PromiseOrValue<string> | null, from?: PromiseOrValue<string> | null, to?: PromiseOrValue<string> | null, ids?: null, values?: null): TransferBatchEventFilter;
        TransferBatch(operator?: PromiseOrValue<string> | null, from?: PromiseOrValue<string> | null, to?: PromiseOrValue<string> | null, ids?: null, values?: null): TransferBatchEventFilter;
        "TransferSingle(address,address,address,uint256,uint256)"(operator?: PromiseOrValue<string> | null, from?: PromiseOrValue<string> | null, to?: PromiseOrValue<string> | null, id?: null, value?: null): TransferSingleEventFilter;
        TransferSingle(operator?: PromiseOrValue<string> | null, from?: PromiseOrValue<string> | null, to?: PromiseOrValue<string> | null, id?: null, value?: null): TransferSingleEventFilter;
        "URI(string,uint256)"(value?: null, id?: PromiseOrValue<BigNumberish> | null): URIEventFilter;
        URI(value?: null, id?: PromiseOrValue<BigNumberish> | null): URIEventFilter;
    };
    estimateGas: {
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
         * See {IERC1155-balanceOf}. Requirements: - `account` cannot be the zero address.
         */
        balanceOf(account: PromiseOrValue<string>, id: PromiseOrValue<BigNumberish>, overrides?: CallOverrides): Promise<BigNumber>;
        /**
         * See {IERC1155-balanceOfBatch}. Requirements: - `accounts` and `ids` must have the same length.
         */
        balanceOfBatch(accounts: PromiseOrValue<string>[], ids: PromiseOrValue<BigNumberish>[], overrides?: CallOverrides): Promise<BigNumber>;
        /**
         * Returns the base URI set via {_setBaseURI}. This will be automatically added as a prefix in {tokenURI} to each token's URI, or to the token ID if no specific URI is set for that token ID.
         */
        baseURI(overrides?: CallOverrides): Promise<BigNumber>;
        burn(account: PromiseOrValue<string>, id: PromiseOrValue<BigNumberish>, amount: PromiseOrValue<BigNumberish>, overrides?: Overrides & {
            from?: PromiseOrValue<string>;
        }): Promise<BigNumber>;
        burnBatch(account: PromiseOrValue<string>, ids: PromiseOrValue<BigNumberish>[], amounts: PromiseOrValue<BigNumberish>[], overrides?: Overrides & {
            from?: PromiseOrValue<string>;
        }): Promise<BigNumber>;
        contractURI(overrides?: CallOverrides): Promise<BigNumber>;
        executeMetaTransaction(userAddress: PromiseOrValue<string>, functionSignature: PromiseOrValue<BytesLike>, sigR: PromiseOrValue<BytesLike>, sigS: PromiseOrValue<BytesLike>, sigV: PromiseOrValue<BigNumberish>, overrides?: PayableOverrides & {
            from?: PromiseOrValue<string>;
        }): Promise<BigNumber>;
        getCreators(_id: PromiseOrValue<BigNumberish>, overrides?: CallOverrides): Promise<BigNumber>;
        getNonce(user: PromiseOrValue<string>, overrides?: CallOverrides): Promise<BigNumber>;
        getRaribleV2Royalties(id: PromiseOrValue<BigNumberish>, overrides?: CallOverrides): Promise<BigNumber>;
        isApprovedForAll(_owner: PromiseOrValue<string>, _operator: PromiseOrValue<string>, overrides?: CallOverrides): Promise<BigNumber>;
        /**
         * Returns `true` if `account` has been granted to minters.
         */
        isMinter(account: PromiseOrValue<string>, overrides?: CallOverrides): Promise<BigNumber>;
        name(overrides?: CallOverrides): Promise<BigNumber>;
        /**
         * Returns the address of the current owner.
         */
        owner(overrides?: CallOverrides): Promise<BigNumber>;
        /**
         * Revoke `_minter` from the list of allowed minters.
         */
        removeMinter(_minter: PromiseOrValue<string>, overrides?: Overrides & {
            from?: PromiseOrValue<string>;
        }): Promise<BigNumber>;
        /**
         * Leaves the contract without owner. It will not be possible to call `onlyOwner` functions anymore. Can only be called by the current owner. NOTE: Renouncing ownership will leave the contract without an owner, thereby removing any functionality that is only available to the owner.
         */
        renounceOwnership(overrides?: Overrides & {
            from?: PromiseOrValue<string>;
        }): Promise<BigNumber>;
        royaltyInfo(id: PromiseOrValue<BigNumberish>, _salePrice: PromiseOrValue<BigNumberish>, overrides?: CallOverrides): Promise<BigNumber>;
        /**
         * See {IERC1155-safeBatchTransferFrom}.
         */
        safeBatchTransferFrom(from: PromiseOrValue<string>, to: PromiseOrValue<string>, ids: PromiseOrValue<BigNumberish>[], amounts: PromiseOrValue<BigNumberish>[], data: PromiseOrValue<BytesLike>, overrides?: Overrides & {
            from?: PromiseOrValue<string>;
        }): Promise<BigNumber>;
        /**
         * See {IERC1155-safeTransferFrom}.
         */
        safeTransferFrom(from: PromiseOrValue<string>, to: PromiseOrValue<string>, id: PromiseOrValue<BigNumberish>, amount: PromiseOrValue<BigNumberish>, data: PromiseOrValue<BytesLike>, overrides?: Overrides & {
            from?: PromiseOrValue<string>;
        }): Promise<BigNumber>;
        /**
         * See {IERC1155-setApprovalForAll}.
         */
        setApprovalForAll(operator: PromiseOrValue<string>, approved: PromiseOrValue<boolean>, overrides?: Overrides & {
            from?: PromiseOrValue<string>;
        }): Promise<BigNumber>;
        setBaseURI(newBaseURI: PromiseOrValue<string>, overrides?: Overrides & {
            from?: PromiseOrValue<string>;
        }): Promise<BigNumber>;
        supportsInterface(interfaceId: PromiseOrValue<BytesLike>, overrides?: CallOverrides): Promise<BigNumber>;
        symbol(overrides?: CallOverrides): Promise<BigNumber>;
        transferFromOrMint(data: LibERC1155LazyMint.Mint1155DataStruct, from: PromiseOrValue<string>, to: PromiseOrValue<string>, amount: PromiseOrValue<BigNumberish>, overrides?: Overrides & {
            from?: PromiseOrValue<string>;
        }): Promise<BigNumber>;
        /**
         * Transfers ownership of the contract to a new account (`newOwner`). Can only be called by the current owner.
         */
        transferOwnership(newOwner: PromiseOrValue<string>, overrides?: Overrides & {
            from?: PromiseOrValue<string>;
        }): Promise<BigNumber>;
        updateAccount(_id: PromiseOrValue<BigNumberish>, _from: PromiseOrValue<string>, _to: PromiseOrValue<string>, overrides?: Overrides & {
            from?: PromiseOrValue<string>;
        }): Promise<BigNumber>;
        uri(id: PromiseOrValue<BigNumberish>, overrides?: CallOverrides): Promise<BigNumber>;
        __ERC1155RaribleUser_init(_name: PromiseOrValue<string>, _symbol: PromiseOrValue<string>, baseURI: PromiseOrValue<string>, contractURI: PromiseOrValue<string>, operators: PromiseOrValue<string>[], transferProxy: PromiseOrValue<string>, lazyTransferProxy: PromiseOrValue<string>, overrides?: Overrides & {
            from?: PromiseOrValue<string>;
        }): Promise<BigNumber>;
        __ERC1155Rarible_init(_name: PromiseOrValue<string>, _symbol: PromiseOrValue<string>, baseURI: PromiseOrValue<string>, contractURI: PromiseOrValue<string>, transferProxy: PromiseOrValue<string>, lazyTransferProxy: PromiseOrValue<string>, overrides?: Overrides & {
            from?: PromiseOrValue<string>;
        }): Promise<BigNumber>;
        mintAndTransfer(data: LibERC1155LazyMint.Mint1155DataStruct, to: PromiseOrValue<string>, _amount: PromiseOrValue<BigNumberish>, overrides?: Overrides & {
            from?: PromiseOrValue<string>;
        }): Promise<BigNumber>;
    };
    populateTransaction: {
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
         * See {IERC1155-balanceOf}. Requirements: - `account` cannot be the zero address.
         */
        balanceOf(account: PromiseOrValue<string>, id: PromiseOrValue<BigNumberish>, overrides?: CallOverrides): Promise<PopulatedTransaction>;
        /**
         * See {IERC1155-balanceOfBatch}. Requirements: - `accounts` and `ids` must have the same length.
         */
        balanceOfBatch(accounts: PromiseOrValue<string>[], ids: PromiseOrValue<BigNumberish>[], overrides?: CallOverrides): Promise<PopulatedTransaction>;
        /**
         * Returns the base URI set via {_setBaseURI}. This will be automatically added as a prefix in {tokenURI} to each token's URI, or to the token ID if no specific URI is set for that token ID.
         */
        baseURI(overrides?: CallOverrides): Promise<PopulatedTransaction>;
        burn(account: PromiseOrValue<string>, id: PromiseOrValue<BigNumberish>, amount: PromiseOrValue<BigNumberish>, overrides?: Overrides & {
            from?: PromiseOrValue<string>;
        }): Promise<PopulatedTransaction>;
        burnBatch(account: PromiseOrValue<string>, ids: PromiseOrValue<BigNumberish>[], amounts: PromiseOrValue<BigNumberish>[], overrides?: Overrides & {
            from?: PromiseOrValue<string>;
        }): Promise<PopulatedTransaction>;
        contractURI(overrides?: CallOverrides): Promise<PopulatedTransaction>;
        executeMetaTransaction(userAddress: PromiseOrValue<string>, functionSignature: PromiseOrValue<BytesLike>, sigR: PromiseOrValue<BytesLike>, sigS: PromiseOrValue<BytesLike>, sigV: PromiseOrValue<BigNumberish>, overrides?: PayableOverrides & {
            from?: PromiseOrValue<string>;
        }): Promise<PopulatedTransaction>;
        getCreators(_id: PromiseOrValue<BigNumberish>, overrides?: CallOverrides): Promise<PopulatedTransaction>;
        getNonce(user: PromiseOrValue<string>, overrides?: CallOverrides): Promise<PopulatedTransaction>;
        getRaribleV2Royalties(id: PromiseOrValue<BigNumberish>, overrides?: CallOverrides): Promise<PopulatedTransaction>;
        isApprovedForAll(_owner: PromiseOrValue<string>, _operator: PromiseOrValue<string>, overrides?: CallOverrides): Promise<PopulatedTransaction>;
        /**
         * Returns `true` if `account` has been granted to minters.
         */
        isMinter(account: PromiseOrValue<string>, overrides?: CallOverrides): Promise<PopulatedTransaction>;
        name(overrides?: CallOverrides): Promise<PopulatedTransaction>;
        /**
         * Returns the address of the current owner.
         */
        owner(overrides?: CallOverrides): Promise<PopulatedTransaction>;
        /**
         * Revoke `_minter` from the list of allowed minters.
         */
        removeMinter(_minter: PromiseOrValue<string>, overrides?: Overrides & {
            from?: PromiseOrValue<string>;
        }): Promise<PopulatedTransaction>;
        /**
         * Leaves the contract without owner. It will not be possible to call `onlyOwner` functions anymore. Can only be called by the current owner. NOTE: Renouncing ownership will leave the contract without an owner, thereby removing any functionality that is only available to the owner.
         */
        renounceOwnership(overrides?: Overrides & {
            from?: PromiseOrValue<string>;
        }): Promise<PopulatedTransaction>;
        royaltyInfo(id: PromiseOrValue<BigNumberish>, _salePrice: PromiseOrValue<BigNumberish>, overrides?: CallOverrides): Promise<PopulatedTransaction>;
        /**
         * See {IERC1155-safeBatchTransferFrom}.
         */
        safeBatchTransferFrom(from: PromiseOrValue<string>, to: PromiseOrValue<string>, ids: PromiseOrValue<BigNumberish>[], amounts: PromiseOrValue<BigNumberish>[], data: PromiseOrValue<BytesLike>, overrides?: Overrides & {
            from?: PromiseOrValue<string>;
        }): Promise<PopulatedTransaction>;
        /**
         * See {IERC1155-safeTransferFrom}.
         */
        safeTransferFrom(from: PromiseOrValue<string>, to: PromiseOrValue<string>, id: PromiseOrValue<BigNumberish>, amount: PromiseOrValue<BigNumberish>, data: PromiseOrValue<BytesLike>, overrides?: Overrides & {
            from?: PromiseOrValue<string>;
        }): Promise<PopulatedTransaction>;
        /**
         * See {IERC1155-setApprovalForAll}.
         */
        setApprovalForAll(operator: PromiseOrValue<string>, approved: PromiseOrValue<boolean>, overrides?: Overrides & {
            from?: PromiseOrValue<string>;
        }): Promise<PopulatedTransaction>;
        setBaseURI(newBaseURI: PromiseOrValue<string>, overrides?: Overrides & {
            from?: PromiseOrValue<string>;
        }): Promise<PopulatedTransaction>;
        supportsInterface(interfaceId: PromiseOrValue<BytesLike>, overrides?: CallOverrides): Promise<PopulatedTransaction>;
        symbol(overrides?: CallOverrides): Promise<PopulatedTransaction>;
        transferFromOrMint(data: LibERC1155LazyMint.Mint1155DataStruct, from: PromiseOrValue<string>, to: PromiseOrValue<string>, amount: PromiseOrValue<BigNumberish>, overrides?: Overrides & {
            from?: PromiseOrValue<string>;
        }): Promise<PopulatedTransaction>;
        /**
         * Transfers ownership of the contract to a new account (`newOwner`). Can only be called by the current owner.
         */
        transferOwnership(newOwner: PromiseOrValue<string>, overrides?: Overrides & {
            from?: PromiseOrValue<string>;
        }): Promise<PopulatedTransaction>;
        updateAccount(_id: PromiseOrValue<BigNumberish>, _from: PromiseOrValue<string>, _to: PromiseOrValue<string>, overrides?: Overrides & {
            from?: PromiseOrValue<string>;
        }): Promise<PopulatedTransaction>;
        uri(id: PromiseOrValue<BigNumberish>, overrides?: CallOverrides): Promise<PopulatedTransaction>;
        __ERC1155RaribleUser_init(_name: PromiseOrValue<string>, _symbol: PromiseOrValue<string>, baseURI: PromiseOrValue<string>, contractURI: PromiseOrValue<string>, operators: PromiseOrValue<string>[], transferProxy: PromiseOrValue<string>, lazyTransferProxy: PromiseOrValue<string>, overrides?: Overrides & {
            from?: PromiseOrValue<string>;
        }): Promise<PopulatedTransaction>;
        __ERC1155Rarible_init(_name: PromiseOrValue<string>, _symbol: PromiseOrValue<string>, baseURI: PromiseOrValue<string>, contractURI: PromiseOrValue<string>, transferProxy: PromiseOrValue<string>, lazyTransferProxy: PromiseOrValue<string>, overrides?: Overrides & {
            from?: PromiseOrValue<string>;
        }): Promise<PopulatedTransaction>;
        mintAndTransfer(data: LibERC1155LazyMint.Mint1155DataStruct, to: PromiseOrValue<string>, _amount: PromiseOrValue<BigNumberish>, overrides?: Overrides & {
            from?: PromiseOrValue<string>;
        }): Promise<PopulatedTransaction>;
    };
}
