'use client';

import { useState } from 'react';
import { normalizeAddress, upsertWallet } from '@/lib/walletAuth';

declare global {
  interface Window {
    ethereum?: {
      request: (args: { method: string; params?: unknown[] }) => Promise<unknown>;
    };
  }
}

type WalletConnectButtonsProps = {
  userId?: string;
  onWalletConnected?: (wallet: { address: string; provider: 'metamask' | 'sequence'; chainId?: number }) => void;
};

export function WalletConnectButtons({ userId, onWalletConnected }: WalletConnectButtonsProps) {
  const [status, setStatus] = useState<string>('Wallet disconnected');
  const [address, setAddress] = useState<string>('');

  async function saveWallet(walletAddress: string, provider: 'metamask' | 'sequence', chainId?: number) {
    setAddress(walletAddress);
    onWalletConnected?.({ address: walletAddress, provider, chainId });

    if (userId) {
      await upsertWallet({ userId, walletAddress, walletType: provider, chainId });
      setStatus(`${provider} connected and saved${chainId ? ` on chain ${chainId}` : ''}`);
      return;
    }

    setStatus(`${provider} connected${chainId ? ` on chain ${chainId}` : ''}. Create/sign in to save wallet.`);
  }

  async function connectMetaMask() {
    if (!window.ethereum) {
      setStatus('MetaMask not detected. Install MetaMask or use Sequence.');
      return;
    }

    const accounts = (await window.ethereum.request({ method: 'eth_requestAccounts' })) as string[];
    const chainIdHex = (await window.ethereum.request({ method: 'eth_chainId' })) as string;
    const chainId = Number.parseInt(chainIdHex, 16);
    const walletAddress = normalizeAddress(accounts[0]);

    await saveWallet(walletAddress, 'metamask', chainId);
  }

  async function connectSequence() {
    try {
      const projectAccessKey = process.env.NEXT_PUBLIC_SEQUENCE_PROJECT_ACCESS_KEY;
      const defaultChainId = Number(process.env.NEXT_PUBLIC_DEFAULT_CHAIN_ID || 80002);

      if (!projectAccessKey) {
        setStatus('Missing NEXT_PUBLIC_SEQUENCE_PROJECT_ACCESS_KEY. Add it to .env.local first.');
        return;
      }

      const sequenceModule = (await import('0xsequence')) as any;
      const sequence = sequenceModule.sequence ?? sequenceModule.default?.sequence;

      if (!sequence?.initWallet) {
        setStatus('Sequence SDK loaded, but initWallet was not found. Check installed 0xsequence version.');
        return;
      }

      const wallet = sequence.initWallet(defaultChainId, { projectAccessKey });
      await wallet.connect({ app: 'STLLCWeb3', authorize: true });
      const walletAddress = normalizeAddress(await wallet.getAddress());

      await saveWallet(walletAddress, 'sequence', defaultChainId);
    } catch (error) {
      setStatus(error instanceof Error ? error.message : 'Sequence connection failed.');
    }
  }

  return (
    <section className="rounded-2xl border p-5 shadow-sm">
      <h2 className="text-xl font-semibold">Wallet Login</h2>
      <p className="mt-2 text-sm opacity-75">Connect MetaMask or Sequence. Connected wallets are saved to Supabase when a user ID is present.</p>
      <div className="mt-4 flex flex-wrap gap-3">
        <button className="rounded-xl border px-4 py-2" onClick={connectMetaMask}>Connect MetaMask</button>
        <button className="rounded-xl border px-4 py-2" onClick={connectSequence}>Connect Sequence</button>
      </div>
      <p className="mt-4 text-sm">{status}</p>
      {address ? <p className="mt-2 font-mono text-xs">{address}</p> : null}
    </section>
  );
}
