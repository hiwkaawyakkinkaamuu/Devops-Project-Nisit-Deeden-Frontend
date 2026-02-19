"use client";

import React, { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import axios from "axios";

// ==========================================
// 0. Configuration
// ==========================================

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "/api";

// ==========================================
// 1. Interfaces
// ==========================================

interface AttachedFile {
  file_id: number;
  file_name: string;
  file_size: number;
  file_url: string;
}

interface NominationTracking {
  form_id: number;
  award_type_id: number; 
  award_type_name: string;
  status_code: 1 | 2 | 3; // 1=Progress, 2=Approved, 3=Rejected
  status_label: string;
  student_firstname: string;
  student_lastname: string;
  student_number: string;
  faculty_id?: number;
  faculty_name: string;
  created_at: string;
  current_step: number; // 1-8
  files: AttachedFile[];
  reject_reason?: string;
  approver_name?: string;
}

// ==========================================
// 2. Service Layer & Mapper
// ==========================================

// แปลง ID สถานะ (1-15) ให้เป็น Step ของ Timeline (1-8) และข้อความให้ตรงกับตาราง Database
const getStatusInfo = (id: number): { step: number, code: 1 | 2 | 3, label: string } => {
    const mapping: Record<number, { step: number, code: 1 | 2 | 3, label: string }> = {
        1: { step: 2, code: 1, label: "รอหัวหน้าภาคพิจารณา" },
        2: { step: 3, code: 1, label: "รอรองคณบดีพิจารณา" },
        3: { step: 2, code: 3, label: "ไม่ผ่าน (ตีกลับโดยหัวหน้าภาค)" },
        4: { step: 4, code: 1, label: "รอคณบดีพิจารณา" },
        5: { step: 3, code: 3, label: "ไม่ผ่าน (ตีกลับโดยรองคณบดี)" },
        6: { step: 5, code: 1, label: "รอกองพัฒนานิสิตพิจารณา" },
        7: { step: 4, code: 3, label: "ไม่ผ่าน (ตีกลับโดยคณบดี)" },
        8: { step: 6, code: 1, label: "รอคณะกรรมการพิจารณา" },
        9: { step: 5, code: 3, label: "ไม่ผ่าน (ตีกลับโดยกองพัฒนานิสิต)" },
        10: { step: 7, code: 1, label: "รอประธานกรรมการพิจารณา" },
        11: { step: 6, code: 3, label: "ไม่ผ่าน (ตีกลับโดยคณะกรรมการ)" },
        12: { step: 8, code: 1, label: "รออธิการบดีพิจารณา" },
        13: { step: 7, code: 3, label: "ไม่ผ่าน (ตีกลับโดยประธานกรรมการ)" },
        14: { step: 8, code: 2, label: "ผ่านการคัดเลือก (อนุมัติแล้ว)" },
        15: { step: 8, code: 3, label: "ไม่ผ่าน (ตีกลับโดยอธิการบดี)" },
    };
    return mapping[id] || { step: 1, code: 1, label: "ส่งเสนอชื่อเรียบร้อย" };
};

// ฟังก์ชันหา ID จากชื่อ หาก Backend ไม่ได้ส่ง ID กลับมา
const getAwardTypeId = (name: string) => {
    if (!name) return 0;
    if (name.includes("กิจกรรม")) return 1;
    if (name.includes("นวัตกรรม")) return 2;
    if (name.includes("ประพฤติ")) return 3;
    if (name.includes("อื่นๆ") || name.includes("อื่น ๆ")) return 4;
    return 0;
};

const mapBackendToFrontend = (backendData: any): NominationTracking => {
    // API ส่งกลับมาเป็น form_status ไม่ใช่ form_status_id
    const statusId = backendData.form_status || backendData.form_status_id || 1;
    const statusInfo = getStatusInfo(statusId);

    // API ส่งกลับมาเป็น award_type ไม่ใช่ award_type_name
    const awardName = backendData.award_type || backendData.award_type_name || "ไม่ระบุประเภท";
    const awardId = backendData.award_type_id || getAwardTypeId(awardName);

    return {
        form_id: backendData.form_id, 
        award_type_id: awardId,
        award_type_name: awardName,
        status_code: statusInfo.code,
        status_label: statusInfo.label,
        student_firstname: backendData.student_firstname || "-",
        student_lastname: backendData.student_lastname || "-",
        student_number: backendData.student_number || "-",
        faculty_id: backendData.faculty_id,
        faculty_name: backendData.faculty_name || "", // รอ fetch เพิ่มถ้าไม่มี
        created_at: backendData.created_at,
        current_step: statusInfo.step,
        files: backendData.files ? backendData.files.map((f: any) => ({
            file_id: f.file_dir_id, 
            file_name: f.file_name || "Document.pdf", 
            file_size: f.file_size || 0,
            file_url: `${API_BASE_URL}/${f.file_path}`
        })) : [],
        reject_reason: backendData.reject_reason || "",
        approver_name: "ระบบพิจารณา", 
    };
};

const formatFileSize = (bytes: number) => {
  if (bytes === 0) return "0 Bytes";
  const k = 1024;
  const sizes = ["Bytes", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
};

const nominationTrackingService = {
  getLatestNomination: async (token: string | null): Promise<NominationTracking | null> => {
      try {
        const response = await axios.get(`${API_BASE_URL}/awards/my/submissions`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        
        const submissions = response.data.data;
        if (Array.isArray(submissions) && submissions.length > 0) {
            // เอาอันล่างสุด (หรือล่าสุด) ของอาร์เรย์มาโชว์ที่หน้าติดตาม
            const latestSub = submissions.reduce((prev, current) => 
                (new Date(prev.created_at) > new Date(current.created_at)) ? prev : current
            );
            return mapBackendToFrontend(latestSub); 
        }
        return null; 
      } catch (error: any) {
        if (error.response?.status === 404) return null;
        if (error.response?.status === 401) throw new Error("Unauthorized");
        console.error("API Error:", error);
        throw error;
      }
  },
};

// ==========================================
// 3. Helper Constants & Functions
// ==========================================

const STEPS = [
  "ส่งเสนอ", "ภาควิชา", "รองคณบดี", "คณบดี", 
  "กองพัฒนานิสิต", "คณะกรรมการ", "ประธาน", "อธิการบดี"
];

const formatDate = (isoDate: string) => {
  if (!isoDate || isoDate.startsWith("0001")) return "-";
  const date = new Date(isoDate);
  return date.toLocaleDateString("th-TH", {
    year: "numeric", month: "short", day: "numeric",
  });
};

// ==========================================
// 4. Sub-Components (UI)
// ==========================================

// Timeline Component with Theme Color Support
const Timeline = ({ currentStep, statusCode, themeColor }: { currentStep: number; statusCode: number; themeColor: string }) => {
  return (
    <div className="w-full overflow-x-auto pb-4 custom-scrollbar">
      <div className="relative min-w-[800px] flex items-center justify-between px-4 mt-6 mb-8">
        {/* Background Line */}
        <div className="absolute top-1/2 left-0 w-full h-1 bg-gray-200 -z-10 rounded-full transform -translate-y-1/2"></div>
        
        {/* Progress Line (Dynamic Color) */}
        <div
          className={`absolute top-1/2 left-0 h-1 z-0 rounded-full transform -translate-y-1/2 transition-all duration-1000 ease-out bg-${statusCode === 3 ? "red-400" : `${themeColor}-500`}`}
          style={{ width: `${((currentStep - 1) / (STEPS.length - 1)) * 100}%` }}
        ></div>

        {STEPS.map((label, index) => {
          const stepNum = index + 1;
          const isPast = stepNum < currentStep;
          const isCurrent = stepNum === currentStep;

          let circleClass = "bg-white border-2 border-gray-300 text-gray-400"; 
          let iconOrNum: React.ReactNode = stepNum;

          if (statusCode === 2) { // Approved (All Green/Theme)
            circleClass = `bg-${themeColor}-500 border-${themeColor}-500 text-white`;
            iconOrNum = <CheckIcon />;
          } else if (statusCode === 3 && isCurrent) { // Rejected
            circleClass = "bg-red-500 border-red-500 text-white shadow-lg shadow-red-200 scale-110";
            iconOrNum = <XIcon />;
          } else if (isPast) { // Passed Steps
            circleClass = `bg-${themeColor}-500 border-${themeColor}-500 text-white`;
            iconOrNum = <CheckIcon />;
          } else if (isCurrent) { // Active Step
            circleClass = `bg-white border-[3px] border-${themeColor}-500 text-${themeColor}-500 ring-4 ring-${themeColor}-100 animate-pulse`;
          }

          return (
            <div key={stepNum} className="relative z-10 flex flex-col items-center">
              <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold transition-all duration-500 ${circleClass}`}>
                {iconOrNum}
              </div>
              <span
                className={`absolute top-12 text-xs font-semibold whitespace-nowrap px-2 py-1 rounded-md transition-colors duration-300 ${
                  isCurrent && statusCode === 3 ? "text-red-600 bg-red-50"
                  : isCurrent ? `text-${themeColor}-600 bg-${themeColor}-50`
                  : statusCode === 2 ? `text-${themeColor}-600`
                  : isPast ? `text-${themeColor}-600`
                  : "text-gray-400"
                }`}
              >
                {label}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
};

const CheckIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" /></svg>
);
const XIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M6 18L18 6M6 6l12 12" /></svg>
);

const LoadingSkeleton = () => (
  <div className="w-full max-w-6xl mx-auto p-8 bg-white rounded-[24px] shadow-sm border border-gray-100 animate-pulse mt-10">
    <div className="flex justify-between mb-8">
      <div className="h-8 bg-gray-200 rounded w-1/3"></div>
      <div className="h-8 bg-gray-200 rounded w-32"></div>
    </div>
    <div className="h-4 bg-gray-200 rounded w-1/2 mb-12"></div>
    <div className="h-20 bg-gray-200 rounded-xl mb-8"></div>
    <div className="grid grid-cols-2 gap-4">
      <div className="h-32 bg-gray-200 rounded-xl"></div>
      <div className="h-32 bg-gray-200 rounded-xl"></div>
    </div>
  </div>
);

// ==========================================
// 5. Main Component
// ==========================================

export default function TraceNominationPage() {
  const [loading, setLoading] = useState(true);
  const [nomination, setNomination] = useState<NominationTracking | null>(null);

  // --- Theme Logic ---
  const themeColor = useMemo(() => {
    if (!nomination) return 'blue'; 
    const id = nomination.award_type_id;
    const name = nomination.award_type_name || "";
    
    if (id === 1 || name.includes("กิจกรรม")) return 'orange';
    if (id === 2 || name.includes("นวัตกรรม")) return 'purple';
    if (id === 3 || name.includes("ประพฤติ")) return 'blue';
    if (id === 4 || name.includes("อื่นๆ")) return 'green';
    
    return 'gray'; 
  }, [nomination]);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const token = localStorage.getItem("token"); 
        if (!token) {
            setLoading(false);
            return;
        }

        const data = await nominationTrackingService.getLatestNomination(token);
        
        // ถ้า Backend ไม่ส่งชื่อคณะมาให้ เราดึงเองเลย
        if (data && data.faculty_id && !data.faculty_name) {
             try {
                 const res = await axios.get(`${API_BASE_URL}/faculty`, { headers: { Authorization: `Bearer ${token}` } });
                 const facList = res.data?.data || res.data || [];
                 const found = facList.find((f: any) => String(f.faculty_id || f.FacultyID) === String(data.faculty_id));
                 if (found) data.faculty_name = found.faculty_name || found.FacultyName;
             } catch (e) {}
        }

        setNomination(data);

      } catch (error: any) {
        if (error.message === "Unauthorized") {
             localStorage.removeItem("token");
             window.location.href = "/";
             return;
        }
        console.error("Fetch error:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const handleDownload = (file: AttachedFile) => {
    let safePath = file.file_url;
    if (safePath.includes("api/uploads")) safePath = safePath.replace("api/uploads", "uploads");
    window.open(safePath, "_blank");
  };

  if (loading) return <LoadingSkeleton />;

  // ปรับการแสดงผลหน้า Empty ให้โครงสร้างเหมือน Nomination History เป๊ะๆ
  if (!nomination) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 p-6 font-sans">
        <div className="bg-white p-10 rounded-[32px] shadow-xl text-center max-w-lg w-full border border-gray-100 animate-fade-in-up">
          <div className="w-24 h-24 bg-blue-50 rounded-full flex items-center justify-center mx-auto mb-6 text-blue-500 shadow-sm">
            <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
          </div>
          <h2 className="text-2xl font-extrabold text-gray-900 mb-3">ยังไม่มีประวัติการเสนอชื่อ</h2>
          <p className="text-gray-500 mb-8 leading-relaxed">
            คุณยังไม่ได้ทำการเสนอชื่อนิสิตดีเด่นในปีการศึกษานี้<br/>
            กรุณากรอกแบบฟอร์มเพื่อเริ่มต้นการเสนอชื่อ
          </p>
          <Link href="/student/main/student-nomination-form" className="w-full block py-4 bg-gray-900 text-white rounded-2xl font-bold hover:bg-black transition-all shadow-lg hover:shadow-xl flex items-center justify-center gap-2 group">
            <span>ไปที่แบบฟอร์มเสนอชื่อ</span>
            <svg className="w-5 h-5 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14 5l7 7m0 0l-7 7m7-7H3" /></svg>
          </Link>
        </div>
      </div>
    );
  }

  const isRejected = nomination.status_code === 3;
  const isApproved = nomination.status_code === 2;

  return (
    <div className={`min-h-screen bg-gray-50/50 p-6 md:p-10 font-sans pb-32`}>
      <style jsx global>{`
        @keyframes fadeInUp { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
        .animate-fade-in-up { animation: fadeInUp 0.5s cubic-bezier(0.16, 1, 0.3, 1) forwards; }
        .custom-scrollbar::-webkit-scrollbar { height: 6px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: #f3f4f6; border-radius: 4px; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #d1d5db; border-radius: 4px; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #9ca3af; }
      `}</style>

      <div className="max-w-[1400px] mx-auto space-y-8 animate-fade-in-up">
        
        {/* Header / Info Card */}
        <div className={`bg-white/90 backdrop-blur-xl rounded-[32px] p-8 md:p-10 shadow-sm border border-${themeColor}-100 flex flex-col md:flex-row justify-between items-start md:items-center gap-6 relative overflow-hidden`}>
           {/* Decorative Top Line */}
           <div className={`absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-${themeColor}-400 to-${themeColor}-600`}></div>
           
          <div>
            <div className="flex items-center gap-3 mb-2">
              <span className="bg-gray-100 text-gray-500 text-[10px] font-bold px-2 py-1 rounded border border-gray-200">
                REF ID: {nomination.form_id}
              </span>
              <span className="text-sm text-gray-400 font-medium">ส่งเมื่อ {formatDate(nomination.created_at)}</span>
            </div>
            <h1 className="text-2xl md:text-3xl font-extrabold text-gray-900 leading-tight">
              {nomination.award_type_name}
            </h1>
            <p className="text-gray-500 mt-1">
              {nomination.faculty_name} • {nomination.student_firstname} {nomination.student_lastname}
            </p>
          </div>

          {/* Status Badge */}
          <div className={`px-6 py-4 rounded-2xl border flex items-center gap-3 shadow-sm min-w-[200px] justify-center ${
              isRejected ? "bg-red-50 border-red-100 text-red-700"
              : isApproved ? `bg-${themeColor}-50 border-${themeColor}-100 text-${themeColor}-700`
              : `bg-${themeColor}-50 border-${themeColor}-100 text-${themeColor}-700`
            }`}
          >
            {isRejected ? (
              <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
            ) : isApproved ? (
              <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
            ) : (
              <div className="relative flex h-6 w-6">
                <span className={`animate-ping absolute inline-flex h-full w-full rounded-full bg-${themeColor}-400 opacity-75`}></span>
                <span className={`relative inline-flex rounded-full h-6 w-6 bg-${themeColor}-500`}></span>
              </div>
            )}
            <div>
              <p className="text-[10px] uppercase font-bold opacity-70 tracking-wider">สถานะปัจจุบัน</p>
              <p className="text-lg font-bold">{nomination.status_label}</p>
            </div>
          </div>
        </div>

        {/* Rejection Reason */}
        {isRejected && nomination.reject_reason && (
          <div className="bg-red-50 rounded-[24px] p-6 md:p-8 border border-red-100 flex items-start gap-4 animate-fade-in-up shadow-sm">
            <div className="w-12 h-12 bg-red-100 text-red-600 rounded-full flex items-center justify-center shrink-0">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
            </div>
            <div>
              <h3 className="text-lg font-bold text-red-800 mb-1">คำขอของคุณไม่ผ่านการพิจารณา / ถูกตีกลับ</h3>
              <p className="text-red-700 font-medium leading-relaxed">
                <span className="font-bold">เหตุผล:</span> "{nomination.reject_reason}"
              </p>
              {nomination.approver_name && <p className="text-red-500 text-sm mt-2">โดย: {nomination.approver_name}</p>}
              <p className="text-red-400 text-xs mt-3">* กรุณาติดต่อหน่วยงานที่เกี่ยวข้องหากมีข้อสงสัย เนื่องจากระบบไม่อนุญาตให้แก้ไขข้อมูลหลังจากถูกตีกลับ</p>
            </div>
          </div>
        )}

        {/* Timeline (Pass Theme Color) */}
        <div className={`bg-white rounded-[24px] p-8 md:p-10 shadow-sm border border-${themeColor}-100 overflow-hidden`}>
          <h3 className="text-xl font-bold text-gray-800 mb-2">เส้นทางการพิจารณา</h3>
          <p className="text-gray-500 text-sm mb-6">แสดงสถานะล่าสุดของการดำเนินการ</p>
          <div className="py-4">
            <Timeline currentStep={nomination.current_step} statusCode={nomination.status_code} themeColor={themeColor} />
          </div>
        </div>

        {/* Files */}
        <div className={`bg-white rounded-[24px] p-8 md:p-10 shadow-sm border border-${themeColor}-100`}>
          <h3 className="text-xl font-bold text-gray-800 mb-6 flex items-center gap-2">
            <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" /></svg>
            ไฟล์แนบ ({nomination.files?.length || 0})
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {nomination.files && nomination.files.length > 0 ? (
              nomination.files.map((file) => (
                <div key={file.file_id} onClick={() => handleDownload(file)} className={`group cursor-pointer bg-gray-50 hover:bg-${themeColor}-50 border border-gray-200 hover:border-${themeColor}-200 rounded-2xl p-4 flex items-center gap-4 transition-all duration-200 hover:-translate-y-1 hover:shadow-md`}>
                  <div className={`w-12 h-12 bg-white rounded-xl flex items-center justify-center text-${themeColor}-500 shadow-sm group-hover:scale-110 transition-transform`}>
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" /></svg>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className={`text-sm font-bold text-gray-700 truncate group-hover:text-${themeColor}-700`}>{file.file_name}</p>
                    <p className="text-xs text-gray-400 mt-1">{formatFileSize(file.file_size)}</p>
                  </div>
                  <div className={`text-gray-300 group-hover:text-${themeColor}-500 transition-colors`}>
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-gray-400 text-sm">ไม่มีไฟล์แนบ</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}