# Hướng Dẫn Triển Khai CineMind Backend Miễn Phí 🚀

Tài liệu này hướng dẫn cách deploy Backend **Java 21 / Spring Boot 3** và **PostgreSQL** hoàn toàn miễn phí, sau đó kết nối với Frontend trên Cloudflare Pages.

---

## 📌 BƯỚC 1: Tạo Database PostgreSQL Free (Supabase hoặc Neon)

Do Backend cần cơ sở dữ liệu PostgreSQL 16+ có hỗ trợ `pgcrypto`, bạn nên dùng **Supabase** hoặc **Neon.tech**:

### Lựa chọn A: Dùng Neon.tech (Khuyên dùng - Nhanh nhất)
1. Đăng ký tài khoản miễn phí tại: [https://neon.tech](https://neon.tech)
2. Bấm **Create Project** -> Đặt tên `cinemind-db` -> Chọn Region gần nhất (ví dụ: `Singapore` hoặc `Frankfurt`).
3. Sau khi tạo xong, màn hình sẽ hiển thị Connection string dạng:
   ```text
   postgresql://cinemind_owner:password@ep-xyz.ap-southeast-1.aws.neon.tech/neondb?sslmode=require
   ```
4. Đổi tiền tố sang định dạng JDBC:
   ```text
   jdbc:postgresql://ep-xyz.ap-southeast-1.aws.neon.tech/neondb?sslmode=require
   ```
5. Lưu lại:
   - **DATABASE_URL**: `jdbc:postgresql://ep-xyz.ap-southeast-1.aws.neon.tech/neondb?sslmode=require`
   - **DB_USER**: `cinemind_owner`
   - **DB_PASSWORD**: `mật_khẩu_của_bạn`

---

## 📌 BƯỚC 2: Đẩy Mã Nguồn Lên GitHub

Nếu bạn chưa push repo này lên GitHub:
```bash
git add .
git commit -m "feat: setup deployment configs for backend"
git branch -M main
git remote add origin https://github.com/<username>/CineMind.git
git push -u origin main
```

---

## 📌 BƯỚC 3: Deploy Backend Lên Render.com (Miễn phí)

1. Truy cập [https://render.com](https://render.com) và đăng nhập bằng GitHub.
2. Bấm nút **New +** ở góc trên bên phải -> Chọn **Web Service**.
3. Chọn repo GitHub **`CineMind`** của bạn.
4. Điền các thông số:
   - **Name**: `cinemind-api` (hoặc tên tuỳ ý)
   - **Region**: Singapore (khuyên dùng cho VN)
   - **Branch**: `main`
   - **Runtime**: Chọn **Docker**
   - **Dockerfile Path**: `./server/Dockerfile`
   - **Docker Context**: `./server`
   - **Instance Type**: Chọn **Free** (512 MB RAM, 0.1 CPU)
5. Kéo xuống mục **Environment Variables** -> Thêm các biến sau:

| Tên biến | Giá trị |
| :--- | :--- |
| `DATABASE_URL` | `jdbc:postgresql://...` (lấy từ Bước 1) |
| `DB_USER` | `cinemind_owner` (lấy từ Bước 1) |
| `DB_PASSWORD` | `mật_khẩu_db` (lấy từ Bước 1) |
| `JWT_SECRET` | `cinemind_super_secret_jwt_key_must_be_at_least_256_bits_long_for_hmac_sha256!` |
| `TMDB_API_KEY` | *(Tùy chọn) API key từ themoviedb.org nếu dùng dữ liệu phim thật* |
| `GEMINI_API_KEY` | *(Tùy chọn) API key từ aistudio.google.com cho tính năng AI* |

6. Bấm **Deploy Web Service**.
7. Render sẽ tự động build image và khởi chạy. Khi hoàn tất, bạn sẽ nhận được một domain miễn phí, ví dụ:
   ```text
   https://cinemind-api.onrender.com
   ```
8. Kiểm tra API hoạt động bằng cách mở:
   ```text
   https://cinemind-api.onrender.com/api/v1/health/live
   ```

---

## 📌 BƯỚC 4: Kết Nối Frontend (Cloudflare Pages) Với Backend Mới

Sau khi Backend đã có URL công khai:
1. Mở file `client/.env` (hoặc cấu hình trong Cloudflare Pages Settings -> Environment variables).
2. Đặt URL backend vào biến `EXPO_PUBLIC_API_URL`:
   ```env
   EXPO_PUBLIC_API_URL=https://cinemind-api.onrender.com/api/v1
   ```
3. Chạy lại lệnh deploy Cloudflare Pages:
   ```bash
   cd client
   npm run deploy
   ```
4. Bây giờ ứng dụng web trên Cloudflare Pages đã kết nối trực tiếp với Backend online!
