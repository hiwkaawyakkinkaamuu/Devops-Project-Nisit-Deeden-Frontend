"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import Swal from "sweetalert2";
import axios from "axios";

// ==========================================
// 0. Configuration
// ==========================================

const API_BASE_URL = "/api"; 

interface Campus {
  campus_id: number; 
  campus_name: string; 
  campus_code?: string; 
}

interface OrganizationProfile {
  organization_name: string;
  organization_type: string;
  organization_location: string;
  organization_phone: string;
  campus_id: string;
  email: string;      
  image_url?: string;
  provider?: string; 
}

export default function OrganizationFirstLoginPage() {
  const router = useRouter();
  
  // States
  const [loading, setLoading] = useState(false);
  const [isPageLoaded, setIsPageLoaded] = useState(false);
  
  // Data Lists
  const [campuses, setCampuses] = useState<Campus[]>([]);
  
  // Form Data
  const [formData, setFormData] = useState<OrganizationProfile>({
    organization_name: "",
    organization_type: "",
    organization_location: "",
    organization_phone: "",
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
            image_url: user.image_path || "",
            campus_id: user.campus_id ? String(user.campus_id) : "",
            provider: user.provider || "local",
        }));

        // --- 2. Fetch Campuses (DB) ---
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


  // ==========================================
  // 2. Handlers
  // ==========================================

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
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

    // --- Validation ข้อมูลหน่วยงาน ---
    if (!formData.organization_name.trim()) return Swal.fire({ icon: 'warning', title: 'ข้อมูลไม่ครบ', text: 'กรุณากรอกชื่อหน่วยงาน' });
    if (!formData.organization_type.trim()) return Swal.fire({ icon: 'warning', title: 'ข้อมูลไม่ครบ', text: 'กรุณากรอกประเภทของหน่วยงาน' });
    if (!formData.organization_location.trim()) return Swal.fire({ icon: 'warning', title: 'ข้อมูลไม่ครบ', text: 'กรุณากรอกที่ตั้งหน่วยงาน' });
    if (!formData.organization_phone.trim()) return Swal.fire({ icon: 'warning', title: 'ข้อมูลไม่ครบ', text: 'กรุณากรอกเบอร์โทรติดต่อ' });
    if (!formData.campus_id) return Swal.fire({ icon: 'warning', title: 'ข้อมูลไม่ครบ', text: 'กรุณาเลือกวิทยาเขตที่ประสานงาน' });

    setLoading(true);
    try {
        const payload = new FormData();
        
        // ⚠️ แอบส่งค่าเพื่อให้ผ่าน Validation ของ Backend ที่บังคับว่าต้องมี prefix, firstname, lastname
        payload.append("prefix", "-");
        payload.append("firstname", formData.organization_name); // เอาชื่อหน่วยงานไปใส่แทน firstname เลย
        payload.append("lastname", "-");
        
        // ข้อมูลของ Organization
        payload.append("campus_id", formData.campus_id);
        payload.append("organization_name", formData.organization_name);
        payload.append("organization_type", formData.organization_type);
        payload.append("organization_location", formData.organization_location);
        payload.append("organization_phone", formData.organization_phone);
        
        // --- Logic รูปภาพ (ไม่บังคับ) ---
        // ถ้าผู้ใช้เลือกไฟล์ใหม่ถึงจะส่งไป ไม่มีการแอบดูดรูป Google แล้ว
        if (selectedFile) {
            payload.append("profile_image", selectedFile);
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
        
        // Redirect ไปหน้าหลักของหน่วยงาน (แก้ไขพาธตามโครงสร้างของคุณได้เลยครับ)
        window.location.href = "/organization/main/organization-nomination-form"; 

    } catch (error: any) {
        console.error("การส่งข้อมูลผิดพลาด:", error);
        const errorMsg = error.response?.data?.message || error.response?.data?.error || "เกิดข้อผิดพลาดในการบันทึกข้อมูล";
        Swal.fire({ icon: 'error', title: 'บันทึกไม่สำเร็จ', text: errorMsg });
    } finally {
        setLoading(false);
    }
  };

  // ==========================================
  // 3. Render
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
        <div className="bg-gradient-to-br from-blue-700 to-indigo-900 md:w-1/3 p-10 text-white flex flex-col justify-between relative overflow-hidden group">
          <div className="relative z-10">
            <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center mb-8 backdrop-blur-md shadow-inner border border-white/10 group-hover:rotate-12 transition-transform duration-500">
              <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" /></svg>
            </div>
            <h2 className="text-4xl font-extrabold mb-4 tracking-tight">ยินดีต้อนรับ</h2>
            <p className="text-blue-50 text-sm leading-relaxed font-light opacity-90">สำหรับผู้แทนหน่วยงานภายนอก<br/>ระบบเสนอรายชื่อนิสิตดีเด่น</p>
            <div className="mt-8 w-12 h-1 bg-blue-400 rounded-full group-hover:w-24 transition-all duration-500"></div>
          </div>
          <div className="absolute -bottom-20 -right-20 w-64 h-64 bg-blue-500/20 rounded-full blur-3xl animate-pulse"></div>
          <div className="absolute top-10 -left-10 w-32 h-32 bg-white/10 rounded-full blur-2xl"></div>
        </div>

        {/* Right Side: Form */}
        <div className="md:w-2/3 p-8 md:p-12 overflow-y-auto max-h-[90vh] custom-scrollbar">
          <div className="mb-8 border-b border-gray-100 pb-4">
             <h3 className="text-2xl font-bold text-gray-800">ยืนยันตัวตน (หน่วยงานภายนอก)</h3>
             <p className="text-gray-400 text-sm mt-1">กรุณากรอกข้อมูลหน่วยงานให้ครบถ้วนเพื่อเริ่มต้นใช้งาน</p>
          </div>
          
          <form onSubmit={handleSubmit} className="space-y-8">
            
            {/* Image Upload (Optional) */}
            <div className="flex flex-col items-center justify-center mb-6 animate-fade-in">
                <div className="relative group cursor-pointer" onClick={() => fileInputRef.current?.click()}>
                    <div className="w-32 h-32 rounded-full overflow-hidden border-4 border-blue-50 shadow-lg bg-gray-100 flex items-center justify-center group-hover:border-blue-200 transition-all duration-300 transform group-hover:scale-105">
                        {imagePreview || formData.image_url ? (
                        <img 
                            src={imagePreview || formData.image_url} 
                            alt="Profile" 
                            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" 
                            referrerPolicy="no-referrer" 
                        />
                        ) : (
                            <svg className="w-12 h-12 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"></path></svg>
                        )}
                    </div>
                    <div className="absolute bottom-0 right-0 bg-blue-600 p-2 rounded-full text-white shadow-md group-hover:bg-blue-700 transition-colors border-2 border-white transform group-hover:rotate-12 duration-300">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z"></path><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z"></path></svg>
                    </div>
                </div>
                <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleImageChange} />
                <p className="text-xs text-gray-400 mt-2">โลโก้หน่วยงาน (ทางเลือก - สูงสุด 5MB)</p>
            </div>

            {/* Email */}
            <div className="space-y-2 animate-fade-in delay-100">
                <label className="block text-xs font-bold text-gray-500">อีเมลหน่วยงาน (บัญชีผู้ใช้)</label>
                <input type="text" value={formData.email} readOnly className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 text-sm text-gray-500 cursor-not-allowed focus:outline-none" />
            </div>

            {/* Organization Info Fields */}
            <div className="space-y-6 animate-fade-in delay-200">
              <h4 className="text-sm font-bold text-gray-700 uppercase tracking-wider border-l-4 border-blue-500 pl-3">ข้อมูลหน่วยงาน</h4>
              
              <div className="grid grid-cols-1 gap-4">
                  <div className="group">
                      <label className="block text-xs font-bold text-gray-700 mb-1.5">ชื่อหน่วยงาน/บริษัท <span className="text-red-500">*</span></label>
                      <input type="text" name="organization_name" value={formData.organization_name} onChange={handleChange} className="w-full bg-white border border-gray-300 rounded-xl px-4 py-2.5 text-sm text-gray-800 focus:ring-4 focus:ring-blue-100 focus:border-blue-500 outline-none" placeholder="ระบุชื่อหน่วยงาน" />
                  </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4"> 
                  <div className="group">
                      <label className="block text-xs font-bold text-gray-700 mb-1.5">ประเภทของหน่วยงาน <span className="text-red-500">*</span></label>
                      <input type="text" name="organization_type" value={formData.organization_type} onChange={handleChange} placeholder="เช่น รัฐวิสาหกิจ, บริษัทเอกชน" className="w-full bg-white border border-gray-300 rounded-xl px-4 py-2.5 text-sm text-gray-800 focus:ring-4 focus:ring-blue-100 focus:border-blue-500 outline-none" />
                  </div>
                  <div className="group">
                      <label className="block text-xs font-bold text-gray-700 mb-1.5">เบอร์โทรศัพท์ <span className="text-red-500">*</span></label>
                      <input type="text" name="organization_phone" value={formData.organization_phone} onChange={handleChange} placeholder="ระบุเบอร์โทรติดต่อ" className="w-full bg-white border border-gray-300 rounded-xl px-4 py-2.5 text-sm text-gray-800 focus:ring-4 focus:ring-blue-100 focus:border-blue-500 outline-none" />
                  </div>
              </div>

              <div className="grid grid-cols-1 gap-4"> 
                  <div className="group">
                      <label className="block text-xs font-bold text-gray-700 mb-1.5">ที่ตั้งหน่วยงาน <span className="text-red-500">*</span></label>
                      <textarea name="organization_location" rows={3} value={formData.organization_location} onChange={handleChange} placeholder="ระบุที่อยู่ของหน่วยงาน" className="w-full bg-white border border-gray-300 rounded-xl px-4 py-2.5 text-sm text-gray-800 focus:ring-4 focus:ring-blue-100 focus:border-blue-500 outline-none resize-none"></textarea>
                  </div>
              </div>

              <div className="grid grid-cols-1 gap-4">
                <div className="group">
                    <label className="block text-xs font-bold text-gray-700 mb-1.5">วิทยาเขตที่ประสานงาน <span className="text-red-500">*</span></label>
                    <select name="campus_id" value={formData.campus_id} onChange={handleChange} className="w-full bg-white border border-gray-300 rounded-xl px-4 py-2.5 text-sm text-gray-900 focus:ring-4 focus:ring-blue-100 focus:border-blue-500 outline-none cursor-pointer">
                        <option value="" className="text-gray-400">-- เลือกวิทยาเขต --</option>
                        {campuses.map((c, index) => (
                            <option key={`${c.campus_id}-${index}`} value={c.campus_id} className="text-gray-900">
                                {c.campus_name} {c.campus_code ? `(${c.campus_code})` : ''}
                            </option>
                        ))}
                    </select>
                </div>
              </div>
            </div>

            <div className="pt-8 flex justify-end animate-fade-in delay-300">
              <button type="submit" disabled={loading} className={`w-full md:w-auto px-10 py-3.5 rounded-xl font-bold text-white shadow-lg shadow-blue-200 transition-all transform active:scale-95 flex items-center justify-center gap-2 hover:shadow-xl ${loading ? 'bg-gray-400 cursor-not-allowed' : 'bg-gradient-to-r from-blue-600 to-indigo-700 hover:to-indigo-800'}`}>
                {loading ? (
                    <>
                        <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                        กำลังบันทึก...
                    </>
                ) : (
                    <>
                        <span className="relative z-10">บันทึกข้อมูลหน่วยงาน</span>
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