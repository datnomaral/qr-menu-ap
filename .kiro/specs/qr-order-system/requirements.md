# Requirements Document

## Introduction

Hệ thống đặt món qua mã QR cho quán ăn (QR Order System) cho phép khách hàng quét mã QR tại bàn để truy cập thực đơn trực tuyến, chọn món và gửi đơn hàng trực tiếp về cho nhân viên xử lý. Phía quản trị (admin) có thể quản lý thực đơn, danh mục, bàn ăn, tạo mã QR và theo dõi đơn hàng theo thời gian thực. Hệ thống hướng đến vận hành thực tế với khoảng 7 màn hình chính, không bao gồm thanh toán trực tuyến ở giai đoạn MVP.

---

## Glossary

- **QR_Generator**: Module tạo và xuất mã QR gắn với từng bàn.
- **Menu_Service**: Module quản lý và phục vụ dữ liệu thực đơn (danh mục, món ăn).
- **Order_Service**: Module tiếp nhận, lưu trữ và cập nhật trạng thái đơn hàng.
- **Cart**: Giỏ hàng phía khách, lưu tạm danh sách món đã chọn trước khi đặt.
- **Admin_Dashboard**: Giao diện quản trị dành cho nhân viên/chủ quán.
- **Customer_UI**: Giao diện đặt món dành cho khách hàng (truy cập qua QR).
- **Table**: Đối tượng đại diện cho một bàn ăn trong quán.
- **Category**: Nhóm phân loại món ăn (ví dụ: Khai vị, Món chính, Đồ uống).
- **MenuItem**: Một món ăn thuộc một Category, có tên, giá, hình ảnh và trạng thái còn/hết.
- **Order**: Đơn hàng gồm danh sách OrderItem, gắn với một Table và có trạng thái vòng đời.
- **OrderItem**: Một dòng trong Order, gồm MenuItem và số lượng.
- **Order_Status**: Trạng thái đơn hàng: `pending` → `confirmed` → `served` → `completed`.

---

## Requirements

### Requirement 1: Quét QR và nhận diện bàn

**User Story:** Là một khách hàng, tôi muốn quét mã QR tại bàn để truy cập thực đơn, để tôi không cần gọi nhân viên hay cầm thực đơn giấy.

#### Acceptance Criteria

1. WHEN khách hàng quét mã QR của một Table, THE Customer_UI SHALL hiển thị trang thực đơn với thông tin Table tương ứng được nhận diện tự động.
2. WHEN Customer_UI nhận mã định danh Table từ URL mã QR, THE Customer_UI SHALL lưu thông tin Table vào phiên làm việc hiện tại (session) để dùng xuyên suốt quá trình đặt món.
3. IF mã định danh Table trong URL không tồn tại trong hệ thống, THEN THE Customer_UI SHALL hiển thị thông báo lỗi "Bàn không hợp lệ" và không hiển thị thực đơn.
4. IF Table có trạng thái không hoạt động, THEN THE Customer_UI SHALL hiển thị thông báo "Bàn hiện không phục vụ" và không cho phép đặt món.

---

### Requirement 2: Xem thực đơn theo danh mục

**User Story:** Là một khách hàng, tôi muốn duyệt thực đơn theo danh mục và xem thông tin từng món, để tôi có thể dễ dàng tìm và chọn món phù hợp.

#### Acceptance Criteria

1. THE Customer_UI SHALL hiển thị danh sách tất cả Category đang hoạt động theo thứ tự sắp xếp được cấu hình.
2. WHEN khách hàng chọn một Category, THE Customer_UI SHALL hiển thị danh sách MenuItem thuộc Category đó kèm tên, giá và hình ảnh.
3. THE Customer_UI SHALL đánh dấu rõ ràng các MenuItem có trạng thái hết hàng và không cho phép thêm chúng vào Cart; IF việc hiển thị đánh dấu thất bại, THEN THE Customer_UI SHALL vẫn ngăn không cho thêm MenuItem hết hàng vào Cart.
4. WHILE Customer_UI đang tải dữ liệu thực đơn từ Menu_Service, THE Customer_UI SHALL hiển thị trạng thái đang tải.
5. IF Menu_Service không phản hồi trong vòng 10 giây, THEN THE Customer_UI SHALL hiển thị thông báo lỗi và cung cấp nút thử lại.

---

### Requirement 3: Quản lý giỏ hàng

**User Story:** Là một khách hàng, tôi muốn thêm/xóa món và điều chỉnh số lượng trong giỏ hàng, để tôi có thể kiểm tra lại trước khi gửi đơn.

#### Acceptance Criteria

1. WHEN khách hàng nhấn nút thêm một MenuItem còn hàng, THE Cart SHALL tăng số lượng MenuItem đó lên 1.
2. WHEN khách hàng giảm số lượng một OrderItem xuống 0, THE Cart SHALL xóa OrderItem đó khỏi Cart.
3. THE Cart SHALL hiển thị tổng số lượng món và tổng giá tiền được cập nhật ngay sau mỗi thay đổi.
4. THE Cart SHALL duy trì nội dung (kể cả khi giỏ hàng trống) trong suốt phiên làm việc khi khách hàng điều hướng giữa các Category.
5. WHEN khách hàng xóa tất cả OrderItem khỏi Cart, THE Cart SHALL hiển thị trạng thái giỏ hàng trống.

