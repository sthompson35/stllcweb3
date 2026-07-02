'use client';

import Link from 'next/link';
import { getAccessState, type ComplianceProfile } from '@/lib/compliance';

type DealRoomGateProps = {
  profile?: ComplianceProfile | null;
  children: React.ReactNode;
};

export function DealRoomGate({ profile, children }: DealRoomGateProps) {
  const access = getAccessState(profile);

  if (!access.canView) {
    return (
      <section className="rounded-2xl border border-amber-500/40 bg-slate-950 p-6 text-slate-100">
        <p className="text-sm uppercase tracking-wide text-amber-300">Access Gate</p>
        <h2 className="mt-2 text-2xl font-bold">Private Deal Room Locked</h2>
        <p className="mt-3 text-slate-300">
          Current status: <span className="font-semibold text-amber-200">{access.state}</span>. Complete onboarding and compliance review before private opportunities are visible.
        </p>
        <Link href="/onboarding" className="mt-5 inline-block rounded-xl bg-amber-400 px-5 py-3 font-semibold text-slate-950">
          Go to Investor Onboarding
        </Link>
      </section>
    );
  }

  return <>{children}</>;
}
