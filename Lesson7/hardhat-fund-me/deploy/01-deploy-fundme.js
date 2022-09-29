const { network } = require("hardhat");
const {
  networkConfig,
  devolopmentChains,
} = require("../helper-hardhat-config");
const { verify } = require("../utils/verify");

module.exports = async (hre) => {
  const { getNamedAccounts, deployments } = hre;
  const { deploy, log } = deployments;
  const { deployer } = await getNamedAccounts();
  const chainId = network.config.chainId;

  let priceFeedAddress;

  if (devolopmentChains.includes(network.name)) {
    const ethUsdAggregator = await deployments.get("MockV3Aggregator");
    priceFeedAddress = ethUsdAggregator.address;
  } else {
    priceFeedAddress = networkConfig[chainId]["ethUsdAddress"];
  }

  const args = [priceFeedAddress];
  const fundMe = await deploy("FundMe", {
    from: deployer,
    args: args,
    log: true,
    waitConfirmations: network.config.blockConfirmations || 1,
  });

  if (
    !devolopmentChains.includes(network.name) &&
    process.env.ETHERSCAN_API_KEY
  ) {
    verify(fundMe.address, args);
  }

  log("-------------------------------------------");
};

module.exports.tags = ["all", "fundme"];
