---
name: access-control-rbac
description: Apply Role+Unit+Ownership access control for GH and outing support. Use when implementing or reviewing permissions for Recipient, GuideRecord, DailyLog, ServiceRecord, or audit logs.
license: MIT
allowed-tools: oboe.edit_file
compatibility: node nextjs prisma trpc
metadata:
  version: "0.1.0"
---

# Access Control (RBAC + ABAC)

## Core policy
- Roles: STAFF / LEAD / MANAGER
- ABAC: same unit + ownership
- STAFF: same-unit records are view-only; can edit/delete only own records
- LEAD: full within unit (view/edit/delete/submit/review)
- MANAGER: full across units

## Implementation checklist
1. Centralize policy helpers: canView/canEdit/canDelete
2. Enforce in tRPC protected procedures
3. Add tests for boundary cases