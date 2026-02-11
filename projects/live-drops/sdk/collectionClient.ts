import { Signer, ContractTransaction, BigNumber } from "ethers";
import {
  LiveDropCollection,
  LiveDropCollection__factory,
} from "../typechain-types";

/**
 * Full state of a collection
 */
export type CollectionState = {
  address: string;
  name: string;
  symbol: string;
  owner: string;
  factory: string;
  feeRecipient: string;
  feeBps: number;
  feeFixedNative: BigNumber;
  feeFixedErc20: BigNumber;
  erc20Token: string;
  collectionDescription: string;
  collectionIcon: string;
  tokenMetaName: string;
  tokenMetaDescription: string;
  tokenMetaImage: string;
  totalSupply: BigNumber;
  paused: boolean;
  royaltyReceiver: string;
  royaltyBps: BigNumber;
};

/**
 * Result of a mint operation
 */
export type MintResult = {
  tx: ContractTransaction;
  tokenId: BigNumber;
  to: string;
  amount: BigNumber;
  fee: BigNumber;
};

/**
 * TypeScript wrapper for LiveDropCollection contract interactions
 */
export class CollectionClient {
  private contract: LiveDropCollection;
  public readonly address: string;

  constructor(address: string, signer: Signer) {
    this.contract = LiveDropCollection__factory.connect(address, signer);
    this.address = address;
  }

  /**
   * Connect to an existing collection
   */
  static connect(address: string, signer: Signer): CollectionClient {
    return new CollectionClient(address, signer);
  }

  /**
   * Get full collection state
   */
  async getState(): Promise<CollectionState> {
    const [
      name,
      symbol,
      owner,
      factory,
      feeRecipient,
      feeBps,
      feeFixedNative,
      feeFixedErc20,
      erc20Token,
      collectionDescription,
      collectionIcon,
      tokenMetaName,
      tokenMetaDescription,
      tokenMetaImage,
      totalSupply,
      paused,
    ] = await Promise.all([
      this.contract.name(),
      this.contract.symbol(),
      this.contract.owner(),
      this.contract.factory(),
      this.contract.feeRecipient(),
      this.contract.feeBps(),
      this.contract.feeFixedNative(),
      this.contract.feeFixedErc20(),
      this.contract.erc20Token(),
      this.contract.collectionDescription(),
      this.contract.collectionIcon(),
      this.contract.tokenMetaName(),
      this.contract.tokenMetaDescription(),
      this.contract.tokenMetaImage(),
      this.contract.totalSupply(),
      this.contract.paused(),
    ]);

    // Get royalty info using a sample sale price of 10000 bps base
    const [royaltyReceiver, royaltyAmount] = await this.contract.royaltyInfo(
      0,
      10000
    );

    return {
      address: this.address,
      name,
      symbol,
      owner,
      factory,
      feeRecipient,
      feeBps,
      feeFixedNative,
      feeFixedErc20,
      erc20Token,
      collectionDescription,
      collectionIcon,
      tokenMetaName,
      tokenMetaDescription,
      tokenMetaImage,
      totalSupply,
      paused,
      royaltyReceiver,
      royaltyBps: royaltyAmount, // bps since salePrice=10000
    };
  }

  // =========================================================================
  //                          MINTING
  // =========================================================================

  /**
   * Mint an NFT by paying with native ETH
   */
  async mintNative(
    to: string,
    amount: BigNumber,
    overrides?: { value?: BigNumber }
  ): Promise<MintResult> {
    const value = overrides?.value ?? amount;
    const tx = await this.contract.mintNative(to, amount, { value });
    console.log(`Minting with native ETH... tx: ${tx.hash}`);
    const receipt = await tx.wait();

    const event = receipt.events?.find((e) => e.event === "MintedNative");
    if (!event || !event.args) {
      throw new Error("MintedNative event not found");
    }

    const result: MintResult = {
      tx,
      tokenId: event.args.tokenId,
      to: event.args.to,
      amount: event.args.amount,
      fee: event.args.fee,
    };

    console.log(
      `✅ Minted token #${result.tokenId} to ${result.to} (fee: ${result.fee})`
    );
    return result;
  }

  /**
   * Mint an NFT by paying with ERC-20 token
   */
  async mintErc20(
    to: string,
    amount: BigNumber
  ): Promise<MintResult> {
    const tx = await this.contract.mintErc20(to, amount);
    console.log(`Minting with ERC-20... tx: ${tx.hash}`);
    const receipt = await tx.wait();

    const event = receipt.events?.find((e) => e.event === "MintedErc20");
    if (!event || !event.args) {
      throw new Error("MintedErc20 event not found");
    }

    const result: MintResult = {
      tx,
      tokenId: event.args.tokenId,
      to: event.args.to,
      amount: event.args.amount,
      fee: event.args.fee,
    };

    console.log(
      `✅ Minted token #${result.tokenId} to ${result.to} (fee: ${result.fee})`
    );
    return result;
  }

