"use client";

import { useState, useEffect } from "react";

interface User {
  user_id: number;
  firstname: string;
  lastname: string;
  email: string;
  image_path?: string;
  role_code: "admin" | "head_of_department" | "dean" | "associate_dean" | "chairman_of_student_development_committee" | "student_development_committee" | "student_development" | "student";
  student_number?: string;
  faculty_id?: number;
  department_id?: number;
  faculty_name?: string;     
  department_name?: string;  
  status: "active" | "inactive"; 
  
  avatarColor?: string;
}

interface Department {
  department_id: number;
  department_name: string;
}

interface Faculty {
  faculty_id: number;
  faculty_name: string;
  departments: Department[];
}

const roleConfig: Record<string, { label: string; color: string; bg: string }> = {
  admin: { label: "ผู้ดูเเลระบบ", color: "text-purple-700", bg: "bg-purple-50 border-purple-200" },
  head_of_department: { label: "หัวหน้าภาค", color: "text-indigo-700", bg: "bg-indigo-50 border-indigo-200" },
  dean: { label: "คณบดี", color: "text-orange-700", bg: "bg-orange-50 border-orange-200" },
  associate_dean: { label: "รองคณบดี", color: "text-orange-700", bg: "bg-orange-50 border-orange-200" },
  student_development: { label: "กองพัฒนานิสิต", color: "text-blue-700", bg: "bg-blue-50 border-blue-200" },
  student_development_committee: { label: "คณะกรรมการกองพัฒนานิสิตดีเด่น", color: "text-teal-700", bg: "bg-teal-50 border-teal-200" },
  chairman_of_student_development_committee: { label: "ประธานคณะกรรมการกองพัฒนานิสิตดีเด่น", color: "text-teal-700", bg: "bg-teal-50 border-teal-200" },
  student: { label: "นิสิต", color: "text-gray-700", bg: "bg-gray-50 border-gray-200" },
};

