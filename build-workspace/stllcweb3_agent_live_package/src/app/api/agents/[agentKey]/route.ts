import { NextResponse } from 'next/server';
import { getAgent, runAgent, type AgentRequestPayload } from '@/lib/agentRuntime';
import { supabaseAdmin } from '@/lib/supabaseAdmin';
import type { AgentKey } from '@/config/agents';

export async function POST(
  request: Request,
  context: { params: Promise<{ agentKey: string }> | { agentKey: string } }
) {
  try {
    const params = await context.params;
    const agent = getAgent(params.agentKey);

    if (!agent) {
      return NextResponse.json({ error: 'Unknown AI agent.' }, { status: 404 });
    }

    const body = (await request.json()) as AgentRequestPayload;

    if (!body.message || body.message.trim().length < 2) {
      return NextResponse.json({ error: 'Message is required.' }, { status: 400 });
    }

    const result = await runAgent(agent.key as AgentKey, body);

    const { data: log, error: logError } = await supabaseAdmin
      .from('agent_logs')
      .insert({
        agent_key: result.agentKey,
        agent_name: result.agentName,
        user_id: body.userId ?? null,
        wallet_address: body.walletAddress?.toLowerCase() ?? null,
        deal_id: body.dealId ?? null,
        input: {
          message: body.message,
          context: body.context ?? {},
        },
        output: {
          response: result.response,
        },
        confidence: result.confidence,
        risk_flags: result.riskFlags,
      })
      .select('id,created_at')
      .single();

    if (logError) {
      return NextResponse.json({ ...result, logError: logError.message }, { status: 200 });
    }

    return NextResponse.json({ ...result, logId: log.id, createdAt: log.created_at });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Agent route failed.';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
