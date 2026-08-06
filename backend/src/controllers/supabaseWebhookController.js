function createSupabaseWebhookController({
  mirrorPaperToSheet,
  mirrorDeletePaperFromSheet,
  paperFromSupabaseRow,
  invalidatePapersCache
}) {
  async function handlePapersWebhook(req, res) {
    const { type, table, record, old_record: oldRecord } = req.body || {};

    if (table !== "papers") {
      return res.status(200).send("Ignored: not the papers table");
    }

    try {
      if (type === "INSERT" || type === "UPDATE") {
        if (!record) return res.status(400).send("Missing record");
        const paper = paperFromSupabaseRow(record);
        // On UPDATE, old_record tells us which sheet row to find and update in
        // place; on INSERT there's nothing to match against, so it's a fresh
        // row (or reuses a matching blank slot - mirrorPaperToSheet already
        // handles that).
        const expectedPaper = type === "UPDATE" && oldRecord ? paperFromSupabaseRow(oldRecord) : null;
        await mirrorPaperToSheet(paper, expectedPaper);
      } else if (type === "DELETE") {
        if (!oldRecord) return res.status(400).send("Missing old_record");
        await mirrorDeletePaperFromSheet(paperFromSupabaseRow(oldRecord));
      } else {
        return res.status(200).send("Ignored: unrecognized event type");
      }

      invalidatePapersCache();
      return res.status(200).send("Mirrored");
    } catch (err) {
      console.error("Supabase webhook mirror failed:", err.message);
      // 500 so Supabase's webhook delivery retries - that retry behavior is
      // the entire point of moving this off the request path. The mirror
      // functions are safe to re-run (they look up the correct row each
      // time rather than blindly appending).
      return res.status(500).send("Mirror failed");
    }
  }

  return { handlePapersWebhook };
}

module.exports = { createSupabaseWebhookController };