export default function AdminUserPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [faculties, setFaculties] = useState<Faculty[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterRole, setFilterRole] = useState("all");

  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 6;

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<"create" | "edit">("create");
  const [formData, setFormData] = useState<Partial<User>>({});

  // [API] Fetch Initial Data (Load on Mount)
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const token = localStorage.getItem("accessToken");
        const apiUrl = process.env.NEXT_PUBLIC_API_URL; // http://localhost:3000

        // เตรียม Request ทั้ง 2 ตัว
        const [resFaculties, resUsers] = await Promise.all([
            // 1. Fetch Master Data (Faculties)
            fetch(`${apiUrl}/api/master/faculties`, {
                method: "GET",
                // ถ้า API นี้เป็น Public ไม่ต้องส่ง Header ก็ได้ แต่ส่งเผื่อไว้
                headers: { 
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${token}` 
                } 
            }),
            // 2. Fetch Users Data
            fetch(`${apiUrl}/api/admin/users`, {
                method: "GET",
                headers: { 
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${token}` 
                }
            })
        ]);

        // ตรวจสอบว่ามี Request ตัวไหนพังหรือไม่
        if (!resFaculties.ok || !resUsers.ok) {
            throw new Error(`Failed to fetch data: Faculties(${resFaculties.status}), Users(${resUsers.status})`);
        }

        // แปลงข้อมูลเป็น JSON
        const dataFaculties = await resFaculties.json();
        const dataUsers = await resUsers.json();

        // อัปเดต State (คาดหวังโครงสร้าง { data: [...] })
        setFaculties(dataFaculties.data || []); 
        setUsers(dataUsers.data || []);

      } catch (error) {
        console.error("Fetch error:", error);
        alert("ไม่สามารถดึงข้อมูลได้ กรุณาลองใหม่อีกครั้ง(ใช้ mockup เเทน)");
        const mockFaculties: Faculty[] = [
            { 
                faculty_id: 1, faculty_name: "วิศวกรรมศาสตร์", 
                departments: [{ department_id: 101, department_name: "วิศวกรรมคอมพิวเตอร์" }, { department_id: 102, department_name: "วิศวกรรมไฟฟ้า" }] 
            },
            { 
                faculty_id: 2, faculty_name: "วิทยาศาสตร์", 
                departments: [{ department_id: 201, department_name: "วิทยาการคอมพิวเตอร์" }, { department_id: 202, department_name: "เคมี" }] 
            },
            { 
                faculty_id: 3, faculty_name: "มนุษยศาสตร์", 
                departments: [{ department_id: 301, department_name: "ภาษาอังกฤษ" }] 
            },
            { 
                faculty_id: 4, faculty_name: "ส่วนกลาง", 
                departments: [] 
            }
        ];
        setFaculties(mockFaculties);

        const mockUsers: User[] = [
            { user_id: 1, firstname: "System", lastname: "Admin", email: "admin@ku.th", role_code: "admin", faculty_name: "ส่วนกลาง", status: "active", avatarColor: "bg-purple-500" },
            { user_id: 2, firstname: "สมชาย", lastname: "ใจดี", email: "somchai@ku.th", role_code: "head_of_department", faculty_name: "วิศวกรรมศาสตร์", department_name: "วิศวกรรมคอมพิวเตอร์", faculty_id: 1, department_id: 101, status: "active", avatarColor: "bg-blue-500" },
            { user_id: 3, firstname: "เรียนดี", lastname: "มีวินัย", email: "std6601@ku.th", student_number: "6610401234", role_code: "student", faculty_name: "มนุษยศาสตร์", department_name: "ภาษาอังกฤษ", faculty_id: 3, department_id: 301, status: "inactive", avatarColor: "bg-green-500" },
            { user_id: 4, firstname: "สมศรี", lastname: "จนท.", email: "somsri@ku.th", role_code: "student_development", faculty_name: "ส่วนกลาง", faculty_id: 4, status: "active", avatarColor: "bg-pink-500" },
            { user_id: 5, firstname: "คณบดี", lastname: "ใจกว้าง", email: "dean@ku.th", role_code: "dean", faculty_name: "วิศวกรรมศาสตร์", faculty_id: 1, status: "active", avatarColor: "bg-orange-500" },
        ];
        setUsers(mockUsers);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // Reset Pagination
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, filterRole]);
  
  // Helper: Find Departments based on Faculty ID
  const getDepartmentsByFacultyId = (fid?: number) => {
    const found = faculties.find(f => f.faculty_id == fid);
    return found ? found.departments : [];
  };

  const handleOpenCreate = () => {
    setModalMode("create");
    setFormData({ role_code: "student", status: "active", avatarColor: "bg-gray-500" });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (user: User) => {
    setModalMode("edit");
    setFormData({ ...user });
    setIsModalOpen(true);
  };

  // [API] Delete User
  const handleDelete = async (id: number) => {
    if (confirm("คำเตือน: คุณต้องการลบบัญชีนี้อย่างถาวรใช่หรือไม่?")) {
        try {
            const token = localStorage.getItem("accessToken");
            /*
            await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/admin/users/${id}`, {
                method: "DELETE",
                headers: { "Authorization": `Bearer ${token}` }
            });
            */
            setUsers((prev) => prev.filter((u) => u.user_id !== id));
            alert("ลบบัญชีเรียบร้อยแล้ว");
        } catch (error) {
            alert("ลบไม่สำเร็จ");
        }
    }
  };

  // [API] Create / Update User
  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault(); 
    
    // Validation
    const duplicateEmail = users.find(u => u.email === formData.email && u.user_id !== formData.user_id);
    if (duplicateEmail) return alert(`อีเมล "${formData.email}" มีอยู่ในระบบแล้ว`);

    const actionText = modalMode === 'create' ? 'สร้างบัญชีใหม่' : 'บันทึกการแก้ไข';
    if (!confirm(`ยืนยันการ${actionText}?`)) return;

    try {
        const token = localStorage.getItem("accessToken");
        const apiUrl = process.env.NEXT_PUBLIC_API_URL;

        // เตรียมข้อมูลสำหรับส่งไป API
        const apiPayload = {
            firstname: formData.firstname,
            lastname: formData.lastname,
            email: formData.email,
            role_code: formData.role_code,
            status: formData.status,
            // ส่งค่าเฉพาะที่มีข้อมูล (Optional Fields)
            ...(formData.student_number && { student_number: formData.student_number }),
            ...(formData.faculty_id && { faculty_id: formData.faculty_id }),
            ...(formData.department_id && { department_id: formData.department_id }),
        };

        let savedUser: User;

        if (modalMode === "create") {
            // [API] CREATE USER (POST)
            const res = await fetch(`${apiUrl}/api/admin/users`, {
                method: "POST",
                headers: { 
                    "Content-Type": "application/json", 
                    "Authorization": `Bearer ${token}` 
                },
                body: JSON.stringify(apiPayload)
            });

            if (!res.ok) {
                const errorData = await res.json();
                throw new Error(errorData.message || "ไม่สามารถสร้างบัญชีผู้ใช้ได้");
            }

            const result = await res.json();
            savedUser = result.data; // ค่า User จริงที่ได้จาก DB (มี user_id มาด้วย)

            // อัปเดตตาราง: เพิ่มรายการใหม่ไปบนสุด
            setUsers([savedUser, ...users]); 

        } else {
            // [API] UPDATE USER (PUT)
            if (!formData.user_id) throw new Error("ไม่พบ User ID");

            const res = await fetch(`${apiUrl}/api/admin/users/${formData.user_id}`, {
                method: "PUT",
                headers: { 
                    "Content-Type": "application/json", 
                    "Authorization": `Bearer ${token}` 
                },
                body: JSON.stringify(apiPayload)
            });

            if (!res.ok) {
                const errorData = await res.json();
                throw new Error(errorData.message || "ไม่สามารถแก้ไขข้อมูลได้");
            }

            const result = await res.json();
            savedUser = result.data; // ค่า User ที่อัปเดตแล้วจาก DB

            // อัปเดตตาราง: แทนที่รายการเดิมด้วยข้อมูลใหม่
            setUsers(users.map((u) => (u.user_id === savedUser.user_id ? savedUser : u)));
        }

        setIsModalOpen(false);
        alert("ดำเนินการเรียบร้อยแล้ว");

    } catch (error) {
        console.error("Save Error:", error);
        alert(error instanceof Error ? error.message : "เกิดข้อผิดพลาดในการบันทึก");
    }
  };

  // Filtering & Pagination
  const filteredUsers = users.filter((u) => {
    const fullName = `${u.firstname} ${u.lastname}`.toLowerCase();
    const matchSearch =
      fullName.includes(searchTerm.toLowerCase()) ||
      u.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (u.student_number && u.student_number.includes(searchTerm));
    
    const matchRole = filterRole === "all" ? true : u.role_code === filterRole;
    return matchSearch && matchRole;
  });

  const totalPages = Math.ceil(filteredUsers.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const currentItems = filteredUsers.slice(startIndex, startIndex + itemsPerPage);

  return (
    <div className="min-h-screen bg-[#F3F4F6] p-6 font-sans">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-800 tracking-tight">จัดการบัญชีผู้ใช้งาน</h1>
          <p className="text-sm text-gray-500 mt-1">จัดการบัญชีผู้ใช้งาน กำหนดสิทธิ์ และสถานะบัญชี</p>
        </div>
        <button
          onClick={handleOpenCreate}
          className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-xl font-semibold shadow-lg shadow-blue-200 transition-all flex items-center gap-2 active:scale-95"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
          สร้างบัญชีใหม่
        </button>
      </div>

      {/* Main Table Card */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden flex flex-col min-h-[600px]">
        {/* Filters */}
        <div className="p-5 border-b border-gray-100 bg-white flex flex-col md:flex-row gap-4 items-center justify-between">
          <div className="relative w-full md:w-96">
            <input
              type="text"
              placeholder="ค้นหาชื่อ, รหัสนิสิต, อีเมล"
              className="w-full bg-gray-50 border border-gray-200 rounded-xl pl-10 pr-4 py-2.5 text-sm focus:ring-2 focus:ring-blue-500 focus:bg-white outline-none transition-all"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            <svg className="w-5 h-5 absolute left-3 top-2.5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
          </div>
          <div className="flex items-center gap-2 w-full md:w-auto">
            <span className="text-sm text-gray-500 whitespace-nowrap">กรองตามตำแหน่ง:</span>
            <select
              className="bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 text-sm outline-none cursor-pointer hover:bg-gray-100 transition-colors w-full md:w-auto"
              value={filterRole}
              onChange={(e) => setFilterRole(e.target.value)}
            >
              <option value="all">ทั้งหมด</option>
              <option value="student">นิสิต</option>
              <option value="head_of_department">หัวหน้าภาค</option>
              <option value="dean">คณบดี</option>
              <option value="associate_dean">รองคณบดี</option>
              <option value="student_development">กองพัฒนานิสิต</option>
              <option value="student_development_committee">คณะกรรมการกองพัฒนานิสิตดีเด่น</option>
              <option value="chairman_of_student_development_committee">ประธานคณะกรรมการกองพัฒนานิสิตดีเด่น</option>
              <option value="admin">ผู้ดูเเลระบบ</option>
            </select>
          </div>
        </div>

        {/* Table Content */}
        <div className="flex-1 overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead className="bg-gray-50/50 text-gray-500 text-xs uppercase tracking-wider font-semibold">
              <tr>
                <th className="p-5">ผู้ใช้งาน</th>
                <th className="p-5">อีเมลติดต่อ</th>
                <th className="p-5">ตำแหน่ง & สังกัด</th>
                <th className="p-5 text-center">สถานะ</th>
                <th className="p-5 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 text-sm">
              {loading ? (
                <tr><td colSpan={5} className="p-10 text-center text-gray-400 animate-pulse">กำลังโหลดข้อมูล...</td></tr>
              ) : currentItems.length === 0 ? (
                <tr>
                    <td colSpan={5} className="p-10 text-center text-gray-400">
                        <div className="flex flex-col items-center justify-center">
                            <p>ไม่พบข้อมูลผู้ใช้งาน</p>
                        </div>
                    </td>
                </tr>
              ) : (
                currentItems.map((user) => (
                  <tr key={user.user_id} className="hover:bg-blue-50/30 transition-colors group">
                    <td className="p-5">
                      <div className="flex items-center gap-4">
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-bold shadow-sm ${user.avatarColor || 'bg-gray-400'}`}>
                          {user.firstname.charAt(0)}
                        </div>
                        <div>
                          <div className="font-bold text-gray-800">{user.firstname} {user.lastname}</div>
                          {user.role_code === 'student' && user.student_number && (
                             <div className="text-[10px] text-blue-600 font-medium bg-blue-50 inline-block px-1.5 rounded mt-0.5">
                                ID: {user.student_number}
                             </div>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="p-5">
                        <div className="flex items-center gap-1.5 text-xs text-gray-600">
                            <svg className="w-3.5 h-3.5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>
                            {user.email}
                        </div>
                    </td>
                    <td className="p-5">
                      <div className="flex flex-col items-start gap-1">
                        <span className={`px-2.5 py-0.5 rounded-md text-[10px] font-bold border uppercase tracking-wide ${roleConfig[user.role_code]?.bg} ${roleConfig[user.role_code]?.color}`}>
                          {roleConfig[user.role_code]?.label || user.role_code}
                        </span>
                        <span className="text-gray-600 text-xs">
                            {user.faculty_name} 
                            {user.department_name && <span className="text-gray-400"> / {user.department_name}</span>}
                        </span>
                      </div>
                    </td>
                    {/* Status Body */}
                    <td className="p-5 text-center">
                      <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold ${user.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${user.status === 'active' ? 'bg-green-500' : 'bg-red-500'}`}></span>
                        {user.status === 'active' ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="p-5 text-center">
                      <div className="flex justify-center gap-2 opacity-100 sm:opacity-0 group-hover:opacity-100 transition-opacity">
                        <button 
                            onClick={() => handleOpenEdit(user)}
                            className="p-2 text-gray-500 hover:text-blue-600 hover:bg-blue-100 rounded-lg transition-colors" 
                            title="แก้ไข"
                        >
                          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
                        </button>
                        <button 
                            onClick={() => handleDelete(user.user_id)}
                            className="p-2 text-gray-500 hover:text-red-600 hover:bg-red-100 rounded-lg transition-colors" 
                            title="ลบ"
                        >
                          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        
        {/* Pagination */}
        <div className="flex justify-between items-center p-4 border-t border-gray-100 bg-gray-50 mt-auto">
            <div className="flex items-center gap-2">
                <button 
                    onClick={() => setCurrentPage(p => Math.max(p - 1, 1))} 
                    disabled={currentPage === 1}
                    className="w-9 h-9 flex items-center justify-center rounded-lg bg-white border border-gray-300 text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed shadow-sm transition-all"
                >
                    &lt;
                </button>

                {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                    <button 
                        key={page} 
                        onClick={() => setCurrentPage(page)}
                        className={`w-9 h-9 flex items-center justify-center rounded-lg text-sm font-bold shadow-sm transition-all
                            ${currentPage === page 
                                ? "bg-blue-600 text-white border border-blue-600" 
                                : "bg-white border border-gray-300 text-gray-600 hover:bg-gray-50"}`}
                    >
                        {page}
                    </button>
                ))}

                <button 
                    onClick={() => setCurrentPage(p => Math.min(p + 1, totalPages))} 
                    disabled={currentPage === totalPages || totalPages === 0}
                    className="w-9 h-9 flex items-center justify-center rounded-lg bg-white border border-gray-300 text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed shadow-sm transition-all"
                >
                    &gt;
                </button>
            </div>
            <div className="text-xs text-gray-500">
                แสดง {filteredUsers.length > 0 ? startIndex + 1 : 0}-{Math.min(startIndex + itemsPerPage, filteredUsers.length)} จาก {filteredUsers.length} รายการ
            </div>
        </div>
      </div>

      {/* Modal Form */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-gray-900/60 backdrop-blur-sm transition-opacity" onClick={() => setIsModalOpen(false)}></div>
          <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden animate-scale-up">
            
            <div className="bg-gray-50 px-6 py-4 border-b border-gray-100 flex justify-between items-center">
                <h3 className="text-lg font-bold text-gray-800">
                    {modalMode === 'create' ? 'เพิ่มผู้ใช้งานใหม่' : 'แก้ไขข้อมูลผู้ใช้งาน'}
                </h3>
                <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-gray-600">
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"/></svg>
                </button>
            </div>

            <form onSubmit={handleSave} className="p-6 space-y-4">
                
                <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                        <label className="text-xs font-semibold text-gray-500 uppercase">ชื่อจริง</label>
                        <input 
                            type="text" required 
                            className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                            value={formData.firstname || ''}
                            onChange={e => setFormData({...formData, firstname: e.target.value})}
                        />
                    </div>
                    <div className="space-y-1">
                        <label className="text-xs font-semibold text-gray-500 uppercase">นามสกุล</label>
                        <input 
                            type="text" required 
                            className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                            value={formData.lastname || ''}
                            onChange={e => setFormData({...formData, lastname: e.target.value})}
                        />
                    </div>
                </div>

                {formData.role_code === 'student' && (
                    <div className="space-y-1 animate-fade-in">
                        <label className="text-xs font-semibold text-blue-600 uppercase">รหัสนิสิต</label>
                        <input 
                            type="text" 
                            className="w-full border border-blue-200 bg-blue-50 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                            value={formData.student_number || ''}
                            onChange={e => setFormData({...formData, student_number: e.target.value})}
                            placeholder="กรอกรหัสนิสิต"
                        />
                    </div>
                )}

                <div className="space-y-1">
                    <label className="text-xs font-semibold text-gray-500 uppercase">อีเมล</label>
                    <input 
                        type="email" required 
                        className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                        value={formData.email || ''}
                        onChange={e => setFormData({...formData, email: e.target.value})}
                    />
                </div>

                {/* Added Status Dropdown */}
                <div className="space-y-1">
                    <label className="text-xs font-semibold text-gray-500 uppercase">สถานะบัญชี</label>
                    <select 
                        className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none bg-white"
                        value={formData.status}
                        onChange={e => setFormData({...formData, status: e.target.value as any})}
                    >
                        <option value="active">ใช้งานปกติ (Active)</option>
                        <option value="inactive">ระงับการใช้งาน (Inactive)</option>
                    </select>
                </div>

                <div className="space-y-1">
                    <label className="text-xs font-semibold text-gray-500 uppercase">บทบาท</label>
                    <select 
                        className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                        value={formData.role_code}
                        onChange={e => setFormData({...formData, role_code: e.target.value as any})}
                    >
                        <option value="student">นิสิต</option>
                        <option value="head_of_department">หัวหน้าภาค</option>
                        <option value="dean">คณบดี</option>
                        <option value="associate_dean">รองคณบดี</option>
                        <option value="student_development">กองพัฒนานิสิต</option>
                        <option value="student_development_committee">คณะกรรมการกองพัฒนานิสิตดีเด่น</option>
                        <option value="chairman_of_student_development_committee">ประธานคณะกรรมการกองพัฒนานิสิตดีเด่น</option>
                        <option value="admin">ผู้ดูเเลระบบ</option>
                    </select>
                </div>

                {/* Master Data Dropdowns (Faculty/Dept)*/}
                <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                        <label className="text-xs font-semibold text-gray-500 uppercase">สังกัด / คณะ</label>
                        <select 
                            className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                            value={formData.faculty_id || ''}
                            onChange={e => {
                                setFormData({
                                    ...formData, 
                                    faculty_id: Number(e.target.value), 
                                    department_id: undefined // Reset สาขาเมื่อเปลี่ยนคณะ
                                });
                            }}
                        >
                            <option value="">-- เลือกคณะ --</option>
                            {faculties.map((fac) => (
                                <option key={fac.faculty_id} value={fac.faculty_id}>{fac.faculty_name}</option>
                            ))}
                        </select>
                    </div>
                    
                    {(['student', 'head_of_department'].includes(formData.role_code || '')) && (
                        <div className="space-y-1">
                            <label className="text-xs font-semibold text-gray-500 uppercase">ภาควิชา</label>
                            <select 
                                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                                value={formData.department_id || ''}
                                onChange={e => setFormData({...formData, department_id: Number(e.target.value)})}
                                disabled={!formData.faculty_id} // ห้ามเลือกถ้ายังไม่เลือกคณะ
                            >
                                <option value="">-- เลือกสาขา --</option>
                                {getDepartmentsByFacultyId(formData.faculty_id).map((dept) => (
                                    <option key={dept.department_id} value={dept.department_id}>{dept.department_name}</option>
                                ))}
                            </select>
                        </div>
                    )}
                </div>

                <div className="flex justify-end gap-3 mt-6 pt-2">
                    <button 
                        type="button"
                        onClick={() => setIsModalOpen(false)}
                        className="px-5 py-2.5 text-sm font-bold text-gray-600 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors"
                    >
                        ยกเลิก
                    </button>
                    <button 
                        type="submit"
                        className="px-5 py-2.5 text-sm font-bold text-white bg-blue-600 rounded-xl shadow-lg shadow-blue-200 hover:bg-blue-700 hover:shadow-blue-300 transition-all"
                    >
                        บันทึกข้อมูล
                    </button>
                </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}