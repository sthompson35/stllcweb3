'use client';

import { useState } from 'react';
import { supabase } from '@/lib/supabaseClient';

export function AdminMutationPanel() {
  const [status, setStatus] = useState<string>('Idle');

  async function sendAdminMutation(endpoint: '/api/admin/contracts' | '/api/admin/deals', payload: unknown) {
    setStatus('Submitting...');
    const { data } = await supabase.auth.getSession();
    const token = data.session?.access_token;

    if (!token) {
      setStatus('Missing Supabase session. Sign in first.');
      return;
    }

    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(payload),
    });

    const result = await response.json();
    setStatus(response.ok ? `Saved: ${JSON.stringify(result).slice(0, 140)}...` : `Error: ${result.error}`);
  }

  return (
    <section className="rounded-lg border p-4">
      <h2 className="text-lg font-semibold">Admin Mutation Controls</h2>
      <p className="text-sm opacity-80">Only admin/operator Supabase roles can mutate contracts or deals. Every write is audited.</p>
      <div className="mt-3 flex gap-2">
        <button
          className="rounded border px-3 py-2"
          onClick={() => sendAdminMutation('/api/admin/contracts', {
            name: 'STLLC Registry Draft',
            contract_type: 'registry',
            address: '0x0000000000000000000000000000000000000000',
            chain_id: 80002,
            network: 'polygon-amoy',
            status: 'draft',
            verified: false,
            notes: 'Admin smoke-test mutation.'
          })}
        >
          Smoke-test Contract Upsert
        </button>
        <button
          className="rounded border px-3 py-2"
          onClick={() => sendAdminMutation('/api/admin/deals', {
            title: 'Tokenized Deal Draft',
            state: 'MO',
            strategy: 'tokenized_note',
            status: 'intake'
          })}
        >
          Smoke-test Deal Upsert
        </button>
      </div>
      <pre className="mt-3 whitespace-pre-wrap text-xs">{status}</pre>
    </section>
  );
}
