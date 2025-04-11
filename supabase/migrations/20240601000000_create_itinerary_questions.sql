-- Create tables if they don't exist
DO $$ 
BEGIN
    -- Create itinerary_questions table if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM pg_tables WHERE tablename = 'itinerary_questions') THEN
        CREATE TABLE itinerary_questions (
            id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
            itinerary_id UUID REFERENCES premium_itineraries(id) ON DELETE CASCADE,
            user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
            question TEXT NOT NULL,
            status TEXT NOT NULL DEFAULT 'unanswered' CHECK (status IN ('unanswered', 'answered')),
            created_at TIMESTAMPTZ DEFAULT NOW(),
            updated_at TIMESTAMPTZ DEFAULT NOW()
        );

        -- Create indexes for itinerary_questions
        CREATE INDEX idx_itinerary_questions_itinerary_id ON itinerary_questions(itinerary_id);
        CREATE INDEX idx_itinerary_questions_user_id ON itinerary_questions(user_id);
        CREATE INDEX idx_itinerary_questions_status ON itinerary_questions(status);

        -- Enable RLS for itinerary_questions
        ALTER TABLE itinerary_questions ENABLE ROW LEVEL SECURITY;

        -- Create trigger for itinerary_questions
        CREATE OR REPLACE FUNCTION update_itinerary_questions_updated_at()
        RETURNS TRIGGER AS $$
        BEGIN
            NEW.updated_at = NOW();
            RETURN NEW;
        END;
        $$ language 'plpgsql';

        CREATE TRIGGER update_itinerary_questions_updated_at
            BEFORE UPDATE ON itinerary_questions
            FOR EACH ROW
            EXECUTE FUNCTION update_itinerary_questions_updated_at();
    END IF;

    -- Create itinerary_answers table if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM pg_tables WHERE tablename = 'itinerary_answers') THEN
        CREATE TABLE itinerary_answers (
            id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
            question_id UUID REFERENCES itinerary_questions(id) ON DELETE CASCADE,
            seller_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
            answer TEXT NOT NULL,
            created_at TIMESTAMPTZ DEFAULT NOW(),
            updated_at TIMESTAMPTZ DEFAULT NOW()
        );

        -- Create indexes for itinerary_answers
        CREATE INDEX idx_itinerary_answers_question_id ON itinerary_answers(question_id);
        CREATE INDEX idx_itinerary_answers_seller_id ON itinerary_answers(seller_id);

        -- Enable RLS for itinerary_answers
        ALTER TABLE itinerary_answers ENABLE ROW LEVEL SECURITY;

        -- Create trigger for itinerary_answers
        CREATE OR REPLACE FUNCTION update_itinerary_answers_updated_at()
        RETURNS TRIGGER AS $$
        BEGIN
            NEW.updated_at = NOW();
            RETURN NEW;
        END;
        $$ language 'plpgsql';

        CREATE TRIGGER update_itinerary_answers_updated_at
            BEFORE UPDATE ON itinerary_answers
            FOR EACH ROW
            EXECUTE FUNCTION update_itinerary_answers_updated_at();
    END IF;
END $$;

-- Create policies if they don't exist
DO $$
BEGIN
    -- Policies for itinerary_questions
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'itinerary_questions' AND policyname = 'Anyone can view itinerary questions') THEN
        CREATE POLICY "Anyone can view itinerary questions"
            ON itinerary_questions FOR SELECT
            USING (true);
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'itinerary_questions' AND policyname = 'Users can create their own questions') THEN
        CREATE POLICY "Users can create their own questions"
            ON itinerary_questions FOR INSERT
            WITH CHECK (auth.uid() = user_id);
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'itinerary_questions' AND policyname = 'Users can update their own questions') THEN
        CREATE POLICY "Users can update their own questions"
            ON itinerary_questions FOR UPDATE
            USING (auth.uid() = user_id)
            WITH CHECK (auth.uid() = user_id);
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'itinerary_questions' AND policyname = 'Users can delete their own questions') THEN
        CREATE POLICY "Users can delete their own questions"
            ON itinerary_questions FOR DELETE
            USING (auth.uid() = user_id);
    END IF;

    -- Policies for itinerary_answers
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'itinerary_answers' AND policyname = 'Anyone can view answers') THEN
        CREATE POLICY "Anyone can view answers"
            ON itinerary_answers FOR SELECT
            USING (true);
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'itinerary_answers' AND policyname = 'Sellers can create answers to questions on their itineraries') THEN
        CREATE POLICY "Sellers can create answers to questions on their itineraries"
            ON itinerary_answers FOR INSERT
            WITH CHECK (
                EXISTS (
                    SELECT 1 FROM itinerary_questions q
                    JOIN premium_itineraries p ON q.itinerary_id = p.id
                    WHERE q.id = itinerary_answers.question_id
                    AND p.user_id = auth.uid()
                )
            );
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'itinerary_answers' AND policyname = 'Sellers can update their own answers') THEN
        CREATE POLICY "Sellers can update their own answers"
            ON itinerary_answers FOR UPDATE
            USING (seller_id = auth.uid())
            WITH CHECK (seller_id = auth.uid());
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'itinerary_answers' AND policyname = 'Sellers can delete their own answers') THEN
        CREATE POLICY "Sellers can delete their own answers"
            ON itinerary_answers FOR DELETE
            USING (seller_id = auth.uid());
    END IF;
END $$; 