import React from "react";
import {
  UseFormRegister,
  UseFormWatch,
  UseFormSetValue,
} from "react-hook-form";
import { RecipientFormData } from "@/lib/validations/recipientSchema";

interface ContactPolicySectionProps {
  register: UseFormRegister<RecipientFormData>;
  watch: UseFormWatch<RecipientFormData>;
  setValue: UseFormSetValue<RecipientFormData>;
}

export function ContactPolicySection({
  watch,
  setValue,
}: ContactPolicySectionProps) {
  const contactPolicy = (watch("contactPolicy") as any) || {};

  const updateContactPolicy = (field: string, value: string) => {
    setValue("contactPolicy", {
      ...contactPolicy,
      [field]: value,
    } as any);
  };

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold">連絡ルール</h3>
      <p className="text-muted-foreground text-sm">
        支援時の連絡方法・優先順位を設定してください
      </p>

      {/* 昼間の連絡先 */}
      <div className="space-y-2">
        <label className="block text-sm font-medium">昼間の連絡先・方法</label>
        <textarea
          value={contactPolicy.day || ""}
          onChange={(e) => updateContactPolicy("day", e.target.value)}
          className="w-full rounded border px-3 py-2 text-sm"
          rows={3}
          placeholder="例: 携帯電話 090-XXXX-XXXX → 自宅 03-XXXX-XXXX の順"
        />
      </div>

      {/* 夜間の連絡先 */}
      <div className="space-y-2">
        <label className="block text-sm font-medium">夜間の連絡先・方法</label>
        <textarea
          value={contactPolicy.night || ""}
          onChange={(e) => updateContactPolicy("night", e.target.value)}
          className="w-full rounded border px-3 py-2 text-sm"
          rows={3}
          placeholder="例: 18時以降は自宅固定電話を優先"
        />
      </div>

      {/* 緊急時の連絡順位 */}
      <div className="space-y-2">
        <label className="block text-sm font-medium">緊急時の連絡順位</label>
        <textarea
          value={contactPolicy.emergencyOrder || ""}
          onChange={(e) =>
            updateContactPolicy("emergencyOrder", e.target.value)
          }
          className="w-full rounded border border-red-300 bg-red-50 px-3 py-2 text-sm"
          rows={4}
          placeholder="例:&#10;1. 本人携帯&#10;2. 母（山田花子）090-XXXX-XXXX&#10;3. GH世話人 03-XXXX-XXXX"
        />
      </div>

      {/* 遅刻・キャンセル時の連絡先 */}
      <div className="space-y-2">
        <label className="block text-sm font-medium">
          遅刻・キャンセル時の連絡先
        </label>
        <textarea
          value={contactPolicy.lateCancel || ""}
          onChange={(e) => updateContactPolicy("lateCancel", e.target.value)}
          className="w-full rounded border px-3 py-2 text-sm"
          rows={2}
          placeholder="例: 前日17時までに事業所へ連絡"
        />
      </div>

      {/* 特記事項 */}
      <div className="space-y-2">
        <label className="block text-sm font-medium">
          連絡に関する特記事項
        </label>
        <textarea
          value={contactPolicy.notes || ""}
          onChange={(e) => updateContactPolicy("notes", e.target.value)}
          className="w-full rounded border px-3 py-2 text-sm"
          rows={3}
          placeholder="例: メールでの連絡は不可、必ず電話で確認"
        />
      </div>
    </div>
  );
}
