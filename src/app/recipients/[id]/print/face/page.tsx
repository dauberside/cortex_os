"use client";

import { useParams } from "next/navigation";
import { trpc } from "@/lib/trpc/client";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Printer } from "lucide-react";
import Link from "next/link";
import { useEffect, useRef } from "react";

// サービス種別の日本語ラベル
const SERVICE_TYPE_LABELS: Record<string, string> = {
  HomeHelp: "居宅介護",
  VisitingCare: "重度訪問介護",
  BehaviorSupport: "行動援護",
  MobilitySupport: "同行援護",
  DayCare: "生活介護",
  ShortStay: "短期入所",
  GroupHome: "グループホーム",
};

export default function FaceSheetPrintPage() {
  const params = useParams();
  const recipientId = params.id as string;

  const { data: recipient, isLoading } = trpc.recipient.get.useQuery({
    id: recipientId,
  });

  // 印刷ログを記録（1回のみ）
  const logPrintMutation = trpc.auditLog.log.useMutation();
  const hasLoggedRef = useRef(false);

  useEffect(() => {
    if (recipient && !hasLoggedRef.current) {
      hasLoggedRef.current = true;
      logPrintMutation.mutate({
        action: "Print",
        resourceType: "FaceSheet",
        resourceId: recipientId,
        path: `/recipients/${recipientId}/print/face`,
        metadata: {
          recipientName: recipient.name,
        },
      });
    }
  }, [recipient, recipientId, logPrintMutation]);

  const handlePrint = () => {
    window.print();
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
    <>
      {/* 画面表示用ツールバー（印刷時は非表示） */}
      <div className="no-print bg-background sticky top-0 z-10 border-b p-4">
        <div className="container mx-auto flex items-center justify-between">
          <Link href={`/recipients/${recipientId}`}>
            <Button variant="ghost" size="sm">
              <ArrowLeft className="mr-2 h-4 w-4" />
              戻る
            </Button>
          </Link>
          <Button onClick={handlePrint} size="sm">
            <Printer className="mr-2 h-4 w-4" />
            印刷
          </Button>
        </div>
      </div>

      {/* 印刷用コンテンツ */}
      <div className="print-container">
        <div className="print-page">
          {/* ヘッダー */}
          <div className="page-header">
            <h1 className="header-title">個別支援計画〈フェイスシート〉</h1>
            <div className="header-meta">
              <div className="header-row">
                <span>作成日: {new Date().toLocaleDateString("ja-JP")}</span>
              </div>
            </div>
          </div>

          {/* 0. 書類ヘッダー情報 */}
          <section className="section">
            <table className="form-table">
              <colgroup>
                <col style={{ width: "20%" }} />
                <col style={{ width: "80%" }} />
              </colgroup>
              <tbody>
                <tr>
                  <td className="label-cell">法人/事業所名</td>
                  <td className="value-cell" colSpan={1}>
                    {(recipient as any).organizationName || ""}
                  </td>
                </tr>
                <tr>
                  <td className="label-cell">グループホーム名</td>
                  <td className="value-cell" colSpan={1}>
                    {(recipient as any).documentHeaderGroupHomeName || (recipient as any).ghName || ""}
                  </td>
                </tr>
                <tr>
                  <td className="label-cell">サービス管理責任者</td>
                  <td className="value-cell" colSpan={1}>
                    {(recipient as any).serviceManagerName || ""}
                  </td>
                </tr>
              </tbody>
            </table>
          </section>

          {/* 1. 基本情報 */}
          <section className="section">
            <div className="section-header">1. 基本情報</div>
            <table className="form-table">
              <colgroup>
                <col style={{ width: "20%" }} />
                <col style={{ width: "57%" }} />
                <col style={{ width: "8%" }} />
                <col style={{ width: "15%" }} />
              </colgroup>
              <tbody>
                <tr>
                  <td className="label-cell">ふりがな</td>
                  <td className="value-cell" colSpan={3}>
                    {recipient.nameKana || ""}
                  </td>
                </tr>
                <tr>
                  <td className="label-cell">利用者氏名</td>
                  <td className="value-cell" colSpan={3}>
                    {recipient.name}
                  </td>
                </tr>
                <tr>
                  <td className="label-cell">住所</td>
                  <td className="value-cell" colSpan={3}>
                    {(recipient as any).homeAddress || ""}
                  </td>
                </tr>
                <tr>
                  <td className="label-cell">生年月日</td>
                  <td className="value-cell">
                    {new Date(recipient.birthDate).toLocaleDateString("ja-JP")}
                  </td>
                  <td className="label-cell-narrow">年齢</td>
                  <td className="value-cell-narrow">
                    {Math.floor(
                      (new Date().getTime() -
                        new Date(recipient.birthDate).getTime()) /
                        (365.25 * 24 * 60 * 60 * 1000)
                    )}
                    歳
                  </td>
                </tr>
                <tr>
                  <td className="label-cell">性別</td>
                  <td className="value-cell">
                    {recipient.gender === "Male"
                      ? "男"
                      : recipient.gender === "Female"
                        ? "女"
                        : "その他"}
                  </td>
                  <td className="label-cell-narrow">電話</td>
                  <td className="value-cell-narrow">
                    {(recipient as any).homePhone || ""}
                  </td>
                </tr>
                <tr>
                  <td className="label-cell">生活形態</td>
                  <td className="value-cell" colSpan={3}>
                    {(recipient as any).livingType === "GroupHome"
                      ? "GH入居"
                      : (recipient as any).livingType === "AloneWithFamily"
                        ? "家族同居"
                        : (recipient as any).livingType === "Alone"
                          ? "一人暮らし"
                          : ""}
                  </td>
                </tr>
                <tr>
                  <td className="label-cell">世帯分離</td>
                  <td className="value-cell" colSpan={3}>
                    {/* TODO: 世帯分離フィールドを追加 */}
                  </td>
                </tr>
              </tbody>
            </table>
          </section>

          {/* 2. 緊急連絡先・家族構成 */}
          <section className="section">
            <div className="section-header">2. 緊急連絡先・家族構成</div>
            <table className="form-table">
              <colgroup>
                <col style={{ width: "15%" }} />
                <col style={{ width: "35%" }} />
                <col style={{ width: "50%" }} />
              </colgroup>
              <tbody>
                <tr>
                  <td className="label-cell">氏名</td>
                  <td className="value-cell">
                    {/* TODO: 緊急連絡先氏名を追加 */}
                  </td>
                  <td className="value-cell" rowSpan={4} style={{ verticalAlign: "middle" }}>
                    {(recipient as any).familyMembers?.diagram ? (
                      <div className="multiline-text family-diagram">
                        {(recipient as any).familyMembers.diagram}
                      </div>
                    ) : (
                      <div className="text-gray-400">（家族構成図未入力）</div>
                    )}
                  </td>
                </tr>
                <tr>
                  <td className="label-cell">続柄</td>
                  <td className="value-cell">
                    {recipient.emergencyRelation || ""}
                  </td>
                </tr>
                <tr>
                  <td className="label-cell">電話</td>
                  <td className="value-cell">
                    {recipient.emergencyContact || ""}
                  </td>
                </tr>
                <tr>
                  <td className="label-cell">FAX</td>
                  <td className="value-cell">
                    {/* TODO: FAX番号を追加 */}
                  </td>
                </tr>
              </tbody>
            </table>
          </section>

          {/* 3. 経済的状況 */}
          <section className="section">
            <div className="section-header">3. 経済的状況</div>
            <table className="form-table">
              <tbody>
                <tr>
                  <td className="label-cell">障害基礎年金</td>
                  <td className="value-cell" colSpan={3}>
                    {(recipient as any).disabilityPension && (
                      <>
                        {(recipient as any).disabilityPensionGrade}級
                        {(recipient as any).disabilityPensionType === "National" &&
                          "（基礎）"}
                        {(recipient as any).disabilityPensionType === "Employee" &&
                          "（厚生）"}
                      </>
                    )}
                  </td>
                </tr>
                <tr>
                  <td className="label-cell">公費医療</td>
                  <td className="value-cell" colSpan={3}>
                    {(recipient as any).medicalFeeExemption &&
                    (recipient as any).medicalFeeExemption !== "None"
                      ? "有"
                      : "無"}
                  </td>
                </tr>
                <tr>
                  <td className="label-cell">医療保険</td>
                  <td className="value-cell" colSpan={3}>
                    {/* TODO: 医療保険種別を追加（健康保険/国民健康保険/共済組合/その他） */}
                  </td>
                </tr>
              </tbody>
            </table>
          </section>

          {/* 4. 障害の状況 */}
          <section className="section">
            <div className="section-header">4. 障害の状況</div>
            <table className="form-table">
              <tbody>
                <tr>
                  <td className="subsection-header" colSpan={4}>
                    4-1. 障害支援区分
                  </td>
                </tr>
                <tr>
                  <td className="label-cell">区分</td>
                  <td className="value-cell" colSpan={3}>
                    {recipient.supportLevel
                      ? `区分${recipient.supportLevel}`
                      : "非該当"}
                  </td>
                </tr>
                <tr>
                  <td className="subsection-header" colSpan={4}>
                    4-2. 手帳
                  </td>
                </tr>
                <tr>
                  <td className="label-cell">種類</td>
                  <td className="value-cell" colSpan={3}>
                    {(recipient as any).physicalHandicapBook && "身体障害者手帳"}
                    {(recipient as any).intellectualHandicapBook && " 療育手帳"}
                    {(recipient as any).mentalHandicapBook &&
                      " 精神障害者保健福祉手帳"}
                  </td>
                </tr>
                <tr>
                  <td className="label-cell">等級</td>
                  <td className="value-cell" colSpan={3}>
                    {(recipient as any).physicalHandicapBook &&
                      `身体: ${(recipient as any).physicalHandicapGrade || ""}`}
                    {(recipient as any).intellectualHandicapBook &&
                      ` 知的: ${(recipient as any).intellectualHandicapGrade || ""}`}
                    {(recipient as any).mentalHandicapBook &&
                      ` 精神: ${(recipient as any).mentalHandicapGrade || ""}`}
                  </td>
                </tr>
                <tr>
                  <td className="subsection-header" colSpan={4}>
                    4-3. 障害の内容
                  </td>
                </tr>
                <tr>
                  <td className="label-cell">障害名</td>
                  <td className="value-cell" colSpan={3}>
                    {(recipient as any).disabilityName || ""}
                  </td>
                </tr>
                <tr>
                  <td className="label-cell">障害の起因</td>
                  <td className="value-cell" colSpan={3}>
                    {(recipient as any).diseaseStatus || ""}
                  </td>
                </tr>
              </tbody>
            </table>
          </section>

          {/* 5. 生活歴 */}
          <section className="section">
            <div className="section-header">5. 生活歴</div>
            <table className="form-table">
              <tbody>
                <tr>
                  <td className="subsection-header" colSpan={2}>
                    主な生活歴
                  </td>
                </tr>
                <tr>
                  <td className="value-cell free-text-area" colSpan={2}>
                    {/* TODO: 生活歴（年表形式）を追加 */}
                  </td>
                </tr>
                <tr>
                  <td className="label-cell">最終学歴</td>
                  <td className="value-cell">
                    {/* TODO: 最終学歴を追加 */}
                  </td>
                </tr>
                <tr>
                  <td className="subsection-header" colSpan={2}>
                    主な職歴（通所先）
                  </td>
                </tr>
                <tr>
                  <td className="value-cell free-text-area" colSpan={2}>
                    {(recipient as any).school || ""}
                  </td>
                </tr>
              </tbody>
            </table>
          </section>

          {/* 6. 医療 */}
          <section className="section">
            <div className="section-header">6. 医療</div>
            <table className="form-table">
              <tbody>
                <tr>
                  <td className="label-cell">疾病など</td>
                  <td className="value-cell" colSpan={3}>
                    {(recipient as any).diseaseStatus ? "有" : "無"}
                    {(recipient as any).diseaseStatus && (
                      <div className="multiline-text">
                        {(recipient as any).diseaseStatus}
                      </div>
                    )}
                  </td>
                </tr>
                <tr>
                  <td className="label-cell">発作</td>
                  <td className="value-cell" colSpan={3}>
                    {(recipient as any).hasSeizures ? "有" : "無"}
                    {(recipient as any).hasSeizures && (
                      <>
                        <div>頻度: {(recipient as any).seizureFrequency || ""}</div>
                        <div>対処法: {(recipient as any).seizureResponse || ""}</div>
                      </>
                    )}
                  </td>
                </tr>
                <tr>
                  <td className="label-cell">服薬</td>
                  <td className="value-cell" colSpan={3}>
                    <div className="multiline-text">
                      {Array.isArray((recipient as any).medication)
                        ? (recipient as any).medication.join("\n")
                        : (recipient as any).medication || "なし"}
                    </div>
                  </td>
                </tr>
                <tr>
                  <td className="label-cell">塗薬等</td>
                  <td className="value-cell" colSpan={3}>
                    {/* TODO: 塗薬情報を追加 */}
                  </td>
                </tr>
                <tr>
                  <td className="label-cell">通院</td>
                  <td className="value-cell" colSpan={3}>
                    {recipient.hospital && (
                      <>
                        <div>医療機関: {recipient.hospital}</div>
                        <div>主治医: {recipient.doctor || ""}</div>
                      </>
                    )}
                  </td>
                </tr>
                <tr>
                  <td className="label-cell">備考</td>
                  <td className="value-cell" colSpan={3}>
                    {(recipient as any).healthNote || ""}
                  </td>
                </tr>
              </tbody>
            </table>
          </section>

          {/* 7. サービス利用状況 */}
          <section className="section">
            <div className="section-header">7. サービス利用状況</div>
            <table className="form-table">
              <tbody>
                <tr>
                  <td className="label-cell">利用サービス</td>
                  <td className="value-cell" colSpan={3}>
                    {(recipient as any).serviceTypes
                      ?.map((type: string) => SERVICE_TYPE_LABELS[type] || type)
                      .join("、") || ""}
                  </td>
                </tr>
                <tr>
                  <td className="label-cell">成年後見制度</td>
                  <td className="value-cell" colSpan={3}>
                    {/* TODO: 成年後見制度情報を追加 */}
                  </td>
                </tr>
                <tr>
                  <td className="label-cell">地域福祉権利擁護事業</td>
                  <td className="value-cell" colSpan={3}>
                    {/* TODO: 権利擁護事業情報を追加 */}
                  </td>
                </tr>
              </tbody>
            </table>
          </section>

          {/* 8. 特記事項 */}
          <section className="section">
            <div className="section-header">8. 特記事項</div>
            <table className="form-table">
              <tbody>
                <tr>
                  <td className="value-cell free-text-area">
                    {recipient.notes || ""}
                  </td>
                </tr>
              </tbody>
            </table>
          </section>

          {/* フッター */}
          <div className="print-footer">フェイスシート - {recipient.name}</div>
        </div>
      </div>

      {/* 印刷用CSS */}
      <style jsx global>{`
        /* 画面表示時のスタイル */
        .no-print {
          display: block;
        }

        .print-container {
          max-width: 1200px;
          min-width: 800px;
          margin: 0 auto;
          padding: 20px;
          background: #f5f5f5;
          overflow-x: auto;
        }

        .print-page {
          background: white;
          padding: 15mm;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
          min-height: 297mm;
          min-width: 210mm;
        }

        /* 印刷時のスタイル */
        @media print {
          * {
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }

          body {
            margin: 0;
            padding: 0;
          }

          .no-print {
            display: none !important;
          }

          .print-container {
            max-width: none;
            margin: 0;
            padding: 0;
            background: white;
          }

          .print-page {
            width: 210mm;
            min-height: 297mm;
            margin: 0;
            padding: 15mm;
            box-shadow: none;
            page-break-after: always;
          }

          @page {
            size: A4 portrait;
            margin: 0;
          }
        }

        /* ヘッダースタイル */
        .page-header {
          margin-bottom: 8mm;
          border-bottom: 2px solid #000;
          padding-bottom: 3mm;
        }

        .header-title {
          font-size: 18pt;
          font-weight: bold;
          font-family: "MS Gothic", "Yu Gothic", monospace;
          text-align: center;
          margin: 0 0 3mm 0;
        }

        .header-meta {
          font-size: 9pt;
          color: #666;
        }

        .header-row {
          display: flex;
          justify-content: space-between;
          margin-bottom: 2mm;
        }

        .print-footer {
          position: fixed;
          bottom: 10mm;
          right: 15mm;
          font-size: 9pt;
          font-family: "MS Gothic", "Yu Gothic", monospace;
        }

        @media print {
          .print-footer {
            position: absolute;
          }
        }

        /* セクションスタイル */
        .section {
          margin-bottom: 5mm;
          page-break-inside: avoid;
          break-inside: avoid;
        }

        .section-header {
          background-color: #d0d0d0;
          font-weight: bold;
          font-size: 11pt;
          padding: 2mm;
          border: 1px solid #000;
          margin-bottom: 1mm;
        }

        .subsection-header {
          background-color: #e8e8e8;
          font-weight: bold;
          font-size: 10pt;
          padding: 1.5mm 2mm;
        }

        /* テーブルスタイル */
        .form-table {
          width: 100%;
          border-collapse: collapse;
          border: 1px solid #000;
          font-size: 10pt;
          font-family: "MS Gothic", "Yu Gothic", monospace;
          margin-bottom: 2mm;
          table-layout: fixed;
        }

        .form-table td {
          border: 1px solid #000;
          padding: 1.5mm 2mm;
          vertical-align: top;
          line-height: 1.6;
        }

        .label-cell {
          background-color: #f5f5f5;
          font-weight: bold;
          width: 20%;
          white-space: nowrap;
        }

        .label-cell-narrow {
          background-color: #f5f5f5;
          font-weight: bold;
          width: 8%;
          white-space: nowrap;
        }

        .value-cell {
          min-height: 7mm;
          width: 57%;
        }

        .value-cell-narrow {
          min-height: 7mm;
          width: 15%;
        }

        .free-text-area {
          min-height: 25mm;
        }

        .multiline-text {
          white-space: pre-wrap;
          word-wrap: break-word;
        }

        .family-diagram {
          font-family: "MS Gothic", "Yu Gothic", "Courier New", monospace;
          font-size: 10pt;
          line-height: 1.5;
          white-space: pre;
          text-align: center;
        }
      `}</style>
    </>
  );
}
