"use client";

import { useState } from "react";

// MEAL（食事）カテゴリの型定義
export interface MealContent {
  mealType: "breakfast" | "lunch" | "dinner" | "snack";
  intakeAmount: "all" | "most" | "half" | "little" | "none";
  foodTexture: "normal" | "soft" | "minced" | "pureed" | "liquid";
  assistanceLevel: "independent" | "verbal" | "partial" | "full";
  duration?: number; // 分
  leftoverReason?: string;
}

interface MealFormProps {
  value: MealContent;
  onChange: (value: MealContent) => void;
  disabled?: boolean;
}

export function MealForm({ value, onChange, disabled = false }: MealFormProps) {
  const handleChange = (field: keyof MealContent, fieldValue: any) => {
    onChange({
      ...value,
      [field]: fieldValue,
    });
  };

  return (
    <div className="space-y-6">
      {/* 食事種別 */}
      <div>
        <label className="block text-sm font-medium mb-2">
          食事種別 <span className="text-red-500">*</span>
        </label>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
          {[
            { value: "breakfast", label: "朝食" },
            { value: "lunch", label: "昼食" },
            { value: "dinner", label: "夕食" },
            { value: "snack", label: "おやつ" },
          ].map((option) => (
            <button
              key={option.value}
              type="button"
              disabled={disabled}
              onClick={() => handleChange("mealType", option.value)}
              className={`px-4 py-2 rounded-md border transition-colors ${
                value.mealType === option.value
                  ? "bg-blue-500 text-white border-blue-500"
                  : "bg-white border-gray-300 hover:bg-gray-50"
              } ${disabled ? "opacity-50 cursor-not-allowed" : ""}`}
            >
              {option.label}
            </button>
          ))}
        </div>
      </div>

      {/* 摂取量 */}
      <div>
        <label className="block text-sm font-medium mb-2">
          摂取量 <span className="text-red-500">*</span>
        </label>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
          {[
            { value: "all", label: "全量" },
            { value: "most", label: "ほとんど" },
            { value: "half", label: "半量" },
            { value: "little", label: "少量" },
            { value: "none", label: "なし" },
          ].map((option) => (
            <button
              key={option.value}
              type="button"
              disabled={disabled}
              onClick={() => handleChange("intakeAmount", option.value)}
              className={`px-4 py-2 rounded-md border transition-colors ${
                value.intakeAmount === option.value
                  ? "bg-blue-500 text-white border-blue-500"
                  : "bg-white border-gray-300 hover:bg-gray-50"
              } ${disabled ? "opacity-50 cursor-not-allowed" : ""}`}
            >
              {option.label}
            </button>
          ))}
        </div>
      </div>

      {/* 食事形態 */}
      <div>
        <label className="block text-sm font-medium mb-2">
          食事形態 <span className="text-red-500">*</span>
        </label>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
          {[
            { value: "normal", label: "普通食" },
            { value: "soft", label: "軟菜食" },
            { value: "minced", label: "きざみ食" },
            { value: "pureed", label: "ペースト食" },
            { value: "liquid", label: "流動食" },
          ].map((option) => (
            <button
              key={option.value}
              type="button"
              disabled={disabled}
              onClick={() => handleChange("foodTexture", option.value)}
              className={`px-4 py-2 rounded-md border transition-colors ${
                value.foodTexture === option.value
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
        <label htmlFor="duration" className="block text-sm font-medium mb-2">
          所要時間（分）
        </label>
        <input
          id="duration"
          type="number"
          min="0"
          max="180"
          value={value.duration || ""}
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

      {/* 残食理由 */}
      {value.intakeAmount !== "all" && (
        <div>
          <label
            htmlFor="leftoverReason"
            className="block text-sm font-medium mb-2"
          >
            残食理由
          </label>
          <textarea
            id="leftoverReason"
            rows={3}
            value={value.leftoverReason || ""}
            onChange={(e) => handleChange("leftoverReason", e.target.value)}
            disabled={disabled}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="例: 味付けが苦手、体調不良など"
          />
        </div>
      )}
    </div>
  );
}

// デフォルト値を生成するヘルパー関数
export function createDefaultMealContent(): MealContent {
  return {
    mealType: "lunch",
    intakeAmount: "all",
    foodTexture: "normal",
    assistanceLevel: "independent",
  };
}
