"use client";

import { useParams } from "next/navigation";
import { trpc } from "@/lib/trpc/client";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Printer } from "lucide-react";
import Link from "next/link";
import { useEffect, useRef } from "react";

export default function PrintAssessmentSheetPage() {
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
        resourceType: "AssessmentSheet",
        resourceId: recipientId,
        path: `/recipients/${recipientId}/print/assessment`,
        metadata: {
          recipientName: recipient.name,
        },
      });
    }
  }, [recipient, recipientId, logPrintMutation]);

  const handlePrint = () => {
    window.print();
  };

  // JSONを整形して表示
  const formatJSON = (value: unknown): string => {
    if (value === null || value === undefined) return "";
    if (typeof value === "string") return value;
    try {
      return JSON.stringify(value, null, 2);
    } catch {
      return String(value);
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
            <h1 className="header-title">アセスメントシート</h1>
            <div className="header-info">
              <span className="recipient-name">{recipient.name} さん</span>
              <span className="print-date">
                印刷日: {new Date().toLocaleDateString("ja-JP")}
              </span>
            </div>
          </div>

          {/* 基本情報 */}
          <section className="section">
            <h2 className="section-title">基本情報</h2>
            <table className="assessment-table">
              <tbody>
                <tr>
                  <td className="label-cell">氏名</td>
                  <td className="value-cell">{recipient.name || ""}</td>
                </tr>
                <tr>
                  <td className="label-cell">ふりがな</td>
                  <td className="value-cell">{recipient.nameKana || ""}</td>
                </tr>
                <tr>
                  <td className="label-cell">生年月日</td>
                  <td className="value-cell">
                    {new Date(recipient.birthDate).toLocaleDateString("ja-JP")}
                  </td>
                </tr>
                <tr>
                  <td className="label-cell">手帳種別</td>
                  <td className="value-cell">{recipient.handbookType || ""}</td>
                </tr>
                <tr>
                  <td className="label-cell">手帳等級</td>
                  <td className="value-cell">
                    {recipient.handbookGrade || ""}
                  </td>
                </tr>
                <tr>
                  <td className="label-cell">障害支援区分</td>
                  <td className="value-cell">{recipient.supportLevel || ""}</td>
                </tr>
              </tbody>
            </table>
          </section>

          {/* 健康・医療 */}
          <section className="section">
            <h2 className="section-title">健康・医療</h2>
            <table className="assessment-table">
              <tbody>
                <tr>
                  <td className="label-cell">障害名</td>
                  <td className="value-cell">
                    {recipient.disabilityName || ""}
                  </td>
                </tr>
                <tr>
                  <td className="label-cell">疾病状況</td>
                  <td className="value-cell">
                    <pre className="pre-wrap">
                      {recipient.diseaseStatus || ""}
                    </pre>
                  </td>
                </tr>
                <tr>
                  <td className="label-cell">発作の有無</td>
                  <td className="value-cell">
                    {recipient.hasSeizures ? "有" : "無"}
                  </td>
                </tr>
                {recipient.hasSeizures && (
                  <>
                    <tr>
                      <td className="label-cell">発作の頻度</td>
                      <td className="value-cell">
                        {recipient.seizureFrequency || ""}
                      </td>
                    </tr>
                    <tr>
                      <td className="label-cell">発作時の対処</td>
                      <td className="value-cell">
                        <pre className="pre-wrap">
                          {recipient.seizureResponse || ""}
                        </pre>
                      </td>
                    </tr>
                  </>
                )}
                <tr>
                  <td className="label-cell">服薬</td>
                  <td className="value-cell">
                    <pre className="pre-wrap">
                      {formatJSON(recipient.medication)}
                    </pre>
                  </td>
                </tr>
                <tr>
                  <td className="label-cell">健康上の留意点</td>
                  <td className="value-cell">
                    <pre className="pre-wrap">{recipient.healthNote || ""}</pre>
                  </td>
                </tr>
              </tbody>
            </table>
          </section>

          {/* 食事 */}
          <section className="section">
            <h2 className="section-title">食事</h2>
            <table className="assessment-table">
              <tbody>
                <tr>
                  <td className="label-cell">好きな食べ物</td>
                  <td className="value-cell">
                    {recipient.favoriteFoods || ""}
                  </td>
                </tr>
                <tr>
                  <td className="label-cell">嫌いな食べ物</td>
                  <td className="value-cell">
                    {recipient.dislikedFoods || ""}
                  </td>
                </tr>
                <tr>
                  <td className="label-cell">アレルギー</td>
                  <td className="value-cell alert-cell">
                    {recipient.hasAllergy ? "【要注意】" : "無"}{" "}
                    {recipient.allergyNote || ""}
                  </td>
                </tr>
                <tr>
                  <td className="label-cell">食事形態</td>
                  <td className="value-cell">{recipient.eatingStyle || ""}</td>
                </tr>
              </tbody>
            </table>
          </section>

          {/* 排泄 */}
          <section className="section">
            <h2 className="section-title">排泄</h2>
            <table className="assessment-table">
              <tbody>
                <tr>
                  <td className="label-cell">介助方法</td>
                  <td className="value-cell">
                    <pre className="pre-wrap">
                      {recipient.toiletAssistMethod || ""}
                    </pre>
                  </td>
                </tr>
              </tbody>
            </table>
          </section>

          {/* 移動 */}
          <section className="section">
            <h2 className="section-title">移動</h2>
            <table className="assessment-table">
              <tbody>
                <tr>
                  <td className="label-cell">移動手段</td>
                  <td className="value-cell">
                    {recipient.mobilityMethod || ""}
                  </td>
                </tr>
                <tr>
                  <td className="label-cell">移動介助</td>
                  <td className="value-cell">
                    <pre className="pre-wrap">
                      {recipient.mobilityAssist || ""}
                    </pre>
                  </td>
                </tr>
              </tbody>
            </table>
          </section>

          {/* コミュニケーション */}
          <section className="section">
            <h2 className="section-title">コミュニケーション</h2>
            <table className="assessment-table">
              <tbody>
                <tr>
                  <td className="label-cell">会話・表現</td>
                  <td className="value-cell">
                    <pre className="pre-wrap">{recipient.commVerbal || ""}</pre>
                  </td>
                </tr>
                <tr>
                  <td className="label-cell">要求の表現</td>
                  <td className="value-cell">
                    <pre className="pre-wrap">
                      {recipient.commRequest || ""}
                    </pre>
                  </td>
                </tr>
                <tr>
                  <td className="label-cell">拒否の表現</td>
                  <td className="value-cell">
                    <pre className="pre-wrap">
                      {recipient.commRefusal || ""}
                    </pre>
                  </td>
                </tr>
              </tbody>
            </table>
          </section>

          {/* こだわり */}
          <section className="section">
            <h2 className="section-title">こだわり等</h2>
            <table className="assessment-table">
              <tbody>
                <tr>
                  <td className="label-cell">こだわりの有無</td>
                  <td className="value-cell">
                    {recipient.hasObsession ? "有" : "無"}
                  </td>
                </tr>
                {recipient.hasObsession && (
                  <>
                    <tr>
                      <td className="label-cell">状況</td>
                      <td className="value-cell">
                        <pre className="pre-wrap">
                          {recipient.obsessionSituation || ""}
                        </pre>
                      </td>
                    </tr>
                    <tr>
                      <td className="label-cell">対応方法</td>
                      <td className="value-cell">
                        <pre className="pre-wrap">
                          {recipient.obsessionResponse || ""}
                        </pre>
                      </td>
                    </tr>
                  </>
                )}
              </tbody>
            </table>
          </section>

          {/* 行動・安全 */}
          <section className="section">
            <h2 className="section-title">行動・安全</h2>
            <table className="assessment-table">
              <tbody>
                <tr>
                  <td className="label-cell">自傷行為</td>
                  <td className="value-cell">
                    {recipient.hasSelfHarm ? "有" : "無"}
                  </td>
                </tr>
                <tr>
                  <td className="label-cell">他害行為</td>
                  <td className="value-cell">
                    {recipient.hasHarmToOthers ? "有" : "無"}
                  </td>
                </tr>
              </tbody>
            </table>
          </section>

          {/* その他 */}
          <section className="section">
            <h2 className="section-title">その他</h2>
            <table className="assessment-table">
              <tbody>
                <tr>
                  <td className="label-cell">趣味・興味</td>
                  <td className="value-cell">
                    <pre className="pre-wrap">{recipient.hobbies || ""}</pre>
                  </td>
                </tr>
                <tr>
                  <td className="label-cell">性格</td>
                  <td className="value-cell">
                    <pre className="pre-wrap">
                      {recipient.personalityNote || ""}
                    </pre>
                  </td>
                </tr>
                <tr>
                  <td className="label-cell">関わり方</td>
                  <td className="value-cell">
                    <pre className="pre-wrap">
                      {recipient.interactionNote || ""}
                    </pre>
                  </td>
                </tr>
                <tr>
                  <td className="label-cell">その他の注意点</td>
                  <td className="value-cell">
                    <pre className="pre-wrap">{recipient.otherNotes || ""}</pre>
                  </td>
                </tr>
              </tbody>
            </table>
          </section>

          {/* フッター */}
          <div className="print-footer">CortexOS - アセスメントシート</div>
        </div>
      </div>

      {/* 印刷用CSS */}
      <style jsx global>{`
        /* 画面表示時のスタイル */
        .no-print {
          display: block;
        }

        .print-container {
          max-width: 1000px;
          margin: 0 auto;
          padding: 20px;
          background: #f5f5f5;
        }

        .print-page {
          background: white;
          padding: 15mm;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
          min-height: 297mm;
          position: relative;
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
          }
        }

        /* ヘッダースタイル */
        .page-header {
          margin-bottom: 10mm;
          border-bottom: 2px solid #000;
          padding-bottom: 5mm;
        }

        .header-title {
          font-size: 18pt;
          font-weight: bold;
          font-family: "MS Gothic", "Yu Gothic", monospace;
          margin: 0 0 3mm 0;
          text-align: center;
        }

        .header-info {
          display: flex;
          justify-content: space-between;
          font-size: 10pt;
          font-family: "MS Gothic", "Yu Gothic", monospace;
        }

        .recipient-name {
          font-weight: bold;
        }

        .print-date {
          color: #666;
        }

        /* セクションスタイル */
        .section {
          margin-bottom: 8mm;
          page-break-inside: avoid;
          break-inside: avoid;
        }

        .section-title {
          font-size: 12pt;
          font-weight: bold;
          font-family: "MS Gothic", "Yu Gothic", monospace;
          background-color: #e0e0e0;
          padding: 2mm 3mm;
          margin: 0 0 2mm 0;
          border-left: 4px solid #666;
        }

        /* テーブルスタイル */
        .assessment-table {
          width: 100%;
          border-collapse: collapse;
          font-size: 10pt;
          font-family: "MS Gothic", "Yu Gothic", monospace;
        }

        .assessment-table td {
          border: 1px solid #000;
          padding: 2mm 3mm;
          vertical-align: top;
        }

        .label-cell {
          background-color: #f5f5f5;
          font-weight: bold;
          width: 25%;
          white-space: nowrap;
        }

        .value-cell {
          width: 75%;
          min-height: 8mm;
        }

        .alert-cell {
          background-color: #fff5f5;
          font-weight: bold;
          color: #d00;
        }

        .pre-wrap {
          white-space: pre-wrap;
          word-wrap: break-word;
          margin: 0;
          font-family: "MS Gothic", "Yu Gothic", monospace;
          font-size: 10pt;
        }

        /* フッター */
        .print-footer {
          position: absolute;
          bottom: 10mm;
          left: 15mm;
          right: 15mm;
          text-align: center;
          font-size: 9pt;
          color: #666;
          border-top: 1px solid #ccc;
          padding-top: 2mm;
        }

        @page {
          size: A4 portrait;
          margin: 0;
        }
      `}</style>
    </>
  );
}
