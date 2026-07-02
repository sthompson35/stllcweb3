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
};

export function WalletConnectButtons({ userId }: WalletConnectButtonsProps) {
  const [status, setStatus] = useState<string>('Wallet disconnected');
  const [address, setAddress] = useState<string>('');

  async function connectMetaMask() {
    if (!window.ethereum) {
      setStatus('MetaMask not detected. Install MetaMask or use Sequence.');
      return;
    }

    const accounts = (await window.ethereum.request({ method: 'eth_requestAccounts' })) as string[];
    const chainIdHex = (await window.ethereum.request({ method: 'eth_chainId' })) as string;
    const chainId = Number.parseInt(chainIdHex, 16);
    const walletAddress = normalizeAddress(accounts[0]);

    setAddress(walletAddress);
    setStatus(`MetaMask connected on chain ${chainId}`);

    if (userId) {
      await upsertWallet({ userId, walletAddress, walletType: 'metamask', chainId });
      setStatus(`MetaMask connected and saved on chain ${chainId}`);
    }
  }

  async function connectSequence() {
    setStatus('Sequence connector placeholder ready. Install @0xsequence/connect and wire project access key.');
  }

  return (
    <section className="rounded-2xl border p-5 shadow-sm">
      <h2 className="text-xl font-semibold">Wallet Login</h2>
      <p className="mt-2 text-sm opacity-75">Connect MetaMask now. Sequence is staged for package install and project key wiring.</p>
      <div className="mt-4 flex flex-wrap gap-3">
        <button className="rounded-xl border px-4 py-2" onClick={connectMetaMask}>Connect MetaMask</button>
        <button className="rounded-xl border px-4 py-2" onClick={connectSequence}>Connect Sequence</button>
      </div>
      <p className="mt-4 text-sm">{status}</p>
      {address ? <p className="mt-2 font-mono text-xs">{address}</p> : null}
    </section>
  );
}
