# Implementation Plan: QR Order System

## Overview

Triển khai hệ thống đặt món qua mã QR theo kiến trúc Client–Server: React + TypeScript (Vite) + Zustand cho frontend, Node.js + Express + TypeScript cho backend, PostgreSQL + Prisma ORM cho database, SSE cho real-time, và `qrcode` npm package cho QR generation. Kế hoạch chia thành 8 nhóm nhiệm vụ, xây dựng từ nền tảng (Prisma schema, project setup) đến các tính năng cụ thể, kết thúc bằng integration và wiring.

---

## Tasks

- [x] 1. Project setup và cấu hình nền tảng
  - Khởi tạo monorepo với hai workspace: `backend/` (Express + TypeScript) và `frontend/` (Vite + React + TypeScript)
  - Cài đặt dependencies: `express`, `prisma`, `@prisma/client`, `qrcode`, `zod`, `cors`, `dotenv` cho backend; `zustand`, `react-router-dom`, `vitest`, `@vitest/ui`, `fast-check` cho frontend
  - Cấu hình `tsconfig.json` cho cả hai workspace với strict mode
  - Cấu hình Vitest cho cả frontend và backend (dùng `vitest` unified)
  - Tạo file `.env.example` với các biến môi trường cần thiết (`DATABASE_URL`, `BASE_URL`, `PORT`)
  - _Requirements: Tất cả_

- [x] 2. Database schema và migrations
  - [x] 2.1 Khởi tạo Prisma schema và tạo migration ban đầu
    - Viết `schema.prisma` đầy đủ với các model: `Table`, `Category`, `MenuItem`, `Order`, `OrderItem` và enum `OrderStatus`
    - Chạy `prisma migrate dev --name init` để tạo migration đầu tiên
    - Tạo `prisma/seed.ts` với dữ liệu mẫu (2 bàn, 2 category, 5 món)
    - _Requirements: 1.1, 4.1, 6.1, 6.2, 7.1_

- [x] 3. Backend — Table API và QR Generator
  - [x] 3.1 Implement Table service và REST endpoints
    - Tạo `backend/src/services/table.service.ts` với các hàm: `getAll()`, `getById(id)`, `create(data)`, `update(id, data)`
    - Tạo `backend/src/routes/tables.router.ts` với endpoints: `GET /api/v1/tables`, `GET /api/v1/tables/:id`, `POST /api/v1/tables`, `PUT /api/v1/tables/:id`
    - Implement xác thực tableId: trả về `TABLE_NOT_FOUND` (404) khi UUID không tồn tại, `TABLE_INACTIVE` (403) khi `isActive = false`
    - Dùng `zod` validate request body cho POST/PUT
    - _Requirements: 1.1, 1.3, 1.4, 7.1, 7.5_

  - [ ]* 3.2 Write property test cho Table validation (Property 1)
    - **Property 1: Xác thực bàn — kết quả nhất quán với trạng thái bàn**
    - Dùng `fc.uuid()`, random strings và `fc.boolean()` cho `isActive` để test các tổ hợp
    - Chạy tối thiểu 100 iterations
    - **Validates: Requirements 1.1, 1.3, 1.4**

  - [ ]* 3.3 Write property test cho Table QR URL invariant (Property 15)
    - **Property 15: QR URL chứa đúng tableId và bất biến khi đổi tên bàn**
    - Dùng `fc.uuid()` cho tableId và `fc.string()` cho name, verify URL trong QR không đổi sau rename
    - Chạy tối thiểu 100 iterations
    - **Validates: Requirements 7.2, 7.4**

  - [x] 3.4 Implement QR Generator endpoint
    - Tạo `backend/src/services/qr.service.ts` dùng thư viện `qrcode` để tạo QR PNG từ URL `${BASE_URL}/menu?tableId=<uuid>`
    - Thêm endpoint `GET /api/v1/tables/:id/qr` trả về `Content-Type: image/png` với header `Content-Disposition: attachment; filename="table-<id>.png"`
    - _Requirements: 7.2, 7.3, 7.4_

  - [ ]* 3.5 Write unit tests cho QR Generator
    - Test: GET `/tables/:id/qr` trả về Content-Type `image/png`
    - Test: QR URL chứa đúng tableId (UUID)
    - Test: Sau khi rename table, tableId trong QR URL không thay đổi
    - _Requirements: 7.2, 7.3, 7.4_

