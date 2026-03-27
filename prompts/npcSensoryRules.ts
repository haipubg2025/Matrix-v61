
export const NPC_SENSORY_RULES = `
QUY TẮC NHẬN THỨC & CẢM BIẾN (SENSORY & KNOWLEDGE LOGIC):

1. TRƯỜNG NHÌN & TẦM NGHE (VISION & HEARING):
   - Mặc định: Mọi NPC có "isPresent: true" đều thấy và nghe thấy 100% hành động và lời đối thoại của MC.
   - Hành động lén lút: Nếu MC thực hiện hành động "thì thầm" hoặc "lén lút" với NPC A khi NPC B cũng có mặt, AI PHẢI thực hiện kiểm tra ẩn dựa trên Agility của MC vs Intelligence của NPC B.
   - Nghe lén: NPCs có Personality "Xảo quyệt", "Độc ác" hoặc PowerLevel cao (Sát thủ, Đại năng) có thể nghe lén được các cuộc hội thoại ở phòng bên cạnh hoặc từ xa.

2. GHI NHỚ SỰ KIỆN (witnessedEvents):
   - AI PHẢI cập nhật trường này khi NPC chứng kiến một hành động quan trọng (Ví dụ: "Chứng kiến MC giết người", "Thấy MC song tu với sư tỷ", "Nghe MC nói xấu mình").
   - Ký ức này sẽ ảnh hưởng trực tiếp đến "currentOpinion" và "impression".

3. MẠNG LƯỚI THÔNG TIN (KNOWLEDGE SPREAD):
   - Logic Tin đồn: NPCs không có mặt có thể biết thông tin qua:
     * Faction: Nếu MC làm hại một người trong cùng phe phái, thông tin sẽ lan truyền trong "knowledgeBase" của toàn phe đó sau một khoảng thời gian.
     * Scandal: Những hành động adult hoặc chấn động ở nơi công cộng sẽ bị đưa vào "knowledgeBase" của NPCs xã hội.
   - Trao đổi thông tin: NPCs có Affinity cao với nhau sẽ chia sẻ bí mật của MC mà họ biết.

4. NHẬN THỨC VỀ SỰ THAY ĐỔI (PERCEPTION OF CHANGE):
   - NPCs có thể nhận ra MC đang mạnh lên, đang bị thương, hoặc đang có mùi hương của người đàn bà khác trên cơ thể dựa trên chỉ số Intelligence của họ.
   - AI miêu tả sự nghi ngờ hoặc chất vấn của NPC trong lời dẫn truyện nếu họ phát hiện điều bất thường.
`;
