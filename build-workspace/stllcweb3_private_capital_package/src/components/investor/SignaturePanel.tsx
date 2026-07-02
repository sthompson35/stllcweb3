'use client';

import { useState } from 'react';

export function SignaturePanel({ dealId, accessToken }: { dealId: string; accessToken: string }) {
  const [message, setMessage] = useState<string>('Internal signature stub ready.');

  async function createStub() {
    const res = await fetch('/api/signatures/create', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${accessToken}` },
      body: JSON.stringify({ provider: 'internal_stub', deal_id: dealId, document_id: 'replace-with-document-id' })
    });
    const json = await res.json();
    setMessage(json.error || `Signature request created: ${json.signature_request.status}`);
  }

  return (
    <section className="rounded-xl border p-4">
      <h2 className="text-xl font-semibold">E-Signature Stub</h2>
      <p className="mt-1 text-sm opacity-70">Provider layer supports DocuSign, Dropbox Sign, and PandaDoc adapters later.</p>
      <button className="mt-4 rounded bg-black px-3 py-2 text-white" onClick={createStub}>Create Internal Stub</button>
      <p className="mt-3 text-sm">{message}</p>
    </section>
  );
}
