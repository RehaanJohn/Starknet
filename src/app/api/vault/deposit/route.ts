import { NextResponse } from "next/server";
import { RpcProvider, Contract, Account } from "starknet";
import vaultAbi from "@/abis/vault.json";

const RPC_URL = "https://starknet-sepolia.public.blastapi.io";
const VAULT_CONTRACT_ADDRESS = "0x04718f5a0Fc34cC1AF16A1cdee98fFB20C31f5cD61D6Ab07201858f4287c938D";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { amount, userAddress, privateKey } = body;

    if (!amount || !userAddress || !privateKey) {
      return NextResponse.json(
        { error: "Missing 'amount', 'userAddress', or 'privateKey' in request body" },
        { status: 400 }
      );
    }

    const provider = new RpcProvider({ nodeUrl: RPC_URL });

    const account = new Account(
      provider,
      userAddress,
      privateKey,
      '1' // Cairo version
    );

    const contract = new Contract(vaultAbi.abi, VAULT_CONTRACT_ADDRESS, account);

    // Convert the amount to uint256 (low, high)
    const amountBigInt = BigInt(amount);
    const low = amountBigInt & ((1n << 128n) - 1n); // Lower 128 bits
    const high = amountBigInt >> 128n; // Upper 128 bits

    // Invoke the `deposit` method on the vault contract
    const txResponse = await contract.invoke("deposit", [low.toString(), high.toString()]);

    return NextResponse.json({
      message: "Deposit transaction sent successfully",
      transactionHash: txResponse.transaction_hash,
    });
  } catch (error: any) {
    console.error("Error in /api/vault/deposit:", error);
    return NextResponse.json(
      { error: error.message || "Internal Server Error", details: error.toString() },
      { status: 500 }
    );
  }
}
