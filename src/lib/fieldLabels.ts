// フィールド名 → 日本語ラベルのマッピング
export const FIELD_LABELS: Record<string, string> = {
  // 基本情報
  name: "氏名",
  nameKana: "ふりがな",
  birthDate: "生年月日",
  gender: "性別",
  photoUrl: "写真URL",

  // 障害情報
  disabilityType: "障害種別",
  disabilityName: "障害名",
  handbookType: "手帳種別",
  handbookGrade: "手帳等級",
  supportLevel: "障害支援区分",

  // 学校・通所先
  school: "学校名",
  dayServiceFacility: "通所先",

  // 住所・連絡先
  homeAddress: "自宅住所",
  homePhone: "自宅電話",
  hasMobilePhone: "本人携帯の有無",
  mobilePhone: "本人携帯番号",
  nearestStation: "最寄り駅",
  walkingMinutes: "徒歩（分）",

  // 緊急連絡先
  emergencyContact: "緊急連絡先",
  emergencyRelation: "続柄",
  emergencyContacts: "緊急連絡先リスト",

  // 居住形態
  livingType: "居住形態",

  // グループホーム情報
  ghName: "GH名",
  ghCorporation: "GH運営法人",
  ghAddress: "GH住所",
  ghPhone: "GH電話番号",
  ghAccess: "GHアクセス",

  // 家族構成
  familyMembers: "家族構成",

  // 連絡ルール
  contactPolicy: "連絡ルール",

  // 運用ルール
  priorConfirmationNote: "前日確認",
  hasRecordNote: "記録ノート",
  walletNote: "お財布・お金",
  cafeBreak: "休憩喫茶",
  cafeCondition: "休憩喫茶条件",
  trainDiscountType: "電車割引",
  hasToeiPass: "都営乗車券",
  hasRestrictionConsent: "行動制限同意書",

  // 計画相談
  planConsultationOffice: "計画相談事業所",
  planConsultant: "計画相談担当者",

  // サービス情報
  serviceTypes: "利用サービス種別",
  utilizationStatus: "利用状況",
  recipientNumber: "受給者番号",
  receivedDate: "受給者証交付日",
  validUntil: "受給者証有効期限",
  allowances: "適用加算",
  behaviorSupportNeeded: "行動援護対象",
  behaviorScore: "行動援護スコア",

  // 医療情報
  doctor: "主治医",
  hospital: "医療機関",
  allergies: "アレルギー情報",
  medicalHistory: "既往歴",

  // 健康情報
  diseaseStatus: "疾病状況",
  hasSeizures: "発作の有無",
  seizureFrequency: "発作の頻度",
  seizureResponse: "発作時の対処",
  seizureHistoryNote: "発作履歴補足",
  medication: "服薬",
  healthNote: "健康上の留意点",

  // 食事
  favoriteFoods: "好きな食べ物",
  dislikedFoods: "嫌いな食べ物",
  hasAllergy: "アレルギーの有無",
  allergyNote: "アレルギー詳細",
  eatingStyle: "食事形態",

  // 排泄
  toiletAssistMethod: "排泄介助方法",

  // 移動
  mobilityMethod: "移動手段",
  mobilityAssist: "移動介助",

  // コミュニケーション
  commVerbal: "会話・表現",
  commRequest: "要求の表現",
  commRefusal: "拒否の表現",

  // こだわり
  hasObsession: "こだわりの有無",
  obsessionSituation: "こだわりの状況",
  obsessionResponse: "こだわりへの対応",

  // 行動・安全
  hasSelfHarm: "自傷行為の有無",
  hasHarmToOthers: "他害行為の有無",

  // その他
  hobbies: "趣味・興味",
  personalityNote: "性格",
  interactionNote: "関わり方",
  otherNotes: "その他の注意点",

  // 外出情報
  outingRequestPattern: "外出依頼パターン",
  outingGroupPlanDeparture: "グループプラン発着",
  outingGroupPlanNote: "グループプラン特記",
  outingSpecificRequest1: "特定の外出依頼①",
  outingSpecificRequest2: "特定の外出依頼②",
  outingCasualDestination: "おまかせの人の行先",
  outingIrregularNote: "不定期外出特記",
  outingOtherNote: "外出その他特記",

  // 生活歴・通院情報
  lifeHistory: "生活歴",
  hospitalVisits: "通院情報",

  // 障害福祉制度情報
  physicalHandicapBook: "身体障害者手帳",
  physicalHandicapGrade: "身体障害者手帳等級",
  intellectualHandicapBook: "療育手帳",
  intellectualHandicapGrade: "療育手帳等級",
  mentalHandicapBook: "精神障害者保健福祉手帳",
  mentalHandicapGrade: "精神障害者保健福祉手帳等級",

  disabilityPension: "障害年金",
  disabilityPensionType: "障害年金種別",
  disabilityPensionGrade: "障害年金等級",
  specialChildAllowance: "特別児童扶養手当",
  disabilityAllowance: "障害児福祉手当",
  specialDisabilityAllowance: "特別障害者手当",
  nursingAllowance: "介護手当",

  psychiatricDiagnosis: "精神科診断名",
  developmentalDiagnosis: "発達障害診断名",
  autismSpectrumLevel: "ASDレベル",
  medicalProtectionAdmission: "医療保護入院歴",
  outpatientMedication: "外来服薬",
  medicalFeeExemption: "自立支援医療",

  isElderly: "高齢障害者",
  careInsuranceCertified: "介護保険認定",
  careInsuranceLevel: "介護保険認定レベル",
  careInsuranceExpiry: "介護保険有効期限",
  continuedDisabilityService: "障害福祉サービス継続利用",

  // その他
  notes: "備考",
  address: "住所",
  phone: "電話番号",
};

// 値を人間が読める形式に変換
export function formatFieldValue(fieldName: string, value: any): string {
  if (value === null || value === undefined) {
    return "（未設定）";
  }

  // 真偽値
  if (typeof value === "boolean") {
    return value ? "はい" : "いいえ";
  }

  // 日付
  if (
    value instanceof Date ||
    (typeof value === "string" && !isNaN(Date.parse(value)))
  ) {
    try {
      const date = value instanceof Date ? value : new Date(value);
      return date.toLocaleDateString("ja-JP");
    } catch {
      return String(value);
    }
  }

  // 配列
  if (Array.isArray(value)) {
    if (value.length === 0) {
      return "（なし）";
    }
    return value.join(", ");
  }

  // JSON/オブジェクト
  if (typeof value === "object") {
    try {
      return JSON.stringify(value, null, 2);
    } catch {
      return String(value);
    }
  }

  // 空文字列
  if (value === "") {
    return "（空）";
  }

  // その他
  return String(value);
}

// 変更内容を人間が読める形式に変換
export interface ChangeDetail {
  field: string;
  label: string;
  oldValue: string;
  newValue: string;
}

export function formatChanges(
  changes: Record<string, { from: any; to: any }>
): ChangeDetail[] {
  return Object.entries(changes).map(([field, { from, to }]) => ({
    field,
    label: FIELD_LABELS[field] || field,
    oldValue: formatFieldValue(field, from),
    newValue: formatFieldValue(field, to),
  }));
}
