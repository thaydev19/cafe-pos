# ☕ TÀI LIỆU TỔNG QUAN CHỨC NĂNG & HƯỚNG DẪN SỬ DỤNG
## HỆ THỐNG POS CAFE & BAKERY (QUICKONE CAFE STUDIO)

> **Phiên bản:** 2.0 (Artisanal Coffee & Bakery Studio Edition)  
> **Nền tảng:** Web Next.js 16 (App Router), Supabase PostgreSQL, Tailwind CSS, ESC/POS Thermal Printing  
> **Đơn vị tiền tệ:** Kíp Lào (₭ - LAK) định dạng chuẩn dấu chấm phân cách hàng nghìn (`1.000`, `10.000`, `100.000`, `1.000.000`)  
> **Ngôn ngữ hệ thống:** Tiếng Lào (ພາສາລາວ) kết hợp Tiếng Anh (English) và Tiếng Việt  

---

## MỤC LỤC
1. [Giới thiệu tổng quan hệ thống](#1-giới-thiệu-tổng-quan-hệ-thống)
2. [Sơ đồ kiến trúc & Quy trình vận hành](#2-sơ-đồ-kiến-trúc--quy-trình-vận-hành)
3. [Tổng hợp danh mục tất cả chức năng](#3-tổng-hợp-danh-mục-tất-cả-chức-năng)
   - [3.1 Phân hệ Bán hàng POS Terminal (`/pos`)](#31-phân-hệ-bán-hàng-pos-terminal-pos)
   - [3.2 Phân hệ Quản lý Ca làm việc (Shifts)](#32-phân-hệ-quản-lý-ca-làm-việc-shifts)
   - [3.3 Phân hệ Màn hình phụ Khách hàng (`/customer-display`)](#33-phân-hệ-màn-hình-phụ-khách-hàng-customer-display)
   - [3.4 Phân hệ Màn hình Barista KDS (`/pos` Tab KDS)](#34-phân-hệ-màn-hình-barista-kds-pos-tab-kds)
   - [3.5 Phân hệ Quản lý Sơ đồ Bàn (`/pos` Tab Bàn & `/settings`)](#35-phân-hệ-quản-lý-sơ-đồ-bàn)
   - [3.6 Phân hệ Thực đơn, Ma trận giá & Topping (`/products`)](#36-phân-hệ-thực-đơn-ma-trận-giá--topping-products)
   - [3.7 Phân hệ Quản lý Đơn hàng & Lịch sử (`/orders`)](#37-phân-hệ-quản-lý-đơn-hàng--lịch-sử-orders)
   - [3.8 Phân hệ Báo cáo & Thống kê Doanh thu (`/dashboard`)](#38-phân-hệ-báo-cáo--thống-kê-doanh-thu-dashboard)
   - [3.9 Phân hệ Cài đặt Hệ thống & Thiết bị Phần cứng (`/settings`)](#39-phân-hệ-cài-đặt-hệ-thống--thiết-bị-phần-cứng-settings)
   - [3.10 Phân hệ Xác thực & Phân quyền (`/login`)](#310-phân-hệ-xác-thực--phân-quyền-login)
4. [Hướng dẫn sử dụng chi tiết từng nghiệp vụ](#4-hướng-dẫn-sử-dụng-chi-tiết-từng-nghiệp-vụ)
   - [Quy trình 1: Bắt đầu ca - Mở ca bán hàng](#quy-trình-1-bắt-đầu-ca---mở-ca-bán-hàng)
   - [Quy trình 2: Tạo đơn món Đồ uống & Tùy biến công thức](#quy-trình-2-tạo-đơn-món-đồ-uống--tùy-biến-công-thức)
   - [Quy trình 3: Tạo đơn món Bánh ngọt & Đồ ăn](#quy-trình-3-tạo-đơn-món-bánh-ngọt--đồ-ăn)
   - [Quy trình 4: Chọn bàn, chuyển bàn hoặc mang về](#quy-trình-4-chọn-bàn-chuyển-bàn-hoặc-mang-về)
   - [Quy trình 5: Thanh toán & In ấn hóa đơn / Tem dán ly](#quy-trình-5-thanh-toán--in-ấn-hóa-đơn--tem-dán-ly)
   - [Quy trình 6: Barista tiếp nhận và hoàn thành đơn trên KDS](#quy-trình-6-barista-tiếp-nhận-và-hoàn-thành-đơn-trên-kds)
   - [Quy trình 7: Kết ca, kiểm kê tiền mù (Blind Count) & In Z-Report](#quy-trình-7-kết-ca-kiểm-kê-tiền-mù-blind-count--in-z-report)
   - [Quy trình 8: Thêm và thiết lập món mới trong Thực đơn](#quy-trình-8-thêm-và-thiết-lập-món-mới-trong-thực-đơn)
   - [Quy trình 9: Cấu hình Máy in Bill 80mm & Máy in tem 50x30mm](#quy-trình-9-cấu-hình-máy-in-bill-80mm--máy-in-tem-50x30mm)
5. [Xử lý sự cố thường gặp (FAQ & Troubleshooting)](#5-xử-lý-sự-cố-thường-gặp-faq--troubleshooting)

---

## 1. GIỚI THIỆU TỔNG QUAN HỆ THỐNG

**QuickOne Cafe & Bakery POS** là giải pháp phần mềm quản lý và bán hàng toàn diện chuyên biệt dành cho các quán Specialty Coffee, Tiệm Trà & Bakery hiện đại.

Hệ thống được thiết kế theo triết lý **Touch-First**, tối ưu hóa cho màn hình cảm ứng POS, máy tính bảng iPad/Android và điện thoại di động:
* **Tốc độ gọi món 1-chạm (Single-Tap)**: Thao tác chọn món và gửi pha chế dưới 3 giây.
* **Ma trận định giá sản phẩm (Pricing Matrix)**: Định cấu hình giá linh hoạt theo từng nhiệt độ (Nóng / Đá / Xay) và từng dung tích (Size S / M / L).
* **Quản lý tách biệt Đồ uống vs Bánh ngọt**: Đồ uống có đủ tùy biến (Đá, Ngọt, Size, Topping), Bánh ngọt có chế độ 1 giá phẳng và tùy chọn hâm nóng.
* **Hỗ trợ in ấn kép chuyên nghiệp**: Tự động in Hóa đơn nhiệt 80mm và in Tem dán ly 50x30mm cho Barista.
* **Màn hình phụ thời gian thực**: Đồng bộ giỏ hàng và mã QR OnePay động cho khách hàng.
* **Kiểm ca mù chống thất thoát (Blind Cash Close)**: Thu ngân kết ca kiểm tiền độc lập, hệ thống tự động đối chiếu chênh lệch.

---

## 2. SƠ ĐỒ KIẾN TRÚC & QUY TRÌNH VẬN HÀNH

```
+-----------------------------------------------------------------------------------+
|                                 QUẢN LÝ / CHỦ QUÁN                                |
|  - Cấu hình Thực đơn Ma trận giá (Hot/Iced/Frappe x S/M/L) & Topping             |
|  - Quản lý Danh mục (Beverage vs Bakery - Single Source of Truth)                 |
|  - Theo dõi Doanh thu, Báo cáo Ca (Z-Report), Lịch sử đơn hàng, Thiết bị         |
+------------------------------------------+----------------------------------------+
                                           |
                                           v
+------------------------------------------+----------------------------------------+
|                          THU NGÂN (POS TERMINAL)                                  |
|  1. Mở ca làm việc (Nhập tiền mặt đầu ca)                                         |
|  2. Chọn Bàn / Mang về (Takeaway)                                                 |
|  3. Chọn món -> Tùy chỉnh ly nước (Style, Size, Độ ngọt, Đá, Topping, Note)       |
|  4. Xác nhận Giỏ hàng (2-Row Stacked Card siêu gọn)                               |
|  5. Thanh toán: Tiền mặt (Numpad thông minh) / QR OnePay / Kết hợp (Mixed)        |
+-------------------+-----------------------------------+---------------------------+
                    |                                   |
         (Đồng bộ thời gian thực)             (In lệnh phần cứng)
                    |                                   |
                    v                                   v
+-------------------+-----------------+   +-------------+---------------------------+
|    MÀN HÌNH PHỤ KHÁCH HÀNG          |   |  MÁY IN NHIỆT & TEM                     |
|  - Xem giỏ hàng trực tiếp           |   |  - Bill thanh toán 80mm                 |
|  - Quét QR OnePay / LAPNet động     |   |  - Tem dán ly 50x30mm (từng ly)         |
+-------------------------------------+   +-----------------------------------------+
                    |
                    v (Gửi đơn tự động)
+-------------------+---------------------------------------------------------------+
|                      QUẦY PHA CHẾ (BARISTA KDS DISPLAY)                           |
|  - Hiển thị danh sách cốc nước theo thời gian thực (Real-time Supabase)          |
|  - Đồng hồ đếm thời gian pha chế theo màu sắc (Xanh -> Cam -> Đỏ cảnh báo)        |
|  - Hiển thị chi tiết: Kiểu pha, Size, Độ ngọt, Mức đá, Topping, Ghi chú           |
|  - Bấm 1 chạm: Đang làm -> Hoàn thành xong (Ready for Pickup)                    |
+-----------------------------------------------------------------------------------+
```

---

## 3. TỔNG HỢP DANH MỤC TẤT CẢ CHỨC NĂNG

### 3.1 Phân hệ Bán hàng POS Terminal (`/pos`)
* **Menu Danh mục (DrinkCatalogGrid)**:
  * Thanh cuộn ngang các danh mục sản phẩm kèm Icon minh họa sinh động.
  * Lọc nhanh danh mục: Tất cả, Cà phê, Trà, Đá xay, Bánh ngọt & Đồ ăn.
  * Ô tìm kiếm món tức thì theo tên tiếng Lào hoặc tiếng Anh.
* **Thẻ món (DrinkStudioCard)**:
  * Ảnh sản phẩm chất lượng cao, bo góc mềm mại, hiển thị giá từ (`ລາຄາເລີ່ມຕົ້ນ`).
  * Badge trạng thái hết hàng tạm thời (`86-ed / ໝົດຊົ່ວຄາວ`).
  * Nhấn vào món: Nếu là Đồ uống có tùy chọn -> Mở Modal tùy biến; nếu là món 1 giá hoặc bánh -> Thêm thẳng vào giỏ hàng siêu tốc.
* **Hộp thoại Tùy biến Ly nước (BaristaModifierModal)**:
  * **Cột trái - 3 lựa chọn cốt lõi**:
    1. `ຮູບແບບ (Style & Temp)`: ຮ້ອນ (Nóng) / ເຢັນ (Đá) / ປັ່ນ (Xay) - Tự động cập nhật giá tương ứng.
    2. `ຂະໜາດຈອກ (Cup Size)`: Size S / Size M / Size L (gọn gàng, đã loại bỏ số oz gây rối mắt).
    3. `ລະດັບຄວາມຫວານ (Sweetness)`: 0% (Không đường) / 25% / 50% / 100% (Mặc định) / 120% (Ngọt đậm).
  * **Cột phải - Topping & Ghi chú nhanh**:
    * Danh sách Topping đa dạng kèm giá (Trân châu, Thạch dừa, Kem phô mai, Sốt caramel, Thêm shot espresso...).
    * Các nút Tag bấm nhanh: `+ ນ້ຳກ້ອນໜ້ອຍ` (Ít đá), `+ ແຍກນ້ຳກ້ອນ` (Tách đá), `+ ກາເຟເຂັ້ມ` (Đậm cafe), `+ ກາເຟອ່ອນ` (Nhạt cafe), `+ ໃສ່ຖົງກັບບ້ານ` (Túi mang về), `+ ບໍ່ໃສ່ຫຼອດ` (Không ống hút), `+ ນົມໄຂມັນຕ່ຳ` (Sữa ít béo).
    * Ô nhập ghi chú riêng cho Barista.
  * Nút `ເພີ່ມໃສ່ອໍເດີ (Add to Cart)` hiển thị tổng tiền tức thì.
* **Giỏ hàng Order Ticket (CafeCartPanel & CafeCartItemRow)**:
  * Thiết kế thẻ 2 hàng xếp chồng siêu gọn gàng (tiết kiệm 40% chiều cao, nhường không gian cho danh sách dài).
  * **Hàng 1**: Thumbnail món + Tên món kèm Size đằng sau (Ví dụ: `ຊັອກໂກແລັດດາກເຂັ້ມຂຸ້ນ (M)`) ⟷ Thành tiền đậm nét + Icon thùng rác xóa 1 chạm.
  * **Hàng 2**: Đơn giá + Badges công thức (`ເຢັນ`, chỉ hiện độ ngọt khi khác 100%, lọc chống trùng lặp tag đá, Toppings `+...`, Note `"..."`) ⟷ Cụm nút Stepper tăng giảm `[ - 1 + ]`.
  * Đổi kiểu phục vụ: `ກິນຢູ່ນີ້ (Dine-in)` hoặc `ສັ່ງກັບບ້ານ (Takeaway)`.
  * Chọn bàn / Gán mã bàn linh hoạt.
  * Nút `ລຶບທັງໝົດ (Clear Cart)` dọn giỏ hàng có xác nhận.
  * Nút `ຊຳລະເງິນ (Checkout)` nổi bật với tổng tiền to rõ.

---

### 3.2 Phân hệ Quản lý Ca làm việc (Shifts)
* **ActiveShiftBadge**: Luôn hiển thị trạng thái ca hiện tại trên thanh công cụ POS (Tên nhân viên, giờ mở ca, trạng thái Xanh = Đang mở ca).
* **Mở ca (Open Shift Dialog)**:
  * Nhập số tiền mặt có sẵn trong ngăn kéo đầu ca (`ເງິນສົດຕົ້ນກະ`).
  * Khởi tạo phiên làm việc gắn liền với các đơn hàng phát sinh trong ca.
* **Đóng ca mù (Close Shift Blind Dialog)**:
  * Áp dụng nguyên tắc kiểm kê mù: Thu ngân tự đếm và nhập số tiền mặt thực tế trong ngăn kéo mà không nhìn thấy con số hệ thống tính toán trước, tránh gian lận.
  * Hệ thống tự động so sánh: Tiền đầu ca + Doanh thu tiền mặt - Tiền thực đếm = Chênh lệch (Thừa / Thiếu / Khớp 100%).
  * Ghi chú giải trình chênh lệch nếu có.
* **In báo cáo kết ca (Shift Z-Report 80mm)**:
  * Tự động xuất phiếu Z-Report ra máy in nhiệt 80mm tổng kết: Doanh thu tiền mặt, Doanh thu chuyển khoản QR, Số lượng đơn, Tổng ly đã bán, Tiền mặt bàn giao.

---

### 3.3 Phân hệ Màn hình phụ Khách hàng (`/customer-display`)
* Kết nối trực tiếp với màn hình POS qua BroadcastChannel và Supabase Realtime.
* **Chế độ chờ (Idle Mode)**: Hiển thị hình ảnh thương hiệu, lời chào quán cafe, video/banner khuyến mãi.
* **Chế độ gọi món (Ordering Mode)**: Hiển thị chi tiết từng món đang thêm vào giỏ hàng theo thời gian thực (Tên món, Size, Đơn giá, Topping, Tổng cộng).
* **Chế độ thanh toán (Payment Mode)**:
  * Hiển thị mã QR OnePay động (tiêu chuẩn ngân hàng Lào LAPNet / BCEL One) với số tiền chính xác từng Kíp.
  * Khách chỉ cần mở app ngân hàng quét mã thanh toán không cần nhập tiền thủ công.
* **Chế độ hoàn tất (Success Screen)**: Cảm ơn quý khách, hiển thị số hóa đơn và số tiền đã thanh toán.

---

### 3.4 Phân hệ Màn hình Barista KDS (`/pos` Tab KDS)
* Màn hình chuyên dụng cho quầy pha chế, chạy độc lập trên máy tính bảng hoặc màn hình treo tường.
* **Hiển thị theo thẻ ly nước (Cup Card)**:
  * Tên món, Size, Kiểu pha (Nóng/Đá/Xay).
  * Công thức độ ngọt, Toppings đính kèm, ghi chú đặc biệt.
  * Vị trí phục vụ: Số bàn hoặc Mang về.
* **Đồng hồ đếm giờ pha chế thông minh**:
  * Dưới 5 phút: Màu xanh lá (Đúng tiến độ).
  * Từ 5 - 10 phút: Màu vàng/cam (Cần đẩy nhanh).
  * Trên 10 phút: Màu đỏ chớp nháy cảnh báo đơn trễ.
* **Thao tác 1 chạm**: Bấm chuyển trạng thái từ `ກຳລັງຊົງ (Brewing)` sang `ສຳເລັດ (Completed)`.
* Tùy chọn in lại tem dán ly ngay từ màn hình KDS nếu tem bị mờ hoặc rách.

---

### 3.5 Phân hệ Quản lý Sơ đồ Bàn
* **Giao diện sơ đồ bàn trực quan (`TableMapTab`)**:
  * Phân chia theo khu vực: Trong nhà (Indoor), Sân vườn / Ngoài trời (Outdoor), Tầng 2 (Floor 2), VIP...
  * Trạng thái bàn nhận diện bằng màu sắc:
    * Xanh lá: Bàn trống (Available).
    * Đỏ / Hổ phách: Bàn đang có khách (Occupied) - kèm tổng tiền và thời gian khách ngồi.
    * Xám: Bàn đang bảo trì.
* **Thao tác nghiệp vụ bàn**:
  * Mở bàn gọi món.
  * Chuyển đơn từ bàn này sang bàn khác khi khách đổi chỗ.
  * Gộp bàn khi khách đi nhóm đông.
  * Quản lý số ghế ngồi tối đa trên mỗi bàn.

---

### 3.6 Phân hệ Thực đơn, Ma trận giá & Topping (`/products`)
* **Tab 1: Quản lý Món ăn & Đồ uống (Menu Items)**:
  * **Ma trận giá đồ uống (Pricing Matrix)**:
    * Cấu hình độc lập 3 nhiệt độ: Nóng (Hot), Đá (Iced), Xay (Frappe).
    * Với mỗi nhiệt độ, cấu hình bật/tắt và gán giá riêng cho từng Size (S / M / L).
    * Cho phép tạo món chỉ có Nóng (như Espresso), chỉ có Đá/Xay, hoặc đầy đủ cả 3 kiểu.
  * **Chế độ Bánh & Đồ ăn (Bakery & Food)**:
    * Định dạng 1 giá cố định (Single Flat Price).
    * Bỏ qua các bước chọn Size và mức đá.
    * Tùy chọn hỗ trợ hâm nóng (`allows_reheat`).
  * Bật/tắt nhanh trạng thái hết hàng tạm thời (`86-ed`) chỉ với 1 click ngay trên bảng.
  * Nhập giá tiền Kíp tự động định dạng dấu chấm (`KipCurrencyInput`).
  * **Hộp thoại Thêm/Sửa sản phẩm với Chế độ tải ảnh thông minh (Lazy Upload)**:
    * Chuyển đổi linh hoạt: `[ 📁 ອັບໂຫລດໄຟລ໌ ]` (chọn ảnh từ máy tính/điện thoại không giới hạn dung lượng) và `[ 🔗 ປ້ອນລິ້ງ URL ]` (nhập link mạng).
    * Khung preview tỉ lệ chuẩn 1:1, không bị méo/zoom xén góc.
    * **Cơ chế tối ưu lưu trữ**: Khi chọn ảnh, xem trước tức thì bằng local preview nhưng **chưa tải lên Supabase**. Chỉ khi bấm **"ບັນທຶກສິນຄ້າ" (Save)** thì ảnh mới được nén tự động về WebP và lưu vào Supabase bucket `menu-items`. Nếu bấm **Hủy (Cancel)**, ảnh không tải lên, ngăn ngừa 100% file rác tồn đọng.
* **Tab 2: Quản lý Topping**:
  * Thêm, sửa, xóa các loại Topping (Trân châu đen, Trân châu hoàng kim, Thạch dừa, Sốt caramel, Kem Cheese...).
  * Gán đơn giá cho từng loại Topping.
  * Bật/tắt trạng thái còn/hết topping tức thì.
* **Tab 3: Quản lý Danh mục (Categories)**:
  * Chuẩn hóa **Single Source of Truth** với trường `item_type`:
    * `beverage`: Dành cho nhóm đồ uống.
    * `bakery`: Dành cho nhóm bánh ngọt & đồ ăn.
  * Bộ lọc danh mục thông minh: Khi thêm sản phẩm chọn loại Bánh thì dropdown chỉ hiển thị các danh mục bánh, không bao giờ lẫn đồ uống.
  * Chọn icon đại diện (Cà phê, Trà, Bánh, Kem, Dao nĩa...).
  * Sắp xếp thứ tự hiển thị ưu tiên trên màn hình POS (`sort_order`).

---

### 3.7 Phân hệ Quản lý Đơn hàng & Lịch sử (`/orders`)
* Bảng danh sách tất cả hóa đơn đã lập trên toàn hệ thống.
* Bộ lọc đa chiều:
  * Theo mốc thời gian: Hôm nay, Hôm qua, 7 ngày qua, 30 ngày qua, Tùy chọn khoảng ngày.
  * Theo trạng thái: Đã hoàn tất (Completed), Đang chờ (Pending), Đã hủy (Cancelled).
  * Theo phương thức thanh toán: Tiền mặt (Cash), Chuyển khoản (Lao QR), Kết hợp (Mixed).
  * Tìm kiếm theo mã hóa đơn (Order Number) hoặc tên nhân viên tạo đơn.
* Xem chi tiết từng món trong hóa đơn kèm công thức pha chế.
* Nút **In lại hóa đơn (Reprint Receipt 80mm)** bất cứ lúc nào.

---

### 3.8 Phân hệ Báo cáo & Thống kê Doanh thu (`/dashboard`)
* **Các thẻ chỉ số KPI quan trọng**:
  * Tổng doanh thu thực tế (Total Revenue).
  * Tổng số đơn hàng thành công (Total Orders).
  * Giá trị trung bình trên mỗi đơn (Average Order Value - AOV).
* **Biểu đồ tỷ trọng thanh toán**:
  * Doanh thu Tiền mặt vs Doanh thu Chuyển khoản QR OnePay.
* **Bảng xếp hạng Top món bán chạy nhất**:
  * Danh sách Top 10 món có doanh số và số lượng ly bán ra cao nhất trong kỳ.
* Toàn bộ dữ liệu truy vấn trực tiếp thời gian thực từ Supabase.

---

### 3.9 Phân hệ Cài đặt Hệ thống & Thiết bị Phần cứng (`/settings`)
* **Cài đặt Thông tin Quán (Store Profile)**:
  * Tên quán cafe, Slogan thương hiệu, Địa chỉ, Số điện thoại liên hệ, Mã số thuế VAT (nếu có).
  * Lời cảm ơn in dưới chân hóa đơn.
* **Cài đặt Máy in Hóa đơn 80mm (Receipt Thermal Printer)**:
  * Giao thức kết nối: USB POS, Cổng mạng LAN IP/Ethernet (TCP port 9100), Bluetooth.
  * Ngôn ngữ lệnh máy in chuẩn ESC/POS.
  * Tùy chọn tự động cắt giấy (Auto-cutter) và kích mở ngăn kéo đựng tiền (RJ11 Cash Drawer Kick).
* **Cài đặt Máy in Tem Dán Ly 50x30mm (Cup Sticker Printer)**:
  * In nhãn dán nhiệt kích thước chuẩn quốc tế 50mm x 30mm.
  * Thể hiện đầy đủ: Số thứ tự ly/tổng đơn, Tên món, Size, Kiểu pha, Độ ngọt, Đá, Topping, Ghi chú, Giờ đặt.
* **Quản lý Nhân viên & Mã PIN**:
  * Danh sách nhân viên thu ngân và barista.
  * Phân quyền vai trò: Chủ quán (Owner), Quản lý (Manager), Thu ngân (Cashier).
  * Đặt mã PIN 4-6 số bảo mật để đăng nhập nhanh tại quầy.
* **Quản lý Bộ nhớ & Tự động Dọn dẹp Ảnh (Media Storage & Grace Period)**:
  * **Cơ chế Grace Period 7 ngày**: Khi thay ảnh món hoặc xóa món, ảnh cũ không bị xóa tức thì mà đưa vào hàng đợi bảo lưu 7 ngày để phòng ngừa đổi ý hoặc hoàn tác.
  * **Tự động dọn ngầm (Auto-cleanup Job)**: Hệ thống tự động quét và xóa sạch các file rác đã quá hạn 7 ngày mỗi khi mở ứng dụng.
  * **Thống kê trực quan tại `/settings` Tab 4**: Thể hiện tổng số file trên Supabase bucket `menu-items`, số file đang dùng, số file trong thời gian ân hạn, số file quá hạn.
  * **Hành động 1-chạm**: Quét bộ nhớ (`Scan Storage`), Dọn dẹp file hết hạn (`Purge Expired`), hoặc Xóa sạch toàn bộ file rác tức thì (`Force Purge All Unused`).

---

### 3.10 Phân hệ Xác thực & Phân quyền (`/login`)
* Hỗ trợ 2 phương thức xác thực:
  1. Đăng nhập bằng Email & Mật khẩu (Dành cho Quản trị viên/Chủ quán).
  2. Đăng nhập nhanh bằng Mã PIN cảm ứng (Quick PIN Pad) cho nhân viên thu ngân đầu ca.
* Bảo vệ toàn bộ các trang nội bộ qua `AuthGuard`.

---

## 4. HƯỚNG DẪN SỬ DỤNG CHI TIẾT TỪNG NGHIỆP VỤ

### Quy trình 1: Bắt đầu ca - Mở ca bán hàng
1. Nhân viên truy cập vào màn hình POS (`/pos`).
2. Nếu hệ thống chưa có ca mở, màn hình sẽ hiển thị hộp thoại **"ເປີດກະຂາຍ (Open Shift)"**.
3. Thu ngân đếm số tiền mặt lẻ trong két tiền lúc nhận ca (ví dụ: `500.000 ₭`).
4. Nhập số tiền vào ô **"ເງິນສົດຕົ້ນກະ (Starting Cash)"** rồi nhấn nút **"ຢືນຢັນເປີດກະ (Confirm Open Shift)"**.
5. Thanh tiêu đề POS sẽ xuất hiện huy hiệu Xanh: tên nhân viên và ca đang hoạt động. Bắt đầu nhận khách.

---

### Quy trình 2: Tạo đơn món Đồ uống & Tùy biến công thức
1. Tại màn hình bán hàng, chọn danh mục đồ uống (ví dụ: `ກາເຟສົດ` hoặc `ຊານົມ`).
2. Chạm vào thẻ món đồ uống cần gọi (ví dụ: *ຄາຣາເມວ ມັກຄີອາໂຕ້*).
3. Hộp thoại **Barista Modifier Modal** sẽ xuất hiện:
   * **Bước 1 (ຮູບແບບ)**: Chọn `ຮ້ອນ (Nóng)` / `ເຢັນ (Đá)` / `ປັ່ນ (Xay)`.
   * **Bước 2 (ຂະໜາດຈອກ)**: Chọn `Size S` / `Size M` / `Size L` (giá tự động nhảy theo size).
   * **Bước 3 (ລະດັບຄວາມຫວານ)**: Chọn độ ngọt mong muốn (`0%`, `25%`, `50%`, `100%`, `120%`).
   * **Bước 4 (Topping)**: Tích chọn các loại Topping khách yêu cầu thêm (mỗi topping sẽ cộng thêm tiền).
   * **Bước 5 (Ghi chú)**: Chạm vào các tag nhanh nếu khách có yêu cầu riêng:
     * Muốn ít đá -> Chạm `+ ນ້ຳກ້ອນໜ້ອຍ`.
     * Muốn để đá riêng -> Chạm `+ ແຍກນ້ຳກ້ອນ`.
     * Muốn nhiều cafe -> Chạm `+ ກາເຟເຂັ້ມ`.
4. Nhấn nút màu nâu đậm **"ເພີ່ມໃສ່ອໍເດີ (Add to Cart)"** ở góc dưới. Món sẽ lập tức được thêm vào vé giỏ hàng bên phải.

---

### Quy trình 3: Tạo đơn món Bánh ngọt & Đồ ăn
1. Chạm vào danh mục Bánh (`ເບເກີຣີ & ເຂົ້າໜົມ` hoặc `ເຄັກ`).
2. Chạm vào món bánh muốn gọi (ví dụ: *ຄົວຊອງອັລມອນ*).
3. Do bánh là sản phẩm 1 giá cố định, món sẽ **ngay lập tức được đưa vào giỏ hàng** mà không cần qua bước chọn size/đá phức tạp.
4. Nếu khách muốn hâm nóng bánh: Thu ngân chạm vào dòng món bánh trong giỏ hàng để ghi chú `"ອຸ່ນຮ້ອນ (Reheat)"`.

---

### Quy trình 4: Chọn bàn, chuyển bàn hoặc mang về
1. Mặc định đơn hàng là **`ກິນຢູ່ນີ້ (Dine-in)`**.
2. Để gán bàn cho khách: Chạm vào nút **"ເລືອກໂຕະ (Select Table)"** trên đỉnh giỏ hàng -> Chọn số bàn trên sơ đồ (ví dụ: bàn `T01`).
3. Nếu khách mua mang đi: Chạm vào nút chuyển đổi sang **`ສັ່ງກັບບ້ານ (Takeaway)`**.
4. Để chuyển bàn khi khách đổi vị trí: Nhấp vào số bàn hiện tại -> Chọn bàn mới cần chuyển đến -> Bấm xác nhận.

---

### Quy trình 5: Thanh toán & In ấn hóa đơn / Tem dán ly
1. Sau khi khách gọi xong món, kiểm tra lại số tiền và nhấn nút **"ຊຳລະເງິນ (Checkout)"**.
2. Hộp thoại thanh toán **CafePaymentModal** mở ra với 3 phương thức:
   * **Cách A - Tiền mặt (`ເງິນສົດ - Cash`)**:
     * Hệ thống tự động gợi ý các mệnh giá tiền mặt chẵn thông minh (ví dụ đơn `35.000 ₭` sẽ gợi ý các nút: `35.000`, `50.000`, `100.000`, `500.000`).
     * Thu ngân chỉ cần bấm 1 chạm vào mệnh giá khách đưa, hoặc bấm bàn phím số Numpad.
     * Màn hình lập tức hiển thị số **Tiền thối lại cho khách (`ເງິນທອນ`)** màu xanh rõ ràng.
   * **Cách B - Chuyển khoản QR Ngân hàng (`LAO QR - OnePay / BCEL One`)**:
     * Màn hình hiển thị mã QR OnePay LAPNet chuẩn xác theo số tiền phải trả.
     * Khách hàng quét mã trên màn hình phụ (hoặc màn hình thu ngân).
     * Khi app ngân hàng báo thành công, thu ngân bấm xác nhận.
   * **Cách C - Thanh toán kết hợp (`Mixed`)**:
     * Khách trả một phần tiền mặt và một phần chuyển khoản QR (ví dụ đơn 100k: trả 40k tiền mặt, 60k quét QR).
3. Nhấn **"ຢືນຢັນການຊຳລະ & ພິມບິນ (Confirm & Print)"**:
   * Hệ thống tự động đẩy lệnh ra máy in nhiệt 80mm in hóa đơn giao khách.
   * Đồng thời tự động đẩy lệnh ra máy in tem nhãn in từng con tem 50x30mm cho mỗi ly nước.
   * Dữ liệu đơn hàng lập tức được đồng bộ sang màn hình Barista KDS.

---

### Quy trình 6: Barista tiếp nhận và hoàn thành đơn trên KDS
1. Tại quầy pha chế, Barista theo dõi màn hình `/pos` ở chế độ **Tab Barista KDS**.
2. Khi có đơn mới từ thu ngân, thẻ đơn hàng sẽ tự động hiện lên với âm thanh thông báo.
3. Barista nhìn vào nhãn công thức:
   * Size ly: S / M / L.
   * Nhiệt độ: Nóng / Đá / Xay.
   * Độ ngọt: Ngọt bình thường (ẩn) hoặc Ngọt 50%, Ngọt 0%.
   * Topping và ghi chú: Ít đá, Tách đá, v.v.
4. Lấy tem dán lên ly nước tương ứng.
5. Khi pha chế xong: Barista chạm vào thẻ ly nước trên màn hình để chuyển sang trạng thái **"ສຳເລັດ (Done)"**, báo cho bộ phận phục vụ đem ra cho khách.

---

### Quy trình 7: Kết ca, kiểm kê tiền mù (Blind Count) & In Z-Report
1. Khi hết ca làm việc, thu ngân bấm vào huy hiệu ca trên thanh công cụ POS -> Chọn **"ປິດກະຂາຍ (Close Shift)"**.
2. **Thực hiện kiểm đếm tiền mặt thực tế**:
   * Nhân viên đếm toàn bộ tiền mặt đang có trong két tiền (không được biết số liệu hệ thống đang tính là bao nhiêu).
   * Nhập số tiền thực đếm vào ô **"ເງິນສົດຕົວຈິງໃນລິ້ນຊັກ (Actual Cash Count)"**.
3. Bấm **"ກວດສອບ & ປິດກະ (Verify & Close Shift)"**:
   * Hệ thống sẽ hiển thị bảng đối soát:
     * Tiền đầu ca: + A
     * Doanh thu tiền mặt trong ca: + B
     * Tổng lý thuyết phải có: = (A + B)
     * Tiền thực tế nhân viên đếm: = C
     * **Chênh lệch (Difference)**: `C - (A + B)` (Khớp 100%, hoặc Thừa/Thiếu bao nhiêu Kíp).
4. Nhập ghi chú giải trình nếu có chênh lệch.
5. Nhấn **"ຢືນຢັນປິດກະ & ພິມລາຍງານ Z (Confirm & Print Z-Report)"**:
   * Máy in nhiệt sẽ in phiếu **Z-Report 80mm** chi tiết để nhân viên ký tên và nộp kèm tiền mặt cho quản lý.

---

### Quy trình 8: Thêm và thiết lập món mới trong Thực đơn
1. Truy cập vào trang Quản lý Thực đơn (`/products`).
2. Nhấn nút **"+ ເພີ່ມເມນູໃໝ່ (New Menu Item)"**.
3. **Nếu là Đồ uống**:
   * Chọn loại sản phẩm: **`ເຄື່ອງດື່ມ (Beverage)`**.
   * Ô danh mục sẽ **chỉ lọc các danh mục đồ uống** (Cà phê, Trà, Đá xay...). Chọn danh mục phù hợp.
   * Nhập tên tiếng Lào (bắt buộc) và tên tiếng Anh.
   * Dán đường dẫn ảnh món (Image URL).
   * Tại cột phải **"ຕາຕະລາງກຳນົດລາຄາ (Pricing Matrix)"**:
     * Bật/tắt các kiểu pha muốn bán (Nóng / Đá / Xay).
     * Nhập giá cho từng Size (S / M / L). Ví dụ: Nóng Size S `22.000 ₭`, Nóng Size M `25.000 ₭`, Đá Size M `30.000 ₭`, Đá Size L `38.000 ₭`.
4. **Nếu là Bánh ngọt / Đồ ăn**:
   * Chọn loại sản phẩm: **`ເບເກີຣີ / 1 ລາຄາ (Bakery)`**.
   * Ô danh mục sẽ **tự động chỉ lọc các danh mục bánh** (Bánh ngọt, Bánh mì, Dessert...).
   * Nhập tên món và dán ảnh.
   * Nhập đơn giá bán cố định (ví dụ: `32.000 ₭`).
   * Tích chọn có cho phép hâm nóng không (`ອຸ່ນຮ້ອນໄດ້`).
5. Nhấn **"ບັນທຶກສິນຄ້າ (Save Item)"**. Món mới sẽ lập tức xuất hiện trên màn hình POS.

---

### Quy trình 9: Cấu hình Máy in Bill 80mm & Máy in tem 50x30mm
1. Truy cập vào trang **Cài đặt (`/settings`)** -> Chọn tab **"ອຸປະກອນ & ເຄື່ອງພິມ (Hardware & Printers)"**.
2. **Cấu hình Máy in Hóa đơn 80mm**:
   * Chọn loại kết nối: `USB` hoặc `Mạng LAN (TCP/IP)`.
   * Nếu dùng mạng LAN: Nhập địa chỉ IP máy in (ví dụ: `192.168.1.200`) và cổng (mặc định `9100`).
   * Bật tùy chọn: Tự động in khi hoàn tất đơn (`Auto Print Bill`).
   * Bật tùy chọn: Kích mở két tiền (`Cash Drawer Kick`).
   * Bấm nút **"ພິມທົດສອບ 80mm (Test Print)"** để kiểm tra máy in hoạt động.
3. **Cấu hình Máy in Tem dán ly 50x30mm**:
   * Chọn kết nối máy in tem barcode/label.
   * Bật tùy chọn: Tự động in tem khi thanh toán (`Auto Print Cup Sticker`).
   * Bấm nút **"ພິມທົດສອບສະຕິກເກີ 50x30mm (Test Sticker)"**.
4. Bấm **"ບັນທຶກການຕັ້ງຄ່າ (Save Settings)"**.

---

## 5. XỬ LÝ SỰ CỐ THƯỜNG GẶP (FAQ & TROUBLESHOOTING)

### ❓ 1. Máy in nhiệt không ra bill sau khi bấm thanh toán?
* **Nguyên nhân**: Dây cáp USB lỏng, máy in hết giấy nhiệt, sai địa chỉ IP máy in LAN, hoặc trình duyệt chặn pop-up in.
* **Cách khắc phục**:
  1. Kiểm tra đèn nguồn máy in (đèn xanh sáng cố định, không nháy đỏ Error).
  2. Kiểm tra cuộn giấy nhiệt còn không, lắp đúng chiều giấy.
  3. Vào `/settings` -> Bấm nút **"ພິມທົດສອບ"**. Nếu không ra bill, kiểm tra lại địa chỉ IP mạng nội bộ của máy in.
  4. Nếu in qua trình duyệt web: Đảm bảo đã bật quyền cho phép Pop-up và Tự động in trong cài đặt Chrome.

### ❓ 2. Khách chuyển tiền QR OnePay thành công nhưng tài khoản quán chưa nhận được tin nhắn?
* **Cách xử lý**:
  1. Đề nghị khách cho xem màn hình **Biên lai chuyển khoản thành công** trên app BCEL One / ngân hàng.
  2. Đối chiếu: Số tiền chuyển phải khớp đúng từng Kíp với hóa đơn, tên tài khoản nhận đúng tên quán cafe, và thời gian chuyển khoản trong vòng vài phút gần nhất.
  3. Sau khi xác minh đúng biên lai, thu ngân bấm hoàn tất đơn.

### ❓ 3. Lỗi trùng lặp mã đơn hàng (`orders_order_number_key`)?
* **Đã khắc phục hoàn toàn ở phiên bản 2.0**: Hệ thống đã nâng cấp cơ chế sinh mã đơn hàng độc bản `generateUniqueOrderNumber` theo chuẩn thời gian thực địa phương kết hợp cơ chế tự động thử lại (Auto-retry), đảm bảo không bao giờ bị đụng mã đơn ngay cả khi nhiều thu ngân chốt đơn cùng một giây.

### ❓ 4. Tại sao một số món nước không hiển thị mức đá trong giỏ hàng?
* **Thiết kế chuẩn hóa mới**: Nhằm giúp tem dán ly và màn hình pha chế KDS tinh gọn nhất, các món uống có mức đá mặc định thông thường sẽ được ẩn đi. Hệ thống **chỉ hiển thị badge khi có yêu cầu đặc biệt** như `+ ນ້ຳກ້ອນໜ້ອຍ` (Ít đá) hoặc `+ ແຍກນ້ຳກ້ອນ` (Tách đá).

### ❓ 5. Khi kiểm ca bị chênh lệch tiền mặt (Thừa / Thiếu)?
* **Cách xử lý**:
  1. Kiểm tra lại kỹ các ngăn tiền lẻ và hóa đơn giấy đã chi ra trong ca (nếu có chi tiền ngoài).
  2. Kiểm tra xem có đơn nào khách trả QR OnePay nhưng thu ngân bấm nhầm thành Tiền mặt hay không (xem lại lịch sử trong `/orders`).
  3. Ghi rõ lý do vào ô Ghi chú giải trình trước khi bấm xác nhận kết ca.

---

*Tài liệu được biên soạn và bảo trì bởi Đội ngũ Kỹ thuật QuickOne POS.*  
*Mọi thắc mắc kỹ thuật vui lòng liên hệ Bộ phận Hỗ trợ Hệ thống.*
