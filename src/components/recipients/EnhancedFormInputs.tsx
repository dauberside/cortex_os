import { forwardRef } from "react";

/**
 * 電話番号入力フィールド（自動フォーマット）
 */
export const PhoneInput = forwardRef<
  HTMLInputElement,
  React.InputHTMLAttributes<HTMLInputElement> & { hasError?: boolean }
>(({ hasError, onChange, ...props }, ref) => {
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let value = e.target.value.replace(/[^\d]/g, ""); // 数字のみ抽出

    // 自動フォーマット: 090-1234-5678
    if (value.length > 6) {
      value = `${value.slice(0, 3)}-${value.slice(3, 7)}-${value.slice(7, 11)}`;
    } else if (value.length > 3) {
      value = `${value.slice(0, 3)}-${value.slice(3)}`;
    }

    e.target.value = value;
    if (onChange) onChange(e);
  };

  return (
    <input
      ref={ref}
      type="tel"
      onChange={handleChange}
      className={`w-full rounded-md border px-3 py-2 ${hasError ? "border-red-500" : ""}`}
      placeholder="090-1234-5678"
      maxLength={13}
      {...props}
    />
  );
});

PhoneInput.displayName = "PhoneInput";

/**
 * カナ入力フィールド（自動変換）
 */
export const KanaInput = forwardRef<
  HTMLInputElement,
  React.InputHTMLAttributes<HTMLInputElement> & { hasError?: boolean }
>(({ hasError, onChange, ...props }, ref) => {
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    // ひらがなをカタカナに自動変換
    const value = e.target.value.replace(/[\u3041-\u3096]/g, (match) => {
      const chr = match.charCodeAt(0) + 0x60;
      return String.fromCharCode(chr);
    });

    e.target.value = value;
    if (onChange) onChange(e);
  };

  return (
    <input
      ref={ref}
      type="text"
      onChange={handleChange}
      className={`w-full rounded-md border px-3 py-2 ${hasError ? "border-red-500" : ""}`}
      placeholder="ヤマダ タロウ"
      {...props}
    />
  );
});

KanaInput.displayName = "KanaInput";

/**
 * プログレスインジケーター
 */
export function FormProgress({
  total,
  completed,
}: {
  total: number;
  completed: number;
}) {
  const percentage = Math.round((completed / total) * 100);

  return (
    <div className="sticky top-4 z-10 mb-6 rounded-lg border bg-white p-4 shadow-sm">
      <div className="mb-2 flex items-center justify-between">
        <span className="text-sm font-medium">入力進捗</span>
        <span className="text-sm text-gray-600">
          {completed} / {total} 項目（{percentage}%）
        </span>
      </div>
      <div className="h-2 w-full overflow-hidden rounded-full bg-gray-200">
        <div
          className="h-full bg-blue-600 transition-all duration-300"
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
}

/**
 * セクション完了インジケーター
 */
export function SectionStatus({
  isComplete,
  requiredCount,
  filledCount,
}: {
  isComplete: boolean;
  requiredCount?: number;
  filledCount?: number;
}) {
  if (requiredCount === undefined || filledCount === undefined) {
    return null;
  }

  return (
    <div className="flex items-center gap-2">
      {isComplete ? (
        <span className="flex items-center gap-1 rounded-full bg-green-100 px-2 py-0.5 text-xs font-medium text-green-800">
          <svg
            className="h-3 w-3"
            fill="currentColor"
            viewBox="0 0 20 20"
          >
            <path
              fillRule="evenodd"
              d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
              clipRule="evenodd"
            />
          </svg>
          完了
        </span>
      ) : (
        <span className="rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-800">
          {filledCount}/{requiredCount}
        </span>
      )}
    </div>
  );
}
