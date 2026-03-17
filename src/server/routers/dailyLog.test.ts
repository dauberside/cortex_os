import { initTRPC } from "@trpc/server";
import superjson from "superjson";
import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/auth", () => ({ auth: vi.fn() }));
vi.mock("@/lib/prisma", () => ({ prisma: {} }));

import { dailyLogRouter } from "./dailyLog";

const mockDb = {
  dailyLog: {
    findUniqueOrThrow: vi.fn(),
    update: vi.fn(),
  },
  dailyLogEntry: {
    findUnique: vi.fn(),
    upsert: vi.fn(),
    findMany: vi.fn(),
  },
  serviceRecord: {
    create: vi.fn(),
    update: vi.fn(),
  },
  timeBandRule: {
    findFirst: vi.fn(),
  },
  auditLog: {
    create: vi.fn(),
  },
};

const t = initTRPC
  .context<{ db: typeof mockDb; session: { user: { id: string } } }>()
  .create({ transformer: superjson });

const testRouter = t.router({ dailyLog: dailyLogRouter });
const createCaller = t.createCallerFactory(testRouter);
const caller = createCaller({
  db: mockDb as any,
  session: { user: { id: "staff-1" } },
});

// テスト用の DailyLog ベースデータ
const baseDailyLog = {
  id: "log-1",
  unitId: "unit-1",
  logDate: new Date("2026-03-10"),
  shift: "Day",
  shiftStart: new Date("2026-03-10T09:00:00"),
  shiftEnd: new Date("2026-03-10T17:00:00"),
  staffId: "staff-1",
  breakMinutes: 60,
  unit: { serviceType: "GH" },
};

const baseEntry = {
  id: "entry-1",
  dailyLogId: "log-1",
  recipientId: "r-1",
};

beforeEach(() => {
  vi.clearAllMocks();
  // timeBandRule はデフォルトでルールなし（DAYTIME 返却）
  mockDb.timeBandRule.findFirst.mockResolvedValue(null);
  mockDb.auditLog.create.mockResolvedValue({});
});

// ─────────────────────────────────────────────
// upsertEntry → ServiceRecord 生成
// ─────────────────────────────────────────────