- [x] 4. Backend — Menu API (Category và MenuItem)
  - [x] 4.1 Implement Category service và REST endpoints
    - Tạo `backend/src/services/category.service.ts` với: `getActive()`, `create(data)`, `update(id, data)`, `delete(id)`, `reorder(orderedIds)`
    - Tạo `backend/src/routes/categories.router.ts` với các endpoints đầy đủ
    - Implement guard xóa: kiểm tra số MenuItem thuộc category trước khi DELETE, trả về `CATEGORY_HAS_ITEMS` (409) nếu > 0
    - _Requirements: 2.1, 6.1, 6.5, 6.6_

  - [ ]* 4.2 Write property test cho Category filter và sort (Property 2)
    - **Property 2: Category filter đúng theo trạng thái và thứ tự**
    - Dùng `fc.array(categoryArb)` với random `isActive` và `displayOrder`
    - Verify: chỉ trả về `isActive = true`, sắp xếp tăng dần theo `displayOrder`
    - Chạy tối thiểu 100 iterations
    - **Validates: Requirements 2.1**

  - [ ]* 4.3 Write property test cho Category delete guard (Property 13)
    - **Property 13: Xóa Category có MenuItem bị chặn; Category rỗng xóa được**
    - Dùng `fc.nat()` cho menuItem count: nếu > 0 → DELETE phải trả về 409; nếu = 0 → DELETE thành công
    - Chạy tối thiểu 100 iterations
    - **Validates: Requirements 6.5**

  - [x] 4.4 Implement MenuItem service và REST endpoints
    - Tạo `backend/src/services/menu-item.service.ts` với: `getAll(filters)`, `getById(id)`, `create(data)`, `update(id, data)`, `delete(id)`, `reorder(orderedIds)`
    - Tạo `backend/src/routes/menu-items.router.ts` với các endpoints đầy đủ, hỗ trợ filter `?categoryId=`
    - _Requirements: 2.2, 2.3, 6.2, 6.3, 6.4, 6.6_

  - [ ]* 4.5 Write property test cho MenuItem filter theo categoryId (Property 3)
    - **Property 3: MenuItem filter đúng theo categoryId**
    - Dùng `fc.array(menuItemArb)` với categoryId phân tán ngẫu nhiên
    - Verify: mọi item trong response đều có `categoryId` khớp đúng với query param
    - Chạy tối thiểu 100 iterations
    - **Validates: Requirements 2.2**

  - [ ]* 4.6 Write property test cho MenuItem update round-trip (Property 12)
    - **Property 12: MenuItem update round-trip — thay đổi phản ánh ngay trên API**
    - Dùng `fc.record(menuItemUpdateArb)` để generate updates ngẫu nhiên (name, price, isAvailable)
    - Verify: GET sau PUT trả về chính xác giá trị đã cập nhật
    - Chạy tối thiểu 100 iterations
    - **Validates: Requirements 6.3, 6.4**

  - [ ]* 4.7 Write property test cho Reorder displayOrder (Property 14)
    - **Property 14: Reorder cập nhật đúng displayOrder**
    - Dùng `fc.array(fc.nat())` cho thứ tự mới, verify GET sau PUT reorder trả về đúng `displayOrder`
    - Chạy tối thiểu 100 iterations
    - **Validates: Requirements 6.6**

