import { NextResponse } from 'next/server';
import { getAgent, runAgent, type AgentRequestPayload } from '@/lib/agentRuntime';
import { supabaseAdmin } from '@/lib/supabaseAdmin';
import type { AgentKey } from '@/config/agents';
import { verifySupabaseSession, jsonError } from '@/lib/security/auth';
import { enforceRateLimit } from '@/lib/security/rateLimit';
import { enforceComplianceGate } from '@/lib/security/compliance';

export async function POST(
  request: Request,
  context: { params: Promise<{ agentKey: string }> | { agentKey: string } }
) {
  try {
    const session = await verifySupabaseSession(request);
    const params = await context.params;
    const agent = getAgent(params.agentKey);

    if (!agent) {
      return NextResponse.json({ error: 'Unknown AI agent.' }, { status: 404 });
    }

    await enforceRateLimit({
      endpoint: `/api/agents/${agent.key}`,
      bucketKey: session.appUserId ?? session.authUserId,
      maxRequests: session.role === 'admin' || session.role === 'operator' ? 120 : 30,
      windowSeconds: 60,
    });

    await enforceComplianceGate(session, 'ask_agent');

    const body = (await request.json()) as AgentRequestPayload;

    if (!body.message || body.message.trim().length < 2) {
      return NextResponse.json({ error: 'Message is required.' }, { status: 400 });
    }

    const result = await runAgent(agent.key as AgentKey, {
      ...body,
      userId: session.appUserId ?? body.userId ?? null,
    });

    const { data: log, error: logError } = await supabaseAdmin
      .from('agent_logs')
      .insert({
        agent_key: result.agentKey,
        agent_name: result.agentName,
        user_id: session.appUserId ?? null,
        wallet_address: body.walletAddress?.toLowerCase() ?? null,
        deal_id: body.dealId ?? null,
        input: {
          message: body.message,
          context: body.context ?? {},
          requester: {
            authUserId: session.authUserId,
            role: session.role,
          },
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
    return jsonError(error);
  }
}
