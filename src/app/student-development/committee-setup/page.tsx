"use client";

import { useState, useEffect, useMemo } from "react";
import { api } from "@/lib/axios"; 
import Swal from "sweetalert2";

// ==========================================
// 0. Configuration & Types
// ==========================================

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
  img_url?: string;
}

// ==========================================
// 1. Components
// ==========================================

const RoleBadge = ({ role }: { role: CommitteeRole }) => {
  if (role === 'chairman') return <span className="px-3 py-1 rounded-full text-xs font-bold bg-orange-100 text-orange-700 border border-orange-200 shadow-sm flex items-center gap-1 w-fit mx-auto"><span className="w-1.5 h-1.5 rounded-full bg-orange-500"></span>ประธาน</span>;
  if (role === 'committee') return <span className="px-3 py-1 rounded-full text-xs font-bold bg-blue-100 text-blue-700 border border-blue-200 shadow-sm flex items-center gap-1 w-fit mx-auto"><span className="w-1.5 h-1.5 rounded-full bg-blue-500"></span>กรรมการ</span>;
  return <span className="px-3 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-500 border border-gray-200 mx-auto block w-fit">-</span>;
};

const SkeletonLoader = () => (
  <div className="space-y-4">
    {[1, 2, 3, 4, 5].map((i) => (
      <div key={i} className="bg-white p-4 rounded-xl border border-gray-100 flex items-center gap-4 animate-pulse">
        <div className="w-12 h-12 bg-gray-200 rounded-full"></div>
        <div className="flex-1 space-y-2">
          <div className="h-4 bg-gray-200 rounded w-1/3"></div>
          <div className="h-3 bg-gray-200 rounded w-1/4"></div>
        </div>
        <div className="w-32 h-10 bg-gray-200 rounded-lg"></div>
      </div>
    ))}
  </div>
);

// ==========================================
// 2. Main Page Component
// ==========================================

