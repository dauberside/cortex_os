-- テストデータ作成SQL

-- 1. ユニット作成
INSERT INTO "units" (id, name, "serviceType", description, "createdAt", "updatedAt")
VALUES
  ('unit-a', 'ハウスてんじん', 'GH', 'グループホームA', NOW(), NOW()),
  ('unit-b', 'ハウスなかす', 'GH', 'グループホームB', NOW(), NOW())
ON CONFLICT (id) DO NOTHING;

-- 2. ユーザーのIDを取得して、UnitStaffを作成
-- スタッフ (staff@example.com) をユニットAに紐付け
INSERT INTO "unit_staffs" (id, "unitId", "userId", role, "createdAt")
SELECT
  'unitstaff-staff-a',
  'unit-a',
  u.id,
  'primary',
  NOW()
FROM "users" u
WHERE u.email = 'staff@example.com'
ON CONFLICT (id) DO NOTHING;

-- リーダー (lead@example.com) をユニットAに紐付け
INSERT INTO "unit_staffs" (id, "unitId", "userId", role, "createdAt")
SELECT
  'unitstaff-lead-a',
  'unit-a',
  u.id,
  'primary',
  NOW()
FROM "users" u
WHERE u.email = 'lead@example.com'
ON CONFLICT (id) DO NOTHING;

-- 3. 利用者作成
INSERT INTO "care_recipients" (
  id, name, "nameKana", "birthDate", gender, "disabilityType",
  "supportLevel", "userId", "createdAt", "updatedAt"
)
SELECT
  'recipient-1',
  '山田 太郎',
  'ヤマダ タロウ',
  '1990-05-15'::date,
  'Male',
  ARRAY['Intellectual'],
  3,
  u.id,
  NOW(),
  NOW()
FROM "users" u
WHERE u.email = 'staff@example.com'
ON CONFLICT (id) DO NOTHING;

INSERT INTO "care_recipients" (
  id, name, "nameKana", "birthDate", gender, "disabilityType",
  "supportLevel", "userId", "createdAt", "updatedAt"
)
SELECT
  'recipient-2',
  '佐々木 花子',
  'ササキ ハナコ',
  '1985-08-20'::date,
  'Female',
  ARRAY['Mental'],
  4,
  u.id,
  NOW(),
  NOW()
FROM "users" u
WHERE u.email = 'lead@example.com'
ON CONFLICT (id) DO NOTHING;

INSERT INTO "care_recipients" (
  id, name, "nameKana", "birthDate", gender, "disabilityType",
  "supportLevel", "userId", "createdAt", "updatedAt"
)
SELECT
  'recipient-3',
  '高橋 次郎',
  'タカハシ ジロウ',
  '1992-12-10'::date,
  'Male',
  ARRAY['Physical'],
  2,
  u.id,
  NOW(),
  NOW()
FROM "users" u
WHERE u.email = 'manager@example.com'
ON CONFLICT (id) DO NOTHING;

-- 4. UnitRecipient（利用者とユニットの紐付け）
-- 利用者1と2はユニットAに所属
INSERT INTO "unit_recipients" (id, "unitId", "recipientId", "joinedAt")
VALUES
  ('unitrecipient-1-a', 'unit-a', 'recipient-1', NOW()),
  ('unitrecipient-2-a', 'unit-a', 'recipient-2', NOW())
ON CONFLICT (id) DO NOTHING;

-- 利用者3はユニットBに所属
INSERT INTO "unit_recipients" (id, "unitId", "recipientId", "joinedAt")
VALUES
  ('unitrecipient-3-b', 'unit-b', 'recipient-3', NOW())
ON CONFLICT (id) DO NOTHING;

-- 確認クエリ
SELECT
  u.email as "職員メール",
  u.role as "役割",
  un.name as "所属ユニット",
  cr.name as "閲覧可能な利用者"
FROM "users" u
LEFT JOIN "unit_staffs" us ON us."userId" = u.id
LEFT JOIN "units" un ON un.id = us."unitId"
LEFT JOIN "unit_recipients" ur ON ur."unitId" = un.id
LEFT JOIN "care_recipients" cr ON cr.id = ur."recipientId"
WHERE u.email IN ('staff@example.com', 'lead@example.com', 'manager@example.com')
ORDER BY u.email, cr.name;
