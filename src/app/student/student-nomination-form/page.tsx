"use client";

import { useState, useRef } from "react";

export default function StudentNominationForm() {
  const [awardType, setAwardType] = useState("");
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  
  // เพิ่ม state สำหรับเก็บค่า Radio ของกิจกรรม
  const [activityCriteria, setActivityCriteria] = useState(""); 
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  // --- ฟังก์ชันคำนวณอายุอัตโนมัติ ---
  const handleDobChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const dobValue = e.target.value;
    const ageInput = document.getElementById("age-input") as HTMLInputElement;

    if (dobValue) {
        const today = new Date();
        const birthDate = new Date(dobValue);
        
        let age = today.getFullYear() - birthDate.getFullYear();
        const m = today.getMonth() - birthDate.getMonth();
        if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
            age--;
        }
        if (ageInput) ageInput.value = age.toString();
    } else {
        if (ageInput) ageInput.value = "";
    }
  };

  // --- File Upload Logic (ปรับปรุงใหม่) ---
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const newFiles = Array.from(e.target.files);

      // 1. กรองเฉพาะ PDF (กันเหนียวฝั่ง JS อีกรอบ)
      const nonPdfFiles = newFiles.filter(file => file.type !== "application/pdf");
      if (nonPdfFiles.length > 0) {
          alert("กรุณาอัปโหลดเฉพาะไฟล์ PDF เท่านั้น");
          if (fileInputRef.current) fileInputRef.current.value = "";
          return;
      }

      // 2. คำนวณขนาดไฟล์รวม (ไฟล์เดิม + ไฟล์ใหม่)
      const MAX_SIZE = 10 * 1024 * 1024; // 10MB
      const currentTotalSize = selectedFiles.reduce((acc, file) => acc + file.size, 0);
      const newFilesSize = newFiles.reduce((acc, file) => acc + file.size, 0);

      if (currentTotalSize + newFilesSize > MAX_SIZE) {
          alert(`ขนาดไฟล์รวมทั้งหมดต้องไม่เกิน 10MB \n(ตอนนี้คุณใช้ไป ${(currentTotalSize / 1024 / 1024).toFixed(2)} MB + ไฟล์ใหม่ ${(newFilesSize / 1024 / 1024).toFixed(2)} MB)`);
          if (fileInputRef.current) fileInputRef.current.value = "";
          return;
      }

      setSelectedFiles(prev => [...prev, ...newFiles]);
    }
    // Reset input เพื่อให้เลือกไฟล์เดิมซ้ำได้ถ้าต้องการ (กรณีลบแล้วเลือกใหม่)
    if (fileInputRef.current) fileInputRef.current.value = ""; 
  };

  const handleRemoveFile = (indexToRemove: number) => {
    setSelectedFiles(prev => prev.filter((_, index) => index !== indexToRemove));
  };

  // --- Validation Logic & API Call ---
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // 1. ตรวจสอบเกรดเฉลี่ย
    const gpaInput = document.getElementById("gpa-input") as HTMLInputElement;
    const gpaValue = parseFloat(gpaInput?.value);
    if (isNaN(gpaValue) || gpaValue < 0.00 || gpaValue > 4.00) {
        alert("กรุณากรอกเกรดเฉลี่ยให้ถูกต้อง (0.00 - 4.00)");
        gpaInput.focus();
        return;
    }

    // 2. ตรวจสอบอายุ
    const ageInput = document.getElementById("age-input") as HTMLInputElement;
    const ageValue = parseInt(ageInput?.value);
    if (isNaN(ageValue) || ageValue <= 16) {
        alert(`อายุไม่ผ่านเกณฑ์ (ต้อง 17 ปีขึ้นไป)`);
        return;
    }

    // 3. ตรวจสอบเบอร์โทร
    const phoneInput = document.getElementById("phone-input") as HTMLInputElement;
    const phoneRegex = /^0[0-9]{9}$/;
    if (!phoneRegex.test(phoneInput?.value)) {
        alert("เบอร์โทรศัพท์ไม่ถูกต้อง (ต้องขึ้นต้นด้วย 0 และมี 10 หลัก)");
        phoneInput.focus();
        return;
    }

    // 4. ตรวจสอบ Radio กิจกรรม (เปลี่ยน Logic)
    if (awardType === "activity") {
        if (!activityCriteria) {
            alert("กรุณาเลือกคุณสมบัติข้อใดข้อหนึ่ง (ด้านกิจกรรมเสริมหลักสูตร)");
            return;
        }
    }

    // 5. ตรวจสอบ Checkbox นวัตกรรม (อันนี้เป็นภาคบังคับข้อเดียว ใช้ Checkbox เหมือนเดิมเหมาะสมแล้วครับ)
    if (awardType === "innovation") {
        const qual = (document.getElementById("inn-qual") as HTMLInputElement)?.checked;
        if (!qual) {
            alert("กรุณาติ๊กยืนยันคุณสมบัติ");
            return;
        }
    }

    // 6. ตรวจสอบไฟล์
    if (awardType !== "behavior" && selectedFiles.length === 0) {
        alert("กรุณาอัปโหลดเอกสารประกอบอย่างน้อย 1 ไฟล์");
        return;
    }

    try {
        const formData = new FormData();
        
        // ดึงค่าจากช่องต่างๆ ใส่ลงกล่อง
        formData.append("awardType", awardType);
        
        // ส่งค่า Criteria ที่เลือกไปด้วย
        if (awardType === "activity") {
            formData.append("activityCriteria", activityCriteria);
        }

        // ดึงค่าจาก Input
        formData.append("firstName", (document.querySelector('input[placeholder="ชื่อ"]') as HTMLInputElement)?.value || "");
        formData.append("lastName", (document.querySelector('input[placeholder="นามสกุล"]') as HTMLInputElement)?.value || "");
        formData.append("studentId", (document.querySelector('input[placeholder="รหัสนิสิต"]') as HTMLInputElement)?.value || "");
        formData.append("faculty", (document.querySelector('input[placeholder="คณะ"]') as HTMLInputElement)?.value || "");
        formData.append("major", (document.querySelector('input[placeholder="สาขาวิชา"]') as HTMLInputElement)?.value || "");
        formData.append("advisor", (document.querySelector('input[placeholder="อาจารย์ที่ปรึกษา"]') as HTMLInputElement)?.value || "");
        formData.append("gpa", gpaInput.value);
        formData.append("dob", (document.querySelector('input[type="date"]') as HTMLInputElement)?.value || "");
        formData.append("age", ageInput.value);
        formData.append("phone", phoneInput.value);
        formData.append("email", (document.querySelector('input[type="email"]') as HTMLInputElement)?.value || "");
        formData.append("address", (document.querySelector('textarea') as HTMLTextAreaElement)?.value || "");

        // ใส่ไฟล์ทั้งหมด
        selectedFiles.forEach((file) => {
            formData.append("files", file);
        });

        // 1. ดึง Token จาก LocalStorage
        const token = localStorage.getItem("token");

        // 2. ยิงไปที่ /api/... (ผ่าน Proxy) แทน localhost:8080
        const response = await fetch("/api/nomination/submit", { 
            method: "POST",
            headers: {
                // 3. สำคัญ: อย่าใส่ Content-Type เอง! ให้ fetch จัดการ Boundary ให้
                "Authorization": `Bearer ${token}` 
            },
            body: formData, 
        });

        if (response.ok) {
            const result = await response.json();
            alert("บันทึกข้อมูลสำเร็จเรียบร้อย!");
            console.log("Server Response:", result);
            
            // รีเซ็ตค่า (Optional)
            setSelectedFiles([]);
            setAwardType("");
        } else {
            // ลองอ่าน Error message จาก backend ถ้ามี
            const errorData = await response.text(); 
            console.error("Server Error:", errorData);
            alert("เกิดข้อผิดพลาด: " + (errorData || response.statusText));
        }

    } catch (error) {
        alert("เชื่อมต่อเซิร์ฟเวอร์ไม่ได้");
        console.error("Connection Error:", error);
    }
  };

  return (
    <div className="w-full">
      <div className="bg-white rounded-[24px] shadow-sm p-10 min-h-[600px]">
        
        <div className="mb-8 border-b border-gray-100 pb-4">
            <h2 className="text-2xl font-bold text-gray-800">ข้อมูลการเสนอรายชื่อนิสิตดีเด่น</h2>
            <p className="text-gray-400 text-sm mt-1">เลือกประเภทข้อมูลและกรอกข้อมูลให้ครบถ้วน</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
            
            {/* เลือกประเภท */}
            <div className="space-y-2">
                <label className="text-sm font-bold text-red-500">ประเภทรางวัล</label>
                <div className="relative">
                    <select 
                        value={awardType}
                        onChange={(e) => {
                            setAwardType(e.target.value);
                            setActivityCriteria(""); // Reset radio เมื่อเปลี่ยนประเภท
                        }}
                        className="w-[320px] bg-[#F3F4F6] border-none rounded-lg px-4 py-3.5 text-sm text-gray-700 font-medium focus:ring-1 focus:ring-green-500 cursor-pointer appearance-none"
                    >
                        <option value="" disabled>-- กรุณาเลือกประเภทรางวัล --</option>
                        <option value="behavior">ด้านความประพฤติดีเด่น</option>
                        <option value="innovation">ด้านความคิดสร้างสรรค์และนวัตกรรม</option>
                        <option value="activity">ด้านกิจกรรมเสริมหลักสูตร</option>
                    </select>
                    <div className="absolute top-1/2 left-[290px] -translate-y-1/2 pointer-events-none text-gray-500">
                        <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" /></svg>
                    </div>
                </div>
            </div>

            {/* Form Contents */}
            {awardType && (
                <div className="space-y-6 animate-fade-in">
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <div className="space-y-2">
                            <label className="text-sm font-bold text-gray-800">ชื่อ</label>
                            <input required type="text" placeholder="ชื่อ" className="w-full bg-[#F3F4F6] border-none rounded-lg px-4 py-3.5 text-sm" />
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-bold text-gray-800">นามสกุล</label>
                            <input required type="text" placeholder="นามสกุล" className="w-full bg-[#F3F4F6] border-none rounded-lg px-4 py-3.5 text-sm" />
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <div className="space-y-2">
                            <label className="text-sm font-bold text-gray-800">ชั้นปี</label>
                            <div className="relative">
                                <select required className="w-full bg-[#F3F4F6] border-none rounded-lg px-4 py-3.5 text-sm text-gray-500 appearance-none cursor-pointer">
                                    <option value="">เลือกชั้นปี</option>
                                    <option value="1">1</option>
                                    <option value="2">2</option>
                                    <option value="3">3</option>
                                    <option value="4">4</option>
                                </select>
                                <div className="absolute top-1/2 right-4 -translate-y-1/2 pointer-events-none text-gray-500">
                                    <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" /></svg>
                                </div>
                            </div>
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-bold text-gray-800">รหัสนิสิต</label>
                            <input required type="text" placeholder="รหัสนิสิต" className="w-full bg-[#F3F4F6] border-none rounded-lg px-4 py-3.5 text-sm" />
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <div className="space-y-2">
                            <label className="text-sm font-bold text-gray-800">คณะ</label>
                            <input required type="text" placeholder="คณะ" className="w-full bg-[#F3F4F6] border-none rounded-lg px-4 py-3.5 text-sm" />
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-bold text-gray-800">สาขาวิชา</label>
                            <input required type="text" placeholder="สาขาวิชา" className="w-full bg-[#F3F4F6] border-none rounded-lg px-4 py-3.5 text-sm" />
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <div className="space-y-2">
                            <label className="text-sm font-bold text-gray-800">อาจารย์ที่ปรึกษา</label>
                            <input required type="text" placeholder="อาจารย์ที่ปรึกษา" className="w-full bg-[#F3F4F6] border-none rounded-lg px-4 py-3.5 text-sm" />
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-bold text-red-500">เกรดเฉลี่ยสะสม</label>
                            <input id="gpa-input" required type="number" step="0.01" min="0" max="4.00" placeholder="0.00" className="w-full bg-[#F3F4F6] border-none rounded-lg px-4 py-3.5 text-sm" />
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <div className="space-y-2">
                            <label className="text-sm font-bold text-gray-800">เกิดวันที่</label>
                            <input required type="date" onChange={handleDobChange} className="w-full bg-[#F3F4F6] border-none rounded-lg px-4 py-3.5 text-sm text-gray-600 cursor-pointer" />
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-bold text-gray-800">อายุ (ปี)</label>
                            <input id="age-input" readOnly type="text" placeholder="คำนวณอัตโนมัติ" className="w-full bg-gray-100 border-none rounded-lg px-4 py-3.5 text-sm text-gray-500 cursor-not-allowed" />
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <div className="space-y-2">
                            <label className="text-sm font-bold text-gray-800">โทรศัพท์</label>
                            <input 
                                id="phone-input"
                                required 
                                type="tel" 
                                maxLength={10} 
                                placeholder="0xxxxxxxxx" 
                                className="w-full bg-[#F3F4F6] border-none rounded-lg px-4 py-3.5 text-sm" 
                                onInput={(e) => {
                                    e.currentTarget.value = e.currentTarget.value.replace(/[^0-9]/g, '');
                                }}
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-bold text-gray-800">อีเมล</label>
                            <input required type="email" placeholder="อีเมล" className="w-full bg-[#F3F4F6] border-none rounded-lg px-4 py-3.5 text-sm" />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <label className="text-sm font-bold text-gray-800">ที่อยู่ปัจจุบัน</label>
                        <textarea required rows={3} placeholder="ที่อยู่ปัจจุบัน" className="w-full bg-[#F3F4F6] border-none rounded-lg px-4 py-3.5 text-sm resize-none"></textarea>
                    </div>

                    {/* === Activity Logic (Changed to Radio) === */}
                    {awardType === "activity" && (
                        <div className="space-y-6 pt-4 border-t border-gray-100 animate-fade-in">
                            <h3 className="text-sm font-bold text-gray-800">เลือกคุณสมบัติข้อใดข้อหนึ่ง <span className="text-red-500">*</span></h3>
                            
                            {/* ตัวเลือกที่ 1 */}
                            <div className="flex items-start gap-3">
                                <div className="flex items-center h-5 mt-1">
                                    <input 
                                        id="act-1" 
                                        type="radio" 
                                        name="activity_criteria" 
                                        value="committee"
                                        checked={activityCriteria === "committee"}
                                        onChange={(e) => setActivityCriteria(e.target.value)}
                                        className="w-5 h-5 text-green-600 border-gray-300 focus:ring-green-500 cursor-pointer" 
                                    />
                                </div>
                                <label htmlFor="act-1" className="text-sm text-gray-700 cursor-pointer select-none leading-relaxed">
                                    เป็นนิสิตที่ดำรงตำแหน่งคณะกรรมการนิสิตสโมสรนิสิตคณะวิทยาศาสตร์ หรือ คณะกรรมการบริหาร สโมสรนิสิตจุฬาลงกรณ์มหาวิทยาลัย โดยมีระยะเวลาการดำรงตำแหน่งไม่น้อยกว่า 1 ปีการศึกษา
                                </label>
                            </div>

                            {/* ตัวเลือกที่ 2 */}
                            <div className="flex items-start gap-3">
                                <div className="flex items-center h-5 mt-1">
                                    <input 
                                        id="act-2" 
                                        type="radio" 
                                        name="activity_criteria" 
                                        value="competition"
                                        checked={activityCriteria === "competition"}
                                        onChange={(e) => setActivityCriteria(e.target.value)}
                                        className="w-5 h-5 text-green-600 border-gray-300 focus:ring-green-500 cursor-pointer" 
                                    />
                                </div>
                                <label htmlFor="act-2" className="text-sm text-gray-700 cursor-pointer select-none leading-relaxed">
                                    
                                </label>
                            </div>

                            {/* ตัวเลือกที่ 3 */}เป็นนิสิตที่ได้รับรางวัลจากการประกวดหรือการแข่งขันทางวิชาการ หรือ วิทยาศาสตร์ หรือ นวัตกรรม ระดับชาติ หรือ ระดับนานาชาติ และได้รับรางวัลชนะเลิศหรือรางวัลรองชนะเลิศ
                            <div className="flex items-start gap-3">
                                <div className="flex items-center h-5 mt-1">
                                    <input 
                                        id="act-3" 
                                        type="radio" 
                                        name="activity_criteria" 
                                        value="reputation"
                                        checked={activityCriteria === "reputation"}
                                        onChange={(e) => setActivityCriteria(e.target.value)}
                                        className="w-5 h-5 text-green-600 border-gray-300 focus:ring-green-500 cursor-pointer" 
                                    />
                                </div>
                                <label htmlFor="act-3" className="text-sm text-gray-700 cursor-pointer select-none leading-relaxed">
                                    เป็นนิสิตผู้สร้างชื่อเสียงให้กับคณะวิทยาศาสตร์ หรือ มหาวิทยาลัย โดยได้รับการคัดเลือกให้เป็นตัวแทนของมหาวิทยาลัยเข้าร่วมกิจกรรมสำคัญต่างๆ
                                </label>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mt-4">
                                <div className="space-y-2"><label className="text-sm font-bold text-gray-800">วันที่ได้รับรางวัล/ทำกิจกรรม</label><input required id="award-date" type="date" className="w-full bg-[#F3F4F6] border-none rounded-lg px-4 py-3.5 text-sm text-gray-600 cursor-pointer" /></div>
                                <div className="space-y-2"><label className="text-sm font-bold text-gray-800">โครงการที่เข้าแข่งขัน /รายการแข่งขัน</label><input required type="text" placeholder="โครงการที่เข้าแข่งขัน /รายการแข่งขัน" className="w-full bg-[#F3F4F6] border-none rounded-lg px-4 py-3.5 text-sm" /></div>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                <div className="space-y-2"><label className="text-sm font-bold text-gray-800">ชื่อทีม</label><input required type="text" placeholder="ชื่อทีม" className="w-full bg-[#F3F4F6] border-none rounded-lg px-4 py-3.5 text-sm" /></div>
                                <div className="space-y-2"><label className="text-sm font-bold text-gray-800">ชื่อผลงานที่ได้รับรางวัล</label><input required type="text" placeholder="ชื่อผลงานที่ได้รับรางวัล" className="w-full bg-[#F3F4F6] border-none rounded-lg px-4 py-3.5 text-sm" /></div>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                <div className="space-y-2"><label className="text-sm font-bold text-gray-800">รางวัลที่ได้รับ</label><input required type="text" placeholder="รางวัลที่ได้รับ" className="w-full bg-[#F3F4F6] border-none rounded-lg px-4 py-3.5 text-sm" /></div>
                                <div className="space-y-2"><label className="text-sm font-bold text-gray-800">หน่วยงานผู้จัด</label><input required type="text" placeholder="หน่วยงานผู้จัด" className="w-full bg-[#F3F4F6] border-none rounded-lg px-4 py-3.5 text-sm" /></div>
                            </div>
                        </div>
                    )}

                    {/* === Innovation Logic (คงไว้เหมือนเดิมเพราะเป็นเงื่อนไขเดียว) === */}
                    {awardType === "innovation" && (
                        <div className="space-y-6 pt-4 border-t border-gray-100 animate-fade-in">
                            <h3 className="text-sm font-bold text-gray-800">คุณสมบัติที่ต้องมี <span className="text-red-500">*</span></h3>
                            <div className="flex items-start gap-3"><div className="flex items-center h-5 mt-1"><input id="inn-qual" type="checkbox" className="w-5 h-5 text-green-600 border-gray-300 rounded focus:ring-green-500 cursor-pointer" /></div><label htmlFor="inn-qual" className="text-sm text-gray-700 cursor-pointer select-none leading-relaxed">ต้องได้รับรางวัลจากการประกวดหรือการแข่งขันระดับอุดมศึกษา ระดับชาติหรือระดับนานาชาติที่มีหน่วยงานภาครัฐหรือเอกชนเป็นผู้จัด</label></div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                <div className="space-y-2"><label className="text-sm font-bold text-gray-800">วันที่ได้รับรางวัล</label><input required id="award-date" type="date" className="w-full bg-[#F3F4F6] border-none rounded-lg px-4 py-3.5 text-sm text-gray-600 cursor-pointer" /></div>
                                <div className="space-y-2"><label className="text-sm font-bold text-gray-800">โครงการที่เข้าแข่งขัน /รายการแข่งขัน</label><input required type="text" placeholder="โครงการที่เข้าแข่งขัน /รายการแข่งขัน" className="w-full bg-[#F3F4F6] border-none rounded-lg px-4 py-3.5 text-sm" /></div>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                <div className="space-y-2"><label className="text-sm font-bold text-gray-800">ชื่อทีม</label><input required type="text" placeholder="ชื่อทีม" className="w-full bg-[#F3F4F6] border-none rounded-lg px-4 py-3.5 text-sm" /></div>
                                <div className="space-y-2"><label className="text-sm font-bold text-gray-800">ชื่อผลงานที่ได้รับรางวัล</label><input required type="text" placeholder="ชื่อผลงานที่ได้รับรางวัล" className="w-full bg-[#F3F4F6] border-none rounded-lg px-4 py-3.5 text-sm" /></div>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                <div className="space-y-2"><label className="text-sm font-bold text-gray-800">รางวัลที่ได้รับ</label><input required type="text" placeholder="รางวัลที่ได้รับ" className="w-full bg-[#F3F4F6] border-none rounded-lg px-4 py-3.5 text-sm" /></div>
                                <div className="space-y-2"><label className="text-sm font-bold text-gray-800">หน่วยงานผู้จัด</label><input required type="text" placeholder="หน่วยงานผู้จัด" className="w-full bg-[#F3F4F6] border-none rounded-lg px-4 py-3.5 text-sm" /></div>
                            </div>
                        </div>
                    )}

                    {/* --- File Upload (Updated) --- */}
                    {awardType !== "behavior" && (
                        <div className="space-y-2 pt-4 border-t border-gray-100 mt-4 animate-fade-in">
                            <label className="text-sm font-bold text-gray-800">เอกสารประกอบ <span className="text-red-500">*</span></label>
                            <span className="text-xs text-gray-400 ml-2">(เฉพาะไฟล์ PDF, ขนาดรวมไม่เกิน 10 MB)</span>
                            <input 
                                type="file" 
                                multiple 
                                ref={fileInputRef} 
                                onChange={handleFileChange} 
                                className="hidden" 
                                accept=".pdf" 
                            />
                            <div onClick={() => fileInputRef.current?.click()} className="border-2 border-dashed border-gray-200 rounded-xl p-8 flex flex-col items-center justify-center text-center hover:bg-gray-50 transition-colors cursor-pointer group bg-white">
                                <div className="mb-3 text-gray-400 group-hover:text-gray-600"><svg className="w-8 h-8 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"></path></svg></div>
                                <p className="text-sm text-gray-500 font-medium">คลิกเพื่อเพิ่มไฟล์ PDF</p>
                                <p className="text-xs text-gray-400 mt-1">สูงสุด 10 MB (รวมทุกไฟล์)</p>
                            </div>
                            {selectedFiles.length > 0 && (
                                <div className="mt-4 space-y-2">
                                    {selectedFiles.map((file, index) => (
                                        <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-100">
                                            <div className="flex items-center gap-3 overflow-hidden">
                                                <div className="w-8 h-8 bg-red-100 rounded-lg flex-shrink-0 flex items-center justify-center text-red-600">
                                                    {/* ไอคอน PDF */}
                                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z"></path></svg>
                                                </div>
                                                <div className="min-w-0"><p className="text-sm font-medium text-gray-700 truncate">{file.name}</p><p className="text-xs text-gray-400">{(file.size / 1024 / 1024).toFixed(2)} MB</p></div>
                                            </div>
                                            <button type="button" onClick={() => handleRemoveFile(index)} className="text-gray-400 hover:text-red-500 p-1 rounded-full hover:bg-white transition-all"><svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg></button>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}

                    <div className="pt-8 flex justify-end">
                        <button type="submit" className="bg-[#2D2D2D] hover:bg-black text-white px-10 py-3 rounded-lg text-sm font-bold shadow-lg transition-all">
                            ยืนยัน
                        </button>
                    </div>

                </div>
            )}
        </form>
      </div>
    </div>
  );
}