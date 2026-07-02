import { NextResponse } from 'next/server';
import { getSupabaseServiceClient, verifyBearerUser } from '@/lib/complianceGate';
import { createSignatureEnvelope } from '@/lib/signatures/signatureProvider';

export async function POST(req: Request) {
  const { user, error } = await verifyBearerUser(req);
  if (!user) return NextResponse.json({ error }, { status: 401 });

  const body = await req.json();
  const supabase = getSupabaseServiceClient();
  const provider = body.provider || 'internal_stub';

  const envelope = await createSignatureEnvelope({
    provider,
    documentId: body.document_id,
    dealId: body.deal_id,
    subscriptionId: body.subscription_id,
    signerUserId: body.signer_user_id || user.id,
    signerEmail: body.signer_email,
    signerName: body.signer_name
  });

  const { data, error: dbError } = await supabase.from('signature_requests').insert({
    provider: envelope.provider,
    deal_id: body.deal_id,
    subscription_id: body.subscription_id,
    document_id: body.document_id,
    signer_user_id: body.signer_user_id || user.id,
    status: envelope.status,
    provider_envelope_id: envelope.providerEnvelopeId,
    signing_url: envelope.signingUrl,
    expires_at: envelope.expiresAt,
    metadata: envelope.metadata || {}
  }).select('*').single();

  if (dbError) return NextResponse.json({ error: dbError.message }, { status: 500 });
  return NextResponse.json({ signature_request: data });
}
