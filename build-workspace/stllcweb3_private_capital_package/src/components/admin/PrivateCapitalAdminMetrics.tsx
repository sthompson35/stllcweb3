export function PrivateCapitalAdminMetrics({ commitments }: { commitments: any[] }) {
  const totalCommitted = commitments.reduce((s, c) => s + Number(c.committed_amount || 0), 0);
  const totalFunded = commitments.reduce((s, c) => s + Number(c.funded_amount || 0), 0);
  const investorCount = new Set(commitments.map(c => c.investor_user_id)).size;
  const averageCommitment = investorCount ? totalCommitted / investorCount : 0;

  return (
    <section className="grid gap-3 md:grid-cols-5">
      <Card label="Total Commitments" value={totalCommitted} />
      <Card label="Capital Raised" value={totalFunded} />
      <Card label="Remaining" value={totalCommitted - totalFunded} />
      <Card label="Investor Count" value={investorCount} raw />
      <Card label="Average Commitment" value={averageCommitment} />
    </section>
  );
}

function Card({ label, value, raw }: { label: string; value: number; raw?: boolean }) {
  return <div className="rounded-xl border p-4"><p className="text-sm opacity-70">{label}</p><p className="text-2xl font-bold">{raw ? value : `$${value.toLocaleString()}`}</p></div>;
}
