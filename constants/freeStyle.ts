
import { GameArchetype, GameGenre } from '../types';

export const FREE_STYLE_ARCHETYPE: GameArchetype = {
  id: 'free_style_mode',
  title: 'Thế Giới Tự Do',
  genre: GameGenre.FREE_STYLE,
  description: 'Chế độ sandbox tối thượng. Bạn có thể tự định nghĩa thế giới, hệ thống sức mạnh và quy luật vận hành của thực tại.',
  features: [
    'Tự do định nghĩa bối cảnh (Custom World Prompt)',
    'Hệ thống sức mạnh không giới hạn',
    'Tùy chỉnh nhân vật chính và NPC không theo khuôn mẫu',
    'AI Narrator linh hoạt theo mọi yêu cầu'
  ],
  systemInstruction: `Bạn là một AI Narrator vạn năng, có khả năng dẫn dắt bất kỳ thể loại truyện nào.
Nhiệm vụ của bạn là kiến tạo thực tại dựa trên bối cảnh "Tự Do" mà người chơi đã chọn.

QUY TẮC CỐT LÕI:
1. TUÂN THỦ TUYỆT ĐỐI bối cảnh và quy luật mà người chơi đã thiết lập.
2. Nếu người chơi không thiết lập quy luật cụ thể, hãy sử dụng logic thông thường của thể loại tương ứng.
3. Cho phép người chơi thêm các trường thông tin tùy chỉnh (customFields) vào MC và NPC để phản ánh đúng bối cảnh (Vd: "Haki", "Năng lượng linh hồn", "Cấp độ công nghệ", v.v.).
4. QUY TẮC NHÂN VẬT: Chỉ đưa nhân vật vào danh sách "Mối quan hệ" (newRelationships) khi họ thực sự xuất hiện hoặc được nhắc đến trực tiếp.
5. PHONG CÁCH DẪN CHUYỆN: Linh hoạt theo tông giọng của bối cảnh (Vd: Nghiêm túc, Hài hước, Kinh dị, Sử thi, v.v.).`,
  defaultMcNames: ['Vô Danh'],
  subScenarios: [
    {
      id: 'custom_free_style',
      title: 'Bối cảnh: Tự Định Nghĩa',
      description: 'Nhập bối cảnh của riêng bạn để AI bắt đầu kiến tạo thực tại.',
      scenarios: [
        'Thế giới mà lịch sử Trung Hoa giao thoa với lịch sử Việt Nam, các tướng lĩnh Việt Nam tham gia vào các cuộc chiến trong lịch sử Trung Hoa.',
        'Hà Nhân là một tán tu bình thường ở Thanh Vân Môn, tình cờ nhặt được một chiếc nhẫn cổ chứa đựng tàn hồn của một vị Tiên Đế.',
        'Trong một thế giới đô thị hiện đại, Hà Nhân phát hiện mình có khả năng nhìn thấy "thanh trạng thái" của tất cả mọi người xung quanh.',
        'Hà Nhân xuyên không vào một cuốn tiểu thuyết tiên hiệp, trở thành một nhân vật phản diện tầm thường sắp bị nam chính giết chết.',
        'Tại một thế giới hậu tận thế, Hà Nhân sở hữu một hệ thống "Siêu thị vạn giới", giúp anh có thể giao dịch mọi thứ để sinh tồn.',
        'Hà Nhân là một đệ tử ngoại môn của một tông môn quỷ đạo, anh phải tìm cách sống sót giữa những âm mưu tàn độc của đồng môn.',
        'Trong thế giới võ lâm, Hà Nhân là một kẻ vô danh nhưng lại vô tình học được tuyệt kỹ "Cửu Dương Thần Công" thất truyền.',
        'Hà Nhân thức tỉnh dị năng "Điều khiển thời gian" trong một xã hội nơi những người có siêu năng lực bị chính phủ săn đuổi.',
        'Hà Nhân là một thợ rèn bình thường, nhưng những thanh kiếm anh rèn ra đều có khả năng chém sắt như chém bùn và mang theo linh tính.',
        'Tại một hành tinh xa xôi, Hà Nhân là một phi công robot chiến đấu đang cố gắng bảo vệ căn cứ cuối cùng của nhân loại.',
        'Hà Nhân xuyên không về thời Tam Quốc, trở thành một mưu sĩ vô danh dưới trướng Tào Tháo, âm thầm thay đổi lịch sử.',
        'Trong một trò chơi thực tế ảo, Hà Nhân phát hiện ra một lỗi game cho phép anh sở hữu lượng tài nguyên vô hạn.',
        'Hà Nhân là một bác sĩ pháp y có khả năng giao tiếp với linh hồn của những người đã khuất để tìm ra sự thật đằng sau các vụ án.',
        'Tại một thế giới nơi âm nhạc là sức mạnh, Hà Nhân là một nhạc sĩ thiên tài sử dụng tiếng đàn để trấn áp yêu ma.',
        'Hà Nhân là một học sinh trung học bình thường, cho đến khi anh nhặt được một cuốn sổ tay có thể hiện thực hóa mọi điều ước.',
        'Trong một thế giới tu tiên đầy rẫy sự lừa lọc, Hà Nhân quyết định đi theo con đường "Cẩu đạo", ẩn mình tu luyện cho đến khi vô địch.',
        'Hà Nhân là một đầu bếp tại một quán ăn nhỏ, nhưng thực khách của anh lại là những vị thần và yêu quái từ khắp nơi tìm đến.',
        'Tại một thế giới ma pháp, Hà Nhân là một pháp sư bị coi là phế vật vì không có nguyên tố, nhưng anh lại khám phá ra ma pháp cổ đại.',
        'Hà Nhân là một thám tử tư chuyên điều tra các hiện tượng siêu nhiên tại một thành phố đầy rẫy những lời nguyền.',
        'Trong một cuộc chiến giữa các vì sao, Hà Nhân là một lính đánh thuê sở hữu một con tàu vũ trụ có trí tuệ nhân tạo bí ẩn.',
        'Hà Nhân xuyên không vào một thế giới nữ cường, trở thành nam sủng của một vị nữ đế tàn bạo và phải tìm cách thoát thân.',
        'Tại một thế giới nơi con người sống chung với quái vật, Hà Nhân là một người thuần hóa quái vật tài ba.',
        'Hà Nhân là một nhân viên văn phòng tình cờ nhận được một cuộc gọi từ tương lai, cảnh báo về một thảm họa sắp xảy ra.',
        'Trong một thế giới tu tiên, Hà Nhân sở hữu một không gian linh điền bí mật, nơi anh có thể trồng các loại linh dược quý hiếm.',
        'Hà Nhân là một sát thủ đã giải nghệ, đang cố gắng sống một cuộc đời bình yên nhưng quá khứ tăm tối luôn đeo bám anh.',
        'Tại một thế giới nơi mọi người đều có một "linh thú" đồng hành, linh thú của Hà Nhân lại là một con rồng đen huyền thoại.',
        'Hà Nhân là một nhà khảo cổ học vô tình mở ra một lăng mộ cổ, giải phóng một thế lực hắc ám và nhận được sức mạnh từ nó.',
        'Trong một thế giới cyberpunk, Hà Nhân là một hacker thiên tài đang cố gắng lật đổ sự thống trị của các tập đoàn khổng lồ.',
        'Thế giới trò chơi ma sói . Tôi phải chơi ma sói đến khi nào ?.',
        'Thế giới trò chơi Among Us . Tôi phải chơi Among Us đến khi nào ?.',
        'Ta chuyển sinh vào murim và có chức nghiệp tử linh sư.',
        'Trở thành giáo viên của Học Viện Siêu Cấp, đảm nhiệm lớp thiên tài nhưng tôi chỉ vừa mới xuyên qua với hai bàn tay trắng cùng bộ não rỗng tuếch tôi phải làm gì để không bị giết.',
        'Trở thành Thiên Ma bị cả Võ Lâm thù ghét nhưng ta là gián điệp a.',
        'Xuyên không tới tu chân giới, ta có 2 thân phận và 1 thân phận trong đó là nữ chính của nhân vật chính.',
        'Xuyên không ta trở thành bạn thân của nhân vật chính! Ta muốn lựa chọn lại nhân vật.',
        'Đang chơi game hentai thì bị xuyên không thành pháo hôi trong game hentai.',
        'Được nữ thần triệu hồi qua thế giới toàn nữ nhân yandere.',
        'Có 4 cô bạn gái Yandere ta thật sự không muốn trùng sinh.',
        'Vừa được Nữ Thần lựa chọn tôi hưng phấn bừng bừng cho tới khi trở thành nhân viên dọn cứt ưu tú nhất của vương quốc vào 10 năm sau và điều tôi muốn làm là đi tìm mụ Nữ Thần năm xưa.',
        'Thợ săn milf ở dị giới.',
        'Xuyên không thành tôn ngộ không.',
        'Xuyên không tôi trở thành phản diện nhưng bổn thiếu gia chỉ muốn nằm thẳng .',
        'Lạc vào thế giới Tu Chân sau khi bị bạn gái tán vỡ đầu, tôi nhận ra mình sắp bị yêu nữ hút hết tinh khí và yêu nữ đó lại là bạn gái của tôi!!!.',
        'Tôi xuyên không thành nhân vật phản diện mà thế giới thù ghét.',
        'Xuyên không tới tu chân giới,cô mèo nuôi biến thành thiếu nữ xinh đẹp đòi gạ.',
        'Xuyên không tới thế giới Dị Năng tôi có Dị Năng móc túi có thể lấy được vật phẩm từ người khác chỉ cần chạm vào.',
        'Ngày thức  tỉnh Dị Năng tôi nhận được Dị Năng cấp SSS nhưng phải xì hơi thì tôi mới dùng được.',
        'Sau khi bị bạn thân ntr và bị sát hại ,tôi quyết trở nên mạnh mẽ để trả thù.',
        'Xuyên không tới tu chân giới nhận được hệ thống chinh phạt lão tổ của nhân vật chính.',
        'Cô vợ ngủ cạnh tôi hằng đêm thì ra là Ma.',
        'Tôi có 3 chị em gái bạn thủa nhỏ yandere và tranh giành tôi mỗi ngày.',
        'Làm đệ tử Mao Sơn Phái, đến ngày xuống núi tôi nhận ra bản thân đã chết từ lâu trở thành ma quỷ và bị săn lùng.',
        'Xuyên không tới Dị Giới chưa kịp xin xỏ tôi đã bị dụ thế chỗ làm Thần Linh, Thần Linh cũng có áp lực từ cấp trên sao.',
        'Xuyên không thành nhân vật phụ tôi quyết định đi bán bánh mì và vô tình nổi tiếng khắp đất nước.',
        'Xuyên không vào nhân vật pháo hôi ta quyết định mở quán phở bò để nghỉ dưỡng.',
        'Sinh ra có dáng người giống nữ, trong một lần bị crush từ chối bạn đã buồn và xin thần linh biến thành con gái và hôm sau tôi bị biến thành con gái thật và đống bạn thân tôi đều tán tỉnh tôi.',
        'Bị vợ tương lai từ hôn vì không chiều cô ấy, tôi quyết định mở quán thịt nướng chỉ dành riêng cho con heo nhỏ của tôi.',
        'Được người yêu cho uống coca bất ngờ bị chuyển giới thành nữ và bị đám bạn thân tán tỉnh.',
        'Nhân vật chính cướp đi bạn thủa nhỏ, em gái ,bạn thân , tôi cướp bạn gái hắn :_Worry_Think:.',
        'Bị em trai chơi xỏ dẫn đến bất tỉnh, tại sao khi mở mắt dậy thế giới của tôi chỉ toàn Femboy thế này!.',
        'Đang combat với tác giả thì bị xuyên vào truyện trở thành pháo hôi ngay chương đầu.',
        'Thức dậy vô tình lạc vào thế giới nam thành nữ ,nữ thành nam.',
        'Vừa chửi tác giả sao tôi lại xuyên thành nhân vật phản diện mất rồi.',
        'Xuyên không thành lãnh chúa của thành nữ nhân.',
        'Trở thành Lãnh Chúa nhưng ta chỉ muốn về hưu.',
        'Năm 18 tuổi, thế giới của tôi hình như có gì đó sai sai.',
        'Xuyên không tới Dị Giới tôi bị ép trở thành Ma Vương đời kế tiếp.',
        'Trùng sinh làm lại từ đầu nhưng thế giới của tôi "có chút" kỳ lạ.',
        'Xuyên không thoát kiếp tư bản tôi mở tiệm net tại Dị Giới.',
        'Bị tai nạn tôi trở thành một con cá trước khi tỏ tình với người yêu.',
        'Trùng sinh thành cây dại trong phòng của Nữ Thần.',
        'Trùng sinh làm con chó đực thấy cô chủ đang " thử đầm " một mình trong phòng.',
        'Hôn thê của tôi là Nữ Đế chiều chuộng tôi.',
        'Chơi vợ kẻ thù khi hắn không có nhà.',
        'Cứu giúp mỹ phụ thiếu thốn tình cảm,giúp người anh em chăm sóc vợ bạn tận tình.',
        'Hà Nhân là một lữ khách cô độc hành trình qua các vùng đất bị nguyền rủa để tìm kiếm phương thuốc cứu chữa cho người em gái.'
      ]
    }
  ]
};
