"use client";

import { useState, useEffect } from "react";

interface VoteSummary {
  approve: number;
  reject: number;
  abstain: number;
  totalVoters: number;
}

interface CandidateItem {
  id: number;
  name: string;
  studentId: string;
  faculty: string;
  category: string;
  voteSummary: VoteSummary;
  isSigned: boolean;
  signedDate?: string;
}

export default function ChairmanApprovalPage() {
  // --- State ---
  const [candidates, setCandidates] = useState<CandidateItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterCategory, setFilterCategory] = useState("");

  // --- Fetch Data ---
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        // =========================================================
        // [API Integration] ดึงข้อมูลผลคะแนน (GET)
        // =========================================================
        /*
        const token = localStorage.getItem("accessToken");
        const params = new URLSearchParams();
        if (searchTerm) params.append("search", searchTerm);
        if (filterCategory) params.append("category", filterCategory);

        // API นี้ควร return รายชื่อนิสิต พร้อม object 'voteSummary' ที่สรุปคะแนนมาให้แล้ว
        const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/chairman/candidates?${params.toString()}`, {
           method: "GET",
           headers: { 
             "Content-Type": "application/json",
             "Authorization": `Bearer ${token}` 
           }
        });

        if (!response.ok) throw new Error("Failed to fetch candidates");
        const result = await response.json();
        // setCandidates(result.data);
        */

        // =========================================================
        // [MOCKUP DATA]
        // =========================================================

        const mockData: CandidateItem[] = [
            {
                id: 1, name: "นายสมชาย ใจดี", studentId: "6610401234", faculty: "วิศวกรรมศาสตร์", category: "ด้านความคิดสร้างสรรค์และนวัตกรรม",
                voteSummary: { approve: 4, reject: 1, abstain: 0, totalVoters: 5 }, // 4/5 (ผ่าน)
                isSigned: false,
            },
            {
                id: 2, name: "นางสาวสมหญิง รักเรียน", studentId: "6610405678", faculty: "มนุษยศาสตร์", category: "ด้านความประพฤติดี",
                voteSummary: { approve: 5, reject: 0, abstain: 0, totalVoters: 5 }, // 5/5 (ผ่านเอกฉันท์)
                isSigned: true, signedDate: "2024-02-20T10:30:00",
            },
            {
                id: 3, name: "นายเก่ง กล้าหาญ", studentId: "6510409999", faculty: "เกษตร", category: "ด้านกิจกรรมเสริมหลักสูตร",
                voteSummary: { approve: 2, reject: 3, abstain: 0, totalVoters: 5 }, // 2/5 (ไม่ผ่าน)
                isSigned: false,
            },
            {
                id: 4, name: "นางสาวฟ้าใส ใจสะอาด", studentId: "6710403333", faculty: "บริหารธุรกิจ", category: "ด้านความประพฤติดี",
                voteSummary: { approve: 3, reject: 1, abstain: 1, totalVoters: 5 }, // 3/5 (ผ่าน)
                isSigned: false,
            },
        ];
        setCandidates(mockData);
        setLoading(false);

      } catch (error) {
        console.error("Error fetching data:", error);
        setLoading(false);
      }
    };
    fetchData();
  }, [searchTerm, filterCategory]);

  // --- Logic คำนวณผลมติ (Resolution) ---
  const getResolution = (votes: VoteSummary) => {
    const threshold = votes.totalVoters / 2;
    const isPassed = votes.approve > threshold;
    return {
      isPassed,
      label: isPassed ? "เห็นชอบตามเสนอ" : "ไม่เห็นชอบ",
      colorClass: isPassed 
        ? "bg-green-100 text-green-700 border border-green-200" 
        : "bg-red-100 text-red-700 border border-red-200"
    };
  };

  // --- Handle Sign Action ---
  const handleSign = async (id: number, name: string) => {
    if (confirm(`ยืนยันการลงนามรับรองผลการพิจารณาของ "${name}" ?\n\nเมื่อยืนยันแล้วจะไม่สามารถแก้ไขผลโหวตได้อีก`)) {
      try {
        // =========================================================
        // [API Integration] บันทึกการลงนาม (POST)
        // =========================================================
        /*
        const token = localStorage.getItem("accessToken");
        const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/chairman/sign`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${token}`
            },
            body: JSON.stringify({ candidateId: id })
        });

        if (!response.ok) throw new Error("Failed to sign");
        */

        // Mockup Update
        setCandidates((prev) =>
            prev.map((item) =>
                item.id === id
                ? { ...item, isSigned: true, signedDate: new Date().toISOString() }
                : item
            )
        );
        alert("ลงนามรับรองเรียบร้อยแล้ว");

      } catch (error) {
        console.error("Sign error:", error);
        alert("เกิดข้อผิดพลาดในการลงนาม");
      }
    }
  };

  // --- Filter Logic ---
  const filteredData = candidates.filter(item => {
    const matchSearch = item.name.includes(searchTerm) || item.studentId.includes(searchTerm);
    const matchCategory = filterCategory ? item.category === filterCategory : true;
    return matchSearch && matchCategory;
  });

  return (
    <div className="min-h-screen bg-gray-50 p-8 font-sans">
      
      {/* Header Section */}
      <div className="flex justify-between items-end mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">รับรองผลการคัดเลือก (Chairman Certification)</h1>
          <p className="text-sm text-gray-500 mt-1">ตรวจสอบคะแนนโหวตและลงนามรับรองมติที่ประชุม</p>
        </div>
        <div className="bg-white px-4 py-2 rounded-lg shadow-sm border border-gray-200 text-right">
            <p className="text-xs text-gray-400 uppercase font-semibold">สถานะปัจจุบัน</p>
            <p className="text-sm font-bold text-blue-600">ปิดโหวต / รอรับรอง</p>
        </div>
      </div>

      {/* Main Card */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        
        {/* Toolbar */}
        <div className="p-5 border-b border-gray-100 bg-gray-50/50 flex gap-4">
            <input 
                type="text" 
                placeholder="ค้นหาชื่อ หรือ รหัสนิสิต..." 
                className="flex-1 bg-white border border-gray-300 rounded-lg px-4 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
            />
            <select 
                className="bg-white border border-gray-300 rounded-lg px-4 py-2 text-sm outline-none cursor-pointer"
                value={filterCategory}
                onChange={(e) => setFilterCategory(e.target.value)}
            >
                <option value="">ทุกประเภทรางวัล</option>
                <option value="ด้านนวัตกรรม">ด้านความคิดสร้างสรรค์และนวัตกรรม</option>
                <option value="ด้านความประพฤติดี">ด้านความประพฤติดี</option>
                <option value="ด้านกิจกรรม">ด้านกิจกรรมเสริมหลักสูตร</option>
            </select>
        </div>

        {/* Table */}
        <table className="w-full text-left border-collapse">
          <thead className="bg-gray-100 text-gray-600 text-xs uppercase tracking-wider font-semibold">
            <tr>
              <th className="p-4 w-[25%]">ผู้ได้รับการเสนอชื่อ</th>
              <th className="p-4 text-center w-[15%]">คะแนนโหวต</th>
              <th className="p-4 text-center w-[20%]">สรุปผลคะแนน</th>
              <th className="p-4 text-center w-[20%]">มติที่ประชุม</th>
              <th className="p-4 text-center w-[20%]">การดำเนินการ</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 text-sm">
            {loading ? (
               <tr><td colSpan={5} className="p-8 text-center text-gray-400">กำลังประมวลผลคะแนน...</td></tr>
            ) : filteredData.length === 0 ? (
               <tr><td colSpan={5} className="p-8 text-center text-gray-400">ไม่พบรายการ</td></tr>
            ) : (
                filteredData.map((item) => {
                    const resolution = getResolution(item.voteSummary);
                    return (
                        <tr key={item.id} className="hover:bg-gray-50 transition-colors">
                            {/* 1. ข้อมูลนิสิต */}
                            <td className="p-4">
                                <div className="font-bold text-gray-800">{item.name}</div>
                                <div className="text-xs text-gray-500 mt-0.5">{item.studentId} | {item.faculty}</div>
                                <div className="text-xs text-blue-600 mt-1 bg-blue-50 inline-block px-1.5 py-0.5 rounded">{item.category}</div>
                            </td>

                            {/* 2. คะแนนดิบ */}
                            <td className="p-4 text-center align-middle">
                                <div className="flex flex-col items-center justify-center">
                                    <div className="text-xl font-bold text-gray-700">
                                        {item.voteSummary.approve} <span className="text-gray-400 text-sm font-normal">/ {item.voteSummary.totalVoters}</span>
                                    </div>
                                    <div className="text-[10px] text-gray-400 mt-1">เสียงเห็นชอบ</div>
                                </div>
                            </td>

                            {/* 3. Bar Chart Visualization */}
                            <td className="p-4 align-middle">
                                <div className="w-full bg-gray-200 rounded-full h-2.5 mb-1 overflow-hidden">
                                    <div 
                                        className={`h-2.5 rounded-full ${resolution.isPassed ? 'bg-green-500' : 'bg-red-500'}`} 
                                        style={{ width: `${(item.voteSummary.approve / item.voteSummary.totalVoters) * 100}%` }}
                                    ></div>
                                </div>
                                <div className="flex justify-between text-[10px] text-gray-500">
                                    <span>เห็นชอบ: {item.voteSummary.approve}</span>
                                    <span>ไม่เห็นชอบ: {item.voteSummary.reject}</span>
                                    <span>งด: {item.voteSummary.abstain}</span>
                                </div>
                            </td>

                            {/* 4. มติที่ประชุม (Badge) */}
                            <td className="p-4 text-center align-middle">
                                <span className={`px-3 py-1.5 rounded-full text-xs font-bold shadow-sm ${resolution.colorClass}`}>
                                    {resolution.label}
                                </span>
                            </td>

                            {/* 5. ปุ่ม Action (Sign) */}
                            <td className="p-4 text-center align-middle">
                                {item.isSigned ? (
                                    <div className="flex flex-col items-center animate-fade-in">
                                        <div className="flex items-center gap-1 text-green-600 font-bold text-sm">
                                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                                            รับรองแล้ว
                                        </div>
                                        <span className="text-[10px] text-gray-400 mt-0.5">
                                            {item.signedDate ? new Date(item.signedDate).toLocaleDateString('th-TH') : ''}
                                        </span>
                                    </div>
                                ) : (
                                    <button 
                                        onClick={() => handleSign(item.id, item.name)}
                                        className="bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold px-4 py-2 rounded-lg shadow-sm hover:shadow-md transition-all flex items-center gap-2 mx-auto"
                                    >
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>
                                        ลงนามรับรอง
                                    </button>
                                )}
                            </td>
                        </tr>
                    );
                })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}