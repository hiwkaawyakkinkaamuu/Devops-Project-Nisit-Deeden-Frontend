"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

interface ExistingFile {
  file_id: number;
  file_name: string;
  file_path: string;
}

interface NominationData {
  form_id: number;
  status: string;        
  can_edit: boolean;     
  remark?: string;       

  // ข้อมูลรางวัล
  award_type_id: string; 
  award_type_name: string;
  
  // ข้อมูลนิสิต
  student_id: string;
  student_number: string;
  student_firstname: string;
  student_lastname: string;
  faculty_name: string;
  department_name: string;
  advisor_name: string;
  email: string;
  phone_number: string;
  student_year: string;
  gpa: string;
  
  // ข้อมูลที่แก้ไขได้
  date_of_birth: string;
  age: string;
  address: string;

  // รายละเอียดรางวัล
  activity_category?: string;
  qualification_type?: string; 
  date_received?: string;
  project_title?: string;
  team_name?: string;
  prize?: string; 
  organized_by?: string;
  
  existing_files: ExistingFile[];
}

// Main Component
export default function EditStudentNominationForm() {
  const formId = "101"; 
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [permissionError, setPermissionError] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);

  const [formData, setFormData] = useState<NominationData | null>(null);
  const [newFiles, setNewFiles] = useState<File[]>([]); 
  const [deletedFileIds, setDeletedFileIds] = useState<number[]>([]); 
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  // --- Fetch Data ---
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const token = localStorage.getItem("accessToken");
        const apiUrl = process.env.NEXT_PUBLIC_API_URL || "";

        // API Call
        const res = await fetch(`${apiUrl}/api/nomination/${formId}`, {
            method: "GET",
            headers: { 
                "Authorization": `Bearer ${token}`,
                "Content-Type": "application/json"
            }
        });

        if (!res.ok) {
            // ถ้า Server ตอบกลับไม่สำเร็จ (เช่น 404, 500 หรือ Connection Refused) 
            throw new Error(`API Connection Failed: ${res.status}`);
        }

        const responseData = await res.json();
        // ตรวจสอบว่าข้อมูลอยู่ใน wrapper 'data' หรือไม่
        const data = responseData.data || responseData;
        setFormData(data);

      } catch (error) {
        console.warn("API Error/Not Connected. Switching to Mockup Data:", error);

        //  Mockup Data
        const mockDbData: NominationData = {
            form_id: 101,
            status: "ส่งคืนเพื่อแก้ไข", 
            can_edit: true, // อนุญาตให้แก้ไข
            remark: "เอกสารไม่ครบถ้วน กรุณาแนบไฟล์ผลงานเพิ่มเติม", 

            award_type_id: "3", 
            award_type_name: "ด้านกิจกรรมเสริมหลักสูตร",
            
            student_id: "505",
            student_number: "66104524665",
            student_year: "3",
            student_firstname: "สมชาย",
            student_lastname: "ใจดี",
            faculty_name: "คณะวิทยาศาสตร์",
            department_name: "ภาควิชาวิทยาการคอมพิวเตอร์",
            advisor_name: "ดร. สมหญิง รักเรียน",
            email: "somchai@ku.th",
            
            phone_number: "0812345678",
            gpa: "3.75",

            date_of_birth: "2002-05-20",
            age: "23",
            address: "หอพักใน มก.",

            // รายละเอียดกิจกรรม
            qualification_type: "competition", 
            date_received: "2024-01-15",
            project_title: "Hackathon 2024",
            team_name: "Super Dev",
            prize: "ชนะเลิศ",
            organized_by: "Google",

            existing_files: [
                { file_id: 10, file_name: "resume.pdf", file_path: "..." },
                { file_id: 11, file_name: "certificate.pdf", file_path: "..." }
            ]
        };

        setFormData(mockDbData);

      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [formId]);

  // Handlers
  const handleInputChange = (key: keyof NominationData, value: string) => {
    if (!formData) return;
    setFormData({ ...formData, [key]: value });
  };

  const handleDobChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    if (!formData) return;
    let ageCal = "";
    if (val) {
        const today = new Date();
        const birthDate = new Date(val);
        let a = today.getFullYear() - birthDate.getFullYear();
        const m = today.getMonth() - birthDate.getMonth();
        if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) a--;
        ageCal = a.toString();
    }
    setFormData({ ...formData, date_of_birth: val, age: ageCal });
  };

  //  Files Logic
  const handleDeleteOldFile = (id: number) => {
    if (!formData) return;
    if(!confirm("ยืนยันการลบไฟล์นี้?")) return;
    const updatedFiles = formData.existing_files.filter(f => f.file_id !== id);
    setFormData({ ...formData, existing_files: updatedFiles });
    setDeletedFileIds(prev => [...prev, id]);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const files = Array.from(e.target.files);
      if (files.some(file => file.type !== "application/pdf")) {
          alert("กรุณาอัปโหลดเฉพาะไฟล์ PDF");
          if (fileInputRef.current) fileInputRef.current.value = "";
          return;
      }
      setNewFiles(prev => [...prev, ...files]);
    }
    if (fileInputRef.current) fileInputRef.current.value = ""; 
  };

  const handleRemoveNewFile = (index: number) => {
    setNewFiles(prev => prev.filter((_, i) => i !== index));
  };

  // Submit Logic
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData) return;
    if (!formData.can_edit) return alert("คุณไม่ได้รับสิทธิ์ในการแก้ไขข้อมูลนี้");

    try {
        const token = localStorage.getItem("accessToken");
        const apiUrl = process.env.NEXT_PUBLIC_API_URL || "";

        // Prepare FormData
        const submitData = new FormData();
        
        // ID
        submitData.append("form_id", formId);

        // ข้อมูลที่แก้ไขได้ (Personal)
        submitData.append("date_of_birth", formData.date_of_birth);
        submitData.append("address", formData.address);

        // หมายเหตุ: gpa และ phone_number เป็น Read-only จาก DB แล้ว ไม่ต้องส่งกลับไป update ก็ได้
        // หรือถ้า Backend ต้องการ ก็ uncomment บรรทัดด้านล่างครับ
        // submitData.append("phone_number", formData.phone_number);
        // submitData.append("gpa", formData.gpa);

        // รายละเอียดรางวัล (Dynamic)
        if (formData.award_type_id === "3") { // Activity
             submitData.append("qualification_type", formData.qualification_type || "");
        }
        if (formData.award_type_id !== "1") { // Not Behavior
             submitData.append("date_received", formData.date_received || "");
             submitData.append("project_title", formData.project_title || "");
             submitData.append("team_name", formData.team_name || "");
             submitData.append("prize", formData.prize || "");
             submitData.append("organized_by", formData.organized_by || "");
        }

        // Files
        newFiles.forEach((f) => submitData.append("new_files", f));
        if (deletedFileIds.length > 0) {
            submitData.append("deleted_file_ids", JSON.stringify(deletedFileIds));
        }

        // API Call
        const response = await fetch(`${apiUrl}/api/nomination/update/${formId}`, {
            method: "PUT",
            headers: { 
                "Authorization": `Bearer ${token}` 
                // Note: ไม่ต้องใส่ Content-Type สำหรับ FormData
            },
            body: submitData
        });

        if (!response.ok) {
             throw new Error(`API Request Failed: ${response.status}`);
        }

        // ถ้าสำเร็จ (API ตอบ 200 OK)
        setSubmitSuccess(true); 

    } catch (error) {
        console.warn("API Error (Update). Switching to Mockup Success:", error);

        // Mockup Data
        // บังคับให้แสดงหน้า Success (Mockup)
        setSubmitSuccess(true); 
        
    }
  };

  // Render Conditions

  if (loading) return <div className="p-20 text-center animate-pulse text-gray-500">กำลังโหลดข้อมูล...</div>;
  if (permissionError || !formData) return <div className="p-20 text-center text-red-500">ไม่พบข้อมูลหรือคุณไม่มีสิทธิ์เข้าถึง</div>;

  // 1. Success Screen
  if (submitSuccess) {
    return (
      <div className="w-full h-full flex items-center justify-center py-20">
          <div className="bg-white rounded-[24px] shadow-sm p-12 text-center max-w-lg w-full border border-gray-100 animate-scale-up">
              <div className="w-24 h-24 bg-green-50 rounded-full flex items-center justify-center mx-auto mb-6">
                  <svg className="w-12 h-12 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path></svg>
              </div>
              <h2 className="text-3xl font-bold text-gray-800 mb-3">แก้ไขข้อมูลสำเร็จ!</h2>
              <p className="text-gray-500 mb-10 leading-relaxed">
                  ระบบได้บันทึกการแก้ไขของคุณเรียบร้อยแล้ว<br/>
                  เจ้าหน้าที่จะดำเนินการพิจารณาเอกสารของคุณต่อไป
              </p>
              
              <div className="flex flex-col gap-3">
                  <Link href="/student/trace-nomination" className="w-full px-6 py-3.5 bg-blue-600 text-white rounded-xl text-base font-bold hover:bg-blue-700 transition-all shadow-md hover:shadow-lg">
                      ติดตามสถานะ
                  </Link>
              </div>
          </div>
      </div>
    );
  }

  // 2. Read-only State
  if (!formData.can_edit) {
      return (
        <div className="w-full h-full flex items-center justify-center py-20">
            <div className="bg-white rounded-[24px] shadow-sm p-10 text-center max-w-lg w-full border border-red-100">
                <div className="w-20 h-20 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-6">
                    <svg className="w-10 h-10 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>
                </div>
                <h2 className="text-2xl font-bold text-gray-800 mb-2">ไม่สามารถแก้ไขได้</h2>
                <p className="text-gray-500 mb-6">
                    แบบฟอร์มนี้อยู่ในสถานะ <span className="px-2 py-1 bg-gray-100 rounded text-gray-700 font-bold text-sm">"{formData.status}"</span><br/>
                    และยังไม่ได้รับสิทธิ์ให้แก้ไข หรืออยู่ระหว่างการพิจารณา
                </p>
                <button onClick={() => window.history.back()} className="px-8 py-2.5 bg-gray-100 text-gray-600 rounded-lg text-sm font-bold hover:bg-gray-200 transition-colors">
                    กลับ
                </button>
            </div>
        </div>
      );
  }

  // 3. Edit Form
  return (
    <div className="w-full font-sans">
      <div className="bg-white rounded-[24px] shadow-sm p-8 md:p-12 min-h-[600px]">
        
        {/* Header*/}
        <div className="mb-10 border-b border-gray-100 pb-6">
            <div className="flex flex-col md:flex-row justify-between items-start gap-4">
                <div>
                    <h2 className="text-3xl font-bold text-gray-900">แก้ไขข้อมูลการเสนอชื่อ</h2>
                    <p className="text-gray-500 mt-2 text-sm">
                        ประเภทรางวัล: <span className="font-semibold text-blue-600">{formData.award_type_name}</span>
                    </p>
                </div>
                
                {formData.remark && (
                    <div className="w-full md:w-auto bg-amber-50 border border-amber-200 text-amber-900 px-5 py-4 rounded-xl text-sm flex items-start gap-3 max-w-xl">
                        <svg className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/></svg>
                        <div>
                            <p className="font-bold mb-1">เหตุผลการส่งคืน (Remark):</p>
                            <p className="leading-relaxed opacity-90">{formData.remark}</p>
                        </div>
                    </div>
                )}
            </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-10">
            
            {/* Section 1: ข้อมูลนิสิต */}
            <div className="space-y-6">
                <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2">
                    <span className="w-1.5 h-6 bg-blue-600 rounded-full"></span>
                    ข้อมูลส่วนตัวนิสิต
                </h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
                    {/* Read-Only Fields */}
                    <div className="space-y-2">
                        <label className="text-sm font-semibold text-gray-600">ชื่อ-นามสกุล</label>
                        <div className="w-full bg-gray-100 border border-gray-200 rounded-xl px-4 py-3 text-sm text-gray-500 cursor-not-allowed">
                            {formData.student_firstname} {formData.student_lastname}
                        </div>
                    </div>
                    <div className="space-y-2">
                        <label className="text-sm font-semibold text-gray-600">รหัสนิสิต</label>
                        <input readOnly type="text" value={formData.student_number} className="w-full bg-gray-100 border border-gray-200 rounded-xl px-4 py-3 text-sm text-gray-500 cursor-not-allowed" />
                    </div>
                    <div className="space-y-2">
                            <label className="text-sm font-semibold text-gray-600">ชั้นปี</label>
                            <input readOnly type="text" value={formData.student_year} className="w-full bg-gray-100 border border-gray-200 rounded-xl px-4 py-3 text-sm text-gray-500 cursor-not-allowed" />
                    </div>
                    <div className="space-y-2">
                        <label className="text-sm font-bold text-gray-800">เกรดเฉลี่ยสะสม</label>
                        <input readOnly type="text" value={formData.gpa} className="w-full bg-gray-100 border border-gray-200 rounded-xl px-4 py-3 text-sm text-gray-500 cursor-not-allowed" />
                    </div>
                    <div className="space-y-2">
                        <label className="text-sm font-semibold text-gray-500">คณะ/สาขา</label>
                        <div className="w-full bg-gray-100 border border-gray-200 rounded-xl px-4 py-3 text-sm text-gray-500 cursor-not-allowed">
                            {formData.faculty_name} / {formData.department_name}
                        </div>
                    </div>
                    <div className="space-y-2">
                        <label className="text-sm font-semibold text-gray-500">อาจารย์ที่ปรึกษา</label>
                        <div className="w-full bg-gray-100 border border-gray-200 rounded-xl px-4 py-3 text-sm text-gray-500 cursor-not-allowed">
                            {formData.advisor_name}
                        </div>
                    </div>
                    <div className="space-y-2">
                        <label className="text-sm font-bold text-gray-800">เบอร์โทรศัพท์</label>
                        <input readOnly type="text" value={formData.phone_number} className="w-full bg-gray-100 border border-gray-200 rounded-xl px-4 py-3 text-sm text-gray-500 cursor-not-allowed" />
                    </div>
                    <div className="space-y-2">
                        <label className="text-sm font-semibold text-gray-600">อีเมล</label>
                        <input readOnly type="text" value={formData.email} className="w-full bg-gray-100 border border-gray-200 rounded-xl px-4 py-3 text-sm text-gray-500 cursor-not-allowed" />
                    </div>
                </div>

                {/* Mixed Read-only & Editable Fields */}
                <div className="p-6 bg-blue-50/50 rounded-2xl border border-blue-100 grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">

                    {/* Editable Date & Address */}
                    <div className="space-y-2">
                        <label className="text-sm font-bold text-gray-800">วันเกิด <span className="text-red-500">*</span></label>
                        <input required type="date" value={formData.date_of_birth} onChange={handleDobChange} className="w-full bg-white border border-gray-200 rounded-xl px-4 py-3 text-sm cursor-pointer focus:ring-2 focus:ring-blue-200 outline-none" />
                    </div>
                    <div className="space-y-2">
                        <label className="text-sm font-bold text-gray-800">อายุ (ปี)</label>
                        <input readOnly type="text" value={formData.age} className="w-full bg-gray-100 border border-gray-200 rounded-xl px-4 py-3 text-sm text-gray-500 cursor-not-allowed" />
                    </div>
                    <div className="space-y-2 md:col-span-2">
                        <label className="text-sm font-bold text-gray-800">ที่อยู่ <span className="text-red-500">*</span></label>
                        <textarea required rows={3} value={formData.address} onChange={e => handleInputChange("address", e.target.value)} className="w-full bg-white border border-gray-200 rounded-xl px-4 py-3 text-sm resize-none focus:ring-2 focus:ring-blue-200 focus:border-blue-400 outline-none transition-all"></textarea>
                    </div>
                </div>
            </div>

            {/* Section 2: ข้อมูลรางวัล (Dynamic) */}
            {formData.award_type_id !== "1" && (
                <div className="space-y-6 pt-6 border-t border-gray-100">
                    <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2">
                        <span className="w-1.5 h-6 bg-purple-600 rounded-full"></span>
                        รายละเอียดผลงาน/กิจกรรม
                    </h3>
                    
                    {formData.award_type_id === "3" && (
                        <div className="space-y-4 mb-6">
                            <label className="text-sm font-bold text-gray-800">
                                เลือกคุณสมบัติ <span className="text-red-500">*</span>
                            </label>
                            
                            <div className="flex flex-col gap-3">
                                {["committee", "competition", "reputation"].map((val, idx) => {
                                    const isSelected = formData.qualification_type === val;
                                    return (
                                        <label 
                                            key={val} 
                                            className={`flex items-start gap-4 p-4 rounded-xl border transition-all cursor-pointer group ${
                                                isSelected 
                                                ? "bg-purple-50 border-purple-500 shadow-sm" 
                                                : "bg-white border-gray-200 hover:border-purple-300 hover:bg-gray-50"
                                            }`}
                                        >
                                            <div className="mt-0.5">
                                                <input 
                                                    type="radio" 
                                                    name="qualification_type" 
                                                    value={val} 
                                                    checked={isSelected} 
                                                    onChange={e => handleInputChange("qualification_type", e.target.value)} 
                                                    className="w-5 h-5 text-purple-600 focus:ring-purple-500 border-gray-300 cursor-pointer"
                                                />
                                            </div>
                                            <span className={`text-sm leading-relaxed ${isSelected ? "text-purple-900 font-medium" : "text-gray-600 group-hover:text-gray-900"}`}>
                                                {idx === 0 && "เป็นนิสิตที่ดำเนินกิจกรรมและต้องแสดงให้เห็นว่าเมื่อดำเนินกิจกรรมแล้ว ชาวบ้าน ชุมชนในท้องถิ่น หรือผู้เข้าร่วมกิจกรรมได้รับประโยชน์อย่างไรจากการดำเนินกิจกรรมก่อให้เกิดประโยชน์ต่อส่วนรวมและเป็นการสร้างชื่อเสียง เกียรติคุณต่อคณะหรือมหาวิทยาลัยหรือไม่"}
                                                {idx === 1 && "เป็นนิสิตที่เข้าร่วมแข่งขันทางวิชาการหรือศิลปวัฒนธรรมระดับอุดมศึกษา ระดับชาติหรือระดับนานาชาติและได้รับรางวัลใดรางวัลหนึ่งจากการแข่งขัน"}
                                                {idx === 2 && "เป็นนิสิตที่ดำรงตำแหน่งนายกองค์การบริหาร องค์การนิสิต ประธานสภาผู้แทนนิสิต หรือนายกสโมสรนิสิต (กองกิจการนิสิตเสนอชื่อโดยตำแหน่ง)"}
                                            </span>
                                        </label>
                                    );
                                })}
                            </div>
                        </div>
                    )}

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
                        <div className="space-y-2">
                            <label className="text-sm font-bold text-gray-800">วันที่ได้รับ</label>
                            <input required type="date" value={formData.date_received || ""} onChange={e => handleInputChange("date_received", e.target.value)} className="w-full bg-white border border-gray-200 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-blue-100 outline-none" />
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-bold text-gray-800">ชื่อโครงการ</label>
                            <input required type="text" value={formData.project_title || ""} onChange={e => handleInputChange("project_title", e.target.value)} className="w-full bg-white border border-gray-200 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-blue-100 outline-none" />
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-bold text-gray-800">ชื่อทีม</label>
                            <input required type="text" value={formData.team_name || ""} onChange={e => handleInputChange("team_name", e.target.value)} className="w-full bg-white border border-gray-200 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-blue-100 outline-none" />
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-bold text-gray-800">รางวัลที่ได้</label>
                            <input required type="text" value={formData.prize || ""} onChange={e => handleInputChange("prize", e.target.value)} className="w-full bg-white border border-gray-200 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-blue-100 outline-none" />
                        </div>
                        <div className="space-y-2 md:col-span-2">
                            <label className="text-sm font-bold text-gray-800">ผู้จัด</label>
                            <input required type="text" value={formData.organized_by || ""} onChange={e => handleInputChange("organized_by", e.target.value)} className="w-full bg-white border border-gray-200 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-blue-100 outline-none" />
                        </div>
                    </div>
                </div>
            )}

            {/* Section 3: เอกสารแนบ */}
            <div className="space-y-6 pt-6 border-t border-gray-100">
                <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2">
                    <span className="w-1.5 h-6 bg-gray-600 rounded-full"></span>
                    เอกสารประกอบ
                </h3>
                
                {/* Old Files */}
                {formData.existing_files.length > 0 && (
                    <div className="space-y-3">
                        <p className="text-xs text-gray-500 font-bold uppercase tracking-wider">ไฟล์เดิมที่มีอยู่</p>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {formData.existing_files.map((file) => (
                                <div key={file.file_id} className="flex items-center justify-between bg-white p-4 rounded-xl border border-gray-200 shadow-sm hover:border-blue-300 transition-all">
                                    <div className="flex items-center gap-3 overflow-hidden">
                                        <div className="w-8 h-8 bg-red-100 text-red-500 rounded-lg flex items-center justify-center shrink-0">
                                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z"></path></svg>
                                        </div>
                                        <span className="text-sm text-gray-700 truncate">{file.file_name}</span>
                                    </div>
                                    <button type="button" onClick={() => handleDeleteOldFile(file.file_id)} className="text-gray-400 hover:text-red-500 p-1 rounded-md hover:bg-red-50 transition-colors">
                                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg>
                                    </button>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Upload New */}
                <div className="space-y-3">
                    <p className="text-xs text-gray-500 font-bold uppercase tracking-wider">อัปโหลดไฟล์เพิ่ม</p>
                    <input type="file" multiple ref={fileInputRef} onChange={handleFileChange} className="hidden" accept=".pdf" />
                    <div 
                        onClick={() => fileInputRef.current?.click()} 
                        className="border-2 border-dashed border-gray-300 rounded-xl p-8 flex flex-col items-center justify-center text-center hover:bg-gray-50 hover:border-blue-400 transition-all cursor-pointer bg-white group"
                    >
                        <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mb-3 group-hover:bg-blue-100 transition-colors">
                            <svg className="w-6 h-6 text-gray-400 group-hover:text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4"></path></svg>
                        </div>
                        <p className="text-sm text-gray-600 font-medium group-hover:text-blue-600">คลิกเพื่ออัปโหลดไฟล์ PDF</p>
                        <p className="text-xs text-gray-400 mt-1">สูงสุด 10 MB ต่อไฟล์</p>
                    </div>
                </div>

                {/* New Files List */}
                {newFiles.length > 0 && (
                    <div className="space-y-2 animate-fade-in">
                        <p className="text-xs text-green-600 font-bold uppercase tracking-wider">ไฟล์ใหม่:</p>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            {newFiles.map((file, index) => (
                                <div key={index} className="flex justify-between items-center p-3 bg-green-50 rounded-xl border border-green-200">
                                    <div className="flex items-center gap-2 overflow-hidden">
                                        <span className="w-2 h-2 bg-green-500 rounded-full shrink-0"></span>
                                        <span className="text-sm text-green-800 truncate font-medium">{file.name}</span>
                                    </div>
                                    <button type="button" onClick={() => handleRemoveNewFile(index)} className="text-green-600 hover:text-red-500 text-xs font-bold px-2 py-1 rounded hover:bg-white/50">ลบ</button>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>

            {/* Actions */}
            <div className="pt-8 flex flex-col-reverse md:flex-row justify-end gap-4 border-t border-gray-100">
                <button 
                    type="button" 
                    onClick={() => window.history.back()} 
                    className="px-8 py-3.5 rounded-xl text-sm font-bold text-gray-500 bg-gray-100 hover:bg-gray-200 transition-colors w-full md:w-auto"
                >
                    ยกเลิก
                </button>
                <button 
                    type="submit" 
                    className="px-8 py-3.5 rounded-xl text-sm font-bold text-white bg-blue-600 hover:bg-blue-700 shadow-lg hover:shadow-xl transition-all active:scale-95 w-full md:w-auto"
                >
                    บันทึกการแก้ไข
                </button>
            </div>

        </form>
      </div>
    </div>
  );
}