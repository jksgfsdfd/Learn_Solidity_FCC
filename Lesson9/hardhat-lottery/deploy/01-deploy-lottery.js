const { network, ethers } = require("hardhat");
const {
  developmentChains,
  networkConfig,
} = require("../helper-hardhat-config");
const { verify } = require("../utils/verify");

module.exports = async function (hre) {
  const { getNamedAccounts, deployments } = hre;
  const { deploy, log } = deployments;
  const { deployer } = await getNamedAccounts();
  const chainId = network.config.chainId;
  let vrfCoordinatorV2Address, subscriptionId;

  const callbackgaslimit = networkConfig[chainId]["callbackgaslimit"];
  const interval = networkConfig[chainId]["interval"];
  const entranceFee = networkConfig[chainId]["entranceFee"];
  const gasLane = networkConfig[chainId]["gasLane"];
  let mockvrf;
  if (developmentChains.includes(chainId)) {
    log("hello");
    mockvrf = await ethers.getContract("VRFCoordinatorV2Mock");
    vrfCoordinatorV2Address = mockvrf.address;
    const transactionResponse = await mockvrf.createSubscription();
    const transactionReceipt = await transactionResponse.wait(1);
    subscriptionId = transactionReceipt.events[0].args.subId;
  } else {
    vrfCoordinatorV2Address = networkConfig[chainId]["vrfAddress"];
    subscriptionId = networkConfig[chainId]["subscriptionId"];
  }

  const args = [
    vrfCoordinatorV2Address,
    entranceFee,
    gasLane,
    subscriptionId,
    callbackgaslimit,
    interval,
  ];

  const lottery = await deploy("lottery", {
    from: deployer,
    args: args,
    log: true,
    waitConfirmations: network.config.blockConfirmations || 1,
  });

  if (developmentChains.includes(chainId)) {
    await mockvrf.addConsumer(subscriptionId, lottery.address);

    log("Consumer is added");
  }

  if (!developmentChains.includes(chainId) && process.env.ETHERSCAN_API_KEY) {
    log("veryfing contract");
    await verify(lottery.address, args);
    log("verification done");
  }

  log("-------------------------------------------------------------------");
};

module.exports.tags = ["all", "stage"];
