import { GameGenre } from './types';

export const GENRE_ABILITIES: Record<string, { title: string, tag: string, color: string, desc: string }[]> = {
  [GameGenre.URBAN_NORMAL]: [
    { title: "Hào quang nhân vật chính", tag: "Vận may", color: "text-yellow-400", desc: "Mọi việc đều suôn sẻ, kẻ thù tự động hạ thấp IQ." },
    { title: "Trí nhớ siêu phàm", tag: "Trí tuệ", color: "text-blue-400", desc: "Ghi nhớ mọi thứ chỉ sau một lần nhìn thấy." },
    { title: "Sức khỏe vô song", tag: "Thể chất", color: "text-emerald-400", desc: "Cơ thể đạt đến giới hạn hoàn mỹ của con người." },
    { title: "Kỹ năng giao tiếp đỉnh cao", tag: "Xã hội", color: "text-pink-400", desc: "Dễ dàng thuyết phục và chiếm được cảm tình của bất kỳ ai." },
    { title: "Tài chính vô hạn", tag: "Tiền bạc", color: "text-yellow-600", desc: "Sở hữu nguồn tài sản không bao giờ cạn kiệt." }
  ],
  [GameGenre.URBAN_SUPERNATURAL]: [
    { title: "Điều khiển trọng lực", tag: "Vật lý", color: "text-slate-600", desc: "Thay đổi trọng lực lên mục tiêu hoặc bản thân." },
    { title: "Dịch chuyển tức thời", tag: "Không gian", color: "text-blue-500", desc: "Di chuyển đến bất kỳ đâu trong tầm mắt ngay lập tức." },
    { title: "Thao túng tâm trí", tag: "Tâm linh", color: "text-purple-500", desc: "Đọc suy nghĩ và điều khiển hành động của người khác." },
    { title: "Hồi phục siêu tốc", tag: "Sinh mệnh", color: "text-red-400", desc: "Mọi vết thương đều lành lại trong nháy mắt." },
    { title: "Điều khiển nguyên tố", tag: "Tự nhiên", color: "text-orange-500", desc: "Làm chủ lửa, nước, gió hoặc đất theo ý muốn." }
  ],
  [GameGenre.CULTIVATION]: [
    { title: "Kiếm ý thông thiên", tag: "Kiếm đạo", color: "text-white", desc: "Một kiếm chém ra có thể xẻ đôi trời đất." },
    { title: "Thần thức vạn dặm", tag: "Linh hồn", color: "text-indigo-400", desc: "Quan sát mọi thứ trong phạm vi cực rộng bằng ý niệm." },
    { title: "Luyện đan thuật thái cổ", tag: "Hỗ trợ", color: "text-amber-500", desc: "Luyện chế ra những viên đan dược nghịch thiên cải mệnh." },
    { title: "Thân pháp hư không", tag: "Tốc độ", color: "text-cyan-400", desc: "Di chuyển giữa các tầng không gian như đi dạo." },
    { title: "Cấm thuật đoạt xá", tag: "Cấm kỵ", color: "text-red-900", desc: "Chiếm đoạt thân xác và tu vi của kẻ khác." }
  ],
  [GameGenre.WUXIA]: [
    { title: "Nội công thâm hậu", tag: "Nội lực", color: "text-orange-400", desc: "Khí kình mạnh mẽ, có thể dùng tay không bẻ gãy binh khí." },
    { title: "Khinh công tuyệt đỉnh", tag: "Tốc độ", color: "text-sky-400", desc: "Đạp tuyết không vết, lướt đi trên mặt nước như bay." },
    { title: "Điểm huyệt thần sầu", tag: "Kỹ thuật", color: "text-teal-400", desc: "Khống chế đối phương chỉ bằng một cái chạm nhẹ." },
    { title: "Ám khí bách phát bách trúng", tag: "Tấn công", color: "text-rose-500", desc: "Sử dụng kim châm, phi đao đạt đến mức hóa cảnh." },
    { title: "Dịch cân kinh", tag: "Tuyệt học", color: "text-yellow-500", desc: "Cải tạo kinh mạch, tăng cường sức mạnh và khả năng chịu đựng." }
  ],
  [GameGenre.FANTASY_HUMAN]: [
    { title: "Ma pháp đa hệ", tag: "Pháp thuật", color: "text-blue-500", desc: "Sử dụng được mọi loại ma pháp nguyên tố cơ bản." },
    { title: "Triệu hồi linh thú", tag: "Triệu hồi", color: "text-green-500", desc: "Gọi ra những sinh vật huyền thoại chiến đấu cùng mình." },
    { title: "Kiếm thuật thánh sáng", tag: "Chiến đấu", color: "text-yellow-200", desc: "Thanh kiếm mang năng lượng ánh sáng xua tan bóng tối." },
    { title: "Kháng ma pháp tuyệt đối", tag: "Phòng thủ", color: "text-slate-400", desc: "Vô hiệu hóa mọi tác động của ma pháp lên bản thân." },
    { title: "Chế tạo trang bị thần cấp", tag: "Kỹ nghệ", color: "text-amber-600", desc: "Tạo ra những vũ khí và giáp trụ mang sức mạnh thần thánh." }
  ],
  [GameGenre.FANTASY_MULTIRACE]: [
    { title: "Hơi thở của rồng", tag: "Hủy diệt", color: "text-red-600", desc: "Phun ra ngọn lửa có thể nung chảy cả kim cương." },
    { title: "Giao tiếp vạn vật", tag: "Tự nhiên", color: "text-emerald-300", desc: "Nghe hiểu và ra lệnh cho cây cỏ, thú vật." },
    { title: "Hút máu tăng sức mạnh", tag: "Huyết tộc", color: "text-red-900", desc: "Càng chiến đấu và uống máu, sức mạnh càng tăng cao." },
    { title: "Hóa thân khổng lồ", tag: "Thể chất", color: "text-stone-600", desc: "Biến thành người khổng lồ với sức mạnh nghiền nát mọi thứ." },
    { title: "Ma thuật hắc ám cổ đại", tag: "Cấm thuật", color: "text-purple-900", desc: "Sử dụng những quyền năng bị nguyền rủa từ thời thái cổ." }
  ]
};
