'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';

type ComplianceProfile = {
  kyc_status: string;
  accreditation_status: string;
  risk_tier: string;
  can_view_private_deals: boolean;
  can_commit_capital: boolean;
  accepted_terms_at: string | null;
};

export function ComplianceGate() {
  const [profile, setProfile] = useState<ComplianceProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadProfile() {
      const { data: auth } = await supabase.auth.getUser();
      if (!auth.user) {
        setLoading(false);
        return;
      }

      const { data: user } = await supabase
        .from('users')
        .select('id')
        .eq('auth_user_id', auth.user.id)
        .maybeSingle();

      if (!user) {
        setLoading(false);
        return;
      }

      const { data } = await supabase
        .from('investor_compliance_profiles')
        .select('kyc_status, accreditation_status, risk_tier, can_view_private_deals, can_commit_capital, accepted_terms_at')
        .eq('user_id', user.id)
        .maybeSingle();

      setProfile(data);
      setLoading(false);
    }

    loadProfile();
  }, []);

  if (loading) return <div className="rounded-lg border p-4">Checking compliance status...</div>;

  if (!profile) {
    return (
      <div className="rounded-lg border border-yellow-500 p-4">
        <h3 className="font-semibold">Investor compliance profile required</h3>
        <p className="text-sm opacity-80">Create or approve a compliance profile before exposing private tokenized deals.</p>
      </div>
    );
  }

  const ready = profile.accepted_terms_at && profile.risk_tier !== 'blocked' && profile.can_view_private_deals;

  return (
    <div className="rounded-lg border p-4">
      <h3 className="font-semibold">Investor Compliance Gate</h3>
      <div className="mt-2 grid gap-1 text-sm">
        <span>KYC: {profile.kyc_status}</span>
        <span>Accreditation: {profile.accreditation_status}</span>
        <span>Risk tier: {profile.risk_tier}</span>
        <span>Private deal access: {profile.can_view_private_deals ? 'enabled' : 'locked'}</span>
        <span>Capital commit: {profile.can_commit_capital ? 'enabled' : 'locked'}</span>
      </div>
      <p className="mt-3 text-sm font-medium">Status: {ready ? 'Ready for gated deal-room access.' : 'Not cleared for private deal room.'}</p>
    </div>
  );
}
