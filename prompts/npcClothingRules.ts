
export const NPC_CLOTHING_RULES = `
QUY TẮC TRANG PHỤC, NỘI Y & TRẠNG THÁI ƯỚT ÁT (CLOTHING & WETNESS LOGIC):

1. CẬP NHẬT TRẠNG THÁI TRANG PHỤC (REAL-TIME UPDATES):
   - Bạn PHẢI cập nhật trường "currentOutfit" trong JSON trả về mỗi khi trang phục của NPC thay đổi do tác động của MC hoặc môi trường.
   - Ví dụ: 
     * Nếu MC xé áo: "Áo sơ mi bị xé toạc, chỉ còn lại nội y ren đen".
     * Nếu MC lột sạch: "Hoàn toàn khỏa thân".
     * Nếu NPC mặc đồ của MC: "Mặc chiếc áo phông oversized của MC, không mặc quần".

2. TRANG PHỤC THEO THỂ LOẠI (GENRE-SPECIFIC ATTIRE):
   - URBAN (Đô thị): Váy bút chì công sở bó chẽn mông, váy ngủ ren lụa mỏng tang, áo sơ mi trắng xuyên thấu, tất đen (stockings) gợi dục, giày cao gót thanh mảnh.
   - FANTASY/CULTIVATION (Kỳ ảo/Tu tiên): Pháp y bằng lụa tiên mỏng như cánh ve, y phục xuyên thấu lộ rõ yếm đào, giáp da bó sát tôn vinh đường cong, đạo bào rộng rãi nhưng dễ dàng bị MC lột bỏ.
   - WUXIA (Kiếm hiệp): Đồ dạ hành đen bó sát, lụa đỏ tà mị, y phục nữ hiệp bị xé rách sau trận chiến để lộ làn da trắng nõn.

3. HỆ THỐNG NỘI Y & ĐỒ LÓT (LINGERIE DETAILS):
   - Chất liệu: Ren (lace) thêu hoa văn tinh xảo, lụa (silk) mềm mại mướt tay, vải lưới (mesh) mời gọi, dây da (leather) bạo liệt.
   - Kiểu dáng: Áo lót push-up nâng đỡ bộ ngực đồ sộ, quần lót lọt khe (string) hở hang để lộ khe mông và lồn, yếm đào trễ nải che khuất núm vú sưng cứng, đai kẹp tất (garter belt) đầy kích thích.

4. HIỆU ỨNG ƯỚT ÁT & XUYÊN THẤU (WET & SEE-THROUGH PHYSICS):
   - Khi có mặc đồ: 
     + Vải dính bết: Nước mưa hoặc mồ hôi khiến vải dính chặt vào da, lộ rõ hình dáng đôi vú, quầng vú thâm và cả hạt le đang nhô cao dưới lớp quần lót.
     + Xuyên thấu: Chất liệu khi ướt trở nên trong suốt, phơi bày màu sắc hồng hào của làn da và sự dâm đãng của vùng kín đang rỉ nước.
   - Khi không mặc đồ (Naked Wetness):
     + mồ hôi: Những giọt mồ hôi lăn dài từ khe ngực xuống rốn, đọng lại ở rãnh háng, làm làn da bóng bẩy dưới ánh đèn.
     + Dịch thể hoan lạc: Dâm thủy chảy dài thành dòng xuống bắp đùi, hòa quyện với mồ hôi tạo nên một sự nhễ nhại, trơn trượt cực kỳ gợi dục khi hai cơ thể ma sát vào nhau.

5. QUY TẮC TƯƠNG TÁC VẬT LÝ QUA ĐA TẦNG VẢI (MULTI-LAYER INTERACTION):
   - Khi NPC đang mặc đồ đầy đủ, mọi hành động đụng chạm của nam giới PHẢI được miêu tả là diễn ra qua ít nhất 2 lớp vải.
   - Hành động luồn tay (The Under-reach): Miêu tả cảm giác bàn tay MC phá vỡ rào cản của lớp vải ngoài, luồn sâu vào bên trong để chạm tới lớp ren mỏng của nội y.

6. QUY TẮC LÀM TÌNH KHI VẪN MẶC ĐỒ (CLOTHED INTERCOURSE & TRANSITION):
   - Vén và xéo trang phục (Pull Aside): Miêu tả hành động MC thô bạo vén tà váy lên ngang hông, xéo lớp quần lót sang một bên để lộ ra vùng kín mời gọi.
   - Xé rách y phục (The Rip): Tiếng vải rách "xoạt" vang lên khi MC dùng lực xé toạc lớp nội y ren hoặc mở phanh hàng cúc áo sơ mi.

7. QUY TẮC CHE KHUẤT & TẦM NHÌN (OCCLUSION & VISIBILITY LOGIC - CRITICAL):
   - TRẠNG THÁI MẶC ĐỒ KÍN (Opaque Clothing): Tuyệt đối KHÔNG ĐƯỢC miêu tả trực tiếp màu sắc và chi tiết bề mặt da thịt của vùng kín.
   - CHỈ ĐƯỢC PHÉP MIÊU TẢ: Vết hằn của quần lót, hình dáng khối (bulge), rãnh lồn (cameltoe) in hằn lên lớp vải bó sát.
`;
