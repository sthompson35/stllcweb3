import { NextResponse } from 'next/server';
import { getSupabaseServiceClient, verifyBearerUser } from '@/lib/complianceGate';

export async function POST(req: Request) {
  const { user, error } = await verifyBearerUser(req);
  if (!user) return NextResponse.json({ error }, { status: 401 });

  const body = await req.json();
  const supabase = getSupabaseServiceClient();

  const { data: profile } = await supabase
    .from('investor_compliance_profiles')
    .select('*')
    .eq('user_id', user.id)
    .maybeSingle();

  if (!profile?.terms_accepted_at) return NextResponse.json({ error: 'Terms acceptance required' }, { status: 403 });
  if (profile.kyc_status !== 'approved') return NextResponse.json({ error: 'KYC approval required' }, { status: 403 });

  const { data, error: insertError } = await supabase.from('subscriptions').upsert({
    deal_id: body.deal_id,
    investor_user_id: user.id,
    requested_amount: body.requested_amount,
    status: 'pending_review',
    submitted_at: new Date().toISOString(),
    metadata: body.metadata || {}
  }, { onConflict: 'deal_id,investor_user_id' }).select('*').single();

  if (insertError) return NextResponse.json({ error: insertError.message }, { status: 500 });

  await supabase.from('subscription_status_history').insert({
    subscription_id: data.id,
    old_status: 'draft',
    new_status: 'pending_review',
    changed_by: user.id,
    note: 'Investor submitted subscription request.'
  });

  return NextResponse.json({ subscription: data });
}
