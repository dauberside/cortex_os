export interface HighlightedText {
  text: string;
  isHighlight: boolean;
}

/**
 * テキスト内の検索クエリをハイライト用に分割する
 * @param text ハイライト対象のテキスト
 * @param query 検索クエリ
 * @returns ハイライト情報付きのテキスト配列
 */
export function highlightText(text: string, query: string): HighlightedText[] {
  if (!query || query.trim() === "") {
    return [{ text, isHighlight: false }];
  }

  const searchTerm = query.trim();
  const regex = new RegExp(`(${escapeRegExp(searchTerm)})`, "gi");
  const parts = text.split(regex);

  return parts.map((part) => ({
    text: part,
    isHighlight: regex.test(part),
  }));
}

/**
 * 正規表現の特殊文字をエスケープする
 */
function escapeRegExp(string: string): string {
  return string.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/**
 * 検索クエリ周辺のコンテキストを抽出する
 * @param text 全文
 * @param query 検索クエリ
 * @param contextLength 前後の文字数
 * @returns コンテキスト付きのテキスト
 */
export function extractContext(
  text: string,
  query: string,
  contextLength: number = 100
): string {
  if (!query || query.trim() === "") {
    return text.substring(0, 200);
  }

  const searchTerm = query.trim().toLowerCase();
  const lowerText = text.toLowerCase();
  const index = lowerText.indexOf(searchTerm);

  if (index === -1) {
    return text.substring(0, 200);
  }

  const start = Math.max(0, index - contextLength);
  const end = Math.min(text.length, index + searchTerm.length + contextLength);

  let excerpt = text.substring(start, end);

  if (start > 0) {
    excerpt = "..." + excerpt;
  }
  if (end < text.length) {
    excerpt = excerpt + "...";
  }

  return excerpt;
}
