"use client";

import { useParams, useRouter } from "next/navigation";
import { trpc } from "@/lib/trpc/client";
import { Button } from "@/components/ui/button";
import {
  ArrowLeft,
  Activity,
  FileText,
  Pill,
  MessageSquare,
  AlertTriangle,
  Edit,
  Trash2,
  Download,
} from "lucide-react";
import Link from "next/link";
import { useState } from "react";

const SERVICE_TYPE_LABELS: Record<string, string> = {
  HomeHelp: "居宅介護",
  VisitingCare: "重度訪問介護",
  BehaviorSupport: "行動援護",
  MobilitySupport: "同行援護",
  DayCare: "生活介護",
  ShortStay: "短期入所",
  GroupHome: "グループホーム",
};

const SERVICE_TYPE_COLORS: Record<string, string> = {
  HomeHelp: "bg-blue-100 text-blue-800",
  VisitingCare: "bg-purple-100 text-purple-800",
  BehaviorSupport: "bg-red-100 text-red-800",
  MobilitySupport: "bg-orange-100 text-orange-800",
  DayCare: "bg-green-100 text-green-800",
  ShortStay: "bg-yellow-100 text-yellow-800",
  GroupHome: "bg-pink-100 text-pink-800",
};

const ALLOWANCE_LABELS: Record<string, string> = {
  IntensiveBehaviorSupport: "強度行動障害支援加算",
  EmergencySupport: "緊急時対応加算",
  SpecialArea: "特定地域加算",
  EarlyMorning: "早朝加算",
  LateNight: "深夜加算",
  DeafBlindSupport: "盲ろう者向け通訳・介助員加算",
  IntensiveSupportAddition: "集中的支援加算",
  VisitingCareLevel2: "重度訪問介護（重度障害者等包括支援）",
};

const UTILIZATION_STATUS_LABELS: Record<string, string> = {
  Home: "在宅",
  Facility: "入所施設",
  DayCare: "通所",
  GroupHome: "グループホーム",
};

