"use client";

import { useState, useEffect } from "react";
import StaffDetailModal from "../../../components/staff-detail-modals";

type CommitteeRole = "none" | "committee" | "chairman";

interface Staff {
  id: number;
  name: string;
  faculty: string;
  department: string;
  role: CommitteeRole;
  email: string;

  phone?: string;
  position?: string;
  expertise?: string;
  image?: string;
}

export default function CommitteeSetupPage() {
  // State
  const [staffList, setStaffList] = useState<Staff[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterFaculty, setFilterFaculty] = useState("all");

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalData, setModalData] = useState<Staff | null>(null);

  // Fetch Data
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        // [API] ดึงรายชื่อบุคลากร (GET)
        /*
        const token = localStorage.getItem("token");
        const params = new URLSearchParams();
        if (searchTerm) params.append("q", searchTerm); // ค้นหาชื่อ
        if (filterFaculty !== 'all') params.append("faculty", filterFaculty); // กรองคณะ

        const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/sdd/staffs?${params.toString()}`, {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${token}`
          }
        });

        if (!response.ok) {
            if (response.status === 401) { window.location.href = "/login"; return; }
            throw new Error("Failed to fetch staff list");
        }
        
        const result = await response.json();
        setStaffList(result.data); // สมมติว่า Backend ส่งกลับมาเป็น { data: Staff[] }
        setLoading(false);
        return; // ออกจากฟังก์ชันเพื่อไม่ให้ไปรัน Mock Data ด้านล่าง
        */

        // MOCKUP DATA
        const mockData: Staff[] = [
            { 
                id: 1, name: "ศ.ดร. สมเกียรติ (ประธาน)", faculty: "วิศวกรรมศาสตร์", department: "วิศวกรรมคอมพิวเตอร์", role: "chairman", email: "somkiat@ku.th",
                position: "ศาสตราจารย์", phone: "081-111-1111", expertise: "Artificial Intelligence, Machine Learning"
            },
            { 
                id: 2, name: "ผศ.ดร. นุดี (กรรมการ)", faculty: "วิทยาศาสตร์", department: "เคมี", role: "committee", email: "nudee@ku.th",
                position: "ผู้ช่วยศาสตราจารย์", phone: "082-222-2222", expertise: "Organic Chemistry, Polymer Science"
            },
            { 
                id: 3, name: "รศ. มานะ (กรรมการ)", faculty: "เกษตร", department: "พืชไร่", role: "committee", email: "mana@ku.th",
                position: "รองศาสตราจารย์", phone: "083-333-3333", expertise: "Plant Breeding, Genetics"
            },
            { 
                id: 4, name: "อ. ใจดี (ทั่วไป)", faculty: "มนุษยศาสตร์", department: "ภาษาอังกฤษ", role: "none", email: "jaidee@ku.th",
                position: "อาจารย์", phone: "084-444-4444", expertise: "English Linguistics"
            },
            { 
                id: 5, name: "ดร. วีระ (ทั่วไป)", faculty: "ศึกษาศาสตร์", department: "พลศึกษา", role: "none", email: "weera@ku.th",
                position: "อาจารย์", phone: "085-555-5555", expertise: "Sports Science"
            },
            { 
                id: 6, name: "ผศ. ปิติ (กรรมการ)", faculty: "บริหารธุรกิจ", department: "การตลาด", role: "committee", email: "piti@ku.th",
                position: "ผู้ช่วยศาสตราจารย์", phone: "086-666-6666", expertise: "Digital Marketing"
            },
        ];
        
        setStaffList(mockData);
        setLoading(false);

      } catch (error) {
        console.error("Error loading staff:", error);
        setLoading(false);
      }
    };
    fetchData();
  }, [searchTerm, filterFaculty]);

  // Logic: View Detail
  const handleViewDetail = (staff: Staff) => {
    setModalData(staff);
    setIsModalOpen(true);
  };

  // Logic: เปลี่ยนบทบาท
  const handleRoleChange = (id: number, newRole: CommitteeRole) => {
    setStaffList((prevList) => {
      let updatedList = [...prevList];

      // ถ้าตั้งคนใหม่เป็น "ประธาน" -> ต้องปลดคนเก่าออกก่อน (เพราะประธานมีได้คนเดียว)
      if (newRole === "chairman") {
        updatedList = updatedList.map((user) => 
          user.role === "chairman" ? { ...user, role: "committee" } : user
        );
      }

      // อัปเดตบทบาทคนปัจจุบัน
      updatedList = updatedList.map((user) => 
        user.id === id ? { ...user, role: newRole } : user
      );

      return updatedList;
    });
  };

  // Logic: บันทึกข้อมูล
  const handleSave = async () => {
    const chairman = staffList.find(s => s.role === "chairman");
    const committees = staffList.filter(s => s.role === "committee");

    // Validation Check
    if (!chairman) {
      alert("กรุณาแต่งตั้ง 'ประธานคณะกรรมการ' อย่างน้อย 1 ท่าน");
      return;
    }
    if (committees.length === 0) {
      alert("กรุณาแต่งตั้ง 'กรรมการ' อย่างน้อย 1 ท่าน");
      return;
    }

    if (confirm(`ยืนยันการแต่งตั้งคณะกรรมการ?\n\nประธาน: ${chairman.name}\nกรรมการ: ${committees.length} ท่าน`)) {
      
      // [API] บันทึกการตั้งค่า (POST/PUT)
      /*
      try {
        const token = localStorage.getItem("token");
        
        // Payload ที่จะส่งไปหลังบ้าน
        const payload = {
            chairmanId: chairman.id,
            committeeIds: committees.map(c => c.id), // ส่งเฉพาะ ID ของกรรมการไปเป็น Array
            academicYear: new Date().getFullYear() + 543 // หรือดึงจาก Setting State
        };

        const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/sdd/committee/setup`, {
            method: "POST", // หรือ PUT ตามที่ Backend ออกแบบ
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${token}`
            },
            body: JSON.stringify(payload)
        });

        if (!response.ok) throw new Error("Failed to save committee setup");

        alert("บันทึกรายชื่อคณะกรรมการเรียบร้อยแล้ว");
        
      } catch (error) {
        console.error("Save error:", error);
        alert("เกิดข้อผิดพลาดในการบันทึกข้อมูล กรุณาลองใหม่อีกครั้ง");
      }
      */

      // Mockup Success
      console.log("Saving", { chairman, committees });
      alert("บันทึกรายชื่อคณะกรรมการเรียบร้อยแล้ว (Mockup)");
    }
  };

  // Filtering (Client Side Fallback)
  // ถ้าใช้ API Filtering แล้ว ส่วนนี้อาจไม่จำเป็น หรือใช้ช่วยกรองเบื้องต้น
  const filteredList = staffList.filter((item) => {
    const matchSearch = item.name.includes(searchTerm) || item.faculty.includes(searchTerm);
    const matchFaculty = filterFaculty === "all" ? true : item.faculty === filterFaculty;
    return matchSearch && matchFaculty;
  });

  // Stats Calculation
  const currentChairman = staffList.find(s => s.role === "chairman");
  const committeeCount = staffList.filter(s => s.role === "committee").length;

  return (
    <div className="min-h-screen bg-gray-50 p-8 font-sans pb-24">
      
      {/* Header & Stats */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-800 mb-2">แต่งตั้งคณะกรรมการพิจารณา</h1>
        <p className="text-sm text-gray-500 mb-6">จัดการรายชื่ออาจารย์เพื่อทำหน้าที่เป็นคณะกรรมการคัดเลือกนิสิตดีเด่น</p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Card 1: ประธาน */}
            <div className={`p-4 rounded-xl border flex items-center gap-4 shadow-sm ${currentChairman ? 'bg-orange-50 border-orange-200' : 'bg-white border-gray-200 border-dashed'}`}>
                <div className={`w-12 h-12 rounded-full flex items-center justify-center ${currentChairman ? 'bg-orange-100 text-orange-600' : 'bg-gray-100 text-gray-400'}`}>
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                </div>
                <div>
                    <p className="text-xs text-gray-500 uppercase font-semibold">ประธานคณะกรรมการ</p>
                    <p className={`font-bold ${currentChairman ? 'text-orange-700 text-lg' : 'text-gray-400 text-sm'}`}>
                        {currentChairman ? currentChairman.name : "ยังไม่ระบุ"}
                    </p>
                </div>
            </div>

            {/* Card 2: กรรมการ */}
            <div className="p-4 rounded-xl border border-blue-200 bg-blue-50 flex items-center gap-4 shadow-sm">
                <div className="w-12 h-12 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center">
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                </div>
                <div>
                    <p className="text-xs text-gray-500 uppercase font-semibold">จำนวนกรรมการ</p>
                    <p className="font-bold text-blue-700 text-lg">{committeeCount} ท่าน</p>
                </div>
            </div>
        </div>
      </div>

      {/* Main Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        
        {/* Filters */}
        <div className="p-5 border-b border-gray-100 bg-gray-50/50 flex gap-4">
            <input 
                type="text" placeholder="ค้นหาชื่ออาจารย์" 
                className="flex-1 bg-white border border-gray-300 rounded-lg px-4 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)}
            />
            <select 
                className="bg-white border border-gray-300 rounded-lg px-4 py-2 text-sm outline-none cursor-pointer"
                value={filterFaculty} onChange={(e) => setFilterFaculty(e.target.value)}
            >
                <option value="all">ทุกคณะ</option>
                <option value="วิศวกรรมศาสตร์">วิศวกรรมศาสตร์</option>
                <option value="วิทยาศาสตร์">วิทยาศาสตร์</option>
                <option value="มนุษยศาสตร์">มนุษยศาสตร์</option>
            </select>
        </div>

        <table className="w-full text-left border-collapse">
          <thead className="bg-gray-100 text-gray-600 text-xs uppercase tracking-wider font-semibold">
            <tr>
              <th className="p-4 w-[40%]">ชื่อ-นามสกุล</th>
              <th className="p-4 w-[30%]">สังกัด</th>
              <th className="p-4 text-center w-[15%]">รายละเอียด</th>
              <th className="p-4 text-center w-[15%]">กำหนดบทบาท</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 text-sm">
            {loading ? (
               <tr><td colSpan={4} className="p-8 text-center text-gray-400">กำลังโหลดรายชื่อ</td></tr>
            ) : filteredList.length === 0 ? (
               <tr><td colSpan={4} className="p-8 text-center text-gray-400">ไม่พบรายชื่อ</td></tr>
            ) : (
                filteredList.map((item) => (
                    <tr key={item.id} className={`transition-colors ${item.role !== 'none' ? 'bg-gray-50' : 'hover:bg-white'}`}>
                        {/* ชื่อ */}
                        <td className="p-4">
                            <div className="font-bold text-gray-800">{item.name}</div>
                            <div className="text-xs text-gray-400">{item.email}</div>
                        </td>

                        {/* สังกัด */}
                        <td className="p-4 text-gray-600">
                            {item.faculty} <br/> <span className="text-xs text-gray-400">{item.department}</span>
                        </td>

                        {/* ปุ่มดูรายละเอียด */}
                        <td className="p-4 text-center">
                            <button 
                                onClick={() => handleViewDetail(item)}
                                className="text-gray-400 hover:text-blue-600 p-2 rounded-full hover:bg-blue-50 transition-all"
                                title="ดูรายละเอียดบุคลากร"
                            >
                                <svg className="w-5 h-5 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
                            </button>
                        </td>

                        {/* Dropdown กำหนดบทบาท */}
                        <td className="p-4 text-center">
                            <select 
                                className={`border rounded-lg px-3 py-2 text-sm font-medium outline-none cursor-pointer transition-all w-48
                                    ${item.role === 'chairman' ? 'bg-orange-100 text-orange-700 border-orange-300 ring-2 ring-orange-100' : 
                                      item.role === 'committee' ? 'bg-blue-100 text-blue-700 border-blue-300' : 
                                      'bg-white text-gray-500 border-gray-300'}`}
                                value={item.role}
                                onChange={(e) => handleRoleChange(item.id, e.target.value as CommitteeRole)}
                            >
                                <option value="none">--- ไม่แต่งตั้ง ---</option>
                                <option value="committee">กรรมการ</option>
                                <option value="chairman">ประธานคณะกรรมการ</option>
                            </select>
                        </td>
                    </tr>
                ))
            )}
          </tbody>
        </table>
      </div>

      {/* Sticky Save Bar */}
      <div className="fixed bottom-0 left-0 w-full bg-white border-t border-gray-200 p-4 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)] z-20">
        <div className="max-w-7xl mx-auto flex justify-between items-center pl-[300px]">
            <div className="text-sm text-gray-600">
                สรุป: ประธาน <span className="font-bold text-black">{currentChairman ? 1 : 0}</span> ท่าน, 
                กรรมการ <span className="font-bold text-black">{committeeCount}</span> ท่าน
            </div>
            <button 
                onClick={handleSave}
                className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-bold shadow-lg transition-all flex items-center gap-2"
            >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" /></svg>
                บันทึกการแต่งตั้ง
            </button>
        </div>
      </div>

      {/* เรียกใช้ Modal */}
      <StaffDetailModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        data={modalData} 
      />

    </div>
  );
}