---
name: kodaira-timeband-rule
description: Implement Kodaira mobility support time band rules. Use when adding TimeBandRule settings, computing time bands, storing applied rule version, and handling cross-band cases.
license: MIT
allowed-tools: oboe.edit_file
compatibility: node nextjs prisma trpc
metadata:
  version: "0.1.0"
---

# Kodaira TimeBandRule

## Requirements

- Store time band definitions as settings (versioned)
- Compute DAYTIME / EARLY_LATE / CROSSES_BANDS
- Persist appliedRuleVersion on ServiceRecord/GuideRecord-derived facts
- Keep reviewMemo/changeNote for later reference
