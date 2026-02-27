"use client";

import { trpc } from "@/lib/trpc/client";
import { formatDistanceToNow } from "date-fns";
import { ja } from "date-fns/locale";
import { Clock, User, Edit, Eye, FileText } from "lucide-react";

interface ChangeHistoryProps {
  recipientId: string;
}

const ACTION_LABELS: Record<string, string> = {
  View: "閲覧",
  Create: "作成",
  Edit: "編集",
  Delete: "削除",
  Review: "レビュー",
};

const ACTION_ICONS: Record<string, any> = {
  View: Eye,
  Create: FileText,
  Edit: Edit,
  Delete: Edit,
  Review: FileText,
};

const ACTION_COLORS: Record<string, string> = {
  View: "text-blue-600 bg-blue-50",
  Create: "text-green-600 bg-green-50",
  Edit: "text-amber-600 bg-amber-50",
  Delete: "text-red-600 bg-red-50",
  Review: "text-purple-600 bg-purple-50",
};

// フィールド名の日本語マッピング
const FIELD_LABELS: Record<string, string> = {
  name: "氏名",
  nameKana: "氏名（かな）",
  birthDate: "生年月日",
  gender: "性別",
  address: "住所",
  phone: "電話番号",
  photoUrl: "写真",
  disabilityType: "障害種別",
  supportLevel: "障害支援区分",
  doctor: "主治医",
  hospital: "医療機関",
  allergies: "アレルギー情報",
  medications: "服薬情報",
  medication: "服薬",
  healthNote: "健康に関するメモ",
  serviceTypes: "利用サービス種別",
  recipientNumber: "受給者番号",
  utilizationStatus: "利用状況",
  receivedDate: "受給者証交付日",
  validUntil: "受給者証有効期限",
  disabilityHandbook: "身体障害者手帳",
  therapeuticHandbook: "療育手帳",
  mentalHealthHandbook: "精神障害者保健福祉手帳",
  commNote: "コミュニケーション",
  mealNote: "食事",
  toiletNote: "排泄",
  mobilityNote: "移動",
  behaviorNote: "行動特性・こだわり",
  sensoryNote: "感覚過敏・鈍麻",
  supportNote: "支援のポイント",
  hobbies: "趣味・好きなこと",
  personalityNote: "性格",
  interactionNote: "関わり方のポイント",
  outingNote: "外出時の傾向",
  riskNote: "リスク行動・注意点",
  otherNotes: "その他特記事項",
  notes: "備考",

  // 行動援護関連
  behaviorScore: "行動援護点数",
  behaviorSupportNeeded: "行動援護対象",

  // 介護保険関連
  careInsuranceExpiry: "介護保険有効期限",
  careInsuranceLevel: "要介護度",

  // サポート基本情報票関連
  school: "学校名",
  handbookType: "手帳種別",
  handbookGrade: "手帳等級",
  homeAddress: "自宅住所",
  homePhone: "自宅電話",
  nearestStation: "最寄り駅",
  walkingMinutes: "徒歩時間",
  livingType: "居住形態",
  ghName: "グループホーム名",
  ghAddress: "GH住所",
  ghPhone: "GH電話",
  ghCorporation: "GH運営法人",
  ghAccess: "GHアクセス",
  hasMobilePhone: "携帯電話所持",
  mobilePhone: "携帯電話番号",
  priorConfirmationNote: "事前確認事項",
  hasRecordNote: "記録帳持参",
  walletNote: "お財布・お金",
  cafeBreak: "カフェ休憩",
  cafeCondition: "カフェ利用条件",
  trainDiscountType: "電車割引種別",
  hasToeiPass: "都営パス所持",
  hasRestrictionConsent: "身体拘束同意書",
  planConsultationOffice: "計画相談事業所",
  planConsultant: "計画相談員",

  // 健康・医療情報
  disabilityName: "障害名",
  diseaseStatus: "疾患状況",
  hasSeizures: "てんかん発作",
  seizureFrequency: "発作頻度",
  seizureResponse: "発作時対応",
  hasPrnMedication: "頓服薬",
  prnMedicationMethod: "頓服薬服用方法",
  hasSeasonalMedication: "季節性服薬",
  seasonalMedicationContent: "季節性服薬内容",

  // 食事情報
  favoriteFoods: "好きな食べ物",
  dislikedFoods: "苦手な食べ物",
  hasAllergy: "アレルギー有無",
  allergyNote: "アレルギー詳細",
  menuSelectionMethod: "メニュー選択方法",
  eatingStyle: "食事スタイル",

  // 排泄情報
  toiletSign: "排泄サイン",
  toiletFrequency: "排泄頻度",
  toiletAssistMethod: "排泄介助方法",

  // 移動情報
  mobilityMethod: "移動方法",
  mobilityAssist: "移動支援",

  // コミュニケーション情報
  commVerbal: "言葉でのコミュニケーション",
  commGesture: "ジェスチャー",
  commExpression: "表情",
  commRequest: "要求の伝え方",
  commUnderstanding: "理解度",

  // Phase 1追加フィールド
  emergencyContactFax: "緊急連絡先FAX",

  // 感覚過敏・鈍麻
  sensorySound: "感覚（音）",
  sensoryLight: "感覚（光）",
  sensoryTaste: "感覚（味覚）",
  sensoryTouch: "感覚（触覚）",
  sensorySmell: "感覚（におい）",
  sensoryOther: "感覚（その他）",

  // こだわり
  obsessionPast: "こだわり（過去）",
  obsessionCurrent: "こだわり（現在）",

  // 自傷・他害・パニック
  selfHarmContent: "自傷の内容",
  aggressionContent: "他害の内容",
  panicContent: "パニックの内容",

  // 趣味・関心・余暇・嗜好
  hobbyOuting: "趣味（外出）",
  hobbyTv: "趣味（TV）",
  hobbyMusic: "趣味（音楽）",
  hobbyBook: "趣味（本・雑誌）",
  hobbyInterpersonal: "趣味（対人関係・遊び）",
  hobbyInterestScope: "趣味（関心の範囲）",
  hobbyFoodPreference: "嗜好物",
  hobbyOther: "趣味（その他）",

  // 服薬詳細
  medicationMorning: "服薬（朝食後）",
  medicationNoon: "服薬（昼食後）",
  medicationEvening: "服薬（夕食後）",
  medicationBedtime: "服薬（就寝前）",
  medicationOtherTime: "服薬（その他時間帯）",
  medicationTimeSpecific: "時間固定服薬",
  medicationNote: "服薬特記",

  // 臨時薬
  prnMedicationContent: "臨時薬の内容",
  prnMedicationTiming: "臨時薬のタイミング",
  prnMedicationMemo: "臨時薬メモ",

  // 発作詳細
  seizureTimePattern: "発作時間帯",
  seizureHistoryNote: "発作履歴補足",

  // 塗薬等
  hasTopicalMedication: "塗薬等の有無",
  topicalMedicationNote: "塗薬等詳細",

  // 人柄
  personality: "人柄",
};

