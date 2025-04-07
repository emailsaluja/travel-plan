-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Admins can do everything on seller_payouts" ON public.seller_payouts;
DROP POLICY IF EXISTS "Sellers can view their own payouts" ON public.seller_payouts;

-- Admins can do everything
CREATE POLICY "Admins can do everything on seller_payouts" ON public.seller_payouts
    FOR ALL
    USING (
        auth.uid() IN (
            SELECT user_id FROM public.admin_users
        )
    )
    WITH CHECK (
        auth.uid() IN (
            SELECT user_id FROM public.admin_users
        )
    );

-- Sellers can view only their own payouts
CREATE POLICY "Sellers can view their own payouts" ON public.seller_payouts
    FOR SELECT
    USING (
        auth.uid() = seller_id
    );

-- Alternatively, for testing, we can temporarily disable RLS for this table
-- This should be removed in production
-- ALTER TABLE public.seller_payouts DISABLE ROW LEVEL SECURITY;
