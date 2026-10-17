import webpush from "web-push";
import { createAdminClient } from "@/lib/supabase/server";

const VAPID_PUBLIC = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || "";
const VAPID_PRIVATE = process.env.VAPID_PRIVATE_KEY || "";
const CONTACT_EMAIL = process.env.SECURITY_CONTACT_EMAIL || process.env.ADMIN_EMAIL || "library@poornima.edu.in";

if (VAPID_PUBLIC && VAPID_PRIVATE) {
  webpush.setVapidDetails(`mailto:${CONTACT_EMAIL}`, VAPID_PUBLIC, VAPID_PRIVATE);
}

// Common Course Prefix Map (No Specialization Split)
// Ordered longest-first so "mtech" matches before "ma", "btech" before "ba", etc.
const PREFIX_TO_COURSE_MAP: Array<{ prefix: string; course: string }> = [
  { prefix: "btech", course: "B.Tech" },
  { prefix: "mtech", course: "M.Tech" },
  { prefix: "bschm", course: "PIHM" },
  { prefix: "pihm", course: "PIHM" },
  { prefix: "barch", course: "B.Arch" },
  { prefix: "arch", course: "B.Arch" },
  { prefix: "mplan", course: "M.Plan" },
  { prefix: "bdes", course: "B.Des" },
  { prefix: "mdes", course: "M.Des" },
  { prefix: "bcom", course: "B.Com" },
  { prefix: "bca", course: "BCA" },
  { prefix: "mca", course: "MCA" },
  { prefix: "bba", course: "BBA" },
  { prefix: "mba", course: "MBA" },
  { prefix: "bsc", course: "B.Sc" },
  { prefix: "bva", course: "BVA" },
  { prefix: "mva", course: "MVA" },
  { prefix: "bph", course: "BPH" },
  { prefix: "mph", course: "MPH" },
  { prefix: "mha", course: "MHA" },
  { prefix: "phd", course: "Ph.D" },
  { prefix: "cs", course: "B.Tech" }, // e.g., 2025cs... or 2025cscloud... -> B.Tech
  { prefix: "ma", course: "MA" },
  { prefix: "ba", course: "BA" },
];

export function resolveStudentCourseFromEmail(email: string): {
  batchYear: string;
  course: string;
} | null {
  const localPart = email.toLowerCase().trim().split("@")[0] || "";
  const yearMatch = /^(20\d{2})([a-z]+)/.exec(localPart);
  if (!yearMatch) return null;

  const batchYear = yearMatch[1];
  const alphaPrefix = yearMatch[2];

  for (const item of PREFIX_TO_COURSE_MAP) {
    if (alphaPrefix.startsWith(item.prefix)) {
      return {
        batchYear,
        course: item.course,
      };
    }
  }
  return null;
}

export async function notifyCourseSubscribersForNewPaper(paper: {
  course: string;
  semester: string;
  exam: string;
  title: string;
  year?: string;
  specialization?: string;
}) {
  if (!VAPID_PUBLIC || !VAPID_PRIVATE) return;

  try {
    const adminClient = createAdminClient();
    const cleanCourse = paper.course.replace(/\.\$/, "").trim();

    const { data: subs } = await adminClient
      .from("push_subscriptions")
      .select("id, endpoint, p256dh, auth")
      .ilike("course", `${cleanCourse}%`);

    if (!subs || subs.length === 0) return;

    const queryParams = new URLSearchParams({
      course: paper.course,
      year: paper.year || "",
      spec: paper.specialization || "",
      sem: paper.semester,
      exam: paper.exam,
      paper: paper.title,
      source: "pwa_push"
    });

    const directUrl = `/?${queryParams.toString()}`;

    const payload = JSON.stringify({
      title: `🔔 New ${paper.course} (${paper.exam}) Paper Uploaded!`,
      body: `${paper.title} (${paper.semester}) is now available on the PYQP Portal. Tap to open.`,
      url: directUrl,
      tag: `paper-${Date.now()}`,
    });

    await Promise.allSettled(
      subs.map(async (sub: any) => {
        try {
          await webpush.sendNotification(
            {
              endpoint: sub.endpoint,
              keys: { p256dh: sub.p256dh, auth: sub.auth },
            },
            payload,
            {
              urgency: "high",
              TTL: 86400,
            }
          );
        } catch (err: any) {
          if (err?.statusCode === 404 || err?.statusCode === 410) {
            await adminClient.from("push_subscriptions").delete().eq("id", sub.id);
          }
        }
      })
    );
  } catch (err) {
    console.error("Failed to dispatch course push notifications:", err);
  }
}
