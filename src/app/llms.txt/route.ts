import { NextResponse } from "next/server";

export const dynamic = "force-static";

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const domain = (process.env.NEXT_PUBLIC_APP_URL || process.env.BASE_URL || `${requestUrl.protocol}//${requestUrl.host}`).replace(/\/+$/, "");

  const contact = process.env.SECURITY_CONTACT_EMAIL || process.env.ADMIN_EMAIL || "";

  const content = `# Poornima University — Previous Year Question Papers (PYQP) Archive
> Official digital repository of past examination question papers curated by the Poornima University Central Library.

## Overview
- **Institution**: Poornima University, Jaipur, Rajasthan, India
- **Repository URL**: ${domain}
- **Objective**: Provide undergraduate, postgraduate, and doctoral students with search-indexed digital access to past Mid-Term (MSE) and End-Term (ESE) question papers.

## Key Faculties & Programs
- Faculty of Computer Science & Applications (BCA, MCA)
- Faculty of Engineering & Technology (B.Tech, M.Tech)
- Faculty of Management & Commerce (BBA, MBA, B.Com)
- Faculty of Science & Humanities (B.Sc, BA, M.Sc)
- Faculty of Design & Architecture (B.Des, B.Arch, BVA)
- Faculty of Hospitality & Public Health (PIHM, MPH)

## Access & Queries
- Students can search by Course, Year, Semester, and Examination Type.
- Direct download links to examination paper PDFs hosted via Google Drive.
- An AI-powered assistant is available on the portal to guide students through examination preparations.
${contact ? `- Contact: ${contact}` : ""}
`;

  return new NextResponse(content, {
    status: 200,
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "public, max-age=86400",
    },
  });
}
