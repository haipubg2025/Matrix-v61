
export interface ArchetypeData {
  height: string;
  weight: string;
  measurements: string;
  heightVal: number;
  weightVal: number;
  cup?: string;
}

const generateMatrix = (mode: 'standard' | 'gym'): Record<number, ArchetypeData> => {
  const matrix: Record<number, ArchetypeData> = {};
  for (let h = 140; h <= 185; h++) {
    let weight: number, v1: number, v2: number, v3: number, cup: string;
    const progress = (h - 140) / 40;
    if (mode === 'standard') {
      // Cân nặng tối đa 80kg kể cả khi cao 1m85
      weight = Math.min(Math.round(34 + (progress * 40)), 80); 
      v2 = Math.round(54 + (progress * 15));
      if (h < 148) cup = 'A';
      else if (h < 156) cup = 'B';
      else if (h < 165) cup = 'C';
      else if (h < 175) cup = 'D';
      else cup = 'E';
      const cupOffset = (cup.charCodeAt(0) - 64) * 6; 
      v1 = v2 + cupOffset + 8; 
      v3 = v2 + 22 + Math.floor(progress * 4); 
    } else {
      weight = Math.min(Math.round(38 + (progress * 46)), 80); 
      v2 = Math.round(49 + (progress * 14));
      if (h < 145) cup = 'A';
      else if (h < 158) cup = 'B';
      else if (h < 172) cup = 'C';
      else cup = 'D';
      const cupOffset = (cup.charCodeAt(0) - 64) * 7; 
      v1 = v2 + cupOffset + 10; 
      v3 = v2 + 28 + Math.floor(progress * 5); 
    }
    matrix[h] = {
      height: `${Math.floor(h/100)}m${h%100 < 10 ? '0' : ''}${h%100}`,
      weight: `${weight}kg`,
      measurements: `${v1}-${v2}-${v3}`,
      heightVal: h,
      weightVal: weight,
      cup: cup
    };
  }
  return matrix;
};

export const STANDARD_MATRIX = generateMatrix('standard');
export const GYM_WARRIOR_MATRIX = generateMatrix('gym');

export const SPECIAL_ARCHETYPES: Record<string, ArchetypeData> = {
  skinny: { height: "1m65", weight: "42kg", measurements: "78-52-80", heightVal: 165, weightVal: 42, cup: "A" },
  curvy:  { height: "1m65", weight: "62kg", measurements: "98-60-100", heightVal: 165, weightVal: 62, cup: "F" },
  plump:  { height: "1m65", weight: "78kg", measurements: "105-72-108", heightVal: 165, weightVal: 78, cup: "G" }
};

export const BODY_ARCHETYPES = { ...SPECIAL_ARCHETYPES };

export const SHAPE_SCANNER = {
  skinny:   /gầy gò|ốm yếu|mảnh khảnh|nhẹ cân|xương xẩu|lưỡi cày|da bọc xương/i,
  slim:     /thanh mảnh|thon thả|mảnh mai|dáng hạc|mỏng manh/i,
  standard: /bình thường|cân đối|phổ thông|hài hòa|chuẩn mực/i,
  fit:      /vừa vặn|gọn gàng|săn chắc nhẹ|khỏe khoắn/i,
  gym:      /tập gym|thể thao|fitness|vận động viên|cơ bụng|eo thon mông nở|rãnh bụng| PT |cơ bắp|săn chắc|chiến binh|nữ hiệp|kỵ sĩ|võ sĩ|đấu sĩ|binh lính|rèn luyện|chiến đấu|thao trường|thân thủ|võ giả|đùi mật ong/i,
  curvy:    /nảy nở|uốn lượn|quyến rũ|nóng bỏng|đầy đặn v1|mông to|bốc lửa|ngực khủng/i,
  plump:    /mũm mĩm|đẫy đà|phổng phao|xôi thịt|tròn trịa|mập mạp|đầy đặn/i
};

export const BIOMETRIC_EXTRACTOR = {
  height: /(?:cao|chiều cao)\s*(\d[m,.]\d{2}|\d{3})/i, 
  weight: /(?:nặng|cân nặng)\s*(\d{2,3})\s*(?:kg|ký|cân)/i 
};

export const CUP_SCANNER = {
  regex: /cup\s+([a-h])/i,
  mapping: {
    extreme: ['h', 'g', 'f'],
    large: ['e', 'd'],
    medium: ['c'],
    small: ['b'],
    flat: ['a']
  }
};

export const BREAST_WEIGHT_OFFSET: Record<string, number> = {
  flat: 0.2,
  small: 0.5,
  medium: 1.0,
  large: 1.8,
  extreme: 3.5
};
