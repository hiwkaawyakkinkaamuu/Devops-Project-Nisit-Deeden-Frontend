"use client";

import { useState, useEffect } from "react";
import Sidebar from "../../../components/sidebar"; 

interface TermResponse {
  year: string;
  semester: string;
}

export default function AssociateDeanLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // สร้าง State เก็บข้อมูล
  const [currentTerm, setCurrentTerm] = useState("กำลังโหลด");

  // เรียก API เมื่อ Component Mount
  useEffect(() => {
    const fetchTerm = async () => {
      try {
        // ดึง Token (สมมติว่าเก็บใน localStorage)
        const token = localStorage.getItem("accessToken");

        // เรียก API พร้อมส่ง Header
        const res = await fetch('/api/system/current-term', {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}` // สำคัญ: ส่ง Token ไปยืนยันตัวตน
          }
        });

        // เช็คว่า API ตอบกลับมาสำเร็จไหม
        if (!res.ok) {
          throw new Error("Failed to fetch term");
        }

        const data: TermResponse = await res.json();
        setCurrentTerm(`ปีการศึกษา ${data.year} ภาคเรียนที่ ${data.semester}`);

      } catch (error) {
        console.error("Error fetching term:", error);
        // กรณี Error ให้ใช้ค่า Default หรือ Mockup แทนได้
        setCurrentTerm("ปีการศึกษา 2568 ภาคเรียนที่ 2"); 
      }
    };

    fetchTerm();
  }, []);

  return (
    <div className="flex min-h-screen bg-gray-50 font-sans text-gray-800">
      <Sidebar role="associate_dean" />

      <main className="flex-1 ml-[260px] p-8 pb-20">
        <div className="flex justify-end mb-6">
            <span className="text-[11px] font-semibold text-gray-500 bg-white px-3 py-1 rounded-full shadow-sm border border-gray-100 animate-fade-in">
                {currentTerm}
            </span>
        </div>
        
        {children}
      </main>
    </div>
  );
}