import { Signer } from "ethers";
import {
  DropERC721,
  DropERC721__factory,
  DropERC1155,
  DropERC1155__factory,
  OpenEditionERC721FlatFee,
  OpenEditionERC721FlatFee__factory,
} from "../typechain-types";
import { DropContractType } from "../types/drop-types";

export type DropContract = DropERC721 | DropERC1155 | OpenEditionERC721FlatFee;

/**
 * Connects to a known role-compatible contract, optionally forcing the type.
 *
 * @param address Contract address
 * @param signer Ethers signer
 * @param contractType Optional contract type hint (drop721, drop1155, openedition)
 */
export function connectWithDropContract(
  address: string,
  signer: Signer,
  contractType?: DropContractType
): DropContract {
  const type = contractType?.toLowerCase();

  if (type === "721") {
    return DropERC721__factory.connect(address, signer);
  }

  if (type === "1155") {
    return DropERC1155__factory.connect(address, signer);
  }

  if (type === "oe") {
    return OpenEditionERC721FlatFee__factory.connect(address, signer);
  }

  // Fallback: try them in order until one works
  try {
    return DropERC721__factory.connect(address, signer);
  } catch {}

  try {
    return DropERC1155__factory.connect(address, signer);
  } catch {}

  try {
    return OpenEditionERC721FlatFee__factory.connect(address, signer);
  } catch {}

  throw new Error(
    contractType
      ? `Unknown contract type "${contractType}" or contract mismatch at ${address}`
      : `Contract at ${address} does not match known types.`
  );
}
