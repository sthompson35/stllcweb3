import { NextResponse } from 'next/server';
import { getSupabaseServiceClient, requireDealAccess, verifyBearerUser } from '@/lib/complianceGate';

export async function GET(req: Request, { params }: { params: { dealId: string } }) {
  const gate = await requireDealAccess(req, params.dealId);
  if (!gate.allowed) return NextResponse.json({ error: gate.reason }, { status: 403 });

  const supabase = getSupabaseServiceClient();
  const { data, error } = await supabase
    .from('deal_documents')
    .select('id,title,document_type,version,visibility,created_at,updated_at')
    .eq('deal_id', params.dealId)
    .eq('is_active', true)
    .order('created_at', { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ documents: data });
}

export async function POST(req: Request, { params }: { params: { dealId: string } }) {
  const { user, error: authError } = await verifyBearerUser(req);
  if (!user) return NextResponse.json({ error: authError }, { status: 401 });

  const supabase = getSupabaseServiceClient();
  const { data: appUser } = await supabase.from('users').select('role').eq('id', user.id).maybeSingle();
  if (!['admin', 'operator', 'manager'].includes(appUser?.role)) {
    return NextResponse.json({ error: 'Admin/operator access required' }, { status: 403 });
  }

  const body = await req.json();
  const { data, error } = await supabase.from('deal_documents').insert({
    deal_id: params.dealId,
    title: body.title,
    document_type: body.document_type,
    storage_bucket: body.storage_bucket || 'deal-documents',
    storage_path: body.storage_path,
    mime_type: body.mime_type,
    size_bytes: body.size_bytes,
    visibility: body.visibility || 'approved_investors',
    uploaded_by: user.id
  }).select('*').single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ document: data });
}
