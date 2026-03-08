---
name: audit-logging-minimal
description: Add minimal audit logging for welfare data. Use when implementing view logs for Recipient hub/assessment and change reasons for edits/deletes.
license: MIT
allowed-tools: oboe.edit_file
compatibility: node nextjs prisma trpc
metadata:
  version: "0.1.0"
---

# Minimal Audit Logging

## What to log

- View: who/when/recipientId/path (especially Recipient hub and assessment)
- Edit/Delete: who/when/resourceId/action + optional changeNote

## Rules

- STAFF: no export/print for info tables; log views instead
- Keep logs append-only
