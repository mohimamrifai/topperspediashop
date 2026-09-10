ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS registration_ip text,
  ADD COLUMN IF NOT EXISTS last_seen_ip text;

CREATE INDEX IF NOT EXISTS profiles_registration_ip_idx ON profiles (registration_ip);
CREATE INDEX IF NOT EXISTS profiles_last_seen_ip_idx ON profiles (last_seen_ip);

-- Backfill IP registrasi dari sesi login paling awal (jika ada).
UPDATE profiles p
SET
  registration_ip = s.ip_address,
  last_seen_ip = COALESCE(p.last_seen_ip, latest.ip_address)
FROM (
  SELECT DISTINCT ON (user_id) user_id, ip_address
  FROM session
  WHERE ip_address IS NOT NULL AND ip_address <> ''
  ORDER BY user_id, created_at ASC
) s
LEFT JOIN (
  SELECT DISTINCT ON (user_id) user_id, ip_address
  FROM session
  WHERE ip_address IS NOT NULL AND ip_address <> ''
  ORDER BY user_id, created_at DESC
) latest ON latest.user_id = s.user_id
WHERE p.id = s.user_id
  AND p.registration_ip IS NULL;
