'use client';

import { AI_AGENT_REGISTRY } from '@/config/agents';

export function AgentPanel() {
  return (
    <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
      {AI_AGENT_REGISTRY.map((agent) => (
        <article key={agent.key} className="rounded-2xl border p-5 shadow-sm">
          <p className="text-xs uppercase tracking-wide opacity-60">{agent.key}</p>
          <h3 className="mt-2 text-lg font-semibold">{agent.name}</h3>
          <p className="mt-2 text-sm opacity-80">{agent.mission}</p>
          <div className="mt-4 flex flex-wrap gap-2">
            {agent.tools.map((tool) => (
              <span key={tool} className="rounded-full border px-3 py-1 text-xs">{tool}</span>
            ))}
          </div>
        </article>
      ))}
    </section>
  );
}
