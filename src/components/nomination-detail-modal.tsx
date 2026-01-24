"use client";

import { useEffect, useState } from "react";

export interface MasterFaculty {
  faculty_id: number;
  faculty_name: string;
}

export interface MasterDepartment {
  department_id: number;
  department_name: string;
  faculty_id: number;
}

interface FileResponse {
  file_dir_id: number;
  file_name: string;
  file_type: string;
  file_size: number;
  file_path: string;
}

interface ExtracurricularDetail {
  qualification_type?: string;
  date_received?: string;
  team_name?: string;
  project_title?: string;
  prize?: string;
  organized_by?: string;
  competition_level?: string;
  activity_category?: string;
}

interface CreativityDetail {
  date_received?: string;
  team_name?: string;
  project_title?: string;
  prize?: string;
  organized_by?: string;
  competition_level?: string;
  activity_category?: string;
}

interface GoodBehaviorDetail {}

interface Nomination {
  form_id: number;
  student_id: number;
  student_firstname: string;
  student_lastname: string;
  email: string;
  student_number: string;
  faculty_id: number;
  department_id: number;
  campus_id: number;
  academic_year: number;
  semester: number;
  form_status_id: number;
  award_type_id: number;
  award_type_name: string;
  created_at: string;
  latest_update: string;
  student_year: number;
  advisor_name: string;
  phone_number: string;
  address: string;
  gpa: number;
  date_of_birth: string;
  detail?: ExtracurricularDetail | CreativityDetail | GoodBehaviorDetail;
  files?: FileResponse[];
}

// 2. อัปเดต ModalProps ให้รับ faculties และ departments
interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  data: Nomination | null;
  faculties: MasterFaculty[];
  departments: MasterDepartment[];
}

