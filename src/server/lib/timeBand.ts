// 時間帯計算ヘルパー関数
export type TimeBandResult = {
  timeBand: "DAYTIME" | "EARLY_LATE" | "CROSSES_BANDS";
  ruleVersion: string | null;
};

export async function calculateTimeBand(
  db: any,
  startTime: Date,
  endTime: Date
): Promise<TimeBandResult> {
  // 有効な TimeBandRule を取得
  const activeRule = await db.timeBandRule.findFirst({
    where: {
      isActive: true,
      effectiveFrom: { lte: startTime },
      OR: [{ effectiveTo: null }, { effectiveTo: { gte: startTime } }],
    },
    orderBy: { effectiveFrom: "desc" },
  });

  // ルールが存在しない場合は DAYTIME とみなす（デフォルト）
  if (!activeRule) {
    return { timeBand: "DAYTIME", ruleVersion: null };
  }

  const timeBands = activeRule.timeBands as {
    daytime?: { start: string; end: string };
    earlyLate?: Array<{ start: string; end: string }>;
  };

  // 時刻を HH:MM 形式に変換
  const formatTime = (date: Date): string => {
    const hours = date.getHours().toString().padStart(2, "0");
    const minutes = date.getMinutes().toString().padStart(2, "0");
    return `${hours}:${minutes}`;
  };

  const startTimeStr = formatTime(startTime);
  const endTimeStr = formatTime(endTime);

  // 日跨ぎチェック: 開始時刻と終了時刻が異なる日の場合
  const crossesDay =
    endTime.getTime() - startTime.getTime() > 12 * 60 * 60 * 1000; // 12時間以上

  // 時刻比較ヘルパー（HH:MM 形式）
  const isInRange = (time: string, start: string, end: string): boolean => {
    // 日跨ぎ対応（例: 22:00-06:00）
    if (start <= end) {
      return time >= start && time <= end;
    } else {
      return time >= start || time <= end;
    }
  };

  // DAYTIME チェック
  const daytime = timeBands.daytime;
  if (daytime) {
    const startInDaytime = isInRange(startTimeStr, daytime.start, daytime.end);
    const endInDaytime = isInRange(endTimeStr, daytime.start, daytime.end);

    // 日跨ぎの場合は必ず時間帯跨ぎ
    if (crossesDay) {
      return { timeBand: "CROSSES_BANDS", ruleVersion: activeRule.version };
    }

    if (startInDaytime && endInDaytime) {
      return { timeBand: "DAYTIME", ruleVersion: activeRule.version };
    }
    if (startInDaytime || endInDaytime) {
      return { timeBand: "CROSSES_BANDS", ruleVersion: activeRule.version };
    }
  }

  // EARLY_LATE チェック
  const earlyLate = timeBands.earlyLate;
  if (earlyLate && earlyLate.length > 0) {
    const startInEarlyLate = earlyLate.some((range) =>
      isInRange(startTimeStr, range.start, range.end)
    );
    const endInEarlyLate = earlyLate.some((range) =>
      isInRange(endTimeStr, range.start, range.end)
    );

    if (startInEarlyLate && endInEarlyLate) {
      return { timeBand: "EARLY_LATE", ruleVersion: activeRule.version };
    }
    if (startInEarlyLate || endInEarlyLate) {
      return { timeBand: "CROSSES_BANDS", ruleVersion: activeRule.version };
    }
  }

  // どの時間帯にも該当しない場合は DAYTIME とみなす
  return { timeBand: "DAYTIME", ruleVersion: activeRule.version };
}
