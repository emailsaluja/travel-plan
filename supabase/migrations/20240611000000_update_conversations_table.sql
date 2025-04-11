-- First add the new columns
ALTER TABLE conversations 
ADD COLUMN buyer_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
ADD COLUMN seller_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_conversations_buyer_id ON conversations(buyer_id);
CREATE INDEX IF NOT EXISTS idx_conversations_seller_id ON conversations(seller_id);

-- Update existing conversations from conversation_participants if needed
-- This is a best-effort migration for existing data
UPDATE conversations c
SET 
    buyer_id = (
        SELECT cp.user_id 
        FROM conversation_participants cp
        JOIN conversation_participants cp2 ON cp.conversation_id = cp2.conversation_id AND cp.user_id <> cp2.user_id
        WHERE cp.conversation_id = c.id
        LIMIT 1
    ),
    seller_id = (
        SELECT cp2.user_id 
        FROM conversation_participants cp
        JOIN conversation_participants cp2 ON cp.conversation_id = cp2.conversation_id AND cp.user_id <> cp2.user_id
        WHERE cp.conversation_id = c.id
        LIMIT 1 OFFSET 1
    )
WHERE c.buyer_id IS NULL AND c.seller_id IS NULL;

-- If the foreign key constraint was causing problems, we can make itinerary_id nullable
ALTER TABLE conversations ALTER COLUMN itinerary_id DROP NOT NULL; 