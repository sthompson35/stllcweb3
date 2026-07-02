'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';

type ContractRow = {
  id: string;
  name: string;
  contract_type: string;
  address: string;
  network: string;
  chain_id: number;
  status: string;
  verified: boolean;
};

export function ContractRegistry() {
  const [contracts, setContracts] = useState<ContractRow[]>([]);

  useEffect(() => {
    supabase
      .from('contracts')
      .select('id,name,contract_type,address,network,chain_id,status,verified')
      .order('created_at', { ascending: false })
      .then(({ data, error }) => {
        if (error) console.error(error);
        setContracts(data ?? []);
      });
  }, []);

  return (
    <section className="rounded-2xl border p-5 shadow-sm">
      <h2 className="text-xl font-semibold">Contract Registry</h2>
      <div className="mt-4 overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left opacity-70">
              <th>Name</th><th>Type</th><th>Network</th><th>Address</th><th>Status</th><th>Verified</th>
            </tr>
          </thead>
          <tbody>
            {contracts.map((c) => (
              <tr key={c.id} className="border-t">
                <td className="py-3 font-medium">{c.name}</td>
                <td>{c.contract_type}</td>
                <td>{c.network} / {c.chain_id}</td>
                <td className="font-mono">{c.address.slice(0, 8)}...{c.address.slice(-6)}</td>
                <td>{c.status}</td>
                <td>{c.verified ? 'Yes' : 'No'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
