import axios from "axios";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080/api";

// สร้าง Instance กลาง
export const api = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true, // 🔥 ใส่ตรงนี้ทีเดียว จบทุกไฟล์!
  headers: {
    "Content-Type": "application/json",
  },
});

// (Optional) ดัก Error 401 เพื่อให้ Logout อัตโนมัติถ้า Token หมดอายุ
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // สั่ง Redirect หรือ Clear localStorage ตรงนี้ได้
      // window.location.href = "/"; 
    }
    return Promise.reject(error);
  }
);