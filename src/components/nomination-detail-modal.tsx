"use client";

import { useEffect, useState } from "react";

// ==========================================
// 1. Interfaces
// ==========================================

interface FileResponse {
  file_dir_id: number;
  file_name: string;
  file_type: string;
  file_size: number;
  file_path: string;
}

interface Nomination {
  form_id: number;
  student_firstname: string;
  student_lastname: string;
  student_number: string;
  email: string;
  student_year: number;
  gpa: number;
  faculty_id: number;
  department_id: number;
  advisor_name: string;
  phone_number: string;
  date_of_birth: string;
  address: string;
  award_type_name: string;
  award_type_id: number;
  detail?: any; 
  files?: FileResponse[];
}

interface MasterFaculty {
  faculty_id: number;
  faculty_name: string;
}

interface MasterDepartment {
  department_id: number;
  department_name: string;
  faculty_id: number;
}

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  data: Nomination | null;
  faculties: MasterFaculty[];
  departments: MasterDepartment[];
}

// ==========================================
// 2. Helpers
// ==========================================

const formatDateDisplay = (isoDate: string) => {
    if (!isoDate) return "-";
    const date = new Date(isoDate);
    return date.toLocaleDateString('th-TH', { year: 'numeric', month: 'long', day: 'numeric' });
};

const calculateAge = (isoDate: string) => {
    if (!isoDate) return "-";
    const dob = new Date(isoDate);
    const diff = Date.now() - dob.getTime();
    const ageDate = new Date(diff);
    return Math.abs(ageDate.getUTCFullYear() - 1970);
};

// ==========================================
// 3. Sub-Components
// ==========================================

const ReadOnlyField = ({ label, value }: { label: string; value: any }) => (
    <div className="space-y-1.5 group">
        <label className="text-xs font-bold text-gray-400 uppercase tracking-wide group-hover:text-blue-500 transition-colors">{label}</label>
        <div className="w-full bg-white border border-gray-200 rounded-xl px-4 py-3 text-sm text-gray-800 shadow-sm group-hover:border-blue-200 transition-all hover:shadow-md">
            {value || "-"}
        </div>
    </div>
);

const RadioViewSmall = ({ label, desc, checked }: { label: string; desc?: string; checked: boolean }) => (
    <div className={`flex items-center p-3 rounded-lg border transition-all duration-300 ${checked ? 'bg-white border-blue-500 shadow-md transform -translate-y-0.5 scale-[1.02]' : 'bg-gray-50 border-transparent opacity-60'}`}>
         <div className={`w-4 h-4 rounded-full border flex items-center justify-center shrink-0 mr-3 ${checked ? 'border-blue-600' : 'border-gray-400'}`}>
            {checked && <div className="w-2 h-2 bg-blue-600 rounded-full animate-scale-up"></div>}
        </div>
        <div>
            <p className={`text-sm font-medium ${checked ? 'text-gray-900' : 'text-gray-500'}`}>{label}</p>
            {desc && <p className="text-xs text-gray-400 mt-0.5">{desc}</p>}
        </div>
    </div>
);

// ==========================================
// 4. Main Component
// ==========================================

