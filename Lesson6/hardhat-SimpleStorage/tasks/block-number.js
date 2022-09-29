const { task } = require("hardhat/config");

task("block-number", "Prints the current block number of the chain").setAction(
  async (taskargs, hre) => {
    const blockNumber = await hre.ethers.provider.getBlockNumber();
    console.log(`The current block is ${blockNumber}`);
  }
);