  // =========================================================================
  //                          BURN
  // =========================================================================

  /**
   * Burn a token
   */
  async burn(tokenId: number | BigNumber): Promise<ContractTransaction> {
    const tx = await this.contract.burn(tokenId);
    console.log(`Burning token #${tokenId}... tx: ${tx.hash}`);
    await tx.wait();
    console.log(`✅ Token #${tokenId} burned`);
    return tx;
  }

  // =========================================================================
  //                          ADMIN
  // =========================================================================

  /**
   * Set fees (collection owner or factory owner)
   */
  async setFees(
    feeBps: number,
    feeFixedNative: BigNumber | string | number,
    feeFixedErc20: BigNumber | string | number
  ): Promise<ContractTransaction> {
    const tx = await this.contract.setFees(
      feeBps,
      feeFixedNative,
      feeFixedErc20
    );
    console.log(`Setting fees... tx: ${tx.hash}`);
    await tx.wait();
    console.log(`✅ Fees updated: ${feeBps} bps`);
    return tx;
  }

  /**
   * Set fee recipient (factory owner only)
   */
  async setFeeRecipient(
    feeRecipient: string
  ): Promise<ContractTransaction> {
    const tx = await this.contract.setFeeRecipient(feeRecipient);
    console.log(`Setting fee recipient... tx: ${tx.hash}`);
    await tx.wait();
    console.log(`✅ Fee recipient updated to: ${feeRecipient}`);
    return tx;
  }

  /**
   * Set royalty configuration
   */
  async setRoyalty(
    receiver: string,
    bps: number
  ): Promise<ContractTransaction> {
    const tx = await this.contract.setRoyalty(receiver, bps);
    console.log(`Setting royalty... tx: ${tx.hash}`);
    await tx.wait();
    console.log(`✅ Royalty updated: ${bps} bps to ${receiver}`);
    return tx;
  }

  /**
   * Set ERC-20 payment token
   */
  async setErc20Token(
    token: string
  ): Promise<ContractTransaction> {
    const tx = await this.contract.setErc20Token(token);
    console.log(`Setting ERC-20 token... tx: ${tx.hash}`);
    await tx.wait();
    console.log(`✅ ERC-20 token updated to: ${token}`);
    return tx;
  }

  /**
   * Set collection metadata
   */
  async setCollectionMetadata(
    description: string,
    icon: string
  ): Promise<ContractTransaction> {
    const tx = await this.contract.setCollectionMetadata(description, icon);
    console.log(`Setting collection metadata... tx: ${tx.hash}`);
    await tx.wait();
    console.log(`✅ Collection metadata updated`);
    return tx;
  }

  /**
   * Set token metadata (shared by all tokens)
   */
  async setTokenMetadata(
    name: string,
    description: string,
    image: string
  ): Promise<ContractTransaction> {
    const tx = await this.contract.setTokenMetadata(name, description, image);
    console.log(`Setting token metadata... tx: ${tx.hash}`);
    await tx.wait();
    console.log(`✅ Token metadata updated`);
    return tx;
  }

  /**
   * Pause the collection (disables minting)
   */
  async pause(): Promise<ContractTransaction> {
    const tx = await this.contract.pause();
    console.log(`Pausing collection... tx: ${tx.hash}`);
    await tx.wait();
    console.log(`✅ Collection paused`);
    return tx;
  }

  /**
   * Unpause the collection
   */
  async unpause(): Promise<ContractTransaction> {
    const tx = await this.contract.unpause();
    console.log(`Unpausing collection... tx: ${tx.hash}`);
    await tx.wait();
    console.log(`✅ Collection unpaused`);
    return tx;
  }

  // =========================================================================
  //                          VIEWS
  // =========================================================================

  /**
   * Get tokenURI
   */
  async tokenURI(tokenId: number | BigNumber): Promise<string> {
    return await this.contract.tokenURI(tokenId);
  }

  /**
   * Get contractURI
   */
  async contractURI(): Promise<string> {
    return await this.contract.contractURI();
  }

  /**
   * Get total supply
   */
  async totalSupply(): Promise<BigNumber> {
    return await this.contract.totalSupply();
  }

  /**
   * Get owner of a token
   */
  async ownerOf(tokenId: number | BigNumber): Promise<string> {
    return await this.contract.ownerOf(tokenId);
  }
}
