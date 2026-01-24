"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";

// =============================================================================
// 1. Interfaces
// =============================================================================

interface UserProfile {
  student_id: number;
  student_number: string;
  prefix: string;
  student_firstname: string;
  student_lastname: string;
  email: string;
  phone_number: string;
  // line_id: string;  <-- ลบออกตาม requirement
  campus_id: number;
  faculty_id: number;
  department_id: number;
  student_year: number;
  advisor_id: number;     // ✅ เปลี่ยนเป็น ID เพื่อเก็บค่าจากการเลือก Dropdown
  gpa: number | string;
  image_url?: string;
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

interface MasterCampus {
  campus_id: number;
  campus_name: string;
}

interface MasterAdvisor { // ✅ Interface สำหรับอาจารย์
  advisor_id: number;
  advisor_name: string;
  department_id: number;
}

// =============================================================================
// 2. Main Component
// =============================================================================

export default function FirstLoginPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [isPageLoaded, setIsPageLoaded] = useState(false);

  // --- State Data ---
  const [formData, setFormData] = useState<UserProfile>({
    student_id: 0,
    student_number: "",
    prefix: "นาย",
    student_firstname: "",
    student_lastname: "",
    email: "",
    phone_number: "",
    campus_id: 0,
    faculty_id: 0,
    department_id: 0,
    student_year: 1,
    advisor_id: 0, 
    gpa: "",
    image_url: ""
  });

  // --- Image Upload State ---
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // --- Master Data State ---
  const [masterCampuses, setMasterCampuses] = useState<MasterCampus[]>([]);
  const [masterFaculties, setMasterFaculties] = useState<MasterFaculty[]>([]);
  const [masterDepartments, setMasterDepartments] = useState<MasterDepartment[]>([]);
  
  // ✅ State สำหรับอาจารย์ (โหลดใหม่เมื่อเปลี่ยนภาควิชา)
  const [advisorList, setAdvisorList] = useState<MasterAdvisor[]>([]);
  const [isAdvisorLoading, setIsAdvisorLoading] = useState(false);

  // --- 1. Fetch Initial Data ---
  useEffect(() => {
    const fetchAllData = async () => {
      try {
        const token = localStorage.getItem("accessToken");
        const apiUrl = process.env.NEXT_PUBLIC_API_URL || "";
        const headers = { 
            "Authorization": `Bearer ${token}`, 
            "Content-Type": "application/json" 
        };

        const [resProfile, resCampuses, resFaculties, resDepartments] = await Promise.all([
            fetch(`${apiUrl}/api/profile/me`, { headers }),
            fetch(`${apiUrl}/api/master/campuses`, { headers }),
            fetch(`${apiUrl}/api/master/faculties`, { headers }),
            fetch(`${apiUrl}/api/master/departments`, { headers })
        ]);

        if (!resProfile.ok || !resCampuses.ok || !resFaculties.ok || !resDepartments.ok) {
            throw new Error("API Connection Failed");
        }

        const profileData = await resProfile.json();
        const campData = await resCampuses.json();
        const facData = await resFaculties.json();
        const deptData = await resDepartments.json();

        setFormData(prev => ({ ...prev, ...(profileData.data || profileData) }));
        setMasterCampuses(campData.data || []);
        setMasterFaculties(facData.data || []);
        setMasterDepartments(deptData.data || []);

        setIsPageLoaded(true);

      } catch (error) {
        console.warn("⚠️ API Error/Not Connected. Using Mockup Data.", error);

        // --- Mockup Data Fallback ---
        await new Promise(r => setTimeout(r, 800));

        setFormData(prev => ({
            ...prev,
            student_id: 101,
            student_number: "6610400001",
            student_firstname: "สมชาย",
            student_lastname: "รักเรียน",
            email: "somchai.r@ku.th",
            prefix: "นาย",
        }));

        setMasterCampuses([
            { campus_id: 1, campus_name: "บางเขน" },
            { campus_id: 2, campus_name: "กำแพงแสน" },
            { campus_id: 3, campus_name: "ศรีราชา" },
            { campus_id: 4, campus_name: "สกลนคร" }
        ]);

        setMasterFaculties([
            { faculty_id: 1, faculty_name: "คณะวิศวกรรมศาสตร์" },
            { faculty_id: 2, faculty_name: "คณะวิทยาศาสตร์" }
        ]);

        setMasterDepartments([
            { department_id: 101, department_name: "วิศวกรรมคอมพิวเตอร์", faculty_id: 1 },
            { department_id: 201, department_name: "วิทยาการคอมพิวเตอร์", faculty_id: 2 }
        ]);

        setIsPageLoaded(true);
      }
    };

    fetchAllData();
  }, []);

