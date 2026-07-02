import { createClient } from '@supabase/supabase-js';

export type DealAccessResult = {
  allowed: boolean;
  reason?: string;
  userId?: string;
  compliance?: any;
};

export function getSupabaseServiceClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error('Missing Supabase service credentials');
  return createClient(url, key, { auth: { persistSession: false } });
}

export async function verifyBearerUser(req: Request) {
  const authHeader = req.headers.get('authorization') || '';
  const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null;
  if (!token) return { user: null, error: 'Missing bearer token' };

  const supabase = getSupabaseServiceClient();
  const { data, error } = await supabase.auth.getUser(token);
  if (error || !data?.user) return { user: null, error: error?.message || 'Invalid session' };
  return { user: data.user, error: null };
}

export async function requireDealAccess(req: Request, dealId: string): Promise<DealAccessResult> {
  const { user, error } = await verifyBearerUser(req);
  if (!user) return { allowed: false, reason: error || 'Unauthenticated' };

  const supabase = getSupabaseServiceClient();
  const { data: profile } = await supabase
    .from('investor_compliance_profiles')
    .select('*')
    .eq('user_id', user.id)
    .maybeSingle();

  if (!profile) return { allowed: false, reason: 'Investor compliance profile missing', userId: user.id };
  if (profile.terms_accepted_at == null) return { allowed: false, reason: 'Terms not accepted', userId: user.id, compliance: profile };
  if (profile.kyc_status !== 'approved') return { allowed: false, reason: 'KYC not approved', userId: user.id, compliance: profile };
  if (!['verified', 'approved'].includes(profile.accreditation_status)) {
    return { allowed: false, reason: 'Accreditation not verified', userId: user.id, compliance: profile };
  }

  const { data: sub } = await supabase
    .from('subscriptions')
    .select('id,status')
    .eq('deal_id', dealId)
    .eq('investor_user_id', user.id)
    .maybeSingle();

  const { data: commitment } = await supabase
    .from('capital_commitments')
    .select('id,status')
    .eq('deal_id', dealId)
    .eq('investor_user_id', user.id)
    .maybeSingle();

  const allowed = Boolean(sub || commitment);
  return allowed
    ? { allowed: true, userId: user.id, compliance: profile }
    : { allowed: false, reason: 'No deal permission granted', userId: user.id, compliance: profile };
}
