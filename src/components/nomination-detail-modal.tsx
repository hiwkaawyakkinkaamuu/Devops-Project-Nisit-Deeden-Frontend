"use client";

import { useEffect, useState } from "react";
import axios from "axios";

// ==========================================
// 1. Interfaces
// ==========================================

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "/api";

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
  campus_id: number;
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
// 2. Helpers & Themes
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

const THEME_STYLES: Record<string, any> = {
    "1": { // Activity
        border: "border-orange-100", gradient: "from-orange-400 to-orange-600", 
        numberBg: "bg-orange-600", text: "text-orange-600", bgSoft: "bg-orange-50", radioColor: "text-orange-600 focus:ring-orange-500"
    },
    "2": { // Innovation
        border: "border-purple-100", gradient: "from-purple-400 to-purple-600", 
        numberBg: "bg-purple-600", text: "text-purple-600", bgSoft: "bg-purple-50", radioColor: "text-purple-600 focus:ring-purple-500"
    },
    "3": { // Behavior
        border: "border-blue-100", gradient: "from-blue-400 to-blue-600", 
        numberBg: "bg-blue-600", text: "text-blue-600", bgSoft: "bg-blue-50", radioColor: "text-blue-600 focus:ring-blue-500"
    },
    "4": { // Other
        border: "border-green-100", gradient: "from-green-400 to-green-600", 
        numberBg: "bg-green-600", text: "text-green-600", bgSoft: "bg-green-50", radioColor: "text-green-600 focus:ring-green-500"
    },
    "default": {
        border: "border-gray-100", gradient: "from-gray-400 to-gray-600", 
        numberBg: "bg-gray-600", text: "text-gray-600", bgSoft: "bg-gray-50", radioColor: "text-gray-600 focus:ring-gray-500"
    }
};

// ==========================================
// 3. Sub-Components
// ==========================================

const ReadOnlyField = ({ label, value, font }: any) => (
    <div className="p-4 bg-blue-50/50 border border-blue-100 rounded-xl h-full">
        <span className="text-[10px] uppercase font-bold text-gray-400 block mb-1">{label}</span>
        <span className={`font-bold text-blue-900 ${font || ""}`}>{value || "-"}</span>
    </div>
);

const InputReadOnly = ({ label, value, font, isTextarea = false }: any) => (
    <div className="space-y-2">
        {label && <label className="text-sm font-bold text-gray-700">{label}</label>}
        {isTextarea ? (
             <textarea readOnly rows={4} value={value || ""} className={`w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm text-gray-800 outline-none resize-none ${font || ""}`} />
        ) : (
            <div className={`w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm text-gray-800 outline-none ${font || ""}`}>
                {value || "-"}
            </div>
        )}
    </div>
);

// ==========================================
// 4. Main Component
// ==========================================