export function ChangeHistory({ recipientId }: ChangeHistoryProps) {
  const { data: logs, isLoading } = trpc.auditLog.getByResource.useQuery({
    resourceType: "CareRecipient",
    resourceId: recipientId,
    limit: 50,
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-muted-foreground">読み込み中...</div>
      </div>
    );
  }

  // 閲覧以外のログをフィルタリング
  const filteredLogs = logs?.filter((log: any) => log.action !== "View") || [];

  if (!logs || logs.length === 0 || filteredLogs.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <Clock className="text-muted-foreground mb-4 h-12 w-12" />
        <p className="text-muted-foreground text-sm">変更履歴はありません</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="text-muted-foreground mb-4 text-sm">
        直近の変更履歴を表示しています（最大50件）
      </div>

      <div className="space-y-2">
        {filteredLogs.map((log: any) => {
            const ActionIcon = ACTION_ICONS[log.action] || FileText;
            const actionLabel = ACTION_LABELS[log.action] || log.action;
            const actionColor = ACTION_COLORS[log.action] || "text-gray-600 bg-gray-50";

            return (
            <div
              key={log.id}
              className="bg-card flex items-start gap-4 rounded-lg border p-4 transition-colors hover:bg-accent"
            >
              <div className={`rounded-full p-2 ${actionColor}`}>
                <ActionIcon className="h-4 w-4" />
              </div>

              <div className="flex-1">
                <div className="mb-1 flex items-center gap-2">
                  <span className="font-medium">{actionLabel}</span>
                  <span className="text-muted-foreground text-xs">
                    {formatDistanceToNow(new Date(log.createdAt), {
                      addSuffix: true,
                      locale: ja,
                    })}
                  </span>
                </div>

                <div className="text-muted-foreground mb-2 flex items-center gap-2 text-sm">
                  <User className="h-3 w-3" />
                  <span>
                    {log.user.name || log.user.email}{" "}
                    <span className="text-xs">({log.user.role})</span>
                  </span>
                </div>

                {log.metadata && (
                  <div className="bg-muted/50 mt-2 rounded p-2 text-xs">
                    {log.metadata.recipientName && (
                      <div className="mb-1">
                        <span className="font-medium">利用者:</span>{" "}
                        {log.metadata.recipientName as string}
                      </div>
                    )}
                    {log.metadata.updatedFields && Array.isArray(log.metadata.updatedFields) && (
                      <div>
                        <span className="font-medium">更新項目:</span>{" "}
                        <div className="mt-1 flex flex-wrap gap-1">
                          {(log.metadata.updatedFields as string[]).map((field, index) => (
                            <span
                              key={index}
                              className="inline-block rounded bg-white px-2 py-0.5 text-xs"
                            >
                              {FIELD_LABELS[field] || field}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {log.changeNote && (
                  <div className="mt-2 text-sm italic text-gray-600">
                    {log.changeNote}
                  </div>
                )}

                <div className="text-muted-foreground mt-2 text-xs">
                  {new Date(log.createdAt).toLocaleString("ja-JP", {
                    year: "numeric",
                    month: "2-digit",
                    day: "2-digit",
                    hour: "2-digit",
                    minute: "2-digit",
                    second: "2-digit",
                  })}
                </div>
              </div>
            </div>
            );
          })}
      </div>
    </div>
  );
}
