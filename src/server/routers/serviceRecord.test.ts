import { initTRPC } from "@trpc/server";
import superjson from "superjson";
import { beforeEach, describe, expect, it, vi, assert } from "vitest";

// next-auth と prisma を先にモックしてから router を import
vi.mock("@/lib/auth", () => ({ auth: vi.fn() }));
vi.mock("@/lib/prisma", () => ({ prisma: {} }));

import { serviceRecordRouter } from "./serviceRecord";

// Prisma クライアントをモック
const mockDb = {
  unitRecipient: {
    findMany: vi.fn(),
  },
  serviceRecord: {
    findMany: vi.fn(),
    findUnique: vi.fn(),
    update: vi.fn(),
  },
  guideRecord: {
    findMany: vi.fn(),
  },
  user: {
    findUnique: vi.fn(),
  },
};

// テスト用 tRPC インスタンス（認証スキップ）
const t = initTRPC
  .context<{ db: typeof mockDb; session: { user: { id: string } } }>()
  .create({ transformer: superjson });

const testRouter = t.router({
  serviceRecord: serviceRecordRouter,
});

const createCaller = t.createCallerFactory(testRouter);

const caller = createCaller({
  db: mockDb as any,
  session: { user: { id: "user-1" } },
});

beforeEach(() => {
  vi.clearAllMocks();
});

