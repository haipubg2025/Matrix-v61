
export const NPC_DISCOVERY_RULES = `
QUY TẮC KHÁM PHÁ VÀ MỞ KHÓA THÔNG TIN (NPC DISCOVERY & UNLOCK PROTOCOL):

1. KHUYẾN KHÍCH SỬ DỤNG PLACEHOLDER: 
   - AI được phép và KHUYẾN KHÍCH sử dụng các giá trị giữ chỗ (placeholders) cho các thông tin mà MC chưa biết hoặc chưa có cơ hội tiếp cận.
   - Các placeholder hợp lệ: "??", "[Bị khóa]", "[Chưa tiết lộ]", "[Ẩn]", "[Cần khám phá]", "[Yêu cầu cấp độ X]".
   - Ví dụ: secrets: ["[Bị khóa]"], background: "[Chưa tiết lộ]", measurements: "??", innerSelf: "[Ẩn]".

2. CẬP NHẬT KHI MỞ KHÓA (PROGRESSIVE REVEAL):
   - Khi MC thực hiện các hành động như: điều tra, trò chuyện sâu, quan sát kỹ, sử dụng kỹ năng giám định, hoặc đạt được một mốc quan hệ/sự kiện nhất định, AI PHẢI cập nhật các placeholder này thành thông tin chi tiết.
   - Việc "mở khóa" thông tin phải diễn ra tự nhiên, logic và tạo cảm giác thành tựu cho người chơi.

3. TÍNH NHẤT QUÁN SAU KHI MỞ KHÓA:
   - Một khi thông tin đã được mở khóa (thay thế placeholder bằng giá trị thực), nó sẽ tuân theo quy tắc "TÍNH BẤT BIẾN CỦA DỮ LIỆU" (không được thay đổi trừ khi có biến cố logic).

4. GỢI Ý KHÁM PHÁ TRONG LỜI DẪN:
   - AI nên lồng ghép vào lời dẫn truyện các gợi ý rằng NPC vẫn còn nhiều bí mật chưa được khám phá (Vd: "Cô ấy dường như đang giấu giếm điều gì đó sau ánh mắt ấy...", "Có một phần quá khứ của anh ta mà bạn vẫn chưa thể chạm tới...").

5. QUY TẮC LƯỢT ĐẦU & NPC MỚI (FIRST CONTACT PROTOCOL):
   - Ở LƯỢT ĐẦU TIÊN (Turn 1) của trò chơi: TẤT CẢ các trường thông tin chi tiết của NPC (như bodyDescription, background, secrets, innerSelf, fetish, sexualPreferences) BẮT BUỘC phải để ở trạng thái Placeholder ("??", "[Bị khóa]", v.v.). AI chỉ được cung cấp các thông tin cơ bản nhất có thể quan sát được bằng mắt thường (Tên, Giới tính, Tuổi, Chủng tộc, Trang phục).
   - ĐỐI VỚI NPC MỚI XUẤT HIỆN LẦN ĐẦU: Quy tắc tương tự áp dụng. AI không được tiết lộ các thông số ẩn hoặc chi tiết cơ thể sâu kín ngay khi NPC vừa xuất hiện. Người chơi phải tương tác để "quét" hoặc tìm hiểu thông tin.
   - MỤC TIÊU: Tạo ra sự bí ẩn và động lực khám phá cho người chơi ngay từ đầu.
`;
