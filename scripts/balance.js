async function verifyBalanceChangeReturnTx(web3, account, change, todo) {
  const BN = web3.utils.BN;

  let before = new BN(await web3.eth.getBalance(account));
  const tx = await todo();

  let after = new BN(await web3.eth.getBalance(account));
  let actual = before.sub(after);

  const gasUsed = new BN(tx.receipt.gasUsed);
  const effectiveGasPrice = new BN(tx.receipt.effectiveGasPrice);

  const txSender = web3.utils.toChecksumAddress(tx.receipt.from);
  const moneyUsedForGas = gasUsed.mul(effectiveGasPrice);

  if (txSender === web3.utils.toChecksumAddress(account)) {
    actual = actual.sub(moneyUsedForGas);
  }

  assert.equal(actual, change);

  return tx;
}

async function verifyBalanceChangeReturnTxEthers(
  ethers,
  account,
  change,
  todo
) {
  const BN = ethers.BigNumber;

  let before = BN.from(await ethers.provider.getBalance(account));
  const tx = await todo();

  let after = BN.from(await ethers.provider.getBalance(account));
  let actual = before.sub(after);

  if (!tx || !tx.wait) {
    throw new Error("Transaction receipt is undefined or invalid");
  }

  const receipt = await tx.wait();

  const gasUsed = receipt.gasUsed;
  const effectiveGasPrice = tx.gasPrice || receipt.effectiveGasPrice;

  const txSender = ethers.utils.getAddress(receipt.from);
  const moneyUsedForGas = gasUsed.mul(effectiveGasPrice);

  if (txSender === ethers.utils.getAddress(account)) {
    actual = actual.sub(moneyUsedForGas);
  }

  assert.equal(change.toString(), actual.toString());

  return tx;
}

module.exports = {
  verifyBalanceChangeReturnTx,
  verifyBalanceChangeReturnTxEthers,
};
