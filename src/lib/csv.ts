/**
 * CSV utility functions for recipient data import/export
 */

export interface RecipientCSVRow {
  氏名: string;
  氏名カナ: string;
  生年月日: string; // YYYY-MM-DD format
  性別: "男性" | "女性" | "その他";
  障害種別: string; // カンマ区切り: "身体,知的"
  障害支援区分: string; // "1" | "2" | ... | "6" | ""
  緊急連絡先: string;
  主治医: string;
  医療機関: string;
  アレルギー情報: string;
  既往歴: string;
  備考: string;
  // アセスメント情報
  ADL移動: string;
  ADL食事: string;
  ADL排泄: string;
  ADL入浴: string;
  ADL更衣: string;
  ADL整容: string;
  意思疎通方法: string;
  視覚: string;
  聴覚: string;
  発語: string;
  生活リズム: string;
  趣味嗜好: string;
  性格特徴: string;
  服薬詳細: string;
  特記事項: string;
  緊急時対応: string;
  家族構成: string;
  支援体制: string;
}

/**
 * Convert database recipient to CSV row
 */
export function recipientToCSVRow(recipient: {
  name: string;
  nameKana: string | null;
  birthDate: Date;
  gender: string;
  disabilityType: string[];
  supportLevel: number | null;
  emergencyContact: string | null;
  doctor: string | null;
  hospital: string | null;
  allergies: string | null;
  medicalHistory: string | null;
  notes: string | null;
  assessment?: {
    adlMovement: string | null;
    adlEating: string | null;
    adlToilet: string | null;
    adlBathing: string | null;
    adlDressing: string | null;
    adlGrooming: string | null;
    commMethod: string | null;
    commVision: string | null;
    commHearing: string | null;
    commSpeech: string | null;
    lifeRhythm: string | null;
    hobbies: string | null;
    personality: string | null;
    medicationDetails: string | null;
    cautions: string | null;
    emergencyNote: string | null;
    familyStructure: string | null;
    supportSystem: string | null;
  } | null;
}): RecipientCSVRow {
  const genderMap: Record<string, "男性" | "女性" | "その他"> = {
    Male: "男性",
    Female: "女性",
    Other: "その他",
  };

  const disabilityTypeMap: Record<string, string> = {
    Physical: "身体",
    Intellectual: "知的",
    Mental: "精神",
  };

  const adlMap: Record<string, string> = {
    Independent: "自立",
    Partial: "一部介助",
    Full: "全介助",
    Assisted: "介助あり",
    Wheelchair: "車椅子",
    Bedridden: "寝たきり",
  };

  const visionMap: Record<string, string> = {
    Normal: "正常",
    Weak: "弱視",
    Blind: "全盲",
  };

  const hearingMap: Record<string, string> = {
    Normal: "正常",
    Weak: "難聴",
    Deaf: "全聾",
  };

  const speechMap: Record<string, string> = {
    Normal: "可能",
    Difficult: "困難",
    None: "不可",
  };

  const a = recipient.assessment;

  return {
    氏名: recipient.name,
    氏名カナ: recipient.nameKana || "",
    生年月日: recipient.birthDate.toISOString().split("T")[0],
    性別: genderMap[recipient.gender] || "その他",
    障害種別: recipient.disabilityType
      .map((t) => disabilityTypeMap[t] || t)
      .join(","),
    障害支援区分: recipient.supportLevel ? String(recipient.supportLevel) : "",
    緊急連絡先: recipient.emergencyContact || "",
    主治医: recipient.doctor || "",
    医療機関: recipient.hospital || "",
    アレルギー情報: recipient.allergies || "",
    既往歴: recipient.medicalHistory || "",
    備考: recipient.notes || "",
    // アセスメント情報
    ADL移動: a?.adlMovement ? adlMap[a.adlMovement] || a.adlMovement : "",
    ADL食事: a?.adlEating ? adlMap[a.adlEating] || a.adlEating : "",
    ADL排泄: a?.adlToilet ? adlMap[a.adlToilet] || a.adlToilet : "",
    ADL入浴: a?.adlBathing ? adlMap[a.adlBathing] || a.adlBathing : "",
    ADL更衣: a?.adlDressing ? adlMap[a.adlDressing] || a.adlDressing : "",
    ADL整容: a?.adlGrooming ? adlMap[a.adlGrooming] || a.adlGrooming : "",
    意思疎通方法: a?.commMethod || "",
    視覚: a?.commVision ? visionMap[a.commVision] || a.commVision : "",
    聴覚: a?.commHearing ? hearingMap[a.commHearing] || a.commHearing : "",
    発語: a?.commSpeech ? speechMap[a.commSpeech] || a.commSpeech : "",
    生活リズム: a?.lifeRhythm || "",
    趣味嗜好: a?.hobbies || "",
    性格特徴: a?.personality || "",
    服薬詳細: a?.medicationDetails || "",
    特記事項: a?.cautions || "",
    緊急時対応: a?.emergencyNote || "",
    家族構成: a?.familyStructure || "",
    支援体制: a?.supportSystem || "",
  };
}

