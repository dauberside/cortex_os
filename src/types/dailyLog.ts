// 時間帯別記録の型定義

export interface TimeSlotRecord {
  time: string; // "15:00", "15:30" 等
  water?: string | null; // 水分量 "200ml" 等 (null=未入力)
  meal?: string | null; // 食事量 "全量", "半量", "少量" 等 (null=未入力)
  leisure?: string | null; // 余暇活動 "TV視聴", "散歩" 等 (null=未入力)
  oral?: boolean | null; // 口腔ケア実施 (null=未入力, false=未実施)
  bath?: boolean | null; // 入浴実施 (null=未入力, false=未実施)
  condition?: string | null; // 体調 "良好", "不調" 等 (null=未入力)
  medication?: boolean | null; // 服薬実施 (null=未入力, false=未実施)
  toilet?: string | null; // トイレ "排尿", "排便" 等 (null=未入力)
  sleep?: string | null; // 睡眠 "入眠", "覚醒" 等 (null=未入力)
  notes?: string | null; // 特記事項 (null=未入力)
  recordedBy?: string | null; // 記録者のユーザーID（監査ログ用）
  recordedAt?: string | null; // 記録日時（ISO 8601形式）
}

// 時間スロットのデフォルト設定（15:00〜翌9:30、30分刻み）
export const DEFAULT_TIME_SLOTS = [
  "15:00",
  "15:30",
  "16:00",
  "16:30",
  "17:00",
  "17:30",
  "18:00",
  "18:30",
  "19:00",
  "19:30",
  "20:00",
  "20:30",
  "21:00",
  "21:30",
  "22:00",
  "22:30",
  "23:00",
  "23:30",
  "0:00",
  "0:30",
  "1:00",
  "1:30",
  "2:00",
  "2:30",
  "3:00",
  "3:30",
  "4:00",
  "4:30",
  "5:00",
  "5:30",
  "6:00",
  "6:30",
  "7:00",
  "7:30",
  "8:00",
  "8:30",
  "9:00",
  "9:30",
];

// 時間スロット記録の初期化（未入力状態 = null）
export function initializeTimeSlotRecords(): TimeSlotRecord[] {
  return DEFAULT_TIME_SLOTS.map((time) => ({
    time,
    water: null,
    meal: null,
    leisure: null,
    oral: null,
    bath: null,
    condition: null,
    medication: null,
    toilet: null,
    sleep: null,
    notes: null,
  }));
}

// シフト開始・終了時刻から時間スロットを動的に生成
export function generateTimeSlotsFromShift(
  shiftStart: Date,
  shiftEnd: Date,
  intervalMinutes: number = 30
): string[] {
  const slots: string[] = [];
  const start = new Date(shiftStart);
  const end = new Date(shiftEnd);

  // 終了時刻が開始時刻より前の場合は翌日扱い
  if (end < start) {
    end.setDate(end.getDate() + 1);
  }

  const current = new Date(start);
  while (current <= end) {
    const hours = current.getHours();
    const minutes = current.getMinutes();
    slots.push(`${hours}:${minutes.toString().padStart(2, "0")}`);
    current.setMinutes(current.getMinutes() + intervalMinutes);
  }

  return slots;
}

// シフト開始・終了時刻から時間スロット記録を初期化
export function initializeTimeSlotRecordsFromShift(
  shiftStart: Date,
  shiftEnd: Date,
  intervalMinutes: number = 30
): TimeSlotRecord[] {
  const timeSlots = generateTimeSlotsFromShift(
    shiftStart,
    shiftEnd,
    intervalMinutes
  );
  return timeSlots.map((time) => ({
    time,
    water: null,
    meal: null,
    leisure: null,
    oral: null,
    bath: null,
    condition: null,
    medication: null,
    toilet: null,
    sleep: null,
    notes: null,
  }));
}

// 業務日誌エントリの拡張型
export interface DailyLogEntryWithTimeSlots {
  id: string;
  dailyLogId: string;
  recipientId: string;

  // 既存フィールド（サマリー用）
  temperature?: number | null;
  bloodPressure?: string | null;
  spo2?: number | null;
  vitalAlert: boolean;
  sleepTime?: Date | null;
  wakeTime?: Date | null;
  nightWaking?: string | null;
  behaviorNote?: string | null;

  mealAmount?: string | null;
  mealTexture?: string | null;
  swallowNote?: string | null;
  waterIntake?: string | null;
  dehydrationRisk: boolean;
  toiletRecords?: any;
  bathDone: boolean;
  bathRefusal?: string | null;
  oralCareDone: boolean;
  dressingDone: boolean;

  medicationChecks?: any;
  prnMedications?: any;

  outingDestination?: string | null;
  outingCompanion?: string | null;
  plannedReturnTime?: Date | null;
  returnTime?: Date | null;
  returnCondition?: string | null;
  overnightStay: boolean;
  overnightDest?: string | null;

  refusalRecords?: any;

  supportTags: string[];
  planItemRefs: string[];

  notes?: string | null;

  // 時間帯別記録（新規）
  timeSlotRecords?: TimeSlotRecord[] | null;

  createdAt: Date;
  updatedAt: Date;
}

// 業務日誌ヘッダー
export interface DailyLog {
  id: string;
  unitId: string;
  logDate: Date;
  shift: string; // "Day" | "Late" | "Night"
  shiftStart: Date;
  shiftEnd: Date;
  staffId: string;
  staffRole?: string | null;
  residentSummary?: {
    inHouse?: number;
    outing?: number;
    overnight?: number;
    hospital?: number;
    homeLeave?: number;
  } | null;
  majorEvent: boolean;
  handover?: string | null;
  createdAt: Date;
  updatedAt: Date;

  entries?: DailyLogEntryWithTimeSlots[];
}

// フォーム用の型
export interface DailyLogFormData {
  unitId: string;
  logDate: Date;
  shift: string;
  shiftStart: Date;
  shiftEnd: Date;
  staffRole?: string;
  residentSummary?: {
    inHouse: number;
    outing: number;
    overnight: number;
    hospital: number;
    homeLeave: number;
  };
  majorEvent: boolean;
  handover?: string;
}

export interface DailyLogEntryFormData {
  recipientId: string;

  // サマリー情報
  temperature?: number;
  bloodPressure?: string;
  spo2?: number;
  vitalAlert: boolean;
  behaviorNote?: string;

  // 時間帯別記録
  timeSlotRecords: TimeSlotRecord[];

  // その他の特記事項
  notes?: string;
}
