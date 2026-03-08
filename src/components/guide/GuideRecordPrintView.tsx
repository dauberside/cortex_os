"use client";

import { format } from "date-fns";
import { ja } from "date-fns/locale";

type GuideRecord = {
  id: string;
  startedAt: Date;
  endedAt: Date | null;
  destination: string | null;
  purpose: string | null;

  // 集合・解散情報
  assemblyLocation: string | null;
  dismissalLocation: string | null;

  // 経路情報
  route: any; // Json field

  transport: string[];
  supportContent: string | null;
  userCondition: string | null;
  cashHandled: boolean;
  handedAmount: number | null;
  returnedAmount: number | null;
  cashNote: string | null;

  // 金銭詳細内訳
  transportExpenses: any; // Json field
  foodExpenses: any; // Json field
  otherExpenses: any; // Json field
  staffMealExpense: number | null;

  // 食事情報
  mealContent: string | null;
  mealAmount: string | null;

  // 服薬情報
  medicationTaken: boolean | null;
  medicationTime: string | null;

  // 手順書・インシデント
  procedure: string | null;
  incidents: any; // Json field

  notes: string | null;
  recipient: {
    name: string;
  };
  user: {
    name: string;
  };
};

interface GuideRecordPrintViewProps {
  record: GuideRecord;
  viewType: "family" | "office";
}