/**
 * Convert CSV row to database recipient format
 */
export function csvRowToRecipient(row: RecipientCSVRow) {
  const genderMap: Record<string, "Male" | "Female" | "Other"> = {
    男性: "Male",
    女性: "Female",
    その他: "Other",
  };

  const disabilityTypeMap: Record<
    string,
    "Physical" | "Intellectual" | "Mental"
  > = {
    身体: "Physical",
    知的: "Intellectual",
    精神: "Mental",
  };

  const adlReverseMap: Record<string, string> = {
    自立: "Independent",
    一部介助: "Partial",
    全介助: "Full",
    介助あり: "Assisted",
    車椅子: "Wheelchair",
    寝たきり: "Bedridden",
  };

  const visionReverseMap: Record<string, string> = {
    正常: "Normal",
    弱視: "Weak",
    全盲: "Blind",
  };

  const hearingReverseMap: Record<string, string> = {
    正常: "Normal",
    難聴: "Weak",
    全聾: "Deaf",
  };

  const speechReverseMap: Record<string, string> = {
    可能: "Normal",
    困難: "Difficult",
    不可: "None",
  };

  const disabilityType = row.障害種別
    ? row.障害種別
        .split(",")
        .map((t) => t.trim())
        .filter((t) => t in disabilityTypeMap)
        .map((t) => disabilityTypeMap[t as keyof typeof disabilityTypeMap])
    : [];

  const recipient = {
    name: row.氏名,
    nameKana: row.氏名カナ || undefined,
    birthDate: new Date(row.生年月日),
    gender: genderMap[row.性別] || "Other",
    disabilityType,
    supportLevel: row.障害支援区分 ? parseInt(row.障害支援区分, 10) : undefined,
    emergencyContact: row.緊急連絡先 || undefined,
    doctor: row.主治医 || undefined,
    hospital: row.医療機関 || undefined,
    allergies: row.アレルギー情報 || undefined,
    medicalHistory: row.既往歴 || undefined,
    notes: row.備考 || undefined,
  };

  // アセスメント情報（存在する場合のみ）
  const hasAssessmentData =
    row.ADL移動 ||
    row.ADL食事 ||
    row.ADL排泄 ||
    row.ADL入浴 ||
    row.ADL更衣 ||
    row.ADL整容 ||
    row.意思疎通方法 ||
    row.視覚 ||
    row.聴覚 ||
    row.発語 ||
    row.生活リズム ||
    row.趣味嗜好 ||
    row.性格特徴 ||
    row.服薬詳細 ||
    row.特記事項 ||
    row.緊急時対応 ||
    row.家族構成 ||
    row.支援体制;

  if (hasAssessmentData) {
    return {
      ...recipient,
      assessment: {
        adlMovement: row.ADL移動
          ? adlReverseMap[row.ADL移動] || undefined
          : undefined,
        adlEating: row.ADL食事
          ? adlReverseMap[row.ADL食事] || undefined
          : undefined,
        adlToilet: row.ADL排泄
          ? adlReverseMap[row.ADL排泄] || undefined
          : undefined,
        adlBathing: row.ADL入浴
          ? adlReverseMap[row.ADL入浴] || undefined
          : undefined,
        adlDressing: row.ADL更衣
          ? adlReverseMap[row.ADL更衣] || undefined
          : undefined,
        adlGrooming: row.ADL整容
          ? adlReverseMap[row.ADL整容] || undefined
          : undefined,
        commMethod: row.意思疎通方法 || undefined,
        commVision: row.視覚
          ? visionReverseMap[row.視覚] || undefined
          : undefined,
        commHearing: row.聴覚
          ? hearingReverseMap[row.聴覚] || undefined
          : undefined,
        commSpeech: row.発語
          ? speechReverseMap[row.発語] || undefined
          : undefined,
        lifeRhythm: row.生活リズム || undefined,
        hobbies: row.趣味嗜好 || undefined,
        personality: row.性格特徴 || undefined,
        medicationDetails: row.服薬詳細 || undefined,
        cautions: row.特記事項 || undefined,
        emergencyNote: row.緊急時対応 || undefined,
        familyStructure: row.家族構成 || undefined,
        supportSystem: row.支援体制 || undefined,
      },
    };
  }

  return recipient;
}

