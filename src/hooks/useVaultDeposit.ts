import { useState } from "react";
import { Contract, Provider, AccountInterface } from "starknet";

const VAULT_CONTRACT_ADDRESS = "0x04718f5a0Fc34cC1AF16A1cdee98fFB20C31f5cD61D6Ab07201858f4287c938D";
const VAULT_ABI = [
  // Add the ABI for the `deposit` method
  {
    "type": "function",
    "name": "deposit",
    "inputs": [
      { "name": "low", "type": "core::integer::u128" },
      { "name": "high", "type": "core::integer::u128" }
    ],
    "outputs": [],
    "state_mutability": "external"
  }
];

type UseVaultDepositResult = {
  deposit: (amount: string, account: AccountInterface) => Promise<void>;
  loading: boolean;
  error: string | null;
};

export function useVaultDeposit(): UseVaultDepositResult {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const deposit = async (amount: string, account: AccountInterface) => {
    setLoading(true);
    setError(null);

    try {
      // Convert the amount to uint256 (low, high)
      const amountBigInt = BigInt(amount);
      const low = amountBigInt & ((1n << 128n) - 1n); // Lower 128 bits
      const high = amountBigInt >> 128n; // Upper 128 bits

      // Initialize the vault contract
      const provider = new Provider({ sequencer: { baseUrl: "https://starknet-sepolia.public.blastapi.io" } });
      const contract = new Contract(VAULT_ABI, VAULT_CONTRACT_ADDRESS, account);

      // Invoke the `deposit` method
      const txResponse = await contract.invoke("deposit", [low.toString(), high.toString()]);

      console.log("Deposit transaction sent:", txResponse.transaction_hash);
    } catch (err: any) {
      console.error("Deposit error:", err);
      setError(err.message || "An error occurred during the deposit");
    } finally {
      setLoading(false);
    }
  };

  return { deposit, loading, error };
}
