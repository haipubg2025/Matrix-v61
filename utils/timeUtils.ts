
/**
 * Synchronizes age and birth year based on the current world year.
 * 
 * @param field The field being changed ('age' or 'birthday')
 * @param value The new value for the field
 * @param currentYear The current year in the game world
 * @param currentData The current object containing age and birthday
 * @returns An object with updated age and birthday
 */
export const syncAgeAndBirthday = (
  field: 'age' | 'birthday',
  value: any,
  currentYear: number,
  currentData: { age?: number | string; birthday?: string }
) => {
  let updatedAge = currentData.age;
  let updatedBirthday = currentData.birthday;

  if (field === 'age') {
    const newAge = parseInt(value) || 0;
    updatedAge = newAge;
    
    // Extract day and month from existing birthday if possible
    let day = 1;
    let month = 1;
    if (currentData.birthday) {
      const parts = currentData.birthday.match(/(\d+)/g);
      if (parts && parts.length >= 2) {
        day = parseInt(parts[0]) || 1;
        month = parseInt(parts[1]) || 1;
      }
    }
    
    // Calculate new birth year: BirthYear = CurrentYear - Age
    const birthYear = currentYear - newAge;
    updatedBirthday = `Ngày ${day} Tháng ${month} Năm ${birthYear}`;
  } 
  else if (field === 'birthday') {
    updatedBirthday = value;
    
    // Try to parse the year from the birthday string
    const parts = value.match(/Năm\s+(\d+)/i) || value.match(/(\d+)$/);
    if (parts && parts[1]) {
      const birthYear = parseInt(parts[1]);
      if (!isNaN(birthYear)) {
        // Calculate new age: Age = CurrentYear - BirthYear
        updatedAge = currentYear - birthYear;
      }
    }
  }

  return { age: updatedAge, birthday: updatedBirthday };
};

/**
 * Calculates the day of the week for a given date.
 * 
 * @param year The year
 * @param month The month (1-12)
 * @param day The day (1-31)
 * @returns The day of the week in Vietnamese
 */
export const getDayOfWeek = (year: number, month: number, day: number): string => {
  if (year <= 0 || month <= 0 || day <= 0) return "";
  
  // For years < 100, JS Date interprets them as 1900 + year.
  // We use setFullYear to handle this correctly.
  const date = new Date();
  date.setFullYear(year, month - 1, day);
  
  const days = ["Chủ Nhật", "Thứ Hai", "Thứ Ba", "Thứ Tư", "Thứ Năm", "Thứ Sáu", "Thứ Bảy"];
  return days[date.getDay()];
};

/**
 * Gets the Can Chi (Sexagenary cycle) name for a given year.
 * 
 * @param year The year
 * @returns The Can Chi name in Vietnamese
 */
export const getYearCanChi = (year: number): string => {
  if (year <= 0) return "";
  const CAN = ["Giáp", "Ất", "Bính", "Đinh", "Mậu", "Kỷ", "Canh", "Tân", "Nhâm", "Quý"];
  const CHI = ["Tý", "Sửu", "Dần", "Mão", "Thìn", "Tỵ", "Ngọ", "Mùi", "Thân", "Dậu", "Tuất", "Hợi"];
  
  // Formula for Can: (year + 6) % 10
  // Formula for Chi: (year + 8) % 12
  // Note: These formulas work for positive years.
  const canIndex = (year + 6) % 10;
  const chiIndex = (year + 8) % 12;
  
  return `${CAN[canIndex]} ${CHI[chiIndex]}`;
};
