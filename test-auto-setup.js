// Test script to check the auto-setup API
const fetch = require('node-fetch');

async function testAutoSetup() {
  console.log('🧪 Testing auto-setup API...');
  
  try {
    const response = await fetch('http://localhost:3000/api/vault/auto-setup', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        userAddress: '0x4afacd80277c63dc957f2286b417dad74526a5034dbf7354729585da7282926',
        initialBalance: 10000
      })
    });
    
    const result = await response.json();
    console.log('📊 Response status:', response.status);
    console.log('📋 Response body:', JSON.stringify(result, null, 2));
    
    if (response.ok) {
      console.log('✅ Auto setup completed successfully!');
    } else {
      console.log('❌ Auto setup failed:', result.error);
    }
  } catch (error) {
    console.error('🚨 Test failed:', error.message);
  }
}

testAutoSetup();