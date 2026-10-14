import { NextRequest, NextResponse } from "next/server";
import { verifyGoogleInstitutionalToken } from "@/lib/googleAuth";
import { resolveStudentCourseFromEmail } from "@/lib/pushNotifications";
import { createAdminClient } from "@/lib/supabase/server";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const { credential, subscription, manualCourse } = body;

    if (!credential || !subscription?.endpoint || !subscription?.keys?.p256dh || !subscription?.keys?.auth) {
      return NextResponse.json({ success: false, message: "Invalid subscription payload." }, { status: 400 });
    }

    const student = await verifyGoogleInstitutionalToken(credential);
    const parsedProfile = resolveStudentCourseFromEmail(student.email);

    const course = parsedProfile?.course || manualCourse || "General";
    const batchYear = parsedProfile?.batchYear || "";

    const db = createAdminClient();
    const { error } = await db.from("push_subscriptions").upsert(
      {
        email: student.email,
        course,
        batch_year: batchYear,
        endpoint: subscription.endpoint,
        p256dh: subscription.keys.p256dh,
        auth: subscription.keys.auth,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "endpoint" }
    );

    if (error) throw error;

    return NextResponse.json({
      success: true,
      course,
      message: `Subscribed to ${course} paper alerts!`,
    });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, message: err?.message || "Failed to subscribe to notifications." },
      { status: 400 }
    );
  }
}
