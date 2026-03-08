"use client";

import { useState, useRef, useEffect } from "react";
import Image from "next/image";

interface ImageUploadProps {
  currentImageUrl?: string;
  onImageUrlChange: (url: string) => void;
  disabled?: boolean;
}

export function ImageUpload({
  currentImageUrl,
  onImageUrlChange,
  disabled = false,
}: ImageUploadProps) {
  const [previewUrl, setPreviewUrl] = useState<string | null>(
    currentImageUrl || null
  );
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Sync previewUrl with currentImageUrl when it changes (form data loads)
  useEffect(() => {
    setPreviewUrl(currentImageUrl || null);
  }, [currentImageUrl]);

  const handleFileChange = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // ファイルサイズチェック (5MB)
    const maxSize = 5 * 1024 * 1024; // 5MB in bytes
    if (file.size > maxSize) {
      setError("ファイルサイズは5MB以下にしてください");
      return;
    }

    // ファイルタイプチェック
    if (!file.type.startsWith("image/")) {
      setError("画像ファイル（JPG、PNG、WebP）のみアップロード可能です");
      return;
    }

    setError(null);

    // プレビュー表示
    const reader = new FileReader();
    reader.onload = (e) => {
      setPreviewUrl(e.target?.result as string);
    };
    reader.readAsDataURL(file);

    // Cloudinaryにアップロード
    try {
      setIsUploading(true);

      const formData = new FormData();
      formData.append("file", file);

      const response = await fetch("/api/upload-image", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "アップロードに失敗しました");
      }

      const data = await response.json();
      onImageUrlChange(data.url);
    } catch (err) {
      console.error("Upload error:", err);
      setError(
        err instanceof Error ? err.message : "アップロードに失敗しました"
      );
      setPreviewUrl(currentImageUrl || null);
    } finally {
      setIsUploading(false);
    }
  };

  const handleRemove = () => {
    setPreviewUrl(null);
    onImageUrlChange("");
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  return (
    <div className="space-y-4">
      <div>
        <label className="mb-3 block text-sm font-semibold text-gray-700">
          利用者写真
        </label>

        <div className="rounded-xl border-2 border-dashed border-gray-300 bg-gray-50/50 p-6">
          {/* プレビュー */}
          {previewUrl ? (
            <div className="flex flex-col items-center gap-4">
              <div className="relative">
                <div className="relative h-48 w-48 overflow-hidden rounded-2xl border-4 border-white shadow-xl ring-2 ring-gray-200">
                  <Image
                    src={previewUrl}
                    alt="利用者写真"
                    fill
                    className="object-cover"
                  />
                </div>
                {!disabled && (
                  <button
                    type="button"
                    onClick={handleRemove}
                    className="absolute -top-3 -right-3 rounded-full bg-red-500 p-2 text-white shadow-lg transition-all hover:scale-110 hover:bg-red-600"
                    disabled={isUploading}
                    title="写真を削除"
                  >
                    <svg
                      className="h-5 w-5"
                      fill="none"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                )}
              </div>
              <p className="text-sm font-medium text-gray-600">
                写真が登録されています
              </p>
            </div>
          ) : (
            /* アップロードボタン */
            <div className="flex flex-col items-center gap-4 py-8">
              <div className="rounded-full bg-blue-100 p-4">
                <svg
                  className="h-12 w-12 text-blue-600"
                  fill="none"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
              <div className="text-center">
                <label
                  htmlFor="photo-upload"
                  className={`inline-flex cursor-pointer items-center gap-2 rounded-lg bg-blue-600 px-6 py-3 text-sm font-semibold text-white shadow-lg transition-all hover:bg-blue-700 hover:shadow-xl ${disabled || isUploading ? "cursor-not-allowed opacity-50" : ""}`}
                >
                  <svg
                    className="h-5 w-5"
                    fill="none"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                  </svg>
                  {isUploading ? "アップロード中..." : "写真を選択"}
                </label>
                <input
                  ref={fileInputRef}
                  id="photo-upload"
                  type="file"
                  accept="image/*"
                  onChange={handleFileChange}
                  disabled={disabled || isUploading}
                  className="hidden"
                />
                <p className="mt-3 text-xs text-gray-500">
                  JPG、PNG、WebP（最大5MB）
                </p>
              </div>
            </div>
          )}

          {/* ローディング */}
          {isUploading && (
            <div className="mt-4 flex items-center justify-center gap-2 rounded-lg bg-blue-50 p-4 text-sm font-medium text-blue-700">
              <svg
                className="h-5 w-5 animate-spin"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                />
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                />
              </svg>
              アップロード中...
            </div>
          )}

          {/* エラーメッセージ */}
          {error && (
            <div className="mt-4 flex items-center gap-3 rounded-lg border border-red-300 bg-red-50 p-4 text-sm font-medium text-red-800">
              <svg
                className="h-5 w-5 flex-shrink-0"
                fill="none"
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              {error}
            </div>
          )}
        </div>

        <p className="mt-3 text-xs text-gray-600">
          💡
          利用者の顔写真をアップロードしてください。本人確認やコミュニケーションに使用されます。
        </p>
      </div>
    </div>
  );
}
