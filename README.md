# QR Order System 🍜

Hệ thống đặt món qua mã QR cho quán ăn.

## Yêu cầu

- Node.js 18+
- PostgreSQL đang chạy

## Cài đặt

```bash
# Cài dependencies cho cả 2 workspace
cd "d:\lm mã qr for menu\backend" && npm install
cd "d:\lm mã qr for menu\frontend" && npm install
```

## Cấu hình môi trường

```bash
# Tạo file .env trong thư mục backend
cd "d:\lm mã qr for menu\backend"
copy .env.example .env
```

Mở `backend/.env` và điền thông tin:

```env
DATABASE_URL="postgresql://postgres:yourpassword@localhost:5432/qr_order_db"
PORT=3001
BASE_URL="http://localhost:3001"
FRONTEND_URL="http://localhost:5173"
```

## Khởi tạo database

```bash
cd "d:\lm mã qr for menu\backend"

# 1. Generate Prisma client
npx prisma generate

# 2. Tạo bảng trong database
npx prisma migrate dev --name init

# 3. Seed dữ liệu mẫu (2 bàn, 2 category, 5 món)
npx ts-node prisma/seed.ts
```

## Chạy development

Mở 2 terminal:

**Terminal 1 — Backend:**
```bash
cd "d:\lm mã qr for menu\backend"
npm run dev
# → http://localhost:3001
```

**Terminal 2 — Frontend:**
```bash
cd "d:\lm mã qr for menu\frontend"
npm run dev
# → http://localhost:5173
```

## Sử dụng

### Khách hàng
1. Vào `http://localhost:5173/admin/tables` để tạo bàn và tải QR
2. Quét mã QR → tự nhận diện bàn → xem thực đơn → đặt món

### Admin
- `http://localhost:5173/admin/orders` — theo dõi đơn hàng real-time
- `http://localhost:5173/admin/menu` — quản lý thực đơn (category + món ăn)
- `http://localhost:5173/admin/tables` — quản lý bàn, tạo và tải QR

## API Endpoints

| Method | Endpoint | Mô tả |
|--------|----------|-------|
| GET | /api/v1/tables | Danh sách bàn |
| POST | /api/v1/tables | Tạo bàn mới |
| PUT | /api/v1/tables/:id | Cập nhật bàn |
| GET | /api/v1/tables/:id/qr | Tải QR PNG |
| GET | /api/v1/categories | Danh sách category |
| POST | /api/v1/categories | Tạo category |
| PUT | /api/v1/categories/:id | Cập nhật category |
| DELETE | /api/v1/categories/:id | Xóa category |
| GET | /api/v1/menu-items | Danh sách món (filter: ?categoryId=) |
| POST | /api/v1/menu-items | Tạo món mới |
| PUT | /api/v1/menu-items/:id | Cập nhật món |
| DELETE | /api/v1/menu-items/:id | Xóa món |
| POST | /api/v1/orders | Đặt món |
| GET | /api/v1/orders | Danh sách đơn (filter: ?status=) |
| PUT | /api/v1/orders/:id/status | Cập nhật trạng thái đơn |
| GET | /api/v1/orders/stream | SSE real-time stream |

## Chạy tests

```bash
cd "d:\lm mã qr for menu\backend" && npm test
cd "d:\lm mã qr for menu\frontend" && npm test
```
# qr-menu-ap
