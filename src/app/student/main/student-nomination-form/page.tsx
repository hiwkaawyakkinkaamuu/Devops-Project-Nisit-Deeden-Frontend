"use client";

import { useState, useRef, useEffect, useMemo, ChangeEvent } from "react";
import Link from "next/link";
import Swal from "sweetalert2";
import { useRouter } from "next/navigation";
import axios from "axios";

// ==========================================
// 0. Configuration & Types
// ==========================================

const API_BASE_URL = "/api";
const MAX_TOTAL_FILE_SIZE_BYTES = 10 * 1024 * 1024; // 10MB
const MAX_TOTAL_FILE_SIZE_MB = 10;

// Interface หลัก
interface UserProfile {
  student_firstname: string;
  student_lastname: string;
  student_number: string;
  email: string;
  student_year: string;
  faculty: string;      
  department: string;   
  advisor_name: string;
  gpa: string;
  phone_number: string;
  campus: string;       
}

interface ManualProfile {
  firstname: string;
  lastname: string;
  student_number: string;
  email: string;
  phone_number: string;
  student_year: string;
  gpa: string;
  faculty: string;
  major: string;
  campus: string;
  advisor_name: string;
  date_of_birth: string;
  age: string;
  address: string;
}

// Interface สำหรับ Sub-components Props
// แก้ไข Type ให้รองรับทั้ง Input และ Textarea เพื่อความยืดหยุ่นและแก้ Error
interface InputTextProps {
  label: string;
  value: string;
  onChange?: (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => void; 
  required?: boolean;
  readOnly?: boolean;
  bg?: string;
  type?: string;
  font?: string;
  maxLength?: number;
  containerClass?: string;
  placeholder?: string;
}

// ปรับให้รับ Type เดียวกันกับ InputTextProps เพื่อความเข้ากันได้
interface FixedLabelInputProps {
  value: string;
  onChange: (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => void;
}

interface SelectYearProps {
  value: string;
  onChange: (value: string) => void;
}

interface InputDateProps {
    label: string;
    value: string;
    onChange: (e: ChangeEvent<HTMLInputElement>) => void;
    required?: boolean;
}

// ==========================================
// 1. Service Layer
// ==========================================

const nominationService = {
  getAllFaculties: async () => {
    try {
        const response = await axios.get(`${API_BASE_URL}/faculty`);
        return response.data.data || response.data || [];
    } catch (error) {
        return [];
    }
  },

  getAllDepartments: async () => {
    try {
        const response = await axios.get(`${API_BASE_URL}/department`);
        return response.data.data || response.data || [];
    } catch (error) {
        return [];
    }
  },

  getProfile: async (token: string) => {
    try {
      const response = await axios.get(`${API_BASE_URL}/auth/me`, {
        headers: { Authorization: `Bearer ${token}` },
        timeout: 10000,
      });

      const u = response.data.user || response.data.data || response.data;
      const st = u.student_data || {}; 

      let facultyName = "-";
      let departmentName = "-";
      let campusName = "-";

      const fetchRequests: Promise<any>[] = [];
      
      if (st.faculty_id) {
          fetchRequests.push(
              axios.get(`${API_BASE_URL}/faculty/${st.faculty_id}`, { headers: { Authorization: `Bearer ${token}` } })
              .then(res => {
                  facultyName = res.data.data?.faculty_name || res.data.faculty_name || "-";
              })
              .catch(err => console.error("Failed to fetch faculty:", err))
          );
      }

      if (st.department_id) {
          fetchRequests.push(
              axios.get(`${API_BASE_URL}/department/${st.department_id}`, { headers: { Authorization: `Bearer ${token}` } })
              .then(res => {
                  departmentName = res.data.data?.department_name || res.data.department_name || "-";
              })
              .catch(err => console.error("Failed to fetch department:", err))
          );
      }

      if (u.campus_id) {
          fetchRequests.push(
              axios.get(`${API_BASE_URL}/campus`, { headers: { Authorization: `Bearer ${token}` } })
              .then(res => {
                  const campuses = res.data.data || res.data || [];
                  if (Array.isArray(campuses)) {
                      const found = campuses.find((c: any) => 
                          String(c.campusID) === String(u.campus_id) || 
                          String(c.campus_id) === String(u.campus_id)
                      );
                      if (found) {
                          campusName = found.campusName || found.campus_name || "-";
                      }
                  }
              })
              .catch(err => console.error("Failed to fetch campus list:", err))
          );
      }

      await Promise.all(fetchRequests);

      return {
        student_firstname: u.firstname || "",
        student_lastname: u.lastname || "",
        student_number: st.student_number || "",
        email: u.email || "",
        student_year: st.year ? String(st.year) : "", 
        faculty: facultyName,
        department: departmentName,
        advisor_name: "", 
        gpa: "",          
        phone_number: "",
        campus: campusName
      };
    } catch (error) {
      console.error("Error fetching profile:", error);
      return null;
    }
  },

  getCurrentTerm: async (token: string) => {
    try {
        const response = await axios.get(`${API_BASE_URL}/academic-years/current/semester`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        return response.data.data;
    } catch (e) {
        return null;
    }
  },

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

  // --- Data Lists ---
  const [faculties, setFaculties] = useState<any[]>([]);
  const [departments, setDepartments] = useState<any[]>([]);
  const [filteredDepartments, setFilteredDepartments] = useState<any[]>([]);

  // --- Form Data ---
  const [awardType, setAwardType] = useState(""); 

  const [activityCriteria, setActivityCriteria] = useState("");
  const [innovationQual, setInnovationQual] = useState(false);
  const [dateReceived, setDateReceived] = useState("");
  const [projectTitle, setProjectTitle] = useState("");
  const [teamName, setTeamName] = useState("");
  const [prize, setPrize] = useState("");
  const [organizedBy, setOrganizedBy] = useState("");

  const [otherTitle, setOtherTitle] = useState("");
  const [orgInfo, setOrgInfo] = useState({
      name: "",
      type: "คณะ/หน่วยงานภายใน",
      location: "",
      phone: ""
  });
  const [otherDetails, setOtherDetails] = useState("");

  const [userProfile, setUserProfile] = useState<UserProfile>({
    student_firstname: "", student_lastname: "", student_number: "",
    email: "", student_year: "", faculty: "", department: "",
    advisor_name: "", gpa: "", phone_number: "", campus: ""
  });
  const [dateOfBirth, setDateOfBirth] = useState("");
  const [age, setAge] = useState("");
  const [address, setAddress] = useState("");

  const [manualProfile, setManualProfile] = useState<ManualProfile>({
    firstname: "", lastname: "", student_number: "", email: "", phone_number: "",
    student_year: "", gpa: "", faculty: "", major: "", campus: "",
    advisor_name: "", date_of_birth: "", age: "", address: ""
  });

  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const displaycurrentTermInfo = currentTermInfo ? (Number(currentTermInfo.year) + 543) : "N/A";
  const totalFileSize = useMemo(() => selectedFiles.reduce((acc, file) => acc + file.size, 0), [selectedFiles]);
  const fileSizePercentage = (totalFileSize / MAX_TOTAL_FILE_SIZE_BYTES) * 100;

  // Determine Theme Color based on Award Type
  const themeColor = useMemo(() => {
      switch(awardType) {
          case 'activity': return 'orange';
          case 'innovation': return 'purple';
          case 'behavior': return 'blue';
          case 'other': return 'green';
          default: return 'gray';
      }
  }, [awardType]);

  // ==========================================
  // 3. Initialization
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
        const [facs, depts] = await Promise.all([
             nominationService.getAllFaculties(),
             nominationService.getAllDepartments()
        ]);
        setFaculties(facs);
        setDepartments(depts);

        const termData = await nominationService.getCurrentTerm(token);
        if (termData) {
            setCurrentTermInfo({ year: termData.year, semester: termData.semester });
            const isSubmitted = await nominationService.checkSubmissionHistory(token, termData.year, termData.semester);
            if (isSubmitted) {
                setAlreadySubmitted(true);
                setLoading(false);
                return;
            }
        }

        const profile = await nominationService.getProfile(token);
        if (profile) {
            setUserProfile(prev => ({...prev, ...profile}));
            // Auto-fill Location from Campus for convenience
            setOrgInfo(prev => ({ ...prev, location: profile.campus || "" }));
            setManualProfile(prev => ({ ...prev, campus: profile.campus || "" }));
        }

      } catch (err) {
        console.error("Init Error:", err);
      } finally {
        setLoading(false);
      }
    };