describe("dailyLog.upsertEntry → ServiceRecord 生成", () => {
  it("GH ユニットでは ServiceRecord が新規作成される", async () => {
    mockDb.dailyLog.findUniqueOrThrow.mockResolvedValue(baseDailyLog);
    mockDb.dailyLogEntry.findUnique.mockResolvedValue(null); // 新規
    mockDb.dailyLogEntry.upsert.mockResolvedValue(baseEntry);
    mockDb.serviceRecord.create.mockResolvedValue({ id: "sr-1" });

    await caller.dailyLog.upsertEntry({
      dailyLogId: "log-1",
      recipientId: "r-1",
    });

    expect(mockDb.serviceRecord.create).toHaveBeenCalledOnce();
    const createArg = mockDb.serviceRecord.create.mock.calls[0][0].data;
    expect(createArg.dailyLogEntryId).toBe("entry-1");
    expect(createArg.serviceType).toBe("GroupHome");
    expect(createArg.recipientId).toBe("r-1");
    expect(createArg.userId).toBe("staff-1");
  });

  it("KAIGO ユニットでは serviceType=DayCare で生成される", async () => {
    mockDb.dailyLog.findUniqueOrThrow.mockResolvedValue({
      ...baseDailyLog,
      unit: { serviceType: "KAIGO" },
    });
    mockDb.dailyLogEntry.findUnique.mockResolvedValue(null);
    mockDb.dailyLogEntry.upsert.mockResolvedValue(baseEntry);
    mockDb.serviceRecord.create.mockResolvedValue({ id: "sr-1" });

    await caller.dailyLog.upsertEntry({
      dailyLogId: "log-1",
      recipientId: "r-1",
    });

    const createArg = mockDb.serviceRecord.create.mock.calls[0][0].data;
    expect(createArg.serviceType).toBe("DayCare");
  });

  it("JUSHO ユニットでは serviceType=HomeHelp で生成される", async () => {
    mockDb.dailyLog.findUniqueOrThrow.mockResolvedValue({
      ...baseDailyLog,
      unit: { serviceType: "JUSHO" },
    });
    mockDb.dailyLogEntry.findUnique.mockResolvedValue(null);
    mockDb.dailyLogEntry.upsert.mockResolvedValue(baseEntry);
    mockDb.serviceRecord.create.mockResolvedValue({ id: "sr-1" });

    await caller.dailyLog.upsertEntry({
      dailyLogId: "log-1",
      recipientId: "r-1",
    });

    const createArg = mockDb.serviceRecord.create.mock.calls[0][0].data;
    expect(createArg.serviceType).toBe("HomeHelp");
  });

  it("対象外 serviceType では ServiceRecord が生成されない", async () => {
    mockDb.dailyLog.findUniqueOrThrow.mockResolvedValue({
      ...baseDailyLog,
      unit: { serviceType: "OTHER" }, // GH/KAIGO/JUSHO 以外
    });
    mockDb.dailyLogEntry.findUnique.mockResolvedValue(null);
    mockDb.dailyLogEntry.upsert.mockResolvedValue(baseEntry);

    await caller.dailyLog.upsertEntry({
      dailyLogId: "log-1",
      recipientId: "r-1",
    });

    expect(mockDb.serviceRecord.create).not.toHaveBeenCalled();
    expect(mockDb.serviceRecord.update).not.toHaveBeenCalled();
  });

  it("再 upsert では ServiceRecord.update が呼ばれ重複しない", async () => {
    const existingEntry = {
      ...baseEntry,
      serviceRecord: { id: "sr-existing" },
    };
    mockDb.dailyLog.findUniqueOrThrow.mockResolvedValue(baseDailyLog);
    mockDb.dailyLogEntry.findUnique.mockResolvedValue(existingEntry);
    mockDb.dailyLogEntry.upsert.mockResolvedValue(baseEntry);
    mockDb.serviceRecord.update.mockResolvedValue({ id: "sr-existing" });

    await caller.dailyLog.upsertEntry({
      dailyLogId: "log-1",
      recipientId: "r-1",
    });

    expect(mockDb.serviceRecord.update).toHaveBeenCalledOnce();
    expect(mockDb.serviceRecord.create).not.toHaveBeenCalled();
    expect(mockDb.serviceRecord.update.mock.calls[0][0].where).toEqual({
      id: "sr-existing",
    });
  });

  it("dailyLogEntryId が ServiceRecord に正しく紐づく", async () => {
    mockDb.dailyLog.findUniqueOrThrow.mockResolvedValue(baseDailyLog);
    mockDb.dailyLogEntry.findUnique.mockResolvedValue(null);
    mockDb.dailyLogEntry.upsert.mockResolvedValue({ id: "entry-new" });
    mockDb.serviceRecord.create.mockResolvedValue({ id: "sr-1" });

    await caller.dailyLog.upsertEntry({
      dailyLogId: "log-1",
      recipientId: "r-1",
    });

    const createArg = mockDb.serviceRecord.create.mock.calls[0][0].data;
    expect(createArg.dailyLogEntryId).toBe("entry-new");
  });

  it("duration が shiftEnd - shiftStart - breakMinutes で計算される", async () => {
    // 09:00〜17:00 = 480分, breakMinutes=60 → duration=420
    mockDb.dailyLog.findUniqueOrThrow.mockResolvedValue(baseDailyLog);
    mockDb.dailyLogEntry.findUnique.mockResolvedValue(null);
    mockDb.dailyLogEntry.upsert.mockResolvedValue(baseEntry);
    mockDb.serviceRecord.create.mockResolvedValue({ id: "sr-1" });

    await caller.dailyLog.upsertEntry({
      dailyLogId: "log-1",
      recipientId: "r-1",
    });

    const createArg = mockDb.serviceRecord.create.mock.calls[0][0].data;
    expect(createArg.duration).toBe(420); // 480 - 60
    expect(createArg.breakMinutes).toBe(60);
  });

  it("serviceDetail に入力データが正しくマッピングされる", async () => {
    mockDb.dailyLog.findUniqueOrThrow.mockResolvedValue(baseDailyLog);
    mockDb.dailyLogEntry.findUnique.mockResolvedValue(null);
    mockDb.dailyLogEntry.upsert.mockResolvedValue(baseEntry);
    mockDb.serviceRecord.create.mockResolvedValue({ id: "sr-1" });

    await caller.dailyLog.upsertEntry({
      dailyLogId: "log-1",
      recipientId: "r-1",
      mealAmount: "全量",
      bathDone: true,
      behaviorNote: "穏やか",
    });

    const createArg = mockDb.serviceRecord.create.mock.calls[0][0].data;
    expect(createArg.serviceDetail).toContain("食事: 全量");
    expect(createArg.serviceDetail).toContain("入浴: 実施");
    expect(createArg.serviceDetail).toContain("様子: 穏やか");
    expect(createArg.userCondition).toBe("穏やか");
  });

  it("入力データが空の場合 serviceDetail はデフォルト文言になる", async () => {
    mockDb.dailyLog.findUniqueOrThrow.mockResolvedValue(baseDailyLog);
    mockDb.dailyLogEntry.findUnique.mockResolvedValue(null);
    mockDb.dailyLogEntry.upsert.mockResolvedValue(baseEntry);
    mockDb.serviceRecord.create.mockResolvedValue({ id: "sr-1" });

    await caller.dailyLog.upsertEntry({
      dailyLogId: "log-1",
      recipientId: "r-1",
    });

    const createArg = mockDb.serviceRecord.create.mock.calls[0][0].data;
    expect(createArg.serviceDetail).toBe("業務日誌による日常生活支援");
  });
});

