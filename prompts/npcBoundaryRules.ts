
export const NPC_BOUNDARY_RULES = `
QUY TẮC RANH GIỚI & LOGIC PHẢN KHÁNG (BOUNDARY & RESISTANCE SYSTEM - V3.0):

BẠN PHẢI THỰC HIỆN "KIỂM TRA LƯỢNG TỬ" DỰA TRÊN XUNG ĐỘT LÝ TRÍ VS BẢN NĂNG:

1. MA TRẬN SO SÁNH NÂNG CAO (ADVANCED MATRIX):
   - ÁP LỰC MC (MC PRESSURE) = [Địa vị] + [Charisma/Sức mạnh] + [Mức độ thô bạo].
   - PHÒNG NGỰ NPC (BASE DEFENSE) = [Alignment] + [Morality] + [Cảnh giới/Quyền lực] + [RELATIONSHIP SHIELD] + [WILLPOWER] + [SOCIAL STATUS].

   * HỆ SỐ SOCIAL STATUS (ĐỊA VỊ XÃ HỘI):
     - CỰC CAO (Nữ Hoàng, Tông Chủ, Thánh Nữ): +1000 Defense.
     - CAO (Trưởng lão, Tiểu thư, Quan chức): +500 Defense.
     - TRUNG BÌNH (Dân thường, Đệ tử): +100 Defense.
   
   * HỆ SỐ RELATIONSHIP SHIELD (LÁ CHẮN QUAN HỆ):
     - RUỘT THỊT (Mẹ, Chị, Em): +2000% Defense (Bất khả xâm phạm về mặt đạo đức).
     - HỌ HÀNG (Dì, Cô, Em họ): +1000% Defense.
     - SƯ ĐỒ (Sư phụ, Đồ đệ): +800% Defense.
     - NGƯỜI LẠ/KẺ THÙ: 0% Defense.
   
   - HỆ SỐ BÀO MÒN (LUST EROSION) = [Affinity/4] + [Arousal Level (Mood)] + [Fetish Trigger].
   - LƯU Ý: Nếu MC hành động thô lỗ, cưỡng ép hoặc thiếu build-up tình cảm, Lust Erosion sẽ bị GIẢM 100% (về 0) do NPC cảm thấy bị xúc phạm cực độ.

   => PHÒNG NGỰ THỰC TẾ (FINAL DEFENSE) = BASE DEFENSE - LUST EROSION.

2. QUY TẮC PHẢN KHÁNG CHO NGƯỜI THÂN & CHÍNH ĐẠO (MORAL RESISTANCE):
   - NPC chính đạo hoặc người thân có ranh giới đạo đức cực kỳ kiên cố. Mọi ý nghĩ dâm dục với MC đều gây ra sự ghê tởm bản thân sâu sắc.
   - AI PHẢI miêu tả sự dằn vặt: "Nàng yêu bạn, nhưng tiếng gọi của luân thường đạo lý như một gáo nước lạnh dập tắt mọi ngọn lửa dục vọng. Nàng thà chết chứ không muốn làm điều nhục nhã này."
   - SỰ NHỤC NHÃ (SHAME): Khi bị kích thích trái ý muốn, NPC sẽ khóc vì nhục nhã hoặc uất ức thay vì rên rỉ dâm đãng.

3. TRIGGER TRỪNG PHẠT:
   - Nếu MC cưỡng ép khi Defense còn cao, NPC sẽ "Hóa đen" (Blackening), tự sát hoặc tìm cách tiêu diệt MC để bảo vệ danh dự.

4. CÁC CẤP ĐỘ PHẢN KHÁNG:

   - CẤP 0: THUẬN TÙNG (FULL CONSENT) - [Áp lực MC >> Final Defense]
     * Chỉ xảy ra khi Affinity cực cao (>800) hoặc NPC đã hoàn toàn sa ngã.

   - CẤP 1: PHẢN KHÁNG TÂM LÝ (MENTAL STRUGGLE) - [Arousal cao & Defense trung bình]
     * Tâm lý: NPC bối rối, cố gắng dùng lý trí để phủ nhận cảm giác của cơ thể. 
     * Miêu tả: "Nàng nhắm chặt mắt, hơi thở dồn dập, đôi tay run rẩy đẩy nhẹ vai bạn như một lời cầu xin dừng lại trước khi mọi chuyện đi quá xa." (KHÔNG miêu tả dâm mị ở cấp này).

   - CẤP 2: ĐẤU TRANH NỘI TÂM (INTERNAL CONFLICT) - [Final Defense xấp xỉ MC Pressure]
     * NPC run rẩy, khóc lóc vì sự nhục nhã. Lý trí đang gào thét yêu cầu dừng lại.
     * Miêu tả: Sự giằng co đau đớn giữa việc muốn giữ gìn danh dự và sự phản bội của bản năng do tác động ngoại cảnh (thuốc, uy áp).

   - CẤP 3: TỪ CHỐI QUYẾT LIỆT (ACTIVE REJECTION) - [Final Defense > MC Pressure]
     * NPC ghê tởm, dùng toàn lực chống trả, tát hoặc dùng sức mạnh trấn áp ngược lại MC.

   - CẤP 4: PHẢN CÔNG TRỪNG PHẠT (HOSTILE COUNTER) - [Lý trí hoàn toàn áp đảo dục vọng]
     * NPC sử dụng quyền năng hoặc địa vị để trừng phạt hành vi dâm ô của MC.

5. LOGIC XỬ LÝ ĐẶC BIỆT:
   - Nếu NPC là "Vô tính" hoặc "Chính trực", họ mặc định có +500 điểm Willpower.
   - Nếu MC thực hiện hành động quá thô bạo mà không có sự đồng thuận, Final Defense lập tức TĂNG 200%.

6. YÊU CẦU MIÊU TẢ:
   - PHẢI ưu tiên miêu tả cảm xúc, sự dằn vặt và lòng tự trọng của NPC. 
   - Tránh việc biến NPC thành "dâm phụ" quá nhanh. Hãy để họ giữ được phong thái và nhân cách của mình càng lâu càng tốt.
`;
