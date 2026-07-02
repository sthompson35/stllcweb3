import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseAdmin';
import { requireAppUser } from '@/lib/authGuards';

export async function POST(req: NextRequest) {
  const auth = await requireAppUser(req);
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status });

  const { data: profile, error: profileError } = await supabaseAdmin
    .from('investor_compliance_profiles')
    .upsert({
      user_id: auth.appUser.id,
      kyc_status: 'pending',
      kyc_provider: 'stub',
      onboarding_status: 'submitted',
    }, { onConflict: 'user_id' })
    .select('*')
    .single();

  if (profileError) return NextResponse.json({ error: profileError.message }, { status: 500 });

  const { error } = await supabaseAdmin.from('kyc_workflow_requests').insert({
    user_id: auth.appUser.id,
    compliance_profile_id: profile.id,
    provider: 'stub',
    status: 'pending',
    metadata: { note: 'Replace with Persona, Sardine, Stripe Identity, Alloy, or other KYC vendor.' },
  });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ profile });
}
