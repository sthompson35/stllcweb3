'use client';

import { useParams } from 'next/navigation';
import { DocumentVault } from '@/components/deal-room/DocumentVault';
import { SubscriptionWorkflow } from '@/components/investor/SubscriptionWorkflow';
import { CapitalCommitmentTracker } from '@/components/investor/CapitalCommitmentTracker';
import { SignaturePanel } from '@/components/investor/SignaturePanel';

export default function PrivateDealRoomPage() {
  const params = useParams<{ dealId: string }>();
  const dealId = params.dealId;

  // Replace this with your Supabase client session access token from the existing auth layer.
  const accessToken = typeof window !== 'undefined' ? localStorage.getItem('supabase_access_token') || '' : '';

  return (
    <main className="mx-auto max-w-6xl space-y-6 p-6">
      <header>
        <p className="text-sm uppercase tracking-wide opacity-70">Private Deal Room</p>
        <h1 className="text-3xl font-bold">Deal {dealId}</h1>
      </header>

      {!accessToken && (
        <div className="rounded-xl border border-yellow-300 bg-yellow-50 p-4">
          Connect Supabase Auth session and store the bearer token before accessing private deal-room APIs.
        </div>
      )}

      <div className="grid gap-6">
        <DocumentVault dealId={dealId} accessToken={accessToken} />
        <SubscriptionWorkflow dealId={dealId} accessToken={accessToken} />
        <CapitalCommitmentTracker dealId={dealId} accessToken={accessToken} />
        <SignaturePanel dealId={dealId} accessToken={accessToken} />
      </div>
    </main>
  );
}