  // --- 2. Fetch Advisors when Department Changes ---
  useEffect(() => {
    const fetchAdvisors = async () => {
        if (!formData.department_id || formData.department_id === 0) {
            setAdvisorList([]);
            return;
        }

        setIsAdvisorLoading(true);
        try {
            const token = localStorage.getItem("accessToken");
            const apiUrl = process.env.NEXT_PUBLIC_API_URL || "";
            
            // Call API: Get advisors by department_id
            const res = await fetch(`${apiUrl}/api/master/advisors?department_id=${formData.department_id}`, {
                headers: { "Authorization": `Bearer ${token}` }
            });

            if (res.ok) {
                const data = await res.json();
                setAdvisorList(data.data || []);
            } else {
                throw new Error("Failed to fetch advisors");
            }

        } catch (error) {
            // Mockup Advisors
            await new Promise(r => setTimeout(r, 500)); 
            const mockAdvisors: MasterAdvisor[] = [
                { advisor_id: 1, advisor_name: "ดร. สมชาย ใจดี", department_id: 101 },
                { advisor_id: 2, advisor_name: "ผศ.ดร. วิชัย เก่งกาจ", department_id: 101 },
                { advisor_id: 3, advisor_name: "รศ.ดร. สมหญิง รักเรียน", department_id: 201 },
                { advisor_id: 4, advisor_name: "อ. มานะ พากเพียร", department_id: 201 },
            ];
            // Filter Mockup ให้ตรงกับแผนกที่เลือก
            setAdvisorList(mockAdvisors.filter(a => a.department_id === Number(formData.department_id)));
        } finally {
            setIsAdvisorLoading(false);
        }
    };

    fetchAdvisors();
  }, [formData.department_id]);


