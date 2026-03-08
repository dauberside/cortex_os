import { readFileSync } from "fs";
import { fileURLToPath } from "url";
import { dirname, join } from "path";
import dotenv from "dotenv";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables
dotenv.config({ path: join(__dirname, "..", ".env") });

// Import the CSV parsing function
import { parseRecipientsCSV } from "../src/lib/csv.ts";

async function testImport() {
  try {
    console.log("=== CSV Import Test ===\n");

    // Read the CSV file
    const csvPath = join(__dirname, "..", "利用者登録テンプレート_単一.csv");
    let csvContent = readFileSync(csvPath, "utf-8");

    // Strip BOM if present
    csvContent = csvContent.replace(/^\uFEFF/, "");
    // Normalize line endings
    csvContent = csvContent.replace(/\r\n/g, "\n").replace(/\r/g, "\n");

    console.log("CSV file loaded successfully\n");

    // Parse the CSV
    const result = parseRecipientsCSV(csvContent);

    console.log(`Parsed ${result.recipients.length} recipient(s)`);
    console.log(`Errors: ${result.errors.length}\n`);

    if (result.errors.length > 0) {
      console.log("=== Parsing Errors ===");
      result.errors.forEach((error, index) => {
        console.log(`${index + 1}. ${error}`);
      });
      console.log("");
    }

    if (result.recipients.length > 0) {
      const recipient = result.recipients[0];

      console.log("=== Parsed Recipient Data ===");
      console.log("Basic Info:");
      console.log("  氏名:", recipient.name);
      console.log("  氏名カナ:", recipient.nameKana);
      console.log("  生年月日:", recipient.birthDate);
      console.log("  自宅住所:", recipient.homeAddress);
      console.log("  本人携帯あり:", recipient.hasMobilePhone);
      console.log("  本人携帯番号:", recipient.mobilePhone);

      console.log("\nSupport Profile - Health Info:");
      console.log("  障害名:", recipient.disabilityName);
      console.log("  疾病状況:", recipient.diseaseStatus);
      console.log("  発作あり:", recipient.hasSeizures);
      console.log("  服薬:", recipient.medication);
      console.log("  健康留意点:", recipient.healthNote);

      console.log("\nSupport Profile - Food Info:");
      console.log("  好きな食べ物:", recipient.favoriteFoods);
      console.log("  嫌いな食べ物:", recipient.dislikedFoods);
      console.log("  アレルギー有無:", recipient.hasAllergy);
      console.log("  アレルギー詳細:", recipient.allergyNote);

      console.log("\nSupport Profile - Mobility Info:");
      console.log("  移動手段:", recipient.mobilityMethod);
      console.log("  移動介助:", recipient.mobilityAssist);
      console.log("  移動留意点:", recipient.mobilityNote);

      console.log("\nSupport Profile - Communication Info:");
      console.log("  会話表現:", recipient.commVerbal);
      console.log("  ジェスチャー:", recipient.commGesture);
      console.log("  留意点:", recipient.commNote);

      console.log("\n=== Field Count ===");
      const nonNullFields = Object.entries(recipient).filter(([, value]) => {
        if (value === null || value === undefined) return false;
        if (Array.isArray(value) && value.length === 0) return false;
        if (typeof value === "string" && value === "") return false;
        return true;
      });
      console.log(`Non-empty fields: ${nonNullFields.length}`);

      console.log("\n=== Support Profile Fields Status ===");
      const supportProfileFields = [
        "disabilityName",
        "diseaseStatus",
        "hasSeizures",
        "medication",
        "healthNote",
        "favoriteFoods",
        "dislikedFoods",
        "hasAllergy",
        "allergyNote",
        "mobilityMethod",
        "mobilityAssist",
        "mobilityNote",
        "commVerbal",
        "commGesture",
        "commNote",
      ];

      supportProfileFields.forEach((field) => {
        const value = recipient[field];
        let status = "❌ MISSING";
        if (value !== null && value !== undefined) {
          if (Array.isArray(value)) {
            status =
              value.length > 0
                ? `✅ ${JSON.stringify(value)}`
                : "⚠️  EMPTY ARRAY";
          } else if (typeof value === "boolean") {
            status = `✅ ${value}`;
          } else if (typeof value === "string") {
            status = value !== "" ? `✅ "${value}"` : "⚠️  EMPTY STRING";
          } else {
            status = `✅ ${value}`;
          }
        }
        console.log(`  ${field}: ${status}`);
      });
    }
  } catch (error) {
    console.error("Test failed:", error);
    console.error(error.stack);
  }
}

testImport();
