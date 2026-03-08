import React from "react";

export const SERVICE_TYPES = [
  { value: "HomeHelp", label: "居宅介護" },
  { value: "VisitingCare", label: "重度訪問介護" },
  { value: "BehaviorSupport", label: "行動援護" },
  { value: "DayCare", label: "生活介護" },
  { value: "ShortStay", label: "短期入所" },
  { value: "GroupHome", label: "グループホーム（共同生活援助）" },
];

// 現在有効なサービス種別
export const ENABLED_SERVICE_TYPES = [
  "HomeHelp",
  "VisitingCare",
  "BehaviorSupport",
  "DayCare",
  "ShortStay",
  "GroupHome",
] as const;

// フィルタ済みサービス種別を取得するヘルパー
export const getEnabledServiceTypes = () =>
  SERVICE_TYPES.filter((type) =>
    ENABLED_SERVICE_TYPES.includes(type.value as any)
  );

export const ALLOWANCE_OPTIONS = [
  { value: "IntensiveBehaviorSupport", label: "強度行動障害支援加算" },
  { value: "EmergencySupport", label: "緊急時対応加算" },
  { value: "SpecialArea", label: "特定地域加算" },
  { value: "EarlyMorning", label: "早朝加算（6時〜8時）" },
  { value: "LateNight", label: "深夜加算（22時〜6時）" },
  { value: "DeafBlindSupport", label: "盲ろう者向け通訳・介助員加算" },
  { value: "IntensiveSupportAddition", label: "集中的支援加算" },
  {
    value: "VisitingCareLevel2",
    label: "重度訪問介護（重度障害者等包括支援）",
  },
];

export function CollapsibleSection({
  title,
  description,
  defaultOpen = false,
  children,
}: {
  title: string;
  description?: string;
  defaultOpen?: boolean;
  children: React.ReactNode;
}) {
  return (
    <details className="bg-card rounded-lg border" open={defaultOpen}>
      <summary className="cursor-pointer list-none px-6 py-4">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="text-xl font-semibold">{title}</h2>
            {description ? (
              <p className="text-muted-foreground mt-1 text-sm">
                {description}
              </p>
            ) : null}
          </div>
          <span className="text-muted-foreground text-sm">▼</span>
        </div>
      </summary>
      <div className="px-6 pb-6 pt-2">{children}</div>
    </details>
  );
}

