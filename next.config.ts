/** @type {import('next').NextConfig} */
const nextConfig = {
  async rewrites() {
    return [
      {
        // เมื่อ Frontend เรียกเข้ามาที่ /api/...
        source: '/api/:path*',
        // ให้ส่งไปที่ Backend โดยเอาแค่ :path* ไป (ตัด /api ออก)
        destination: 'http://localhost:8080/:path*', 
      },
    ];
  },
};

export default nextConfig;