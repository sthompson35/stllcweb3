'use client';

import { useEffect, useState } from 'react';

export function DocumentVault({ dealId, accessToken }: { dealId: string; accessToken: string }) {
  const [documents, setDocuments] = useState<any[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!dealId || !accessToken) return;
    fetch(`/api/deals/${dealId}/documents`, { headers: { Authorization: `Bearer ${accessToken}` } })
      .then(r => r.json())
      .then(j => j.error ? setError(j.error) : setDocuments(j.documents || []));
  }, [dealId, accessToken]);

  async function openDocument(documentId: string) {
    const res = await fetch(`/api/documents/${documentId}/download`, {
      headers: { Authorization: `Bearer ${accessToken}` }
    });
    const json = await res.json();
    if (json.error) return setError(json.error);
    window.open(json.url, '_blank', 'noopener,noreferrer');
  }

  return (
    <section className="rounded-xl border p-4">
      <h2 className="text-xl font-semibold">Deal Document Vault</h2>
      {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
      <div className="mt-4 space-y-2">
        {documents.map(doc => (
          <div key={doc.id} className="flex items-center justify-between rounded-lg border p-3">
            <div>
              <p className="font-medium">{doc.title}</p>
              <p className="text-sm opacity-70">{doc.document_type} · v{doc.version}</p>
            </div>
            <button className="rounded bg-black px-3 py-2 text-white" onClick={() => openDocument(doc.id)}>
              Secure Open
            </button>
          </div>
        ))}
        {!documents.length && !error && <p className="text-sm opacity-70">No accessible documents yet.</p>}
      </div>
    </section>
  );
}
