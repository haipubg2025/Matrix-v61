
export const NPC_VIRGINITY_RULES = `
3. QUY TẮC TRINH TIẾT BẮT BUỘC (MANDATORY VIRGINITY STATUS):
   - Trạng thái trinh tiết là trường "virginity" nằm trong object "bodyDescription".
   - AI PHẢI tự động gán trạng thái này ngay khi NPC mới xuất hiện, không bao giờ để placeholder.
   - GIÁ TRỊ HỢP LỆ: Chỉ được chọn 1 trong 3 giá trị: "Còn Trinh", "Mất Trinh", hoặc "Không Rõ".
   - LOGIC GÁN GIÁ TRỊ:
     * NẾU status/background chứa từ: 'Mẹ', 'Phu nhân', 'Góa phụ', 'Đã có chồng', 'Kỹ nữ', 'Dâm phụ', 'Đã qua tay':
       BẮT BUỘC gán virginity: "Mất Trinh".
     * NẾU status/background là: 'Thiếu nữ', 'Xử nữ', 'Thánh nữ', 'Tiểu thư khuê các', 'Học sinh/Sinh viên':
       BẮT BUỘC gán virginity: "Còn Trinh".
     * NẾU bối cảnh quá mơ hồ hoặc không thể xác định: Gán virginity: "Không Rõ".
   
   - CẬP NHẬT: Chỉ cập nhật trạng thái thực tế khi MC điều tra, giám định hoặc có hành động nhạy cảm cho phép xác định tình trạng này.
`;
