import { Contract, json, RpcProvider, Account } from "starknet";
import * as fs from "fs";
import * as dotenv from "dotenv";

dotenv.config();

async function main() {
  // Setup provider (Sepolia testnet)
  const provider = new RpcProvider({
    nodeUrl: process.env.STARKNET_RPC_URL || "https://starknet-sepolia.public.blastapi.io/rpc/v0_7",
  });

  // Setup account (you'll need to provide these in .env)
  const accountAddress = process.env.STARKNET_ACCOUNT_ADDRESS;
  const privateKey = process.env.STARKNET_PRIVATE_KEY;

  if (!accountAddress || !privateKey) {
    console.error("❌ Please set STARKNET_ACCOUNT_ADDRESS and STARKNET_PRIVATE_KEY in .env");
    process.exit(1);
  }

  const account = new Account(provider, accountAddress, privateKey);

  console.log("🔨 Compiling contract...");
  
  // Read the compiled contract
  const compiledContract = json.parse(
    fs.readFileSync("./target/dev/vault_Vault.contract_class.json").toString("utf-8")
  );

  console.log("📝 Declaring contract class...");
  
  // Declare the contract
  const declareResponse = await account.declare({
    contract: compiledContract,
  });

  await provider.waitForTransaction(declareResponse.transaction_hash);
  
  const classHash = declareResponse.class_hash;
  console.log("✅ Class hash:", classHash);

  console.log("🚀 Deploying contract...");
  
  // Deploy the contract with owner as constructor argument
  const deployResponse = await account.deployContract({
    classHash: classHash,
    constructorCalldata: [accountAddress], // owner address
  });

  await provider.waitForTransaction(deployResponse.transaction_hash);

  const contractAddress = deployResponse.contract_address;
  console.log("✅ Contract deployed successfully!");
  console.log("📍 Contract address:", contractAddress);
  console.log("");
  console.log("Save this address to your .env file:");
  console.log(`VAULT_CONTRACT_ADDRESS=${contractAddress}`);

  // Save to .env.local
  fs.appendFileSync(".env.local", `\nVAULT_CONTRACT_ADDRESS=${contractAddress}\n`);
  console.log("✅ Address saved to .env.local");

  // Verify deployment by calling get_owner
  const contract = new Contract(compiledContract.abi, contractAddress, provider);
  const owner = await contract.get_owner();
  console.log("🔍 Verified contract owner:", owner);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("❌ Deployment failed:", error);
    process.exit(1);
  });
