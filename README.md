# Market Life — Học kinh tế chính trị

Game web mô phỏng chu trình **sản xuất → phân phối → tiêu dùng → nhà nước điều tiết**, gắn với nội dung **giá trị thặng dư** (Mác – Lênin). Chơi trực tiếp trên trình duyệt.

**Chơi online:** [https://mln-122-asm.vercel.app/](https://mln-122-asm.vercel.app/)

---

## Cài đặt và chạy trên máy

Yêu cầu: [Node.js](https://nodejs.org/) (khuyến nghị LTS, có kèm `npm`).

```bash
cd MLN122
npm install
npm run dev
```

Mở trình duyệt tại địa chỉ Vite hiển thị (thường `http://localhost:5173`).

Build bản production:

```bash
npm run build
npm run preview
```

---

## Cách chơi

### Bắt đầu

1. Mở game → màn **«Bắt đầu chơi»** — bấm để **bắt đầu đếm giờ phiên (5 phút)** và các sự kiện tự động.
2. Nút **«📚 Bài giảng»** mở tài liệu lý thuyết (đọc bất cứ lúc nào).

### Điều khiển

| Thao tác | Chức năng |
|----------|-----------|
| **W A S D** | Di chuyển nhân vật trên bản đồ |
| **E** | Tương tác khi đứng trong một khu (mở bảng) |

### Bốn khu trên bản đồ

| Khu | Vai trò trong game |
|-----|---------------------|
| **🏭 Nhà máy** | Sản xuất điện thoại (trừ nguyên liệu + lương), xem **giá trị thặng dư / sp**. Ba cơ chế: **tăng giờ** (m tuyệt đối), **máy** (m tương đối), **công nghệ** (m siêu ngạch). |
| **🚚 Trung gian** | Bán **sỉ** cả kho — tiền về nhanh nhưng mất một phần cho trung gian; có animation xe vận chuyển. |
| **🏪 Cửa hàng** | Bán **lẻ**: chỉnh giá, mời khách thử mua (xác suất theo giá). Khách trên map chỉ là **cảnh**, không tự trừ kho. |
| **🏛️ Nhà nước** | **Nộp thuế** (10% tiền mặt mỗi lần bấm — có thể nộp nhiều lần), thanh tra lao động (tự chọn), **kết thúc phiên** để xem báo cáo. |

### Phiên 5 phút & kết thúc

- Hết **5:00** → tự mở **tổng kết** rồi **báo cáo chi tiết**; nút **«Chơi lại»** chỉ có ở bước báo cáo đầy đủ.
- Vào 🏛️ chọn **«Kết thúc phiên»** để kết thúc sớm.
- **Phá sản:** tồn kho **0** và tiền **không đủ** để sản xuất thêm **1 sp** → phiên kết thúc (coi như hết vốn vận hành).

### Sự kiện tự động (sau khi đã bắt đầu chơi)

- **Thanh tra** 🏛️→🏭 định kỳ (~30–45 giây): có thể phạt nếu lâu không nộp thuế hoặc đang bật tăng giờ khi bị kiểm tra.
- **Áp lực giá / lạm phát** (chu kỳ khác): tăng dần **chi phí nguyên liệu / sp** (có trần mô phỏng).

---

## Công nghệ (tóm tắt)

- [Vite](https://vitejs.dev/) + [React](https://react.dev/) + TypeScript  
- UI: shadcn/ui, Tailwind CSS  

---

## Giấy phép / học thuật

Dự án phục vụ mục đích **học tập**. Nội dung lý luận trong game bám theo giáo trình kinh tế chính trị do người dùng cung cấp; số liệu trong game là **mô phỏng**, không thay cho tài liệu giảng dạy chính thức.
