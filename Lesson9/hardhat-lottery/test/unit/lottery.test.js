const { assert, expect } = require("chai");
const { network, getNamedAccounts, deployments, ethers } = require("hardhat");
const {
  developmentChains,
  networkConfig,
} = require("../../helper-hardhat-config");

!developmentChains.includes(network.config.chainId)
  ? describe.skip
  : describe("Lottery unit tests", function () {
      let lottery, mockvrf, lotteryEntranceFee, deployer, interval;

      beforeEach(async function () {
        deployer = (await getNamedAccounts()).deployer;
        await deployments.fixture(["all"]);
        lottery = await ethers.getContract("lottery", deployer);
        mockvrf = await ethers.getContract("VRFCoordinatorV2Mock", deployer);
        lotteryEntranceFee = await lottery.getEntranceFee();
        interval = await lottery.getInterval();
      });

      describe("constructor", function () {
        it("initializes the lottery correctly", async function () {
          const lotterystate = await lottery.getLotteryState();
          assert.equal(lotterystate.toString(), "0");
          assert.equal(
            interval,
            networkConfig[network.config.chainId]["interval"]
          );
        });
      });

      describe("enter lottery", function () {
        it("reverts when not paid enough fees", async function () {
          await expect(lottery.enterLottery()).to.be.revertedWith(
            "Lottery__NotEnoughETH"
          );
        });

        it("records every entering player", async function () {
          await lottery.enterLottery({ value: lotteryEntranceFee });
          const playerInContract = await lottery.getPlayer(0);
          assert.equal(playerInContract, deployer);
        });

        it("emits event of entering the lottery", async function () {
          await expect(
            lottery.enterLottery({ value: lotteryEntranceFee })
          ).to.emit(lottery, "LotteryEnter");
        });

        it("doesn't allow player to enter when it is calculating", async function () {
          await lottery.enterLottery({ value: lotteryEntranceFee });
          await network.provider.send("evm_increaseTime", [
            interval.toNumber() + 1,
          ]);

          await network.provider.send("evm_mine", []);
          await lottery.performUpkeep([]);
          await expect(
            lottery.enterLottery({ value: lotteryEntranceFee })
          ).to.be.revertedWith("Lottery__NotOpen");
        });
      });

      describe("checkUpkeep", function () {
        it("returns false if people haven't sent any ETH", async () => {
          await network.provider.send("evm_increaseTime", [
            interval.toNumber() + 1,
          ]);
          await network.provider.request({ method: "evm_mine", params: [] });
          const { upkeepNeeded } = await lottery.callStatic.checkUpkeep("0x"); // upkeepNeeded = (timePassed && isOpen && hasBalance && hasPlayers)
          assert(!upkeepNeeded);
        });
        it("returns false if lottery isn't open", async () => {
          await lottery.enterLottery({ value: lotteryEntranceFee });
          await network.provider.send("evm_increaseTime", [
            interval.toNumber() + 1,
          ]);
          await network.provider.request({ method: "evm_mine", params: [] });
          await lottery.performUpkeep([]); // changes the state to calculating
          const lotteryState = await lottery.getLotteryState(); // stores the new state
          const { upkeepNeeded } = await lottery.callStatic.checkUpkeep("0x"); // callstatic enables us to fake demo the function execution without sending trasactions
          assert.equal(lotteryState.toString() == "1", upkeepNeeded == false);
        });

        it("returns false if enough time has not passed", async function () {
          const lotttime = await lottery.getTimeStamp();

          /*          const blockNumBefore = await ethers.provider.getBlockNumber();
          console.log(blockNumBefore);
          const blockBefore = await ethers.provider.getBlock(blockNumBefore);
          console.log(blockBefore.timestamp);

          const block0 = await ethers.provider.getBlock(0);
          const block1 = await ethers.provider.getBlock(1);
          const block2 = await ethers.provider.getBlock(2);
          const block3 = await ethers.provider.getBlock(3);
          const fullblock3 = await ethers.provider.getBlockWithTransactions(3);

          const block4 = await ethers.provider.getBlock(4);
          const fullblock4 = await ethers.provider.getBlockWithTransactions(4);
          console.log(block0);
          console.log(block1);
          console.log(block2);
          console.log(block3);
          console.log(block4);
          console.log(fullblock3);
          console.log(fullblock4);
*/
          await lottery.enterLottery({ value: lotteryEntranceFee });
          await network.provider.send("evm_increaseTime", [
            interval.toNumber() - 3,
          ]);
          await network.provider.request({ method: "evm_mine", params: [] });
          const { upkeepNeeded } = await lottery.callStatic.checkUpkeep([]);
          assert.equal(upkeepNeeded, false);
        });
      });
      describe("performUpKeep", function () {
        it("perfroms upkeep only if needed", async () => {
          //we check the case when time interval is not met
          await lottery.enterLottery({ value: lotteryEntranceFee });
          expect(lottery.performUpkeep("0x")).to.be.revertedWith(
            "Lottery__UpKeepNotNeeded"
          );
        });

        it("performs upkeep when upkeen is needed", async () => {
          await lottery.enterLottery({ value: lotteryEntranceFee });
          await ethers.provider.send("evm_increaseTime", [
            interval.toNumber() + 1,
          ]);
          await ethers.provider.send("evm_mine", []);
          const tx = await lottery.performUpkeep("0x");
          assert(tx);
        });

        it("updates the lottery state,calls the vrfcoordinator and emits requestid", async function () {
          await lottery.enterLottery({ value: lotteryEntranceFee });
          await ethers.provider.send("evm_increaseTime", [
            interval.toNumber() + 1,
          ]);
          await ethers.provider.send("evm_mine", []);
          const tx = await lottery.performUpkeep("0x");
          const txreceipt = await tx.wait();
          assert(txreceipt.events[1].args.requestId > 0);
          const currstate = await lottery.getLotteryState();
          assert.equal(currstate.toString(), "1");
        });
      });

      describe("fulfillRandomWords", function () {
        beforeEach(async function () {
          await lottery.enterLottery({ value: lotteryEntranceFee });
          await ethers.provider.send("evm_increaseTime", [
            interval.toNumber() + 1,
          ]);
          await ethers.provider.send("evm_mine", []);
        });

        it("picks a random winner only when a request is made to pick", async () => {
          //the random number is delivered to consumer conract as follows :
          //1.whenever a function that needs a random number is evoked,it calls the requestrandomwords function of the
          //vrf cordinator with its address and relevant data
          //2.the vrf coordinator generates a requestid.It emits an event with all the passed parameter and also adds the
          //address of the requested contract and the requestId.
          //3.the off chain vrf service guy sees this....he calculates the random number and calls the fullfillRandomWords with
          //data including the random number and the senders address and requestId
          //4.in the fullfillRandomWords function of the vrf coordinator the random number is verified.....this function then calls the
          //rawFullfillRandomWords function in the consumer contract with the requestId and randomWords as the parameters
          //5.the rawFullFillRandomWords then calls the fullfillRandomWords in the consumer contract where our callback code is return
          //in mock , there is no offchain vrf service is there to supply the random words and call the fullfillRandomWords of the coordinator,
          //the mock cordinator hence has its fulfillRandomWords implemented with parameters requestId,consumerId and optional random words i believe defaulted to 0.

          //here we can check if the mockvrf cordinator is working correctly
          expect(
            mockvrf.fulfillRandomWords(0, lottery.address)
          ).to.be.revertedWith("nonexistent request");

          expect(
            mockvrf.fulfillRandomWords(241, lottery.address)
          ).to.be.revertedWith("nonexistent request");
        });

        it("our callback fulfillRandomWords is correct for single player", async () => {
          /**we pick the winner
           * transfer money to his account
           * reset the players list
           */
          //we will try with single player
          const tx = await lottery.performUpkeep("0x");
          const txreceipt = await tx.wait(1);
          const requestId = txreceipt.events[1].args.requestId;

          const subId = await lottery.getSubscriptionId();
          await mockvrf.fundSubscription(subId, ethers.utils.parseEther("100"));
          const numOfPlayers = await lottery.getNumberofPlayers();
          const accounts = await ethers.getSigners();
          const prevWinnerBalance = await accounts[0].getBalance();
          const prevLotBalance = await ethers.provider.getBalance(
            lottery.address
          );
          const mockvrfaccount1 = await ethers.getContract(
            "VRFCoordinatorV2Mock",
            accounts[1]
          );
          await mockvrfaccount1.fulfillRandomWords(requestId, lottery.address);

          //wait till the fulfillRandomWords in lottery contract is completed
          //we can know this by listening to the winnerpicked event emmited
          await new Promise(async (resolve, reject) => {
            lottery.once("WinnerPicked", async () => {
              try {
                const newLen = await lottery.getNumberofPlayers();
                assert.equal(newLen.toString(), "0");
                const winner = await lottery.getRecentWinner();
                assert.equal(winner.toString(), deployer.toString());
                const currstate = await lottery.getLotteryState();
                assert.equal(currstate.toString(), "0");
                //check for money send to winners account
                const currlotbalance = await ethers.provider.getBalance(
                  lottery.address
                );
                const currWinnerBalance = await accounts[0].getBalance();
                assert.equal(currlotbalance, 0);
                assert.equal(
                  currWinnerBalance.toString(),
                  prevLotBalance.add(prevWinnerBalance).toString()
                );
              } catch (e) {
                reject(e);
              }
              resolve();
            });
          });
        });
        it("our fullfillrandowrds works correctly when multiple players are there", async () => {
          const accounts = await ethers.getSigners();
          const numofEntrants = 5;
          //our deployer already entered
          for (let i = 1; i < numofEntrants; i++) {
            const connected = await lottery.connect(accounts[i]);
            await connected.enterLottery({ value: lotteryEntranceFee });
          }

          const tx = await lottery.performUpkeep("0x");
          const receipt = await tx.wait(1);
          const requestId = await receipt.events[1].args.requestId;

          const prevbalances = new Map();
          for (let i = 0; i < numofEntrants; i++) {
            const prev = await ethers.provider.getBalance(accounts[i].address);
            prevbalances.set(accounts[i].address, prev);
          }

          const lotprevbalance = await ethers.provider.getBalance(
            lottery.address
          );

          //the fullfillrandomwords of the mockvrf coordinator checks whether enough balance is there in the associated subsription
          const subId = await lottery.getSubscriptionId();
          await mockvrf.fundSubscription(subId, ethers.utils.parseEther("100"));

          //now our fullfillRandomwords will be called and winner will be selected
          //we can listen for the winnerpicked event

          await new Promise(async (resolve, reject) => {
            lottery.once("WinnerPicked", async function () {
              try {
                const newLen = await lottery.getNumberofPlayers();
                assert.equal(newLen.toString(), "0");

                const currstate = await lottery.getLotteryState();
                assert.equal(currstate.toString(), "0");
                const lotcurrbalance = await ethers.provider.getBalance(
                  lottery.address
                );
                assert.equal(lotcurrbalance.toString(), "0");
                const winner = await lottery.getRecentWinner();
                //check if fund has been transferred correctly
                const currWinnerBalance = await ethers.provider.getBalance(
                  winner
                );
                const prevWinnerBalance = prevbalances.get(winner);
                assert.equal(
                  currWinnerBalance.toString(),
                  prevWinnerBalance.add(lotprevbalance).toString()
                );
                resolve();
              } catch (e) {
                reject(e);
              }
            });
            await mockvrf.fulfillRandomWords(requestId, lottery.address);
          });
        });
      });
    });