export default function NominationDetailModal({ isOpen, onClose, data, faculties, departments }: ModalProps) {
  
  // --- States ---
  const [facultyName, setFacultyName] = useState("");
  const [deptName, setDepartmentName] = useState("");
  const [isVisible, setIsVisible] = useState(false); // For animation control

  // --- Effects ---
  useEffect(() => {
    if (isOpen && data) {
        console.log("Current Award Type ID:", data.award_type_id)
        setIsVisible(true);
        // Map ID to Name (Static/Prop Data)
        const fac = faculties.find(f => f.faculty_id === data.faculty_id);
        const dept = departments.find(d => d.department_id === data.department_id);
        setFacultyName(fac ? fac.faculty_name : `Faculty ${data.faculty_id}`);
        setDepartmentName(dept ? dept.department_name : `Dept ${data.department_id}`);
    } else {
        setIsVisible(false);
    }
  }, [isOpen, data, faculties, departments]);

  if (!isOpen || !data) return null;

  const isBehavior = data.award_type_id === 1;
  const isInnovation = data.award_type_id === 2;
  const isActivity = data.award_type_id === 3;

  return (
    <div className="fixed inset-0 z-[999] flex items-center justify-center p-4 sm:p-6 overflow-hidden">
      
      {/* Backdrop with Blur */}
      <div 
        className={`absolute inset-0 bg-black/40 backdrop-blur-sm transition-opacity duration-300 ${isVisible ? 'opacity-100' : 'opacity-0'}`}
        onClick={onClose}
      ></div>

      {/* Modal Content */}
      <div className={`relative bg-[#F8F9FA] rounded-[24px] shadow-2xl w-full max-w-4xl max-h-[85vh] overflow-hidden flex flex-col transition-all duration-300 transform ${isVisible ? 'scale-100 opacity-100 translate-y-0' : 'scale-95 opacity-0 translate-y-4'}`}>
        
        {/* Style for Animations */}
        <style jsx>{`
            .animate-fade-in-up { animation: fadeInUp 0.4s ease-out forwards; }
            @keyframes fadeInUp { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
            @keyframes scaleUp { from { transform: scale(0); } to { transform: scale(1); } }
            .animate-scale-up { animation: scaleUp 0.2s ease-out forwards; }
            /* Custom Scrollbar for Modal */
            .custom-scrollbar::-webkit-scrollbar { width: 6px; }
            .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
            .custom-scrollbar::-webkit-scrollbar-thumb { background-color: rgba(156, 163, 175, 0.5); border-radius: 20px; }
            .custom-scrollbar::-webkit-scrollbar-thumb:hover { background-color: rgba(107, 114, 128, 0.8); }
        `}</style>

        {/* Header (Glassmorphism) */}
        <div className="bg-white/80 backdrop-blur-md z-10 px-8 py-5 border-b border-gray-200 flex justify-between items-center sticky top-0 shadow-sm">
            <h3 className="text-xl font-bold text-gray-800 flex items-center gap-3">
                <span className={`w-3 h-8 rounded-full ${isBehavior ? "bg-blue-500" : isInnovation ? "bg-purple-500" : "bg-orange-500"}`}></span>
                รายละเอียดข้อมูลการเสนอ
            </h3>
            <button 
                onClick={onClose} 
                className="p-2 bg-gray-100 hover:bg-red-50 text-gray-500 hover:text-red-500 rounded-full transition-all active:scale-90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-200"
            >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"/></svg>
            </button>
        </div>

        {/* Scrollable Body */}
        <div className="overflow-y-auto p-8 space-y-10 custom-scrollbar">
            
            {/* 1. ข้อมูลส่วนตัว */}
            <section className="animate-fade-in-up" style={{ animationDelay: '0ms' }}>
                <div className="flex items-center gap-3 mb-6">
                    <div className="w-10 h-10 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center shadow-sm">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
                    </div>
                    <h4 className="text-lg font-bold text-gray-800">ข้อมูลส่วนตัว</h4>
                </div>

                <div className="bg-white rounded-2xl p-8 border border-gray-200 shadow-sm relative overflow-hidden transition-shadow hover:shadow-md">
                    {/* Top Accent Line */}
                    <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-400 to-indigo-400"></div>

                     {/* Profile Badge */}
                     <div className="flex flex-wrap gap-6 text-sm text-gray-600 bg-gray-50 p-5 rounded-xl border border-gray-100 mb-8 items-center">
                        <div className="flex items-center gap-2">
                            <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center text-lg font-bold text-blue-600 border border-blue-100 shadow-sm">
                                {data.student_firstname.charAt(0)}
                            </div>
                            <div>
                                <p className="text-xs text-gray-400 font-bold uppercase">ชื่อ-นามสกุล</p>
                                <p className="font-bold text-gray-800 text-base">{data.student_firstname} {data.student_lastname}</p>
                            </div>
                        </div>
                        <div className="w-px h-8 bg-gray-200 hidden sm:block"></div>
                        <div>
                             <p className="text-xs text-gray-400 font-bold uppercase">รหัสนิสิต</p>
                             <p className="font-mono font-semibold text-gray-800">{data.student_number}</p>
                        </div>
                        <div className="w-px h-8 bg-gray-200 hidden sm:block"></div>
                        <div>
                             <p className="text-xs text-gray-400 font-bold uppercase">อีเมล</p>
                             <p className="font-semibold text-gray-800">{data.email}</p>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <ReadOnlyField label="ชั้นปี" value={data.student_year ? `ปี ${data.student_year}` : "-"} />
                        <ReadOnlyField label="เกรดเฉลี่ยสะสม" value={data.gpa?.toFixed(2)} />
                        <ReadOnlyField label="คณะ" value={facultyName} />
                        <ReadOnlyField label="สาขาวิชา" value={deptName} />
                        <ReadOnlyField label="อาจารย์ที่ปรึกษา" value={data.advisor_name} />
                        <ReadOnlyField label="เบอร์โทรศัพท์" value={data.phone_number} />
                        <ReadOnlyField label="วันเกิด" value={formatDateDisplay(data.date_of_birth)} />
                        <ReadOnlyField label="อายุ (ปี)" value={calculateAge(data.date_of_birth)} />
                        <div className="md:col-span-2">
                             <ReadOnlyField label="ที่อยู่ปัจจุบัน" value={data.address} />
                        </div>
                    </div>
                </div>
            </section>

            {/* 2. รายละเอียดผลงาน (ซ่อนถ้าเป็น Behavior */}
            {isBehavior && (
                <section className="animate-fade-in-up" style={{ animationDelay: '100ms' }}>
                    <div className="flex items-center gap-3 mb-6">
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white shadow-sm
                            ${isInnovation ? "bg-purple-600" : "bg-orange-500"}`}>
                            {isInnovation && <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>}
                            {isActivity && <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 21v-8a2 2 0 012-2h14a2 2 0 012 2v8M3 13V6a2 2 0 012-2h14a2 2 0 012 2v7" /></svg>}
                        </div>
                        <div>
                            <h4 className="text-lg font-bold text-gray-800">รายละเอียดผลงาน</h4>
                            <p className="text-xs text-gray-500 font-medium">{data.award_type_name}</p>
                        </div>
                    </div>

                    <div className="bg-white rounded-2xl p-8 border border-gray-200 shadow-sm relative overflow-hidden transition-shadow hover:shadow-md">
                         <div className={`absolute top-0 left-0 w-full h-1 bg-gradient-to-r ${isInnovation ? 'from-purple-400 to-pink-400' : 'from-orange-400 to-red-400'}`}></div>

                        {/* Special Note for Innovation */}
                        {isInnovation && (
                            <div className="p-4 bg-purple-50 rounded-xl border border-purple-100 flex items-start gap-3 mb-8">
                                <div className="mt-0.5 w-5 h-5 rounded-full bg-purple-200 flex items-center justify-center text-purple-600 shrink-0">
                                    <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"/></svg>
                                </div>
                                <span className="text-sm text-purple-900 font-medium">ต้องได้รับรางวัลจากการประกวดหรือการแข่งขันระดับอุดมศึกษา ระดับชาติหรือระดับนานาชาติที่มีหน่วยงานภาครัฐหรือเอกชนเป็นผู้จัด</span>
                            </div>
                        )}

                        {/* Activity Selection Display */}
                        {isActivity && (
                            <div className="p-5 bg-gray-50 border border-gray-200 rounded-xl space-y-4 mb-8">
                                <h5 className="text-sm font-bold text-gray-800">ประเภทกิจกรรมที่เลือก</h5>
                                <div className="space-y-2">
                                    <RadioViewSmall label="เป็นนิสิตที่ดำเนินกิจกรรมและต้องแสดงให้เห็นว่าเมื่อดำเนินกิจกรรมแล้ว ชาวบ้าน ชุมชนในท้องถิ่น หรือผู้เข้าร่วมกิจกรรมได้รับประโยชน์อย่างไรจากการดำเนินกิจกรรมก่อให้เกิดประโยชน์ต่อส่วนรวมและเป็นการสร้างชื่อเสียง เกียรติคุณต่อคณะหรือมหาวิทยาลัยหรือไม่" checked={data.detail?.qualification_type === "committee"} />
                                    <RadioViewSmall label="เข้าร่วมแข่งขันทางวิชาการหรือศิลปวัฒนธรรมระดับอุดมศึกษา ระดับชาติหรือระดับนานาชาติและได้รับรางวัลใดรางวัลหนึ่งจากการแข่งขัน" checked={data.detail?.qualification_type === "competition"} />
                                    <RadioViewSmall label="ดำรงตำแหน่งนายกองค์การบริหาร องค์การนิสิต ประธานสภาผู้แทนนิสิต หรือนายกสโมสรนิสิต (กองกิจการนิสิตเสนอชื่อโดยตำแหน่ง)" checked={data.detail?.qualification_type === "reputation"} />
                                </div>
                            </div>
                        )}

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <ReadOnlyField label={isInnovation ? "ชื่อผลงานนวัตกรรม/สิ่งประดิษฐ์" : "ชื่อโครงการ/กิจกรรม"} value={data.detail?.project_title} />
                            <ReadOnlyField label={isInnovation ? "วันที่ได้รับรางวัล" : "วันที่เข้าร่วมกิจกรรม"} value={formatDateDisplay(data.detail?.date_received)} />
                            <ReadOnlyField label={isInnovation ? "รางวัลที่ได้รับ" : "บทบาท/หน้าที่ (หรือรางวัล)"} value={data.detail?.prize} />
                            <ReadOnlyField label={isInnovation ? "เวทีการประกวด/หน่วยงาน" : "หน่วยงานที่จัดกิจกรรม"} value={data.detail?.organized_by} />
                            <div className="md:col-span-2">
                                <ReadOnlyField label="ชื่อทีม" value={data.detail?.team_name || "-"} />
                            </div>

                            {/* Staff Section (เฉพาะ Innovation/Activity) */}
                            <div className="md:col-span-2 pt-6 mt-4 border-t border-gray-100">
                                <div className="flex items-center gap-2 mb-4">
                                    <div className="h-6 w-1 bg-blue-500 rounded-full"></div>
                                    <h5 className="text-sm font-bold text-gray-800 uppercase tracking-wide">ส่วนเจ้าหน้าที่พิจารณา</h5>
                                </div>
                                <div className="bg-blue-50/30 p-6 rounded-xl border border-blue-100">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                        <div className="space-y-3">
                                            <p className="text-sm font-bold text-gray-700">ระดับการประกวด/แข่งขัน</p>
                                            <div className="space-y-2">
                                                <RadioViewSmall label="ระดับอุดมศึกษา" checked={data.detail?.competition_level === "ระดับอุดมศึกษา"} />
                                                <RadioViewSmall label="ระดับชาติ" checked={data.detail?.competition_level === "ระดับชาติ"} />
                                                <RadioViewSmall label="ระดับนานาชาติ" checked={data.detail?.competition_level === "ระดับนานาชาติ"} />
                                            </div>
                                        </div>
                                        <div className="space-y-3">
                                            <p className="text-sm font-bold text-gray-700">ประเภทกิจกรรม</p>
                                            <div className="space-y-2">
                                                <RadioViewSmall label="ส่งเสริมคุณลักษณะบัณฑิตฯ" checked={data.detail?.activity_category === "ส่งเสริมคุณลักษณะบัณฑิตฯ"} />
                                                <RadioViewSmall label="กีฬาหรือส่งเสริมสุขภาพ" checked={data.detail?.activity_category === "กีฬาหรือส่งเสริมสุขภาพ"} />
                                                <RadioViewSmall label="บำเพ็ญประโยชน์" checked={data.detail?.activity_category === "บำเพ็ญประโยชน์หรือรักษาสิ่งแวดล้อม"} />
                                                <RadioViewSmall label="คุณธรรมและจริยธรรม" checked={data.detail?.activity_category === "เสริมสร้างคุณธรรมและจริยธรรม"} />
                                                <RadioViewSmall label="ศิลปะและวัฒนธรรม" checked={data.detail?.activity_category === "ส่งเสริมศิลปและวัฒนธรรม"} />
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </section>
            )}

            {/* 3. เอกสารประกอบ */}
            <section className="animate-fade-in-up" style={{ animationDelay: '200ms' }}>
                <div className="flex items-center gap-3 mb-6">
                    {/* ... Header ... */}
                    <h4 className="text-lg font-bold text-gray-800">เอกสารประกอบ</h4>
                </div>

                {data.files && data.files.length > 0 ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {data.files.map((file, idx) => {
                            // [แก้ไข] ตัด /api ออก ถ้ามี และใส่ / ข้างหน้าเพื่อให้เป็น Absolute Path จาก Root
                            // สมมติ file.file_path มาเป็น "api/uploads/..." หรือ "uploads/..."
                            let safePath = file.file_path;
                            if (safePath.startsWith("api/")) safePath = safePath.replace("api/", "");
                            if (safePath.startsWith("/api/")) safePath = safePath.replace("/api/", "");
                            if (!safePath.startsWith("/")) safePath = "/" + safePath;

                            return (
                                <a 
                                    key={idx} 
                                    href={safePath} // ใช้ path ที่แก้แล้ว
                                    target="_blank" 
                                    rel="noreferrer"
                                    className="group flex items-center justify-between p-4 bg-white border border-gray-200 rounded-xl hover:border-red-200 hover:shadow-md transition-all duration-300"
                                >
                                    <div className="flex items-center gap-4 overflow-hidden">
                                         <div className="w-12 h-12 bg-red-50 rounded-lg flex items-center justify-center text-red-500 font-bold text-xs">PDF</div>
                                         <div className="min-w-0">
                                             <p className="text-sm font-bold text-gray-700 truncate">{file.file_name}</p>
                                             <p className="text-xs text-gray-400">{(file.file_size / 1024).toFixed(2)} KB</p>
                                         </div>
                                    </div>
                                </a>
                            );
                        })}
                    </div>
                ) : (
                    <div className="p-10 text-center bg-gray-50 border border-dashed border-gray-300 rounded-2xl text-gray-400">ไม่พบเอกสารแนบ</div>
                )}
            </section>

        </div>
      </div>
    </div>
  );
}