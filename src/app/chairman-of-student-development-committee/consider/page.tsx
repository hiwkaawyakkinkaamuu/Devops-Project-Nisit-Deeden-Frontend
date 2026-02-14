"use client";

import { useState, useEffect, useMemo } from "react";
import Swal from "sweetalert2"; 
import axios from "axios";
import NominationDetailModal from "@/components/nomination-detail-modal"; 

// ==========================================
// 0. Configuration & Service Layer
// ==========================================

const USE_MOCK_DATA = true; // Set FALSE to use Real API
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "";

// --- Interfaces ---
interface VoteSummary {
  approve: number;
  reject: number;
  abstain: number;
  total_voters: number;
}

interface FileResponse {
  file_dir_id: number;
  file_name: string;
  file_type: string;
  file_size: number;
  file_path: string;
}

interface ExtracurricularDetail {
  qualification_type: string;
  date_received: string;
  team_name: string;
  project_title: string;
  prize: string;
  organized_by: string;
  competition_level?: string;
  activity_category?: string;
}

interface CreativityDetail {
  date_received: string;
  team_name: string;
  project_title: string;
  prize: string;
  organized_by: string;
  competition_level?: string;
  activity_category?: string;
}

interface GoodBehaviorDetail {
   behavior_desc?: string;
}

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
  
  vote_summary: VoteSummary; 
  is_signed: boolean;        
  signed_date?: string;      
}

interface MasterOption {
  id: number;
  name: string;
}

