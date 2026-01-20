/**
 * Tests for NativeSplitPayments.sol:
 * - pay2 happy paths (2 EOAs, correct balances, correct events)
 * - payMany happy paths (N=1, N=6, repeated recipients)
 * - Validation reverts (InvalidValue, InvalidAmount, ZeroAddress, SelfAddress, InvalidTotal, InvalidLength, LengthMismatch)
 * - Transfer failure (RevertingReceiver)
 * - Deposit prevention (direct send, fallback with value)
 */
import { expect } from "chai";
import { ethers } from "hardhat";
import { NativeSplitPayments, RevertingReceiver, AcceptingReceiver } from "../typechain-types";
import { SignerWithAddress } from "@nomicfoundation/hardhat-ethers/signers";

describe("NativeSplitPayments", function () {
  let splitPayments: NativeSplitPayments;
  let revertingReceiver: RevertingReceiver;
  let acceptingReceiver: AcceptingReceiver;
  let owner: SignerWithAddress;
  let user1: SignerWithAddress;
  let user2: SignerWithAddress;
  let user3: SignerWithAddress;
  let user4: SignerWithAddress;
  let user5: SignerWithAddress;
  let user6: SignerWithAddress;

  const toWei = (n: string) => ethers.parseEther(n);

  beforeEach(async function () {
    [owner, user1, user2, user3, user4, user5, user6] = await ethers.getSigners();

    // Deploy NativeSplitPayments
    const SplitPayments = await ethers.getContractFactory("NativeSplitPayments");
    splitPayments = await SplitPayments.deploy();
    await splitPayments.waitForDeployment();

    // Deploy test helpers
    const RevertingReceiverFactory = await ethers.getContractFactory("RevertingReceiver");
    revertingReceiver = await RevertingReceiverFactory.deploy();
    await revertingReceiver.waitForDeployment();

    const AcceptingReceiverFactory = await ethers.getContractFactory("AcceptingReceiver");
    acceptingReceiver = await AcceptingReceiverFactory.deploy();
    await acceptingReceiver.waitForDeployment();
  });

  // ========= pay2 Happy Paths =========

  describe("pay2 - Happy Paths", function () {
    it("should split payment to 2 EOAs with correct balances and events", async function () {
      const a1 = toWei("0.3");
      const a2 = toWei("0.7");
      const total = a1 + a2;

      const user1BalBefore = await ethers.provider.getBalance(user1.address);
      const user2BalBefore = await ethers.provider.getBalance(user2.address);

      await expect(
        splitPayments.connect(owner).pay2(user1.address, a1, user2.address, a2, { value: total })
      )
        .to.emit(splitPayments, "Payment")
        .withArgs(owner.address, user1.address, a1)
        .and.to.emit(splitPayments, "Payment")
        .withArgs(owner.address, user2.address, a2);

      const user1BalAfter = await ethers.provider.getBalance(user1.address);
      const user2BalAfter = await ethers.provider.getBalance(user2.address);

      expect(user1BalAfter - user1BalBefore).to.equal(a1);
      expect(user2BalAfter - user2BalBefore).to.equal(a2);
    });

    it("should allow same recipient for both payouts", async function () {
      const a1 = toWei("0.5");
      const a2 = toWei("0.5");
      const total = a1 + a2;

      const user1BalBefore = await ethers.provider.getBalance(user1.address);

      await expect(
        splitPayments.connect(owner).pay2(user1.address, a1, user1.address, a2, { value: total })
      )
        .to.emit(splitPayments, "Payment")
        .withArgs(owner.address, user1.address, a1)
        .and.to.emit(splitPayments, "Payment")
        .withArgs(owner.address, user1.address, a2);

      const user1BalAfter = await ethers.provider.getBalance(user1.address);
      expect(user1BalAfter - user1BalBefore).to.equal(total);
    });

    it("should work with contract recipient that accepts ETH", async function () {
      const a1 = toWei("0.4");
      const a2 = toWei("0.6");
      const total = a1 + a2;
      const acceptingReceiverAddress = await acceptingReceiver.getAddress();

      const contractBalBefore = await ethers.provider.getBalance(acceptingReceiverAddress);
      const user1BalBefore = await ethers.provider.getBalance(user1.address);

      await expect(
        splitPayments.connect(owner).pay2(acceptingReceiverAddress, a1, user1.address, a2, { value: total })
      )
        .to.emit(splitPayments, "Payment")
        .withArgs(owner.address, acceptingReceiverAddress, a1);

      const contractBalAfter = await ethers.provider.getBalance(acceptingReceiverAddress);
      const user1BalAfter = await ethers.provider.getBalance(user1.address);

      expect(contractBalAfter - contractBalBefore).to.equal(a1);
      expect(user1BalAfter - user1BalBefore).to.equal(a2);
    });
  });

  // ========= payMany Happy Paths =========

  describe("payMany - Happy Paths", function () {
    it("should work with N=1 recipient", async function () {
      const amount = toWei("1.0");
      const user1BalBefore = await ethers.provider.getBalance(user1.address);

      await expect(
        splitPayments.connect(owner).payMany([user1.address], [amount], { value: amount })
      )
        .to.emit(splitPayments, "Payment")
        .withArgs(owner.address, user1.address, amount);

      const user1BalAfter = await ethers.provider.getBalance(user1.address);
      expect(user1BalAfter - user1BalBefore).to.equal(amount);
    });

    it("should work with N=6 recipients", async function () {
      const amounts = [
        toWei("0.1"),
        toWei("0.2"),
        toWei("0.15"),
        toWei("0.25"),
        toWei("0.1"),
        toWei("0.2"),
      ];
      const recipients = [
        user1.address,
        user2.address,
        user3.address,
        user4.address,
        user5.address,
        user6.address,
      ];
      const total = amounts.reduce((a, b) => a + b, 0n);

      const balancesBefore = await Promise.all(
        recipients.map((r) => ethers.provider.getBalance(r))
      );

      const tx = await splitPayments
        .connect(owner)
        .payMany(recipients, amounts, { value: total });

      // Check all events
      for (let i = 0; i < recipients.length; i++) {
        await expect(tx)
          .to.emit(splitPayments, "Payment")
          .withArgs(owner.address, recipients[i], amounts[i]);
      }

      const balancesAfter = await Promise.all(
        recipients.map((r) => ethers.provider.getBalance(r))
      );

      for (let i = 0; i < recipients.length; i++) {
        expect(balancesAfter[i] - balancesBefore[i]).to.equal(amounts[i]);
      }
    });

    it("should allow repeated recipient addresses with correct sum", async function () {
      const a1 = toWei("0.3");
      const a2 = toWei("0.4");
      const a3 = toWei("0.3");
      const total = a1 + a2 + a3;

      // user1 appears twice
      const recipients = [user1.address, user2.address, user1.address];
      const amounts = [a1, a2, a3];

      const user1BalBefore = await ethers.provider.getBalance(user1.address);
      const user2BalBefore = await ethers.provider.getBalance(user2.address);

      const tx = await splitPayments
        .connect(owner)
        .payMany(recipients, amounts, { value: total });

      // Check events
      await expect(tx)
        .to.emit(splitPayments, "Payment")
        .withArgs(owner.address, user1.address, a1);
      await expect(tx)
        .to.emit(splitPayments, "Payment")
        .withArgs(owner.address, user2.address, a2);
      await expect(tx)
        .to.emit(splitPayments, "Payment")
        .withArgs(owner.address, user1.address, a3);

      const user1BalAfter = await ethers.provider.getBalance(user1.address);
      const user2BalAfter = await ethers.provider.getBalance(user2.address);

      expect(user1BalAfter - user1BalBefore).to.equal(a1 + a3);
      expect(user2BalAfter - user2BalBefore).to.equal(a2);
    });

    it("should work with N=3 recipients", async function () {
      const amounts = [toWei("0.2"), toWei("0.3"), toWei("0.5")];
      const recipients = [user1.address, user2.address, user3.address];
      const total = amounts.reduce((a, b) => a + b, 0n);

      const tx = await splitPayments
        .connect(owner)
        .payMany(recipients, amounts, { value: total });

      for (let i = 0; i < recipients.length; i++) {
        await expect(tx)
          .to.emit(splitPayments, "Payment")
          .withArgs(owner.address, recipients[i], amounts[i]);
      }
    });
  });

  // ========= Validation Reverts =========

  describe("Validation Reverts", function () {
    describe("InvalidValue - msg.value == 0", function () {
      it("pay2 reverts with InvalidValue when msg.value is 0", async function () {
        await expect(
          splitPayments.pay2(user1.address, toWei("0.5"), user2.address, toWei("0.5"), {
            value: 0,
          })
        ).to.be.revertedWithCustomError(splitPayments, "InvalidValue");
      });

      it("payMany reverts with InvalidValue when msg.value is 0", async function () {
        await expect(
          splitPayments.payMany([user1.address], [toWei("1.0")], { value: 0 })
        ).to.be.revertedWithCustomError(splitPayments, "InvalidValue");
      });
    });

    describe("InvalidAmount - any amount == 0", function () {
      it("pay2 reverts with InvalidAmount when a1 is 0", async function () {
        await expect(
          splitPayments.pay2(user1.address, 0, user2.address, toWei("1.0"), {
            value: toWei("1.0"),
          })
        ).to.be.revertedWithCustomError(splitPayments, "InvalidAmount");
      });

      it("pay2 reverts with InvalidAmount when a2 is 0", async function () {
        await expect(
          splitPayments.pay2(user1.address, toWei("1.0"), user2.address, 0, {
            value: toWei("1.0"),
          })
        ).to.be.revertedWithCustomError(splitPayments, "InvalidAmount");
      });

      it("payMany reverts with InvalidAmount when any amount is 0", async function () {
        await expect(
          splitPayments.payMany(
            [user1.address, user2.address],
            [toWei("0.5"), 0],
            { value: toWei("0.5") }
          )
        ).to.be.revertedWithCustomError(splitPayments, "InvalidAmount");
      });
    });

    describe("ZeroAddress - any recipient == address(0)", function () {
      it("pay2 reverts with ZeroAddress when to1 is address(0)", async function () {
        await expect(
          splitPayments.pay2(
            ethers.ZeroAddress,
            toWei("0.5"),
            user2.address,
            toWei("0.5"),
            { value: toWei("1.0") }
          )
        ).to.be.revertedWithCustomError(splitPayments, "ZeroAddress");
      });

      it("pay2 reverts with ZeroAddress when to2 is address(0)", async function () {
        await expect(
          splitPayments.pay2(
            user1.address,
            toWei("0.5"),
            ethers.ZeroAddress,
            toWei("0.5"),
            { value: toWei("1.0") }
          )
        ).to.be.revertedWithCustomError(splitPayments, "ZeroAddress");
      });

      it("payMany reverts with ZeroAddress when any recipient is address(0)", async function () {
        await expect(
          splitPayments.payMany(
            [user1.address, ethers.ZeroAddress],
            [toWei("0.5"), toWei("0.5")],
            { value: toWei("1.0") }
          )
        ).to.be.revertedWithCustomError(splitPayments, "ZeroAddress");
      });
    });

    describe("SelfAddress - any recipient == address(this)", function () {
      it("pay2 reverts with SelfAddress when to1 is contract address", async function () {
        const contractAddress = await splitPayments.getAddress();
        await expect(
          splitPayments.pay2(
            contractAddress,
            toWei("0.5"),
            user2.address,
            toWei("0.5"),
            { value: toWei("1.0") }
          )
        ).to.be.revertedWithCustomError(splitPayments, "SelfAddress");
      });

      it("pay2 reverts with SelfAddress when to2 is contract address", async function () {
        const contractAddress = await splitPayments.getAddress();
        await expect(
          splitPayments.pay2(
            user1.address,
            toWei("0.5"),
            contractAddress,
            toWei("0.5"),
            { value: toWei("1.0") }
          )
        ).to.be.revertedWithCustomError(splitPayments, "SelfAddress");
      });

      it("payMany reverts with SelfAddress when any recipient is contract address", async function () {
        const contractAddress = await splitPayments.getAddress();
        await expect(
          splitPayments.payMany(
            [user1.address, contractAddress],
            [toWei("0.5"), toWei("0.5")],
            { value: toWei("1.0") }
          )
        ).to.be.revertedWithCustomError(splitPayments, "SelfAddress");
      });
    });

    describe("InvalidTotal - sum(amounts) != msg.value", function () {
      it("pay2 reverts with InvalidTotal when sum is less than msg.value", async function () {
        await expect(
          splitPayments.pay2(
            user1.address,
            toWei("0.3"),
            user2.address,
            toWei("0.3"),
            { value: toWei("1.0") }
          )
        ).to.be.revertedWithCustomError(splitPayments, "InvalidTotal");
      });

      it("pay2 reverts with InvalidTotal when sum is greater than msg.value", async function () {
        await expect(
          splitPayments.pay2(
            user1.address,
            toWei("0.7"),
            user2.address,
            toWei("0.7"),
            { value: toWei("1.0") }
          )
        ).to.be.revertedWithCustomError(splitPayments, "InvalidTotal");
      });

      it("payMany reverts with InvalidTotal when sum is less than msg.value", async function () {
        await expect(
          splitPayments.payMany(
            [user1.address, user2.address],
            [toWei("0.3"), toWei("0.3")],
            { value: toWei("1.0") }
          )
        ).to.be.revertedWithCustomError(splitPayments, "InvalidTotal");
      });

      it("payMany reverts with InvalidTotal when sum is greater than msg.value", async function () {
        await expect(
          splitPayments.payMany(
            [user1.address, user2.address],
            [toWei("0.7"), toWei("0.7")],
            { value: toWei("1.0") }
          )
        ).to.be.revertedWithCustomError(splitPayments, "InvalidTotal");
      });
    });

    describe("InvalidLength - payMany length 0 or > 6", function () {
      it("payMany reverts with InvalidLength when length is 0", async function () {
        await expect(
          splitPayments.payMany([], [], { value: toWei("1.0") })
        ).to.be.revertedWithCustomError(splitPayments, "InvalidLength");
      });

      it("payMany reverts with InvalidLength when length is 7", async function () {
        const recipients = [
          user1.address,
          user2.address,
          user3.address,
          user4.address,
          user5.address,
          user6.address,
          owner.address,
        ];
        const amounts = Array(7).fill(toWei("0.1"));
        const total = toWei("0.7");

        await expect(
          splitPayments.payMany(recipients, amounts, { value: total })
        ).to.be.revertedWithCustomError(splitPayments, "InvalidLength");
      });
    });

    describe("LengthMismatch - recipients.length != amounts.length", function () {
      it("payMany reverts with LengthMismatch when recipients > amounts", async function () {
        await expect(
          splitPayments.payMany(
            [user1.address, user2.address],
            [toWei("1.0")],
            { value: toWei("1.0") }
          )
        ).to.be.revertedWithCustomError(splitPayments, "LengthMismatch");
      });

      it("payMany reverts with LengthMismatch when amounts > recipients", async function () {
        await expect(
          splitPayments.payMany(
            [user1.address],
            [toWei("0.5"), toWei("0.5")],
            { value: toWei("1.0") }
          )
        ).to.be.revertedWithCustomError(splitPayments, "LengthMismatch");
      });
    });
  });

  // ========= Transfer Failure =========

  describe("Transfer Failure", function () {
    it("pay2 reverts with TransferFailed when first recipient reverts", async function () {
      const revertingAddress = await revertingReceiver.getAddress();
      
      await expect(
        splitPayments.pay2(
          revertingAddress,
          toWei("0.5"),
          user2.address,
          toWei("0.5"),
          { value: toWei("1.0") }
        )
      )
        .to.be.revertedWithCustomError(splitPayments, "TransferFailed")
        .withArgs(revertingAddress, toWei("0.5"));
    });

    it("pay2 reverts with TransferFailed when second recipient reverts (no partial payout)", async function () {
      const revertingAddress = await revertingReceiver.getAddress();
      const user1BalBefore = await ethers.provider.getBalance(user1.address);

      await expect(
        splitPayments.pay2(
          user1.address,
          toWei("0.5"),
          revertingAddress,
          toWei("0.5"),
          { value: toWei("1.0") }
        )
      )
        .to.be.revertedWithCustomError(splitPayments, "TransferFailed")
        .withArgs(revertingAddress, toWei("0.5"));

      // Verify no partial payout - user1 balance unchanged
      const user1BalAfter = await ethers.provider.getBalance(user1.address);
      expect(user1BalAfter).to.equal(user1BalBefore);
    });

    it("payMany reverts with TransferFailed when any recipient reverts (no partial payout)", async function () {
      const revertingAddress = await revertingReceiver.getAddress();
      const user1BalBefore = await ethers.provider.getBalance(user1.address);
      const user2BalBefore = await ethers.provider.getBalance(user2.address);

      await expect(
        splitPayments.payMany(
          [user1.address, user2.address, revertingAddress],
          [toWei("0.3"), toWei("0.3"), toWei("0.4")],
          { value: toWei("1.0") }
        )
      )
        .to.be.revertedWithCustomError(splitPayments, "TransferFailed")
        .withArgs(revertingAddress, toWei("0.4"));

      // Verify no partial payout - all balances unchanged
      const user1BalAfter = await ethers.provider.getBalance(user1.address);
      const user2BalAfter = await ethers.provider.getBalance(user2.address);
      expect(user1BalAfter).to.equal(user1BalBefore);
      expect(user2BalAfter).to.equal(user2BalBefore);
    });
  });

  // ========= Deposit Prevention =========

  describe("Deposit Prevention", function () {
    it("direct send to contract address reverts", async function () {
      const contractAddress = await splitPayments.getAddress();
      
      await expect(
        owner.sendTransaction({
          to: contractAddress,
          value: toWei("1.0"),
        })
      ).to.be.revertedWithCustomError(splitPayments, "InvalidValue");
    });

    it("call with unknown selector and value reverts", async function () {
      const contractAddress = await splitPayments.getAddress();
      
      // Call with random function selector
      await expect(
        owner.sendTransaction({
          to: contractAddress,
          value: toWei("1.0"),
          data: "0x12345678", // random selector
        })
      ).to.be.revertedWithCustomError(splitPayments, "InvalidValue");
    });

    it("contract has zero balance after successful operations", async function () {
      const contractAddress = await splitPayments.getAddress();

      // Perform a successful pay2
      await splitPayments.pay2(
        user1.address,
        toWei("0.5"),
        user2.address,
        toWei("0.5"),
        { value: toWei("1.0") }
      );

      const contractBalance = await ethers.provider.getBalance(contractAddress);
      expect(contractBalance).to.equal(0n);
    });
  });

  // ========= Edge Cases =========

  describe("Edge Cases", function () {
    it("pay2 works with minimum wei amounts", async function () {
      const a1 = 1n;
      const a2 = 1n;
      const total = 2n;

      const user1BalBefore = await ethers.provider.getBalance(user1.address);
      const user2BalBefore = await ethers.provider.getBalance(user2.address);

      await splitPayments.pay2(user1.address, a1, user2.address, a2, { value: total });

      const user1BalAfter = await ethers.provider.getBalance(user1.address);
      const user2BalAfter = await ethers.provider.getBalance(user2.address);

      expect(user1BalAfter - user1BalBefore).to.equal(a1);
      expect(user2BalAfter - user2BalBefore).to.equal(a2);
    });

    it("payMany works with all same recipients", async function () {
      const amount = toWei("0.25");
      const recipients = [user1.address, user1.address, user1.address, user1.address];
      const amounts = [amount, amount, amount, amount];
      const total = amount * 4n;

      const user1BalBefore = await ethers.provider.getBalance(user1.address);

      await splitPayments.payMany(recipients, amounts, { value: total });

      const user1BalAfter = await ethers.provider.getBalance(user1.address);
      expect(user1BalAfter - user1BalBefore).to.equal(total);
    });

    it("any user can call payment methods (permissionless)", async function () {
      // user1 (not owner) can call pay2
      await expect(
        splitPayments.connect(user1).pay2(
          user2.address,
          toWei("0.5"),
          user3.address,
          toWei("0.5"),
          { value: toWei("1.0") }
        )
      )
        .to.emit(splitPayments, "Payment")
        .withArgs(user1.address, user2.address, toWei("0.5"));

      // user2 can call payMany
      await expect(
        splitPayments.connect(user2).payMany(
          [user1.address, user3.address],
          [toWei("0.3"), toWei("0.7")],
          { value: toWei("1.0") }
        )
      )
        .to.emit(splitPayments, "Payment")
        .withArgs(user2.address, user1.address, toWei("0.3"));
    });
  });
});
