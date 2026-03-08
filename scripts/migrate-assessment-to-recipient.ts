/**
 * Assessment → CareRecipient データ移行スクリプト
 *
 * 実行方法:
 *   npx tsx scripts/migrate-assessment-to-recipient.ts [--dry-run] [--recipient-id=xxx]
 *
 * オプション:
 *   --dry-run: 実際の更新を行わず、プレビューのみ表示
 *   --recipient-id: 特定の利用者のみ移行（テスト用）
 */

import { PrismaClient } from "@prisma/client";
import { PrismaNeon } from "@prisma/adapter-neon";
import { neonConfig } from "@neondatabase/serverless";
import * as dotenv from "dotenv";
import ws from "ws";

// 環境変数を読み込み
dotenv.config({ path: ".env" });
dotenv.config({ path: ".env.local" });

// WebSocket設定（Node.js環境用）
neonConfig.webSocketConstructor = ws;

// Node.jsスクリプトではDIRECT_URLを使用（WebSocketプーリングなし）
const connectionString = process.env.DIRECT_URL ?? process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error("DIRECT_URL or DATABASE_URL is not defined");
}

console.log("Connection string loaded:", connectionString ? "✓" : "✗");
console.log(
  "Using:",
  process.env.DIRECT_URL ? "DIRECT_URL (non-pooled)" : "DATABASE_URL"
);

const adapter = new PrismaNeon({ connectionString });

const prisma = new (PrismaClient as any)({
  adapter,
  log: ["error"],
});

interface MigrationStats {
  total: number;
  success: number;
  skipped: number;
  errors: number;
}

interface MigrationResult {
  recipientId: string;
  recipientName: string;
  status: "success" | "skipped" | "error";
  changes: string[];
  error?: string;
}

