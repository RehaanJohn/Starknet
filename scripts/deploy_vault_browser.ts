/**
 * Deploy Vault Contract using Browser Wallet (Braavos)
 * This script connects to your Braavos wallet in the browser and deploys the contract
 */

import { Contract, json, Account, RpcProvider } from "starknet";
import * as fs from "fs";

async function deployWithBrowserWallet() {
  console.log("🔨 Cairo Vault Contract Deployment (Browser Wallet)");
  console.log("====================================================");
  console.log("");

  // Check if running in browser environment
  if (typeof window === "undefined") {
    console.log("⚠️  This script needs to run in a browser environment with Braavos installed");
    console.log("📝 Alternative: Use sncast to create a deployment account");
    console.log("   sncast account create --name deployer");
    console.log("");
    process.exit(1);
  }

  // Setup provider
  const provider = new RpcProvider({
    nodeUrl: "https://starknet-sepolia.public.blastapi.io/rpc/v0_7",
  });

  console.log("🌐 Network: Starknet Sepolia Testnet");
  console.log("");

  // Connect to Braavos wallet
  console.log("🔗 Connecting to Braavos wallet...");
  
  // @ts-ignore
  if (!window.starknet_braavos) {
    console.error("❌ Braavos wallet not found. Please install Braavos extension.");
    process.exit(1);
  }

  // @ts-ignore
  await window.starknet_braavos.enable();
  // @ts-ignore
  const walletAccount = window.starknet_braavos.account;

  console.log("✅ Connected to wallet:", walletAccount.address);
  console.log("");

  // Read compiled contract
  const compiledContract = json.parse(
    fs.readFileSync("./target/dev/vault_Vault.contract_class.json").toString("utf-8")
  );

  console.log("📝 Declaring contract class...");
  console.log("   (Please approve the transaction in your Braavos wallet)");
  console.log("");

  try {
    // Declare the contract
    const declareResponse = await walletAccount.declare({
      contract: compiledContract,
    });

    console.log("⏳ Waiting for declaration transaction...");
    await provider.waitForTransaction(declareResponse.transaction_hash);

    const classHash = declareResponse.class_hash;
    console.log("✅ Class hash:", classHash);
    console.log("");

    console.log("🚀 Deploying contract...");
    console.log("   Constructor argument: ", walletAccount.address, "(owner)");
    console.log("   (Please approve the transaction in your Braavos wallet)");
    console.log("");

    // Deploy the contract
    const deployResponse = await walletAccount.deployContract({
      classHash: classHash,
      constructorCalldata: [walletAccount.address],
    });

    console.log("⏳ Waiting for deployment transaction...");
    await provider.waitForTransaction(deployResponse.transaction_hash);

    const contractAddress = deployResponse.contract_address;

    console.log("");
    console.log("✅ Contract deployed successfully!");
    console.log("");
    console.log("================================================");
    console.log("📍 CONTRACT ADDRESS:", contractAddress);
    console.log("🔑 CLASS HASH:", classHash);
    console.log("👤 OWNER:", walletAccount.address);
    console.log("================================================");
    console.log("");

    // Save to .env.local
    const envContent = `\n# Vault Contract (Deployed ${new Date().toISOString()})\nNEXT_PUBLIC_VAULT_CONTRACT_ADDRESS=${contractAddress}\nVAULT_CLASS_HASH=${classHash}\n`;
    fs.appendFileSync(".env.local", envContent);

    console.log("✅ Configuration saved to .env.local");
    console.log("");

    // Verify deployment
    const contract = new Contract(compiledContract.abi, contractAddress, provider);
    const owner = await contract.get_owner();
    console.log("🔍 Verified contract owner:", owner);
    console.log("");

    console.log("🎉 Deployment complete!");
    console.log("");
    console.log("Next steps:");
    console.log("1. Authorize your ChipiPay wallet address");
    console.log("2. Integrate the vault contract with your frontend");
    console.log("");

    return contractAddress;
  } catch (error: any) {
    console.error("❌ Deployment failed:", error.message);
    if (error.message.includes("User abort")) {
      console.log("⚠️  Transaction was rejected in wallet");
    }
    process.exit(1);
  }
}

// Run if called directly
if (require.main === module) {
  deployWithBrowserWallet()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error(error);
      process.exit(1);
    });
}

export { deployWithBrowserWallet };
