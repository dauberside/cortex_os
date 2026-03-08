---
name: auto-sync-records
description: Auto-sync Do->Fact records. Use when implementing submit-based upsert from GuideRecord/DailyLog to ServiceRecord (and optionally WorkLog) with stable foreign keys.
license: MIT
allowed-tools: oboe.edit_file
compatibility: node nextjs prisma trpc
metadata:
  version: "0.1.0"
---

# Auto Sync (Do -> Fact)

## Pattern

- Trigger: submit() sets SUBMITTED
- Upsert Fact using stable key (guideRecordId or dailyLogId)
- Keep derived fields deterministic and recomputable
- Preserve source link for traceability
