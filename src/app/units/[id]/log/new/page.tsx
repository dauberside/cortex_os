"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { trpc } from "@/lib/trpc/client";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { ArrowLeft, UserPlus, X } from "lucide-react";

const SHIFTS = [
  {
    value: "Day",
    label: "日勤",
    startH: 9,
    startM: 30,
    endH: 15,
    endM: 30,
    nextDay: false,
  },
  {
    value: "Late",
    label: "遅番",
    startH: 12,
    startM: 0,
    endH: 21,
    endM: 0,
    nextDay: false,
  },
  {
    value: "Night",
    label: "夜勤",
    startH: 15,
    startM: 30,
    endH: 9,
    endM: 30,
    nextDay: true,
  },
];

function toLocalDatetimeValue(date: Date): string {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

function applyShiftPreset(
  shiftValue: string,
  baseDate: Date
): { start: string; end: string } {
  const s = SHIFTS.find((x) => x.value === shiftValue);
  if (!s)
    return {
      start: toLocalDatetimeValue(baseDate),
      end: toLocalDatetimeValue(baseDate),
    };

  const start = new Date(baseDate);
  start.setHours(s.startH, s.startM, 0, 0);

  const end = new Date(baseDate);
  if (s.nextDay) end.setDate(end.getDate() + 1);
  end.setHours(s.endH, s.endM, 0, 0);

  return { start: toLocalDatetimeValue(start), end: toLocalDatetimeValue(end) };
}

export default function NewLogPage() {
  const params = useParams();
  const router = useRouter();
  const unitId = params.id as string;

  const now = new Date();
  const [shift, setShift] = useState("Night");
  const [shiftStart, setShiftStart] = useState(
    () => applyShiftPreset("Night", now).start
  );
  const [shiftEnd, setShiftEnd] = useState(
    () => applyShiftPreset("Night", now).end
  );
  const [breakMinutes, setBreakMinutes] = useState(0);

  const handleShiftChange = (value: string) => {
    setShift(value);
    // 現在の開始日時の「日付部分」を基準にプリセットを適用
    const base = shiftStart ? new Date(shiftStart) : now;
    const preset = applyShiftPreset(value, base);
    setShiftStart(preset.start);
    setShiftEnd(preset.end);
  };
  const [selectedStaffIds, setSelectedStaffIds] = useState<string[]>([]);
  const [showAddStaff, setShowAddStaff] = useState(false);
  const [majorEvent, setMajorEvent] = useState(false);
  const [handover, setHandover] = useState("");
  const [residentSummary, setResidentSummary] = useState({
    inHouse: 0,
    outing: 0,
    overnight: 0,
    hospital: 0,
    homeLeave: 0,
  });
  const [error, setError] = useState("");

  const { data: unit } = trpc.unit.get.useQuery({ id: unitId });

  // ユニット所属職員リスト（unit.staffs から user を取得）
  const staffOptions = unit?.staffs?.map((s: any) => s.user) || [];

  // 職員追加
  const handleAddStaff = (userId: string) => {
    if (!selectedStaffIds.includes(userId)) {
      setSelectedStaffIds([...selectedStaffIds, userId]);
    }
    setShowAddStaff(false);
  };

  // 職員削除
  const handleRemoveStaff = (userId: string) => {
    setSelectedStaffIds(selectedStaffIds.filter((id) => id !== userId));
  };

  const createMutation = trpc.dailyLog.create.useMutation({
    onSuccess: (log) => {
      router.push(`/units/${unitId}/log/${log.id}`);
    },
    onError: (err) => {
      setError(err.message);
    },
  });

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError("");

    const start = new Date(shiftStart);
    const end = new Date(shiftEnd);

    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
      setError("勤務時間を正しく入力してください");
      return;
    }
    if (end <= start) {
      setError("勤務終了時刻は開始時刻より後にしてください");
      return;
    }

    // 選択した職員名を取得して結合
    const selectedStaffNames = selectedStaffIds
      .map((id) => staffOptions.find((s: any) => s.id === id)?.name)
      .filter(Boolean)
      .join("/");

    createMutation.mutate({
      unitId,
      logDate: start,
      shift: shift as "Day" | "Late" | "Night",
      shiftStart: start,
      shiftEnd: end,
      breakMinutes,
      staffRole: selectedStaffNames || undefined,
      majorEvent,
      handover: handover.trim() || undefined,
      residentSummary,
    });
  };

  return (
    <div className="container mx-auto max-w-2xl px-4 py-8">
      <div className="mb-6">
        <Link
          href={`/units/${unitId}/log`}
          className="text-muted-foreground hover:text-foreground flex items-center gap-1 text-sm"
        >
          <ArrowLeft className="h-4 w-4" />
          業務日誌一覧に戻る
        </Link>
      </div>

      <h1 className="mb-1 text-xl font-bold sm:text-2xl">業務日誌 新規作成</h1>
      <p className="text-muted-foreground mb-6 text-sm">{unit?.name}</p>

      <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-6">
        {/* シフト・勤務時間 */}
        <div className="bg-card rounded-lg border p-4 sm:p-6">
          <h2 className="mb-4 text-base font-semibold sm:text-lg">勤務情報</h2>
          <div className="flex flex-col gap-3">
            <div>
              <label className="mb-1 block text-sm font-medium">
                シフト <span className="text-destructive">*</span>
              </label>
              <select
                value={shift}
                onChange={(e) => handleShiftChange(e.target.value)}
                className="w-full rounded-md border px-3 py-2 text-sm"
              >
                {SHIFTS.map((s) => (
                  <option key={s.value} value={s.value}>
                    {s.label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium">
                開始日時 <span className="text-destructive">*</span>
              </label>
              <input
                type="datetime-local"
                value={shiftStart}
                onChange={(e) => setShiftStart(e.target.value)}
                className="w-full rounded-md border px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium">
                終了日時 <span className="text-destructive">*</span>
              </label>
              <input
                type="datetime-local"
                value={shiftEnd}
                onChange={(e) => setShiftEnd(e.target.value)}
                className="w-full rounded-md border px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium">
                休憩時間
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  min={0}
                  step={15}
                  value={breakMinutes}
                  onChange={(e) => setBreakMinutes(parseInt(e.target.value) || 0)}
                  className="w-full rounded-md border px-3 py-2 text-sm"
                />
                <span className="text-sm text-gray-600">分</span>
              </div>
              <p className="mt-1 text-xs text-gray-500">
                一般的な休憩時間: 日勤 60分、夜勤 120分
              </p>
            </div>
          </div>

          {/* 担当職員 */}
          <div className="mt-6 border-t pt-4">
            <div className="mb-3 flex items-center justify-between">
              <label className="block text-sm font-medium">担当職員</label>
              {!showAddStaff && (
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={() => setShowAddStaff(true)}
                  disabled={staffOptions.length === 0}
                >
                  <UserPlus className="mr-1 h-4 w-4" />
                  担当職員を追加
                </Button>
              )}
            </div>

            {/* 職員選択UI */}
            {showAddStaff && (
              <div className="mb-4 rounded-md border bg-gray-50 p-3">
                <div className="mb-2 text-sm font-medium">
                  職員を選択してください
                </div>
                <div className="space-y-2">
                  {staffOptions.map((staff: any) => (
                    <button
                      key={staff.id}
                      type="button"
                      onClick={() => handleAddStaff(staff.id)}
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
            {selectedStaffIds.length > 0 ? (
              <div className="space-y-2">
                {selectedStaffIds.map((staffId) => {
                  const staff = staffOptions.find((s: any) => s.id === staffId);
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
                        onClick={() => handleRemoveStaff(staffId)}
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
                  {staffOptions.length === 0
                    ? "所属職員が登録されていません。ユニット詳細画面から職員を登録してください。"
                    : "担当職員を追加してください"}
                </div>
              )
            )}
          </div>
        </div>

        {/* 利用者在籍状況 */}
        <div className="bg-card rounded-lg border p-4 sm:p-6">
          <h2 className="mb-4 text-base font-semibold sm:text-lg">
            利用者在籍状況
          </h2>
          <div className="grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-5">
            {[
              { key: "inHouse", label: "在寮" },
              { key: "outing", label: "外出中" },
              { key: "overnight", label: "外泊" },
              { key: "hospital", label: "入院" },
              { key: "homeLeave", label: "帰省" },
            ].map(({ key, label }) => (
              <div key={key}>
                <label className="mb-1 block text-sm font-medium">
                  {label}
                </label>
                <input
                  type="number"
                  min={0}
                  value={residentSummary[key as keyof typeof residentSummary]}
                  onChange={(e) =>
                    setResidentSummary((prev) => ({
                      ...prev,
                      [key]: parseInt(e.target.value) || 0,
                    }))
                  }
                  className="w-full rounded-md border px-3 py-2 text-sm"
                />
              </div>
            ))}
          </div>
        </div>

        {/* 重大イベント・申し送り */}
        <div className="bg-card rounded-lg border p-4 sm:p-6">
          <h2 className="mb-4 text-base font-semibold sm:text-lg">
            全体トピック・申し送り
          </h2>
          <div className="mb-4">
            <label className="flex cursor-pointer items-center gap-2">
              <input
                type="checkbox"
                checked={majorEvent}
                onChange={(e) => setMajorEvent(e.target.checked)}
                className="h-4 w-4 rounded"
              />
              <span className="text-sm font-medium">
                重大イベントあり（事故・ヒヤリハット・緊急対応等）
              </span>
            </label>
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium">
              申し送り事項（次シフトへ）
            </label>
            <textarea
              value={handover}
              onChange={(e) => setHandover(e.target.value)}
              placeholder="次シフトへの引き継ぎ事項・注意点・観察ポイントを記入"
              rows={4}
              className="w-full rounded-md border px-3 py-2 text-sm"
            />
          </div>
        </div>

        {error && <p className="text-destructive text-sm">{error}</p>}

        <div className="flex flex-col gap-2 sm:flex-row sm:justify-end">
          <Link href={`/units/${unitId}/log`} className="w-full sm:w-auto">
            <Button type="button" variant="outline" className="w-full">
              キャンセル
            </Button>
          </Link>
          <Button
            type="submit"
            disabled={createMutation.isPending}
            className="w-full sm:w-auto"
          >
            {createMutation.isPending ? "作成中..." : "作成して利用者記録へ"}
          </Button>
        </div>
      </form>
    </div>
  );
}
