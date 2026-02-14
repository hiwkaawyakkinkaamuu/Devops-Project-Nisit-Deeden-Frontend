/** @type {import('next').NextConfig} */
const nextConfig = {
  // ✅ เพิ่มส่วนนี้เข้าไป
  async rewrites() {
    return [
      {
        source: '/api-backend/:path*', // เมื่อ Frontend เรียก /api-backend/...
        destination: 'http://localhost:8080/:path*', // ให้ส่งต่อไปที่ Go Port 8080
      },
    ]
  },
};

export default nextConfig;