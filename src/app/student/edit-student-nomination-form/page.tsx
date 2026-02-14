"use client";

import { useState, useRef, useEffect, useMemo } from "react";
import Link from "next/link"; 
import Swal from "sweetalert2";
import { useRouter } from "next/navigation";
import { Skeleton } from "@/components/Skeleton";

// 1. Interfaces & Types

interface UserProfile {
  student_firstname: string;
  student_lastname: string;
  student_number: string;
  email: string;
  student_year: string;
  faculty_name: string;
  department_name: string;
  advisor_name: string;
  gpa: string;
  phone_number: string;
}

interface NominationData extends UserProfile {
  form_id: number;
  award_type: string;
  
  // Specific Fields
  activity_criteria?: string;
  innovation_qual?: boolean;
  behavior_desc?: string;
  
  date_of_birth: string;
  address: string;
  
  // Award Details
  project_title?: string;
  date_received?: string;
  prize?: string;
  organized_by?: string;
  team_name?: string;

  // Files (From DB)
  existing_files: { file_id: number; file_name: string; file_path: string; file_size?: number }[];
}

// 2. Constants

const MAX_TOTAL_FILE_SIZE_MB = 10;
const MAX_TOTAL_FILE_SIZE_BYTES = MAX_TOTAL_FILE_SIZE_MB * 1024 * 1024;

// 3. Helper Functions

const formatFileSize = (bytes: number) => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
};

const getLabels = (type: string) => {
    switch (type) {
        case "activity":
            return {
                title: "รายละเอียดกิจกรรม",
                name: "ชื่อโครงการ/กิจกรรม",
                date: "วันที่เข้าร่วมกิจกรรม",
                role_prize: "บทบาท/หน้าที่ (หรือรางวัลที่ได้รับ)",
                org: "หน่วยงานที่จัดกิจกรรม/สถานที่",
                team: "ชื่อทีม (ถ้ามี)"
            };
        case "innovation":
            return {
                title: "รายละเอียดผลงานนวัตกรรม",
                name: "ชื่อผลงานนวัตกรรม/สิ่งประดิษฐ์",
                date: "วันที่ได้รับรางวัล/จดทะเบียน",
                role_prize: "รางวัลที่ได้รับ (เช่น ชนะเลิศ, เหรียญทอง)",
                org: "เวทีการประกวด/หน่วยงานผู้มอบรางวัล",
                team: "ชื่อทีม (ถ้ามี)"
            };
        case "behavior":
            return { title: "รายละเอียดความประพฤติ" };
        default:
            return { title: "", name: "", date: "", role_prize: "", org: "", team: "" };
    }
};

// 4. Main Component

