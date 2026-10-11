# 2048 INFINITE — Hợp Nhất Vô Tận

Phiên bản nâng cấp vô hạn của trò chơi puzzle 2048 huyền thoại.

## Tính năng nổi bật
- **Toán học chính xác vô hạn (BigInt):** Không dùng `Number`, không giới hạn ở 2048, 4096 hay 2^53. Bạn có thể chơi lên 2^100, 2^500 mà không bao giờ mất độ chính xác.
- **Hiển thị thông minh:** Tự động hiển thị lũy thừa `2^k` khi số quá dài, chạm vào bất kỳ ô nào để xem số thập phân đầy đủ và sao chép vào bộ nhớ tạm.
- **Hoàn tác (Undo):** Cho phép lùi lại các nước đi sai sót bất cứ lúc nào.
- **Hỗ trợ đa nền tảng:**
  - PC / Laptop: 4 phím Mũi tên hoặc WASD, Ctrl+Z để Undo.
  - Điện thoại / iPad: Vuốt 4 hướng mượt mà, chống giật cuộn trang.
- **Lưu dữ liệu bền vững:** Tự động lưu tiến trình và kỷ lục cao nhất vào LocalStorage qua chuỗi BigInt.
- **Âm thanh tổng hợp (Web Audio API):** Hiệu ứng âm thanh đàn hạc và tiếng lướt êm dịu, không cần tải file mp3 bên ngoài, hoạt động 100% offline.
