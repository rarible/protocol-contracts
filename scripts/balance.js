async function verifyBalanceChangeReturnTx(web3, account, change, todo) {
  const BN = web3.utils.BN;
  
  let before = new BN(await web3.eth.getBalance(account));
  const tx = await todo();

  let after = new BN(await web3.eth.getBalance(account));
  let actual = before.sub(after);

  const gasUsed = new BN(tx.receipt.gasUsed);
  const effectiveGasPrice = new BN(tx.receipt.effectiveGasPrice)

  const txSender = web3.utils.toChecksumAddress(tx.receipt.from);
  const moneyUsedForGas = gasUsed.mul(effectiveGasPrice);

  if (txSender === web3.utils.toChecksumAddress(account)) {
    actual = actual.sub(moneyUsedForGas);
  }

  assert.equal(actual, change);

  return tx;
}

module.exports = { verifyBalanceChangeReturnTx }
