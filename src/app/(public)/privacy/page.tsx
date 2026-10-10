import React from "react";
import Link from "next/link";
import Navbar from "@/components/Navbar";
import { ArrowLeft, ShieldCheck, Lock, Database, EyeOff, Mail } from "lucide-react";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Privacy Policy",
  description: "Official Privacy Policy for Poornima University Previous Year Question Papers (PYQP) Portal.",
};

export default function PrivacyPage() {
  const contactEmail = process.env.SECURITY_CONTACT_EMAIL || process.env.ADMIN_EMAIL || "";

  return (
    <div className="w-full min-h-screen bg-[#f3f8fc] flex flex-col">
      <Navbar />

      <main className="max-w-4xl mx-auto px-4 sm:px-6 py-8 flex-1 w-full">
        <div className="mb-6">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-xs sm:text-sm font-semibold text-[#05488B] hover:text-[#032e59] transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Portal
          </Link>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="bg-[#05488B] text-white p-6 sm:p-8">
            <div className="flex items-center gap-3 mb-2">
              <ShieldCheck className="w-8 h-8 text-[#ffc107]" />
              <h1 className="text-xl sm:text-2xl font-bold tracking-tight">Privacy Policy</h1>
            </div>
            <p className="text-white/80 text-xs sm:text-sm">
              Poornima University Central Library — Previous Year Question Papers (PYQP) Repository
            </p>
          </div>

          <div className="p-6 sm:p-8 space-y-8 text-gray-700 text-sm sm:text-base leading-relaxed">
            <section>
              <h2 className="text-base sm:text-lg font-bold text-gray-900 mb-2 flex items-center gap-2">
                1. Academic Purpose & Scope
              </h2>
              <p>
                This digital portal is maintained by the Central Library of Poornima University for academic, non-commercial purposes. Its sole objective is to provide students, faculty, and research scholars with seamless, secure access to archived examination question papers (Mid-Term MSE and End-Term ESE).
              </p>
            </section>

            <section>
              <h2 className="text-base sm:text-lg font-bold text-gray-900 mb-2 flex items-center gap-2">
                <Database className="w-5 h-5 text-[#05488B]" />
                2. Information We Collect
              </h2>
              <div className="space-y-3 mt-2">
                <div>
                  <h3 className="font-semibold text-gray-900">Academic Searches:</h3>
                  <p className="text-gray-600 text-sm">
                    Search and filter selections (Course, Year, Semester, Subject) are processed client-side or cached anonymously. We do not track or build profiling dossiers on individual student browsing habits.
                  </p>
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">Student Support Queries:</h3>
                  <p className="text-gray-600 text-sm">
                    When you voluntarily submit a query regarding missing or unreadable question papers, we collect your provided name, student email address, and query description solely to investigate and dispatch resolution updates.
                  </p>
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">Security & Operational Telemetry:</h3>
                  <p className="text-gray-600 text-sm">
                    To prevent denial-of-service abuse, automated scraping, and unauthorized modifications, request headers and IP addresses are temporarily logged through Cloudflare Turnstile and our encrypted rate-limiting engine.
                  </p>
                </div>
              </div>
            </section>

            <section>
              <h2 className="text-base sm:text-lg font-bold text-gray-900 mb-2 flex items-center gap-2">
                <EyeOff className="w-5 h-5 text-[#05488B]" />
                3. Zero Third-Party Monetization
              </h2>
              <p>
                We do not sell, rent, monetize, or trade any personal information, search histories, or email addresses to commercial advertisers, third-party data brokers, or marketing entities. All data is strictly utilized for university library service administration.
              </p>
            </section>

            <section>
              <h2 className="text-base sm:text-lg font-bold text-gray-900 mb-2 flex items-center gap-2">
                <Lock className="w-5 h-5 text-[#05488B]" />
                4. Data Storage & Security
              </h2>
              <p>
                All examination papers and associated metadata are stored within secure Google Drive and Supabase PostgreSQL cloud infrastructures with role-based access control (RBAC). Administrative operations require cryptographically verified multi-factor or credential sessions.
              </p>
            </section>

            <section>
              <h2 className="text-base sm:text-lg font-bold text-gray-900 mb-2 flex items-center gap-2">
                <Mail className="w-5 h-5 text-[#05488B]" />
                5. Contact & Inquiries
              </h2>
              <p>
                For questions regarding this policy, data corrections, or security observations, please reach out to the Central Library team:
              </p>
              <div className="mt-3 p-4 bg-gray-50 rounded-xl border border-gray-200">
                <p className="font-semibold text-gray-900">Poornima University Central Library</p>
                <p className="text-sm text-gray-600">IS-2027 to 2031, Ramchandrapura, P.O. Vidhani Vatika, Sitapura Extension, Jaipur, Rajasthan 303905</p>
                <p className="text-sm text-[#05488B] font-medium mt-1">
                  Email: <a href={`mailto:${contactEmail}`} className="underline">{contactEmail}</a>
                </p>
              </div>
            </section>
          </div>
        </div>
      </main>

      <footer className="w-full bg-white border-t border-gray-200 py-4 text-center text-xs text-gray-500">
        © {new Date().getFullYear()} Poornima University Central Library. All rights reserved.
      </footer>
    </div>
  );
}
