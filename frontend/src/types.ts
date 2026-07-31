export interface Vault {
  owner: string;
  description: string;
  required_check_ins: number;
  check_in_count: number;
  deadline: number;
  stake: number;
  settled: boolean;
  beneficiary: string;
  strict_penalty: boolean;
}

export interface UserStats {
  total_vaults: number;
  completed_vaults: number;
  total_check_ins: number;
  total_staked: number;
  total_returned: number;
}

export interface GlobalStats {
  total_vaults: number;
  total_completed: number;
  total_staked: number;
  total_donated: number;
}

export interface ContractEvent {
  type: 'vault_created' | 'checked_in' | 'vault_settled';
  data: Record<string, unknown>;
  timestamp: number;
  txHash?: string;
}

export type TxStatus = 'idle' | 'pending' | 'success' | 'failed';

export interface TxState {
  status: TxStatus;
  hash?: string;
  error?: string;
}

export interface WalletInfo {
  address: string;
  isConnected: boolean;
  network: 'TESTNET' | 'PUBLIC';
}
