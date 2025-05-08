import type { BaseContract, BigNumber, BigNumberish, BytesLike, CallOverrides, ContractTransaction, Overrides, PopulatedTransaction, Signer, utils } from "ethers";
import type { FunctionFragment, Result, EventFragment } from "@ethersproject/abi";
import type { Listener, Provider } from "@ethersproject/providers";
import type { TypedEventFilter, TypedEvent, TypedListener, OnEvent, PromiseOrValue } from "./common";
export interface TestERC721Interface extends utils.Interface {
    functions: {
        "approve(address,uint256)": FunctionFragment;
        "balanceOf(address)": FunctionFragment;
        "baseURI()": FunctionFragment;
        "getApproved(uint256)": FunctionFragment;
        "isApprovedForAll(address,address)": FunctionFragment;
        "name()": FunctionFragment;
        "owner()": FunctionFragment;
        "ownerOf(uint256)": FunctionFragment;
        "renderingContract()": FunctionFragment;
        "safeTransferFrom(address,address,uint256)": FunctionFragment;
        "safeTransferFrom(address,address,uint256,bytes)": FunctionFragment;
        "setApprovalForAll(address,bool)": FunctionFragment;
        "setOwner(address)": FunctionFragment;
        "setRenderingContract(address)": FunctionFragment;
        "supportsInterface(bytes4)": FunctionFragment;
        "symbol()": FunctionFragment;
        "tokenByIndex(uint256)": FunctionFragment;
        "tokenOfOwnerByIndex(address,uint256)": FunctionFragment;
        "tokenURI(uint256)": FunctionFragment;
        "totalSupply()": FunctionFragment;
        "transferFrom(address,address,uint256)": FunctionFragment;
        "mint(address,uint256)": FunctionFragment;
        "mintFromContract(address,uint256)": FunctionFragment;
        "setBaseURI(string)": FunctionFragment;
        "reveal(uint256)": FunctionFragment;
        "getBatchIdAtIndex(uint256)": FunctionFragment;
        "mintWithPrice(address,uint256[],address,uint256)": FunctionFragment;
        "updateMetaData(uint256)": FunctionFragment;
        "updateBatchMetaData(uint256,uint256)": FunctionFragment;
    };
    getFunction(nameOrSignatureOrTopic: "approve" | "balanceOf" | "baseURI" | "getApproved" | "isApprovedForAll" | "name" | "owner" | "ownerOf" | "renderingContract" | "safeTransferFrom(address,address,uint256)" | "safeTransferFrom(address,address,uint256,bytes)" | "setApprovalForAll" | "setOwner" | "setRenderingContract" | "supportsInterface" | "symbol" | "tokenByIndex" | "tokenOfOwnerByIndex" | "tokenURI" | "totalSupply" | "transferFrom" | "mint" | "mintFromContract" | "setBaseURI" | "reveal" | "getBatchIdAtIndex" | "mintWithPrice" | "updateMetaData" | "updateBatchMetaData"): FunctionFragment;
    encodeFunctionData(functionFragment: "approve", values: [PromiseOrValue<string>, PromiseOrValue<BigNumberish>]): string;
    encodeFunctionData(functionFragment: "balanceOf", values: [PromiseOrValue<string>]): string;
    encodeFunctionData(functionFragment: "baseURI", values?: undefined): string;
    encodeFunctionData(functionFragment: "getApproved", values: [PromiseOrValue<BigNumberish>]): string;
    encodeFunctionData(functionFragment: "isApprovedForAll", values: [PromiseOrValue<string>, PromiseOrValue<string>]): string;
    encodeFunctionData(functionFragment: "name", values?: undefined): string;
    encodeFunctionData(functionFragment: "owner", values?: undefined): string;
    encodeFunctionData(functionFragment: "ownerOf", values: [PromiseOrValue<BigNumberish>]): string;
    encodeFunctionData(functionFragment: "renderingContract", values?: undefined): string;
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
    encodeFunctionData(functionFragment: "setOwner", values: [PromiseOrValue<string>]): string;
    encodeFunctionData(functionFragment: "setRenderingContract", values: [PromiseOrValue<string>]): string;
    encodeFunctionData(functionFragment: "supportsInterface", values: [PromiseOrValue<BytesLike>]): string;
    encodeFunctionData(functionFragment: "symbol", values?: undefined): string;
    encodeFunctionData(functionFragment: "tokenByIndex", values: [PromiseOrValue<BigNumberish>]): string;
    encodeFunctionData(functionFragment: "tokenOfOwnerByIndex", values: [PromiseOrValue<string>, PromiseOrValue<BigNumberish>]): string;
    encodeFunctionData(functionFragment: "tokenURI", values: [PromiseOrValue<BigNumberish>]): string;
    encodeFunctionData(functionFragment: "totalSupply", values?: undefined): string;
    encodeFunctionData(functionFragment: "transferFrom", values: [
        PromiseOrValue<string>,
        PromiseOrValue<string>,
        PromiseOrValue<BigNumberish>
    ]): string;
    encodeFunctionData(functionFragment: "mint", values: [PromiseOrValue<string>, PromiseOrValue<BigNumberish>]): string;
    encodeFunctionData(functionFragment: "mintFromContract", values: [PromiseOrValue<string>, PromiseOrValue<BigNumberish>]): string;
    encodeFunctionData(functionFragment: "setBaseURI", values: [PromiseOrValue<string>]): string;
    encodeFunctionData(functionFragment: "reveal", values: [PromiseOrValue<BigNumberish>]): string;
    encodeFunctionData(functionFragment: "getBatchIdAtIndex", values: [PromiseOrValue<BigNumberish>]): string;
    encodeFunctionData(functionFragment: "mintWithPrice", values: [
        PromiseOrValue<string>,
        PromiseOrValue<BigNumberish>[],
        PromiseOrValue<string>,
        PromiseOrValue<BigNumberish>
    ]): string;
    encodeFunctionData(functionFragment: "updateMetaData", values: [PromiseOrValue<BigNumberish>]): string;
    encodeFunctionData(functionFragment: "updateBatchMetaData", values: [PromiseOrValue<BigNumberish>, PromiseOrValue<BigNumberish>]): string;
    decodeFunctionResult(functionFragment: "approve", data: BytesLike): Result;
    decodeFunctionResult(functionFragment: "balanceOf", data: BytesLike): Result;
    decodeFunctionResult(functionFragment: "baseURI", data: BytesLike): Result;
    decodeFunctionResult(functionFragment: "getApproved", data: BytesLike): Result;
    decodeFunctionResult(functionFragment: "isApprovedForAll", data: BytesLike): Result;
    decodeFunctionResult(functionFragment: "name", data: BytesLike): Result;
    decodeFunctionResult(functionFragment: "owner", data: BytesLike): Result;
    decodeFunctionResult(functionFragment: "ownerOf", data: BytesLike): Result;
    decodeFunctionResult(functionFragment: "renderingContract", data: BytesLike): Result;
    decodeFunctionResult(functionFragment: "safeTransferFrom(address,address,uint256)", data: BytesLike): Result;
    decodeFunctionResult(functionFragment: "safeTransferFrom(address,address,uint256,bytes)", data: BytesLike): Result;
    decodeFunctionResult(functionFragment: "setApprovalForAll", data: BytesLike): Result;
    decodeFunctionResult(functionFragment: "setOwner", data: BytesLike): Result;
    decodeFunctionResult(functionFragment: "setRenderingContract", data: BytesLike): Result;
    decodeFunctionResult(functionFragment: "supportsInterface", data: BytesLike): Result;
    decodeFunctionResult(functionFragment: "symbol", data: BytesLike): Result;
    decodeFunctionResult(functionFragment: "tokenByIndex", data: BytesLike): Result;
    decodeFunctionResult(functionFragment: "tokenOfOwnerByIndex", data: BytesLike): Result;
    decodeFunctionResult(functionFragment: "tokenURI", data: BytesLike): Result;
    decodeFunctionResult(functionFragment: "totalSupply", data: BytesLike): Result;
    decodeFunctionResult(functionFragment: "transferFrom", data: BytesLike): Result;
    decodeFunctionResult(functionFragment: "mint", data: BytesLike): Result;
    decodeFunctionResult(functionFragment: "mintFromContract", data: BytesLike): Result;
    decodeFunctionResult(functionFragment: "setBaseURI", data: BytesLike): Result;
    decodeFunctionResult(functionFragment: "reveal", data: BytesLike): Result;
    decodeFunctionResult(functionFragment: "getBatchIdAtIndex", data: BytesLike): Result;
    decodeFunctionResult(functionFragment: "mintWithPrice", data: BytesLike): Result;
    decodeFunctionResult(functionFragment: "updateMetaData", data: BytesLike): Result;
    decodeFunctionResult(functionFragment: "updateBatchMetaData", data: BytesLike): Result;
    events: {
        "Approval(address,address,uint256)": EventFragment;
        "ApprovalForAll(address,address,bool)": EventFragment;
        "BatchMetadataUpdate(uint256,uint256)": EventFragment;
        "MetadataUpdate(uint256)": EventFragment;
        "OwnerUpdated(address,address)": EventFragment;
        "TokenURIRevealed(uint256,string)": EventFragment;
        "Transfer(address,address,uint256)": EventFragment;
    };
    getEvent(nameOrSignatureOrTopic: "Approval"): EventFragment;
    getEvent(nameOrSignatureOrTopic: "ApprovalForAll"): EventFragment;
    getEvent(nameOrSignatureOrTopic: "BatchMetadataUpdate"): EventFragment;
    getEvent(nameOrSignatureOrTopic: "MetadataUpdate"): EventFragment;
    getEvent(nameOrSignatureOrTopic: "OwnerUpdated"): EventFragment;
    getEvent(nameOrSignatureOrTopic: "TokenURIRevealed"): EventFragment;
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
export interface BatchMetadataUpdateEventObject {
    _fromTokenId: BigNumber;
    _toTokenId: BigNumber;
}
export type BatchMetadataUpdateEvent = TypedEvent<[
    BigNumber,
    BigNumber
], BatchMetadataUpdateEventObject>;
export type BatchMetadataUpdateEventFilter = TypedEventFilter<BatchMetadataUpdateEvent>;
export interface MetadataUpdateEventObject {
    _tokenId: BigNumber;
}
export type MetadataUpdateEvent = TypedEvent<[
    BigNumber
], MetadataUpdateEventObject>;
export type MetadataUpdateEventFilter = TypedEventFilter<MetadataUpdateEvent>;
export interface OwnerUpdatedEventObject {
    prevOwner: string;
    newOwner: string;
}
export type OwnerUpdatedEvent = TypedEvent<[
    string,
    string
], OwnerUpdatedEventObject>;
export type OwnerUpdatedEventFilter = TypedEventFilter<OwnerUpdatedEvent>;
export interface TokenURIRevealedEventObject {
    index: BigNumber;
    revealedURI: string;
}
export type TokenURIRevealedEvent = TypedEvent<[
    BigNumber,
    string
], TokenURIRevealedEventObject>;
export type TokenURIRevealedEventFilter = TypedEventFilter<TokenURIRevealedEvent>;
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
export interface TestERC721 extends BaseContract {
    connect(signerOrProvider: Signer | Provider | string): this;
    attach(addressOrName: string): this;
    deployed(): Promise<this>;
    interface: TestERC721Interface;
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
         * See {IERC721-approve}.
         */
        approve(to: PromiseOrValue<string>, tokenId: PromiseOrValue<BigNumberish>, overrides?: Overrides & {
            from?: PromiseOrValue<string>;
        }): Promise<ContractTransaction>;
        /**
         * See {IERC721-balanceOf}.
         */
        balanceOf(owner: PromiseOrValue<string>, overrides?: CallOverrides): Promise<[BigNumber]>;
        /**
         * Returns the base URI set via {_setBaseURI}. This will be automatically added as a prefix in {tokenURI} to each token's URI, or to the token ID if no specific URI is set for that token ID.
         */
        baseURI(overrides?: CallOverrides): Promise<[string]>;
        /**
         * See {IERC721-getApproved}.
         */
        getApproved(tokenId: PromiseOrValue<BigNumberish>, overrides?: CallOverrides): Promise<[string]>;
        /**
         * See {IERC721-isApprovedForAll}.
         */
        isApprovedForAll(owner: PromiseOrValue<string>, operator: PromiseOrValue<string>, overrides?: CallOverrides): Promise<[boolean]>;
        /**
         * See {IERC721Metadata-name}.
         */
        name(overrides?: CallOverrides): Promise<[string]>;
        /**
         * Returns the owner of the contract.
         */
        owner(overrides?: CallOverrides): Promise<[string]>;
        /**
         * See {IERC721-ownerOf}.
         */
        ownerOf(tokenId: PromiseOrValue<BigNumberish>, overrides?: CallOverrides): Promise<[string]>;
        renderingContract(overrides?: CallOverrides): Promise<[string]>;
        /**
         * See {IERC721-safeTransferFrom}.
         */
        "safeTransferFrom(address,address,uint256)"(from: PromiseOrValue<string>, to: PromiseOrValue<string>, tokenId: PromiseOrValue<BigNumberish>, overrides?: Overrides & {
            from?: PromiseOrValue<string>;
        }): Promise<ContractTransaction>;
        /**
         * See {IERC721-safeTransferFrom}.
         */
        "safeTransferFrom(address,address,uint256,bytes)"(from: PromiseOrValue<string>, to: PromiseOrValue<string>, tokenId: PromiseOrValue<BigNumberish>, _data: PromiseOrValue<BytesLike>, overrides?: Overrides & {
            from?: PromiseOrValue<string>;
        }): Promise<ContractTransaction>;
        /**
         * See {IERC721-setApprovalForAll}.
         */
        setApprovalForAll(operator: PromiseOrValue<string>, approved: PromiseOrValue<boolean>, overrides?: Overrides & {
            from?: PromiseOrValue<string>;
        }): Promise<ContractTransaction>;
        /**
         * Lets an authorized wallet set a new owner for the contract.
         * @param _newOwner The address to set as the new owner of the contract.
         */
        setOwner(_newOwner: PromiseOrValue<string>, overrides?: Overrides & {
            from?: PromiseOrValue<string>;
        }): Promise<ContractTransaction>;
        setRenderingContract(_contract: PromiseOrValue<string>, overrides?: Overrides & {
            from?: PromiseOrValue<string>;
        }): Promise<ContractTransaction>;
        /**
         * See {IERC165-supportsInterface}. Time complexity O(1), guaranteed to always use less than 30 000 gas.
         */
        supportsInterface(interfaceId: PromiseOrValue<BytesLike>, overrides?: CallOverrides): Promise<[boolean]>;
        /**
         * See {IERC721Metadata-symbol}.
         */
        symbol(overrides?: CallOverrides): Promise<[string]>;
        /**
         * See {IERC721Enumerable-tokenByIndex}.
         */
        tokenByIndex(index: PromiseOrValue<BigNumberish>, overrides?: CallOverrides): Promise<[BigNumber]>;
        /**
         * See {IERC721Enumerable-tokenOfOwnerByIndex}.
         */
        tokenOfOwnerByIndex(owner: PromiseOrValue<string>, index: PromiseOrValue<BigNumberish>, overrides?: CallOverrides): Promise<[BigNumber]>;
        /**
         * See {IERC721Metadata-tokenURI}.
         */
        tokenURI(tokenId: PromiseOrValue<BigNumberish>, overrides?: CallOverrides): Promise<[string]>;
        /**
         * See {IERC721Enumerable-totalSupply}.
         */
        totalSupply(overrides?: CallOverrides): Promise<[BigNumber]>;
        /**
         * See {IERC721-transferFrom}.
         */
        transferFrom(from: PromiseOrValue<string>, to: PromiseOrValue<string>, tokenId: PromiseOrValue<BigNumberish>, overrides?: Overrides & {
            from?: PromiseOrValue<string>;
        }): Promise<ContractTransaction>;
        mint(to: PromiseOrValue<string>, tokenId: PromiseOrValue<BigNumberish>, overrides?: Overrides & {
            from?: PromiseOrValue<string>;
        }): Promise<ContractTransaction>;
        mintFromContract(to: PromiseOrValue<string>, tokenId: PromiseOrValue<BigNumberish>, overrides?: Overrides & {
            from?: PromiseOrValue<string>;
        }): Promise<ContractTransaction>;
        setBaseURI(uri: PromiseOrValue<string>, overrides?: Overrides & {
            from?: PromiseOrValue<string>;
        }): Promise<ContractTransaction>;
        reveal(_index: PromiseOrValue<BigNumberish>, overrides?: Overrides & {
            from?: PromiseOrValue<string>;
        }): Promise<ContractTransaction>;
        getBatchIdAtIndex(_index: PromiseOrValue<BigNumberish>, overrides?: CallOverrides): Promise<[BigNumber]>;
        mintWithPrice(to: PromiseOrValue<string>, tokenIds: PromiseOrValue<BigNumberish>[], currency: PromiseOrValue<string>, pricePerToken: PromiseOrValue<BigNumberish>, overrides?: Overrides & {
            from?: PromiseOrValue<string>;
        }): Promise<ContractTransaction>;
        updateMetaData(_tokenId: PromiseOrValue<BigNumberish>, overrides?: Overrides & {
            from?: PromiseOrValue<string>;
        }): Promise<ContractTransaction>;
        updateBatchMetaData(_fromTokenId: PromiseOrValue<BigNumberish>, _toTokenId: PromiseOrValue<BigNumberish>, overrides?: Overrides & {
            from?: PromiseOrValue<string>;
        }): Promise<ContractTransaction>;
    };
    /**
     * See {IERC721-approve}.
     */
    approve(to: PromiseOrValue<string>, tokenId: PromiseOrValue<BigNumberish>, overrides?: Overrides & {
        from?: PromiseOrValue<string>;
    }): Promise<ContractTransaction>;
    /**
     * See {IERC721-balanceOf}.
     */
    balanceOf(owner: PromiseOrValue<string>, overrides?: CallOverrides): Promise<BigNumber>;
    /**
     * Returns the base URI set via {_setBaseURI}. This will be automatically added as a prefix in {tokenURI} to each token's URI, or to the token ID if no specific URI is set for that token ID.
     */
    baseURI(overrides?: CallOverrides): Promise<string>;
    /**
     * See {IERC721-getApproved}.
     */
    getApproved(tokenId: PromiseOrValue<BigNumberish>, overrides?: CallOverrides): Promise<string>;
    /**
     * See {IERC721-isApprovedForAll}.
     */
    isApprovedForAll(owner: PromiseOrValue<string>, operator: PromiseOrValue<string>, overrides?: CallOverrides): Promise<boolean>;
    /**
     * See {IERC721Metadata-name}.
     */
    name(overrides?: CallOverrides): Promise<string>;
    /**
     * Returns the owner of the contract.
     */
    owner(overrides?: CallOverrides): Promise<string>;
    /**
     * See {IERC721-ownerOf}.
     */
    ownerOf(tokenId: PromiseOrValue<BigNumberish>, overrides?: CallOverrides): Promise<string>;
    renderingContract(overrides?: CallOverrides): Promise<string>;
    /**
     * See {IERC721-safeTransferFrom}.
     */
    "safeTransferFrom(address,address,uint256)"(from: PromiseOrValue<string>, to: PromiseOrValue<string>, tokenId: PromiseOrValue<BigNumberish>, overrides?: Overrides & {
        from?: PromiseOrValue<string>;
    }): Promise<ContractTransaction>;
    /**
     * See {IERC721-safeTransferFrom}.
     */
    "safeTransferFrom(address,address,uint256,bytes)"(from: PromiseOrValue<string>, to: PromiseOrValue<string>, tokenId: PromiseOrValue<BigNumberish>, _data: PromiseOrValue<BytesLike>, overrides?: Overrides & {
        from?: PromiseOrValue<string>;
    }): Promise<ContractTransaction>;
    /**
     * See {IERC721-setApprovalForAll}.
     */
    setApprovalForAll(operator: PromiseOrValue<string>, approved: PromiseOrValue<boolean>, overrides?: Overrides & {
        from?: PromiseOrValue<string>;
    }): Promise<ContractTransaction>;
    /**
     * Lets an authorized wallet set a new owner for the contract.
     * @param _newOwner The address to set as the new owner of the contract.
     */
    setOwner(_newOwner: PromiseOrValue<string>, overrides?: Overrides & {
        from?: PromiseOrValue<string>;
    }): Promise<ContractTransaction>;
    setRenderingContract(_contract: PromiseOrValue<string>, overrides?: Overrides & {
        from?: PromiseOrValue<string>;
    }): Promise<ContractTransaction>;
    /**
     * See {IERC165-supportsInterface}. Time complexity O(1), guaranteed to always use less than 30 000 gas.
     */
    supportsInterface(interfaceId: PromiseOrValue<BytesLike>, overrides?: CallOverrides): Promise<boolean>;
    /**
     * See {IERC721Metadata-symbol}.
     */
    symbol(overrides?: CallOverrides): Promise<string>;
    /**
     * See {IERC721Enumerable-tokenByIndex}.
     */
    tokenByIndex(index: PromiseOrValue<BigNumberish>, overrides?: CallOverrides): Promise<BigNumber>;
    /**
     * See {IERC721Enumerable-tokenOfOwnerByIndex}.
     */
    tokenOfOwnerByIndex(owner: PromiseOrValue<string>, index: PromiseOrValue<BigNumberish>, overrides?: CallOverrides): Promise<BigNumber>;
    /**
     * See {IERC721Metadata-tokenURI}.
     */
    tokenURI(tokenId: PromiseOrValue<BigNumberish>, overrides?: CallOverrides): Promise<string>;
    /**
     * See {IERC721Enumerable-totalSupply}.
     */
    totalSupply(overrides?: CallOverrides): Promise<BigNumber>;
    /**
     * See {IERC721-transferFrom}.
     */
    transferFrom(from: PromiseOrValue<string>, to: PromiseOrValue<string>, tokenId: PromiseOrValue<BigNumberish>, overrides?: Overrides & {
        from?: PromiseOrValue<string>;
    }): Promise<ContractTransaction>;
    mint(to: PromiseOrValue<string>, tokenId: PromiseOrValue<BigNumberish>, overrides?: Overrides & {
        from?: PromiseOrValue<string>;
    }): Promise<ContractTransaction>;
    mintFromContract(to: PromiseOrValue<string>, tokenId: PromiseOrValue<BigNumberish>, overrides?: Overrides & {
        from?: PromiseOrValue<string>;
    }): Promise<ContractTransaction>;
    setBaseURI(uri: PromiseOrValue<string>, overrides?: Overrides & {
        from?: PromiseOrValue<string>;
    }): Promise<ContractTransaction>;
    reveal(_index: PromiseOrValue<BigNumberish>, overrides?: Overrides & {
        from?: PromiseOrValue<string>;
    }): Promise<ContractTransaction>;
    getBatchIdAtIndex(_index: PromiseOrValue<BigNumberish>, overrides?: CallOverrides): Promise<BigNumber>;
    mintWithPrice(to: PromiseOrValue<string>, tokenIds: PromiseOrValue<BigNumberish>[], currency: PromiseOrValue<string>, pricePerToken: PromiseOrValue<BigNumberish>, overrides?: Overrides & {
        from?: PromiseOrValue<string>;
    }): Promise<ContractTransaction>;
    updateMetaData(_tokenId: PromiseOrValue<BigNumberish>, overrides?: Overrides & {
        from?: PromiseOrValue<string>;
    }): Promise<ContractTransaction>;
    updateBatchMetaData(_fromTokenId: PromiseOrValue<BigNumberish>, _toTokenId: PromiseOrValue<BigNumberish>, overrides?: Overrides & {
        from?: PromiseOrValue<string>;
    }): Promise<ContractTransaction>;
    callStatic: {
        /**
         * See {IERC721-approve}.
         */
        approve(to: PromiseOrValue<string>, tokenId: PromiseOrValue<BigNumberish>, overrides?: CallOverrides): Promise<void>;
        /**
         * See {IERC721-balanceOf}.
         */
        balanceOf(owner: PromiseOrValue<string>, overrides?: CallOverrides): Promise<BigNumber>;
        /**
         * Returns the base URI set via {_setBaseURI}. This will be automatically added as a prefix in {tokenURI} to each token's URI, or to the token ID if no specific URI is set for that token ID.
         */
        baseURI(overrides?: CallOverrides): Promise<string>;
        /**
         * See {IERC721-getApproved}.
         */
        getApproved(tokenId: PromiseOrValue<BigNumberish>, overrides?: CallOverrides): Promise<string>;
        /**
         * See {IERC721-isApprovedForAll}.
         */
        isApprovedForAll(owner: PromiseOrValue<string>, operator: PromiseOrValue<string>, overrides?: CallOverrides): Promise<boolean>;
        /**
         * See {IERC721Metadata-name}.
         */
        name(overrides?: CallOverrides): Promise<string>;
        /**
         * Returns the owner of the contract.
         */
        owner(overrides?: CallOverrides): Promise<string>;
        /**
         * See {IERC721-ownerOf}.
         */
        ownerOf(tokenId: PromiseOrValue<BigNumberish>, overrides?: CallOverrides): Promise<string>;
        renderingContract(overrides?: CallOverrides): Promise<string>;
        /**
         * See {IERC721-safeTransferFrom}.
         */
        "safeTransferFrom(address,address,uint256)"(from: PromiseOrValue<string>, to: PromiseOrValue<string>, tokenId: PromiseOrValue<BigNumberish>, overrides?: CallOverrides): Promise<void>;
        /**
         * See {IERC721-safeTransferFrom}.
         */
        "safeTransferFrom(address,address,uint256,bytes)"(from: PromiseOrValue<string>, to: PromiseOrValue<string>, tokenId: PromiseOrValue<BigNumberish>, _data: PromiseOrValue<BytesLike>, overrides?: CallOverrides): Promise<void>;
        /**
         * See {IERC721-setApprovalForAll}.
         */
        setApprovalForAll(operator: PromiseOrValue<string>, approved: PromiseOrValue<boolean>, overrides?: CallOverrides): Promise<void>;
        /**
         * Lets an authorized wallet set a new owner for the contract.
         * @param _newOwner The address to set as the new owner of the contract.
         */
        setOwner(_newOwner: PromiseOrValue<string>, overrides?: CallOverrides): Promise<void>;
        setRenderingContract(_contract: PromiseOrValue<string>, overrides?: CallOverrides): Promise<void>;
        /**
         * See {IERC165-supportsInterface}. Time complexity O(1), guaranteed to always use less than 30 000 gas.
         */
        supportsInterface(interfaceId: PromiseOrValue<BytesLike>, overrides?: CallOverrides): Promise<boolean>;
        /**
         * See {IERC721Metadata-symbol}.
         */
        symbol(overrides?: CallOverrides): Promise<string>;
        /**
         * See {IERC721Enumerable-tokenByIndex}.
         */
        tokenByIndex(index: PromiseOrValue<BigNumberish>, overrides?: CallOverrides): Promise<BigNumber>;
        /**
         * See {IERC721Enumerable-tokenOfOwnerByIndex}.
         */
        tokenOfOwnerByIndex(owner: PromiseOrValue<string>, index: PromiseOrValue<BigNumberish>, overrides?: CallOverrides): Promise<BigNumber>;
        /**
         * See {IERC721Metadata-tokenURI}.
         */
        tokenURI(tokenId: PromiseOrValue<BigNumberish>, overrides?: CallOverrides): Promise<string>;
        /**
         * See {IERC721Enumerable-totalSupply}.
         */
        totalSupply(overrides?: CallOverrides): Promise<BigNumber>;
        /**
         * See {IERC721-transferFrom}.
         */
        transferFrom(from: PromiseOrValue<string>, to: PromiseOrValue<string>, tokenId: PromiseOrValue<BigNumberish>, overrides?: CallOverrides): Promise<void>;
        mint(to: PromiseOrValue<string>, tokenId: PromiseOrValue<BigNumberish>, overrides?: CallOverrides): Promise<void>;
        mintFromContract(to: PromiseOrValue<string>, tokenId: PromiseOrValue<BigNumberish>, overrides?: CallOverrides): Promise<void>;
        setBaseURI(uri: PromiseOrValue<string>, overrides?: CallOverrides): Promise<void>;
        reveal(_index: PromiseOrValue<BigNumberish>, overrides?: CallOverrides): Promise<void>;
        getBatchIdAtIndex(_index: PromiseOrValue<BigNumberish>, overrides?: CallOverrides): Promise<BigNumber>;
        mintWithPrice(to: PromiseOrValue<string>, tokenIds: PromiseOrValue<BigNumberish>[], currency: PromiseOrValue<string>, pricePerToken: PromiseOrValue<BigNumberish>, overrides?: CallOverrides): Promise<void>;
        updateMetaData(_tokenId: PromiseOrValue<BigNumberish>, overrides?: CallOverrides): Promise<void>;
        updateBatchMetaData(_fromTokenId: PromiseOrValue<BigNumberish>, _toTokenId: PromiseOrValue<BigNumberish>, overrides?: CallOverrides): Promise<void>;
    };
    filters: {
        "Approval(address,address,uint256)"(owner?: PromiseOrValue<string> | null, approved?: PromiseOrValue<string> | null, tokenId?: PromiseOrValue<BigNumberish> | null): ApprovalEventFilter;
        Approval(owner?: PromiseOrValue<string> | null, approved?: PromiseOrValue<string> | null, tokenId?: PromiseOrValue<BigNumberish> | null): ApprovalEventFilter;
        "ApprovalForAll(address,address,bool)"(owner?: PromiseOrValue<string> | null, operator?: PromiseOrValue<string> | null, approved?: null): ApprovalForAllEventFilter;
        ApprovalForAll(owner?: PromiseOrValue<string> | null, operator?: PromiseOrValue<string> | null, approved?: null): ApprovalForAllEventFilter;
        "BatchMetadataUpdate(uint256,uint256)"(_fromTokenId?: null, _toTokenId?: null): BatchMetadataUpdateEventFilter;
        BatchMetadataUpdate(_fromTokenId?: null, _toTokenId?: null): BatchMetadataUpdateEventFilter;
        "MetadataUpdate(uint256)"(_tokenId?: null): MetadataUpdateEventFilter;
        MetadataUpdate(_tokenId?: null): MetadataUpdateEventFilter;
        "OwnerUpdated(address,address)"(prevOwner?: PromiseOrValue<string> | null, newOwner?: PromiseOrValue<string> | null): OwnerUpdatedEventFilter;
        OwnerUpdated(prevOwner?: PromiseOrValue<string> | null, newOwner?: PromiseOrValue<string> | null): OwnerUpdatedEventFilter;
        "TokenURIRevealed(uint256,string)"(index?: PromiseOrValue<BigNumberish> | null, revealedURI?: null): TokenURIRevealedEventFilter;
        TokenURIRevealed(index?: PromiseOrValue<BigNumberish> | null, revealedURI?: null): TokenURIRevealedEventFilter;
        "Transfer(address,address,uint256)"(from?: PromiseOrValue<string> | null, to?: PromiseOrValue<string> | null, tokenId?: PromiseOrValue<BigNumberish> | null): TransferEventFilter;
        Transfer(from?: PromiseOrValue<string> | null, to?: PromiseOrValue<string> | null, tokenId?: PromiseOrValue<BigNumberish> | null): TransferEventFilter;
    };
    estimateGas: {
        /**
         * See {IERC721-approve}.
         */
        approve(to: PromiseOrValue<string>, tokenId: PromiseOrValue<BigNumberish>, overrides?: Overrides & {
            from?: PromiseOrValue<string>;
        }): Promise<BigNumber>;
        /**
         * See {IERC721-balanceOf}.
         */
        balanceOf(owner: PromiseOrValue<string>, overrides?: CallOverrides): Promise<BigNumber>;
        /**
         * Returns the base URI set via {_setBaseURI}. This will be automatically added as a prefix in {tokenURI} to each token's URI, or to the token ID if no specific URI is set for that token ID.
         */
        baseURI(overrides?: CallOverrides): Promise<BigNumber>;
        /**
         * See {IERC721-getApproved}.
         */
        getApproved(tokenId: PromiseOrValue<BigNumberish>, overrides?: CallOverrides): Promise<BigNumber>;
        /**
         * See {IERC721-isApprovedForAll}.
         */
        isApprovedForAll(owner: PromiseOrValue<string>, operator: PromiseOrValue<string>, overrides?: CallOverrides): Promise<BigNumber>;
        /**
         * See {IERC721Metadata-name}.
         */
        name(overrides?: CallOverrides): Promise<BigNumber>;
        /**
         * Returns the owner of the contract.
         */
        owner(overrides?: CallOverrides): Promise<BigNumber>;
        /**
         * See {IERC721-ownerOf}.
         */
        ownerOf(tokenId: PromiseOrValue<BigNumberish>, overrides?: CallOverrides): Promise<BigNumber>;
        renderingContract(overrides?: CallOverrides): Promise<BigNumber>;
        /**
         * See {IERC721-safeTransferFrom}.
         */
        "safeTransferFrom(address,address,uint256)"(from: PromiseOrValue<string>, to: PromiseOrValue<string>, tokenId: PromiseOrValue<BigNumberish>, overrides?: Overrides & {
            from?: PromiseOrValue<string>;
        }): Promise<BigNumber>;
        /**
         * See {IERC721-safeTransferFrom}.
         */
        "safeTransferFrom(address,address,uint256,bytes)"(from: PromiseOrValue<string>, to: PromiseOrValue<string>, tokenId: PromiseOrValue<BigNumberish>, _data: PromiseOrValue<BytesLike>, overrides?: Overrides & {
            from?: PromiseOrValue<string>;
        }): Promise<BigNumber>;
        /**
         * See {IERC721-setApprovalForAll}.
         */
        setApprovalForAll(operator: PromiseOrValue<string>, approved: PromiseOrValue<boolean>, overrides?: Overrides & {
            from?: PromiseOrValue<string>;
        }): Promise<BigNumber>;
        /**
         * Lets an authorized wallet set a new owner for the contract.
         * @param _newOwner The address to set as the new owner of the contract.
         */
        setOwner(_newOwner: PromiseOrValue<string>, overrides?: Overrides & {
            from?: PromiseOrValue<string>;
        }): Promise<BigNumber>;
        setRenderingContract(_contract: PromiseOrValue<string>, overrides?: Overrides & {
            from?: PromiseOrValue<string>;
        }): Promise<BigNumber>;
        /**
         * See {IERC165-supportsInterface}. Time complexity O(1), guaranteed to always use less than 30 000 gas.
         */
        supportsInterface(interfaceId: PromiseOrValue<BytesLike>, overrides?: CallOverrides): Promise<BigNumber>;
        /**
         * See {IERC721Metadata-symbol}.
         */
        symbol(overrides?: CallOverrides): Promise<BigNumber>;
        /**
         * See {IERC721Enumerable-tokenByIndex}.
         */
        tokenByIndex(index: PromiseOrValue<BigNumberish>, overrides?: CallOverrides): Promise<BigNumber>;
        /**
         * See {IERC721Enumerable-tokenOfOwnerByIndex}.
         */
        tokenOfOwnerByIndex(owner: PromiseOrValue<string>, index: PromiseOrValue<BigNumberish>, overrides?: CallOverrides): Promise<BigNumber>;
        /**
         * See {IERC721Metadata-tokenURI}.
         */
        tokenURI(tokenId: PromiseOrValue<BigNumberish>, overrides?: CallOverrides): Promise<BigNumber>;
        /**
         * See {IERC721Enumerable-totalSupply}.
         */
        totalSupply(overrides?: CallOverrides): Promise<BigNumber>;
        /**
         * See {IERC721-transferFrom}.
         */
        transferFrom(from: PromiseOrValue<string>, to: PromiseOrValue<string>, tokenId: PromiseOrValue<BigNumberish>, overrides?: Overrides & {
            from?: PromiseOrValue<string>;
        }): Promise<BigNumber>;
        mint(to: PromiseOrValue<string>, tokenId: PromiseOrValue<BigNumberish>, overrides?: Overrides & {
            from?: PromiseOrValue<string>;
        }): Promise<BigNumber>;
        mintFromContract(to: PromiseOrValue<string>, tokenId: PromiseOrValue<BigNumberish>, overrides?: Overrides & {
            from?: PromiseOrValue<string>;
        }): Promise<BigNumber>;
        setBaseURI(uri: PromiseOrValue<string>, overrides?: Overrides & {
            from?: PromiseOrValue<string>;
        }): Promise<BigNumber>;
        reveal(_index: PromiseOrValue<BigNumberish>, overrides?: Overrides & {
            from?: PromiseOrValue<string>;
        }): Promise<BigNumber>;
        getBatchIdAtIndex(_index: PromiseOrValue<BigNumberish>, overrides?: CallOverrides): Promise<BigNumber>;
        mintWithPrice(to: PromiseOrValue<string>, tokenIds: PromiseOrValue<BigNumberish>[], currency: PromiseOrValue<string>, pricePerToken: PromiseOrValue<BigNumberish>, overrides?: Overrides & {
            from?: PromiseOrValue<string>;
        }): Promise<BigNumber>;
        updateMetaData(_tokenId: PromiseOrValue<BigNumberish>, overrides?: Overrides & {
            from?: PromiseOrValue<string>;
        }): Promise<BigNumber>;
        updateBatchMetaData(_fromTokenId: PromiseOrValue<BigNumberish>, _toTokenId: PromiseOrValue<BigNumberish>, overrides?: Overrides & {
            from?: PromiseOrValue<string>;
        }): Promise<BigNumber>;
    };
    populateTransaction: {
        /**
         * See {IERC721-approve}.
         */
        approve(to: PromiseOrValue<string>, tokenId: PromiseOrValue<BigNumberish>, overrides?: Overrides & {
            from?: PromiseOrValue<string>;
        }): Promise<PopulatedTransaction>;
        /**
         * See {IERC721-balanceOf}.
         */
        balanceOf(owner: PromiseOrValue<string>, overrides?: CallOverrides): Promise<PopulatedTransaction>;
        /**
         * Returns the base URI set via {_setBaseURI}. This will be automatically added as a prefix in {tokenURI} to each token's URI, or to the token ID if no specific URI is set for that token ID.
         */
        baseURI(overrides?: CallOverrides): Promise<PopulatedTransaction>;
        /**
         * See {IERC721-getApproved}.
         */
        getApproved(tokenId: PromiseOrValue<BigNumberish>, overrides?: CallOverrides): Promise<PopulatedTransaction>;
        /**
         * See {IERC721-isApprovedForAll}.
         */
        isApprovedForAll(owner: PromiseOrValue<string>, operator: PromiseOrValue<string>, overrides?: CallOverrides): Promise<PopulatedTransaction>;
        /**
         * See {IERC721Metadata-name}.
         */
        name(overrides?: CallOverrides): Promise<PopulatedTransaction>;
        /**
         * Returns the owner of the contract.
         */
        owner(overrides?: CallOverrides): Promise<PopulatedTransaction>;
        /**
         * See {IERC721-ownerOf}.
         */
        ownerOf(tokenId: PromiseOrValue<BigNumberish>, overrides?: CallOverrides): Promise<PopulatedTransaction>;
        renderingContract(overrides?: CallOverrides): Promise<PopulatedTransaction>;
        /**
         * See {IERC721-safeTransferFrom}.
         */
        "safeTransferFrom(address,address,uint256)"(from: PromiseOrValue<string>, to: PromiseOrValue<string>, tokenId: PromiseOrValue<BigNumberish>, overrides?: Overrides & {
            from?: PromiseOrValue<string>;
        }): Promise<PopulatedTransaction>;
        /**
         * See {IERC721-safeTransferFrom}.
         */
        "safeTransferFrom(address,address,uint256,bytes)"(from: PromiseOrValue<string>, to: PromiseOrValue<string>, tokenId: PromiseOrValue<BigNumberish>, _data: PromiseOrValue<BytesLike>, overrides?: Overrides & {
            from?: PromiseOrValue<string>;
        }): Promise<PopulatedTransaction>;
        /**
         * See {IERC721-setApprovalForAll}.
         */
        setApprovalForAll(operator: PromiseOrValue<string>, approved: PromiseOrValue<boolean>, overrides?: Overrides & {
            from?: PromiseOrValue<string>;
        }): Promise<PopulatedTransaction>;
        /**
         * Lets an authorized wallet set a new owner for the contract.
         * @param _newOwner The address to set as the new owner of the contract.
         */
        setOwner(_newOwner: PromiseOrValue<string>, overrides?: Overrides & {
            from?: PromiseOrValue<string>;
        }): Promise<PopulatedTransaction>;
        setRenderingContract(_contract: PromiseOrValue<string>, overrides?: Overrides & {
            from?: PromiseOrValue<string>;
        }): Promise<PopulatedTransaction>;
        /**
         * See {IERC165-supportsInterface}. Time complexity O(1), guaranteed to always use less than 30 000 gas.
         */
        supportsInterface(interfaceId: PromiseOrValue<BytesLike>, overrides?: CallOverrides): Promise<PopulatedTransaction>;
        /**
         * See {IERC721Metadata-symbol}.
         */
        symbol(overrides?: CallOverrides): Promise<PopulatedTransaction>;
        /**
         * See {IERC721Enumerable-tokenByIndex}.
         */
        tokenByIndex(index: PromiseOrValue<BigNumberish>, overrides?: CallOverrides): Promise<PopulatedTransaction>;
        /**
         * See {IERC721Enumerable-tokenOfOwnerByIndex}.
         */
        tokenOfOwnerByIndex(owner: PromiseOrValue<string>, index: PromiseOrValue<BigNumberish>, overrides?: CallOverrides): Promise<PopulatedTransaction>;
        /**
         * See {IERC721Metadata-tokenURI}.
         */
        tokenURI(tokenId: PromiseOrValue<BigNumberish>, overrides?: CallOverrides): Promise<PopulatedTransaction>;
        /**
         * See {IERC721Enumerable-totalSupply}.
         */
        totalSupply(overrides?: CallOverrides): Promise<PopulatedTransaction>;
        /**
         * See {IERC721-transferFrom}.
         */
        transferFrom(from: PromiseOrValue<string>, to: PromiseOrValue<string>, tokenId: PromiseOrValue<BigNumberish>, overrides?: Overrides & {
            from?: PromiseOrValue<string>;
        }): Promise<PopulatedTransaction>;
        mint(to: PromiseOrValue<string>, tokenId: PromiseOrValue<BigNumberish>, overrides?: Overrides & {
            from?: PromiseOrValue<string>;
        }): Promise<PopulatedTransaction>;
        mintFromContract(to: PromiseOrValue<string>, tokenId: PromiseOrValue<BigNumberish>, overrides?: Overrides & {
            from?: PromiseOrValue<string>;
        }): Promise<PopulatedTransaction>;
        setBaseURI(uri: PromiseOrValue<string>, overrides?: Overrides & {
            from?: PromiseOrValue<string>;
        }): Promise<PopulatedTransaction>;
        reveal(_index: PromiseOrValue<BigNumberish>, overrides?: Overrides & {
            from?: PromiseOrValue<string>;
        }): Promise<PopulatedTransaction>;
        getBatchIdAtIndex(_index: PromiseOrValue<BigNumberish>, overrides?: CallOverrides): Promise<PopulatedTransaction>;
        mintWithPrice(to: PromiseOrValue<string>, tokenIds: PromiseOrValue<BigNumberish>[], currency: PromiseOrValue<string>, pricePerToken: PromiseOrValue<BigNumberish>, overrides?: Overrides & {
            from?: PromiseOrValue<string>;
        }): Promise<PopulatedTransaction>;
        updateMetaData(_tokenId: PromiseOrValue<BigNumberish>, overrides?: Overrides & {
            from?: PromiseOrValue<string>;
        }): Promise<PopulatedTransaction>;
        updateBatchMetaData(_fromTokenId: PromiseOrValue<BigNumberish>, _toTokenId: PromiseOrValue<BigNumberish>, overrides?: Overrides & {
            from?: PromiseOrValue<string>;
        }): Promise<PopulatedTransaction>;
    };
}
