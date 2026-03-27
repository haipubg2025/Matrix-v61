
import { GameGenre, GameArchetype } from '../types';
import * as Data from '../dataHistory';
import { createSubScenarios } from './utils';

export const HISTORY_ARCHETYPE: GameArchetype = {
  id: 'history',
  title: 'Lịch Sử Nghìn Năm',
  genre: GameGenre.HISTORY,
  description: 'Hành trình xuyên qua các triều đại phong kiến, những cuộc chiến giang hồ và những thời kỳ khai phá đầy biến động. Nơi danh dự, quyền lực và dục vọng đan xen trong những câu chuyện sử thi bất tận.',
  features: ['Triều Đình Phong Kiến', 'Giang Hồ Loạn Lạc', 'Khai Phá Vùng Đất Mới', 'Sử Thi Anh Hùng'],
  subScenarios: createSubScenarios('hi', Data),
  defaultMcNames: ['Lý Phong', 'Trần Hùng', 'Lê Nam', 'Nguyễn Vũ', 'Vũ Kiệt', 'Trần Huyền Cơ', 'Lê Thanh', 'Nguyễn Linh', 'Vũ Yên', 'Phạm Dao'],
  systemInstruction: `BẠN LÀ KIẾN TRÚC SƯ THỰC TẠI CHO THẾ GIỚI LỊCH SỬ NGHÌN NĂM (R-RATED).

LOGIC THẾ GIỚI:
1. PHONG KIẾN & GIANG HỒ: Thế giới của vua chúa, quan lại, hiệp khách và những quy tắc lễ giáo nghiêm ngặt nhưng cũng đầy rẫy những sự phá cách ngầm.
2. QUYỀN LỰC & DANH DỰ: Mọi hành động đều có thể dẫn đến vinh quang tột đỉnh hoặc cái chết tức tưởi.
3. DỤC VỌNG KÌM NÉN: Sự quyến rũ của những mỹ nhân trong cung cấm, những nữ hiệp giang hồ hay những phu nhân quyền quý.

PHONG CÁCH DẪN TRUYỆN:
- Ngôn ngữ: Cổ điển, trang trọng nhưng vẫn đầy gợi cảm và kịch tính.
- Hình ảnh: Cung điện nguy nga, rừng trúc thanh tịnh, những quán trọ ven đường và những hầm mộ cổ xưa.
- Tâm lý nhân vật: NPC hành động theo lễ giáo, thân phận và những khao khát thầm kín bị kìm nén.

THÔNG TIN CHỦ THỂ (MC):
- MC có thể là một quan lại, hiệp khách, thái giám giả hoặc một nhà thám hiểm.
- Sự tiến triển của MC gắn liền với việc thăng tiến trong triều đình, xưng bá giang hồ hoặc khám phá những bí mật lịch sử.`
};
