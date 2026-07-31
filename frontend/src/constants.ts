// Stellar network configuration
// Vite env vars are accessed via import.meta.env - types provided by vite/client
export const NETWORK = (import.meta.env.VITE_NETWORK as string) === 'PUBLIC' ? 'PUBLIC' : 'TESTNET';
export const NETWORK_PASSPHRASE = NETWORK === 'TESTNET'
  ? 'Test SDF Network ; September 2015'
  : 'Public Global Stellar Network ; September 2015';
export const RPC_URL = import.meta.env.VITE_RPC_URL || 'https://soroban-testnet.stellar.org';

// Native XLM token address on testnet
// This is the Stellar Asset Contract for XLM on testnet
export const XLM_TOKEN_ADDRESS = import.meta.env.VITE_XLM_TOKEN_ADDRESS || 'CDLZFC3SYJYDZT7K67VZ75HPJVIEUVNIXF47ZG2FB2RMQQVU2HHGCYSC';

// Contract address (v3 - with burn address support)
export const CONTRACT_ADDRESS = import.meta.env.VITE_CONTRACT_ADDRESS || 'CDLIRSHZJIA22GDE7M7JJ2PAUJ3OTLRH2UTVNXAGYSK3O5X4IXFIEZTC';

// Stellar null/burn address — all zeros, no one knows the private key.
// Slashed XLM sent here stays in the contract, effectively burned.
export const BURN_ADDRESS = 'GAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAWHF';
