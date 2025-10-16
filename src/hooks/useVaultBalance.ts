import { useEffect, useState } from "react";

type UseVaultBalanceResult = {
  balanceHuman: string;
  loading: boolean;
  hasData: boolean;
  raw?: { balanceRaw: string; rawArray?: string[] };
};

/**
 * useVaultBalance
 * - Fetches ChipiPay wallet balance from the vault contract
 * - Returns balance in STRK (converted from u128 low/high parts)
 */
export function useVaultBalance({ address }: { address: string | null }): UseVaultBalanceResult {
  const [balanceHuman, setBalanceHuman] = useState<string>("0");
  const [loading, setLoading] = useState<boolean>(false);
  const [hasData, setHasData] = useState<boolean>(false);
  const [raw, setRaw] = useState<{ balanceRaw: string; rawArray?: string[] } | undefined>(undefined);

  useEffect(() => {
    if (!address) {
      setBalanceHuman("0");
      setHasData(false);
      setRaw(undefined);
      return;
    }

    let mounted = true;
    const fetchBalance = async () => {
      setLoading(true);
      try {
        const resp = await fetch("/api/vault/balance", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ address }),
        });

        const contentType = resp.headers.get("content-type") || "";
        let j: any = null;
        if (contentType.includes("application/json")) {
          try {
            j = await resp.json();
          } catch (parseErr) {
            j = { error: "Invalid JSON response", body: null };
          }
        } else {
          const text = await resp.text().catch(() => "");
          j = { error: resp.ok ? null : `Non-JSON response`, body: text };
        }

        if (!resp.ok) {
          throw new Error(j?.error || j?.body || "Failed to fetch balance");
        }

        if (!j.balanceRaw || !j.rawArray || j.rawArray.length < 2) {
          console.error("Unexpected API response:", j);
          throw new Error("Invalid API response: missing or incomplete balance data");
        }

        if (!mounted) return;

        // Correctly format the balanceHuman by dividing by 10^18
        const rawBalance = BigInt(j.balanceRaw);
        const decimals = BigInt(10) ** BigInt(18);
        const integerPart = rawBalance / decimals;
        const fractionalPart = rawBalance % decimals;
        const fractionalStr = fractionalPart.toString().padStart(18, "0").replace(/0+$/, "");
        const formattedBalance = fractionalStr ? `${integerPart}.${fractionalStr}` : integerPart.toString();

        setBalanceHuman(formattedBalance);
        setRaw({ balanceRaw: j.balanceRaw, rawArray: j.rawArray });
        setHasData(true);
      } catch (err: any) {
        console.error("useVaultBalance error:", err, err.details || "No additional details");
        if (mounted) {
          setBalanceHuman("0");
          setHasData(false);
          setRaw(undefined);
        }
      } finally {
        if (mounted) setLoading(false);
      }
    };

    fetchBalance();
    return () => {
      mounted = false;
    };
  }, [address]);

  return { balanceHuman, loading, hasData, raw };
}

export default useVaultBalance;
