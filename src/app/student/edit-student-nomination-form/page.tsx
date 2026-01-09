"use client";

import { useState, useRef, useEffect } from "react";
// import { useParams } from "next/navigation";

export default function EditStudentNominationForm() {
  // const params = useParams();
  // const id = params.id as string;
  const id = "1"; // (สมมติ) ID ของรายการที่จะแก้ไข

  const [loading, setLoading] = useState(true);

  // --- State ข้อมูลฟอร์ม ---
  const [awardType, setAwardType] = useState("");
  const [activityCriteria, setActivityCriteria] = useState("");
  
  // ข้อมูลส่วนตัว
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [studentId, setStudentId] = useState("");
  const [faculty, setFaculty] = useState("");
  const [major, setMajor] = useState("");
  const [advisor, setAdvisor] = useState("");
  const [gpa, setGpa] = useState("");
  const [dob, setDob] = useState("");
  const [age, setAge] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [address, setAddress] = useState("");

  // ข้อมูลรางวัล
  const [awardDate, setAwardDate] = useState("");
  const [projectName, setProjectName] = useState("");
  const [teamName, setTeamName] = useState("");
  const [workName, setWorkName] = useState("");
  const [receivedAward, setReceivedAward] = useState("");
  const [organizer, setOrganizer] = useState("");
  const [innovationQual, setInnovationQual] = useState(false);

  // --- State จัดการไฟล์ ---
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]); // ไฟล์ใหม่
  const [oldFiles, setOldFiles] = useState<string[]>([]); // ไฟล์เดิมที่แสดง
  
  //  1. เพิ่ม State เก็บรายชื่อไฟล์เดิมที่ "ถูกสั่งลบ"
  const [deletedOldFiles, setDeletedOldFiles] = useState<string[]>([]); 
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  // --- Fetch Data ---
  useEffect(() => {
    const fetchData = async () => {
      try {
        // const token = localStorage.getItem("token");
        // const res = await fetch(`/api/nomination/${id}`, {
        //     method: "GET",
        //     headers: { "Authorization": `Bearer ${token}` }
        // });

        // if (!res.ok) throw new Error("Failed to fetch data");

        // const data = await res.json();
        
        const mockDbData = {
            awardType: "activity",
            activityCriteria: "competition",
            firstName: "สมชาย",
            lastName: "ใจดี",
            studentId: "6510000000",
            faculty: "วิทยาศาสตร์",
            major: "วิทยาการคอมพิวเตอร์",
            advisor: "ดร. สมหญิง",
            gpa: "3.75",
            dob: "2002-05-20",
            age: "21",
            phone: "0812345678",
            email: "somchai@ku.th",
            address: "หอพักใน มก.",
            awardDate: "2024-01-15",
            projectName: "Hackathon 2024",
            teamName: "Super Dev",
            workName: "AI for Good",
            receivedAward: "ชนะเลิศ",
            organizer: "Google",
            oldFiles: ["resume.pdf", "certificate.pdf", "transcript.pdf"] // มีไฟล์เดิม 3 ไฟล์
        };

        const data = mockDbData;

        setAwardType(data.awardType);
        setActivityCriteria(data.activityCriteria || "");
        setFirstName(data.firstName);
        setLastName(data.lastName);
        setStudentId(data.studentId);
        setFaculty(data.faculty);
        setMajor(data.major);
        setAdvisor(data.advisor);
        setGpa(data.gpa);
        setDob(data.dob);
        setAge(data.age);
        setPhone(data.phone);
        setEmail(data.email);
        setAddress(data.address);
        
        setAwardDate(data.awardDate || "");
        setProjectName(data.projectName || "");
        setTeamName(data.teamName || "");
        setWorkName(data.workName || "");
        setReceivedAward(data.receivedAward || "");
        setOrganizer(data.organizer || "");

        setOldFiles(data.oldFiles || []);

        setLoading(false);
      } catch (error) {
        console.error("Error:", error);
        alert("ไม่สามารถดึงข้อมูลเดิมได้");
        setLoading(false);
      }
    };
    fetchData();
  }, [id]);

  const handleDobChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setDob(val);
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

  // ---  2. ฟังก์ชันลบไฟล์เดิม ---
  const handleDeleteOldFile = (fileNameToDelete: string) => {
    if(!confirm(`ยืนยันการลบไฟล์ "${fileNameToDelete}" ?`)) return;

    // ลบออกจาก UI
    setOldFiles(prev => prev.filter(f => f !== fileNameToDelete));
    
    // เพิ่มเข้าลิสต์ "รอการลบ"
    setDeletedOldFiles(prev => [...prev, fileNameToDelete]);
  };

  // --- จัดการไฟล์ใหม่ ---
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const newFiles = Array.from(e.target.files);
      const nonPdfFiles = newFiles.filter(file => file.type !== "application/pdf");
      if (nonPdfFiles.length > 0) {
          alert("กรุณาอัปโหลดเฉพาะไฟล์ PDF เท่านั้น");
          if (fileInputRef.current) fileInputRef.current.value = "";
          return;
      }

      const MAX_SIZE = 10 * 1024 * 1024;
      const currentNewFilesSize = selectedFiles.reduce((acc, file) => acc + file.size, 0);
      const addingFilesSize = newFiles.reduce((acc, file) => acc + file.size, 0);

      if (currentNewFilesSize + addingFilesSize > MAX_SIZE) {
          alert(`ขนาดไฟล์รวมเกิน 10MB`);
          if (fileInputRef.current) fileInputRef.current.value = "";
          return;
      }
      setSelectedFiles(prev => [...prev, ...newFiles]);
    }
    if (fileInputRef.current) fileInputRef.current.value = ""; 
  };

  const handleRemoveNewFile = (index: number) => {
    setSelectedFiles(prev => prev.filter((_, i) => i !== index));
  };

  // --- Submit Logic ---
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (parseFloat(gpa) < 0 || parseFloat(gpa) > 4.00) return alert("เกรดเฉลี่ยไม่ถูกต้อง");
    if (parseInt(age) <= 16) return alert("อายุต้อง 17 ปีขึ้นไป");
    if (!/^0[0-9]{9}$/.test(phone)) return alert("เบอร์โทรศัพท์ไม่ถูกต้อง");
    
    if (awardType === "activity" && !activityCriteria) return alert("เลือกคุณสมบัติกิจกรรม");
    if (awardType === "innovation" && !innovationQual) return alert("ยืนยันคุณสมบัตินวัตกรรม");

    // เช็คว่าเหลือไฟล์อย่างน้อย 1 ไหม (ไฟล์เดิมที่ไม่โดนลบ + ไฟล์ใหม่)
    if (awardType !== "behavior" && oldFiles.length === 0 && selectedFiles.length === 0) {
        return alert("ต้องมีเอกสารประกอบ (ไฟล์เดิมหรือไฟล์ใหม่)");
    }

    try {
        const formData = new FormData();
        formData.append("id", id);
        formData.append("awardType", awardType);
        if (awardType === "activity") formData.append("activityCriteria", activityCriteria);
        
        formData.append("firstName", firstName);
        formData.append("lastName", lastName);
        formData.append("studentId", studentId);
        formData.append("faculty", faculty);
        formData.append("major", major);
        formData.append("advisor", advisor);
        formData.append("gpa", gpa);
        formData.append("dob", dob);
        formData.append("age", age);
        formData.append("phone", phone);
        formData.append("email", email);
        formData.append("address", address);

        if (awardType !== "behavior") {
             formData.append("awardDate", awardDate);
             formData.append("projectName", projectName);
             formData.append("teamName", teamName);
             formData.append("workName", workName);
             formData.append("receivedAward", receivedAward);
             formData.append("organizer", organizer);
        }

        // ส่งไฟล์ใหม่
        selectedFiles.forEach((file) => {
            formData.append("newFiles", file);
        });

        // 3. ส่งรายชื่อไฟล์เก่าที่ต้องการลบไปให้ Backend
        deletedOldFiles.forEach((fileName) => {
            formData.append("deleteOldFiles", fileName);
        });

        const token = localStorage.getItem("token");

        // ยิง API Update (PUT)
        const response = await fetch(`/api/nomination/update/${id}`, {
            method: "PUT",
            headers: { "Authorization": `Bearer ${token}` }, // ห้ามใส่ Content-Type
            body: formData, 
        });

        if (response.ok) {
            alert("แก้ไขข้อมูลเรียบร้อย!");
            // router.push("/tracking"); // อาจจะเด้งกลับไปหน้าติดตามสถานะ
        } else {
            const errText = await response.text();
            alert("แก้ไขไม่สำเร็จ: " + errText);
        }

    } catch (error) {
        console.error(error);
        alert("เชื่อมต่อ Server ไม่ได้");
    }
  };

  if (loading) return <div className="p-10 text-center">กำลังโหลดข้อมูลเดิม...</div>;

  return (
    <div className="w-full">
      <div className="bg-white rounded-[24px] shadow-sm p-10 min-h-[600px]">
        
        <div className="mb-8 border-b border-gray-100 pb-4 flex justify-between items-center">
            <div>
                <h2 className="text-2xl font-bold text-gray-800">แก้ไขข้อมูลการเสนอรายชื่อ</h2>
                <p className="text-gray-400 text-sm mt-1">แก้ไขข้อมูลเดิมและบันทึกใหม่</p>
            </div>
            <div className="bg-gray-100 px-3 py-1 rounded text-xs text-gray-500">ID: {id}</div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
            
            {/* เลือกประเภท */}
            <div className="space-y-2">
                <label className="text-sm font-bold text-red-500">ประเภทรางวัล</label>
                <div className="relative">
                    <select 
                        value={awardType}
                        onChange={(e) => setAwardType(e.target.value)}
                        className="w-[320px] bg-[#F3F4F6] border-none rounded-lg px-4 py-3.5 text-sm text-gray-700 font-medium appearance-none cursor-pointer"
                    >
                        <option value="behavior">ด้านความประพฤติดีเด่น</option>
                        <option value="innovation">ด้านความคิดสร้างสรรค์และนวัตกรรม</option>
                        <option value="activity">ด้านกิจกรรมเสริมหลักสูตร</option>
                    </select>
                </div>
            </div>

            {awardType && (
                <div className="space-y-6 animate-fade-in">
                    
                    {/* --- Input Fields (เหมือนเดิม) --- */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <div className="space-y-2"><label className="text-sm font-bold text-gray-800">ชื่อ</label><input required type="text" value={firstName} onChange={e => setFirstName(e.target.value)} className="w-full bg-[#F3F4F6] border-none rounded-lg px-4 py-3.5 text-sm" /></div>
                        <div className="space-y-2"><label className="text-sm font-bold text-gray-800">นามสกุล</label><input required type="text" value={lastName} onChange={e => setLastName(e.target.value)} className="w-full bg-[#F3F4F6] border-none rounded-lg px-4 py-3.5 text-sm" /></div>
                    </div>
                    
                    {/* ... (Copy Input อื่นๆ มาใส่ตรงนี้ได้เลย เหมือนโค้ดเดิมครับ) ... */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <div className="space-y-2"><label className="text-sm font-bold text-gray-800">รหัสนิสิต</label><input required type="text" value={studentId} onChange={e => setStudentId(e.target.value)} className="w-full bg-[#F3F4F6] border-none rounded-lg px-4 py-3.5 text-sm" /></div>
                        <div className="space-y-2"><label className="text-sm font-bold text-gray-800">คณะ</label><input required type="text" value={faculty} onChange={e => setFaculty(e.target.value)} className="w-full bg-[#F3F4F6] border-none rounded-lg px-4 py-3.5 text-sm" /></div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <div className="space-y-2"><label className="text-sm font-bold text-gray-800">สาขาวิชา</label><input required type="text" value={major} onChange={e => setMajor(e.target.value)} className="w-full bg-[#F3F4F6] border-none rounded-lg px-4 py-3.5 text-sm" /></div>
                        <div className="space-y-2"><label className="text-sm font-bold text-gray-800">อาจารย์ที่ปรึกษา</label><input required type="text" value={advisor} onChange={e => setAdvisor(e.target.value)} className="w-full bg-[#F3F4F6] border-none rounded-lg px-4 py-3.5 text-sm" /></div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <div className="space-y-2"><label className="text-sm font-bold text-red-500">เกรดเฉลี่ยสะสม</label><input required type="number" step="0.01" value={gpa} onChange={e => setGpa(e.target.value)} className="w-full bg-[#F3F4F6] border-none rounded-lg px-4 py-3.5 text-sm" /></div>
                        <div className="space-y-2"><label className="text-sm font-bold text-gray-800">วันเกิด</label><input required type="date" value={dob} onChange={handleDobChange} className="w-full bg-[#F3F4F6] border-none rounded-lg px-4 py-3.5 text-sm" /></div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <div className="space-y-2"><label className="text-sm font-bold text-gray-800">อายุ</label><input readOnly type="text" value={age} className="w-full bg-gray-100 border-none rounded-lg px-4 py-3.5 text-sm cursor-not-allowed" /></div>
                        <div className="space-y-2"><label className="text-sm font-bold text-gray-800">โทรศัพท์</label><input required type="tel" maxLength={10} value={phone} onChange={e => setPhone(e.target.value.replace(/[^0-9]/g, ''))} className="w-full bg-[#F3F4F6] border-none rounded-lg px-4 py-3.5 text-sm" /></div>
                    </div>
                    <div className="space-y-2"><label className="text-sm font-bold text-gray-800">อีเมล</label><input required type="email" value={email} onChange={e => setEmail(e.target.value)} className="w-full bg-[#F3F4F6] border-none rounded-lg px-4 py-3.5 text-sm" /></div>
                    <div className="space-y-2"><label className="text-sm font-bold text-gray-800">ที่อยู่</label><textarea required rows={3} value={address} onChange={e => setAddress(e.target.value)} className="w-full bg-[#F3F4F6] border-none rounded-lg px-4 py-3.5 text-sm resize-none"></textarea></div>

                    {/* Activity Radio */}
                    {awardType === "activity" && (
                        <div className="space-y-6 pt-4 border-t border-gray-100">
                            <h3 className="text-sm font-bold text-gray-800">เลือกคุณสมบัติ (Radio) <span className="text-red-500">*</span></h3>
                            {["committee", "competition", "reputation"].map((val, idx) => (
                                <div key={val} className="flex items-start gap-3">
                                    <input type="radio" name="activity_criteria" value={val} checked={activityCriteria === val} onChange={e => setActivityCriteria(e.target.value)} className="mt-1 w-5 h-5 text-green-600 focus:ring-green-500" />
                                    <label className="text-sm text-gray-700">
                                        {idx === 0 && "เป็นนิสิตที่ดำรงตำแหน่งคณะกรรมการนิสิตสโมสรนิสิตคณะวิทยาศาสตร์ หรือ คณะกรรมการบริหาร สโมสรนิสิตจุฬาลงกรณ์มหาวิทยาลัย โดยมีระยะเวลาการดำรงตำแหน่งไม่น้อยกว่า 1 ปีการศึกษา"}
                                        {idx === 1 && "เป็นนิสิตที่ได้รับรางวัลจากการประกวดหรือการแข่งขันทางวิชาการ หรือ วิทยาศาสตร์ หรือ นวัตกรรม ระดับชาติ หรือ ระดับนานาชาติ และได้รับรางวัลชนะเลิศหรือรางวัลรองชนะเลิศ"}
                                        {idx === 2 && "เป็นนิสิตผู้สร้างชื่อเสียงให้กับคณะวิทยาศาสตร์ หรือ มหาวิทยาลัย โดยได้รับการคัดเลือกให้เป็นตัวแทนของมหาวิทยาลัยเข้าร่วมกิจกรรมสำคัญต่างๆ"}
                                    </label>
                                </div>
                            ))}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mt-4">
                                <div className="space-y-2"><label className="text-sm font-bold text-gray-800">วันที่ได้รับรางวัล</label><input required type="date" value={awardDate} onChange={e => setAwardDate(e.target.value)} className="w-full bg-[#F3F4F6] border-none rounded-lg px-4 py-3.5 text-sm" /></div>
                                <div className="space-y-2"><label className="text-sm font-bold text-gray-800">ชื่อโครงการ</label><input required type="text" value={projectName} onChange={e => setProjectName(e.target.value)} className="w-full bg-[#F3F4F6] border-none rounded-lg px-4 py-3.5 text-sm" /></div>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                <div className="space-y-2"><label className="text-sm font-bold text-gray-800">ชื่อทีม</label><input required type="text" value={teamName} onChange={e => setTeamName(e.target.value)} className="w-full bg-[#F3F4F6] border-none rounded-lg px-4 py-3.5 text-sm" /></div>
                                <div className="space-y-2"><label className="text-sm font-bold text-gray-800">ชื่อผลงาน</label><input required type="text" value={workName} onChange={e => setWorkName(e.target.value)} className="w-full bg-[#F3F4F6] border-none rounded-lg px-4 py-3.5 text-sm" /></div>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                <div className="space-y-2"><label className="text-sm font-bold text-gray-800">รางวัลที่ได้</label><input required type="text" value={receivedAward} onChange={e => setReceivedAward(e.target.value)} className="w-full bg-[#F3F4F6] border-none rounded-lg px-4 py-3.5 text-sm" /></div>
                                <div className="space-y-2"><label className="text-sm font-bold text-gray-800">ผู้จัด</label><input required type="text" value={organizer} onChange={e => setOrganizer(e.target.value)} className="w-full bg-[#F3F4F6] border-none rounded-lg px-4 py-3.5 text-sm" /></div>
                            </div>
                        </div>
                    )}

                    {/* Innovation Checkbox */}
                    {awardType === "innovation" && (
                        <div className="space-y-6 pt-4 border-t border-gray-100">
                             <div className="flex items-start gap-3">
                                <input type="checkbox" checked={innovationQual} onChange={e => setInnovationQual(e.target.checked)} className="mt-1 w-5 h-5 text-green-600 rounded" />
                                <label className="text-sm text-gray-700">ต้องได้รับรางวัลจากการประกวดหรือการแข่งขันระดับอุดมศึกษา ระดับชาติหรือระดับนานาชาติที่มีหน่วยงานภาครัฐหรือเอกชนเป็นผู้จัด</label>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                <div className="space-y-2"><label className="text-sm font-bold text-gray-800">วันที่ได้รับรางวัล</label><input required type="date" value={awardDate} onChange={e => setAwardDate(e.target.value)} className="w-full bg-[#F3F4F6] border-none rounded-lg px-4 py-3.5 text-sm" /></div>
                                <div className="space-y-2"><label className="text-sm font-bold text-gray-800">ชื่อโครงการ</label><input required type="text" value={projectName} onChange={e => setProjectName(e.target.value)} className="w-full bg-[#F3F4F6] border-none rounded-lg px-4 py-3.5 text-sm" /></div>
                            </div>
                            {/* ... ใส่ input อื่นๆ ของ innovation ... */}
                        </div>
                    )}

                    {/* --- ส่วนจัดการไฟล์ (มีปุ่มลบไฟล์เดิม) --- */}
                    {awardType !== "behavior" && (
                        <div className="space-y-2 pt-4 border-t border-gray-100 mt-4">
                            <label className="text-sm font-bold text-gray-800">เอกสารประกอบ</label>
                            
                            {/* 1. แสดงไฟล์เดิม (Old Files) พร้อมปุ่มลบ */}
                            {oldFiles.length > 0 && (
                                <div className="mb-4 space-y-2">
                                    <p className="text-xs text-gray-500 font-bold">ไฟล์เดิมที่มีอยู่ ({oldFiles.length}):</p>
                                    {oldFiles.map((fname, idx) => (
                                        <div key={idx} className="flex items-center justify-between bg-blue-50 p-3 rounded-lg border border-blue-100">
                                            <div className="flex items-center gap-2">
                                                <div className="w-8 h-8 bg-blue-100 rounded flex items-center justify-center text-blue-600">
                                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path></svg>
                                                </div>
                                                <span className="text-sm text-blue-900 font-medium">{fname}</span>
                                            </div>
                                            {/* ปุ่มลบไฟล์เดิม */}
                                            <button 
                                                type="button" 
                                                onClick={() => handleDeleteOldFile(fname)}
                                                className="text-red-400 hover:text-red-600 hover:bg-white p-1 rounded-full transition-all"
                                                title="ลบไฟล์เดิมนี้"
                                            >
                                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg>
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            )}

                            {/* 2. อัปไฟล์ใหม่ */}
                            <input type="file" multiple ref={fileInputRef} onChange={handleFileChange} className="hidden" accept=".pdf" />
                            <div onClick={() => fileInputRef.current?.click()} className="border-2 border-dashed border-gray-200 rounded-xl p-8 flex flex-col items-center justify-center text-center hover:bg-gray-50 transition-colors cursor-pointer group bg-white">
                                <p className="text-sm text-gray-500 font-medium">คลิกเพื่อเพิ่มไฟล์ PDF ใหม่ (ทับไฟล์เดิม)</p>
                                <p className="text-xs text-gray-400 mt-1">สูงสุด 10 MB</p>
                            </div>

                            {/* แสดงไฟล์ใหม่ */}
                            {selectedFiles.length > 0 && (
                                <div className="mt-4 space-y-2">
                                    <p className="text-xs text-green-600 font-bold">ไฟล์ใหม่ที่จะเพิ่ม ({selectedFiles.length}):</p>
                                    {selectedFiles.map((file, index) => (
                                        <div key={index} className="flex justify-between items-center p-2 bg-green-50 rounded text-sm text-green-700 border border-green-200">
                                            <span>📄 {file.name} ({(file.size/1024/1024).toFixed(2)} MB)</span>
                                            <button type="button" onClick={() => handleRemoveNewFile(index)} className="text-red-500 hover:text-red-700">ลบ</button>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}

                    <div className="pt-8 flex justify-end">
                        <button type="submit" className="bg-[#2D2D2D] hover:bg-black text-white px-10 py-3 rounded-lg text-sm font-bold shadow-lg transition-all">
                            แก้ไขข้อมูล
                        </button>
                    </div>

                </div>
            )}
        </form>
      </div>
    </div>
  );
}