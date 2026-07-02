import { PrivateDealRoom } from '@/components/deal-room/PrivateDealRoom';

export default function DealRoomDetailPage({ params }: { params: { dealId: string } }) {
  return (
    <main className="min-h-screen bg-slate-950 p-6">
      <PrivateDealRoom dealId={params.dealId} />
    </main>
  );
}
