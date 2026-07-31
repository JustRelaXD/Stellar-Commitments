import { useState, useCallback } from 'react';
import {
  rpc,
  Contract,
  TransactionBuilder,
  nativeToScVal,
  scValToNative,
  Address,
  BASE_FEE,
} from '@stellar/stellar-sdk';
import { RPC_URL, NETWORK_PASSPHRASE, CONTRACT_ADDRESS, XLM_TOKEN_ADDRESS } from '../constants';
import type { Vault, UserStats, GlobalStats, TxState } from '../types';

// ── ScVal conversion helpers ──────────────────────────────────────────

function addr(v: string) {
  return new Address(v).toScVal();
}
function str(v: string) {
  return nativeToScVal(v, { type: 'string' as any });
}
function u32(v: number) {
  return nativeToScVal(v, { type: 'u32' as any });
}
function u64(v: number) {
  return nativeToScVal(v, { type: 'u64' as any });
}
function i128(v: number | bigint) {
  return nativeToScVal(BigInt(v), { type: 'i128' as any });
}

// ── Convert raw contract Vault map → our TS type ─────────────────────

function rawToVault(vaultId: number, raw: any): { id: number; data: Vault } {
  return {
    id: vaultId,
    data: {
      owner:              raw.owner?.toString() ?? '',
      description:        raw.description?.toString() ?? '',
      required_check_ins: Number(raw.required_check_ins) || 0,
      check_in_count:     Number(raw.check_in_count) || 0,
      deadline:           Number(raw.deadline) || 0,
      stake:              Number(raw.stake) || 0,
      settled:            Boolean(raw.settled),
      beneficiary:        raw.beneficiary?.toString() ?? '',
      strict_penalty:     Boolean(raw.strict_penalty),
    },
  };
}

function rawToUserStats(raw: any): UserStats {
  return {
    total_vaults:      Number(raw.total_vaults) || 0,
    completed_vaults:  Number(raw.completed_vaults) || 0,
    total_check_ins:   Number(raw.total_check_ins) || 0,
    total_staked:      Number(raw.total_staked) || 0,
    total_returned:    Number(raw.total_returned) || 0,
  };
}

function rawToGlobalStats(raw: any): GlobalStats {
  // get_global_stats returns a tuple (u32, u32, i128, i128)
  if (Array.isArray(raw)) {
    return {
      total_vaults:    Number(raw[0]) || 0,
      total_completed: Number(raw[1]) || 0,
      total_staked:    Number(raw[2]) || 0,
      total_donated:   Number(raw[3]) || 0,
    };
  }
  return { total_vaults: 0, total_completed: 0, total_staked: 0, total_donated: 0 };
}

// Check if simulation was successful by inspecting the response
function isSimSuccess(sim: any): boolean {
  return !sim.error && !!sim.result;
}

// ── Hook ─────────────────────────────────────────────────────────────

