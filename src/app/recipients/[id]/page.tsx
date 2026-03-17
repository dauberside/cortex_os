"use client";

import { useParams, useRouter } from "next/navigation";
import { trpc } from "@/lib/trpc/client";
import { Button } from "@/components/ui/button";
import {
  ArrowLeft,
  Activity,
  FileText,
  Edit,
  Trash2,
  Download,
  Upload,
  Printer,
  History,
  ChevronUp,
  ChevronDown,
  User,
  Heart,
  Shield,
  Smile,
  MapPin,
  MoreVertical,
} from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { useState, useRef, useEffect } from "react";
import { ChangeHistory } from "@/components/recipients/ChangeHistory";
import { GuideRecordStatusBadge } from "@/components/guide/GuideRecordStatusBadge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";

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
  const [showChangeHistory, setShowChangeHistory] = useState(false);
  const [expandedSections, setExpandedSections] = useState<Set<string>>(
    new Set([
      "basic",
      "service",
      "welfare",
      "personality",
      "contact",
      "outing",
      "vpn",
    ])
  );
  const [toast, setToast] = useState<{
    message: string;
    type: "success" | "error";
  } | null>(null);
  const [importErrors, setImportErrors] = useState<
    Array<string | { row?: number; name?: string; error: string }>
  >([]);
  const [showImportErrors, setShowImportErrors] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const utils = trpc.useUtils();

  const { data: recipient, isLoading } = trpc.recipient.get.useQuery({
    id: recipientId,
  });

  // ガイド記録を取得（最新5件）
  const { data: guideRecords } = trpc.guideRecord.list.useQuery({
    recipientId,
    limit: 5,
  });

  // 閲覧ログを記録（1回のみ）
  const logViewMutation = trpc.auditLog.log.useMutation();
  const hasLoggedViewRef = useRef(false);

  useEffect(() => {
    if (recipient && !hasLoggedViewRef.current) {
      hasLoggedViewRef.current = true;
      logViewMutation.mutate({
        action: "View",
        resourceType: "CareRecipient",
        resourceId: recipientId,
        path: `/recipients/${recipientId}`,
        metadata: {
          recipientName: recipient.name,
        },
      });
    }
  }, [recipient, recipientId, logViewMutation]);

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

  const importMutation = trpc.recipient.importCSV.useMutation({
    onSuccess: (result) => {
      const msg =
        `インポート成功: ${result.imported}件の利用者を登録しました` +
        (result.errors ? ` (エラー: ${result.errors.length}件)` : "");
      showToast(
        msg,
        result.errors && result.errors.length > 0 ? "error" : "success"
      );

      if (result.errors && result.errors.length > 0) {
        setImportErrors(result.errors);
        setShowImportErrors(true);
      }

      utils.recipient.get.invalidate({ id: recipientId });
    },
    onError: (error) => {
      showToast(`インポート失敗: ${error.message}`, "error");
      setImportErrors([error.message]);
      setShowImportErrors(true);
    },
  });

  const showToast = (message: string, type: "success" | "error") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  const toggleSection = (sectionId: string) => {
    setExpandedSections((prev) => {
      const next = new Set(prev);
      if (next.has(sectionId)) {
        next.delete(sectionId);
      } else {
        next.add(sectionId);
      }
      return next;
    });
  };

  const handleDelete = () => {
    if (
      window.confirm(
        `${recipient?.name} さんを削除してもよろしいですか？\n\n※論理削除のため、後から復元可能です。`
      )
    ) {
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
      showToast("エクスポートに失敗しました", "error");
      console.error(error);
    }
  };

  const handleImport = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const tryRead = (encoding: string) =>
      new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (e) => resolve(e.target?.result as string);
        reader.onerror = reject;
        reader.readAsText(file, encoding);
      });

    (async () => {
      // Try UTF-8 first, fall back to Shift-JIS
      let content = await tryRead("UTF-8");
      // If first header char looks garbled (Shift-JIS read as UTF-8), retry
      if (!content.trimStart().startsWith("氏名")) {
        content = await tryRead("Shift-JIS");
      }
      // Strip BOM if present
      content = content.replace(/^\uFEFF/, "");
      // Normalize Windows line endings
      content = content.replace(/\r\n/g, "\n").replace(/\r/g, "\n");
      importMutation.mutate({ csvContent: content });
    })();

    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-lg">読み込み中...</div>
      </div>
    );
  }

  if (!recipient) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-destructive text-lg">利用者が見つかりません</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* トースト通知 */}
      {toast && (
        <div
          className={`fixed right-4 bottom-4 z-50 rounded-lg px-4 py-3 text-sm font-medium shadow-lg ${
            toast.type === "success"
              ? "bg-green-600 text-white"
              : "bg-red-600 text-white"
          }`}
        >
          {toast.message}
        </div>
      )}

      {/* インポートエラーダイアログ */}
      {showImportErrors && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="max-h-[80vh] w-full max-w-2xl overflow-auto rounded-lg border bg-white p-6 shadow-xl">
            <h3 className="mb-4 text-lg font-semibold">
              CSVインポートエラー詳細
            </h3>
            <div className="mb-6 space-y-2">
              {importErrors.map((error, index) => {
                // エラーが文字列の場合
                if (typeof error === "string") {
                  return (
                    <div
                      key={index}
                      className="rounded border border-red-200 bg-red-50 p-3 text-sm text-red-800"
                    >
                      {error}
                    </div>
                  );
                }
                // エラーがオブジェクトの場合
                const errorObj = error as any;
                const location = errorObj.row
                  ? `${errorObj.row}行目`
                  : errorObj.name
                    ? `${errorObj.name}`
                    : "不明";
                const message = errorObj.error || JSON.stringify(errorObj);
                return (
                  <div
                    key={index}
                    className="rounded border border-red-200 bg-red-50 p-3 text-sm text-red-800"
                  >
                    <strong>{location}:</strong> {message}
                  </div>
                );
              })}
            </div>
            <div className="flex justify-end">
              <Button
                variant="outline"
                onClick={() => {
                  setShowImportErrors(false);
                  setImportErrors([]);
                }}
              >
                閉じる
              </Button>
            </div>
          </div>
        </div>
      )}

      <div className="container mx-auto px-4 py-8">
        <Link href="/recipients">
          <Button variant="ghost" className="mb-6">
            <ArrowLeft className="mr-2 h-4 w-4" />
            利用者一覧に戻る
          </Button>
        </Link>

        {/* CSV Import Hidden File Input */}
        <input
          ref={fileInputRef}
          type="file"
          accept=".csv"
          onChange={handleImport}
          className="hidden"
        />

        <div className="mb-8 flex items-start justify-between">
          <div>
            <h1 className="mb-3 text-4xl font-bold tracking-tight">
              {recipient.name}
            </h1>
            {recipient.nameKana && (
              <p className="text-muted-foreground text-lg">
                ({recipient.nameKana})
              </p>
            )}
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="icon">
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <Link href={`/recipients/${recipientId}/print/face`}>
                <DropdownMenuItem>
                  <Printer className="mr-2 h-4 w-4" />
                  フェイスシート印刷
                </DropdownMenuItem>
              </Link>
              <Link href={`/recipients/${recipientId}/print/assessment`}>
                <DropdownMenuItem>
                  <Printer className="mr-2 h-4 w-4" />
                  アセスメントシート印刷
                </DropdownMenuItem>
              </Link>
              <Link href={`/recipients/${recipientId}/support-profile/print`}>
                <DropdownMenuItem>
                  <Printer className="mr-2 h-4 w-4" />
                  サポート基本情報票
                </DropdownMenuItem>
              </Link>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={() => setShowChangeHistory(!showChangeHistory)}
              >
                <History className="mr-2 h-4 w-4" />
                変更履歴
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={handleExport}
                disabled={exportMutation.isFetching}
              >
                <Download className="mr-2 h-4 w-4" />
                CSV出力
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => fileInputRef.current?.click()}
                disabled={importMutation.isPending}
              >
                <Upload className="mr-2 h-4 w-4" />
                {importMutation.isPending ? "取込中..." : "CSV取込"}
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <Link href={`/recipients/${recipientId}/edit`}>
                <DropdownMenuItem>
                  <Edit className="mr-2 h-4 w-4" />
                  編集
                </DropdownMenuItem>
              </Link>
              <DropdownMenuItem
                onClick={handleDelete}
                disabled={deleteMutation.isPending}
                className="text-red-600 focus:text-red-600"
              >
                <Trash2 className="mr-2 h-4 w-4" />
                削除
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* 基本情報 */}
        <div className="bg-card mb-6 rounded-lg border p-6 shadow-sm">
          <button
            onClick={() => toggleSection("basic")}
            className="mb-6 flex w-full cursor-pointer items-center justify-between rounded-lg p-2 -m-2 transition-colors hover:bg-gray-50"
          >
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-blue-100 p-2">
                <User className="h-5 w-5 text-blue-600" />
              </div>
              <h2 className="text-2xl font-bold">基本情報</h2>
            </div>
            {expandedSections.has("basic") ? (
              <ChevronUp className="text-muted-foreground h-6 w-6" />
            ) : (
              <ChevronDown className="text-muted-foreground h-6 w-6" />
            )}
          </button>
          {expandedSections.has("basic") && (
            <div className="space-y-4">
              {/* 上段: 写真と基本情報 */}
              <div className="flex flex-col gap-4 md:flex-row">
                {/* 写真 */}
                {recipient.photoUrl && (
                  <div className="flex-shrink-0">
                    <Image
                      src={recipient.photoUrl}
                      alt={`${recipient.name}さんの写真`}
                      width={192}
                      height={192}
                      className="h-48 w-48 rounded-lg object-cover"
                    />
                  </div>
                )}

                {/* 基本情報グリッド（写真の右側） */}
                <div className="grid flex-1 grid-cols-1 gap-1.5 md:grid-cols-2">
                  <div className="rounded-lg bg-gray-50 p-3">
                    <p className="text-muted-foreground mb-0.5 text-xs">
                      生年月日
                    </p>
                    <p className="">
                      {new Date(recipient.birthDate).toLocaleDateString("ja-JP")}
                    </p>
                  </div>
                  <div className="rounded-lg bg-gray-50 p-3">
                    <p className="text-muted-foreground mb-0.5 text-xs">年齢</p>
                    <p className="">
                      {Math.floor(
                        (new Date().getTime() -
                          new Date(recipient.birthDate).getTime()) /
                          (365.25 * 24 * 60 * 60 * 1000)
                      )}
                      歳
                    </p>
                  </div>
                  <div className="rounded-lg bg-gray-50 p-3">
                    <p className="text-muted-foreground mb-0.5 text-xs">性別</p>
                    <p className="">
                      {recipient.gender === "Male"
                        ? "男性"
                        : recipient.gender === "Female"
                          ? "女性"
                          : "その他"}
                    </p>
                  </div>
                  <div className="rounded-lg bg-gray-50 p-3 md:col-start-1">
                    <p className="text-muted-foreground mb-0.5 text-xs">
                      障害種別
                    </p>
                    <p className="">
                      {recipient.disabilityType.length > 0
                        ? recipient.disabilityType
                            .map((t: string) =>
                              t === "Physical"
                                ? "身体障害"
                                : t === "Intellectual"
                                  ? "知的障害"
                                  : "精神障害"
                            )
                            .join(", ")
                        : "未設定"}
                    </p>
                  </div>
                  <div className="rounded-lg bg-gray-50 p-3 md:col-start-2">
                    <p className="text-muted-foreground mb-0.5 text-xs">
                      障害支援区分
                    </p>
                    <p className="">
                      {recipient.supportLevel
                        ? `区分${recipient.supportLevel}`
                        : "未設定"}
                    </p>
                  </div>
                </div>
              </div>

              {/* 下段: 所持手帳以降は全幅 */}
              <div className="grid grid-cols-1 gap-1.5 md:grid-cols-2">

                {/* 所持手帳 */}
                {((recipient as any).physicalHandicapBook ||
                  (recipient as any).intellectualHandicapBook ||
                  (recipient as any).mentalHandicapBook) && (
                  <div className="rounded-lg bg-blue-50 p-3 md:col-span-2">
                    <p className="text-muted-foreground mb-0.5 text-xs">
                      所持手帳
                    </p>
                    <div className="space-y-1 text-sm">
                      {(recipient as any).physicalHandicapBook && (
                        <p>
                          身体障害者手帳
                          {(recipient as any).physicalHandicapGrade && (
                            <span className="ml-2 font-semibold">
                              {(recipient as any).physicalHandicapGrade}級
                            </span>
                          )}
                        </p>
                      )}
                      {(recipient as any).intellectualHandicapBook && (
                        <p>
                          愛の手帳（療育手帳）
                          {(recipient as any).intellectualHandicapGrade && (
                            <span className="ml-2 font-semibold">
                              {(recipient as any).intellectualHandicapGrade}
                            </span>
                          )}
                        </p>
                      )}
                      {(recipient as any).mentalHandicapBook && (
                        <p>
                          精神障害者保健福祉手帳
                          {(recipient as any).mentalHandicapGrade && (
                            <span className="ml-2 font-semibold">
                              {(recipient as any).mentalHandicapGrade}級
                            </span>
                          )}
                        </p>
                      )}
                    </div>
                  </div>
                )}

                {/* 通所先・学校 */}
                {((recipient as any).school ||
                  (recipient as any).dayServiceFacility) && (
                  <>
                    {(recipient as any).school && (
                      <div className="rounded-lg bg-gray-50 p-3">
                        <p className="text-muted-foreground mb-0.5 text-xs">
                          学校名
                        </p>
                        <p className="">{(recipient as any).school}</p>
                      </div>
                    )}
                    {(recipient as any).dayServiceFacility && (
                      <div className="rounded-lg bg-gray-50 p-3">
                        <p className="text-muted-foreground mb-0.5 text-xs">
                          通所先
                        </p>
                        <p className="">
                          {(recipient as any).dayServiceFacility}
                        </p>
                      </div>
                    )}
                  </>
                )}

                {/* 住所情報 */}
                {((recipient as any).homeAddress || recipient.address) && (
                  <div className="rounded-lg bg-gray-50 p-3 md:col-span-2">
                    <p className="text-muted-foreground mb-0.5 text-xs">
                      自宅住所
                    </p>
                    <p className="">
                      {(recipient as any).homeAddress || recipient.address}
                    </p>
                  </div>
                )}

                {(recipient as any).nearestStation && (
                  <div className="rounded-lg bg-gray-50 p-3">
                    <p className="text-muted-foreground mb-0.5 text-xs">
                      最寄り駅
                    </p>
                    <p className="">
                      {(() => {
                        const station = (recipient as any).nearestStation || "";
                        const minutes = (recipient as any).walkingMinutes;

                        // 既に「徒歩」「分」「(」等の情報が含まれている場合はそのまま表示
                        if (
                          station.includes("徒歩") ||
                          station.includes("分") ||
                          station.includes("(")
                        ) {
                          return station;
                        }

                        // 何も含まれていない場合のみwalkingMinutesを追加
                        if (minutes) {
                          return `${station} (徒歩${minutes}分)`;
                        }

                        return station;
                      })()}
                    </p>
                  </div>
                )}

                {/* 電話番号 */}
                {((recipient as any).homePhone || recipient.phone) && (
                  <div className="rounded-lg bg-gray-50 p-3">
                    <p className="text-muted-foreground mb-0.5 text-xs">
                      自宅電話
                    </p>
                    <p className="font-mono">
                      {(recipient as any).homePhone || recipient.phone}
                    </p>
                  </div>
                )}

                {(recipient as any).hasMobilePhone &&
                  (recipient as any).mobilePhone && (
                    <div className="rounded-lg bg-gray-50 p-3">
                      <p className="text-muted-foreground mb-0.5 text-xs">
                        本人携帯
                      </p>
                      <p className="font-mono">
                        {(recipient as any).mobilePhone}
                      </p>
                    </div>
                  )}

                {/* 居住形態 */}
                {(recipient as any).livingType && (
                  <div className="rounded-lg bg-gray-50 p-3 md:col-span-2">
                    <p className="text-muted-foreground mb-0.5 text-xs">
                      居住形態
                    </p>
                    <p className="">
                      {(recipient as any).livingType === "FamilyHome"
                        ? "家族と同居"
                        : (recipient as any).livingType === "Alone"
                          ? "一人暮らし"
                          : (recipient as any).livingType === "GroupHome"
                            ? "グループホーム"
                            : (recipient as any).livingType === "Facility"
                              ? "施設入所"
                              : (recipient as any).livingType}
                    </p>
                  </div>
                )}

                {/* グループホーム情報 */}
                {(recipient as any).ghName && (
                  <>
                    <div className="md:col-span-2">
                      <div className="rounded-lg border-2 border-indigo-200 bg-indigo-50 p-4">
                        <p className="mb-3 text-sm font-bold text-indigo-700 uppercase">
                          🏠 グループホーム情報
                        </p>
                        <div className="grid gap-4 md:grid-cols-2">
                          <div>
                            <p className="text-muted-foreground mb-1 text-xs font-medium">
                              名称
                            </p>
                            <p className="font-semibold">
                              {(recipient as any).ghName}
                            </p>
                          </div>
                          {(recipient as any).ghCorporation && (
                            <div>
                              <p className="text-muted-foreground mb-1 text-xs font-medium">
                                運営法人
                              </p>
                              <p className="font-semibold">
                                {(recipient as any).ghCorporation}
                              </p>
                            </div>
                          )}
                          {(recipient as any).ghAddress && (
                            <div className="md:col-span-2">
                              <p className="text-muted-foreground mb-1 text-xs font-medium">
                                住所
                              </p>
                              <p className="font-semibold">
                                {(recipient as any).ghAddress}
                              </p>
                            </div>
                          )}
                          {(recipient as any).ghPhone && (
                            <div>
                              <p className="text-muted-foreground mb-1 text-xs font-medium">
                                電話番号
                              </p>
                              <p className="font-mono font-semibold">
                                {(recipient as any).ghPhone}
                              </p>
                            </div>
                          )}
                          {(recipient as any).ghAccess && (
                            <div>
                              <p className="text-muted-foreground mb-1 text-xs font-medium">
                                アクセス
                              </p>
                              <p className="font-semibold">
                                {(recipient as any).ghAccess}
                              </p>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </>
                )}

                {/* 計画相談 */}
                {((recipient as any).planConsultationOffice ||
                  (recipient as any).planConsultant) && (
                  <div className="md:col-span-2">
                    <div className="rounded-lg bg-teal-50 p-4">
                      <p className="mb-3 text-xs font-bold text-teal-700 uppercase">
                        📋 計画相談
                      </p>
                      <div className="grid gap-4 md:grid-cols-2">
                        {(recipient as any).planConsultationOffice && (
                          <div>
                            <p className="text-muted-foreground mb-1 text-xs font-medium">
                              事業所
                            </p>
                            <p className="font-semibold">
                              {(recipient as any).planConsultationOffice}
                            </p>
                          </div>
                        )}
                        {(recipient as any).planConsultant && (
                          <div>
                            <p className="text-muted-foreground mb-1 text-xs font-medium">
                              担当者
                            </p>
                            <p className="font-semibold">
                              {(recipient as any).planConsultant}
                            </p>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {/* 運用ルール */}
                {((recipient as any).priorConfirmationNote ||
                  (recipient as any).hasRecordNote ||
                  (recipient as any).walletNote ||
                  (recipient as any).cafeBreak ||
                  (recipient as any).trainDiscountType ||
                  (recipient as any).hasToeiPass ||
                  (recipient as any).hasRestrictionConsent) && (
                  <div className="md:col-span-2">
                    <div className="rounded-lg border-2 border-amber-200 bg-amber-50 p-4">
                      <p className="mb-3 text-sm font-bold text-amber-700 uppercase">
                        📌 運用ルール
                      </p>
                      <div className="grid gap-3 md:grid-cols-2">
                        {(recipient as any).priorConfirmationNote && (
                          <div className="rounded bg-white p-3">
                            <p className="text-muted-foreground mb-1 text-xs font-medium">
                              前日確認
                            </p>
                            <p className="text-sm font-semibold">
                              {(recipient as any).priorConfirmationNote}
                            </p>
                          </div>
                        )}
                        {(recipient as any).hasRecordNote && (
                          <div className="rounded bg-white p-3">
                            <p className="text-muted-foreground mb-1 text-xs font-medium">
                              記録ノート
                            </p>
                            <p className="text-sm font-semibold">
                              {(recipient as any).hasRecordNote
                                ? "持参あり"
                                : "持参なし"}
                            </p>
                          </div>
                        )}
                        {(recipient as any).walletNote && (
                          <div className="rounded bg-white p-3">
                            <p className="text-muted-foreground mb-1 text-xs font-medium">
                              お財布・お金
                            </p>
                            <p className="text-sm font-semibold">
                              {(recipient as any).walletNote}
                            </p>
                          </div>
                        )}
                        {(recipient as any).cafeBreak && (
                          <div className="rounded bg-white p-3">
                            <p className="text-muted-foreground mb-1 text-xs font-medium">
                              休憩喫茶
                            </p>
                            <p className="text-sm font-semibold">
                              {(recipient as any).cafeBreak
                                ? "希望する"
                                : "希望しない"}
                              {(recipient as any).cafeCondition &&
                                ` (${(recipient as any).cafeCondition})`}
                            </p>
                          </div>
                        )}
                        {(recipient as any).trainDiscountType && (
                          <div className="rounded bg-white p-3">
                            <p className="text-muted-foreground mb-1 text-xs font-medium">
                              電車割引
                            </p>
                            <p className="text-sm font-semibold">
                              {(recipient as any).trainDiscountType}
                            </p>
                          </div>
                        )}
                        {(recipient as any).hasToeiPass && (
                          <div className="rounded bg-white p-3">
                            <p className="text-muted-foreground mb-1 text-xs font-medium">
                              都営乗車券
                            </p>
                            <p className="text-sm font-semibold">所持あり</p>
                          </div>
                        )}
                        {(recipient as any).hasRestrictionConsent && (
                          <div className="rounded bg-white p-3">
                            <p className="text-muted-foreground mb-1 text-xs font-medium">
                              行動制限同意書
                            </p>
                            <p className="text-sm font-semibold">
                              {(recipient as any).hasRestrictionConsent
                                ? "取得済"
                                : "未取得"}
                            </p>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* サービス情報 */}
        {((recipient as any).serviceTypes?.length > 0 ||
          (recipient as any).utilizationStatus ||
          (recipient as any).recipientNumber) && (
          <div className="bg-card mb-6 rounded-lg border p-6 shadow-sm">
            <button
              onClick={() => toggleSection("service")}
              className="mb-6 flex w-full cursor-pointer items-center justify-between rounded-lg p-2 -m-2 transition-colors hover:bg-gray-50"
            >
              <div className="flex items-center gap-3">
                <div className="rounded-lg bg-green-100 p-2">
                  <FileText className="h-5 w-5 text-green-600" />
                </div>
                <h2 className="text-2xl font-bold">サービス・受給者証情報</h2>
              </div>
              {expandedSections.has("service") ? (
                <ChevronUp className="text-muted-foreground h-6 w-6" />
              ) : (
                <ChevronDown className="text-muted-foreground h-6 w-6" />
              )}
            </button>
            {expandedSections.has("service") && (
              <div className="space-y-4">
                {(recipient as any).serviceTypes?.length > 0 && (
                  <div>
                    <p className="text-muted-foreground mb-2 text-sm">
                      利用サービス種別
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {(recipient as any).serviceTypes.map((type: string) => (
                        <span
                          key={type}
                          className={`rounded-full px-3 py-1 text-sm font-medium ${
                            SERVICE_TYPE_COLORS[type] ||
                            "bg-gray-100 text-gray-700"
                          }`}
                        >
                          {SERVICE_TYPE_LABELS[type] || type}
                        </span>
                      ))}
                      {(recipient as any).behaviorSupportNeeded && (
                        <span className="rounded-full border border-red-200 bg-red-100 px-3 py-1 text-sm font-medium text-red-800">
                          行動援護対象
                          {(recipient as any).behaviorScore &&
                            ` (${(recipient as any).behaviorScore}点)`}
                        </span>
                      )}
                    </div>
                  </div>
                )}

                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  {(recipient as any).utilizationStatus && (
                    <div>
                      <p className="text-muted-foreground text-sm">利用状況</p>
                      <p className="font-medium">
                        {UTILIZATION_STATUS_LABELS[
                          (recipient as any).utilizationStatus
                        ] || (recipient as any).utilizationStatus}
                      </p>
                    </div>
                  )}
                  {(recipient as any).recipientNumber && (
                    <div>
                      <p className="text-muted-foreground text-sm">
                        受給者番号
                      </p>
                      <p className="font-mono font-medium">
                        {(recipient as any).recipientNumber}
                      </p>
                    </div>
                  )}
                  {(recipient as any).receivedDate && (
                    <div>
                      <p className="text-muted-foreground text-sm">
                        受給者証交付日
                      </p>
                      <p className="font-medium">
                        {new Date(
                          (recipient as any).receivedDate
                        ).toLocaleDateString("ja-JP")}
                      </p>
                    </div>
                  )}
                  {(recipient as any).validUntil && (
                    <div>
                      <p className="text-muted-foreground text-sm">
                        受給者証有効期限
                      </p>
                      <p
                        className={`font-medium ${
                          new Date((recipient as any).validUntil) < new Date()
                            ? "text-destructive"
                            : new Date((recipient as any).validUntil) <
                                new Date(+new Date() + 30 * 24 * 60 * 60 * 1000)
                              ? "text-amber-600"
                              : ""
                        }`}
                      >
                        {new Date(
                          (recipient as any).validUntil
                        ).toLocaleDateString("ja-JP")}
                        {new Date((recipient as any).validUntil) < new Date() &&
                          " (期限切れ)"}
                        {new Date((recipient as any).validUntil) >=
                          new Date() &&
                          new Date((recipient as any).validUntil) <
                            new Date(+new Date() + 30 * 24 * 60 * 60 * 1000) &&
                          " (間もなく期限切れ)"}
                      </p>
                    </div>
                  )}
                </div>

                {(recipient as any).allowances?.length > 0 && (
                  <div>
                    <p className="text-muted-foreground mb-2 text-sm">
                      適用加算
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {(recipient as any).allowances.map(
                        (allowance: string) => (
                          <span
                            key={allowance}
                            className="rounded border border-amber-200 bg-amber-50 px-3 py-1 text-sm text-amber-800"
                          >
                            {ALLOWANCE_LABELS[allowance] || allowance}
                          </span>
                        )
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* 障害福祉制度情報 */}
        {((recipient as any).physicalHandicapBook ||
          (recipient as any).intellectualHandicapBook ||
          (recipient as any).mentalHandicapBook ||
          (recipient as any).disabilityPension ||
          (recipient as any).specialChildAllowance ||
          (recipient as any).specialDisabilityAllowance ||
          (recipient as any).nursingAllowance ||
          (recipient as any).psychiatricDiagnosis ||
          (recipient as any).developmentalDiagnosis ||
          (recipient as any).isElderly ||
          (recipient as any).careInsuranceCertified) && (
          <div className="bg-card mb-6 rounded-lg border p-6 shadow-sm">
            <button
              onClick={() => toggleSection("welfare")}
              className="mb-6 flex w-full cursor-pointer items-center justify-between rounded-lg p-2 -m-2 transition-colors hover:bg-gray-50"
            >
              <div className="flex items-center gap-3">
                <div className="rounded-lg bg-purple-100 p-2">
                  <Shield className="h-5 w-5 text-purple-600" />
                </div>
                <h2 className="text-2xl font-bold">障害福祉制度情報</h2>
              </div>
              {expandedSections.has("welfare") ? (
                <ChevronUp className="text-muted-foreground h-6 w-6" />
              ) : (
                <ChevronDown className="text-muted-foreground h-6 w-6" />
              )}
            </button>
            {expandedSections.has("welfare") && (
              <div>
                {/* 障害者手帳 */}
                {((recipient as any).physicalHandicapBook ||
                  (recipient as any).intellectualHandicapBook ||
                  (recipient as any).mentalHandicapBook) && (
                  <div className="mb-4">
                    <p className="text-muted-foreground mb-2 text-sm font-medium">
                      障害者手帳
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {(recipient as any).physicalHandicapBook && (
                        <span className="rounded border border-blue-200 bg-blue-50 px-3 py-1 text-sm text-blue-800">
                          身体障害者手帳
                          {(recipient as any).physicalHandicapGrade &&
                            ` ${(recipient as any).physicalHandicapGrade}級`}
                        </span>
                      )}
                      {(recipient as any).intellectualHandicapBook && (
                        <span className="rounded border border-green-200 bg-green-50 px-3 py-1 text-sm text-green-800">
                          療育手帳
                          {(recipient as any).intellectualHandicapGrade &&
                            ` ${(recipient as any).intellectualHandicapGrade}`}
                        </span>
                      )}
                      {(recipient as any).mentalHandicapBook && (
                        <span className="rounded border border-purple-200 bg-purple-50 px-3 py-1 text-sm text-purple-800">
                          精神障害者保健福祉手帳
                          {(recipient as any).mentalHandicapGrade &&
                            ` ${(recipient as any).mentalHandicapGrade}級`}
                        </span>
                      )}
                    </div>
                  </div>
                )}

                {/* 障害年金・各種手当 */}
                {((recipient as any).disabilityPension ||
                  (recipient as any).specialChildAllowance ||
                  (recipient as any).disabilityAllowance ||
                  (recipient as any).specialDisabilityAllowance ||
                  (recipient as any).nursingAllowance) && (
                  <div className="mb-4">
                    <p className="text-muted-foreground mb-2 text-sm font-medium">
                      障害年金・各種手当
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {(recipient as any).disabilityPension && (
                        <span className="rounded border border-indigo-200 bg-indigo-50 px-3 py-1 text-sm text-indigo-800">
                          障害年金
                          {(recipient as any).disabilityPensionGrade &&
                            ` ${(recipient as any).disabilityPensionGrade}級`}
                          {(recipient as any).disabilityPensionType ===
                            "National" && "（基礎）"}
                          {(recipient as any).disabilityPensionType ===
                            "Employee" && "（厚生）"}
                        </span>
                      )}
                      {(recipient as any).specialChildAllowance && (
                        <span className="rounded border border-pink-200 bg-pink-50 px-3 py-1 text-sm text-pink-800">
                          特別児童扶養手当
                        </span>
                      )}
                      {(recipient as any).disabilityAllowance && (
                        <span className="rounded border border-rose-200 bg-rose-50 px-3 py-1 text-sm text-rose-800">
                          障害児福祉手当
                        </span>
                      )}
                      {(recipient as any).specialDisabilityAllowance && (
                        <span className="rounded border border-orange-200 bg-orange-50 px-3 py-1 text-sm text-orange-800">
                          特別障害者手当
                        </span>
                      )}
                      {(recipient as any).nursingAllowance && (
                        <span className="rounded border border-yellow-200 bg-yellow-50 px-3 py-1 text-sm text-yellow-800">
                          介護手当
                        </span>
                      )}
                    </div>
                  </div>
                )}

                {/* 精神科・発達障害 */}
                {((recipient as any).psychiatricDiagnosis ||
                  (recipient as any).developmentalDiagnosis ||
                  (recipient as any).autismSpectrumLevel ||
                  (recipient as any).medicalProtectionAdmission ||
                  (recipient as any).outpatientMedication ||
                  (recipient as any).medicalFeeExemption) && (
                  <div className="mb-4">
                    <p className="text-muted-foreground mb-2 text-sm font-medium">
                      精神科・発達障害関連
                    </p>
                    <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                      {(recipient as any).psychiatricDiagnosis && (
                        <div>
                          <p className="text-muted-foreground text-xs">
                            精神科診断名
                          </p>
                          <p className="text-sm font-medium">
                            {(recipient as any).psychiatricDiagnosis}
                          </p>
                        </div>
                      )}
                      {(recipient as any).developmentalDiagnosis && (
                        <div>
                          <p className="text-muted-foreground text-xs">
                            発達障害診断名
                          </p>
                          <p className="text-sm font-medium">
                            {(recipient as any).developmentalDiagnosis}
                          </p>
                        </div>
                      )}
                      {(recipient as any).autismSpectrumLevel && (
                        <div>
                          <p className="text-muted-foreground text-xs">
                            ASDレベル
                          </p>
                          <p className="text-sm font-medium">
                            {(recipient as any).autismSpectrumLevel === "Level1"
                              ? "レベル1（支援を要する）"
                              : (recipient as any).autismSpectrumLevel ===
                                  "Level2"
                                ? "レベル2（相当の支援を要する）"
                                : (recipient as any).autismSpectrumLevel ===
                                    "Level3"
                                  ? "レベル3（非常に多くの支援を要する）"
                                  : (recipient as any).autismSpectrumLevel}
                          </p>
                        </div>
                      )}
                      {(recipient as any).medicalFeeExemption &&
                        (recipient as any).medicalFeeExemption !== "None" && (
                          <div>
                            <p className="text-muted-foreground text-xs">
                              自立支援医療（精神通院）
                            </p>
                            <p className="text-sm font-medium">
                              {(recipient as any).medicalFeeExemption ===
                              "Applied"
                                ? "申請中"
                                : "適用済み"}
                            </p>
                          </div>
                        )}
                      <div className="flex gap-3">
                        {(recipient as any).medicalProtectionAdmission && (
                          <span className="rounded border border-red-200 bg-red-50 px-2 py-1 text-xs text-red-700">
                            医療保護入院歴あり
                          </span>
                        )}
                        {(recipient as any).outpatientMedication && (
                          <span className="rounded border border-blue-200 bg-blue-50 px-2 py-1 text-xs text-blue-700">
                            外来服薬中
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {/* 高齢障害者・介護保険 */}
                {((recipient as any).isElderly ||
                  (recipient as any).careInsuranceCertified) && (
                  <div>
                    <p className="text-muted-foreground mb-2 text-sm font-medium">
                      高齢障害者・介護保険
                    </p>
                    <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                      {(recipient as any).isElderly && (
                        <span className="inline-flex w-fit items-center rounded border border-amber-200 bg-amber-50 px-2 py-1 text-xs text-amber-800">
                          高齢障害者（65歳以上）
                        </span>
                      )}
                      {(recipient as any).careInsuranceCertified && (
                        <div>
                          <p className="text-muted-foreground text-xs">
                            介護保険認定
                          </p>
                          <p className="text-sm font-medium">
                            {(recipient as any).careInsuranceLevel ===
                            "Support1"
                              ? "要支援1"
                              : (recipient as any).careInsuranceLevel ===
                                  "Support2"
                                ? "要支援2"
                                : (recipient as any).careInsuranceLevel ===
                                    "Care1"
                                  ? "要介護1"
                                  : (recipient as any).careInsuranceLevel ===
                                      "Care2"
                                    ? "要介護2"
                                    : (recipient as any).careInsuranceLevel ===
                                        "Care3"
                                      ? "要介護3"
                                      : (recipient as any)
                                            .careInsuranceLevel === "Care4"
                                        ? "要介護4"
                                        : (recipient as any)
                                              .careInsuranceLevel === "Care5"
                                          ? "要介護5"
                                          : (recipient as any)
                                              .careInsuranceLevel || "認定済み"}
                          </p>
                        </div>
                      )}
                      {(recipient as any).careInsuranceExpiry && (
                        <div>
                          <p className="text-muted-foreground text-xs">
                            介護保険有効期限
                          </p>
                          <p
                            className={`text-sm font-medium ${
                              new Date((recipient as any).careInsuranceExpiry) <
                              new Date()
                                ? "text-destructive"
                                : new Date(
                                      (recipient as any).careInsuranceExpiry
                                    ) <
                                    new Date(
                                      +new Date() + 30 * 24 * 60 * 60 * 1000
                                    )
                                  ? "text-amber-600"
                                  : ""
                            }`}
                          >
                            {new Date(
                              (recipient as any).careInsuranceExpiry
                            ).toLocaleDateString("ja-JP")}
                            {new Date((recipient as any).careInsuranceExpiry) <
                              new Date() && " (期限切れ)"}
                          </p>
                        </div>
                      )}
                      {(recipient as any).continuedDisabilityService && (
                        <span className="inline-flex w-fit items-center rounded border border-teal-200 bg-teal-50 px-2 py-1 text-xs text-teal-800">
                          障害福祉サービス継続利用
                        </span>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* 性格・支援方法 */}
        {((recipient as any).personalityNote ||
          (recipient as any).interactionNote ||
          (recipient as any).hobbies) && (
          <div className="bg-card mb-6 rounded-lg border p-6 shadow-sm">
            <button
              onClick={() => toggleSection("personality")}
              className="mb-6 flex w-full cursor-pointer items-center justify-between rounded-lg p-2 -m-2 transition-colors hover:bg-gray-50"
            >
              <div className="flex items-center gap-3">
                <div className="rounded-lg bg-amber-100 p-2">
                  <Smile className="h-5 w-5 text-amber-600" />
                </div>
                <h2 className="text-2xl font-bold">性格・支援方法</h2>
              </div>
              {expandedSections.has("personality") ? (
                <ChevronUp className="text-muted-foreground h-6 w-6" />
              ) : (
                <ChevronDown className="text-muted-foreground h-6 w-6" />
              )}
            </button>
            {expandedSections.has("personality") && (
              <div className="space-y-4">
                {(recipient as any).personalityNote && (
                  <div className="rounded-lg bg-gray-50 p-4">
                    <p className="text-muted-foreground mb-2 text-xs font-medium uppercase">
                      性格特記
                    </p>
                    <p className="leading-relaxed whitespace-pre-wrap">
                      {(recipient as any).personalityNote}
                    </p>
                  </div>
                )}

                {(recipient as any).interactionNote && (
                  <div className="rounded-lg bg-blue-50 p-4">
                    <p className="mb-2 text-xs font-medium text-blue-700 uppercase">
                      💡 関わり方のポイント
                    </p>
                    <p className="leading-relaxed whitespace-pre-wrap text-blue-900">
                      {(recipient as any).interactionNote}
                    </p>
                  </div>
                )}

                {(recipient as any).hobbies && (
                  <div className="rounded-lg bg-gray-50 p-4">
                    <p className="text-muted-foreground mb-2 text-xs font-medium uppercase">
                      趣味・好きなこと
                    </p>
                    <p className="leading-relaxed whitespace-pre-wrap">
                      {(recipient as any).hobbies}
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* 連絡先・医療情報 */}
        <div className="bg-card mb-6 rounded-lg border p-6 shadow-sm">
          <button
            onClick={() => toggleSection("contact")}
            className="mb-6 flex w-full cursor-pointer items-center justify-between rounded-lg p-2 -m-2 transition-colors hover:bg-gray-50"
          >
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-red-100 p-2">
                <Heart className="h-5 w-5 text-red-600" />
              </div>
              <h2 className="text-2xl font-bold">連絡先・医療情報</h2>
            </div>
            {expandedSections.has("contact") ? (
              <ChevronUp className="text-muted-foreground h-6 w-6" />
            ) : (
              <ChevronDown className="text-muted-foreground h-6 w-6" />
            )}
          </button>
          {expandedSections.has("contact") && (
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              {recipient.emergencyContact && (
                <div className="rounded-lg bg-gray-50 p-4">
                  <p className="text-muted-foreground mb-1 text-xs">
                    緊急連絡先
                  </p>
                  <p className="">
                    {recipient.emergencyContact}
                    {(recipient as any).emergencyRelation &&
                      ` (${(recipient as any).emergencyRelation})`}
                  </p>
                </div>
              )}
              {recipient.doctor && (
                <div className="rounded-lg bg-gray-50 p-4">
                  <p className="text-muted-foreground mb-1 text-xs">主治医</p>
                  <p className="">{recipient.doctor}</p>
                </div>
              )}
              {recipient.hospital && (
                <div className="rounded-lg bg-gray-50 p-4">
                  <p className="text-muted-foreground mb-1 text-xs">医療機関</p>
                  <p className="">{recipient.hospital}</p>
                </div>
              )}
              {recipient.allergies && (
                <div className="rounded-lg border-2 border-red-200 bg-red-50 p-4 md:col-span-2">
                  <p className="mb-1 text-xs font-bold text-red-700">
                    ⚠️ アレルギー情報
                  </p>
                  <p className="text-destructive">{recipient.allergies}</p>
                </div>
              )}
              {recipient.medicalHistory && (
                <div className="rounded-lg bg-gray-50 p-4 md:col-span-2">
                  <p className="text-muted-foreground mb-1 text-xs">既往歴</p>
                  <p className="">{recipient.medicalHistory}</p>
                </div>
              )}
              {recipient.notes && (
                <div className="rounded-lg bg-gray-50 p-4 md:col-span-2">
                  <p className="text-muted-foreground mb-1 text-xs">備考</p>
                  <p className="">{recipient.notes}</p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* 外出支援情報 */}
        {((recipient as any).outingRequestPattern ||
          (recipient as any).outingGroupPlanDeparture ||
          (recipient as any).outingGroupPlanNote ||
          (recipient as any).outingSpecificRequest1 ||
          (recipient as any).outingSpecificRequest2 ||
          (recipient as any).outingCasualDestination ||
          (recipient as any).outingIrregularNote ||
          (recipient as any).outingOtherNote) && (
          <div className="bg-card mb-6 rounded-lg border p-6 shadow-sm">
            <button
              onClick={() => toggleSection("outing")}
              className="mb-6 flex w-full cursor-pointer items-center justify-between rounded-lg p-2 -m-2 transition-colors hover:bg-gray-50"
            >
              <div className="flex items-center gap-3">
                <div className="rounded-lg bg-teal-100 p-2">
                  <MapPin className="h-5 w-5 text-teal-600" />
                </div>
                <h2 className="text-2xl font-bold">外出支援情報</h2>
              </div>
              {expandedSections.has("outing") ? (
                <ChevronUp className="text-muted-foreground h-6 w-6" />
              ) : (
                <ChevronDown className="text-muted-foreground h-6 w-6" />
              )}
            </button>
            {expandedSections.has("outing") && (
              <div className="space-y-4">
                {(recipient as any).outingRequestPattern && (
                  <div>
                    <p className="text-muted-foreground text-sm font-medium">
                      外出依頼パターン
                    </p>
                    <p className="mt-1">
                      {(recipient as any).outingRequestPattern}
                    </p>
                  </div>
                )}

                {((recipient as any).outingGroupPlanDeparture ||
                  (recipient as any).outingGroupPlanNote) && (
                  <div className="rounded-lg border p-4">
                    <h3 className="mb-3 font-semibold">グループプラン</h3>
                    <div className="space-y-2">
                      {(recipient as any).outingGroupPlanDeparture && (
                        <div>
                          <p className="text-muted-foreground text-sm">
                            発着場所
                          </p>
                          <p>{(recipient as any).outingGroupPlanDeparture}</p>
                        </div>
                      )}
                      {(recipient as any).outingGroupPlanNote && (
                        <div>
                          <p className="text-muted-foreground text-sm">
                            特記事項
                          </p>
                          <p>{(recipient as any).outingGroupPlanNote}</p>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {((recipient as any).outingSpecificRequest1 ||
                  (recipient as any).outingSpecificRequest2) && (
                  <div className="rounded-lg border p-4">
                    <h3 className="mb-3 font-semibold">特定外出依頼</h3>
                    <div className="space-y-2">
                      {(recipient as any).outingSpecificRequest1 && (
                        <div>
                          <p className="text-muted-foreground text-sm">依頼1</p>
                          <p>{(recipient as any).outingSpecificRequest1}</p>
                        </div>
                      )}
                      {(recipient as any).outingSpecificRequest2 && (
                        <div>
                          <p className="text-muted-foreground text-sm">依頼2</p>
                          <p>{(recipient as any).outingSpecificRequest2}</p>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {(recipient as any).outingCasualDestination && (
                  <div>
                    <p className="text-muted-foreground text-sm font-medium">
                      おまかせ行先
                    </p>
                    <p className="mt-1">
                      {(recipient as any).outingCasualDestination}
                    </p>
                  </div>
                )}

                {(recipient as any).outingIrregularNote && (
                  <div>
                    <p className="text-muted-foreground text-sm font-medium">
                      不定期外出特記
                    </p>
                    <p className="mt-1">
                      {(recipient as any).outingIrregularNote}
                    </p>
                  </div>
                )}

                {(recipient as any).outingOtherNote && (
                  <div>
                    <p className="text-muted-foreground text-sm font-medium">
                      その他外出特記
                    </p>
                    <p className="mt-1">{(recipient as any).outingOtherNote}</p>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* 機能メニュー */}
        <div className="mb-8">
          <h2 className="mb-6 text-2xl font-bold">機能メニュー</h2>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
            <Link href={`/recipients/${recipientId}/guide`}>
              <div className="group cursor-pointer rounded-lg border border-gray-300 bg-white p-6 transition-all hover:border-gray-400 hover:shadow-sm">
                <h3 className="mb-2 text-lg font-semibold text-gray-900 group-hover:text-green-600 transition-colors">
                  ガイド記録
                </h3>
                <p className="text-sm text-gray-600 leading-relaxed">
                  外出支援の記録・活動内容の管理
                </p>
              </div>
            </Link>
            <Link href={`/recipients/${recipientId}/support-records`}>
              <div className="group cursor-pointer rounded-lg border border-gray-300 bg-white p-6 transition-all hover:border-gray-400 hover:shadow-sm">
                <h3 className="mb-2 text-lg font-semibold text-gray-900 group-hover:text-blue-600 transition-colors">
                  支援記録
                </h3>
                <p className="text-sm text-gray-600 leading-relaxed">
                  日常支援の記録（食事・排泄・入浴など）
                </p>
              </div>
            </Link>
          </div>
        </div>

        {/* 最近のガイド記録 */}
        {guideRecords && guideRecords.length > 0 && (
          <div className="bg-card mb-6 rounded-lg border p-6 shadow-sm">
            <button
              onClick={() => toggleSection("guide")}
              className="mb-6 flex w-full cursor-pointer items-center justify-between rounded-lg p-2 -m-2 transition-colors hover:bg-gray-50"
            >
              <div className="flex items-center gap-3">
                <div className="rounded-lg bg-green-100 p-2">
                  <MapPin className="h-5 w-5 text-green-600" />
                </div>
                <h2 className="text-2xl font-bold">最近のガイド記録</h2>
              </div>
              {expandedSections.has("guide") ? (
                <ChevronUp className="text-muted-foreground h-6 w-6" />
              ) : (
                <ChevronDown className="text-muted-foreground h-6 w-6" />
              )}
            </button>
            {expandedSections.has("guide") && (
              <div>
                <div className="mb-6 flex items-center justify-end">
                  <Link href={`/recipients/${recipientId}/guide`}>
                    <Button variant="outline" size="sm">
                      すべて表示 →
                    </Button>
                  </Link>
                </div>
                <div className="space-y-3">
                  {guideRecords.map((record: any) => (
                    <Link
                      key={record.id}
                      href={`/recipients/${recipientId}/guide/${record.id}`}
                      className="block"
                    >
                      <div className="rounded-lg border-l-4 border-green-500 bg-gray-50 p-4 transition-shadow hover:shadow-md cursor-pointer">
                        <div className="mb-3 flex items-center justify-between">
                          <p className="text-sm font-bold text-gray-700">
                            {new Date(record.outingDate).toLocaleDateString(
                              "ja-JP",
                              {
                                year: "numeric",
                                month: "long",
                                day: "numeric",
                              }
                            )}
                          </p>
                          <GuideRecordStatusBadge status={record.status} />
                        </div>
                        <div className="space-y-2">
                          <div className="flex items-start gap-2">
                            <MapPin className="h-4 w-4 text-gray-500 mt-0.5 flex-shrink-0" />
                            <div>
                              <p className="text-sm font-medium text-gray-900">
                                {record.destination || "行先未記録"}
                              </p>
                              {record.purpose && (
                                <p className="text-xs text-gray-600 mt-1">
                                  {record.purpose}
                                </p>
                              )}
                            </div>
                          </div>
                          {record.user && (
                            <div className="flex items-center gap-2">
                              <User className="h-4 w-4 text-gray-500 flex-shrink-0" />
                              <p className="text-xs text-gray-600">
                                同行職員: {record.user.name}
                              </p>
                            </div>
                          )}
                          {record.departureTime && record.arrivalTime && (
                            <div className="flex items-center gap-2">
                              <History className="h-4 w-4 text-gray-500 flex-shrink-0" />
                              <p className="text-xs text-gray-600">
                                {new Date(
                                  record.departureTime
                                ).toLocaleTimeString("ja-JP", {
                                  hour: "2-digit",
                                  minute: "2-digit",
                                })}{" "}
                                -{" "}
                                {new Date(record.arrivalTime).toLocaleTimeString(
                                  "ja-JP",
                                  {
                                    hour: "2-digit",
                                    minute: "2-digit",
                                  }
                                )}
                              </p>
                            </div>
                          )}
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* 最近のVPN記録 */}
        {recipient.vitalSigns && recipient.vitalSigns.length > 0 && (
          <div className="bg-card mb-6 rounded-lg border p-6 shadow-sm">
            <button
              onClick={() => toggleSection("vpn")}
              className="mb-6 flex w-full cursor-pointer items-center justify-between rounded-lg p-2 -m-2 transition-colors hover:bg-gray-50"
            >
              <div className="flex items-center gap-3">
                <div className="rounded-lg bg-pink-100 p-2">
                  <Activity className="h-5 w-5 text-pink-600" />
                </div>
                <h2 className="text-2xl font-bold">最近のVPN記録</h2>
              </div>
              {expandedSections.has("vpn") ? (
                <ChevronUp className="text-muted-foreground h-6 w-6" />
              ) : (
                <ChevronDown className="text-muted-foreground h-6 w-6" />
              )}
            </button>
            {expandedSections.has("vpn") && (
              <div>
                <div className="mb-6 flex items-center justify-end">
                  <Link href={`/recipients/${recipientId}/vpn`}>
                    <Button variant="outline" size="sm">
                      すべて表示 →
                    </Button>
                  </Link>
                </div>
                <div className="space-y-3">
                  {recipient.vitalSigns.slice(0, 5).map((record: any) => (
                    <div
                      key={record.id}
                      className="rounded-lg border-l-4 border-pink-500 bg-gray-50 p-4 transition-shadow hover:shadow-md"
                    >
                      <p className="mb-2 text-sm font-bold text-gray-700">
                        {new Date(record.measuredAt).toLocaleString("ja-JP")}
                      </p>
                      <div className="flex flex-wrap gap-3 text-sm">
                        {record.temperature && (
                          <span className="rounded bg-white px-3 py-1 font-medium">
                            🌡️ 体温:{" "}
                            <span className="text-pink-600">
                              {record.temperature}℃
                            </span>
                          </span>
                        )}
                        {record.systolic && record.diastolic && (
                          <span className="rounded bg-white px-3 py-1 font-medium">
                            💗 血圧:{" "}
                            <span className="text-red-600">
                              {record.systolic}/{record.diastolic}
                            </span>
                          </span>
                        )}
                        {record.pulse && (
                          <span className="rounded bg-white px-3 py-1 font-medium">
                            💓 脈拍:{" "}
                            <span className="text-purple-600">
                              {record.pulse}
                            </span>
                          </span>
                        )}
                        {record.spo2 && (
                          <span className="rounded bg-white px-3 py-1 font-medium">
                            🫁 SpO2:{" "}
                            <span className="text-blue-600">
                              {record.spo2}%
                            </span>
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}


        {/* 変更履歴 */}
        {showChangeHistory && (
          <div className="bg-card mb-6 rounded-lg border p-6 shadow-sm">
            <button
              onClick={() => setShowChangeHistory(!showChangeHistory)}
              className="mb-6 flex w-full cursor-pointer items-center justify-between rounded-lg p-2 -m-2 transition-colors hover:bg-gray-50"
            >
              <div className="flex items-center gap-3">
                <div className="rounded-lg bg-gray-100 p-2">
                  <History className="h-5 w-5 text-gray-600" />
                </div>
                <h2 className="text-2xl font-bold">変更履歴</h2>
              </div>
              {showChangeHistory ? (
                <ChevronUp className="text-muted-foreground h-6 w-6" />
              ) : (
                <ChevronDown className="text-muted-foreground h-6 w-6" />
              )}
            </button>
            <ChangeHistory recipientId={recipientId} />
          </div>
        )}
      </div>

      {/* 印刷用CSS */}
      <style jsx global>{`
        @media print {
          /* ページ設定 */
          @page {
            size: A4 portrait;
            margin: 15mm;
          }

          /* ナビゲーションとボタンを非表示 */
          nav,
          header,
          .no-print,
          button,
          a[class*="Button"] {
            display: none !important;
          }

          /* メインコンテンツのスタイル調整 */
          body {
            background: white !important;
            font-size: 10pt;
          }

          .container {
            max-width: 100% !important;
            padding: 0 !important;
            margin: 0 !important;
          }

          /* カードのボーダーとシャドウを維持 */
          .bg-card {
            box-shadow: none !important;
            border: 1px solid #ddd !important;
            page-break-inside: avoid;
            break-inside: avoid;
          }

          /* セクション見出しの調整 */
          h1 {
            font-size: 18pt !important;
            margin-bottom: 8pt !important;
          }

          h2 {
            font-size: 14pt !important;
            margin-top: 8pt !important;
            margin-bottom: 6pt !important;
          }

          h3 {
            font-size: 12pt !important;
          }

          /* アイコンを非表示 */
          svg {
            display: none !important;
          }

          /* ボタンエリアを非表示 */
          .flex.gap-3.mb-6,
          .flex.justify-between.mb-6,
          .mb-6.flex.items-center.justify-end {
            display: none !important;
          }

          /* 折りたたみボタンを非表示にして、全セクションを展開表示 */
          button[class*="toggle"] {
            display: none !important;
          }

          /* 機能メニューカードを非表示 */
          div:has(> a[href*="/guide"]),
          div:has(> a[href*="/assessment"]),
          .opacity-60 {
            display: none !important;
          }

          /* ページ区切りの調整 */
          .bg-card {
            page-break-inside: avoid;
            break-inside: avoid;
            margin-bottom: 12pt !important;
          }

          /* 写真の調整 */
          img {
            max-width: 100% !important;
            page-break-inside: avoid;
          }

          /* テキストの調整 */
          p,
          div {
            orphans: 3;
            widows: 3;
          }

          /* 色の調整（印刷時） */
          * {
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
        }
      `}</style>
    </div>
  );
}
