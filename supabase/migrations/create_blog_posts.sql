-- Create enum for blog post categories
CREATE TYPE blog_category AS ENUM ('tips', 'guides', 'stories');

-- Create the blog_posts table
CREATE TABLE blog_posts (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    slug TEXT NOT NULL UNIQUE,
    content TEXT NOT NULL,
    excerpt TEXT NOT NULL,
    category blog_category NOT NULL,
    featured_image_url TEXT,
    reading_time_minutes INTEGER NOT NULL,
    comment_count INTEGER DEFAULT 0,
    is_featured BOOLEAN DEFAULT false,
    is_editors_pick BOOLEAN DEFAULT false,
    published_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index for faster lookups
CREATE INDEX blog_posts_user_id_idx ON blog_posts(user_id);
CREATE INDEX blog_posts_category_idx ON blog_posts(category);
CREATE INDEX blog_posts_published_at_idx ON blog_posts(published_at);

-- Enable Row Level Security
ALTER TABLE blog_posts ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Blog posts are viewable by everyone"
    ON blog_posts
    FOR SELECT
    USING (published_at IS NOT NULL);

CREATE POLICY "Users can insert their own blog posts"
    ON blog_posts
    FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own blog posts"
    ON blog_posts
    FOR UPDATE
    USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own blog posts"
    ON blog_posts
    FOR DELETE
    USING (auth.uid() = user_id);

-- Create a function to update the updated_at timestamp
CREATE OR REPLACE FUNCTION update_blog_posts_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create a trigger to automatically update the updated_at column
CREATE TRIGGER update_blog_posts_updated_at
    BEFORE UPDATE ON blog_posts
    FOR EACH ROW
    EXECUTE FUNCTION update_blog_posts_updated_at(); 