import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseAdmin';
import { requireAppUser } from '@/lib/authGuards';

export async function GET(req: NextRequest) {
  const auth = await requireAppUser(req);
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status });

  const { data, error } = await supabaseAdmin
    .from('investor_compliance_profiles')
    .select('*')
    .eq('user_id', auth.appUser.id)
    .maybeSingle();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ profile: data });
}

export async function POST(req: NextRequest) {
  const auth = await requireAppUser(req);
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status });

  const body = await req.json().catch(() => ({}));
  const investorType = body.investorType ?? 'individual';

  const { data, error } = await supabaseAdmin
    .from('investor_compliance_profiles')
    .upsert({
      user_id: auth.appUser.id,
      wallet_address: body.walletAddress ?? null,
      investor_type: investorType,
      onboarding_status: 'in_progress',
      jurisdiction: body.jurisdiction ?? 'US-MO',
    }, { onConflict: 'user_id' })
    .select('*')
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ profile: data });
}
