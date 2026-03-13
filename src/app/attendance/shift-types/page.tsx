"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";
import { trpc } from "@/lib/trpc/client";
import { Button } from "@/components/ui/button";
import { Plus, Settings, Eye, EyeOff } from "lucide-react";
import Link from "next/link";

export default function ShiftTypesPage() {
  const { data: session } = useSession();
  const utils = trpc.useUtils();

  const [showInactive, setShowInactive] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showCreateForm, setShowCreateForm] = useState(false);

  const [formData, setFormData] = useState({
    name: "",
    code: "",
    description: "",
    startTime: "",
    endTime: "",
    breakMinutes: 0,
    crossesDay: false,
    standardWorkMinutes: 480,
    color: "#DBEAFE",
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
  const { data: shiftTypes, isLoading } = trpc.shiftType.list.useQuery({
    includeInactive: showInactive,
  });

  // Mutations
  const createMutation = trpc.shiftType.create.useMutation({
    onSuccess: () => {
      showToast("勤務区分を作成しました", "success");
      utils.shiftType.list.invalidate();
      setShowCreateForm(false);
      resetForm();
    },
    onError: (err) => showToast(err.message, "error"),
  });

  const updateMutation = trpc.shiftType.update.useMutation({
    onSuccess: () => {
      showToast("勤務区分を更新しました", "success");
      utils.shiftType.list.invalidate();
      setEditingId(null);
      resetForm();
    },
    onError: (err) => showToast(err.message, "error"),
  });

  const deactivateMutation = trpc.shiftType.deactivate.useMutation({
    onSuccess: () => {
      showToast("勤務区分を無効化しました", "success");
      utils.shiftType.list.invalidate();
    },
    onError: (err) => showToast(err.message, "error"),
  });

  const reactivateMutation = trpc.shiftType.reactivate.useMutation({
    onSuccess: () => {
      showToast("勤務区分を再有効化しました", "success");
      utils.shiftType.list.invalidate();
    },
    onError: (err) => showToast(err.message, "error"),
  });

  const resetForm = () => {
    setFormData({
      name: "",
      code: "",
      description: "",
      startTime: "",
      endTime: "",
      breakMinutes: 0,
      crossesDay: false,
      standardWorkMinutes: 480,
      color: "#DBEAFE",
    });
  };

  const handleEdit = (shiftType: any) => {
    setEditingId(shiftType.id);
    setFormData({
      name: shiftType.name,
      code: shiftType.code,
      description: shiftType.description || "",
      startTime: shiftType.startTime,
      endTime: shiftType.endTime,
      breakMinutes: shiftType.breakMinutes,
      crossesDay: shiftType.crossesDay,
      standardWorkMinutes: shiftType.standardWorkMinutes,
      color: shiftType.color || "#DBEAFE",
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (editingId) {
      updateMutation.mutate({
        id: editingId,
        ...formData,
      });
    } else {
      createMutation.mutate(formData);
    }
  };

  const handleCancel = () => {
    setEditingId(null);
    setShowCreateForm(false);
    resetForm();
  };

  const isManager = session?.user?.role === "MANAGER";

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-lg">読み込み中...</div>
      </div>
    );
  }

  if (!isManager) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="bg-card rounded-lg border p-12 text-center">
          <Settings className="text-muted-foreground mx-auto mb-4 h-16 w-16" />
          <p className="text-muted-foreground text-lg">
            勤務区分の管理は管理者のみ実行できます
          </p>
        </div>
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
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">勤務区分管理</h1>
          <p className="text-muted-foreground mt-2">
            シフトで使用する勤務区分（早番・日勤・遅番・夜勤など）を管理します
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={() => setShowInactive(!showInactive)}
          >
            {showInactive ? (
              <>
                <Eye className="mr-2 h-4 w-4" />
                有効のみ表示
              </>
            ) : (
              <>
                <EyeOff className="mr-2 h-4 w-4" />
                無効も表示
              </>
            )}
          </Button>
          {!showCreateForm && (
            <Button onClick={() => setShowCreateForm(true)}>
              <Plus className="mr-2 h-4 w-4" />
              新規作成
            </Button>
          )}
        </div>
      </div>

      {/* Create Form */}
      {showCreateForm && (
        <div className="bg-card mb-6 rounded-lg border p-6">
          <h2 className="mb-4 text-xl font-semibold">新規勤務区分作成</h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="mb-1 block text-sm font-medium">
                  名前 <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  className="w-full rounded-md border px-3 py-2 text-sm"
                  placeholder="例: 早番"
                  required
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium">
                  コード <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.code}
                  onChange={(e) =>
                    setFormData({ ...formData, code: e.target.value })
                  }
                  className="w-full rounded-md border px-3 py-2 text-sm"
                  placeholder="例: EARLY"
                  required
                />
              </div>
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium">説明</label>
              <input
                type="text"
                value={formData.description}
                onChange={(e) =>
                  setFormData({ ...formData, description: e.target.value })
                }
                className="w-full rounded-md border px-3 py-2 text-sm"
                placeholder="例: 早朝から午後までの勤務"
              />
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="mb-1 block text-sm font-medium">
                  開始時刻 <span className="text-red-500">*</span>
                </label>
                <input
                  type="time"
                  value={formData.startTime}
                  onChange={(e) =>
                    setFormData({ ...formData, startTime: e.target.value })
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
                  value={formData.endTime}
                  onChange={(e) =>
                    setFormData({ ...formData, endTime: e.target.value })
                  }
                  className="w-full rounded-md border px-3 py-2 text-sm"
                  required
                />
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
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="mb-1 block text-sm font-medium">
                  標準勤務時間（分）
                </label>
                <input
                  type="number"
                  value={formData.standardWorkMinutes}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      standardWorkMinutes: parseInt(e.target.value) || 0,
                    })
                  }
                  className="w-full rounded-md border px-3 py-2 text-sm"
                  min="0"
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium">色</label>
                <input
                  type="color"
                  value={formData.color}
                  onChange={(e) =>
                    setFormData({ ...formData, color: e.target.value })
                  }
                  className="h-10 w-full rounded-md border"
                />
              </div>
            </div>

            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="crossesDay"
                checked={formData.crossesDay}
                onChange={(e) =>
                  setFormData({ ...formData, crossesDay: e.target.checked })
                }
                className="h-4 w-4 rounded"
              />
              <label htmlFor="crossesDay" className="text-sm">
                日跨ぎ勤務（夜勤など）
              </label>
            </div>

            <div className="flex gap-2">
              <Button
                type="submit"
                disabled={
                  createMutation.isPending || updateMutation.isPending
                }
              >
                作成する
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={handleCancel}
              >
                キャンセル
              </Button>
            </div>
          </form>
        </div>
      )}

      {/* List */}
      {!shiftTypes || shiftTypes.length === 0 ? (
        <div className="bg-card rounded-lg border p-12 text-center">
          <Settings className="text-muted-foreground mx-auto mb-4 h-16 w-16" />
          <p className="text-muted-foreground mb-4 text-lg">
            勤務区分がありません
          </p>
          <Button onClick={() => setShowCreateForm(true)}>
            <Plus className="mr-2 h-4 w-4" />
            新規作成
          </Button>
        </div>
      ) : (
        <div className="space-y-4">
          {shiftTypes.map((shiftType) => (
            <div
              key={shiftType.id}
              className={`bg-card rounded-lg border p-6 ${
                !shiftType.isActive ? "opacity-50" : ""
              }`}
            >
              {editingId === shiftType.id ? (
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="mb-1 block text-sm font-medium">
                        名前
                      </label>
                      <input
                        type="text"
                        value={formData.name}
                        onChange={(e) =>
                          setFormData({ ...formData, name: e.target.value })
                        }
                        className="w-full rounded-md border px-3 py-2 text-sm"
                        required
                      />
                    </div>
                    <div>
                      <label className="mb-1 block text-sm font-medium">
                        説明
                      </label>
                      <input
                        type="text"
                        value={formData.description}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            description: e.target.value,
                          })
                        }
                        className="w-full rounded-md border px-3 py-2 text-sm"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <label className="mb-1 block text-sm font-medium">
                        開始時刻
                      </label>
                      <input
                        type="time"
                        value={formData.startTime}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            startTime: e.target.value,
                          })
                        }
                        className="w-full rounded-md border px-3 py-2 text-sm"
                      />
                    </div>
                    <div>
                      <label className="mb-1 block text-sm font-medium">
                        終了時刻
                      </label>
                      <input
                        type="time"
                        value={formData.endTime}
                        onChange={(e) =>
                          setFormData({ ...formData, endTime: e.target.value })
                        }
                        className="w-full rounded-md border px-3 py-2 text-sm"
                      />
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
                  </div>

                  <div className="flex gap-2">
                    <Button
                      type="submit"
                      size="sm"
                      disabled={updateMutation.isPending}
                    >
                      保存
                    </Button>
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      onClick={handleCancel}
                    >
                      キャンセル
                    </Button>
                  </div>
                </form>
              ) : (
                <div>
                  <div className="mb-4 flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div
                        className="h-12 w-12 rounded"
                        style={{ backgroundColor: shiftType.color || "#DBEAFE" }}
                      />
                      <div>
                        <h3 className="text-xl font-semibold">
                          {shiftType.name}
                          <span className="text-muted-foreground ml-2 text-sm font-normal">
                            ({shiftType.code})
                          </span>
                        </h3>
                        {shiftType.description && (
                          <p className="text-muted-foreground text-sm">
                            {shiftType.description}
                          </p>
                        )}
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleEdit(shiftType)}
                      >
                        編集
                      </Button>
                      {shiftType.isActive ? (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() =>
                            deactivateMutation.mutate({ id: shiftType.id })
                          }
                          disabled={deactivateMutation.isPending}
                        >
                          無効化
                        </Button>
                      ) : (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() =>
                            reactivateMutation.mutate({ id: shiftType.id })
                          }
                          disabled={reactivateMutation.isPending}
                        >
                          再有効化
                        </Button>
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-4 gap-4 text-sm">
                    <div>
                      <span className="text-muted-foreground">時間帯:</span>
                      <p className="font-medium">
                        {shiftType.startTime} - {shiftType.endTime}
                        {shiftType.crossesDay && (
                          <span className="text-muted-foreground ml-2">
                            (日跨ぎ)
                          </span>
                        )}
                      </p>
                    </div>
                    <div>
                      <span className="text-muted-foreground">休憩:</span>
                      <p className="font-medium">{shiftType.breakMinutes}分</p>
                    </div>
                    <div>
                      <span className="text-muted-foreground">標準勤務:</span>
                      <p className="font-medium">
                        {shiftType.standardWorkMinutes}分
                      </p>
                    </div>
                    <div>
                      <span className="text-muted-foreground">状態:</span>
                      <p className="font-medium">
                        {shiftType.isActive ? "有効" : "無効"}
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
