#![no_std]
use soroban_sdk::{
    contract, contractimpl, contracttype, token, Address, Env, String, Symbol, Vec,
};

// ---- Data Types ----

#[contracttype]
#[derive(Clone, Debug, Eq, PartialEq)]
pub struct Vault {
    pub owner: Address,
    pub description: String,
    pub required_check_ins: u32,
    pub check_in_count: u32,
    pub deadline: u64,
    pub stake: i128,
    pub settled: bool,
    pub beneficiary: Address,
    pub strict_penalty: bool,
}

#[contracttype]
#[derive(Clone, Debug, Eq, PartialEq)]
pub struct UserStats {
    pub total_vaults: u32,
    pub completed_vaults: u32,
    pub total_check_ins: u32,
    pub total_staked: i128,
    pub total_returned: i128,
}

#[contracttype]
pub enum DataKey {
    Vault(u32),
    UserVaults(Address),
    UserStats(Address),
    NextId,
    TotalVaults,
    TotalCompleted,
    TotalStaked,
    TotalDonated,
}

#[contracttype]
#[derive(Clone, Debug, Eq, PartialEq)]
pub struct LeaderboardEntry {
    pub user: Address,
    pub completed_vaults: u32,
}

// ---- Events ----

fn emit_vault_created(env: &Env, owner: &Address, vault_id: u32, stake: i128, required: u32, deadline: u64) {
    env.events().publish(
        (Symbol::new(env, "vault_created"), owner.clone()),
        (vault_id, stake, required, deadline),
    );
}

fn emit_checked_in(env: &Env, vault_id: u32, owner: &Address, count: u32, required: u32) {
    env.events().publish(
        (Symbol::new(env, "checked_in"),),
        (vault_id, owner.clone(), count, required),
    );
}

fn emit_vault_settled(env: &Env, vault_id: u32, owner: &Address, returned: i128, donated: i128, completed: bool) {
    env.events().publish(
        (Symbol::new(env, "vault_settled"),),
        (vault_id, owner.clone(), returned, donated, completed),
    );
}

/// Check if an address is the well-known Stellar null/burn address.
/// The all-zeros account — no one knows its private key.
fn is_burn_address(env: &Env, addr: &Address) -> bool {
    let burn = Address::from_string(&String::from_str(
        env,
        "GAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAWHF",
    ));
    addr == &burn
}

// ---- Contract ----

#[contract]
pub struct VaultContract;

#[contractimpl]
impl VaultContract {
    /// Create a new vault with a stake.
    /// Transfers `stake` XLM from `owner` to the contract using the native `token` address.
    pub fn create_vault(
        env: Env,
        token: Address,
        owner: Address,
        description: String,
        required_check_ins: u32,
        deadline: u64,
        stake: i128,
        beneficiary: Address,
        strict_penalty: bool,
    ) -> u32 {
        // Validate inputs
        if required_check_ins == 0 {
            panic!("required_check_ins must be > 0");
        }
        if deadline <= env.ledger().timestamp() {
            panic!("deadline must be in the future");
        }
        if stake <= 0 {
            panic!("stake must be > 0");
        }

        // Authorize the owner
        owner.require_auth();

        // Transfer XLM from owner to this contract
        let token_client = token::Client::new(&env, &token);
        token_client.transfer(&owner, &env.current_contract_address(), &stake);

        // Generate vault ID
        let next_id = env
            .storage()
            .instance()
            .get::<_, u32>(&DataKey::NextId)
            .unwrap_or(1);
        let vault_id = next_id;

        // Create vault
        let vault = Vault {
            owner: owner.clone(),
            description,
            required_check_ins,
            check_in_count: 0,
            deadline,
            stake,
            settled: false,
            beneficiary,
            strict_penalty,
        };

        // Store vault
        env.storage().instance().set(&DataKey::Vault(vault_id), &vault);

        // Add to user's vault list
        let mut user_vaults: Vec<u32> = env
            .storage()
            .instance()
            .get(&DataKey::UserVaults(owner.clone()))
            .unwrap_or(Vec::new(&env));
        user_vaults.push_back(vault_id);
        env.storage()
            .instance()
            .set(&DataKey::UserVaults(owner.clone()), &user_vaults);

        // Update user stats
        let mut stats: UserStats = env
            .storage()
            .instance()
            .get(&DataKey::UserStats(owner.clone()))
            .unwrap_or(UserStats {
                total_vaults: 0,
                completed_vaults: 0,
                total_check_ins: 0,
                total_staked: 0,
                total_returned: 0,
            });
        stats.total_vaults += 1;
        stats.total_staked += stake;
        env.storage()
            .instance()
            .set(&DataKey::UserStats(owner.clone()), &stats);

        // Update global counters
        env.storage().instance().set(&DataKey::NextId, &(vault_id + 1));
        let total: u32 = env.storage().instance().get(&DataKey::TotalVaults).unwrap_or(0);
        env.storage().instance().set(&DataKey::TotalVaults, &(total + 1));
        let total_staked: i128 = env.storage().instance().get(&DataKey::TotalStaked).unwrap_or(0);
        env.storage().instance().set(&DataKey::TotalStaked, &(total_staked + stake));

        // Emit event
        emit_vault_created(&env, &owner, vault_id, stake, required_check_ins, deadline);

        vault_id
    }

