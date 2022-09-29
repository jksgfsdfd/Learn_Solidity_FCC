const { ethers, run, network } = require("hardhat");

async function main() {
  const SimpleStorageFactory = await ethers.getContractFactory("SimpleStorage");
  console.log("deploying contract");
  const simpleStorage = await SimpleStorageFactory.deploy();

  await simpleStorage.deployed();

  console.log(`contract deployed at ${simpleStorage.address}`);

  const currentValue = await simpleStorage.retrieve();
  console.log(`the current value is ${currentValue}`);

  const newval = 7;
  const trasanctionResponse = await simpleStorage.store(newval);
  console.log(trasanctionResponse);
  await trasanctionResponse.wait(1);
  const updatedValue = await simpleStorage.retrieve();

  console.log(`the current value is ${updatedValue}`);

  if (network.config.chainId === 5 && process.env.ETHERSCAN_API_KEY) {
    await simpleStorage.deployTransaction.wait(6);
    await verify(simpleStorage.address, []);
  }
}

async function verify(contractAddress, args) {
  console.log("verifying contract");
  try {
    await run("verify:verify", {
      address: contractAddress,
      constructorArguments: args,
    });
  } catch (e) {
    if (e.message.toLowerCase().includes("already verified")) {
      console.log("already verified");
    } else {
      console.log(e);
    }
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
