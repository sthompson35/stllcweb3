import { supabaseAdmin } from '@/lib/supabaseAdmin';

export type RateLimitOptions = {
  endpoint: string;
  bucketKey: string;
  maxRequests?: number;
  windowSeconds?: number;
};

export async function enforceRateLimit({
  endpoint,
  bucketKey,
  maxRequests = 30,
  windowSeconds = 60,
}: RateLimitOptions) {
  const now = new Date();
  const windowMs = windowSeconds * 1000;
  const windowStart = new Date(Math.floor(now.getTime() / windowMs) * windowMs).toISOString();

  const { data: existing, error: readError } = await supabaseAdmin
    .from('api_rate_limits')
    .select('id, request_count')
    .eq('bucket_key', bucketKey)
    .eq('endpoint', endpoint)
    .eq('window_start', windowStart)
    .maybeSingle();

  if (readError) throw new Error(`Rate-limit read failed: ${readError.message}`);

  if (!existing) {
    const { error } = await supabaseAdmin.from('api_rate_limits').insert({
      bucket_key: bucketKey,
      endpoint,
      window_start: windowStart,
      request_count: 1,
      last_request_at: now.toISOString(),
    });
    if (error) throw new Error(`Rate-limit insert failed: ${error.message}`);
    return { allowed: true, remaining: maxRequests - 1 };
  }

  if (existing.request_count >= maxRequests) {
    const retryAfter = Math.ceil((new Date(windowStart).getTime() + windowMs - now.getTime()) / 1000);
    throw new Response('Rate limit exceeded.', {
      status: 429,
      headers: { 'Retry-After': String(Math.max(retryAfter, 1)) },
    });
  }

  const { error } = await supabaseAdmin
    .from('api_rate_limits')
    .update({
      request_count: existing.request_count + 1,
      last_request_at: now.toISOString(),
    })
    .eq('id', existing.id);

  if (error) throw new Error(`Rate-limit update failed: ${error.message}`);

  return { allowed: true, remaining: maxRequests - existing.request_count - 1 };
}
