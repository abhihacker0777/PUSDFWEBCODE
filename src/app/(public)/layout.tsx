import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Poornima University — Previous Year Question Papers (PYQP)",
  description: "Search, filter, and access official previous year Mid Semester (MSE) and End Semester (ESE) examination papers across all university faculties and courses.",
};

export default function PublicLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <div className="flex-1 flex flex-col w-full min-h-0">
      {children}
    </div>
  );
}
