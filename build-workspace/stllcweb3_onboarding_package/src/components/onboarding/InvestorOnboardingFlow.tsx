'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { getAccessState, type ComplianceProfile } from '@/lib/compliance';

type Step = 'profile' | 'terms' | 'kyc' | 'accreditation' | 'status';

async function authHeaders() {
  const { data } = await supabase.auth.getSession();
  const token = data.session?.access_token;
  return token ? { Authorization: `Bearer ${token}` } : {};
}

export function InvestorOnboardingFlow() {
  const [step, setStep] = useState<Step>('profile');
  const [profile, setProfile] = useState<ComplianceProfile | null>(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  async function refreshProfile() {
    const headers = await authHeaders();
    const res = await fetch('/api/compliance/profile', { headers });
    const json = await res.json();
    setProfile(json.profile ?? null);
    return json.profile as ComplianceProfile | null;
  }

  useEffect(() => {
    refreshProfile().catch(() => undefined);
  }, []);

  async function call(path: string, body?: Record<string, unknown>) {
    setLoading(true);
    setMessage('');
    try {
      const headers = await authHeaders();
      const res = await fetch(path, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...headers },
        body: JSON.stringify(body ?? {}),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Request failed');
      setProfile(json.profile ?? null);
      setMessage('Saved.');
      return json.profile as ComplianceProfile;
    } catch (err) {
      setMessage(err instanceof Error ? err.message : 'Request failed');
      throw err;
    } finally {
      setLoading(false);
    }
  }

  const access = getAccessState(profile);

  return (
    <section className="rounded-2xl border border-slate-800 bg-slate-950 p-6 text-slate-100">
      <div className="mb-6">
        <p className="text-sm uppercase tracking-wide text-slate-400">STLLCWeb3 Investor Onboarding</p>
        <h1 className="text-3xl font-bold">Private Deal-Room Access</h1>
        <p className="mt-2 max-w-3xl text-slate-300">
          Complete the intake gates before viewing private tokenized real-estate opportunities. This protects the platform before capital conversations begin.
        </p>
      </div>

      <div className="mb-6 grid gap-3 md:grid-cols-5">
        {(['profile','terms','kyc','accreditation','status'] as Step[]).map((item) => (
          <button key={item} onClick={() => setStep(item)} className={`rounded-xl border px-4 py-3 text-left ${step === item ? 'border-emerald-400 bg-slate-900' : 'border-slate-800 bg-slate-950'}`}>
            {item.toUpperCase()}
          </button>
        ))}
      </div>

      {step === 'profile' && (
        <div className="space-y-4">
          <h2 className="text-xl font-semibold">1. Investor Profile</h2>
          <p className="text-slate-300">Create or update the compliance profile connected to the logged-in Supabase user.</p>
          <button disabled={loading} onClick={() => call('/api/compliance/profile', { investorType: 'individual', jurisdiction: 'US-MO' })} className="rounded-xl bg-emerald-500 px-5 py-3 font-semibold text-slate-950">
            Create Individual Investor Profile
          </button>
        </div>
      )}

      {step === 'terms' && (
        <div className="space-y-4">
          <h2 className="text-xl font-semibold">2. Terms Acceptance</h2>
          <p className="text-slate-300">Accept platform terms, risk disclosures, and electronic communication consent. Replace this text with attorney-reviewed terms before launch.</p>
          <button disabled={loading} onClick={() => call('/api/compliance/terms')} className="rounded-xl bg-emerald-500 px-5 py-3 font-semibold text-slate-950">
            Accept Terms
          </button>
        </div>
      )}

      {step === 'kyc' && (
        <div className="space-y-4">
          <h2 className="text-xl font-semibold">3. KYC Stub</h2>
          <p className="text-slate-300">Starts a placeholder KYC workflow. Production should integrate a real KYC/AML vendor.</p>
          <button disabled={loading} onClick={() => call('/api/compliance/kyc')} className="rounded-xl bg-emerald-500 px-5 py-3 font-semibold text-slate-950">
            Start KYC Review
          </button>
        </div>
      )}

      {step === 'accreditation' && (
        <div className="space-y-4">
          <h2 className="text-xl font-semibold">4. Accreditation Stub</h2>
          <p className="text-slate-300">Self-attestation is a placeholder. Private securities offerings may require third-party verification.</p>
          <button disabled={loading} onClick={() => call('/api/compliance/accreditation', { selfAttested: true })} className="rounded-xl bg-emerald-500 px-5 py-3 font-semibold text-slate-950">
            Submit Self-Attestation
          </button>
        </div>
      )}

      {step === 'status' && (
        <div className="space-y-4">
          <h2 className="text-xl font-semibold">5. Access Status</h2>
          <pre className="overflow-auto rounded-xl bg-slate-900 p-4 text-sm text-slate-200">{JSON.stringify({ profile, access }, null, 2)}</pre>
        </div>
      )}

      {message && <p className="mt-4 text-sm text-slate-300">{message}</p>}
    </section>
  );
}
