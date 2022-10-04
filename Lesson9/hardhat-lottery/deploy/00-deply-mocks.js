const { network, ethers } = require("hardhat");

module.exports = async function (hre) {
  const { deployments, getNamedAccounts } = hre;
  const { deploy, log } = deployments;
  const { deployer } = await getNamedAccounts();
  const { developmentChains } = require("../helper-hardhat-config.js");
  const chainId = network.config.chainId;

  if (chainId == 31337) {
    log("in developmentchain......deploying mocks");
    const BASE_FEE = ethers.utils.parseEther("0.25");
    const GAS_PRICE_LINK = 1e9;
    const args = [BASE_FEE, GAS_PRICE_LINK];

    log("hello");

    await deploy("VRFCoordinatorV2Mock", {
      from: deployer,
      args: args,
      log: true,
    });

    log("done.....................................");
  }
};

module.exports.tags = ["all", "local"];
