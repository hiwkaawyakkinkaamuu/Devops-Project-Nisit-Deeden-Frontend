"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link"; 

interface UserProfile {
  student_firstname: string;
  student_lastname: string;
  student_number: string;
  student_year: string;
  faculty_name: string;
  department_name: string;
  advisor_name: string;
  gpa: string;
  email: string;
  phone_number: string;
}

// Main Component
export default function StudentNominationForm() {
  const [loading, setLoading] = useState(true);
  const [hasNominated, setHasNominated] = useState(false);

  // Form State
  const [awardType, setAwardType] = useState(""); 
  const [activityCriteria, setActivityCriteria] = useState("");
  
  // ข้อมูลส่วนตัว (รวม GPA และ ชั้นปี)
  const [userProfile, setUserProfile] = useState<UserProfile>({
    student_firstname: "", 
    student_lastname: "", 
    student_number: "", 
    student_year: "", 
    faculty_name: "", 
    department_name: "", 
    advisor_name: "", 
    gpa: "", 
    email: "", 
    phone_number: ""
  });

  // ข้อมูลที่ต้องกรอกเอง
  const [dateOfBirth, setDateOfBirth] = useState("");
  const [age, setAge] = useState("");
  const [address, setAddress] = useState("");

  // ข้อมูลรางวัล
  const [dateReceived, setDateReceived] = useState("");
  const [projectTitle, setProjectTitle] = useState("");
  const [teamName, setTeamName] = useState("");
  const [prize, setPrize] = useState("");
  const [organizedBy, setOrganizedBy] = useState("");
  const [innovationQual, setInnovationQual] = useState(false);

  // Files
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Fetch Data
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const token = localStorage.getItem("accessToken");
        const apiUrl = process.env.NEXT_PUBLIC_API_URL || "";

        // API Logic
        const [resProfile, resStatus] = await Promise.all([
            fetch(`${apiUrl}/api/profile/me`, { headers: { "Authorization": `Bearer ${token}` } }),
            fetch(`${apiUrl}/api/nomination/check-status`, { headers: { "Authorization": `Bearer ${token}` } }) 
        ]);

        if (resProfile.ok) {
            const data = await resProfile.json();
            setUserProfile(data.data || data);
        }
        if (resStatus.ok) {
            const statusData = await resStatus.json();
            if (statusData.has_nominated) setHasNominated(true);
        }

        // [MOCKUP]
        const mockProfile: UserProfile = {
            student_firstname: "สมชาย",
            student_lastname: "ใจดี",
            student_number: "66104524665",
            student_year: "3",
            faculty_name: "คณะวิทยาศาสตร์",
            department_name: "ภาควิชาวิทยาการคอมพิวเตอร์",
            advisor_name: "ดร. สมหญิง รักเรียน", 
            gpa: "3.75", 
            email: "somchai@ku.th",
            phone_number: "0812345678"
        };
        setUserProfile(mockProfile);

        // Mock Status
        const isAlreadySubmitted = false; 
        if (isAlreadySubmitted) setHasNominated(true);
        
      } catch (error) {
        console.warn("Error:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  // Handlers
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
      if (newFiles.some(file => file.type !== "application/pdf")) {
          alert("กรุณาอัปโหลดเฉพาะไฟล์ PDF เท่านั้น");
          if (fileInputRef.current) fileInputRef.current.value = "";
          return;
      }
      setSelectedFiles(prev => [...prev, ...newFiles]);
    }
    if (fileInputRef.current) fileInputRef.current.value = ""; 
  };

  const handleRemoveFile = (index: number) => {
    setSelectedFiles(prev => prev.filter((_, i) => i !== index));
  };

  // Submit Logic
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validation
    if (parseInt(age) < 17) return alert("อายุต้อง 17 ปีขึ้นไป");
    if (awardType === "activity" && !activityCriteria) return alert("เลือกคุณสมบัติกิจกรรม");
    if (awardType === "innovation" && !innovationQual) return alert("กรุณายืนยันคุณสมบัตินวัตกรรม");
    if (awardType !== "behavior" && selectedFiles.length === 0) return alert("อัปโหลดเอกสารประกอบ");

    try {
        const token = localStorage.getItem("accessToken");
        const apiUrl = process.env.NEXT_PUBLIC_API_URL || "";

        let awardTypeId = "1";
        if (awardType === "innovation") awardTypeId = "2";
        if (awardType === "activity") awardTypeId = "3";

        const formData = new FormData();
        formData.append("award_type_id", awardTypeId);
        formData.append("student_number", userProfile.student_number);
        formData.append("student_year", userProfile.student_year);
        formData.append("gpa", userProfile.gpa);
        formData.append("advisor_name", userProfile.advisor_name);
        formData.append("phone_number", userProfile.phone_number);
        formData.append("date_of_birth", dateOfBirth);
        formData.append("address", address);

        if (awardType === "activity") {
            formData.append("activity_category", "Sports");
            formData.append("qualification_type", activityCriteria);
        }
        
        if (awardType !== "behavior") {
             formData.append("date_received", dateReceived);
             formData.append("project_title", projectTitle);
             formData.append("team_name", teamName);
             formData.append("prize", prize);
             formData.append("organized_by", organizedBy);
        }

        selectedFiles.forEach((file) => formData.append("files", file));

        // [API] Submit
        const response = await fetch(`${apiUrl}/api/nomination/submit`, {
            method: "POST",
            headers: { "Authorization": `Bearer ${token}` },
            body: formData, 
        });
        if (!response.ok) throw new Error("Submission failed");

        // MOCKUP Success Flow
        setHasNominated(true); 

    } catch (error) {
        setHasNominated(true); 
    }
  };

  // Render Conditions

  if (loading) return <div className="p-20 text-center animate-pulse text-gray-500">กำลังโหลดข้อมูลโปรไฟล์...</div>;

  // 1. Success Screen
  if (hasNominated) {
      return (
        <div className="w-full h-full flex items-center justify-center py-20">
            <div className="bg-white rounded-[24px] shadow-sm p-12 text-center max-w-lg w-full border border-gray-100 animate-scale-up">
                <div className="w-24 h-24 bg-green-50 rounded-full flex items-center justify-center mx-auto mb-6">
                    <svg className="w-12 h-12 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                    </svg>
                </div>
                <h2 className="text-3xl font-bold text-gray-800 mb-3">ดำเนินการสำเร็จ</h2>
                <p className="text-gray-500 mb-10 leading-relaxed">
                    คุณได้เสนอรายชื่อนิสิตดีเด่นเรียบร้อยแล้ว<br/>
                    ไม่สามารถส่งซ้ำได้ในรอบนี้
                </p>
                
                <div className="flex flex-col gap-3">
                    <Link href="/student/trace-nomination" className="w-full px-6 py-3.5 bg-blue-600 text-white rounded-xl text-base font-bold hover:bg-blue-700 transition-all shadow-md hover:shadow-lg">
                        ติดตามสถานะ
                    </Link>
                </div>
            </div>
        </div>
      );
  }

  // 2. Main Form
  return (
    <div className="w-full font-sans">
      <div className="bg-white rounded-[24px] shadow-sm p-8 md:p-12 min-h-[600px]">
        
        {/* Header */}
        <div className="mb-10 border-b border-gray-100 pb-6">
            <h2 className="text-3xl font-bold text-gray-900">เสนอรายชื่อนิสิตดีเด่น</h2>
            <p className="text-gray-500 mt-2 text-sm">กรุณากรอกข้อมูลให้ครบถ้วนเพื่อดำเนินการเสนอรายชื่อ</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-10">
            
            {/* 1. Award Selector */}
            <div className="space-y-3">
                <label className="text-sm font-bold text-gray-800 flex items-center gap-1">
                    ประเภทรางวัล <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                    <select 
                        value={awardType}
                        onChange={(e) => setAwardType(e.target.value)}
                        className="w-full md:w-1/2 bg-gray-50 border border-gray-200 rounded-xl px-4 py-3.5 text-gray-700 font-medium cursor-pointer focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all hover:bg-white"
                    >
                        <option value="">-- กรุณาเลือกประเภทรางวัลเพื่อเริ่ม --</option>
                        <option value="behavior">ด้านความประพฤติดีเด่น</option>
                        <option value="innovation">ด้านความคิดสร้างสรรค์และนวัตกรรม</option>
                        <option value="activity">ด้านกิจกรรมเสริมหลักสูตร</option>
                    </select>
                </div>
            </div>

            {/* Form Content */}
            {awardType && (
                <div className="space-y-10 animate-fade-in">
                    
                    {/* Part A: ข้อมูลนิสิต (Read Only) */}
                    <div className="space-y-6">
                        <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2">
                            <span className="w-1.5 h-6 bg-blue-600 rounded-full"></span>
                            ข้อมูลส่วนตัว
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
                            <div className="space-y-2">
                                <label className="text-sm font-semibold text-gray-500">ชื่อ-นามสกุล</label>
                                <div className="w-full bg-gray-100 border border-gray-200 rounded-xl px-4 py-3 text-sm text-gray-500 cursor-not-allowed">
                                    {userProfile.student_firstname} {userProfile.student_lastname}
                                </div>
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-semibold text-gray-500">รหัสนิสิต</label>
                                <div className="w-full bg-gray-100 border border-gray-200 rounded-xl px-4 py-3 text-sm text-gray-500 cursor-not-allowed">
                                    {userProfile.student_number}
                                </div>
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-semibold text-gray-500">ชั้นปี</label>
                                <div className="w-full bg-gray-100 border border-gray-200 rounded-xl px-4 py-3 text-sm text-gray-500 cursor-not-allowed">
                                    {userProfile.student_year}
                                </div>
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-semibold text-gray-500">เกรดเฉลี่ยสะสม</label>
                                <div className="w-full bg-gray-100 border border-gray-200 rounded-xl px-4 py-3 text-sm text-gray-500 cursor-not-allowed">
                                    {userProfile.gpa}
                                </div>
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-semibold text-gray-500">คณะ/สาขา</label>
                                <div className="w-full bg-gray-100 border border-gray-200 rounded-xl px-4 py-3 text-sm text-gray-500 cursor-not-allowed">
                                    {userProfile.faculty_name} / {userProfile.department_name}
                                </div>
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-semibold text-gray-500">อาจารย์ที่ปรึกษา</label>
                                <div className="w-full bg-gray-100 border border-gray-200 rounded-xl px-4 py-3 text-sm text-gray-500 cursor-not-allowed">
                                    {userProfile.advisor_name}
                                </div>
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-semibold text-gray-500">อีเมล</label>
                                <div className="w-full bg-gray-100 border border-gray-200 rounded-xl px-4 py-3 text-sm text-gray-500 cursor-not-allowed">
                                    {userProfile.email}
                                </div>
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-semibold text-gray-500">เบอร์โทรศัพท์</label>
                                <div className="w-full bg-gray-100 border border-gray-200 rounded-xl px-4 py-3 text-sm text-gray-500 cursor-not-allowed">
                                    {userProfile.phone_number}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Part B: ข้อมูลเพิ่มเติม (Editable) */}
                    <div className="space-y-6">
                        <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2">
                            <span className="w-1.5 h-6 bg-orange-500 rounded-full"></span>
                            ข้อมูลเพิ่มเติม
                        </h3>
                        <div className="p-6 bg-orange-50/30 rounded-2xl border border-orange-100 grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
                            <div className="space-y-2">
                                <label className="text-sm font-bold text-gray-800">วันเกิด <span className="text-red-500">*</span></label>
                                <input required type="date" value={dateOfBirth} onChange={handleDobChange} className="w-full bg-white border border-gray-200 rounded-xl px-4 py-3 text-sm cursor-pointer focus:ring-2 focus:ring-orange-200 outline-none transition-all" />
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-bold text-gray-800">อายุ (ปี)</label>
                                <input readOnly type="text" value={age} className="w-full bg-gray-100 border border-gray-200 rounded-xl px-4 py-3 text-sm text-gray-500 cursor-not-allowed" placeholder="คำนวณอัตโนมัติ" />
                            </div>
                            <div className="space-y-2 md:col-span-2">
                                <label className="text-sm font-bold text-gray-800">ที่อยู่ <span className="text-red-500">*</span></label>
                                <textarea required rows={3} value={address} onChange={e => setAddress(e.target.value)} className="w-full bg-white border border-gray-200 rounded-xl px-4 py-3 text-sm resize-none focus:ring-2 focus:ring-orange-200 outline-none transition-all"></textarea>
                            </div>
                        </div>
                    </div>

                    {/* Part C: รายละเอียดรางวัล (Dynamic) */}
                    {awardType !== "behavior" && (
                         <div className="space-y-6 pt-2">
                             <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2">
                                <span className="w-1.5 h-6 bg-purple-600 rounded-full"></span>
                                รายละเอียดผลงาน
                             </h3>

                             {awardType === "activity" && (
                                 <div className="space-y-4 mb-6">
                                     <label className="text-sm font-bold text-gray-800">เลือกคุณสมบัติ <span className="text-red-500">*</span></label>
                                     <div className="flex flex-col gap-3">
                                         {["committee", "competition", "reputation"].map((val, idx) => {
                                             const isSelected = activityCriteria === val;
                                             return (
                                                 <label 
                                                     key={val} 
                                                     className={`flex items-start gap-4 p-4 rounded-xl border transition-all cursor-pointer hover:shadow-md ${
                                                         isSelected ? "bg-purple-50 border-purple-500 shadow-sm" : "bg-white border-gray-200 hover:border-purple-300"
                                                     }`}
                                                 >
                                                     <div className="mt-0.5">
                                                         <input type="radio" name="activity_criteria" value={val} checked={isSelected} onChange={e => setActivityCriteria(e.target.value)} className="w-5 h-5 text-purple-600 focus:ring-purple-500 border-gray-300 cursor-pointer" />
                                                     </div>
                                                     <span className={`text-sm leading-relaxed ${isSelected ? "text-purple-900 font-medium" : "text-gray-600"}`}>
                                                         {idx === 0 && "เป็นนิสิตที่ดำเนินกิจกรรมและต้องแสดงให้เห็นว่าเมื่อดำเนินกิจกรรมแล้ว ชาวบ้าน ชุมชนในท้องถิ่น หรือผู้เข้าร่วมกิจกรรมได้รับประโยชน์อย่างไรจากการดำเนินกิจกรรมก่อให้เกิดประโยชน์ต่อส่วนรวมและเป็นการสร้างชื่อเสียง เกียรติคุณต่อคณะหรือมหาวิทยาลัยหรือไม่"}
                                                         {idx === 1 && "เป็นนิสิตที่เข้าร่วมแข่งขันทางวิชาการหรือศิลปวัฒนธรรมระดับอุดมศึกษา ระดับชาติหรือระดับนานาชาติและได้รับรางวัลใดรางวัลหนึ่งจากการแข่งขัน"}
                                                         {idx === 2 && "เป็นนิสิตที่ดำรงตำแหน่งนายกองค์การบริหาร องค์การนิสิต ประธานสภาผู้แทนนิสิต หรือนายกสโมสรนิสิต (กองกิจการนิสิตเสนอชื่อโดยตำแหน่ง)"}
                                                     </span>
                                                 </label>
                                             );
                                         })}
                                     </div>
                                 </div>
                             )}
                             
                             {awardType === "innovation" && (
                                <div className="p-4 bg-green-50 border border-green-200 rounded-xl mb-6">
                                    <label className="flex items-start gap-3 cursor-pointer">
                                        <input type="checkbox" checked={innovationQual} onChange={e => setInnovationQual(e.target.checked)} className="mt-1 w-5 h-5 text-green-600 rounded border-gray-300 focus:ring-green-500" />
                                        <span className="text-sm text-green-800 font-medium">ข้าพเจ้าขอรับรองว่า ได้รับรางวัลจากการประกวดหรือการแข่งขันระดับอุดมศึกษา ระดับชาติหรือระดับนานาชาติที่มีหน่วยงานภาครัฐหรือเอกชนเป็นผู้จัดจริง</span>
                                    </label>
                                </div>
                             )}

                             <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
                               <div className="space-y-2"><label className="text-sm font-bold text-gray-800">วันที่ได้รับรางวัล</label><input required type="date" value={dateReceived} onChange={e => setDateReceived(e.target.value)} className="w-full bg-white border border-gray-200 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-purple-200 outline-none" /></div>
                               <div className="space-y-2"><label className="text-sm font-bold text-gray-800">ชื่อโครงการ</label><input required type="text" value={projectTitle} onChange={e => setProjectTitle(e.target.value)} className="w-full bg-white border border-gray-200 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-purple-200 outline-none" /></div>
                               <div className="space-y-2"><label className="text-sm font-bold text-gray-800">ชื่อทีม</label><input required type="text" value={teamName} onChange={e => setTeamName(e.target.value)} className="w-full bg-white border border-gray-200 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-purple-200 outline-none" /></div>
                               <div className="space-y-2"><label className="text-sm font-bold text-gray-800">รางวัลที่ได้</label><input required type="text" value={prize} onChange={e => setPrize(e.target.value)} className="w-full bg-white border border-gray-200 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-purple-200 outline-none" /></div>
                               <div className="space-y-2 md:col-span-2"><label className="text-sm font-bold text-gray-800">ผู้จัด</label><input required type="text" value={organizedBy} onChange={e => setOrganizedBy(e.target.value)} className="w-full bg-white border border-gray-200 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-purple-200 outline-none" /></div>
                             </div>
                          </div>
                    )}

                    {/* Part D: เอกสารประกอบ */}
                    {awardType !== "behavior" && (
                        <div className="space-y-6 pt-6 border-t border-gray-100">
                            <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2">
                                <span className="w-1.5 h-6 bg-gray-600 rounded-full"></span>
                                เอกสารประกอบ
                            </h3>
                            
                            <input type="file" multiple ref={fileInputRef} onChange={handleFileChange} className="hidden" accept=".pdf" />
                            
                            <div 
                                onClick={() => fileInputRef.current?.click()} 
                                className="border-2 border-dashed border-gray-300 rounded-xl p-10 flex flex-col items-center justify-center text-center hover:bg-gray-50 hover:border-blue-400 transition-all cursor-pointer bg-white group"
                            >
                                <div className="w-14 h-14 bg-gray-100 rounded-full flex items-center justify-center mb-4 group-hover:bg-blue-100 transition-colors">
                                    <svg className="w-8 h-8 text-gray-400 group-hover:text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4"></path></svg>
                                </div>
                                <p className="text-base text-gray-700 font-semibold group-hover:text-blue-600">คลิกเพื่ออัปโหลดไฟล์ PDF</p>
                                <p className="text-xs text-gray-400 mt-2">รองรับเฉพาะไฟล์ .pdf ขนาดไม่เกิน 10 MB</p>
                            </div>

                            {selectedFiles.length > 0 && (
                                <div className="space-y-3 animate-fade-in">
                                    <p className="text-xs text-gray-500 font-bold uppercase tracking-wider">ไฟล์ที่เลือก ({selectedFiles.length}):</p>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                        {selectedFiles.map((file, index) => (
                                            <div key={index} className="flex justify-between items-center p-3 bg-green-50 rounded-xl border border-green-200 shadow-sm">
                                                <div className="flex items-center gap-3 overflow-hidden">
                                                    <span className="w-8 h-8 bg-green-200 rounded-lg flex items-center justify-center text-green-700 text-xs font-bold shrink-0">PDF</span>
                                                    <span className="text-sm text-green-900 truncate font-medium">{file.name}</span>
                                                </div>
                                                <button type="button" onClick={() => handleRemoveFile(index)} className="text-gray-400 hover:text-red-500 p-1 hover:bg-white rounded transition-colors">
                                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    )}

                    <div className="pt-8 flex justify-end border-t border-gray-100">
                        <button type="submit" className="bg-blue-600 hover:bg-blue-700 text-white px-10 py-3.5 rounded-xl text-base font-bold shadow-lg shadow-blue-200 hover:shadow-xl transition-all active:scale-95 w-full md:w-auto">
                            ยืนยันการเสนอรายชื่อ
                        </button>
                    </div>

                </div>
            )}
        </form>
      </div>
    </div>
  );
}