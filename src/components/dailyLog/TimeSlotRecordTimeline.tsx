"use client";

import { useState, useEffect, useRef } from "react";
import { TimeSlotRecord } from "@/types/dailyLog";
import { Copy, Clipboard } from "lucide-react";

interface TimeSlotRecordTimelineProps {
  records: TimeSlotRecord[];
  onChange: (records: TimeSlotRecord[]) => void;
  readOnly?: boolean;
  currentUserId?: string;
}

// テンプレートプリセット
const TEMPLATES = {
  morning: {
    label: "朝のルーティン",
    data: {
      water: "200ml",
      meal: "全量",
      toilet: "排尿+排便",
      oral: true,
      condition: "良好",
    },
  },
  lunch: {
    label: "昼のルーティン",
    data: {
      water: "300ml",
      meal: "全量",
      toilet: "排尿",
      condition: "良好",
    },
  },
  dinner: {
    label: "夕のルーティン",
    data: {
      water: "200ml",
      meal: "全量",
      toilet: "排尿",
      medication: true,
      condition: "良好",
    },
  },
  bath: {
    label: "入浴",
    data: {
      bath: true,
      oral: true,
      condition: "良好",
    },
  },
  sleep: {
    label: "就寝",
    data: {
      sleep: "入眠",
      condition: "良好",
    },
  },
};

// クイック入力プリセット
const QUICK_PRESETS = {
  water: ["100ml", "200ml", "300ml", "拒否"],
  meal: ["全量", "3/4", "1/2", "1/4", "少量", "拒否"],
  condition: ["良好", "普通", "やや不調", "不調"],
  toilet: ["排尿", "排便", "排尿+排便"],
  sleep: ["入眠", "覚醒", "浅い睡眠"],
  leisure: ["TV視聴", "散歩", "読書", "音楽"],
};

