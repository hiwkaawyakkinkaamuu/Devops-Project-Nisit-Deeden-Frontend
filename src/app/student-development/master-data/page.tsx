"use client";

import { useState, useEffect } from "react";

interface Department {
  department_id: number;
  department_name: string;
  faculty_id?: number;
}

interface Faculty {
  faculty_id: number;
  faculty_name: string;
  departments: Department[];
}

interface ModalState {
  isOpen: boolean;
  type: "faculty" | "department";
  mode: "create" | "edit";
  parentId?: number;
  data?: { id?: number; name: string };
}

const FacultyCard = ({
  faculty,
  onEditFaculty,
  onDeleteFaculty,
  onAddDept,
  onEditDept,
  onDeleteDept,
}: {
  faculty: Faculty;
  onEditFaculty: (f: Faculty) => void;
  onDeleteFaculty: (id: number) => void;
  onAddDept: (id: number) => void;
  onEditDept: (fid: number, d: Department) => void;
  onDeleteDept: (fid: number, did: number) => void;
}) => {
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 4;

  const totalPages = Math.ceil(faculty.departments.length / itemsPerPage);
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentDepartments = faculty.departments.slice(
    indexOfFirstItem,
    indexOfLastItem
  );

  useEffect(() => {
    if (currentPage > totalPages && totalPages > 0) {
      setCurrentPage(totalPages);
    }
  }, [faculty.departments.length, totalPages, currentPage]);

  const handlePageChange = (page: number) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
    }
  };

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden flex flex-col hover:shadow-md transition-shadow duration-300 group/card h-full">
      <div className="bg-gradient-to-r from-gray-50 to-white p-5 border-b border-gray-100 flex justify-between items-start relative">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center border border-gray-100 text-blue-600 shadow-sm">
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
            </svg>
          </div>
          <div>
            <h3 className="font-bold text-lg text-gray-800 leading-tight">{faculty.faculty_name}</h3>
            <p className="text-xs text-gray-400 mt-1">{faculty.departments.length} สาขาวิชา</p>
          </div>
        </div>
        <div className="flex gap-1">
          <button onClick={() => onEditFaculty(faculty)} className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>
          </button>
          <button onClick={() => onDeleteFaculty(faculty.faculty_id)} className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
          </button>
        </div>
      </div>

      <div className="p-5 flex-1 flex flex-col gap-2 min-h-[280px]"> 
        {currentDepartments.length > 0 ? (
          currentDepartments.map((dept) => (
            <div key={dept.department_id} className="group/item flex justify-between items-center px-3 py-2.5 rounded-lg border border-transparent hover:border-gray-100 hover:bg-gray-50 transition-all">
              <div className="flex items-center gap-3">
                <div className="w-1.5 h-1.5 rounded-full bg-gray-300 group-hover/item:bg-blue-500 transition-colors"></div>
                <span className="text-sm text-gray-600 font-medium">{dept.department_name}</span>
              </div>
              <div className="flex gap-1 opacity-0 group-hover/item:opacity-100 transition-opacity">
                <button onClick={() => onEditDept(faculty.faculty_id, dept)} className="p-1 text-gray-400 hover:text-blue-600">
                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>
                </button>
                <button onClick={() => onDeleteDept(faculty.faculty_id, dept.department_id)} className="p-1 text-gray-400 hover:text-red-600">
                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                </button>
              </div>
            </div>
          ))
        ) : (
          <div className="py-8 text-center border-2 border-dashed border-gray-100 rounded-xl bg-gray-50/50">
            <p className="text-sm text-gray-400">ยังไม่มีข้อมูลสาขาวิชา</p>
          </div>
        )}
        
        <button onClick={() => onAddDept(faculty.faculty_id)} className="mt-auto w-full py-2.5 rounded-xl border border-dashed border-gray-300 text-sm font-semibold text-gray-500 hover:text-blue-600 hover:border-blue-300 hover:bg-blue-50 transition-all flex items-center justify-center gap-2">
           <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
          เพิ่มสาขาวิชา
        </button>
      </div>

      {totalPages > 1 && (
        <div className="px-5 pb-5 pt-0 flex justify-center items-center gap-2">
          <button onClick={() => handlePageChange(currentPage - 1)} disabled={currentPage === 1} className={`w-9 h-9 flex items-center justify-center rounded-lg border text-sm font-medium transition-colors ${currentPage === 1 ? 'bg-gray-50 text-gray-300 border-gray-100 cursor-not-allowed' : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50 shadow-sm'}`}>&lt;</button>
          {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
            <button key={page} onClick={() => handlePageChange(page)} className={`w-9 h-9 flex items-center justify-center rounded-lg border text-sm font-bold shadow-sm transition-all ${currentPage === page ? 'bg-blue-600 border-blue-600 text-white' : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50'}`}>{page}</button>
          ))}
          <button onClick={() => handlePageChange(currentPage + 1)} disabled={currentPage === totalPages} className={`w-9 h-9 flex items-center justify-center rounded-lg border text-sm font-medium transition-colors ${currentPage === totalPages ? 'bg-gray-50 text-gray-300 border-gray-100 cursor-not-allowed' : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50 shadow-sm'}`}>&gt;</button>
        </div>
      )}
    </div>
  );
};

