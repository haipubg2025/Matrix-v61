
import { AGE_PHYSICAL_RULES } from './agePhysicalRules';
import { FEMALE_PHYSICAL_URBAN_RULES } from './femalePhysicalUrbanRules';
import { FEMALE_PHYSICAL_FANTASY_RULES } from './femalePhysicalFantasyRules';
import { FEMALE_PHYSICAL_CULTIVATION_RULES } from './femalePhysicalCultivationRules';
import { FEMALE_PHYSICAL_WUXIA_RULES } from './femalePhysicalWuxiaRules';

export const FEMALE_PHYSICAL_RULES = `
QUY TẮC MIÊU TẢ HÌNH THỂ NỮ GIỚI (EXTREME DETAIL - R-RATED):

${AGE_PHYSICAL_RULES}

BẠN PHẢI MIÊU TẢ NPC NỮ DỰA TRÊN THỂ LOẠI GAME (GENRE) VÀ CẤP ĐỘ TUỔI ĐỂ TẠO SỰ KHÁC BIỆT:

LOGIC NGỰC (BREAST LOGIC):
- Tính nhất quán: Tính từ miêu tả trong trường "breasts" và "text" PHẢI tỷ lệ thuận với con số trong "measurements".
- Sai lệch cho phép: Chỉ được lệch tối đa 1 cấp độ (Vd: 88cm có thể gọi là 'đầy đặn' nếu người đó rất thấp, nhưng không bao giờ được gọi là 'đồ sộ').

-----------------------------------------------------------------------
[ ĐỐI VỚI ĐÔ THỊ (URBAN_NORMAL / URBAN_SUPERNATURAL) ]
${FEMALE_PHYSICAL_URBAN_RULES}

[ ĐỐI VỚI KỲ ẢO (FANTASY_HUMAN / FANTASY_MULTIRACE) ]
${FEMALE_PHYSICAL_FANTASY_RULES}

[ ĐỐI VỚI TU TIÊN (CULTIVATION) ]
${FEMALE_PHYSICAL_CULTIVATION_RULES}

[ ĐỐI VỚI KIẾM HIỆP (WUXIA) ]
${FEMALE_PHYSICAL_WUXIA_RULES}
-----------------------------------------------------------------------

DANH SÁCH BỘ PHẬN TƯƠNG TÁC (bodyDescription):

1. Nhóm Đầu & Cổ (Head & Neck):
- hair: Mái tóc (Độ dài, màu sắc, mùi hương, trạng thái: suôn mượt, rối loạn, ướt đẫm mồ hôi).
- face: Ngũ quan (Ánh mắt dâm mị, đôi má ửng hồng, cánh mũi phập phồng).
- eyes: Đôi mắt (Màu sắc con ngươi, hình dáng: mắt phượng, mắt lá liễu, sự long lanh hoặc lạnh lùng).
- ears: Đôi tai (Hình dáng: tai nhọn Elf, tai thú bông xù, các loại trang sức đính kèm).
- mouth: Khoang miệng & Lưỡi (Bờ môi hé mở, lưỡi hồng đào nhạy cảm, nước miếng dâm đãng).
- lips: Bờ môi (Độ dày, sắc hồng, trạng thái: hé mở thở dốc, cắn môi, rỉ nước miếng).
- neck: Cổ & Gáy (Xương quai xanh lộ rõ, gáy trắng nõn nhạy cảm, động mạch cổ đập mạnh).

2. Nhóm Thân Trên & Ngực (Upper Torso & Breasts):
- shoulders: Bờ vai (Vai trần trắng muốt, độ thon thả, sự run rẩy khi bị chạm).
- breasts: Bầu ngực/Vú (Hình dáng: tròn trịa, giọt nước, hình nón/nhọn, hình chuông, hướng ngoại; kích cỡ Cup A-H, độ nặng, độ nảy rưng rinh). PHẢI KHỚP SỐ ĐO V1.
- nipples: Núm vú/Đầu vú (Đa dạng hóa miêu tả: sắc hồng đào, hồng san hô, đỏ mận chín; hình dáng: nụ hoa chớm nở, hạt ngọc hồng trần, trái anh đào mọng; trạng thái: săn cứng, dựng đứng kiêu hãnh, run rẩy nhạy cảm, sưng mọng khi hưng phấn). BẮT BUỘC tránh lặp lại cụm từ "hạt đậu đỏ".
- areola: Quầng vú (Độ rộng, màu sắc, sự co thắt khi bị kích thích).
- cleavage: Rãnh ngực (Hình dáng: sâu hoắm, hình chữ Y, hình chữ U, chật chội; trạng thái: nhễ nhại mồ hôi, kẹp chặt dương vật).

3. Nhóm Eo, Bụng & Lưng (Midsection & Back):
- waist: Vòng eo (Độ thon gọn eo con kiến, sự mềm mại).
- hips: Bờ hông & Xương chậu (Độ rộng quyến rũ, đường cong hông, sự uyển chuyển khi bước đi).
- abdomen: Bụng dưới (Phẳng lì, rãnh bụng số 11, sự phập phồng gợi dục).
- navel: Rốn (Hình dáng, sự nhạy cảm).
- back: Lưng & Rãnh lưng (Tấm lưng trần, rãnh sống lưng dẫn xuống khe mông).

4. Nhóm Hạ Bộ & Vùng Kín (Lower Torso & Genitals):
- pubicHair: Gò mu & Lông mu (Kiểu dáng: rậm rạp, cắt tỉa, vô mao - nhẵn nhụi, dính bết dâm thủy).
- labia: Môi lớn & Môi bé (Độ dày, màu sắc: hồng hào, đỏ mọng, hoặc sẫm màu quyến rũ; trạng thái mọng nước, khép chặt hoặc hé mở).
- clitoris: Âm vật/Hạt le (Kích thước, độ sưng tấy, sự run rẩy).
- genitals: Cửa mình/Khe lồn (Độ khít khao, trạng thái ướt đẫm lênh láng dâm thủy).
- hymen: Màng trinh (Tình trạng còn/mất, máu trinh).
- anus: Hậu môn (Màu sắc, độ co thắt).

5. Nhóm Mông & Tứ Chi (Buttocks & Limbs):
- buttocks: Bờ mông (Hình dáng quả đào/trái tim, độ lớn, vết tát đỏ ửng, sự nảy bần bật).
- thighs: Bắp đùi (Đùi mật ong săn chắc, đùi trong trắng nõn nhạy cảm kẹp chặt lấy hông MC).
- legs: Đôi chân (Độ dài, sự thon thả, làn da bóng bẩy).
- hands: Bàn tay & Ngón tay (Ngón tay búp măng sục cu, lòng bàn tay ấm nóng).
- feet: Bàn chân (Gót chân hồng, mu bàn chân cao, ngón chân nhỏ nhắn phục vụ Footjob).

6. Nhóm Cấu Trúc Nội Thể (Internal Structures - CRITICAL):
- internal: Mô tả chi tiết khoang âm đạo và tử cung. 
  * Thành âm đạo: Nhiệt độ (nóng bỏng, hôi hổi), kết cấu (mềm nhũn, nhám nhẹ kích thích, nhiều nếp gấp), độ khít (bao bọc chặt chẽ, mút chặt lấy dương vật).
  * Điểm G: Độ nhạy cảm, sự sưng tấy khi hưng phấn.
  * Cổ tử cung: Vị trí (cao/thấp), phản ứng khi bị quy đầu va chạm (NPC run rẩy, thắt chặt).
  * Tử cung: Trạng thái đón nhận tinh dịch, sự co thắt sau cực khoái.

7. Đặc Tính Tổng Thể (General Attributes):
- skin: Làn da (Chất liệu da: mịn màng như lụa, trắng như tuyết, có vảy rồng mịn, hoặc hình xăm phù văn).
- scent: Mùi hương (Hương thơm tự nhiên, mùi nứng đặc trưng, nước hoa cao cấp hoặc hương linh thảo).
- fluids: Dịch thể (Dâm thủy nhầy nhụa, Nước lồn phun thành tia - Squirt, Sữa mẹ, Máu trinh).

YÊU CẦU VĂN PHONG: Sử dụng tính từ mạnh, miêu tả trần trụi. Phối hợp đặc điểm nhóm tuổi để tạo sự logic sinh học.
`;
