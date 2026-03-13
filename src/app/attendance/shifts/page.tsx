"use client";

import { useState, useMemo, useEffect } from "react";
import { useSession } from "next-auth/react";
import { trpc } from "@/lib/trpc/client";
import { Button } from "@/components/ui/button";
import {
  Plus,
  ChevronLeft,
  ChevronRight,
  Calendar,
  Trash2,
  Edit,
  Check,
  Upload,
} from "lucide-react";

export default function ShiftsPage() {
  const { data: session } = useSession();
  const utils = trpc.useUtils();

  const today = new Date();
  const [currentYear, setCurrentYear] = useState(today.getFullYear());
  const [currentMonth, setCurrentMonth] = useState(today.getMonth() + 1);
  const [selectedUnitId, setSelectedUnitId] = useState<string>("");
  const [showModal, setShowModal] = useState(false);
  const [editingShift, setEditingShift] = useState<any | null>(null);

  const [formData, setFormData] = useState({
    staffId: "",
    shiftTypeId: "",
    date: "",
    startAt: "",
    endAt: "",
    breakMinutes: 0,
    notes: "",
  });

  const [toast, setToast] = useState<{
    message: string;
    type: "success" | "error";
  } | null>(null);

  const showToast = (message: string, type: "success" | "error") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  // Queries
  const { data: units } = trpc.unit.list.useQuery();
  const { data: shiftTypes } = trpc.shiftType.list.useQuery();

  const { data: shifts, isLoading } = trpc.shift.list.useQuery(
    {
      year: currentYear,
      month: currentMonth,
      unitId: selectedUnitId,
    },
    {
      enabled: !!selectedUnitId,
    }
  );

  const { data: unit } = trpc.unit.get.useQuery(
    { id: selectedUnitId },
    { enabled: !!selectedUnitId }
  );

  // Mutations
  const createMutation = trpc.shift.create.useMutation({
    onSuccess: () => {
      showToast("シフトを作成しました", "success");
      utils.shift.list.invalidate();
      setShowModal(false);
      setEditingShift(null);
      resetForm();
    },
    onError: (err) => showToast(err.message, "error"),
  });

  const updateMutation = trpc.shift.update.useMutation({
    onSuccess: () => {
      showToast("シフトを更新しました", "success");
      utils.shift.list.invalidate();
      setShowModal(false);
      setEditingShift(null);
      resetForm();
    },
    onError: (err) => showToast(err.message, "error"),
  });

  const deleteMutation = trpc.shift.delete.useMutation({
    onSuccess: () => {
      showToast("シフトを削除しました", "success");
      utils.shift.list.invalidate();
    },
    onError: (err) => showToast(err.message, "error"),
  });

  const publishMutation = trpc.shift.publish.useMutation({
    onSuccess: () => {
      showToast("シフトを公開しました", "success");
      utils.shift.list.invalidate();
    },
    onError: (err) => showToast(err.message, "error"),
  });

  const bulkPublishMutation = trpc.shift.bulkPublish.useMutation({
    onSuccess: (result) => {
      showToast(`${result.count}件のシフトを公開しました`, "success");
      utils.shift.list.invalidate();
    },
    onError: (err) => showToast(err.message, "error"),
  });

  const resetForm = () => {
    setFormData({
      staffId: "",
      shiftTypeId: "",
      date: "",
      startAt: "",
      endAt: "",
      breakMinutes: 0,
      notes: "",
    });
  };

  const handlePrevMonth = () => {
    if (currentMonth === 1) {
      setCurrentMonth(12);
      setCurrentYear(currentYear - 1);
    } else {
      setCurrentMonth(currentMonth - 1);
    }
  };

  const handleNextMonth = () => {
    if (currentMonth === 12) {
      setCurrentMonth(1);
      setCurrentYear(currentYear + 1);
    } else {
      setCurrentMonth(currentMonth + 1);
    }
  };

  const handleOpenCreateModal = () => {
    resetForm();
    setEditingShift(null);
    setShowModal(true);
  };

  const handleOpenEditModal = (shift: any) => {
    const dateStr = new Date(shift.date).toISOString().split("T")[0];
    const startTimeStr = new Date(shift.startAt)
      .toTimeString()
      .substring(0, 5);
    const endTimeStr = new Date(shift.endAt).toTimeString().substring(0, 5);

    setFormData({
      staffId: shift.staffId,
      shiftTypeId: shift.shiftTypeId,
      date: dateStr,
      startAt: startTimeStr,
      endAt: endTimeStr,
      breakMinutes: shift.breakMinutes,
      notes: shift.notes || "",
    });
    setEditingShift(shift);
    setShowModal(true);
  };

  const handleShiftTypeChange = (shiftTypeId: string) => {
    const shiftType = shiftTypes?.find((st) => st.id === shiftTypeId);
    if (shiftType) {
      setFormData({
        ...formData,
        shiftTypeId,
        startAt: shiftType.startTime,
        endAt: shiftType.endTime,
        breakMinutes: shiftType.breakMinutes,
      });
    } else {
      setFormData({
        ...formData,
        shiftTypeId,
      });
    }
  };

  const handleSubmit = () => {
    if (!selectedUnitId) {
      showToast("事業所を選択してください", "error");
      return;
    }

    const selectedShiftType = shiftTypes?.find(
      (st) => st.id === formData.shiftTypeId
    );

    const dateObj = new Date(formData.date);
    const startAtObj = new Date(`${formData.date}T${formData.startAt}`);
    let endAtObj = new Date(`${formData.date}T${formData.endAt}`);

    // 夜勤の日跨ぎ処理: crossesDay または endAt < startAt の場合、endAtを翌日に
    if (
      selectedShiftType?.crossesDay ||
      formData.endAt < formData.startAt
    ) {
      endAtObj = new Date(endAtObj.getTime() + 24 * 60 * 60 * 1000);
    }

    if (editingShift) {
      // 更新
      updateMutation.mutate({
        id: editingShift.id,
        shiftTypeId: formData.shiftTypeId,
        date: dateObj,
        startAt: startAtObj,
        endAt: endAtObj,
        breakMinutes: formData.breakMinutes,
        notes: formData.notes,
      });
    } else {
      // 新規作成
      createMutation.mutate({
        unitId: selectedUnitId,
        staffId: formData.staffId,
        shiftTypeId: formData.shiftTypeId,
        date: dateObj,
        startAt: startAtObj,
        endAt: endAtObj,
        breakMinutes: formData.breakMinutes,
        notes: formData.notes,
      });
    }
  };

  const handleBulkPublish = () => {
    if (!selectedUnitId) {
      showToast("事業所を選択してください", "error");
      return;
    }

    const draftCount = shifts?.filter((s) => s.status === "DRAFT").length || 0;

    if (draftCount === 0) {
      showToast("公開対象の下書きシフトがありません", "error");
      return;
    }

    if (
      !confirm(
        `${currentYear}年${currentMonth}月の下書きシフト ${draftCount}件 をすべて公開しますか？`
      )
    ) {
      return;
    }

    bulkPublishMutation.mutate({
      unitId: selectedUnitId,
      year: currentYear,
      month: currentMonth,
    });
  };

  // Calculate days in month
  const daysInMonth = new Date(currentYear, currentMonth, 0).getDate();
  const days = Array.from({ length: daysInMonth }, (_, i) => i + 1);

  // Get unique staff from unit
  const staffList = unit?.staffs?.map((us: any) => us.user) || [];

  // Group shifts by staff and date
  const shiftsByStaffAndDate = shifts?.reduce(
    (acc: any, shift: any) => {
      const dateKey = new Date(shift.date).getDate();
      if (!acc[shift.staffId]) {
        acc[shift.staffId] = {};
      }
      if (!acc[shift.staffId][dateKey]) {
        acc[shift.staffId][dateKey] = [];
      }
      acc[shift.staffId][dateKey].push(shift);
      return acc;
    },
    {} as Record<string, Record<number, any[]>>
  );

  // Filter units for LEAD
  const availableUnits = useMemo(() => {
    if (!units) return [];
    if (session?.user?.role === "MANAGER") {
      return units;
    }
    // LEAD/STAFF: 所属Unitのみ
    return units.filter((u: any) =>
      u.staffs?.some((us: any) => us.userId === session?.user?.id)
    );
  }, [units, session?.user?.role, session?.user?.id]);

  // Auto-select first available unit
  useEffect(() => {
    if (availableUnits.length > 0 && !selectedUnitId) {
      setSelectedUnitId(availableUnits[0].id);
    }
  }, [availableUnits, selectedUnitId]);

  // Count draft shifts for bulk publish button
  const draftCount = shifts?.filter((s) => s.status === "DRAFT").length || 0;

  const isManager = session?.user?.role === "MANAGER";
  const isLead = session?.user?.role === "LEAD";
  const canEdit = isManager || isLead;

  if (isLoading && selectedUnitId) {
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
        <h1 className="text-3xl font-bold">月間シフト管理</h1>
        <p className="text-muted-foreground mt-2">
          職員のシフトを作成・編集・公開します
        </p>
      </div>

      {/* Controls */}
      <div className="bg-card mb-6 rounded-lg border p-4">
        <div className="flex flex-wrap items-center gap-4">
          {/* Unit selector */}
          <div className="flex-1">
            <label className="mb-1 block text-sm font-medium">事業所</label>
            <select
              value={selectedUnitId}
              onChange={(e) => setSelectedUnitId(e.target.value)}
              className="w-full rounded-md border px-3 py-2 text-sm"
            >
              <option value="">選択してください</option>
              {availableUnits?.map((unit: any) => (
                <option key={unit.id} value={unit.id}>
                  {unit.name} ({unit.serviceType})
                </option>
              ))}
            </select>
          </div>

          {/* Month navigation */}
          <div className="flex items-center gap-2">
            <Button size="sm" variant="outline" onClick={handlePrevMonth}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <div className="flex items-center gap-2 px-4">
              <Calendar className="h-4 w-4" />
              <span className="font-semibold">
                {currentYear}年 {currentMonth}月
              </span>
            </div>
            <Button size="sm" variant="outline" onClick={handleNextMonth}>
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>

          {/* Actions */}
          {canEdit && selectedUnitId && (
            <>
              <Button size="sm" onClick={handleOpenCreateModal}>
                <Plus className="mr-2 h-4 w-4" />
                シフト追加
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={handleBulkPublish}
                disabled={bulkPublishMutation.isPending || draftCount === 0}
              >
                <Upload className="mr-2 h-4 w-4" />
                一括公開 {draftCount > 0 && `(${draftCount}件)`}
              </Button>
            </>
          )}
        </div>
      </div>

      {/* Shift Grid */}
      {!selectedUnitId ? (
        <div className="bg-card rounded-lg border p-12 text-center">
          <Calendar className="text-muted-foreground mx-auto mb-4 h-16 w-16" />
          <p className="text-muted-foreground text-lg">
            事業所を選択してください
          </p>
        </div>
      ) : staffList.length === 0 ? (
        <div className="bg-card rounded-lg border p-12 text-center">
          <p className="text-muted-foreground text-lg">
            この事業所に職員が登録されていません
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-sm">
            <thead>
              <tr className="bg-muted">
                <th className="sticky left-0 z-10 bg-muted border p-2 text-left">
                  職員
                </th>
                {days.map((day) => {
                  const date = new Date(currentYear, currentMonth - 1, day);
                  const dayOfWeek = ["日", "月", "火", "水", "木", "金", "土"][
                    date.getDay()
                  ];
                  const isWeekend = date.getDay() === 0 || date.getDay() === 6;
                  return (
                    <th
                      key={day}
                      className={`border p-2 text-center ${
                        isWeekend ? "bg-red-50" : ""
                      }`}
                    >
                      <div>{day}</div>
                      <div className="text-xs text-gray-500">{dayOfWeek}</div>
                    </th>
                  );
                })}
              </tr>
            </thead>
            <tbody>
              {staffList.map((staff: any) => (
                <tr key={staff.id}>
                  <td className="sticky left-0 z-10 bg-white border p-2 font-medium">
                    {staff.name || staff.email}
                  </td>
                  {days.map((day) => {
                    const shiftsForDay =
                      shiftsByStaffAndDate?.[staff.id]?.[day] || [];
                    const date = new Date(currentYear, currentMonth - 1, day);
                    const isWeekend =
                      date.getDay() === 0 || date.getDay() === 6;

                    return (
                      <td
                        key={day}
                        className={`border p-1 align-top ${
                          isWeekend ? "bg-red-50" : ""
                        }`}
                      >
                        <div className="space-y-1">
                          {shiftsForDay.map((shift: any) => (
                            <div
                              key={shift.id}
                              className="group relative rounded px-1 py-0.5 text-xs"
                              style={{
                                backgroundColor:
                                  shift.shiftType.color || "#DBEAFE",
                              }}
                            >
                              <div className="font-medium">
                                {shift.shiftType.name}
                              </div>
                              <div className="text-[10px] text-gray-600">
                                {new Date(shift.startAt).toLocaleTimeString(
                                  "ja-JP",
                                  {
                                    hour: "2-digit",
                                    minute: "2-digit",
                                  }
                                )}
                                -
                                {new Date(shift.endAt).toLocaleTimeString(
                                  "ja-JP",
                                  {
                                    hour: "2-digit",
                                    minute: "2-digit",
                                  }
                                )}
                              </div>
                              {shift.status === "PUBLISHED" && (
                                <div className="text-[10px] text-green-700">
                                  <Check className="inline h-3 w-3" />
                                  公開済
                                </div>
                              )}
                              {canEdit && (
                                <div className="absolute -right-1 -top-1 hidden gap-1 group-hover:flex">
                                  <button
                                    onClick={() => handleOpenEditModal(shift)}
                                    className="rounded bg-blue-600 p-0.5 text-white hover:bg-blue-700"
                                    title="編集"
                                  >
                                    <Edit className="h-3 w-3" />
                                  </button>
                                  {shift.status === "DRAFT" && (
                                    <button
                                      onClick={() =>
                                        publishMutation.mutate({
                                          id: shift.id,
                                        })
                                      }
                                      className="rounded bg-green-600 p-0.5 text-white hover:bg-green-700"
                                      title="公開"
                                    >
                                      <Check className="h-3 w-3" />
                                    </button>
                                  )}
                                  <button
                                    onClick={() => {
                                      if (
                                        confirm("このシフトを削除しますか？")
                                      ) {
                                        deleteMutation.mutate({ id: shift.id });
                                      }
                                    }}
                                    className="rounded bg-red-600 p-0.5 text-white hover:bg-red-700"
                                    title="削除"
                                  >
                                    <Trash2 className="h-3 w-3" />
                                  </button>
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Create/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-card w-full max-w-md rounded-lg p-6">
            <h2 className="mb-4 text-xl font-semibold">
              {editingShift ? "シフト編集" : "シフト追加"}
            </h2>
            <div className="space-y-4">
              {!editingShift && (
                <div>
                  <label className="mb-1 block text-sm font-medium">
                    職員 <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={formData.staffId}
                    onChange={(e) =>
                      setFormData({ ...formData, staffId: e.target.value })
                    }
                    className="w-full rounded-md border px-3 py-2 text-sm"
                    required
                  >
                    <option value="">選択してください</option>
                    {staffList.map((staff: any) => (
                      <option key={staff.id} value={staff.id}>
                        {staff.name || staff.email}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div>
                <label className="mb-1 block text-sm font-medium">
                  勤務区分 <span className="text-red-500">*</span>
                </label>
                <select
                  value={formData.shiftTypeId}
                  onChange={(e) => handleShiftTypeChange(e.target.value)}
                  className="w-full rounded-md border px-3 py-2 text-sm"
                  required
                >
                  <option value="">選択してください</option>
                  {shiftTypes?.map((st: any) => (
                    <option key={st.id} value={st.id}>
                      {st.name} ({st.startTime} - {st.endTime})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium">
                  日付 <span className="text-red-500">*</span>
                </label>
                <input
                  type="date"
                  value={formData.date}
                  onChange={(e) =>
                    setFormData({ ...formData, date: e.target.value })
                  }
                  className="w-full rounded-md border px-3 py-2 text-sm"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="mb-1 block text-sm font-medium">
                    開始時刻 <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="time"
                    value={formData.startAt}
                    onChange={(e) =>
                      setFormData({ ...formData, startAt: e.target.value })
                    }
                    className="w-full rounded-md border px-3 py-2 text-sm"
                    required
                  />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium">
                    終了時刻 <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="time"
                    value={formData.endAt}
                    onChange={(e) =>
                      setFormData({ ...formData, endAt: e.target.value })
                    }
                    className="w-full rounded-md border px-3 py-2 text-sm"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium">
                  休憩時間（分）
                </label>
                <input
                  type="number"
                  value={formData.breakMinutes}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      breakMinutes: parseInt(e.target.value) || 0,
                    })
                  }
                  className="w-full rounded-md border px-3 py-2 text-sm"
                  min="0"
                />
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium">備考</label>
                <textarea
                  value={formData.notes}
                  onChange={(e) =>
                    setFormData({ ...formData, notes: e.target.value })
                  }
                  className="w-full rounded-md border px-3 py-2 text-sm"
                  rows={2}
                />
              </div>

              <div className="flex gap-2">
                <Button
                  onClick={handleSubmit}
                  disabled={
                    createMutation.isPending ||
                    updateMutation.isPending ||
                    (!editingShift && !formData.staffId) ||
                    !formData.shiftTypeId ||
                    !formData.date ||
                    !formData.startAt ||
                    !formData.endAt
                  }
                >
                  {editingShift ? "更新する" : "作成する"}
                </Button>
                <Button
                  variant="outline"
                  onClick={() => {
                    setShowModal(false);
                    setEditingShift(null);
                    resetForm();
                  }}
                >
                  キャンセル
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
