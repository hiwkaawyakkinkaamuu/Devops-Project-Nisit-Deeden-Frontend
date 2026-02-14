"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import Swal from "sweetalert2";
import axios from "axios";
import { Skeleton } from "@/components/Skeleton";

// ==========================================
// 0. Configuration & Service Layer
// ==========================================

const USE_MOCK_DATA = false;
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080";

// --- Interfaces ---
interface UserProfile {
  user_id: number;
  student_number: string;
  prefix: string;
  student_firstname: string;
  student_lastname: string;
  email: string;
  campus_id: number;
  image_url?: string;
}

interface MasterCampus {
  campus_id: number;
  campus_name: string;
}

// --- Service Object ---
const firstLoginService = {
  // ดึงข้อมูลเริ่มต้น
  getInitialData: async (token: string | null) => {
    if (USE_MOCK_DATA) {
      await new Promise(r => setTimeout(r, 800));
      return { 
        profile: {
            user_id: 1,
            student_number: "",
            prefix: "ไม่ระบุ",
            student_firstname: "",
            student_lastname: "",
            email: "user@ku.th",
            campus_id: 0,
            image_url: ""
        }, 
        campuses: [
            { campus_id: 1, campus_name: "วิทยาเขตบางเขน" },
            { campus_id: 2, campus_name: "วิทยาเขตกำแพงแสน" },
            { campus_id: 3, campus_name: "วิทยาเขตศรีราชา" },
            { campus_id: 4, campus_name: "วิทยาเขตเฉลิมพระเกียรติ จังหวัดสกลนคร" }
        ] 
      };
    } else {
      try {
        const headers = { Authorization: `Bearer ${token}` };
        
        // 1. ดึงข้อมูล User (ผ่าน /auth/me) เพื่อเอาชื่อ-นามสกุลเดิม
        const resMe = await axios.get(`${API_BASE_URL}/auth/me`, { headers });
        const userData = resMe.data.user;

        // 2. ดึงข้อมูล Student (เผื่อมีอยู่แล้ว)
        let studentData = { student_number: "", prefix: "ไม่ระบุ" };
        try {
            const resStudent = await axios.get(`${API_BASE_URL}/students/me`, { headers });
            if(resStudent.data.data) {
                studentData = resStudent.data.data;
            }
        } catch (e) {
            // ถ้ายังไม่มีข้อมูล Student ให้ข้ามไป (ใช้ค่า default)
        }

        // 3. ดึงข้อมูล Campuses (ถ้ามี API นี้ ถ้าไม่มีให้ Hardcode)
        // const resCampuses = await axios.get(`${API_BASE_URL}/master/campuses`, { headers });
        const mockCampuses = [
            { campus_id: 1, campus_name: "วิทยาเขตบางเขน" },
            { campus_id: 2, campus_name: "วิทยาเขตกำแพงแสน" },
            { campus_id: 3, campus_name: "วิทยาเขตศรีราชา" },
            { campus_id: 4, campus_name: "วิทยาเขตเฉลิมพระเกียรติ จังหวัดสกลนคร" },
            { campus_id: 5, campus_name: "โครงการจัดตั้งวิทยาเขตสุพรรณบุรี" }
        ];

        return {
          profile: {
            user_id: userData.user_id,
            student_firstname: userData.firstname,
            student_lastname: userData.lastname,
            email: userData.email,
            campus_id: userData.campus_id || 0,
            image_url: userData.image_path,
            student_number: studentData.student_number || "",
            prefix: studentData.prefix || "ไม่ระบุ"
          },
          campuses: mockCampuses // หรือใช้ resCampuses.data.data
        };
      } catch (error) {
        throw error;
      }
    }
  },

  // ฟังก์ชันอัปเดตข้อมูล (ยิง 2 API: User + Student)
  updateFirstLogin: async (token: string | null, data: UserProfile) => {
    const headers = { 
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json" 
    };

    // 1. อัปเดตตาราง User (ชื่อ, นามสกุล, วิทยาเขต, สถานะ First Login)
    // เรียกไปที่ /auth/me (UpdateMe)
    await axios.put(`${API_BASE_URL}/auth/me`, {
        firstname: data.student_firstname,
        lastname: data.student_lastname,
        campus_id: Number(data.campus_id),
        is_first_login: false // ปลดล็อค
    }, { headers });

    // 2. อัปเดตตาราง Student (รหัสนิสิต, คำนำหน้า)
    // เรียกไปที่ /students/me (UpdateMyStudent)
    // Backend ต้องมี Route นี้ที่เรียก studentHandler.UpdateMyStudent
    await axios.put(`${API_BASE_URL}/students/me`, {
        student_number: data.student_number,
        prefix: data.prefix,
        // faculty_id: ... (ถ้ามีในฟอร์ม)
        // department_id: ... (ถ้ามีในฟอร์ม)
    }, { headers });

    return { success: true };
  }
};

