"use client";

// EXCRETION（排泄）カテゴリの型定義
export interface ExcretionContent {
  type: "urination" | "defecation" | "both";
  method: "toilet" | "portable_toilet" | "diaper" | "urinal";
  assistanceLevel: "independent" | "verbal" | "partial" | "full";
  amount: "large" | "medium" | "small";
  condition: "normal" | "diarrhea" | "constipation" | "other";
  time?: string; // HH:mm
}

interface ExcretionFormProps {
  value: ExcretionContent;
  onChange: (value: ExcretionContent) => void;
  disabled?: boolean;
}

export function ExcretionForm({
  value,
  onChange,
  disabled = false,
}: ExcretionFormProps) {
  const handleChange = (field: keyof ExcretionContent, fieldValue: unknown) => {
    onChange({ ...value, [field]: fieldValue });
  };

  return (
    <div className="space-y-6">
      {/* 排泄種別 */}
      <div>
        <label className="block text-sm font-medium mb-2">
          排泄種別 <span className="text-red-500">*</span>
        </label>
        <div className="grid grid-cols-3 gap-2">
          {[
            { value: "urination", label: "排尿" },
            { value: "defecation", label: "排便" },
            { value: "both", label: "両方" },
          ].map((option) => (
            <button
              key={option.value}
              type="button"
              disabled={disabled}
              onClick={() => handleChange("type", option.value)}
              className={`px-4 py-2 rounded-md border transition-colors ${
                value.type === option.value
                  ? "bg-blue-500 text-white border-blue-500"
                  : "bg-white border-gray-300 hover:bg-gray-50"
              } ${disabled ? "opacity-50 cursor-not-allowed" : ""}`}
            >
              {option.label}
            </button>
          ))}
        </div>
      </div>

      {/* 排泄方法 */}
      <div>
        <label className="block text-sm font-medium mb-2">
          排泄方法 <span className="text-red-500">*</span>
        </label>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
          {[
            { value: "toilet", label: "トイレ" },
            { value: "portable_toilet", label: "ポータブルトイレ" },
            { value: "diaper", label: "おむつ" },
            { value: "urinal", label: "尿器" },
          ].map((option) => (
            <button
              key={option.value}
              type="button"
              disabled={disabled}
              onClick={() => handleChange("method", option.value)}
              className={`px-4 py-2 rounded-md border transition-colors ${
                value.method === option.value
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

      {/* 量 */}
      <div>
        <label className="block text-sm font-medium mb-2">
          量 <span className="text-red-500">*</span>
        </label>
        <div className="grid grid-cols-3 gap-2">
          {[
            { value: "large", label: "多量" },
            { value: "medium", label: "中量" },
            { value: "small", label: "少量" },
          ].map((option) => (
            <button
              key={option.value}
              type="button"
              disabled={disabled}
              onClick={() => handleChange("amount", option.value)}
              className={`px-4 py-2 rounded-md border transition-colors ${
                value.amount === option.value
                  ? "bg-blue-500 text-white border-blue-500"
                  : "bg-white border-gray-300 hover:bg-gray-50"
              } ${disabled ? "opacity-50 cursor-not-allowed" : ""}`}
            >
              {option.label}
            </button>
          ))}
        </div>
      </div>

      {/* 状態 */}
      <div>
        <label className="block text-sm font-medium mb-2">
          状態 <span className="text-red-500">*</span>
        </label>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
          {[
            { value: "normal", label: "正常" },
            { value: "diarrhea", label: "下痢" },
            { value: "constipation", label: "便秘" },
            { value: "other", label: "その他" },
          ].map((option) => (
            <button
              key={option.value}
              type="button"
              disabled={disabled}
              onClick={() => handleChange("condition", option.value)}
              className={`px-4 py-2 rounded-md border transition-colors ${
                value.condition === option.value
                  ? "bg-blue-500 text-white border-blue-500"
                  : "bg-white border-gray-300 hover:bg-gray-50"
              } ${disabled ? "opacity-50 cursor-not-allowed" : ""}`}
            >
              {option.label}
            </button>
          ))}
        </div>
      </div>

      {/* 時刻 */}
      <div>
        <label htmlFor="excretion-time" className="block text-sm font-medium mb-2">
          時刻
        </label>
        <input
          id="excretion-time"
          type="time"
          value={value.time ?? ""}
          onChange={(e) => handleChange("time", e.target.value || undefined)}
          disabled={disabled}
          className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>
    </div>
  );
}

export function createDefaultExcretionContent(): ExcretionContent {
  return {
    type: "urination",
    method: "toilet",
    assistanceLevel: "independent",
    amount: "medium",
    condition: "normal",
  };
}
