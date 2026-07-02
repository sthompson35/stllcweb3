'use client';

import { useMemo, useState } from 'react';
import { AI_AGENT_REGISTRY, type AgentKey } from '@/config/agents';

type AgentPanelProps = {
  userId?: string;
  walletAddress?: string;
};

type AgentApiResponse = {
  agentKey?: string;
  agentName?: string;
  response?: string;
  confidence?: number;
  riskFlags?: string[];
  logId?: string;
  error?: string;
};

export function AgentPanel({ userId, walletAddress }: AgentPanelProps) {
  const [selectedAgent, setSelectedAgent] = useState<AgentKey>('crypto');
  const [message, setMessage] = useState('');
  const [result, setResult] = useState<AgentApiResponse | null>(null);
  const [loading, setLoading] = useState(false);

  const agent = useMemo(
    () => AI_AGENT_REGISTRY.find((item) => item.key === selectedAgent),
    [selectedAgent]
  );

  async function askAgent() {
    setLoading(true);
    setResult(null);

    try {
      const response = await fetch(`/api/agents/${selectedAgent}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message,
          userId,
          walletAddress,
          context: {
            source: 'dashboard_agent_panel',
            app: 'stllcweb3',
          },
        }),
      });

      const data = (await response.json()) as AgentApiResponse;
      setResult(data);
    } catch (error) {
      setResult({ error: error instanceof Error ? error.message : 'Agent request failed.' });
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="grid gap-4 lg:grid-cols-[360px_1fr]">
      <aside className="grid gap-3">
        {AI_AGENT_REGISTRY.map((item) => (
          <button
            key={item.key}
            className={`rounded-2xl border p-4 text-left shadow-sm ${selectedAgent === item.key ? 'ring-2' : ''}`}
            onClick={() => setSelectedAgent(item.key)}
          >
            <p className="text-xs uppercase tracking-wide opacity-60">{item.key}</p>
            <h3 className="mt-2 text-base font-semibold">{item.name}</h3>
            <p className="mt-2 text-xs opacity-75">{item.mission}</p>
          </button>
        ))}
      </aside>

      <article className="rounded-2xl border p-5 shadow-sm">
        <p className="text-xs uppercase tracking-wide opacity-60">Live AI Agent</p>
        <h2 className="mt-2 text-xl font-semibold">{agent?.name}</h2>
        <p className="mt-2 text-sm opacity-75">{agent?.mission}</p>

        <textarea
          className="mt-5 min-h-36 w-full rounded-xl border p-4 text-sm"
          placeholder="Ask the agent about a token, contract, NFT, wallet risk, tokenomics model, or compliance issue."
          value={message}
          onChange={(event) => setMessage(event.target.value)}
        />

        <div className="mt-4 flex items-center gap-3">
          <button
            className="rounded-xl border px-4 py-2 disabled:opacity-50"
            disabled={loading || message.trim().length < 2}
            onClick={askAgent}
          >
            {loading ? 'Running agent...' : 'Run Agent'}
          </button>
          {walletAddress ? <span className="font-mono text-xs opacity-70">{walletAddress}</span> : null}
        </div>

        {result ? (
          <div className="mt-6 rounded-xl border p-4">
            {result.error ? (
              <p className="text-sm">Error: {result.error}</p>
            ) : (
              <>
                <div className="flex flex-wrap gap-2 text-xs opacity-70">
                  <span>Confidence: {Math.round((result.confidence ?? 0) * 100)}%</span>
                  {result.logId ? <span>Log: {result.logId}</span> : null}
                </div>
                <pre className="mt-4 whitespace-pre-wrap text-sm">{result.response}</pre>
                {result.riskFlags?.length ? (
                  <div className="mt-4 flex flex-wrap gap-2">
                    {result.riskFlags.map((flag) => (
                      <span key={flag} className="rounded-full border px-3 py-1 text-xs">{flag}</span>
                    ))}
                  </div>
                ) : null}
              </>
            )}
          </div>
        ) : null}
      </article>
    </section>
  );
}