    init();
  }, [router]);

  // ==========================================
  // 4. Helper Functions
  // ==========================================

  useEffect(() => {
      if (manualProfile.faculty) {
          const selectedFac = faculties.find(f => f.faculty_name === manualProfile.faculty);
          if (selectedFac) {
              const filtered = departments.filter(d => d.faculty_id === selectedFac.faculty_id);
              setFilteredDepartments(filtered);
          } else {
              setFilteredDepartments(departments);
          }
      } else {
          setFilteredDepartments([]);
      }
  }, [manualProfile.faculty, faculties, departments]);

  const calculateAge = (dob: string) => {
    if (!dob) return "";
    const today = new Date();
    const birthDate = new Date(dob);
    let a = today.getFullYear() - birthDate.getFullYear();
    const m = today.getMonth() - birthDate.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) a--;
    return a.toString();
  };

  const handleDobChange = (e: ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setDateOfBirth(val);
    setAge(calculateAge(val));
  };
  
  const handleManualProfileChange = (key: keyof ManualProfile, value: string) => {
    if (key === 'date_of_birth') {
        setManualProfile(prev => ({ ...prev, date_of_birth: value, age: calculateAge(value) }));
    } else if (key === 'gpa') {
         if (/^\d*\.?\d{0,2}$/.test(value)) {
            setManualProfile(prev => ({ ...prev, gpa: value }));
         }
    } else if (key === 'phone_number' || key === 'student_number') {
         const val = value.replace(/\D/g, "");
         setManualProfile(prev => ({ ...prev, [key]: val }));
    } else {
        setManualProfile(prev => ({ ...prev, [key]: value }));
    }
  };

  const handleOrgInfoChange = (key: keyof typeof orgInfo, value: string) => {
      setOrgInfo(prev => ({ ...prev, [key]: value }));
  };

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
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

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  // ==========================================
  // 5. Validation Logic
  // ==========================================

  const validateForm = () => {
    if (!awardType) return "กรุณาเลือกประเภทรางวัล";

    if (["activity", "innovation", "behavior"].includes(awardType)) {
        if (!userProfile.student_year) return "กรุณาเลือกชั้นปี";
        if (!userProfile.advisor_name.trim()) return "กรุณากรอกชื่ออาจารย์ที่ปรึกษา";
        if (!/^0\d{9}$/.test(userProfile.phone_number)) return "เบอร์โทรศัพท์ต้องเป็นตัวเลข 10 หลัก";
        if (!address.trim()) return "กรุณากรอกที่อยู่ปัจจุบัน";
        if (!dateOfBirth) return "กรุณาระบุวันเกิด";
        
        const currentAge = parseInt(age);
        if (isNaN(currentAge) || currentAge < 18) return "อายุต้อง 18 ปีบริบูรณ์ขึ้นไป";

        const gpaNum = parseFloat(userProfile.gpa);
        if (isNaN(gpaNum) || gpaNum < 0 || gpaNum > 4.00) return "เกรดเฉลี่ยต้องอยู่ระหว่าง 0.00 - 4.00";
    }

    if (awardType === "other") {
        const mp = manualProfile;
        if (!otherTitle.trim()) return "กรุณาระบุชื่อรางวัลหรือประเภทที่ยื่น";
        if (!mp.firstname || !mp.lastname) return "กรุณากรอกชื่อ-นามสกุล";
        if (!/^\d{10}$/.test(mp.student_number)) return "รหัสนิสิตต้องเป็นตัวเลข 10 หลัก";
        if (!mp.advisor_name) return "กรุณากรอกอาจารย์ที่ปรึกษา";
        if (!mp.date_of_birth) return "กรุณาระบุวันเกิด";
        if (parseInt(mp.age) < 18) return "อายุต้อง 18 ปีบริบูรณ์ขึ้นไป";
        if (!mp.email.includes("@")) return "รูปแบบอีเมลไม่ถูกต้อง";
        if (!/^0\d{9}$/.test(mp.phone_number)) return "เบอร์โทรศัพท์ต้องเป็นตัวเลข 10 หลัก";
        if (!mp.student_year) return "กรุณาเลือกชั้นปี";
        const gpaNum = parseFloat(mp.gpa);
        if (isNaN(gpaNum) || gpaNum < 0 || gpaNum > 4.00) return "เกรดเฉลี่ยต้องอยู่ระหว่าง 0.00 - 4.00";
        if (!mp.faculty || !mp.major || !mp.campus) return "กรุณากรอกข้อมูลคณะ/สาขา/วิทยาเขต";
        if (!mp.address) return "กรุณากรอกที่อยู่";
        
        if (!orgInfo.name.trim()) return "กรุณากรอกชื่อหน่วยงาน";
        if (!orgInfo.location.trim()) return "กรุณากรอกที่ตั้งหน่วยงาน";

        if (!otherDetails.trim()) return "กรุณากรอกรายละเอียดเพิ่มเติม";
    }

    if (awardType === "activity") {
        if (!activityCriteria) return "กรุณาเลือกประเภทกิจกรรม";
        if (!projectTitle.trim()) return "กรุณากรอกชื่อโครงการ/กิจกรรม";
        if (!dateReceived) return "กรุณาระบุวันที่เข้าร่วม";
        if (!prize.trim()) return "กรุณากรอกบทบาท/หน้าที่";
        if (!organizedBy.trim()) return "กรุณาระบุหน่วยงานที่จัด";
    } 
    else if (awardType === "innovation") {
        if (!innovationQual) return "กรุณายืนยันข้อตกลง (ติ๊กถูก)";
        if (!projectTitle.trim()) return "กรุณากรอกชื่อผลงานนวัตกรรม";
        if (!dateReceived) return "กรุณาระบุวันที่ได้รับรางวัล";
        if (!prize.trim()) return "กรุณากรอกรางวัลที่ได้รับ";
        if (!organizedBy.trim()) return "กรุณาระบุเวทีการประกวด";
    }
    else if (awardType === "behavior") {
         if (!otherDetails.trim()) return "กรุณากรอกรายละเอียดเพิ่มเติม (ความประพฤติ)";
    }

    if (selectedFiles.length === 0) return "กรุณาอัปโหลดเอกสารประกอบ (PDF) อย่างน้อย 1 ไฟล์";

    return null;
  };

  // ==========================================
  // 6. Submit Logic
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
    else if (awardType === "other") awardTypeId = 4;

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

      if (awardTypeId === 4) {
          formData.append("student_firstname", manualProfile.firstname);
          formData.append("student_lastname", manualProfile.lastname);
          formData.append("student_number", manualProfile.student_number);
          formData.append("student_year", manualProfile.student_year);
          formData.append("advisor_name", manualProfile.advisor_name);
          formData.append("phone_number", manualProfile.phone_number);
          formData.append("address", manualProfile.address);
          formData.append("gpa", manualProfile.gpa);
          formData.append("date_of_birth", manualProfile.date_of_birth);
          formData.append("email", manualProfile.email);
          formData.append("faculty", manualProfile.faculty);
          formData.append("department", manualProfile.major);
          formData.append("campus", manualProfile.campus);
          
          formData.append("award_title", otherTitle);
          formData.append("organization_name", orgInfo.name);
          formData.append("organization_type", orgInfo.type);
          formData.append("organization_location", orgInfo.location);
          formData.append("organization_phone", orgInfo.phone);
          formData.append("other_details", otherDetails);
      } else {
          formData.append("student_year", userProfile.student_year);
          formData.append("advisor_name", userProfile.advisor_name);
          formData.append("phone_number", userProfile.phone_number);
          formData.append("address", address);
          formData.append("gpa", userProfile.gpa);
          formData.append("date_of_birth", dateOfBirth);
      }

      if (awardTypeId === 1) {
          formData.append("qualification_type", "activity");
          formData.append("activity_category", activityCriteria);
          formData.append("project_title", projectTitle);
          formData.append("date_received", dateReceived);
          formData.append("prize", prize);
          formData.append("organized_by", organizedBy);
          formData.append("team_name", teamName);
      } else if (awardTypeId === 2) {
          formData.append("team_name", teamName);
          formData.append("project_title", projectTitle);
          formData.append("prize", prize);
          formData.append("organized_by", organizedBy);
          formData.append("date_received", dateReceived);
          formData.append("competition_level", innovationQual ? "National/International" : "Local"); 
      } else if (awardTypeId === 3) {
          formData.append("other_details", otherDetails); 
      }

      selectedFiles.forEach((file) => {
        formData.append("files", file);
      });

      await nominationService.submitNomination(token, formData);
      setHasNominated(true);

    } catch (error: any) {
      console.error("Submit Error:", error);
      let errorMsg = "เกิดข้อผิดพลาดในการส่งข้อมูล";
      if (axios.isAxiosError(error)) {
        errorMsg = error.response?.data?.message || error.message;
      }
      if (errorMsg.toLowerCase().includes("duplicate")) {
          setAlreadySubmitted(true);
      } else {
          Swal.fire({ icon: "error", title: "บันทึกไม่สำเร็จ", text: errorMsg });
      }
    }
  };

  // ==========================================
  // 7. Render
  // ==========================================

  // --- Unified Status View ---
  const StatusView = ({ title, message, icon, color }: { title: string, message: string, icon: any, color: string }) => (
    <div className="w-full h-screen flex items-center justify-center bg-gray-50 p-6">
        <div className="bg-white rounded-[32px] shadow-xl p-10 text-center max-w-md w-full border border-gray-100 flex flex-col items-center animate-fade-in-up">
            <div className={`w-24 h-24 rounded-full bg-${color}-50 flex items-center justify-center mb-6 text-${color}-500 shadow-sm`}>
                {icon}
            </div>
            <h2 className="text-2xl font-extrabold text-gray-800 mb-3">{title}</h2>
            <p className="text-gray-500 mb-8 leading-relaxed">{message}</p>
            <Link href="/student/main/trace-nomination" className="w-full py-4 bg-gray-900 text-white rounded-2xl font-bold hover:bg-black transition-all shadow-lg hover:shadow-xl flex items-center justify-center gap-2 group">
                <span>ตรวจสอบสถานะ</span>
                <svg className="w-5 h-5 group-hover:translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14 5l7 7m0 0l-7 7m7-7H3" /></svg>
            </Link>
        </div>
    </div>
  );

  if (hasNominated) return <StatusView 
      title="บันทึกข้อมูลสำเร็จ" 
      message="ระบบได้รับข้อมูลการเสนอชื่อของท่านเรียบร้อยแล้ว ท่านสามารถติดตามสถานะการพิจารณาได้ที่เมนูติดตามสถานะ"
      color="green"
      icon={<svg className="w-12 h-12" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>} 
  />;

  if (alreadySubmitted) return <StatusView 
      title="ดำเนินการไปแล้ว" 
      message={`ท่านได้ทำการเสนอชื่อในปีการศึกษา ${displaycurrentTermInfo}/${currentTermInfo?.semester} เรียบร้อยแล้ว ไม่สามารถส่งซ้ำได้`}
      color="yellow"
      icon={<svg className="w-12 h-12" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>}
  />;

  return (
    <div className="w-full font-sans bg-[#F8F9FA] min-h-screen p-6 md:p-10 flex justify-center pb-24">
      <div className="bg-white/90 backdrop-blur-sm rounded-[32px] shadow-lg p-8 md:p-12 w-full max-w-5xl border border-white/60 animate-fade-in-up">
        {loading ? (
          <LoadingView />
        ) : (
          <form onSubmit={handleSubmit} className="space-y-10">
            {/* Header */}
            <div className="border-b border-gray-100 pb-6">
              <h2 className="text-3xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600 tracking-tight">เสนอรายชื่อนิสิตดีเด่น</h2>
              <p className="text-gray-500 mt-2 text-base">กรุณากรอกข้อมูลและแนบเอกสารหลักฐานให้ครบถ้วน</p>
            </div>

            {/* 1. Award Type Selection */}
            <div className="animate-fade-in-up animate-delay-100">
              <label className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
                {awardType !== 'other' && (
                    <span className="w-8 h-8 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center text-sm">1</span>
                )}
                ประเภทรางวัล <span className="text-red-500">*</span>
              </label>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                 <TypeCard type="activity" current={awardType} setType={setAwardType} title="ด้านกิจกรรม" subtitle="ผู้นำ/แข่งขัน" color="orange" iconPath="M3 3v1.5M3 21v-6m0 0l2.77-.693a9 9 0 016.208.682l.108.054a9 9 0 006.086.71l3.114-.732a48.524 48.524 0 01-.005-10.499l-3.11.732a9 9 0 01-6.085-.711l-.108-.054a9 9 0 00-6.208-.682L3 4.5M3 15V4.5" />
                 <TypeCard type="innovation" current={awardType} setType={setAwardType} title="ด้านนวัตกรรม" subtitle="สิ่งประดิษฐ์/วิจัย" color="purple" iconPath="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                 <TypeCard type="behavior" current={awardType} setType={setAwardType} title="ด้านความประพฤติ" subtitle="จิตอาสา/คุณธรรม" color="blue" iconPath="M14.828 14.828a4 4 0 01-5.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                 <TypeCard type="other" current={awardType} setType={setAwardType} title="ด้านอื่นๆ" subtitle="กรอกข้อมูลเอง" color="green" iconPath="M5 12h14M12 5l7 7-7 7" />
              </div>
            </div>

            {/* Form Fields */}
            {awardType && (
              <div className="space-y-10 animate-fade-in-up animate-delay-200">
                
                {/* === Type 4: Section 1 (Title) === */}
                {awardType === "other" && (
                    <div className={`bg-white/60 backdrop-blur-sm p-8 rounded-[24px] border border-${themeColor}-100 shadow-sm relative overflow-hidden`}>
                        <div className={`absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-${themeColor}-400 to-${themeColor}-600`}></div>
                        <h3 className="text-xl font-bold text-gray-800 mb-6 flex items-center gap-3">
                            <span className={`w-8 h-8 rounded-full bg-${themeColor}-600 text-white flex items-center justify-center text-sm`}>1</span>
                            ระบุชื่อรางวัล/ประเภทที่ยื่นเสนอ <span className="text-red-500">*</span>
                        </h3>
                        <InputText label="ชื่อรางวัล" value={otherTitle} onChange={(e) => setOtherTitle(e.target.value)} required placeholder="เช่น รางวัลจิตอาสาดีเด่น..." />
                    </div>
                )}
                
                {/* === Section 2: User Info === */}
                <div className={`bg-white/60 backdrop-blur-sm p-8 rounded-[24px] border border-${themeColor}-100 shadow-sm relative overflow-hidden`}>
                  <div className={`absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-${themeColor}-400 to-${themeColor}-600`}></div>
                  <h3 className="text-xl font-bold text-gray-800 mb-6 flex items-center gap-3">
                    <span className={`w-8 h-8 rounded-full bg-${themeColor}-600 text-white flex items-center justify-center text-sm`}>2</span>
                    ข้อมูลนิสิต {awardType === 'other' && <span className="text-sm font-normal text-gray-500 ml-2">(กรอกด้วยตนเอง)</span>}
                  </h3>

                  {awardType !== "other" ? (
                      // Type 1-3: Auto-filled
                      <>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
                            <ReadOnlyField label="ชื่อ-นามสกุล" value={`${userProfile.student_firstname} ${userProfile.student_lastname}`} />
                            <ReadOnlyField label="รหัสนิสิต" value={userProfile.student_number} font="font-mono" />
                            <ReadOnlyField label="อีเมล" value={userProfile.email} />
                            <ReadOnlyField label="คณะ" value={userProfile.faculty} />
                            <ReadOnlyField label="สาขา" value={userProfile.department} />
                            <ReadOnlyField label="วิทยาเขต" value={userProfile.campus} />
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
                            <SelectYear value={userProfile.student_year} onChange={(v) => setUserProfile({...userProfile, student_year: v})} />
                            <InputGPA value={userProfile.gpa} onChange={(e) => {
                                if (/^\d*\.?\d{0,2}$/.test(e.target.value)) setUserProfile({...userProfile, gpa: e.target.value});
                            }} />
                            <InputText label="อาจารย์ที่ปรึกษา" value={userProfile.advisor_name} onChange={(e) => setUserProfile({...userProfile, advisor_name: e.target.value})} required />
                            <InputPhone value={userProfile.phone_number} onChange={(e) => {
                                const val = e.target.value.replace(/\D/g, "");
                                if(val.length <= 10) setUserProfile({...userProfile, phone_number: val});
                            }} />
                            <InputDate label="วันเกิด" value={dateOfBirth} onChange={handleDobChange} required />
                            <InputText label="อายุ (ปี)" value={age} readOnly bg="bg-gray-100" />
                            <div className="md:col-span-2">
                                <label className="text-sm font-bold text-gray-700">ที่อยู่ปัจจุบัน <span className="text-red-500">*</span></label>
                                <textarea rows={2} value={address} onChange={(e) => setAddress(e.target.value)} className="w-full bg-white border border-gray-300 rounded-xl px-4 py-3 text-sm focus:ring-4 focus:ring-blue-100 outline-none resize-none" />
                            </div>
                        </div>
                      </>
                  ) : (
                      // Type 4: Manual Input
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
                           <InputText label="ชื่อจริง" value={manualProfile.firstname} onChange={(e) => handleManualProfileChange("firstname", e.target.value)} required />
                           <InputText label="นามสกุล" value={manualProfile.lastname} onChange={(e) => handleManualProfileChange("lastname", e.target.value)} required />
                           <InputText label="รหัสนิสิต" value={manualProfile.student_number} onChange={(e) => handleManualProfileChange("student_number", e.target.value)} maxLength={10} required font="font-mono" />
                           <SelectYear value={manualProfile.student_year} onChange={(v) => handleManualProfileChange("student_year", v)} />
                           <InputText label="อีเมล" value={manualProfile.email} onChange={(e) => handleManualProfileChange("email", e.target.value)} required type="email" />
                           <InputPhone value={manualProfile.phone_number} onChange={(e) => handleManualProfileChange("phone_number", e.target.value)} />
                           
                           {/* Faculty Dropdown */}
                           <div className="space-y-2">
                               <label className="text-sm font-bold text-gray-700">คณะ <span className="text-red-500">*</span></label>
                               <select value={manualProfile.faculty} onChange={(e) => handleManualProfileChange("faculty", e.target.value)} className="w-full bg-white border border-gray-300 rounded-xl px-4 py-3 text-sm focus:ring-4 focus:ring-blue-100 outline-none">
                                   <option value="">-- เลือกคณะ --</option>
                                   {faculties.map((f: any) => <option key={f.faculty_id} value={f.faculty_name}>{f.faculty_name}</option>)}
                               </select>
                           </div>

                           {/* Department Dropdown */}
                           <div className="space-y-2">
                               <label className="text-sm font-bold text-gray-700">สาขา/ภาควิชา <span className="text-red-500">*</span></label>
                               <select value={manualProfile.major} onChange={(e) => handleManualProfileChange("major", e.target.value)} className="w-full bg-white border border-gray-300 rounded-xl px-4 py-3 text-sm focus:ring-4 focus:ring-blue-100 outline-none" disabled={!manualProfile.faculty}>
                                   <option value="">-- เลือกสาขา --</option>
                                   {filteredDepartments.map((d: any) => <option key={d.department_id} value={d.department_name}>{d.department_name}</option>)}
                               </select>
                           </div>

                           <InputText label="วิทยาเขต" value={manualProfile.campus} readOnly bg="bg-gray-100" />
                           
                           <InputGPA value={manualProfile.gpa} onChange={(e) => handleManualProfileChange("gpa", e.target.value)} />
                           <InputText label="อาจารย์ที่ปรึกษา" value={manualProfile.advisor_name} onChange={(e) => handleManualProfileChange("advisor_name", e.target.value)} required />
                           <InputDate label="วันเกิด" value={manualProfile.date_of_birth} onChange={(e) => handleManualProfileChange("date_of_birth", e.target.value)} required />
                           <InputText label="อายุ (ปี)" value={manualProfile.age} readOnly bg="bg-gray-100" />
                           <div className="md:col-span-2">
                                <label className="text-sm font-bold text-gray-700">ที่อยู่ปัจจุบัน <span className="text-red-500">*</span></label>
                                <textarea rows={2} value={manualProfile.address} onChange={(e) => handleManualProfileChange("address", e.target.value)} className="w-full bg-white border border-gray-300 rounded-xl px-4 py-3 text-sm focus:ring-4 focus:ring-blue-100 outline-none resize-none" />
                           </div>
                      </div>
                  )}
                </div>
                
                {/* === Section 3 & 4 (Details) === */}
                <div className={`bg-white/60 backdrop-blur-sm p-8 rounded-[24px] border border-${themeColor}-100 shadow-sm relative overflow-hidden animate-fade-in-up`}>
                    <div className={`absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-${themeColor}-400 to-${themeColor}-600`}></div>
                    
                    {awardType === "other" ? (
                        <>
                            {/* Section 3: Organization Info (Manual Input for Name/Loc) */}
                            <h3 className="text-xl font-bold text-gray-800 mb-6 flex items-center gap-3">
                                <span className={`w-8 h-8 rounded-full flex items-center justify-center bg-${themeColor}-600 text-white text-sm`}>3</span>
                                ข้อมูลหน่วยงานที่เสนอชื่อ <span className="text-red-500 text-sm font-normal ml-2">*</span>
                            </h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-10">
                                <InputText label="ชื่อหน่วยงาน" value={orgInfo.name} onChange={(e) => handleOrgInfoChange("name", e.target.value)} required />
                                <InputText label="ประเภทหน่วยงาน" value={orgInfo.type} readOnly bg="bg-gray-100" />
                                <InputText label="ที่ตั้งหน่วยงาน" value={orgInfo.location} onChange={(e) => handleOrgInfoChange("location", e.target.value)} required />
                                <InputText label="เบอร์โทรศัพท์หน่วยงาน" value={orgInfo.phone} readOnly bg="bg-gray-100" />
                            </div>

                            {/* Section 4: Details */}
                            <h3 className="text-xl font-bold text-gray-800 mb-6 flex items-center gap-3 border-t border-gray-200 pt-8">
                                <span className={`w-8 h-8 rounded-full flex items-center justify-center bg-${themeColor}-600 text-white text-sm`}>4</span>
                                รายละเอียดเพิ่มเติม <span className="text-red-500 text-sm font-normal ml-2">*</span>
                            </h3>
                            <div className="space-y-4">
                                <textarea rows={5} value={otherDetails} onChange={(e) => setOtherDetails(e.target.value)} className="w-full bg-white border border-gray-300 rounded-xl px-4 py-3 text-sm focus:ring-4 focus:ring-blue-100 outline-none resize-y" placeholder="กรอกรายละเอียดผลงานหรือเหตุผลในการเสนอชื่อ..." />
                            </div>
                        </>
                    ) : (
                        <>
                             {/* Type 1-2-3 Details */}
                             <h3 className="text-xl font-bold text-gray-800 mb-6 flex items-center gap-3">
                                <span className={`w-8 h-8 rounded-full flex items-center justify-center bg-${themeColor}-600 text-white text-sm`}>3</span>
                                {awardType === 'behavior' ? 'รายละเอียดเพิ่มเติม' : 'รายละเอียดผลงาน'}
                             </h3>

                             {/* Behavior Type: Just textarea */}
                             {awardType === "behavior" && (
                                <div className="space-y-4">
                                    <label className="text-sm font-bold text-gray-700">รายละเอียดความประพฤติ <span className="text-red-500">*</span></label>
                                    <textarea rows={5} value={otherDetails} onChange={(e) => setOtherDetails(e.target.value)} className="w-full bg-white border border-gray-300 rounded-xl px-4 py-3 text-sm focus:ring-4 focus:ring-blue-100 outline-none resize-y" placeholder="กรอกรายละเอียดความดีหรือกิจกรรมจิตอาสาที่ทำ..." />
                                </div>
                             )}

                             {/* Activity Fields */}
                             {awardType === "activity" && (
                                <div className="space-y-6">
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
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <InputText label="ชื่อโครงการ/กิจกรรม" value={projectTitle} onChange={(e) => setProjectTitle(e.target.value)} required />
                                        <InputDate label="วันที่เข้าร่วมกิจกรรม" value={dateReceived} onChange={(e) => setDateReceived(e.target.value)} required />
                                        <InputText label="บทบาท/หน้าที่ (หรือรางวัล)" value={prize} onChange={(e) => setPrize(e.target.value)} required />
                                        <InputText label="หน่วยงานที่จัดกิจกรรม" value={organizedBy} onChange={(e) => setOrganizedBy(e.target.value)} required />
                                        <InputText label="ชื่อทีม (ถ้ามี)" value={teamName} onChange={(e) => setTeamName(e.target.value)} containerClass="md:col-span-2" />
                                    </div>
                                </div>
                             )}

                             {/* Innovation Fields */}
                             {awardType === "innovation" && (
                                <div className="space-y-6">
                                    <div className="p-4 bg-purple-50 rounded-xl border border-purple-100">
                                        <label className="flex items-center gap-3 cursor-pointer">
                                            <input type="checkbox" checked={innovationQual} onChange={(e) => setInnovationQual(e.target.checked)} className="w-5 h-5 text-purple-600 rounded border-gray-300 focus:ring-purple-500" />
                                            <span className="text-sm text-purple-900 font-medium">ยืนยันว่าผลงานได้รับรางวัลจากการประกวด/แข่งขัน ระดับชาติหรือนานาชาติ</span>
                                        </label>
                                    </div>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <InputText label="ชื่อผลงานนวัตกรรม" value={projectTitle} onChange={(e) => setProjectTitle(e.target.value)} required />
                                        <InputDate label="วันที่ได้รับรางวัล" value={dateReceived} onChange={(e) => setDateReceived(e.target.value)} required />
                                        <InputText label="รางวัลที่ได้รับ" value={prize} onChange={(e) => setPrize(e.target.value)} required />
                                        <InputText label="เวทีการประกวด" value={organizedBy} onChange={(e) => setOrganizedBy(e.target.value)} required />
                                        <InputText label="ชื่อทีม (ถ้ามี)" value={teamName} onChange={(e) => setTeamName(e.target.value)} containerClass="md:col-span-2" />
                                    </div>
                                </div>
                             )}
                        </>
                    )}
                </div>

                {/* 4. Files */}
                <div className={`bg-white/60 backdrop-blur-sm p-8 rounded-[24px] border border-${themeColor}-100 shadow-sm animate-fade-in-up animate-delay-300`}>
                    <h3 className="text-xl font-bold text-gray-800 mb-6 flex items-center gap-3">
                        <span className={`w-8 h-8 rounded-full flex items-center justify-center bg-${themeColor}-600 text-white text-sm`}>
                            {awardType === 'other' ? 5 : (awardType === 'behavior' ? 4 : 4)}
                        </span>
                        เอกสารประกอบ <span className="text-red-500 text-sm font-normal ml-2">* (PDF เท่านั้น, รวมไม่เกิน 10MB)</span>
                    </h3>
                    
                    <div onClick={() => fileInputRef.current?.click()} className="bg-white border-2 border-dashed border-gray-300 rounded-2xl p-8 flex flex-col items-center justify-center cursor-pointer hover:bg-gray-50 transition-all group">
                        <div className="w-16 h-16 bg-blue-50 rounded-full flex items-center justify-center mb-4 text-blue-50 group-hover:scale-110 transition-transform">
                             <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" /></svg>
                        </div>
                        <span className="font-bold text-gray-700">คลิกเพื่ออัปโหลดไฟล์</span>
                        <div className="w-full max-w-xs mt-4" onClick={(e) => e.stopPropagation()}>
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

                    {selectedFiles.length > 0 && (
                        <div className="mt-4 space-y-3">
                            {selectedFiles.map((file, idx) => (
                                <div key={idx} className="flex justify-between items-center p-3 bg-white border border-gray-200 rounded-xl shadow-sm">
                                    <div className="flex items-center gap-4 overflow-hidden">
                                        <div className="w-10 h-10 rounded-lg bg-red-50 text-red-500 flex items-center justify-center shrink-0">
                                            PDF
                                        </div>
                                        <div className="flex flex-col min-w-0">
                                            <span className="text-sm font-bold text-gray-700 truncate">{file.name}</span>
                                            <span className="text-xs text-gray-400">ขนาด: {formatFileSize(file.size)}</span>
                                        </div>
                                    </div>
                                    <button type="button" onClick={() => setSelectedFiles(prev => prev.filter((_, i) => i !== idx))} className="text-gray-400 hover:text-red-500">
                                        ลบ
                                    </button>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                <div className="flex justify-end pt-4 animate-fade-in-up animate-delay-300">
                    <button type="submit" className={`bg-gray-900 hover:bg-${themeColor}-700 text-white px-10 py-4 rounded-xl text-lg font-bold shadow-xl transition-all flex items-center gap-2`}>
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

// ... (Sub-components: TypeCard, ReadOnlyField, InputText, InputDate, InputPhone, InputGPA, SelectYear, LoadingView, SuccessView, AlreadySubmittedView) ...
// (Sub-components remain exactly the same as in previous correct version)
const TypeCard = ({ type, current, setType, title, subtitle, color, iconPath }: any) => (
    <div onClick={() => setType(type)} className={`cursor-pointer rounded-2xl border-2 p-4 flex flex-col items-center justify-center gap-2 transition-all hover:shadow-lg ${current === type ? `border-${color}-500 bg-${color}-50 text-${color}-700 ring-2` : "border-gray-100 bg-white text-gray-500"}`}>
        <div className={`p-3 rounded-full ${current === type ? `bg-${color}-200` : 'bg-gray-100'}`}>
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={iconPath} /></svg>
        </div>
        <div className="text-center">
            <span className="block font-bold">{title}</span>
            <span className="text-xs opacity-70">{subtitle}</span>
        </div>
    </div>
);

const ReadOnlyField = ({ label, value, font }: any) => (
    <div className="p-4 bg-blue-50/50 border border-blue-100 rounded-xl">
        <span className="text-[10px] uppercase font-bold text-gray-400 block">{label}</span>
        <span className={`font-bold text-blue-900 ${font || ""}`}>{value || "-"}</span>
    </div>
);

const InputText = ({ label, value, onChange, required, readOnly, bg, type, font, maxLength, containerClass, placeholder }: InputTextProps) => (
    <div className={`space-y-2 ${containerClass || ""}`}>
        <label className="text-sm font-bold text-gray-700">{label} {required && <span className="text-red-500">*</span>}</label>
        <input type={type || "text"} value={value} onChange={onChange} readOnly={readOnly} maxLength={maxLength} placeholder={placeholder} className={`w-full ${bg || "bg-white"} border border-gray-300 rounded-xl px-4 py-3 text-sm focus:ring-4 focus:ring-blue-100 outline-none ${font || ""}`} />
    </div>
);

const InputDate = ({ label, value, onChange, required }: InputDateProps) => (
    <div className="space-y-2">
        <label className="text-sm font-bold text-gray-700">{label} {required && <span className="text-red-500">*</span>}</label>
        <input type="date" value={value} onChange={onChange} className="w-full bg-white border border-gray-300 rounded-xl px-4 py-3 text-sm focus:ring-4 focus:ring-blue-100 outline-none" />
    </div>
);

const InputPhone = ({ value, onChange }: FixedLabelInputProps) => (
    <InputText label="เบอร์โทรศัพท์" value={value} onChange={onChange} maxLength={10} placeholder="0xxxxxxxxx" required font="font-mono" />
);

const InputGPA = ({ value, onChange }: FixedLabelInputProps) => (
    <InputText label="เกรดเฉลี่ย" value={value} onChange={onChange} type="number" required font="font-mono" />
);

const SelectYear = ({ value, onChange }: SelectYearProps) => (
    <div className="space-y-2">
        <label className="text-sm font-bold text-gray-700">ชั้นปี <span className="text-red-500">*</span></label>
        <select value={value} onChange={(e) => onChange(e.target.value)} className="w-full bg-white border border-gray-300 rounded-xl px-4 py-3 text-sm focus:ring-4 focus:ring-blue-100 outline-none">
            <option value="">-- เลือกชั้นปี --</option>
            {[1, 2, 3, 4, 5, 6].map(y => <option key={y} value={y}>ปี {y}</option>)}
        </select>
    </div>
);

const LoadingView = () => (
    <div className="flex flex-col items-center justify-center py-20 gap-4">
        <div className="w-10 h-10 border-4 border-blue-200 border-t-blue-500 rounded-full animate-spin"></div>
        <div className="text-gray-400 font-medium">กำลังโหลดข้อมูล...</div>
    </div>
);

const SuccessView = () => (
    <div className="w-full h-screen flex items-center justify-center bg-gray-50 p-6">
        <div className="bg-white rounded-3xl shadow-xl p-10 text-center max-w-md w-full border border-green-100">
            <h2 className="text-2xl font-bold text-gray-800 mb-2">บันทึกข้อมูลสำเร็จ</h2>
            <Link href="/student/main/trace-nomination" className="block w-full py-3 bg-green-600 text-white rounded-xl mt-6">ติดตามสถานะ</Link>
        </div>
    </div>
);

const AlreadySubmittedView = ({ term }: any) => (
    <div className="w-full h-screen flex items-center justify-center bg-gray-50 p-6">
        <div className="bg-white rounded-3xl shadow-xl p-10 text-center max-w-lg w-full">
            <h2 className="text-2xl font-bold text-gray-800 mb-3">ดำเนินการไปแล้ว</h2>
            <p className="text-gray-500">ปีการศึกษา {term}</p>
            <Link href="/student/main/trace-nomination" className="block w-full py-3 bg-gray-100 text-gray-700 rounded-xl mt-6">ตรวจสอบสถานะ</Link>
        </div>
    </div>
);