// 3. รับค่าเข้ามาในฟังก์ชัน
export default function NominationDetailModal({ 
  isOpen, 
  onClose, 
  data, 
  faculties,
  departments
}: ModalProps) {
  
  if (!isOpen || !data) return null;

  // Helper Type Guards
  const isActivity = (detail: any): detail is ExtracurricularDetail => data.award_type_id === 3;
  const isInnovation = (detail: any): detail is CreativityDetail => data.award_type_id === 2;
  const isBehavior = (detail: any): detail is GoodBehaviorDetail => data.award_type_id === 1;

  // Format Date
  const formatDate = (dateString?: string) => {
      if(!dateString) return "-";
      return new Date(dateString).toLocaleDateString('th-TH', { year: 'numeric', month: 'long', day: 'numeric' });
  }

  // Helper Function หาชื่อจาก ID (ใช้ข้อมูลที่ส่งเข้ามา)
  const getFacultyName = (id: number) => {
      // ป้องกันกรณี faculties ยังไม่โหลดหรือเป็น null
      if (!faculties) return `รหัสคณะ ${id}`;
      const found = faculties.find(f => f.faculty_id === id);
      return found ? found.faculty_name : `รหัสคณะ ${id}`;
  };

  const getDepartmentName = (id: number) => {
      if (!departments) return `รหัสภาควิชา ${id}`;
      const found = departments.find(d => d.department_id === id);
      return found ? found.department_name : `รหัสภาควิชา ${id}`;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fade-in">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-hidden flex flex-col">
        
        {/* --- Header --- */}
        <div className="px-8 py-5 border-b border-gray-100 flex justify-between items-center bg-gray-50">
          <div>
            <h3 className="text-xl font-bold text-gray-800">รายละเอียดการเสนอชื่อ</h3>
            <p className="text-sm text-green-600 font-medium mt-1">
              ประเภท: {data.award_type_name}
            </p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-red-500 transition-colors p-2 rounded-full hover:bg-white">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="p-8 overflow-y-auto space-y-8 custom-scrollbar">
          
          {/* ข้อมูลนิสิต */}
          <section>
            <h4 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-4 border-b pb-2">ข้อมูลนิสิต</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-y-4 gap-x-8 text-sm">
                <InfoItem label="ชื่อ-นามสกุล" value={`${data.student_firstname} ${data.student_lastname}`} />
                <InfoItem label="รหัสนิสิต" value={data.student_number} />
                <InfoItem label="ชั้นปี" value={data.student_year.toString()} />
                <InfoItem label="ปีการศึกษา" value={data.academic_year.toString()} />
                
                {/* ✅ เรียกใช้ Function แสดงชื่อจริง */}
                <InfoItem label="คณะ" value={getFacultyName(data.faculty_id)} /> 
                <InfoItem label="สาขาวิชา" value={getDepartmentName(data.department_id)} />
                
                <InfoItem label="เกรดเฉลี่ย" value={data.gpa.toFixed(2)} />
                <InfoItem label="อาจารย์ที่ปรึกษา" value={data.advisor_name} />
                <InfoItem label="เบอร์โทรศัพท์" value={data.phone_number} />
                <InfoItem label="อีเมล" value={data.email} />
                <InfoItem label="วันเกิด" value={formatDate(data.date_of_birth)} />
                <div className="col-span-2">
                    <InfoItem label="ที่อยู่" value={data.address} />
                </div>
            </div>
          </section>

          {/* ... (ส่วนอื่นๆ ของ Modal เหมือนเดิม) ... */}
          
          {/* 1. กิจกรรม (Activity) */}
          {isActivity(data.detail) && data.detail && (
            <section className="bg-blue-50 p-6 rounded-xl border border-blue-100">
                <h4 className="text-sm font-bold text-blue-800 uppercase tracking-wider mb-4">ข้อมูลด้านกิจกรรมเสริมหลักสูตร</h4>
                <div className="space-y-4">
                    <div>
                        <p className="text-xs text-blue-500 font-semibold mb-1">คุณสมบัติ</p>
                        <p className="text-sm text-gray-800 font-medium bg-white p-3 rounded border border-blue-100">
                            {data.detail.qualification_type || "-"}
                        </p>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <InfoItem label="วันที่ได้รับรางวัล/ทำกิจกรรม" value={formatDate(data.detail.date_received)} />
                        <InfoItem label="ชื่อโครงการ" value={data.detail.project_title} />
                        <InfoItem label="ชื่อทีม" value={data.detail.team_name} />
                        <InfoItem label="ประเภทกิจกรรม" value={data.detail.activity_category} />
                        <InfoItem label="รางวัลที่ได้รับ" value={data.detail.prize} />
                        <InfoItem label="ระดับการแข่งขัน" value={data.detail.competition_level} />
                        <InfoItem label="ผู้จัด" value={data.detail.organized_by} />
                    </div>
                </div>
            </section>
          )}

          {/* 2. นวัตกรรม (Innovation) */}
          {isInnovation(data.detail) && data.detail && (
            <section className="bg-purple-50 p-6 rounded-xl border border-purple-100">
                <h4 className="text-sm font-bold text-purple-800 uppercase tracking-wider mb-4">ข้อมูลด้านความคิดสร้างสรรค์และนวัตกรรม</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <InfoItem label="วันที่ได้รับรางวัล" value={formatDate(data.detail.date_received)} />
                    <InfoItem label="ชื่อผลงาน/นวัตกรรม" value={data.detail.project_title} />
                    <InfoItem label="ชื่อทีม" value={data.detail.team_name} />
                    <InfoItem label="ประเภทผลงาน" value={data.detail.activity_category} />
                    <InfoItem label="รางวัลที่ได้รับ" value={data.detail.prize} />
                    <InfoItem label="ระดับการแข่งขัน" value={data.detail.competition_level} />
                    <InfoItem label="หน่วยงานผู้จัด" value={data.detail.organized_by} />
                </div>
            </section>
          )}

          {/* 3. ความประพฤติ (Behavior) */}
          {isBehavior(data.detail) && (
             <section className="bg-yellow-50 p-6 rounded-xl border border-yellow-100">
                <h4 className="text-sm font-bold text-yellow-800 uppercase tracking-wider mb-2">ข้อมูลด้านความประพฤติ</h4>
                <p className="text-sm text-gray-600">
                    ไม่มีข้อมูลโครงการเพิ่มเติม พิจารณาจากประวัติและเอกสารประกอบ
                </p>
             </section>
          )}

          {/* เอกสารแนบ */}
          <section>
            <h4 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-4 border-b pb-2">เอกสารประกอบ</h4>
            {data.files && data.files.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {data.files.map((file) => (
                        <a 
                            href={file.file_path} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            key={file.file_dir_id} 
                            className="flex items-center gap-3 p-3 rounded-lg border border-gray-200 hover:border-blue-300 hover:bg-blue-50 transition-all group"
                        >
                            <div className="w-10 h-10 bg-red-100 text-red-600 rounded flex items-center justify-center flex-shrink-0 group-hover:bg-white group-hover:scale-110 transition-all">
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" /></svg>
                            </div>
                            <div className="overflow-hidden">
                                <p className="text-sm text-gray-700 font-medium truncate" title={file.file_name}>{file.file_name}</p>
                                <p className="text-xs text-gray-400">{(file.file_size / 1024).toFixed(1)} KB</p>
                            </div>
                        </a>
                    ))}
                </div>
            ) : (
                <p className="text-sm text-gray-400 italic">ไม่มีเอกสารแนบ</p>
            )}
          </section>

        </div>

        {/* Footer */}
        <div className="p-6 border-t border-gray-100 flex justify-end gap-3 bg-gray-50">
            <button onClick={onClose} className="px-6 py-2.5 rounded-lg text-sm font-bold text-gray-600 hover:bg-gray-200 transition-all">
                ปิดหน้าต่าง
            </button>
        </div>
      </div>
    </div>
  );
}

// Helper Component for Info Row
function InfoItem({ label, value }: { label: string, value?: string }) {
    return (
        <div>
            <p className="text-xs text-gray-400 mb-1">{label}</p>
            <p className="text-sm font-semibold text-gray-800 break-words">{value || "-"}</p>
        </div>
    );
}