- [x] 5. Backend — Order API và SSE
  - [x] 5.1 Implement Order service và REST endpoints
    - Tạo `backend/src/services/order.service.ts` với: `create(data)`, `getAll(filters)`, `updateStatus(id, status)`
    - Trong `create()`: validate Cart không rỗng (400 `EMPTY_CART`), validate tableId tồn tại và `isActive` (403 `TABLE_INACTIVE`), validate từng `menuItemId` còn hàng (409 `ITEM_UNAVAILABLE`), snapshot `priceAtOrder` từ giá hiện tại của MenuItem, gán `orderedAt = new Date()`
    - Tạo `backend/src/routes/orders.router.ts` với: `POST /api/v1/orders`, `GET /api/v1/orders?status=`, `PUT /api/v1/orders/:id/status`
    - _Requirements: 4.1, 4.3, 4.4, 5.1, 5.4, 5.5_

  - [ ]* 5.2 Write property test cho Order creation (Property 7)
    - **Property 7: Order tạo ra phản ánh đúng Cart và có timestamp hợp lệ**
    - Dùng `fc.array(orderItemArb, { minLength: 1 })` generate Cart items hợp lệ
    - Verify: `tableId` đúng, `OrderItem[]` khớp, `status = pending`, `orderedAt` hợp lệ (≥ thời điểm gửi request)
    - Chạy tối thiểu 100 iterations
    - **Validates: Requirements 4.1, 4.4**

  - [ ]* 5.3 Write property test cho Orders filter và sort (Property 9)
    - **Property 9: Orders list filter đúng theo status và sort đúng theo thời gian**
    - Dùng `fc.array(orderArb)` với random statuses và timestamps
    - Verify: chỉ trả về Orders có status khớp, sắp xếp tăng dần theo `orderedAt`
    - Chạy tối thiểu 100 iterations
    - **Validates: Requirements 5.1, 5.5**

  - [ ]* 5.4 Write property test cho Order response completeness (Property 10)
    - **Property 10: Order response chứa đầy đủ thông tin bắt buộc**
    - Dùng `fc.array(orderArb, { minLength: 1 })`, verify mỗi order trong response có: tên bàn, `OrderItem[]` với tên món + số lượng, `orderedAt`
    - Chạy tối thiểu 100 iterations
    - **Validates: Requirements 5.3**

  - [ ]* 5.5 Write property test cho Order status transition (Property 11)
    - **Property 11: Cập nhật trạng thái Order được lưu đúng**
    - Dùng `fc.constantFrom(...validTransitions)` cho các transition hợp lệ: pending→confirmed, confirmed→served, served→completed
    - Verify: GET sau PUT trả về `status` mới và `updatedAt` lớn hơn trước
    - Chạy tối thiểu 100 iterations
    - **Validates: Requirements 5.4**

  - [ ]* 5.6 Write property test cho Table inactive reject (Property 16)
    - **Property 16: Table bị vô hiệu hóa — mọi request đặt món bị từ chối**
    - Dùng `fc.boolean()` cho `isActive`, verify POST `/orders` với `isActive = false` luôn trả về 403 `TABLE_INACTIVE`
    - Chạy tối thiểu 100 iterations
    - **Validates: Requirements 7.5**

  - [x] 5.7 Implement SSE endpoint cho Admin Dashboard
    - Tạo `backend/src/routes/sse.router.ts` với endpoint `GET /api/v1/orders/stream`
    - Implement SSE manager: lưu danh sách active connections, broadcast event `new-order` khi Order được tạo trong `order.service.ts`
    - Set headers: `Content-Type: text/event-stream`, `Cache-Control: no-cache`, `Connection: keep-alive`
    - Cleanup connection khi client ngắt kết nối
    - _Requirements: 5.2_

- [x] 6. Checkpoint — Backend hoàn chỉnh
  - Đảm bảo tất cả backend tests pass, chạy `prisma migrate reset` để reset DB test sạch, ask the user if questions arise.

