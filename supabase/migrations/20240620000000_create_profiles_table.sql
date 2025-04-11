-- Create user_profiles table if it doesn't exist
CREATE TABLE IF NOT EXISTS user_profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    username TEXT,
    full_name TEXT,
    email TEXT,
    bio TEXT,
    profile_picture_url TEXT,
    hero_banner_url TEXT,
    measurement_system TEXT DEFAULT 'metric',
    privacy_setting TEXT DEFAULT 'approved_only',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id)
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_user_profiles_user_id ON user_profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_user_profiles_username ON user_profiles(username);

-- Add RLS policies
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;

-- Everyone can read profiles
CREATE POLICY "Profiles are viewable by everyone" 
    ON user_profiles FOR SELECT 
    USING (true);

-- Users can insert their own profile
CREATE POLICY "Users can insert their own profile" 
    ON user_profiles FOR INSERT 
    WITH CHECK (auth.uid() = user_id);

-- Users can update their own profile
CREATE POLICY "Users can update their own profile" 
    ON user_profiles FOR UPDATE 
    USING (auth.uid() = user_id);

-- Migrate existing users to have profiles
INSERT INTO user_profiles (user_id, username, email)
SELECT id, id, email 
FROM auth.users
WHERE NOT EXISTS (
    SELECT 1 FROM user_profiles WHERE user_profiles.user_id = auth.users.id
); 