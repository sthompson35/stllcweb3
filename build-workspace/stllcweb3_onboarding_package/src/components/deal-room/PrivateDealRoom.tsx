'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { fetchMyComplianceProfile, getAccessState, type ComplianceProfile } from '@/lib/compliance';
import { DealRoomGate } from './DealRoomGate';

type Deal = {
  id: string;
  title: string;
  property_address?: string | null;
  strategy?: string | null;
  status?: string | null;
  summary?: string | null;
};

export function PrivateDealRoom({ dealId }: { dealId?: string }) {
  const [profile, setProfile] = useState<ComplianceProfile | null>(null);
  const [deals, setDeals] = useState<Deal[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      setLoading(true);
      const { data: sessionData } = await supabase.auth.getSession();
      const authUserId = sessionData.session?.user.id;
      if (!authUserId) {
        setLoading(false);
        return;
      }

      const { data: appUser } = await supabase
        .from('users')
        .select('id')
        .eq('auth_user_id', authUserId)
        .maybeSingle();

      if (appUser?.id) {
        const p = await fetchMyComplianceProfile(appUser.id);
        setProfile(p);
      }

      const query = supabase.from('deals').select('id,title,property_address,strategy,status,summary').order('created_at', { ascending: false });
      const { data } = dealId ? await query.eq('id', dealId) : await query.limit(25);
      setDeals((data ?? []) as Deal[]);
      setLoading(false);
    }

    load().catch(() => setLoading(false));
  }, [dealId]);

  const access = getAccessState(profile);

  if (loading) return <p className="text-slate-300">Loading private deal room...</p>;

  return (
    <DealRoomGate profile={profile}>
      <section className="rounded-2xl border border-slate-800 bg-slate-950 p-6 text-slate-100">
        <div className="mb-6">
          <p className="text-sm uppercase tracking-wide text-emerald-300">Private Deal Room</p>
          <h1 className="text-3xl font-bold">Qualified Investor Access</h1>
          <p className="mt-2 text-slate-300">Access level: {access.state}. Capital commitment is {access.canCommit ? 'enabled' : 'not enabled yet'}.</p>
        </div>

        <div className="grid gap-4">
          {deals.map((deal) => (
            <article key={deal.id} className="rounded-xl border border-slate-800 bg-slate-900 p-5">
              <h2 className="text-xl font-semibold">{deal.title}</h2>
              <p className="text-slate-400">{deal.property_address ?? 'Address withheld'} · {deal.strategy ?? 'Strategy TBD'} · {deal.status ?? 'draft'}</p>
              <p className="mt-3 text-slate-300">{deal.summary ?? 'Private deal summary pending.'}</p>
              {!access.canCommit && <p className="mt-3 text-sm text-amber-300">Commitment button hidden until approved KYC + verified accreditation.</p>}
              {access.canCommit && <button className="mt-4 rounded-xl bg-emerald-500 px-5 py-3 font-semibold text-slate-950">Start Commitment</button>}
            </article>
          ))}
          {!deals.length && <p className="text-slate-300">No private deals are published yet.</p>}
        </div>
      </section>
    </DealRoomGate>
  );
}
