const { assert, expect } = require("chai");
const { network, getNamedAccounts, deployments, ethers } = require("hardhat");
const {
  isCallTrace,
} = require("hardhat/internal/hardhat-network/stack-traces/message-trace");
const {
  developmentChains,
  networkConfig,
} = require("../../helper-hardhat-config");

developmentChains.includes(network.config.chainId)
  ? describe.skip
  : describe("Lottery staging tests", function () {
      let lottery, lotteryEntranceFee, deployer, interval;

      beforeEach(async function () {
        deployer = (await getNamedAccounts()).deployer;

        lottery = await ethers.getContract("lottery", deployer);
        lotteryEntranceFee = await lottery.getEntranceFee();
        interval = await lottery.getInterval();
      });

      describe("fullfillrandomwords", function () {
        it("picks a random winner", async () => {
          //we just need to enter the lottery and set up a litsener for the WinnerPicked event
          //performUpKeep and fulfillrandomwords will be dones by chainlink vrf and chainlink keeper
          const accounts = await ethers.getSigners();
          await new Promise(async (resolve, reject) => {
            lottery.once("WinnerPicked", async () => {
              try {
                const newLen = await lottery.getNumberofPlayers();
                assert.equal(newLen.toString(), "0");
                const winner = await lottery.getRecentWinner();
                assert.equal(winner.toString(), deployer.toString());
                const currstate = await lottery.getLotteryState();
                assert.equal(currstate.toString(), "0");
                console.log("no probs till state compare");
                const currwinnerbalance = await accounts[0].getBalance();
                assert.equal(
                  currwinnerbalance.toString(),
                  prevWinnerBalance.add(lotteryEntranceFee).toString()
                );

                resolve();
              } catch (e) {
                console.log(e);
                reject(e);
              }
            });
            const tx = await lottery.enterLottery({
              value: lotteryEntranceFee,
            });
            await tx.wait(1);
            const prevWinnerBalance = await accounts[0].getBalance();
          });
        });
      });
    });
