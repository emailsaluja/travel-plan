-- Check if buyer_id and seller_id columns exist
DO $$
BEGIN
    -- Add buyer_id if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'conversations' AND column_name = 'buyer_id'
    ) THEN
        ALTER TABLE conversations ADD COLUMN buyer_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;
        CREATE INDEX IF NOT EXISTS idx_conversations_buyer_id ON conversations(buyer_id);
    END IF;
    
    -- Add seller_id if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'conversations' AND column_name = 'seller_id'
    ) THEN
        ALTER TABLE conversations ADD COLUMN seller_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;
        CREATE INDEX IF NOT EXISTS idx_conversations_seller_id ON conversations(seller_id);
    END IF;
    
    -- Make itinerary_id nullable if it exists
    IF EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'conversations' AND column_name = 'itinerary_id'
    ) THEN
        ALTER TABLE conversations ALTER COLUMN itinerary_id DROP NOT NULL;
    END IF;
END$$; 