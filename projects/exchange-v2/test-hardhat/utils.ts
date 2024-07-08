import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import { expect } from "chai";
import { keccak256 } from "ethereumjs-util";
import { ContractTransaction } from "ethers";
import { ethers } from "hardhat";
import { HardhatEthersHelpers } from "hardhat/types";
import Web3 from "web3";
import { TransactionResponse } from "zksync-web3/build/src/types";


const web3 = new Web3();

export function id(str: string): string {
  return `0x${keccak256(Buffer.from(str)).toString("hex").substring(0, 8)}`;
}

export function enc(token: string, tokenId?: number): string {
  if (tokenId) {
    return web3.eth.abi.encodeParameters(["address", "uint256"], [token, "" + tokenId]);
  } else {
    return web3.eth.abi.encodeParameter("address", token);
  }
}

export const ETH = id("ETH");
export const ZERO = "0x0000000000000000000000000000000000000000";
export const ERC20 = id("ERC20");
export const ERC721 = id("ERC721");
export const ERC721_LAZY = id("ERC721_LAZY");
export const ERC1155 = id("ERC1155");
export const ERC1155_LAZY = id("ERC1155_LAZY");
export const COLLECTION = id("COLLECTION");
export const CRYPTO_PUNKS = id("CRYPTO_PUNKS");
export const ORDER_DATA_V1 = id("V1");
export const ORDER_DATA_V2 = id("V2");
export const ORDER_DATA_V3 = id("V3");
export const TO_MAKER = id("TO_MAKER");
export const TO_TAKER = id("TO_TAKER");
export const PROTOCOL = id("PROTOCOL");
export const ROYALTY = id("ROYALTY");
export const ORIGIN = id("ORIGIN");
export const PAYOUT = id("PAYOUT");
export const LOCK = id("LOCK");
export const UNLOCK = id("UNLOCK");
export const TO_LOCK = id("TO_LOCK");

export async function verifyBalanceChangeReturnTx(
  eth: typeof ethers & HardhatEthersHelpers, 
  account: SignerWithAddress, 
  change: number, 
  todo: () => Promise<ContractTransaction>
): Promise<ContractTransaction> {
  const before = await eth.provider.getBalance(account.address)
  const response = await todo();
  const tx = await response.wait()

  const after = await eth.provider.getBalance(account.address)
  let actual = before.sub(after);

  const gasUsed = tx.gasUsed
  const effectiveGasPrice = tx.effectiveGasPrice

  const txSender = tx.from
  const moneyUsedForGas = gasUsed.mul(effectiveGasPrice);

  if (txSender.toLowerCase() === account.address.toLowerCase()) {
    actual = actual.sub(moneyUsedForGas);
  }

  expect(change).to.eq(actual)
  return response;
}