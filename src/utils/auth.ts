import { NextRequest } from "next/server";

export async function getUserFromRequest(req: NextRequest) {
  // Example: Extract user from a session or token
  const token = req.headers.get("Authorization")?.replace("Bearer ", "");
  if (!token) return null;

  // Validate the token and fetch the user (replace with your auth logic)
  const user = await fetchUserFromToken(token);
  return user;
}

async function fetchUserFromToken(token: string) {
  // Replace with your logic to fetch the user from the token
  // Example:
  return {
    id: "user_123",
    chipiWalletAddress: "0x57d0fb86ba9a76d97d00bcd5b61379773070f7451a2ddb4ccb0d04d71586473",
  };
}
