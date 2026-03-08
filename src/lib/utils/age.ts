/**
 * 生年月日から現在の年齢を計算する
 * @param birthDate 生年月日（Date型または日付文字列）
 * @returns 年齢（歳）
 */
export function calculateAge(birthDate: Date | string): number {
  const birth = typeof birthDate === "string" ? new Date(birthDate) : birthDate;
  const today = new Date();

  let age = today.getFullYear() - birth.getFullYear();
  const monthDiff = today.getMonth() - birth.getMonth();

  // 誕生日がまだ来ていない場合は1歳引く
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
    age--;
  }

  return age;
}

/**
 * 生年月日から年齢を「○○歳」の形式で取得する
 * @param birthDate 生年月日（Date型または日付文字列）
 * @returns 「○○歳」の文字列
 */
export function getAgeDisplay(birthDate: Date | string): string {
  const age = calculateAge(birthDate);
  return `${age}歳`;
}
