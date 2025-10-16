// Quick test to verify the vault balance API works
console.log('🧪 Testing vault balance and auto-setup APIs...');

async function testVaultIntegration() {
  const testAddress = '0x4afacd80277c63dc957f2286b417dad74526a5034dbf7354729585da7282926';
  
  try {
    console.log('1. Testing vault balance API...');
    const balanceResponse = await fetch(`/api/vault/balance?address=${testAddress}`);
    const balanceData = await balanceResponse.json();
    console.log('✅ Balance API result:', balanceData);

    console.log('2. Testing auto-setup API...');
    const setupResponse = await fetch('/api/vault/auto-setup', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        userAddress: testAddress,
        initialBalance: 25000
      })
    });
    const setupData = await setupResponse.json();
    console.log('✅ Auto-setup API result:', setupData);

    console.log('3. Verifying balance update...');
    const newBalanceResponse = await fetch(`/api/vault/balance?address=${testAddress}`);
    const newBalanceData = await newBalanceResponse.json();
    console.log('✅ Updated balance:', newBalanceData);

  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

// Run test when this script is loaded
if (typeof window !== 'undefined') {
  testVaultIntegration();
}