export function GuideRecordPrintView({
  record,
  viewType,
}: GuideRecordPrintViewProps) {
  // 各カテゴリの費用を配列として取得
  const transportExpenses = Array.isArray(record.transportExpenses)
    ? (record.transportExpenses as Array<{
        amount: number;
        description?: string;
      }>)
    : [];
  const foodExpenses = Array.isArray(record.foodExpenses)
    ? (record.foodExpenses as Array<{ amount: number; description?: string }>)
    : [];
  const otherExpenses = Array.isArray(record.otherExpenses)
    ? (record.otherExpenses as Array<{ amount: number; description?: string }>)
    : [];

  // 各カテゴリの合計を計算
  const totalTransport = transportExpenses.reduce(
    (sum, item) => sum + (item.amount || 0),
    0
  );
  const totalFood = foodExpenses.reduce(
    (sum, item) => sum + (item.amount || 0),
    0
  );
  const totalOther = otherExpenses.reduce(
    (sum, item) => sum + (item.amount || 0),
    0
  );
  const staffMeal = record.staffMealExpense || 0;
  const totalUsed = totalTransport + totalFood + totalOther + staffMeal;

  // 経路情報を配列として取得
  const routeArray = Array.isArray(record.route)
    ? (record.route as string[])
    : [];

  return (
    <div className="print-container hidden print:block">
      <style jsx global>{`
        @media print {
          @page {
            size: A4 portrait;
            margin: 10mm 12mm 10mm 12mm;
          }

          body {
            print-color-adjust: exact;
            -webkit-print-color-adjust: exact;
          }

          .print-container {
            display: block !important;
            width: 186mm; /* A4(210mm) - 左右余白(12mm×2) */
            max-width: 186mm;
            font-family: "MS Gothic", "Yu Gothic", "Hiragino Sans", sans-serif;
            font-size: 8.5pt;
            line-height: 1.2;
            color: #000;
            margin: 0 auto;
          }

          .no-print {
            display: none !important;
          }

          table {
            border-collapse: collapse;
            width: 100%;
          }

          .header-row {
            display: flex;
            justify-content: space-between;
            align-items: flex-start;
            margin-bottom: 2mm;
          }

          .header-title {
            font-size: 11pt;
            font-weight: bold;
          }

          .stamp-box {
            border: 1px solid #000;
            width: 12mm;
            height: 12mm;
            font-size: 7pt;
            text-align: center;
            padding: 0.5mm;
          }

          .info-section {
            margin-bottom: 2mm;
            font-size: 9.5pt;
            line-height: 1.4;
          }

          .info-line {
            margin-bottom: 0.5mm;
          }

          /* 左右2カラムレイアウト */
          .two-column-layout {
            display: table;
            width: 100%;
            border-spacing: 0;
            margin-bottom: 1.5mm;
          }

          .left-column {
            display: table-cell;
            width: 38%;
            vertical-align: top;
            padding-right: 2mm;
          }

          .right-column {
            display: table-cell;
            width: 62%;
            vertical-align: top;
          }

          /* 金銭管理表（左カラム） */
          .money-section-title {
            font-weight: bold;
            font-size: 9pt;
            margin-bottom: 1mm;
            padding: 0.5mm 1.5mm;
            background-color: #f5f5f5;
            border: 1px solid #000;
          }

          .money-category {
            margin-bottom: 1mm;
          }

          .money-category-title {
            font-weight: bold;
            font-size: 8.5pt;
            padding: 0.5mm 1.5mm;
            border: 1px solid #000;
            border-bottom: none;
            background-color: #f9f9f9;
          }

          .money-row {
            display: table;
            width: 100%;
            border: 1px solid #000;
            border-top: none;
            height: 5.5mm;
            table-layout: fixed;
          }

          .money-row:first-of-type {
            border-top: 1px solid #000;
          }

          .money-input {
            display: table-cell;
            padding: 0.5mm 2mm;
            vertical-align: middle;
            border-right: 1px solid #000;
            font-size: 9pt;
            width: 58.6%;
          }

          .money-yen {
            display: table-cell;
            width: 41.4%;
            text-align: right;
            vertical-align: middle;
            font-size: 8.5pt;
            padding-right: 2mm;
            white-space: nowrap;
          }

          .money-total-row {
            display: table;
            width: 100%;
            border: 1px solid #000;
            height: 5.5mm;
            background-color: #f5f5f5;
            table-layout: fixed;
          }

          .money-total-label {
            display: table-cell;
            padding: 0.5mm 2mm;
            vertical-align: middle;
            font-weight: bold;
            border-right: 1px solid #000;
            font-size: 8.5pt;
            width: 58.6%;
          }

          .money-total-value {
            display: table-cell;
            width: 41.4%;
            text-align: right;
            vertical-align: middle;
            font-weight: bold;
            font-size: 8.5pt;
            padding-right: 2mm;
            white-space: nowrap;
          }

          /* 行先・経路（右カラム） */
          .destination-row {
            display: table;
            width: 100%;
            border: 1px solid #000;
            height: 5.5mm;
            margin-bottom: 0.5mm;
          }

          .destination-label {
            display: table-cell;
            width: 12mm;
            padding: 0.5mm 1.5mm;
            vertical-align: middle;
            font-weight: bold;
            background-color: #f5f5f5;
            border-right: 1px solid #000;
            font-size: 9pt;
          }

          .destination-value {
            display: table-cell;
            padding: 0.5mm 1.5mm;
            vertical-align: middle;
            font-size: 9pt;
          }

          .assembly-row {
            display: table;
            width: 100%;
            border: 1px solid #000;
            height: 5.5mm;
            margin-bottom: 0.5mm;
          }

          .assembly-cell {
            display: table-cell;
            width: 50%;
            vertical-align: middle;
          }

          .assembly-label {
            display: inline-block;
            width: 12mm;
            padding: 0.5mm 1.5mm;
            font-weight: bold;
            background-color: #f5f5f5;
            font-size: 9pt;
          }

          .assembly-value {
            display: inline-block;
            padding: 0.5mm 1.5mm;
            font-size: 9pt;
          }

          /* 経路（矢印） */
          .route-section {
            border: 1px solid #000;
            margin-bottom: 0.5mm;
          }

          .route-header {
            font-weight: bold;
            font-size: 9pt;
            padding: 0.5mm 1.5mm;
            border-bottom: 1px solid #000;
            display: flex;
            justify-content: space-between;
          }

          .route-grid {
            display: table;
            width: 100%;
            border-spacing: 0;
          }

          .route-row {
            display: table-row;
            height: 5.5mm;
          }

          .route-cell {
            display: table-cell;
            width: 33.33%;
            text-align: center;
            vertical-align: middle;
            border-right: 1px solid #000;
            font-size: 11pt;
            font-weight: bold;
          }

          .route-cell:last-child {
            border-right: none;
          }

          .route-cell-content {
            padding: 0.5mm;
            font-size: 9pt;
            font-weight: normal;
          }

          /* 食事内容・様子 */
          .meal-row {
            display: table;
            width: 100%;
            border: 1px solid #000;
            height: 5.5mm;
            margin-top: 0.5mm;
            margin-bottom: 0.5mm;
          }

          .meal-label {
            display: table-cell;
            width: 20mm;
            padding: 0.5mm 1.5mm;
            vertical-align: middle;
            font-weight: bold;
            background-color: #f5f5f5;
            border-right: 1px solid #000;
            font-size: 9pt;
          }

          .meal-value {
            display: table-cell;
            padding: 0.5mm 1.5mm;
            vertical-align: middle;
            font-size: 9pt;
          }

          /* 様子（罫線入り大枠） */
          .condition-title {
            font-weight: bold;
            font-size: 9pt;
            padding: 0.5mm 1.5mm;
            background-color: #f5f5f5;
            border: 1px solid #000;
            border-bottom: none;
          }

          .condition-box {
            border: 1px solid #000;
            border-top: none;
            padding: 1.5mm;
            min-height: 80mm;
            white-space: pre-wrap;
            word-break: break-word;
            line-height: 1.5;
            font-size: 8.5pt;
            background-image: repeating-linear-gradient(
              transparent,
              transparent 5mm,
              #ddd 5mm,
              #ddd calc(5mm + 0.5pt)
            );
          }

          /* 下部横一列: 食事・服薬 */
          .bottom-section {
            margin-top: 1.5mm;
            border: 1px solid #000;
            padding: 1.5mm;
          }

          .bottom-row {
            display: flex;
            gap: 4mm;
            align-items: center;
            margin-bottom: 0.5mm;
            font-size: 8.5pt;
          }

          .bottom-item {
            display: flex;
            align-items: center;
            gap: 1.5mm;
          }

          .checkbox {
            display: inline-block;
            width: 3.5mm;
            height: 3.5mm;
            border: 1px solid #000;
            margin-right: 0.5mm;
          }

          /* 事務所報告用特記事項 */
          .office-notes-title {
            font-weight: bold;
            font-size: 9pt;
            padding: 0.5mm 1.5mm;
            background-color: #f5f5f5;
            border: 1px solid #000;
            border-bottom: none;
            margin-top: 1.5mm;
          }

          .office-notes-box {
            border: 1px solid #000;
            border-top: none;
            padding: 1.5mm;
            min-height: 40mm;
            white-space: pre-wrap;
            word-break: break-word;
            line-height: 1.5;
            font-size: 8.5pt;
            background-image: repeating-linear-gradient(
              transparent,
              transparent 5mm,
              #ddd 5mm,
              #ddd calc(5mm + 0.5pt)
            );
          }

          .incident-checks {
            margin-top: 0.5mm;
            display: flex;
            gap: 4mm;
            font-size: 8pt;
          }
        }
      `}</style>

      {/* ヘッダー */}
      <div className="header-row">
        <div className="header-title">
          ともにネット　外出サポートの記録
          {viewType === "family" && "（利用者控）"}
        </div>
        <div className="stamp-box">印</div>
      </div>

      {/* 宛名・サポーター・日付時刻 */}
      <div className="info-section">
        <div className="info-line">{record.recipient.name} 様</div>
        <div className="info-line">サポーター: {record.user.name}</div>
        <div className="info-line">
          {format(new Date(record.startedAt), "yyyy年 MM月 dd日（E）", {
            locale: ja,
          })}{" "}
          {format(new Date(record.startedAt), "HH:mm")} 〜{" "}
          {record.endedAt ? format(new Date(record.endedAt), "HH:mm") : ""}
        </div>
      </div>

      {/* 左右2カラムレイアウト */}
      <div className="two-column-layout">
        {/* 左カラム: 金銭管理 */}
        <div className="left-column">
          <div className="money-section-title">
            最初にあったお金　
            {record.handedAmount ? record.handedAmount.toLocaleString() : ""}円
          </div>

          {/* 交通費 */}
          <div className="money-category">
            <div className="money-category-title">交通費</div>
            {[0, 1, 2, 3, 4, 5].map((i) => (
              <div key={`transport-${i}`} className="money-row">
                <div className="money-input">
                  {transportExpenses[i]?.description || ""}
                </div>
                <div className="money-yen">
                  {transportExpenses[i]?.amount
                    ? transportExpenses[i].amount.toLocaleString()
                    : ""}{" "}
                  円
                </div>
              </div>
            ))}
          </div>

          {/* 飲食費 */}
          <div className="money-category">
            <div className="money-category-title">飲食費</div>
            {[0, 1, 2, 3].map((i) => (
              <div key={`food-${i}`} className="money-row">
                <div className="money-input">
                  {foodExpenses[i]?.description || ""}
                </div>
                <div className="money-yen">
                  {foodExpenses[i]?.amount
                    ? foodExpenses[i].amount.toLocaleString()
                    : ""}{" "}
                  円
                </div>
              </div>
            ))}
          </div>

          {/* その他 */}
          <div className="money-category">
            <div className="money-category-title">その他</div>
            {[0, 1, 2, 3].map((i) => (
              <div key={`other-${i}`} className="money-row">
                <div className="money-input">
                  {otherExpenses[i]?.description || ""}
                </div>
                <div className="money-yen">
                  {otherExpenses[i]?.amount
                    ? otherExpenses[i].amount.toLocaleString()
                    : ""}{" "}
                  円
                </div>
              </div>
            ))}
          </div>

          {/* サポーター食事代 */}
          <div className="money-total-row" style={{ marginTop: "2mm" }}>
            <div className="money-total-label">サポーター食事代</div>
            <div className="money-total-value">
              {staffMeal > 0 ? staffMeal.toLocaleString() : ""}円
            </div>
          </div>

          {/* 合計 */}
          <div className="money-total-row">
            <div className="money-total-label">合計</div>
            <div className="money-total-value">
              {totalUsed > 0 ? totalUsed.toLocaleString() : ""}円
            </div>
          </div>

          {/* のこったお金 */}
          <div className="money-total-row">
            <div className="money-total-label">のこったお金</div>
            <div className="money-total-value">
              {record.returnedAmount !== null
                ? record.returnedAmount.toLocaleString()
                : ""}
              円
            </div>
          </div>
        </div>

        {/* 右カラム: 行先・経路・様子 */}
        <div className="right-column">
          {/* 行先 */}
          <div className="destination-row">
            <div className="destination-label">行先</div>
            <div className="destination-value">{record.destination || ""}</div>
          </div>

          {/* 集合 → 解散 */}
          <div className="assembly-row">
            <div className="assembly-cell">
              <span className="assembly-label">集合</span>
              <span className="assembly-value">
                {record.assemblyLocation || ""}
              </span>
            </div>
            <div
              className="assembly-cell"
              style={{ borderLeft: "1px solid #000" }}
            >
              <span className="assembly-label">解散</span>
              <span className="assembly-value">
                {record.dismissalLocation || ""}
              </span>
            </div>
          </div>

          {/* 経路【集→ */}
          <div className="route-section">
            <div className="route-grid">
              <div className="route-row">
                <div className="route-cell" style={{ width: "33.33%" }}>
                  経路【集→{" "}
                  <span className="route-cell-content">
                    {routeArray[0] || ""}
                  </span>
                </div>
                <div className="route-cell" style={{ width: "33.33%" }}>
                  →{" "}
                  <span className="route-cell-content">
                    {routeArray[1] || ""}
                  </span>
                </div>
                <div className="route-cell" style={{ width: "33.33%" }}>
                  →{" "}
                  <span className="route-cell-content">
                    {routeArray[2] || ""}
                  </span>
                </div>
              </div>
              <div className="route-row">
                <div className="route-cell">
                  →{" "}
                  <span className="route-cell-content">
                    {routeArray[3] || ""}
                  </span>
                </div>
                <div className="route-cell">
                  →{" "}
                  <span className="route-cell-content">
                    {routeArray[4] || ""}
                  </span>
                </div>
                <div className="route-cell">
                  →{" "}
                  <span className="route-cell-content">
                    {routeArray[5] || ""}
                  </span>
                </div>
              </div>
              <div className="route-row">
                <div className="route-cell">
                  →{" "}
                  <span className="route-cell-content">
                    {routeArray[6] || ""}
                  </span>
                </div>
                <div className="route-cell">
                  →{" "}
                  <span className="route-cell-content">
                    {routeArray[7] || ""}
                  </span>
                </div>
                <div className="route-cell">
                  散】{" "}
                  <span className="route-cell-content">
                    {routeArray[8] || ""}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* 食事内容 */}
          <div className="meal-row">
            <div className="meal-label">食事内容</div>
            <div className="meal-value">{record.mealContent || ""}</div>
          </div>

          {/* 様子 */}
          <div className="condition-title">様子</div>
          <div className="condition-box">{record.userCondition || ""}</div>
        </div>
      </div>

      {/* 下部横一列: 食事・服薬 */}
      <div className="bottom-section">
        <div className="bottom-row">
          <div className="bottom-item">
            <span>・食事内容（{record.mealContent || "　　　"}）</span>
          </div>
          <div className="bottom-item">
            <span className="checkbox">
              {record.mealAmount === "全量" ? "✓" : ""}
            </span>
            <span>全量</span>
          </div>
          <div className="bottom-item">
            <span className="checkbox">
              {record.mealAmount === "半量" ? "✓" : ""}
            </span>
            <span>半量</span>
          </div>
          <div className="bottom-item">
            <span className="checkbox">
              {record.mealAmount === "食べず" ? "✓" : ""}
            </span>
            <span>食べず</span>
          </div>
        </div>
        <div className="bottom-row">
          <div className="bottom-item">
            <span>・服薬</span>
          </div>
          <div className="bottom-item">
            <span className="checkbox">
              {record.medicationTaken === true ? "✓" : ""}
            </span>
            <span>あり</span>
          </div>
          <div className="bottom-item">
            <span className="checkbox">
              {record.medicationTaken === false ? "✓" : ""}
            </span>
            <span>なし</span>
          </div>
          <div className="bottom-item">
            <span>服薬時間（{record.medicationTime || "　：　"}）</span>
          </div>
        </div>
      </div>

      {/* 事務所用: サポート中の特記と手順書 */}
      {viewType === "office" && (
        <>
          <div className="office-notes-title">
            サポート中の特記事項（事務所報告用）
          </div>
          <div className="office-notes-box">{record.notes || ""}</div>

          <div className="office-notes-title" style={{ marginTop: "2mm" }}>
            手順書
          </div>
          <div className="office-notes-box"></div>

          <div className="incident-checks">
            <div>
              ありに○（<span className="checkbox"></span>パニック /{" "}
              <span className="checkbox"></span>発作 /{" "}
              <span className="checkbox"></span>事故）
            </div>
          </div>
        </>
      )}
    </div>
  );
}
