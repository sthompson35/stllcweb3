import { AI_AGENT_REGISTRY, type AgentKey } from '@/config/agents';

export type AgentRequestPayload = {
  message: string;
  userId?: string;
  walletAddress?: string;
  dealId?: string;
  context?: Record<string, unknown>;
};

export type AgentRuntimeResult = {
  agentKey: AgentKey;
  agentName: string;
  response: string;
  confidence: number;
  riskFlags: string[];
};

const agentInstructions: Record<AgentKey, string> = {
  crypto:
    'You are the STLLCWeb3 Crypto Intelligence Agent. Analyze crypto market context, wallet activity, token risk, liquidity, volatility, and opportunity signals. Be direct. Do not provide guaranteed returns.',
  contract:
    'You are the STLLCWeb3 Smart Contract Auditor Agent. Review contract intent, ABI/deployment risk, access control, upgradeability, ownership, mint authority, pause controls, and verification gaps. Flag security and operational risks.',
  nft:
    'You are the STLLCWeb3 NFT Strategy Agent. Design and evaluate NFTs for loyalty, membership, deal records, access rights, metadata integrity, utility, royalties, and collection health.',
  tokenomics:
    'You are the STLLCWeb3 Tokenomics Agent. Analyze supply, utility, incentives, vesting, treasury, liquidity, staking, investor alignment, dilution, and abuse vectors.',
  compliance:
    'You are the STLLCWeb3 Compliance Agent. Flag securities, investment solicitation, real-estate tokenization, KYC/AML, accredited investor, disclosure, custody, and jurisdictional risks. You are not a lawyer and must recommend counsel review for regulated actions.',
};

export function getAgent(agentKey: string) {
  const agent = AI_AGENT_REGISTRY.find((item) => item.key === agentKey);
  if (!agent) return null;
  return agent;
}

export async function runAgent(agentKey: AgentKey, payload: AgentRequestPayload): Promise<AgentRuntimeResult> {
  const agent = getAgent(agentKey);
  if (!agent) {
    throw new Error(`Unknown agent: ${agentKey}`);
  }

  const openAiKey = process.env.OPENAI_API_KEY;
  if (!openAiKey) {
    throw new Error('Missing OPENAI_API_KEY');
  }

  const model = process.env.OPENAI_MODEL || 'gpt-4o-mini';

  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${openAiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model,
      temperature: 0.25,
      messages: [
        {
          role: 'system',
          content: `${agentInstructions[agentKey]} Return concise, operational guidance. When risk exists, include risk flags.`,
        },
        {
          role: 'user',
          content: JSON.stringify({
            message: payload.message,
            walletAddress: payload.walletAddress ?? null,
            dealId: payload.dealId ?? null,
            context: payload.context ?? {},
          }),
        },
      ],
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`OpenAI request failed: ${response.status} ${errorText}`);
  }

  const data = await response.json();
  const content = data?.choices?.[0]?.message?.content ?? 'No response returned.';

  const riskFlags = extractRiskFlags(content);

  return {
    agentKey,
    agentName: agent.name,
    response: content,
    confidence: riskFlags.length > 0 ? 0.78 : 0.86,
    riskFlags,
  };
}

function extractRiskFlags(text: string): string[] {
  const flags: string[] = [];
  const lower = text.toLowerCase();

  const checks: Array<[string, string]> = [
    ['security', 'security_risk'],
    ['ownership', 'owner_control_risk'],
    ['upgrade', 'upgradeability_risk'],
    ['securities', 'securities_law_risk'],
    ['kyc', 'kyc_aml_risk'],
    ['liquidity', 'liquidity_risk'],
    ['custody', 'custody_risk'],
    ['oracle', 'oracle_risk'],
    ['unverified', 'verification_gap'],
  ];

  for (const [needle, flag] of checks) {
    if (lower.includes(needle)) flags.push(flag);
  }

  return [...new Set(flags)];
}
