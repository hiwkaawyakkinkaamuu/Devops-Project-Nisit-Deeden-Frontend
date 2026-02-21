"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import Swal from "sweetalert2";
import axios from "axios";

// ==========================================
// 0. Configuration
// ==========================================

const API_BASE_URL = "/api"; 

interface Faculty {
  faculty_id: number;
  faculty_name: string;
}

interface Department {
  department_id: number;
  department_name: string;
}

interface Campus {
  campus_id: number; 
  campus_name: string; 
  campus_code?: string; 
}

interface UserProfile {
  title: string;      
  firstname: string;
  lastname: string;
  student_number: string;
  // phone_number: string; // [ลบออก] ไม่ใช้แล้ว
  faculty_id: string;
  department_id: string;
  campus_id: string;
  email: string;      
  image_url?: string;
  provider?: string; 
}

const PREFIXES = ["นาย", "นาง", "นางสาว"];

export default function FirstLoginPage() {
  const router = useRouter();
  
  // States
  const [loading, setLoading] = useState(false);
  const [isPageLoaded, setIsPageLoaded] = useState(false);
  
  // Data Lists
  const [campuses, setCampuses] = useState<Campus[]>([]);
  const [faculties, setFaculties] = useState<Faculty[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  
  // Form Data
  const [formData, setFormData] = useState<UserProfile>({
    title: "",
    firstname: "",
    lastname: "",
    student_number: "",
    // phone_number: "", // [ลบออก] ไม่ใช้แล้ว
    faculty_id: "",
    department_id: "",
    campus_id: "",
    email: "",
    image_url: "",
    provider: "" 
  });

  // Image Upload Refs
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // ==========================================
  // 1. Effects (Data Fetching)
  // ==========================================

  useEffect(() => {
    const initData = async () => {
      const token = localStorage.getItem("token");
      if (!token) {
          router.push("/"); 
          return;
      }

      const headers = { Authorization: `Bearer ${token}` };

      try {
        // --- 1. Fetch User Profile (DB) ---
        const resMe = await axios.get(`${API_BASE_URL}/auth/me`, { headers });
        const user = resMe.data.user || resMe.data || {};

        setFormData(prev => ({
            ...prev,
            email: user.email || "",
            firstname: user.firstname || "",
            lastname: user.lastname || "",
            image_url: user.image_path || "",
            campus_id: user.campus_id ? String(user.campus_id) : "",
            student_number: user.student_number || "",
            provider: user.provider || "local",
        }));

        // --- 2. Fetch Faculties (DB) ---
        try {
            const resFac = await axios.get(`${API_BASE_URL}/faculty`, { headers });
            const facData = resFac.data.data || resFac.data;
            if (Array.isArray(facData)) {
                setFaculties(facData);
            }
        } catch (err) {
            console.error("Failed to fetch faculties from DB", err);
        }

        // --- 3. Fetch Campuses (DB) ---
        try {
            const resCam = await axios.get(`${API_BASE_URL}/campus`, { headers }); 
            const camData = resCam.data.data || resCam.data;
            
            if (Array.isArray(camData) && camData.length > 0) {
                const normalizedCampuses: Campus[] = camData.map((c: any) => ({
                    campus_id: c.campus_id || c.campusID,         
                    campus_name: c.campus_name || c.campusName,   
                    campus_code: c.campus_code || c.campusCode    
                }));
                
                setCampuses(normalizedCampuses);
            } else {
                setCampuses([]); 
            }
        } catch (err) {
            console.error("Error fetching campuses from API:", err);
            setCampuses([]);
            Swal.fire({
                icon: 'error',
                title: 'ไม่สามารถโหลดข้อมูล',
                text: 'ไม่สามารถดึงข้อมูลวิทยาเขตจากฐานข้อมูลได้'
            });
        }

        setIsPageLoaded(true);

      } catch (error) {
        console.error("Init Error:", error);
        Swal.fire({ icon: 'error', title: 'เกิดข้อผิดพลาด', text: 'ไม่สามารถโหลดข้อมูลผู้ใช้งานได้' });
        router.push("/");
      }
    };

    initData();
  }, [router]);

  // Fetch Departments when Faculty changes (DB)
  useEffect(() => {
    const fetchDepartments = async () => {
      if (!formData.faculty_id) {
        setDepartments([]);
        return;
      }
      try {
        const token = localStorage.getItem("token");
        const res = await axios.get(`${API_BASE_URL}/department/faculty/${formData.faculty_id}`, {
            headers: { Authorization: `Bearer ${token}` }
        });
        
        const deptData = res.data.data || res.data;
        if (Array.isArray(deptData)) {
            setDepartments(deptData);
        } else {
            setDepartments([]);
        }
      } catch (err) {
        console.error("Error fetching departments:", err);
        setDepartments([]);
      }
    };
    fetchDepartments();
  }, [formData.faculty_id]);

  // ==========================================
  // 2. Helper Function (แปลง URL เป็น File)
  // ==========================================
  const urlToFile = async (url: string, filename: string, mimeType: string): Promise<File> => {
    try {
        const res = await fetch(url, {
            referrerPolicy: "no-referrer",
            cache: "no-cache" // ป้องกันการดึง cache เดิมที่อาจจะติด error ไปแล้ว
        });

        if (!res.ok) throw new Error("Network response was not ok");

        const buf = await res.arrayBuffer();
        return new File([buf], filename, { type: mimeType });
    } catch (error) {
        console.error("Error converting URL to file:", error);
        throw error;
    }
  };

  // ==========================================
  // 3. Handlers
  // ==========================================

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));

    if (name === "faculty_id") {
        setFormData(prev => ({ ...prev, faculty_id: value, department_id: "" }));
    }
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      if (!file.type.startsWith("image/")) {
          Swal.fire({ icon: 'warning', title: 'ไฟล์ไม่ถูกต้อง', text: 'กรุณาอัปโหลดไฟล์รูปภาพเท่านั้น' });
          return;
      }
      if (file.size > 5 * 1024 * 1024) { 
        Swal.fire({ icon: 'error', title: 'ขนาดใหญ่เกินไป', text: 'รูปภาพต้องไม่เกิน 5MB' });
        return;
      }
      setSelectedFile(file); 
      const reader = new FileReader();
      reader.onloadend = () => setImagePreview(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const token = localStorage.getItem("token");

    // --- Validation (เอาเช็คเบอร์โทรออก) ---
    if (!formData.title) return Swal.fire({ icon: 'warning', title: 'ข้อมูลไม่ครบ', text: 'กรุณาเลือกคำนำหน้าชื่อ' });
    if (!formData.firstname.trim() || !formData.lastname.trim()) return Swal.fire({ icon: 'warning', title: 'ข้อมูลไม่ครบ', text: 'กรุณากรอกชื่อ-นามสกุล' });
    if (!/^\d{10}$/.test(formData.student_number)) return Swal.fire({ icon: 'warning', title: 'รหัสนิสิตไม่ถูกต้อง', text: 'รหัสนิสิตต้องเป็นตัวเลข 10 หลักถ้วน' });
    if (!formData.campus_id) return Swal.fire({ icon: 'warning', title: 'ข้อมูลไม่ครบ', text: 'กรุณาเลือกวิทยาเขต' });
    if (!formData.faculty_id || !formData.department_id) return Swal.fire({ icon: 'warning', title: 'ข้อมูลไม่ครบ', text: 'กรุณาเลือกคณะและสาขาวิชา' });

    // Logic ตรวจสอบรูปภาพ
    const isGoogleLogin = formData.provider === "google";
    const hasImage = !!selectedFile || (!!formData.image_url && formData.image_url !== "");

    // ถ้าไม่ใช่ Google และไม่มีรูป -> บังคับ
    if (!isGoogleLogin && !hasImage) {
        return Swal.fire({ icon: 'warning', title: 'กรุณาอัปโหลดรูปภาพ', text: 'สำหรับผู้ใช้งานทั่วไป จำเป็นต้องอัปโหลดรูปภาพโปรไฟล์' });
    }

    setLoading(true);
    try {
        const payload = new FormData();
        payload.append("prefix", formData.title);
        payload.append("firstname", formData.firstname);
        payload.append("lastname", formData.lastname);
        payload.append("student_number", formData.student_number);
        // payload.append("phone_number", formData.phone_number); // [ลบออก] ไม่ส่งไปหลังบ้าน
        payload.append("campus_id", formData.campus_id);
        payload.append("faculty_id", formData.faculty_id);
        payload.append("department_id", formData.department_id);
        
        // --- Logic ส่งรูปภาพ ---
        if (selectedFile) {
            payload.append("profile_image", selectedFile);
        } else if (isGoogleLogin && formData.image_url) {
            try {
                const googleFile = await urlToFile(formData.image_url, "google-profile.jpg", "image/jpeg");
                payload.append("profile_image", googleFile); // นำไฟล์ที่แปลงได้ แนบเตรียมส่งไปให้ Backend
            } catch (err) {
                console.warn("Cannot convert google image to file, skipping upload");
            }
        }

        await axios.put(`${API_BASE_URL}/auth/first-login`, payload, {
             headers: { Authorization: `Bearer ${token}` }
        });
        
        await Swal.fire({
            icon: 'success',
            title: 'บันทึกข้อมูลสำเร็จ',
            text: 'ยินดีต้อนรับเข้าสู่ระบบ',
            timer: 1500,
            showConfirmButton: false
        });
        
        window.location.href = "/student/main/student-nomination-form"; 

    } catch (error: any) {
        console.error("การส่งข้อมูลผิดพลาด:", error);
        const errorMsg = error.response?.data?.message || error.response?.data?.error || "เกิดข้อผิดพลาด";
        if (errorMsg.includes("รหัสนิสิต")) Swal.fire({ icon: 'error', title: 'ข้อมูลซ้ำ', text: 'รหัสนิสิตนี้มีอยู่ในระบบแล้ว' });
        else Swal.fire({ icon: 'error', title: 'บันทึกไม่สำเร็จ', text: errorMsg });
    } finally {
        setLoading(false);
    }
  };

  // ==========================================
  // 4. Render
  // ==========================================

  if (!isPageLoaded) return (
    <div className="w-full font-sans bg-[#F8F9FA] min-h-screen p-8 flex justify-center items-center">
       <div className="flex flex-col items-center">
          <div className="w-12 h-12 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin mb-4"></div>
          <p className="text-gray-500">กำลังโหลดข้อมูล...</p>
       </div>
    </div> 
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center p-4 font-sans">
      <div className="bg-white max-w-5xl w-full rounded-3xl shadow-2xl overflow-hidden flex flex-col md:flex-row animate-fade-in-up transform transition-all hover:scale-[1.005] duration-500">
        
        {/* Left Side */}
        <div className="bg-gradient-to-br from-emerald-600 to-teal-800 md:w-1/3 p-10 text-white flex flex-col justify-between relative overflow-hidden group">
          <div className="relative z-10">
            <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center mb-8 backdrop-blur-md shadow-inner border border-white/10 group-hover:rotate-12 transition-transform duration-500">
              <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
            </div>
            <h2 className="text-4xl font-extrabold mb-4 tracking-tight">ยินดีต้อนรับ</h2>
            <p className="text-emerald-50 text-sm leading-relaxed font-light opacity-90">ระบบเสนอรายชื่อนิสิตดีเด่น<br/>มหาวิทยาลัยเกษตรศาสตร์</p>
            <div className="mt-8 w-12 h-1 bg-emerald-400 rounded-full group-hover:w-24 transition-all duration-500"></div>
          </div>
          <div className="absolute -bottom-20 -right-20 w-64 h-64 bg-emerald-500/20 rounded-full blur-3xl animate-pulse"></div>
          <div className="absolute top-10 -left-10 w-32 h-32 bg-white/10 rounded-full blur-2xl"></div>
        </div>

        {/* Right Side: Form */}
        <div className="md:w-2/3 p-8 md:p-12 overflow-y-auto max-h-[90vh] custom-scrollbar">
          <div className="mb-8 border-b border-gray-100 pb-4">
             <h3 className="text-2xl font-bold text-gray-800">ยืนยันตัวตน (ครั้งแรก)</h3>
             <p className="text-gray-400 text-sm mt-1">กรุณากรอกข้อมูลให้ครบถ้วนเพื่อเริ่มต้นใช้งาน</p>
          </div>
          
          <form onSubmit={handleSubmit} className="space-y-8">
            
            {/* Image Upload */}
            <div className="flex flex-col items-center justify-center mb-6 animate-fade-in">
                <div className="relative group cursor-pointer" onClick={() => fileInputRef.current?.click()}>
                    <div className="w-32 h-32 rounded-full overflow-hidden border-4 border-emerald-50 shadow-lg bg-gray-100 flex items-center justify-center group-hover:border-emerald-200 transition-all duration-300 transform group-hover:scale-105">
                        {imagePreview || formData.image_url ? (
                        <img 
                            src={imagePreview || formData.image_url} 
                            alt="Profile" 
                            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" 
                            referrerPolicy="no-referrer" 
                        />
                        ) : (
                            <svg className="w-12 h-12 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"></path></svg>
                        )}
                    </div>
                    <div className="absolute bottom-0 right-0 bg-emerald-600 p-2 rounded-full text-white shadow-md group-hover:bg-emerald-700 transition-colors border-2 border-white transform group-hover:rotate-12 duration-300">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z"></path><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z"></path></svg>
                    </div>
                </div>
                <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleImageChange} />
                <p className="text-xs text-gray-400 mt-2">คลิกเพื่ออัปโหลดรูปภาพ (สูงสุด 5MB)</p>
            </div>

            {/* Email */}
            <div className="space-y-2 animate-fade-in delay-100">
                <label className="block text-xs font-bold text-gray-500">อีเมล (บัญชีผู้ใช้)</label>
                <input type="text" value={formData.email} readOnly className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 text-sm text-gray-500 cursor-not-allowed focus:outline-none" />
            </div>

            {/* Personal Info Fields */}
            <div className="space-y-6 animate-fade-in delay-200">
              <h4 className="text-sm font-bold text-gray-700 uppercase tracking-wider border-l-4 border-emerald-500 pl-3">ข้อมูลส่วนตัว</h4>
              
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div className="group md:col-span-1">
                      <label className="block text-xs font-bold text-gray-700 mb-1.5">คำนำหน้า <span className="text-red-500">*</span></label>
                      <select name="title" value={formData.title} onChange={handleChange} className="w-full bg-white border border-gray-300 rounded-xl px-4 py-2.5 text-sm text-gray-800 focus:ring-4 focus:ring-emerald-100 focus:border-emerald-500 outline-none appearance-none cursor-pointer">
                          <option value="">เลือก</option>
                          {PREFIXES.map(p => <option key={p} value={p}>{p}</option>)}
                      </select>
                  </div>
                  <div className="group md:col-span-3 lg:col-span-1">
                      <label className="block text-xs font-bold text-gray-700 mb-1.5">ชื่อจริง <span className="text-red-500">*</span></label>
                      <input type="text" name="firstname" value={formData.firstname} onChange={handleChange} className="w-full bg-white border border-gray-300 rounded-xl px-4 py-2.5 text-sm text-gray-800 focus:ring-4 focus:ring-emerald-100 focus:border-emerald-500 outline-none" placeholder="ภาษาไทย" />
                  </div>
                  <div className="group md:col-span-4 lg:col-span-2">
                      <label className="block text-xs font-bold text-gray-700 mb-1.5">นามสกุล <span className="text-red-500">*</span></label>
                      <input type="text" name="lastname" value={formData.lastname} onChange={handleChange} className="w-full bg-white border border-gray-300 rounded-xl px-4 py-2.5 text-sm text-gray-800 focus:ring-4 focus:ring-emerald-100 focus:border-emerald-500 outline-none" placeholder="ภาษาไทย" />
                  </div>
              </div>

              {/* ลบช่องเบอร์โทรออก เหลือแค่รหัสนิสิต */}
              <div className="grid grid-cols-1 gap-4"> 
                  <div className="group">
                      <label className="block text-xs font-bold text-gray-700 mb-1.5">รหัสนิสิต (10 หลัก) <span className="text-red-500">*</span></label>
                      <input type="text" name="student_number" maxLength={10} value={formData.student_number} onChange={handleChange} placeholder="xxxxxxxxxx" className="w-full bg-white border border-gray-300 rounded-xl px-4 py-2.5 text-sm text-gray-800 font-mono focus:ring-4 focus:ring-emerald-100 focus:border-emerald-500 outline-none" />
                  </div>
              </div>

              <div className="grid grid-cols-1 gap-4">
                <div className="group">
                    <label className="block text-xs font-bold text-gray-700 mb-1.5">วิทยาเขต <span className="text-red-500">*</span></label>
                    <select name="campus_id" value={formData.campus_id} onChange={handleChange} className="w-full bg-white border border-gray-300 rounded-xl px-4 py-2.5 text-sm text-gray-900 focus:ring-4 focus:ring-emerald-100 focus:border-emerald-500 outline-none cursor-pointer">
                        <option value="" className="text-gray-400">-- เลือกวิทยาเขต --</option>
                        {campuses.map((c, index) => (
                            <option key={`${c.campus_id}-${index}`} value={c.campus_id} className="text-gray-900">
                                {c.campus_name} {c.campus_code ? `(${c.campus_code})` : ''}
                            </option>
                        ))}
                    </select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="group">
                    <label className="block text-xs font-bold text-gray-700 mb-1.5">คณะ <span className="text-red-500">*</span></label>
                    <select name="faculty_id" value={formData.faculty_id} onChange={handleChange} className="w-full bg-white border border-gray-300 rounded-xl px-4 py-2.5 text-sm text-gray-900 focus:ring-4 focus:ring-emerald-100 focus:border-emerald-500 outline-none cursor-pointer">
                        <option value="" className="text-gray-400">-- เลือกคณะ --</option>
                        {faculties.map(f => (
                            <option key={f.faculty_id} value={f.faculty_id} className="text-gray-900">{f.faculty_name}</option>
                        ))}
                    </select>
                </div>
                <div className="group">
                    <label className="block text-xs font-bold text-gray-700 mb-1.5">ภาควิชา/สาขา <span className="text-red-500">*</span></label>
                    <select 
                        name="department_id" 
                        value={formData.department_id} 
                        onChange={handleChange} 
                        disabled={!formData.faculty_id} 
                        className="w-full bg-white border border-gray-300 rounded-xl px-4 py-2.5 text-sm text-gray-900 focus:ring-4 focus:ring-emerald-100 focus:border-emerald-500 outline-none cursor-pointer disabled:bg-gray-100 disabled:text-gray-400 disabled:cursor-not-allowed"
                    >
                        <option value="" className="text-gray-400">-- เลือกสาขา --</option>
                        {departments.map(d => (
                            <option key={d.department_id} value={d.department_id} className="text-gray-900">
                                {d.department_name}
                            </option>
                        ))}
                    </select>
                </div>
              </div>
            </div>

            <div className="pt-8 flex justify-end animate-fade-in delay-300">
              <button type="submit" disabled={loading} className={`w-full md:w-auto px-10 py-3.5 rounded-xl font-bold text-white shadow-lg shadow-emerald-200 transition-all transform active:scale-95 flex items-center justify-center gap-2 hover:shadow-xl ${loading ? 'bg-gray-400 cursor-not-allowed' : 'bg-gradient-to-r from-emerald-500 to-teal-600 hover:to-teal-700'}`}>
                {loading ? (
                    <>
                        <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                        กำลังบันทึก...
                    </>
                ) : (
                    <>
                        <span className="relative z-10">บันทึกข้อมูล</span>
                        <svg className="w-5 h-5 relative z-10" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14 5l7 7m0 0l-7 7m7-7H3"/></svg>
                    </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}