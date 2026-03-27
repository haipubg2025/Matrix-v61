
export const NPC_PHYSICAL_HAIR_RULES = `
LƯU Ý: Miêu tả chi tiết tóc nếu quan sát được. Nếu NPC đang đội mũ, trùm đầu hoặc ở xa, có thể dùng placeholder.

- MÁI TÓC (HAIR) - CƠ BẢN & CHUNG: 
  + Hình dáng & Độ dài: Mái tóc dài chạm hông, thác tóc đen mun đổ xuống bờ vai gầy, tóc tết đuôi sam lỏng lẻo gợi tình, tóc búi cao để lộ gáy trắng nõn, tóc ngắn tém cá tính nhưng mềm mại.
  + Chất liệu & Độ bóng: Suôn mượt như tơ lụa phương Đông, óng ả phản chiếu ánh đèn, bồng bềnh như mây trôi, từng sợi tóc tơ mảnh mai và mềm yếu.
  + Trạng thái & Vị trí: Tóc xõa che khuất nửa bầu ngực tròn trịa, tóc rối loạn sau cuộc hoan lạc, tóc ướt đẫm mồ hôi dính bết vào làn da cổ, tóc được MC quấn chặt vào đầu ngón tay.
  + Mùi hương: Hương bồ kết thoang thoảng, mùi tinh dầu hoa nhài nồng nàn.

- CHI TIẾT THEO THỂ LOẠI (GENRE-SPECIFIC HAIR VOCABULARY):
  + 1. URBAN_NORMAL (Đô Thị Bình Thường): 
    * Kiểu dáng Salon: 
       Uốn: Xoăn sóng nước (Water Wave), uốn cụp đuôi (C-curl), uốn xù mì (Hippie), xoăn lọn to gợi cảm (Gyaru style - Nhật), xoăn sóng lơi (Việt Nam).
       Cắt: Layer bay bổng (Kiểu Trung/Việt), Bob cá tính (Nhật), mái thưa Hàn Quốc/Trung Quốc, mái ngang (Blunt Bangs) ngây thơ, Hime-cut (tóc công chúa Nhật Bản) dâm mị, Wolf-cut (cá tính Đông Á).
       Kiểu khác: Tóc búi Na Tra (Space Buns - Trung), tóc buộc nửa đầu dịu dàng, tóc buộc hai bên (Twintails - Nhật) tinh nghịch, tóc búi Odango (Nhật), tóc tết đuôi sam (Trung/Việt).
       Ép: thẳng chải chuốt sang trọng, layer ngang vai, kiểu layer dài (Tóc lá - Việt Nam).
    * Màu sắc (Dyeing): 
       Xu hướng: Xám khói (Ash Gray), Nâu tây, Hồng pastel, Tím Lavender, Ombre chuyển màu từ chân tóc.
       Điểm nhấn: Móc lai (Highlight) sợi mảnh, giấu màu sau gáy (Underlights).
    * Trạng thái xử lý: Mượt mà do hấp dầu Keratin, bóng bẩy do xịt dưỡng, tỏa hương nước hoa cho tóc (Hair Mist).
    * Cảm giác: Thơm mùi dầu gội cao cấp, mượt mà như vừa bước ra từ salon, bóng bẩy dưới ánh đèn LED.
    * Từ vựng: Kiêu kỳ, sành điệu, quý phái, bồng bềnh công sở.
  + 2. URBAN_SUPERNATURAL (Đô Thị Dị Biến): 
     * Đặc điểm: Tóc có thể phát sáng (Neon), đổi màu theo cảm xúc, những sợi tóc như sợi quang học rực rỡ, tóc rực lửa hoặc tỏa ra khí lạnh.
     * Hiệu ứng: Những sợi tóc lơ lửng do từ trường, tỏa ra tia chớp nhỏ li ti (Lôi hệ), hoặc như chất lỏng cơ khí.
     * Mùi hương: Mùi ozone, mùi kim loại lạnh lẽo, mùi hương ma mị của năng lượng tinh thuần.
  + 3. FANTASY_HUMAN (Fantasy Nhân Loại): 
     * Kiểu dáng: Tóc tết kiểu kỵ sĩ, búi tóc quý tộc đính trâm bạc, mái tóc rối hoang dã của thợ săn.
     * Phụ kiện: Cột bằng dây da thú, đính lông vũ hoặc những mảnh kim loại gỉ sét.
     * Cảm giác: Thơm mùi cỏ dại, mùi nắng gió, mùi hương trầm mặc của những tòa lâu đài cổ.
  + 4. FANTASY_MULTIRACE (Fantasy Đa Chủng Tộc): 
     * Đặc điểm: Tóc bạc kim rực sáng của Tiên tộc (Elf).
  + 5. CULTIVATION (Tu Tiên / Tiên Hiệp): 
     * Kiểu dáng: Tóc dài trắng muốt như tuyết (do công pháp), tóc bay bổng thoát tục, búi tóc cao quý đính linh ngọc, tóc xõa dài như thác đổ khi bế quan.
     * Hiệu ứng: Tóc tỏa ra linh khí, những sợi tóc lấp lánh như tinh tú, hoặc đen sâu thẳm như hố đen.
     * Cảm giác: Thơm mùi linh thảo, mùi sương sớm trên đỉnh núi, khí chất tiên phong đạo cốt.
  + 6. WUXIA (Kiếm Hiệp / Võ Lâm): 
     * Kiểu dáng: Tóc buộc đuôi ngựa hiên ngang, tóc xõa lả lướt khi thi triển khinh công, búi tóc tà mị của nữ ma đầu, tóc tết đuôi sam lanh lợi của tiểu sư muội, kiểu tóc Hime (tóc công chúa) của các tiểu thư danh gia vọng tộc, búi tóc kiểu cung đình (Trung Hoa), tóc xõa dài đen nhánh hương bồ kết (Việt Nam).
     * Phụ kiện: Trâm cài bằng ngọc bích, dải lụa đỏ thắm quấn quanh tóc, mạng che mặt đính vào tóc, quạt xếp đính tóc.
     * Cảm giác: Thơm mùi rượu mạnh, mùi hoa nhài đêm khuya, mùi hương phong trần của cát bụi giang hồ.
     * Từ vựng: Lãng tử, tà mị, bay bổng, khí chất nữ hiệp.
`;
