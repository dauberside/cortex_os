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
  GroupHome: "共同生活援助",
  OutsideWork: "就労継続支援B型",
  TransitionSupport: "就労移行支援",
  Member: "利用会員",
};

export default function PrintSupportProfileSheetPage() {
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
        resourceType: "SupportProfileSheet",
        resourceId: recipientId,
        path: `/recipients/${recipientId}/support-profile/print`,
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
        {/* ============================================ */}
        {/* Page 1 - 基本プロフィール & アセスメント前半 */}
        {/* ============================================ */}
        <div className="print-page page-1">
          {/* 上部ヘッダー */}
          <div className="page-header-top">
            <h1 className="header-title">ガイドヘルプ用・サポート基本情報票</h1>
          </div>

          {/* 基本情報セクション（写真枠は右上） */}
          <section className="section-basic-info">
            <table className="form-table">
              <tbody>
                <tr>
                  {/* 利用者名の行 */}
                  <td className="label-cell-narrow">氏名</td>
                  <td className="value-cell-wide" colSpan={5}>
                    {recipient.name || ""}
                  </td>
                  {/* 写真枠セル（右上） */}
                  <td rowSpan={6} className="photo-cell">
                    {recipient.photoUrl ? (
                      <img
                        src={recipient.photoUrl}
                        alt="写真"
                        className="photo-img"
                      />
                    ) : (
                      <div className="photo-placeholder">写真</div>
                    )}
                  </td>
                </tr>
                <tr>
                  <td className="label-cell-narrow">ふりがな</td>
                  <td className="value-cell-wide" colSpan={5}>
                    {recipient.nameKana || ""}
                  </td>
                </tr>
                <tr>
                  <td className="label-cell-narrow">生年月日</td>
                  <td className="value-cell-wide" colSpan={5}>
                    {new Date(recipient.birthDate).toLocaleDateString("ja-JP")}
                  </td>
                </tr>
                <tr>
                  <td className="label-cell-narrow">通所(学)先</td>
                  <td className="value-cell-wide" colSpan={5}>
                    {recipient.school || ""}
                  </td>
                </tr>
                <tr>
                  <td className="label-cell-narrow">手帳</td>
                  <td className="value-cell" colSpan={2}>
                    {recipient.handbookType || ""}
                  </td>
                  <td className="label-cell-narrow">等級</td>
                  <td className="value-cell" colSpan={2}>
                    {recipient.handbookGrade || ""}
                  </td>
                </tr>
                <tr>
                  <td className="label-cell-narrow">区分</td>
                  <td className="value-cell" colSpan={2}>
                    {recipient.supportLevel || ""}
                  </td>
                  <td className="label-cell-narrow">サービス</td>
                  <td className="value-cell" colSpan={2}>
                    {recipient.serviceTypes
                      ?.map((type: string) => SERVICE_TYPE_LABELS[type] || type)
                      .join("、") || ""}
                  </td>
                </tr>

                {/* 住所・連絡先 */}
                <tr>
                  <td className="label-cell" colSpan={2}>住所</td>
                  <td className="value-cell" colSpan={5}>
                    {recipient.homeAddress || ""}
                  </td>
                </tr>
                <tr>
                  <td className="label-cell" colSpan={2}>電話</td>
                  <td className="value-cell" colSpan={2}>
                    {recipient.homePhone || ""}
                  </td>
                  <td className="label-cell-narrow">携帯</td>
                  <td className="value-cell" colSpan={2}>
                    {recipient.hasMobilePhone ? "有" : "無"}
                  </td>
                </tr>
                <tr>
                  <td className="label-cell" colSpan={2}>アクセス</td>
                  <td className="value-cell" colSpan={5}>
                    {(() => {
                      const station = recipient.nearestStation || "";
                      const minutes = recipient.walkingMinutes;

                      // 既に「徒歩」「分」「(」等の情報が含まれている場合はそのまま表示
                      if (station.includes("徒歩") || station.includes("分") || station.includes("(")) {
                        return station;
                      }

                      // 何も含まれていない場合のみwalkingMinutesを追加
                      if (minutes) {
                        return `${station} 徒歩${minutes}分`;
                      }

                      return station;
                    })()}
                  </td>
                </tr>
                <tr>
                  <td className="label-cell" colSpan={2}>緊急連絡先</td>
                  <td className="value-cell" colSpan={3}>
                    {recipient.emergencyContact || ""}
                  </td>
                  <td className="label-cell-narrow">続柄</td>
                  <td className="value-cell">
                    {recipient.emergencyRelation || ""}
                  </td>
                </tr>

                {/* GH情報 */}
                {recipient.ghName && (
                  <>
                    <tr>
                      <td className="label-cell" colSpan={2}>GH名</td>
                      <td className="value-cell" colSpan={5}>
                        {recipient.ghName}
                      </td>
                    </tr>
                    <tr>
                      <td className="label-cell" colSpan={2}>GH住所</td>
                      <td className="value-cell" colSpan={5}>
                        {recipient.ghAddress || ""}
                      </td>
                    </tr>
                    <tr>
                      <td className="label-cell" colSpan={2}>GH電話</td>
                      <td className="value-cell" colSpan={5}>
                        {recipient.ghPhone || ""}
                      </td>
                    </tr>
                  </>
                )}

                {/* 運用ルール */}
                <tr>
                  <td className="subsection-header" colSpan={7}>
                    運用ルール
                  </td>
                </tr>
                <tr>
                  <td className="label-cell" colSpan={2}>前日確認</td>
                  <td className="value-cell" colSpan={5}>
                    {recipient.priorConfirmationNote || ""}
                  </td>
                </tr>
                <tr>
                  <td className="label-cell" colSpan={2}>ノート</td>
                  <td className="value-cell">
                    {recipient.hasRecordNote ? "有" : "無"}
                  </td>
                  <td className="label-cell" colSpan={2}>お財布</td>
                  <td className="value-cell" colSpan={2}>
                    {recipient.walletNote || ""}
                  </td>
                </tr>
                <tr>
                  <td className="label-cell" colSpan={2}>休憩喫茶</td>
                  <td className="value-cell" colSpan={5}>
                    {recipient.cafeBreak ? "希望する" : "希望しない"}{" "}
                    {recipient.cafeCondition && `(${recipient.cafeCondition})`}
                  </td>
                </tr>
                <tr>
                  <td className="label-cell" colSpan={2}>電車割引</td>
                  <td className="value-cell" colSpan={2}>
                    {recipient.trainDiscountType || ""}
                  </td>
                  <td className="label-cell-narrow">都営券</td>
                  <td className="value-cell" colSpan={2}>
                    {recipient.hasToeiPass ? "有" : "無"}
                  </td>
                </tr>
                <tr>
                  <td className="label-cell" colSpan={2}>計画相談</td>
                  <td className="value-cell" colSpan={5}>
                    {recipient.planConsultationOffice || ""}{" "}
                    {recipient.planConsultant && `(${recipient.planConsultant})`}
                  </td>
                </tr>
              </tbody>
            </table>
          </section>

          {/* アセスメント前半 */}
          <section className="section-assessment">
            <table className="form-table">
              <tbody>
                <tr>
                  <td colSpan={4} className="section-header">
                    アセスメント・支援上の留意点
                  </td>
                </tr>
                <tr>
                  <td className="subsection-header" colSpan={4}>
                    健康・服薬
                  </td>
                </tr>
                <tr>
                  <td className="label-cell">障害名</td>
                  <td className="value-cell" colSpan={3}>
                    {recipient.disabilityName || ""}
                  </td>
                </tr>
                <tr>
                  <td className="label-cell">疾病状況</td>
                  <td className="value-cell" colSpan={3}>
                    <div className="multiline-text">
                      {recipient.diseaseStatus || ""}
                    </div>
                  </td>
                </tr>
                <tr>
                  <td className="label-cell">発作</td>
                  <td className="value-cell" colSpan={3}>
                    {recipient.hasSeizures ? "有" : "無"}
                    {recipient.hasSeizures && (
                      <>
                        {" / "}頻度: {recipient.seizureFrequency || ""}
                        {" / "}対処: {recipient.seizureResponse || ""}
                      </>
                    )}
                  </td>
                </tr>
                <tr>
                  <td className="label-cell">服薬</td>
                  <td className="value-cell" colSpan={3}>
                    <div className="multiline-text">
                      {recipient.medication?.join(" / ") || "なし"}
                    </div>
                  </td>
                </tr>
                <tr>
                  <td className="label-cell">留意点</td>
                  <td className="value-cell" colSpan={3}>
                    <div className="multiline-text">
                      {recipient.healthNote || ""}
                    </div>
                  </td>
                </tr>

                <tr>
                  <td className="subsection-header" colSpan={4}>
                    食事
                  </td>
                </tr>
                <tr>
                  <td className="label-cell">好き/嫌い</td>
                  <td className="value-cell" colSpan={3}>
                    好き: {recipient.favoriteFoods || ""} / 嫌い:{" "}
                    {recipient.dislikedFoods || ""}
                  </td>
                </tr>
                <tr>
                  <td className="label-cell">アレルギー</td>
                  <td className="value-cell-alert" colSpan={3}>
                    {recipient.hasAllergy ? "【要注意】" : "無"}{" "}
                    {recipient.allergyNote || ""}
                  </td>
                </tr>
                <tr>
                  <td className="label-cell">形態</td>
                  <td className="value-cell" colSpan={3}>
                    {recipient.eatingStyle || ""}
                  </td>
                </tr>

                <tr>
                  <td className="subsection-header" colSpan={4}>
                    排泄
                  </td>
                </tr>
                <tr>
                  <td className="label-cell">介助方法</td>
                  <td className="value-cell" colSpan={3}>
                    <div className="multiline-text">
                      {recipient.toiletAssistMethod || ""}
                    </div>
                  </td>
                </tr>

                <tr>
                  <td className="subsection-header" colSpan={4}>
                    移動
                  </td>
                </tr>
                <tr>
                  <td className="label-cell">手段/介助</td>
                  <td className="value-cell" colSpan={3}>
                    <div className="multiline-text">
                      {recipient.mobilityMethod || ""} /{" "}
                      {recipient.mobilityAssist || ""}
                    </div>
                  </td>
                </tr>
              </tbody>
            </table>
          </section>

          {/* Page 1 フッター */}
          <div className="print-footer">1/2</div>
        </div>

        {/* ============================================ */}
        {/* Page 2 - アセスメント後半 & 性格 & 外出傾向 */}
        {/* ============================================ */}
        <div className="print-page page-2">
          {/* ヘッダー */}
          <div className="page-header-simple">
            <div className="header-title-small">
              ガイドヘルプ用・サポート基本情報票（続き）
            </div>
            <div className="header-name">{recipient.name} さん</div>
          </div>

          {/* アセスメント後半 */}
          <section className="section-assessment">
            <table className="form-table">
              <tbody>
                <tr>
                  <td className="subsection-header" colSpan={4}>
                    コミュニケーション
                  </td>
                </tr>
                <tr>
                  <td className="label-cell">会話/表現</td>
                  <td className="value-cell" colSpan={3}>
                    <div className="multiline-text">
                      {recipient.commVerbal || ""}
                    </div>
                  </td>
                </tr>
                <tr>
                  <td className="label-cell">要求/拒否</td>
                  <td className="value-cell" colSpan={3}>
                    <div className="multiline-text">
                      要求: {recipient.commRequest || ""} / 拒否:{" "}
                      {recipient.commRefusal || ""}
                    </div>
                  </td>
                </tr>

                <tr>
                  <td className="subsection-header" colSpan={4}>
                    こだわり等
                  </td>
                </tr>
                <tr>
                  <td className="label-cell">状況/対応</td>
                  <td className="value-cell" colSpan={3}>
                    {recipient.hasObsession ? "有" : "無"}
                    {recipient.hasObsession && (
                      <div className="multiline-text">
                        {recipient.obsessionSituation || ""} /{" "}
                        {recipient.obsessionResponse || ""}
                      </div>
                    )}
                  </td>
                </tr>

                <tr>
                  <td className="subsection-header" colSpan={4}>
                    安全・行動
                  </td>
                </tr>
                <tr>
                  <td className="label-cell">自傷/他害</td>
                  <td className="value-cell" colSpan={3}>
                    自傷: {recipient.hasSelfHarm ? "有" : "無"} / 他害:{" "}
                    {recipient.hasHarmToOthers ? "有" : "無"}
                  </td>
                </tr>

                <tr>
                  <td className="subsection-header" colSpan={4}>
                    その他
                  </td>
                </tr>
                <tr>
                  <td className="label-cell">趣味</td>
                  <td className="value-cell" colSpan={3}>
                    <div className="multiline-text">{recipient.hobbies || ""}</div>
                  </td>
                </tr>
                <tr>
                  <td className="label-cell">注意点</td>
                  <td className="value-cell" colSpan={3}>
                    <div className="multiline-text">
                      {recipient.otherNotes || ""}
                    </div>
                  </td>
                </tr>
              </tbody>
            </table>
          </section>

          {/* 性格・関わり方 */}
          <section className="section-personality">
            <table className="form-table">
              <tbody>
                <tr>
                  <td className="section-header" colSpan={2}>
                    性格・関わり方のワンポイント
                  </td>
                </tr>
                <tr>
                  <td className="label-cell">性格</td>
                  <td className="value-cell">
                    <div className="multiline-text">
                      {recipient.personalityNote || ""}
                    </div>
                  </td>
                </tr>
                <tr>
                  <td className="label-cell">関わり方</td>
                  <td className="value-cell">
                    <div className="multiline-text">
                      {recipient.interactionNote || ""}
                    </div>
                  </td>
                </tr>
              </tbody>
            </table>
          </section>

          {/* 外出の主な傾向 */}
          <section className="section-outing">
            <table className="form-table">
              <tbody>
                <tr>
                  <td className="section-header" colSpan={2}>
                    外出の主な傾向
                  </td>
                </tr>
                <tr>
                  <td className="label-cell">依頼パターン</td>
                  <td className="value-cell">
                    {recipient.outingRequestPattern || ""}
                  </td>
                </tr>
                <tr>
                  <td className="label-cell">グループプラン</td>
                  <td className="value-cell">
                    <div className="multiline-text">
                      {recipient.outingGroupPlanNote || ""}
                    </div>
                  </td>
                </tr>
                <tr>
                  <td className="label-cell">特定①</td>
                  <td className="value-cell">
                    <div className="multiline-text">
                      {recipient.outingSpecificRequest1 || ""}
                    </div>
                  </td>
                </tr>
                <tr>
                  <td className="label-cell">特定②</td>
                  <td className="value-cell">
                    <div className="multiline-text">
                      {recipient.outingSpecificRequest2 || ""}
                    </div>
                  </td>
                </tr>
                <tr>
                  <td className="label-cell">その他</td>
                  <td className="value-cell">
                    <div className="multiline-text">
                      {recipient.outingOtherNote || ""}
                    </div>
                  </td>
                </tr>
              </tbody>
            </table>
          </section>

          {/* 変更履歴 */}
          <section className="section-history">
            <div className="history-header">※変更点あれば、下記に記載</div>
            <table className="form-table">
              <tbody>
                <tr>
                  <td className="label-cell-narrow">更新日</td>
                  <td className="label-cell-narrow">記入者</td>
                  <td className="label-cell">変更箇所</td>
                  <td className="label-cell-wide">変更点</td>
                </tr>
                {[...Array(4)].map((_, i) => (
                  <tr key={i} className="history-row">
                    <td className="value-cell">&nbsp;</td>
                    <td className="value-cell">&nbsp;</td>
                    <td className="value-cell">&nbsp;</td>
                    <td className="value-cell">&nbsp;</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </section>

          {/* Page 2 フッター */}
          <div className="print-footer">2/2</div>
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
          margin: 0 auto;
          padding: 20px;
          background: #f5f5f5;
        }

        .print-page {
          background: white;
          margin: 20px 0;
          padding: 8mm 5mm;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
          page-break-after: always;
          break-after: page;
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
            height: 297mm;
            margin: 0;
            padding: 8mm 5mm 8mm 5mm;
            box-shadow: none;
            page-break-after: always;
            break-after: page;
            page-break-inside: avoid;
            break-inside: avoid;
          }

          .page-2 {
            page-break-before: always;
            break-before: page;
          }
        }

        /* ヘッダースタイル */
        .page-header-top {
          margin-bottom: 5mm;
          border-bottom: 2px solid #000;
          padding-bottom: 3mm;
          text-align: center;
        }

        .header-title {
          font-size: 16pt;
          font-weight: bold;
          font-family: "MS Gothic", "Yu Gothic", monospace;
          letter-spacing: 0.2em;
          margin: 0;
        }

        .header-meta {
          font-size: 9pt;
          color: #666;
          margin-top: 2mm;
        }

        .page-header-left {
          position: absolute;
          left: 5mm;
          top: 12mm;
          writing-mode: vertical-rl;
          text-orientation: upright;
        }

        .header-title-vertical {
          font-size: 12pt;
          font-weight: bold;
          font-family: "MS Gothic", "Yu Gothic", monospace;
          letter-spacing: 0.1em;
          margin-bottom: 10mm;
        }

        .header-meta-vertical {
          font-size: 9pt;
          color: #666;
        }

        .page-header-simple {
          margin-bottom: 5mm;
          border-bottom: 1px solid #000;
          padding-bottom: 2mm;
          display: flex;
          justify-content: space-between;
        }

        .header-title-small {
          font-size: 11pt;
          font-weight: bold;
        }

        .header-name {
          font-size: 10pt;
        }

        .print-footer {
          position: absolute;
          bottom: 8mm;
          right: 12mm;
          font-size: 10pt;
          font-family: "MS Gothic", "Yu Gothic", monospace;
        }

        /* テーブルスタイル */
        .form-table {
          width: 100%;
          border-collapse: collapse;
          border: 1px solid #000;
          font-size: 9pt;
          font-family: "MS Gothic", "Yu Gothic", monospace;
          margin-bottom: 3mm;
          page-break-inside: avoid;
          break-inside: avoid;
        }

        .form-table td {
          border: 1px solid #000;
          padding: 1mm 2mm;
          vertical-align: top;
          line-height: 1.5;
        }

        .section-header {
          background-color: #d0d0d0;
          font-weight: bold;
          font-size: 10pt;
          padding: 2mm !important;
          text-align: center;
        }

        .subsection-header {
          background-color: #e8e8e8;
          font-weight: bold;
          padding: 1.5mm 2mm !important;
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
          width: 15%;
          white-space: nowrap;
        }

        .label-cell-wide {
          background-color: #f5f5f5;
          font-weight: bold;
          width: 25%;
        }

        .value-cell {
          min-height: 5mm;
        }

        .value-cell-wide {
          min-height: 5mm;
          width: 65%;
        }

        .value-cell-alert {
          background-color: #fff5f5;
          font-weight: bold;
          color: #d00;
        }

        /* 写真枠スタイル（左上・小さめ） */
        .photo-cell {
          width: 35mm;
          height: 45mm;
          text-align: center;
          vertical-align: middle;
          padding: 2mm !important;
          background-color: #fafafa;
        }

        .photo-img {
          max-width: 31mm;
          max-height: 41mm;
          object-fit: contain;
          display: block;
          margin: 30px auto;
        }

        .photo-placeholder {
          width: 31mm;
          height: 41mm;
          border: 1px dashed #999;
          display: flex;
          align-items: center;
          justify-content: center;
          color: #999;
          font-size: 9pt;
          margin: 0 auto;
          background-color: white;
        }

        .multiline-text {
          white-space: pre-wrap;
          word-wrap: break-word;
          min-height: 8mm;
        }

        /* セクション間の余白 */
        section {
          page-break-inside: avoid;
          break-inside: avoid;
          margin-bottom: 2mm;
        }

        .section-basic-info {
          margin-left: 0mm;
        }

        .history-header {
          font-size: 9pt;
          margin-bottom: 1mm;
          font-weight: bold;
        }

        .history-row td {
          height: 8mm;
        }

        @page {
          size: A4 portrait;
          margin: 0;
        }
      `}</style>
    </>
  );
}
