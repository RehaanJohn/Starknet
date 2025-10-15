use starknet::ContractAddress;

#[starknet::interface]
trait IVault<TContractState> {
    fn authorize_hot(ref self: TContractState, hot: ContractAddress);
    fn withdraw_by_hot(ref self: TContractState, to: ContractAddress, amount_low: u128, amount_high: u128);
    fn revoke(ref self: TContractState);
    fn freeze(ref self: TContractState);
    fn unfreeze(ref self: TContractState);
    fn get_chipi_balance(self: @TContractState, user: ContractAddress) -> (u128, u128);
    fn set_chipi_balance(ref self: TContractState, user: ContractAddress, amount_low: u128, amount_high: u128);
    fn get_owner(self: @TContractState) -> ContractAddress;
    fn get_hot_wallet(self: @TContractState) -> ContractAddress;
    fn is_frozen(self: @TContractState) -> bool;
}

#[starknet::contract]
mod Vault {
    use starknet::{ContractAddress, get_caller_address};
    use starknet::storage::{StoragePointerReadAccess, StoragePointerWriteAccess, Map};

    #[storage]
    struct Storage {
        owner: ContractAddress,
        hot_wallet: ContractAddress,
        chipi_balance_low: Map<ContractAddress, u128>,
        chipi_balance_high: Map<ContractAddress, u128>,
        frozen: bool,
    }

    #[event]
    #[derive(Drop, starknet::Event)]
    enum Event {
        HotWalletAuthorized: HotWalletAuthorized,
        HotWalletRevoked: HotWalletRevoked,
        WithdrawalExecuted: WithdrawalExecuted,
        VaultFrozen: VaultFrozen,
        VaultUnfrozen: VaultUnfrozen,
        BalanceUpdated: BalanceUpdated,
    }

    #[derive(Drop, starknet::Event)]
    struct HotWalletAuthorized {
        hot_wallet: ContractAddress,
    }

    #[derive(Drop, starknet::Event)]
    struct HotWalletRevoked {
        hot_wallet: ContractAddress,
    }

    #[derive(Drop, starknet::Event)]
    struct WithdrawalExecuted {
        from: ContractAddress,
        to: ContractAddress,
        amount_low: u128,
        amount_high: u128,
    }

    #[derive(Drop, starknet::Event)]
    struct VaultFrozen {
        by: ContractAddress,
    }

    #[derive(Drop, starknet::Event)]
    struct VaultUnfrozen {
        by: ContractAddress,
    }

    #[derive(Drop, starknet::Event)]
    struct BalanceUpdated {
        user: ContractAddress,
        amount_low: u128,
        amount_high: u128,
    }

    #[constructor]
    fn constructor(ref self: ContractState, owner: ContractAddress) {
        self.owner.write(owner);
        self.frozen.write(false);
    }

    #[abi(embed_v0)]
    impl VaultImpl of super::IVault<ContractState> {
        fn authorize_hot(ref self: ContractState, hot: ContractAddress) {
            let caller = get_caller_address();
            let contract_owner = self.owner.read();
            assert(caller == contract_owner, 'Only owner can authorize');
            
            self.hot_wallet.write(hot);
            self.emit(HotWalletAuthorized { hot_wallet: hot });
        }

        fn withdraw_by_hot(
            ref self: ContractState, 
            to: ContractAddress, 
            amount_low: u128, 
            amount_high: u128
        ) {
            let caller = get_caller_address();
            let authorized_hot = self.hot_wallet.read();
            assert(caller == authorized_hot, 'Only hot wallet can withdraw');

            let is_frozen = self.frozen.read();
            assert(!is_frozen, 'Vault is frozen');

            // Check balance
            let current_low = self.chipi_balance_low.read(caller);
            let current_high = self.chipi_balance_high.read(caller);

            // Simple balance check (assuming high parts match for simplicity)
            assert(current_high >= amount_high, 'Insufficient balance (high)');
            if current_high == amount_high {
                assert(current_low >= amount_low, 'Insufficient balance (low)');
            }

            // Subtract amount from hot wallet balance
            let (new_low, borrow) = if current_low >= amount_low {
                (current_low - amount_low, 0_u128)
            } else {
                // Handle borrow from high part
                let max_u128: u128 = 340282366920938463463374607431768211455;
                (max_u128 - amount_low + current_low + 1, 1_u128)
            };
            let new_high = current_high - amount_high - borrow;

            self.chipi_balance_low.write(caller, new_low);
            self.chipi_balance_high.write(caller, new_high);

            self.emit(WithdrawalExecuted { 
                from: caller, 
                to: to, 
                amount_low: amount_low, 
                amount_high: amount_high 
            });
        }

        fn revoke(ref self: ContractState) {
            let caller = get_caller_address();
            let contract_owner = self.owner.read();
            assert(caller == contract_owner, 'Only owner can revoke');
            
            let hot = self.hot_wallet.read();
            let zero_address: ContractAddress = 0.try_into().unwrap();
            self.hot_wallet.write(zero_address);
            self.emit(HotWalletRevoked { hot_wallet: hot });
        }

        fn freeze(ref self: ContractState) {
            let caller = get_caller_address();
            let contract_owner = self.owner.read();
            assert(caller == contract_owner, 'Only owner can freeze');
            
            self.frozen.write(true);
            self.emit(VaultFrozen { by: caller });
        }

        fn unfreeze(ref self: ContractState) {
            let caller = get_caller_address();
            let contract_owner = self.owner.read();
            assert(caller == contract_owner, 'Only owner can unfreeze');
            
            self.frozen.write(false);
            self.emit(VaultUnfrozen { by: caller });
        }

        fn get_chipi_balance(self: @ContractState, user: ContractAddress) -> (u128, u128) {
            let low = self.chipi_balance_low.read(user);
            let high = self.chipi_balance_high.read(user);
            (low, high)
        }

        fn set_chipi_balance(
            ref self: ContractState, 
            user: ContractAddress, 
            amount_low: u128, 
            amount_high: u128
        ) {
            let caller = get_caller_address();
            let contract_owner = self.owner.read();
            assert(caller == contract_owner, 'Only owner can set balance');
            
            self.chipi_balance_low.write(user, amount_low);
            self.chipi_balance_high.write(user, amount_high);
            self.emit(BalanceUpdated { user: user, amount_low: amount_low, amount_high: amount_high });
        }

        fn get_owner(self: @ContractState) -> ContractAddress {
            self.owner.read()
        }

        fn get_hot_wallet(self: @ContractState) -> ContractAddress {
            self.hot_wallet.read()
        }

        fn is_frozen(self: @ContractState) -> bool {
            self.frozen.read()
        }
    }
}
