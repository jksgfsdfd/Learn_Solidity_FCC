const { assert, expect } = require("chai");
const { deployments, ethers, getNamedAccounts } = require("hardhat");
const { devolopmentChains } = require("../../helper-hardhat-config");

!devolopmentChains.includes(network.name)
  ? describe.skip
  : describe("FundMe", function () {
      let deployer;
      let fundme;
      let mockv3aggregator;
      const sendValue = ethers.utils.parseEther("1");
      beforeEach(async () => {
        deployer = (await getNamedAccounts()).deployer;
        await deployments.fixture(["all"]);
        fundme = await ethers.getContract("FundMe", deployer);
        mockv3aggregator = await ethers.getContract(
          "MockV3Aggregator",
          deployer
        );
      });

      describe("constructor", function () {
        it("sets the aggregator address correctly", async () => {
          const response = await fundme.getpriceFeed();
          assert.equal(response, mockv3aggregator.address);
        });
      });

      describe("fund", function () {
        it("Fails if minimum amount is not send", async () => {
          await expect(fundme.fund()).to.be.revertedWith(
            "You need to spend more ETH!"
          );
        });

        it("updates the amount funded data structure", async () => {
          await fundme.fund({ value: sendValue });
          const response = await fundme.getAddressToAmountFunded(deployer);
          assert.equal(response.toString(), sendValue.toString());
        });

        it("updates the funders data structure", async () => {
          await fundme.fund({ value: sendValue });
          const response = await fundme.getFunder(0);
          assert.equal(response, deployer);
        });
      });

      describe("withdraw", function () {
        beforeEach(async () => {
          await fundme.fund({ value: sendValue });
        });

        it("withdraws correctly", async () => {
          const accounts = await ethers.getSigners();
          for (i = 1; i < 5; i++) {
            const fundmeConnectednewDeployer = await fundme.connect(
              accounts[i]
            );
            await fundmeConnectednewDeployer.fund({ value: sendValue });
          }

          const startingFundmeBalance = await fundme.provider.getBalance(
            fundme.address
          );
          const startingDeployerBalance = await fundme.provider.getBalance(
            deployer
          );

          const transactionResponse = await fundme.cheaperWithdraw();
          const transactionReceipt = await transactionResponse.wait();
          const { gasUsed, effectiveGasPrice } = transactionReceipt;
          const withdrawcost = gasUsed.mul(effectiveGasPrice);

          const endingFundmeBalance = await fundme.provider.getBalance(
            fundme.address
          );
          const endingDeployerBalance = await fundme.provider.getBalance(
            deployer
          );

          assert.equal(endingFundmeBalance, 0);
          assert.equal(
            startingFundmeBalance.add(startingDeployerBalance).toString(),
            endingDeployerBalance.add(withdrawcost).toString()
          );

          //the funders list will be cleared and made empty
          await expect(fundme.getFunder(0)).to.be.reverted;

          for (i = 1; i < 5; i++) {
            assert.equal(
              await fundme.getAddressToAmountFunded(accounts[i].address),
              0
            );
          }
        });

        it("Only allows owner to withdraw", async () => {
          const accounts = await ethers.getSigners();
          const fundmediffaccount = await fundme.connect(accounts[1]);

          await expect(fundmediffaccount.cheaperWithdraw()).to.be.revertedWith(
            "NotOwner"
          );
        });
      });
    });
