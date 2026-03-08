import React, { useState, useEffect } from "react";
import { UseFormWatch, UseFormSetValue } from "react-hook-form";
import { RecipientFormData } from "@/lib/validations/recipientSchema";
import { Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";

interface FamilyMembersSectionProps {
  watch: UseFormWatch<RecipientFormData>;
  setValue: UseFormSetValue<RecipientFormData>;
}

interface FamilyMember {
  relation: string;
  name: string;
  age?: number;
  livingTogether?: boolean;
  notes?: string;
}

interface FamilyMembersData {
  diagram?: string;
  members: FamilyMember[];
}

export function FamilyMembersSection({
  watch,
  setValue,
}: FamilyMembersSectionProps) {
  const familyMembersData = watch("familyMembers") as any;

  // 初期値を計算（useStateの初期化時のみ実行される）
  const getInitialDiagram = () => {
    return familyMembersData?.diagram || "";
  };

  const getInitialMembers = () => {
    if (familyMembersData?.members && familyMembersData.members.length > 0) {
      return familyMembersData.members;
    }
    return [
      {
        relation: "",
        name: "",
        age: undefined,
        livingTogether: false,
        notes: "",
      },
    ];
  };

  const [diagram, setDiagram] = useState(getInitialDiagram);
  const [members, setMembers] = useState<FamilyMember[]>(getInitialMembers);

  // ローカルstateが変更されたときのみフォームに反映
  // familyMembersDataは依存配列から除外してループを防ぐ
  useEffect(() => {
    const data: FamilyMembersData = {
      diagram,
      members,
    };
    setValue("familyMembers", data as any, { shouldDirty: true });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [diagram, members, setValue]);

  const addMember = () => {
    setMembers([
      ...members,
      {
        relation: "",
        name: "",
        age: undefined,
        livingTogether: false,
        notes: "",
      },
    ]);
  };

  const removeMember = (index: number) => {
    if (members.length > 1) {
      setMembers(members.filter((_, i) => i !== index));
    }
  };

  const updateMember = (
    index: number,
    field: keyof FamilyMember,
    value: string | number | boolean | undefined
  ) => {
    const newMembers = [...members];
    newMembers[index] = { ...newMembers[index], [field]: value };
    setMembers(newMembers);
  };

  // 家系図を自動生成する関数（3世代対応版）
  const generateDiagram = () => {
    if (members.length === 0 || members.every((m) => !m.relation && !m.name)) {
      alert("家族メンバーを追加してから自動生成してください");
      return;
    }

    // 続柄ごとに分類
    const grandparents: FamilyMember[] = [];
    const parents: FamilyMember[] = [];
    const siblings: FamilyMember[] = [];
    const others: FamilyMember[] = [];

    members.forEach((member) => {
      if (!member.relation) return;

      const relation = member.relation.toLowerCase();
      if (relation.includes("祖父") || relation.includes("祖母")) {
        grandparents.push(member);
      } else if (relation.includes("父") || relation.includes("母")) {
        parents.push(member);
      } else if (
        relation.includes("兄") ||
        relation.includes("姉") ||
        relation.includes("弟") ||
        relation.includes("妹") ||
        relation.includes("本人")
      ) {
        siblings.push(member);
      } else {
        others.push(member);
      }
    });

    let diagramText = "";

    // 祖父母の行
    if (grandparents.length > 0) {
      const gpLabels = grandparents.map((gp) => {
        let text = gp.relation;
        if (gp.livingTogether) text += "◎";
        return text;
      });

      diagramText += gpLabels.join("  ") + "\n";

      if (parents.length > 0 || siblings.length > 0) {
        diagramText += "    |\n";
      }
    }

    // 両親の行
    if (parents.length > 0) {
      const parentLabels = parents.map((p) => {
        let text = p.relation;
        if (p.livingTogether) text += "◎";
        return text;
      });

      if (parentLabels.length === 2) {
        diagramText += `${parentLabels[0]} ─── ${parentLabels[1]}\n`;
      } else {
        diagramText += `${parentLabels.join("  ")}\n`;
      }

      if (siblings.length > 0) {
        diagramText += "    |\n";
      }
    }

    // 兄弟姉妹と本人の行
    if (siblings.length > 0) {
      const siblingLabels = siblings.map((s) => {
        let text = s.relation;
        if (s.livingTogether) text += "◎";
        return text;
      });

      // 区切り線を追加（2人以上の場合）
      if (siblings.length >= 2) {
        const totalWidth = siblingLabels.reduce((sum, label, idx) => {
          return sum + label.length + (idx > 0 ? 2 : 0);
        }, 0);

        diagramText += "┌" + "─".repeat(totalWidth - 2) + "┐\n";
      }

      diagramText += siblingLabels.join("  ") + "\n";
    }

    // その他の家族
    if (others.length > 0) {
      diagramText += "\n【その他】\n";
      others.forEach((m) => {
        let text = m.relation;
        if (m.livingTogether) text += "◎";
        diagramText += text + "\n";
      });
    }

    if (members.some((m) => m.livingTogether)) {
      diagramText += "\n※ ◎印は同居を表します";
    }

    setDiagram(diagramText);
  };

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold">家族構成</h3>
        <p className="text-muted-foreground text-sm">
          ご家族の情報を登録してください
        </p>
      </div>

      {/* 家系図・概要 */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <label className="block text-sm font-medium">
            家系図（図で表示）
          </label>
          <Button
            type="button"
            onClick={generateDiagram}
            size="sm"
            variant="outline"
            className="text-blue-600 hover:bg-blue-50"
          >
            自動生成
          </Button>
        </div>
        <textarea
          value={diagram}
          onChange={(e) => setDiagram(e.target.value)}
          className="w-full rounded border px-3 py-2 font-mono text-sm"
          rows={8}
          placeholder={`家系図を入力してください（例）：\n    父 ― 母\n      |\n    ┌─┴─┐\n    兄  本人`}
        />
        <p className="text-xs text-gray-500">
          ※
          下の家族メンバー情報から「自動生成」できます。フェイスシート印刷時に図として表示されます。
        </p>
      </div>

      {/* 家族メンバー一覧 */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h4 className="text-sm font-semibold">家族メンバー</h4>
          <Button type="button" onClick={addMember} size="sm" variant="outline">
            <Plus className="mr-2 h-4 w-4" />
            メンバー追加
          </Button>
        </div>

        <div className="space-y-4">
          {members.map((member, index) => (
            <div
              key={index}
              className="rounded-lg border-2 border-gray-200 bg-gray-50 p-4"
            >
              <div className="mb-3 flex items-center justify-between">
                <span className="text-sm font-semibold text-gray-700">
                  メンバー {index + 1}
                </span>
                {members.length > 1 && (
                  <Button
                    type="button"
                    onClick={() => removeMember(index)}
                    size="sm"
                    variant="ghost"
                    className="text-red-600 hover:bg-red-50 hover:text-red-700"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                )}
              </div>

              <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
                {/* 続柄 */}
                <div>
                  <label className="mb-1 block text-xs font-medium text-gray-700">
                    続柄
                  </label>
                  <input
                    type="text"
                    value={member.relation}
                    onChange={(e) =>
                      updateMember(index, "relation", e.target.value)
                    }
                    className="w-full rounded border px-3 py-2 text-sm"
                    placeholder="父 / 母 / 兄 等"
                  />
                </div>

                {/* 氏名 */}
                <div>
                  <label className="mb-1 block text-xs font-medium text-gray-700">
                    氏名
                  </label>
                  <input
                    type="text"
                    value={member.name}
                    onChange={(e) =>
                      updateMember(index, "name", e.target.value)
                    }
                    className="w-full rounded border px-3 py-2 text-sm"
                    placeholder="山田 太郎"
                  />
                </div>

                {/* 年齢 */}
                <div>
                  <label className="mb-1 block text-xs font-medium text-gray-700">
                    年齢（任意）
                  </label>
                  <input
                    type="number"
                    value={member.age || ""}
                    onChange={(e) =>
                      updateMember(
                        index,
                        "age",
                        e.target.value ? parseInt(e.target.value) : undefined
                      )
                    }
                    className="w-full rounded border px-3 py-2 text-sm"
                    placeholder="65"
                    min="0"
                    max="120"
                  />
                </div>

                {/* 同居フラグ */}
                <div className="flex items-center md:col-span-3">
                  <label className="flex items-center gap-2 text-sm font-medium">
                    <input
                      type="checkbox"
                      checked={member.livingTogether || false}
                      onChange={(e) =>
                        updateMember(index, "livingTogether", e.target.checked)
                      }
                      className="rounded"
                    />
                    同居している
                  </label>
                </div>

                {/* 備考 */}
                <div className="md:col-span-3">
                  <label className="mb-1 block text-xs font-medium text-gray-700">
                    備考（任意）
                  </label>
                  <input
                    type="text"
                    value={member.notes || ""}
                    onChange={(e) =>
                      updateMember(index, "notes", e.target.value)
                    }
                    className="w-full rounded border px-3 py-2 text-sm"
                    placeholder="例: キーパーソン、主介護者 等"
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
