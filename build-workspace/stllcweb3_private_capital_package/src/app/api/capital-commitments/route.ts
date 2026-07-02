import { NextResponse } from 'next/server';
import { getSupabaseServiceClient, verifyBearerUser } from '@/lib/complianceGate';

export async function POST(req: Request) {
  const { user, error } = await verifyBearerUser(req);
  if (!user) return NextResponse.json({ error }, { status: 401 });
  const body = await req.json();
  const supabase = getSupabaseServiceClient();

  const { data, error: dbError } = await supabase.from('capital_commitments').upsert({
    deal_id: body.deal_id,
    investor_user_id: body.investor_user_id || user.id,
    subscription_id: body.subscription_id,
    committed_amount: body.committed_amount,
    funded_amount: body.funded_amount || 0,
    status: body.status || 'committed',
    ownership_percent: body.ownership_percent,
    preferred_return_percent: body.preferred_return_percent,
    profit_share_percent: body.profit_share_percent,
    funding_instructions: body.funding_instructions || {}
  }, { onConflict: 'deal_id,investor_user_id' }).select('*').single();

  if (dbError) return NextResponse.json({ error: dbError.message }, { status: 500 });
  return NextResponse.json({ capital_commitment: data });
}

export async function GET(req: Request) {
  const { user, error } = await verifyBearerUser(req);
  if (!user) return NextResponse.json({ error }, { status: 401 });
  const url = new URL(req.url);
  const dealId = url.searchParams.get('deal_id');
  const supabase = getSupabaseServiceClient();

  let q = supabase.from('capital_commitments').select('*').eq('investor_user_id', user.id);
  if (dealId) q = q.eq('deal_id', dealId);
  const { data, error: dbError } = await q.order('created_at', { ascending: false });
  if (dbError) return NextResponse.json({ error: dbError.message }, { status: 500 });
  return NextResponse.json({ commitments: data });
}
