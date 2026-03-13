"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { trpc } from "@/lib/trpc/client";
import { Button } from "@/components/ui/button";
import {
  Calendar,
  RefreshCw,
  AlertTriangle,
  CheckCircle,
  Clock,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { format, startOfMonth, endOfMonth, addMonths, subMonths } from "date-fns";
import { ja } from "date-fns/locale";

export default function AttendanceRecordsPage() {
  const { data: session } = useSession();
  const utils = trpc.useUtils();

  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedUnitId, setSelectedUnitId] = useState<string>("");

  const [toast, setToast] = useState<{
    message: string;
    type: "success" | "error";
  } | null>(null);

  const showToast = (message: string, type: "success" | "error") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  const startDate = startOfMonth(currentMonth);
  const endDate = endOfMonth(currentMonth);

  // Queries
  const { data: units } = trpc.unit.list.useQuery();

  const isStaff = session?.user?.role === "STAFF";
  const isLead = session?.user?.role === "LEAD";
  const isManager = session?.user?.role === "MANAGER";

  // Auto-select first unit for LEAD users
  useEffect(() => {
    if (isLead && units && units.length > 0 && !selectedUnitId) {
      setSelectedUnitId(units[0].id);
    }
  }, [isLead, units, selectedUnitId]);

  const { data: records, isLoading } = isStaff
    ? trpc.attendance.getMyRecords.useQuery({
        startDate,
        endDate,
      })
    : trpc.attendance.list.useQuery({
        startDate,
        endDate,
        unitId: selectedUnitId || undefined,
      });

  // Mutations
  const bulkCalculateMutation = trpc.attendance.bulkCalculate.useMutation({
    onSuccess: (result) => {
      showToast(`${result.count}件の勤怠実績を計算しました`, "success");
      utils.attendance.list.invalidate();
      utils.attendance.getMyRecords.invalidate();
    },
    onError: (err) => showToast(err.message, "error"),
  });

  const handlePrevMonth = () => {
    setCurrentMonth(subMonths(currentMonth, 1));
  };

  const handleNextMonth = () => {
    setCurrentMonth(addMonths(currentMonth, 1));
  };

  const handleBulkCalculate = () => {
    if (
      !confirm(
        `${format(currentMonth, "yyyy年MM月")}の勤怠実績を再計算しますか？`
      )
    ) {
      return;
    }

    bulkCalculateMutation.mutate({
      unitId: selectedUnitId || undefined,
      startDate,
      endDate,
    });
  };

  // Group records by staff
  const recordsByStaff = records?.reduce((acc: any, record: any) => {
    const staffKey = record.staff?.id || record.staffId;
    if (!acc[staffKey]) {
      acc[staffKey] = {
        staff: record.staff,
        records: [],
      };
    }
    acc[staffKey].records.push(record);
    return acc;
  }, {});

  // Calculate totals for each staff
  const staffSummaries = recordsByStaff
    ? Object.values(recordsByStaff).map((group: any) => {
        const totalWork = group.records.reduce(
          (sum: number, r: any) => sum + r.workMinutes,
          0
        );
        const totalMidnight = group.records.reduce(
          (sum: number, r: any) => sum + r.midnightMinutes,
          0
        );
        const daysWorked = group.records.filter(
          (r: any) => r.workMinutes > 0
        ).length;
        const warnings = group.records.filter(
          (r: any) => r.notes
        ).length;

        return {
          staff: group.staff,
          daysWorked,
          totalWork,
          totalMidnight,
          warnings,
          records: group.records,
        };
      })
    : [];

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-lg">読み込み中...</div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Toast notification */}
      {toast && (
        <div
          className={`fixed bottom-4 right-4 z-50 rounded-lg px-6 py-4 text-white shadow-lg ${
            toast.type === "success" ? "bg-green-600" : "bg-red-600"
          }`}
        >
          {toast.message}
        </div>
      )}

      {/* Header */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold">勤怠実績</h1>
        <p className="text-muted-foreground mt-2">
          {isStaff
            ? "自分の勤怠実績を確認できます"
            : "スタッフの勤怠実績を確認・管理できます"}
        </p>
      </div>

      {/* Controls */}
      <div className="bg-card mb-6 rounded-lg border p-4">
        <div className="flex flex-wrap items-center gap-4">
          {/* Month navigation */}
          <div className="flex items-center gap-2">
            <Button size="sm" variant="outline" onClick={handlePrevMonth}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <div className="flex items-center gap-2 px-4">
              <Calendar className="h-4 w-4" />
              <span className="font-semibold">
                {format(currentMonth, "yyyy年MM月")}
              </span>
            </div>
            <Button size="sm" variant="outline" onClick={handleNextMonth}>
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>

          {/* Unit filter (LEAD/MANAGER only) */}
          {!isStaff && (
            <div className="flex-1">
              <label className="mb-1 block text-sm font-medium">事業所</label>
              <select
                value={selectedUnitId}
                onChange={(e) => setSelectedUnitId(e.target.value)}
                className="w-full rounded-md border px-3 py-2 text-sm"
              >
                <option value="">すべて</option>
                {units?.map((unit: any) => (
                  <option key={unit.id} value={unit.id}>
                    {unit.name}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Actions */}
          {(isLead || isManager) && (
            <Button
              size="sm"
              onClick={handleBulkCalculate}
              disabled={bulkCalculateMutation.isPending}
            >
              <RefreshCw className="mr-2 h-4 w-4" />
              再計算
            </Button>
          )}
        </div>
      </div>

      {/* Summary Cards (STAFF view) */}
      {isStaff && records && records.length > 0 && (
        <div className="mb-6 grid grid-cols-1 gap-4 md:grid-cols-3">
          <div className="bg-card rounded-lg border p-4">
            <div className="text-muted-foreground mb-1 text-sm">出勤日数</div>
            <div className="text-2xl font-bold">
              {records.filter((r: any) => r.workMinutes > 0).length}日
            </div>
          </div>
          <div className="bg-card rounded-lg border p-4">
            <div className="text-muted-foreground mb-1 text-sm">総実働時間</div>
            <div className="text-2xl font-bold">
              {Math.floor(
                records.reduce((sum: number, r: any) => sum + r.workMinutes, 0) /
                  60
              )}
              時間
            </div>
          </div>
          <div className="bg-card rounded-lg border p-4">
            <div className="text-muted-foreground mb-1 text-sm">深夜時間</div>
            <div className="text-2xl font-bold">
              {Math.floor(
                records.reduce(
                  (sum: number, r: any) => sum + r.midnightMinutes,
                  0
                ) / 60
              )}
              時間
            </div>
          </div>
        </div>
      )}

      {/* Records Table (STAFF view) */}
      {isStaff && (
        <div className="bg-card rounded-lg border">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-muted">
                <tr>
                  <th className="p-3 text-left">日付</th>
                  <th className="p-3 text-left">出勤</th>
                  <th className="p-3 text-left">退勤</th>
                  <th className="p-3 text-right">実働</th>
                  <th className="p-3 text-right">深夜</th>
                  <th className="p-3 text-left">状態</th>
                </tr>
              </thead>
              <tbody>
                {records && records.length > 0 ? (
                  records.map((record: any) => (
                    <tr key={record.id} className="border-b last:border-b-0">
                      <td className="p-3">
                        {format(new Date(record.date), "MM/dd（E）", {
                          locale: ja,
                        })}
                      </td>
                      <td className="p-3">
                        {record.clockInAt
                          ? format(new Date(record.clockInAt), "HH:mm")
                          : "-"}
                      </td>
                      <td className="p-3">
                        {record.clockOutAt
                          ? format(new Date(record.clockOutAt), "HH:mm")
                          : "-"}
                      </td>
                      <td className="p-3 text-right">
                        {(record.workMinutes / 60).toFixed(1)}h
                      </td>
                      <td className="p-3 text-right">
                        {(record.midnightMinutes / 60).toFixed(1)}h
                      </td>
                      <td className="p-3">
                        {record.notes ? (
                          <div className="flex items-center gap-2 text-orange-600">
                            <AlertTriangle className="h-4 w-4" />
                            <span className="text-sm">要確認</span>
                          </div>
                        ) : (
                          <div className="flex items-center gap-2 text-green-600">
                            <CheckCircle className="h-4 w-4" />
                            <span className="text-sm">正常</span>
                          </div>
                        )}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={6} className="p-12 text-center">
                      <Clock className="text-muted-foreground mx-auto mb-4 h-12 w-12" />
                      <p className="text-muted-foreground">
                        勤怠実績がありません
                      </p>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Staff Summary Table (LEAD/MANAGER view) */}
      {!isStaff && (
        <div className="bg-card rounded-lg border">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-muted">
                <tr>
                  <th className="p-3 text-left">スタッフ</th>
                  <th className="p-3 text-right">出勤日数</th>
                  <th className="p-3 text-right">総実働時間</th>
                  <th className="p-3 text-right">深夜時間</th>
                  <th className="p-3 text-center">警告</th>
                </tr>
              </thead>
              <tbody>
                {staffSummaries.length > 0 ? (
                  staffSummaries.map((summary: any) => (
                    <tr
                      key={summary.staff?.id}
                      className="border-b last:border-b-0"
                    >
                      <td className="p-3">
                        {summary.staff?.name || summary.staff?.email || "不明"}
                      </td>
                      <td className="p-3 text-right">{summary.daysWorked}日</td>
                      <td className="p-3 text-right">
                        {(summary.totalWork / 60).toFixed(1)}h
                      </td>
                      <td className="p-3 text-right">
                        {(summary.totalMidnight / 60).toFixed(1)}h
                      </td>
                      <td className="p-3 text-center">
                        {summary.warnings > 0 ? (
                          <div className="flex items-center justify-center gap-2 text-orange-600">
                            <AlertTriangle className="h-4 w-4" />
                            <span>{summary.warnings}件</span>
                          </div>
                        ) : (
                          <CheckCircle className="h-4 w-4 text-green-600" />
                        )}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={5} className="p-12 text-center">
                      <Clock className="text-muted-foreground mx-auto mb-4 h-12 w-12" />
                      <p className="text-muted-foreground">
                        勤怠実績がありません
                      </p>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
