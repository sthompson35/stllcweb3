import { supabaseAdmin } from '@/lib/supabaseAdmin';
import type { VerifiedSession } from './auth';

export type ComplianceAction = 'view_private_deal' | 'commit_capital' | 'ask_agent';

export async function enforceComplianceGate(session: VerifiedSession, action: ComplianceAction) {
  if (session.role === 'admin' || session.role === 'operator') {
    return { allowed: true, reason: 'admin_override' };
  }

  if (!session.appUserId) {
    throw new Response('Compliance profile unavailable for this session.', { status: 403 });
  }

  const { data: profile, error } = await supabaseAdmin
    .from('investor_compliance_profiles')
    .select('kyc_status, accreditation_status, risk_tier, can_view_private_deals, can_commit_capital, accepted_terms_at')
    .eq('user_id', session.appUserId)
    .maybeSingle();

  if (error) throw new Error(`Compliance lookup failed: ${error.message}`);

  if (!profile) {
    throw new Response('Investor compliance profile required before using protected Web3 features.', { status: 403 });
  }

  if (profile.risk_tier === 'blocked') {
    throw new Response('Investor profile is blocked pending manual review.', { status: 403 });
  }

  if (!profile.accepted_terms_at) {
    throw new Response('Terms acceptance is required before using protected Web3 features.', { status: 403 });
  }

  if (action === 'view_private_deal' && !profile.can_view_private_deals) {
    throw new Response('Private deal access is not enabled for this investor profile.', { status: 403 });
  }

  if (action === 'commit_capital') {
    if (profile.kyc_status !== 'approved') {
      throw new Response('KYC approval is required before capital commitment.', { status: 403 });
    }
    if (!['self_attested', 'verified'].includes(profile.accreditation_status)) {
      throw new Response('Accreditation status is required before capital commitment.', { status: 403 });
    }
    if (!profile.can_commit_capital) {
      throw new Response('Capital commitment permission is not enabled.', { status: 403 });
    }
  }

  return { allowed: true, reason: 'compliance_passed' };
}