export function TimeSlotRecordTimeline({
  records,
  onChange,
  readOnly = false,
  currentUserId,
}: TimeSlotRecordTimelineProps) {
  const [currentTime, setCurrentTime] = useState(new Date());
  const [selectedSlotIndex, setSelectedSlotIndex] = useState<number | null>(
    null
  );
  const [showTemplateMenu, setShowTemplateMenu] = useState<number | null>(null);
  const [bulkSelectMode, setBulkSelectMode] = useState(false);
  const [selectedSlots, setSelectedSlots] = useState<Set<number>>(new Set());
  const timelineRef = useRef<HTMLDivElement>(null);

  // 現在時刻を1分ごとに更新
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 60000);
    return () => clearInterval(timer);
  }, []);

  // 現在時刻に該当するスロットのインデックスを取得
  const getCurrentSlotIndex = () => {
    const hours = currentTime.getHours();
    const minutes = currentTime.getMinutes();
    const currentTimeStr = `${hours}:${minutes < 30 ? "00" : "30"}`;

    return records.findIndex((r) => r.time === currentTimeStr);
  };

  // 現在時刻のスロットまでスクロール
  const scrollToCurrentSlot = () => {
    const currentIndex = getCurrentSlotIndex();
    if (currentIndex !== -1 && timelineRef.current) {
      const cards = timelineRef.current.querySelectorAll(".timeline-card");
      if (cards[currentIndex]) {
        cards[currentIndex].scrollIntoView({
          behavior: "smooth",
          block: "center",
        });
      }
    }
  };

  // レコードが空かチェック
  const isSlotEmpty = (record: TimeSlotRecord) => {
    return (
      !record.water &&
      !record.meal &&
      !record.leisure &&
      !record.oral &&
      !record.bath &&
      !record.condition &&
      !record.medication &&
      !record.toilet &&
      !record.sleep &&
      !record.notes
    );
  };

  // レコード更新
  const updateRecord = (
    index: number,
    updates: Partial<TimeSlotRecord>
  ) => {
    const newRecords = [...records];
    newRecords[index] = {
      ...newRecords[index],
      ...updates,
      recordedBy: currentUserId,
      recordedAt: new Date().toISOString(),
    };
    onChange(newRecords);
  };

  // テンプレート適用
  const applyTemplate = (
    index: number,
    templateData: Partial<TimeSlotRecord>
  ) => {
    updateRecord(index, templateData);
  };

  // 前回コピー
  const copyFromPrevious = (index: number) => {
    if (index === 0) return;
    const previousRecord = records[index - 1];
    const { time, recordedBy, recordedAt, ...dataFields } = previousRecord;
    updateRecord(index, dataFields);
  };

  // 一括適用
  const applyToSelected = (updates: Partial<TimeSlotRecord>) => {
    const newRecords = [...records];
    selectedSlots.forEach((index) => {
      newRecords[index] = {
        ...newRecords[index],
        ...updates,
        recordedBy: currentUserId,
        recordedAt: new Date().toISOString(),
      };
    });
    onChange(newRecords);
    setBulkSelectMode(false);
    setSelectedSlots(new Set());
  };

  // 今すぐ記録
  const recordNow = () => {
    const currentIndex = getCurrentSlotIndex();
    if (currentIndex !== -1) {
      setSelectedSlotIndex(currentIndex);
      scrollToCurrentSlot();
    }
  };

  const currentSlotIndex = getCurrentSlotIndex();

  return (
    <div className="relative">
      {/* コントロールバー */}
      <div className="mb-4 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={scrollToCurrentSlot}
            className="rounded-md border border-blue-500 bg-blue-50 px-3 py-1.5 text-sm text-blue-700 hover:bg-blue-100"
          >
            現在時刻へ
          </button>
          <button
            type="button"
            onClick={() => setBulkSelectMode(!bulkSelectMode)}
            className={`rounded-md border px-3 py-1.5 text-sm ${
              bulkSelectMode
                ? "border-green-500 bg-green-50 text-green-700"
                : "border-gray-300 bg-white hover:bg-gray-50"
            }`}
          >
            {bulkSelectMode ? "一括選択中" : "一括入力"}
          </button>
        </div>
        <div className="text-xs text-gray-500">
          未記入:{" "}
          {records.filter((r) => isSlotEmpty(r)).length} / {records.length}
        </div>
      </div>

      {/* 一括適用メニュー */}
      {bulkSelectMode && selectedSlots.size > 0 && (
        <div className="mb-4 rounded-lg border border-green-500 bg-green-50 p-4">
          <div className="mb-2 text-sm font-medium text-green-900">
            {selectedSlots.size}件選択中 - 一括適用
          </div>
          <div className="flex flex-wrap gap-2">
            {Object.entries(TEMPLATES).map(([key, template]) => (
              <button
                key={key}
                type="button"
                onClick={() => applyToSelected(template.data)}
                className="rounded-md border border-green-600 bg-white px-3 py-1 text-sm hover:bg-green-100"
              >
                {template.label}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* タイムラインカード */}
      <div
        ref={timelineRef}
        className="space-y-3 max-h-[700px] overflow-y-auto pr-2"
      >
        {records.map((record, index) => {
          const isEmpty = isSlotEmpty(record);
          const isCurrent = index === currentSlotIndex;
          const isSelected =
            selectedSlotIndex === index || selectedSlots.has(index);

          return (
            <div
              key={record.time}
              className={`timeline-card rounded-lg border-2 p-4 transition-all ${
                isCurrent
                  ? "border-blue-500 bg-blue-50 shadow-lg"
                  : isEmpty
                    ? "border-orange-300 bg-orange-50"
                    : "border-gray-200 bg-white"
              } ${isSelected ? "ring-2 ring-blue-400" : ""}`}
            >
              {/* カードヘッダー */}
              <div className="mb-3 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {bulkSelectMode && (
                    <input
                      type="checkbox"
                      checked={selectedSlots.has(index)}
                      onChange={(e) => {
                        const newSelected = new Set(selectedSlots);
                        if (e.target.checked) {
                          newSelected.add(index);
                        } else {
                          newSelected.delete(index);
                        }
                        setSelectedSlots(newSelected);
                      }}
                      className="h-4 w-4"
                    />
                  )}
                  <h3
                    className={`text-lg font-bold ${
                      isCurrent ? "text-blue-700" : "text-gray-900"
                    }`}
                  >
                    {record.time}
                  </h3>
                  {isCurrent && (
                    <span className="rounded-full bg-blue-600 px-2 py-0.5 text-xs text-white">
                      現在
                    </span>
                  )}
                  {isEmpty && !isCurrent && (
                    <span className="rounded-full bg-orange-600 px-2 py-0.5 text-xs text-white">
                      未記入
                    </span>
                  )}
                </div>
                {!readOnly && !bulkSelectMode && (
                  <div className="flex gap-1">
                    <button
                      type="button"
                      onClick={() => setShowTemplateMenu(index)}
                      className="rounded-md border border-gray-300 bg-white p-1 hover:bg-gray-50"
                      title="テンプレ適用"
                    >
                      <Clipboard className="h-4 w-4" />
                    </button>
                    {index > 0 && (
                      <button
                        type="button"
                        onClick={() => copyFromPrevious(index)}
                        className="rounded-md border border-gray-300 bg-white p-1 hover:bg-gray-50"
                        title="前回コピー"
                      >
                        <Copy className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                )}
              </div>

              {/* テンプレートメニュー */}
              {showTemplateMenu === index && (
                <div className="mb-3 rounded-md border border-gray-300 bg-gray-50 p-2">
                  <div className="mb-1 text-xs font-medium text-gray-700">
                    テンプレート選択
                  </div>
                  <div className="flex flex-wrap gap-1">
                    {Object.entries(TEMPLATES).map(([key, template]) => (
                      <button
                        key={key}
                        type="button"
                        onClick={() => {
                          applyTemplate(index, template.data);
                          setShowTemplateMenu(null);
                        }}
                        className="rounded border border-gray-400 bg-white px-2 py-1 text-xs hover:bg-blue-50"
                      >
                        {template.label}
                      </button>
                    ))}
                    <button
                      type="button"
                      onClick={() => setShowTemplateMenu(null)}
                      className="rounded border border-gray-400 bg-white px-2 py-1 text-xs text-gray-600 hover:bg-gray-100"
                    >
                      閉じる
                    </button>
                  </div>
                </div>
              )}

              {/* 入力フィールド */}
              <div className="grid grid-cols-2 gap-3 md:grid-cols-3">
                <div>
                  <label className="mb-1 block text-xs font-medium text-gray-700">
                    水分量
                  </label>
                  <input
                    type="text"
                    value={record.water ?? ""}
                    onChange={(e) =>
                      updateRecord(index, { water: e.target.value || null })
                    }
                    disabled={readOnly}
                    list={`water-${index}`}
                    className="w-full rounded-md border border-gray-300 px-2 py-1.5 text-sm focus:ring-2 focus:ring-blue-500"
                    placeholder="200ml"
                  />
                  <datalist id={`water-${index}`}>
                    {QUICK_PRESETS.water.map((p) => (
                      <option key={p} value={p} />
                    ))}
                  </datalist>
                </div>

                <div>
                  <label className="mb-1 block text-xs font-medium text-gray-700">
                    食事量
                  </label>
                  <input
                    type="text"
                    value={record.meal ?? ""}
                    onChange={(e) =>
                      updateRecord(index, { meal: e.target.value || null })
                    }
                    disabled={readOnly}
                    list={`meal-${index}`}
                    className="w-full rounded-md border border-gray-300 px-2 py-1.5 text-sm focus:ring-2 focus:ring-blue-500"
                    placeholder="全量"
                  />
                  <datalist id={`meal-${index}`}>
                    {QUICK_PRESETS.meal.map((p) => (
                      <option key={p} value={p} />
                    ))}
                  </datalist>
                </div>

                <div>
                  <label className="mb-1 block text-xs font-medium text-gray-700">
                    余暇
                  </label>
                  <input
                    type="text"
                    value={record.leisure ?? ""}
                    onChange={(e) =>
                      updateRecord(index, { leisure: e.target.value || null })
                    }
                    disabled={readOnly}
                    list={`leisure-${index}`}
                    className="w-full rounded-md border border-gray-300 px-2 py-1.5 text-sm focus:ring-2 focus:ring-blue-500"
                    placeholder="TV視聴"
                  />
                  <datalist id={`leisure-${index}`}>
                    {QUICK_PRESETS.leisure.map((p) => (
                      <option key={p} value={p} />
                    ))}
                  </datalist>
                </div>

                <div>
                  <label className="mb-1 block text-xs font-medium text-gray-700">
                    トイレ
                  </label>
                  <input
                    type="text"
                    value={record.toilet ?? ""}
                    onChange={(e) =>
                      updateRecord(index, { toilet: e.target.value || null })
                    }
                    disabled={readOnly}
                    list={`toilet-${index}`}
                    className="w-full rounded-md border border-gray-300 px-2 py-1.5 text-sm focus:ring-2 focus:ring-blue-500"
                    placeholder="排尿"
                  />
                  <datalist id={`toilet-${index}`}>
                    {QUICK_PRESETS.toilet.map((p) => (
                      <option key={p} value={p} />
                    ))}
                  </datalist>
                </div>

                <div>
                  <label className="mb-1 block text-xs font-medium text-gray-700">
                    睡眠
                  </label>
                  <input
                    type="text"
                    value={record.sleep ?? ""}
                    onChange={(e) =>
                      updateRecord(index, { sleep: e.target.value || null })
                    }
                    disabled={readOnly}
                    list={`sleep-${index}`}
                    className="w-full rounded-md border border-gray-300 px-2 py-1.5 text-sm focus:ring-2 focus:ring-blue-500"
                    placeholder="入眠"
                  />
                  <datalist id={`sleep-${index}`}>
                    {QUICK_PRESETS.sleep.map((p) => (
                      <option key={p} value={p} />
                    ))}
                  </datalist>
                </div>

                <div>
                  <label className="mb-1 block text-xs font-medium text-gray-700">
                    体調
                  </label>
                  <input
                    type="text"
                    value={record.condition ?? ""}
                    onChange={(e) =>
                      updateRecord(index, { condition: e.target.value || null })
                    }
                    disabled={readOnly}
                    list={`condition-${index}`}
                    className="w-full rounded-md border border-gray-300 px-2 py-1.5 text-sm focus:ring-2 focus:ring-blue-500"
                    placeholder="良好"
                  />
                  <datalist id={`condition-${index}`}>
                    {QUICK_PRESETS.condition.map((p) => (
                      <option key={p} value={p} />
                    ))}
                  </datalist>
                </div>
              </div>

              {/* チェックボックス群 */}
              <div className="mt-3 flex flex-wrap items-center gap-4">
                <label className="flex items-center gap-1.5 text-sm">
                  <input
                    type="checkbox"
                    checked={record.oral ?? false}
                    onChange={(e) =>
                      updateRecord(index, {
                        oral: e.target.checked ? true : null,
                      })
                    }
                    disabled={readOnly}
                    className="h-4 w-4 rounded"
                  />
                  口腔ケア
                </label>
                <label className="flex items-center gap-1.5 text-sm">
                  <input
                    type="checkbox"
                    checked={record.bath ?? false}
                    onChange={(e) =>
                      updateRecord(index, {
                        bath: e.target.checked ? true : null,
                      })
                    }
                    disabled={readOnly}
                    className="h-4 w-4 rounded"
                  />
                  入浴
                </label>
                <label className="flex items-center gap-1.5 text-sm">
                  <input
                    type="checkbox"
                    checked={record.medication ?? false}
                    onChange={(e) =>
                      updateRecord(index, {
                        medication: e.target.checked ? true : null,
                      })
                    }
                    disabled={readOnly}
                    className="h-4 w-4 rounded"
                  />
                  服薬
                </label>
              </div>

              {/* メモ */}
              <div className="mt-3">
                <label className="mb-1 block text-xs font-medium text-gray-700">
                  特記事項
                </label>
                <input
                  type="text"
                  value={record.notes ?? ""}
                  onChange={(e) =>
                    updateRecord(index, { notes: e.target.value || null })
                  }
                  disabled={readOnly}
                  className="w-full rounded-md border border-gray-300 px-2 py-1.5 text-sm focus:ring-2 focus:ring-blue-500"
                  placeholder="特記事項があれば記入"
                />
              </div>

              {/* 記録者情報 */}
              {record.recordedBy && (
                <div className="mt-2 text-xs text-gray-500">
                  記録:{" "}
                  {record.recordedAt
                    ? new Date(record.recordedAt).toLocaleString("ja-JP", {
                        month: "2-digit",
                        day: "2-digit",
                        hour: "2-digit",
                        minute: "2-digit",
                      })
                    : ""}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* 今すぐ記録ボタン（固定） */}
      {!readOnly && (
        <button
          type="button"
          onClick={recordNow}
          className="fixed bottom-6 right-6 z-50 flex h-14 w-14 items-center justify-center rounded-full bg-blue-600 text-white shadow-lg hover:bg-blue-700 focus:outline-none focus:ring-4 focus:ring-blue-300 md:h-16 md:w-16"
          title="現在の時刻に記録"
        >
          <div className="text-center">
            <div className="text-xs">今すぐ</div>
            <div className="text-xs">記録</div>
          </div>
        </button>
      )}
    </div>
  );
}
