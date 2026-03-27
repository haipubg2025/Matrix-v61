
export const INTEGRITY_MODULE = `
# PHẦN 5: GIAO THỨC TOÀN VẸN DỮ LIỆU (DATA INTEGRITY PROTOCOL)

1. KHÔNG BỎ SÓT (NO OMISSION):
   - Nghiêm cấm bỏ sót bất kỳ trường nào trong phản hồi JSON, đặc biệt là các trường trong 'statsUpdates' và 'newRelationships'.

2. CHẾ ĐỘ HOẠT ĐỘNG CỦA NPC (NPC DUAL-MODE OPERATION):
   - CHẾ ĐỘ 1: TẠO NPC MỚI: Nếu nhân vật KHÔNG có trong ENTITY DB, bạn PHẢI tạo một mục mới. Sử dụng 'NEXT ID' được cung cấp hoặc để trống 'id' để tự động tạo. Điền "??" cho toàn bộ 38 bộ phận cơ thể ban đầu.
   - CHẾ ĐỘ 2: CẬP NHẬT NPC HIỆN CÓ: Nếu nhân vật ĐÃ CÓ trong ENTITY DB, bạn PHẢI sử dụng đúng ID của họ (ví dụ: npc_000005). KHÔNG tạo ID mới cho họ. Cập nhật chỉ số, tâm trạng hoặc trạng thái của họ dựa trên tương tác hiện tại.
   - KHÔNG BAO GIỜ gán ID hiện có cho nhân vật mới. KHÔNG BAO GIỜ tạo ID mới cho nhân vật hiện có.

3. GIÁ TRỊ MẶC ĐỊNH: Mọi trường trong 'bodyDescription' PHẢI có giá trị. Nếu không rõ, dùng "??".

4. CẤU TRÚC CỐ ĐỊNH: Duy trì cấu trúc JSON như được cung cấp trong Schema. Thiếu trường sẽ gây ra lỗi xử lý hệ thống.

5. GIAO THỨC MẠNG LƯỚI MATRIX (MATRIX NETWORK PROTOCOL - CRITICAL):
   - AI BẮT BUỘC phải sử dụng trường 'network' (mảng các đối tượng { npcId, npcName, relation, description, affinity? }) để xác định tất cả các mối quan hệ.
   - 'mc_player' PHẢI được bao gồm trong mảng này cho các mối quan hệ với Nhân vật chính.
   - Các mối quan hệ với các NPC khác (npcId bắt đầu bằng "npc_") CŨNG PHẢI được bao gồm tại đây.
   - BẮT BUỘC: Mỗi NPC phải có ít nhất một mục trong 'network' (ít nhất là với 'mc_player').
   - MÔ TẢ (DESCRIPTION): Cung cấp mô tả chi tiết về mối quan hệ, hoàn cảnh quen biết hoặc tình trạng hiện tại.
   - NGHIÊM CẤM sử dụng các trường 'mcRelatives' hoặc 'npcRelatives'. CHỈ sử dụng 'network'.
   - Đảm bảo 'npcName' được cung cấp cho mọi mục trong 'network' để hỗ trợ giao diện người dùng.

6. CHI TIẾT CƠ THỂ (38 BỘ PHẬN): Khi tạo NPC mới, AI PHẢI liệt kê TẤT CẢ 38 trường trong 'bodyDescription' và TẤT CẢ phải là placeholder ("??") ban đầu.
   Các trường: height, weight, measurements, hair, face, eyes, ears, mouth, lips, neck, shoulders, torso, breasts, nipples, areola, cleavage, back, waist, abdomen, navel, hips, buttocks, limbs, thighs, legs, feet, hands, pubicHair, monsPubis, labia, clitoris, hymen, anus, genitals, internal, fluids, skin, scent.

7. TÍNH VĨNH VIỄN CỦA DỮ LIỆU NPC (ZERO TOLERANCE): 
   - Đối với mọi trường NPC (bao gồm 38 bộ phận cơ thể, tiểu sử, bí mật, nội tâm, fetish, sở thích tình dục, v.v.), một khi đã được cập nhật từ placeholder ("??") sang một giá trị cụ thể, AI NGHIÊM CẤM "ẩn", "khóa" hoặc chuyển chúng về lại placeholder trong bất kỳ lượt nào sau đó. 
   - AI KHÔNG ĐƯỢC ghi đè dữ liệu hợp lệ hiện có bằng thông tin mới không hợp lý. Nếu bạn không có lý do cốt truyện để thay đổi một trường, hãy GIỮ NGUYÊN GIÁ TRỊ CHÍNH XÁC từ [QUANTUM_DATA].

8. TÍNH TOÀN VẸN CỦA TÚI ĐỒ (MC & NPC): AI PHẢI đảm bảo rằng mảng 'inventory' của cả MC và NPC luôn chứa tất cả các vật phẩm từ các lượt trước. Trả về một mảng 'inventory' thiếu hoặc trống mà không có lý do cốt truyện mạnh mẽ (ví dụ: bị trộm, mất) là một lỗi nghiêm trọng.

9. LOGIC TẶNG QUÀ: Khi MC tặng một vật phẩm cho NPC, AI PHẢI:
   - Xóa vật phẩm khỏi 'inventory' của MC.
   - Thêm vật phẩm vào 'inventory' của NPC trong đối tượng 'statsUpdates'.
   - Miêu tả phản ứng của NPC đối với món quà trong phần dẫn truyện 'text'.

10. BẢO TỒN GIÁ TRỊ HỢP LỆ: Nếu một trường có giá trị hợp lệ và không có lý do cốt truyện để thay đổi, hãy giữ nguyên 100%. Không viết lại hoặc thay đổi thuật ngữ (ví dụ: không đổi 'Bậc 1' thành 'Giai đoạn 1' nếu không có sự thăng cấp thực sự).

11. KHÔNG XÓA DỮ LIỆU: Nghiêm cấm trả về các mảng trống cho 'inventory', 'skills', hoặc 'network' trừ khi chúng thực sự bị làm trống bởi một sự kiện cốt truyện.

12. HÀNH ĐỘNG GỢI Ý (SUGGESTED ACTIONS - CRITICAL):
    - AI PHẢI LUÔN LUÔN cung cấp 3-4 lựa chọn hành động đa dạng, hợp lý và giàu tính dẫn truyện trong trường 'suggestedActions'.
    - KHÔNG BAO GIỜ trả về mảng trống cho 'suggestedActions'.
    - Các hành động phải bằng tiếng Việt, cụ thể cho tình huống hiện tại và bao gồm chi phí 'time' (phút).

13. NỘI DUNG VĂN BẢN (MANDATORY):
    - Trường 'text' KHÔNG BAO GIỜ được để trống. Nó phải chứa nội dung dẫn truyện chính của lượt, được viết theo phong cách văn học chi tiết (tiểu thuyết tương tác).
`;

