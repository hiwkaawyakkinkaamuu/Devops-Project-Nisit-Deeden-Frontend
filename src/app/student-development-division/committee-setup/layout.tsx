"use client";

import Sidebar from "../../../components/Sidebar"; 

export default function StudentDevelopmentDivisionLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen bg-gray-50 font-sans text-gray-800">
      
      {/* --- เรียกใช้ Sidebar Component --- */}
      <Sidebar role="student_development_division" />

      {/* --- Main Content Area --- */}
      <main className="flex-1 ml-[260px] p-8 pb-20">
        <div className="flex justify-end mb-6">
            <span className="text-[11px] font-semibold text-gray-500 bg-white px-3 py-1 rounded-full shadow-sm border border-gray-100">
                ปีการศึกษา 2568 ภาคเรียนที่ 2
            </span>
        </div>
        
        {children}
      </main>
    </div>
  );
}