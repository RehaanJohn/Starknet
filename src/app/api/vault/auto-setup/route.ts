import { NextRequest, NextResponse } from 'next/server';

const CHIPI_HOT_WALLET = "0x4afacd80277c63dc957f2286b417dad74526a5034dbf7354729585da7282926";

/**
 * Auto Setup Vault API
 * Automatically executes all the admin setup commands:
 * 1. Check ChipiPay wallet balance
 * 2. Set balance if needed
 * 3. Authorize hot wallet
 * 4. Verify setup
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userAddress, initialBalance = 10000 } = body;

    if (!userAddress) {
      return NextResponse.json(
        { error: 'User address required' },
        { status: 400 }
      );
    }

    console.log(`🚀 Auto-setting up vault for user: ${userAddress}`);

    // Using internal API calls instead of direct blockchain connection

    // Use direct API calls to other working endpoints instead of Contract constructor
    const results = [];

    // Step 1: Check current balance using the working balance API
    console.log(`📊 Checking current balance for ${userAddress}...`);
    try {
      const balanceResponse = await fetch(`${process.env.VERCEL_URL || 'http://localhost:3000'}/api/vault/balance?address=${userAddress}`);
      const balanceData = await balanceResponse.json();
      
      console.log(`💰 Current balance: ${balanceData.balance_low} (low), ${balanceData.balance_high} (high)`);
      results.push({
        step: 1,
        action: "Check balance",
        result: `Current: ${balanceData.balance_low}`,
        success: true
      });
    } catch (err: any) {
      console.error("❌ Failed to check balance:", err);
      results.push({
        step: 1,
        action: "Check balance",
        result: `Error: ${err.message}`,
        success: false
      });
    }

    // Step 2: Set initial balance using the working set-balance API
    console.log(`⚡ Setting balance to ${initialBalance} for ${userAddress}...`);
    try {
      const setBalanceResponse = await fetch(`${process.env.VERCEL_URL || 'http://localhost:3000'}/api/vault/set-balance`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user: userAddress,
          amount: initialBalance
        })
      });
      
      const setBalanceData = await setBalanceResponse.json();
      
      if (!setBalanceResponse.ok) {
        throw new Error(setBalanceData.error || 'Failed to set balance');
      }
      
      console.log(`✅ Balance set! TX: ${setBalanceData.transaction_hash}`);
      results.push({
        step: 2,
        action: "Set balance",
        result: `TX: ${setBalanceData.transaction_hash}`,
        success: true,
        tx_hash: setBalanceData.transaction_hash
      });

      // Wait for confirmation
      console.log("⏳ Waiting 10 seconds for confirmation...");
      await new Promise(resolve => setTimeout(resolve, 10000));

    } catch (err: any) {
      console.error("❌ Failed to set balance:", err);
      results.push({
        step: 2,
        action: "Set balance",
        result: `Error: ${err.message}`,
        success: false
      });
    }

    // Step 3: Verify new balance
    console.log(`📊 Verifying new balance...`);
    try {
      const newBalanceResponse = await fetch(`${process.env.VERCEL_URL || 'http://localhost:3000'}/api/vault/balance?address=${userAddress}`);
      const newBalanceData = await newBalanceResponse.json();
      
      console.log(`💰 New balance: ${newBalanceData.balance_low} (low), ${newBalanceData.balance_high} (high)`);
      results.push({
        step: 3,
        action: "Verify balance",
        result: `New balance: ${newBalanceData.balance_low}`,
        success: true
      });
    } catch (err: any) {
      console.error("❌ Failed to verify balance:", err);
      results.push({
        step: 3,
        action: "Verify balance",
        result: `Error: ${err.message}`,
        success: false
      });
    }

    // Step 4: Authorize hot wallet using admin API
    console.log(`🔥 Authorizing ChipiPay hot wallet: ${CHIPI_HOT_WALLET}...`);
    try {
      const authResponse = await fetch(`${process.env.VERCEL_URL || 'http://localhost:3000'}/api/vault/admin/authorize-hot`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          hotWalletAddress: CHIPI_HOT_WALLET
        })
      });
      
      const authData = await authResponse.json();
      
      if (!authResponse.ok) {
        throw new Error(authData.error || 'Failed to authorize hot wallet');
      }
      
      console.log(`✅ Hot wallet authorized! TX: ${authData.transaction_hash}`);
      results.push({
        step: 4,
        action: "Authorize hot wallet",
        result: `TX: ${authData.transaction_hash}`,
        success: true,
        tx_hash: authData.transaction_hash
      });

      // Wait for confirmation
      console.log("⏳ Waiting 10 seconds for authorization...");
      await new Promise(resolve => setTimeout(resolve, 10000));

    } catch (err: any) {
      console.error("❌ Failed to authorize hot wallet:", err);
      results.push({
        step: 4,
        action: "Authorize hot wallet",
        result: `Error: ${err.message}`,
        success: false
      });
    }

    // Step 5: Verify hot wallet authorization
    console.log(`🔍 Verifying hot wallet authorization...`);
    try {
      const hotWalletResponse = await fetch(`${process.env.VERCEL_URL || 'http://localhost:3000'}/api/vault/get-hot-wallet`);
      const hotWalletData = await hotWalletResponse.json();
      
      console.log(`🔥 Authorized hot wallet: ${hotWalletData.hot_wallet}`);
      results.push({
        step: 5,
        action: "Verify hot wallet",
        result: `Hot wallet: ${hotWalletData.hot_wallet}`,
        success: true
      });
    } catch (err: any) {
      console.error("❌ Failed to verify hot wallet:", err);
      results.push({
        step: 5,
        action: "Verify hot wallet",
        result: `Error: ${err.message}`,
        success: false
      });
    }

    console.log("🎉 Auto-setup completed!");

    return NextResponse.json({
      success: true,
      message: "Vault auto-setup completed",
      user_address: userAddress,
      initial_balance: initialBalance,
      chipi_hot_wallet: CHIPI_HOT_WALLET,
      vault_contract: process.env.NEXT_PUBLIC_VAULT_CONTRACT_ADDRESS,
      results: results,
      summary: {
        total_steps: results.length,
        successful_steps: results.filter(r => r.success).length,
        failed_steps: results.filter(r => !r.success).length
      }
    });

  } catch (error: any) {
    console.error('❌ Auto-setup failed:', error);
    return NextResponse.json(
      { 
        error: error.message || 'Auto-setup failed',
        details: 'Check server logs for more information'
      },
      { status: 500 }
    );
  }
}
