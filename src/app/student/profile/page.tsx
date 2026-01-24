"use client";

import { useState, useEffect } from "react";

interface UserProfile {
  student_id: number;
  student_number: string;
  student_firstname: string;
  student_lastname: string;
  email: string;
  phone_number: string;
  faculty_id: number;
  department_id: number;
  advisor_name: string;
  student_year: number;
  gpa: number;
  avatar_url?: string;
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

interface MasterAdvisor {
  advisor_name: string;
}

// Main Component
export default function ProfilePage() {
  const [loading, setLoading] = useState(true);

  // State ข้อมูล User
  const [profile, setProfile] = useState<UserProfile>({
    student_id: 0,
    student_number: "",
    student_firstname: "",
    student_lastname: "",
    email: "",
    phone_number: "",
    faculty_id: 0,
    department_id: 0,
    advisor_name: "",
    student_year: 0,
    gpa: 0.00,
    avatar_url: ""
  });

  // State Master Data
  const [masterFaculties, setMasterFaculties] = useState<MasterFaculty[]>([]);
  const [masterDepartments, setMasterDepartments] = useState<MasterDepartment[]>([]);
  const [advisorOptions, setAdvisorOptions] = useState<string[]>([]);

  // Fetch Data (Profile + Master Data)
  useEffect(() => {
    const fetchAllData = async () => {
      try {
        setLoading(true);
        const token = localStorage.getItem("accessToken");
        const apiUrl = process.env.NEXT_PUBLIC_API_URL || "";
        const headers = { 
            "Authorization": `Bearer ${token}`,
            "Content-Type": "application/json"
        };

        // API Calls
        // ยิงพร้อมกัน 4 เส้นเพื่อประสิทธิภาพ
        const [resProfile, resFaculties, resDepartments, resAdvisors] = await Promise.all([
             fetch(`${apiUrl}/api/profile/me`, { headers }),
             fetch(`${apiUrl}/api/master/faculties`, { headers }),
             fetch(`${apiUrl}/api/master/departments`, { headers }),
             fetch(`${apiUrl}/api/master/advisors`, { headers })
        ]);

        // ถ้า API พังหรือ 404 ให้โยน Error ไปที่ Catch เพื่อใช้ Mockup
        if (!resProfile.ok || !resFaculties.ok || !resDepartments.ok) {
            throw new Error("API Connection Failed or Not Implemented");
        }

        // ถ้า API สำเร็จ ให้ Set State ตามปกติ
        const profileData = await resProfile.json();
        setProfile(profileData.data || profileData);

        const facData = await resFaculties.json();
        setMasterFaculties(facData.data || []);

        const deptData = await resDepartments.json();
        setMasterDepartments(deptData.data || []);

        const advData = await resAdvisors.json();
        const advisors = (advData.data || []).map((a: any) => a.advisor_name || a);
        setAdvisorOptions(advisors);

      } catch (error) {
        console.warn("API Error/Not Connected. Using Mockup Data instead.");

        // Mockup Data
        
        setProfile({
            student_id: 101,
            student_number: "66104524665",
            student_firstname: "สมชาย",
            student_lastname: "ใจดี",
            email: "somchai@ku.th",
            phone_number: "0875546847",
            faculty_id: 1, 
            department_id: 10,
            advisor_name: "ดร. สมหญิง รักเรียน",
            student_year: 3, 
            gpa: 3.75,
            avatar_url: "" 
        });

        setMasterFaculties([
            { faculty_id: 1, faculty_name: "คณะวิทยาศาสตร์" },
            { faculty_id: 2, faculty_name: "คณะวิศวกรรมศาสตร์" },
            { faculty_id: 3, faculty_name: "คณะบริหารธุรกิจ" }
        ]);

        setMasterDepartments([
            { department_id: 10, department_name: "ภาควิชาวิทยาการคอมพิวเตอร์", faculty_id: 1 },
            { department_id: 11, department_name: "ภาควิชาเคมี", faculty_id: 1 },
            { department_id: 20, department_name: "ภาควิชาวิศวกรรมไฟฟ้า", faculty_id: 2 },
            { department_id: 30, department_name: "ภาควิชาการตลาด", faculty_id: 3 }
        ]);

        setAdvisorOptions(["ดร. ดิพกา สุขงาม", "ผศ.ดร. สมชาย ใจดี", "รศ.ดร. วิชัย เก่งกาจ", "ดร. สมหญิง รักเรียน"]);

      } finally {
        setLoading(false);
      }
    };

    fetchAllData();
  }, []);

  // Handlers
  const handleChange = (field: keyof UserProfile, value: string | number) => {
    setProfile(prev => {
        if (field === "faculty_id") {
            // Reset Department เมื่อเปลี่ยนคณะ
            return { ...prev, [field]: Number(value), department_id: 0 };
        }
        return { ...prev, [field]: value };
    });
  };

  // กรอง Department ตาม Faculty ที่เลือก
  const currentDepartments = masterDepartments.filter(d => d.faculty_id === Number(profile.faculty_id));

  // --- Save Logic ---
  const handleSave = async () => {
    try {
        const token = localStorage.getItem("accessToken");
        const apiUrl = process.env.NEXT_PUBLIC_API_URL || "";

        // Real API Save
        const res = await fetch(`${apiUrl}/api/profile/update`, {
            method: "PUT",
            headers: { 
                "Content-Type": "application/json", 
                "Authorization": `Bearer ${token}` 
            },
            body: JSON.stringify({
                student_firstname: profile.student_firstname,
                student_lastname: profile.student_lastname,
                email: profile.email,
                phone_number: profile.phone_number,
                faculty_id: profile.faculty_id,
                department_id: profile.department_id,
                advisor_name: profile.advisor_name
            })
        });

        if (!res.ok) {
            throw new Error("Update failed or API not ready");
        }

        alert("บันทึกข้อมูลเรียบร้อยแล้ว!");

    } catch (error: any) {
        console.warn("Save Error (API). Using Mockup Success.");
        
        // Mockup Success
        console.log("Mockup Saved Data:", profile);
        alert("บันทึกข้อมูลเรียบร้อยแล้ว! (Mockup Mode)");
    }
  };

  if (loading) {
      return <div className="p-20 text-center text-gray-500 animate-pulse">กำลังโหลดข้อมูล...</div>;
  }

  return (
    <div className="p-6 bg-gray-100 min-h-screen animate-fade-in font-sans">
      <h1 className="text-2xl font-bold text-gray-800">โปรไฟล์ผู้ใช้</h1>
      <p className="mt-2 text-gray-400 text-sm">จัดการข้อมูลส่วนตัวของคุณ</p>

      <div className="relative mt-4 w-full min-h-[600px] bg-white rounded-lg shadow-md p-8">
        <p className="text-base font-bold text-gray-800 border-b pb-2 mb-6">ข้อมูลส่วนตัว</p>

        {/* Avatar Section */}
        <div className="flex items-center gap-4 mb-8">
          <div className="rounded-full bg-gray-200 flex items-center justify-center overflow-hidden w-20 h-20 shadow-sm border border-gray-100">
            {profile.avatar_url ? (
              <img src={profile.avatar_url} alt="Profile" className="w-full h-full object-cover" />
            ) : (
              <svg className="w-10 h-10 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"></path></svg>
            )}
          </div>
          <div className="flex flex-col gap-1">
            <span className="text-lg font-bold text-gray-800">{profile.student_firstname} {profile.student_lastname}</span>
            <span className="text-sm text-gray-500">{profile.email}</span>
          </div>
        </div>

        {/* Form Fields */}
        <div className="space-y-6">
            
            {/* Row 1: ชื่อ - นามสกุล */}
            <div className="flex gap-6">
                <div className="flex flex-col gap-2 w-1/2">
                    <label className="text-sm font-bold text-gray-700">ชื่อ <span className="text-red-500">*</span></label>
                    <input
                        type="text"
                        value={profile.student_firstname}
                        onChange={(e) => handleChange("student_firstname", e.target.value)}
                        className="w-full px-4 py-2 border border-gray-200 rounded-lg bg-gray-50 text-sm text-gray-500 cursor-not-allowed focus:outline-none"
                    />
                </div>
                <div className="flex flex-col gap-2 w-1/2">
                    <label className="text-sm font-bold text-gray-700">นามสกุล <span className="text-red-500">*</span></label>
                    <input
                        type="text"
                        value={profile.student_lastname}
                        onChange={(e) => handleChange("student_lastname", e.target.value)}
                        className="w-full px-4 py-2 border border-gray-200 rounded-lg bg-gray-50 text-sm text-gray-500 cursor-not-allowed focus:outline-none"
                    />
                </div>
            </div>

            {/* Row 2: รหัสนิสิต (ReadOnly) */}
            <div className="flex gap-6">
                <div className="flex flex-col gap-2 w-1/2">
                    <label className="text-sm font-bold text-gray-700">รหัสนิสิต</label>
                    <input
                        type="text"
                        value={profile.student_number}
                        readOnly 
                        className="w-full px-4 py-2 border border-gray-200 rounded-lg bg-gray-50 text-sm text-gray-500 cursor-not-allowed focus:outline-none"
                    />
                </div>
                 <div className="w-1/2"></div>
            </div>

            {/* Row 3: คณะ - สาขา (Dynamic Dropdown) */}
            <div className="flex gap-6">
                <div className="flex flex-col gap-2 w-1/2">
                    <label className="text-sm font-bold text-gray-700">คณะ</label>
                    <select
                        value={profile.faculty_id}
                        onChange={(e) => handleChange("faculty_id", e.target.value)}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg text-sm text-gray-700 focus:ring-2 focus:ring-blue-100 focus:border-blue-400 outline-none cursor-pointer"
                    >
                        <option value={0}>-- เลือกคณะ --</option>
                        {masterFaculties.map((fac) => (
                            <option key={fac.faculty_id} value={fac.faculty_id}>{fac.faculty_name}</option>
                        ))}
                    </select>
                </div>
                <div className="flex flex-col gap-2 w-1/2">
                    <label className="text-sm font-bold text-gray-700">สาขาวิชา</label>
                    <select
                        value={profile.department_id}
                        onChange={(e) => handleChange("department_id", e.target.value)}
                        disabled={!profile.faculty_id || profile.faculty_id === 0}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg text-sm text-gray-700 focus:ring-2 focus:ring-blue-100 focus:border-blue-400 outline-none cursor-pointer disabled:bg-gray-100 disabled:cursor-not-allowed"
                    >
                        <option value={0}>-- เลือกสาขาวิชา --</option>
                        {currentDepartments.length > 0 ? (
                            currentDepartments.map((dept) => (
                                <option key={dept.department_id} value={dept.department_id}>{dept.department_name}</option>
                            ))
                        ) : (
                            <option value={0} disabled>ไม่มีสาขาวิชาในคณะนี้</option>
                        )}
                    </select>
                </div>
            </div>

            {/* Row 4: อีเมล - เบอร์โทร */}
            <div className="flex gap-6">
                <div className="flex flex-col gap-2 w-1/2">
                    <label className="text-sm font-bold text-gray-700">อีเมล <span className="text-red-500">*</span></label>
                    <input
                        type="email"
                        value={profile.email}
                        onChange={(e) => handleChange("email", e.target.value)}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg text-sm text-gray-700 focus:ring-2 focus:ring-blue-100 focus:border-blue-400 outline-none"
                    />
                </div>
                <div className="flex flex-col gap-2 w-1/2">
                    <label className="text-sm font-bold text-gray-700">เบอร์โทรศัพท์ <span className="text-red-500">*</span></label>
                    <input
                        type="tel"
                        value={profile.phone_number}
                        onChange={(e) => handleChange("phone_number", e.target.value)}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg text-sm text-gray-700 focus:ring-2 focus:ring-blue-100 focus:border-blue-400 outline-none"
                    />
                </div>
            </div>

            {/* Row 5: อาจารย์ที่ปรึกษา (Dynamic) */}
            <div className="flex gap-6">
                <div className="flex flex-col gap-2 w-1/2">
                    <label className="text-sm font-bold text-gray-700">อาจารย์ที่ปรึกษา</label>
                    <select
                        value={profile.advisor_name}
                        onChange={(e) => handleChange("advisor_name", e.target.value)}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg text-sm text-gray-700 focus:ring-2 focus:ring-blue-100 focus:border-blue-400 outline-none cursor-pointer"
                    >
                        <option value="">-- เลือกอาจารย์ที่ปรึกษา --</option>
                        {advisorOptions.map((adv, index) => (
                            <option key={index} value={adv}>{adv}</option>
                        ))}
                    </select>
                </div>
                <div className="w-1/2"></div>
            </div>

            {/* Button */}
            <div className="flex justify-end pt-6 border-t border-gray-100">
                <button
                    className="bg-[#2D2D2D] hover:bg-black text-white px-8 py-2.5 rounded-lg text-sm font-bold shadow-md hover:shadow-lg transition-all active:scale-95"
                    onClick={handleSave}
                >
                    บันทึกการเปลี่ยนแปลง
                </button>
            </div>

        </div>
      </div>

      {/* ข้อมูลการศึกษา (ReadOnly) */}
      <div className="mt-6 w-full bg-white rounded-lg shadow-md p-6 border border-gray-100">
        <p className="text-base font-bold text-gray-800 border-b pb-2 mb-4">ข้อมูลการศึกษา</p>
        <p className="text-xs text-gray-400 mb-4">รายละเอียดการศึกษาเเละผลการเรียน (ดึงจากระบบทะเบียน)</p>

        <div className="flex gap-6">
          {/* Box 1: ชั้นปี */}
          <div className="flex-1 bg-white border border-gray-200 rounded-xl p-4 flex items-center shadow-sm">
            <div className="w-12 h-12 rounded-full bg-blue-50 flex items-center justify-center mr-4">
               <span className="text-blue-600 font-bold text-lg">Y</span>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500">ชั้นปีที่ศึกษา</p>
              <p className="text-xl font-bold text-gray-800">ปี {profile.student_year}</p>
            </div>
          </div>

          {/* Box 2: GPA */}
          <div className="flex-1 bg-white border border-gray-200 rounded-xl p-4 flex items-center shadow-sm">
            <div className="w-12 h-12 rounded-full bg-yellow-50 flex items-center justify-center mr-4">
               <span className="text-yellow-600 font-bold text-lg">G</span>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500">เกรดเฉลี่ยสะสม</p>
              <p className="text-xl font-bold text-gray-800">{profile.gpa.toFixed(2)}</p>
            </div>
          </div>
        </div>
      </div>

    </div>
  );
}