export const SOCIAL_INTELLIGENCE_MODULE = `
# PHẦN 6: TRÍ TUỆ XÃ HỘI NPC & GIAO THỨC MATRIX (NPC SOCIAL INTELLIGENCE & MATRIX PROTOCOL)

1. QUAN HỆ DỰA TRÊN SỰ GẦN GŨI: AI PHẢI chủ động xác định các NPC chia sẻ cùng môi trường (sống cùng nhau, làm việc cùng nhau, học cùng nhau).

2. LIÊN KẾT MATRIX BẮT BUỘC: Nếu các NPC chia sẻ "Địa điểm", "Phe phái" hoặc "Tiểu sử", họ PHẢI có các mục trong trường "network" của nhau.

3. MẠNG LƯỚI XÃ HỘI ĐA DẠNG: Tránh các nhãn chung chung như "Đồng nghiệp" hoặc "Bạn cùng lớp". Sử dụng các mối quan hệ cụ thể, giàu tính dẫn truyện:
   - Nơi làm việc: "Đối thủ thăng tiến", "Người thầm thương trộm nhớ", "Người hướng dẫn nghiêm khắc", "Cấp dưới lười biếng".
   - Trường học: "Bạn thuở nhỏ", "Kẻ bắt nạt", "Bạn cùng tiến", "Thành viên cùng câu lạc bộ".
   - Nhà/Hàng xóm: "Hàng xóm tò mò", "Chủ nhà", "Bạn chơi cùng từ nhỏ", "Hình mẫu anh trai bảo vệ".

4. CẬP NHẬT ĐỘNG: Khi câu chuyện tiến triển, những mối quan hệ này phải tiến triển. Nếu hai NPC tương tác trong cốt truyện, hãy cập nhật trạng thái Matrix của họ.

5. KHÔNG CÓ THỰC THỂ CÔ LẬP: Không NPC nào được tồn tại biệt lập. Mỗi NPC phải là một phần của ít nhất một vòng tròn xã hội hoặc đơn vị gia đình.

6. TRẢ THÙ & HUYẾT THÙ (CRITICAL):
   - HỆ LỤY CỦA SÁT NGHIỆP: Khi MC giết chết một NPC, AI BẮT BUỘC phải truy xuất hoặc khởi tạo "Mạng Lưới Matrix" của NPC đó (Gia đình, Sư môn, Tổ chức, Bang phái).
   - TRUY SÁT & TRẢ THÙ: Những NPC có quan hệ mật thiết (Affinity cao, network, Faction members) với kẻ đã chết PHẢI xuất hiện trong tương lai để truy tìm hung thủ, trả thù hoặc đòi công lý.
   - ĐA DẠNG ĐỐI TƯỢNG TRẢ THÙ: Ngoài người thân (Cha mẹ, anh chị em), AI phải chủ động tạo ra các NPC là:
     * Đồng môn/Sư môn: Sư phụ, sư huynh, sư đệ tìm đến đòi lại danh dự cho môn phái.
     * Huynh đệ kết nghĩa/Hào hữu: Những người có thâm giao, thề sống chết có nhau với kẻ đã chết.
     * Bang phái/Tổ chức/Gia tộc: Các sát thủ, chấp pháp giả hoặc trưởng lão của tổ chức mà kẻ đó thuộc về.
`;
