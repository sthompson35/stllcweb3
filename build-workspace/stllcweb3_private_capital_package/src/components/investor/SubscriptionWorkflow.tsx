'use client';

import { useState } from 'react';

export function SubscriptionWorkflow({ dealId, accessToken }: { dealId: string; accessToken: string }) {
  const [amount, setAmount] = useState('25000');
  const [status, setStatus] = useState<string | null>(null);

  async function submitSubscription() {
    const res = await fetch('/api/subscriptions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${accessToken}` },
      body: JSON.stringify({ deal_id: dealId, requested_amount: Number(amount) })
    });
    const json = await res.json();
    setStatus(json.error || `Submitted: ${json.subscription.status}`);
  }

  return (
    <section className="rounded-xl border p-4">
      <h2 className="text-xl font-semibold">Investor Subscription</h2>
      <p className="mt-1 text-sm opacity-70">Submit a requested commitment amount for compliance/admin review.</p>
      <div className="mt-4 flex gap-2">
        <input className="rounded border px-3 py-2" value={amount} onChange={e => setAmount(e.target.value)} />
        <button className="rounded bg-black px-3 py-2 text-white" onClick={submitSubscription}>Submit</button>
      </div>
      {status && <p className="mt-3 text-sm">{status}</p>}
    </section>
  );
}