  // --- Handlers ---
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => {
        if (name === "faculty_id") {
            // Reset สาขา และ อาจารย์ เมื่อเปลี่ยนคณะ
            return { ...prev, faculty_id: Number(value), department_id: 0, advisor_id: 0 };
        }
        if (name === "department_id") {
            // Reset อาจารย์ เมื่อเปลี่ยนสาขา
            return { ...prev, department_id: Number(value), advisor_id: 0 };
        }
        return { ...prev, [name]: value };
    });
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setSelectedImage(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  // Filter สาขาตามคณะที่เลือก
  const filteredDepartments = masterDepartments.filter(
      (d) => d.faculty_id === Number(formData.faculty_id)
  );

  // --- Submit Logic ---
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // 1. Validate เบอร์โทรศัพท์ (ขึ้นต้นด้วย 0 และครบ 10 หลัก)
    const phoneRegex = /^0[0-9]{9}$/;
    if (!phoneRegex.test(formData.phone_number)) {
        alert("กรุณากรอกเบอร์โทรศัพท์ให้ถูกต้อง (ต้องขึ้นต้นด้วย 0 และมี 10 หลัก)");
        return;
    }

    // 2. Validate เกรดเฉลี่ย (Logic ปี 1)
    const gpaValue = parseFloat(String(formData.gpa));
    const yearValue = Number(formData.student_year);

    if (yearValue === 1) {
        // ปี 1 อนุญาตให้เป็น 0 หรือค่าว่างได้ (ถือว่ายังไม่มีเกรด)
    } else {
        // ปีอื่นๆ ต้องมีเกรดและมากกว่า 0
        if (isNaN(gpaValue) || gpaValue <= 0.00) {
            alert("นิสิตชั้นปีที่ 2 ขึ้นไป กรุณากรอกเกรดเฉลี่ยสะสมให้ถูกต้อง");
            return;
        }
    }

    // 3. Validate Required Fields
    if (!formData.campus_id || !formData.faculty_id || !formData.department_id || !formData.advisor_id) {
      alert("กรุณากรอกข้อมูล คณะ สาขา และอาจารย์ที่ปรึกษา ให้ครบถ้วน");
      return;
    }

    try {
      setLoading(true);
      const token = localStorage.getItem("accessToken");
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "";

      const submitData = new FormData();
      submitData.append("prefix", formData.prefix);
      submitData.append("phone_number", formData.phone_number);
      // submitData.append("line_id", formData.line_id); // ❌ เอาออก
      submitData.append("campus_id", String(formData.campus_id));
      submitData.append("faculty_id", String(formData.faculty_id));
      submitData.append("department_id", String(formData.department_id));
      submitData.append("student_year", String(formData.student_year));
      submitData.append("advisor_id", String(formData.advisor_id)); // ส่งเป็น ID
      submitData.append("gpa", String(formData.gpa || 0)); // ถ้าว่างส่ง 0
      
      if (selectedImage) {
        submitData.append("profile_image", selectedImage);
      }

      // =========================================================
      // 🟡 1. Real API Submit
      // =========================================================
      const res = await fetch(`${apiUrl}/api/profile/update-first-login`, {
        method: "PUT",
        headers: { 
            "Authorization": `Bearer ${token}` 
        },
        body: submitData
      });

      if(!res.ok) throw new Error("Update Failed");

      router.push("/student/student-nomination-form"); 

    } catch (error) {
      console.warn("Switching to Mockup Success.", error);
      
      // =========================================================
      // 🔴 2. Mockup Success
      // =========================================================
      await new Promise(r => setTimeout(r, 1000));
      router.push("/student/student-nomination-form"); 
      // =========================================================

    } finally {
      setLoading(false);
    }
  };

  if (!isPageLoaded) {
    return <div className="min-h-screen flex items-center justify-center bg-gray-50 text-emerald-600 animate-pulse font-medium">กำลังเตรียมข้อมูล...</div>;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center p-4 font-sans">
      <div className="bg-white max-w-5xl w-full rounded-3xl shadow-2xl overflow-hidden flex flex-col md:flex-row animate-fade-in-up">
        
        {/* Left Side: Banner */}
        <div className="bg-gradient-to-br from-emerald-600 to-teal-800 md:w-1/3 p-10 text-white flex flex-col justify-between relative overflow-hidden">
          <div className="relative z-10">
            <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center mb-8 backdrop-blur-md shadow-inner border border-white/10">
              <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
            </div>
            <h2 className="text-4xl font-extrabold mb-4 tracking-tight">ยินดีต้อนรับ</h2>
            <p className="text-emerald-50 text-sm leading-relaxed font-light opacity-90">
              ระบบเสนอรายชื่อนิสิตดีเด่น<br/>มหาวิทยาลัยเกษตรศาสตร์
            </p>
            <div className="mt-8 w-12 h-1 bg-emerald-400 rounded-full"></div>
          </div>
          
          <div className="relative z-10 mt-10">
             <p className="text-xs text-emerald-200">กรุณากรอกข้อมูลให้ครบถ้วนเพื่อสิทธิประโยชน์ของท่าน</p>
          </div>

          <div className="absolute -bottom-20 -right-20 w-64 h-64 bg-emerald-500/20 rounded-full blur-3xl"></div>
          <div className="absolute top-10 -left-10 w-32 h-32 bg-white/10 rounded-full blur-2xl"></div>
        </div>

        {/* Right Side: Form */}
        <div className="md:w-2/3 p-8 md:p-12 overflow-y-auto max-h-[90vh]">
          <div className="mb-8 border-b border-gray-100 pb-4">
             <h3 className="text-2xl font-bold text-gray-800">ข้อมูลผู้ใช้งาน (First Time Setup)</h3>
             <p className="text-gray-400 text-sm mt-1">ตั้งค่าข้อมูลส่วนตัวครั้งแรกเพื่อเริ่มต้นใช้งาน</p>
          </div>
          
          <form onSubmit={handleSubmit} className="space-y-8">
            
            {/* --- Image Upload Section --- */}
            <div className="flex flex-col items-center justify-center mb-6">
                <div className="relative group cursor-pointer" onClick={() => fileInputRef.current?.click()}>
                    <div className="w-32 h-32 rounded-full overflow-hidden border-4 border-emerald-50 shadow-lg bg-gray-100 flex items-center justify-center group-hover:border-emerald-200 transition-all">
                        {imagePreview || formData.image_url ? (
                            <img src={imagePreview || formData.image_url} alt="Profile" className="w-full h-full object-cover" />
                        ) : (
                            <svg className="w-12 h-12 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"></path></svg>
                        )}
                    </div>
                    <div className="absolute bottom-0 right-0 bg-emerald-600 p-2 rounded-full text-white shadow-md group-hover:bg-emerald-700 transition-colors border-2 border-white">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z"></path><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z"></path></svg>
                    </div>
                </div>
                <p className="text-xs text-gray-400 mt-2">คลิกเพื่ออัปโหลดรูปโปรไฟล์</p>
                <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleImageChange} />
            </div>

            {/* --- ข้อมูลส่วนตัว --- */}
            <div className="space-y-5">
                <h4 className="text-sm font-bold text-gray-700 uppercase tracking-wider border-l-4 border-emerald-500 pl-3">ข้อมูลส่วนตัว</h4>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <div>
                        <label className="block text-xs font-bold text-gray-500 mb-1.5">รหัสนิสิต</label>
                        <input type="text" value={formData.student_number} readOnly className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 text-sm text-gray-500 cursor-not-allowed focus:outline-none"/>
                    </div>
                    <div>
                        <label className="block text-xs font-bold text-gray-500 mb-1.5">อีเมล (มหาวิทยาลัย)</label>
                        <input type="text" value={formData.email} readOnly className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 text-sm text-gray-500 cursor-not-allowed focus:outline-none"/>
                    </div>
                </div>

                <div className="grid grid-cols-12 gap-4">
                    <div className="col-span-4 md:col-span-3">
                        <label className="block text-xs font-bold text-gray-700 mb-1.5">คำนำหน้า</label>
                        <select name="prefix" value={formData.prefix} onChange={handleChange} className="w-full border border-gray-300 rounded-xl px-3 py-2.5 text-sm focus:ring-2 focus:ring-emerald-200 focus:border-emerald-500 outline-none transition-all">
                            <option value="นาย">นาย</option>
                            <option value="นางสาว">นางสาว</option>
                            <option value="นาง">นาง</option>
                        </select>
                    </div>
                    <div className="col-span-8 md:col-span-4">
                        <label className="block text-xs font-bold text-gray-500 mb-1.5">ชื่อจริง</label>
                        <input type="text" value={formData.student_firstname} readOnly className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 text-sm text-gray-500 cursor-not-allowed focus:outline-none"/>
                    </div>
                    <div className="col-span-12 md:col-span-5">
                        <label className="block text-xs font-bold text-gray-500 mb-1.5">นามสกุล</label>
                        <input type="text" value={formData.student_lastname} readOnly className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 text-sm text-gray-500 cursor-not-allowed focus:outline-none"/>
                    </div>
                </div>
            </div>

            {/* --- ข้อมูลการศึกษา --- */}
            <div className="space-y-5">
              <h4 className="text-sm font-bold text-gray-700 uppercase tracking-wider border-l-4 border-emerald-500 pl-3">ข้อมูลการศึกษา</h4>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                {/* Campus */}
                <div className="col-span-1 md:col-span-2">
                    <label className="block text-xs font-bold text-gray-700 mb-1.5">วิทยาเขต <span className="text-red-500">*</span></label>
                    <select name="campus_id" value={formData.campus_id} onChange={handleChange} required className="w-full border border-gray-300 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-emerald-200 focus:border-emerald-500 outline-none cursor-pointer transition-all bg-white">
                        <option value={0}>-- เลือกวิทยาเขต --</option>
                        {masterCampuses.map(camp => (
                            <option key={camp.campus_id} value={camp.campus_id}>{camp.campus_name}</option>
                        ))}
                    </select>
                </div>

                <div className="col-span-1">
                  <label className="block text-xs font-bold text-gray-700 mb-1.5">คณะ <span className="text-red-500">*</span></label>
                  <select name="faculty_id" value={formData.faculty_id} onChange={handleChange} required className="w-full border border-gray-300 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-emerald-200 focus:border-emerald-500 outline-none cursor-pointer transition-all bg-white">
                    <option value={0}>-- เลือกคณะ --</option>
                    {masterFaculties.map(fac => (
                      <option key={fac.faculty_id} value={fac.faculty_id}>{fac.faculty_name}</option>
                    ))}
                  </select>
                </div>

                <div className="col-span-1">
                  <label className="block text-xs font-bold text-gray-700 mb-1.5">สาขาวิชา <span className="text-red-500">*</span></label>
                  <select name="department_id" value={formData.department_id} onChange={handleChange} required disabled={!formData.faculty_id} className="w-full border border-gray-300 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-emerald-200 focus:border-emerald-500 outline-none cursor-pointer transition-all bg-white disabled:bg-gray-100 disabled:text-gray-400">
                    <option value={0}>-- เลือกสาขาวิชา --</option>
                    {filteredDepartments.map(dept => (
                      <option key={dept.department_id} value={dept.department_id}>{dept.department_name}</option>
                    ))}
                  </select>
                </div>

                <div className="col-span-1">
                    <label className="block text-xs font-bold text-gray-700 mb-1.5">ชั้นปีที่ <span className="text-red-500">*</span></label>
                    <select name="student_year" value={formData.student_year} onChange={handleChange} required className="w-full border border-gray-300 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-emerald-200 focus:border-emerald-500 outline-none cursor-pointer bg-white">
                      {[1,2,3,4,5,6].map(y => <option key={y} value={y}>{y}</option>)}
                    </select>
                </div>

                <div className="col-span-1">
                  <label className="block text-xs font-bold text-gray-700 mb-1.5">เกรดเฉลี่ยสะสม <span className="text-red-500">*</span></label>
                  <input 
                    type="number" step="0.01" min="0.00" max="4.00" 
                    name="gpa" value={formData.gpa} onChange={handleChange} 
                    required={Number(formData.student_year) > 1}
                    placeholder="กรอกเกรดเฉลี่ย (ใส่ 0.00 หากยังไม่มี)" 
                    className="w-full border border-gray-300 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-emerald-200 focus:border-emerald-500 outline-none transition-all"
                  />
                </div>

                {/* Advisor (Dynamic Dropdown) */}
                <div className="col-span-1 md:col-span-2">
                  <label className="block text-xs font-bold text-gray-700 mb-1.5">อาจารย์ที่ปรึกษา <span className="text-red-500">*</span></label>
                  <select 
                    name="advisor_id" 
                    value={formData.advisor_id} 
                    onChange={handleChange} 
                    required 
                    disabled={!formData.department_id || isAdvisorLoading}
                    className="w-full border border-gray-300 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-emerald-200 focus:border-emerald-500 outline-none transition-all bg-white disabled:bg-gray-100 disabled:text-gray-400"
                  >
                    <option value={0}>
                        {isAdvisorLoading ? "กำลังโหลดข้อมูลอาจารย์..." : "-- เลือกอาจารย์ที่ปรึกษา --"}
                    </option>
                    {advisorList.map(adv => (
                        <option key={adv.advisor_id} value={adv.advisor_id}>{adv.advisor_name}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {/* --- ข้อมูลติดต่อ --- */}
            <div className="space-y-5">
              <h4 className="text-sm font-bold text-gray-700 uppercase tracking-wider border-l-4 border-emerald-500 pl-3">ข้อมูลติดต่อ</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div className="md:col-span-2">
                  <label className="block text-xs font-bold text-gray-700 mb-1.5">เบอร์โทรศัพท์ <span className="text-red-500">*</span></label>
                  <input 
                    type="tel" name="phone_number" value={formData.phone_number} onChange={handleChange} 
                    required maxLength={10} placeholder="0xxxxxxxxx" 
                    className="w-full border border-gray-300 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-emerald-200 focus:border-emerald-500 outline-none transition-all"
                  />
                  <p className="text-[10px] text-gray-400 mt-1">กรอกตัวเลข 10 หลัก (ไม่ต้องมีขีด)</p>
                </div>
                {/* ลบ Line ID ออกตาม Requirement */}
              </div>
            </div>

            {/* Submit Button */}
            <div className="pt-8 flex justify-end">
              <button 
                type="submit" 
                disabled={loading}
                className={`w-full md:w-auto px-10 py-3.5 rounded-xl font-bold text-white shadow-lg shadow-emerald-200 transition-all transform active:scale-95 flex items-center justify-center gap-2
                  ${loading ? 'bg-gray-400 cursor-not-allowed' : 'bg-gradient-to-r from-emerald-500 to-teal-600 hover:to-teal-700'}
                `}
              >
                {loading ? 'กำลังบันทึก...' : 'บันทึกข้อมูลและเริ่มต้นใช้งาน'}
                {!loading && <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14 5l7 7m0 0l-7 7m7-7H3"/></svg>}
              </button>
            </div>

          </form>
        </div>
      </div>
    </div>
  );
}