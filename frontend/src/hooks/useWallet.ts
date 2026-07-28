import { useState, useEffect, useCallback } from 'react';
import { NETWORK_PASSPHRASE, NETWORK } from '../constants';
import type { WalletInfo } from '../types';

let kitInstance: any = null;

async function getKit() {
  if (!kitInstance) {
    try {
      // Import from the installed NPM package
      const mod = await import('@creit.tech/stellar-wallets-kit');
      const { StellarWalletsKit } = mod;
      const { allowAllModules } = mod;

      kitInstance = new StellarWalletsKit({
        network: NETWORK_PASSPHRASE as any,
        modules: allowAllModules(),
      });
    } catch (err) {
      console.warn('StellarWalletsKit not available:', err);
      return null;
    }
  }
  return kitInstance;
}

export function useWallet() {
  const [wallet, setWallet] = useState<WalletInfo>({
    address: '',
    isConnected: false,
    network: NETWORK as 'TESTNET' | 'PUBLIC',
  });
  const [error, setError] = useState<string | null>(null);
  const [isConnecting, setIsConnecting] = useState(false);

  useEffect(() => {
    const savedAddress = localStorage.getItem('stellar_vault_address');
    if (savedAddress) {
      setWallet(prev => ({ ...prev, address: savedAddress, isConnected: true }));
    }
  }, []);

  const connect = useCallback(async () => {
    setIsConnecting(true);
    setError(null);
    try {
      const kit = await getKit();
      if (!kit) {
        // Demo mode - simulate a wallet connection
        const demoAddress = prompt('Enter your Stellar public key (or leave empty for demo):');
        const address = demoAddress || 'GBR3KX4LZVNB4SVHFGMGQJ5QTKX7K4J5M7J5K7K4J5M7J5K7K4J5M7';
        setWallet({ address, isConnected: true, network: NETWORK as 'TESTNET' | 'PUBLIC' });
        localStorage.setItem('stellar_vault_address', address);
        return;
      }

      // Get supported wallets
      const wallets = await kit.getSupportedWallets();

      if (wallets.length === 0) {
        throw new Error('No supported wallets found');
      }

      // Open modal for wallet selection
      kit.openModal({
        onWalletSelected: async (option: any) => {
          try {
            kit.setWallet(option.id);
            const { address } = await kit.getAddress();
            setWallet({ address, isConnected: true, network: NETWORK as 'TESTNET' | 'PUBLIC' });
            localStorage.setItem('stellar_vault_address', address);
            setError(null);
          } catch (err: unknown) {
            const msg = err instanceof Error ? err.message : 'Failed to connect wallet';
            setError(msg);
          }
        },
        onClosed: (err: Error) => {
          if (err) {
            setError('Wallet selection cancelled');
          }
        },
      });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Wallet connection failed';

      // Fallback to demo mode if wallet kit fails
      if (msg.includes('Cannot find module') || msg.includes('not available')) {
        const demoAddress = 'GBR3KX4LZVNB4SVHFGMGQJ5QTKX7K4J5M7J5K7K4J5M7J5K7K4J5M7';
        setWallet({ address: demoAddress, isConnected: true, network: NETWORK as 'TESTNET' | 'PUBLIC' });
        localStorage.setItem('stellar_vault_address', demoAddress);
        return;
      }
      setError(msg);
    } finally {
      setIsConnecting(false);
    }
  }, []);

  const disconnect = useCallback(() => {
    setWallet({ address: '', isConnected: false, network: NETWORK as 'TESTNET' | 'PUBLIC' });
    localStorage.removeItem('stellar_vault_address');
  }, []);

  const signTransaction = useCallback(async (txXdr: string): Promise<string> => {
    if (!wallet.address) throw new Error('Wallet not connected');
    try {
      const kit = await getKit();
      if (!kit) {
        // Demo mode - simulate signing
        return txXdr;
      }
      const { signedTxXdr } = await kit.signTransaction(txXdr, {
        networkPassphrase: NETWORK_PASSPHRASE,
        address: wallet.address,
      });
      return signedTxXdr;
    } catch (err: unknown) {
      if (err instanceof Error) {
        if (err.message.toLowerCase().includes('cancel') || err.message.toLowerCase().includes('reject')) {
          throw new Error('Transaction rejected by user');
        }
        if (err.message.toLowerCase().includes('insufficient') || err.message.toLowerCase().includes('balance')) {
          throw new Error('Insufficient balance');
        }
      }
      throw err;
    }
  }, [wallet.address]);

  return { wallet, error, isConnecting, connect, disconnect, signTransaction };
}
