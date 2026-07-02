import { ComplianceGate } from '@/components/compliance/ComplianceGate';
import { AdminMutationPanel } from '@/components/admin/AdminMutationPanel';

export default function SecurityDashboardPage() {
  return (
    <main className="mx-auto grid max-w-6xl gap-6 p-6">
      <header>
        <p className="text-xs uppercase tracking-wide opacity-60">STLLCWeb3 Security Layer</p>
        <h1 className="text-3xl font-semibold">Auth, Compliance, Rate Limits, Admin Controls</h1>
      </header>
      <ComplianceGate />
      <AdminMutationPanel />
    </main>
  );
}
