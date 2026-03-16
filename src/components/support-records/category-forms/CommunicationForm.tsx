"use client";

// COMMUNICATION（コミュニケーション）カテゴリの型定義
export interface CommunicationContent {
  communicationType: "verbal" | "gesture" | "writing" | "device" | "other";
  topic?: string;
  mood: "good" | "normal" | "anxious" | "irritated" | "depressed";
  responseQuality: "clear" | "unclear" | "difficult";
}

interface CommunicationFormProps {
  value: CommunicationContent;
  onChange: (value: CommunicationContent) => void;
  disabled?: boolean;
}

export function CommunicationForm({
  value,
  onChange,
  disabled = false,
}: CommunicationFormProps) {
  const handleChange = (
    field: keyof CommunicationContent,
    fieldValue: unknown
  ) => {
    onChange({ ...value, [field]: fieldValue });
  };

  return (
    <div className="space-y-6">
      {/* コミュニケーション方法 */}
      <div>
        <label className="block text-sm font-medium mb-2">
          コミュニケーション方法 <span className="text-red-500">*</span>
        </label>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
          {[
            { value: "verbal", label: "言語" },
            { value: "gesture", label: "ジェスチャー" },
            { value: "writing", label: "筆談・文字盤" },
            { value: "device", label: "意思疎通機器" },
            { value: "other", label: "その他" },
          ].map((option) => (
            <button
              key={option.value}
              type="button"
              disabled={disabled}
              onClick={() => handleChange("communicationType", option.value)}
              className={`px-4 py-2 rounded-md border transition-colors ${
                value.communicationType === option.value
                  ? "bg-blue-500 text-white border-blue-500"
                  : "bg-white border-gray-300 hover:bg-gray-50"
              } ${disabled ? "opacity-50 cursor-not-allowed" : ""}`}
            >
              {option.label}
            </button>
          ))}
        </div>
      </div>

      {/* 気分・様子 */}
      <div>
        <label className="block text-sm font-medium mb-2">
          気分・様子 <span className="text-red-500">*</span>
        </label>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
          {[
            { value: "good", label: "良い" },
            { value: "normal", label: "普通" },
            { value: "anxious", label: "不安" },
            { value: "irritated", label: "興奮気味" },
            { value: "depressed", label: "落ち込み" },
          ].map((option) => (
            <button
              key={option.value}
              type="button"
              disabled={disabled}
              onClick={() => handleChange("mood", option.value)}
              className={`px-4 py-2 rounded-md border transition-colors ${
                value.mood === option.value
                  ? "bg-blue-500 text-white border-blue-500"
                  : "bg-white border-gray-300 hover:bg-gray-50"
              } ${disabled ? "opacity-50 cursor-not-allowed" : ""}`}
            >
              {option.label}
            </button>
          ))}
        </div>
      </div>

      {/* 意思疎通の質 */}
      <div>
        <label className="block text-sm font-medium mb-2">
          意思疎通の質 <span className="text-red-500">*</span>
        </label>
        <div className="grid grid-cols-3 gap-2">
          {[
            { value: "clear", label: "良好" },
            { value: "unclear", label: "不明確" },
            { value: "difficult", label: "困難" },
          ].map((option) => (
            <button
              key={option.value}
              type="button"
              disabled={disabled}
              onClick={() => handleChange("responseQuality", option.value)}
              className={`px-4 py-2 rounded-md border transition-colors ${
                value.responseQuality === option.value
                  ? "bg-blue-500 text-white border-blue-500"
                  : "bg-white border-gray-300 hover:bg-gray-50"
              } ${disabled ? "opacity-50 cursor-not-allowed" : ""}`}
            >
              {option.label}
            </button>
          ))}
        </div>
      </div>

      {/* 話題・内容 */}
      <div>
        <label htmlFor="comm-topic" className="block text-sm font-medium mb-2">
          話題・内容
        </label>
        <textarea
          id="comm-topic"
          rows={3}
          value={value.topic ?? ""}
          onChange={(e) =>
            handleChange("topic", e.target.value || undefined)
          }
          disabled={disabled}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="例: 今日の活動について話した、好きな食べ物の話など"
        />
      </div>
    </div>
  );
}

export function createDefaultCommunicationContent(): CommunicationContent {
  return {
    communicationType: "verbal",
    mood: "normal",
    responseQuality: "clear",
  };
}
