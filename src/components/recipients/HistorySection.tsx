import React from "react";
import { UseFormRegister } from "react-hook-form";
import { RecipientFormData } from "@/lib/validations/recipientSchema";

interface HistorySectionProps {
  register: UseFormRegister<RecipientFormData>;
}

export function HistorySection({
  register,
}: HistorySectionProps) {

  return (
    <div className="space-y-6">
      {/* 生活歴 */}
      <div className="space-y-4">
        <div>
          <h3 className="text-lg font-semibold">生活歴</h3>
          <p className="text-muted-foreground text-sm">
            これまでの生活の経緯を記録してください（幼少期・学齢期・成人期・居住歴など）
          </p>
        </div>

        <div className="space-y-2">
          <label className="block text-sm font-medium">
            主な生活歴
          </label>
          <textarea
            {...register("lifeHistory")}
            className="w-full rounded border px-3 py-2 text-sm"
            rows={8}
            placeholder="例:&#10;・○○保育園入園&#10;・△△小学校（特別支援学級）卒業&#10;・□□特別支援学校中等部・高等部卒業&#10;・20XX年 生活介護施設通所開始&#10;・20XX年 グループホーム入居"
          />
        </div>
      </div>

      {/* 通院情報 */}
      <div className="space-y-4">
        <div>
          <h3 className="text-lg font-semibold">通院情報</h3>
          <p className="text-muted-foreground text-sm">
            医療機関名・受診科・通院頻度などを記録してください
          </p>
        </div>

        <div className="space-y-2">
          <label className="block text-sm font-medium">
            通院先・受診科・頻度
          </label>
          <textarea
            {...register("hospitalVisits")}
            className="w-full rounded border px-3 py-2 text-sm"
            rows={5}
            placeholder="例:&#10;・○○クリニック（内科）- 月1回&#10;・△△病院（精神科）- 2ヶ月に1回&#10;・□□歯科 - 半年に1回"
          />
        </div>
      </div>
    </div>
  );
}