export default function RecipientDetailPage() {
  const params = useParams();
  const router = useRouter();
  const recipientId = params.id as string;
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const { data: recipient, isLoading } = trpc.recipient.get.useQuery({
    id: recipientId,
  });

  const deleteMutation = trpc.recipient.delete.useMutation({
    onSuccess: () => {
      alert("利用者を削除しました");
      router.push("/recipients");
    },
    onError: (error) => {
      alert(`削除に失敗しました: ${error.message}`);
    },
  });

  const exportMutation = trpc.recipient.exportSingleCSV.useQuery(
    { id: recipientId },
    { enabled: false }
  );

  const handleDelete = () => {
    if (window.confirm(`${recipient?.name} さんを削除してもよろしいですか？\n\n※論理削除のため、後から復元可能です。`)) {
      deleteMutation.mutate({ id: recipientId });
    }
  };

  const handleExport = async () => {
    try {
      const result = await exportMutation.refetch();
      if (result.data) {
        const blob = new Blob([result.data.content], {
          type: "text/csv;charset=utf-8;",
        });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.download = result.data.filename;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
      }
    } catch (error) {
      alert("エクスポートに失敗しました");
      console.error(error);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-lg">読み込み中...</div>
      </div>
    );
  }

  if (!recipient) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-lg text-destructive">利用者が見つかりません</div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 px-4">
      <Link href="/recipients">
        <Button variant="ghost" className="mb-4">
          <ArrowLeft className="mr-2 h-4 w-4" />
          利用者一覧に戻る
        </Button>
      </Link>

      <div className="flex justify-between items-start mb-8">
        <div>
          <h1 className="text-3xl font-bold mb-2">{recipient.name}</h1>
          {recipient.nameKana && (
            <p className="text-muted-foreground mb-1">({recipient.nameKana})</p>
          )}
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={handleExport}
            disabled={exportMutation.isFetching}
          >
            <Download className="mr-2 h-4 w-4" />
            CSV出力
          </Button>
          <Link href={`/recipients/${recipientId}/edit`}>
            <Button variant="outline">
              <Edit className="mr-2 h-4 w-4" />
              編集
            </Button>
          </Link>
          <Button
            variant="destructive"
            onClick={handleDelete}
            disabled={deleteMutation.isPending}
          >
            <Trash2 className="mr-2 h-4 w-4" />
            削除
          </Button>
        </div>
      </div>

      {/* 基本情報 */}
      <div className="bg-card border rounded-lg p-6 mb-6">
        <h2 className="text-xl font-semibold mb-4">基本情報</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <p className="text-sm text-muted-foreground">生年月日</p>
            <p className="font-medium">
              {new Date(recipient.birthDate).toLocaleDateString("ja-JP")}
            </p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">性別</p>
            <p className="font-medium">
              {recipient.gender === "Male"
                ? "男性"
                : recipient.gender === "Female"
                ? "女性"
                : "その他"}
            </p>
          </div>
          {recipient.supportLevel && (
            <div>
              <p className="text-sm text-muted-foreground">障害支援区分</p>
              <p className="font-medium">区分{recipient.supportLevel}</p>
            </div>
          )}
          {recipient.disabilityType.length > 0 && (
            <div>
              <p className="text-sm text-muted-foreground">障害種別</p>
              <p className="font-medium">
                {recipient.disabilityType
                  .map((t) =>
                    t === "Physical"
                      ? "身体障害"
                      : t === "Intellectual"
                      ? "知的障害"
                      : "精神障害"
                  )
                  .join(", ")}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* サービス情報 */}
      {((recipient as any).serviceTypes?.length > 0 || (recipient as any).utilizationStatus || (recipient as any).recipientNumber) && (
        <div className="bg-card border rounded-lg p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">サービス・受給者証情報</h2>
          <div className="space-y-4">
            {(recipient as any).serviceTypes?.length > 0 && (
              <div>
                <p className="text-sm text-muted-foreground mb-2">利用サービス種別</p>
                <div className="flex flex-wrap gap-2">
                  {(recipient as any).serviceTypes.map((type: string) => (
                    <span
                      key={type}
                      className={`px-3 py-1 text-sm font-medium rounded-full ${
                        SERVICE_TYPE_COLORS[type] || "bg-gray-100 text-gray-700"
                      }`}
                    >
                      {SERVICE_TYPE_LABELS[type] || type}
                    </span>
                  ))}
                  {(recipient as any).behaviorSupportNeeded && (
                    <span className="px-3 py-1 bg-red-100 text-red-800 text-sm font-medium rounded-full border border-red-200">
                      行動援護対象
                      {(recipient as any).behaviorScore && ` (${(recipient as any).behaviorScore}点)`}
                    </span>
                  )}
                </div>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {(recipient as any).utilizationStatus && (
                <div>
                  <p className="text-sm text-muted-foreground">利用状況</p>
                  <p className="font-medium">
                    {UTILIZATION_STATUS_LABELS[(recipient as any).utilizationStatus] || (recipient as any).utilizationStatus}
                  </p>
                </div>
              )}
              {(recipient as any).recipientNumber && (
                <div>
                  <p className="text-sm text-muted-foreground">受給者番号</p>
                  <p className="font-medium font-mono">{(recipient as any).recipientNumber}</p>
                </div>
              )}
              {(recipient as any).receivedDate && (
                <div>
                  <p className="text-sm text-muted-foreground">受給者証交付日</p>
                  <p className="font-medium">
                    {new Date((recipient as any).receivedDate).toLocaleDateString("ja-JP")}
                  </p>
                </div>
              )}
              {(recipient as any).validUntil && (
                <div>
                  <p className="text-sm text-muted-foreground">受給者証有効期限</p>
                  <p className={`font-medium ${
                    new Date((recipient as any).validUntil) < new Date()
                      ? "text-destructive"
                      : new Date((recipient as any).validUntil) < new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
                      ? "text-amber-600"
                      : ""
                  }`}>
                    {new Date((recipient as any).validUntil).toLocaleDateString("ja-JP")}
                    {new Date((recipient as any).validUntil) < new Date() && " (期限切れ)"}
                    {new Date((recipient as any).validUntil) >= new Date() &&
                      new Date((recipient as any).validUntil) < new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) &&
                      " (間もなく期限切れ)"}
                  </p>
                </div>
              )}
            </div>

            {(recipient as any).allowances?.length > 0 && (
              <div>
                <p className="text-sm text-muted-foreground mb-2">適用加算</p>
                <div className="flex flex-wrap gap-2">
                  {(recipient as any).allowances.map((allowance: string) => (
                    <span
                      key={allowance}
                      className="px-3 py-1 bg-amber-50 text-amber-800 text-sm rounded border border-amber-200"
                    >
                      {ALLOWANCE_LABELS[allowance] || allowance}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* 障害福祉制度情報 */}
      {((recipient as any).physicalHandicapBook || (recipient as any).intellectualHandicapBook || (recipient as any).mentalHandicapBook ||
        (recipient as any).disabilityPension || (recipient as any).specialChildAllowance || (recipient as any).specialDisabilityAllowance ||
        (recipient as any).nursingAllowance || (recipient as any).psychiatricDiagnosis || (recipient as any).developmentalDiagnosis ||
        (recipient as any).isElderly || (recipient as any).careInsuranceCertified) && (
        <div className="bg-card border rounded-lg p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">障害福祉制度情報</h2>

          {/* 障害者手帳 */}
          {((recipient as any).physicalHandicapBook || (recipient as any).intellectualHandicapBook || (recipient as any).mentalHandicapBook) && (
            <div className="mb-4">
              <p className="text-sm font-medium text-muted-foreground mb-2">障害者手帳</p>
              <div className="flex flex-wrap gap-2">
                {(recipient as any).physicalHandicapBook && (
                  <span className="px-3 py-1 bg-blue-50 text-blue-800 text-sm rounded border border-blue-200">
                    身体障害者手帳
                    {(recipient as any).physicalHandicapGrade && ` ${(recipient as any).physicalHandicapGrade}級`}
                  </span>
                )}
                {(recipient as any).intellectualHandicapBook && (
                  <span className="px-3 py-1 bg-green-50 text-green-800 text-sm rounded border border-green-200">
                    療育手帳
                    {(recipient as any).intellectualHandicapGrade && ` ${(recipient as any).intellectualHandicapGrade}`}
                  </span>
                )}
                {(recipient as any).mentalHandicapBook && (
                  <span className="px-3 py-1 bg-purple-50 text-purple-800 text-sm rounded border border-purple-200">
                    精神障害者保健福祉手帳
                    {(recipient as any).mentalHandicapGrade && ` ${(recipient as any).mentalHandicapGrade}級`}
                  </span>
                )}
              </div>
            </div>
          )}

          {/* 障害年金・各種手当 */}
          {((recipient as any).disabilityPension || (recipient as any).specialChildAllowance ||
            (recipient as any).disabilityAllowance || (recipient as any).specialDisabilityAllowance ||
            (recipient as any).nursingAllowance) && (
            <div className="mb-4">
              <p className="text-sm font-medium text-muted-foreground mb-2">障害年金・各種手当</p>
              <div className="flex flex-wrap gap-2">
                {(recipient as any).disabilityPension && (
                  <span className="px-3 py-1 bg-indigo-50 text-indigo-800 text-sm rounded border border-indigo-200">
                    障害年金
                    {(recipient as any).disabilityPensionGrade && ` ${(recipient as any).disabilityPensionGrade}級`}
                    {(recipient as any).disabilityPensionType === "National" && "（基礎）"}
                    {(recipient as any).disabilityPensionType === "Employee" && "（厚生）"}
                  </span>
                )}
                {(recipient as any).specialChildAllowance && (
                  <span className="px-3 py-1 bg-pink-50 text-pink-800 text-sm rounded border border-pink-200">
                    特別児童扶養手当
                  </span>
                )}
                {(recipient as any).disabilityAllowance && (
                  <span className="px-3 py-1 bg-rose-50 text-rose-800 text-sm rounded border border-rose-200">
                    障害児福祉手当
                  </span>
                )}
                {(recipient as any).specialDisabilityAllowance && (
                  <span className="px-3 py-1 bg-orange-50 text-orange-800 text-sm rounded border border-orange-200">
                    特別障害者手当
                  </span>
                )}
                {(recipient as any).nursingAllowance && (
                  <span className="px-3 py-1 bg-yellow-50 text-yellow-800 text-sm rounded border border-yellow-200">
                    介護手当
                  </span>
                )}
              </div>
            </div>
          )}

          {/* 精神科・発達障害 */}
          {((recipient as any).psychiatricDiagnosis || (recipient as any).developmentalDiagnosis ||
            (recipient as any).autismSpectrumLevel || (recipient as any).medicalProtectionAdmission ||
            (recipient as any).outpatientMedication || (recipient as any).medicalFeeExemption) && (
            <div className="mb-4">
              <p className="text-sm font-medium text-muted-foreground mb-2">精神科・発達障害関連</p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {(recipient as any).psychiatricDiagnosis && (
                  <div>
                    <p className="text-xs text-muted-foreground">精神科診断名</p>
                    <p className="text-sm font-medium">{(recipient as any).psychiatricDiagnosis}</p>
                  </div>
                )}
                {(recipient as any).developmentalDiagnosis && (
                  <div>
                    <p className="text-xs text-muted-foreground">発達障害診断名</p>
                    <p className="text-sm font-medium">{(recipient as any).developmentalDiagnosis}</p>
                  </div>
                )}
                {(recipient as any).autismSpectrumLevel && (
                  <div>
                    <p className="text-xs text-muted-foreground">ASDレベル</p>
                    <p className="text-sm font-medium">
                      {(recipient as any).autismSpectrumLevel === "Level1" ? "レベル1（支援を要する）"
                        : (recipient as any).autismSpectrumLevel === "Level2" ? "レベル2（相当の支援を要する）"
                        : (recipient as any).autismSpectrumLevel === "Level3" ? "レベル3（非常に多くの支援を要する）"
                        : (recipient as any).autismSpectrumLevel}
                    </p>
                  </div>
                )}
                {(recipient as any).medicalFeeExemption && (recipient as any).medicalFeeExemption !== "None" && (
                  <div>
                    <p className="text-xs text-muted-foreground">自立支援医療（精神通院）</p>
                    <p className="text-sm font-medium">
                      {(recipient as any).medicalFeeExemption === "Applied" ? "申請中" : "適用済み"}
                    </p>
                  </div>
                )}
                <div className="flex gap-3">
                  {(recipient as any).medicalProtectionAdmission && (
                    <span className="px-2 py-1 bg-red-50 text-red-700 text-xs rounded border border-red-200">
                      医療保護入院歴あり
                    </span>
                  )}
                  {(recipient as any).outpatientMedication && (
                    <span className="px-2 py-1 bg-blue-50 text-blue-700 text-xs rounded border border-blue-200">
                      外来服薬中
                    </span>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* 高齢障害者・介護保険 */}
          {((recipient as any).isElderly || (recipient as any).careInsuranceCertified) && (
            <div>
              <p className="text-sm font-medium text-muted-foreground mb-2">高齢障害者・介護保険</p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {(recipient as any).isElderly && (
                  <span className="inline-flex items-center px-2 py-1 bg-amber-50 text-amber-800 text-xs rounded border border-amber-200 w-fit">
                    高齢障害者（65歳以上）
                  </span>
                )}
                {(recipient as any).careInsuranceCertified && (
                  <div>
                    <p className="text-xs text-muted-foreground">介護保険認定</p>
                    <p className="text-sm font-medium">
                      {(recipient as any).careInsuranceLevel === "Support1" ? "要支援1"
                        : (recipient as any).careInsuranceLevel === "Support2" ? "要支援2"
                        : (recipient as any).careInsuranceLevel === "Care1" ? "要介護1"
                        : (recipient as any).careInsuranceLevel === "Care2" ? "要介護2"
                        : (recipient as any).careInsuranceLevel === "Care3" ? "要介護3"
                        : (recipient as any).careInsuranceLevel === "Care4" ? "要介護4"
                        : (recipient as any).careInsuranceLevel === "Care5" ? "要介護5"
                        : (recipient as any).careInsuranceLevel || "認定済み"}
                    </p>
                  </div>
                )}
                {(recipient as any).careInsuranceExpiry && (
                  <div>
                    <p className="text-xs text-muted-foreground">介護保険有効期限</p>
                    <p className={`text-sm font-medium ${
                      new Date((recipient as any).careInsuranceExpiry) < new Date()
                        ? "text-destructive"
                        : new Date((recipient as any).careInsuranceExpiry) < new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
                        ? "text-amber-600"
                        : ""
                    }`}>
                      {new Date((recipient as any).careInsuranceExpiry).toLocaleDateString("ja-JP")}
                      {new Date((recipient as any).careInsuranceExpiry) < new Date() && " (期限切れ)"}
                    </p>
                  </div>
                )}
                {(recipient as any).continuedDisabilityService && (
                  <span className="inline-flex items-center px-2 py-1 bg-teal-50 text-teal-800 text-xs rounded border border-teal-200 w-fit">
                    障害福祉サービス継続利用
                  </span>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* 連絡先・医療情報 */}
      <div className="bg-card border rounded-lg p-6 mb-6">
        <h2 className="text-xl font-semibold mb-4">連絡先・医療情報</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {recipient.emergencyContact && (
            <div>
              <p className="text-sm text-muted-foreground">緊急連絡先</p>
              <p className="font-medium">{recipient.emergencyContact}</p>
            </div>
          )}
          {recipient.doctor && (
            <div>
              <p className="text-sm text-muted-foreground">主治医</p>
              <p className="font-medium">{recipient.doctor}</p>
            </div>
          )}
          {recipient.hospital && (
            <div>
              <p className="text-sm text-muted-foreground">医療機関</p>
              <p className="font-medium">{recipient.hospital}</p>
            </div>
          )}
          {recipient.allergies && (
            <div className="md:col-span-2">
              <p className="text-sm text-muted-foreground">アレルギー情報</p>
              <p className="font-medium text-destructive">{recipient.allergies}</p>
            </div>
          )}
          {recipient.medicalHistory && (
            <div className="md:col-span-2">
              <p className="text-sm text-muted-foreground">既往歴</p>
              <p className="font-medium">{recipient.medicalHistory}</p>
            </div>
          )}
          {recipient.notes && (
            <div className="md:col-span-2">
              <p className="text-sm text-muted-foreground">備考</p>
              <p className="font-medium">{recipient.notes}</p>
            </div>
          )}
        </div>
      </div>

      {/* 機能メニュー */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
        <Link href={`/recipients/${recipientId}/assessment`}>
          <div className="bg-card border rounded-lg p-6 hover:bg-accent transition-colors cursor-pointer">
            <FileText className="h-10 w-10 text-primary mb-4" />
            <h3 className="text-lg font-semibold mb-2">アセスメント</h3>
            <p className="text-sm text-muted-foreground">
              ADL・コミュニケーション・行動特性などの評価
            </p>
          </div>
        </Link>

        <Link href={`/recipients/${recipientId}/vpn`}>
          <div className="bg-card border rounded-lg p-6 hover:bg-accent transition-colors cursor-pointer">
            <Activity className="h-10 w-10 text-primary mb-4" />
            <h3 className="text-lg font-semibold mb-2">VPN記録</h3>
            <p className="text-sm text-muted-foreground">
              バイタルサイン・身体状態・栄養状態の記録
            </p>
          </div>
        </Link>

        <div className="bg-card border rounded-lg p-6 opacity-50">
          <FileText className="h-10 w-10 text-primary mb-4" />
          <h3 className="text-lg font-semibold mb-2">支援記録</h3>
          <p className="text-sm text-muted-foreground">
            日々の支援内容を記録
          </p>
          <p className="text-xs text-muted-foreground mt-2">※実装予定</p>
        </div>

        <div className="bg-card border rounded-lg p-6 opacity-50">
          <Pill className="h-10 w-10 text-primary mb-4" />
          <h3 className="text-lg font-semibold mb-2">服薬管理</h3>
          <p className="text-sm text-muted-foreground">
            服薬記録・予定管理
          </p>
          <p className="text-xs text-muted-foreground mt-2">※実装予定</p>
        </div>

        <div className="bg-card border rounded-lg p-6 opacity-50">
          <MessageSquare className="h-10 w-10 text-primary mb-4" />
          <h3 className="text-lg font-semibold mb-2">申し送り</h3>
          <p className="text-sm text-muted-foreground">
            引継ぎ事項の管理
          </p>
          <p className="text-xs text-muted-foreground mt-2">※実装予定</p>
        </div>

        <div className="bg-card border rounded-lg p-6 opacity-50">
          <AlertTriangle className="h-10 w-10 text-primary mb-4" />
          <h3 className="text-lg font-semibold mb-2">ヒヤリハット</h3>
          <p className="text-sm text-muted-foreground">
            事故報告・統計分析
          </p>
          <p className="text-xs text-muted-foreground mt-2">※実装予定</p>
        </div>
      </div>

      {/* 最近のVPN記録 */}
      {recipient.vitalSigns && recipient.vitalSigns.length > 0 && (
        <div className="bg-card border rounded-lg p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold">最近のVPN記録</h2>
            <Link href={`/recipients/${recipientId}/vpn`}>
              <Button variant="outline" size="sm">
                すべて表示
              </Button>
            </Link>
          </div>
          <div className="space-y-4">
            {recipient.vitalSigns.slice(0, 5).map((record) => (
              <div key={record.id} className="border-l-4 border-primary pl-4 py-2">
                <p className="text-sm font-semibold">
                  {new Date(record.measuredAt).toLocaleString("ja-JP")}
                </p>
                <div className="text-sm text-muted-foreground">
                  {record.temperature && `体温: ${record.temperature}℃ `}
                  {record.systolic && record.diastolic && `血圧: ${record.systolic}/${record.diastolic} `}
                  {record.pulse && `脈拍: ${record.pulse} `}
                  {record.spo2 && `SpO2: ${record.spo2}% `}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
