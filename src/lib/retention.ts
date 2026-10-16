import { createAdminClient } from "./supabase/server";

let lastPruneTimestamp = 0;
const PRUNE_INTERVAL_MS = 6 * 60 * 60 * 1000; // Run at most once every 6 hours

/**
 * Prunes non-paper records from Supabase older than retentionDays (default 30 days).
 * Primary database rule: 'papers' table is kept PERMANENTLY.
 * Secondary database (Google Sheets) keeps all historical records permanently.
 * Supabase tables (admin_logs, student_queries, admin_sessions, admin_password_resets)
 * are retained for a maximum of 30 days to keep the database fast, clean, and within quota.
 */
export async function pruneExpiredSupabaseRecords(retentionDays = 30, force = false): Promise<{
  prunedLogs?: number;
  prunedQueries?: number;
  prunedSessions?: number;
  prunedResets?: number;
}> {
  const now = Date.now();
  if (!force && now - lastPruneTimestamp < PRUNE_INTERVAL_MS) {
    return {};
  }
  lastPruneTimestamp = now;

  try {
    const adminClient = createAdminClient();
    const cutoffDate = new Date(now - retentionDays * 24 * 60 * 60 * 1000).toISOString();

    const results = await Promise.allSettled([
      adminClient.from("admin_logs").delete().lt("created_at", cutoffDate),
      adminClient.from("student_queries").delete().lt("created_at", cutoffDate),
      adminClient.from("admin_sessions").delete().lt("created_at", cutoffDate),
      adminClient.from("admin_password_resets").delete().lt("created_at", cutoffDate),
    ]);

    const countOf = (res: PromiseSettledResult<any>) =>
      res.status === "fulfilled" && !res.value.error ? (res.value.count ?? 0) : 0;

    return {
      prunedLogs: countOf(results[0]),
      prunedQueries: countOf(results[1]),
      prunedSessions: countOf(results[2]),
      prunedResets: countOf(results[3]),
    };
  } catch (err) {
    console.error("Supabase 30-Day Retention Prune Error:", err);
    return {};
  }
}
