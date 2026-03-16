"use client";

// HEALTH（健康状態）カテゴリの型定義
export interface HealthContent {
  vitalSigns?: {
    bodyTemperature?: number;
    bloodPressureSystolic?: number;
    bloodPressureDiastolic?: number;
    pulse?: number;
    spO2?: number;
  };
  symptoms?: string[];
  painLevel?: number; // 0-10
  painLocation?: string;
  consciousness: "clear" | "drowsy" | "confused" | "unconscious";
}

interface HealthFormProps {
  value: HealthContent;
  onChange: (value: HealthContent) => void;
  disabled?: boolean;
}

const COMMON_SYMPTOMS = [
  "発熱",
  "咳",
  "鼻水",
  "嘔吐",
  "下痢",
  "腹痛",
  "頭痛",
  "倦怠感",
  "食欲不振",
  "むくみ",
];

export function HealthForm({
  value,
  onChange,
  disabled = false,
}: HealthFormProps) {
  const handleChange = (field: keyof HealthContent, fieldValue: unknown) => {
    onChange({ ...value, [field]: fieldValue });
  };

  const handleVitalChange = (
    field: keyof NonNullable<HealthContent["vitalSigns"]>,
    fieldValue: number | undefined
  ) => {
    onChange({
      ...value,
      vitalSigns: {
        ...value.vitalSigns,
        [field]: fieldValue,
      },
    });
  };

  const toggleSymptom = (symptom: string) => {
    const current = value.symptoms ?? [];
    const updated = current.includes(symptom)
      ? current.filter((s) => s !== symptom)
      : [...current, symptom];
    handleChange("symptoms", updated.length > 0 ? updated : undefined);
  };

  const vitals = value.vitalSigns ?? {};

  return (
    <div className="space-y-6">
      {/* 意識状態 */}
      <div>
        <label className="block text-sm font-medium mb-2">
          意識状態 <span className="text-red-500">*</span>
        </label>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
          {[
            { value: "clear", label: "清明" },
            { value: "drowsy", label: "傾眠" },
            { value: "confused", label: "混濁" },
            { value: "unconscious", label: "昏睡" },
          ].map((option) => (
            <button
              key={option.value}
              type="button"
              disabled={disabled}
              onClick={() => handleChange("consciousness", option.value)}
              className={`px-4 py-2 rounded-md border transition-colors ${
                value.consciousness === option.value
                  ? "bg-blue-500 text-white border-blue-500"
                  : "bg-white border-gray-300 hover:bg-gray-50"
              } ${disabled ? "opacity-50 cursor-not-allowed" : ""}`}
            >
              {option.label}
            </button>
          ))}
        </div>
      </div>

      {/* バイタルサイン */}
      <div>
        <label className="block text-sm font-medium mb-3">バイタルサイン</label>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label htmlFor="body-temp" className="block text-xs text-gray-500 mb-1">
              体温（℃）
            </label>
            <input
              id="body-temp"
              type="number"
              min="34"
              max="42"
              step="0.1"
              value={vitals.bodyTemperature ?? ""}
              onChange={(e) =>
                handleVitalChange(
                  "bodyTemperature",
                  e.target.value ? parseFloat(e.target.value) : undefined
                )
              }
              disabled={disabled}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="例: 36.5"
            />
          </div>
          <div>
            <label htmlFor="pulse" className="block text-xs text-gray-500 mb-1">
              脈拍（回/分）
            </label>
            <input
              id="pulse"
              type="number"
              min="30"
              max="200"
              value={vitals.pulse ?? ""}
              onChange={(e) =>
                handleVitalChange(
                  "pulse",
                  e.target.value ? parseInt(e.target.value) : undefined
                )
              }
              disabled={disabled}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="例: 72"
            />
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1">
              血圧（収縮期 / 拡張期 mmHg）
            </label>
            <div className="flex gap-2 items-center">
              <input
                type="number"
                min="60"
                max="250"
                value={vitals.bloodPressureSystolic ?? ""}
                onChange={(e) =>
                  handleVitalChange(
                    "bloodPressureSystolic",
                    e.target.value ? parseInt(e.target.value) : undefined
                  )
                }
                disabled={disabled}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="120"
              />
              <span className="text-gray-500">/</span>
              <input
                type="number"
                min="40"
                max="150"
                value={vitals.bloodPressureDiastolic ?? ""}
                onChange={(e) =>
                  handleVitalChange(
                    "bloodPressureDiastolic",
                    e.target.value ? parseInt(e.target.value) : undefined
                  )
                }
                disabled={disabled}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="80"
              />
            </div>
          </div>
          <div>
            <label htmlFor="spo2" className="block text-xs text-gray-500 mb-1">
              SpO2（%）
            </label>
            <input
              id="spo2"
              type="number"
              min="70"
              max="100"
              value={vitals.spO2 ?? ""}
              onChange={(e) =>
                handleVitalChange(
                  "spO2",
                  e.target.value ? parseInt(e.target.value) : undefined
                )
              }
              disabled={disabled}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="例: 98"
            />
          </div>
        </div>
      </div>

      {/* 症状 */}
      <div>
        <label className="block text-sm font-medium mb-2">症状</label>
        <div className="flex flex-wrap gap-2">
          {COMMON_SYMPTOMS.map((symptom) => (
            <button
              key={symptom}
              type="button"
              disabled={disabled}
              onClick={() => toggleSymptom(symptom)}
              className={`px-3 py-1 rounded-full border text-sm transition-colors ${
                value.symptoms?.includes(symptom)
                  ? "bg-red-500 text-white border-red-500"
                  : "bg-white border-gray-300 hover:bg-gray-50"
              } ${disabled ? "opacity-50 cursor-not-allowed" : ""}`}
            >
              {symptom}
            </button>
          ))}
        </div>
      </div>

      {/* 痛みレベル */}
      <div>
        <label className="block text-sm font-medium mb-2">
          痛みレベル（0: なし ～ 10: 最大）
        </label>
        <div className="flex gap-2 flex-wrap">
          {Array.from({ length: 11 }, (_, i) => (
            <button
              key={i}
              type="button"
              disabled={disabled}
              onClick={() =>
                handleChange("painLevel", i > 0 ? i : undefined)
              }
              className={`w-9 h-9 rounded-md border text-sm font-medium transition-colors ${
                value.painLevel === i || (i === 0 && value.painLevel === undefined)
                  ? i === 0
                    ? "bg-green-500 text-white border-green-500"
                    : i <= 3
                    ? "bg-yellow-400 text-white border-yellow-400"
                    : i <= 7
                    ? "bg-orange-500 text-white border-orange-500"
                    : "bg-red-600 text-white border-red-600"
                  : "bg-white border-gray-300 hover:bg-gray-50"
              } ${disabled ? "opacity-50 cursor-not-allowed" : ""}`}
            >
              {i}
            </button>
          ))}
        </div>

        {/* 痛みの部位 */}
        {value.painLevel !== undefined && value.painLevel > 0 && (
          <div className="mt-3">
            <label
              htmlFor="pain-location"
              className="block text-sm text-gray-600 mb-1"
            >
              痛みの部位
            </label>
            <input
              id="pain-location"
              type="text"
              value={value.painLocation ?? ""}
              onChange={(e) =>
                handleChange("painLocation", e.target.value || undefined)
              }
              disabled={disabled}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="例: 腰、膝、頭など"
            />
          </div>
        )}
      </div>
    </div>
  );
}

export function createDefaultHealthContent(): HealthContent {
  return {
    consciousness: "clear",
  };
}
