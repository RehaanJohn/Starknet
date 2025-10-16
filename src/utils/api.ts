export async function getWallet(externalUserId: string) {
  const apiUrl = "https://celebrated-vision-production-66a5.up.railway.app/v1/chipi-wallets/by-user";

  const response = await fetch(`${apiUrl}?externalUserId=${externalUserId}`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${process.env.NEXT_PUBLIC_CHIPI_API_KEY}`, // Include the API key
    },
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch wallet: ${response.statusText}`);
  }

  return response.json();
}