// --- Mock Data ---
const MOCK_CANDIDATES: Nomination[] = [
    {
        form_id: 1, student_id: 101, student_number: "6610400001", student_firstname: "สมชาย", student_lastname: "ใจดี",
        email: "somchai@ku.th", student_year: 1, form_status_id: 1, created_at: "2026-01-15T10:00:00Z", latest_update: "2026-01-15T10:00:00Z",
        award_type_id: 2, award_type_name: "ด้านความคิดสร้างสรรค์และนวัตกรรม",
        faculty_id: 2, department_id: 20, campus_id: 1, academic_year: 2569, semester: 1,
        advisor_name: "ดร. สมชาย", gpa: 3.50, phone_number: "0812345678", address: "กทม.", date_of_birth: "2002-01-01",
        vote_summary: { approve: 4, reject: 1, abstain: 0, total_voters: 5 }, is_signed: false,
        detail: { date_received: "2025-12-01", team_name: "AI Innovators", project_title: "Smart Farm IoT", prize: "รางวัลชนะเลิศ", organized_by: "NSTDA" } as CreativityDetail,
        files: [{ file_dir_id: 1, file_name: "project_proposal.pdf", file_type: "application/pdf", file_size: 2000, file_path: "#" }]
    },
    {
        form_id: 2, student_id: 102, student_number: "6610400002", student_firstname: "สมหญิง", student_lastname: "รักเรียน",
        email: "ying@ku.th", student_year: 2, form_status_id: 1, created_at: "2026-01-16T09:00:00Z", latest_update: "2026-01-16T09:00:00Z",
        award_type_id: 1, award_type_name: "ด้านความประพฤติดี",
        faculty_id: 3, department_id: 30, campus_id: 1, academic_year: 2569, semester: 1,
        advisor_name: "อ. สมศรี", gpa: 3.80, phone_number: "0891234567", address: "กทม.", date_of_birth: "2002-02-02",
        vote_summary: { approve: 5, reject: 0, abstain: 0, total_voters: 5 }, is_signed: true, signed_date: "2026-02-20T10:30:00Z",
        detail: { behavior_desc: "มีความประพฤติเรียบร้อย..." } as GoodBehaviorDetail,
        files: [{ file_dir_id: 3, file_name: "transcript.pdf", file_type: "application/pdf", file_size: 5000, file_path: "#" }]
    },
    {
        form_id: 3, student_id: 103, student_number: "6610400003", student_firstname: "เก่ง", student_lastname: "กล้าหาญ",
        email: "keng@ku.th", student_year: 3, form_status_id: 1, created_at: "2026-01-10T10:00:00Z", latest_update: "2026-01-10T10:00:00Z",
        award_type_id: 3, award_type_name: "ด้านกิจกรรมเสริมหลักสูตร",
        faculty_id: 1, department_id: 10, campus_id: 1, academic_year: 2569, semester: 1,
        advisor_name: "อ. เก่ง", gpa: 3.20, phone_number: "0899999999", address: "กทม.", date_of_birth: "2001-03-03",
        vote_summary: { approve: 2, reject: 3, abstain: 0, total_voters: 5 }, is_signed: false,
        detail: { project_title: "Marathon", prize: "Gold", organized_by: "Red Cross", date_received: "2025-11-20", team_name: "Runners", qualification_type: "Runner" } as ExtracurricularDetail,
        files: [{ file_dir_id: 5, file_name: "cert.pdf", file_type: "application/pdf", file_size: 1000, file_path: "#" }]
    },
    {
        form_id: 4, student_id: 104, student_number: "6610400004", student_firstname: "มานี", student_lastname: "มีตา",
        email: "manee@ku.th", student_year: 4, form_status_id: 1, created_at: "2026-01-12T10:00:00Z", latest_update: "2026-01-12T10:00:00Z",
        award_type_id: 1, award_type_name: "ด้านความประพฤติดี",
        faculty_id: 4, department_id: 40, campus_id: 1, academic_year: 2569, semester: 1,
        advisor_name: "ดร. ฟ้า", gpa: 3.90, phone_number: "0888888888", address: "กทม.", date_of_birth: "2000-04-04",
        vote_summary: { approve: 3, reject: 1, abstain: 1, total_voters: 5 }, is_signed: false,
        detail: { behavior_desc: "ผู้นำกิจกรรม..." } as GoodBehaviorDetail,
        files: [{ file_dir_id: 7, file_name: "portfolio.pdf", file_type: "application/pdf", file_size: 5000, file_path: "#" }]
    },
    {
        form_id: 5, student_id: 105, student_number: "6610400005", student_firstname: "ปิติ", student_lastname: "ยินดี",
        email: "piti@ku.th", student_year: 2, form_status_id: 1, created_at: "2026-01-13T10:00:00Z", latest_update: "2026-01-13T10:00:00Z",
        award_type_id: 2, award_type_name: "ด้านความคิดสร้างสรรค์และนวัตกรรม",
        faculty_id: 1, department_id: 10, campus_id: 1, academic_year: 2569, semester: 1,
        advisor_name: "ผศ. วีระ", gpa: 3.60, phone_number: "0877777777", address: "นนทบุรี", date_of_birth: "2002-05-05",
        vote_summary: { approve: 5, reject: 0, abstain: 0, total_voters: 5 }, is_signed: false,
        detail: { project_title: "Green Energy", prize: "Silver", organized_by: "Egco", date_received: "2025-10-10", team_name: "Eco", activity_category: "Env" } as CreativityDetail,
        files: [{ file_dir_id: 8, file_name: "proposal.pdf", file_type: "application/pdf", file_size: 3000, file_path: "#" }]
    },
    {
        form_id: 6, student_id: 106, student_number: "6610400006", student_firstname: "ชูใจ", student_lastname: "เลิศล้ำ",
        email: "choojai@ku.th", student_year: 3, form_status_id: 1, created_at: "2026-01-14T10:00:00Z", latest_update: "2026-01-14T10:00:00Z",
        award_type_id: 3, award_type_name: "ด้านกิจกรรมเสริมหลักสูตร",
        faculty_id: 2, department_id: 20, campus_id: 1, academic_year: 2569, semester: 1,
        advisor_name: "ดร. กล้า", gpa: 3.10, phone_number: "0866666666", address: "ปทุมธานี", date_of_birth: "2001-06-06",
        vote_summary: { approve: 1, reject: 4, abstain: 0, total_voters: 5 }, is_signed: false,
        detail: { project_title: "Music Fest", prize: "Runner-up", organized_by: "Music Club", date_received: "2025-09-09", team_name: "Band", qualification_type: "Musician" } as ExtracurricularDetail,
        files: [{ file_dir_id: 9, file_name: "photo.jpg", file_type: "image/jpeg", file_size: 2000, file_path: "#" }]
    },
    {
        form_id: 7, student_id: 107, student_number: "6610400007", student_firstname: "แก้ว", student_lastname: "ตา",
        email: "kaew@ku.th", student_year: 1, form_status_id: 1, created_at: "2026-01-15T10:00:00Z", latest_update: "2026-01-15T10:00:00Z",
        award_type_id: 1, award_type_name: "ด้านความประพฤติดี",
        faculty_id: 3, department_id: 30, campus_id: 1, academic_year: 2569, semester: 1,
        advisor_name: "อ. ดวงใจ", gpa: 3.40, phone_number: "0855555555", address: "กทม.", date_of_birth: "2003-07-07",
        vote_summary: { approve: 4, reject: 0, abstain: 1, total_voters: 5 }, is_signed: false,
        detail: { behavior_desc: "ช่วยงานห้องสมุด..." } as GoodBehaviorDetail,
        files: [{ file_dir_id: 10, file_name: "ref_letter.pdf", file_type: "application/pdf", file_size: 1500, file_path: "#" }]
    }
];

