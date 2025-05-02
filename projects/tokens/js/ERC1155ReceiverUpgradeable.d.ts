import type { BaseContract, BigNumber, BigNumberish, BytesLike, CallOverrides, ContractTransaction, Overrides, PopulatedTransaction, Signer, utils } from "ethers";
import type { FunctionFragment, Result } from "@ethersproject/abi";
import type { Listener, Provider } from "@ethersproject/providers";
import type { TypedEventFilter, TypedEvent, TypedListener, OnEvent, PromiseOrValue } from "./common";
export interface ERC1155ReceiverUpgradeableInterface extends utils.Interface {
    functions: {
        "onERC1155BatchReceived(address,address,uint256[],uint256[],bytes)": FunctionFragment;
        "onERC1155Received(address,address,uint256,uint256,bytes)": FunctionFragment;
        "supportsInterface(bytes4)": FunctionFragment;
    };
    getFunction(nameOrSignatureOrTopic: "onERC1155BatchReceived" | "onERC1155Received" | "supportsInterface"): FunctionFragment;
    encodeFunctionData(functionFragment: "onERC1155BatchReceived", values: [
        PromiseOrValue<string>,
        PromiseOrValue<string>,
        PromiseOrValue<BigNumberish>[],
        PromiseOrValue<BigNumberish>[],
        PromiseOrValue<BytesLike>
    ]): string;
    encodeFunctionData(functionFragment: "onERC1155Received", values: [
        PromiseOrValue<string>,
        PromiseOrValue<string>,
        PromiseOrValue<BigNumberish>,
        PromiseOrValue<BigNumberish>,
        PromiseOrValue<BytesLike>
    ]): string;
    encodeFunctionData(functionFragment: "supportsInterface", values: [PromiseOrValue<BytesLike>]): string;
    decodeFunctionResult(functionFragment: "onERC1155BatchReceived", data: BytesLike): Result;
    decodeFunctionResult(functionFragment: "onERC1155Received", data: BytesLike): Result;
    decodeFunctionResult(functionFragment: "supportsInterface", data: BytesLike): Result;
    events: {};
}
export interface ERC1155ReceiverUpgradeable extends BaseContract {
    connect(signerOrProvider: Signer | Provider | string): this;
    attach(addressOrName: string): this;
    deployed(): Promise<this>;
    interface: ERC1155ReceiverUpgradeableInterface;
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
         * Handles the receipt of a multiple ERC1155 token types. This function is called at the end of a `safeBatchTransferFrom` after the balances have been updated. To accept the transfer(s), this must return `bytes4(keccak256("onERC1155BatchReceived(address,address,uint256[],uint256[],bytes)"))` (i.e. 0xbc197c81, or its own function selector).
         * @param data Additional data with no specified format
         * @param from The address which previously owned the token
         * @param ids An array containing ids of each token being transferred (order and length must match values array)
         * @param operator The address which initiated the batch transfer (i.e. msg.sender)
         * @param values An array containing amounts of each token being transferred (order and length must match ids array)
         */
        onERC1155BatchReceived(operator: PromiseOrValue<string>, from: PromiseOrValue<string>, ids: PromiseOrValue<BigNumberish>[], values: PromiseOrValue<BigNumberish>[], data: PromiseOrValue<BytesLike>, overrides?: Overrides & {
            from?: PromiseOrValue<string>;
        }): Promise<ContractTransaction>;
        /**
         * Handles the receipt of a single ERC1155 token type. This function is called at the end of a `safeTransferFrom` after the balance has been updated. To accept the transfer, this must return `bytes4(keccak256("onERC1155Received(address,address,uint256,uint256,bytes)"))` (i.e. 0xf23a6e61, or its own function selector).
         * @param data Additional data with no specified format
         * @param from The address which previously owned the token
         * @param id The ID of the token being transferred
         * @param operator The address which initiated the transfer (i.e. msg.sender)
         * @param value The amount of tokens being transferred
         */
        onERC1155Received(operator: PromiseOrValue<string>, from: PromiseOrValue<string>, id: PromiseOrValue<BigNumberish>, value: PromiseOrValue<BigNumberish>, data: PromiseOrValue<BytesLike>, overrides?: Overrides & {
            from?: PromiseOrValue<string>;
        }): Promise<ContractTransaction>;
        /**
         * See {IERC165-supportsInterface}. Time complexity O(1), guaranteed to always use less than 30 000 gas.
         */
        supportsInterface(interfaceId: PromiseOrValue<BytesLike>, overrides?: CallOverrides): Promise<[boolean]>;
    };
    /**
     * Handles the receipt of a multiple ERC1155 token types. This function is called at the end of a `safeBatchTransferFrom` after the balances have been updated. To accept the transfer(s), this must return `bytes4(keccak256("onERC1155BatchReceived(address,address,uint256[],uint256[],bytes)"))` (i.e. 0xbc197c81, or its own function selector).
     * @param data Additional data with no specified format
     * @param from The address which previously owned the token
     * @param ids An array containing ids of each token being transferred (order and length must match values array)
     * @param operator The address which initiated the batch transfer (i.e. msg.sender)
     * @param values An array containing amounts of each token being transferred (order and length must match ids array)
     */
    onERC1155BatchReceived(operator: PromiseOrValue<string>, from: PromiseOrValue<string>, ids: PromiseOrValue<BigNumberish>[], values: PromiseOrValue<BigNumberish>[], data: PromiseOrValue<BytesLike>, overrides?: Overrides & {
        from?: PromiseOrValue<string>;
    }): Promise<ContractTransaction>;
    /**
     * Handles the receipt of a single ERC1155 token type. This function is called at the end of a `safeTransferFrom` after the balance has been updated. To accept the transfer, this must return `bytes4(keccak256("onERC1155Received(address,address,uint256,uint256,bytes)"))` (i.e. 0xf23a6e61, or its own function selector).
     * @param data Additional data with no specified format
     * @param from The address which previously owned the token
     * @param id The ID of the token being transferred
     * @param operator The address which initiated the transfer (i.e. msg.sender)
     * @param value The amount of tokens being transferred
     */
    onERC1155Received(operator: PromiseOrValue<string>, from: PromiseOrValue<string>, id: PromiseOrValue<BigNumberish>, value: PromiseOrValue<BigNumberish>, data: PromiseOrValue<BytesLike>, overrides?: Overrides & {
        from?: PromiseOrValue<string>;
    }): Promise<ContractTransaction>;
    /**
     * See {IERC165-supportsInterface}. Time complexity O(1), guaranteed to always use less than 30 000 gas.
     */
    supportsInterface(interfaceId: PromiseOrValue<BytesLike>, overrides?: CallOverrides): Promise<boolean>;
    callStatic: {
        /**
         * Handles the receipt of a multiple ERC1155 token types. This function is called at the end of a `safeBatchTransferFrom` after the balances have been updated. To accept the transfer(s), this must return `bytes4(keccak256("onERC1155BatchReceived(address,address,uint256[],uint256[],bytes)"))` (i.e. 0xbc197c81, or its own function selector).
         * @param data Additional data with no specified format
         * @param from The address which previously owned the token
         * @param ids An array containing ids of each token being transferred (order and length must match values array)
         * @param operator The address which initiated the batch transfer (i.e. msg.sender)
         * @param values An array containing amounts of each token being transferred (order and length must match ids array)
         */
        onERC1155BatchReceived(operator: PromiseOrValue<string>, from: PromiseOrValue<string>, ids: PromiseOrValue<BigNumberish>[], values: PromiseOrValue<BigNumberish>[], data: PromiseOrValue<BytesLike>, overrides?: CallOverrides): Promise<string>;
        /**
         * Handles the receipt of a single ERC1155 token type. This function is called at the end of a `safeTransferFrom` after the balance has been updated. To accept the transfer, this must return `bytes4(keccak256("onERC1155Received(address,address,uint256,uint256,bytes)"))` (i.e. 0xf23a6e61, or its own function selector).
         * @param data Additional data with no specified format
         * @param from The address which previously owned the token
         * @param id The ID of the token being transferred
         * @param operator The address which initiated the transfer (i.e. msg.sender)
         * @param value The amount of tokens being transferred
         */
        onERC1155Received(operator: PromiseOrValue<string>, from: PromiseOrValue<string>, id: PromiseOrValue<BigNumberish>, value: PromiseOrValue<BigNumberish>, data: PromiseOrValue<BytesLike>, overrides?: CallOverrides): Promise<string>;
        /**
         * See {IERC165-supportsInterface}. Time complexity O(1), guaranteed to always use less than 30 000 gas.
         */
        supportsInterface(interfaceId: PromiseOrValue<BytesLike>, overrides?: CallOverrides): Promise<boolean>;
    };
    filters: {};
    estimateGas: {
        /**
         * Handles the receipt of a multiple ERC1155 token types. This function is called at the end of a `safeBatchTransferFrom` after the balances have been updated. To accept the transfer(s), this must return `bytes4(keccak256("onERC1155BatchReceived(address,address,uint256[],uint256[],bytes)"))` (i.e. 0xbc197c81, or its own function selector).
         * @param data Additional data with no specified format
         * @param from The address which previously owned the token
         * @param ids An array containing ids of each token being transferred (order and length must match values array)
         * @param operator The address which initiated the batch transfer (i.e. msg.sender)
         * @param values An array containing amounts of each token being transferred (order and length must match ids array)
         */
        onERC1155BatchReceived(operator: PromiseOrValue<string>, from: PromiseOrValue<string>, ids: PromiseOrValue<BigNumberish>[], values: PromiseOrValue<BigNumberish>[], data: PromiseOrValue<BytesLike>, overrides?: Overrides & {
            from?: PromiseOrValue<string>;
        }): Promise<BigNumber>;
        /**
         * Handles the receipt of a single ERC1155 token type. This function is called at the end of a `safeTransferFrom` after the balance has been updated. To accept the transfer, this must return `bytes4(keccak256("onERC1155Received(address,address,uint256,uint256,bytes)"))` (i.e. 0xf23a6e61, or its own function selector).
         * @param data Additional data with no specified format
         * @param from The address which previously owned the token
         * @param id The ID of the token being transferred
         * @param operator The address which initiated the transfer (i.e. msg.sender)
         * @param value The amount of tokens being transferred
         */
        onERC1155Received(operator: PromiseOrValue<string>, from: PromiseOrValue<string>, id: PromiseOrValue<BigNumberish>, value: PromiseOrValue<BigNumberish>, data: PromiseOrValue<BytesLike>, overrides?: Overrides & {
            from?: PromiseOrValue<string>;
        }): Promise<BigNumber>;
        /**
         * See {IERC165-supportsInterface}. Time complexity O(1), guaranteed to always use less than 30 000 gas.
         */
        supportsInterface(interfaceId: PromiseOrValue<BytesLike>, overrides?: CallOverrides): Promise<BigNumber>;
    };
    populateTransaction: {
        /**
         * Handles the receipt of a multiple ERC1155 token types. This function is called at the end of a `safeBatchTransferFrom` after the balances have been updated. To accept the transfer(s), this must return `bytes4(keccak256("onERC1155BatchReceived(address,address,uint256[],uint256[],bytes)"))` (i.e. 0xbc197c81, or its own function selector).
         * @param data Additional data with no specified format
         * @param from The address which previously owned the token
         * @param ids An array containing ids of each token being transferred (order and length must match values array)
         * @param operator The address which initiated the batch transfer (i.e. msg.sender)
         * @param values An array containing amounts of each token being transferred (order and length must match ids array)
         */
        onERC1155BatchReceived(operator: PromiseOrValue<string>, from: PromiseOrValue<string>, ids: PromiseOrValue<BigNumberish>[], values: PromiseOrValue<BigNumberish>[], data: PromiseOrValue<BytesLike>, overrides?: Overrides & {
            from?: PromiseOrValue<string>;
        }): Promise<PopulatedTransaction>;
        /**
         * Handles the receipt of a single ERC1155 token type. This function is called at the end of a `safeTransferFrom` after the balance has been updated. To accept the transfer, this must return `bytes4(keccak256("onERC1155Received(address,address,uint256,uint256,bytes)"))` (i.e. 0xf23a6e61, or its own function selector).
         * @param data Additional data with no specified format
         * @param from The address which previously owned the token
         * @param id The ID of the token being transferred
         * @param operator The address which initiated the transfer (i.e. msg.sender)
         * @param value The amount of tokens being transferred
         */
        onERC1155Received(operator: PromiseOrValue<string>, from: PromiseOrValue<string>, id: PromiseOrValue<BigNumberish>, value: PromiseOrValue<BigNumberish>, data: PromiseOrValue<BytesLike>, overrides?: Overrides & {
            from?: PromiseOrValue<string>;
        }): Promise<PopulatedTransaction>;
        /**
         * See {IERC165-supportsInterface}. Time complexity O(1), guaranteed to always use less than 30 000 gas.
         */
        supportsInterface(interfaceId: PromiseOrValue<BytesLike>, overrides?: CallOverrides): Promise<PopulatedTransaction>;
    };
}
