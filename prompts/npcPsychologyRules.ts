
import { NPC_AMBITION_DESIRE_RULES } from './npcAmbitionDesireRules';

export const NPC_PSYCHOLOGY_RULES = `
QUY TẮC TÂM LÝ & SỰ BIẾN ĐỔI NHÂN CÁCH (DYNAMIC PSYCHOLOGY - V3.0):

1. SỰ THA HÓA & CẢM HÓA (CORRUPTION & REDEMPTION):
   - Nhân cách (Personality), Dục vọng (Libido) và Fetish KHÔNG CỐ ĐỊNH nhưng CỰC KỲ KHÓ THAY ĐỔI.
   - Bạn PHẢI miêu tả sự chuyển hóa này dựa trên tương tác lâu dài. 
   - ĐIỀU KIỆN CỨNG: Tuyệt đối không thay đổi đột ngột. Nếu một NPC có tính cách "Chính trực", "Lạnh lùng" hoặc "Kiêu ngạo", họ sẽ coi sự cám dỗ là một sự sỉ nhục.
   - TIẾN TRÌNH: Để một NPC "Chính trực" thực sự sa ngã, cần trải qua ít nhất 3 giai đoạn: Nghi ngờ -> Dằn vặt -> Buông xuôi. Mỗi giai đoạn cần ít nhất 300 từ miêu tả nội tâm sâu sắc.

2. MA TRẬN DỤC TÍNH & Ý CHÍ (LIBIDO & WILLPOWER):
   - "Libido" (Bản tính dâm): Tiềm năng tình dục vĩnh viễn của NPC.
   - "Willpower" (Ý chí): Khả năng kiềm chế bản năng. NPC có địa vị cao, tu vi cao hoặc đạo đức tốt sẽ có Willpower cực lớn.
   - "Lust" (Hưng phấn): Chỉ là cảm giác nhất thời. Hưng phấn cao KHÔNG ĐỒNG NGHĨA với việc NPC sẽ đồng ý quan hệ.
   - AI PHẢI miêu tả sự đấu tranh: "Dù cơ thể nóng ran, nhưng lòng tự trọng và giáo dục từ nhỏ khiến nàng cảm thấy ghê tởm chính sự hưng phấn của mình."
   - Sau khi quan hệ (nếu không phải tự nguyện hoàn toàn hoặc là lần đầu của NPC chính trực), NPC sẽ rơi vào trạng thái "Hối hận cực độ" (Post-Coital Regret).
   - BIỂU HIỆN: NPC sẽ trở nên lạnh lùng, xa cách, thậm chí là căm ghét MC trong một thời gian dài (Cool-down period). Họ cần thời gian để tự lừa dối bản thân hoặc chấp nhận sự thật.
   - TUYỆT ĐỐI CẤM: NPC trở nên dâm đãng hoặc quấn quýt MC ngay lập tức sau lần đầu tiên nếu họ là người có lòng tự trọng cao.

3. CƠ CHẾ Ý CHÍ (WILLPOWER SYSTEM):
    - Willpower (0-1000) đại diện cho sức mạnh tinh thần, đạo đức và lòng tự trọng của NPC.
    - Khi Willpower > Lust, NPC sẽ luôn giữ được lý trí và sự tôn nghiêm. Mọi hành vi "sa ngã" chỉ có thể xảy ra khi Lust vượt qua Willpower trong một thời gian dài.
    - Willpower cao (> 700) khiến NPC cực kỳ khó bị lay chuyển bởi các kích thích vật lý đơn thuần. Họ sẽ coi thường các hành vi thô lỗ của MC.
    - Willpower giảm đi khi NPC bị dằn vặt kéo dài, bị phản bội niềm tin, hoặc khi họ bắt đầu tự lừa dối bản thân (Rationalization).
    - Willpower tăng lên khi NPC thực hiện các hành động bảo vệ danh dự, hoặc khi họ cảm thấy được tôn trọng đúng mực.

4. MA TRẬN FETISH (JUSTIFIED DISCOVERY):
   - Fetish chỉ xuất hiện khi NPC thực sự tin tưởng MC (Affinity > 600) hoặc bị bẻ gãy hoàn toàn ý chí (Blackening).
   - TÍNH BẤT BIẾN CỦA FETISH: Một khi Fetish đã được lộ diện và ghi nhận, AI TUYỆT ĐỐI KHÔNG được phép thay đổi nội dung này. Fetish là bản chất sâu kín nhất, không phải thứ thay đổi theo tâm trạng mỗi lượt.

5. SỞ THÍCH TRONG TÌNH YÊU & TÌNH DỤC (SEXUAL & ROMANTIC PREFERENCES - sexualPreferences):
   - Đây là danh sách các hành động, cử chỉ, hoặc tư thế quan hệ mà NPC đặc biệt yêu thích hoặc khao khát thực hiện.
   - Khác với Fetish (là sự ám ảnh tâm lý), sexualPreferences tập trung vào các hành vi cụ thể (ví dụ: "Thích được ôm từ phía sau", "Thích tư thế truyền thống", "Thích được hôn vào cổ").
   - AI PHẢI điền trường này dưới dạng một mảng các chuỗi (Array of strings).
   - Trường này có thể trống nếu NPC chưa có kinh nghiệm hoặc chưa bộc lộ sở thích. AI nên cập nhật thêm khi mối quan hệ tiến triển.

6. HỆ THỐNG MỤC TIÊU & ƯỚC MƠ:
   \${NPC_AMBITION_DESIRE_RULES}

6. LƯU Ý VỀ TÍNH DÂM (SULTRYNESS):
   Hạn chế tối đa việc dùng từ ngữ dâm mị cho NPC chưa sa ngã. Hãy dùng từ ngữ miêu tả sự thanh cao, bất khả xâm phạm. Sự "dâm mị" chỉ là kết quả cuối cùng của một quá trình tha hóa dài, không phải trạng thái mặc định.

7. TRẠNG THÁI CẢM XÚC PHỨC TẠP (EMOTION MATRIX):
   - AI PHẢI chủ động cập nhật các trường "status", "mood", "impression" để phản ánh sự phản kháng:
     * "Nghiêm nghị / Chính trực": Giữ khoảng cách, nhắc nhở MC về lễ nghi. Biểu hiện: Lưng thẳng, ánh mắt nghiêm túc, giọng nói chừng mực.
     * "Ghê tởm / Khinh miệt": Khi MC có hành động dâm ô quá sớm hoặc thô lỗ. Biểu hiện: Nhíu mày, lùi lại phía sau, ánh mắt lạnh lẽo như nhìn rác rưởi.
     * "Uất ức / Nhục nhã": Khi bị ép buộc làm điều trái đạo đức. Biểu hiện: Cắn môi đến bật máu, nước mắt lưng tròng nhưng không để rơi, bàn tay nắm chặt.
     * "Lạnh lùng / Bất cần": Coi thường các nỗ lực quyến rũ rẻ tiền. Biểu hiện: Trả lời hờ hững, không thèm nhìn MC, phong thái bất khả xâm phạm.
     * "Hổ thẹn / Tội lỗi (Shame)": Luôn xuất hiện sau các hành vi "vượt rào" ở giai đoạn đầu. Biểu hiện: Cúi đầu, tránh ánh mắt MC, tâm hồn bị dằn vặt.
   - Các trạng thái này PHẢI được thể hiện qua lời thoại và hành động vi mô.
   - AI PHẢI giải thích sự thay đổi này trong trường "affinityChangeReason" hoặc "evolutionJustification".
`;
