/* Autogenerated file. Do not edit manually. */
/* tslint:disable */
/* eslint-disable */
import type {
  BaseContract,
  BigNumber,
  BigNumberish,
  BytesLike,
  CallOverrides,
  PopulatedTransaction,
  Signer,
  utils,
} from "ethers";
import type { FunctionFragment, Result } from "@ethersproject/abi";
import type { Listener, Provider } from "@ethersproject/providers";
import type {
  TypedEventFilter,
  TypedEvent,
  TypedListener,
  OnEvent,
  PromiseOrValue,
} from "./common";

export type FeeStruct = {
  rate: PromiseOrValue<BigNumberish>;
  recipient: PromiseOrValue<string>;
};

export type FeeStructOutput = [number, string] & {
  rate: number;
  recipient: string;
};

export type OrderStruct = {
  trader: PromiseOrValue<string>;
  side: PromiseOrValue<BigNumberish>;
  matchingPolicy: PromiseOrValue<string>;
  collection: PromiseOrValue<string>;
  tokenId: PromiseOrValue<BigNumberish>;
  amount: PromiseOrValue<BigNumberish>;
  paymentToken: PromiseOrValue<string>;
  price: PromiseOrValue<BigNumberish>;
  listingTime: PromiseOrValue<BigNumberish>;
  expirationTime: PromiseOrValue<BigNumberish>;
  fees: FeeStruct[];
  salt: PromiseOrValue<BigNumberish>;
  extraParams: PromiseOrValue<BytesLike>;
};

export type OrderStructOutput = [
  string,
  number,
  string,
  string,
  BigNumber,
  BigNumber,
  string,
  BigNumber,
  BigNumber,
  BigNumber,
  FeeStructOutput[],
  BigNumber,
  string
] & {
  trader: string;
  side: number;
  matchingPolicy: string;
  collection: string;
  tokenId: BigNumber;
  amount: BigNumber;
  paymentToken: string;
  price: BigNumber;
  listingTime: BigNumber;
  expirationTime: BigNumber;
  fees: FeeStructOutput[];
  salt: BigNumber;
  extraParams: string;
};

export interface StandardPolicyERC721Interface extends utils.Interface {
  functions: {
    "canMatchMakerAsk((address,uint8,address,address,uint256,uint256,address,uint256,uint256,uint256,(uint16,address)[],uint256,bytes),(address,uint8,address,address,uint256,uint256,address,uint256,uint256,uint256,(uint16,address)[],uint256,bytes))": FunctionFragment;
    "canMatchMakerBid((address,uint8,address,address,uint256,uint256,address,uint256,uint256,uint256,(uint16,address)[],uint256,bytes),(address,uint8,address,address,uint256,uint256,address,uint256,uint256,uint256,(uint16,address)[],uint256,bytes))": FunctionFragment;
  };

  getFunction(
    nameOrSignatureOrTopic: "canMatchMakerAsk" | "canMatchMakerBid"
  ): FunctionFragment;

  encodeFunctionData(
    functionFragment: "canMatchMakerAsk",
    values: [OrderStruct, OrderStruct]
  ): string;
  encodeFunctionData(
    functionFragment: "canMatchMakerBid",
    values: [OrderStruct, OrderStruct]
  ): string;

  decodeFunctionResult(
    functionFragment: "canMatchMakerAsk",
    data: BytesLike
  ): Result;
  decodeFunctionResult(
    functionFragment: "canMatchMakerBid",
    data: BytesLike
  ): Result;

  events: {};
}

export interface StandardPolicyERC721 extends BaseContract {
  connect(signerOrProvider: Signer | Provider | string): this;
  attach(addressOrName: string): this;
  deployed(): Promise<this>;

  interface: StandardPolicyERC721Interface;

  queryFilter<TEvent extends TypedEvent>(
    event: TypedEventFilter<TEvent>,
    fromBlockOrBlockhash?: string | number | undefined,
    toBlock?: string | number | undefined
  ): Promise<Array<TEvent>>;

  listeners<TEvent extends TypedEvent>(
    eventFilter?: TypedEventFilter<TEvent>
  ): Array<TypedListener<TEvent>>;
  listeners(eventName?: string): Array<Listener>;
  removeAllListeners<TEvent extends TypedEvent>(
    eventFilter: TypedEventFilter<TEvent>
  ): this;
  removeAllListeners(eventName?: string): this;
  off: OnEvent<this>;
  on: OnEvent<this>;
  once: OnEvent<this>;
  removeListener: OnEvent<this>;

  functions: {
    canMatchMakerAsk(
      makerAsk: OrderStruct,
      takerBid: OrderStruct,
      overrides?: CallOverrides
    ): Promise<[boolean, BigNumber, BigNumber, BigNumber, number]>;

    canMatchMakerBid(
      makerBid: OrderStruct,
      takerAsk: OrderStruct,
      overrides?: CallOverrides
    ): Promise<[boolean, BigNumber, BigNumber, BigNumber, number]>;
  };

  canMatchMakerAsk(
    makerAsk: OrderStruct,
    takerBid: OrderStruct,
    overrides?: CallOverrides
  ): Promise<[boolean, BigNumber, BigNumber, BigNumber, number]>;

  canMatchMakerBid(
    makerBid: OrderStruct,
    takerAsk: OrderStruct,
    overrides?: CallOverrides
  ): Promise<[boolean, BigNumber, BigNumber, BigNumber, number]>;

  callStatic: {
    canMatchMakerAsk(
      makerAsk: OrderStruct,
      takerBid: OrderStruct,
      overrides?: CallOverrides
    ): Promise<[boolean, BigNumber, BigNumber, BigNumber, number]>;

    canMatchMakerBid(
      makerBid: OrderStruct,
      takerAsk: OrderStruct,
      overrides?: CallOverrides
    ): Promise<[boolean, BigNumber, BigNumber, BigNumber, number]>;
  };

  filters: {};

  estimateGas: {
    canMatchMakerAsk(
      makerAsk: OrderStruct,
      takerBid: OrderStruct,
      overrides?: CallOverrides
    ): Promise<BigNumber>;

    canMatchMakerBid(
      makerBid: OrderStruct,
      takerAsk: OrderStruct,
      overrides?: CallOverrides
    ): Promise<BigNumber>;
  };

  populateTransaction: {
    canMatchMakerAsk(
      makerAsk: OrderStruct,
      takerBid: OrderStruct,
      overrides?: CallOverrides
    ): Promise<PopulatedTransaction>;

    canMatchMakerBid(
      makerBid: OrderStruct,
      takerAsk: OrderStruct,
      overrides?: CallOverrides
    ): Promise<PopulatedTransaction>;
  };
}