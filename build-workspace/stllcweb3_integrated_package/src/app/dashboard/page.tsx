import { WalletConnectButtons } from '@/components/wallet/WalletConnectButtons';
import { ContractRegistry } from '@/components/ContractRegistry';
import { AgentPanel } from '@/components/AgentPanel';

export default function DashboardPage() {
  return (
    <main className="space-y-6 p-6">
      <WalletConnectButtons />
      <ContractRegistry />
      <AgentPanel />
    </main>
  );
}
