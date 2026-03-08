"use client";

import { useState, useEffect } from "react";
import { TimeSlotRecord } from "@/types/dailyLog";

interface TimeSlotRecordTableProps {
  records: TimeSlotRecord[];
  onChange: (records: TimeSlotRecord[]) => void;
  readOnly?: boolean;
  currentUserId?: string; // 現在のユーザーID（記録者として使用）
}

// クイック入力用のプリセット
const QUICK_INPUT_PRESETS = {
  water: ["100ml", "200ml", "300ml", "拒否"],
  meal: ["全量", "3/4", "1/2", "1/4", "少量", "拒否"],
  condition: ["良好", "普通", "やや不調", "不調"],
  toilet: ["排尿", "排便", "排尿+排便"],
  sleep: ["入眠", "覚醒", "浅い睡眠"],
};

export function TimeSlotRecordTable({
  records,
  onChange,
  readOnly = false,
  currentUserId,
}: TimeSlotRecordTableProps) {
  const [simpleMode, setSimpleMode] = useState(false);
  const [activeQuickInput, setActiveQuickInput] = useState<{
    index: number;
    field: keyof TimeSlotRecord;
  } | null>(null);

  // クリック外しでクイック入力を閉じる
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (!target.closest('.quick-input-dropdown')) {
        setActiveQuickInput(null);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const updateRecord = (index: number, field: keyof TimeSlotRecord, value: any) => {
    const newRecords = [...records];
    newRecords[index] = {
      ...newRecords[index],
      [field]: value,
      // データフィールドが更新された場合のみ記録者・記録時刻を更新
      ...(field !== "recordedBy" && field !== "recordedAt" && value !== null && value !== ""
        ? {
            recordedBy: currentUserId,
            recordedAt: new Date().toISOString(),
          }
        : {}),
    };
    onChange(newRecords);
    setActiveQuickInput(null);
  };


  return (
    <div>
      {/* コントロールバー */}
      <div className="mb-3 flex items-center gap-3">
        <button
          type="button"
          onClick={() => setSimpleMode(!simpleMode)}
          className="rounded-md border border-gray-300 bg-white px-3 py-1.5 text-sm hover:bg-gray-50"
        >
          {simpleMode ? "詳細表示" : "簡易表示"}
        </button>
        <span className="text-xs text-gray-500">
          {simpleMode ? "主要項目のみ表示" : "全項目表示"}
        </span>
      </div>

      <div className="overflow-x-auto max-h-[600px] overflow-y-auto">
        <table className="w-full border-collapse border border-gray-300 text-sm">
          <thead className="sticky top-0 z-10">
            <tr className="bg-gray-100">
            <th className="border border-gray-300 px-2 py-1 text-center bg-gray-100" rowSpan={2}>
              時刻
            </th>
            <th className="border border-gray-300 px-2 py-1 text-center bg-gray-100">水分量</th>
            <th className="border border-gray-300 px-2 py-1 text-center bg-gray-100">食事量</th>
            {!simpleMode && <th className="border border-gray-300 px-2 py-1 text-center bg-gray-100">余暇</th>}
            {!simpleMode && <th className="border border-gray-300 px-2 py-1 text-center bg-gray-100">口腔</th>}
            {!simpleMode && <th className="border border-gray-300 px-2 py-1 text-center bg-gray-100">入浴</th>}
            <th className="border border-gray-300 px-2 py-1 text-center bg-gray-100">体調</th>
            {!simpleMode && <th className="border border-gray-300 px-2 py-1 text-center bg-gray-100">トイレ</th>}
            {!simpleMode && <th className="border border-gray-300 px-2 py-1 text-center bg-gray-100">睡眠</th>}
            <th className="border border-gray-300 px-2 py-1 text-center bg-gray-100" rowSpan={2}>
              特記事項
            </th>
          </tr>
        </thead>
        <tbody>
          {records.map((record, index) => (
            <tr key={record.time} className={index % 2 === 0 ? "bg-white" : "bg-gray-50"}>
              <td className="border border-gray-300 px-2 py-1 text-center font-medium">
                {record.time}
              </td>
              <td className="border border-gray-300 px-1 py-1 relative group">
                <div className="relative">
                  <input
                    type="text"
                    value={record.water ?? ""}
                    onChange={(e) => updateRecord(index, "water", e.target.value || null)}
                    onFocus={() => !readOnly && setActiveQuickInput({ index, field: "water" })}
                    disabled={readOnly}
                    className="w-full border-none bg-transparent px-1 py-0.5 text-center text-xs focus:outline-none focus:ring-1 focus:ring-blue-500"
                    placeholder=""
                  />
                  {!readOnly && activeQuickInput?.index === index && activeQuickInput?.field === "water" && (
                    <div className="quick-input-dropdown absolute left-0 top-full z-20 mt-1 w-24 rounded-md border border-gray-300 bg-white shadow-lg">
                      {QUICK_INPUT_PRESETS.water.map((preset) => (
                        <button
                          key={preset}
                          type="button"
                          onClick={() => updateRecord(index, "water", preset)}
                          className="w-full px-2 py-1 text-left text-xs hover:bg-blue-50"
                        >
                          {preset}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </td>
              <td className="border border-gray-300 px-1 py-1 relative group">
                <div className="relative">
                  <input
                    type="text"
                    value={record.meal ?? ""}
                    onChange={(e) => updateRecord(index, "meal", e.target.value || null)}
                    onFocus={() => !readOnly && setActiveQuickInput({ index, field: "meal" })}
                    disabled={readOnly}
                    className="w-full border-none bg-transparent px-1 py-0.5 text-center text-xs focus:outline-none focus:ring-1 focus:ring-blue-500"
                    placeholder=""
                  />
                  {!readOnly && activeQuickInput?.index === index && activeQuickInput?.field === "meal" && (
                    <div className="quick-input-dropdown absolute left-0 top-full z-20 mt-1 w-24 rounded-md border border-gray-300 bg-white shadow-lg">
                      {QUICK_INPUT_PRESETS.meal.map((preset) => (
                        <button
                          key={preset}
                          type="button"
                          onClick={() => updateRecord(index, "meal", preset)}
                          className="w-full px-2 py-1 text-left text-xs hover:bg-blue-50"
                        >
                          {preset}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </td>
              {!simpleMode && (
                <td className="border border-gray-300 px-1 py-1">
                  <input
                    type="text"
                    value={record.leisure ?? ""}
                    onChange={(e) => updateRecord(index, "leisure", e.target.value || null)}
                    disabled={readOnly}
                    className="w-full border-none bg-transparent px-1 py-0.5 text-center text-xs focus:outline-none focus:ring-1 focus:ring-blue-500"
                    placeholder=""
                  />
                </td>
              )}
              {!simpleMode && (
                <td className="border border-gray-300 px-1 py-1 text-center">
                  <input
                    type="checkbox"
                    checked={record.oral ?? false}
                    onChange={(e) => updateRecord(index, "oral", e.target.checked ? true : null)}
                    disabled={readOnly}
                    className="h-4 w-4"
                  />
                </td>
              )}
              {!simpleMode && (
                <td className="border border-gray-300 px-1 py-1 text-center">
                  <input
                    type="checkbox"
                    checked={record.bath ?? false}
                    onChange={(e) => updateRecord(index, "bath", e.target.checked ? true : null)}
                    disabled={readOnly}
                    className="h-4 w-4"
                  />
                </td>
              )}
              <td className="border border-gray-300 px-1 py-1 relative group">
                <div className="relative">
                  <input
                    type="text"
                    value={record.condition ?? ""}
                    onChange={(e) => updateRecord(index, "condition", e.target.value || null)}
                    onFocus={() => !readOnly && setActiveQuickInput({ index, field: "condition" })}
                    disabled={readOnly}
                    className="w-full border-none bg-transparent px-1 py-0.5 text-center text-xs focus:outline-none focus:ring-1 focus:ring-blue-500"
                    placeholder=""
                  />
                  {!readOnly && activeQuickInput?.index === index && activeQuickInput?.field === "condition" && (
                    <div className="quick-input-dropdown absolute left-0 top-full z-20 mt-1 w-24 rounded-md border border-gray-300 bg-white shadow-lg">
                      {QUICK_INPUT_PRESETS.condition.map((preset) => (
                        <button
                          key={preset}
                          type="button"
                          onClick={() => updateRecord(index, "condition", preset)}
                          className="w-full px-2 py-1 text-left text-xs hover:bg-blue-50"
                        >
                          {preset}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </td>
              {!simpleMode && (
                <td className="border border-gray-300 px-1 py-1 relative group">
                  <div className="relative">
                    <input
                      type="text"
                      value={record.toilet ?? ""}
                      onChange={(e) => updateRecord(index, "toilet", e.target.value || null)}
                      onFocus={() => !readOnly && setActiveQuickInput({ index, field: "toilet" })}
                      disabled={readOnly}
                      className="w-full border-none bg-transparent px-1 py-0.5 text-center text-xs focus:outline-none focus:ring-1 focus:ring-blue-500"
                      placeholder=""
                    />
                    {!readOnly && activeQuickInput?.index === index && activeQuickInput?.field === "toilet" && (
                      <div className="quick-input-dropdown absolute left-0 top-full z-20 mt-1 w-28 rounded-md border border-gray-300 bg-white shadow-lg">
                        {QUICK_INPUT_PRESETS.toilet.map((preset) => (
                          <button
                            key={preset}
                            type="button"
                            onClick={() => updateRecord(index, "toilet", preset)}
                            className="w-full px-2 py-1 text-left text-xs hover:bg-blue-50"
                          >
                            {preset}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </td>
              )}
              {!simpleMode && (
                <td className="border border-gray-300 px-1 py-1 relative group">
                  <div className="relative">
                    <input
                      type="text"
                      value={record.sleep ?? ""}
                      onChange={(e) => updateRecord(index, "sleep", e.target.value || null)}
                      onFocus={() => !readOnly && setActiveQuickInput({ index, field: "sleep" })}
                      disabled={readOnly}
                      className="w-full border-none bg-transparent px-1 py-0.5 text-center text-xs focus:outline-none focus:ring-1 focus:ring-blue-500"
                      placeholder=""
                    />
                    {!readOnly && activeQuickInput?.index === index && activeQuickInput?.field === "sleep" && (
                      <div className="quick-input-dropdown absolute left-0 top-full z-20 mt-1 w-24 rounded-md border border-gray-300 bg-white shadow-lg">
                        {QUICK_INPUT_PRESETS.sleep.map((preset) => (
                          <button
                            key={preset}
                            type="button"
                            onClick={() => updateRecord(index, "sleep", preset)}
                            className="w-full px-2 py-1 text-left text-xs hover:bg-blue-50"
                          >
                            {preset}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </td>
              )}
              <td className="border border-gray-300 px-1 py-1">
                <input
                  type="text"
                  value={record.notes ?? ""}
                  onChange={(e) => updateRecord(index, "notes", e.target.value || null)}
                  disabled={readOnly}
                  className="w-full border-none bg-transparent px-1 py-0.5 text-xs focus:outline-none focus:ring-1 focus:ring-blue-500"
                  placeholder=""
                />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
    </div>
  );
}
