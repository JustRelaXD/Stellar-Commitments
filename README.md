# Stellar Vault 🔒

**On-chain Commitment Savings on Stellar**

Stellar Vault is a decentralized accountability platform where users stake XLM on their goals. Complete your check-ins to get your stake back. Miss some? The unearned portion is proportionally slashed and donated to charity.

## ✨ Features

- **Create Vaults** — Set a goal, stake XLM, define check-in requirements and deadline
- **Daily Check-ins** — Prove commitment with on-chain transactions
- **Proportional Slashing** — Complete X of Y check-ins → get (X/Y) * stake back, rest goes to charity
- **Real-time Event Feed** — Watch vault creations, check-ins, and settlements as they happen
- **Multi-wallet Support** — Connect with Freighter, Lobstr, Albedo, and more via StellarWalletsKit
- **Transaction Status** — Pending / success / failed toast notifications for every action
- **Leaderboard** — Top vault completers ranked by completed goals
- **Global Stats** — Total vaults created, completed, staked, and donated

## 📋 Requirements

| Requirement | Status |
|---|---|
| 3+ error types handled | ✅ Wallet not found, tx rejected, insufficient balance, vault not found, deadline passed, already checked in |
| Contract deployed on testnet | ✅ See [Deployment](#deployment) |
| Contract called from frontend | ✅ Via `@stellar/stellar-sdk` |
| Transaction status visible | ✅ Toast with pending/success/failed states |
| 2+ meaningful commits | ✅ See git log |
| Multi-wallet integration | ✅ StellarWalletsKit (Freighter, Lobstr, Albedo, Rabet, xBull, Hana) |
| Real-time event integration | ✅ Events streamed via contract emission + reflection in UI |

## 🏗 Architecture

```
stellar-vault/
├── contract/            # Soroban smart contract (Rust)
│   ├── Cargo.toml
│   ├── src/
│   │   └── lib.rs       # Vault contract logic
│   └── target/          # Compiled WASM
└── frontend/            # React + Vite + TypeScript
    ├── src/
    │   ├── App.tsx            # Main app with demo state management
    │   ├── constants.ts       # Network, contract addresses
    │   ├── types.ts           # TypeScript interfaces
    │   ├── hooks/
    │   │   └── useWallet.ts   # StellarWalletsKit integration
    │   ├── utils/
    │   │   └── contract.ts    # Contract client helpers
    │   └── components/
    │       ├── WalletConnect   # Wallet connection button
    │       ├── CreateVault     # Vault creation form
    │       ├── VaultCard       # Individual vault display
    │       ├── VaultList       # Filterable vault list
    │       ├── EventFeed       # Real-time activity feed
    │       ├── Leaderboard     # Top completers ranking
    │       ├── GlobalStats     # Global statistics cards
    │       └── TxStatus        # Transaction status toast
    └── package.json
```

## 🚀 Quick Start

### Prerequisites

- Node.js v18+
- Rust (rustc + cargo)
- Stellar CLI (`stellar`) — for contract deployment
- A Stellar testnet account funded via [Friendbot](https://friendbot.stellar.org)

### 1. Clone and Install

```bash
git clone <your-repo-url>
cd stellar-vault

# Install frontend dependencies
cd frontend && npm install
cd ..
```

### 2. Configure Environment

```bash
cp frontend/.env.example frontend/.env
```

Edit `.env` with your deployed contract address (see Deployment section):

```env
VITE_CONTRACT_ADDRESS=CCYOURCONTRACTADDRESSHERE
VITE_NETWORK=TESTNET
VITE_RPC_URL=https://soroban-testnet.stellar.org
```

### 3. Deploy the Smart Contract

```bash
cd contract

# Build the contract
stellar contract build

# Deploy to testnet (replace with your funded account secret key)
stellar contract deploy \
  --wasm target/wasm32-unknown-unknown/release/stellar_vault.wasm \
  --source <YOUR_SECRET_KEY> \
  --network testnet

# Copy the returned contract ID to your frontend .env
```

### 4. Run the Frontend

```bash
cd frontend
npm run dev
```

Open http://localhost:5173 in your browser.

## 🧪 Smart Contract Interface

### Write Functions

| Function | Parameters | Description |
|---|---|---|
| `create_vault` | `token, owner, description, required_check_ins, deadline, stake` | Create a vault and stake XLM |
| `check_in` | `vault_id` | Record a daily check-in |
| `settle_vault` | `vault_id, token, charity` | Settle after deadline (proportional return) |

### Read Functions

| Function | Parameters | Returns |
|---|---|---|
| `get_vault` | `vault_id` | `Vault` struct |
| `get_user_vaults` | `user` | `Vec<u32>` (vault IDs) |
| `get_user_stats` | `user` | `UserStats` struct |
| `get_global_stats` | — | `(total_vaults, total_completed, total_staked, total_donated)` |
| `is_deadline_passed` | `vault_id` | `bool` |

### Events

| Event | Topics | Data |
|---|---|---|
| `vault_created` | `(Symbol("vault_created"), owner)` | `(vault_id, stake, required, deadline)` |
| `checked_in` | `(Symbol("checked_in"),)` | `(vault_id, owner, count, required)` |
| `vault_settled` | `(Symbol("vault_settled"),)` | `(vault_id, owner, returned, donated, completed)` |

### Error Handling

The contract handles these error conditions:
- `required_check_ins must be > 0`
- `deadline must be in the future`
- `stake must be > 0`
- `vault not found`
- `vault already settled`
- `deadline has passed`
- `all required check-ins already done`

## 🖼 Screenshots

<!-- Replace with your actual screenshots -->
> Screenshot: Wallet connect modal showing available wallet options
> Screenshot: Vault creation form with staking fields
> Screenshot: Live event feed with check-in activity

## 🔗 Deployed Contract

- **Network:** Stellar Testnet
- **Contract Address:** `CDL2L6HJCQGN3CGATTLZPSFZJD3J4CISBJV3UL74B43RFRA5TUSYTQIS`
- **Explorer:** [Stellar Expert](https://stellar.expert/explorer/testnet/contract/CDL2L6HJCQGN3CGATTLZPSFZJD3J4CISBJV3UL74B43RFRA5TUSYTQIS)

## 🔍 Transaction Hashes

| Action | Hash |
|---|---|
| **Friendbot Fund** | `c244e2c72d77a6834eb93b5c77d6a1d352f6bb07b7ebd60ba7aac8c26d568467` |
| **WASM Upload** | `483e400f0226837fa05b1d50ff45ce6b650d3ee31beda8a9f3cd5879893be736` |
| **Contract Deploy** | `078534535a91273553f4ae6d4817aeb3e66ccad9a115eedc013b6478311d4dbd` |

## 🛠 Tech Stack

- **Smart Contract:** Rust + Soroban SDK 21
- **Frontend:** React 18 + TypeScript + Vite
- **Styling:** Tailwind CSS
- **Wallet:** @creit.tech/stellar-wallets-kit
- **Stellar SDK:** @stellar/stellar-sdk

## 📄 License

MIT
