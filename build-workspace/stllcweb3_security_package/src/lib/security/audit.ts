import { supabaseAdmin } from '@/lib/supabaseAdmin';
import type { VerifiedSession } from './auth';

export async function writeAdminAuditLog(args: {
  session: VerifiedSession;
  action: string;
  targetTable: string;
  targetId?: string | null;
  payload?: unknown;
}) {
  await supabaseAdmin.from('admin_audit_logs').insert({
    actor_user_id: args.session.appUserId,
    actor_auth_user_id: args.session.authUserId,
    action: args.action,
    target_table: args.targetTable,
    target_id: args.targetId ?? null,
    payload: args.payload ?? {},
  });
}
