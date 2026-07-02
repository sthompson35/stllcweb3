import { NextResponse } from 'next/server';
import { getSupabaseServiceClient } from '@/lib/complianceGate';

export async function POST(req: Request) {
  const body = await req.json();
  const supabase = getSupabaseServiceClient();

  // Stub endpoint. Production must verify provider signatures before trusting payloads.
  await supabase.from('signature_events').insert({
    signature_request_id: body.signature_request_id || null,
    provider: body.provider || 'internal_stub',
    event_type: body.event_type || 'webhook_received',
    event_payload: body
  });

  if (body.signature_request_id && body.status) {
    await supabase.from('signature_requests').update({
      status: body.status,
      updated_at: new Date().toISOString()
    }).eq('id', body.signature_request_id);
  }

  return NextResponse.json({ received: true });
}
