"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import axios from "axios";
import Swal from "sweetalert2";

// ==========================================
// 0. Configuration
// ==========================================

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080";

// ==========================================
// 1. Interfaces
// ==========================================

interface AttachedFile {
  file_id: number;
  file_name: string;
  file_size: number;
  file_url: string;
}

// โครงสร้างข้อมูลที่หน้าบ้านต้องการใช้แสดงผล
interface NominationTracking {
  form_id: number;
  award_type_name: string;
  status_code: 1 | 2 | 3; // 1=Progress, 2=Approved, 3=Rejected
  status_label: string;
  student_firstname: string;
  student_lastname: string;
  student_number: string;
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

// Helper: แปลงสถานะจาก Backend เป็น Step (1-8)
const mapStatusToStep = (status: string): number => {
    // ปรับแก้ string เหล่านี้ให้ตรงกับที่ Database คุณเก็บจริงๆ
    switch (status.toLowerCase()) {
        case "submitted": return 1;        // ส่งเสนอ
        case "department_check": return 2; // ภาควิชา
        case "vice_dean_check": return 3;  // รองคณบดี
        case "dean_check": return 4;       // คณบดี
        case "student_affairs": return 5;  // กองกิจฯ
        case "committee": return 6;        // กรรมการ
        case "chairman": return 7;         // ประธาน
        case "approved": return 8;         // อนุมัติ
        case "rejected": return 8;         // ไม่ผ่าน (โชว์ที่ step สุดท้ายแต่เป็นสีแดง)
        default: return 1;
    }
};

const mapBackendToFrontend = (backendData: any): NominationTracking => {
    const isRejected = backendData.status === "rejected";
    const isApproved = backendData.status === "approved";

    return {
        form_id: backendData.id,
        award_type_name: backendData.award_type?.name || "ไม่ระบุประเภท", // ต้อง Join ตารางมา หรือ map เอง
        // แปลง Status String เป็น Code (1, 2, 3)
        status_code: isRejected ? 3 : isApproved ? 2 : 1,
        status_label: isRejected ? "ไม่ผ่านการคัดเลือก" : isApproved ? "อนุมัติเรียบร้อย" : "อยู่ระหว่างการพิจารณา",
        
        // ข้อมูลนิสิต (ถ้า Backend ส่งมาไม่ครบ อาจต้องใช้ข้อมูลจาก Context หรือให้ Backend Join มา)
        student_firstname: backendData.student?.user?.firstname || "-",
        student_lastname: backendData.student?.user?.lastname || "-",
        student_number: backendData.student?.student_number || "-",
        faculty_name: backendData.student?.faculty?.name || "-", // ต้องเช็คว่า Backend ส่ง structure ลึกแค่ไหน
        
        created_at: backendData.created_at,
        current_step: mapStatusToStep(backendData.status || "submitted"),
        
        // Map Files
        files: backendData.files ? backendData.files.map((f: any) => ({
            file_id: f.id,
            file_name: f.file_name || "Document.pdf", // ถ้า Backend ไม่ส่งชื่อไฟล์มา
            file_size: f.file_size || 0,
            file_url: `${API_BASE_URL}/${f.file_path}` // สร้าง URL จริง
        })) : [],
        
        reject_reason: backendData.reject_reason || "",
        approver_name: backendData.approver || "เจ้าหน้าที่",
    };
};

const nominationTrackingService = {
  getLatestNomination: async (token: string | null): Promise<NominationTracking | null> => {
      try {
        // ยิงไปที่ Endpoint ที่เราเพิ่งแก้ Route ไป
        const response = await axios.get(`/api/awards/my/submissions`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        
        const submissions = response.data.data;

        // ถ้ามีข้อมูล ให้เอาตัวล่าสุด (ตัวที่ 0) มาแสดง
        if (Array.isArray(submissions) && submissions.length > 0) {
            // สมมติว่า Backend sort desc มาแล้ว (ถ้ายัง ให้ sort ที่นี่: submissions.sort(...))
            return mapBackendToFrontend(submissions[0]); 
        }
        
        return null; // ยังไม่เคยส่ง

      } catch (error: any) {
        if (error.response?.status === 404) return null; // ไม่พบข้อมูล = ยังไม่เคยส่ง
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
  "ส่งเสนอ",
  "ภาควิชา",
  "รองคณบดี",
  "คณบดี",
  "กองพัฒนานิสิต",
  "คณะกรรมการ",
  "ประธาน",
  "อนุมัติ",
];

const formatFileSize = (bytes: number) => {
  if (!bytes) return "Unknown size";
  const k = 1024;
  const sizes = ["Bytes", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
};

const formatDate = (isoDate: string) => {
  if (!isoDate) return "-";
  const date = new Date(isoDate);
  return date.toLocaleDateString("th-TH", {
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

// ==========================================
// 4. Sub-Components (UI)
// ==========================================

const Timeline = ({ currentStep, statusCode }: { currentStep: number; statusCode: number }) => {
  return (
    <div className="w-full overflow-x-auto pb-4 custom-scrollbar">
      <div className="relative min-w-[800px] flex items-center justify-between px-4 mt-6 mb-8">
        {/* Background Line */}
        <div className="absolute top-1/2 left-0 w-full h-1 bg-gray-200 -z-10 rounded-full transform -translate-y-1/2"></div>
        {/* Progress Line */}
        <div
          className={`absolute top-1/2 left-0 h-1 z-0 rounded-full transform -translate-y-1/2 transition-all duration-1000 ease-out ${
            statusCode === 3 ? "bg-red-400" : "bg-green-500"
          }`}
          style={{ width: `${((currentStep - 1) / (STEPS.length - 1)) * 100}%` }}
        ></div>

        {STEPS.map((label, index) => {
          const stepNum = index + 1;
          const isPast = stepNum < currentStep;
          const isCurrent = stepNum === currentStep;

          let circleClass = "bg-white border-2 border-gray-300 text-gray-400"; 
          let iconOrNum: React.ReactNode = stepNum;

          if (statusCode === 2) { // Approved All
            circleClass = "bg-green-500 border-green-500 text-white";
            iconOrNum = <CheckIcon />;
          } else if (statusCode === 3 && isCurrent) { // Rejected at current
            circleClass = "bg-red-500 border-red-500 text-white shadow-lg shadow-red-200 scale-110";
            iconOrNum = <XIcon />;
          } else if (isPast) { // Passed steps
            circleClass = "bg-green-500 border-green-500 text-white";
            iconOrNum = <CheckIcon />;
          } else if (isCurrent) { // Current processing
            circleClass = "bg-white border-[3px] border-blue-500 text-blue-500 ring-4 ring-blue-100 animate-pulse";
          }

          return (
            <div key={stepNum} className="relative z-10 flex flex-col items-center">
              <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold transition-all duration-500 ${circleClass}`}>
                {iconOrNum}
              </div>
              <span
                className={`absolute top-12 text-xs font-semibold whitespace-nowrap px-2 py-1 rounded-md transition-colors duration-300 ${
                  isCurrent && statusCode === 3 ? "text-red-600 bg-red-50"
                  : isCurrent ? "text-blue-600 bg-blue-50"
                  : statusCode === 2 ? "text-green-600"
                  : isPast ? "text-green-600"
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
  <div className="w-full max-w-6xl mx-auto p-8 bg-white rounded-[24px] shadow-sm border border-gray-100 animate-pulse">
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

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const token = localStorage.getItem("token"); // ⚠️ เช็คชื่อ Key ให้ตรงกับที่ Login เก็บไว้ (token หรือ accessToken)
        
        if (!token) {
            // ถ้าไม่มี Token ให้ข้ามไปเลย หรือ Redirect
            setLoading(false);
            return;
        }

        const data = await nominationTrackingService.getLatestNomination(token);
        setNomination(data);

      } catch (error: any) {
        // ถ้าเป็น Unauthorized ให้ดีดไป Login (จัดการโดย AuthContext หรือ RoleGuard แล้ว แต่กันเหนียว)
        if (error.message === "Unauthorized") {
             localStorage.removeItem("token");
             window.location.href = "/";
             return;
        }

        console.error("Fetch error:", error);
        Swal.fire({
            icon: "error",
            title: "เกิดข้อผิดพลาด",
            text: "ไม่สามารถดึงข้อมูลสถานะได้ กรุณาลองใหม่อีกครั้ง",
        });
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const handleDownload = (file: AttachedFile) => {
    window.open(file.file_url, "_blank");
  };

  // Render Loading
  if (loading) return <LoadingSkeleton />;

  // Render Empty State (ยังไม่เคยส่ง)
  if (!nomination) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 p-6">
        <div className="bg-white p-10 rounded-[32px] shadow-sm text-center max-w-lg border border-gray-100">
          <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <svg className="w-10 h-10 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
          </div>
          <h2 className="text-xl font-bold text-gray-800 mb-2">ยังไม่มีประวัติการเสนอชื่อ</h2>
          <p className="text-gray-500 mb-8">คุณยังไม่ได้ทำการเสนอชื่อนิสิตดีเด่นในปีการศึกษานี้</p>
          <Link href="/student/student-nomination-form" className="px-8 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 font-bold transition-all shadow-lg shadow-blue-200">
            ไปที่แบบฟอร์มเสนอชื่อ
          </Link>
        </div>
      </div>
    );
  }

  const isRejected = nomination.status_code === 3;
  const isApproved = nomination.status_code === 2;

  return (
    <div className="min-h-screen bg-gray-50/50 p-6 md:p-10 font-sans pb-32">
      <style jsx global>{`
        @keyframes fadeInUp { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
        .animate-fade-in-up { animation: fadeInUp 0.5s cubic-bezier(0.16, 1, 0.3, 1) forwards; }
        /* Custom Scrollbar for Timeline */
        .custom-scrollbar::-webkit-scrollbar { height: 6px; }
        .custom-scrollbar::-webkit-scrollbar-track { bg-gray-100; border-radius: 4px; }
        .custom-scrollbar::-webkit-scrollbar-thumb { bg-gray-300; border-radius: 4px; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { bg-gray-400; }
      `}</style>

      <div className="max-w-[1400px] mx-auto space-y-8 animate-fade-in-up">
        
        {/* Header / Info Card */}
        <div className="bg-white/90 backdrop-blur-xl rounded-[32px] p-8 md:p-10 shadow-sm border border-white/60 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
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
              : isApproved ? "bg-green-50 border-green-100 text-green-700"
              : "bg-blue-50 border-blue-100 text-blue-700"
            }`}
          >
            {isRejected ? (
              <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
            ) : isApproved ? (
              <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
            ) : (
              <div className="relative flex h-6 w-6">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-6 w-6 bg-blue-500"></span>
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

        {/* Timeline */}
        <div className="bg-white rounded-[24px] p-8 md:p-10 shadow-sm border border-gray-100 overflow-hidden">
          <h3 className="text-xl font-bold text-gray-800 mb-2">เส้นทางการพิจารณา</h3>
          <p className="text-gray-500 text-sm mb-6">แสดงสถานะล่าสุดของการดำเนินการ</p>
          <div className="py-4">
            <Timeline currentStep={nomination.current_step} statusCode={nomination.status_code} />
          </div>
        </div>

        {/* Files */}
        <div className="bg-white rounded-[24px] p-8 md:p-10 shadow-sm border border-gray-100">
          <h3 className="text-xl font-bold text-gray-800 mb-6 flex items-center gap-2">
            <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" /></svg>
            ไฟล์แนบ ({nomination.files?.length || 0})
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {nomination.files && nomination.files.length > 0 ? (
              nomination.files.map((file) => (
                <div key={file.file_id} onClick={() => handleDownload(file)} className="group cursor-pointer bg-gray-50 hover:bg-blue-50 border border-gray-200 hover:border-blue-200 rounded-2xl p-4 flex items-center gap-4 transition-all duration-200 hover:-translate-y-1 hover:shadow-md">
                  <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center text-red-500 shadow-sm group-hover:scale-110 transition-transform">
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" /></svg>
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-bold text-gray-700 truncate group-hover:text-blue-700">{file.file_name}</p>
                    <p className="text-xs text-gray-400 mt-0.5">{formatFileSize(file.file_size)}</p>
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