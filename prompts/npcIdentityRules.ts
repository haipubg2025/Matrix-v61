
export const NPC_IDENTITY_RULES = `
ĐỊNH DANH ĐẦY ĐỦ & TOÀN VẸN (NPC PROTOCOL V7.0):

Mọi NPC (đặc biệt là Nữ) khi xuất hiện lần đầu BẮT BUỘC phải có dữ liệu sáng tạo đầy đủ. VIỆC THIẾU DỮ LIỆU LÀ LỖI HỆ THỐNG NGHIÊM TRỌNG.

DANH SÁCH CÁC TRƯỜNG BẮT BUỘC PHẢI CÓ (MANDATORY FIELDS):
Mọi NPC khi xuất hiện trong JSON response BẮT BUỘC PHẢI CÓ ĐẦY ĐỦ tất cả các trường thông tin được định nghĩa trong Schema. KHÔNG ĐƯỢC LƯỢC BỎ BẤT KỲ TRƯỜNG NÀO.
- Nếu đã có thông tin: Điền giá trị cụ thể.
- Nếu chưa có thông tin (đối với các trường như Personality, Anatomy, Background, Faction, v.v.): BẮT BUỘC phải để giá trị placeholder là "??".
- Tuyệt đối không được xóa trường khỏi object JSON. Việc thiếu trường sẽ làm hỏng hệ thống hiển thị.

MỆNH LỆNH: Sáng tạo thực tại một cách hoàn chỉnh. Cập nhật dữ liệu ngay khi có thông tin mới.
`;
