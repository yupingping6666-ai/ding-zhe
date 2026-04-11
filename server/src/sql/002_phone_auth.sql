-- 002_phone_auth.sql
-- Add phone/password authentication support

-- Add phone and password_hash columns to users
ALTER TABLE users ADD COLUMN IF NOT EXISTS phone VARCHAR(20);
ALTER TABLE users ADD COLUMN IF NOT EXISTS password_hash VARCHAR(100);

-- Make nickname nullable (phone-registered users may not have a nickname initially)
ALTER TABLE users ALTER COLUMN nickname DROP NOT NULL;

-- Unique index on phone (partial: only non-null values)
CREATE UNIQUE INDEX IF NOT EXISTS idx_users_phone ON users(phone) WHERE phone IS NOT NULL;

-- Verification codes table
CREATE TABLE IF NOT EXISTS verification_codes (
    id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    phone       VARCHAR(20) NOT NULL,
    code        VARCHAR(6) NOT NULL,
    purpose     VARCHAR(20) NOT NULL,
    expires_at  TIMESTAMPTZ NOT NULL,
    used        BOOLEAN NOT NULL DEFAULT FALSE,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_vcode_phone ON verification_codes(phone, purpose);