// 共通の制度情報入力セクション（新規・編集フォームで使用）
export function DisabilitySystemSection({ register }: { register: any }) {
  return (
    <>
      {/* 障害者手帳 */}
      <div className="bg-card space-y-4 rounded-lg border p-6">
        <h2 className="mb-1 text-xl font-semibold">障害者手帳</h2>
        <p className="text-muted-foreground mb-4 text-sm">
          所持している手帳を選択してください
        </p>

        <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
          {/* 身体障害者手帳 */}
          <div className="space-y-3 rounded-lg border p-4">
            <label className="flex items-center gap-2 text-sm font-medium">
              <input
                type="checkbox"
                {...register("physicalHandicapBook")}
                className="rounded"
              />
              身体障害者手帳
            </label>
            <div>
              <label className="text-muted-foreground mb-1 block text-xs">
                等級
              </label>
              <select
                {...register("physicalHandicapGrade")}
                className="w-full rounded border px-2 py-1.5 text-sm"
              >
                <option value="">未設定</option>
                <option value="1">1級（最重度）</option>
                <option value="2">2級</option>
                <option value="3">3級</option>
                <option value="4">4級</option>
                <option value="5">5級</option>
                <option value="6">6級</option>
              </select>
            </div>
          </div>

          {/* 療育手帳 */}
          <div className="space-y-3 rounded-lg border p-4">
            <label className="flex items-center gap-2 text-sm font-medium">
              <input
                type="checkbox"
                {...register("intellectualHandicapBook")}
                className="rounded"
              />
              療育手帳（愛の手帳等）
            </label>
            <div>
              <label className="text-muted-foreground mb-1 block text-xs">
                等級
              </label>
              <select
                {...register("intellectualHandicapGrade")}
                className="w-full rounded border px-2 py-1.5 text-sm"
              >
                <option value="">未設定</option>
                <option value="A1">A1（最重度）</option>
                <option value="A2">A2（重度）</option>
                <option value="B1">B1（中度）</option>
                <option value="B2">B2（軽度）</option>
              </select>
            </div>
          </div>

          {/* 精神障害者保健福祉手帳 */}
          <div className="space-y-3 rounded-lg border p-4">
            <label className="flex items-center gap-2 text-sm font-medium">
              <input
                type="checkbox"
                {...register("mentalHandicapBook")}
                className="rounded"
              />
              精神障害者保健福祉手帳
            </label>
            <div>
              <label className="text-muted-foreground mb-1 block text-xs">
                等級
              </label>
              <select
                {...register("mentalHandicapGrade")}
                className="w-full rounded border px-2 py-1.5 text-sm"
              >
                <option value="">未設定</option>
                <option value="1">1級（重度）</option>
                <option value="2">2級</option>
                <option value="3">3級</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* 障害年金・手当 */}
      <div className="bg-card space-y-4 rounded-lg border p-6">
        <h2 className="mb-1 text-xl font-semibold">障害年金・各種手当</h2>
        <p className="text-muted-foreground mb-4 text-sm">
          受給している年金・手当を選択してください
        </p>

        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          {/* 障害年金 */}
          <div className="space-y-3 rounded-lg border p-4">
            <label className="flex items-center gap-2 text-sm font-medium">
              <input
                type="checkbox"
                {...register("disabilityPension")}
                className="rounded"
              />
              障害年金
            </label>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-muted-foreground mb-1 block text-xs">
                  等級
                </label>
                <select
                  {...register("disabilityPensionGrade")}
                  className="w-full rounded border px-2 py-1.5 text-sm"
                >
                  <option value="">未設定</option>
                  <option value="1">1級（重度）</option>
                  <option value="2">2級</option>
                  <option value="3">3級（厚年のみ）</option>
                </select>
              </div>
              <div>
                <label className="text-muted-foreground mb-1 block text-xs">
                  種別
                </label>
                <select
                  {...register("disabilityPensionType")}
                  className="w-full rounded border px-2 py-1.5 text-sm"
                >
                  <option value="">未設定</option>
                  <option value="National">障害基礎年金</option>
                  <option value="Employee">障害厚生年金</option>
                </select>
              </div>
            </div>
          </div>

          {/* 各種手当 */}
          <div className="space-y-2 rounded-lg border p-4">
            <p className="mb-2 text-sm font-medium">
              各種手当（該当するものを選択）
            </p>
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                {...register("specialChildAllowance")}
                className="rounded"
              />
              <span>
                特別児童扶養手当{" "}
                <span className="text-muted-foreground text-xs">
                  （20歳未満・重度障害児の保護者）
                </span>
              </span>
            </label>
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                {...register("disabilityAllowance")}
                className="rounded"
              />
              <span>
                障害児福祉手当{" "}
                <span className="text-muted-foreground text-xs">
                  （20歳未満・重度障害で常時介護）
                </span>
              </span>
            </label>
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                {...register("specialDisabilityAllowance")}
                className="rounded"
              />
              <span>
                特別障害者手当{" "}
                <span className="text-muted-foreground text-xs">
                  （20歳以上・重度在宅で常時介護）
                </span>
              </span>
            </label>
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                {...register("nursingAllowance")}
                className="rounded"
              />
              <span>
                その他給付金・手当{" "}
                <span className="text-muted-foreground text-xs">
                  （各自治体の制度等）
                </span>
              </span>
            </label>
          </div>
        </div>
      </div>

      {/* 精神科・発達障害関連 */}
      <div className="bg-card space-y-4 rounded-lg border p-6">
        <h2 className="mb-1 text-xl font-semibold">精神科・発達障害関連</h2>
        <p className="text-muted-foreground mb-4 text-sm">
          精神疾患・発達障害の診断・支援制度を記録します
        </p>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <div>
            <label className="mb-2 block text-sm font-medium">
              精神科診断名
            </label>
            <input
              {...register("psychiatricDiagnosis")}
              className="w-full rounded-md border px-3 py-2 text-sm"
              placeholder="統合失調症、うつ病、双極性障害 等"
            />
          </div>
          <div>
            <label className="mb-2 block text-sm font-medium">
              発達障害診断名
            </label>
            <input
              {...register("developmentalDiagnosis")}
              className="w-full rounded-md border px-3 py-2 text-sm"
              placeholder="ASD、ADHD、LD（学習障害）等"
            />
          </div>
          <div>
            <label className="mb-2 block text-sm font-medium">
              自閉スペクトラム症の程度
            </label>
            <select
              {...register("autismSpectrumLevel")}
              className="w-full rounded-md border px-3 py-2 text-sm"
            >
              <option value="">未設定</option>
              <option value="Level1">レベル1（サポートが必要）</option>
              <option value="Level2">レベル2（十分なサポートが必要）</option>
              <option value="Level3">
                レベル3（非常に十分なサポートが必要）
              </option>
            </select>
          </div>
          <div>
            <label className="mb-2 block text-sm font-medium">
              自立支援医療（精神通院）
            </label>
            <select
              {...register("medicalFeeExemption")}
              className="w-full rounded-md border px-3 py-2 text-sm"
            >
              <option value="">未設定</option>
              <option value="None">未申請</option>
              <option value="Applied">申請中</option>
              <option value="Approved">受給中（自己負担1割）</option>
            </select>
          </div>
        </div>

        <div className="mt-2 grid grid-cols-1 gap-3 md:grid-cols-2">
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              {...register("outpatientMedication")}
              className="rounded"
            />
            精神科通院・服薬中
          </label>
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              {...register("medicalProtectionAdmission")}
              className="rounded"
            />
            医療保護入院歴あり
          </label>
        </div>
      </div>

      {/* 高齢障害者（65歳以上）*/}
      <div className="bg-card space-y-4 rounded-lg border p-6">
        <h2 className="mb-1 text-xl font-semibold">高齢障害者・介護保険</h2>
        <p className="text-muted-foreground mb-4 text-sm">
          65歳以上の方は介護保険が優先適用されます。障害福祉サービスの継続利用には申請が必要です。
        </p>

        <label className="flex items-center gap-2 text-sm font-medium">
          <input
            type="checkbox"
            {...register("isElderly")}
            className="rounded"
          />
          65歳以上（介護保険優先適用対象）
        </label>

        <div className="space-y-4 border-l-4 border-amber-400 pl-4">
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              {...register("careInsuranceCertified")}
              className="rounded"
            />
            介護保険認定済み
          </label>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div>
              <label className="mb-2 block text-sm font-medium">要介護度</label>
              <select
                {...register("careInsuranceLevel")}
                className="w-full rounded-md border px-3 py-2 text-sm"
              >
                <option value="">未設定</option>
                <option value="Support1">要支援1</option>
                <option value="Support2">要支援2</option>
                <option value="Care1">要介護1</option>
                <option value="Care2">要介護2</option>
                <option value="Care3">要介護3</option>
                <option value="Care4">要介護4</option>
                <option value="Care5">要介護5（最重度）</option>
              </select>
            </div>
            <div>
              <label className="mb-2 block text-sm font-medium">
                介護保険認定有効期限
              </label>
              <input
                type="date"
                {...register("careInsuranceExpiry")}
                className="w-full rounded-md border px-3 py-2 text-sm"
              />
            </div>
          </div>

          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              {...register("continuedDisabilityService")}
              className="rounded"
            />
            <span>
              障害福祉サービスの継続利用（共生型・経過措置）
              <span className="text-muted-foreground mt-0.5 block text-xs">
                ※65歳前から継続利用の場合、市町村の判断により継続可能
              </span>
            </span>
          </label>
        </div>
      </div>
    </>
  );
}
