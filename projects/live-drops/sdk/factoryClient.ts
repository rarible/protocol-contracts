import { Signer, ContractTransaction, BigNumber } from "ethers";
import {
  LiveDropFactory,
  LiveDropFactory__factory,
} from "../typechain-types";

/**
 * Configuration for creating a new collection
 */
export type CollectionConfig = {
  name: string;
  symbol: string;
  description: string;
  icon: string;
  tokenMetaName: string;
  tokenMetaDescription: string;
  tokenMetaImage: string;
};

/**
 * Factory default configuration
 */
export type FactoryDefaults = {
  feeRecipient: string;
  feeBps: number;
  feeFixedNative: BigNumber;
  feeFixedErc20: BigNumber;
  erc20: string;
};

/**
 * Result of creating a collection
 */
export type CreateCollectionResult = {
  tx: ContractTransaction;
  collectionAddress: string;
  creator: string;
  name: string;
  symbol: string;
};

/**
 * TypeScript wrapper for LiveDropFactory contract interactions
 */
export class FactoryClient {
  private contract: LiveDropFactory;
  public readonly address: string;

  constructor(address: string, signer: Signer) {
    this.contract = LiveDropFactory__factory.connect(address, signer);
    this.address = address;
  }

  /**
   * Deploy a new LiveDropFactory contract
   */
  static async deploy(
    signer: Signer,
    owner: string,
    feeRecipient: string,
    defaultFeeBps: number,
    defaultFeeFixedNative: BigNumber | string | number,
    defaultFeeFixedErc20: BigNumber | string | number,
    defaultErc20: string
  ): Promise<FactoryClient> {
    const factory = await new LiveDropFactory__factory(signer).deploy(
      owner,
      feeRecipient,
      defaultFeeBps,
      defaultFeeFixedNative,
      defaultFeeFixedErc20,
      defaultErc20
    );
    await factory.deployed();
    console.log(`✅ LiveDropFactory deployed at: ${factory.address}`);
    return new FactoryClient(factory.address, signer);
  }

  /**
   * Connect to an existing factory
   */
  static connect(address: string, signer: Signer): FactoryClient {
    return new FactoryClient(address, signer);
  }

  /**
   * Get current factory defaults
   */
  async getDefaults(): Promise<FactoryDefaults> {
    const result = await this.contract.getDefaults();
    return {
      feeRecipient: result._feeRecipient,
      feeBps: result._feeBps,
      feeFixedNative: result._feeFixedNative,
      feeFixedErc20: result._feeFixedErc20,
      erc20: result._erc20,
    };
  }

  /**
   * Set default fees for new collections
   */
  async setDefaultFees(
    feeBps: number,
    feeFixedNative: BigNumber | string | number,
    feeFixedErc20: BigNumber | string | number
  ): Promise<ContractTransaction> {
    const tx = await this.contract.setDefaultFees(
      feeBps,
      feeFixedNative,
      feeFixedErc20
    );
    console.log(`Setting default fees... tx: ${tx.hash}`);
    await tx.wait();
    console.log(`✅ Default fees updated`);
    return tx;
  }

  /**
   * Set the fee recipient address
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
   * Set the default ERC-20 token for new collections
   */
  async setDefaultErc20(
    erc20: string
  ): Promise<ContractTransaction> {
    const tx = await this.contract.setDefaultErc20(erc20);
    console.log(`Setting default ERC-20... tx: ${tx.hash}`);
    await tx.wait();
    console.log(`✅ Default ERC-20 updated to: ${erc20}`);
    return tx;
  }

  /**
   * Create a new collection
   */
  async createCollection(
    config: CollectionConfig
  ): Promise<CreateCollectionResult> {
    const tx = await this.contract.createCollection(config);
    console.log(`Creating collection "${config.name}"... tx: ${tx.hash}`);
    const receipt = await tx.wait();

    const event = receipt.events?.find((e) => e.event === "CollectionCreated");
    if (!event || !event.args) {
      throw new Error("CollectionCreated event not found in transaction");
    }

    const result: CreateCollectionResult = {
      tx,
      collectionAddress: event.args.collection,
      creator: event.args.creator,
      name: event.args.name,
      symbol: event.args.symbol,
    };

    console.log(`✅ Collection created at: ${result.collectionAddress}`);
    return result;
  }

  /**
   * Get total number of collections
   */
  async getCollectionCount(): Promise<number> {
    const count = await this.contract.getCollectionCount();
    return count.toNumber();
  }

  /**
   * Get paginated list of collections
   */
  async getCollections(
    offset: number,
    limit: number
  ): Promise<string[]> {
    return await this.contract.getCollections(offset, limit);
  }

  /**
   * Check if an address is a collection created by this factory
   */
  async isCollection(address: string): Promise<boolean> {
    return await this.contract.isCollection(address);
  }

  /**
   * Get the current factory owner
   */
  async getOwner(): Promise<string> {
    return await this.contract.owner();
  }

  /**
   * Transfer factory ownership
   */
  async transferOwnership(
    newOwner: string
  ): Promise<ContractTransaction> {
    const tx = await this.contract.transferOwnership(newOwner);
    console.log(`Transferring ownership... tx: ${tx.hash}`);
    await tx.wait();
    console.log(`✅ Ownership transferred to: ${newOwner}`);
    return tx;
  }
}
