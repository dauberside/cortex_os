"use client";

// BATH（入浴）カテゴリの型定義
export interface BathContent {
  bathType: "general" | "mechanical" | "shower" | "partial";
  assistanceLevel: "independent" | "verbal" | "partial" | "full";
  duration?: number; // 分
  waterTemperature?: number; // ℃
  skinCondition?: string;
}

interface BathFormProps {
  value: BathContent;
  onChange: (value: BathContent) => void;
  disabled?: boolean;
}

export function BathForm({ value, onChange, disabled = false }: BathFormProps) {
  const handleChange = (field: keyof BathContent, fieldValue: unknown) => {
    onChange({ ...value, [field]: fieldValue });
  };

  return (
    <div className="space-y-6">
      {/* 入浴方法 */}
      <div>
        <label className="block text-sm font-medium mb-2">
          入浴方法 <span className="text-red-500">*</span>
        </label>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
          {[
            { value: "general", label: "一般浴" },
            { value: "mechanical", label: "機械浴" },
            { value: "shower", label: "シャワー浴" },
            { value: "partial", label: "部分浴" },
          ].map((option) => (
            <button
              key={option.value}
              type="button"
              disabled={disabled}
              onClick={() => handleChange("bathType", option.value)}
              className={`px-4 py-2 rounded-md border transition-colors ${
                value.bathType === option.value
                  ? "bg-blue-500 text-white border-blue-500"
                  : "bg-white border-gray-300 hover:bg-gray-50"
              } ${disabled ? "opacity-50 cursor-not-allowed" : ""}`}
            >
              {option.label}
            </button>
          ))}
        </div>
      </div>

      {/* 介助レベル */}
      <div>
        <label className="block text-sm font-medium mb-2">
          介助レベル <span className="text-red-500">*</span>
        </label>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
          {[
            { value: "independent", label: "自立" },
            { value: "verbal", label: "声かけ" },
            { value: "partial", label: "一部介助" },
            { value: "full", label: "全介助" },
          ].map((option) => (
            <button
              key={option.value}
              type="button"
              disabled={disabled}
              onClick={() => handleChange("assistanceLevel", option.value)}
              className={`px-4 py-2 rounded-md border transition-colors ${
                value.assistanceLevel === option.value
                  ? "bg-blue-500 text-white border-blue-500"
                  : "bg-white border-gray-300 hover:bg-gray-50"
              } ${disabled ? "opacity-50 cursor-not-allowed" : ""}`}
            >
              {option.label}
            </button>
          ))}
        </div>
      </div>

      {/* 所要時間 */}
      <div>
        <label htmlFor="bath-duration" className="block text-sm font-medium mb-2">
          所要時間（分）
        </label>
        <input
          id="bath-duration"
          type="number"
          min="0"
          max="120"
          value={value.duration ?? ""}
          onChange={(e) =>
            handleChange(
              "duration",
              e.target.value ? parseInt(e.target.value) : undefined
            )
          }
          disabled={disabled}
          className="w-full md:w-48 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="例: 30"
        />
      </div>

      {/* 湯温 */}
      <div>
        <label htmlFor="water-temp" className="block text-sm font-medium mb-2">
          湯温（℃）
        </label>
        <input
          id="water-temp"
          type="number"
          min="30"
          max="45"
          step="0.5"
          value={value.waterTemperature ?? ""}
          onChange={(e) =>
            handleChange(
              "waterTemperature",
              e.target.value ? parseFloat(e.target.value) : undefined
            )
          }
          disabled={disabled}
          className="w-full md:w-48 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="例: 39"
        />
      </div>

      {/* 皮膚状態 */}
      <div>
        <label htmlFor="skin-condition" className="block text-sm font-medium mb-2">
          皮膚状態
        </label>
        <textarea
          id="skin-condition"
          rows={3}
          value={value.skinCondition ?? ""}
          onChange={(e) =>
            handleChange("skinCondition", e.target.value || undefined)
          }
          disabled={disabled}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="例: 発赤なし、乾燥気味など"
        />
      </div>
    </div>
  );
}

export function createDefaultBathContent(): BathContent {
  return {
    bathType: "general",
    assistanceLevel: "partial",
  };
}