describe("serviceRecord.listByUnit", () => {
  it("在籍受給者のServiceRecordを返す", async () => {
    const mockUnitRecipients = [
      {
        recipientId: "r-1",
        joinedAt: new Date("2026-01-01"),
        leftAt: null,
        recipient: { id: "r-1", name: "山田 太郎", nameKana: "ヤマダ タロウ" },
      },
    ];
    const mockRecords = [
      {
        id: "sr-1",
        recipientId: "r-1",
        serviceDate: new Date("2026-03-10"),
        serviceType: "GroupHome",
        startTime: new Date("2026-03-10T09:00:00"),
        endTime: new Date("2026-03-10T17:00:00"),
        duration: 480,
        recipient: { id: "r-1", name: "山田 太郎", nameKana: "ヤマダ タロウ" },
        user: { id: "user-1", name: "スタッフA" },
      },
    ];

    mockDb.unitRecipient.findMany.mockResolvedValue(mockUnitRecipients);
    mockDb.serviceRecord.findMany.mockResolvedValue(mockRecords);
    mockDb.guideRecord.findMany.mockResolvedValue([]);

    const result = await caller.serviceRecord.listByUnit({
      unitId: "unit-1",
      yearMonth: "2026-03",
    });

    expect(result.recipients).toHaveLength(1);
    expect(result.recipients[0].id).toBe("r-1");
    expect(result.records).toHaveLength(1);
    expect(result.records[0].id).toBe("sr-1");
  });

  it("在籍受給者がいない場合は空配列を返す", async () => {
    mockDb.unitRecipient.findMany.mockResolvedValue([]);

    const result = await caller.serviceRecord.listByUnit({
      unitId: "unit-empty",
      yearMonth: "2026-03",
    });

    expect(result.recipients).toHaveLength(0);
    expect(result.records).toHaveLength(0);
    // 受給者がいない場合は serviceRecord.findMany を呼ばない
    expect(mockDb.serviceRecord.findMany).not.toHaveBeenCalled();
  });

  it("unitRecipient の在籍期間フィルタが正しい条件で呼ばれる", async () => {
    mockDb.unitRecipient.findMany.mockResolvedValue([]);

    await caller.serviceRecord.listByUnit({
      unitId: "unit-1",
      yearMonth: "2026-03",
    });

    const callArgs = mockDb.unitRecipient.findMany.mock.calls[0][0];
    expect(callArgs.where.unitId).toBe("unit-1");
    // 月末より前に入居している
    expect(callArgs.where.joinedAt.lte).toEqual(new Date(2026, 2, 31, 23, 59, 59, 999));
    // 退居日が null か月初以降
    expect(callArgs.where.OR).toEqual([
      { leftAt: null },
      { leftAt: { gte: new Date(2026, 2, 1) } },
    ]);
  });

  it("退居済み受給者（leftAt が月初より前）は含まれない", async () => {
    // 2月末に退居した受給者は3月の一覧に含まれない
    // → findMany のモックが正しい where 条件で呼ばれることを確認済みのため、
    //   ここでは leftAt フィルタが OR 条件に入っていることを確認
    mockDb.unitRecipient.findMany.mockResolvedValue([]);

    await caller.serviceRecord.listByUnit({
      unitId: "unit-1",
      yearMonth: "2026-03",
    });

    const callArgs = mockDb.unitRecipient.findMany.mock.calls[0][0];
    const orCondition = callArgs.where.OR;
    expect(orCondition).toContainEqual({ leftAt: null });
    expect(orCondition).toContainEqual({
      leftAt: { gte: new Date(2026, 2, 1) },
    });
  });

  it("yearMonth の形式が不正な場合はバリデーションエラー", async () => {
    await expect(
      caller.serviceRecord.listByUnit({
        unitId: "unit-1",
        yearMonth: "2026/03", // スラッシュ区切りは不正
      })
    ).rejects.toThrow();
  });

  it("guideOutingDates が JST 基準で正しい日付になる", async () => {
    // UTC 2026-03-09T15:00:00Z = JST 2026-03-10T00:00:00+09:00
    // UTC 表現では前日だが、JST では 3/10 になるケース
    const mockUnitRecipients = [
      {
        recipientId: "r-1",
        joinedAt: new Date("2026-01-01"),
        leftAt: null,
        recipient: { id: "r-1", name: "山田 太郎", nameKana: "ヤマダ タロウ" },
      },
    ];
    mockDb.unitRecipient.findMany.mockResolvedValue(mockUnitRecipients);
    mockDb.serviceRecord.findMany.mockResolvedValue([]);
    mockDb.guideRecord.findMany.mockResolvedValue([
      {
        recipientId: "r-1",
        // UTC 3/9 15:00 = JST 3/10 00:00
        startedAt: new Date("2026-03-09T15:00:00.000Z"),
      },
    ]);

    const result = await caller.serviceRecord.listByUnit({
      unitId: "unit-1",
      yearMonth: "2026-03",
    });

    // JST で 3/10 に変換されていること
    expect(result.guideOutingDates?.["r-1"]).toContain("2026-03-10");
    // UTC の 3/9 が混入していないこと
    expect(result.guideOutingDates?.["r-1"]).not.toContain("2026-03-09");
  });

  it("GuideRecord がある日は outingDone=false でも guideOutingDates に含まれる", async () => {
    const mockUnitRecipients = [
      {
        recipientId: "r-1",
        joinedAt: new Date("2026-01-01"),
        leftAt: null,
        recipient: { id: "r-1", name: "山田 太郎", nameKana: "ヤマダ タロウ" },
      },
    ];
    // outingDone=false のサービス記録
    const mockRecords = [
      {
        id: "sr-1",
        recipientId: "r-1",
        serviceDate: new Date("2026-03-10"),
        serviceType: "GroupHome",
        startTime: new Date("2026-03-10T09:00:00"),
        endTime: new Date("2026-03-10T17:00:00"),
        duration: 480,
        dailyLogEntryId: "dle-1",
        dailyLogEntry: {
          dailyLogId: "dl-1",
          mealBreakfast: true,
          mealLunch: true,
          mealDinner: true,
          bathDone: false,
          outingDone: false, // falseだが GuideRecord があるので外出○
          notes: null,
        },
        recipient: { id: "r-1", name: "山田 太郎", nameKana: "ヤマダ タロウ" },
        user: { id: "user-1", name: "スタッフA" },
      },
    ];
    mockDb.unitRecipient.findMany.mockResolvedValue(mockUnitRecipients);
    mockDb.serviceRecord.findMany.mockResolvedValue(mockRecords);
    // 同日に SUBMITTED の GuideRecord が存在
    mockDb.guideRecord.findMany.mockResolvedValue([
      {
        recipientId: "r-1",
        startedAt: new Date("2026-03-10T09:00:00.000Z"),
      },
    ]);

    const result = await caller.serviceRecord.listByUnit({
      unitId: "unit-1",
      yearMonth: "2026-03",
    });

    // outingDone=false でも guideOutingDates に 3/10 が含まれる
    assert(result.guideOutingDates !== undefined);
    expect(result.guideOutingDates["r-1"]).toContain("2026-03-10");
    // レコード自体も返る
    expect(result.records[0].dailyLogEntry?.outingDone).toBe(false);
  });
});

