const { network } = require("hardhat");
const {
  devolopmentChains,
  DECIMALS,
  INITIAL_ANSWER,
} = require("../helper-hardhat-config");

module.exports = async (hre) => {
  const { deployments, getNamedAccounts } = hre;
  const { deploy, log } = deployments;
  const { deployer } = await getNamedAccounts();
  const currNetwork = network.name;

  if (devolopmentChains.includes(currNetwork)) {
    log("local network...deploying mocks");
    await deploy("MockV3Aggregator", {
      from: deployer,
      log: true,
      args: [DECIMALS, INITIAL_ANSWER],
    });
    log("Mocks deployed");
    log("-------------------------------------------------");
  }
};

module.exports.tags = ["all", "mock"];
