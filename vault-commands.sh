#!/bin/bash

# 🏦 Vault Management Commands
# Vault Contract: 0x06c2a8099d04b04c4fa26ab84cca176eb1182502b48d623dd31f9605500e3d07
# ChipiPay Hot Wallet: 0x4afacd80277c63dc957f2286b417dad74526a5034dbf7354729585da7282926

VAULT_CONTRACT="0x06c2a8099d04b04c4fa26ab84cca176eb1182502b48d623dd31f9605500e3d07"
HOT_WALLET="0x4afacd80277c63dc957f2286b417dad74526a5034dbf7354729585da7282926"
RPC_URL="https://starknet-sepolia.public.blastapi.io"
ACCOUNT_PATH="~/.starkli-wallets/deployer-new/account.json"
KEYSTORE_PATH="~/.starkli-wallets/deployer-new/keystore.json"

echo "🏦 Vault Management Script"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# Function to check vault status
check_status() {
    echo "📊 Checking Vault Status..."
    echo ""
    
    echo "🔐 Owner:"
    starkli call $VAULT_CONTRACT get_owner --rpc $RPC_URL
    echo ""
    
    echo "🔥 Hot Wallet:"
    starkli call $VAULT_CONTRACT get_hot_wallet --rpc $RPC_URL
    echo ""
    
    echo "❄️  Frozen Status:"
    starkli call $VAULT_CONTRACT is_frozen --rpc $RPC_URL
    echo ""
}

# Function to check user balance
check_balance() {
    if [ -z "$1" ]; then
        echo "❌ Error: Please provide user address"
        echo "Usage: ./vault-commands.sh balance <address>"
        return 1
    fi
    
    echo "💰 Checking balance for: $1"
    starkli call $VAULT_CONTRACT get_chipi_balance $1 --rpc $RPC_URL
    echo ""
}

# Function to set balance (OWNER ONLY)
set_balance() {
    if [ -z "$1" ] || [ -z "$2" ]; then
        echo "❌ Error: Missing parameters"
        echo "Usage: ./vault-commands.sh set <address> <amount>"
        echo "Example: ./vault-commands.sh set 0x123...abc 1000"
        return 1
    fi
    
    USER_ADDRESS=$1
    AMOUNT_LOW=$2
    AMOUNT_HIGH=${3:-0}  # Default to 0 if not provided
    
    echo "⚡ Setting balance for $USER_ADDRESS"
    echo "   Amount Low: $AMOUNT_LOW"
    echo "   Amount High: $AMOUNT_HIGH"
    echo ""
    
    starkli invoke \
        $VAULT_CONTRACT \
        set_chipi_balance \
        $USER_ADDRESS \
        $AMOUNT_LOW \
        $AMOUNT_HIGH \
        --rpc $RPC_URL \
        --account $ACCOUNT_PATH \
        --keystore $KEYSTORE_PATH
    
    echo ""
    echo "⏳ Waiting 30 seconds for confirmation..."
    sleep 30
    
    echo "✅ Verifying new balance..."
    check_balance $USER_ADDRESS
}

# Function to authorize hot wallet (ONE TIME SETUP)
authorize_hot() {
    echo "🔥 Authorizing Hot Wallet: $HOT_WALLET"
    echo ""
    
    starkli invoke \
        $VAULT_CONTRACT \
        authorize_hot \
        $HOT_WALLET \
        --rpc $RPC_URL \
        --account $ACCOUNT_PATH \
        --keystore $KEYSTORE_PATH
    
    echo ""
    echo "⏳ Waiting 30 seconds for confirmation..."
    sleep 30
    
    echo "✅ Verifying authorization..."
    starkli call $VAULT_CONTRACT get_hot_wallet --rpc $RPC_URL
    echo ""
}

# Function to freeze vault (EMERGENCY)
freeze_vault() {
    echo "⚠️  FREEZING VAULT - This will stop all withdrawals!"
    read -p "Are you sure? (yes/no): " confirm
    
    if [ "$confirm" != "yes" ]; then
        echo "❌ Cancelled"
        return 1
    fi
    
    starkli invoke \
        $VAULT_CONTRACT \
        freeze \
        --rpc $RPC_URL \
        --account $ACCOUNT_PATH \
        --keystore $KEYSTORE_PATH
    
    echo ""
    echo "⏳ Waiting for confirmation..."
    sleep 30
    
    echo "✅ Vault frozen!"
    check_status
}

# Function to unfreeze vault
unfreeze_vault() {
    echo "🔓 Unfreezing Vault..."
    
    starkli invoke \
        $VAULT_CONTRACT \
        unfreeze \
        --rpc $RPC_URL \
        --account $ACCOUNT_PATH \
        --keystore $KEYSTORE_PATH
    
    echo ""
    echo "⏳ Waiting for confirmation..."
    sleep 30
    
    echo "✅ Vault unfrozen!"
    check_status
}

# Main script logic
case "$1" in
    status)
        check_status
        ;;
    balance)
        check_balance $2
        ;;
    set)
        set_balance $2 $3 $4
        ;;
    authorize)
        authorize_hot
        ;;
    freeze)
        freeze_vault
        ;;
    unfreeze)
        unfreeze_vault
        ;;
    *)
        echo "🏦 Vault Management Commands"
        echo ""
        echo "Usage: ./vault-commands.sh <command> [args]"
        echo ""
        echo "Commands:"
        echo "  status              - Check vault status (owner, hot wallet, frozen)"
        echo "  balance <address>   - Check user's vault balance"
        echo "  set <address> <amt> - Set user's balance (owner only)"
        echo "  authorize           - Authorize ChipiPay hot wallet (run once)"
        echo "  freeze              - Emergency freeze vault"
        echo "  unfreeze            - Unfreeze vault"
        echo ""
        echo "Examples:"
        echo "  ./vault-commands.sh status"
        echo "  ./vault-commands.sh balance 0x123...abc"
        echo "  ./vault-commands.sh set 0x123...abc 1000"
        echo "  ./vault-commands.sh authorize"
        echo ""
        exit 1
        ;;
esac
