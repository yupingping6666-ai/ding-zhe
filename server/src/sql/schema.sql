-- Ding-Zhe Database Schema
-- PostgreSQL 15+

-- Enable UUID generation
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ===== ENUMS =====
DO $$ BEGIN
  CREATE TYPE mode_enum AS ENUM ('single', 'dual');
EXCEPTION WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE task_type_enum AS ENUM ('care', 'todo', 'confirm', 'companion', 'self');
EXCEPTION WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE task_status_enum AS ENUM ('draft', 'sent', 'viewed', 'responded', 'done', 'delayed', 'skipped', 'pending', 'awaiting', 'deferred', 'completed', 'expired');
EXCEPTION WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE pet_mood_enum AS ENUM ('happy', 'content', 'neutral', 'lonely', 'sleepy', 'normal', 'miss', 'energetic', 'low');
EXCEPTION WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE relation_type_enum AS ENUM ('couple', 'spouse', 'family', 'parent_child', 'roommate', 'friend');
EXCEPTION WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE companion_enum AS ENUM ('dog', 'cat', 'bear', 'rabbit', 'penguin', 'fox', 'hamster', 'duck');
EXCEPTION WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE follow_up_intensity_enum AS ENUM ('light', 'standard', 'strong');
EXCEPTION WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE repeat_rule_enum AS ENUM ('once', 'daily', 'weekly');
EXCEPTION WHEN duplicate_object THEN null;
END $$;

