import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

async function testParse() {
  try {
    console.log('=== Simple CSV Parsing Test ===\n');

    // Read the CSV file
    const csvPath = join(__dirname, '..', '利用者登録テンプレート_単一.csv');
    let csvContent = readFileSync(csvPath, 'utf-8');

    // Strip BOM if present
    csvContent = csvContent.replace(/^\uFEFF/, '');
    // Normalize line endings
    csvContent = csvContent.replace(/\r\n/g, '\n').replace(/\r/g, '\n');

    const lines = csvContent.trim().split('\n');
    console.log(`Total lines: ${lines.length}`);

    if (lines.length < 2) {
      console.log('CSV file has no data rows');
      return;
    }

    const headerLine = lines[0];
    const dataLine = lines[1];

    // Parse headers
    const headers = headerLine.split(',');
    console.log(`\nTotal columns: ${headers.length}`);

    // Parse data
    const values = [];
    let current = '';
    let inQuotes = false;

    for (let i = 0; i < dataLine.length; i++) {
      const char = dataLine[i];

      if (char === '"') {
        inQuotes = !inQuotes;
      } else if (char === ',' && !inQuotes) {
        values.push(current);
        current = '';
      } else {
        current += char;
      }
    }
    values.push(current); // Last value

    console.log(`\nParsed ${values.length} values\n`);

    // Check support profile fields
    const supportProfileFields = {
      '障害名': null,
      '疾病状況': null,
      '発作あり': null,
      '服薬': null,
      '健康留意点': null,
      '好きな食べ物': null,
      '嫌いな食べ物': null,
      'アレルギー有無': null,
      'アレルギー詳細': null,
      '移動手段': null,
      '移動介助方法': null,
      '移動留意点': null,
      '会話表現': null,
      'ジェスチャー表現': null,
      'コミュニケーション留意点': null,
    };

    console.log('=== Support Profile Fields in CSV ===');

    headers.forEach((header, index) => {
      if (header in supportProfileFields) {
        const value = values[index] || '';
        const status = value ? '✅' : '❌';
        console.log(`${status} ${header}: "${value}"`);
      }
    });

    console.log('\n=== All Headers ===');
    headers.forEach((header, index) => {
      if (index < 50) { // Show first 50 headers
        console.log(`${index + 1}. ${header}`);
      }
    });

  } catch (error) {
    console.error('Test failed:', error);
    console.error(error.stack);
  }
}

testParse();
