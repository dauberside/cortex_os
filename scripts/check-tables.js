const apiKey = process.env.neon_api || process.env.NEON_API_KEY;
const projectId = 'ep-broad-haze-ai5806b4';

async function checkTables() {
  if (!apiKey) {
    console.error('❌ NEON_API_KEY not found');
    process.exit(1);
  }

  console.log('🔍 Checking tables via Neon API...');

  try {
    const response = await fetch(
      `https://console.neon.tech/api/v2/projects/${projectId}/query`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          query: "SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' ORDER BY table_name;",
          db_name: 'neondb',
        }),
      }
    );

    const data = await response.json();

    if (!response.ok) {
      console.error('❌ API Error:', response.status, response.statusText);
      console.error(JSON.stringify(data, null, 2));
      process.exit(1);
    }

    console.log('\n📊 Tables in database:');
    if (data.rows && data.rows.length > 0) {
      data.rows.forEach(row => {
        console.log(`  - ${row.table_name}`);
      });
      console.log(`\nTotal: ${data.rows.length} tables`);
    } else {
      console.log('  ⚠️  No tables found - database is empty');
    }
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

checkTables();
