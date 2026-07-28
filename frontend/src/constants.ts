// Stellar network configuration
// Vite env vars are accessed via import.meta.env - types provided by vite/client
export const NETWORK = (import.meta.env.VITE_NETWORK as string) === 'PUBLIC' ? 'PUBLIC' : 'TESTNET';
export const NETWORK_PASSPHRASE = NETWORK === 'TESTNET'
  ? 'Test SDF Network ; September 2015'
  : 'Public Global Stellar Network ; September 2015';
export const RPC_URL = import.meta.env.VITE_RPC_URL || 'https://soroban-testnet.stellar.org';

// Native XLM token address on testnet
// This is the Stellar Asset Contract for XLM on testnet
export const XLM_TOKEN_ADDRESS = import.meta.env.VITE_XLM_TOKEN_ADDRESS || 'CDLZFC3SYJYDZT7K67VZ75HPJVIEUVNIXF47ZG2Q2ATQ5IX6H4ZQG3G';

// Charity address that receives slashed funds
// Replace with a real charity testnet address after deployment
export const CHARITY_ADDRESS = import.meta.env.VITE_CHARITY_ADDRESS || 'GANOG5IK7CRZQF6YRF5SKCU7ZFSZR4H5XVF2QF3K4HXF2QF3K4HXF2QF3';

// Contract address - UPDATE THIS AFTER DEPLOYMENT
export const CONTRACT_ADDRESS = import.meta.env.VITE_CONTRACT_ADDRESS || '';
