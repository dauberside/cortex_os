"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { trpc } from "@/lib/trpc/client";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { ArrowLeft, ChevronDown, ChevronUp, AlertTriangle, Save, Download, Trash2, Pencil } from "lucide-react";
import { TimeSlotRecordTable } from "@/components/dailyLog/TimeSlotRecordTable";
import { TimeSlotRecord, initializeTimeSlotRecordsFromShift } from "@/types/dailyLog";
import { useDebounce } from "@/hooks/useDebounce";
import { useSession } from "next-auth/react";

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
  time: string;   // HH:MM
  type: string;   // Urine/Feces/Enema/Catheter
  note: string;
};

function RecipientEntryForm({
  dailyLogId,
  recipient,
  existingEntry,
  currentUserId,
  shiftStart,
  shiftEnd,
}: {
  dailyLogId: string;
  recipient: {
    id: string;
    name: string;
    nameKana?: string | null;
    medicationSchedules: { id: string; timing: string; medicationName: string; notes?: string | null }[];
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
}) {
  const utils = trpc.useUtils();
  const [open, setOpen] = useState(false);
  const [saved, setSaved] = useState(false);

  const entry = existingEntry || {};

  // A. 状態
  const [temperature, setTemperature] = useState<string>(entry.temperature?.toString() ?? "");
  const [bloodPressure, setBloodPressure] = useState(entry.bloodPressure ?? "");
  const [spo2, setSpo2] = useState<string>(entry.spo2?.toString() ?? "");
  const [weight, setWeight] = useState<string>(entry.weight?.toString() ?? "");
  const [vitalAlert, setVitalAlert] = useState(entry.vitalAlert ?? false);
  const [behaviorNote, setBehaviorNote] = useState(entry.behaviorNote ?? "");
  const [nightWaking, setNightWaking] = useState(entry.nightWaking ?? "");

  // B. 生活支援
  const [dinnerAmount, setDinnerAmount] = useState(entry.mealAmount ?? "");       // 夕食
  const [breakfastAmount, setBreakfastAmount] = useState(entry.mealTexture ?? ""); // 朝食（mealTextureを流用）
  const [waterIntake, setWaterIntake] = useState(entry.waterIntake ?? "");
  const [bathDone, setBathDone] = useState(entry.bathDone ?? false);
  const [bathRefusal, setBathRefusal] = useState(entry.bathRefusal ?? "");
  const [oralCareDone, setOralCareDone] = useState(entry.oralCareDone ?? false);
  const [dressingDone, setDressingDone] = useState(entry.dressingDone ?? false);

  // C. 服薬チェック
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
  const [timeSlotRecords, setTimeSlotRecords] = useState<TimeSlotRecord[]>(() => {
    if (entry.timeSlotRecords && Array.isArray(entry.timeSlotRecords)) {
      return entry.timeSlotRecords as TimeSlotRecord[];
    }
    return initializeTimeSlotRecordsFromShift(shiftStart, shiftEnd);
  });

  // 自動保存: 時間帯別記録が変更されたら3秒後に自動保存
  const debouncedTimeSlotRecords = useDebounce(timeSlotRecords, 3000);

  useEffect(() => {
    // 初回レンダリング時はスキップ
    if (!existingEntry) return;

    // 時間帯別記録が変更された場合のみ保存
    const initialRecords = existingEntry.timeSlotRecords || initializeTimeSlotRecordsFromShift(shiftStart, shiftEnd);
    const hasChanges = JSON.stringify(debouncedTimeSlotRecords) !== JSON.stringify(initialRecords);

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
    setToiletRecords((prev) => [...prev, { time: `${hh}:${mm}`, type: defaultType, note: "" }]);
  };

  const updateToiletRecord = (index: number, field: keyof ToiletRecord, value: string) => {
    setToiletRecords((prev) => prev.map((r, i) => i === index ? { ...r, [field]: value } : r));
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
      temperature: temperature ? parseFloat(temperature) : undefined,
      bloodPressure: bloodPressure || undefined,
      spo2: spo2 ? parseInt(spo2) : undefined,
      vitalAlert,
      behaviorNote: behaviorNote || undefined,
      nightWaking: nightWaking || undefined,
      mealAmount: dinnerAmount || undefined,       // 夕食
      mealTexture: breakfastAmount || undefined,   // 朝食（mealTextureを流用）
      waterIntake: waterIntake || undefined,
      bathDone,
      bathRefusal: bathRefusal || undefined,
      oralCareDone,
      dressingDone,
      medicationChecks: medicationChecks.length > 0 ? medicationChecks : undefined,
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
            <span className="text-muted-foreground text-sm">({recipient.nameKana})</span>
          )}
          {hasData && (
            <span className="rounded-full bg-green-100 px-2 py-0.5 text-xs text-green-800">
              記録済み
            </span>
          )}
          {vitalAlert && (
            <span className="flex items-center gap-1 rounded-full bg-red-100 px-2 py-0.5 text-xs text-red-800">
              <AlertTriangle className="h-3 w-3" />
              異常値
            </span>
          )}
        </div>
        {open ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
      </button>

      {open && (
        <div className="border-t p-4">
          <div className="space-y-6">
            {/* A. バイタル・状態 */}
            <div>
              <h3 className="mb-3 font-medium">A. バイタル・状態</h3>
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
                <div>
                  <label className="mb-1 block text-xs font-medium">体温 (℃)</label>
                  <input
                    type="number"
                    step="0.1"
                    value={temperature}
                    onChange={(e) => setTemperature(e.target.value)}
                    placeholder="36.5"
                    className="w-full rounded-md border px-2 py-1.5 text-sm"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-medium">血圧</label>
                  <input
                    type="text"
                    value={bloodPressure}
                    onChange={(e) => setBloodPressure(e.target.value)}
                    placeholder="120/80"
                    className="w-full rounded-md border px-2 py-1.5 text-sm"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-medium">SpO2 (%)</label>
                  <input
                    type="number"
                    value={spo2}
                    onChange={(e) => setSpo2(e.target.value)}
                    placeholder="98"
                    className="w-full rounded-md border px-2 py-1.5 text-sm"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-medium">体重 (kg)</label>
                  <input
                    type="number"
                    step="0.1"
                    value={weight}
                    onChange={(e) => setWeight(e.target.value)}
                    placeholder="55.0"
                    className="w-full rounded-md border px-2 py-1.5 text-sm"
                  />
                </div>
                <div className="flex items-end">
                  <label className="flex cursor-pointer items-center gap-1 text-sm">
                    <input
                      type="checkbox"
                      checked={vitalAlert}
                      onChange={(e) => setVitalAlert(e.target.checked)}
                      className="h-4 w-4"
                    />
                    異常値あり
                  </label>
                </div>
              </div>
              <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div>
                  <label className="mb-1 block text-xs font-medium">夜間覚醒の原因</label>
                  <input
                    type="text"
                    value={nightWaking}
                    onChange={(e) => setNightWaking(e.target.value)}
                    placeholder="例: トイレ、不穏"
                    className="w-full rounded-md border px-2 py-1.5 text-sm"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-medium">行動・心理状態</label>
                  <input
                    type="text"
                    value={behaviorNote}
                    onChange={(e) => setBehaviorNote(e.target.value)}
                    placeholder="症状→対応→結果"
                    className="w-full rounded-md border px-2 py-1.5 text-sm"
                  />
                </div>
              </div>
            </div>

            {/* B. 生活支援 */}
            <div>
              <h3 className="mb-3 font-medium">B. 生活支援</h3>
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                <div>
                  <label className="mb-1 block text-xs font-medium">夕食</label>
                  <select
                    value={dinnerAmount}
                    onChange={(e) => setDinnerAmount(e.target.value)}
                    className="w-full rounded-md border px-2 py-1.5 text-sm"
                  >
                    <option value="">-</option>
                    <option value="全量">全量</option>
                    <option value="3/4">3/4</option>
                    <option value="1/2">1/2</option>
                    <option value="1/4">1/4</option>
                    <option value="少量">少量</option>
                    <option value="なし">なし</option>
                    <option value="拒否">拒否</option>
                  </select>
                </div>
                <div>
                  <label className="mb-1 block text-xs font-medium">朝食</label>
                  <select
                    value={breakfastAmount}
                    onChange={(e) => setBreakfastAmount(e.target.value)}
                    className="w-full rounded-md border px-2 py-1.5 text-sm"
                  >
                    <option value="">-</option>
                    <option value="全量">全量</option>
                    <option value="3/4">3/4</option>
                    <option value="1/2">1/2</option>
                    <option value="1/4">1/4</option>
                    <option value="少量">少量</option>
                    <option value="なし">なし</option>
                    <option value="拒否">拒否</option>
                  </select>
                </div>
                <div>
                  <label className="mb-1 block text-xs font-medium">水分摂取</label>
                  <select
                    value={waterIntake}
                    onChange={(e) => setWaterIntake(e.target.value)}
                    className="w-full rounded-md border px-2 py-1.5 text-sm"
                  >
                    <option value="">-</option>
                    <option value="良好">良好</option>
                    <option value="少ない">少ない</option>
                    <option value="拒否">拒否</option>
                  </select>
                </div>
                <div className="flex flex-col gap-1 pt-5">
                  <label className="flex cursor-pointer items-center gap-1 text-sm">
                    <input
                      type="checkbox"
                      checked={bathDone}
                      onChange={(e) => setBathDone(e.target.checked)}
                      className="h-4 w-4"
                    />
                    入浴実施
                  </label>
                  <label className="flex cursor-pointer items-center gap-1 text-sm">
                    <input
                      type="checkbox"
                      checked={oralCareDone}
                      onChange={(e) => setOralCareDone(e.target.checked)}
                      className="h-4 w-4"
                    />
                    口腔ケア
                  </label>
                  <label className="flex cursor-pointer items-center gap-1 text-sm">
                    <input
                      type="checkbox"
                      checked={dressingDone}
                      onChange={(e) => setDressingDone(e.target.checked)}
                      className="h-4 w-4"
                    />
                    更衣
                  </label>
                </div>
                {!bathDone && (
                  <div>
                    <label className="mb-1 block text-xs font-medium">入浴拒否の理由</label>
                    <input
                      type="text"
                      value={bathRefusal}
                      onChange={(e) => setBathRefusal(e.target.value)}
                      placeholder="例: 体調不良"
                      className="w-full rounded-md border px-2 py-1.5 text-sm"
                    />
                  </div>
                )}
              </div>
            </div>

            {/* B2. 排泄記録 */}
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
                      <div key={i} className="grid grid-cols-[80px_1fr_1fr_auto] gap-2 items-center">
                        <input
                          type="time"
                          value={rec.time}
                          onChange={(e) => updateToiletRecord(i, "time", e.target.value)}
                          className="rounded-md border px-2 py-1 text-sm"
                        />
                        <select
                          value={rec.type}
                          onChange={(e) => updateToiletRecord(i, "type", e.target.value)}
                          className="rounded-md border px-2 py-1 text-sm"
                        >
                          {recipient.assessment?.toiletCareTypes?.includes("Toilet") && <option value="Toilet">トイレ</option>}
                          {recipient.assessment?.toiletCareTypes?.includes("Diaper") && <option value="Diaper">オムツ</option>}
                          {recipient.assessment?.toiletCareTypes?.includes("Enema") && <option value="Enema">浣腸</option>}
                          {recipient.assessment?.toiletCareTypes?.includes("Catheter") && <option value="Catheter">導尿</option>}
                        </select>
                        <input
                          type="text"
                          value={rec.note}
                          onChange={(e) => updateToiletRecord(i, "note", e.target.value)}
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
                          setMedChecks((prev) => ({ ...prev, [s.id]: e.target.checked }))
                        }
                        className="h-4 w-4"
                      />
                      <span className="bg-muted rounded px-1.5 py-0.5 text-xs">
                        {TIMING_LABELS[s.timing] || s.timing}
                      </span>
                      <span>{s.medicationName}</span>
                      {s.notes && (
                        <span className="text-muted-foreground text-xs">{s.notes}</span>
                      )}
                    </label>
                  ))}
                </div>
              </div>
            )}

            {/* H. 時間帯別記録 */}
            <div>
              <h3 className="mb-3 font-medium">H. 時間帯別記録（30分刻み）</h3>
              <TimeSlotRecordTable
                records={timeSlotRecords}
                onChange={setTimeSlotRecords}
                readOnly={false}
                currentUserId={currentUserId}
              />
            </div>

            {/* G. 特記事項 */}
            <div>
              <label className="mb-1 block text-sm font-medium">特記事項・気づき</label>
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
                {upsertMutation.isPending ? "保存中..." : saved ? "保存しました" : "保存"}
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
  const dateStr = new Date(log.logDate).toLocaleDateString("ja-JP", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).replace(/\//g, "-");
  const shiftLabel: Record<string, string> = { Day: "日勤", Late: "遅番", Night: "夜勤" };

  const headers = [
    "氏名", "体温(℃)", "血圧", "SpO2(%)", "体重(kg)", "異常値",
    "夕食", "朝食", "水分摂取", "入浴", "口腔ケア", "更衣", "入浴拒否理由",
    "夜間覚醒", "行動・心理状態", "服薬確認", "特記事項",
  ];

  const rows = log.entries.map((entry) => {
    const e = entry as any;
    const medChecks: { scheduleId: string; done: boolean }[] = e.medicationChecks ?? [];
    const medSummary = entry.recipient.medicationSchedules
      .sort((a, b) => TIMING_ORDER.indexOf(a.timing) - TIMING_ORDER.indexOf(b.timing))
      .map((s) => {
        const done = medChecks.find((c) => c.scheduleId === s.id)?.done ?? false;
        return `${TIMING_LABELS[s.timing] || s.timing}:${s.medicationName}:${done ? "済" : "未"}`;
      })
      .join(" / ");

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
      e.notes ?? "",
    ].map(escCsv).join(",");
  });

  const metaLines = [
    `# 業務日誌,${dateStr},${shiftLabel[log.shift] || log.shift}`,
    `# 担当,${log.staff.name || log.staff.email}${log.staffRole ? ` (${log.staffRole})` : ""}`,
    `# ユニット,${log.unit.name}`,
    "",
  ];

  const csv = "\uFEFF" + metaLines.join("\n") + headers.join(",") + "\n" + rows.join("\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `業務日誌_${dateStr}_${shiftLabel[log.shift] || log.shift}.csv`;
  a.click();
  URL.revokeObjectURL(url);
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

  // 編集フォーム用 state（log がロードされてから初期化）
  const [editShift, setEditShift] = useState("");
  const [editShiftStart, setEditShiftStart] = useState("");
  const [editShiftEnd, setEditShiftEnd] = useState("");
  const [editStaffRole, setEditStaffRole] = useState("");
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
    if (!log) return;
    setEditShift(log.shift);
    setEditShiftStart(toLocalDatetimeValue(new Date(log.shiftStart)));
    setEditShiftEnd(toLocalDatetimeValue(new Date(log.shiftEnd)));
    setEditStaffRole(log.staffRole ?? "");
    setEditMajorEvent(log.majorEvent);
    setEditHandover(log.handover ?? "");
    setEditMode(true);
  }

  function handleUpdate() {
    const start = new Date(editShiftStart);
    const end = new Date(editShiftEnd);
    updateMutation.mutate({
      id: logId,
      shift: editShift as "Day" | "Late" | "Night",
      shiftStart: start,
      shiftEnd: end,
      staffRole: editStaffRole.trim() || undefined,
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

  const entryMap = new Map<string, (typeof log.entries)[number]>(log.entries.map((e) => [e.recipientId, e]));

  // ユニットの利用者を取得（この日誌に紐づく利用者 or 全利用者）
  const unitRecipients = log.entries.map((e) => e.recipient);

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
            <Button variant="outline" size="sm" onClick={() => exportLogCsv(log)} className="flex-1 sm:flex-none">
              <Download className="mr-1.5 h-4 w-4" />
              <span className="hidden sm:inline">CSV出力</span>
              <span className="sm:hidden">CSV</span>
            </Button>
            {!editMode && (
              <Button variant="outline" size="sm" onClick={openEdit} className="flex-1 sm:flex-none">
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
                <Button variant="outline" size="sm" onClick={() => setDeleteConfirm(false)}>
                  キャンセル
                </Button>
              </div>
            ) : (
              <Button variant="outline" size="sm" onClick={() => setDeleteConfirm(true)} className="flex-1 sm:flex-none">
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
              {new Date(log.shiftStart).toLocaleTimeString("ja-JP", { hour: "2-digit", minute: "2-digit" })}
              〜
              {new Date(log.shiftEnd).toLocaleTimeString("ja-JP", { hour: "2-digit", minute: "2-digit" })}
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
                <label className="mb-1 block text-sm font-medium">開始日時</label>
                <input
                  type="datetime-local"
                  value={editShiftStart}
                  onChange={(e) => setEditShiftStart(e.target.value)}
                  className="w-full rounded-md border px-3 py-2 text-sm"
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium">終了日時</label>
                <input
                  type="datetime-local"
                  value={editShiftEnd}
                  onChange={(e) => setEditShiftEnd(e.target.value)}
                  className="w-full rounded-md border px-3 py-2 text-sm"
                />
              </div>
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium">担当役割</label>
              <input
                type="text"
                value={editStaffRole}
                onChange={(e) => setEditStaffRole(e.target.value)}
                placeholder="例: リーダー、服薬確認"
                className="w-full rounded-md border px-3 py-2 text-sm"
              />
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
              <label className="mb-1 block text-sm font-medium">申し送り事項</label>
              <textarea
                value={editHandover}
                onChange={(e) => setEditHandover(e.target.value)}
                rows={3}
                className="w-full rounded-md border px-3 py-2 text-sm"
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" size="sm" onClick={() => setEditMode(false)}>
                キャンセル
              </Button>
              <Button size="sm" disabled={updateMutation.isPending} onClick={handleUpdate}>
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
                  {k === "inHouse" ? "在寮" : k === "outing" ? "外出" : k === "overnight" ? "外泊" : k === "hospital" ? "入院" : "帰省"}: {v}名
                </span>
              ))}
          </div>
        )}

        {/* 申し送り */}
        {!editMode && log.handover && (
          <div className="mt-4">
            <p className="mb-1 text-sm font-medium">申し送り事項</p>
            <p className="bg-muted rounded-md p-3 text-sm whitespace-pre-wrap">{log.handover}</p>
          </div>
        )}
      </div>

      {/* 利用者別記録 */}
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-xl font-semibold">利用者別記録</h2>
        <UnitRecipientsAdder logId={logId} existingRecipientIds={new Set(entryMap.keys())} />
      </div>

      {unitRecipients.length === 0 ? (
        <div className="bg-card rounded-lg border p-8 text-center">
          <p className="text-muted-foreground text-sm">
            利用者が登録されていません。「利用者を追加」からユニットの利用者を追加してください。
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {unitRecipients.map((recipient) => (
            <RecipientEntryForm
              key={recipient.id}
              dailyLogId={logId}
              recipient={recipient}
              existingEntry={entryMap.get(recipient.id)}
              currentUserId={session?.user?.id}
              shiftStart={new Date(log.shiftStart)}
              shiftEnd={new Date(log.shiftEnd)}
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

  const { data: allRecipients } = trpc.recipient.list.useQuery({ includeDeleted: false });
  const upsertMutation = trpc.dailyLog.upsertEntry.useMutation({
    onSuccess: () => {
      setShowAdd(false);
      setSelectedId("");
      utils.dailyLog.get.invalidate({ id: logId });
    },
  });

  const available = allRecipients?.filter(
    (r) => !existingRecipientIds.has(r.id)
  ) ?? [];

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
            {available.map((r) => (
              <option key={r.id} value={r.id}>
                {r.name}
              </option>
            ))}
          </select>
          <Button
            size="sm"
            disabled={!selectedId}
            onClick={() => upsertMutation.mutate({ dailyLogId: logId, recipientId: selectedId })}
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