async function migrateAssessmentData(
  recipientId?: string,
  dryRun = false
): Promise<{ stats: MigrationStats; results: MigrationResult[] }> {
  const stats: MigrationStats = {
    total: 0,
    success: 0,
    skipped: 0,
    errors: 0,
  };

  const results: MigrationResult[] = [];

  try {
    // 移行対象のAssessmentを取得
    const assessments = await prisma.assessment.findMany({
      where: recipientId ? { recipientId } : {},
      include: {
        recipient: true,
      },
    });

    stats.total = assessments.length;

    console.log(`\n📊 移行対象: ${stats.total}件のアセスメント`);
    console.log(
      `${dryRun ? "🔍 DRY RUN モード（実際の更新は行いません）" : "⚠️  実行モード（データを更新します）"}\n`
    );

    for (const assessment of assessments) {
      const result: MigrationResult = {
        recipientId: assessment.recipientId,
        recipientName: assessment.recipient.name,
        status: "success",
        changes: [],
      };

      try {
        const recipient = assessment.recipient;
        const updateData: any = {};

        // 1. 直接マッピング（既存データがない場合のみ）
        if (!recipient.hobbies && assessment.hobbies) {
          updateData.hobbies = assessment.hobbies;
          result.changes.push(`趣味: "${assessment.hobbies}"`);
        }

        if (!recipient.personalityNote && assessment.personality) {
          updateData.personalityNote = assessment.personality;
          result.changes.push(
            `性格: "${assessment.personality.substring(0, 50)}..."`
          );
        }

        if (!recipient.toiletFrequency && assessment.toiletInterval) {
          updateData.toiletFrequency = assessment.toiletInterval;
          result.changes.push(`排泄頻度: "${assessment.toiletInterval}"`);
        }

        // 2. healthNoteへの統合
        if (assessment.medicationDetails) {
          const healthNoteAddition = `【服薬詳細】\n${assessment.medicationDetails}`;
          if (recipient.healthNote) {
            updateData.healthNote = `${recipient.healthNote}\n\n---\n【Assessmentからの移行】\n${healthNoteAddition}`;
          } else {
            updateData.healthNote = healthNoteAddition;
          }
          result.changes.push(`健康メモに服薬詳細を追加`);
        }

        // 3. commNoteへの統合
        if (assessment.commMethod) {
          const commNoteAddition = `【意思疎通の方法】\n${assessment.commMethod}`;
          if (recipient.commNote) {
            updateData.commNote = `${recipient.commNote}\n\n---\n【Assessmentからの移行】\n${commNoteAddition}`;
          } else {
            updateData.commNote = commNoteAddition;
          }
          result.changes.push(`コミュニケーションメモに意思疎通方法を追加`);
        }

        // 4. toiletNoteのマージ
        if (assessment.toiletNote) {
          const toiletCareInfo = assessment.toiletCareTypes?.length
            ? `【排泄支援種別】\n${assessment.toiletCareTypes.join(", ")}\n\n`
            : "";

          const toiletNoteAddition = `${toiletCareInfo}${assessment.toiletNote}`;

          if (recipient.toiletNote) {
            updateData.toiletNote = `${recipient.toiletNote}\n\n---\n【Assessmentからの移行】\n${toiletNoteAddition}`;
          } else {
            updateData.toiletNote = toiletNoteAddition;
          }
          result.changes.push(`排泄メモを統合`);
        }

        // 5. otherNotesへの統合
        const otherNotesAdditions: string[] = [];

        if (assessment.lifeRhythm) {
          otherNotesAdditions.push(`【生活リズム】\n${assessment.lifeRhythm}`);
        }

        if (assessment.cautions) {
          otherNotesAdditions.push(
            `【特記事項・注意事項】\n${assessment.cautions}`
          );
        }

        if (assessment.emergencyNote) {
          otherNotesAdditions.push(
            `【緊急時対応】\n${assessment.emergencyNote}`
          );
        }

        if (assessment.familyStructure) {
          otherNotesAdditions.push(
            `【家族構成】\n${assessment.familyStructure}`
          );
        }

        if (assessment.supportSystem) {
          otherNotesAdditions.push(`【支援体制】\n${assessment.supportSystem}`);
        }

        if (otherNotesAdditions.length > 0) {
          const newContent = otherNotesAdditions.join("\n\n");
          if (recipient.otherNotes) {
            updateData.otherNotes = `${recipient.otherNotes}\n\n---\n【Assessmentからの移行データ】\n${newContent}`;
          } else {
            updateData.otherNotes = newContent;
          }
          result.changes.push(
            `その他メモに${otherNotesAdditions.length}項目を追加`
          );
        }

        // 変更がない場合はスキップ
        if (Object.keys(updateData).length === 0) {
          result.status = "skipped";
          result.changes.push("移行対象データなし");
          stats.skipped++;
        } else {
          if (!dryRun) {
            // 実際に更新
            await prisma.careRecipient.update({
              where: { id: recipient.id },
              data: updateData,
            });
          }
          stats.success++;
        }

        results.push(result);

        // 進捗表示
        const progressIcon = result.status === "success" ? "✅" : "⏭️";
        console.log(
          `${progressIcon} ${recipient.name} (ID: ${recipient.id.substring(0, 8)}...)`
        );
        result.changes.forEach((change) => console.log(`   - ${change}`));
        console.log("");
      } catch (error: any) {
        result.status = "error";
        result.error = error.message;
        stats.errors++;
        results.push(result);

        console.error(`❌ ${assessment.recipient.name}: ${error.message}\n`);
      }
    }
  } catch (error) {
    console.error("❌ 移行処理中にエラーが発生しました:", error);
    throw error;
  }

  return { stats, results };
}

async function main() {
  const args = process.argv.slice(2);
  const dryRun = args.includes("--dry-run");
  const recipientIdArg = args.find((arg) => arg.startsWith("--recipient-id="));
  const recipientId = recipientIdArg?.split("=")[1];

  console.log("🚀 Assessment → CareRecipient データ移行スクリプト\n");

  try {
    const { stats, results } = await migrateAssessmentData(recipientId, dryRun);

    console.log("\n" + "=".repeat(60));
    console.log("📈 移行結果サマリー");
    console.log("=".repeat(60));
    console.log(`総数:       ${stats.total}件`);
    console.log(`成功:       ${stats.success}件`);
    console.log(`スキップ:   ${stats.skipped}件`);
    console.log(`エラー:     ${stats.errors}件`);
    console.log("=".repeat(60) + "\n");

    if (dryRun) {
      console.log(
        "ℹ️  DRY RUNモードで実行しました。実際のデータは変更されていません。"
      );
      console.log(
        "ℹ️  実際に移行を実行する場合は、--dry-runオプションを外して実行してください。\n"
      );
    } else {
      console.log("✅ データ移行が完了しました。\n");
    }

    // エラーがあった場合は詳細を表示
    const errorResults = results.filter((r) => r.status === "error");
    if (errorResults.length > 0) {
      console.log("⚠️  以下の利用者でエラーが発生しました:\n");
      errorResults.forEach((r) => {
        console.log(`  - ${r.recipientName} (ID: ${r.recipientId})`);
        console.log(`    エラー: ${r.error}\n`);
      });
    }
  } catch (error) {
    console.error("\n❌ 移行処理が失敗しました:", error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

// スクリプト実行
main();
