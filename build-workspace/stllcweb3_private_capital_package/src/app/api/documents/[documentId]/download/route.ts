import { NextResponse } from 'next/server';
import { getSupabaseServiceClient, requireDealAccess, verifyBearerUser } from '@/lib/complianceGate';

export async function GET(req: Request, { params }: { params: { documentId: string } }) {
  const supabase = getSupabaseServiceClient();
  const { data: doc, error } = await supabase.from('deal_documents').select('*').eq('id', params.documentId).single();
  if (error || !doc) return NextResponse.json({ error: 'Document not found' }, { status: 404 });

  const gate = await requireDealAccess(req, doc.deal_id);
  const { user } = await verifyBearerUser(req);

  if (!gate.allowed) {
    await supabase.from('document_access_logs').insert({
      document_id: doc.id,
      deal_id: doc.deal_id,
      user_id: user?.id,
      action: 'denied',
      metadata: { reason: gate.reason }
    });
    return NextResponse.json({ error: gate.reason }, { status: 403 });
  }

  const { data, error: signedError } = await supabase.storage
    .from(doc.storage_bucket)
    .createSignedUrl(doc.storage_path, 60 * 5);

  if (signedError) return NextResponse.json({ error: signedError.message }, { status: 500 });

  await supabase.from('document_access_logs').insert({
    document_id: doc.id,
    deal_id: doc.deal_id,
    user_id: gate.userId,
    action: 'signed_url_created',
    metadata: { expires_in_seconds: 300 }
  });

  return NextResponse.json({ url: data.signedUrl, expires_in_seconds: 300 });
}