// --- Service Logic ---
const chairmanService = {
  getCandidates: async (token: string | null, params: Record<string, string>) => {
    if (USE_MOCK_DATA) {
      await new Promise(r => setTimeout(r, 800)); // Simulate Delay
      
      let filtered = MOCK_CANDIDATES;
      // Mock Filtering
      if (params.q) {
        const lower = params.q.toLowerCase();
        filtered = filtered.filter(i => 
            i.student_firstname.toLowerCase().includes(lower) || 
            i.student_lastname.toLowerCase().includes(lower) || 
            i.student_number.includes(lower)
        );
      }
      if (params.award_type) {
        filtered = filtered.filter(i => i.award_type_name === params.award_type);
      }
      return filtered;

    } else {
      // Real API Call
      try {
        const response = await axios.get(`${API_BASE_URL}/api/chairman/candidates`, {
          params,
          headers: { Authorization: `Bearer ${token}` }
        });
        return response.data.data || [];
      } catch (error) {
        throw error;
      }
    }
  },

  signNomination: async (token: string | null, form_id: number) => {
    if (USE_MOCK_DATA) {
      await new Promise(r => setTimeout(r, 1500)); // Simulate Delay
      return { success: true, message: "Signed successfully" };
    } else {
      // Real API Call
      const response = await axios.post(`${API_BASE_URL}/api/chairman/sign`, { form_id }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      return response.data;
    }
  }
};

// ==========================================
// 1. Static Data
// ==========================================

const STATIC_FACULTIES: MasterOption[] = [
  { id: 1, name: "คณะวิทยาศาสตร์" },
  { id: 2, name: "คณะวิศวกรรมศาสตร์" },
  { id: 3, name: "คณะเกษตร" },
  { id: 4, name: "คณะบริหารธุรกิจ" }
];

const STATIC_DEPARTMENTS: MasterOption[] = [
  { id: 10, name: "วิทยาการคอมพิวเตอร์" },
  { id: 20, name: "วิศวกรรมไฟฟ้า" },
  { id: 30, name: "พืชไร่" },
  { id: 40, name: "การตลาด" }
];

// ==========================================
// 2. Components: Skeleton Loading
// ==========================================

const TableSkeleton = () => (
  <>
    {[1, 2, 3, 4, 5].map((i) => (
      <tr key={i} className="animate-pulse border-b border-gray-100">
        <td className="p-5"><div className="h-4 bg-gray-200 rounded w-48 mb-2"></div><div className="h-3 bg-gray-200 rounded w-32"></div></td>
        <td className="p-5"><div className="h-8 w-16 bg-gray-200 rounded mx-auto"></div></td>
        <td className="p-5"><div className="h-3 bg-gray-200 rounded-full w-full mb-2"></div><div className="h-2 bg-gray-200 rounded w-1/2 mx-auto"></div></td>
        <td className="p-5"><div className="h-6 w-24 bg-gray-200 rounded-full mx-auto"></div></td>
        <td className="p-5"><div className="h-8 w-20 bg-gray-200 rounded mx-auto"></div></td>
        <td className="p-5"><div className="h-8 w-8 bg-gray-200 rounded-full mx-auto"></div></td>
      </tr>
    ))}
  </>
);

// ==========================================
// 3. Main Component
// ==========================================

export default function ChairmanApprovalPage() {
  
  // --- UI States ---
  const [loading, setLoading] = useState(true);
  const [signingId, setSigningId] = useState<number | null>(null);

  // --- Data States ---
  const [candidates, setCandidates] = useState<Nomination[]>([]);

  // --- Filter States ---
  const [searchTerm, setSearchTerm] = useState("");
  const [filterCategory, setFilterCategory] = useState("");

  // --- Modal States ---
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalData, setModalData] = useState<Nomination | null>(null);

  // --- Helpers ---
  const getFacultyName = (id: number) => {
      const found = STATIC_FACULTIES.find(f => f.id === id);
      return found ? found.name : `-`;
  };

  const getResolution = (votes: VoteSummary) => {
      const total = votes.total_voters || 1; // Prevent division by zero
      const threshold = total / 2;
      const isPassed = votes.approve > threshold;
      return {
        isPassed,
        label: isPassed ? "เห็นชอบตามเสนอ" : "ไม่เห็นชอบ",
        colorClass: isPassed 
          ? "bg-green-100 text-green-700 border border-green-200" 
          : "bg-red-100 text-red-700 border border-red-200"
      };
  };

  // ==========================================
  // 4. Effects (Fetch Data using Service)
  // ==========================================

  useEffect(() => {
    let isMounted = true;
    const fetchData = async () => {
      setLoading(true);
      try {
        const token = localStorage.getItem("accessToken");
        const params: Record<string, string> = {};
        if (searchTerm) params.q = searchTerm;
        if (filterCategory) params.award_type = filterCategory;

        const data = await chairmanService.getCandidates(token, params);

        if (isMounted) {
            setCandidates(data);
        }

      } catch (error) {
        console.warn("API Error:", error);
        if (isMounted) {
             Swal.fire({
                icon: 'error',
                title: 'ไม่สามารถดึงข้อมูลได้',
                text: 'กรุณาลองใหม่อีกครั้ง',
                toast: true,
                position: 'top-end',
                showConfirmButton: false,
                timer: 3000
            });
        }
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    fetchData();
    return () => { isMounted = false; };
  }, [searchTerm, filterCategory]);

  // ==========================================
  // 5. Logic: Filter
  // ==========================================

  // (Already handled by Service/Mock Filter, but double-check if needed for client-side sorting later)
  const filteredData = candidates; 

  // ==========================================
  // 6. Handlers
  // ==========================================

  const handleViewDetail = (item: Nomination) => {
    setModalData(item);
    setIsModalOpen(true);
  };

  const handleSign = async (id: number, name: string) => {
    // Advanced Validation
    if (!id) return;

    // SweetAlert Confirm
    const result = await Swal.fire({
        title: 'ยืนยันการลงนาม?',
        text: `คุณต้องการรับรองผลการพิจารณาของ "${name}" ใช่หรือไม่?`,
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#3085d6',
        cancelButtonColor: '#d33',
        confirmButtonText: 'ยืนยันลงนาม',
        cancelButtonText: 'ยกเลิก'
    });

    if (!result.isConfirmed) return;

    setSigningId(id);

    try {
        const token = localStorage.getItem("accessToken");
        await chairmanService.signNomination(token, id);

        // Update UI Optimistically
        setCandidates((prev) =>
            prev.map((item) =>
                item.form_id === id
                ? { 
                    ...item, 
                    is_signed: true, 
                    signed_date: new Date().toISOString() 
                  }
                : item
            )
        );

        // --- Show Toast Notification ---
        const Toast = Swal.mixin({
            toast: true,
            position: 'top-end',
            showConfirmButton: false,
            timer: 3000,
            timerProgressBar: true,
            didOpen: (toast) => {
                toast.addEventListener('mouseenter', Swal.stopTimer)
                toast.addEventListener('mouseleave', Swal.resumeTimer)
            }
        });

        Toast.fire({
            icon: 'success',
            title: 'ลงนามสำเร็จ',
            text: `รับรองผลการพิจารณาของ ${name} เรียบร้อยแล้ว`
        });

    } catch (error) {
        console.error(error);
        Swal.fire({
            icon: 'error',
            title: 'เกิดข้อผิดพลาด',
            text: 'ไม่สามารถบันทึกการลงนามได้'
        });
    } finally {
        setSigningId(null);
    }
  };

  // ==========================================
  // 7. Render UI
  // ==========================================

  return (
    <div className="min-h-screen bg-gray-50/50 p-8 font-sans pb-24">
      
      {/* Inject Keyframes */}
      <style jsx global>{`
        @keyframes fadeInUp {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fade-in-up {
          animation: fadeInUp 0.4s ease-out forwards;
        }
        .animate-fade-in {
          animation: fadeIn 0.5s ease-out forwards;
        }
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
      `}</style>

      {/* Header Section */}
      <div className="bg-white/80 backdrop-blur-md rounded-2xl shadow-lg border border-white/50 p-8 mb-8 animate-fade-in-up flex flex-col md:flex-row justify-between items-end gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600">รับรองผลการคัดเลือก</h1>
          <p className="text-gray-500 mt-1 font-medium">
            {USE_MOCK_DATA && <span className="bg-yellow-100 text-yellow-800 text-xs px-2 py-1 rounded mr-2">MOCK MODE</span>}
            ตรวจสอบคะแนนโหวตและลงนามรับรองมติที่ประชุม
          </p>
        </div>
        <div className="bg-blue-50/50 px-5 py-3 rounded-xl border border-blue-100 text-right">
            <p className="text-[10px] text-gray-400 uppercase font-bold tracking-wider">สถานะปัจจุบัน</p>
            <p className="text-sm font-bold text-blue-600 flex items-center gap-2 justify-end">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-500"></span>
                </span>
                ปิดโหวต / รอรับรอง
            </p>
        </div>
      </div>

      {/* Main Card */}
      <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden animate-fade-in-up" style={{ animationDelay: '100ms' }}>
        
        {/* Toolbar */}
        <div className="p-6 border-b border-gray-100 bg-gray-50/50 flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative group">
                <input 
                    type="text" 
                    placeholder="ค้นหาชื่อ หรือ รหัสนิสิต" 
                    className="w-full bg-white border border-gray-200 rounded-xl px-4 py-3 pl-10 text-sm focus:ring-4 focus:ring-blue-100 focus:border-blue-300 outline-none transition-all shadow-sm group-hover:shadow-md"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                />
                <svg className="w-5 h-5 absolute left-3 top-3 text-gray-400 group-focus-within:text-blue-500 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/></svg>
            </div>
            <div className="relative group md:w-1/3">
                <select 
                    className="w-full bg-white border border-gray-200 rounded-xl px-4 py-3 text-sm outline-none cursor-pointer focus:ring-4 focus:ring-blue-100 focus:border-blue-300 transition-all shadow-sm group-hover:shadow-md appearance-none text-gray-600"
                    value={filterCategory}
                    onChange={(e) => setFilterCategory(e.target.value)}
                >
                    <option value="">ทุกประเภทรางวัล</option>
                    <option value="ด้านความคิดสร้างสรรค์และนวัตกรรม">ด้านความคิดสร้างสรรค์และนวัตกรรม</option>
                    <option value="ด้านความประพฤติดี">ด้านความประพฤติดี</option>
                    <option value="ด้านกิจกรรมเสริมหลักสูตร">ด้านกิจกรรมเสริมหลักสูตร</option>
                </select>
                <svg className="w-4 h-4 absolute right-4 top-3.5 text-gray-400 pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
            </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto min-h-[400px]">
            <table className="w-full text-left border-collapse">
            <thead className="bg-gray-50/80 text-gray-500 text-xs font-bold uppercase tracking-wider border-b border-gray-200">
                <tr>
                <th className="p-5 w-[25%]">ผู้ได้รับการเสนอชื่อ</th>
                <th className="p-5 text-center w-[15%]">คะแนนโหวต</th>
                <th className="p-5 text-center w-[20%]">สรุปผลคะแนน</th>
                <th className="p-5 text-center w-[15%]">มติที่ประชุม</th>
                <th className="p-5 text-center w-[15%]">การดำเนินการ</th>
                <th className="p-5 text-center w-[10%]">รายละเอียด</th>
                </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 text-sm bg-white">
                {loading ? (
                    <TableSkeleton />
                ) : filteredData.length === 0 ? (
                    <tr><td colSpan={6} className="p-10 text-center text-gray-400 flex flex-col items-center gap-2 py-20"><svg className="w-10 h-10 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path></svg>ไม่พบรายการ</td></tr>
                ) : (
                filteredData.map((item, index) => {
                    const resolution = getResolution(item.vote_summary);
                    const fullName = `${item.student_firstname} ${item.student_lastname}`;
                    const approvePercent = item.vote_summary.total_voters > 0 
                        ? (item.vote_summary.approve / item.vote_summary.total_voters) * 100 
                        : 0;
                    
                    return (
                        <tr 
                            key={item.form_id} 
                            className="group hover:bg-blue-50/30 transition-all duration-300 animate-fade-in-up hover:-translate-y-0.5 hover:shadow-sm"
                            style={{ animationDelay: `${index * 50}ms` }}
                        >
                            <td className="p-5">
                                <div className="font-bold text-gray-800 text-base">{fullName}</div>
                                <div className="text-xs text-gray-500 mt-1 font-medium">{item.student_number} <span className="text-gray-300 mx-1">|</span> {getFacultyName(item.faculty_id)}</div>
                                <div className="text-[10px] font-bold text-blue-600 mt-2 bg-blue-50 inline-block px-2 py-0.5 rounded border border-blue-100">{item.award_type_name}</div>
                            </td>
                            <td className="p-5 text-center align-middle">
                                <div className="flex flex-col items-center justify-center">
                                    <div className="text-2xl font-extrabold text-gray-700">
                                        {item.vote_summary.approve} <span className="text-gray-400 text-sm font-medium">/ {item.vote_summary.total_voters}</span>
                                    </div>
                                    <div className="text-[10px] font-bold text-gray-400 uppercase mt-1 tracking-wide">เสียงเห็นชอบ</div>
                                </div>
                            </td>
                            
                            {/* Vote Bar Section */}
                            <td className="p-5 align-middle">
                                <div className="w-full h-3 rounded-full overflow-hidden shadow-inner bg-gray-200 flex">
                                    <div 
                                        className="h-full bg-gradient-to-r from-emerald-400 to-emerald-500 transition-all duration-1000 ease-out" 
                                        style={{ width: `${approvePercent}%` }}
                                    ></div>
                                    <div className="flex-1 bg-gradient-to-r from-red-400 to-red-500 transition-all duration-1000 ease-out"></div>
                                </div>
                                <div className="flex justify-between text-[10px] font-bold text-gray-500 mt-1.5">
                                    <span className="flex items-center gap-1 text-emerald-600"><span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>เห็นชอบ: {item.vote_summary.approve}</span>
                                    <span className="flex items-center gap-1 text-red-600"><span className="w-1.5 h-1.5 rounded-full bg-red-500"></span>ไม่เห็นชอบ: {item.vote_summary.reject + item.vote_summary.abstain}</span>
                                </div>
                            </td>

                            <td className="p-5 text-center align-middle">
                                <span className={`inline-flex items-center px-3 py-1.5 rounded-full text-xs font-bold shadow-sm ${resolution.colorClass}`}>
                                    {resolution.isPassed && <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7"/></svg>}
                                    {!resolution.isPassed && <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M6 18L18 6M6 6l12 12"/></svg>}
                                    {resolution.label}
                                </span>
                            </td>
                            <td className="p-5 text-center align-middle">
                                {item.is_signed ? (
                                    <div className="flex flex-col items-center animate-fade-in">
                                        <div className="flex items-center gap-1 text-emerald-600 font-bold text-sm bg-emerald-50 px-3 py-1 rounded-lg border border-emerald-100">
                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                                            รับรองแล้ว
                                        </div>
                                        <span className="text-[10px] text-gray-400 mt-1 font-mono">
                                            {item.signed_date ? new Date(item.signed_date).toLocaleDateString('th-TH') : ''}
                                        </span>
                                    </div>
                                ) : (
                                    <button 
                                        onClick={() => handleSign(item.form_id, fullName)}
                                        disabled={signingId === item.form_id}
                                        className={`bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold px-5 py-2.5 rounded-xl shadow-md hover:shadow-lg transition-all transform active:scale-95 flex items-center gap-2 mx-auto ${signingId === item.form_id ? 'opacity-70 cursor-not-allowed' : ''}`}
                                    >
                                        {signingId === item.form_id ? (
                                            <>
                                                <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                                บันทึก...
                                            </>
                                        ) : (
                                            <>
                                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>
                                                ลงนาม
                                            </>
                                        )}
                                    </button>
                                )}
                            </td>
                            <td className="p-5 text-center align-middle">
                                <button 
                                    onClick={() => handleViewDetail(item)}
                                    className="text-gray-400 hover:text-blue-600 p-2.5 rounded-full hover:bg-blue-50 transition-all transform hover:scale-110 shadow-sm hover:shadow-md border border-transparent hover:border-blue-100"
                                    title="ดูรายละเอียด"
                                >
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
                                </button>
                            </td>
                        </tr>
                    );
                })
                )}
            </tbody>
            </table>
        </div>
      </div>

      {/* Static Faculties & Departments are passed here */}
      <NominationDetailModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        data={modalData} 
        faculties={STATIC_FACULTIES.map(f => ({ faculty_id: f.id, faculty_name: f.name }))}
        departments={STATIC_DEPARTMENTS.map(d => ({ department_id: d.id, department_name: d.name, faculty_id: 0 }))} 
      />

    </div>
  );
}