// ==========================================
// 1. Main Component
// ==========================================

export default function FirstLoginPage() {
  const router = useRouter();
  
  // UI States
  const [loading, setLoading] = useState(false);
  const [isPageLoaded, setIsPageLoaded] = useState(false);

  // Data States
  const [formData, setFormData] = useState<UserProfile>({
    user_id: 0,
    student_number: "",
    prefix: "ไม่ระบุ",
    student_firstname: "",
    student_lastname: "",
    email: "",
    campus_id: 0,
    image_url: ""
  });
  const [masterCampuses, setMasterCampuses] = useState<MasterCampus[]>([]);

  // Image Upload States
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // ==========================================
  // 2. Effects
  // ==========================================

  useEffect(() => {
    const initData = async () => {
      try {
        const token = localStorage.getItem("token");
        if (!token) {
            // ถ้าไม่มี Token ให้ดีดกลับหน้า Login
            router.push("/");
            return;
        }

        const data = await firstLoginService.getInitialData(token);
        
        setFormData(prev => ({ 
            ...prev, 
            ...data.profile,
            // ถ้าค่าว่าง ให้ใส่ Default
            prefix: data.profile.prefix || "ไม่ระบุ"
        }));
        setMasterCampuses(data.campuses);
        setIsPageLoaded(true);

      } catch (error) {
        console.error("Initialization Error:", error);
        Swal.fire({ icon: 'error', title: 'โหลดข้อมูลไม่สำเร็จ', text: 'กรุณา Login ใหม่อีกครั้ง' });
        router.push("/");
      }
    };

    initData();
  }, [router]);

  // ==========================================
  // 3. Handlers
  // ==========================================

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      
      if (!file.type.startsWith("image/")) {
          Swal.fire({ icon: 'warning', title: 'ไฟล์ไม่ถูกต้อง', text: 'กรุณาอัปโหลดเฉพาะไฟล์รูปภาพเท่านั้น' });
          if (fileInputRef.current) fileInputRef.current.value = "";
          return;
      }

      if (file.size > 5 * 1024 * 1024) {
        Swal.fire({ icon: 'error', title: 'ไฟล์มีขนาดใหญ่เกินไป', text: 'รูปภาพต้องมีขนาดไม่เกิน 5MB' });
        if (fileInputRef.current) fileInputRef.current.value = "";
        return;
      }

      setSelectedImage(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validation
    if (!formData.student_number || !formData.student_firstname || !formData.student_lastname) {
        Swal.fire({ icon: 'warning', title: 'ข้อมูลไม่ครบถ้วน', text: 'กรุณากรอกรหัสนิสิตและชื่อ-นามสกุล' });
        return;
    }

    if (!formData.campus_id || Number(formData.campus_id) === 0) {
        Swal.fire({ icon: 'warning', title: 'กรุณาเลือกวิทยาเขต', text: 'โปรดระบุวิทยาเขตของท่านเพื่อดำเนินการต่อ' });
        return;
    }

    setLoading(true);
    try {
      const token = localStorage.getItem("token");
      
      // เรียก Service ที่เราเขียน Logic ยิง 2 API ไว้
      await firstLoginService.updateFirstLogin(token, formData);

      /* Note: ถ้าต้องการอัปโหลดรูปด้วย ต้องสร้าง API Upload แยกที่หลังบ้าน 
         เช่น POST /users/upload-image ที่รับ MultipartForm 
         แล้วค่อยเรียกเพิ่มตรงนี้
      */

      await Swal.fire({
        icon: 'success',
        title: 'บันทึกข้อมูลสำเร็จ',
        text: 'ข้อมูลของคุณได้รับการยืนยันเรียบร้อยแล้ว',
        timer: 1500,
        showConfirmButton: false
      });

      router.push("/student/student-nomination-form"); 

    } catch (error: any) {
      console.error("Submit Error:", error);
      let errorMsg = 'ไม่สามารถบันทึกข้อมูลได้';
      if (axios.isAxiosError(error)) {
          errorMsg = error.response?.data?.error || error.response?.data?.message || error.message;
      }
      Swal.fire({ icon: 'error', title: 'เกิดข้อผิดพลาด', text: errorMsg });
    } finally {
      setLoading(false);
    }
  };

  // ==========================================
  // 4. Render
  // ==========================================

  if (!isPageLoaded) return (
    <div className="w-full font-sans bg-[#F8F9FA] min-h-screen p-8 flex justify-center">
      <div className="bg-white rounded-[24px] shadow-sm p-14 min-h-[600px] w-full max-w-5xl border border-gray-100">
        <div className="mb-12 border-b border-gray-100 pb-6">
           <Skeleton className="h-10 w-1/3 mb-4" /> 
           <Skeleton className="h-5 w-1/2" />
        </div>
        <div className="space-y-12">
           <div className="grid grid-cols-3 gap-6">
              <Skeleton className="h-40 rounded-2xl" />
              <Skeleton className="h-40 rounded-2xl" />
              <Skeleton className="h-40 rounded-2xl" />
           </div>
           <div className="bg-gray-50/50 p-8 rounded-2xl border border-gray-100">
               <Skeleton className="h-8 w-40 mb-6" />
               <div className="grid grid-cols-2 gap-8">
                   <Skeleton className="h-12 w-full" />
                   <Skeleton className="h-12 w-full" />
                   <Skeleton className="h-12 w-full" />
                   <Skeleton className="h-12 w-full" />
               </div>
           </div>
        </div>
      </div>
    </div> 
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center p-4 font-sans">
      <div className="bg-white max-w-5xl w-full rounded-3xl shadow-2xl overflow-hidden flex flex-col md:flex-row animate-fade-in-up transform transition-all hover:scale-[1.01] duration-500">
        
        {/* Left Side: Banner */}
        <div className="bg-gradient-to-br from-emerald-600 to-teal-800 md:w-1/3 p-10 text-white flex flex-col justify-between relative overflow-hidden group">
          <div className="relative z-10">
            <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center mb-8 backdrop-blur-md shadow-inner border border-white/10 group-hover:rotate-12 transition-transform duration-500">
              <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
            </div>
            <h2 className="text-4xl font-extrabold mb-4 tracking-tight">ยินดีต้อนรับ</h2>
            <p className="text-emerald-50 text-sm leading-relaxed font-light opacity-90">
              ระบบเสนอรายชื่อนิสิตดีเด่น<br/>มหาวิทยาลัยเกษตรศาสตร์
            </p>
            <div className="mt-8 w-12 h-1 bg-emerald-400 rounded-full group-hover:w-24 transition-all duration-500"></div>
          </div>
          
          <div className="relative z-10 mt-10">
             <div className="flex items-center gap-2 text-xs text-emerald-200">
                {USE_MOCK_DATA && <span className="bg-yellow-400 text-yellow-900 px-2 py-0.5 rounded font-bold">MOCK MODE</span>}
                <span>กรุณาตรวจสอบข้อมูลและระบุวิทยาเขตของท่าน</span>
             </div>
          </div>

          <div className="absolute -bottom-20 -right-20 w-64 h-64 bg-emerald-500/20 rounded-full blur-3xl animate-pulse"></div>
          <div className="absolute top-10 -left-10 w-32 h-32 bg-white/10 rounded-full blur-2xl"></div>
        </div>

        {/* Right Side: Form */}
        <div className="md:w-2/3 p-8 md:p-12 overflow-y-auto max-h-[90vh] custom-scrollbar">
          <div className="mb-8 border-b border-gray-100 pb-4">
             <h3 className="text-2xl font-bold text-gray-800">ยืนยันตัวตน</h3>
             <p className="text-gray-400 text-sm mt-1">กรุณาตรวจสอบข้อมูลและตั้งค่ารูปโปรไฟล์</p>
          </div>
          
          <form onSubmit={handleSubmit} className="space-y-8">
            
            {/* Image Upload Section */}
            <div className="flex flex-col items-center justify-center mb-6 animate-fade-in">
                <div className="relative group cursor-pointer" onClick={() => fileInputRef.current?.click()}>
                    <div className="w-32 h-32 rounded-full overflow-hidden border-4 border-emerald-50 shadow-lg bg-gray-100 flex items-center justify-center group-hover:border-emerald-200 transition-all duration-300 transform group-hover:scale-105">
                        {imagePreview || formData.image_url ? (
                            <img src={imagePreview || formData.image_url} alt="Profile" className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" />
                        ) : (
                            <svg className="w-12 h-12 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"></path></svg>
                        )}
                    </div>
                    <div className="absolute bottom-0 right-0 bg-emerald-600 p-2 rounded-full text-white shadow-md group-hover:bg-emerald-700 transition-colors border-2 border-white transform group-hover:rotate-12 duration-300">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z"></path><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z"></path></svg>
                    </div>
                </div>
                <p className="text-xs text-gray-400 mt-2 font-medium">คลิกเพื่ออัปโหลดรูปโปรไฟล์ (Max 5MB)</p>
                <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleImageChange} />
            </div>

            {/* Read-Only Info Section (Email Only) */}
            <div className="space-y-5 animate-fade-in delay-100">
                <h4 className="text-sm font-bold text-gray-700 uppercase tracking-wider border-l-4 border-emerald-500 pl-3">ข้อมูลบัญชี</h4>
                
                <div className="group">
                    <label className="block text-xs font-bold text-gray-500 mb-1.5 group-hover:text-emerald-600 transition-colors">อีเมล (ใช้ระบุตัวตน)</label>
                    <input type="text" value={formData.email} readOnly className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 text-sm text-gray-500 cursor-not-allowed focus:outline-none transition-colors group-hover:bg-gray-100"/>
                </div>
            </div>

            {/* Editable Info Section */}
            <div className="space-y-5 animate-fade-in delay-200">
              <h4 className="text-sm font-bold text-gray-700 uppercase tracking-wider border-l-4 border-emerald-500 pl-3">ข้อมูลส่วนตัว</h4>
              
              {/* Student Number */}
              <div className="group">
                  <label className="block text-xs font-bold text-gray-700 mb-1.5">รหัสนิสิต <span className="text-red-500">*</span></label>
                  <input 
                    type="text" 
                    name="student_number" 
                    value={formData.student_number} 
                    onChange={handleChange} 
                    placeholder="กรอกรหัสนิสิต"
                    className="w-full bg-white border border-gray-300 rounded-xl px-4 py-2.5 text-sm text-gray-800 focus:ring-4 focus:ring-emerald-100 focus:border-emerald-500 outline-none transition-all placeholder-gray-400"
                  />
              </div>

              {/* Name Fields */}
              <div className="grid grid-cols-12 gap-4">
                  <div className="col-span-12 md:col-span-3 group">
                      <label className="block text-xs font-bold text-gray-700 mb-1.5">คำนำหน้า</label>
                      <select 
                        name="prefix" 
                        value={formData.prefix} 
                        onChange={handleChange} 
                        className="w-full bg-white border border-gray-300 rounded-xl px-3 py-2.5 text-sm text-gray-800 focus:ring-4 focus:ring-emerald-100 focus:border-emerald-500 outline-none transition-all cursor-pointer"
                      >
                        <option value="ไม่ระบุ">ไม่ระบุ</option>
                        <option value="นาย">นาย</option>
                        <option value="นาง">นาง</option>
                        <option value="นางสาว">นางสาว</option>
                      </select>
                  </div>
                  <div className="col-span-12 md:col-span-4 group">
                      <label className="block text-xs font-bold text-gray-700 mb-1.5">ชื่อจริง <span className="text-red-500">*</span></label>
                      <input 
                        type="text" 
                        name="student_firstname" 
                        value={formData.student_firstname} 
                        onChange={handleChange}
                        placeholder="ชื่อภาษาไทย" 
                        className="w-full bg-white border border-gray-300 rounded-xl px-4 py-2.5 text-sm text-gray-800 focus:ring-4 focus:ring-emerald-100 focus:border-emerald-500 outline-none transition-all placeholder-gray-400"
                      />
                  </div>
                  <div className="col-span-12 md:col-span-5 group">
                      <label className="block text-xs font-bold text-gray-700 mb-1.5">นามสกุล <span className="text-red-500">*</span></label>
                      <input 
                        type="text" 
                        name="student_lastname" 
                        value={formData.student_lastname} 
                        onChange={handleChange}
                        placeholder="นามสกุลภาษาไทย" 
                        className="w-full bg-white border border-gray-300 rounded-xl px-4 py-2.5 text-sm text-gray-800 focus:ring-4 focus:ring-emerald-100 focus:border-emerald-500 outline-none transition-all placeholder-gray-400"
                      />
                  </div>
              </div>

              {/* Campus */}
              <div className="grid grid-cols-1 gap-5">
                <div className="col-span-1">
                    <label className="block text-xs font-bold text-gray-700 mb-1.5">วิทยาเขต <span className="text-red-500">*</span></label>
                    <select 
                        name="campus_id" 
                        value={formData.campus_id} 
                        onChange={handleChange} 
                        required 
                        className="w-full bg-white border border-gray-300 rounded-xl px-4 py-3 text-sm text-gray-800 focus:ring-4 focus:ring-emerald-100 focus:border-emerald-500 outline-none cursor-pointer transition-all hover:border-emerald-400 shadow-sm"
                    >
                        <option value={0}>-- กรุณาเลือกวิทยาเขต --</option>
                        {masterCampuses.map(camp => (
                            <option key={camp.campus_id} value={camp.campus_id}>{camp.campus_name}</option>
                        ))}
                    </select>
                </div>
              </div>
            </div>

            {/* Submit Button */}
            <div className="pt-8 flex justify-end animate-fade-in delay-300">
              <button 
                type="submit" 
                disabled={loading}
                className={`w-full md:w-auto px-10 py-3.5 rounded-xl font-bold text-white shadow-lg shadow-emerald-200 transition-all transform active:scale-95 flex items-center justify-center gap-2 hover:shadow-xl
                  ${loading ? 'bg-gray-400 cursor-not-allowed' : 'bg-gradient-to-r from-emerald-500 to-teal-600 hover:to-teal-700'}
                `}
              >
                {loading ? (
                    <>
                        <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                        กำลังบันทึก...
                    </>
                ) : (
                    <>
                        <span className="relative z-10">บันทึกและดำเนินการต่อ</span>
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