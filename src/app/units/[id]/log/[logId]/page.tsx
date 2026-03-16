"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { trpc } from "@/lib/trpc/client";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import {
  ArrowLeft,
  ChevronDown,
  ChevronUp,
  AlertTriangle,
  Save,
  Download,
  Trash2,
  Pencil,
  UserPlus,
  X,
} from "lucide-react";
import { TimeSlotRecordTable } from "@/components/dailyLog/TimeSlotRecordTable";
import { TimeSlotRecordTimeline } from "@/components/dailyLog/TimeSlotRecordTimeline";
import {
  TimeSlotRecord,
  initializeTimeSlotRecordsFromShift,
} from "@/types/dailyLog";
import { useDebounce } from "@/hooks/useDebounce";
import { useSession } from "next-auth/react";
import * as XLSX from "xlsx";

const SHIFT_LABELS: Record<string, string> = {
  Day: "日勤",
  Late: "遅番",
  Night: "夜勤",
};

const TIMING_LABELS: Record<string, string> = {
  Morning: "朝",
  Noon: "昼",
  Evening: "夕",
  Bedtime: "就寝前",
};

type ToiletRecord = {
  time: string; // HH:MM
  type: string; // Urine/Feces/Enema/Catheter
  note: string;
};

function RecipientEntryForm({
  dailyLogId,
  recipient,
  existingEntry,
  currentUserId,
  shiftStart,
  shiftEnd,
  log,
}: {
  dailyLogId: string;
  recipient: {
    id: string;
    name: string;
    nameKana?: string | null;
    medicationSchedules: {
      id: string;
      timing: string;
      medicationName: string;
      notes?: string | null;
    }[];
    assessment?: {
      toiletCareTypes: string[];
      toiletInterval: string | null;
      toiletNote: string | null;
    } | null;
  };
  existingEntry: any;
  currentUserId?: string;
  shiftStart: Date;
  shiftEnd: Date;
  log: any;
}) {
  const utils = trpc.useUtils();
  const [open, setOpen] = useState(false);
  const [saved, setSaved] = useState(false);

  const entry = existingEntry || {};

  // 服薬チェック
  const [medChecks, setMedChecks] = useState<Record<string, boolean>>(() => {
    const checks: Record<string, boolean> = {};
    if (entry.medicationChecks) {
      entry.medicationChecks.forEach((c: any) => {
        checks[c.scheduleId] = c.done;
      });
    }
    return checks;
  });

  // B2. 排泄記録
  const [toiletRecords, setToiletRecords] = useState<ToiletRecord[]>(() => {
    if (entry.toiletRecords && Array.isArray(entry.toiletRecords)) {
      return entry.toiletRecords as ToiletRecord[];
    }
    return [];
  });

  // H. 時間帯別記録
  const [timeSlotRecords, setTimeSlotRecords] = useState<TimeSlotRecord[]>(
    () => {
      if (entry.timeSlotRecords && Array.isArray(entry.timeSlotRecords)) {
        return entry.timeSlotRecords as TimeSlotRecord[];
      }
      return initializeTimeSlotRecordsFromShift(shiftStart, shiftEnd);
    }
  );

  // 表示モード（table or timeline）
  const [viewMode, setViewMode] = useState<"table" | "timeline">("timeline");

  // 自動保存: 時間帯別記録が変更されたら3秒後に自動保存
  const debouncedTimeSlotRecords = useDebounce(timeSlotRecords, 3000);

  useEffect(() => {
    // 初回レンダリング時はスキップ
    if (!existingEntry) return;

    // 時間帯別記録が変更された場合のみ保存
    const initialRecords =
      existingEntry.timeSlotRecords ||
      initializeTimeSlotRecordsFromShift(shiftStart, shiftEnd);
    const hasChanges =
      JSON.stringify(debouncedTimeSlotRecords) !==
      JSON.stringify(initialRecords);

    if (hasChanges) {
      upsertMutation.mutate({
        dailyLogId,
        recipientId: recipient.id,
        timeSlotRecords: debouncedTimeSlotRecords,
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedTimeSlotRecords]);

  const addToiletRecord = () => {
    const now = new Date();
    const hh = String(now.getHours()).padStart(2, "0");
    const mm = String(now.getMinutes()).padStart(2, "0");
    const defaultType = recipient.assessment?.toiletCareTypes?.[0] ?? "Toilet";
    setToiletRecords((prev) => [
      ...prev,
      { time: `${hh}:${mm}`, type: defaultType, note: "" },
    ]);
  };

  const updateToiletRecord = (
    index: number,
    field: keyof ToiletRecord,
    value: string
  ) => {
    setToiletRecords((prev) =>
      prev.map((r, i) => (i === index ? { ...r, [field]: value } : r))
    );
  };

  const removeToiletRecord = (index: number) => {
    setToiletRecords((prev) => prev.filter((_, i) => i !== index));
  };

  // G. 特記事項
  const [notes, setNotes] = useState(entry.notes ?? "");

  const upsertMutation = trpc.dailyLog.upsertEntry.useMutation({
    onSuccess: () => {
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
      utils.dailyLog.get.invalidate({ id: dailyLogId });
    },
  });

  const handleSave = () => {
    const medicationChecks = recipient.medicationSchedules.map((s) => ({
      scheduleId: s.id,
      done: medChecks[s.id] ?? false,
    }));

    upsertMutation.mutate({
      dailyLogId,
      recipientId: recipient.id,
      medicationChecks:
        medicationChecks.length > 0 ? medicationChecks : undefined,
      toiletRecords: toiletRecords.length > 0 ? toiletRecords : undefined,
      timeSlotRecords: timeSlotRecords.length > 0 ? timeSlotRecords : undefined,
      notes: notes || undefined,
    });
  };

  const hasData = !!existingEntry;

  return (
    <div className="bg-card rounded-lg border">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="flex w-full items-center justify-between p-4 text-left"
      >
        <div className="flex items-center gap-2">
          <span className="font-semibold">{recipient.name}</span>
          {recipient.nameKana && (
            <span className="text-muted-foreground text-sm">
              ({recipient.nameKana})
            </span>
          )}
          {hasData && (
            <span className="rounded-full bg-green-100 px-2 py-0.5 text-xs text-green-800">
              記録済み
            </span>
          )}
        </div>
        {open ? (
          <ChevronUp className="h-4 w-4" />
        ) : (
          <ChevronDown className="h-4 w-4" />
        )}
      </button>

      {open && (
        <div className="border-t p-4">
          <div className="space-y-6">
            {/* 排泄記録 */}
            {(recipient.assessment?.toiletCareTypes?.length ?? 0) > 0 && (
              <div>
                <div className="mb-2 flex items-center justify-between">
                  <h3 className="font-medium">排泄記録</h3>
                  <button
                    type="button"
                    onClick={addToiletRecord}
                    className="text-primary hover:text-primary/80 text-xs font-medium"
                  >
                    ＋ 追加
                  </button>
                </div>
                {recipient.assessment?.toiletInterval && (
                  <p className="text-muted-foreground mb-2 text-xs">
                    誘導間隔: {recipient.assessment.toiletInterval}
                  </p>
                )}
                {toiletRecords.length === 0 ? (
                  <p className="text-muted-foreground text-xs">記録なし</p>
                ) : (
                  <div className="space-y-2">
                    {toiletRecords.map((rec, i) => (
                      <div
                        key={i}
                        className="grid grid-cols-[80px_1fr_1fr_auto] items-center gap-2"
                      >
                        <input
                          type="time"
                          value={rec.time}
                          onChange={(e) =>
                            updateToiletRecord(i, "time", e.target.value)
                          }
                          className="rounded-md border px-2 py-1 text-sm"
                        />
                        <select
                          value={rec.type}
                          onChange={(e) =>
                            updateToiletRecord(i, "type", e.target.value)
                          }
                          className="rounded-md border px-2 py-1 text-sm"
                        >
                          {recipient.assessment?.toiletCareTypes?.includes(
                            "Toilet"
                          ) && <option value="Toilet">トイレ</option>}
                          {recipient.assessment?.toiletCareTypes?.includes(
                            "Diaper"
                          ) && <option value="Diaper">オムツ</option>}
                          {recipient.assessment?.toiletCareTypes?.includes(
                            "Enema"
                          ) && <option value="Enema">浣腸</option>}
                          {recipient.assessment?.toiletCareTypes?.includes(
                            "Catheter"
                          ) && <option value="Catheter">導尿</option>}
                        </select>
                        <input
                          type="text"
                          value={rec.note}
                          onChange={(e) =>
                            updateToiletRecord(i, "note", e.target.value)
                          }
                          placeholder="性状・量・特記"
                          className="rounded-md border px-2 py-1 text-sm"
                        />
                        <button
                          type="button"
                          onClick={() => removeToiletRecord(i)}
                          className="text-muted-foreground hover:text-destructive text-sm"
                        >
                          ✕
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* C. 服薬 */}
            {recipient.medicationSchedules.length > 0 && (
              <div>
                <h3 className="mb-3 font-medium">C. 服薬確認</h3>
                <div className="space-y-2">
                  {recipient.medicationSchedules.map((s) => (
                    <label
                      key={s.id}
                      className="flex cursor-pointer items-center gap-3 rounded-md border p-2 text-sm"
                    >
                      <input
                        type="checkbox"
                        checked={medChecks[s.id] ?? false}
                        onChange={(e) =>
                          setMedChecks((prev) => ({
                            ...prev,
                            [s.id]: e.target.checked,
                          }))
                        }
                        className="h-4 w-4"
                      />
                      <span className="bg-muted rounded px-1.5 py-0.5 text-xs">
                        {TIMING_LABELS[s.timing] || s.timing}
                      </span>
                      <span>{s.medicationName}</span>
                      {s.notes && (
                        <span className="text-muted-foreground text-xs">
                          {s.notes}
                        </span>
                      )}
                    </label>
                  ))}
                </div>
              </div>
            )}

            {/* H. 時間帯別記録 */}
            <div>
              <div className="mb-3 flex items-center justify-between">
                <h3 className="font-medium">H. 時間帯別記録（30分刻み）</h3>
                <div className="flex items-center gap-2">
                  {/* 表示モード切り替え */}
                  <div className="flex rounded-md border border-gray-300 bg-white">
                    <button
                      type="button"
                      onClick={() => setViewMode("timeline")}
                      className={`px-3 py-1 text-sm transition-colors ${
                        viewMode === "timeline"
                          ? "bg-blue-600 text-white"
                          : "bg-white text-gray-700 hover:bg-gray-50"
                      } rounded-l-md`}
                    >
                      タイムライン
                    </button>
                    <button
                      type="button"
                      onClick={() => setViewMode("table")}
                      className={`px-3 py-1 text-sm transition-colors ${
                        viewMode === "table"
                          ? "bg-blue-600 text-white"
                          : "bg-white text-gray-700 hover:bg-gray-50"
                      } rounded-r-md border-l border-gray-300`}
                    >
                      表
                    </button>
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() =>
                      exportTimeSlotExcel(log, {
                        ...existingEntry,
                        recipient,
                        timeSlotRecords,
                      })
                    }
                    className="flex items-center gap-1"
                  >
                    <Download className="h-4 w-4" />
                    Excel出力
                  </Button>
                </div>
              </div>

              {/* 条件付きレンダリング */}
              {viewMode === "timeline" ? (
                <TimeSlotRecordTimeline
                  records={timeSlotRecords}
                  onChange={setTimeSlotRecords}
                  readOnly={false}
                  currentUserId={currentUserId}
                />
              ) : (
                <TimeSlotRecordTable
                  records={timeSlotRecords}
                  onChange={setTimeSlotRecords}
                  readOnly={false}
                  currentUserId={currentUserId}
                />
              )}
            </div>

            {/* G. 特記事項 */}
            <div>
              <label className="mb-1 block text-sm font-medium">
                特記事項・気づき
              </label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="変化・気づき・本人の発言など"
                rows={3}
                className="w-full rounded-md border px-3 py-2 text-sm"
              />
            </div>

            <div className="flex justify-end">
              <Button
                type="button"
                onClick={handleSave}
                disabled={upsertMutation.isPending}
                className={saved ? "bg-green-600 hover:bg-green-700" : ""}
              >
                <Save className="mr-2 h-4 w-4" />
                {upsertMutation.isPending
                  ? "保存中..."
                  : saved
                    ? "保存しました"
                    : "保存"}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

const TIMING_ORDER = ["Morning", "Noon", "Evening", "Bedtime"];

function toLocalDatetimeValue(date: Date): string {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

function escCsv(v: string | number | boolean | null | undefined): string {
  if (v === null || v === undefined) return "";
  const s = String(v);
  if (s.includes(",") || s.includes('"') || s.includes("\n")) {
    return `"${s.replace(/"/g, '""')}"`;
  }
  return s;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function exportLogCsv(log: any) {
  const dateStr = new Date(log.logDate)
    .toLocaleDateString("ja-JP", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    })
    .replace(/\//g, "-");
  const shiftLabel: Record<string, string> = {
    Day: "日勤",
    Late: "遅番",
    Night: "夜勤",
  };

  const headers = [
    "氏名",
    "体温(℃)",
    "血圧",
    "SpO2(%)",
    "体重(kg)",
    "異常値",
    "夕食",
    "朝食",
    "水分摂取",
    "入浴",
    "口腔ケア",
    "更衣",
    "入浴拒否理由",
    "夜間覚醒",
    "行動・心理状態",
    "服薬確認",
    "時間帯別記録",
    "特記事項",
  ];

  const rows = log.entries.map((entry: any) => {
    const e = entry as any;
    const medChecks: { scheduleId: string; done: boolean }[] =
      e.medicationChecks ?? [];
    const medSummary = entry.recipient.medicationSchedules
      .sort(
        (a: any, b: any) =>
          TIMING_ORDER.indexOf(a.timing) - TIMING_ORDER.indexOf(b.timing)
      )
      .map((s: any) => {
        const done =
          medChecks.find((c) => c.scheduleId === s.id)?.done ?? false;
        return `${TIMING_LABELS[s.timing] || s.timing}:${s.medicationName}:${done ? "済" : "未"}`;
      })
      .join(" / ");

    // 時間帯別記録をフォーマット
    const timeSlots = e.timeSlotRecords ?? [];
    const timeSlotSummary = Array.isArray(timeSlots)
      ? timeSlots
          .map((slot: any) => {
            const parts: string[] = [];
            if (slot.time) parts.push(`[${slot.time}]`);
            if (slot.water) parts.push(`水:${slot.water}`);
            if (slot.meal) parts.push(`食:${slot.meal}`);
            if (slot.leisure) parts.push(`余:${slot.leisure}`);
            if (slot.oral) parts.push(`口腔:済`);
            if (slot.bath) parts.push(`入浴:済`);
            if (slot.condition) parts.push(`状態:${slot.condition}`);
            if (slot.toilet) parts.push(`排:${slot.toilet}`);
            if (slot.sleep) parts.push(`睡:${slot.sleep}`);
            if (slot.notes) parts.push(`備:${slot.notes}`);
            return parts.join(" ");
          })
          .join(" | ")
      : "";

    return [
      entry.recipient.name,
      e.temperature ?? "",
      e.bloodPressure ?? "",
      e.spo2 ?? "",
      e.weight ?? "",
      e.vitalAlert ? "あり" : "",
      e.mealAmount ?? "",
      e.mealTexture ?? "",
      e.waterIntake ?? "",
      e.bathDone ? "実施" : "未実施",
      e.oralCareDone ? "実施" : "",
      e.dressingDone ? "実施" : "",
      e.bathRefusal ?? "",
      e.nightWaking ?? "",
      e.behaviorNote ?? "",
      medSummary,
      timeSlotSummary,
      e.notes ?? "",
    ]
      .map(escCsv)
      .join(",");
  });

  const metaLines = [
    `# 業務日誌,${dateStr},${shiftLabel[log.shift] || log.shift}`,
    `# 担当,${log.staff.name || log.staff.email}${log.staffRole ? ` (${log.staffRole})` : ""}`,
    `# ユニット,${log.unit.name}`,
    "",
  ];

  const csv =
    "\uFEFF" +
    metaLines.join("\n") +
    headers.join(",") +
    "\n" +
    rows.join("\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `業務日誌_${dateStr}_${shiftLabel[log.shift] || log.shift}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function exportTimeSlotExcel(log: any, entry: any) {
  const logDate = new Date(log.logDate);
  const year = logDate.getFullYear();
  const month = logDate.getMonth() + 1;
  const day = logDate.getDate();
  const dayOfWeek = ["日", "月", "火", "水", "木", "金", "土"][logDate.getDay()];

  const dateStr = `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
  const shiftLabel: Record<string, string> = {
    Day: "日勤",
    Late: "遅番",
    Night: "夜勤",
  };

  // 30分刻みの時間スロットを生成（シフトに応じて変動）
  const timeSlots: string[] = [];

  if (log.shift === 'Day') {
    // 日勤: 09:00-18:00
    for (let h = 9; h <= 18; h++) {
      timeSlots.push(`${h}:00`);
      if (h < 18) timeSlots.push(`${h}:30`);
    }
  } else if (log.shift === 'Late') {
    // 遅番: 15:00-翌01:00
    for (let h = 15; h < 24; h++) {
      timeSlots.push(`${h}:00`);
      timeSlots.push(`${h}:30`);
    }
    for (let h = 0; h <= 1; h++) {
      timeSlots.push(`${h}:00`);
      if (h < 1) timeSlots.push(`${h}:30`);
    }
  } else if (log.shift === 'Night') {
    // 夜勤: 16:00-翌10:00
    for (let h = 16; h < 24; h++) {
      timeSlots.push(`${h}:00`);
      timeSlots.push(`${h}:30`);
    }
    for (let h = 0; h <= 10; h++) {
      timeSlots.push(`${h}:00`);
      if (h < 10) timeSlots.push(`${h}:30`);
    }
  } else {
    // デフォルト: 遅番の時間帯を使用
    for (let h = 15; h < 24; h++) {
      timeSlots.push(`${h}:00`);
      timeSlots.push(`${h}:30`);
    }
    for (let h = 0; h < 10; h++) {
      timeSlots.push(`${h}:00`);
      timeSlots.push(`${h}:30`);
    }
  }

  // timeSlotRecordsをマップ化
  const timeSlotMap = new Map<string, any>();
  if (entry.timeSlotRecords && Array.isArray(entry.timeSlotRecords)) {
    entry.timeSlotRecords.forEach((slot: any) => {
      if (slot.time) {
        timeSlotMap.set(slot.time, slot);
      }
    });
  }

  // 担当職員名
  const staffName = log.staffRole || log.staff?.name || "";

  // Excelデータを作成（紙の帳票形式に合わせる）
  const wsData: any[][] = [
    // タイトル行
    ["業務日誌", `利用者名（${entry.recipient.name}）`, `${year}年${month}月${day}日（${dayOfWeek}）`],
    // 記録責任者行
    [`記録責任者（${staffName}）`],
    // ヘッダー行
    ["時間", "水分量", "食事量", "余暇", "口腔", "入浴", "体調", "服薬", "トイレ", "睡眠", "特記事項"],
  ];

  // 時間帯別のデータ行を追加
  timeSlots.forEach((time) => {
    const slot = timeSlotMap.get(time);
    wsData.push([
      time,
      slot?.water || "",
      slot?.meal || "",
      slot?.leisure || "",
      slot?.oral ? "○" : "",
      slot?.bath ? "○" : "",
      slot?.condition || "",
      slot?.medication ? "○" : "",
      slot?.toilet || "",
      slot?.sleep || "",
      slot?.notes || "",
    ]);
  });

  // フッター: 職員連絡事項・気づき
  const notesContent = entry.notes || "";
  wsData.push([]);
  wsData.push(["職員連絡事項・気づき"]);
  wsData.push([notesContent]);

  // ワークブックとワークシートを作成
  const wb = XLSX.utils.book_new();
  const ws = XLSX.utils.aoa_to_sheet(wsData);

  // セルのマージ設定
  ws["!merges"] = [
    // 1行目: 業務日誌（A1）、利用者名（B1:G1）、日付（H1:K1）
    { s: { r: 0, c: 1 }, e: { r: 0, c: 6 } }, // B1:G1 利用者名
    { s: { r: 0, c: 7 }, e: { r: 0, c: 10 } }, // H1:K1 日付
    // 2行目: 記録責任者（A2:K2）
    { s: { r: 1, c: 0 }, e: { r: 1, c: 10 } }, // A2:K2 記録責任者
  ];

  // フッターのマージ（職員連絡事項・気づき）
  const footerRowIndex = wsData.length - 2; // "職員連絡事項・気づき"の行
  const contentRowIndex = wsData.length - 1; // 内容の行

  if (!ws["!merges"]) ws["!merges"] = [];
  ws["!merges"].push(
    { s: { r: footerRowIndex, c: 0 }, e: { r: footerRowIndex, c: 10 } }, // ラベル行
    { s: { r: contentRowIndex, c: 0 }, e: { r: contentRowIndex, c: 10 } }  // 内容行
  );

  // 列幅を設定
  ws["!cols"] = [
    { wch: 6 },  // 時間
    { wch: 10 }, // 水分量
    { wch: 10 }, // 食事量
    { wch: 12 }, // 余暇
    { wch: 6 },  // 口腔
    { wch: 6 },  // 入浴
    { wch: 10 }, // 体調
    { wch: 8 },  // 服薬
    { wch: 10 }, // トイレ
    { wch: 10 }, // 睡眠
    { wch: 20 }, // 特記事項
  ];

  // 行の高さを設定
  ws["!rows"] = [
    { hpt: 25 }, // 1行目（タイトル）
    { hpt: 20 }, // 2行目（記録責任者）
    { hpt: 20 }, // 3行目（ヘッダー）
  ];

  XLSX.utils.book_append_sheet(wb, ws, "時間帯別記録");

  // ファイルをダウンロード
  XLSX.writeFile(
    wb,
    `時間帯別記録_${entry.recipient.name}_${dateStr}_${shiftLabel[log.shift] || log.shift}.xlsx`
  );
}

export default function LogDetailPage() {
  const params = useParams();
  const router = useRouter();
  const unitId = params.id as string;
  const logId = params.logId as string;

  const utils = trpc.useUtils();
  const [deleteConfirm, setDeleteConfirm] = useState(false);
  const [editMode, setEditMode] = useState(false);

  const { data: session } = useSession();
  const { data: log, isLoading } = trpc.dailyLog.get.useQuery({ id: logId });
  const { data: unit } = trpc.unit.get.useQuery({ id: unitId });

  // 編集フォーム用 state（log がロードされてから初期化）
  const [editShift, setEditShift] = useState("");
  const [editShiftStart, setEditShiftStart] = useState("");
  const [editShiftEnd, setEditShiftEnd] = useState("");
  const [editBreakMinutes, setEditBreakMinutes] = useState(0);
  const [selectedStaffIds, setSelectedStaffIds] = useState<string[]>([]);
  const [showAddStaff, setShowAddStaff] = useState(false);
  const [editMajorEvent, setEditMajorEvent] = useState(false);
  const [editHandover, setEditHandover] = useState("");

  const deleteMutation = trpc.dailyLog.delete.useMutation({
    onSuccess: () => {
      router.push(`/units/${unitId}/log`);
    },
  });

  const updateMutation = trpc.dailyLog.update.useMutation({
    onSuccess: () => {
      setEditMode(false);
      utils.dailyLog.get.invalidate({ id: logId });
    },
  });

  function openEdit() {
    if (!log || !unit) return;
    setEditShift(log.shift);
    setEditShiftStart(toLocalDatetimeValue(new Date(log.shiftStart)));
    setEditShiftEnd(toLocalDatetimeValue(new Date(log.shiftEnd)));
    setEditBreakMinutes(log.breakMinutes ?? 0);

    // staffRoleから職員名を抽出してIDに変換
    const staffNames = (log.staffRole ?? "").split("/").map((n: string) => n.trim()).filter(Boolean);
    const staffOptions = unit.staffs?.map((s: any) => s.user) || [];
    const matchedIds = staffNames
      .map((name: string) => staffOptions.find((s: any) => s.name === name)?.id)
      .filter((id: string | undefined): id is string => !!id);
    setSelectedStaffIds(matchedIds);

    setEditMajorEvent(log.majorEvent);
    setEditHandover(log.handover ?? "");
    setEditMode(true);
  }

  function handleUpdate() {
    if (!unit) return;

    const start = new Date(editShiftStart);
    const end = new Date(editShiftEnd);

    // 選択した職員名を取得して結合
    const staffOptions = unit.staffs?.map((s: any) => s.user) || [];
    const selectedStaffNames = selectedStaffIds
      .map((id) => staffOptions.find((s: any) => s.id === id)?.name)
      .filter(Boolean)
      .join("/");

    updateMutation.mutate({
      id: logId,
      shift: editShift as "Day" | "Late" | "Night",
      shiftStart: start,
      shiftEnd: end,
      breakMinutes: editBreakMinutes,
      staffRole: selectedStaffNames || undefined,
      majorEvent: editMajorEvent,
      handover: editHandover.trim() || undefined,
    });
  }

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-lg">読み込み中...</div>
      </div>
    );
  }

  if (!log) return <div className="p-8">業務日誌が見つかりません</div>;

  const entryMap = new Map<string, (typeof log.entries)[number]>(
    log.entries.map((e: any) => [e.recipientId, e])
  );

  // ユニットの利用者を取得（この日誌に紐づく利用者 or 全利用者）
  const unitRecipients = log.entries.map((e: any) => e.recipient);

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-4">
        <Link
          href={`/units/${unitId}/log`}
          className="text-muted-foreground hover:text-foreground flex items-center gap-1 text-sm"
        >
          <ArrowLeft className="h-4 w-4" />
          業務日誌一覧に戻る
        </Link>
      </div>

      {/* ヘッダー情報 */}
      <div className="bg-card mb-6 rounded-lg border p-4 sm:p-6">
        {/* タイトル行 */}
        <div className="mb-3 sm:mb-0 sm:flex sm:flex-wrap sm:items-center sm:justify-between sm:gap-3">
          <h1 className="mb-3 text-xl font-bold sm:mb-0 sm:text-2xl">
            {new Date(log.logDate).toLocaleDateString("ja-JP", {
              year: "numeric",
              month: "long",
              day: "numeric",
              weekday: "short",
            })}
          </h1>
          <div className="flex shrink-0 flex-wrap items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => exportLogCsv(log)}
              className="flex-1 sm:flex-none"
            >
              <Download className="mr-1.5 h-4 w-4" />
              <span className="hidden sm:inline">CSV出力</span>
              <span className="sm:hidden">CSV</span>
            </Button>
            {!editMode && (
              <Button
                variant="outline"
                size="sm"
                onClick={openEdit}
                className="flex-1 sm:flex-none"
              >
                <Pencil className="mr-1.5 h-4 w-4" />
                編集
              </Button>
            )}
            {deleteConfirm ? (
              <div className="flex w-full items-center gap-1 sm:w-auto">
                <span className="text-destructive text-xs">削除しますか?</span>
                <Button
                  variant="destructive"
                  size="sm"
                  disabled={deleteMutation.isPending}
                  onClick={() => deleteMutation.mutate({ id: logId })}
                >
                  削除
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setDeleteConfirm(false)}
                >
                  キャンセル
                </Button>
              </div>
            ) : (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setDeleteConfirm(true)}
                className="flex-1 sm:flex-none"
              >
                <Trash2 className="mr-1.5 h-4 w-4" />
                削除
              </Button>
            )}
          </div>
        </div>

        {/* サブ情報 */}
        {!editMode && (
          <div className="mt-2 flex flex-wrap items-center gap-3 text-sm">
            <span className="bg-muted rounded-full px-2 py-0.5">
              {SHIFT_LABELS[log.shift] || log.shift}
            </span>
            <span>
              {new Date(log.shiftStart).toLocaleTimeString("ja-JP", {
                hour: "2-digit",
                minute: "2-digit",
              })}
              〜
              {new Date(log.shiftEnd).toLocaleTimeString("ja-JP", {
                hour: "2-digit",
                minute: "2-digit",
              })}
              {log.breakMinutes > 0 && (
                <span className="ml-1 text-gray-600">
                  （休憩 {log.breakMinutes}分）
                </span>
              )}
            </span>
            <span>担当: {log.staff.name || log.staff.email}</span>
            {log.staffRole && <span>({log.staffRole})</span>}
            {log.majorEvent && (
              <span className="flex items-center gap-1 rounded-full bg-red-100 px-2 py-0.5 text-xs font-medium text-red-800">
                <AlertTriangle className="h-3 w-3" />
                重大イベントあり
              </span>
            )}
          </div>
        )}

        {/* 編集フォーム */}
        {editMode && (
          <div className="mt-4 space-y-4 border-t pt-4">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              <div>
                <label className="mb-1 block text-sm font-medium">シフト</label>
                <select
                  value={editShift}
                  onChange={(e) => setEditShift(e.target.value)}
                  className="w-full rounded-md border px-3 py-2 text-sm"
                >
                  <option value="Day">日勤</option>
                  <option value="Late">遅番</option>
                  <option value="Night">夜勤</option>
                </select>
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium">
                  開始日時
                </label>
                <input
                  type="datetime-local"
                  value={editShiftStart}
                  onChange={(e) => setEditShiftStart(e.target.value)}
                  className="w-full rounded-md border px-3 py-2 text-sm"
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium">
                  終了日時
                </label>
                <input
                  type="datetime-local"
                  value={editShiftEnd}
                  onChange={(e) => setEditShiftEnd(e.target.value)}
                  className="w-full rounded-md border px-3 py-2 text-sm"
                />
              </div>
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium">休憩時間</label>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  min={0}
                  step={15}
                  value={editBreakMinutes}
                  onChange={(e) => setEditBreakMinutes(parseInt(e.target.value) || 0)}
                  className="w-full rounded-md border px-3 py-2 text-sm"
                />
                <span className="text-sm text-gray-600">分</span>
              </div>
            </div>
            <div>
              <div className="mb-3 flex items-center justify-between">
                <label className="block text-sm font-medium">担当職員</label>
                {!showAddStaff && (
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    onClick={() => setShowAddStaff(true)}
                    disabled={!unit || (unit.staffs?.length ?? 0) === 0}
                  >
                    <UserPlus className="mr-1 h-4 w-4" />
                    追加
                  </Button>
                )}
              </div>

              {/* 職員選択UI */}
              {showAddStaff && unit && (
                <div className="mb-4 rounded-md border bg-gray-50 p-3">
                  <div className="mb-2 text-sm font-medium">
                    職員を選択してください
                  </div>
                  <div className="space-y-2">
                    {(unit.staffs?.map((s: any) => s.user) || []).map((staff: any) => (
                      <button
                        key={staff.id}
                        type="button"
                        onClick={() => {
                          if (!selectedStaffIds.includes(staff.id)) {
                            setSelectedStaffIds([...selectedStaffIds, staff.id]);
                          }
                          setShowAddStaff(false);
                        }}
                        className="w-full rounded-md border bg-white px-3 py-2 text-left text-sm hover:bg-gray-100"
                      >
                        {staff.name || staff.email}
                      </button>
                    ))}
                  </div>
                  <Button
                    type="button"
                    size="sm"
                    variant="ghost"
                    onClick={() => setShowAddStaff(false)}
                    className="mt-2 w-full"
                  >
                    キャンセル
                  </Button>
                </div>
              )}

              {/* 選択済み職員リスト */}
              {selectedStaffIds.length > 0 && unit ? (
                <div className="space-y-2">
                  {selectedStaffIds.map((staffId) => {
                    const staff = (unit.staffs?.map((s: any) => s.user) || []).find(
                      (s: any) => s.id === staffId
                    );
                    return (
                      <div
                        key={staffId}
                        className="flex items-center justify-between rounded-md border bg-white px-3 py-2"
                      >
                        <span className="text-sm">
                          {staff?.name || staff?.email}
                        </span>
                        <button
                          type="button"
                          onClick={() =>
                            setSelectedStaffIds(
                              selectedStaffIds.filter((id) => id !== staffId)
                            )
                          }
                          className="text-gray-400 hover:text-red-500"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      </div>
                    );
                  })}
                </div>
              ) : (
                !showAddStaff && (
                  <div className="rounded-md border border-dashed p-4 text-center text-sm text-gray-500">
                    {!unit || (unit.staffs?.length ?? 0) === 0
                      ? "所属職員が登録されていません。ユニット詳細画面から職員を登録してください。"
                      : "担当職員を追加してください"}
                  </div>
                )
              )}
            </div>
            <div>
              <label className="flex cursor-pointer items-center gap-2 text-sm font-medium">
                <input
                  type="checkbox"
                  checked={editMajorEvent}
                  onChange={(e) => setEditMajorEvent(e.target.checked)}
                  className="h-4 w-4"
                />
                重大イベントあり（事故・ヒヤリハット・緊急対応等）
              </label>
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium">
                申し送り事項
              </label>
              <textarea
                value={editHandover}
                onChange={(e) => setEditHandover(e.target.value)}
                rows={3}
                className="w-full rounded-md border px-3 py-2 text-sm"
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setEditMode(false)}
              >
                キャンセル
              </Button>
              <Button
                size="sm"
                disabled={updateMutation.isPending}
                onClick={handleUpdate}
              >
                <Save className="mr-1.5 h-4 w-4" />
                {updateMutation.isPending ? "保存中..." : "保存"}
              </Button>
            </div>
          </div>
        )}

        {/* 在籍サマリー */}
        {!editMode && log.residentSummary && (
          <div className="mt-4 flex flex-wrap gap-4 text-sm">
            {Object.entries(log.residentSummary as Record<string, number>)
              .filter(([, v]) => v > 0)
              .map(([k, v]) => (
                <span key={k} className="text-muted-foreground">
                  {k === "inHouse"
                    ? "在寮"
                    : k === "outing"
                      ? "外出"
                      : k === "overnight"
                        ? "外泊"
                        : k === "hospital"
                          ? "入院"
                          : "帰省"}
                  : {v}名
                </span>
              ))}
          </div>
        )}

        {/* 申し送り */}
        {!editMode && log.handover && (
          <div className="mt-4">
            <p className="mb-1 text-sm font-medium">申し送り事項</p>
            <p className="bg-muted rounded-md p-3 text-sm whitespace-pre-wrap">
              {log.handover}
            </p>
          </div>
        )}
      </div>

      {/* 利用者別記録 */}
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-xl font-semibold">利用者別記録</h2>
        <UnitRecipientsAdder
          logId={logId}
          existingRecipientIds={new Set(entryMap.keys())}
        />
      </div>

      {unitRecipients.length === 0 ? (
        <div className="bg-card rounded-lg border p-8 text-center">
          <p className="text-muted-foreground text-sm">
            利用者が登録されていません。「利用者を追加」からユニットの利用者を追加してください。
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {unitRecipients.map((recipient: any) => (
            <RecipientEntryForm
              key={recipient.id}
              dailyLogId={logId}
              recipient={recipient}
              existingEntry={entryMap.get(recipient.id)}
              currentUserId={session?.user?.id}
              shiftStart={new Date(log.shiftStart)}
              shiftEnd={new Date(log.shiftEnd)}
              log={log}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function UnitRecipientsAdder({
  logId,
  existingRecipientIds,
}: {
  logId: string;
  existingRecipientIds: Set<string>;
}) {
  const [showAdd, setShowAdd] = useState(false);
  const [selectedId, setSelectedId] = useState("");
  const utils = trpc.useUtils();

  const { data: allRecipients } = trpc.recipient.list.useQuery({
    includeDeleted: false,
  });
  const upsertMutation = trpc.dailyLog.upsertEntry.useMutation({
    onSuccess: () => {
      setShowAdd(false);
      setSelectedId("");
      utils.dailyLog.get.invalidate({ id: logId });
    },
  });

  const available =
    allRecipients?.filter((r: any) => !existingRecipientIds.has(r.id)) ?? [];

  return (
    <div className="flex items-center gap-2">
      {showAdd ? (
        <>
          <select
            value={selectedId}
            onChange={(e) => setSelectedId(e.target.value)}
            className="rounded-md border px-3 py-1.5 text-sm"
          >
            <option value="">利用者を選択...</option>
            {available.map((r: any) => (
              <option key={r.id} value={r.id}>
                {r.name}
              </option>
            ))}
          </select>
          <Button
            size="sm"
            disabled={!selectedId}
            onClick={() =>
              upsertMutation.mutate({
                dailyLogId: logId,
                recipientId: selectedId,
              })
            }
          >
            追加
          </Button>
          <Button size="sm" variant="outline" onClick={() => setShowAdd(false)}>
            キャンセル
          </Button>
        </>
      ) : (
        <Button size="sm" variant="outline" onClick={() => setShowAdd(true)}>
          利用者を追加
        </Button>
      )}
    </div>
  );
}