export function useContract(
  walletAddress: string,
  signTransaction: (txXdr: string) => Promise<string>,
) {
  const [txState, setTxState] = useState<TxState>({ status: 'idle' });
  const resetTx = useCallback(() => setTxState({ status: 'idle' }), []);

  /** Read-only contract call (simulate). */
  const read = useCallback(async <T>(method: string, ...scArgs: any[]): Promise<T> => {
    if (!walletAddress) throw new Error('Wallet not connected');
    const server = new rpc.Server(RPC_URL);
    const contract = new Contract(CONTRACT_ADDRESS);
    const op = contract.call(method, ...scArgs);

    const source = await server.getAccount(walletAddress);
    const tx = new TransactionBuilder(source, { fee: BASE_FEE, networkPassphrase: NETWORK_PASSPHRASE })
      .addOperation(op)
      .setTimeout(30)
      .build();

    const sim: any = await server.simulateTransaction(tx);
    if (!isSimSuccess(sim)) {
      throw new Error(sim?.error ?? 'Read simulation failed');
    }
    return scValToNative(sim.result.retval) as T;
  }, [walletAddress]);

  /** Write contract call (simulate → assemble → sign → submit → poll). */
  const write = useCallback(async (
    method: string,
    ...scArgs: any[]
  ): Promise<{ hash: string; returnValue?: any }> => {
    if (!walletAddress) throw new Error('Wallet not connected');
    setTxState({ status: 'pending' });

    const classifyErr = (msg: string): string => {
      const m = msg.toLowerCase();
      if (m.includes('reject') || m.includes('cancel')) return 'Transaction rejected by user';
      if (m.includes('insufficient') || m.includes('balance')) return 'Insufficient balance';
      if (m.includes('not found')) return 'Vault not found';
      return msg;
    };

    try {
      const server = new rpc.Server(RPC_URL);
      const contract = new Contract(CONTRACT_ADDRESS);
      const op = contract.call(method, ...scArgs);

      const source = await server.getAccount(walletAddress);
      let tx = new TransactionBuilder(source, { fee: BASE_FEE, networkPassphrase: NETWORK_PASSPHRASE })
        .addOperation(op)
        .setTimeout(30)
        .build();

      // Simulate to get footprint + auth entries
      const sim: any = await server.simulateTransaction(tx);
      if (!isSimSuccess(sim)) {
        const err = sim?.error ?? 'Simulation failed';
        const msg = classifyErr(err);
        setTxState({ status: 'failed', error: msg });
        throw new Error(msg);
      }

      // Assemble with footprint
      tx = rpc.assembleTransaction(tx, sim).build();

      // Sign via connected wallet
      const signedXdr = await signTransaction(tx.toXDR());
      const signedTx = TransactionBuilder.fromXDR(signedXdr, NETWORK_PASSPHRASE);

      // Submit
      const sendResp: any = await server.sendTransaction(signedTx);
      const txHash = sendResp.hash;
      if (!txHash) throw new Error('No tx hash returned');

      // Poll until confirmed
      let attempts = 0;
      let getResp: any = await server.getTransaction(txHash);
      while (getResp.status === 'NOT_FOUND' && attempts < 30) {
        await new Promise(r => setTimeout(r, 1000));
        getResp = await server.getTransaction(txHash);
        attempts++;
      }

      if (getResp.status === 'SUCCESS') {
        let returnValue: any;
        if (getResp.returnValue) {
          returnValue = scValToNative(getResp.returnValue);
        }              setTxState({ status: 'success', hash: txHash });
        return { hash: txHash, returnValue };
      }

      if (getResp.status === 'FAILED') {
        throw new Error('Transaction failed on-chain');
      }
      throw new Error('Transaction timed out');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message
        : typeof err === 'string' ? err
        : err && typeof err === 'object' && 'message' in err ? String((err as any).message)
        : 'Unknown error';
      setTxState({ status: 'failed', error: classifyErr(msg) });
      // Normalize to Error before rethrowing
      throw err instanceof Error ? err : new Error(msg);
    }
  }, [walletAddress, signTransaction]);      // ── High-level convenience methods ────────────────────────────────

  const createVault = useCallback(async (
    description: string,
    durationSeconds: number,
    requiredCheckIns: number,
    stakeXlm: number,
    beneficiary: string,
    strictPenalty: boolean,
  ): Promise<{ vaultId: number; hash: string }> => {
    const deadline = Math.floor(Date.now() / 1000) + durationSeconds;
    const stakeStroops = BigInt(Math.floor(stakeXlm * 10_000_000));

    const { returnValue: vaultId, hash } = await write(
      'create_vault',
      addr(XLM_TOKEN_ADDRESS),
      addr(walletAddress),
      str(description),
      u32(requiredCheckIns),
      u64(deadline),
      i128(stakeStroops),
      addr(beneficiary),
      nativeToScVal(strictPenalty, { type: 'bool' as any }),
    );
    return { vaultId: Number(vaultId), hash };
  }, [walletAddress, write]);

  const checkIn = useCallback(async (vaultId: number): Promise<{ hash: string }> => {
    return await write('check_in', u32(vaultId));
  }, [write]);

  const settleVault = useCallback(async (vaultId: number): Promise<{ hash: string }> => {
    return await write('settle_vault', u32(vaultId), addr(XLM_TOKEN_ADDRESS));
  }, [write]);

  // ── Read convenience methods ──────────────────────────────────────

  const getVault = useCallback(async (vaultId: number): Promise<{ id: number; data: Vault }> => {
    const raw = await read<any>('get_vault', u32(vaultId));
    return rawToVault(vaultId, raw);
  }, [read]);

  const getUserVaults = useCallback(async (address: string): Promise<number[]> => {
    const ids = await read<number[]>('get_user_vaults', addr(address));
    return ids.map(Number);
  }, [read]);

  const getUserStats = useCallback(async (address: string): Promise<UserStats> => {
    const raw = await read<any>('get_user_stats', addr(address));
    return rawToUserStats(raw);
  }, [read]);

  const getGlobalStats = useCallback(async (): Promise<GlobalStats> => {
    const raw = await read<any>('get_global_stats');
    return rawToGlobalStats(raw);
  }, [read]);

  const isDeadlinePassed = useCallback(async (vaultId: number): Promise<boolean> => {
    return await read<boolean>('is_deadline_passed', u32(vaultId));
  }, [read]);

  return {
    // Generic
    read,
    write,
    // High-level writes
    createVault,
    checkIn,
    settleVault,
    // High-level reads
    getVault,
    getUserVaults,
    getUserStats,
    getGlobalStats,
    isDeadlinePassed,
    // Tx state
    txState,
    resetTx,
  };
}
