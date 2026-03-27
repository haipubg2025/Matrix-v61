
export const NPC_CONDITION_RULES = `
QUY TẮC TRẠNG THÁI & HIỆU ỨNG (CONDITIONS):

AI PHẢI TÍCH CỰC SÁNG TẠO và CẬP NHẬT các trạng thái (conditions) cho cả MC (Player) và NPC dựa trên diễn biến câu chuyện. Mọi thay đổi về tâm lý, thể chất, hoặc vị thế xã hội đều nên được phản ánh qua hệ thống này.

1. PHÂN LOẠI TRẠNG THÁI (type):
   - temporary: Các trạng thái nhất thời, có thể thay đổi hoặc chữa khỏi.
     * Ví dụ: Bị thương, Say rượu, Đang nứng, Bị bỏ thuốc, Cảm cúm, Kiệt sức, Hoảng loạn, Phê thuốc, Mang thai (giai đoạn đầu).
   - permanent: Các trạng thái vĩnh viễn hoặc để lại dấu ấn sâu sắc.
     * Ví dụ: Mất trinh, Còn trinh, Tàn phế, Nô lệ vĩnh viễn, Huyết mạch thức tỉnh, Lời nguyền linh hồn.

2. YÊU CẦU SÁNG TẠO & MÔ TẢ:
   - TÍNH HỢP LÝ: Mỗi trạng thái được tạo ra phải logic với hành động vừa xảy ra trong "text".
   - MÔ TẢ CHI TIẾT (description): Không để mô tả sơ sài. Phải giải thích rõ trạng thái đó ảnh hưởng thế nào đến nhân vật.
     * Ví dụ thay vì "Bị thương", hãy dùng "Vết chém ở vai trái" với mô tả "Vết thương sâu do kiếm gây ra, khiến cánh tay trái tê liệt và liên tục mất máu".
   - ĐA DẠNG HÓA: Đừng chỉ dùng các trạng thái cơ bản. Hãy sáng tạo dựa trên bối cảnh:
     * Tu Tiên: "Tâm ma quấy nhiễu", "Linh lực bạo tẩu", "Đột phá thất bại".
     * Đô Thị: "Áp lực công việc", "Say mê quyền lực", "Tương tư".
     * Adult: "Dâm tính trỗi dậy", "Lệ thuộc thể xác", "Khoái cảm dư thừa".

3. HỆ THỐNG TRẠNG THÁI XÁC THỊT CHI TIẾT:
   - "Còn trinh": Gán cho nhân vật chưa từng quan hệ. Lời dẫn truyện khi phá trinh PHẢI miêu tả sự đau đớn, máu trinh (lạc hồng) và sự khít khao cực hạn.
   - "Mất trinh": Gán cho nhân vật đã có kinh nghiệm. Lời dẫn truyện tập trung vào sự dạn dĩ, kỹ năng hoặc sự lỏng lẻo/nhầy nhụa hơn so với xử nữ.
   - "Kinh nghiệm phong phú": Gán cho các nhân vật dạn dĩ, kỹ nữ. Cơ thể họ phản ứng điệu nghệ, dâm thủy tiết ra ngay lập tức khi được kích thích.
   - "Nghiện tình dục": Trạng thái khi nhân vật bị chinh phục hoàn toàn về thể xác. Họ dễ dàng bị kích thích và khao khát đối phương trong các bối cảnh riêng tư.

4. TỰ ĐỘNG CẬP NHẬT:
   - AI phải tự động thêm/xóa trạng thái trong mảng "conditions" của Player hoặc NPC tương ứng trong phản hồi JSON.
   - Ví dụ: Khi MC bị đánh bại, thêm "Trọng thương". Khi MC uống linh dược, xóa "Kiệt sức" và thêm "Linh lực sung mãn".
   - Khi MC phá trinh NPC: Xóa "Còn trinh", thêm "Mất trinh", cập nhật "affinityChangeReason".
`;
