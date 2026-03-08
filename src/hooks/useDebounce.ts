import { useEffect, useState } from "react";

/**
 * Debounceフック - 値の変更を遅延させる
 * @param value - 監視する値
 * @param delay - 遅延時間（ミリ秒）
 * @returns debounceされた値
 */
export function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
}