    /// Record a check-in for a vault.
    /// Only the vault owner can check in, and only before the deadline.
    pub fn check_in(env: Env, vault_id: u32) {
        // Get vault
        let mut vault: Vault = env
            .storage()
            .instance()
            .get(&DataKey::Vault(vault_id))
            .expect("vault not found");

        // Authorize owner
        vault.owner.require_auth();

        // Validate state
        if vault.settled {
            panic!("vault already settled");
        }
        if env.ledger().timestamp() > vault.deadline {
            panic!("deadline has passed");
        }
        if vault.check_in_count >= vault.required_check_ins {
            panic!("all required check-ins already done");
        }

        // Increment counter
        vault.check_in_count += 1;
        env.storage()
            .instance()
            .set(&DataKey::Vault(vault_id), &vault);

        // Update user stats
        let mut stats: UserStats = env
            .storage()
            .instance()
            .get(&DataKey::UserStats(vault.owner.clone()))
            .unwrap();
        stats.total_check_ins += 1;
        if vault.check_in_count >= vault.required_check_ins {
            stats.completed_vaults += 1;
        }
        env.storage()
            .instance()
            .set(&DataKey::UserStats(vault.owner.clone()), &stats);

        // Emit event
        emit_checked_in(
            &env,
            vault_id,
            &vault.owner,
            vault.check_in_count,
            vault.required_check_ins,
        );
    }

    /// Settle a vault after the deadline.
    /// Two modes:
    ///   1. Default (proportional): returned = stake * check_ins / required, rest to beneficiary
    ///   2. Strict penalty: if check_ins < 50% of required, ALL stake goes to beneficiary
    /// Anyone can call this after the deadline.
    pub fn settle_vault(env: Env, vault_id: u32, token: Address) {
        let mut vault: Vault = env
            .storage()
            .instance()
            .get(&DataKey::Vault(vault_id))
            .expect("vault not found");

        if vault.settled {
            panic!("vault already settled");
        }
        if env.ledger().timestamp() <= vault.deadline {
            panic!("deadline has not passed yet");
        }

        vault.settled = true;
        env.storage()
            .instance()
            .set(&DataKey::Vault(vault_id), &vault);

        // Determine return vs. donate based on penalty mode
        let (returned, donated) = if vault.strict_penalty
            && (vault.check_in_count as i128) * 100 < (vault.required_check_ins as i128) * 50
        {
            // Strict penalty: below 50% check-ins → everything to beneficiary
            (0i128, vault.stake)
        } else {
            // Proportional: stake * (check_ins / required)
            let r = (vault.stake * vault.check_in_count as i128) / vault.required_check_ins as i128;
            (r, vault.stake - r)
        };

        let token_client = token::Client::new(&env, &token);
        if returned > 0 {
            token_client.transfer(&env.current_contract_address(), &vault.owner, &returned);
        }

        // Transfer donated stake to beneficiary (if any)
        // Skip if beneficiary is the burn address (null account) — funds stay
        // in the contract, unreachable by anyone, effectively burned.
        if donated > 0 && !is_burn_address(&env, &vault.beneficiary) {
            token_client.transfer(&env.current_contract_address(), &vault.beneficiary, &donated);
        }

        // Update user stats
        let mut stats: UserStats = env
            .storage()
            .instance()
            .get(&DataKey::UserStats(vault.owner.clone()))
            .unwrap();
        stats.total_returned += returned;
        env.storage()
            .instance()
            .set(&DataKey::UserStats(vault.owner.clone()), &stats);

        // Update global stats
        let total_completed: u32 = env.storage().instance().get(&DataKey::TotalCompleted).unwrap_or(0);
        env.storage().instance().set(&DataKey::TotalCompleted, &(total_completed + 1));
        let total_donated: i128 = env.storage().instance().get(&DataKey::TotalDonated).unwrap_or(0);
        env.storage().instance().set(&DataKey::TotalDonated, &(total_donated + donated));

        let completed = vault.check_in_count >= vault.required_check_ins;
        emit_vault_settled(&env, vault_id, &vault.owner, returned, donated, completed);
    }

    // ---- Query Functions ----

    /// Get vault details.
    pub fn get_vault(env: Env, vault_id: u32) -> Vault {
        env.storage()
            .instance()
            .get(&DataKey::Vault(vault_id))
            .expect("vault not found")
    }

    /// Get all vault IDs for a user.
    pub fn get_user_vaults(env: Env, user: Address) -> Vec<u32> {
        env.storage()
            .instance()
            .get(&DataKey::UserVaults(user))
            .unwrap_or(Vec::new(&env))
    }

    /// Get stats for a user.
    pub fn get_user_stats(env: Env, user: Address) -> UserStats {
        env.storage()
            .instance()
            .get(&DataKey::UserStats(user))
            .unwrap_or(UserStats {
                total_vaults: 0,
                completed_vaults: 0,
                total_check_ins: 0,
                total_staked: 0,
                total_returned: 0,
            })
    }

    /// Get global contract stats.
    pub fn get_global_stats(env: Env) -> (u32, u32, i128, i128) {
        let total_vaults = env.storage().instance().get(&DataKey::TotalVaults).unwrap_or(0);
        let total_completed = env.storage().instance().get(&DataKey::TotalCompleted).unwrap_or(0);
        let total_staked = env.storage().instance().get(&DataKey::TotalStaked).unwrap_or(0);
        let total_donated = env.storage().instance().get(&DataKey::TotalDonated).unwrap_or(0);
        (total_vaults, total_completed, total_staked, total_donated)
    }

    /// Check if the deadline has passed for a vault.
    pub fn is_deadline_passed(env: Env, vault_id: u32) -> bool {
        let vault: Vault = env
            .storage()
            .instance()
            .get(&DataKey::Vault(vault_id))
            .expect("vault not found");
        env.ledger().timestamp() > vault.deadline
    }
}
// Tests are available but require `features = ["testutils"]` in Cargo.toml
// and a compatible Rust toolchain. Run:
//   cargo test --features testutils
// Note: soroban-sdk v21 has a known compatibility issue with Rust 1.97+
// that affects the testutils feature. Tests work on Rust 1.75-1.83.
