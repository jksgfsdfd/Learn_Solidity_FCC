const { setDefaultResultOrder } = require("dns");
const ethers = require("ethers");
const fs = require("fs");
require("dotenv").config();

async function main() {
  //we could have compiles our sol contract from sol file within this js file
  //but we have chosen to compile seperately using 'yarn solcjs' command in the terminal
  //hence we only deploy the compiled contract in this program
  //to deploy we need a to send a transaction in the blockchain
  //for this we need to connect to a node running blockchain
  //this is done by connecting to ganache and accessing its api
  //the node is at address HTTP://127.0.0.1:7545
  //private key of an already existing account which we will use
  //1f9d92ef047ff3eb4e449ed0a4200f098dfd6457bf392f55454dd8f87e87351f

  //to interact with an ethereum node...we have to use its api
  //ethers.js provides us easier access for rpcs

  //we want to hide the node address hence we make use of environment variables
  let provider = new ethers.providers.JsonRpcProvider(process.env.RPC_URL);

  //to make transactions we need to be able to sign them for this we create a wallet with the private key

  //we want to hide this private key
  let wallet = new ethers.Wallet(process.env.PRIVATE_KEY, provider);

  //console.log(`current working directory is ${process.env.PWD}`);
  //since we need to create a contract we will need its binary
  //to make a contract object we c

  const abi = fs.readFileSync("./SimpleStorage_sol_SimpleStorage.abi", "utf-8");
  const bin = fs.readFileSync("./SimpleStorage_sol_SimpleStorage.bin", "utf-8");

  //   to create a contract we need to make a trasanction
  // const nonce = await wallet.getTransactionCount();
  // let tx = {
  //   nonce: nonce,
  //   gasPrice: 100000000000,
  //   gasLimit: 1000000,
  //   to: null,
  //   value: 0,
  //   data: "0x" + bin.toString(),
  //   chainId: 1337,

  //   //the signing fields v,r,s will be handled when we use a funciton to sign this trasaction by our already made wallet
  // };

  // const manualTrasactionReaspone = await wallet.sendTransaction(tx);

  // console.log(manualTrasaction);
  // console.log("manual trasaction sent");
  // console.log(manualTrasactionReaspone);

  //contractFactory is able to generate transactions to deploy new contracts and also return contract objects for us to use later hence it needs abi
  const contractFactory = new ethers.ContractFactory(abi, bin, wallet);

  //   //contract is a specific contract that is created by contractFactory
  const contract = await contractFactory.deploy();
  //   //here contract has been created
  console.log(`contracts address: ${contract.address}`);
  //   //to get the transaxtion that has created the contract
  const transaction = contract.deployTransaction;
  console.log(`the trasaction that deployed this contract is:`);
  console.log(transaction);

  //   //    reciept of deployment
  //   //   const deploymentReciept = await contract.deployTransaction.wait(1);
  //   //   console.log(`the reciept for deployment of this contract is:`);
  //   //   console.log(deploymentReciept);

  let currentFavoriteNumber = await contract.retrieve();
  console.log(`Current favorite number is :${currentFavoriteNumber}`);
  let transactionResponse = await contract.store(7);
  // let transactionReceipt = await transactionResponse.wait(1);
  //when run on the goerli testnet it is required to uncomment the above line to get the correct updated number.Why?
  let updatedFavoriteNumber = await contract.retrieve();
  console.log(`New favorite number is ${updatedFavoriteNumber}`);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
