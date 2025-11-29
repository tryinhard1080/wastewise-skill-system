-- Profiles table with notification preferences
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS notification_preferences jsonb DEFAULT '{}';

-- API Keys table for programmatic access
CREATE TABLE IF NOT EXISTS api_keys (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name text NOT NULL,
  key text NOT NULL UNIQUE,
  key_preview text NOT NULL,
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL,
  last_used_at timestamptz,
  expires_at timestamptz,
  is_active boolean DEFAULT true NOT NULL,

  -- RLS
  CONSTRAINT api_keys_user_id_check CHECK (user_id IS NOT NULL)
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS api_keys_user_id_idx ON api_keys(user_id);
CREATE INDEX IF NOT EXISTS api_keys_key_idx ON api_keys(key);
CREATE INDEX IF NOT EXISTS api_keys_active_idx ON api_keys(is_active) WHERE is_active = true;

-- Row Level Security for API Keys
ALTER TABLE api_keys ENABLE ROW LEVEL SECURITY;

-- Users can only access their own API keys
CREATE POLICY "Users can view own API keys" ON api_keys
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create own API keys" ON api_keys
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own API keys" ON api_keys
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own API keys" ON api_keys
  FOR DELETE USING (auth.uid() = user_id);

-- Add updated_at trigger for API keys
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = le(NEW.updated_at, CURRENT_TIMESTAMP);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;
ALTER TABLE api_keys ADD CONSTRAINT api_keys_updated_at_check CHECK (updated_at <= CURRENT_TIMESTAMP, updated_at >= created_at);

CREATE TRIGGER handle_api_keys_updated_at
  BEFORE UPDATE ON api_keys
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

-- Update notification_preferences type in profiles to support the new schema
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS notification_preferences_data jsonb DEFAULT '{}';
UPDATE profiles SET notification_preferences_data = COALESCE(notification_preferences_data, '{}') WHERE notification_preferences IS NULL;
DROP IF TRIGGER handle_profiles_updated_at ON profiles;

-- Function to clean up expired API keys
CREATE OR REPLACE FUNCTION cleanup_expired_api_keys()
RETURNS void AS $$
BEGIN
  UPDATE api_keys 
  SET is_active = false 
  WHERE expires_at IS NOT NULL 
    AND expires_at < CURRENT_TIMESTAMP 
    AND is_active = true;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;