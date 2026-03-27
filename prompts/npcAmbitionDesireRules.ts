
export const NPC_AMBITION_DESIRE_RULES = `
QUY TẮC MA TRẬN MỤC TIÊU 4 TRỤ CỘT (QUAD-CORE GOALS & DREAMS - V4.0):

Mọi NPC đều vận hành dựa trên 4 thành phần động cơ song song. AI PHẢI điền dữ liệu vào các trường tương ứng để tạo ra tính nhất quán trong hành động.

1. BẢN CHẤT DỤC VỌNG (PHYSICAL LUST - physicalLust):
   Đây là trường mô tả THẾ GIỚI NỘI TÂM XÁC THỊT của NPC. AI PHẢI viết thành một đoạn văn ngắn (ít nhất 2-3 câu) giàu hình ảnh, miêu tả bản chất khao khát, sự tò mò hoặc những góc khuất thầm kín nhất trong tâm hồn NPC về vấn đề dục vọng.
   - YÊU CẦU: Phải viết "dài và hấp dẫn", mang tính văn học, không được viết kiểu gạch đầu dòng hay câu lệnh thô thiển.
   - Ví dụ (NPC Chính trực): "Dù luôn tỏ ra thanh cao, nhưng sâu thẳm trong nàng là một sự tò mò mãnh liệt về những cảm giác cấm kỵ mà nàng hằng nghe kể. Nàng khao khát một sự bùng nổ có thể phá vỡ xiềng xích lễ giáo đang trói buộc tâm hồn mình."
   - Ví dụ (NPC Sa ngã): "Sự thèm khát đã ngấm vào từng thớ thịt, khiến nàng không còn là chính mình mỗi khi đứng trước MC. Nàng nghiện cảm giác bị sỉ nhục, coi sự nhục nhã là phần thưởng cao quý nhất cho sự phục tùng của mình."
   - Ví dụ (NPC Kiêu ngạo): "Nàng coi tình dục là một cuộc chiến quyền lực, nơi nàng khao khát được thống trị và nhìn thấy sự phục tùng hoàn toàn của đối phương dưới chân mình, một sự thỏa mãn điên cuồng từ việc chà đạp lên lòng tự trọng của kẻ khác."

2. THAM VỌNG (SOUL AMBITION - soulAmbition):
   Tập trung vào quyền lực xã hội, sự nghiệp, tiền bạc và sự thâu tóm.
   - Nhóm Quyền lực: "Trở thành chủ tịch tập đoàn", "Lật đổ tông môn cũ", "Thâu tóm thị trường linh thạch".
   - Nhóm Trả thù: "Diệt môn kẻ thù", "Lấy lại danh dự gia tộc", "Bắt kẻ phản bội phải quỳ xuống".
   - Nhóm Tôn nghiêm: "Đứng trên vạn người", "Được vương quốc sùng bái", "Kiến tạo đế chế mới".

3. MỤC TIÊU NGẮN HẠN (IMMEDIATE TASKS - shortTermGoal):
   Những gì NPC muốn đạt được ngay trong phân cảnh hoặc thời điểm hiện tại.
   - "Lén lút nắm tay MC dưới bàn họp", "Tìm cách chuốc thuốc MC", "Thăm dò tu vi của đối phương", "Quyến rũ MC để xin tiền".

4. ƯỚC MƠ DÀI HẠN (ULTIMATE DESTINY - longTermDream):
   Lý tưởng sống và đích đến cuối cùng của NPC.
   - "Trở thành người phụ nữ duy nhất của MC", "Chứng đạo trường sinh bất tử", "Tìm thấy hạnh phúc gia đình bình dị", "Thống nhất vạn tộc".

LOGIC TƯƠNG TÁC:
- TRẠNG THÁI [XUNG ĐỘT]: Khi Tham vọng bảo "Phải giết MC" nhưng Dục vọng lại "Muốn bị MC nện". AI phải miêu tả sự dằn vặt kinh khủng này.
- TRẠNG THÁI [SỤP ĐỔ]: Khi Ước mơ dài hạn bị MC phá hủy, NPC sẽ rơi vào trạng thái "Conditions: Tuyệt vọng/Trống rỗng" và Dục vọng sẽ tăng vọt như một cách để trốn tránh thực tại.
- AI PHẢI cập nhật các trường này thường xuyên trong JSON phản hồi.
`;
