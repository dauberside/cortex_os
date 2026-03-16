"use client";

// MOBILITY（移動・外出）カテゴリの型定義
export interface MobilityContent {
  activityType: "indoor" | "outdoor" | "outing";
  destination?: string;
  purpose?: string;
  assistanceLevel: "independent" | "verbal" | "partial" | "full";
  mobilityAid?: string;
  duration?: number; // 分
}

interface MobilityFormProps {
  value: MobilityContent;
  onChange: (value: MobilityContent) => void;
  disabled?: boolean;
}

export function MobilityForm({
  value,
  onChange,
  disabled = false,
}: MobilityFormProps) {
  const handleChange = (field: keyof MobilityContent, fieldValue: unknown) => {
    onChange({ ...value, [field]: fieldValue });
  };

  return (
    <div className="space-y-6">
      {/* 活動種別 */}
      <div>
        <label className="block text-sm font-medium mb-2">
          活動種別 <span className="text-red-500">*</span>
        </label>
        <div className="grid grid-cols-3 gap-2">
          {[
            { value: "indoor", label: "屋内移動" },
            { value: "outdoor", label: "屋外移動" },
            { value: "outing", label: "外出支援" },
          ].map((option) => (
            <button
              key={option.value}
              type="button"
              disabled={disabled}
              onClick={() => handleChange("activityType", option.value)}
              className={`px-4 py-2 rounded-md border transition-colors ${
                value.activityType === option.value
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

      {/* 行き先 */}
      {(value.activityType === "outdoor" || value.activityType === "outing") && (
        <div>
          <label htmlFor="destination" className="block text-sm font-medium mb-2">
            行き先・場所
          </label>
          <input
            id="destination"
            type="text"
            value={value.destination ?? ""}
            onChange={(e) =>
              handleChange("destination", e.target.value || undefined)
            }
            disabled={disabled}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="例: 公園、スーパーなど"
          />
        </div>
      )}

      {/* 目的 */}
      <div>
        <label htmlFor="purpose" className="block text-sm font-medium mb-2">
          目的・内容
        </label>
        <input
          id="purpose"
          type="text"
          value={value.purpose ?? ""}
          onChange={(e) =>
            handleChange("purpose", e.target.value || undefined)
          }
          disabled={disabled}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="例: 散歩、買い物、通院など"
        />
      </div>

      {/* 移動補助具 */}
      <div>
        <label htmlFor="mobility-aid" className="block text-sm font-medium mb-2">
          移動補助具
        </label>
        <input
          id="mobility-aid"
          type="text"
          value={value.mobilityAid ?? ""}
          onChange={(e) =>
            handleChange("mobilityAid", e.target.value || undefined)
          }
          disabled={disabled}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="例: 車椅子、歩行器など"
        />
      </div>

      {/* 所要時間 */}
      <div>
        <label htmlFor="mobility-duration" className="block text-sm font-medium mb-2">
          所要時間（分）
        </label>
        <input
          id="mobility-duration"
          type="number"
          min="0"
          max="480"
          value={value.duration ?? ""}
          onChange={(e) =>
            handleChange(
              "duration",
              e.target.value ? parseInt(e.target.value) : undefined
            )
          }
          disabled={disabled}
          className="w-full md:w-48 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="例: 60"
        />
      </div>
    </div>
  );
}

export function createDefaultMobilityContent(): MobilityContent {
  return {
    activityType: "indoor",
    assistanceLevel: "verbal",
  };
}
