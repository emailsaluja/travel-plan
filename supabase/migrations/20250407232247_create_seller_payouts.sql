-- Create seller_payouts table
CREATE TABLE IF NOT EXISTS public.seller_payouts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    seller_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    amount DECIMAL(10, 2) NOT NULL,
    currency TEXT NOT NULL DEFAULT 'USD',
    status TEXT NOT NULL CHECK (status IN ('pending', 'completed', 'failed')),
    payment_method TEXT NOT NULL DEFAULT 'bank_transfer',
    reference TEXT,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add index for faster seller queries
CREATE INDEX IF NOT EXISTS seller_payouts_seller_id_idx ON public.seller_payouts (seller_id);

-- Add RLS policies
ALTER TABLE public.seller_payouts ENABLE ROW LEVEL SECURITY;

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

-- Create trigger for updated_at
CREATE OR REPLACE FUNCTION update_seller_payouts_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_seller_payouts_updated_at
BEFORE UPDATE ON public.seller_payouts
FOR EACH ROW
EXECUTE FUNCTION update_seller_payouts_updated_at();