/**
 * Generate CSV string from recipients
 */
export function generateCSV(recipients: RecipientCSVRow[]): string {
  if (recipients.length === 0) {
    // Return header only
    return (
      Object.keys({
        氏名: "",
        氏名カナ: "",
        生年月日: "",
        性別: "",
        障害種別: "",
        障害支援区分: "",
        緊急連絡先: "",
        主治医: "",
        医療機関: "",
        アレルギー情報: "",
        既往歴: "",
        備考: "",
      } as unknown as RecipientCSVRow).join(",") + "\n"
    );
  }

  const headers = Object.keys(recipients[0]).join(",");
  const rows = recipients.map((row) =>
    Object.values(row)
      .map((value) => {
        // Escape commas and quotes in values
        const stringValue = String(value);
        if (
          stringValue.includes(",") ||
          stringValue.includes('"') ||
          stringValue.includes("\n")
        ) {
          return `"${stringValue.replace(/"/g, '""')}"`;
        }
        return stringValue;
      })
      .join(",")
  );

  return [headers, ...rows].join("\n");
}

/**
 * Parse CSV string to recipients
 */
export function parseCSV(csvContent: string): RecipientCSVRow[] {
  const lines = csvContent.trim().split("\n");
  if (lines.length < 2) {
    throw new Error("CSVファイルが空または不正です");
  }

  const headers = parseCSVLine(lines[0]);
  const expectedHeaders = [
    "氏名",
    "氏名カナ",
    "生年月日",
    "性別",
    "障害種別",
    "障害支援区分",
    "緊急連絡先",
    "主治医",
    "医療機関",
    "アレルギー情報",
    "既往歴",
    "備考",
  ];

  // Validate headers
  if (!expectedHeaders.every((h) => headers.includes(h))) {
    throw new Error(
      `CSVヘッダーが不正です。必要なヘッダー: ${expectedHeaders.join(", ")}`
    );
  }

  const rows: RecipientCSVRow[] = [];
  for (let i = 1; i < lines.length; i++) {
    const values = parseCSVLine(lines[i]);
    if (values.length === 0 || values.every((v) => !v.trim())) {
      continue; // Skip empty lines
    }

    const row: any = {};
    headers.forEach((header, index) => {
      row[header] = values[index] || "";
    });

    rows.push(row as RecipientCSVRow);
  }

  return rows;
}

/**
 * Parse a single CSV line, handling quoted fields
 */
function parseCSVLine(line: string): string[] {
  const result: string[] = [];
  let current = "";
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    const nextChar = line[i + 1];

    if (char === '"') {
      if (inQuotes && nextChar === '"') {
        // Escaped quote
        current += '"';
        i++; // Skip next quote
      } else {
        // Toggle quote state
        inQuotes = !inQuotes;
      }
    } else if (char === "," && !inQuotes) {
      // End of field
      result.push(current);
      current = "";
    } else {
      current += char;
    }
  }

  result.push(current); // Add last field
  return result;
}