export default function CommitteeSetupPage() {
  
  // --- States ---
  const [staffList, setStaffList] = useState<Staff[]>([]);
  const [faculties, setFaculties] = useState<any[]>([]); 
  
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterFaculty, setFilterFaculty] = useState("all");

  // --- Fetch Data ---
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const [usersRes, facRes, deptRes] = await Promise.all([
          api.get("/users/"),
          api.get("/faculty/").catch(() => ({ data: { data: [] } })),
          api.get("/department/").catch(() => ({ data: { data: [] } }))
        ]);

        const rawUsers = usersRes.data?.data || usersRes.data || [];
        const rawFaculties = facRes.data?.data || facRes.data || [];
        const rawDepartments = deptRes.data?.data || deptRes.data || [];

        setFaculties(rawFaculties);

        // ✅ 1. กรองเอาเฉพาะ Role 6 (คณะกรรมการ) เท่านั้น (หรือคนที่เกี่ยวข้อง)
        const staffs = rawUsers.filter((u: any) => u.role_id === 6);
        
        // 2. Map ข้อมูลและแยกประธานออกจากกรรมการด้วย is_chairman
        const mappedStaffs = staffs.map((u: any) => {
          let role: CommitteeRole = "committee"; 
          
          if (u.is_chairman || u.CommitteeData?.IsChairman || u.CommitteeData?.is_chairman) {
              role = "chairman";
          }

          const fac = rawFaculties.find((f: any) => f.faculty_id === u.faculty_id);
          const dept = rawDepartments.find((d: any) => d.department_id === u.department_id);

          return {
            id: u.user_id,
            name: `${u.prefix || ''}${u.firstname} ${u.lastname}`.trim(),
            faculty: fac ? fac.faculty_name : "ไม่ระบุ",
            department: dept ? dept.department_name : "ไม่ระบุ",
            role: role,
            email: u.email,
            position: "บุคลากร"
          };
        });

        setStaffList(mappedStaffs);
      } catch (error) {
        console.error("Failed to fetch data:", error);
        Swal.fire({ icon: 'error', title: 'โหลดข้อมูลไม่สำเร็จ', text: 'ไม่สามารถดึงข้อมูลผู้ใช้ได้ (กรุณาตรวจสอบการ Login)' });
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  // --- Computed Stats ---
  const chairman = staffList.find(s => s.role === 'chairman');
  const committeeCount = staffList.filter(s => s.role === 'committee').length;

  // --- Filters ---
  const filteredList = useMemo(() => {
    return staffList.filter(staff => {
      const matchSearch = staff.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          staff.department.toLowerCase().includes(searchTerm.toLowerCase());
      const matchFaculty = filterFaculty === 'all' ? true : staff.faculty === filterFaculty;
      return matchSearch && matchFaculty;
    });
  }, [staffList, searchTerm, filterFaculty]);

  // --- Handlers ---
  const handleRoleChange = (id: number, newRole: CommitteeRole) => {
    setStaffList(prev => {
      let updated = [...prev];
      
      if (newRole === 'chairman') {
        // ถ้าเลือกคนใหม่เป็นประธาน ให้ประธานคนเก่ากลับไปเป็น "กรรมการ (committee)" แทน
        updated = updated.map(s => s.role === 'chairman' ? { ...s, role: 'committee' } : s);
      }

      // Update user role
      return updated.map(s => s.id === id ? { ...s, role: newRole } : s);
    });
  };

  const handleSave = async () => {
    if (!chairman) {
      return Swal.fire({ 
          icon: 'warning', 
          title: 'ข้อมูลไม่ครบถ้วน', 
          text: 'กรุณาแต่งตั้ง "ประธานคณะกรรมการ" อย่างน้อย 1 ท่าน', 
          confirmButtonColor: '#F59E0B' 
      });
    }
    if (committeeCount === 0) {
      return Swal.fire({ 
          icon: 'warning', 
          title: 'ข้อมูลไม่ครบถ้วน', 
          text: 'กรุณาแต่งตั้ง "กรรมการ" อย่างน้อย 1 ท่าน', 
          confirmButtonColor: '#F59E0B' 
      });
    }

    const result = await Swal.fire({
      title: 'ยืนยันการแต่งตั้ง?',
      html: `
        <div class="text-left text-sm bg-gray-50 p-4 rounded-lg border border-gray-200">
          <p class="mb-1"><strong>ประธาน:</strong> <span class="text-orange-600">${chairman.name}</span></p>
          <p><strong>กรรมการ:</strong> <span class="text-blue-600">${committeeCount} ท่าน</span></p>
        </div>
      `,
      icon: 'question',
      showCancelButton: true,
      confirmButtonColor: '#10B981',
      confirmButtonText: 'ยืนยันและบันทึก',
      cancelButtonText: 'ยกเลิก'
    });

    if (result.isConfirmed) {
      setSaving(true);
      try {
        // ✅ ปรับการยิง API ให้ตรงกับ Route ของฝั่ง Go (PUT /users/...)
        const updatePromises = staffList.map(staff => {
          if (staff.role === 'chairman') {
            // 1. เรียก API เลื่อนขั้นเป็นประธาน
            return api.put(`/users/promote-chairman/${staff.id}`);
          } else if (staff.role === 'committee') {
            // 2. อัปเดตให้เป็นกรรมการปกติ (ใช้ /users/update/:id)
            return api.put(`/users/update/${staff.id}`, { 
              role_id: 6, 
              is_chairman: false 
            });
          } else {
            // 3. กรณี role เป็น 'none' (ถอดจากกรรมการ)
            // หมายเหตุ: กรณีนี้ปรับ role_id ให้เป็นของบุคลากรปกติ เช่น 2 (ถ้าในระบบคุณใช้เลขอื่น สามารถแก้ได้เลยครับ)
            return api.put(`/users/update/${staff.id}`, { 
              role_id: 2, 
              is_chairman: false 
            });
          }
        });

        // รอให้อัปเดตเสร็จทุกคนพร้อมกัน
        await Promise.all(updatePromises);

        Swal.fire({ icon: 'success', title: 'บันทึกสำเร็จ', timer: 1500, showConfirmButton: false });
        
      } catch (error: any) {
        console.error(error);
        Swal.fire({ 
          icon: 'error', 
          title: 'บันทึกไม่สำเร็จ', 
          text: error.response?.data?.message || 'เกิดข้อผิดพลาดในการเชื่อมต่อกับเซิร์ฟเวอร์' 
        });
      } finally {
        setSaving(false);
      }
    }
  };

  // ==========================================
  // Render
  // ==========================================
  return (
    <div className="min-h-screen bg-[#F8F9FA] p-8 pb-32 font-sans text-gray-800 animate-fade-in-up">
      
      {/* CSS Animation Injection */}
      <style jsx global>{`
        @keyframes fadeInUp { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
        .animate-fade-in-up { animation: fadeInUp 0.5s ease-out forwards; }
      `}</style>

      {/* Header & Stats */}
      <div className="max-w-6xl mx-auto space-y-8">
        <div className="flex flex-col md:flex-row justify-between items-end gap-4">
          <div>
            <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">แต่งตั้งคณะกรรมการ</h1>
            <p className="text-gray-500 mt-1">
                จัดการโครงสร้างคณะกรรมการพิจารณานิสิตดีเด่น
            </p>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          
          {/* Chairman Card */}
          <div className={`p-6 rounded-2xl border transition-all duration-300 flex items-center gap-5 shadow-sm hover:shadow-md ${chairman ? 'bg-white border-orange-200' : 'bg-gray-50 border-dashed border-gray-300'}`}>
            <div className={`w-14 h-14 rounded-full flex items-center justify-center text-2xl transition-colors ${chairman ? 'bg-orange-100 text-orange-600' : 'bg-gray-200 text-gray-400'}`}>
              <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" /></svg>
            </div>
            <div>
              <p className="text-xs text-gray-500 uppercase font-bold tracking-wider">ประธานคณะกรรมการ</p>
              <p className={`text-lg font-bold mt-0.5 ${chairman ? 'text-gray-900' : 'text-gray-400'}`}>
                {chairman ? chairman.name : "ยังไม่ได้รับการแต่งตั้ง"}
              </p>
            </div>
          </div>

          {/* Committee Count Card */}
          <div className="p-6 rounded-2xl bg-white border border-blue-100 shadow-sm hover:shadow-md transition-all duration-300 flex items-center gap-5">
            <div className="w-14 h-14 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center text-2xl">
              <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" /></svg>
            </div>
            <div>
              <p className="text-xs text-gray-500 uppercase font-bold tracking-wider">จำนวนกรรมการ</p>
              <div className="flex items-baseline gap-2">
                <p className="text-3xl font-extrabold text-blue-900">{committeeCount}</p>
                <p className="text-sm text-gray-500">ท่าน</p>
              </div>
            </div>
          </div>
        </div>

        {/* Filter Bar */}
        <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 flex flex-col md:flex-row gap-4 sticky top-4 z-20 backdrop-blur-md bg-white/90">
          <div className="relative flex-1 group">
            <svg className="w-5 h-5 absolute left-3 top-3 text-gray-400 group-hover:text-blue-500 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/></svg>
            <input 
              type="text" 
              placeholder="ค้นหาอาจารย์..." 
              className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-400 transition-all text-sm"
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
            />
          </div>
          <select 
            className="w-full md:w-64 px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-400 cursor-pointer text-sm"
            value={filterFaculty}
            onChange={e => setFilterFaculty(e.target.value)}
          >
            <option value="all">ทุกคณะ</option>
            {faculties.map((f: any) => <option key={f.faculty_id} value={f.faculty_name}>{f.faculty_name}</option>)}
          </select>
        </div>

        {/* Staff Table */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50/50 text-gray-500 text-xs font-bold uppercase tracking-wider border-b border-gray-100">
                  <th className="p-5">ชื่อ-นามสกุล</th>
                  <th className="p-5">สังกัด</th>
                  <th className="p-5 text-center">บทบาทปัจจุบัน</th>
                  <th className="p-5 text-center w-48">ตั้งค่า</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50 text-sm">
                {loading ? (
                  <tr><td colSpan={4} className="p-6"><SkeletonLoader /></td></tr>
                ) : filteredList.length === 0 ? (
                  <tr><td colSpan={4} className="p-16 text-center text-gray-400">ไม่พบรายชื่อที่ค้นหา</td></tr>
                ) : (
                  filteredList.map((staff, idx) => (
                    <tr 
                      key={staff.id} 
                      className={`group hover:bg-blue-50/30 transition-colors ${staff.role !== 'none' ? 'bg-blue-50/10' : ''}`}
                    >
                      <td className="p-5">
                        <div className="flex items-center gap-3">
                          <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold shadow-sm transition-colors
                            ${staff.role === 'chairman' ? 'bg-gradient-to-br from-orange-400 to-red-500 text-white' : 'bg-gray-200 text-gray-500 group-hover:bg-blue-200 group-hover:text-blue-700'}
                          `}>
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
                          </div>
                          <div>
                            <div className="font-bold text-gray-800">{staff.name}</div>
                            <div className="text-xs text-gray-400">{staff.email}</div>
                          </div>
                        </div>
                      </td>
                      <td className="p-5">
                        {/* เพิ่มคำว่า "สังกัด" ตามด้วยชื่อคณะตรงนี้ */}
                        <div className="text-gray-700">สังกัด {staff.faculty}</div>
                        <div className="text-xs text-gray-400">{staff.department}</div>
                      </td>
                      <td className="p-5 text-center">
                        <RoleBadge role={staff.role} />
                      </td>
                      <td className="p-5 text-center">
                        <div className="relative inline-block w-full">
                          <select 
                            value={staff.role}
                            onChange={(e) => handleRoleChange(staff.id, e.target.value as CommitteeRole)}
                            className={`
                              w-full px-3 py-2 rounded-lg text-xs font-bold border outline-none cursor-pointer appearance-none transition-all shadow-sm
                              ${staff.role === 'chairman' 
                                ? 'bg-orange-50 border-orange-200 text-orange-700 hover:border-orange-300' 
                                : staff.role === 'committee'
                                ? 'bg-blue-50 border-blue-200 text-blue-700 hover:border-blue-300'
                                : 'bg-white border-gray-200 text-gray-600 hover:border-gray-300'
                              }
                            `}
                          >
                            <option value="none">--- ไม่แต่งตั้ง ---</option>
                            <option value="committee">กรรมการ</option>
                            <option value="chairman">ประธาน</option>
                          </select>
                          <div className="absolute right-3 top-2.5 pointer-events-none text-current opacity-60">
                            <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M19 9l-7 7-7-7" /></svg>
                          </div>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Floating Save Button */}
      <div className={`fixed bottom-8 left-1/2 -translate-x-1/2 transition-all duration-500 z-30 ${saving ? 'scale-95 opacity-90' : 'scale-100'}`}>
        <button 
          onClick={handleSave}
          disabled={saving}
          className="bg-gray-900 hover:bg-black text-white px-8 py-3.5 rounded-full font-bold shadow-2xl flex items-center gap-3 transition-all hover:-translate-y-1 active:scale-95 disabled:cursor-wait disabled:opacity-70 border border-gray-700"
        >
          {saving ? (
            <>
              <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
              กำลังบันทึก...
            </>
          ) : (
            <>
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" /></svg>
              บันทึกการแต่งตั้ง
            </>
          )}
        </button>
      </div>

    </div>
  );
}