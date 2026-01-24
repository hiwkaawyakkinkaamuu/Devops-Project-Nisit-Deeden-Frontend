"use client";

import React, { useState, useEffect } from "react";

// ข้อมูลไฟล์แนบ
interface AttachedFile {
  file_id: number;
  file_name: string;
  file_size: number; // ขนาดเป็น bytes
  is_new: boolean;   // ตัวอย่าง flag สำหรับบอกว่าเป็นไฟล์ใหม่หรือเก่า
}

// ข้อมูลการติดตามผล
interface NominationTracking {
  form_id: number;
  award_type_name: string;
  nomination_status: string; // e.g., "กำลังดำเนินการ", "อนุมัติ", "ส่งคืน"
  student_firstname: string;
  student_lastname: string;
  created_at: string; // ISO Date String
  current_step: number; // 1-8 ตาม steps array
  files: AttachedFile[];
}

// Helper: แปลง bytes เป็น KB/MB
const formatFileSize = (bytes: number) => {
  if (bytes === 0) return "0 Bytes";
  const k = 1024;
  const sizes = ["Bytes", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
};

// Helper: แปลงวันที่ (dd/mm/yyyy)
const formatDate = (isoDate: string) => {
  if (!isoDate) return "-";
  const date = new Date(isoDate);
  const year = date.getFullYear(); 
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${day}/${month}/${year}`;
};

// Main Component
export default function TraceNominationPage() {
  const [loading, setLoading] = useState(true);
  const [trackingData, setTrackingData] = useState<NominationTracking | null>(null);
  
  // รายชื่อขั้นตอน (Mapping กับ current_step 1-8)
  const steps = [
    "ส่งเสนอ", 
    "ภาควิชา", 
    "รองคณบดี", 
    "คณบดี", 
    "กองพัฒนานิสิต", 
    "คณะกรรมการ", 
    "ประธาน", 
    "อนุมัติ"
  ];

  // State declarations
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const token = localStorage.getItem("accessToken");
        const apiUrl = process.env.NEXT_PUBLIC_API_URL || "";

        // Real API Call
        const res = await fetch(`${apiUrl}/api/nomination/track/latest`, {
            method: "GET",
            headers: { 
                "Authorization": `Bearer ${token}`,
                "Content-Type": "application/json"
            }
        });

        if (!res.ok) {
            throw new Error(`API Connection Failed: ${res.status}`);
        }

        const result = await res.json();
        // ใช้ข้อมูลจริงจาก API (เช็คว่าข้อมูลอยู่ใน .data หรือไม่)
        setTrackingData(result.data || result);

      } catch (error) {
        console.warn("⚠️ API Error/Not Connected. Switching to Mockup Data:", error);

        // Mockup Data
        const mockData: NominationTracking = {
            form_id: 2025001,
            award_type_name: "นิสิตดีเด่นด้านวิชาการ",
            nomination_status: "กำลังดำเนินการ",
            student_firstname: "สมชาย",
            student_lastname: "หัวจดเท้า",
            created_at: "2026-01-15T10:00:00Z", // ปี ค.ศ.
            current_step: 3, // อยู่ขั้นตอนที่ 3 (รองคณบดี)
            files: [
                { file_id: 1, file_name: "ใบรับรองผลการเรียน.pdf", file_size: 250880, is_new: false }, // ~245 KB
                { file_id: 2, file_name: "เกียรติบัตรรางวัล.pdf", file_size: 1258291, is_new: true }   // ~1.2 MB
            ]
        };

        setTrackingData(mockData);

      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  if (loading) return <div className="p-10 text-center text-gray-500 animate-pulse">กำลังโหลดสถานะ</div>;
  if (!trackingData) return <div className="p-10 text-center text-gray-500">ไม่พบข้อมูลการติดตาม</div>;

  return (
    <div className="space-y-6 animate-fade-in font-sans">
        
      {/* Header Card */}
      <section className="bg-white rounded-[20px] p-8 shadow-sm border border-gray-100">
        <div className="flex justify-between items-start mb-8">
          <div>
            <h3 className="text-lg font-bold text-gray-800">{trackingData.award_type_name}</h3>
            <p className="text-[11px] text-gray-400 font-semibold mt-0.5">เลขที่การเสนอ: {trackingData.form_id}</p>
          </div>
          <span className="bg-[#acffb6] text-[#16a34a] px-4 py-2 rounded-xl text-xs font-bold border border-[#BBF7D0]">
            {trackingData.nomination_status}
          </span>
        </div>
        
        <div className="grid grid-cols-2 gap-y-8">
          <div>
            <p className="text-[14px] text-gray-400 font-bold uppercase tracking-widest">ชื่อนิสิต</p>
            <p className="text-gray-700 font-bold mt-1 text-sm">
                {trackingData.student_firstname} {trackingData.student_lastname}
            </p>
          </div>
          <div>
            <p className="text-[14px] text-gray-400 font-bold uppercase tracking-widest">วันที่ส่งเสนอ</p>
            <p className="text-gray-700 font-bold mt-1 text-sm">
                {formatDate(trackingData.created_at)}
            </p>
          </div>
          <div>
            <p className="text-[14px] text-gray-400 font-bold uppercase tracking-widest">ผู้พิจารณาปัจจุบัน</p>
            <p className="text-gray-700 font-bold mt-1 text-sm text-blue-600">
                {steps[trackingData.current_step - 1] || "สิ้นสุด"}
            </p>
          </div>
        </div>
      </section>
    
      {/* Timeline Card */}
      <section className="bg-white rounded-[20px] p-8 shadow-sm border border-gray-100">
        <h3 className="text-base font-bold text-gray-800">ขั้นตอนการพิจารณา</h3>
        <p className="text-[11px] text-gray-400 font-medium mb-12">ติดตามความคืบหน้าของการพิจารณาการเสนอของคุณ</p>
        
        <div className="relative flex items-center justify-between px-6">
          {/* เส้นเชื่อมพื้นหลัง */}
          <div className="absolute top-[22px] left-12 right-12 h-[2px] bg-gray-100 -z-0">
             {/* เส้นสีเขียววิ่งตาม Step */}
             <div 
                className="h-full bg-green-200 transition-all duration-1000 ease-out" 
                style={{ width: `${((trackingData.current_step - 1) / (steps.length - 1)) * 100}%` }}
             ></div>
          </div>
          
          {steps.map((label, index) => {
            const stepNum = index + 1;
            const isPast = stepNum < trackingData.current_step;
            const isCurrent = stepNum === trackingData.current_step;
            
            return (
              <div key={stepNum} className="relative z-10 flex flex-col items-center flex-1">
                <div className="flex items-center justify-center h-11 w-11 transition-all duration-500">
                  {isPast ? (
                    // ผ่านไปแล้ว: วงสีเขียวเต็มวง
                    <div className="w-8 h-8 rounded-full bg-green-500 shadow-md shadow-green-200 flex items-center justify-center text-white">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7"/></svg>
                    </div>
                  ) : isCurrent ? (
                    // ปัจจุบัน: วงแหวนนอก (Border) + ขอบขาวใน + วงเขียวเล็ก
                    <div className="relative">
                        <div className="absolute inset-0 bg-blue-200 rounded-full animate-ping opacity-75"></div>
                        <div className="w-8 h-8 rounded-full border-2 border-blue-500 bg-white flex items-center justify-center relative z-10">
                            <div className="w-3 h-3 rounded-full bg-blue-500"></div>
                        </div>
                    </div>
                  ) : (
                    // ยังไม่ถึง (สีเทา)
                    <div className="w-8 h-8 rounded-full border-2 border-gray-200 bg-white flex items-center justify-center text-[10px] font-bold text-gray-300">
                      {stepNum}
                    </div>
                  )}
                </div>
                
                <span className={`text-[10px] mt-4 font-bold tracking-tight text-center transition-colors duration-300 ${
                  isCurrent ? "text-blue-600 scale-110" : isPast ? "text-green-600" : "text-gray-300"
                }`}>
                  {label}
                </span>
              </div>
            );
          })}
        </div>
      </section>

      {/* Files Card */}
      <section className="bg-white rounded-[20px] p-8 shadow-sm border border-gray-100">
        <h3 className="text-base font-bold text-gray-800">เอกสารและไฟล์แนบ</h3>
        <p className="text-[11px] text-gray-400 font-medium mb-6">เอกสารที่แนบมากับการเสนอ</p>

        <div className="space-y-3">
          {trackingData.files.map((file) => (
            <div 
              key={file.file_id} 
              className="flex items-center justify-between p-4 bg-white rounded-2xl border border-gray-100 hover:border-green-200 hover:shadow-sm transition-all cursor-pointer group"
            >
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 bg-red-50 rounded-lg flex items-center justify-center text-red-400 group-hover:bg-red-100 transition-colors">
                  {/* Icon PDF */}
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                  </svg>
                </div>
                <div>
                  <p className="text-sm font-bold text-gray-700 group-hover:text-gray-900">{file.file_name}</p>
                  <p className="text-[10px] text-gray-400 font-bold">{formatFileSize(file.file_size)}</p>
                </div>
              </div>
              
              <button className={`p-2 rounded-xl transition-colors ${
                file.is_new 
                ? "bg-green-50 text-green-600" 
                : "bg-gray-50 text-gray-400 group-hover:text-gray-600"
              }`}>
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0L8 8m4-4v12" />
                </svg>
              </button>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}