export default function NominationDetailModal({ isOpen, onClose, data }: ModalProps) {
  
  // --- States ---
  const [facultyName, setFacultyName] = useState("-");
  const [deptName, setDepartmentName] = useState("-");
  const [campusName, setCampusName] = useState("-");
  const [isVisible, setIsVisible] = useState(false);

  // --- Effects ---
  useEffect(() => {
    if (isOpen && data) {
        setIsVisible(true);
        const token = localStorage.getItem("token");

        if (data.award_type_id === 4) {
            setFacultyName(data.detail?.faculty || "-");
            setDepartmentName(data.detail?.department || data.detail?.major || "-");
            setCampusName(data.detail?.campus || "-");
        } else {
            // ดึงชื่อคณะ
            if (data.faculty_id) {
                axios.get(`${API_BASE_URL}/faculty`, { headers: { Authorization: `Bearer ${token}` } })
                    .then(res => {
                        const list = res.data?.data || res.data || [];
                        const found = list.find((item: any) => {
                            const id = item.facultyID || item.faculty_id || item.FacultyID || item.id;
                            return String(id) === String(data.faculty_id);
                        });
                        if (found) {
                            const name = found.facultyName || found.faculty_name || found.FacultyName || found.name;
                            setFacultyName(name || "-");
                        } else {
                            setFacultyName(`(ID: ${data.faculty_id})`);
                        }
                    }).catch(() => setFacultyName(`(ID: ${data.faculty_id})`));
            } else { setFacultyName("-"); }

            // ดึงชื่อสาขา/ภาควิชา
            if (data.department_id) {
                axios.get(`${API_BASE_URL}/department`, { headers: { Authorization: `Bearer ${token}` } })
                    .then(res => {
                        const list = res.data?.data || res.data || [];
                        const found = list.find((item: any) => {
                            const id = item.departmentID || item.department_id || item.DepartmentID || item.id;
                            return String(id) === String(data.department_id);
                        });
                        if (found) {
                            const name = found.departmentName || found.department_name || found.DepartmentName || found.name;
                            setDepartmentName(name || "-");
                        } else {
                            setDepartmentName(`(ID: ${data.department_id})`);
                        }
                    }).catch(() => setDepartmentName(`(ID: ${data.department_id})`));
            } else { setDepartmentName("-"); }

            // ดึงวิทยาเขต
            if (data.campus_id) {
                axios.get(`${API_BASE_URL}/campus`, { headers: { Authorization: `Bearer ${token}` } })
                    .then(res => {
                        const list = res.data?.data || res.data || [];
                        const found = list.find((item: any) => {
                            const id = item.campusID || item.campus_id || item.CampusID || item.id;
                            return String(id) === String(data.campus_id);
                        });
                        if (found) {
                            const name = found.campusName || found.campus_name || found.CampusName || found.name;
                            setCampusName(name || "-");
                        } else {
                            setCampusName(`(ID: ${data.campus_id})`);
                        }
                    }).catch(() => setCampusName(`(ID: ${data.campus_id})`));
            } else { setCampusName(data.detail?.campus || "-"); }
        }
    } else {
        setIsVisible(false);
        setFacultyName("-");
        setDepartmentName("-");
        setCampusName("-");
    }
  }, [isOpen, data]);

  if (!isOpen || !data) return null;

  // ประเภทรางวัล
  const isActivity = data.award_type_id === 1;
  const isInnovation = data.award_type_id === 2;
  const isBehavior = data.award_type_id === 3;
  const isOther = data.award_type_id === 4;

  const theme = THEME_STYLES[String(data.award_type_id)] || THEME_STYLES["default"];

  return (
    // [แก้ไขจุดหลัก] เปลี่ยนจาก fixed inset-0 ไปใช้ absolute inset-0 
    // เพื่อให้ตัว Modal อิงตาม Parent Container (ซึ่งก็คือพื้นที่ Content หลักที่โดนดันตาม Sidebar แล้ว)
    // ใช้ z-[50] เพื่อทับเฉพาะตารางและ Navbar แต่ไม่ทับ Sidebar
    <div className="absolute inset-0 z-[50] flex items-center justify-center p-4 md:p-8 overflow-hidden">
      
      {/* Backdrop */}
      <div 
        className={`absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity duration-300 ${isVisible ? 'opacity-100' : 'opacity-0'}`}
        onClick={onClose}
      ></div>

      {/* Modal Content */}
      <div className={`relative bg-[#F8F9FA] rounded-[24px] shadow-2xl w-full max-w-5xl max-h-[90vh] overflow-hidden flex flex-col transition-all duration-300 transform ${isVisible ? 'scale-100 opacity-100 translate-y-0' : 'scale-95 opacity-0 translate-y-4'}`}>
        
        <style jsx>{`
            .custom-scrollbar::-webkit-scrollbar { width: 6px; }
            .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
            .custom-scrollbar::-webkit-scrollbar-thumb { background-color: rgba(156, 163, 175, 0.5); border-radius: 20px; }
            .custom-scrollbar::-webkit-scrollbar-thumb:hover { background-color: rgba(107, 114, 128, 0.8); }
        `}</style>

        {/* Header */}
        <div className="bg-white/90 backdrop-blur-md z-10 px-6 md:px-8 py-5 border-b border-gray-200 flex justify-between items-center sticky top-0 shadow-sm shrink-0">
            <div>
                <h3 className="text-xl md:text-2xl font-extrabold text-gray-800 flex items-center gap-3">
                    รายละเอียดการเสนอชื่อนิสิตดีเด่น
                </h3>
                <p className="text-sm font-medium text-gray-500 mt-1 flex items-center gap-2">
                    <span className={`w-3 h-3 rounded-full ${theme.numberBg}`}></span> 
                    {data.award_type_name}
                </p>
            </div>
            <button onClick={onClose} className="p-2 bg-gray-100 hover:bg-red-50 text-gray-500 hover:text-red-500 rounded-full transition-all active:scale-90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-200 shrink-0">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"/></svg>
            </button>
        </div>

        {/* Scrollable Body */}
        <div className="overflow-y-auto p-6 md:p-8 space-y-8 custom-scrollbar">
            
            {/* === Section 1 (เฉพาะ Other) === */}
            {isOther && (
                <div className={`bg-white p-6 md:p-8 rounded-[24px] ${theme.border} shadow-sm relative overflow-hidden`}>
                    <div className={`absolute top-0 left-0 w-full h-1 bg-gradient-to-r ${theme.gradient}`}></div>
                    <h3 className="text-lg md:text-xl font-bold text-gray-800 mb-6 flex items-center gap-3">
                        <span className={`w-8 h-8 rounded-full ${theme.numberBg} text-white flex items-center justify-center text-sm`}>1</span>
                        ระบุชื่อรางวัล/ประเภทที่ยื่นเสนอ
                    </h3>
                    <InputReadOnly label="ชื่อรางวัล" value={data.detail?.award_title} />
                </div>
            )}

            {/* === Section ข้อมูลนิสิต === */}
            <div className={`bg-white p-6 md:p-8 rounded-[24px] ${theme.border} shadow-sm relative overflow-hidden`}>
                <div className={`absolute top-0 left-0 w-full h-1 bg-gradient-to-r ${theme.gradient}`}></div>
                <h3 className="text-lg md:text-xl font-bold text-gray-800 mb-6 flex items-center gap-3">
                    <span className={`w-8 h-8 rounded-full ${theme.numberBg} text-white flex items-center justify-center text-sm`}>{isOther ? 2 : 1}</span>
                    ข้อมูลนิสิต {isOther && <span className="text-sm font-normal text-gray-500 ml-2">(ข้อมูลที่กรอกเอง)</span>}
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
                    <ReadOnlyField label="ชื่อ-นามสกุล" value={`${data.student_firstname} ${data.student_lastname}`} />
                    <ReadOnlyField label="รหัสนิสิต" value={data.student_number} font="font-mono" />
                    <ReadOnlyField label="อีเมล" value={data.email} />
                    <ReadOnlyField label="คณะ" value={facultyName} />
                    <ReadOnlyField label="สาขา/ภาควิชา" value={deptName} />
                    <ReadOnlyField label="วิทยาเขต" value={campusName} />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
                    <InputReadOnly label="ชั้นปี" value={data.student_year ? `ปี ${data.student_year}` : "-"} />
                    <InputReadOnly label="เกรดเฉลี่ย" value={data.gpa?.toFixed(2) || data.detail?.gpa} font="font-mono" />
                    <InputReadOnly label="อาจารย์ที่ปรึกษา" value={data.advisor_name} />
                    <InputReadOnly label="เบอร์โทรศัพท์" value={data.phone_number} font="font-mono" />
                    <InputReadOnly label="วันเกิด" value={formatDateDisplay(data.date_of_birth)} />
                    <InputReadOnly label="อายุ (ปี)" value={calculateAge(data.date_of_birth)} />
                    <div className="md:col-span-2">
                        <InputReadOnly label="ที่อยู่ปัจจุบัน" value={data.address} isTextarea />
                    </div>
                </div>
            </div>

            {/* === Section รายละเอียดผลงาน === */}
            <div className={`bg-white p-6 md:p-8 rounded-[24px] ${theme.border} shadow-sm relative overflow-hidden`}>
                <div className={`absolute top-0 left-0 w-full h-1 bg-gradient-to-r ${theme.gradient}`}></div>
                
                {isOther ? (
                    <>
                        <h3 className="text-lg md:text-xl font-bold text-gray-800 mb-6 flex items-center gap-3">
                            <span className={`w-8 h-8 rounded-full flex items-center justify-center ${theme.numberBg} text-white text-sm`}>3</span>
                            ข้อมูลหน่วยงานที่เสนอชื่อ
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-10">
                            <InputReadOnly label="ชื่อหน่วยงาน" value={data.detail?.organization_name} />
                            <InputReadOnly label="ประเภทหน่วยงาน" value={data.detail?.organization_type} />
                            <InputReadOnly label="ที่ตั้งหน่วยงาน" value={data.detail?.organization_location} />
                            <InputReadOnly label="เบอร์โทรศัพท์หน่วยงาน" value={data.detail?.organization_phone} font="font-mono" />
                        </div>

                        <h3 className="text-lg md:text-xl font-bold text-gray-800 mb-6 flex items-center gap-3 border-t border-gray-100 pt-8">
                            <span className={`w-8 h-8 rounded-full flex items-center justify-center ${theme.numberBg} text-white text-sm`}>4</span>
                            รายละเอียดเพิ่มเติม
                        </h3>
                        <InputReadOnly label="" value={data.detail?.other_details} isTextarea />
                    </>
                ) : (
                    <>
                        <h3 className="text-lg md:text-xl font-bold text-gray-800 mb-6 flex items-center gap-3">
                            <span className={`w-8 h-8 rounded-full flex items-center justify-center ${theme.numberBg} text-white text-sm`}>2</span>
                            {isBehavior ? 'รายละเอียดเพิ่มเติม' : 'รายละเอียดผลงาน'}
                        </h3>

                        {/* Behavior */}
                        {isBehavior && (
                            <InputReadOnly label="รายละเอียดความประพฤติ" value={data.detail?.other_details || data.detail?.behavior_desc} isTextarea />
                        )}

                        {/* Activity */}
                        {isActivity && (
                            <div className="space-y-6">
                                <div className="space-y-3">
                                    <label className="text-sm font-bold text-gray-800">ประเภทกิจกรรมที่เลือก</label>
                                    <div className="grid grid-cols-1 gap-3">
                                        {[
                                            { val: "committee", text: "เป็นนิสิตที่ดำเนินกิจกรรมและต้องแสดงให้เห็นว่าเมื่อดำเนินกิจกรรมแล้ว... ก่อให้เกิดประโยชน์ต่อส่วนรวม" },
                                            { val: "competition", text: "เข้าร่วมแข่งขันทางวิชาการหรือศิลปวัฒนธรรมระดับอุดมศึกษา ระดับชาติหรือระดับนานาชาติ..." },
                                            { val: "reputation", text: "ดำรงตำแหน่งนายกองค์การบริหาร องค์การนิสิต ประธานสภาผู้แทนนิสิต..." }
                                        ].map((item) => {
                                            const isChecked = data.detail?.activity_category === item.val || data.detail?.qualification_type === item.val;
                                            return (
                                                <label key={item.val} className={`flex items-start gap-3 p-4 rounded-xl border transition-all ${isChecked ? `${theme.bgSoft} ${theme.border} shadow-sm` : 'bg-white border-gray-200 opacity-60'}`}>
                                                    <input type="radio" readOnly checked={isChecked} className={`mt-1 w-4 h-4 ${theme.radioColor}`} />
                                                    <span className="text-sm text-gray-700">{item.text}</span>
                                                </label>
                                            )
                                        })}
                                    </div>
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <InputReadOnly label="ชื่อโครงการ/กิจกรรม" value={data.detail?.project_title} />
                                    <InputReadOnly label="วันที่เข้าร่วมกิจกรรม" value={formatDateDisplay(data.detail?.date_received)} />
                                    <InputReadOnly label="บทบาท/หน้าที่ (หรือรางวัล)" value={data.detail?.prize} />
                                    <InputReadOnly label="หน่วยงานที่จัดกิจกรรม" value={data.detail?.organized_by} />
                                    <div className="md:col-span-2">
                                        <InputReadOnly label="ชื่อทีม (ถ้ามี)" value={data.detail?.team_name} />
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Innovation */}
                        {isInnovation && (
                            <div className="space-y-6">
                                <div className="p-4 bg-purple-50 rounded-xl border border-purple-100 flex items-center gap-3">
                                    <input type="checkbox" readOnly checked={data.detail?.competition_level === 'National/International' || data.detail?.competition_level === 'ระดับนานาชาติ' || data.detail?.competition_level === 'ระดับชาติ'} className="w-5 h-5 text-purple-600 rounded border-gray-300 focus:ring-purple-500" />
                                    <span className="text-sm text-purple-900 font-medium">ยืนยันว่าผลงานได้รับรางวัลจากการประกวด/แข่งขัน ระดับชาติหรือนานาชาติ</span>
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <InputReadOnly label="ชื่อผลงานนวัตกรรม" value={data.detail?.project_title} />
                                    <InputReadOnly label="วันที่ได้รับรางวัล" value={formatDateDisplay(data.detail?.date_received)} />
                                    <InputReadOnly label="รางวัลที่ได้รับ" value={data.detail?.prize} />
                                    <InputReadOnly label="เวทีการประกวด" value={data.detail?.organized_by} />
                                    <div className="md:col-span-2">
                                        <InputReadOnly label="ชื่อทีม (ถ้ามี)" value={data.detail?.team_name} />
                                    </div>
                                </div>
                            </div>
                        )}
                    </>
                )}
            </div>

            {/* === Section เอกสารประกอบ === */}
            <div className={`bg-white p-6 md:p-8 rounded-[24px] ${theme.border} shadow-sm relative overflow-hidden`}>
                <h3 className="text-lg md:text-xl font-bold text-gray-800 mb-6 flex items-center gap-3">
                    <span className={`w-8 h-8 rounded-full flex items-center justify-center ${theme.numberBg} text-white text-sm`}>
                        {isOther ? 5 : (isBehavior ? 3 : 3)}
                    </span>
                    เอกสารประกอบ <span className="text-gray-400 text-sm font-normal ml-2">(ไฟล์ PDF ที่แนบมา)</span>
                </h3>

                {data.files && data.files.length > 0 ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {data.files.map((file, idx) => {
                            let safePath = file.file_path;
                            if (safePath.startsWith("api/")) safePath = safePath.replace("api/", "");
                            if (safePath.startsWith("/api/")) safePath = safePath.replace("/api/", "");
                            if (!safePath.startsWith("/")) safePath = "/" + safePath;

                            return (
                                <a 
                                    key={idx} 
                                    href={safePath}
                                    target="_blank" 
                                    rel="noreferrer"
                                    className="group flex items-center justify-between p-4 bg-white border border-gray-200 rounded-xl hover:border-red-200 hover:shadow-md transition-all duration-300"
                                >
                                    <div className="flex items-center gap-4 overflow-hidden">
                                         <div className="w-12 h-12 bg-red-50 rounded-lg flex items-center justify-center text-red-500 font-bold text-xs group-hover:scale-110 transition-transform">PDF</div>
                                         <div className="min-w-0">
                                             <p className="text-sm font-bold text-gray-700 truncate group-hover:text-red-500 transition-colors">{file.file_name}</p>
                                             <p className="text-xs text-gray-400">{(file.file_size / 1024).toFixed(2)} KB</p>
                                         </div>
                                    </div>
                                </a>
                            );
                        })}
                    </div>
                ) : (
                    <div className="p-10 text-center bg-gray-50 border-2 border-dashed border-gray-300 rounded-2xl text-gray-400 font-medium">
                        ไม่พบเอกสารแนบในระบบ
                    </div>
                )}
            </div>

        </div>
      </div>
    </div>
  );
}