---

### Requirement 4: Đặt món

**User Story:** Là một khách hàng, tôi muốn gửi đơn hàng từ giỏ hàng, để nhân viên biết tôi muốn gọi món gì.

#### Acceptance Criteria

1. WHEN khách hàng xác nhận đặt món từ Cart không rỗng, THE Order_Service SHALL tạo một Order mới với Order_Status là `pending`, gắn với Table và danh sách OrderItem tương ứng.
2. WHEN Order_Service tạo Order thành công, THE Customer_UI SHALL hiển thị thông báo xác nhận đặt hàng thành công, xóa nội dung Cart và không hiển thị thông báo lỗi.
3. IF Order_Service trả về lỗi khi tạo Order, THEN THE Customer_UI SHALL hiển thị thông báo lỗi và giữ nguyên nội dung Cart.
4. THE Order_Service SHALL gán thời gian đặt hàng (timestamp) cho mỗi Order tại thời điểm tạo.
5. WHEN khách hàng gửi đơn trong cùng phiên làm việc, THE Customer_UI SHALL cho phép đặt thêm món bằng cách tạo Order mới bổ sung.

---

### Requirement 5: Theo dõi đơn hàng tại Admin Dashboard

**User Story:** Là một nhân viên, tôi muốn xem tất cả đơn hàng đang chờ xử lý theo thời gian thực, để tôi có thể phục vụ khách kịp thời.

#### Acceptance Criteria

1. THE Admin_Dashboard SHALL hiển thị danh sách tất cả Order có Order_Status là `pending` hoặc `confirmed`, sắp xếp theo thời gian đặt hàng từ cũ đến mới.
2. WHEN một Order mới được tạo, THE Admin_Dashboard SHALL cập nhật danh sách đơn hàng trong vòng 5 giây kể từ thời điểm Order được tạo mà không cần nhân viên tải lại trang.
3. THE Admin_Dashboard SHALL hiển thị thông tin Table, danh sách OrderItem (tên món, số lượng) và thời gian đặt hàng cho từng Order.
4. WHEN nhân viên cập nhật Order_Status của một Order, THE Order_Service SHALL lưu trạng thái mới và thời gian cập nhật tương ứng.
5. THE Admin_Dashboard SHALL cho phép lọc danh sách Order theo Order_Status.

---

### Requirement 6: Quản lý thực đơn (MenuItem và Category)

**User Story:** Là một admin, tôi muốn thêm, sửa, xóa món ăn và danh mục, để thực đơn luôn phản ánh đúng các món quán đang phục vụ.

#### Acceptance Criteria

1. THE Admin_Dashboard SHALL cho phép admin tạo Category mới với tên và thứ tự hiển thị.
2. THE Admin_Dashboard SHALL cho phép admin tạo MenuItem mới với tên, giá, hình ảnh, Category và trạng thái còn/hết hàng.
3. WHEN admin cập nhật thông tin của một MenuItem, THE Menu_Service SHALL lưu thay đổi và phản ánh ngay trên Customer_UI cho các yêu cầu tiếp theo; THE Customer_UI không cập nhật tự động từ các nguồn khác ngoài thao tác cập nhật của admin.
4. WHEN admin đánh dấu một MenuItem là hết hàng, THE Menu_Service SHALL cập nhật trạng thái và THE Customer_UI SHALL hiển thị món đó là không thể đặt.
5. IF admin xóa một Category đang còn MenuItem thuộc về, THEN THE Admin_Dashboard SHALL yêu cầu admin chuyển hoặc xóa các MenuItem đó trước khi xóa Category; IF admin không thực hiện hành động này, THEN THE Admin_Dashboard SHALL hủy thao tác xóa Category.
6. THE Admin_Dashboard SHALL cho phép admin sắp xếp lại thứ tự hiển thị của Category và MenuItem.

---

### Requirement 7: Quản lý bàn và tạo mã QR

**User Story:** Là một admin, tôi muốn thêm bàn và tạo mã QR cho từng bàn, để khách có thể quét và đặt món đúng bàn của mình.

#### Acceptance Criteria

1. THE Admin_Dashboard SHALL cho phép admin tạo Table mới với tên/số hiệu bàn và trạng thái hoạt động.
2. WHEN admin yêu cầu tạo QR cho một Table, THE QR_Generator SHALL tạo mã QR chứa URL duy nhất định danh Table đó trong hệ thống.
3. THE Admin_Dashboard SHALL cho phép admin tải xuống hình ảnh mã QR của từng Table ở định dạng PNG.
4. WHEN admin cập nhật tên Table, THE QR_Generator SHALL giữ nguyên URL định danh của Table đó để mã QR cũ vẫn hoạt động.
5. WHEN admin vô hiệu hóa một Table, THE Customer_UI SHALL ngăn khách đặt món từ mã QR của Table đó ngay lập tức, kể cả khi khách đang trong phiên đặt món.
6. THE Admin_Dashboard SHALL hiển thị danh sách tất cả Table kèm trạng thái hoạt động và liên kết xem/tải QR.
