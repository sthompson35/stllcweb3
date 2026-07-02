import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseAdmin';
import { requireAppUser } from '@/lib/authGuards';

const TERMS_VERSION = 'STLLCWEB3_TERMS_V1_2026-07-02';

export async function POST(req: NextRequest) {
  const auth = await requireAppUser(req);
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status });

  const userAgent = req.headers.get('user-agent') ?? null;
  const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? null;

  const { data: profile, error: profileError } = await supabaseAdmin
    .from('investor_compliance_profiles')
    .upsert({
      user_id: auth.appUser.id,
      onboarding_status: 'in_progress',
      accepted_terms_at: new Date().toISOString(),
      terms_version: TERMS_VERSION,
      terms_ip_address: ip,
      terms_user_agent: userAgent,
    }, { onConflict: 'user_id' })
    .select('*')
    .single();

  if (profileError) return NextResponse.json({ error: profileError.message }, { status: 500 });

  const { error: termsError } = await supabaseAdmin
    .from('terms_acceptances')
    .insert({
      user_id: auth.appUser.id,
      compliance_profile_id: profile.id,
      terms_version: TERMS_VERSION,
      ip_address: ip,
      user_agent: userAgent,
      payload: { source: 'onboarding' },
    });

  if (termsError) return NextResponse.json({ error: termsError.message }, { status: 500 });
  return NextResponse.json({ profile });
}
