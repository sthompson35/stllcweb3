import PropertyViewer from '../property_viewer/PropertyViewer';
import Link from 'next/link';

export default function Home() {
  return (
    <main style={{ padding: 24, fontFamily: 'Arial, sans-serif' }}>
      <h1>Dynasty PropertyOS</h1>
      <p>Digital twin command center for real estate, contractors, lenders, appraisers, property managers, accounting, and Web3 property passports.</p>
      <section style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
        <div style={{ border: '1px solid #ddd', padding: 16, borderRadius: 12 }}>
          <h2>USDA 1-Bedroom Prototype</h2>
          <p>Status: Blender starter model ready.</p>
          <p>Next: connect GLB export and Supabase material records.</p>
        </div>
        <div style={{ border: '1px solid #ddd', padding: 16, borderRadius: 12 }}>
          <h2>Investor Quick Read</h2>
          <p>Flip, rental, BRRR, lender packet, and appraisal support modules scaffolded.</p>
          <Link href="/investor">Open investor portal snapshot</Link>
        </div>
      </section>
      <PropertyViewer />
    </main>
  );
}
