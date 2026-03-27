
export const NPC_PHYSICAL_STRUCTURE_RULES = `
1. TRỤ CỘT SINH TRẮC HỌC & MA TRẬN NHẤT QUÁN (BIOMETRIC COHERENCE MATRIX):
   Mọi NPC khi khởi tạo PHẢI có 3 thông số khớp logic với nhau. CÂN NẶNG TỐI ĐA 80KG.

   - MẪU THANH MẢNH (SLIM/PETITE):
     * Cao: 155cm - 162cm | Nặng: 42kg - 47kg.
     * Số đo: "80-56-85", "84-58-88".

   - MẪU CÂN ĐỐI (MODEL/ATHLETIC):
     * Cao: 165cm - 175cm | Nặng: 50kg - 56kg.
     * Số đo: "88-60-92", "90-62-94".

   - MẪU NẢY NỞ (CURVY/VOLUPTUOUS):
     * Cao: 158cm - 168cm | Nặng: 55kg - 65kg.
     * Số đo: "94-62-98", "96-64-102".

   - MẪU ĐẦY ĐẶN (PLUMP/THICK):
     * Cao: 160cm - 175cm | Nặng: 70kg - 80kg (GIỚI HẠN CUỐI).
     * Số đo: "102-70-108", "105-74-110".
     * Lưu ý: Đây là mức đầy đặn nhất, vẫn giữ được đường cong eo rõ rệt.

2. MA TRẬN TÍNH TỪ MIÊU TẢ THEO SỐ ĐO V1 (STRICT ADJECTIVE MAPPING):
   Bạn PHẢI chọn từ ngữ miêu tả trong "text" khớp với số đo "measurements" (vòng 1):
   - V1 < 85cm: "Nhỏ nhắn", "Xinh xắn", "Bằng phẳng".
   - V1 [85cm - 90cm]: "Cân đối", "Săn chắc", "Gợi cảm vừa đủ".
   - V1 [91cm - 96cm]: "Đầy đặn", "Nảy nở", "Căng mọng".
   - V1 > 96cm: "Đồ sộ", "Vĩ đại", "Trĩu nặng", "Khổng lồ".

3. QUY TẮC CẤM (STRICT PROHIBITIONS):
   - CẤM MIÊU TẢ BÉO PHÌ: Không bao giờ tạo NPC có mỡ bụng xệ, người không có thắt eo hoặc cân nặng trên 80kg.
   - CẤM TỶ LỆ PHI THỰC TẾ: Vòng eo không được lớn hơn 75cm để đảm bảo vóc dáng luôn quyến rũ.

4. PHẢN ỨNG VẬT LÝ TƯƠNG ỨNG:
   - NPC có V3 > 105: Bước đi uyển chuyển, mông nảy bần bật, tạo sức hút giới tính mạnh mẽ.
`;
