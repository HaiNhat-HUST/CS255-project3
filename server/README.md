**Giải thích cơ chế bảo mật chia sẻ file và quản lý khóa trong bài báo:**

### 1. **Các thành phần chính:**
- **Data Owner (Chủ sở hữu dữ liệu):** Người tải tệp lên đám mây và kiểm soát quyền truy cập.
- **Data Users (Người dùng dữ liệu):** Người được cấp quyền truy cập tệp thông qua TTP.
- **Trusted Third Party (TTP):** Đóng vai trò trung tâm trong quản lý khóa, mã hóa/giải mã, và kiểm soát truy cập.
- **Cloud Storage (Lưu trữ đám mây):** Lưu trữ tệp đã được mã hóa.

### 2. **Quy trình hoạt động:**
#### a. **Tải tệp lên đám mây:**
1. **Đăng ký và xác thực:** Chủ sở hữu đăng ký với TTP và thiết lập danh sách người dùng cùng quyền truy cập.
2. **Tạo khóa:** TTP sử dụng mã hóa bất đối xứng (ví dụ: RSA) để tạo cặp khóa công khai (\(K_{pu}\)) và riêng tư (\(K_{pr}\)).
3. **Mã hóa tệp:** Tệp (\(F\)) được mã hóa bằng khóa riêng (\(K_{pr}\)), tạo ra tệp mã hóa (\(F_{en}\)).
4. **Phân chia khóa công khai:** \(K_{pu}\) được chia thành hai phần:
   - **\(K_o\):** Gửi cho chủ sở hữu.
   - **\(K_{ttp}\):** Lưu trữ tại TTP.
5. **Xóa khóa riêng:** TTP xóa \(K_{pr}\) và \(K_{pu}\) sau khi mã hóa để tránh rò rỉ.

#### b. **Truy cập tệp:**
1. **Yêu cầu truy cập:** Người dùng gửi yêu cầu kèm \(K_o\) và File ID (\(F_{ID}\)) đến TTP.
2. **Xác thực quyền:** TTP kiểm tra danh sách người dùng (\(U_{list}\)) và quyền truy cập (\(U_{APL}\)).
3. **Tái tạo khóa công khai:** TTP kết hợp \(K_o\) và \(K_{ttp}\) để tạo lại \(K_{pu}\).
4. **Giải mã tệp:** Tải \(F_{en}\) từ đám mây, giải mã bằng \(K_{pu}\), và gửi tệp đã giải mã cho người dùng.
5. **Xóa khóa tạm thời:** TTP xóa \(K_{pu}\) sau khi hoàn tất để đảm bảo an toàn.

### 3. **Đảm bảo bảo mật:**
- **Tính bí mật:** Dữ liệu được mã hóa bằng khóa riêng (\(K_{pr}\)), chỉ giải mã được khi có đủ hai phần của \(K_{pu}\).
- **Toàn vẹn:** TTP kiểm soát quyền truy cập chặt chẽ thông qua danh sách người dùng và ACL (Access Control List).
- **Chống tấn công nội bộ:** TTP đóng vai trò trung gian tin cậy, ngăn chặn truy cập trái phép từ cả người dùng lẫn nhà cung cấp đám mây.

### 4. **Quản lý khóa động:**
- **Thêm/Xóa người dùng:** Chủ sở hữu cập nhật \(U_{APL}\) trên TTP. Người dùng mới nhận \(K_o\) từ chủ sở hữu để đăng ký.
- **Khôi phục khóa:** Khóa riêng (\(K_{pr}\)) bị xóa vĩnh viễn, nên việc khôi phục dữ liệu phụ thuộc vào việc lưu trữ an toàn của \(K_o\) và \(K_{ttp}\).

### 5. **Hiệu suất và lựa chọn thuật toán:**
- **RSA:** Hiệu quả với tệp nhỏ (10KB), thời gian mã hóa/giải mã nhanh.
- **ElGamal và Paillier:** Phù hợp với tệp lớn (hàng trăm MB), tốn nhiều tài nguyên hơn nhưng đảm bảo tốc độ ổn định.
- **Tối ưu hóa:** Lựa chọn thuật toán dựa trên kích thước tệp và yêu cầu bảo mật.

### 6. **Hạn chế và cải tiến tiềm năng:**
- **Rủi ro phân phối khóa:** Nếu \(K_o\) hoặc \(K_{ttp}\) bị đánh cắp, hệ thống có thể bị xâm nhập. Giải pháp: Sử dụng cơ chế xác thực đa yếu tố cho việc chia sẻ khóa.
- **Khôi phục dữ liệu:** Không có cơ chế khôi phục nếu mất cả \(K_o\) và \(K_{ttp}\). Cần thêm lớp sao lưu khóa dự phòng.

### Kết luận:
Cơ chế này đảm bảo an toàn dữ liệu thông qua phân quyền chặt chẽ, mã hóa bất đối xứng và quản lý khóa tập trung qua TTP. Tuy nhiên, cần cân nhắc các biện pháp bổ sung để tăng cường bảo mật phân phối khóa và khả năng phục hồi dữ liệu.
