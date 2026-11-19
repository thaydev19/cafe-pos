# ☕ QuickOne Cafe & Bakery POS System

Hệ thống quản lý và bán hàng POS chuyên biệt cho quán Specialty Coffee & Bakery, xây dựng trên nền tảng Next.js 16, Supabase PostgreSQL, Tailwind CSS và hệ thống in hóa đơn nhiệt ESC/POS & Tem dán ly 50x30mm.

---

## 📖 Tài liệu & Hướng dẫn sử dụng chi tiết

Toàn bộ thông tin tổng hợp chức năng và hướng dẫn vận hành chi tiết từng bước được biên soạn tại:
👉 **[Xem Hướng dẫn sử dụng toàn diện (HUONG_DAN_SU_DUNG.md)](./HUONG_DAN_SU_DUNG.md)**

Nội dung tài liệu bao gồm:
1. **Tổng quan hệ thống & Sơ đồ kiến trúc vận hành** (Thu ngân - Barista KDS - Khách hàng - Quản lý)
2. **Tổng hợp 10 Phân hệ chức năng chính**:
   - Bán hàng tại quầy POS Terminal (`/pos`)
   - Quản lý ca làm việc Mở/Đóng ca mù & In Z-Report
   - Màn hình phụ hướng khách hàng Realtime OnePay QR (`/customer-display`)
   - Màn hình Barista KDS điều phối pha chế theo thời gian thực
   - Quản lý Sơ đồ bàn & Khu vực (Trong nhà, Ngoài trời, Tầng 2)
   - Quản lý Thực đơn, Ma trận giá (Hot/Iced/Frappe x S/M/L) & Topping (`/products`)
   - Quản lý Đơn hàng & Lịch sử giao dịch (`/orders`)
   - Báo cáo & Thống kê Doanh thu (`/dashboard`)
   - Cài đặt Hệ thống & Máy in hóa đơn 80mm, Máy in tem 50x30mm (`/settings`)
   - Xác thực & Phân quyền mã PIN nhân viên (`/login`)
3. **9 Quy trình nghiệp vụ từng bước** cho nhân viên thu ngân, barista và chủ quán.
4. **Bảng xử lý sự cố thường gặp (FAQ & Troubleshooting)**.

---

## 🚀 Khởi chạy dự án (Getting Started)

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
