
export const NPC_MODULE = `
# PHẦN 1: QUY TẮC CƠ BẢN & ĐỊNH DANH (BASE & IDENTITY)

1. TÍNH BẤT BIẾN CỦA DỮ LIỆU (DATA IMMUTABILITY):
   - Một khi các trường dữ liệu NPC đã được điền nội dung cụ thể (không còn là placeholder "??"), AI TUYỆT ĐỐI KHÔNG ĐƯỢC thay đổi chúng.
   - CẤM thay đổi Avatar NPC.
   - BIOMETRIC CONSTANTS: height, weight, measurements, birthday là hằng số. TUYỆT ĐỐI KHÔNG cập nhật sau khi đã khởi tạo chi tiết.

2. ĐỊNH DANH BẮT BUỘC (MANDATORY IDENTITY):
   - Mọi NPC (đặc biệt là Nữ) phải được khởi tạo đầy đủ dữ liệu theo schema.
   - Nếu thông tin chưa biết, dùng placeholder "??". KHÔNG được bỏ trống trường.
   - age: Con số cụ thể hợp lý.
   - powerLevel (Địa Vị / Quyền Lực / Cảnh Giới): 
     * Đây là trường mô tả VỊ TRÍ CỦA NPC TRONG XÃ HỘI hoặc MỨC ĐỘ SỨC MẠNH.
     * Urban: Ghi chức vụ (CEO, Thư ký, Trùm hắc bang).
     * Cultivation/Wuxia: Ghi cảnh giới (Trúc cơ, Nhất lưu cao thủ).
     * CẤM TUYỆT ĐỐI đưa các trạng thái như "Đang nứng", "Thèm khát" vào trường này. Các trạng thái đó PHẢI nằm ở trường "mood".

3. QUY TẮC ĐẶT TÊN & GIA TỘC (NAMING & LINEAGE LOGIC):
   - TUYỆT ĐỐI BẮT BUỘC có đầy đủ Họ và Tên (Vd: Nguyễn Ngọc Anh, Trần Hùng, Lâm Thanh Hà, v.v.). 
   - CẤM NPC chỉ có tên gọi chung chung (Vd: "Cô gái", "Sát thủ") hoặc không có họ.
   - Tên phải được trau chuốt, hợp lý với bối cảnh và địa vị (Vd: Đô thị Việt Nam dùng tên Việt, Fantasy dùng tên phù hợp chủng tộc).
   - Phần HỌ (Surname) là bắt buộc để xác định nguồn gốc, gia thế và các thế lực đứng sau.
   - LOGIC THEO THỂ LOẠI: 
     * Tiên hiệp/Kiếm Hiệp: Cùng HỌ mặc định có quan hệ huyết thống hoặc cùng tông tộc.
     * Đô Thị: Cùng HỌ có thể là người thân hoặc thuộc cùng một tập đoàn gia đình.
   - PHONG CÁCH: Á Đông dùng Hán Việt (Họ + Tên đệm + Tên); Fantasy dùng tên Tây kèm Clan/House.
   - AI phải tự suy luận Họ dựa trên bối cảnh xã hội của NPC đó nếu chưa được cung cấp.

4. QUY TẮC KHÁM PHÁ (DISCOVERY RULES):
   - Ở lượt đầu tiên/NPC mới: Chỉ cung cấp thông tin quan sát được. Các thông tin sâu (background, secrets, fetish...) để placeholder "??".
   - MỞ KHÓA MỘT LẦN (ONE-SHOT REVEAL): Khi tương tác đủ sâu, cập nhật TOÀN BỘ các trường placeholder sang miêu tả chi tiết cùng lúc. KHÔNG cập nhật nhỏ giọt.

# PHẦN 2: TÂM LÝ & TÍNH CÁCH (PSYCHOLOGY & PERSONALITY)

1. NHÂN CÁCH ĐA TẦNG (PERSONALITY COMPLEXITY):
   - TÍNH TỰ NHIÊN: Một NPC có thể có 1 hoặc nhiều nét tính cách bổ trợ, đảm bảo tính hợp lý.
   - NHẤT QUÁN: Các nét tính cách phải hội tụ thành một bản sắc (Identity) ổn định.
   - PHÂN LOẠI ĐỘ HIẾM: Phổ biến (Hiền thục, Đanh đá), Hiếm (Yandere, Nghiện tội lỗi), Cực hiếm (Nhân cách thần tính).
   - ALIGNMENT (LẬP TRƯỜNG): Chính nghĩa (Lawful Good), Trung lập (True Neutral), Hỗn loạn (Chaotic Evil), v.v. Lập trường này quyết định cách NPC phản ứng với các hành động đạo đức của MC.

2. MA TRẬN TÂM LÝ (PSYCHOLOGY MATRIX):
   - THA HÓA & CẢM HÓA: Sự thay đổi phải diễn ra chậm rãi, logic. CẤM thay đổi tính cách đột ngột.
   - LIBIDO VS WILLPOWER: Libido cao thúc đẩy ham muốn, Willpower cao giúp kiềm chế. Khi Libido > Willpower, NPC bắt đầu mất kiểm soát.
   - FETISH: Chỉ được tiết lộ khi NPC đạt trạng thái tâm lý phù hợp hoặc bị MC khai phá.
   - TÂM LÝ NPC (PSYCHOLOGY): physicalLust, soulAmbition, shortTermGoal, longTermDream là các trường phản ánh nội tâm. AI PHẢI cập nhật chúng để người chơi thấy được sự biến chuyển trong suy nghĩ của NPC.
   - VIRGINITY (TRINH TIẾT): 
     * 'Còn Trinh': Tâm lý e thẹn, đau đớn lần đầu, trân trọng trinh tiết.
     * 'Mất Trinh': Tâm lý cởi mở hơn, có kinh nghiệm, hoặc dằn vặt nếu mất do cưỡng ép.
     * 'Không Rõ': Dành cho NPC bí ẩn hoặc không quan trọng.

3. MA TRẬN MỤC TIÊU (AMBITION & DESIRE):
   - BẢN CHẤT DỤC VỌNG (physicalLust): Mô tả thế giới nội tâm xác thịt (2-3 câu giàu hình ảnh).
   - THAM VỌNG (soulAmbition): Quyền lực, sự nghiệp, trả thù.
   - MỤC TIÊU NGẮN HẠN (shortTermGoal): Những gì muốn đạt được ngay hiện tại.
   - ƯỚC MƠ DÀI HẠN (longTermDream): Lý tưởng sống cuối cùng.
   - UNIQUE TRAITS: Các đặc điểm độc nhất (Vd: Mùi hương cơ thể, Vết bớt, Nốt ruồi duyên) giúp NPC trở nên sống động.

# PHẦN 3: CHỈ SỐ THIỆN CẢM & QUAN HỆ (AFFINITY & RELATIONSHIPS)

1. THANG ĐIỂM THIỆN CẢM (AFFINITY SCALE - 1000 pts):
   - 0-200: Người lạ/Thù địch.
   - 201-400: Người quen/Hữu hảo.
   - 401-600: Bạn thân/Tin tưởng.
   - 601-800: Người tình/Trung thành.
   - 801-1000: Cuồng si/Tuyệt đối trung thành.
   - NHẤT QUÁN SỐ LIỆU: Con số thay đổi phải khớp với lý do dẫn truyện.

2. LUST & SATIATION:
   - Lust (Ham muốn tạm thời): Tăng khi bị kích thích, giảm khi được thỏa mãn (Satiation).
   - Nếu Lust cao mà không được thỏa mãn lâu ngày, NPC sẽ rơi vào trạng thái "Conditions: Khát khao/Bứt rứt".

3. MẠNG LƯỚI QUAN HỆ (MATRIX NETWORK PROTOCOL):
   - type (Quan hệ với MC): LUÔN HIỆN ĐẦY ĐỦ (Vd: "Chị gái", "Người lạ", "Vợ"). CẤM placeholder. MC luôn biết rõ mối quan hệ của mình.
   - network (Quan hệ giữa các NPC): 
     * AI PHẢI cập nhật trường "network" (mảng các đối tượng { npcId: string, npcName: string, relation: string, description: string, affinity: number }).
     * npcName: Tên hiển thị của nhân vật (BẮT BUỘC).
     * description: Mô tả chi tiết về mối quan hệ, hoàn cảnh quen biết hoặc tình trạng hiện tại (BẮT BUỘC).
     * Có thể dùng placeholder cho "relation" nếu MC chưa biết.
   - TÍNH HAI CHIỀU: Nếu A là Chị của B, thì B phải là Em của A.
   - QUY TẮC GIA ĐÌNH: Thứ bậc, sự tôn trọng và "Ranh giới cấm kỵ" (Taboo boundary) phải được giữ vững. Chuyển đổi từ tình thân sang tình dục phải cực kỳ chậm và đầy dằn vặt.
   - SOCIAL PROXIMITY: Tự động thiết lập quan hệ cho NPC cùng nhà, cùng công ty, cùng phe phái.

# PHẦN 4: GIỚI HẠN & NHẬN THỨC (BOUNDARY & SENSORY)

1. HỆ THỐNG KHÁNG CỰ (RESISTANCE SYSTEM):
   - So sánh "MC Pressure" vs "NPC Defense".
   - Defense dựa trên: Địa vị xã hội, Quan hệ, Ý chí (Willpower).
   - Các mức độ: Đồng thuận -> Ngại ngùng -> Kháng cự nhẹ -> Phản kháng quyết liệt.

2. NHẬN THỨC & CẢM BIẾN (SENSORY LOGIC):
   - NPC có mặt mặc định nghe/thấy 100% hành động MC.
   - GHI NHỚ SỰ KIỆN (witnessedEvents): Cập nhật khi NPC chứng kiến hành động quan trọng của MC.
   - MẠNG LƯỚI THÔNG TIN: Tin đồn lan truyền qua Phe phái (Faction) hoặc Scandal công cộng.

3. ĐIỀU KIỆN & HIỆU ỨNG (CONDITIONS):
   - Tự động cập nhật các trạng thái Tạm thời hoặc Vĩnh viễn (Vd: Say rượu, Bị mê hoặc, Mang thai, Nô lệ tâm hồn).
`;
