'use client';

import { useState } from 'react';
import { WalletConnectButtons } from '@/components/wallet/WalletConnectButtons';
import { ContractRegistry } from '@/components/ContractRegistry';
import { AgentPanel } from '@/components/AgentPanel';

export default function DashboardPage() {
  const [walletAddress, setWalletAddress] = useState<string>('');

  return (
    <main className="mx-auto grid max-w-7xl gap-6 p-6">
      <header>
        <p className="text-xs uppercase tracking-wide opacity-60">STLLCWeb3</p>
        <h1 className="text-3xl font-bold">Web3 Command Dashboard</h1>
        <p className="mt-2 max-w-3xl text-sm opacity-75">
          Wallet login, contract registry, and live AI agent command center for crypto, contracts, NFTs, tokenomics, and compliance.
        </p>
      </header>

      <WalletConnectButtons onWalletConnected={(wallet) => setWalletAddress(wallet.address)} />
      <ContractRegistry />
      <AgentPanel walletAddress={walletAddress} />
    </main>
  );
}
