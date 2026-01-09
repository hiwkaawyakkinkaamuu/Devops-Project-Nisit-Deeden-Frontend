"use client";

import { useState, useEffect } from "react";

export default function ProfilePage() {
  const [loading, setLoading] = useState(true);

  // สร้าง state สำหรับแต่ละ input
  const [fullName, setFullName] = useState("");
  const [studentId, setStudentId] = useState("");
  const [faculty, setFaculty] = useState("");
  const [department, setDepartment] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [advisor, setAdvisor] = useState("");
  const [avatarUrl, setAvatarUrl] = useState("");
  
  // เพิ่ม State สำหรับข้อมูลการศึกษา
  const [year, setYear] = useState("");
  const [gpa, setGpa] = useState("");

  // ✅ เรียก API เมื่อเข้าหน้าเว็บ
  useEffect(() => {
    const fetchProfileData = async () => {
      try {
        setLoading(true);

        // =========================================================
        // ส่วนเรียก API ของจริง 
        // =========================================================
        /*
        const token = localStorage.getItem("token"); // ดึง Token
        const res = await fetch("/api/profile/me", {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${token}` // ส่ง Token ไปยืนยันตัวตน
          },
        });

        if (!res.ok) {
            throw new Error("Failed to fetch profile");
        }

        const data = await res.json();
        */

        // จำลองเวลาโหลด 0.5 วินาที
        await new Promise((resolve) => setTimeout(resolve, 500));

        const data = {
            fullName: "สมชาย ใจดี",
            studentId: "12345678",
            faculty: "คณะวิทยาศาสตร์",
            department: "ภาควิชาวิทยาการคอมพิวเตอร์",
            email: "somchai@ku.th",
            phone: "0875546847",
            advisor: "ดร. ดิพกา สุขงาม",
            avatarUrl: "", // ใส่ URL รูปภาพจริงที่นี่ถ้ามี
            year: "3",      // ข้อมูลใหม่
            gpa: "3.75"     // ข้อมูลใหม่
        };

        // =========================================================
        // 3. เอาข้อมูลยัดใส่ State
        // =========================================================
        setFullName(data.fullName);
        setStudentId(data.studentId);
        setFaculty(data.faculty);
        setDepartment(data.department);
        setEmail(data.email);
        setPhone(data.phone);
        setAdvisor(data.advisor);
        setAvatarUrl(data.avatarUrl);
        setYear(data.year);
        setGpa(data.gpa);

      } catch (error) {
        console.error("Error loading profile:", error);
        alert("ไม่สามารถดึงข้อมูลโปรไฟล์ได้");
      } finally {
        setLoading(false);
      }
    };

    fetchProfileData();
  }, []);

  // ฟังก์ชันบันทึกข้อมูล (Update)
  const handleSave = async () => {
    try {
        // =========================================================
        // ส่วนยิง API Update ของจริง (Comment ไว้)
        // =========================================================
        /*
        const token = localStorage.getItem("token");
        const res = await fetch("/api/profile/update", {
            method: "PUT",
            headers: { 
                "Content-Type": "application/json",
                "Authorization": `Bearer ${token}`
            },
            body: JSON.stringify({
                fullName, studentId, faculty, department,
                email, phone, advisor, avatarUrl
            })
        });

        if (!res.ok) throw new Error("Update failed");
        */

        await new Promise((resolve) => setTimeout(resolve, 500)); // จำลองโหลด
        alert("บันทึกข้อมูลเรียบร้อยแล้ว!");

    } catch (error) {
        console.error(error);
        alert("เกิดข้อผิดพลาดในการบันทึก");
    }
  };

  if (loading) {
      return <div className="p-10 text-center text-gray-500">กำลังโหลดข้อมูลโปรไฟล์...</div>;
  }

  return (
    <div className="p-6 bg-gray-100 min-h-screen animate-fade-in">
      <h1 className="text-2xl font-bold">โปรไฟล์ผู้ใช้</h1>

      <p className="mt-2 text-gray-400">ข้อมูลส่วนตัว</p>

      <div className="relative mt-4 w-full min-h-[600px] bg-white rounded-lg shadow-md p-5">
        <p className="text-base font-bold">ข้อมูลส่วนตัว</p>
        <p className="text-xs text-gray-400 mt-1">ข้อมูลพื้นฐานของคุณ</p>

        {/* Avatar */}
        <div className="mt-5 flex items-center gap-4">
          <div className="w-18 h-18 rounded-full bg-gray-300 flex items-center justify-center overflow-hidden w-[72px] h-[72px]"> {/* กำหนดขนาดที่แน่นอน */}
            {avatarUrl ? (
              <img src={avatarUrl} alt="Profile" className="w-full h-full object-cover" />
            ) : (
              <span className="text-gray-500 text-sm">Photo</span>
            )}
          </div>

          <div className="flex flex-col gap-1">
            <input
              type="text"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              readOnly // ปกติชื่อไม่ควรแก้เองได้ง่ายๆ ในหน้านี้
              className="text-sm font-semibold text-gray-800 border-none bg-transparent focus:ring-0 p-0"
            />
            <input
              type="text"
              value={email}
              readOnly
              className="text-xs font-semibold text-gray-400 border-none bg-transparent focus:ring-0 p-0"
            />
          </div>
        </div>

        {/* ชื่อ-นามสกุล + รหัสนิสิต */}
        <div className="mt-5 flex gap-10 w-full">
          <div className="flex flex-col gap-2 w-1/2">
            <p className="text-base font-bold">ชื่อ-นามสกุล</p>
            <input
              type="text"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-100 text-sm text-gray-700 focus:outline-none focus:border-blue-500"
            />
          </div>

          <div className="flex flex-col gap-2 w-1/2">
            <p className="text-base font-bold">รหัสนิสิต</p>
            <input
              type="text"
              value={studentId}
              readOnly // รหัสนิสิตควรห้ามแก้
              className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-200 text-sm text-gray-500 cursor-not-allowed focus:outline-none"
            />
          </div>
        </div>

        {/* คณะ + ภาควิชา */}
        <div className="mt-5 flex gap-10 w-full">
          <div className="flex flex-col gap-2 w-1/2">
            <p className="text-base font-bold">คณะ</p>
            <input
              type="text"
              value={faculty}
              onChange={(e) => setFaculty(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-100 text-sm text-gray-700 focus:outline-none focus:border-blue-500"
            />
          </div>

          <div className="flex flex-col gap-2 w-1/2">
            <p className="text-base font-bold">ภาควิชา</p>
            <input
              type="text"
              value={department}
              onChange={(e) => setDepartment(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-100 text-sm text-gray-700 focus:outline-none focus:border-blue-500"
            />
          </div>
        </div>

        {/* อีเมล + เบอร์โทร */}
        <div className="mt-5 flex gap-10 w-full">
          <div className="flex flex-col gap-2 w-1/2">
            <p className="text-base font-bold">อีเมล</p>
            <input
              type="text"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-100 text-sm text-gray-700 focus:outline-none focus:border-blue-500"
            />
          </div>

          <div className="flex flex-col gap-2 w-1/2">
            <p className="text-base font-bold">เบอร์โทร</p>
            <input
              type="text"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-100 text-sm text-gray-700 focus:outline-none focus:border-blue-500"
            />
          </div>
        </div>

        {/* อาจารย์ที่ปรึกษา */}
        <div className="mt-5 flex gap-10 w-full">
          <div className="flex flex-col gap-2 w-1/2">
            <p className="text-base font-bold">อาจารย์ที่ปรึกษา</p>
            <input
              type="text"
              value={advisor}
              onChange={(e) => setAdvisor(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-100 text-sm text-gray-700 focus:outline-none focus:border-blue-500"
            />
          </div>
          <div className="w-1/2"></div>
        </div>

        <div className="mt-6 flex justify-end">
          <button
            className="bg-[#2D2D2D] hover:bg-black text-white px-10 py-3 rounded-lg text-sm font-bold shadow-lg transition-all"
            onClick={handleSave}
          >
            บันทึกการเปลี่ยนแปลง
          </button>
        </div>
      </div>

      <div className="relative mt-4 w-full min-h-[100px] bg-white rounded-lg shadow-md p-5">
        <p className="text-base font-bold">ข้อมูลการศึกษา</p>
        <p className="text-xs text-gray-400 mt-1">รายละเอียดการศึกษาเเละผลการเรียน</p>

        <div className="mt-4 flex gap-4">
          {/* กล่อง ชั้นปี */}
          <div className="flex-1 min-h-[100px] bg-white rounded-lg shadow-inner p-4 border border-gray-100 flex items-center">
            <div className="flex gap-4 items-center w-full">
              <div className="flex items-center justify-center bg-green-100 rounded-full w-12 h-12">
                {/* SVG Icon */}
                <svg className="w-6 h-6 text-green-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M22 10v6M2 10l10-5 10 5-10 5z" />
                  <path d="M6 12v5c3 3 9 3 12 0v-5" />
                </svg>
              </div>
              <div className="flex flex-col gap-1 w-full">
                <p className="text-sm font-medium text-gray-500">ชั้นปี</p>
                {/*  เปลี่ยนเป็น State เพื่อให้รับค่าจาก API ได้ */}
                <input
                  type="text"
                  value={year}
                  readOnly
                  className="border-none bg-transparent text-xl font-bold text-gray-800 px-0 py-0 focus:ring-0 w-full"
                />
              </div>
            </div>
          </div>

          {/* กล่อง เกรดเฉลี่ยสะสม */}
          <div className="flex-1 min-h-[100px] bg-white rounded-lg shadow-inner p-4 border border-gray-100 flex items-center">
            <div className="flex gap-4 items-center w-full">
              <div className="flex items-center justify-center bg-yellow-100 rounded-full w-12 h-12">
                {/* SVG Icon */}
                <svg className="w-6 h-6 text-yellow-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                </svg>
              </div>
              <div className="flex flex-col gap-1 w-full">
                <p className="text-sm font-medium text-gray-500">เกรดเฉลี่ยสะสม</p>
                {/* เปลี่ยนเป็น State เพื่อให้รับค่าจาก API ได้ */}
                <input
                  type="text"
                  value={gpa}
                  readOnly
                  className="border-none bg-transparent text-xl font-bold text-gray-800 px-0 py-0 focus:ring-0 w-full"
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}