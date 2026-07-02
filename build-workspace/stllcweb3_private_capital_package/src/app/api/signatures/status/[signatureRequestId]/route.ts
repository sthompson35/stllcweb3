import { NextResponse } from 'next/server';
import { getSupabaseServiceClient, verifyBearerUser } from '@/lib/complianceGate';

export async function GET(req: Request, { params }: { params: { signatureRequestId: string } }) {
  const { user, error } = await verifyBearerUser(req);
  if (!user) return NextResponse.json({ error }, { status: 401 });

  const supabase = getSupabaseServiceClient();
  const { data, error: dbError } = await supabase
    .from('signature_requests')
    .select('id,provider,status,signing_url,expires_at,created_at,updated_at')
    .eq('id', params.signatureRequestId)
    .single();

  if (dbError) return NextResponse.json({ error: dbError.message }, { status: 404 });
  return NextResponse.json({ signature_request: data });
}
