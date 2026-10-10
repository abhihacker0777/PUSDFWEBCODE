import React from "react";
import Link from "next/link";
import Navbar from "@/components/Navbar";
import { ArrowLeft, BookOpen, Library, GraduationCap, Award } from "lucide-react";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "About & Acknowledgments",
  description: "About the Poornima University Central Library Previous Year Question Papers (PYQP) Repository.",
};

export default function AboutPage() {
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
              <Library className="w-8 h-8 text-[#ffc107]" />
              <h1 className="text-xl sm:text-2xl font-bold tracking-tight">About & Acknowledgments</h1>
            </div>
            <p className="text-white/80 text-xs sm:text-sm">
              Poornima University Central Library Academic Digitization Initiative
            </p>
          </div>

          <div className="p-6 sm:p-8 space-y-8 text-gray-700 text-sm sm:text-base leading-relaxed">
            <section>
              <h2 className="text-base sm:text-lg font-bold text-gray-900 mb-2 flex items-center gap-2">
                <BookOpen className="w-5 h-5 text-[#05488B]" />
                About The Repository
              </h2>
              <p>
                The Previous Year Question Papers (PYQP) Portal is an institutional academic initiative by the Central Library of Poornima University, Jaipur. It serves as the primary centralized digital repository providing undergraduate, postgraduate, and doctoral students with instant, search-indexed access to past examination papers across all university faculties.
              </p>
            </section>

            <section>
              <h2 className="text-base sm:text-lg font-bold text-gray-900 mb-2 flex items-center gap-2">
                <GraduationCap className="w-5 h-5 text-[#05488B]" />
                Coverage & Faculties
              </h2>
              <p>
                The digital archive encompasses Mid-Term Examinations (MSE) and End-Term Examinations (ESE) across all disciplines, including:
              </p>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 mt-3 text-sm">
                <div className="p-3 bg-gray-50 rounded-lg border border-gray-100 font-medium text-gray-800">Faculty of Computer Science (BCA, MCA)</div>
                <div className="p-3 bg-gray-50 rounded-lg border border-gray-100 font-medium text-gray-800">Faculty of Engineering & Tech (B.Tech, M.Tech)</div>
                <div className="p-3 bg-gray-50 rounded-lg border border-gray-100 font-medium text-gray-800">Faculty of Management (BBA, MBA)</div>
                <div className="p-3 bg-gray-50 rounded-lg border border-gray-100 font-medium text-gray-800">Faculty of Science & Commerce (B.Sc, B.Com)</div>
                <div className="p-3 bg-gray-50 rounded-lg border border-gray-100 font-medium text-gray-800">Faculty of Design & Arts (B.Des, B.Arch, BVA)</div>
                <div className="p-3 bg-gray-50 rounded-lg border border-gray-100 font-medium text-gray-800">Hospitality & Public Health (PIHM, MPH)</div>
              </div>
            </section>

            <section>
              <h2 className="text-base sm:text-lg font-bold text-gray-900 mb-2 flex items-center gap-2">
                <Award className="w-5 h-5 text-[#05488B]" />
                Acknowledgments & Governance
              </h2>
              <p>
                We acknowledge the continuous guidance of the Poornima University Office of the Controller of Examinations (COE), the Central Library Advisory Committee, and student developer contributors who contributed to the indexing and modernization of this portal.
              </p>
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
