import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseAdmin';
import { verifySupabaseSession, requireRole, jsonError } from '@/lib/security/auth';
import { enforceRateLimit } from '@/lib/security/rateLimit';
import { writeAdminAuditLog } from '@/lib/security/audit';

export async function POST(request: Request) {
  try {
    const session = await verifySupabaseSession(request);
    requireRole(session, ['admin', 'operator']);
    await enforceRateLimit({ endpoint: '/api/admin/deals', bucketKey: session.authUserId, maxRequests: 40, windowSeconds: 60 });

    const payload = await request.json();
    const { data, error } = await supabaseAdmin
      .from('deals')
      .upsert({ ...payload, created_by: payload.created_by ?? session.appUserId }, { onConflict: 'id' })
      .select('*')
      .single();

    if (error) return NextResponse.json({ error: error.message }, { status: 400 });

    await writeAdminAuditLog({ session, action: 'upsert_deal', targetTable: 'deals', targetId: data.id, payload });
    return NextResponse.json({ deal: data });
  } catch (error) {
    return jsonError(error);
  }
}