describe("serviceRecord.approve", () => {
  it("LEAD は承認できる", async () => {
    mockDb.user.findUnique.mockResolvedValue({ role: "LEAD" });
    mockDb.serviceRecord.findUnique.mockResolvedValue({ id: "sr-1" });
    mockDb.serviceRecord.update.mockResolvedValue({
      id: "sr-1",
      isApproved: true,
      approvedBy: "user-1",
      approvedAt: expect.any(Date),
    });

    await caller.serviceRecord.approve({ id: "sr-1" });

    expect(mockDb.serviceRecord.update).toHaveBeenCalledWith({
      where: { id: "sr-1" },
      data: {
        isApproved: true,
        approvedBy: "user-1",
        approvedAt: expect.any(Date),
      },
    });
  });

  it("MANAGER は承認できる", async () => {
    mockDb.user.findUnique.mockResolvedValue({ role: "MANAGER" });
    mockDb.serviceRecord.findUnique.mockResolvedValue({ id: "sr-1" });
    mockDb.serviceRecord.update.mockResolvedValue({ id: "sr-1", isApproved: true });

    await caller.serviceRecord.approve({ id: "sr-1" });

    expect(mockDb.serviceRecord.update).toHaveBeenCalled();
  });

  it("STAFF は承認できない", async () => {
    mockDb.user.findUnique.mockResolvedValue({ role: "STAFF" });

    await expect(
      caller.serviceRecord.approve({ id: "sr-1" })
    ).rejects.toThrow("リーダー以上の権限が必要です");

    expect(mockDb.serviceRecord.update).not.toHaveBeenCalled();
  });

  it("存在しないレコードはエラー", async () => {
    mockDb.user.findUnique.mockResolvedValue({ role: "LEAD" });
    mockDb.serviceRecord.findUnique.mockResolvedValue(null);

    await expect(
      caller.serviceRecord.approve({ id: "sr-not-found" })
    ).rejects.toThrow("サービス実績が見つかりません");
  });
});

describe("serviceRecord.reject", () => {
  it("LEAD は承認取り消しできる", async () => {
    mockDb.user.findUnique.mockResolvedValue({ role: "LEAD" });
    mockDb.serviceRecord.findUnique.mockResolvedValue({ id: "sr-1" });
    mockDb.serviceRecord.update.mockResolvedValue({
      id: "sr-1",
      isApproved: false,
      approvedBy: null,
      approvedAt: null,
    });

    await caller.serviceRecord.reject({ id: "sr-1" });

    expect(mockDb.serviceRecord.update).toHaveBeenCalledWith({
      where: { id: "sr-1" },
      data: {
        isApproved: false,
        approvedBy: null,
        approvedAt: null,
      },
    });
  });

  it("reject 後は isApproved=false / approvedBy=null / approvedAt=null になる", async () => {
    mockDb.user.findUnique.mockResolvedValue({ role: "MANAGER" });
    mockDb.serviceRecord.findUnique.mockResolvedValue({ id: "sr-1" });
    mockDb.serviceRecord.update.mockResolvedValue({
      id: "sr-1",
      isApproved: false,
      approvedBy: null,
      approvedAt: null,
    });

    const result = await caller.serviceRecord.reject({ id: "sr-1" });

    expect(result.isApproved).toBe(false);
    expect(result.approvedBy).toBeNull();
    expect(result.approvedAt).toBeNull();
  });

  it("STAFF は承認取り消しできない", async () => {
    mockDb.user.findUnique.mockResolvedValue({ role: "STAFF" });

    await expect(
      caller.serviceRecord.reject({ id: "sr-1" })
    ).rejects.toThrow("リーダー以上の権限が必要です");

    expect(mockDb.serviceRecord.update).not.toHaveBeenCalled();
  });
});
