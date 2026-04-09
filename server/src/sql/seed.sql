-- Seed data for Ding-Zhe
-- Matches the mock data in src/store.ts

-- ===== USERS =====
INSERT INTO users (id, nickname, avatar, mode, partner_id, onboarded) VALUES
  ('00000000-0000-0000-0000-000000000001', '小红', '👧', 'dual', '00000000-0000-0000-0000-000000000002', true),
  ('00000000-0000-0000-0000-000000000002', '小明', '👦', 'dual', '00000000-0000-0000-0000-000000000001', true)
ON CONFLICT (id) DO NOTHING;

-- ===== RELATIONSHIP SPACE =====
INSERT INTO relationship_spaces (id, user_id_1, user_id_2, relation_type, companion) VALUES
  ('00000000-0000-0000-0000-000000000010', '00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000002', 'couple', 'cat')
ON CONFLICT (id) DO NOTHING;

-- ===== PET STATE =====
INSERT INTO pet_states (space_id, mood, energy, last_fed, last_petted, today_interactions, interaction_date) VALUES
  ('00000000-0000-0000-0000-000000000010', 'content', 60, NULL, NULL, 0, CURRENT_DATE)
ON CONFLICT (space_id) DO NOTHING;

-- ===== TASK TEMPLATES =====
-- id 1-8: cross-user tasks, id 9-10: self reminders
INSERT INTO task_templates (id, creator_id, receiver_id, name, category, remind_time, repeat_rule, follow_up_intensity, item_type, note) VALUES
  ('00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000002', '记得喝水', 'health', '09:30', 'daily', 'light', 'care', '多喝热水哦~'),
  ('00000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000002', '早点睡觉', 'health', '22:30', 'daily', 'light', 'care', '别熬夜了~'),
  ('00000000-0000-0000-0000-000000000003', '00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000002', '取快递', 'life', '18:00', 'once', 'standard', 'todo', '菜鸟驿站 A205'),
  ('00000000-0000-0000-0000-000000000004', '00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000002', '洗碗', 'life', '20:00', 'daily', 'standard', 'todo', ''),
  ('00000000-0000-0000-0000-000000000005', '00000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000001', '吃药', 'health', '08:00', 'daily', 'standard', 'care', '饭后半小时吃'),
  ('00000000-0000-0000-0000-000000000006', '00000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000001', '遛狗', 'life', '07:30', 'daily', 'standard', 'todo', '去公园那边'),
  ('00000000-0000-0000-0000-000000000007', '00000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000001', '今天面试怎么样', 'work', '19:00', 'once', 'light', 'confirm', '加油！不管怎样都很棒'),
  ('00000000-0000-0000-0000-000000000008', '00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000002', '驾考科目二过了吗', 'study', '17:00', 'once', 'standard', 'confirm', '别紧张，你一定行的'),
  ('00000000-0000-0000-0000-000000000009', '00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000001', '晨跑', 'health', '06:30', 'weekly', 'strong', 'todo', ''),
  ('00000000-0000-0000-0000-000000000010', '00000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000002', '准备明天的东西', 'life', '21:00', 'daily', 'standard', 'todo', '')
ON CONFLICT (id) DO NOTHING;

-- ===== TASK INSTANCES =====
-- Using NOW() + offsets for scheduled_at to match current mock behavior
INSERT INTO task_instances (id, template_id, scheduled_at, status, follow_up_count, max_follow_ups, follow_up_interval, relation_status, action_log) VALUES
  ('00000000-0000-0000-0000-000000000101', '00000000-0000-0000-0000-000000000001', NOW() + INTERVAL '9 hours 30 minutes', 'deferred', 1, 2, 30, 'delivered', '[{"timestamp": 1743674400000, "action": "reminded", "note": "发出提醒"}, {"timestamp": 1743674700000, "action": "auto_deferred", "note": "未响应，自动进入待完成"}, {"timestamp": 1743676500000, "action": "follow_up_sent", "note": "第1次跟进提醒"}]'),
  ('00000000-0000-0000-0000-000000000102', '00000000-0000-0000-0000-000000000003', NOW() + INTERVAL '18 hours', 'awaiting', 0, 3, 10, 'sent', '[{"timestamp": 1743717600000, "action": "reminded", "note": "发出提醒"}]'),
  ('00000000-0000-0000-0000-000000000103', '00000000-0000-0000-0000-000000000004', NOW() + INTERVAL '20 hours', 'pending', 0, 3, 10, 'sent', '[]'),
  ('00000000-0000-0000-0000-000000000104', '00000000-0000-0000-0000-000000000008', NOW() + INTERVAL '17 hours', 'pending', 0, 3, 10, 'sent', '[]'),
  ('00000000-0000-0000-0000-000000000105', '00000000-0000-0000-0000-000000000005', NOW() + INTERVAL '8 hours', 'deferred', 2, 3, 10, 'delivered', '[{"timestamp": 1743667200000, "action": "reminded", "note": "发出提醒"}, {"timestamp": 1743667380000, "action": "auto_deferred", "note": "未响应，自动进入待完成"}, {"timestamp": 1743667980000, "action": "follow_up_sent", "note": "第1次跟进提醒"}, {"timestamp": 1743668580000, "action": "follow_up_sent", "note": "第2次跟进提醒"}]'),
  ('00000000-0000-0000-0000-000000000106', '00000000-0000-0000-0000-000000000006', NOW() + INTERVAL '7 hours 30 minutes', 'completed', 0, 3, 10, 'responded', '[{"timestamp": 1743664200000, "action": "reminded", "note": "发出提醒"}, {"timestamp": 1743665100000, "action": "user_completed", "note": "已完成"}]'),
  ('00000000-0000-0000-0000-000000000107', '00000000-0000-0000-0000-000000000007', NOW() + INTERVAL '19 hours', 'awaiting', 0, 2, 30, 'delivered', '[{"timestamp": 1743717600000, "action": "reminded", "note": "发出提醒"}]'),
  ('00000000-0000-0000-0000-000000000108', '00000000-0000-0000-0000-000000000002', NOW() + INTERVAL '22 hours 30 minutes', 'completed', 0, 2, 30, 'responded', '[{"timestamp": 1743714600000, "action": "reminded", "note": "发出提醒"}]'),
  ('00000000-0000-0000-0000-000000000109', '00000000-0000-0000-0000-000000000009', NOW() + INTERVAL '6 hours 30 minutes', 'skipped', 0, 5, 5, 'responded', '[{"timestamp": 1743662400000, "action": "reminded", "note": "发出提醒"}, {"timestamp": 1743662520000, "action": "user_skipped", "note": "已跳过"}]'),
  ('00000000-0000-0000-0000-000000000110', '00000000-0000-0000-0000-000000000010', NOW() + INTERVAL '21 hours', 'pending', 0, 3, 10, 'sent', '[]')
ON CONFLICT (id) DO NOTHING;
