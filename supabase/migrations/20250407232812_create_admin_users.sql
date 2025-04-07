-- Create admin_users table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.admin_users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id)
);

-- For testing purposes, temporarily add a simpler policy to allow access to seller_payouts
DROP POLICY IF EXISTS "Admins can do everything on seller_payouts" ON public.seller_payouts;
DROP POLICY IF EXISTS "Anyone can manage seller_payouts" ON public.seller_payouts;

-- This is a temporary policy for testing - in production use the admin_users table instead
CREATE POLICY "Anyone can manage seller_payouts" ON public.seller_payouts
    FOR ALL 
    USING (auth.role() = 'authenticated')
    WITH CHECK (auth.role() = 'authenticated');

-- Comment out this policy for now and uncomment in production
-- CREATE POLICY "Admins can do everything on seller_payouts" ON public.seller_payouts
--     FOR ALL
--     USING (
--         auth.uid() IN (
--             SELECT user_id FROM public.admin_users
--         )
--     )
--     WITH CHECK (
--         auth.uid() IN (
--             SELECT user_id FROM public.admin_users
--         )
--     );