// Main Page Component
export default function MasterDataPage() {
  const [faculties, setFaculties] = useState<Faculty[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [modal, setModal] = useState<ModalState>({
    isOpen: false,
    type: "faculty",
    mode: "create",
    data: { name: "" },
  });

  // [API] Fetch Data
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const token = localStorage.getItem("accessToken");
        const apiUrl = process.env.NEXT_PUBLIC_API_URL || ""; 
        const response = await fetch(`${apiUrl}/api/master/faculties`, {
            method: "GET",
            headers: { "Content-Type": "application/json", "Authorization": `Bearer ${token}` }
        });

        if (!response.ok) throw new Error("API Failed");
        const result = await response.json();
        setFaculties(result.data || []);

      } catch (error) {
        console.error("Using Mock Data:", error);
        // Mockup Data
        setFaculties([
          {
            faculty_id: 1,
            faculty_name: "คณะวิศวกรรมศาสตร์",
            departments: [
              { department_id: 101, department_name: "วิศวกรรมคอมพิวเตอร์" },
              { department_id: 102, department_name: "วิศวกรรมไฟฟ้า" },
              { department_id: 103, department_name: "วิศวกรรมเครื่องกล" },
              { department_id: 104, department_name: "วิศวกรรมอุตสาหการ" },
              { department_id: 105, department_name: "วิศวกรรมเคมี" },
              { department_id: 106, department_name: "วิศวกรรมโยธา" },
            ],
          },
          {
            faculty_id: 2,
            faculty_name: "คณะมนุษยศาสตร์",
            departments: [
              { department_id: 201, department_name: "ภาษาอังกฤษ" },
              { department_id: 202, department_name: "นิเทศศาสตร์" },
            ],
          },
        ]);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  // Handlers: Open Modals
  const openCreateFaculty = () => setModal({ isOpen: true, type: "faculty", mode: "create", data: { name: "" } });
  const openEditFaculty = (f: Faculty) => setModal({ isOpen: true, type: "faculty", mode: "edit", data: { id: f.faculty_id, name: f.faculty_name } });
  const openCreateDept = (fid: number) => setModal({ isOpen: true, type: "department", mode: "create", parentId: fid, data: { name: "" } });
  const openEditDept = (fid: number, d: Department) => setModal({ isOpen: true, type: "department", mode: "edit", parentId: fid, data: { id: d.department_id, name: d.department_name } });

  // Update Local State 
  const updateLocalState = (item: any) => {
    if (modal.type === "faculty") {
        if (modal.mode === "create") {
            // Create Faculty: รับ item ที่มี faculty_id ใหม่มา
            setFaculties(prev => [...prev, { ...item, departments: [] }]);
        } else {
            // Edit Faculty: อัปเดตชื่อตาม faculty_id
            setFaculties(prev => prev.map(f => 
                f.faculty_id === item.faculty_id ? { ...f, faculty_name: item.faculty_name } : f
            ));
        }
    } else {
        if (modal.mode === "create") {
            // Create Department: เพิ่มเข้าไปใน array departments ของคณะแม่
            setFaculties(prev => prev.map(f => 
                f.faculty_id === modal.parentId 
                ? { ...f, departments: [...f.departments, item] } 
                : f
            ));
        } else {
            // Edit Department: หา ID สาขาในคณะแม่แล้วอัปเดตชื่อ
            setFaculties(prev => prev.map(f => 
                f.faculty_id === modal.parentId 
                ? { 
                    ...f, 
                    departments: f.departments.map(d => 
                        d.department_id === item.department_id ? item : d
                    ) 
                  }
                : f
            ));
        }
    }
  };

  // LOGIC: SAVE DATA
  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!modal.data?.name) return;

    const inputName = modal.data.name.trim();

    // 1. Validation
    if (modal.type === "faculty") {
      const isDuplicate = faculties.some(f => f.faculty_name === inputName && f.faculty_id !== modal.data?.id);
      if (isDuplicate) return alert(`ชื่อคณะ "${inputName}" มีอยู่ในระบบแล้ว`);
    } else {
      const targetFaculty = faculties.find(f => f.faculty_id === modal.parentId);
      if (targetFaculty) {
        const isDuplicate = targetFaculty.departments.some(d => d.department_name === inputName && d.department_id !== modal.data?.id);
        if (isDuplicate) return alert(`สาขา "${inputName}" มีอยู่แล้วในคณะนี้`);
      }
    }

    try {
      const token = localStorage.getItem("accessToken");
      const apiUrl = process.env.NEXT_PUBLIC_API_URL;

      let url = "";
      let method = "";
      let payload = {};

      // 2. Prepare API Request
      if (modal.type === "faculty") {
        payload = { faculty_name: inputName };
        if (modal.mode === "create") {
          url = `${apiUrl}/api/master/faculties`;
          method = "POST";
        } else {
          url = `${apiUrl}/api/master/faculties/${modal.data.id}`;
          method = "PUT";
        }
      } else {
        payload = { 
            department_name: inputName, 
            faculty_id: modal.parentId 
        };
        if (modal.mode === "create") {
          url = `${apiUrl}/api/master/departments`;
          method = "POST";
        } else {
          url = `${apiUrl}/api/master/departments/${modal.data.id}`;
          method = "PUT";
        }
      }

      // 3. Execute API Call
      /* หมายเหตุ: ถ้า API จริงพัง (เช่น 404, 500 หรือ Network Error) 
         code จะกระโดดไปทำงานใน block 'catch' โดยอัตโนมัติ เพื่อใช้ Mockup
      */
      const response = await fetch(url, {
        method: method,
        headers: { 
            "Content-Type": "application/json",
            "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        throw new Error("API Failed"); 
      }

      const result = await response.json();
      const savedItem = result.data;

      // 4. Update UI with Real Data
      updateLocalState(savedItem);
      alert("บันทึกข้อมูลเรียบร้อยแล้ว (Server)");

    } catch (error) {
      console.warn("API Error, Switching to Mockup Mode:", error);

      // 5. MOCKUP FALLBACK Logic
      
      // สร้าง ID จำลอง หรือใช้ ID เดิมถ้าเป็นการแก้ไข
      const mockId = modal.mode === 'create' ? Date.now() : modal.data?.id;
      let mockItem;

      if (modal.type === "faculty") {
        mockItem = {
            faculty_id: mockId,
            faculty_name: inputName,
            // ถ้าแก้ไข ให้คง array เดิมไว้ (จัดการใน updateLocalState) 
            // แต่ถ้าสร้างใหม่ ใส่ array เปล่า
            departments: [] 
        };
      } else {
        mockItem = {
            department_id: mockId,
            department_name: inputName,
            faculty_id: modal.parentId
        };
      }

      // อัปเดต UI ด้วยข้อมูลปลอม
      updateLocalState(mockItem);
      alert("บันทึกข้อมูลเรียบร้อยแล้ว (Mockup Mode)");

    } finally {
      setModal({ ...modal, isOpen: false });
    }
  };

  // Delete Handlers (Mockup Logic included within try/catch)
  const handleDeleteFaculty = async (id: number) => {
    if (!confirm("คำเตือน: การลบคณะจะทำให้สาขาวิชาทั้งหมดหายไปด้วย ยืนยันหรือไม่?")) return;
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL;
      const response = await fetch(`${apiUrl}/api/master/faculties/${id}`, { method: "DELETE" });
      if (!response.ok) throw new Error("API Failed");
      
      setFaculties((prev) => prev.filter((f) => f.faculty_id !== id));
    } catch (error) {
      // Mockup Delete
      setFaculties((prev) => prev.filter((f) => f.faculty_id !== id));
    }
  };

  const handleDeleteDept = async (facultyId: number, deptId: number) => {
    if (!confirm("ยืนยันการลบสาขาวิชานี้?")) return;
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL;
      const response = await fetch(`${apiUrl}/api/master/departments/${deptId}`, { method: "DELETE" });
      if (!response.ok) throw new Error("API Failed");

      setFaculties((prev) => prev.map((f) => f.faculty_id === facultyId ? { ...f, departments: f.departments.filter((d) => d.department_id !== deptId) } : f));
    } catch (error) {
      // Mockup Delete
      setFaculties((prev) => prev.map((f) => f.faculty_id === facultyId ? { ...f, departments: f.departments.filter((d) => d.department_id !== deptId) } : f));
    }
  };

  return (
    <div className="min-h-screen bg-[#F3F4F6] p-6 font-sans">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-800 tracking-tight">จัดการคณะและสาขาวิชา</h1>
          <p className="text-sm text-gray-500 mt-1">จัดการข้อมูลโครงสร้างคณะและสาขาวิชาของมหาวิทยาลัย</p>
        </div>
        <button onClick={openCreateFaculty} className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-xl font-semibold shadow-lg shadow-blue-200 transition-all flex items-center gap-2 active:scale-95">
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
          เพิ่มคณะใหม่
        </button>
      </div>

      {/* Grid */}
      {loading ? (
        <div className="p-20 text-center text-gray-400 animate-pulse bg-white rounded-3xl shadow-sm border border-gray-200">กำลังโหลดข้อมูล...</div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6 auto-rows-fr">
          {faculties.map((faculty) => (
            <FacultyCard
              key={faculty.faculty_id}
              faculty={faculty}
              onEditFaculty={openEditFaculty}
              onDeleteFaculty={handleDeleteFaculty}
              onAddDept={openCreateDept}
              onEditDept={openEditDept}
              onDeleteDept={handleDeleteDept}
            />
          ))}
        </div>
      )}

      {/* Modal */}
      {modal.isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-gray-900/60 backdrop-blur-sm transition-opacity" onClick={() => setModal({ ...modal, isOpen: false })}></div>
          <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-scale-up">
            <div className="bg-gray-50 px-6 py-4 border-b border-gray-100 flex justify-between items-center">
              <h3 className="text-lg font-bold text-gray-800">{modal.mode === "create" ? "เพิ่มข้อมูล" : "แก้ไขข้อมูล"}{modal.type === "faculty" ? "คณะ" : "สาขาวิชา"}</h3>
              <button onClick={() => setModal({ ...modal, isOpen: false })} className="text-gray-400 hover:text-gray-600">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>
            <form onSubmit={handleSave} className="p-6">
              <div className="space-y-4">
                <div>
                  <label className="text-xs font-semibold text-gray-500 uppercase mb-1 block">ชื่อ{modal.type === "faculty" ? "คณะ" : "สาขาวิชา"}</label>
                  <input
                    type="text" autoFocus required
                    className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-blue-500 outline-none bg-white transition-all shadow-sm"
                    placeholder={modal.type === "faculty" ? "เช่น คณะวิศวกรรมศาสตร์" : "เช่น วิศวกรรมคอมพิวเตอร์"}
                    value={modal.data?.name || ""}
                    onChange={(e) => setModal({ ...modal, data: { ...modal.data, name: e.target.value } })}
                  />
                </div>
              </div>
              <div className="flex justify-end gap-3 mt-8">
                <button type="button" onClick={() => setModal({ ...modal, isOpen: false })} className="px-5 py-2.5 text-sm font-bold text-gray-600 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors">ยกเลิก</button>
                <button type="submit" className="px-5 py-2.5 text-sm font-bold text-white bg-blue-600 rounded-xl shadow-lg shadow-blue-200 hover:bg-blue-700 hover:shadow-blue-300 transition-all">บันทึก</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}