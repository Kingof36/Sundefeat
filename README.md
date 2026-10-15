# Tài Xỉu Mini Game

Game Tài Xỉu chạy hoàn toàn trên trình duyệt, dùng **điểm ảo**. Người chơi bắt đầu với 100.000 điểm; mỗi phiên tự lắc 3 viên xúc xắc sau 30 giây. Người chơi đặt cược trong thời gian đếm ngược; thắng nhận tổng tiền cược × 1,98 (đã gồm tiền cược). Không có nạp/rút tiền, thanh toán hoặc phần thưởng tiền thật.

## Chạy thử trên máy
Mở `index.html` bằng trình duyệt. Điểm và số phiên được lưu trong `localStorage` của trình duyệt hiện tại. Cược bị khóa sau khi xác nhận và kết quả được tự động trả sau khi lắc.

## Đăng lên GitHub Pages
1. Tạo repository mới trên GitHub.
2. Tải lên `index.html`, `style.css`, `app.js` và `README.md`.
3. Vào **Settings → Pages**.
4. Ở **Build and deployment**, chọn **Deploy from a branch**.
5. Chọn branch `main`, folder `/ (root)`, rồi nhấn **Save**.
6. Đợi GitHub tạo đường dẫn trang web trong mục Pages.

## Đăng lên Firebase Hosting
Cài Node.js và Firebase CLI trước:
```bash
npm install -g firebase-tools
firebase login
```
Trong thư mục dự án:
```bash
firebase init hosting
```
Chọn project Firebase của bạn, chọn thư mục public là `.` (dấu chấm), cấu hình dạng single-page app: `No`, không ghi đè `index.html`.
Sau đó triển khai:
```bash
firebase deploy --only hosting
```

Có thể dùng `firebase.json` đã kèm. Nếu Firebase CLI yêu cầu xác nhận cấu hình, hãy kiểm tra thư mục public là `.`.

## Lưu ý
- Đây là bản demo front-end; điểm chỉ lưu trên thiết bị/trình duyệt hiện tại, không đồng bộ giữa người dùng.
- Kết quả được tạo ở phía trình duyệt, không phải hệ thống cá cược có thể kiểm chứng độc lập.
- Không dùng bản demo này cho tiền thật hoặc để giữ số dư có giá trị.