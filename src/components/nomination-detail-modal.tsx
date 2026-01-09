"use client";

import { useEffect, useState } from "react";

// กำหนด Type ให้ตรงกับข้อมูลที่ฟอร์มบันทึก
interface NominationData {
  id: number;
  awardType: "behavior" | "activity" | "innovation";
  firstName: string;
  lastName: string;
  studentId: string;
  faculty: string;
  major: string;
  advisor: string;
  gpa: string;
  phone: string;
  email: string;
  address: string;
  // ข้อมูลเฉพาะ
  activityCriteria?: string;
  innovationQual?: boolean;
  awardDate?: string;
  projectName?: string;
  teamName?: string;
  workName?: string;
  receivedAward?: string;
  organizer?: string;
  files?: string[];
}

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  data: NominationData | null;
}

export default function NominationDetailModal({ isOpen, onClose, data }: ModalProps) {
  if (!isOpen || !data) return null;

  // แปลงค่าภาษาอังกฤษเป็นภาษาไทยสำหรับแสดงผล
  const getAwardTypeLabel = (type: string) => {
    switch (type) {
      case "behavior": return "ด้านความประพฤติดีเด่น";
      case "innovation": return "ด้านความคิดสร้างสรรค์และนวัตกรรม";
      case "activity": return "ด้านกิจกรรมเสริมหลักสูตร";
      default: return type;
    }
  };

  const getActivityCriteriaLabel = (criteria: string) => {
    switch (criteria) {
        case "committee": return "เป็นนิสิตที่ดำรงตำแหน่งคณะกรรมการนิสิตสโมสรนิสิตคณะวิทยาศาสตร์ หรือ คณะกรรมการบริหาร สโมสรนิสิตจุฬาลงกรณ์มหาวิทยาลัย โดยมีระยะเวลาการดำรงตำแหน่งไม่น้อยกว่า 1 ปีการศึกษา";
        case "competition": return "เป็นนิสิตที่ได้รับรางวัลจากการประกวดหรือการแข่งขันทางวิชาการ หรือ วิทยาศาสตร์ หรือ นวัตกรรม ระดับชาติ หรือ ระดับนานาชาติ และได้รับรางวัลชนะเลิศหรือรางวัลรองชนะเลิศ";
        case "reputation": return "เป็นนิสิตผู้สร้างชื่อเสียงให้กับคณะวิทยาศาสตร์ หรือ มหาวิทยาลัย โดยได้รับการคัดเลือกให้เป็นตัวแทนของมหาวิทยาลัยเข้าร่วมกิจกรรมสำคัญต่างๆ";
        default: return "-";
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fade-in">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-hidden flex flex-col">
        
        {/* --- Header --- */}
        <div className="px-8 py-5 border-b border-gray-100 flex justify-between items-center bg-gray-50">
          <div>
            <h3 className="text-xl font-bold text-gray-800">รายละเอียดการเสนอชื่อ</h3>
            <p className="text-sm text-green-600 font-medium mt-1">
              ประเภท: {getAwardTypeLabel(data.awardType)}
            </p>
          </div>
          <button 
            onClick={onClose}
            className="text-gray-400 hover:text-red-500 transition-colors p-2 rounded-full hover:bg-white"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>

        {/* --- Scrollable Content --- */}
        <div className="p-8 overflow-y-auto space-y-8 custom-scrollbar">
          
          {/* 1. ข้อมูลส่วนตัว (แสดงเหมือนกันทุกประเภท) */}
          <section>
            <h4 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-4 border-b pb-2">ข้อมูลนิสิต</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-y-4 gap-x-8 text-sm">
                <InfoItem label="ชื่อ-นามสกุล" value={`${data.firstName} ${data.lastName}`} />
                <InfoItem label="รหัสนิสิต" value={data.studentId} />
                <InfoItem label="คณะ" value={data.faculty} />
                <InfoItem label="สาขาวิชา" value={data.major} />
                <InfoItem label="เกรดเฉลี่ย" value={data.gpa} />
                <InfoItem label="อาจารย์ที่ปรึกษา" value={data.advisor} />
                <InfoItem label="เบอร์โทรศัพท์" value={data.phone} />
                <InfoItem label="อีเมล" value={data.email} />
                <div className="col-span-2">
                    <InfoItem label="ที่อยู่" value={data.address} />
                </div>
            </div>
          </section>

          {/* 2. ข้อมูลเฉพาะ (แยกตามประเภท 3 ประเภท) */}
          
          {/* --- CASE 1: Activity --- */}
          {data.awardType === "activity" && (
            <section className="bg-blue-50 p-6 rounded-xl border border-blue-100">
                <h4 className="text-sm font-bold text-blue-800 uppercase tracking-wider mb-4">ข้อมูลด้านกิจกรรมเสริมหลักสูตร</h4>
                <div className="space-y-4">
                    <div>
                        <p className="text-xs text-blue-500 font-semibold mb-1">คุณสมบัติที่เลือก</p>
                        <p className="text-sm text-gray-800 font-medium bg-white p-3 rounded border border-blue-100">
                            {getActivityCriteriaLabel(data.activityCriteria || "")}
                        </p>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <InfoItem label="วันที่ได้รับรางวัล" value={data.awardDate} />
                        <InfoItem label="ชื่อโครงการ" value={data.projectName} />
                        <InfoItem label="ชื่อทีม" value={data.teamName} />
                        <InfoItem label="ชื่อผลงาน" value={data.workName} />
                        <InfoItem label="รางวัลที่ได้รับ" value={data.receivedAward} />
                        <InfoItem label="ผู้จัด" value={data.organizer} />
                    </div>
                </div>
            </section>
          )}

          {/* --- CASE 2: Innovation --- */}
          {data.awardType === "innovation" && (
            <section className="bg-purple-50 p-6 rounded-xl border border-purple-100">
                <h4 className="text-sm font-bold text-purple-800 uppercase tracking-wider mb-4">ข้อมูลด้านความคิดสร้างสรรค์และนวัตกรรม</h4>
                <div className="space-y-4">
                    <div className="flex items-start gap-3 bg-white p-3 rounded border border-purple-100">
                        <div className={`mt-0.5 w-5 h-5 rounded border flex items-center justify-center ${data.innovationQual ? 'bg-purple-600 border-purple-600 text-white' : 'border-gray-300'}`}>
                            {data.innovationQual && <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" /></svg>}
                        </div>
                        <span className="text-sm text-gray-700">ยืนยันคุณสมบัติ: ต้องได้รับรางวัลจากการประกวดหรือการแข่งขันระดับอุดมศึกษา ระดับชาติหรือระดับนานาชาติที่มีหน่วยงานภาครัฐหรือเอกชนเป็นผู้จัด</span>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                        <InfoItem label="วันที่ได้รับรางวัล" value={data.awardDate} />
                        <InfoItem label="ชื่อโครงการ/รายการแข่งขัน" value={data.projectName} />
                        <InfoItem label="ชื่อทีม" value={data.teamName} />
                        <InfoItem label="ชื่อผลงาน" value={data.workName} />
                        <InfoItem label="รางวัลที่ได้รับ" value={data.receivedAward} />
                        <InfoItem label="หน่วยงานผู้จัด" value={data.organizer} />
                    </div>
                </div>
            </section>
          )}

          {/* --- CASE 3: Behavior --- */}
          {data.awardType === "behavior" && (
             <section className="bg-yellow-50 p-6 rounded-xl border border-yellow-100">
                <h4 className="text-sm font-bold text-yellow-800 uppercase tracking-wider mb-2">ข้อมูลด้านความประพฤติ</h4>
                <p className="text-sm text-gray-600">
                    ไม่มีข้อมูลโครงการเพิ่มเติม พิจารณาจากประวัติและเอกสารประกอบ
                </p>
             </section>
          )}

          {/* 3. เอกสารแนบ */}
          <section>
            <h4 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-4 border-b pb-2">เอกสารประกอบ</h4>
            {data.files && data.files.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {data.files.map((file, idx) => (
                        <a href="#" key={idx} className="flex items-center gap-3 p-3 rounded-lg border border-gray-200 hover:border-blue-300 hover:bg-blue-50 transition-all group">
                            <div className="w-10 h-10 bg-red-100 text-red-600 rounded flex items-center justify-center flex-shrink-0 group-hover:bg-white group-hover:scale-110 transition-all">
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" /></svg>
                            </div>
                            <span className="text-sm text-gray-700 font-medium truncate">{file}</span>
                        </a>
                    ))}
                </div>
            ) : (
                <p className="text-sm text-gray-400 italic">ไม่มีเอกสารแนบ</p>
            )}
          </section>

        </div>

        {/* --- Footer --- */}
        <div className="p-6 border-t border-gray-100 flex justify-end gap-3 bg-gray-50">
            <button 
                onClick={onClose}
                className="px-6 py-2.5 rounded-lg text-sm font-bold text-gray-600 hover:bg-gray-200 transition-all"
            >
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