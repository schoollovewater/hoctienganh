# Daily English: Giao tiếp & Từ vựng Kiểm thử Ô tô 🚗💬

Ứng dụng web tiến bộ (PWA) học tiếng Anh cá nhân thiết kế chuẩn cho **iPhone**, tập trung vào 2 trụ cột:
1. **Từ vựng ôn ngắt quãng (SRS SM-2)**: Giao tiếp công sở & thuật ngữ kiểm thử tự động ô tô (CANoe/CAPL, ECU-TEST, dSPACE HIL, Python/Robot, CAN/UDS, ISO 26262/ASPICE).
2. **Mẫu câu giao tiếp & Shadowing**: Luyện nói theo tình huống thực tế (Standup, báo lỗi, họp, email...) theo 3 bước: **Nghe mẫu 🔊 → Ghi âm 🎙️ → So sánh ▶️**.

---

## 📱 1. Mở thử ngay trên iPhone (cùng mạng Wi-Fi)

1. Máy tính đang chạy server tại cổng 5173:
   ```bash
   npm run dev
   ```
2. Trên iPhone, kết nối **cùng mạng Wi-Fi** với máy tính, mở trình duyệt **Safari** và truy cập:
   ```
   http://192.168.102.10:5173/
   ```
   *(Nếu đổi mạng Wi-Fi khác, chạy lệnh `ipconfig` trên Windows để lấy IP mới)*.

---

## 📲 2. Cách cài lên Màn hình chính iPhone (như App gốc)

1. Mở link trên bằng **Safari**.
2. Bấm nút **Chia sẻ** (biểu tượng hình vuông có mũi tên hướng lên ở dưới cùng Safari).
3. Cuộn xuống chọn **Thêm vào MH chính** (Add to Home Screen).
4. Bấm **Thêm** ở góc trên bên phải.
5. Biểu tượng **Daily English** sẽ xuất hiện trên màn hình chính của iPhone. App sẽ chạy toàn màn hình (không có thanh địa chỉ Safari) và hoạt động được cả khi không có mạng.

---

## 🌐 3. Cách đưa lên mạng vĩnh viễn (Deploy miễn phí)

Để dùng ở bất cứ đâu bằng 4G/5G mà không cần mở máy tính:

### Cách A: Vercel (Khuyên dùng - Nhanh nhất)
1. Đăng ký tài khoản miễn phí tại [vercel.com](https://vercel.com).
2. Tạo repository trên GitHub:
   ```bash
   git remote add origin https://github.com/<tai-khoan-cua-ban>/hoctienganh.git
   git push -u origin master
   ```
3. Đăng nhập Vercel, chọn **Add New Project** → Chọn repository `hoctienganh` → Bấm **Deploy**.
4. Bạn sẽ nhận được link HTTPS miễn phí dạng `https://hoctienganh-xxx.vercel.app`. Mở link này trên iPhone và bấm "Thêm vào MH chính".

### Cách B: GitHub Pages
1. Thêm script deploy vào `package.json` hoặc dùng GitHub Actions để tự động build và deploy thư mục `dist`.

---

## 🛠️ 4. Cấu trúc thư mục

- `src/screens/Today.jsx`: Màn hình chính (Streak, số thẻ cần học, mẹo hằng ngày, tự nói 1 phút).
- `src/screens/Review.jsx`: Phiên ôn tập SRS (lật thẻ 3D, 4 mức đánh giá Quên/Khó/Nhớ/Dễ, tự đọc, tự ôn lại thẻ quên).
- `src/screens/Vocab.jsx`: Danh sách ~113 từ vựng có sẵn, tìm kiếm, lọc theo chuyên ngành, nút thêm từ nhanh.
- `src/screens/Phrases.jsx`: Danh sách mẫu câu theo 9 tình huống thực tế kèm bộ điều khiển Shadowing.
- `src/screens/CardEditor.jsx`: Thêm / sửa / xoá thẻ, phân loại nhóm.
- `src/screens/Settings.jsx`: Chỉnh số lượng thẻ mới mỗi ngày, chọn giọng đọc, sao lưu/khôi phục dữ liệu ra file JSON.
- `src/db.js`: Cơ sở dữ liệu IndexedDB (Dexie), lưu trữ 100% trên thiết bị.
- `src/srs.js`: Thuật toán ôn tập ngắt quãng SM-2.
- `src/speech.js`: Phát âm Web Speech API và ghi âm MediaRecorder.
