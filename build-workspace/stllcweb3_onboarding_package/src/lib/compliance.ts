import { supabase } from '@/lib/supabaseClient';

export type ComplianceProfile = {
  id: string;
  user_id: string;
  onboarding_status: 'not_started' | 'in_progress' | 'submitted' | 'approved' | 'rejected' | 'restricted';
  investor_type: 'unknown' | 'individual' | 'entity' | 'ira' | 'trust' | 'fund';
  kyc_status: 'not_started' | 'pending' | 'approved' | 'rejected' | 'expired';
  accreditation_status: 'unknown' | 'self_attested' | 'verified' | 'rejected' | 'expired';
  risk_tier: 'standard' | 'enhanced_review' | 'blocked';
  can_view_private_deals: boolean;
  can_commit_capital: boolean;
  accepted_terms_at: string | null;
};

export function getAccessState(profile?: ComplianceProfile | null) {
  if (!profile) return { state: 'missing_profile', canView: false, canCommit: false };
  if (profile.risk_tier === 'blocked') return { state: 'blocked', canView: false, canCommit: false };
  if (!profile.accepted_terms_at) return { state: 'terms_required', canView: false, canCommit: false };
  if (profile.kyc_status === 'not_started') return { state: 'kyc_required', canView: false, canCommit: false };
  if (profile.kyc_status === 'rejected' || profile.kyc_status === 'expired') return { state: 'kyc_blocked', canView: false, canCommit: false };
  if (!profile.can_view_private_deals) return { state: 'pending_review', canView: false, canCommit: false };

  const canCommit =
    profile.can_commit_capital &&
    profile.kyc_status === 'approved' &&
    profile.accreditation_status === 'verified';

  return {
    state: canCommit ? 'commitment_enabled' : 'view_only',
    canView: true,
    canCommit,
  };
}

export async function fetchMyComplianceProfile(userId: string) {
  const { data, error } = await supabase
    .from('investor_compliance_profiles')
    .select('*')
    .eq('user_id', userId)
    .maybeSingle();

  if (error) throw error;
  return data as ComplianceProfile | null;
}