- [x] 7. Frontend — Customer UI
  - [x] 7.1 Implement Cart Zustand store
    - Tạo `frontend/src/stores/cart.store.ts` với đầy đủ interface `CartState` và `CartItem` theo design
    - Implement `addItem()`: nếu item đã có → tăng quantity; nếu item có `isAvailable = false` → từ chối (throw hoặc return false)
    - Implement `updateQuantity()`: nếu quantity ≤ 0 → tự động gọi `removeItem()`
    - Implement `removeItem()`, `clearCart()`, `totalQuantity()`, `totalPrice()`
    - Persist `tableId` trong sessionStorage để duy trì qua navigation
    - _Requirements: 1.2, 3.1, 3.2, 3.3, 3.4, 3.5_

  - [ ]* 7.2 Write property test cho Cart totals invariant (Property 5)
    - **Property 5: Cart totals invariant sau mọi thao tác**
    - Dùng `fc.array(cartItemArb, { minLength: 1 })` với quantity ≥ 1
    - Verify sau mỗi thao tác add/update/remove: `totalQuantity() = sum(item.quantity)` và `totalPrice() = sum(item.price × item.quantity)`
    - Chạy tối thiểu 100 iterations
    - **Validates: Requirements 3.1, 3.3**

  - [ ]* 7.3 Write property test cho Cart empty sau khi xóa hết (Property 6)
    - **Property 6: Xóa tất cả CartItem dẫn đến Cart rỗng**
    - Dùng `fc.array(cartItemArb, { minLength: 1 })`, giảm quantity tất cả về 0
    - Verify: `items = []`, `totalQuantity() = 0`, `totalPrice() = 0`
    - Chạy tối thiểu 100 iterations
    - **Validates: Requirements 3.2, 3.5**

  - [ ]* 7.4 Write property test cho MenuItem unavailable bị Cart reject (Property 4)
    - **Property 4: MenuItem hết hàng không thể thêm vào Cart**
    - Dùng `fc.boolean()` cho `isAvailable`, verify `addItem()` với `isAvailable = false` luôn bị từ chối
    - Chạy tối thiểu 100 iterations
    - **Validates: Requirements 2.3**

  - [ ]* 7.5 Write property test cho Cart state sau khi đặt hàng (Property 8)
    - **Property 8: Trạng thái Cart sau khi đặt hàng phụ thuộc vào kết quả Order**
    - Dùng `fc.boolean()` cho outcome + `fc.array(cartItemArb)`
    - Verify: nếu Order thành công → Cart rỗng; nếu Order lỗi → Cart không đổi
    - Chạy tối thiểu 100 iterations
    - **Validates: Requirements 4.2, 4.3**

  - [x] 7.6 Implement Customer UI routing và màn hình Landing/Error
    - Cấu hình `react-router-dom` với các routes: `/menu`, `/cart`, `/order-success`
    - Implement `LandingPage` component: đọc `?tableId=` từ URL, gọi `GET /api/v1/tables/:id` để xác thực
    - Hiển thị trang lỗi full-screen với message phù hợp khi `TABLE_NOT_FOUND` hoặc `TABLE_INACTIVE`
    - Lưu `tableId` vào Cart store khi xác thực thành công, redirect đến `/menu`
    - _Requirements: 1.1, 1.2, 1.3, 1.4_

  - [x] 7.7 Implement màn hình Menu (Category + MenuItem listing)
    - Tạo `MenuPage` component: fetch `GET /api/v1/categories` và hiển thị tabs/list category đang hoạt động theo `displayOrder`
    - Fetch `GET /api/v1/menu-items?categoryId=` khi chọn category
    - Hiển thị MenuItem với tên, giá, hình ảnh; đánh dấu rõ "Hết hàng" và disable nút thêm cho `isAvailable = false`
    - Implement loading state khi đang fetch và error state với nút "Thử lại" nếu timeout > 10s
    - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5_

  - [x] 7.8 Implement màn hình Cart và Order submission
    - Tạo `CartPage` component: hiển thị danh sách CartItem với controls tăng/giảm quantity, tổng số món, tổng tiền
    - Hiển thị trạng thái giỏ hàng trống khi `items = []`
    - Implement "Đặt món" button: validate cart trước khi gửi (kiểm tra `isAvailable`), gọi `POST /api/v1/orders`
    - Nếu thành công → `clearCart()` và redirect `/order-success`; nếu lỗi → hiển thị toast error, giữ nguyên Cart
    - _Requirements: 3.1, 3.2, 3.3, 3.5, 4.1, 4.2, 4.3, 4.5_

  - [x] 7.9 Implement màn hình Order Confirmation
    - Tạo `OrderSuccessPage` component: hiển thị thông báo xác nhận đặt hàng thành công
    - Thêm nút "Đặt thêm món" để quay về `/menu` (cho phép tạo Order mới bổ sung)
    - _Requirements: 4.2, 4.5_

- [ ] 8. Frontend — Admin Dashboard
  - [x] 8.1 Implement Admin routing và layout
    - Cấu hình routes Admin: `/admin/orders`, `/admin/menu`, `/admin/tables`
    - Tạo `AdminLayout` component với navigation sidebar/header
    - _Requirements: 5.1, 6.1, 7.1_

  - [x] 8.2 Implement màn hình Admin Orders với SSE
    - Tạo `AdminOrdersPage` component: fetch `GET /api/v1/orders?status=pending,confirmed` khi mount
    - Implement `useSSE` hook dùng `EventSource` kết nối `GET /api/v1/orders/stream`, cập nhật danh sách khi nhận event `new-order`
    - Implement exponential backoff reconnect (1s → 2s → 4s → max 30s) khi SSE ngắt kết nối; hiển thị badge "Đang kết nối lại..."
    - Hiển thị mỗi Order với: tên bàn, danh sách OrderItem (tên món + số lượng), thời gian đặt, status
    - Implement dropdown/buttons để cập nhật Order_Status, gọi `PUT /api/v1/orders/:id/status`
    - Implement filter Order theo status
    - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5_

  - [ ] 8.3 Implement màn hình Admin Menu Management
    - Tạo `AdminMenuPage` component với hai panel: Category list và MenuItem list
    - Implement CRUD Category: form tạo mới, inline edit tên và `displayOrder`, delete với guard message nếu có MenuItem
    - Implement CRUD MenuItem: form tạo mới với name, price, imageUrl, category selector, isAvailable toggle; inline edit; delete
    - Implement drag-and-drop hoặc up/down buttons cho reorder, gọi `PUT /api/v1/categories/reorder` và `PUT /api/v1/menu-items/reorder`
    - _Requirements: 6.1, 6.2, 6.3, 6.4, 6.5, 6.6_

  - [x] 8.4 Implement màn hình Admin Table Management
    - Tạo `AdminTablesPage` component: hiển thị danh sách tất cả Table với tên, trạng thái `isActive`
    - Implement form tạo Table mới (name, isActive)
    - Implement edit Table (name, toggle isActive)
    - Implement nút "Xem/Tải QR" gọi `GET /api/v1/tables/:id/qr` và trigger download file PNG
    - _Requirements: 7.1, 7.2, 7.3, 7.4, 7.5, 7.6_

