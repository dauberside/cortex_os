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
  サービス種別?: string; // カンマ区切り: "行動援護,居宅介護"（省略可）
  緊急連絡先: string;
  緊急連絡先続柄: string;
  主治医: string;
  医療機関: string;
  アレルギー情報: string;
  既往歴: string;
  備考: string;
  // サポート基本情報票 - 基本プロフィール
  通所先: string;
  手帳種別: string;
  手帳等級: string;
  自宅住所: string;
  自宅電話: string;
  最寄り駅: string;
  徒歩分数: string;
  居住形態: string; // GH入居/一人暮らし/実家など
  GH名称: string;
  GH住所: string;
  GH電話: string;
  GH法人名: string;
  GHアクセス: string;
  本人携帯: string; // あり/なし
  本人携帯番号: string;
  前日確認特記: string;
  記録ノート有無: string; // あり/なし
  財布特記: string;
  喫茶入店: string; // 希望しない/希望する
  喫茶条件: string;
  電車割引種別: string;
  都営乗車券: string; // 有/無
  行動制限同意書: string; // 有/無
  計画相談事業所: string;
  計画相談担当者: string;
  // アセスメント・健康・服薬
  障害名: string;
  疾病状況: string;
  発作あり: string; // "あり" | "なし" | ""
  発作頻度: string;
  発作対処方法: string;
  服薬: string; // カンマ区切り or 改行区切り
  頓服有無: string; // あり/なし
  頓服服薬方法: string;
  季節薬有無: string; // あり/なし
  季節薬内容: string;
  健康留意点: string;
  // 食事
  好きな食べ物: string;
  嫌いな食べ物: string;
  アレルギー有無: string; // 無/有
  アレルギー詳細: string;
  メニュー選択方法: string;
  食事形態: string; // はし/スプーンなど
  // 排泄
  排泄サイン: string;
  排泄頻度: string;
  排泄介助方法: string;
  排泄留意点: string;
  // 移動
  移動手段: string;
  移動介助方法: string;
  移動留意点: string;
  // コミュニケーション
  会話表現: string;
  ジェスチャー表現: string;
  表情表現: string;
  要求表現: string;
  拒否表現: string;
  コミュニケーション留意点: string;
  // こだわり等
  こだわり有無: string; // 有/無
  こだわり状況: string;
  こだわり対応: string;
  // 安全・行動
  自傷有無: string; // なし/あり
  他害有無: string; // なし/あり
  安全留意点: string;
  // その他
  趣味: string;
  その他注意点: string;
  過去インシデント有無: string; // あり/なし
  過去インシデント詳細: string;
  // 受給者証情報
  利用状況: string;
  受給者証番号: string;
  交付年月日: string; // YYYY-MM-DD format
  有効期限: string; // YYYY-MM-DD format
  行動援護該当: string; // "あり" | "なし" | ""
  行動関連項目点数: string;
  // 障害者手帳
  身体障害者手帳: string; // "あり" | "なし" | ""
  身体障害者手帳等級: string;
  療育手帳: string; // "あり" | "なし" | ""
  療育手帳等級: string;
  精神障害者保健福祉手帳: string; // "あり" | "なし" | ""
  精神障害者保健福祉手帳等級: string;
  // 手当・給付
  手当給付: string; // カンマ区切り
  障害年金: string; // "あり" | "なし" | ""
  障害年金種別: string; // "障害基礎年金" | "障害厚生年金" | ""
  障害年金等級: string;
  // 精神科・発達障害
  精神科診断名: string;
  発達障害診断名: string;
  自閉症スペクトラムレベル: string;
  医療保護入院歴: string; // "あり" | "なし" | ""
  通院服薬: string; // "あり" | "なし" | ""
  自立支援医療: string;
  // 高齢障害者
  高齢障害者: string; // "あり" | "なし" | ""
  介護保険認定: string; // "あり" | "なし" | ""
  介護保険要介護度: string;
  介護保険有効期限: string; // YYYY-MM-DD format
  障害福祉サービス継続利用: string; // "あり" | "なし" | ""
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
  // 性格・関わり方
  性格特記: string;
  関わり方特記: string;
  // 外出の主な傾向
  外出依頼パターン: string;
  グループプラン発着: string;
  グループプラン特記: string;
  特定外出依頼1: string;
  特定外出依頼2: string;
  おまかせ行先: string;
  不定期特記: string;
  外出その他特記: string;
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
  serviceTypes?: string[];
  emergencyContact: string | null;
  emergencyRelation?: string | null;
  doctor: string | null;
  hospital: string | null;
  disabilityName?: string | null;
  diseaseStatus?: string | null;
  hasSeizures?: boolean | null;
  seizureFrequency?: string | null;
  seizureResponse?: string | null;
  medication?: string[];
  allergies: string | null;
  medicalHistory: string | null;
  notes: string | null;
  utilizationStatus?: string | null;
  recipientNumber?: string | null;
  receivedDate?: Date | null;
  validUntil?: Date | null;
  behaviorSupportNeeded?: boolean | null;
  behaviorScore?: number | null;
  physicalHandicapBook?: boolean | null;
  physicalHandicapGrade?: string | null;
  intellectualHandicapBook?: boolean | null;
  intellectualHandicapGrade?: string | null;
  mentalHandicapBook?: boolean | null;
  mentalHandicapGrade?: string | null;
  allowances?: string[];
  disabilityPension?: boolean | null;
  disabilityPensionType?: string | null;
  disabilityPensionGrade?: string | null;
  psychiatricDiagnosis?: string | null;
  developmentalDiagnosis?: string | null;
  autismSpectrumLevel?: string | null;
  medicalProtectionAdmission?: boolean | null;
  outpatientMedication?: boolean | null;
  medicalFeeExemption?: string | null;
  isElderly?: boolean | null;
  careInsuranceCertified?: boolean | null;
  careInsuranceLevel?: string | null;
  careInsuranceExpiry?: Date | null;
  continuedDisabilityService?: boolean | null;
  // サポート基本情報票追加項目
  school?: string | null;
  handbookType?: string | null;
  handbookGrade?: string | null;
  homeAddress?: string | null;
  homePhone?: string | null;
  nearestStation?: string | null;
  walkingMinutes?: string | null;
  livingType?: string | null;
  ghName?: string | null;
  ghAddress?: string | null;
  ghPhone?: string | null;
  ghCorporation?: string | null;
  ghAccess?: string | null;
  hasMobilePhone?: boolean | null;
  mobilePhone?: string | null;
  priorConfirmationNote?: string | null;
  hasRecordNote?: boolean | null;
  walletNote?: string | null;
  cafeBreak?: boolean | null;
  cafeCondition?: string | null;
  trainDiscountType?: string | null;
  hasToeiPass?: boolean | null;
  hasRestrictionConsent?: boolean | null;
  planConsultationOffice?: string | null;
  planConsultant?: string | null;
  hasPrnMedication?: boolean | null;
  prnMedicationMethod?: string | null;
  hasSeasonalMedication?: boolean | null;
  seasonalMedicationContent?: string | null;
  healthNote?: string | null;
  favoriteFoods?: string | null;
  dislikedFoods?: string | null;
  hasAllergy?: boolean | null;
  allergyNote?: string | null;
  menuSelectionMethod?: string | null;
  eatingStyle?: string | null;
  toiletSign?: string | null;
  toiletFrequency?: string | null;
  toiletAssistMethod?: string | null;
  toiletNote?: string | null;
  mobilityMethod?: string | null;
  mobilityAssist?: string | null;
  mobilityNote?: string | null;
  commVerbal?: string | null;
  commGesture?: string | null;
  commExpression?: string | null;
  commRequest?: string | null;
  commRefusal?: string | null;
  commNote?: string | null;
  hasObsession?: boolean | null;
  obsessionSituation?: string | null;
  obsessionResponse?: string | null;
  hasSelfHarm?: boolean | null;
  hasHarmToOthers?: boolean | null;
  safetyNote?: string | null;
  hobbies?: string | null;
  otherNotes?: string | null;
  hasPastIncidents?: boolean | null;
  pastIncidentsNote?: string | null;
  personalityNote?: string | null;
  interactionNote?: string | null;
  outingRequestPattern?: string | null;
  outingGroupPlanDeparture?: string | null;
  outingGroupPlanNote?: string | null;
  outingSpecificRequest1?: string | null;
  outingSpecificRequest2?: string | null;
  outingCasualDestination?: string | null;
  outingIrregularNote?: string | null;
  outingOtherNote?: string | null;
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

  const serviceTypeMap: Record<string, string> = {
    HomeHelp: "居宅介護",
    VisitingCare: "重度訪問介護",
    BehaviorSupport: "行動援護",
    DayCare: "生活介護",
    ShortStay: "短期入所",
    GroupHome: "グループホーム",
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

  const boolToString = (val: boolean | null | undefined): string => {
    if (val === true) return "あり";
    if (val === false) return "なし";
    return "";
  };

  return {
    氏名: recipient.name,
    氏名カナ: recipient.nameKana || "",
    生年月日: recipient.birthDate.toISOString().split("T")[0],
    性別: genderMap[recipient.gender] || "その他",
    障害種別: recipient.disabilityType
      .map((t) => disabilityTypeMap[t] || t)
      .join(","),
    障害支援区分: recipient.supportLevel ? String(recipient.supportLevel) : "",
    サービス種別: (recipient.serviceTypes || [])
      .map((t) => serviceTypeMap[t] || t)
      .join(","),
    緊急連絡先: recipient.emergencyContact || "",
    緊急連絡先続柄: recipient.emergencyRelation || "",
    主治医: recipient.doctor || "",
    医療機関: recipient.hospital || "",
    アレルギー情報: recipient.allergies || "",
    既往歴: recipient.medicalHistory || "",
    備考: recipient.notes || "",
    // アセスメント・健康・服薬
    障害名: recipient.disabilityName || "",
    疾病状況: recipient.diseaseStatus || "",
    発作あり: boolToString(recipient.hasSeizures),
    発作頻度: recipient.seizureFrequency || "",
    発作対処方法: recipient.seizureResponse || "",
    服薬: (recipient.medication || []).join("\n"),
    // 受給者証情報
    利用状況: recipient.utilizationStatus || "",
    受給者証番号: recipient.recipientNumber || "",
    交付年月日: recipient.receivedDate ? recipient.receivedDate.toISOString().split("T")[0] : "",
    有効期限: recipient.validUntil ? recipient.validUntil.toISOString().split("T")[0] : "",
    行動援護該当: boolToString(recipient.behaviorSupportNeeded),
    行動関連項目点数: recipient.behaviorScore ? String(recipient.behaviorScore) : "",
    // 障害者手帳
    身体障害者手帳: boolToString(recipient.physicalHandicapBook),
    身体障害者手帳等級: recipient.physicalHandicapGrade || "",
    療育手帳: boolToString(recipient.intellectualHandicapBook),
    療育手帳等級: recipient.intellectualHandicapGrade || "",
    精神障害者保健福祉手帳: boolToString(recipient.mentalHandicapBook),
    精神障害者保健福祉手帳等級: recipient.mentalHandicapGrade || "",
    // 手当・給付
    手当給付: (recipient.allowances || []).join(","),
    障害年金: boolToString(recipient.disabilityPension),
    障害年金種別: recipient.disabilityPensionType || "",
    障害年金等級: recipient.disabilityPensionGrade || "",
    // 精神科・発達障害
    精神科診断名: recipient.psychiatricDiagnosis || "",
    発達障害診断名: recipient.developmentalDiagnosis || "",
    自閉症スペクトラムレベル: recipient.autismSpectrumLevel || "",
    医療保護入院歴: boolToString(recipient.medicalProtectionAdmission),
    通院服薬: boolToString(recipient.outpatientMedication),
    自立支援医療: recipient.medicalFeeExemption || "",
    // 高齢障害者
    高齢障害者: boolToString(recipient.isElderly),
    介護保険認定: boolToString(recipient.careInsuranceCertified),
    介護保険要介護度: recipient.careInsuranceLevel || "",
    介護保険有効期限: recipient.careInsuranceExpiry ? recipient.careInsuranceExpiry.toISOString().split("T")[0] : "",
    障害福祉サービス継続利用: boolToString(recipient.continuedDisabilityService),
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
    // サポート基本情報票 - 基本プロフィール
    通所先: recipient.school || "",
    手帳種別: recipient.handbookType || "",
    手帳等級: recipient.handbookGrade || "",
    自宅住所: recipient.homeAddress || "",
    自宅電話: recipient.homePhone || "",
    最寄り駅: recipient.nearestStation || "",
    徒歩分数: recipient.walkingMinutes || "",
    居住形態: recipient.livingType || "",
    GH名称: recipient.ghName || "",
    GH住所: recipient.ghAddress || "",
    GH電話: recipient.ghPhone || "",
    GH法人名: recipient.ghCorporation || "",
    GHアクセス: recipient.ghAccess || "",
    本人携帯: boolToString(recipient.hasMobilePhone),
    本人携帯番号: recipient.mobilePhone || "",
    前日確認特記: recipient.priorConfirmationNote || "",
    記録ノート有無: boolToString(recipient.hasRecordNote),
    財布特記: recipient.walletNote || "",
    喫茶入店: boolToString(recipient.cafeBreak),
    喫茶条件: recipient.cafeCondition || "",
    電車割引種別: recipient.trainDiscountType || "",
    都営乗車券: boolToString(recipient.hasToeiPass),
    行動制限同意書: boolToString(recipient.hasRestrictionConsent),
    計画相談事業所: recipient.planConsultationOffice || "",
    計画相談担当者: recipient.planConsultant || "",
    // サポート基本情報票 - アセスメント追加項目
    頓服有無: boolToString(recipient.hasPrnMedication),
    頓服服薬方法: recipient.prnMedicationMethod || "",
    季節薬有無: boolToString(recipient.hasSeasonalMedication),
    季節薬内容: recipient.seasonalMedicationContent || "",
    健康留意点: recipient.healthNote || "",
    好きな食べ物: recipient.favoriteFoods || "",
    嫌いな食べ物: recipient.dislikedFoods || "",
    アレルギー有無: boolToString(recipient.hasAllergy),
    アレルギー詳細: recipient.allergyNote || "",
    メニュー選択方法: recipient.menuSelectionMethod || "",
    食事形態: recipient.eatingStyle || "",
    排泄サイン: recipient.toiletSign || "",
    排泄頻度: recipient.toiletFrequency || "",
    排泄介助方法: recipient.toiletAssistMethod || "",
    排泄留意点: recipient.toiletNote || "",
    移動手段: recipient.mobilityMethod || "",
    移動介助方法: recipient.mobilityAssist || "",
    移動留意点: recipient.mobilityNote || "",
    会話表現: recipient.commVerbal || "",
    ジェスチャー表現: recipient.commGesture || "",
    表情表現: recipient.commExpression || "",
    要求表現: recipient.commRequest || "",
    拒否表現: recipient.commRefusal || "",
    コミュニケーション留意点: recipient.commNote || "",
    こだわり有無: boolToString(recipient.hasObsession),
    こだわり状況: recipient.obsessionSituation || "",
    こだわり対応: recipient.obsessionResponse || "",
    自傷有無: boolToString(recipient.hasSelfHarm),
    他害有無: boolToString(recipient.hasHarmToOthers),
    安全留意点: recipient.safetyNote || "",
    趣味: recipient.hobbies || "",
    その他注意点: recipient.otherNotes || "",
    過去インシデント有無: boolToString(recipient.hasPastIncidents),
    過去インシデント詳細: recipient.pastIncidentsNote || "",
    // 性格・関わり方
    性格特記: recipient.personalityNote || "",
    関わり方特記: recipient.interactionNote || "",
    // 外出の主な傾向
    外出依頼パターン: recipient.outingRequestPattern || "",
    グループプラン発着: recipient.outingGroupPlanDeparture || "",
    グループプラン特記: recipient.outingGroupPlanNote || "",
    特定外出依頼1: recipient.outingSpecificRequest1 || "",
    特定外出依頼2: recipient.outingSpecificRequest2 || "",
    おまかせ行先: recipient.outingCasualDestination || "",
    不定期特記: recipient.outingIrregularNote || "",
    外出その他特記: recipient.outingOtherNote || "",
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

  const serviceTypeReverseMap: Record<string, string> = {
    居宅介護: "HomeHelp",
    重度訪問介護: "VisitingCare",
    行動援護: "BehaviorSupport",
    生活介護: "DayCare",
    短期入所: "ShortStay",
    グループホーム: "GroupHome",
  };

  const stringToBool = (val: string): boolean | undefined => {
    if (val === "あり") return true;
    if (val === "なし") return false;
    return undefined;
  };

  const parseDate = (val: string): Date | undefined => {
    if (!val || !val.trim()) return undefined;
    const date = new Date(val);
    return isNaN(date.getTime()) ? undefined : date;
  };

  const parseNumber = (val: string): number | undefined => {
    if (!val || !val.trim()) return undefined;
    const num = parseInt(val, 10);
    return isNaN(num) ? undefined : num;
  };

  const disabilityType = row.障害種別
    ? row.障害種別
        .split(",")
        .map((t) => t.trim())
        .filter((t) => t in disabilityTypeMap)
        .map((t) => disabilityTypeMap[t as keyof typeof disabilityTypeMap])
    : [];

  const serviceTypes = row.サービス種別
    ? row.サービス種別
        .split(",")
        .map((t) => t.trim())
        .filter((t) => t)
        .map((t) => serviceTypeReverseMap[t] || t)
    : [];

  const allowances = row.手当給付
    ? row.手当給付.split(",").map((t) => t.trim()).filter((t) => t)
    : [];

  const recipient = {
    name: row.氏名,
    nameKana: row.氏名カナ || undefined,
    birthDate: parseDate(row.生年月日) || new Date(),
    gender: genderMap[row.性別] || "Other",
    disabilityType,
    supportLevel: parseNumber(row.障害支援区分),
    serviceTypes,
    emergencyContact: row.緊急連絡先 || undefined,
    emergencyRelation: row.緊急連絡先続柄 || undefined,
    doctor: row.主治医 || undefined,
    hospital: row.医療機関 || undefined,
    allergies: row.アレルギー情報 || undefined,
    medicalHistory: row.既往歴 || undefined,
    notes: row.備考 || undefined,
    // アセスメント・健康・服薬
    disabilityName: row.障害名 || undefined,
    diseaseStatus: row.疾病状況 || undefined,
    hasSeizures: stringToBool(row.発作あり),
    seizureFrequency: row.発作頻度 || undefined,
    seizureResponse: row.発作対処方法 || undefined,
    medication: row.服薬 ? row.服薬.split(/[\n,]/).map(m => m.trim()).filter(m => m) : [],
    // 受給者証情報
    utilizationStatus: row.利用状況 || undefined,
    recipientNumber: row.受給者証番号 || undefined,
    receivedDate: parseDate(row.交付年月日),
    validUntil: parseDate(row.有効期限),
    behaviorSupportNeeded: stringToBool(row.行動援護該当),
    behaviorScore: parseNumber(row.行動関連項目点数),
    // 障害者手帳
    physicalHandicapBook: stringToBool(row.身体障害者手帳),
    physicalHandicapGrade: row.身体障害者手帳等級 || undefined,
    intellectualHandicapBook: stringToBool(row.療育手帳),
    intellectualHandicapGrade: row.療育手帳等級 || undefined,
    mentalHandicapBook: stringToBool(row.精神障害者保健福祉手帳),
    mentalHandicapGrade: row.精神障害者保健福祉手帳等級 || undefined,
    // 手当・給付
    allowances,
    disabilityPension: stringToBool(row.障害年金),
    disabilityPensionType: row.障害年金種別 || undefined,
    disabilityPensionGrade: row.障害年金等級 || undefined,
    // 精神科・発達障害
    psychiatricDiagnosis: row.精神科診断名 || undefined,
    developmentalDiagnosis: row.発達障害診断名 || undefined,
    autismSpectrumLevel: row.自閉症スペクトラムレベル || undefined,
    medicalProtectionAdmission: stringToBool(row.医療保護入院歴),
    outpatientMedication: stringToBool(row.通院服薬),
    medicalFeeExemption: row.自立支援医療 || undefined,
    // 高齢障害者
    isElderly: stringToBool(row.高齢障害者),
    careInsuranceCertified: stringToBool(row.介護保険認定),
    careInsuranceLevel: row.介護保険要介護度 || undefined,
    careInsuranceExpiry: parseDate(row.介護保険有効期限),
    continuedDisabilityService: stringToBool(row.障害福祉サービス継続利用),
    // サポート基本情報票追加項目
    school: row.通所先 || undefined,
    handbookType: row.手帳種別 || undefined,
    handbookGrade: row.手帳等級 || undefined,
    homeAddress: row.自宅住所 || undefined,
    homePhone: row.自宅電話 || undefined,
    nearestStation: row.最寄り駅 || undefined,
    walkingMinutes: row.徒歩分数 || undefined,
    livingType: row.居住形態 || undefined,
    ghName: row.GH名称 || undefined,
    ghAddress: row.GH住所 || undefined,
    ghPhone: row.GH電話 || undefined,
    ghCorporation: row.GH法人名 || undefined,
    ghAccess: row.GHアクセス || undefined,
    hasMobilePhone: stringToBool(row.本人携帯),
    mobilePhone: row.本人携帯番号 || undefined,
    priorConfirmationNote: row.前日確認特記 || undefined,
    hasRecordNote: stringToBool(row.記録ノート有無),
    walletNote: row.財布特記 || undefined,
    cafeBreak: stringToBool(row.喫茶入店),
    cafeCondition: row.喫茶条件 || undefined,
    trainDiscountType: row.電車割引種別 || undefined,
    hasToeiPass: stringToBool(row.都営乗車券),
    hasRestrictionConsent: stringToBool(row.行動制限同意書),
    planConsultationOffice: row.計画相談事業所 || undefined,
    planConsultant: row.計画相談担当者 || undefined,
    hasPrnMedication: stringToBool(row.頓服有無),
    prnMedicationMethod: row.頓服服薬方法 || undefined,
    hasSeasonalMedication: stringToBool(row.季節薬有無),
    seasonalMedicationContent: row.季節薬内容 || undefined,
    healthNote: row.健康留意点 || undefined,
    favoriteFoods: row.好きな食べ物 || undefined,
    dislikedFoods: row.嫌いな食べ物 || undefined,
    hasAllergy: stringToBool(row.アレルギー有無),
    allergyNote: row.アレルギー詳細 || undefined,
    menuSelectionMethod: row.メニュー選択方法 || undefined,
    eatingStyle: row.食事形態 || undefined,
    toiletSign: row.排泄サイン || undefined,
    toiletFrequency: row.排泄頻度 || undefined,
    toiletAssistMethod: row.排泄介助方法 || undefined,
    toiletNote: row.排泄留意点 || undefined,
    mobilityMethod: row.移動手段 || undefined,
    mobilityAssist: row.移動介助方法 || undefined,
    mobilityNote: row.移動留意点 || undefined,
    commVerbal: row.会話表現 || undefined,
    commGesture: row.ジェスチャー表現 || undefined,
    commExpression: row.表情表現 || undefined,
    commRequest: row.要求表現 || undefined,
    commRefusal: row.拒否表現 || undefined,
    commNote: row.コミュニケーション留意点 || undefined,
    hasObsession: stringToBool(row.こだわり有無),
    obsessionSituation: row.こだわり状況 || undefined,
    obsessionResponse: row.こだわり対応 || undefined,
    hasSelfHarm: stringToBool(row.自傷有無),
    hasHarmToOthers: stringToBool(row.他害有無),
    safetyNote: row.安全留意点 || undefined,
    hobbies: row.趣味 || undefined,
    otherNotes: row.その他注意点 || undefined,
    hasPastIncidents: stringToBool(row.過去インシデント有無),
    pastIncidentsNote: row.過去インシデント詳細 || undefined,
    personalityNote: row.性格特記 || undefined,
    interactionNote: row.関わり方特記 || undefined,
    outingRequestPattern: row.外出依頼パターン || undefined,
    outingGroupPlanDeparture: row.グループプラン発着 || undefined,
    outingGroupPlanNote: row.グループプラン特記 || undefined,
    outingSpecificRequest1: row.特定外出依頼1 || undefined,
    outingSpecificRequest2: row.特定外出依頼2 || undefined,
    outingCasualDestination: row.おまかせ行先 || undefined,
    outingIrregularNote: row.不定期特記 || undefined,
    outingOtherNote: row.外出その他特記 || undefined,
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

// ============================================================
// アセスメント専用CSV
// ============================================================

export interface AssessmentCSVRow {
  recipientId: string; // 紐付けキー（DBのID）
  氏名: string; // 確認用（読み取り専用）
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

const adlMap: Record<string, string> = {
  Independent: "自立",
  Partial: "一部介助",
  Full: "全介助",
  Assisted: "介助あり",
  Wheelchair: "車椅子",
  Bedridden: "寝たきり",
};

const adlReverseMap: Record<string, string> = Object.fromEntries(
  Object.entries(adlMap).map(([k, v]) => [v, k])
);

const visionMap: Record<string, string> = {
  Normal: "正常",
  Weak: "弱視",
  Blind: "全盲",
};
const visionReverseMap: Record<string, string> = Object.fromEntries(
  Object.entries(visionMap).map(([k, v]) => [v, k])
);

const hearingMap: Record<string, string> = {
  Normal: "正常",
  Weak: "難聴",
  Deaf: "全聾",
};
const hearingReverseMap: Record<string, string> = Object.fromEntries(
  Object.entries(hearingMap).map(([k, v]) => [v, k])
);

const speechMap: Record<string, string> = {
  Normal: "可能",
  Difficult: "困難",
  None: "不可",
};
const speechReverseMap: Record<string, string> = Object.fromEntries(
  Object.entries(speechMap).map(([k, v]) => [v, k])
);

/**
 * Convert assessment + recipient to AssessmentCSVRow
 */
export function assessmentToCSVRow(
  recipientId: string,
  recipientName: string,
  assessment: {
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
  } | null
): AssessmentCSVRow {
  const a = assessment;
  return {
    recipientId,
    氏名: recipientName,
    ADL移動: a?.adlMovement ? (adlMap[a.adlMovement] ?? a.adlMovement) : "",
    ADL食事: a?.adlEating ? (adlMap[a.adlEating] ?? a.adlEating) : "",
    ADL排泄: a?.adlToilet ? (adlMap[a.adlToilet] ?? a.adlToilet) : "",
    ADL入浴: a?.adlBathing ? (adlMap[a.adlBathing] ?? a.adlBathing) : "",
    ADL更衣: a?.adlDressing ? (adlMap[a.adlDressing] ?? a.adlDressing) : "",
    ADL整容: a?.adlGrooming ? (adlMap[a.adlGrooming] ?? a.adlGrooming) : "",
    意思疎通方法: a?.commMethod ?? "",
    視覚: a?.commVision ? (visionMap[a.commVision] ?? a.commVision) : "",
    聴覚: a?.commHearing ? (hearingMap[a.commHearing] ?? a.commHearing) : "",
    発語: a?.commSpeech ? (speechMap[a.commSpeech] ?? a.commSpeech) : "",
    生活リズム: a?.lifeRhythm ?? "",
    趣味嗜好: a?.hobbies ?? "",
    性格特徴: a?.personality ?? "",
    服薬詳細: a?.medicationDetails ?? "",
    特記事項: a?.cautions ?? "",
    緊急時対応: a?.emergencyNote ?? "",
    家族構成: a?.familyStructure ?? "",
    支援体制: a?.supportSystem ?? "",
  };
}

/**
 * Generate assessment CSV string
 */
export function generateAssessmentCSV(rows: AssessmentCSVRow[]): string {
  const headers: (keyof AssessmentCSVRow)[] = [
    "recipientId",
    "氏名",
    "ADL移動",
    "ADL食事",
    "ADL排泄",
    "ADL入浴",
    "ADL更衣",
    "ADL整容",
    "意思疎通方法",
    "視覚",
    "聴覚",
    "発語",
    "生活リズム",
    "趣味嗜好",
    "性格特徴",
    "服薬詳細",
    "特記事項",
    "緊急時対応",
    "家族構成",
    "支援体制",
  ];

  const escapeCSVValue = (value: string) => {
    if (value.includes(",") || value.includes('"') || value.includes("\n")) {
      return `"${value.replace(/"/g, '""')}"`;
    }
    return value;
  };

  const headerLine = headers.join(",");
  const dataLines = rows.map((row) =>
    headers.map((h) => escapeCSVValue(row[h] ?? "")).join(",")
  );
  return [headerLine, ...dataLines].join("\n");
}

/**
 * Parse assessment CSV to upsert-ready objects
 */
export function parseAssessmentCSV(csvContent: string): Array<{
  recipientId: string;
  adlMovement?: string;
  adlEating?: string;
  adlToilet?: string;
  adlBathing?: string;
  adlDressing?: string;
  adlGrooming?: string;
  commMethod?: string;
  commVision?: string;
  commHearing?: string;
  commSpeech?: string;
  lifeRhythm?: string;
  hobbies?: string;
  personality?: string;
  medicationDetails?: string;
  cautions?: string;
  emergencyNote?: string;
  familyStructure?: string;
  supportSystem?: string;
}> {
  const lines = csvContent.trim().split("\n");
  if (lines.length < 2) {
    throw new Error("CSVファイルが空または不正です");
  }

  const headers = parseCSVLine(lines[0]);
  if (!headers.includes("recipientId")) {
    throw new Error(
      'CSVヘッダーに "recipientId" 列が必要です。利用者管理画面からCSVをエクスポートして使用してください。'
    );
  }

  const results: Array<{
    recipientId: string;
    adlMovement?: string;
    adlEating?: string;
    adlToilet?: string;
    adlBathing?: string;
    adlDressing?: string;
    adlGrooming?: string;
    commMethod?: string;
    commVision?: string;
    commHearing?: string;
    commSpeech?: string;
    lifeRhythm?: string;
    hobbies?: string;
    personality?: string;
    medicationDetails?: string;
    cautions?: string;
    emergencyNote?: string;
    familyStructure?: string;
    supportSystem?: string;
  }> = [];
  for (let i = 1; i < lines.length; i++) {
    const values = parseCSVLine(lines[i]);
    if (values.length === 0 || values.every((v) => !v.trim())) continue;

    const row: Record<string, string> = {};
    headers.forEach((h, idx) => {
      row[h] = values[idx] ?? "";
    });

    if (!row.recipientId) continue;

    const toEnum = <T extends Record<string, string>>(
      map: T,
      value: string
    ): string | undefined => {
      const mapped = map[value];
      return mapped || undefined;
    };

    results.push({
      recipientId: row.recipientId,
      adlMovement: toEnum(adlReverseMap, row["ADL移動"] ?? ""),
      adlEating: toEnum(adlReverseMap, row["ADL食事"] ?? ""),
      adlToilet: toEnum(adlReverseMap, row["ADL排泄"] ?? ""),
      adlBathing: toEnum(adlReverseMap, row["ADL入浴"] ?? ""),
      adlDressing: toEnum(adlReverseMap, row["ADL更衣"] ?? ""),
      adlGrooming: toEnum(adlReverseMap, row["ADL整容"] ?? ""),
      commMethod: row["意思疎通方法"] || undefined,
      commVision: toEnum(visionReverseMap, row["視覚"] ?? ""),
      commHearing: toEnum(hearingReverseMap, row["聴覚"] ?? ""),
      commSpeech: toEnum(speechReverseMap, row["発語"] ?? ""),
      lifeRhythm: row["生活リズム"] || undefined,
      hobbies: row["趣味嗜好"] || undefined,
      personality: row["性格特徴"] || undefined,
      medicationDetails: row["服薬詳細"] || undefined,
      cautions: row["特記事項"] || undefined,
      emergencyNote: row["緊急時対応"] || undefined,
      familyStructure: row["家族構成"] || undefined,
      supportSystem: row["支援体制"] || undefined,
    });
  }

  return results;
}

/**
 * Generate CSV string from recipients
 */
export function generateCSV(recipients: RecipientCSVRow[]): string {
  if (recipients.length === 0) {
    // Return header only with all fields
    const emptyRow: RecipientCSVRow = {
      氏名: "",
      氏名カナ: "",
      生年月日: "",
      性別: "男性",
      障害種別: "",
      障害支援区分: "",
      サービス種別: "",
      緊急連絡先: "",
      緊急連絡先続柄: "",
      主治医: "",
      医療機関: "",
      アレルギー情報: "",
      既往歴: "",
      備考: "",
      障害名: "",
      疾病状況: "",
      発作あり: "",
      発作頻度: "",
      発作対処方法: "",
      服薬: "",
      利用状況: "",
      受給者証番号: "",
      交付年月日: "",
      有効期限: "",
      行動援護該当: "",
      行動関連項目点数: "",
      身体障害者手帳: "",
      身体障害者手帳等級: "",
      療育手帳: "",
      療育手帳等級: "",
      精神障害者保健福祉手帳: "",
      精神障害者保健福祉手帳等級: "",
      手当給付: "",
      障害年金: "",
      障害年金種別: "",
      障害年金等級: "",
      精神科診断名: "",
      発達障害診断名: "",
      自閉症スペクトラムレベル: "",
      医療保護入院歴: "",
      通院服薬: "",
      自立支援医療: "",
      高齢障害者: "",
      介護保険認定: "",
      介護保険要介護度: "",
      介護保険有効期限: "",
      障害福祉サービス継続利用: "",
      ADL移動: "",
      ADL食事: "",
      ADL排泄: "",
      ADL入浴: "",
      ADL更衣: "",
      ADL整容: "",
      意思疎通方法: "",
      視覚: "",
      聴覚: "",
      発語: "",
      生活リズム: "",
      趣味嗜好: "",
      性格特徴: "",
      服薬詳細: "",
      特記事項: "",
      緊急時対応: "",
      家族構成: "",
      支援体制: "",
      // サポート基本情報票
      通所先: "",
      手帳種別: "",
      手帳等級: "",
      自宅住所: "",
      自宅電話: "",
      最寄り駅: "",
      徒歩分数: "",
      居住形態: "",
      GH名称: "",
      GH住所: "",
      GH電話: "",
      GH法人名: "",
      GHアクセス: "",
      本人携帯: "",
      本人携帯番号: "",
      前日確認特記: "",
      記録ノート有無: "",
      財布特記: "",
      喫茶入店: "",
      喫茶条件: "",
      電車割引種別: "",
      都営乗車券: "",
      行動制限同意書: "",
      計画相談事業所: "",
      計画相談担当者: "",
      頓服有無: "",
      頓服服薬方法: "",
      季節薬有無: "",
      季節薬内容: "",
      健康留意点: "",
      好きな食べ物: "",
      嫌いな食べ物: "",
      アレルギー有無: "",
      アレルギー詳細: "",
      メニュー選択方法: "",
      食事形態: "",
      排泄サイン: "",
      排泄頻度: "",
      排泄介助方法: "",
      排泄留意点: "",
      移動手段: "",
      移動介助方法: "",
      移動留意点: "",
      会話表現: "",
      ジェスチャー表現: "",
      表情表現: "",
      要求表現: "",
      拒否表現: "",
      コミュニケーション留意点: "",
      こだわり有無: "",
      こだわり状況: "",
      こだわり対応: "",
      自傷有無: "",
      他害有無: "",
      安全留意点: "",
      趣味: "",
      その他注意点: "",
      過去インシデント有無: "",
      過去インシデント詳細: "",
      性格特記: "",
      関わり方特記: "",
      外出依頼パターン: "",
      グループプラン発着: "",
      グループプラン特記: "",
      特定外出依頼1: "",
      特定外出依頼2: "",
      おまかせ行先: "",
      不定期特記: "",
      外出その他特記: "",
    };
    return Object.keys(emptyRow).join(",") + "\n";
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
  // Strip BOM and normalize line endings
  const normalized = csvContent
    .replace(/^\uFEFF/, "")
    .replace(/\r\n/g, "\n")
    .replace(/\r/g, "\n");

  if (!normalized.trim()) {
    throw new Error("CSVファイルが空です");
  }

  // Parse CSV with proper quote handling for multi-line fields
  const records = parseCSVContent(normalized);

  if (records.length < 1) {
    throw new Error("CSVファイルが空です");
  }

  const headers = records[0];
  const requiredHeaders = [
    "氏名",
    "氏名カナ",
    "生年月日",
    "性別",
    "障害種別",
    "障害支援区分",
  ];

  // Validate required headers (最小限の必須項目のみチェック、他はオプション)
  if (!requiredHeaders.every((h) => headers.includes(h))) {
    throw new Error(
      `CSVヘッダーが不正です。必要なヘッダー: ${requiredHeaders.join(", ")}`
    );
  }

  const rows: RecipientCSVRow[] = [];
  for (let i = 1; i < records.length; i++) {
    const values = records[i];
    if (values.length === 0 || values.every((v) => !v.trim())) {
      continue; // Skip empty lines
    }

    const row: any = {};
    headers.forEach((header, index) => {
      row[header] = values[index] || "";
    });

    // Skip rows with empty required fields (氏名)
    if (!row["氏名"] || !row["氏名"].trim()) {
      continue;
    }

    rows.push(row as RecipientCSVRow);
  }

  // データ行が1つもない場合はエラー
  if (rows.length === 0) {
    throw new Error("CSVファイルにデータが含まれていません。最低1行のデータを入力してください。");
  }

  return rows;
}

/**
 * Parse CSV content into records, handling quoted multi-line fields
 */
function parseCSVContent(content: string): string[][] {
  const records: string[][] = [];
  const lines = content.split("\n");
  let currentRecord: string[] = [];
  let currentField = "";
  let inQuotes = false;
  let lineIndex = 0;

  while (lineIndex < lines.length) {
    const line = lines[lineIndex];

    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      const nextChar = line[i + 1];

      if (char === '"') {
        if (inQuotes && nextChar === '"') {
          // Escaped quote
          currentField += '"';
          i++; // Skip next quote
        } else {
          // Toggle quote state
          inQuotes = !inQuotes;
        }
      } else if (char === "," && !inQuotes) {
        // End of field
        currentRecord.push(currentField);
        currentField = "";
      } else {
        currentField += char;
      }
    }

    // If we're in quotes, this is a multi-line field
    if (inQuotes) {
      currentField += "\n"; // Add newline to field
      lineIndex++;
      continue;
    }

    // End of line - push current field and record
    currentRecord.push(currentField);
    currentField = "";

    // Skip completely empty records
    if (currentRecord.length > 0 && !currentRecord.every((f) => f.trim() === "")) {
      records.push(currentRecord);
    }
    currentRecord = [];
    lineIndex++;
  }

  return records;
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
