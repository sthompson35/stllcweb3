import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseAdmin';

export type AppRole = 'admin' | 'operator' | 'investor' | 'viewer';

export type VerifiedSession = {
  authUserId: string;
  email: string | null;
  appUserId: string | null;
  role: AppRole;
  walletAddress?: string | null;
};

export async function verifySupabaseSession(request: Request): Promise<VerifiedSession> {
  const authHeader = request.headers.get('authorization') ?? '';
  const token = authHeader.toLowerCase().startsWith('bearer ')
    ? authHeader.slice(7).trim()
    : null;

  if (!token) {
    throw new Response('Missing Supabase bearer token.', { status: 401 });
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Response('Supabase public env vars are not configured.', { status: 500 });
  }

  const supabase = createClient(supabaseUrl, supabaseAnonKey, {
    global: { headers: { Authorization: `Bearer ${token}` } },
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const { data, error } = await supabase.auth.getUser(token);

  if (error || !data.user) {
    throw new Response('Invalid Supabase session.', { status: 401 });
  }

  const { data: appUser } = await supabaseAdmin
    .from('users')
    .select('id, role, email')
    .eq('auth_user_id', data.user.id)
    .maybeSingle();

  return {
    authUserId: data.user.id,
    email: data.user.email ?? appUser?.email ?? null,
    appUserId: appUser?.id ?? null,
    role: (appUser?.role ?? 'viewer') as AppRole,
  };
}

export function requireRole(session: VerifiedSession, allowed: AppRole[]) {
  if (!allowed.includes(session.role)) {
    throw new Response('Forbidden: insufficient role permission.', { status: 403 });
  }
}

export function jsonError(error: unknown) {
  if (error instanceof Response) {
    return NextResponse.json({ error: error.statusText || 'Request denied.' }, { status: error.status });
  }

  const message = error instanceof Error ? error.message : 'Request failed.';
  return NextResponse.json({ error: message }, { status: 500 });
}
