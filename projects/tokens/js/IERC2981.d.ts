import type { BaseContract, BigNumber, BigNumberish, BytesLike, CallOverrides, PopulatedTransaction, Signer, utils } from "ethers";
import type { FunctionFragment, Result } from "@ethersproject/abi";
import type { Listener, Provider } from "@ethersproject/providers";
import type { TypedEventFilter, TypedEvent, TypedListener, OnEvent, PromiseOrValue } from "./common";
export interface IERC2981Interface extends utils.Interface {
    functions: {
        "royaltyInfo(uint256,uint256)": FunctionFragment;
    };
    getFunction(nameOrSignatureOrTopic: "royaltyInfo"): FunctionFragment;
    encodeFunctionData(functionFragment: "royaltyInfo", values: [PromiseOrValue<BigNumberish>, PromiseOrValue<BigNumberish>]): string;
    decodeFunctionResult(functionFragment: "royaltyInfo", data: BytesLike): Result;
    events: {};
}
export interface IERC2981 extends BaseContract {
    connect(signerOrProvider: Signer | Provider | string): this;
    attach(addressOrName: string): this;
    deployed(): Promise<this>;
    interface: IERC2981Interface;
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
         * @param _salePrice - the sale price of the NFT asset specified by _tokenId
         * @param _tokenId - the NFT asset queried for royalty information
         */
        royaltyInfo(_tokenId: PromiseOrValue<BigNumberish>, _salePrice: PromiseOrValue<BigNumberish>, overrides?: CallOverrides): Promise<[
            string,
            BigNumber
        ] & {
            receiver: string;
            royaltyAmount: BigNumber;
        }>;
    };
    /**
     * @param _salePrice - the sale price of the NFT asset specified by _tokenId
     * @param _tokenId - the NFT asset queried for royalty information
     */
    royaltyInfo(_tokenId: PromiseOrValue<BigNumberish>, _salePrice: PromiseOrValue<BigNumberish>, overrides?: CallOverrides): Promise<[
        string,
        BigNumber
    ] & {
        receiver: string;
        royaltyAmount: BigNumber;
    }>;
    callStatic: {
        /**
         * @param _salePrice - the sale price of the NFT asset specified by _tokenId
         * @param _tokenId - the NFT asset queried for royalty information
         */
        royaltyInfo(_tokenId: PromiseOrValue<BigNumberish>, _salePrice: PromiseOrValue<BigNumberish>, overrides?: CallOverrides): Promise<[
            string,
            BigNumber
        ] & {
            receiver: string;
            royaltyAmount: BigNumber;
        }>;
    };
    filters: {};
    estimateGas: {
        /**
         * @param _salePrice - the sale price of the NFT asset specified by _tokenId
         * @param _tokenId - the NFT asset queried for royalty information
         */
        royaltyInfo(_tokenId: PromiseOrValue<BigNumberish>, _salePrice: PromiseOrValue<BigNumberish>, overrides?: CallOverrides): Promise<BigNumber>;
    };
    populateTransaction: {
        /**
         * @param _salePrice - the sale price of the NFT asset specified by _tokenId
         * @param _tokenId - the NFT asset queried for royalty information
         */
        royaltyInfo(_tokenId: PromiseOrValue<BigNumberish>, _salePrice: PromiseOrValue<BigNumberish>, overrides?: CallOverrides): Promise<PopulatedTransaction>;
    };
}
