import { expect } from "chai";
import { network } from "hardhat";
import { anyValue } from "@nomicfoundation/hardhat-ethers-chai-matchers/withArgs";
import type { Contract, Signer } from "ethers";

const { ethers } = await network.create();

describe("Tip", function () {
  let owner: Signer;
  let tipper: Signer;
  let tipper2: Signer;
  let tipJar: Contract;

  beforeEach(async function () {
    [owner, tipper, tipper2] = await ethers.getSigners();
    tipJar = await ethers.deployContract("Tip");
  });

  describe("deployment", function () {
    it("sets the deployer as the owner", async function () {
      expect(await tipJar.owner()).to.equal(await owner.getAddress());
    });

    it("starts with no tips and zero balance", async function () {
      expect(await tipJar.getTipCount()).to.equal(0n);
      expect(await tipJar.getTotalTips()).to.equal(0n);
    });
  });

  describe("tipping", function () {
    it("rejects a zero-value tip", async function () {
      await expect(tipJar.connect(tipper).tip({ value: 0 })).to.be.revertedWith(
        "TipJar: tip amount must be greater than zero"
      );
    });

    it("accepts a tip and records it", async function () {
      const amount = ethers.parseEther("0.1");

      await expect(tipJar.connect(tipper).tip({ value: amount }))
        .to.emit(tipJar, "Tipped")
        .withArgs(await tipper.getAddress(), amount, anyValue);

      expect(await tipJar.getTipCount()).to.equal(1n);
      expect(await tipJar.getTotalTips()).to.equal(amount);
      expect(await tipJar.owner()).to.equal(await owner.getAddress());
    });

    it("keeps the contract balance equal to the tips received", async function () {
      const amount = ethers.parseEther("0.25");
      await tipJar.connect(tipper).tip({ value: amount });

      expect(await ethers.provider.getBalance(await tipJar.getAddress())).to.equal(amount);
    });

    it("accumulates tips per user", async function () {
      await tipJar.connect(tipper).tip({ value: ethers.parseEther("0.1") });
      await tipJar.connect(tipper).tip({ value: ethers.parseEther("0.2") });
      await tipJar.connect(tipper2).tip({ value: ethers.parseEther("0.5") });

      expect(await tipJar.getUserTipCount(await tipper.getAddress())).to.equal(
        ethers.parseEther("0.3")
      );
      expect(await tipJar.getUserTipCount(await tipper2.getAddress())).to.equal(
        ethers.parseEther("0.5")
      );
      expect(await tipJar.getTipCount()).to.equal(3n);
    });

    it("returns all tips through getTips()", async function () {
      const amount = ethers.parseEther("0.1");
      await tipJar.connect(tipper).tip({ value: amount });
      await tipJar.connect(tipper2).tip({ value: ethers.parseEther("0.05") });

      const [fromAddresses, amounts, timestamps] = await tipJar.getTips();

      expect(fromAddresses).to.deep.equal([
        await tipper.getAddress(),
        await tipper2.getAddress(),
      ]);
      expect(amounts).to.deep.equal([amount, ethers.parseEther("0.05")]);
      expect(timestamps[0]).to.be.greaterThan(0n);
      expect(timestamps[1]).to.be.greaterThan(0n);
    });

    it("updates the balance when several people tip", async function () {
      await tipJar.connect(tipper).tip({ value: ethers.parseEther("0.1") });
      await tipJar.connect(tipper2).tip({ value: ethers.parseEther("0.4") });

      expect(await tipJar.getTotalTips()).to.equal(ethers.parseEther("0.5"));
    });
  });

  describe("withdrawals", function () {
    it("lets the owner withdraw the whole balance", async function () {
      const amount = ethers.parseEther("0.3");
      await tipJar.connect(tipper).tip({ value: amount });

      await expect(tipJar.withdraw())
        .to.emit(tipJar, "Withdrawn")
        .withArgs(await owner.getAddress(), amount);

      expect(await tipJar.getTotalTips()).to.equal(0n);
    });

    it("rejects withdrawals from non-owners", async function () {
      await tipJar.connect(tipper).tip({ value: ethers.parseEther("0.1") });

      await expect(tipJar.connect(tipper).withdraw()).to.be.revertedWith(
        "TipJar: caller is not the owner"
      );
    });

    it("rejects withdrawals when the jar is empty", async function () {
      await expect(tipJar.withdraw()).to.be.revertedWith(
        "TipJar: contract has no funds to withdraw"
      );
    });
  });
});
