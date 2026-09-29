function createHealthController({ pingRedis, pingSupabase, isRedisUrlConfigured, isSupabaseConfigured }) {
  async function getHealth(req, res) {
    const startedAt = Date.now();

    const [redisResult, supabaseResult] = await Promise.all([
      isRedisUrlConfigured() ? pingRedis() : Promise.resolve({ ok: false, error: "not configured" }),
      isSupabaseConfigured() ? pingSupabase() : Promise.resolve({ ok: false, error: "not configured" })
    ]);

    const checks = {
      redis: redisResult,
      supabase: supabaseResult
    };

    // Redis and Supabase are both load-bearing for login/rate-limiting and
    // paper data respectively - either one failing means the site is
    // effectively down for real users, so the overall status reflects that
    // even though this route itself responded.
    const allOk = Object.values(checks).every((check) => check.ok);

    res.status(allOk ? 200 : 503).json({
      status: allOk ? "ok" : "degraded",
      durationMs: Date.now() - startedAt,
      checks
    });
  }

  return { getHealth };
}

module.exports = { createHealthController };
