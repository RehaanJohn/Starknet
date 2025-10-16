import { NextResponse } from "next/server";
import { exec } from "child_process";
import { promisify } from "util";

const execAsync = promisify(exec);

const STARKLI_COMMAND = "starkli call";
const RPC_URL = "https://starknet-sepolia.public.blastapi.io";
const TOKEN_CONTRACT_ADDRESS = "0x04718f5a0Fc34cC1AF16A1cdee98fFB20C31f5cD61D6Ab07201858f4287c938D";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const address = searchParams.get("address");

    if (!address) {
      return NextResponse.json({ error: "Missing 'address' query parameter" }, { status: 400 });
    }

    // Construct the starkli command
    const command = `${STARKLI_COMMAND} ${TOKEN_CONTRACT_ADDRESS} balanceOf ${address} --rpc ${RPC_URL}`;

    // Execute the starkli command
    const { stdout, stderr } = await execAsync(command);

    if (stderr) {
      console.error("starkli error:", stderr);
      throw new Error(`starkli error: ${stderr}`);
    }

    // Parse the output (assuming it's a JSON array)
    const resultArray = JSON.parse(stdout.trim());
    if (!Array.isArray(resultArray) || resultArray.length < 2) {
      throw new Error("Invalid response from starkli: expected an array with [low, high]");
    }

    const balance_low = resultArray[0];
    const balance_high = resultArray[1];
    const low = BigInt(balance_low);
    const high = BigInt(balance_high);
    const balance = (high << BigInt(128)) + low;

    // Format the balance
    const formattedBalance = balance.toString();

    return NextResponse.json({
      balance_low,
      balance_high,
      balanceRaw: balance.toString(),
      balanceHuman: formattedBalance,
      rawArray: resultArray.map((val) => val.toString()),
    });
  } catch (error: any) {
    console.error("Error in GET /api/vault/balance:", error);
    return NextResponse.json(
      { error: error.message || "Internal Server Error", details: error.toString() },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const address = body?.address;

    if (!address) {
      return NextResponse.json({ error: "Missing 'address' in request body" }, { status: 400 });
    }

    // Construct the starkli command
    const command = `${STARKLI_COMMAND} ${TOKEN_CONTRACT_ADDRESS} balanceOf ${address} --rpc ${RPC_URL}`;

    // Execute the starkli command
    const { stdout, stderr } = await execAsync(command);

    if (stderr) {
      console.error("starkli error:", stderr);
      throw new Error(`starkli error: ${stderr}`);
    }

    // Parse the output (assuming it's a JSON array)
    const resultArray = JSON.parse(stdout.trim());
    if (!Array.isArray(resultArray) || resultArray.length < 2) {
      throw new Error("Invalid response from starkli: expected an array with [low, high]");
    }

    const balance_low = resultArray[0];
    const balance_high = resultArray[1];
    const low = BigInt(balance_low);
    const high = BigInt(balance_high);
    const balance = (high << BigInt(128)) + low;

    // Format the balance
    const formattedBalance = balance.toString(); // Adjust formatting as needed

    return NextResponse.json({
      balance_low,
      balance_high,
      balanceRaw: balance.toString(),
      balanceHuman: formattedBalance,
      rawArray: resultArray.map((val) => val.toString()),
    });
  } catch (error: any) {
    console.error("Error in /api/vault/balance:", error);
    return NextResponse.json(
      { error: error.message || "Internal Server Error", details: error.toString() },
      { status: 500 }
    );
  }
}