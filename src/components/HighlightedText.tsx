import { highlightText, extractContext } from "@/lib/searchHighlight";

interface HighlightedTextProps {
  text: string;
  query: string;
  className?: string;
  maxLength?: number;
  showContext?: boolean;
}

export function HighlightedText({
  text,
  query,
  className = "",
  maxLength,
  showContext = false,
}: HighlightedTextProps) {
  const displayText = showContext
    ? extractContext(text, query, maxLength || 100)
    : maxLength
      ? text.substring(0, maxLength) + (text.length > maxLength ? "..." : "")
      : text;

  const parts = highlightText(displayText, query);

  return (
    <span className={className}>
      {parts.map((part, index) =>
        part.isHighlight ? (
          <mark
            key={index}
            className="bg-yellow-200 font-semibold text-gray-900"
          >
            {part.text}
          </mark>
        ) : (
          <span key={index}>{part.text}</span>
        )
      )}
    </span>
  );
}
