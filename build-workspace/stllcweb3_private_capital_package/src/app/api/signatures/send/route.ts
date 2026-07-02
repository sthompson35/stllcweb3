import { NextResponse } from 'next/server';
import { getSupabaseServiceClient, verifyBearerUser } from '@/lib/complianceGate';

export async function POST(req: Request) {
  const { user, error } = await verifyBearerUser(req);
  if (!user) return NextResponse.json({ error }, { status: 401 });

  const { signature_request_id } = await req.json();
  const supabase = getSupabaseServiceClient();
  const { data, error: updateError } = await supabase
    .from('signature_requests')
    .update({ status: 'sent', updated_at: new Date().toISOString() })
    .eq('id', signature_request_id)
    .select('*')
    .single();

  if (updateError) return NextResponse.json({ error: updateError.message }, { status: 500 });
  await supabase.from('signature_events').insert({
    signature_request_id,
    provider: data.provider,
    event_type: 'sent',
    event_payload: { triggered_by: user.id }
  });
  return NextResponse.json({ signature_request: data });
}
