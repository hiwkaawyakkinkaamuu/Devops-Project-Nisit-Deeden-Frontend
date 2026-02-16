"use client";

import { useState, useRef, useEffect, useMemo } from "react";
import Link from "next/link";
import Swal from "sweetalert2";
import { useRouter } from "next/navigation";
import axios from "axios";

// ==========================================
// 0. Configuration
// ==========================================

const API_BASE_URL = "/api";
const MAX_TOTAL_FILE_SIZE_BYTES = 10 * 1024 * 1024; // 10MB
const MAX_TOTAL_FILE_SIZE_MB = 10;

interface UserProfile {
  student_firstname: string;
  student_lastname: string;
  student_number: string;
  email: string;
  student_year: string;
  faculty_id: string;
  department_id: string;
  advisor_name: string;
  gpa: string;
  phone_number: string;
}

// ==========================================
// 1. Service Layer
// ==========================================

const nominationService = {
  // ดึงข้อมูล User Profile
  getProfile: async (token: string) => {
    try {
      const response = await axios.get(`${API_BASE_URL}/auth/me`, {
        headers: { Authorization: `Bearer ${token}` },
        timeout: 10000,
      });

      // 1. หา Object User
      const u = response.data.user || response.data.data || response.data;
      // 2. หา Object Student
      const st = u.Student || u.student || u.student_data || {};
      // 3. หา Faculty / Department
      const fac = st.Faculty || st.faculty || {};
      const dept = st.Department || st.department || {};

      return {
        student_firstname: u.firstname || "",
        student_lastname: u.lastname || "",
        student_number: st.student_number || "",
        email: u.email || "",
        student_year: st.year ? String(st.year) : "",
        faculty_id: fac.faculty_name || String(st.faculty_id || ""), 
        department_id: dept.department_name || String(st.department_id || ""),
        advisor_name: "", 
        gpa: "",          
        phone_number: ""  
      };
    } catch (error) {
      console.error("Error fetching profile:", error);
      return null;
    }
  },

  // ดึงปีการศึกษาปัจจุบัน
  getCurrentTerm: async (token: string) => {
    const response = await axios.get(`${API_BASE_URL}/academic-years/current/semester`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    return response.data.data;
  },

  // เช็คประวัติการส่ง
  checkSubmissionHistory: async (token: string, currentYear: number, currentSemester: number) => {
    try {
      const response = await axios.get(`${API_BASE_URL}/awards/my/submissions`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const submissions = response.data.data || [];
      return submissions.some((sub: any) => 
        Number(sub.academic_year) === Number(currentYear) && 
        Number(sub.semester) === Number(currentSemester)
      );
    } catch (error) {
      console.error("Check submission error:", error);
      return false;
    }
  },

  // ส่งข้อมูล (Submit)
  submitNomination: async (token: string, formData: FormData) => {
    const response = await axios.post(`${API_BASE_URL}/awards/submit`, formData, {
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "multipart/form-data",
      },
    });
    return response.data;
  },
};

// ==========================================
// 2. Main Component
// ==========================================

export default function StudentNominationForm() {
  const router = useRouter();

  // --- UI States ---
  const [loading, setLoading] = useState(true);
  const [hasNominated, setHasNominated] = useState(false);
  const [alreadySubmitted, setAlreadySubmitted] = useState(false);
  const [currentTermInfo, setCurrentTermInfo] = useState<{year: number, semester: number} | null>(null);

  // --- Form Data ---
  const [awardType, setAwardType] = useState(""); 
  const [activityCriteria, setActivityCriteria] = useState("");
  const [innovationQual, setInnovationQual] = useState(false);

  // คำนวณปี พ.ศ. สำหรับแสดงผล
  const displaycurrentTermInfo = currentTermInfo ? (Number(currentTermInfo.year) + 543) : "N/A";

  // Profile Data
  const [userProfile, setUserProfile] = useState<UserProfile>({
    student_firstname: "", student_lastname: "", student_number: "",
    email: "", student_year: "", faculty_id: "", department_id: "",
    advisor_name: "", gpa: "", phone_number: "",
  });

  const [dateOfBirth, setDateOfBirth] = useState("");
  const [age, setAge] = useState("");
  const [address, setAddress] = useState("");

  // Activity/Innovation Data
  const [dateReceived, setDateReceived] = useState("");
  const [projectTitle, setProjectTitle] = useState("");
  const [teamName, setTeamName] = useState("");
  const [prize, setPrize] = useState("");
  const [organizedBy, setOrganizedBy] = useState("");

  // Files
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Computed
  const totalFileSize = useMemo(
    () => selectedFiles.reduce((acc, file) => acc + file.size, 0),
    [selectedFiles]
  );
  const fileSizePercentage = (totalFileSize / MAX_TOTAL_FILE_SIZE_BYTES) * 100;

  // ==========================================
  // 3. Effects (Initialization)
  // ==========================================

  useEffect(() => {
    const init = async () => {
      setLoading(true);
      const token = localStorage.getItem("token");
      if (!token) {
        router.push("/");
        return;
      }

      try {
        // 1. ดึงปีการศึกษาปัจจุบัน
        const termData = await nominationService.getCurrentTerm(token);
        setCurrentTermInfo({ year: termData.year, semester: termData.semester });

        // 2. เช็คประวัติการส่งทันที
        if (termData) {
            const isSubmitted = await nominationService.checkSubmissionHistory(token, termData.year, termData.semester);
            if (isSubmitted) {
                setAlreadySubmitted(true);
                setLoading(false);
                return;
            }
        }

        // 3. ถ้ายังไม่ส่ง -> ดึง Profile
        const profile = await nominationService.getProfile(token);
        if (profile) {
            setUserProfile(prev => ({...prev, ...profile}));
        }

      } catch (err) {
        console.error("Init Error:", err);
      } finally {
        setLoading(false);
      }
    };

    init();
  }, [router]);

  // Helper functions
  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  const handleProfileChange = (key: keyof UserProfile, value: string) => {
    setUserProfile((prev) => ({ ...prev, [key]: value }));
  };

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value.replace(/\D/g, "");
    if (val.length <= 10) {
      setUserProfile((prev) => ({ ...prev, phone_number: val }));
    }
  };

  const handleGpaChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    if (/^\d*\.?\d{0,2}$/.test(val)) {
        setUserProfile((prev) => ({ ...prev, gpa: val }));
    }
  };

  const handleDobChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setDateOfBirth(val);
    if (val) {
      const today = new Date();
      const birthDate = new Date(val);
      let a = today.getFullYear() - birthDate.getFullYear();
      const m = today.getMonth() - birthDate.getMonth();
      if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) a--;
      setAge(a.toString());
    } else {
      setAge("");
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const newFiles = Array.from(e.target.files);
      if (newFiles.some((file) => file.type !== "application/pdf")) {
        Swal.fire({ icon: "warning", title: "ไฟล์ไม่ถูกต้อง", text: "ระบบรองรับเฉพาะไฟล์ PDF เท่านั้น" });
        if (fileInputRef.current) fileInputRef.current.value = "";
        return;
      }
      const newTotalSize = totalFileSize + newFiles.reduce((acc, f) => acc + f.size, 0);
      if (newTotalSize > MAX_TOTAL_FILE_SIZE_BYTES) {
        Swal.fire({ icon: "error", title: "พื้นที่จัดเก็บไม่พอ", text: `ขนาดไฟล์รวมเกิน ${MAX_TOTAL_FILE_SIZE_MB}MB` });
        if (fileInputRef.current) fileInputRef.current.value = "";
        return;
      }
      setSelectedFiles((prev) => [...prev, ...newFiles]);
    }
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleRemoveFile = (index: number) => {
    setSelectedFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const getLabels = () => {
    switch (awardType) {
      case "activity": return { title: "รายละเอียดกิจกรรม", name: "ชื่อโครงการ/กิจกรรม", date: "วันที่เข้าร่วมกิจกรรม", role_prize: "บทบาท/หน้าที่ (หรือรางวัลที่ได้รับ)", org: "หน่วยงานที่จัดกิจกรรม", team: "ชื่อทีม (ถ้ามี)" };
      case "innovation": return { title: "รายละเอียดผลงานนวัตกรรม", name: "ชื่อผลงานนวัตกรรม", date: "วันที่ได้รับรางวัล", role_prize: "รางวัลที่ได้รับ", org: "เวทีการประกวด", team: "ชื่อทีม (ถ้ามี)" };
      default: return { title: "", name: "", date: "", role_prize: "", org: "", team: "" };
    }
  };
  const labels = getLabels();

  // Validate Function
  const validateForm = () => {
    if (!userProfile.student_year) return "กรุณาเลือกชั้นปี";
    if (!userProfile.advisor_name.trim()) return "กรุณากรอกชื่ออาจารย์ที่ปรึกษา";
    
    if (!userProfile.student_year || !userProfile.advisor_name || !dateOfBirth || !address) return "กรุณากรอกข้อมูลส่วนตัวให้ครบทุกช่องที่มี *";
    
    if (!/^0\d{9}$/.test(userProfile.phone_number)) return "เบอร์โทรศัพท์ต้องเป็นตัวเลข 10 หลักและขึ้นต้นด้วย 0";
    if (!/^\d{10}$/.test(userProfile.student_number)) return "รหัสนิสิตต้องเป็นตัวเลข 10 หลักเท่านั้น";

    if (!address.trim()) return "กรุณากรอกที่อยู่ปัจจุบัน";
    if (!dateOfBirth) return "กรุณาระบุวันเกิด";
    
    const gpaNum = parseFloat(userProfile.gpa);
    if (isNaN(gpaNum) || gpaNum < 0 || gpaNum > 4.00) return "เกรดเฉลี่ยไม่ถูกต้อง";

    if (!awardType) return "กรุณาเลือกประเภทรางวัล";

    if (awardType === "activity") {
        if (!activityCriteria) return "กรุณาเลือกประเภทกิจกรรม (ผู้นำองค์กร/แข่งขัน/สร้างชื่อเสียง)";
        if (!projectTitle.trim()) return "กรุณากรอกชื่อโครงการ/กิจกรรม";
        if (!dateReceived) return "กรุณาระบุวันที่เข้าร่วมกิจกรรม";
        if (!prize.trim()) return "กรุณากรอกบทบาท/หน้าที่ หรือรางวัลที่ได้รับ";
    } 
    else if (awardType === "innovation") {
        if (!projectTitle.trim()) return "กรุณากรอกชื่อผลงานนวัตกรรม";
        if (!dateReceived) return "กรุณาระบุวันที่ได้รับรางวัล";
        if (!prize.trim()) return "กรุณากรอกรางวัลที่ได้รับ";
        if (!organizedBy.trim()) return "กรุณาระบุเวทีการประกวด";
    }

    if (selectedFiles.length === 0) return "กรุณาอัปโหลดเอกสารประกอบ (PDF) อย่างน้อย 1 ไฟล์";

    return null;
  };

  // ==========================================
  // 4. Submit Logic
  // ==========================================

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const errorMsg = validateForm();
    if (errorMsg) {
        Swal.fire({ icon: "warning", title: "ข้อมูลไม่ครบถ้วน", text: errorMsg, confirmButtonColor: "#F59E0B" });
        return;
    }

    const token = localStorage.getItem("token");
    if(!token) return;

    let awardTypeId = 0;
    if (awardType === "activity") awardTypeId = 1;
    else if (awardType === "innovation") awardTypeId = 2;
    else if (awardType === "behavior") awardTypeId = 3;

    const result = await Swal.fire({
      title: "ยืนยันการส่งข้อมูล?",
      text: "ตรวจสอบความถูกต้องก่อนยืนยัน ท่านสามารถส่งได้เพียง 1 ครั้งต่อภาคเรียน",
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "ยืนยัน",
      confirmButtonColor: "#10B981",
      cancelButtonText: "แก้ไข",
    });

    if (!result.isConfirmed) return;

    try {
      const formData = new FormData();
      formData.append("award_type_id", String(awardTypeId));
      formData.append("student_year", userProfile.student_year);
      formData.append("advisor_name", userProfile.advisor_name);
      formData.append("phone_number", userProfile.phone_number);
      formData.append("address", address);
      formData.append("gpa", userProfile.gpa);
      formData.append("date_of_birth", dateOfBirth);

      if (awardTypeId === 1) { // Extracurricular
          formData.append("qualification_type", "activity");
          formData.append("activity_category", activityCriteria);
          formData.append("project_title", projectTitle);
          formData.append("date_received", dateReceived);
          formData.append("prize", prize);
          formData.append("organized_by", organizedBy);
          formData.append("team_name", teamName);
      } else if (awardTypeId === 2) { // Innovation
          formData.append("team_name", teamName);
          formData.append("project_title", projectTitle);
          formData.append("prize", prize);
          formData.append("organized_by", organizedBy);
          formData.append("date_received", dateReceived);
          formData.append("competition_level", innovationQual ? "National/International" : "Local"); 
      }

      selectedFiles.forEach((file) => {
        formData.append("files", file);
      });

      await nominationService.submitNomination(token, formData);

      await Swal.fire({ icon: "success", title: "บันทึกสำเร็จ", text: "ระบบได้รับข้อมูลเรียบร้อยแล้ว", timer: 2000, showConfirmButton: false });
      setHasNominated(true);

    } catch (error: any) {
      console.error("Submit Error:", error);
      let errorMsg = "เกิดข้อผิดพลาดในการส่งข้อมูล";
      if (axios.isAxiosError(error)) {
        errorMsg = error.response?.data?.message || error.message;
      }

      if (errorMsg.toLowerCase().includes("duplicate") || errorMsg.toLowerCase().includes("unique constraint")) {
          await Swal.fire({ icon: "warning", title: "ท่านเคยเสนอชื่อไปแล้ว", text: "ระบบพบข้อมูลการสมัครในปีการศึกษานี้แล้ว" });
          setAlreadySubmitted(true);
          return;
      }

      Swal.fire({ icon: "error", title: "บันทึกไม่สำเร็จ", text: errorMsg });
    }
  };

  // ==========================================
  // 5. Render Views
  // ==========================================

  // View 1: Success (ส่งเสร็จแล้ว)
  if (hasNominated) {
    return (
      <div className="w-full h-screen flex items-center justify-center bg-gray-50 p-6">
        <div className="bg-white rounded-3xl shadow-xl p-10 text-center max-w-md w-full border border-green-100">
          <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <svg className="w-10 h-10 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path></svg>
          </div>
          <h2 className="text-2xl font-bold text-gray-800 mb-2">บันทึกข้อมูลสำเร็จ</h2>
          <p className="text-gray-500 mb-8">ระบบได้รับข้อมูลของท่านเรียบร้อยแล้ว</p>
          <Link href="/student/main/trace-nomination" className="block w-full py-3 bg-green-600 text-white rounded-xl hover:bg-green-700 font-bold transition-all shadow-md">
            ติดตามสถานะ
          </Link>
        </div>
      </div>
    );
  }

  // View 2: Already Submitted (ส่งไปแล้ว)
  if (alreadySubmitted) {
    return (
      <div className="w-full h-screen flex items-center justify-center bg-gray-50 p-6">
        <div className="bg-white rounded-3xl shadow-2xl p-10 max-w-lg w-full text-center border border-orange-100 relative overflow-hidden">
           <div className="absolute top-0 right-0 w-32 h-32 bg-orange-50 rounded-bl-full opacity-50"></div>
           <div className="relative z-10">
               <div className="w-20 h-20 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-6">
                   <svg className="w-10 h-10 text-orange-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
               </div>
               
               <h2 className="text-2xl font-bold text-gray-800 mb-3">ท่านได้ดำเนินการเสนอชื่อไปแล้ว</h2>
               <p className="text-gray-500 mb-6 leading-relaxed">
                   {/* แก้ไขตรงนี้ให้ใช้ displaycurrentTermInfo (พ.ศ.) */}
                   ระบบพบว่าท่านได้ยื่นเสนอชื่อในปีการศึกษา <span className="font-bold text-orange-600">{displaycurrentTermInfo}/{currentTermInfo?.semester}</span> แล้ว<br/>
                   <span className="text-xs text-gray-400 block mt-2">(จำกัด 1 ครั้งต่อภาคเรียน)</span>
               </p>

               <div className="flex flex-col gap-3">
                   <Link href="/student/main/trace-nomination" className="w-full py-3 bg-white border border-gray-200 text-gray-700 font-bold rounded-xl hover:bg-gray-50 transition-all">
                       ตรวจสอบสถานะ
                   </Link>
                   <Link href="/student/main/nomination-history" className="w-full py-3 bg-gradient-to-r from-orange-500 to-red-500 text-white font-bold rounded-xl hover:opacity-90 transition-all shadow-lg shadow-orange-200">
                       ดูประวัติการส่ง
                   </Link>
               </div>
           </div>
        </div>
      </div>
    );
  }

  //  View 3: Normal Form (ยังไม่เคยส่ง)
  return (
    <div className="w-full font-sans bg-[#F8F9FA] min-h-screen p-6 md:p-10 flex justify-center pb-24">
      <style jsx global>{`
        @keyframes fadeInUp { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
        .animate-fade-in-up { animation: fadeInUp 0.5s ease-out forwards; }
        .animate-delay-100 { animation-delay: 100ms; }
        .animate-delay-200 { animation-delay: 200ms; }
        .animate-delay-300 { animation-delay: 300ms; }
      `}</style>

      <div className="bg-white/90 backdrop-blur-sm rounded-[32px] shadow-lg p-8 md:p-12 w-full max-w-5xl border border-white/60 animate-fade-in-up">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 gap-4">
             <div className="w-10 h-10 border-4 border-blue-200 border-t-blue-500 rounded-full animate-spin"></div>
             <div className="text-gray-400 font-medium">กำลังโหลดข้อมูล...</div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-10">
            {/* Header */}
            <div className="border-b border-gray-100 pb-6">
              <h2 className="text-3xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600 tracking-tight">เสนอรายชื่อนิสิตดีเด่น</h2>
              <p className="text-gray-500 mt-2 text-base">กรุณากรอกข้อมูลและแนบเอกสารหลักฐานให้ครบถ้วน</p>
            </div>

            {/* 1. Award Type */}
            <div className="animate-fade-in-up animate-delay-100">
              <label className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
                <span className="w-8 h-8 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center text-sm">1</span>
                ประเภทรางวัล <span className="text-red-500">*</span>
              </label>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Card: Behavior */}
                <div onClick={() => setAwardType("behavior")} className={`cursor-pointer rounded-2xl border-2 p-6 flex flex-col items-center justify-center gap-4 transition-all duration-300 hover:shadow-lg ${awardType === "behavior" ? "border-blue-500 bg-blue-50 text-blue-700 ring-4 ring-blue-100/50" : "border-gray-100 bg-white text-gray-500 hover:border-blue-200"}`}>
                  <span className={`p-4 rounded-full ${awardType === 'behavior' ? 'bg-blue-200 text-blue-700' : 'bg-gray-100 text-gray-400'}`}>
                      <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.828 14.828a4 4 0 01-5.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                  </span>
                  <div className="text-center">
                    <span className="block text-lg font-bold">ด้านความประพฤติดี</span>
                    <span className="block text-xs opacity-70 mt-1">จิตอาสา คุณธรรม</span>
                  </div>
                </div>
                {/* Card: Innovation */}
                <div onClick={() => setAwardType("innovation")} className={`cursor-pointer rounded-2xl border-2 p-6 flex flex-col items-center justify-center gap-4 transition-all duration-300 hover:shadow-lg ${awardType === "innovation" ? "border-purple-500 bg-purple-50 text-purple-700 ring-4 ring-purple-100/50" : "border-gray-100 bg-white text-gray-500 hover:border-purple-200"}`}>
                   <span className={`p-4 rounded-full ${awardType === 'innovation' ? 'bg-purple-200 text-purple-700' : 'bg-gray-100 text-gray-400'}`}>
                      <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" /></svg>
                   </span>
                   <div className="text-center">
                    <span className="block text-lg font-bold">ด้านนวัตกรรม</span>
                    <span className="block text-xs opacity-70 mt-1">สิ่งประดิษฐ์ งานวิจัย</span>
                   </div>
                </div>
                {/* Card: Activity */}
                <div onClick={() => setAwardType("activity")} className={`cursor-pointer rounded-2xl border-2 p-6 flex flex-col items-center justify-center gap-4 transition-all duration-300 hover:shadow-lg ${awardType === "activity" ? "border-orange-500 bg-orange-50 text-orange-700 ring-4 ring-orange-100/50" : "border-gray-100 bg-white text-gray-500 hover:border-orange-200"}`}>
                   <span className={`p-4 rounded-full ${awardType === 'activity' ? 'bg-orange-200 text-orange-700' : 'bg-gray-100 text-gray-400'}`}>
                      <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M3 3v1.5M3 21v-6m0 0l2.77-.693a9 9 0 016.208.682l.108.054a9 9 0 006.086.71l3.114-.732a48.524 48.524 0 01-.005-10.499l-3.11.732a9 9 0 01-6.085-.711l-.108-.054a9 9 0 00-6.208-.682L3 4.5M3 15V4.5" /></svg>
                   </span>
                   <div className="text-center">
                    <span className="block text-lg font-bold">ด้านกิจกรรม</span>
                    <span className="block text-xs opacity-70 mt-1">ผู้นำกิจกรรม แข่งขันวิชาการ</span>
                   </div>
                </div>
              </div>
            </div>

            {/* Form Fields (Show only if type selected) */}
            {awardType && (
              <div className="space-y-10 animate-fade-in-up animate-delay-200">
                {/* 2. User Info */}
                <div className="bg-white/60 backdrop-blur-sm p-8 rounded-[24px] border border-gray-200 shadow-sm relative overflow-hidden">
                  <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-400 to-indigo-500"></div>
                  <h3 className="text-xl font-bold text-gray-800 mb-6 flex items-center gap-3">
                    <span className="w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center text-sm">2</span>
                    ข้อมูลส่วนตัว
                  </h3>

                  {/* Read Only Info */}
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
                      <div className="p-4 bg-blue-50/50 border border-blue-100 rounded-xl">
                          <span className="text-[10px] uppercase font-bold text-gray-400 block">ชื่อ-นามสกุล</span>
                          <span className="font-bold text-blue-900">{userProfile.student_firstname} {userProfile.student_lastname}</span>
                      </div>
                      <div className="p-4 bg-blue-50/50 border border-blue-100 rounded-xl">
                          <span className="text-[10px] uppercase font-bold text-gray-400 block">รหัสนิสิต</span>
                          <span className="font-mono font-bold text-blue-900">{userProfile.student_number}</span>
                      </div>
                      <div className="p-4 bg-blue-50/50 border border-blue-100 rounded-xl">
                          <span className="text-[10px] uppercase font-bold text-gray-400 block">อีเมล</span>
                          <span className="font-medium text-blue-900 truncate">{userProfile.email}</span>
                      </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
                    <div className="space-y-2">
                        <label className="text-sm font-bold text-gray-700">ชั้นปี <span className="text-red-500">*</span></label>
                        <select value={userProfile.student_year} onChange={(e) => handleProfileChange("student_year", e.target.value)} className="w-full bg-white border border-gray-300 rounded-xl px-4 py-3 text-sm focus:ring-4 focus:ring-blue-100 outline-none">
                            <option value="">-- เลือกชั้นปี --</option>
                            {[1, 2, 3, 4, 5, 6].map(y => <option key={y} value={y}>ปี {y}</option>)}
                        </select>
                    </div>
                    <div className="space-y-2">
                        <label className="text-sm font-bold text-gray-700">เกรดเฉลี่ย <span className="text-red-500">*</span></label>
                        <input type="number" step="0.01" value={userProfile.gpa} onChange={handleGpaChange} className="w-full bg-white border border-gray-300 rounded-xl px-4 py-3 text-sm focus:ring-4 focus:ring-blue-100 outline-none font-mono" />
                    </div>
                    <div className="space-y-2">
                        <label className="text-sm font-bold text-gray-700">อาจารย์ที่ปรึกษา <span className="text-red-500">*</span></label>
                        <input type="text" value={userProfile.advisor_name} onChange={(e) => handleProfileChange("advisor_name", e.target.value)} className="w-full bg-white border border-gray-300 rounded-xl px-4 py-3 text-sm focus:ring-4 focus:ring-blue-100 outline-none" />
                    </div>
                    <div className="space-y-2">
                        <label className="text-sm font-bold text-gray-700">เบอร์โทรศัพท์ <span className="text-red-500">*</span></label>
                        <input type="tel" maxLength={10} value={userProfile.phone_number} onChange={handlePhoneChange} placeholder="0xxxxxxxxx" className="w-full bg-white border border-gray-300 rounded-xl px-4 py-3 text-sm focus:ring-4 focus:ring-blue-100 outline-none font-mono" />
                    </div>
                    <div className="space-y-2">
                        <label className="text-sm font-bold text-gray-700">วันเกิด <span className="text-red-500">*</span></label>
                        <input type="date" value={dateOfBirth} onChange={handleDobChange} className="w-full bg-white border border-gray-300 rounded-xl px-4 py-3 text-sm focus:ring-4 focus:ring-blue-100 outline-none" />
                    </div>
                    <div className="space-y-2">
                        <label className="text-sm font-bold text-gray-700">อายุ</label>
                        <input type="text" readOnly value={age} className="w-full bg-gray-100 border border-gray-200 rounded-xl px-4 py-3 text-sm text-gray-500 cursor-not-allowed" />
                    </div>
                    <div className="space-y-2 md:col-span-2">
                        <label className="text-sm font-bold text-gray-700">ที่อยู่ปัจจุบัน <span className="text-red-500">*</span></label>
                        <textarea rows={2} value={address} onChange={(e) => setAddress(e.target.value)} className="w-full bg-white border border-gray-300 rounded-xl px-4 py-3 text-sm focus:ring-4 focus:ring-blue-100 outline-none resize-none" />
                    </div>
                  </div>
                </div>

                {/* 3. Award Details */}
                {awardType !== "behavior" && (
                    <div className="bg-white/60 backdrop-blur-sm p-8 rounded-[24px] border border-gray-200 shadow-sm relative overflow-hidden animate-fade-in-up">
                        <div className={`absolute top-0 left-0 w-full h-1 bg-gradient-to-r ${awardType === "innovation" ? "from-purple-400 to-pink-500" : "from-orange-400 to-red-500"}`}></div>
                        <h3 className="text-xl font-bold text-gray-800 mb-6 flex items-center gap-3">
                            <span className={`w-8 h-8 rounded-full flex items-center justify-center text-white text-sm ${awardType === "innovation" ? "bg-purple-600" : "bg-orange-500"}`}>3</span>
                            {labels.title}
                        </h3>
                        
                        <div className="space-y-6">
                            {/* Extra options for Activity */}
                            {awardType === "activity" && (
                                <div className="space-y-3">
                                    <label className="text-sm font-bold text-gray-800">เลือกประเภทกิจกรรม <span className="text-red-500">*</span></label>
                                    <div className="grid grid-cols-1 gap-3">
                                        {[
                                            { val: "committee", text: "เป็นนิสิตที่ดำเนินกิจกรรมและต้องแสดงให้เห็นว่าเมื่อดำเนินกิจกรรมแล้ว..." },
                                            { val: "competition", text: "เข้าร่วมแข่งขันทางวิชาการหรือศิลปวัฒนธรรม..." },
                                            { val: "reputation", text: "ดำรงตำแหน่งนายกองค์การบริหาร องค์การนิสิต..." }
                                        ].map((item) => (
                                            <label key={item.val} className={`flex items-start gap-3 p-4 rounded-xl border transition-all cursor-pointer ${activityCriteria === item.val ? "bg-orange-50 border-orange-300 shadow-sm" : "bg-white border-gray-200 hover:border-orange-200"}`}>
                                                <input type="radio" name="act_crit" value={item.val} checked={activityCriteria === item.val} onChange={(e) => setActivityCriteria(e.target.value)} className="mt-1 w-4 h-4 text-orange-600 focus:ring-orange-500" />
                                                <span className="text-sm text-gray-700">{item.text}</span>
                                            </label>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Extra options for Innovation */}
                            {awardType === "innovation" && (
                                <div className="p-4 bg-purple-50 rounded-xl border border-purple-100">
                                    <label className="flex items-center gap-3 cursor-pointer">
                                        <input type="checkbox" checked={innovationQual} onChange={(e) => setInnovationQual(e.target.checked)} className="w-5 h-5 text-purple-600 rounded border-gray-300 focus:ring-purple-500" />
                                        <span className="text-sm text-purple-900 font-medium">ยืนยันว่าผลงานได้รับรางวัลจากการประกวด/แข่งขัน ระดับชาติหรือนานาชาติ</span>
                                    </label>
                                </div>
                            )}

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <label className="text-sm font-bold text-gray-700">{labels.name} <span className="text-red-500">*</span></label>
                                    <input type="text" value={projectTitle} onChange={(e) => setProjectTitle(e.target.value)} className="w-full bg-white border border-gray-300 rounded-xl px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-opacity-50 focus:ring-indigo-300" />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-bold text-gray-700">{labels.date} <span className="text-red-500">*</span></label>
                                    <input type="date" value={dateReceived} onChange={(e) => setDateReceived(e.target.value)} className="w-full bg-white border border-gray-300 rounded-xl px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-opacity-50 focus:ring-indigo-300" />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-bold text-gray-700">{labels.role_prize} <span className="text-red-500">*</span></label>
                                    <input type="text" value={prize} onChange={(e) => setPrize(e.target.value)} className="w-full bg-white border border-gray-300 rounded-xl px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-opacity-50 focus:ring-indigo-300" />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-bold text-gray-700">{labels.org}</label>
                                    <input type="text" value={organizedBy} onChange={(e) => setOrganizedBy(e.target.value)} className="w-full bg-white border border-gray-300 rounded-xl px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-opacity-50 focus:ring-indigo-300" />
                                </div>
                                <div className="space-y-2 md:col-span-2">
                                    <label className="text-sm font-bold text-gray-700">{labels.team}</label>
                                    <input type="text" value={teamName} onChange={(e) => setTeamName(e.target.value)} placeholder="ระบุชื่อทีม (ถ้ามี)" className="w-full bg-white border border-gray-300 rounded-xl px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-opacity-50 focus:ring-indigo-300" />
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* 4. Files */}
                <div className="bg-white/60 backdrop-blur-sm p-8 rounded-[24px] border border-gray-200 shadow-sm animate-fade-in-up animate-delay-300">
                    <h3 className="text-xl font-bold text-gray-800 mb-6 flex items-center gap-3">
                        <span className={`w-8 h-8 rounded-full flex items-center justify-center text-white text-sm ${awardType === "behavior" ? "bg-gray-600" : "bg-gray-600"}`}>{awardType === "behavior" ? "3" : "4"}</span>
                        เอกสารประกอบ <span className="text-red-500 text-sm font-normal ml-2">* (PDF เท่านั้น)</span>
                    </h3>
                    
                    <div onClick={() => fileInputRef.current?.click()} className="bg-white border-2 border-dashed border-gray-300 rounded-2xl p-8 flex flex-col items-center justify-center cursor-pointer hover:bg-gray-50 transition-all group">
                        <div className="w-16 h-16 bg-blue-50 rounded-full flex items-center justify-center mb-4 text-blue-50 group-hover:scale-110 transition-transform">
                            <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" /></svg>
                        </div>
                        <span className="font-bold text-gray-700">คลิกเพื่ออัปโหลดไฟล์</span>
                        <span className="text-sm text-gray-400 mt-1 mb-4">สูงสุด 10MB</span>
                        
                        {/* Progress Bar */}
                        <div className="w-full max-w-xs" onClick={(e) => e.stopPropagation()}>
                            <div className="flex justify-between text-xs text-gray-500 mb-1">
                                <span>พื้นที่จัดเก็บ</span>
                                <span className={fileSizePercentage > 100 ? "text-red-500" : ""}>{formatFileSize(totalFileSize)} / 10 MB</span>
                            </div>
                            <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
                                <div className={`h-full transition-all ${fileSizePercentage > 100 ? 'bg-red-500' : 'bg-green-500'}`} style={{ width: `${Math.min(fileSizePercentage, 100)}%` }}></div>
                            </div>
                        </div>
                        <input type="file" multiple ref={fileInputRef} onChange={handleFileChange} className="hidden" accept=".pdf" />
                    </div>

                    {/* File List */}
                    {selectedFiles.length > 0 && (
                        <div className="mt-4 space-y-3">
                            {selectedFiles.map((file, idx) => (
                                <div key={idx} className="flex justify-between items-center p-3 bg-white border border-gray-200 rounded-xl shadow-sm hover:shadow-md transition-all mb-2">
                                    <div className="flex items-center gap-4 overflow-hidden">
                                        <div style={{ backgroundColor: '#FEF2F2', color: '#EF4444' }} className="w-10 h-10 rounded-lg flex items-center justify-center shrink-0">
                                            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                                <path d="M14 2H6C4.9 2 4 2.9 4 4V20C4 21.1 4.9 22 6 22H18C19.1 22 20 21.1 20 20V8L14 2Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                                                <path d="M14 2V8H20" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                                                <path d="M16 13H8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                                                <path d="M16 17H8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                                                <path d="M10 9H8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                                            </svg>
                                        </div>
                                        
                                        <div className="flex flex-col min-w-0">
                                            <span className="text-sm font-bold text-gray-700 truncate">{file.name}</span>
                                            <span className="text-xs text-gray-400">ขนาด: {formatFileSize(file.size)}</span>
                                        </div>
                                    </div>
                                    
                                    <button type="button" onClick={() => handleRemoveFile(idx)} className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-full transition-all">
                                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                                    </button>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Submit Button */}
                <div className="flex justify-end pt-4 animate-fade-in-up animate-delay-300">
                    <button type="submit" className="bg-gray-900 hover:bg-black text-white px-10 py-4 rounded-xl text-lg font-bold shadow-xl transition-all flex items-center gap-2">
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" /></svg>
                        ยืนยันการเสนอรายชื่อ
                    </button>
                </div>

              </div>
            )}
          </form>
        )}
      </div>
    </div>
  );
}