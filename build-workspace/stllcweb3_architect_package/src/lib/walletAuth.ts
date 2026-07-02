import { supabase } from './supabaseClient';

export type WalletProviderType = 'sequence' | 'metamask' | 'walletconnect' | 'unknown';

export async function upsertWallet(params: {
  userId: string;
  walletAddress: string;
  walletType: WalletProviderType;
  chainId?: number;
}) {
  const { error, data } = await supabase
    .from('wallets')
    .upsert({
      user_id: params.userId,
      wallet_address: params.walletAddress.toLowerCase(),
      wallet_type: params.walletType,
      chain_id: params.chainId ?? null,
      is_primary: true,
      last_seen_at: new Date().toISOString(),
    }, { onConflict: 'wallet_address' })
    .select()
    .single();

  if (error) throw error;
  return data;
}

export function normalizeAddress(address: string) {
  return address.trim().toLowerCase();
}
