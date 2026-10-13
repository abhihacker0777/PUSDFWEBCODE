import { NextResponse } from "next/server";

export const dynamic = "force-static";

export function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const rawDomain = process.env.NEXT_PUBLIC_APP_URL || process.env.BASE_URL || `${requestUrl.protocol}//${requestUrl.host}`;
  const domain = rawDomain.endsWith("/") ? rawDomain.slice(0, -1) : rawDomain;

  const contact = process.env.SECURITY_CONTACT_EMAIL || process.env.ADMIN_EMAIL || "";

  const content = `# Poornima University — Previous Year Question Papers (PYQP) Archive
> Official digital repository of past examination question papers curated by the Poornima University Central Library.

## Overview
- **Institution**: Poornima University, Jaipur, Rajasthan, India
- **Repository URL**: ${domain}
- **Objective**: Provide undergraduate, postgraduate, and doctoral students with search-indexed digital access to past Mid-Term (MSE) and End-Term (ESE) question papers.

## Key Faculties & Academic Programs
- Faculty of Computer Science & Applications (BCA, MCA)
- Faculty of Engineering & Technology (B.Tech, M.Tech)
- Faculty of Management & Commerce (BBA, MBA, B.Com)
- Faculty of Science, Humanities & Social Sciences (B.Sc, M.Sc, BA, MA)
- Faculty of Design, Architecture & Planning (B.Des, M.Des, B.Arch, M.Plan, BVA, MVA)
- Faculty of Public Health, Healthcare & Hospitality (BPH, MPH, MHA, PIHM)
- Advanced Doctoral Research (Ph.D)

## Complete Course Index
- Undergraduate: B.Arch, B.Com, B.Des, B.Sc, B.Tech, BA, BBA, BCA, BPH, BVA
- Postgraduate: M.Des, M.Plan, M.Tech, MA, MBA, MCA, MHA, MPH, MVA, PIHM
- Doctoral: Ph.D

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
