import { useState, useEffect, useCallback } from 'react';
import { NETWORK_PASSPHRASE, NETWORK } from '../constants';
import type { WalletInfo } from '../types';

// Lazy-load the StellarWalletsKit so it doesn't crash the page on import
let kitInstance: any = null;
let kitLoadError: string | null = null;

async function getKit() {
  if (kitInstance) return kitInstance;
  if (kitLoadError) return null;

  try {
    const mod = await import('@creit.tech/stellar-wallets-kit');
    const { StellarWalletsKit, allowAllModules, WalletNetwork } = mod;
    kitInstance = new StellarWalletsKit({
      network: NETWORK === 'TESTNET' ? WalletNetwork.TESTNET : WalletNetwork.PUBLIC,
      modules: allowAllModules(),
    });
    return kitInstance;
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Unknown error loading wallet kit';
    console.error('StellarWalletsKit failed to load:', msg);
    kitLoadError = msg;
    return null;
  }
}

export function useWallet() {
  const [wallet, setWallet] = useState<WalletInfo>({
    address: '',
    isConnected: false,
    network: NETWORK as 'TESTNET' | 'PUBLIC',
  });
  const [error, setError] = useState<string | null>(null);
  const [isConnecting, setIsConnecting] = useState(false);

  // Restore previously connected address from localStorage
  // so returning users don't have to reconnect every visit.
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
        setError('Wallet connection unavailable. ' + (kitLoadError || 'Please check your browser console for details.'));
        setIsConnecting(false);
        return;
      }

      // Get the list of supported/available wallets
      const wallets = await kit.getSupportedWallets();
      const availableWallets = wallets.filter((w: any) => w.isAvailable);

      if (availableWallets.length === 0) {
        setError(
          'No Stellar wallet detected. Please install Freighter, Lobstr, xBull, or ' +
          'another Stellar wallet extension, create an account, switch to Testnet, and try again.'
        );
        setIsConnecting(false);
        return;
      }

      // Keep isConnecting = true while modal is open;
      // it will be cleared when user selects a wallet or closes the modal.
      kit.openModal({
        onWalletSelected: async (option: any) => {
          try {
            kit.setWallet(option.id);
            const { address } = await kit.getAddress();
            setWallet(prev => ({ ...prev, address, isConnected: true }));
            localStorage.setItem('stellar_vault_address', address);
            setError(null);
          } catch (err: unknown) {
            const msg = err instanceof Error ? err.message : 'Failed to get wallet address';
            setError(msg);
          } finally {
            setIsConnecting(false);
          }
        },
        onClosed: () => {
          setIsConnecting(false);
        },
      });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Wallet connection failed';
      setError(msg);
      setIsConnecting(false);
    }
  }, []);

  const disconnect = useCallback(() => {
    setWallet({ address: '', isConnected: false, network: NETWORK as 'TESTNET' | 'PUBLIC' });
    localStorage.removeItem('stellar_vault_address');
  }, []);

  const signTransaction = useCallback(async (txXdr: string): Promise<string> => {
    if (!wallet.address) throw new Error('Wallet not connected');

    const kit = await getKit();
    if (!kit) {
      throw new Error(kitLoadError ? `Wallet kit error: ${kitLoadError}` : 'Wallet connection unavailable');
    }

    try {
      const { signedTxXdr } = await kit.signTransaction(txXdr, {
        networkPassphrase: NETWORK_PASSPHRASE,
        address: wallet.address,
      });

      if (!signedTxXdr) {
        throw new Error('Wallet returned an empty transaction');
      }

      return signedTxXdr;
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);

      if (
        message.toLowerCase().includes('cancel') ||
        message.toLowerCase().includes('reject') ||
        message.toLowerCase().includes('user denied')
      ) {
        throw new Error('Transaction rejected by user');
      }
      if (
        message.toLowerCase().includes('insufficient') ||
        message.toLowerCase().includes('balance') ||
        message.toLowerCase().includes('op_underfunded')
      ) {
        throw new Error('Insufficient balance');
      }

      throw err;
    }
  }, [wallet.address]);

  return { wallet, error, isConnecting, connect, disconnect, signTransaction };
}