// ─────────────────────────────────────────────
// ヘッダー更新 → ServiceRecord 連動
// ─────────────────────────────────────────────

describe("dailyLog.update → ServiceRecord 連動", () => {
  it("shiftStart 変更時に関連 ServiceRecord が再計算される", async () => {
    const newStart = new Date("2026-03-10T08:00:00");
    const shiftEnd = new Date("2026-03-10T17:00:00");

    mockDb.dailyLog.update.mockResolvedValue({ id: "log-1", unitId: "unit-1" });
    mockDb.dailyLogEntry.findMany.mockResolvedValue([
      { serviceRecord: { id: "sr-1" } },
    ]);
    mockDb.dailyLog.findUniqueOrThrow.mockResolvedValue({
      shiftStart: newStart,
      shiftEnd,
      breakMinutes: 60,
    });
    mockDb.serviceRecord.update.mockResolvedValue({ id: "sr-1" });

    await caller.dailyLog.update({
      id: "log-1",
      shiftStart: newStart,
    });

    expect(mockDb.serviceRecord.update).toHaveBeenCalledOnce();
    const updateArg = mockDb.serviceRecord.update.mock.calls[0][0];
    expect(updateArg.where).toEqual({ id: "sr-1" });
    // 09:00〜17:00 = 540分, break=60 → duration=480
    expect(updateArg.data.duration).toBe(480);
    expect(updateArg.data.startTime).toEqual(newStart);
    expect(updateArg.data.endTime).toEqual(shiftEnd);
  });

  it("breakMinutes 変更時に duration が再計算される", async () => {
    const shiftStart = new Date("2026-03-10T09:00:00");
    const shiftEnd = new Date("2026-03-10T17:00:00");

    mockDb.dailyLog.update.mockResolvedValue({ id: "log-1", unitId: "unit-1" });
    mockDb.dailyLogEntry.findMany.mockResolvedValue([
      { serviceRecord: { id: "sr-1" } },
    ]);
    mockDb.dailyLog.findUniqueOrThrow.mockResolvedValue({
      shiftStart,
      shiftEnd,
      breakMinutes: 30, // 60→30 に変更
    });
    mockDb.serviceRecord.update.mockResolvedValue({ id: "sr-1" });

    await caller.dailyLog.update({
      id: "log-1",
      breakMinutes: 30,
    });

    const updateArg = mockDb.serviceRecord.update.mock.calls[0][0];
    expect(updateArg.data.duration).toBe(450); // 480 - 30
    expect(updateArg.data.breakMinutes).toBe(30);
  });

  it("ServiceRecord がないエントリはスキップされる", async () => {
    mockDb.dailyLog.update.mockResolvedValue({ id: "log-1", unitId: "unit-1" });
    mockDb.dailyLogEntry.findMany.mockResolvedValue([
      { serviceRecord: null }, // ServiceRecord なし
    ]);
    mockDb.dailyLog.findUniqueOrThrow.mockResolvedValue({
      shiftStart: new Date("2026-03-10T09:00:00"),
      shiftEnd: new Date("2026-03-10T17:00:00"),
      breakMinutes: 0,
    });

    await caller.dailyLog.update({
      id: "log-1",
      shiftStart: new Date("2026-03-10T09:00:00"),
    });

    expect(mockDb.serviceRecord.update).not.toHaveBeenCalled();
  });

  it("時間変更なしの update では ServiceRecord は変更されない", async () => {
    mockDb.dailyLog.update.mockResolvedValue({ id: "log-1", unitId: "unit-1" });

    await caller.dailyLog.update({
      id: "log-1",
      handover: "引き継ぎ事項のみ変更",
    });

    expect(mockDb.dailyLogEntry.findMany).not.toHaveBeenCalled();
    expect(mockDb.serviceRecord.update).not.toHaveBeenCalled();
  });
});