-- ===== USERS =====
CREATE TABLE IF NOT EXISTS users (
    id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    nickname    VARCHAR(50) NOT NULL UNIQUE,
    avatar      VARCHAR(10) NOT NULL DEFAULT '😀',
    mode        mode_enum NOT NULL DEFAULT 'single',
    partner_id  UUID REFERENCES users(id) ON DELETE SET NULL,
    onboarded   BOOLEAN NOT NULL DEFAULT FALSE,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_users_partner ON users(partner_id);

-- ===== RELATIONSHIP SPACES =====
CREATE TABLE IF NOT EXISTS relationship_spaces (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id_1       UUID NOT NULL REFERENCES users(id),
    user_id_2       UUID NOT NULL REFERENCES users(id),
    relation_type   relation_type_enum NOT NULL DEFAULT 'couple',
    companion       companion_enum NOT NULL DEFAULT 'cat',
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CONSTRAINT unique_pair UNIQUE (user_id_1, user_id_2)
);

CREATE INDEX IF NOT EXISTS idx_spaces_user1 ON relationship_spaces(user_id_1);
CREATE INDEX IF NOT EXISTS idx_spaces_user2 ON relationship_spaces(user_id_2);

-- ===== PET STATE (one per space) =====
CREATE TABLE IF NOT EXISTS pet_states (
    space_id        UUID PRIMARY KEY REFERENCES relationship_spaces(id) ON DELETE CASCADE,
    mood            pet_mood_enum NOT NULL DEFAULT 'content',
    energy          INT NOT NULL DEFAULT 60 CHECK (energy BETWEEN 0 AND 100),
    last_fed        TIMESTAMPTZ,
    last_petted     TIMESTAMPTZ,
    today_interactions INT NOT NULL DEFAULT 0,
    interaction_date DATE,
    last_updated    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ===== ANNIVERSARIES =====
CREATE TABLE IF NOT EXISTS anniversaries (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    space_id        UUID NOT NULL REFERENCES relationship_spaces(id) ON DELETE CASCADE,
    title           VARCHAR(100) NOT NULL,
    date_mm_dd      VARCHAR(5) NOT NULL,
    start_year      INT,
    emoji           VARCHAR(4) NOT NULL DEFAULT '📅',
    is_recurring    BOOLEAN NOT NULL DEFAULT TRUE,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_anniversaries_space ON anniversaries(space_id);

-- ===== TASK TEMPLATES =====
CREATE TABLE IF NOT EXISTS task_templates (
    id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    creator_id          UUID NOT NULL REFERENCES users(id),
    receiver_id         UUID NOT NULL REFERENCES users(id),
    name                VARCHAR(200) NOT NULL,
    category            VARCHAR(20) NOT NULL DEFAULT 'other',
    remind_time         VARCHAR(5) NOT NULL,
    repeat_rule         repeat_rule_enum NOT NULL DEFAULT 'once',
    weekly_days         INT[] NOT NULL DEFAULT '{}',
    follow_up_intensity follow_up_intensity_enum NOT NULL DEFAULT 'standard',
    is_active           BOOLEAN NOT NULL DEFAULT TRUE,
    item_type           task_type_enum NOT NULL DEFAULT 'todo',
    note                TEXT DEFAULT '',
    created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_templates_creator ON task_templates(creator_id);
CREATE INDEX IF NOT EXISTS idx_templates_receiver ON task_templates(receiver_id);

-- ===== TASK INSTANCES =====
CREATE TABLE IF NOT EXISTS task_instances (
    id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    template_id         UUID NOT NULL REFERENCES task_templates(id) ON DELETE CASCADE,
    scheduled_at        TIMESTAMPTZ NOT NULL,
    status              task_status_enum NOT NULL DEFAULT 'pending',
    follow_up_count     INT NOT NULL DEFAULT 0,
    max_follow_ups      INT NOT NULL DEFAULT 3,
    follow_up_interval  INT NOT NULL DEFAULT 10,
    next_follow_up_at   TIMESTAMPTZ,
    deferred_since      TIMESTAMPTZ,
    completed_at        TIMESTAMPTZ,
    skipped_at          TIMESTAMPTZ,
    expired_at          TIMESTAMPTZ,
    relation_status     VARCHAR(20) NOT NULL DEFAULT 'sent',
    feedback            TEXT,
    action_log          JSONB NOT NULL DEFAULT '[]',
    created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_instances_template ON task_instances(template_id);
CREATE INDEX IF NOT EXISTS idx_instances_status ON task_instances(status);
CREATE INDEX IF NOT EXISTS idx_instances_scheduled ON task_instances(scheduled_at);

-- ===== PHOTOS =====
CREATE TABLE IF NOT EXISTS photos (
    id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id             UUID NOT NULL REFERENCES users(id),
    mode                mode_enum NOT NULL DEFAULT 'single',
    url                 VARCHAR(500) NOT NULL,
    description         TEXT,
    related_task_id     UUID REFERENCES task_instances(id) ON DELETE SET NULL,
    tags                VARCHAR(50)[] NOT NULL DEFAULT '{}',
    created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_photos_user ON photos(user_id);
CREATE INDEX IF NOT EXISTS idx_photos_task ON photos(related_task_id);

-- ===== NARRATIVES =====
CREATE TABLE IF NOT EXISTS narratives (
    id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    scope               VARCHAR(20) NOT NULL CHECK (scope IN ('self', 'relationship')),
    user_id             UUID NOT NULL REFERENCES users(id),
    partner_id          UUID REFERENCES users(id),
    photo_id            UUID REFERENCES photos(id) ON DELETE SET NULL,
    task_ids            UUID[],
    content             TEXT NOT NULL,
    created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_narratives_user ON narratives(user_id);
CREATE INDEX IF NOT EXISTS idx_narratives_scope ON narratives(scope, user_id);

-- ===== FEELINGS (Personal emotion/mood recording) =====
CREATE TABLE IF NOT EXISTS feelings (
    id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id             UUID NOT NULL REFERENCES users(id),
    content             TEXT NOT NULL,
    mood_tag            VARCHAR(10) NOT NULL,
    about_partner_id    UUID REFERENCES users(id) ON DELETE SET NULL,
    photo_url           VARCHAR(500),
    is_sent             BOOLEAN NOT NULL DEFAULT FALSE,
    created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_feelings_user ON feelings(user_id);
CREATE INDEX IF NOT EXISTS idx_feelings_partner ON feelings(about_partner_id);
