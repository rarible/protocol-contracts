import type { BaseContract, BigNumber, BigNumberish, BytesLike, CallOverrides, ContractTransaction, Overrides, PayableOverrides, PopulatedTransaction, Signer, utils } from "ethers";
import type { FunctionFragment, Result, EventFragment } from "@ethersproject/abi";
import type { Listener, Provider } from "@ethersproject/providers";
import type { TypedEventFilter, TypedEvent, TypedListener, OnEvent, PromiseOrValue } from "../../common";
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
export declare namespace LibERC721LazyMint {
    type Mint721DataStruct = {
        tokenId: PromiseOrValue<BigNumberish>;
        tokenURI: PromiseOrValue<string>;
        creators: LibPart.PartStruct[];
        royalties: LibPart.PartStruct[];
        signatures: PromiseOrValue<BytesLike>[];
    };
    type Mint721DataStructOutput = [
        BigNumber,
        string,
        LibPart.PartStructOutput[],
        LibPart.PartStructOutput[],
        string[]
    ] & {
        tokenId: BigNumber;
        tokenURI: string;
        creators: LibPart.PartStructOutput[];
        royalties: LibPart.PartStructOutput[];
        signatures: string[];
    };
}
export interface ERC721RaribleMetaInterface extends utils.Interface {
    functions: {
        "__ERC721RaribleUser_init(string,string,string,string,address[],address,address)": FunctionFragment;
        "__ERC721Rarible_init(string,string,string,string,address,address)": FunctionFragment;
        "addMinter(address)": FunctionFragment;
        "addMinters(address[])": FunctionFragment;
        "approve(address,uint256)": FunctionFragment;
        "balanceOf(address)": FunctionFragment;
        "baseURI()": FunctionFragment;
        "burn(uint256)": FunctionFragment;
        "contractURI()": FunctionFragment;
        "executeMetaTransaction(address,bytes,bytes32,bytes32,uint8)": FunctionFragment;
        "getApproved(uint256)": FunctionFragment;
        "getCreators(uint256)": FunctionFragment;
        "getNonce(address)": FunctionFragment;
        "getRaribleV2Royalties(uint256)": FunctionFragment;
        "isApprovedForAll(address,address)": FunctionFragment;
        "isMinter(address)": FunctionFragment;
        "mintAndTransfer((uint256,string,(address,uint96)[],(address,uint96)[],bytes[]),address)": FunctionFragment;
        "name()": FunctionFragment;
        "owner()": FunctionFragment;
        "ownerOf(uint256)": FunctionFragment;
        "removeMinter(address)": FunctionFragment;
        "renounceOwnership()": FunctionFragment;
        "royaltyInfo(uint256,uint256)": FunctionFragment;
        "safeTransferFrom(address,address,uint256)": FunctionFragment;
        "safeTransferFrom(address,address,uint256,bytes)": FunctionFragment;
        "setApprovalForAll(address,bool)": FunctionFragment;
        "setBaseURI(string)": FunctionFragment;
        "supportsInterface(bytes4)": FunctionFragment;
        "symbol()": FunctionFragment;
        "tokenURI(uint256)": FunctionFragment;
        "transferFrom(address,address,uint256)": FunctionFragment;
        "transferFromOrMint((uint256,string,(address,uint96)[],(address,uint96)[],bytes[]),address,address)": FunctionFragment;
        "transferOwnership(address)": FunctionFragment;
        "updateAccount(uint256,address,address)": FunctionFragment;
    };
    getFunction(nameOrSignatureOrTopic: "__ERC721RaribleUser_init" | "__ERC721Rarible_init" | "addMinter" | "addMinters" | "approve" | "balanceOf" | "baseURI" | "burn" | "contractURI" | "executeMetaTransaction" | "getApproved" | "getCreators" | "getNonce" | "getRaribleV2Royalties" | "isApprovedForAll" | "isMinter" | "mintAndTransfer" | "name" | "owner" | "ownerOf" | "removeMinter" | "renounceOwnership" | "royaltyInfo" | "safeTransferFrom(address,address,uint256)" | "safeTransferFrom(address,address,uint256,bytes)" | "setApprovalForAll" | "setBaseURI" | "supportsInterface" | "symbol" | "tokenURI" | "transferFrom" | "transferFromOrMint" | "transferOwnership" | "updateAccount"): FunctionFragment;
    encodeFunctionData(functionFragment: "__ERC721RaribleUser_init", values: [
        PromiseOrValue<string>,
        PromiseOrValue<string>,
        PromiseOrValue<string>,
        PromiseOrValue<string>,
        PromiseOrValue<string>[],
        PromiseOrValue<string>,
        PromiseOrValue<string>
    ]): string;
    encodeFunctionData(functionFragment: "__ERC721Rarible_init", values: [
        PromiseOrValue<string>,
        PromiseOrValue<string>,
        PromiseOrValue<string>,
        PromiseOrValue<string>,
        PromiseOrValue<string>,
        PromiseOrValue<string>
    ]): string;
    encodeFunctionData(functionFragment: "addMinter", values: [PromiseOrValue<string>]): string;
    encodeFunctionData(functionFragment: "addMinters", values: [PromiseOrValue<string>[]]): string;
    encodeFunctionData(functionFragment: "approve", values: [PromiseOrValue<string>, PromiseOrValue<BigNumberish>]): string;
    encodeFunctionData(functionFragment: "balanceOf", values: [PromiseOrValue<string>]): string;
    encodeFunctionData(functionFragment: "baseURI", values?: undefined): string;
    encodeFunctionData(functionFragment: "burn", values: [PromiseOrValue<BigNumberish>]): string;
    encodeFunctionData(functionFragment: "contractURI", values?: undefined): string;
    encodeFunctionData(functionFragment: "executeMetaTransaction", values: [
        PromiseOrValue<string>,
        PromiseOrValue<BytesLike>,
        PromiseOrValue<BytesLike>,
        PromiseOrValue<BytesLike>,
        PromiseOrValue<BigNumberish>
    ]): string;
    encodeFunctionData(functionFragment: "getApproved", values: [PromiseOrValue<BigNumberish>]): string;
    encodeFunctionData(functionFragment: "getCreators", values: [PromiseOrValue<BigNumberish>]): string;
    encodeFunctionData(functionFragment: "getNonce", values: [PromiseOrValue<string>]): string;
    encodeFunctionData(functionFragment: "getRaribleV2Royalties", values: [PromiseOrValue<BigNumberish>]): string;
    encodeFunctionData(functionFragment: "isApprovedForAll", values: [PromiseOrValue<string>, PromiseOrValue<string>]): string;
    encodeFunctionData(functionFragment: "isMinter", values: [PromiseOrValue<string>]): string;
    encodeFunctionData(functionFragment: "mintAndTransfer", values: [LibERC721LazyMint.Mint721DataStruct, PromiseOrValue<string>]): string;
    encodeFunctionData(functionFragment: "name", values?: undefined): string;
    encodeFunctionData(functionFragment: "owner", values?: undefined): string;
    encodeFunctionData(functionFragment: "ownerOf", values: [PromiseOrValue<BigNumberish>]): string;
    encodeFunctionData(functionFragment: "removeMinter", values: [PromiseOrValue<string>]): string;
    encodeFunctionData(functionFragment: "renounceOwnership", values?: undefined): string;
    encodeFunctionData(functionFragment: "royaltyInfo", values: [PromiseOrValue<BigNumberish>, PromiseOrValue<BigNumberish>]): string;
    encodeFunctionData(functionFragment: "safeTransferFrom(address,address,uint256)", values: [
        PromiseOrValue<string>,
        PromiseOrValue<string>,
        PromiseOrValue<BigNumberish>
    ]): string;
    encodeFunctionData(functionFragment: "safeTransferFrom(address,address,uint256,bytes)", values: [
        PromiseOrValue<string>,
        PromiseOrValue<string>,
        PromiseOrValue<BigNumberish>,
        PromiseOrValue<BytesLike>
    ]): string;
    encodeFunctionData(functionFragment: "setApprovalForAll", values: [PromiseOrValue<string>, PromiseOrValue<boolean>]): string;
    encodeFunctionData(functionFragment: "setBaseURI", values: [PromiseOrValue<string>]): string;
    encodeFunctionData(functionFragment: "supportsInterface", values: [PromiseOrValue<BytesLike>]): string;
    encodeFunctionData(functionFragment: "symbol", values?: undefined): string;
    encodeFunctionData(functionFragment: "tokenURI", values: [PromiseOrValue<BigNumberish>]): string;
    encodeFunctionData(functionFragment: "transferFrom", values: [
        PromiseOrValue<string>,
        PromiseOrValue<string>,
        PromiseOrValue<BigNumberish>
    ]): string;
    encodeFunctionData(functionFragment: "transferFromOrMint", values: [
        LibERC721LazyMint.Mint721DataStruct,
        PromiseOrValue<string>,
        PromiseOrValue<string>
    ]): string;
    encodeFunctionData(functionFragment: "transferOwnership", values: [PromiseOrValue<string>]): string;
    encodeFunctionData(functionFragment: "updateAccount", values: [
        PromiseOrValue<BigNumberish>,
        PromiseOrValue<string>,
        PromiseOrValue<string>
    ]): string;
    decodeFunctionResult(functionFragment: "__ERC721RaribleUser_init", data: BytesLike): Result;
    decodeFunctionResult(functionFragment: "__ERC721Rarible_init", data: BytesLike): Result;
    decodeFunctionResult(functionFragment: "addMinter", data: BytesLike): Result;
    decodeFunctionResult(functionFragment: "addMinters", data: BytesLike): Result;
    decodeFunctionResult(functionFragment: "approve", data: BytesLike): Result;
    decodeFunctionResult(functionFragment: "balanceOf", data: BytesLike): Result;
    decodeFunctionResult(functionFragment: "baseURI", data: BytesLike): Result;
    decodeFunctionResult(functionFragment: "burn", data: BytesLike): Result;
    decodeFunctionResult(functionFragment: "contractURI", data: BytesLike): Result;
    decodeFunctionResult(functionFragment: "executeMetaTransaction", data: BytesLike): Result;
    decodeFunctionResult(functionFragment: "getApproved", data: BytesLike): Result;
    decodeFunctionResult(functionFragment: "getCreators", data: BytesLike): Result;
    decodeFunctionResult(functionFragment: "getNonce", data: BytesLike): Result;
    decodeFunctionResult(functionFragment: "getRaribleV2Royalties", data: BytesLike): Result;
    decodeFunctionResult(functionFragment: "isApprovedForAll", data: BytesLike): Result;
    decodeFunctionResult(functionFragment: "isMinter", data: BytesLike): Result;
    decodeFunctionResult(functionFragment: "mintAndTransfer", data: BytesLike): Result;
    decodeFunctionResult(functionFragment: "name", data: BytesLike): Result;
    decodeFunctionResult(functionFragment: "owner", data: BytesLike): Result;
    decodeFunctionResult(functionFragment: "ownerOf", data: BytesLike): Result;
    decodeFunctionResult(functionFragment: "removeMinter", data: BytesLike): Result;
    decodeFunctionResult(functionFragment: "renounceOwnership", data: BytesLike): Result;
    decodeFunctionResult(functionFragment: "royaltyInfo", data: BytesLike): Result;
    decodeFunctionResult(functionFragment: "safeTransferFrom(address,address,uint256)", data: BytesLike): Result;
    decodeFunctionResult(functionFragment: "safeTransferFrom(address,address,uint256,bytes)", data: BytesLike): Result;
    decodeFunctionResult(functionFragment: "setApprovalForAll", data: BytesLike): Result;
    decodeFunctionResult(functionFragment: "setBaseURI", data: BytesLike): Result;
    decodeFunctionResult(functionFragment: "supportsInterface", data: BytesLike): Result;
    decodeFunctionResult(functionFragment: "symbol", data: BytesLike): Result;
    decodeFunctionResult(functionFragment: "tokenURI", data: BytesLike): Result;
    decodeFunctionResult(functionFragment: "transferFrom", data: BytesLike): Result;
    decodeFunctionResult(functionFragment: "transferFromOrMint", data: BytesLike): Result;
    decodeFunctionResult(functionFragment: "transferOwnership", data: BytesLike): Result;
    decodeFunctionResult(functionFragment: "updateAccount", data: BytesLike): Result;
    events: {
        "Approval(address,address,uint256)": EventFragment;
        "ApprovalForAll(address,address,bool)": EventFragment;
        "BaseUriChanged(string)": EventFragment;
        "CreateERC721Rarible(address,string,string)": EventFragment;
        "CreateERC721RaribleUser(address,string,string)": EventFragment;
        "Creators(uint256,tuple[])": EventFragment;
        "DefaultApproval(address,bool)": EventFragment;
        "MetaTransactionExecuted(address,address,bytes)": EventFragment;
        "MinterStatusChanged(address,bool)": EventFragment;
        "OwnershipTransferred(address,address)": EventFragment;
        "RoyaltiesSet(uint256,tuple[])": EventFragment;
        "Transfer(address,address,uint256)": EventFragment;
    };
    getEvent(nameOrSignatureOrTopic: "Approval"): EventFragment;
    getEvent(nameOrSignatureOrTopic: "ApprovalForAll"): EventFragment;
    getEvent(nameOrSignatureOrTopic: "BaseUriChanged"): EventFragment;
    getEvent(nameOrSignatureOrTopic: "CreateERC721Rarible"): EventFragment;
    getEvent(nameOrSignatureOrTopic: "CreateERC721RaribleUser"): EventFragment;
    getEvent(nameOrSignatureOrTopic: "Creators"): EventFragment;
    getEvent(nameOrSignatureOrTopic: "DefaultApproval"): EventFragment;
    getEvent(nameOrSignatureOrTopic: "MetaTransactionExecuted"): EventFragment;
    getEvent(nameOrSignatureOrTopic: "MinterStatusChanged"): EventFragment;
    getEvent(nameOrSignatureOrTopic: "OwnershipTransferred"): EventFragment;
    getEvent(nameOrSignatureOrTopic: "RoyaltiesSet"): EventFragment;
    getEvent(nameOrSignatureOrTopic: "Transfer"): EventFragment;
}
export interface ApprovalEventObject {
    owner: string;
    approved: string;
    tokenId: BigNumber;
}
export type ApprovalEvent = TypedEvent<[
    string,
    string,
    BigNumber
], ApprovalEventObject>;
export type ApprovalEventFilter = TypedEventFilter<ApprovalEvent>;
export interface ApprovalForAllEventObject {
    owner: string;
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
export interface CreateERC721RaribleEventObject {
    owner: string;
    name: string;
    symbol: string;
}
export type CreateERC721RaribleEvent = TypedEvent<[
    string,
    string,
    string
], CreateERC721RaribleEventObject>;
export type CreateERC721RaribleEventFilter = TypedEventFilter<CreateERC721RaribleEvent>;
export interface CreateERC721RaribleUserEventObject {
    owner: string;
    name: string;
    symbol: string;
}
export type CreateERC721RaribleUserEvent = TypedEvent<[
    string,
    string,
    string
], CreateERC721RaribleUserEventObject>;
export type CreateERC721RaribleUserEventFilter = TypedEventFilter<CreateERC721RaribleUserEvent>;
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
export interface TransferEventObject {
    from: string;
    to: string;
    tokenId: BigNumber;
}
export type TransferEvent = TypedEvent<[
    string,
    string,
    BigNumber
], TransferEventObject>;
export type TransferEventFilter = TypedEventFilter<TransferEvent>;
export interface ERC721RaribleMeta extends BaseContract {
    connect(signerOrProvider: Signer | Provider | string): this;
    attach(addressOrName: string): this;
    deployed(): Promise<this>;
    interface: ERC721RaribleMetaInterface;
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
        __ERC721RaribleUser_init(_name: PromiseOrValue<string>, _symbol: PromiseOrValue<string>, baseURI: PromiseOrValue<string>, contractURI: PromiseOrValue<string>, operators: PromiseOrValue<string>[], transferProxy: PromiseOrValue<string>, lazyTransferProxy: PromiseOrValue<string>, overrides?: Overrides & {
            from?: PromiseOrValue<string>;
        }): Promise<ContractTransaction>;
        __ERC721Rarible_init(_name: PromiseOrValue<string>, _symbol: PromiseOrValue<string>, baseURI: PromiseOrValue<string>, contractURI: PromiseOrValue<string>, transferProxy: PromiseOrValue<string>, lazyTransferProxy: PromiseOrValue<string>, overrides?: Overrides & {
            from?: PromiseOrValue<string>;
        }): Promise<ContractTransaction>;
        addMinter(minter: PromiseOrValue<string>, overrides?: Overrides & {
            from?: PromiseOrValue<string>;
        }): Promise<ContractTransaction>;
        addMinters(minters: PromiseOrValue<string>[], overrides?: Overrides & {
            from?: PromiseOrValue<string>;
        }): Promise<ContractTransaction>;
        approve(to: PromiseOrValue<string>, tokenId: PromiseOrValue<BigNumberish>, overrides?: Overrides & {
            from?: PromiseOrValue<string>;
        }): Promise<ContractTransaction>;
        balanceOf(owner: PromiseOrValue<string>, overrides?: CallOverrides): Promise<[BigNumber]>;
        baseURI(overrides?: CallOverrides): Promise<[string]>;
        burn(tokenId: PromiseOrValue<BigNumberish>, overrides?: Overrides & {
            from?: PromiseOrValue<string>;
        }): Promise<ContractTransaction>;
        contractURI(overrides?: CallOverrides): Promise<[string]>;
        executeMetaTransaction(userAddress: PromiseOrValue<string>, functionSignature: PromiseOrValue<BytesLike>, sigR: PromiseOrValue<BytesLike>, sigS: PromiseOrValue<BytesLike>, sigV: PromiseOrValue<BigNumberish>, overrides?: PayableOverrides & {
            from?: PromiseOrValue<string>;
        }): Promise<ContractTransaction>;
        getApproved(tokenId: PromiseOrValue<BigNumberish>, overrides?: CallOverrides): Promise<[string]>;
        getCreators(_id: PromiseOrValue<BigNumberish>, overrides?: CallOverrides): Promise<[LibPart.PartStructOutput[]]>;
        getNonce(user: PromiseOrValue<string>, overrides?: CallOverrides): Promise<[BigNumber] & {
            nonce: BigNumber;
        }>;
        getRaribleV2Royalties(id: PromiseOrValue<BigNumberish>, overrides?: CallOverrides): Promise<[LibPart.PartStructOutput[]]>;
        isApprovedForAll(owner: PromiseOrValue<string>, operator: PromiseOrValue<string>, overrides?: CallOverrides): Promise<[boolean]>;
        isMinter(account: PromiseOrValue<string>, overrides?: CallOverrides): Promise<[boolean]>;
        mintAndTransfer(data: LibERC721LazyMint.Mint721DataStruct, to: PromiseOrValue<string>, overrides?: Overrides & {
            from?: PromiseOrValue<string>;
        }): Promise<ContractTransaction>;
        name(overrides?: CallOverrides): Promise<[string]>;
        owner(overrides?: CallOverrides): Promise<[string]>;
        ownerOf(tokenId: PromiseOrValue<BigNumberish>, overrides?: CallOverrides): Promise<[string]>;
        removeMinter(_minter: PromiseOrValue<string>, overrides?: Overrides & {
            from?: PromiseOrValue<string>;
        }): Promise<ContractTransaction>;
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
        "safeTransferFrom(address,address,uint256)"(from: PromiseOrValue<string>, to: PromiseOrValue<string>, tokenId: PromiseOrValue<BigNumberish>, overrides?: Overrides & {
            from?: PromiseOrValue<string>;
        }): Promise<ContractTransaction>;
        "safeTransferFrom(address,address,uint256,bytes)"(from: PromiseOrValue<string>, to: PromiseOrValue<string>, tokenId: PromiseOrValue<BigNumberish>, _data: PromiseOrValue<BytesLike>, overrides?: Overrides & {
            from?: PromiseOrValue<string>;
        }): Promise<ContractTransaction>;
        setApprovalForAll(operator: PromiseOrValue<string>, approved: PromiseOrValue<boolean>, overrides?: Overrides & {
            from?: PromiseOrValue<string>;
        }): Promise<ContractTransaction>;
        setBaseURI(newBaseURI: PromiseOrValue<string>, overrides?: Overrides & {
            from?: PromiseOrValue<string>;
        }): Promise<ContractTransaction>;
        supportsInterface(interfaceId: PromiseOrValue<BytesLike>, overrides?: CallOverrides): Promise<[boolean]>;
        symbol(overrides?: CallOverrides): Promise<[string]>;
        tokenURI(tokenId: PromiseOrValue<BigNumberish>, overrides?: CallOverrides): Promise<[string]>;
        transferFrom(from: PromiseOrValue<string>, to: PromiseOrValue<string>, tokenId: PromiseOrValue<BigNumberish>, overrides?: Overrides & {
            from?: PromiseOrValue<string>;
        }): Promise<ContractTransaction>;
        transferFromOrMint(data: LibERC721LazyMint.Mint721DataStruct, from: PromiseOrValue<string>, to: PromiseOrValue<string>, overrides?: Overrides & {
            from?: PromiseOrValue<string>;
        }): Promise<ContractTransaction>;
        transferOwnership(newOwner: PromiseOrValue<string>, overrides?: Overrides & {
            from?: PromiseOrValue<string>;
        }): Promise<ContractTransaction>;
        updateAccount(_id: PromiseOrValue<BigNumberish>, _from: PromiseOrValue<string>, _to: PromiseOrValue<string>, overrides?: Overrides & {
            from?: PromiseOrValue<string>;
        }): Promise<ContractTransaction>;
    };
    __ERC721RaribleUser_init(_name: PromiseOrValue<string>, _symbol: PromiseOrValue<string>, baseURI: PromiseOrValue<string>, contractURI: PromiseOrValue<string>, operators: PromiseOrValue<string>[], transferProxy: PromiseOrValue<string>, lazyTransferProxy: PromiseOrValue<string>, overrides?: Overrides & {
        from?: PromiseOrValue<string>;
    }): Promise<ContractTransaction>;
    __ERC721Rarible_init(_name: PromiseOrValue<string>, _symbol: PromiseOrValue<string>, baseURI: PromiseOrValue<string>, contractURI: PromiseOrValue<string>, transferProxy: PromiseOrValue<string>, lazyTransferProxy: PromiseOrValue<string>, overrides?: Overrides & {
        from?: PromiseOrValue<string>;
    }): Promise<ContractTransaction>;
    addMinter(minter: PromiseOrValue<string>, overrides?: Overrides & {
        from?: PromiseOrValue<string>;
    }): Promise<ContractTransaction>;
    addMinters(minters: PromiseOrValue<string>[], overrides?: Overrides & {
        from?: PromiseOrValue<string>;
    }): Promise<ContractTransaction>;
    approve(to: PromiseOrValue<string>, tokenId: PromiseOrValue<BigNumberish>, overrides?: Overrides & {
        from?: PromiseOrValue<string>;
    }): Promise<ContractTransaction>;
    balanceOf(owner: PromiseOrValue<string>, overrides?: CallOverrides): Promise<BigNumber>;
    baseURI(overrides?: CallOverrides): Promise<string>;
    burn(tokenId: PromiseOrValue<BigNumberish>, overrides?: Overrides & {
        from?: PromiseOrValue<string>;
    }): Promise<ContractTransaction>;
    contractURI(overrides?: CallOverrides): Promise<string>;
    executeMetaTransaction(userAddress: PromiseOrValue<string>, functionSignature: PromiseOrValue<BytesLike>, sigR: PromiseOrValue<BytesLike>, sigS: PromiseOrValue<BytesLike>, sigV: PromiseOrValue<BigNumberish>, overrides?: PayableOverrides & {
        from?: PromiseOrValue<string>;
    }): Promise<ContractTransaction>;
    getApproved(tokenId: PromiseOrValue<BigNumberish>, overrides?: CallOverrides): Promise<string>;
    getCreators(_id: PromiseOrValue<BigNumberish>, overrides?: CallOverrides): Promise<LibPart.PartStructOutput[]>;
    getNonce(user: PromiseOrValue<string>, overrides?: CallOverrides): Promise<BigNumber>;
    getRaribleV2Royalties(id: PromiseOrValue<BigNumberish>, overrides?: CallOverrides): Promise<LibPart.PartStructOutput[]>;
    isApprovedForAll(owner: PromiseOrValue<string>, operator: PromiseOrValue<string>, overrides?: CallOverrides): Promise<boolean>;
    isMinter(account: PromiseOrValue<string>, overrides?: CallOverrides): Promise<boolean>;
    mintAndTransfer(data: LibERC721LazyMint.Mint721DataStruct, to: PromiseOrValue<string>, overrides?: Overrides & {
        from?: PromiseOrValue<string>;
    }): Promise<ContractTransaction>;
    name(overrides?: CallOverrides): Promise<string>;
    owner(overrides?: CallOverrides): Promise<string>;
    ownerOf(tokenId: PromiseOrValue<BigNumberish>, overrides?: CallOverrides): Promise<string>;
    removeMinter(_minter: PromiseOrValue<string>, overrides?: Overrides & {
        from?: PromiseOrValue<string>;
    }): Promise<ContractTransaction>;
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
    "safeTransferFrom(address,address,uint256)"(from: PromiseOrValue<string>, to: PromiseOrValue<string>, tokenId: PromiseOrValue<BigNumberish>, overrides?: Overrides & {
        from?: PromiseOrValue<string>;
    }): Promise<ContractTransaction>;
    "safeTransferFrom(address,address,uint256,bytes)"(from: PromiseOrValue<string>, to: PromiseOrValue<string>, tokenId: PromiseOrValue<BigNumberish>, _data: PromiseOrValue<BytesLike>, overrides?: Overrides & {
        from?: PromiseOrValue<string>;
    }): Promise<ContractTransaction>;
    setApprovalForAll(operator: PromiseOrValue<string>, approved: PromiseOrValue<boolean>, overrides?: Overrides & {
        from?: PromiseOrValue<string>;
    }): Promise<ContractTransaction>;
    setBaseURI(newBaseURI: PromiseOrValue<string>, overrides?: Overrides & {
        from?: PromiseOrValue<string>;
    }): Promise<ContractTransaction>;
    supportsInterface(interfaceId: PromiseOrValue<BytesLike>, overrides?: CallOverrides): Promise<boolean>;
    symbol(overrides?: CallOverrides): Promise<string>;
    tokenURI(tokenId: PromiseOrValue<BigNumberish>, overrides?: CallOverrides): Promise<string>;
    transferFrom(from: PromiseOrValue<string>, to: PromiseOrValue<string>, tokenId: PromiseOrValue<BigNumberish>, overrides?: Overrides & {
        from?: PromiseOrValue<string>;
    }): Promise<ContractTransaction>;
    transferFromOrMint(data: LibERC721LazyMint.Mint721DataStruct, from: PromiseOrValue<string>, to: PromiseOrValue<string>, overrides?: Overrides & {
        from?: PromiseOrValue<string>;
    }): Promise<ContractTransaction>;
    transferOwnership(newOwner: PromiseOrValue<string>, overrides?: Overrides & {
        from?: PromiseOrValue<string>;
    }): Promise<ContractTransaction>;
    updateAccount(_id: PromiseOrValue<BigNumberish>, _from: PromiseOrValue<string>, _to: PromiseOrValue<string>, overrides?: Overrides & {
        from?: PromiseOrValue<string>;
    }): Promise<ContractTransaction>;
    callStatic: {
        __ERC721RaribleUser_init(_name: PromiseOrValue<string>, _symbol: PromiseOrValue<string>, baseURI: PromiseOrValue<string>, contractURI: PromiseOrValue<string>, operators: PromiseOrValue<string>[], transferProxy: PromiseOrValue<string>, lazyTransferProxy: PromiseOrValue<string>, overrides?: CallOverrides): Promise<void>;
        __ERC721Rarible_init(_name: PromiseOrValue<string>, _symbol: PromiseOrValue<string>, baseURI: PromiseOrValue<string>, contractURI: PromiseOrValue<string>, transferProxy: PromiseOrValue<string>, lazyTransferProxy: PromiseOrValue<string>, overrides?: CallOverrides): Promise<void>;
        addMinter(minter: PromiseOrValue<string>, overrides?: CallOverrides): Promise<void>;
        addMinters(minters: PromiseOrValue<string>[], overrides?: CallOverrides): Promise<void>;
        approve(to: PromiseOrValue<string>, tokenId: PromiseOrValue<BigNumberish>, overrides?: CallOverrides): Promise<void>;
        balanceOf(owner: PromiseOrValue<string>, overrides?: CallOverrides): Promise<BigNumber>;
        baseURI(overrides?: CallOverrides): Promise<string>;
        burn(tokenId: PromiseOrValue<BigNumberish>, overrides?: CallOverrides): Promise<void>;
        contractURI(overrides?: CallOverrides): Promise<string>;
        executeMetaTransaction(userAddress: PromiseOrValue<string>, functionSignature: PromiseOrValue<BytesLike>, sigR: PromiseOrValue<BytesLike>, sigS: PromiseOrValue<BytesLike>, sigV: PromiseOrValue<BigNumberish>, overrides?: CallOverrides): Promise<string>;
        getApproved(tokenId: PromiseOrValue<BigNumberish>, overrides?: CallOverrides): Promise<string>;
        getCreators(_id: PromiseOrValue<BigNumberish>, overrides?: CallOverrides): Promise<LibPart.PartStructOutput[]>;
        getNonce(user: PromiseOrValue<string>, overrides?: CallOverrides): Promise<BigNumber>;
        getRaribleV2Royalties(id: PromiseOrValue<BigNumberish>, overrides?: CallOverrides): Promise<LibPart.PartStructOutput[]>;
        isApprovedForAll(owner: PromiseOrValue<string>, operator: PromiseOrValue<string>, overrides?: CallOverrides): Promise<boolean>;
        isMinter(account: PromiseOrValue<string>, overrides?: CallOverrides): Promise<boolean>;
        mintAndTransfer(data: LibERC721LazyMint.Mint721DataStruct, to: PromiseOrValue<string>, overrides?: CallOverrides): Promise<void>;
        name(overrides?: CallOverrides): Promise<string>;
        owner(overrides?: CallOverrides): Promise<string>;
        ownerOf(tokenId: PromiseOrValue<BigNumberish>, overrides?: CallOverrides): Promise<string>;
        removeMinter(_minter: PromiseOrValue<string>, overrides?: CallOverrides): Promise<void>;
        renounceOwnership(overrides?: CallOverrides): Promise<void>;
        royaltyInfo(id: PromiseOrValue<BigNumberish>, _salePrice: PromiseOrValue<BigNumberish>, overrides?: CallOverrides): Promise<[
            string,
            BigNumber
        ] & {
            receiver: string;
            royaltyAmount: BigNumber;
        }>;
        "safeTransferFrom(address,address,uint256)"(from: PromiseOrValue<string>, to: PromiseOrValue<string>, tokenId: PromiseOrValue<BigNumberish>, overrides?: CallOverrides): Promise<void>;
        "safeTransferFrom(address,address,uint256,bytes)"(from: PromiseOrValue<string>, to: PromiseOrValue<string>, tokenId: PromiseOrValue<BigNumberish>, _data: PromiseOrValue<BytesLike>, overrides?: CallOverrides): Promise<void>;
        setApprovalForAll(operator: PromiseOrValue<string>, approved: PromiseOrValue<boolean>, overrides?: CallOverrides): Promise<void>;
        setBaseURI(newBaseURI: PromiseOrValue<string>, overrides?: CallOverrides): Promise<void>;
        supportsInterface(interfaceId: PromiseOrValue<BytesLike>, overrides?: CallOverrides): Promise<boolean>;
        symbol(overrides?: CallOverrides): Promise<string>;
        tokenURI(tokenId: PromiseOrValue<BigNumberish>, overrides?: CallOverrides): Promise<string>;
        transferFrom(from: PromiseOrValue<string>, to: PromiseOrValue<string>, tokenId: PromiseOrValue<BigNumberish>, overrides?: CallOverrides): Promise<void>;
        transferFromOrMint(data: LibERC721LazyMint.Mint721DataStruct, from: PromiseOrValue<string>, to: PromiseOrValue<string>, overrides?: CallOverrides): Promise<void>;
        transferOwnership(newOwner: PromiseOrValue<string>, overrides?: CallOverrides): Promise<void>;
        updateAccount(_id: PromiseOrValue<BigNumberish>, _from: PromiseOrValue<string>, _to: PromiseOrValue<string>, overrides?: CallOverrides): Promise<void>;
    };
    filters: {
        "Approval(address,address,uint256)"(owner?: PromiseOrValue<string> | null, approved?: PromiseOrValue<string> | null, tokenId?: PromiseOrValue<BigNumberish> | null): ApprovalEventFilter;
        Approval(owner?: PromiseOrValue<string> | null, approved?: PromiseOrValue<string> | null, tokenId?: PromiseOrValue<BigNumberish> | null): ApprovalEventFilter;
        "ApprovalForAll(address,address,bool)"(owner?: PromiseOrValue<string> | null, operator?: PromiseOrValue<string> | null, approved?: null): ApprovalForAllEventFilter;
        ApprovalForAll(owner?: PromiseOrValue<string> | null, operator?: PromiseOrValue<string> | null, approved?: null): ApprovalForAllEventFilter;
        "BaseUriChanged(string)"(newBaseURI?: null): BaseUriChangedEventFilter;
        BaseUriChanged(newBaseURI?: null): BaseUriChangedEventFilter;
        "CreateERC721Rarible(address,string,string)"(owner?: null, name?: null, symbol?: null): CreateERC721RaribleEventFilter;
        CreateERC721Rarible(owner?: null, name?: null, symbol?: null): CreateERC721RaribleEventFilter;
        "CreateERC721RaribleUser(address,string,string)"(owner?: null, name?: null, symbol?: null): CreateERC721RaribleUserEventFilter;
        CreateERC721RaribleUser(owner?: null, name?: null, symbol?: null): CreateERC721RaribleUserEventFilter;
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
        "Transfer(address,address,uint256)"(from?: PromiseOrValue<string> | null, to?: PromiseOrValue<string> | null, tokenId?: PromiseOrValue<BigNumberish> | null): TransferEventFilter;
        Transfer(from?: PromiseOrValue<string> | null, to?: PromiseOrValue<string> | null, tokenId?: PromiseOrValue<BigNumberish> | null): TransferEventFilter;
    };
    estimateGas: {
        __ERC721RaribleUser_init(_name: PromiseOrValue<string>, _symbol: PromiseOrValue<string>, baseURI: PromiseOrValue<string>, contractURI: PromiseOrValue<string>, operators: PromiseOrValue<string>[], transferProxy: PromiseOrValue<string>, lazyTransferProxy: PromiseOrValue<string>, overrides?: Overrides & {
            from?: PromiseOrValue<string>;
        }): Promise<BigNumber>;
        __ERC721Rarible_init(_name: PromiseOrValue<string>, _symbol: PromiseOrValue<string>, baseURI: PromiseOrValue<string>, contractURI: PromiseOrValue<string>, transferProxy: PromiseOrValue<string>, lazyTransferProxy: PromiseOrValue<string>, overrides?: Overrides & {
            from?: PromiseOrValue<string>;
        }): Promise<BigNumber>;
        addMinter(minter: PromiseOrValue<string>, overrides?: Overrides & {
            from?: PromiseOrValue<string>;
        }): Promise<BigNumber>;
        addMinters(minters: PromiseOrValue<string>[], overrides?: Overrides & {
            from?: PromiseOrValue<string>;
        }): Promise<BigNumber>;
        approve(to: PromiseOrValue<string>, tokenId: PromiseOrValue<BigNumberish>, overrides?: Overrides & {
            from?: PromiseOrValue<string>;
        }): Promise<BigNumber>;
        balanceOf(owner: PromiseOrValue<string>, overrides?: CallOverrides): Promise<BigNumber>;
        baseURI(overrides?: CallOverrides): Promise<BigNumber>;
        burn(tokenId: PromiseOrValue<BigNumberish>, overrides?: Overrides & {
            from?: PromiseOrValue<string>;
        }): Promise<BigNumber>;
        contractURI(overrides?: CallOverrides): Promise<BigNumber>;
        executeMetaTransaction(userAddress: PromiseOrValue<string>, functionSignature: PromiseOrValue<BytesLike>, sigR: PromiseOrValue<BytesLike>, sigS: PromiseOrValue<BytesLike>, sigV: PromiseOrValue<BigNumberish>, overrides?: PayableOverrides & {
            from?: PromiseOrValue<string>;
        }): Promise<BigNumber>;
        getApproved(tokenId: PromiseOrValue<BigNumberish>, overrides?: CallOverrides): Promise<BigNumber>;
        getCreators(_id: PromiseOrValue<BigNumberish>, overrides?: CallOverrides): Promise<BigNumber>;
        getNonce(user: PromiseOrValue<string>, overrides?: CallOverrides): Promise<BigNumber>;
        getRaribleV2Royalties(id: PromiseOrValue<BigNumberish>, overrides?: CallOverrides): Promise<BigNumber>;
        isApprovedForAll(owner: PromiseOrValue<string>, operator: PromiseOrValue<string>, overrides?: CallOverrides): Promise<BigNumber>;
        isMinter(account: PromiseOrValue<string>, overrides?: CallOverrides): Promise<BigNumber>;
        mintAndTransfer(data: LibERC721LazyMint.Mint721DataStruct, to: PromiseOrValue<string>, overrides?: Overrides & {
            from?: PromiseOrValue<string>;
        }): Promise<BigNumber>;
        name(overrides?: CallOverrides): Promise<BigNumber>;
        owner(overrides?: CallOverrides): Promise<BigNumber>;
        ownerOf(tokenId: PromiseOrValue<BigNumberish>, overrides?: CallOverrides): Promise<BigNumber>;
        removeMinter(_minter: PromiseOrValue<string>, overrides?: Overrides & {
            from?: PromiseOrValue<string>;
        }): Promise<BigNumber>;
        renounceOwnership(overrides?: Overrides & {
            from?: PromiseOrValue<string>;
        }): Promise<BigNumber>;
        royaltyInfo(id: PromiseOrValue<BigNumberish>, _salePrice: PromiseOrValue<BigNumberish>, overrides?: CallOverrides): Promise<BigNumber>;
        "safeTransferFrom(address,address,uint256)"(from: PromiseOrValue<string>, to: PromiseOrValue<string>, tokenId: PromiseOrValue<BigNumberish>, overrides?: Overrides & {
            from?: PromiseOrValue<string>;
        }): Promise<BigNumber>;
        "safeTransferFrom(address,address,uint256,bytes)"(from: PromiseOrValue<string>, to: PromiseOrValue<string>, tokenId: PromiseOrValue<BigNumberish>, _data: PromiseOrValue<BytesLike>, overrides?: Overrides & {
            from?: PromiseOrValue<string>;
        }): Promise<BigNumber>;
        setApprovalForAll(operator: PromiseOrValue<string>, approved: PromiseOrValue<boolean>, overrides?: Overrides & {
            from?: PromiseOrValue<string>;
        }): Promise<BigNumber>;
        setBaseURI(newBaseURI: PromiseOrValue<string>, overrides?: Overrides & {
            from?: PromiseOrValue<string>;
        }): Promise<BigNumber>;
        supportsInterface(interfaceId: PromiseOrValue<BytesLike>, overrides?: CallOverrides): Promise<BigNumber>;
        symbol(overrides?: CallOverrides): Promise<BigNumber>;
        tokenURI(tokenId: PromiseOrValue<BigNumberish>, overrides?: CallOverrides): Promise<BigNumber>;
        transferFrom(from: PromiseOrValue<string>, to: PromiseOrValue<string>, tokenId: PromiseOrValue<BigNumberish>, overrides?: Overrides & {
            from?: PromiseOrValue<string>;
        }): Promise<BigNumber>;
        transferFromOrMint(data: LibERC721LazyMint.Mint721DataStruct, from: PromiseOrValue<string>, to: PromiseOrValue<string>, overrides?: Overrides & {
            from?: PromiseOrValue<string>;
        }): Promise<BigNumber>;
        transferOwnership(newOwner: PromiseOrValue<string>, overrides?: Overrides & {
            from?: PromiseOrValue<string>;
        }): Promise<BigNumber>;
        updateAccount(_id: PromiseOrValue<BigNumberish>, _from: PromiseOrValue<string>, _to: PromiseOrValue<string>, overrides?: Overrides & {
            from?: PromiseOrValue<string>;
        }): Promise<BigNumber>;
    };
    populateTransaction: {
        __ERC721RaribleUser_init(_name: PromiseOrValue<string>, _symbol: PromiseOrValue<string>, baseURI: PromiseOrValue<string>, contractURI: PromiseOrValue<string>, operators: PromiseOrValue<string>[], transferProxy: PromiseOrValue<string>, lazyTransferProxy: PromiseOrValue<string>, overrides?: Overrides & {
            from?: PromiseOrValue<string>;
        }): Promise<PopulatedTransaction>;
        __ERC721Rarible_init(_name: PromiseOrValue<string>, _symbol: PromiseOrValue<string>, baseURI: PromiseOrValue<string>, contractURI: PromiseOrValue<string>, transferProxy: PromiseOrValue<string>, lazyTransferProxy: PromiseOrValue<string>, overrides?: Overrides & {
            from?: PromiseOrValue<string>;
        }): Promise<PopulatedTransaction>;
        addMinter(minter: PromiseOrValue<string>, overrides?: Overrides & {
            from?: PromiseOrValue<string>;
        }): Promise<PopulatedTransaction>;
        addMinters(minters: PromiseOrValue<string>[], overrides?: Overrides & {
            from?: PromiseOrValue<string>;
        }): Promise<PopulatedTransaction>;
        approve(to: PromiseOrValue<string>, tokenId: PromiseOrValue<BigNumberish>, overrides?: Overrides & {
            from?: PromiseOrValue<string>;
        }): Promise<PopulatedTransaction>;
        balanceOf(owner: PromiseOrValue<string>, overrides?: CallOverrides): Promise<PopulatedTransaction>;
        baseURI(overrides?: CallOverrides): Promise<PopulatedTransaction>;
        burn(tokenId: PromiseOrValue<BigNumberish>, overrides?: Overrides & {
            from?: PromiseOrValue<string>;
        }): Promise<PopulatedTransaction>;
        contractURI(overrides?: CallOverrides): Promise<PopulatedTransaction>;
        executeMetaTransaction(userAddress: PromiseOrValue<string>, functionSignature: PromiseOrValue<BytesLike>, sigR: PromiseOrValue<BytesLike>, sigS: PromiseOrValue<BytesLike>, sigV: PromiseOrValue<BigNumberish>, overrides?: PayableOverrides & {
            from?: PromiseOrValue<string>;
        }): Promise<PopulatedTransaction>;
        getApproved(tokenId: PromiseOrValue<BigNumberish>, overrides?: CallOverrides): Promise<PopulatedTransaction>;
        getCreators(_id: PromiseOrValue<BigNumberish>, overrides?: CallOverrides): Promise<PopulatedTransaction>;
        getNonce(user: PromiseOrValue<string>, overrides?: CallOverrides): Promise<PopulatedTransaction>;
        getRaribleV2Royalties(id: PromiseOrValue<BigNumberish>, overrides?: CallOverrides): Promise<PopulatedTransaction>;
        isApprovedForAll(owner: PromiseOrValue<string>, operator: PromiseOrValue<string>, overrides?: CallOverrides): Promise<PopulatedTransaction>;
        isMinter(account: PromiseOrValue<string>, overrides?: CallOverrides): Promise<PopulatedTransaction>;
        mintAndTransfer(data: LibERC721LazyMint.Mint721DataStruct, to: PromiseOrValue<string>, overrides?: Overrides & {
            from?: PromiseOrValue<string>;
        }): Promise<PopulatedTransaction>;
        name(overrides?: CallOverrides): Promise<PopulatedTransaction>;
        owner(overrides?: CallOverrides): Promise<PopulatedTransaction>;
        ownerOf(tokenId: PromiseOrValue<BigNumberish>, overrides?: CallOverrides): Promise<PopulatedTransaction>;
        removeMinter(_minter: PromiseOrValue<string>, overrides?: Overrides & {
            from?: PromiseOrValue<string>;
        }): Promise<PopulatedTransaction>;
        renounceOwnership(overrides?: Overrides & {
            from?: PromiseOrValue<string>;
        }): Promise<PopulatedTransaction>;
        royaltyInfo(id: PromiseOrValue<BigNumberish>, _salePrice: PromiseOrValue<BigNumberish>, overrides?: CallOverrides): Promise<PopulatedTransaction>;
        "safeTransferFrom(address,address,uint256)"(from: PromiseOrValue<string>, to: PromiseOrValue<string>, tokenId: PromiseOrValue<BigNumberish>, overrides?: Overrides & {
            from?: PromiseOrValue<string>;
        }): Promise<PopulatedTransaction>;
        "safeTransferFrom(address,address,uint256,bytes)"(from: PromiseOrValue<string>, to: PromiseOrValue<string>, tokenId: PromiseOrValue<BigNumberish>, _data: PromiseOrValue<BytesLike>, overrides?: Overrides & {
            from?: PromiseOrValue<string>;
        }): Promise<PopulatedTransaction>;
        setApprovalForAll(operator: PromiseOrValue<string>, approved: PromiseOrValue<boolean>, overrides?: Overrides & {
            from?: PromiseOrValue<string>;
        }): Promise<PopulatedTransaction>;
        setBaseURI(newBaseURI: PromiseOrValue<string>, overrides?: Overrides & {
            from?: PromiseOrValue<string>;
        }): Promise<PopulatedTransaction>;
        supportsInterface(interfaceId: PromiseOrValue<BytesLike>, overrides?: CallOverrides): Promise<PopulatedTransaction>;
        symbol(overrides?: CallOverrides): Promise<PopulatedTransaction>;
        tokenURI(tokenId: PromiseOrValue<BigNumberish>, overrides?: CallOverrides): Promise<PopulatedTransaction>;
        transferFrom(from: PromiseOrValue<string>, to: PromiseOrValue<string>, tokenId: PromiseOrValue<BigNumberish>, overrides?: Overrides & {
            from?: PromiseOrValue<string>;
        }): Promise<PopulatedTransaction>;
        transferFromOrMint(data: LibERC721LazyMint.Mint721DataStruct, from: PromiseOrValue<string>, to: PromiseOrValue<string>, overrides?: Overrides & {
            from?: PromiseOrValue<string>;
        }): Promise<PopulatedTransaction>;
        transferOwnership(newOwner: PromiseOrValue<string>, overrides?: Overrides & {
            from?: PromiseOrValue<string>;
        }): Promise<PopulatedTransaction>;
        updateAccount(_id: PromiseOrValue<BigNumberish>, _from: PromiseOrValue<string>, _to: PromiseOrValue<string>, overrides?: Overrides & {
            from?: PromiseOrValue<string>;
        }): Promise<PopulatedTransaction>;
    };
}