export default function EditStudentNominationForm() {
  const router = useRouter();
  
  // UI States
  const [loading, setLoading] = useState(true);
  const [hasNominated, setHasNominated] = useState(false); 
  
  // Form State
  const [formData, setFormData] = useState<NominationData | null>(null);
  
  // File States
  const [newFiles, setNewFiles] = useState<File[]>([]);
  const [deletedFileIds, setDeletedFileIds] = useState<number[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Computed: Total File Size
  const totalFileSize = useMemo(() => {
    const existingSize = formData?.existing_files.reduce((acc, f) => acc + (f.file_size || 0), 0) || 0; 
    const newSize = newFiles.reduce((acc, f) => acc + f.size, 0);
    return existingSize + newSize;
  }, [formData?.existing_files, newFiles]);

  const remainingSize = MAX_TOTAL_FILE_SIZE_BYTES - totalFileSize;

  // 5. Effects (Fetch Data)

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const token = localStorage.getItem("accessToken");
        const apiUrl = process.env.NEXT_PUBLIC_API_URL || "";

        // API Call
        /*
        const res = await fetch(`${apiUrl}/api/student-nomination/latest`, {
            headers: { "Authorization": `Bearer ${token}` }
        });
        if (!res.ok) throw new Error("Failed to fetch nomination data");
        const data = await res.json();
        setFormData(data.data);
        */

        // Mockup Data (Simulate API Response)
        await new Promise(r => setTimeout(r, 800));

        const mockData: NominationData = {
            form_id: 101,
            award_type: "activity", 
            
            student_firstname: "สมชาย",
            student_lastname: "ใจดี",
            student_number: "66104524665",
            email: "somchai@ku.th",
            student_year: "3",
            faculty_name: "คณะวิทยาศาสตร์",
            department_name: "วิทยาการคอมพิวเตอร์",
            advisor_name: "ดร. สมหญิง รักเรียน", 
            gpa: "3.75", 
            phone_number: "0812345678",

            date_of_birth: "2003-05-20",
            address: "123 ถ.งามวงศ์วาน กทม.",

            activity_criteria: "competition",
            project_title: "Hackathon KU 2024",
            date_received: "2024-12-10",
            prize: "รางวัลชนะเลิศ",
            organized_by: "คณะวิศวกรรมศาสตร์",
            team_name: "DevDev",

            existing_files: [
                { file_id: 1, file_name: "Certificate_Hackathon_2024.pdf", file_path: "#", file_size: 1024 * 500 }, // 500KB
                { file_id: 2, file_name: "Project_Photo_Evidence.pdf", file_path: "#", file_size: 1024 * 2000 }      // 2MB
            ]
        };
        setFormData(mockData);

      } catch (error) {
        console.error("Fetch Error:", error);
        Swal.fire({ icon: 'error', title: 'ไม่พบข้อมูล', text: 'ไม่สามารถดึงข้อมูลการเสนอได้' });
        router.push("/student");
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [router]);

  // 6. Handlers

  const handleInputChange = (key: keyof NominationData, value: any) => {
    if (formData) {
        setFormData({ ...formData, [key]: value });
    }
  };

  const handleNewFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const files = Array.from(e.target.files);
      
      // Validate File Type
      if (files.some(file => file.type !== "application/pdf")) {
          Swal.fire({ icon: 'warning', title: 'ไฟล์ไม่ถูกต้อง', text: 'กรุณาอัปโหลดเฉพาะไฟล์ PDF' });
          if (fileInputRef.current) fileInputRef.current.value = "";
          return;
      }

      // Validate File Size
      const newFilesSize = files.reduce((acc, f) => acc + f.size, 0);
      if (totalFileSize + newFilesSize > MAX_TOTAL_FILE_SIZE_BYTES) {
          Swal.fire({ 
              icon: 'error', 
              title: 'ขนาดไฟล์เกินกำหนด', 
              text: `พื้นที่คงเหลือไม่เพียงพอ (เหลือ ${formatFileSize(remainingSize)})` 
          });
          if (fileInputRef.current) fileInputRef.current.value = "";
          return;
      }

      setNewFiles(prev => [...prev, ...files]);
    }
    if (fileInputRef.current) fileInputRef.current.value = ""; 
  };

  const removeNewFile = (index: number) => {
    setNewFiles(prev => prev.filter((_, i) => i !== index));
  };

  const removeOldFile = (fileId: number) => {
    Swal.fire({
        title: 'ลบไฟล์เดิม?',
        text: "ไฟล์นี้จะถูกลบเมื่อคุณกดบันทึก",
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#d33',
        confirmButtonText: 'ลบ',
        cancelButtonText: 'ยกเลิก'
    }).then((result) => {
        if (result.isConfirmed && formData) {
            setDeletedFileIds(prev => [...prev, fileId]);
            setFormData({
                ...formData,
                existing_files: formData.existing_files.filter(f => f.file_id !== fileId)
            });
        }
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData) return;

    // Validation
    if (!formData.phone_number || !formData.gpa) {
          Swal.fire({ icon: 'warning', title: 'ข้อมูลไม่ครบ', text: 'กรุณากรอกข้อมูลส่วนตัวให้ครบถ้วน' });
          return;
    }

    const result = await Swal.fire({
        title: 'ยืนยันการแก้ไข?',
        text: "ข้อมูลเดิมจะถูกแทนที่ด้วยข้อมูลใหม่",
        icon: 'question',
        showCancelButton: true,
        confirmButtonText: 'บันทึกการแก้ไข',
        cancelButtonText: 'ยกเลิก',
        confirmButtonColor: '#10B981',
    });

    if (!result.isConfirmed) return;

    try {
        const token = localStorage.getItem("accessToken");
        const apiUrl = process.env.NEXT_PUBLIC_API_URL || "";

        // Prepare FormData
        const submitData = new FormData();
        
        // Append fields (exclude files first)
        Object.entries(formData).forEach(([key, value]) => {
             if (key !== 'existing_files' && value !== null && value !== undefined) {
                 submitData.append(key, String(value));
             }
        });

        // Append New Files
        newFiles.forEach((file) => {
             submitData.append("files", file);
        });

        // Append Deleted Files List
        submitData.append("deleted_file_ids", JSON.stringify(deletedFileIds));

        // API Call (PUT)
        /*
        const res = await fetch(`${apiUrl}/api/student-nomination/${formData.form_id}`, {
             method: "PUT",
             headers: { "Authorization": `Bearer ${token}` },
             body: submitData
        });
        
        if (!res.ok) throw new Error("Update Failed");
        */
        
        // Mockup Success Delay
        await new Promise(r => setTimeout(r, 1000));
        
        await Swal.fire({
            icon: 'success',
            title: 'บันทึกสำเร็จ',
            text: 'ข้อมูลได้รับการปรับปรุงแล้ว',
            timer: 2000,
            showConfirmButton: false
        });
        
        setHasNominated(true);

    } catch (error) {
        console.error("Submit Error:", error);
        Swal.fire({ icon: 'error', title: 'เกิดข้อผิดพลาด', text: 'ไม่สามารถบันทึกข้อมูลได้' });
    }
  };

  // 7. Render

  if (loading || !formData) return (
    <div className="w-full font-sans bg-[#F8F9FA] min-h-screen p-8 flex justify-center">
      <div className="bg-white rounded-[24px] shadow-sm p-14 min-h-[600px] w-full max-w-5xl border border-gray-100">
        <div className="mb-12 border-b border-gray-100 pb-6">
           <Skeleton className="h-10 w-1/3 mb-4" /> {/* หัวข้อ */}
           <Skeleton className="h-5 w-1/2" />      {/* คำอธิบาย */}
        </div>
        <div className="space-y-12">
           <div className="grid grid-cols-3 gap-6">
              <Skeleton className="h-40 rounded-2xl" />
              <Skeleton className="h-40 rounded-2xl" />
              <Skeleton className="h-40 rounded-2xl" />
           </div>
           <div className="bg-gray-50/50 p-8 rounded-2xl border border-gray-100">
               <Skeleton className="h-8 w-40 mb-6" />
               <div className="grid grid-cols-2 gap-8">
                   <Skeleton className="h-12 w-full" />
                   <Skeleton className="h-12 w-full" />
                   <Skeleton className="h-12 w-full" />
                   <Skeleton className="h-12 w-full" />
               </div>
           </div>
        </div>
      </div>
    </div> );

  if (hasNominated) {
      return (
        <div className="w-full h-screen flex items-center justify-center bg-gray-50 p-4">
            <div className="bg-white rounded-[24px] shadow-lg p-12 text-center max-w-lg w-full border border-gray-100 animate-scale-up">
                <div className="w-24 h-24 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6 shadow-inner">
                    <svg className="w-12 h-12 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path></svg>
                </div>
                <h2 className="text-3xl font-bold text-gray-800 mb-2">บันทึกข้อมูลสำเร็จ</h2>
                <p className="text-gray-500 mb-8">ข้อมูลการเสนอชื่อของคุณได้รับการอัปเดตเรียบร้อยแล้ว</p>
                <div className="flex justify-center">
                    <Link href="/student/trace-nomination" className="px-8 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 font-bold shadow-lg shadow-blue-200 transition-all transform active:scale-95">ติดตามสถานะ</Link>
                </div>
            </div>
        </div>
      );
  }

  const labels = getLabels(formData.award_type);
  const awardTypeLabel = formData.award_type === 'behavior' ? 'ด้านความประพฤติดีเด่น' : formData.award_type === 'innovation' ? 'ด้านนวัตกรรม/สร้างสรรค์' : 'ด้านกิจกรรมเสริมหลักสูตร';
  
  const awardIcon = formData.award_type === 'behavior' ? (
      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6"><path strokeLinecap="round" strokeLinejoin="round" d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z" /></svg>
  ) : formData.award_type === 'innovation' ? (
      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6"><path strokeLinecap="round" strokeLinejoin="round" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" /></svg>
  ) : (
      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6"><path strokeLinecap="round" strokeLinejoin="round" d="M3 3v1.5M3 21v-6m0 0l2.77-.693a9 9 0 016.208.682l.108.054a9 9 0 006.086.71l3.114-.732a48.524 48.524 0 01-.005-10.499l-3.11.732a9 9 0 01-6.085-.711l-.108-.054a9 9 0 00-6.208-.682L3 4.5M3 15V4.5" /></svg>
  );

  return (
    <div className="w-full font-sans bg-[#F8F9FA] min-h-screen p-8 flex justify-center animate-fade-in-up">
      <div className="bg-white rounded-[24px] shadow-sm p-10 md:p-14 min-h-[600px] w-full max-w-5xl border border-gray-100">
        
        {/* Header Section */}
        <div className="mb-12 border-b border-gray-100 pb-6 flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
            <div>
                <h2 className="text-3xl font-extrabold text-gray-900 tracking-tight">แก้ไขข้อมูลการเสนอ</h2>
                <p className="text-gray-500 mt-2 text-base">แก้ไขรายละเอียดและเอกสารประกอบสำหรับการเสนอชื่อ</p>
            </div>
            <div className="text-left md:text-right">
                <span className="text-xs text-gray-400 block mb-1 font-medium uppercase tracking-wide">ประเภทรางวัล</span>
                <span className={`text-lg font-bold flex items-center justify-start md:justify-end gap-2 px-4 py-2 rounded-lg border shadow-sm
                    ${formData.award_type === 'behavior' ? 'text-orange-600 bg-orange-50 border-orange-200' 
                    : formData.award_type === 'innovation' ? 'text-purple-600 bg-purple-50 border-purple-200' 
                    : 'text-blue-600 bg-blue-50 border-blue-200'}`}>
                    {awardIcon} {awardTypeLabel}
                </span>
            </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-12">
            
            {/* 1. ข้อมูลส่วนตัว (Mixed Read-only / Editable) */}
            <div className="bg-gray-50/50 p-8 rounded-2xl border border-gray-100 shadow-sm transition-all hover:shadow-md">
                <h3 className="text-xl font-bold text-gray-800 mb-6 flex items-center gap-3 border-b border-gray-200 pb-4">
                    <span className="w-10 h-10 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center shadow-sm">
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
                    </span>
                    ข้อมูลส่วนตัว
                </h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
                    {/* Read-only Group */}
                    <div className="md:col-span-2 flex flex-wrap gap-4 text-sm text-gray-700 bg-white p-5 rounded-xl border border-gray-200 shadow-inner">
                        <div className="flex items-center gap-2">
                            <span className="text-gray-400 font-bold uppercase text-xs">ชื่อ:</span>
                            <span className="font-semibold">{formData.student_firstname} {formData.student_lastname}</span>
                        </div>
                        <div className="w-px h-5 bg-gray-300 hidden md:block"></div>
                        <div className="flex items-center gap-2">
                            <span className="text-gray-400 font-bold uppercase text-xs">รหัสนิสิต:</span>
                            <span className="font-mono font-semibold">{formData.student_number}</span>
                        </div>
                        <div className="w-px h-5 bg-gray-300 hidden md:block"></div>
                        <div className="flex items-center gap-2">
                            <span className="text-gray-400 font-bold uppercase text-xs">คณะ:</span>
                            <span className="font-semibold">{formData.faculty_name}</span>
                        </div>
                    </div>

                    {/* Editable Fields */}
                    <div className="space-y-2 group">
                        <label className="text-sm font-bold text-gray-700 group-hover:text-blue-600 transition-colors">ชั้นปี <span className="text-red-500">*</span></label>
                        <input type="text" value={formData.student_year} onChange={e => handleInputChange("student_year", e.target.value)} className="w-full bg-white border border-gray-300 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-blue-100 focus:border-blue-400 outline-none transition-all shadow-sm" />
                    </div>
                    <div className="space-y-2 group">
                        <label className="text-sm font-bold text-gray-700 group-hover:text-blue-600 transition-colors">เกรดเฉลี่ยสะสม <span className="text-red-500">*</span></label>
                        <input type="text" value={formData.gpa} onChange={e => handleInputChange("gpa", e.target.value)} className="w-full bg-white border border-gray-300 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-blue-100 focus:border-blue-400 outline-none transition-all shadow-sm font-mono" />
                    </div>
                    <div className="space-y-2 group">
                        <label className="text-sm font-bold text-gray-700 group-hover:text-blue-600 transition-colors">เบอร์โทรศัพท์ <span className="text-red-500">*</span></label>
                        <input type="tel" value={formData.phone_number} onChange={e => handleInputChange("phone_number", e.target.value)} className="w-full bg-white border border-gray-300 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-blue-100 focus:border-blue-400 outline-none transition-all shadow-sm font-mono" />
                    </div>
                    <div className="space-y-2 group">
                        <label className="text-sm font-bold text-gray-700 group-hover:text-blue-600 transition-colors">วันเกิด <span className="text-red-500">*</span></label>
                        <input type="date" value={formData.date_of_birth} onChange={e => handleInputChange("date_of_birth", e.target.value)} className="w-full bg-white border border-gray-300 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-blue-100 focus:border-blue-400 outline-none transition-all shadow-sm cursor-pointer" />
                    </div>
                    <div className="space-y-2 md:col-span-2 group">
                        <label className="text-sm font-bold text-gray-700 group-hover:text-blue-600 transition-colors">ที่อยู่ปัจจุบัน <span className="text-red-500">*</span></label>
                        <textarea rows={2} value={formData.address} onChange={e => handleInputChange("address", e.target.value)} className="w-full bg-white border border-gray-300 rounded-xl px-4 py-3 text-sm resize-none focus:ring-2 focus:ring-blue-100 focus:border-blue-400 outline-none transition-all shadow-sm" />
                    </div>
                </div>
            </div>

            {/* 2. รายละเอียดผลงาน (Dynamic) */}
            <div className="bg-white p-8 rounded-2xl border border-gray-200 shadow-sm transition-all hover:shadow-md">
                <h3 className="text-xl font-bold text-gray-800 mb-6 flex items-center gap-3 border-b border-gray-100 pb-4">
                    <span className={`w-10 h-10 rounded-full flex items-center justify-center text-white shadow-md ${formData.award_type === 'behavior' ? 'bg-orange-500' : formData.award_type === 'innovation' ? 'bg-purple-600' : 'bg-blue-600'}`}>
                        {awardIcon}
                    </span>
                    {labels.title}
                </h3>

                {/* Behavior */}
                {formData.award_type === "behavior" && (
                    <div className="space-y-4">
                        <textarea 
                            rows={8} 
                            value={formData.behavior_desc}
                            onChange={(e) => handleInputChange("behavior_desc", e.target.value)}
                            className="w-full border border-gray-300 rounded-2xl p-5 text-sm focus:ring-4 focus:ring-orange-100 focus:border-orange-400 outline-none transition-all leading-relaxed shadow-inner"
                            placeholder="ระบุรายละเอียดความประพฤติ..."
                        />
                    </div>
                )}

                {/* Activity / Innovation */}
                {formData.award_type !== "behavior" && (
                    <div className="space-y-8">
                        {formData.award_type === "activity" && (
                            <div className="p-5 bg-blue-50 rounded-xl border border-blue-100 flex items-center gap-4">
                                <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center text-blue-600 shrink-0">
                                     <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                                </div>
                                <div>
                                    <label className="text-sm font-bold text-blue-800 block">ประเภทกิจกรรมที่เลือก:</label>
                                    <div className="text-sm text-gray-700 font-medium mt-1">
                                        {formData.activity_criteria === "committee" && "ผู้นำกิจกรรม / อุปนายก / ประธานชมรม"}
                                        {formData.activity_criteria === "competition" && "ผู้เข้าร่วมแข่งขันทางวิชาการ"}
                                        {formData.activity_criteria === "reputation" && "ผู้ทำชื่อเสียงให้มหาวิทยาลัย"}
                                    </div>
                                </div>
                            </div>
                        )}

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
                            <div className="space-y-2 group">
                                <label className="text-sm font-bold text-gray-700 group-hover:text-blue-600 transition-colors">{labels.name} <span className="text-red-500">*</span></label>
                                <input type="text" value={formData.project_title} onChange={e => handleInputChange("project_title", e.target.value)} className="w-full bg-white border border-gray-300 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-blue-100 focus:border-blue-400 outline-none transition-all shadow-sm" />
                            </div>
                            <div className="space-y-2 group">
                                <label className="text-sm font-bold text-gray-700 group-hover:text-blue-600 transition-colors">{labels.date} <span className="text-red-500">*</span></label>
                                <input type="date" value={formData.date_received} onChange={e => handleInputChange("date_received", e.target.value)} className="w-full bg-white border border-gray-300 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-blue-100 focus:border-blue-400 outline-none transition-all shadow-sm cursor-pointer" />
                            </div>
                            <div className="space-y-2 group">
                                <label className="text-sm font-bold text-gray-700 group-hover:text-blue-600 transition-colors">{labels.role_prize} <span className="text-red-500">*</span></label>
                                <input type="text" value={formData.prize} onChange={e => handleInputChange("prize", e.target.value)} className="w-full bg-white border border-gray-300 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-blue-100 focus:border-blue-400 outline-none transition-all shadow-sm" />
                            </div>
                            <div className="space-y-2 group">
                                <label className="text-sm font-bold text-gray-700 group-hover:text-blue-600 transition-colors">{labels.org}</label>
                                <input type="text" value={formData.organized_by} onChange={e => handleInputChange("organized_by", e.target.value)} className="w-full bg-white border border-gray-300 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-blue-100 focus:border-blue-400 outline-none transition-all shadow-sm" />
                            </div>
                            <div className="space-y-2 md:col-span-2 group">
                                <label className="text-sm font-bold text-gray-700 group-hover:text-blue-600 transition-colors">{labels.team}</label>
                                <input type="text" value={formData.team_name} onChange={e => handleInputChange("team_name", e.target.value)} className="w-full bg-white border border-gray-300 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-blue-100 focus:border-blue-400 outline-none transition-all shadow-sm" />
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* 3. จัดการเอกสาร */}
            <div className="pt-6 border-t border-gray-100">
                <div className="flex justify-between items-start mb-6">
                    <h3 className="text-xl font-bold text-gray-800 flex items-center gap-3">
                        <span className="w-10 h-10 rounded-full bg-gray-100 text-gray-600 flex items-center justify-center">
                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" /></svg>
                        </span>
                        เอกสารและไฟล์แนบ
                    </h3>
                </div>
                
                {/* Upload Button */}
                <div 
                    onClick={() => fileInputRef.current?.click()} 
                    className="group border-2 border-dashed border-gray-300 rounded-2xl p-10 flex flex-col items-center justify-center text-center cursor-pointer transition-all hover:border-blue-400 hover:bg-blue-50/50 hover:shadow-lg"
                >
                    <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4 group-hover:bg-blue-100 transition-colors shadow-sm">
                        <svg className="w-8 h-8 text-gray-400 group-hover:text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" /></svg>
                    </div>
                    <p className="text-lg font-bold text-gray-700 group-hover:text-blue-600 transition-colors">คลิกเพื่ออัปโหลดไฟล์</p>
                    <p className="text-sm text-gray-400 mt-1">อัปโหลดไฟล์ PDF (ขนาดรวมไม่เกิน 10MB)</p>
                    <div className="mt-4 w-full max-w-xs h-2 bg-gray-200 rounded-full overflow-hidden">
                        <div className={`h-full ${totalFileSize > MAX_TOTAL_FILE_SIZE_BYTES ? 'bg-red-500' : 'bg-green-500'} transition-all duration-500`} style={{ width: `${Math.min((totalFileSize / MAX_TOTAL_FILE_SIZE_BYTES) * 100, 100)}%` }}></div>
                    </div>
                    <p className={`text-xs mt-2 font-medium px-3 py-1 rounded-full ${totalFileSize > MAX_TOTAL_FILE_SIZE_BYTES ? 'bg-red-100 text-red-600' : 'bg-gray-100 text-gray-500'}`}>
                        {formatFileSize(totalFileSize)} / {MAX_TOTAL_FILE_SIZE_MB} MB
                    </p>
                </div>
                <input type="file" multiple ref={fileInputRef} onChange={handleNewFileChange} className="hidden" accept=".pdf" />

                {/* File List (Combined Old & New) */}
                <div className="mt-6 space-y-3">
                    
                    {/* Existing Files */}
                    {formData.existing_files.map((file) => (
                        <div key={file.file_id} className="flex items-center justify-between p-4 bg-white rounded-xl border border-gray-200 shadow-sm hover:border-blue-300 transition-all group">
                            <div className="flex items-center gap-4 overflow-hidden">
                                <div className="w-10 h-10 bg-red-50 rounded-lg flex items-center justify-center shrink-0 text-red-500 shadow-sm">
                                    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" /></svg>
                                </div>
                                <div className="min-w-0">
                                    <div className="flex items-center gap-2">
                                        <span className="text-[10px] font-bold bg-blue-100 text-blue-700 px-2 py-0.5 rounded shadow-sm">OLD</span>
                                        <span className="text-sm font-bold text-gray-700 truncate group-hover:text-blue-600 transition-colors">{file.file_name}</span>
                                    </div>
                                    <p className="text-xs text-gray-400 mt-1">{formatFileSize(file.file_size || 0)}</p>
                                </div>
                            </div>
                            <button type="button" onClick={() => removeOldFile(file.file_id)} className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors" title="ลบไฟล์">
                                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                            </button>
                        </div>
                    ))}

                    {/* New Files */}
                    {newFiles.map((file, index) => (
                        <div key={index} className="flex items-center justify-between p-4 bg-green-50/50 rounded-xl border border-green-200 shadow-sm hover:border-green-300 transition-all group">
                            <div className="flex items-center gap-4 overflow-hidden">
                                <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center shrink-0 text-green-600 shadow-sm">
                                    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                                </div>
                                <div className="min-w-0">
                                    <div className="flex items-center gap-2">
                                        <span className="text-[10px] font-bold bg-green-200 text-green-800 px-2 py-0.5 rounded shadow-sm">NEW</span>
                                        <span className="text-sm font-bold text-green-900 truncate">{file.name}</span>
                                    </div>
                                    <p className="text-xs text-green-600 mt-1">{formatFileSize(file.size)}</p>
                                </div>
                            </div>
                            <button type="button" onClick={() => removeNewFile(index)} className="p-2 text-green-600 hover:text-red-600 hover:bg-white rounded-lg transition-colors" title="ยกเลิกไฟล์นี้">
                                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
                            </button>
                        </div>
                    ))}

                </div>
            </div>

            {/* Buttons */}
            <div className="pt-8 flex justify-end gap-4 border-t border-gray-100">
                <Link href="/student/trace-nomination" className="px-8 py-3.5 rounded-xl font-bold text-gray-500 bg-white border border-gray-200 hover:bg-gray-50 hover:text-gray-700 transition-all shadow-sm">ยกเลิก</Link>
                <button type="submit" className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white px-10 py-3.5 rounded-xl font-bold shadow-lg shadow-blue-200 hover:shadow-xl transition-all active:scale-95 flex items-center gap-2">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4"/></svg>
                    บันทึกการแก้ไข
                </button>
            </div>

        </form>
      </div>
    </div>
  );
}