- [x] 9. Checkpoint — Frontend hoàn chỉnh
  - Đảm bảo tất cả frontend tests pass, kiểm tra Cart persistence khi navigate giữa các Category, ask the user if questions arise.

- [x] 10. Integration và wiring
  - [x] 10.1 Wiring frontend–backend và xử lý CORS
    - Cấu hình CORS trong Express cho phép origin của Vite dev server
    - Cấu hình Vite proxy cho `/api` → backend trong `vite.config.ts`
    - Verify end-to-end: Customer quét QR → load menu → thêm món → đặt món
    - _Requirements: 1.1, 2.1, 3.1, 4.1_

  - [ ]* 10.2 Write integration test cho Order flow end-to-end
    - Test: Quét QR (GET table) → load menu → thêm món vào Cart → POST order → Admin SSE nhận event trong ≤5s
    - Test: POST order với inactive table → nhận 403
    - Test: POST order với unavailable menu item → nhận 409
    - _Requirements: 4.1, 4.2, 5.2, 7.5_

  - [ ]* 10.3 Write integration test cho SSE reconnect
    - Test: Giả lập ngắt kết nối SSE → verify client tự reconnect với exponential backoff
    - Test: Sau reconnect, Admin vẫn nhận được new-order events
    - _Requirements: 5.2_

  - [ ]* 10.4 Write integration test cho MenuItem availability sync
    - Test: Admin đánh dấu MenuItem hết hàng → GET `/menu-items` phản ánh `isAvailable = false` ngay lập tức
    - _Requirements: 6.4_

- [x] 11. Checkpoint cuối — Đảm bảo tất cả tests pass
  - Chạy toàn bộ test suite: `vitest run` cho cả frontend và backend
  - Verify tất cả 16 property tests đều pass với ≥ 100 iterations
  - Ask the user if questions arise.

---

## Notes

- Tasks đánh dấu `*` là optional (test tasks), có thể skip để có MVP nhanh hơn
- Mỗi property test tham chiếu đúng số hiệu Property trong design.md để đảm bảo traceability
- `priceAtOrder` snapshot trong `OrderItem` đảm bảo giá không bị ảnh hưởng khi admin sửa giá sau này
- SSE chỉ là luồng 1 chiều (server → admin), phù hợp hơn WebSocket cho use case này
- `tableId` là UUID bất biến — QR URL không cần tái tạo khi admin đổi tên bàn
- Cart được lưu trong Zustand (in-memory + sessionStorage cho `tableId`), reset khi tab đóng
- Tất cả property tests dùng `fast-check` với tag format: `// Feature: qr-order-system, Property {N}: {property_text}`

## Task Dependency Graph

```json
{
  "waves": [
    { "id": 0, "tasks": ["2.1"] },
    { "id": 1, "tasks": ["3.1", "4.1", "4.4", "5.1"] },
    { "id": 2, "tasks": ["3.2", "3.3", "3.4", "4.2", "4.3", "4.5", "4.6", "4.7", "5.2", "5.3", "5.4", "5.5", "5.6", "5.7", "7.1"] },
    { "id": 3, "tasks": ["3.5", "7.2", "7.3", "7.4", "7.5", "7.6", "8.1"] },
    { "id": 4, "tasks": ["7.7", "7.8", "8.2", "8.3", "8.4"] },
    { "id": 5, "tasks": ["7.9", "10.1"] },
    { "id": 6, "tasks": ["10.2", "10.3", "10.4"] }
  ]
}
```
