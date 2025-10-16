import { NextResponse } from "next/server";
import { exec } from "child_process";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { walletAddress } = body;

    if (!walletAddress) {
      return NextResponse.json({ error: "Missing wallet address" }, { status: 400 });
    }

    const VAULT_CONTRACT = process.env.NEXT_PUBLIC_VAULT_CONTRACT_ADDRESS;
    const RPC_URL = process.env.NEXT_PUBLIC_RPC_URL;
    const ACCOUNT_PATH = "~/.starkli-wallets/deployer-new/account.json";
    const KEYSTORE_PATH = "~/.starkli-wallets/deployer-new/keystore.json";
    const KEYSTORE_PASSWORD = "Vineet07.//";

    const command = `echo ${KEYSTORE_PASSWORD} | starkli invoke \
      ${VAULT_CONTRACT} \
      authorize_hot \
      ${walletAddress} \
      --rpc ${RPC_URL} \
      --account ${ACCOUNT_PATH} \
      --keystore ${KEYSTORE_PATH}`;

    const result = await new Promise((resolve, reject) => {
      exec(command, (error, stdout, stderr) => {
        if (error) {
          reject(stderr || error.message);
        } else {
          resolve(stdout);
        }
      });
    });

    return NextResponse.json({ message: "Hot wallet authorized successfully", result });
  } catch (error: any) {
    console.error("Authorization error:", error);
    return NextResponse.json({ error: error.message || "Failed to authorize hot wallet" }, { status: 500 });
  }
}