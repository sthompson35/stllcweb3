'use client';

import { useEffect, useMemo, useState } from 'react';

export function CapitalCommitmentTracker({ dealId, accessToken }: { dealId: string; accessToken: string }) {
  const [commitments, setCommitments] = useState<any[]>([]);

  useEffect(() => {
    if (!accessToken) return;
    fetch(`/api/capital-commitments?deal_id=${dealId}`, { headers: { Authorization: `Bearer ${accessToken}` } })
      .then(r => r.json())
      .then(j => setCommitments(j.commitments || []));
  }, [dealId, accessToken]);

  const totals = useMemo(() => commitments.reduce((acc, c) => {
    acc.committed += Number(c.committed_amount || 0);
    acc.funded += Number(c.funded_amount || 0);
    acc.remaining += Number(c.remaining_amount || 0);
    return acc;
  }, { committed: 0, funded: 0, remaining: 0 }), [commitments]);

  return (
    <section className="rounded-xl border p-4">
      <h2 className="text-xl font-semibold">Capital Commitment Tracking</h2>
      <div className="mt-4 grid gap-3 md:grid-cols-3">
        <Metric label="Committed" value={totals.committed} />
        <Metric label="Funded" value={totals.funded} />
        <Metric label="Remaining" value={totals.remaining} />
      </div>
    </section>
  );
}

function Metric({ label, value }: { label: string; value: number }) {
  return <div className="rounded-lg border p-3"><p className="text-sm opacity-70">{label}</p><p className="text-2xl font-bold">${value.toLocaleString()}</p></div>;
}
