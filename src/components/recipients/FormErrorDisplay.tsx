import { useEffect } from "react";
import { FieldErrors } from "react-hook-form";

// フィールド名を日本語ラベルに変換
const fieldLabels: Record<string, string> = {
  name: "氏名",
  nameKana: "氏名（カナ）",
  birthDate: "生年月日",
  gender: "性別",
  emergencyContact: "緊急連絡先",
  emergencyRelation: "続柄",
  homePhone: "自宅電話番号",
  ghPhone: "GH電話番号",
  allergyNote: "アレルギー詳細",
  behaviorSupportNeeded: "行動援護が必要",
};

/**
 * フォーム全体のエラーサマリー表示コンポーネント
 */
export function FormErrorSummary({ errors }: { errors: FieldErrors }) {
  const errorEntries = Object.entries(errors);

  // エラーが発生したら最初のエラーフィールドまでスクロール
  useEffect(() => {
    if (errorEntries.length > 0) {
      const firstErrorField = errorEntries[0][0];
      const element = document.querySelector(`[name="${firstErrorField}"]`);
      if (element) {
        element.scrollIntoView({ behavior: "smooth", block: "center" });
      }
    }
  }, [errorEntries.length]);

  if (errorEntries.length === 0) return null;

  // エラーメッセージのリストを作成
  const errorMessages = errorEntries
    .map(([field, error]) => {
      if (!error || typeof error.message !== "string") return null;
      return { field, message: error.message };
    })
    .filter((item): item is { field: string; message: string } => item !== null);

  if (errorMessages.length === 0) return null;

  const scrollToField = (fieldName: string) => {
    const element = document.querySelector(`[name="${fieldName}"]`);
    if (element) {
      element.scrollIntoView({ behavior: "smooth", block: "center" });
      // フォーカスを当てる
      if (element instanceof HTMLElement) {
        setTimeout(() => element.focus(), 500);
      }
    }
  };

  return (
    <div className="mb-6 rounded-lg border-2 border-red-500 bg-red-50 p-4">
      <div className="mb-2 flex items-center gap-2">
        <svg
          className="h-5 w-5 text-red-600"
          fill="none"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="2"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        <h3 className="text-lg font-semibold text-red-800">
          入力エラーがあります（{errorMessages.length}件）
        </h3>
      </div>
      <p className="text-muted-foreground mb-3 ml-7 text-xs">
        項目をクリックすると該当箇所に移動します
      </p>
      <ul className="ml-7 list-none space-y-1">
        {errorMessages.map((item, index) => (
          <li key={index}>
            <button
              type="button"
              onClick={() => scrollToField(item.field)}
              className="text-left text-sm text-red-700 hover:text-red-900 hover:underline"
            >
              <span className="mr-2">•</span>
              <span className="font-medium">
                {fieldLabels[item.field] || item.field}:
              </span>{" "}
              {item.message}
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}

/**
 * 個別フィールドのエラーメッセージ表示コンポーネント
 */
export function FieldError({ message }: { message?: string }) {
  if (!message) return null;

  return (
    <p className="mt-1 flex items-center gap-1 text-sm text-red-600">
      <svg
        className="h-4 w-4"
        fill="none"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="2"
        viewBox="0 0 24 24"
        stroke="currentColor"
      >
        <path d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
      <span>{message}</span>
    </p>
  );
}
