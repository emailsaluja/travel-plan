-- Drop existing tables and recreate
DROP TABLE IF EXISTS itinerary_answers CASCADE;
DROP TABLE IF EXISTS itinerary_questions CASCADE;

-- Create itinerary_questions table
CREATE TABLE itinerary_questions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    itinerary_id UUID REFERENCES premium_itineraries(id) ON DELETE CASCADE,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    question TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'unanswered' CHECK (status IN ('unanswered', 'answered')),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create itinerary_answers table
CREATE TABLE itinerary_answers (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    question_id UUID REFERENCES itinerary_questions(id) ON DELETE CASCADE,
    seller_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    answer TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes
CREATE INDEX idx_itinerary_questions_itinerary_id ON itinerary_questions(itinerary_id);
CREATE INDEX idx_itinerary_questions_user_id ON itinerary_questions(user_id);
CREATE INDEX idx_itinerary_questions_status ON itinerary_questions(status);
CREATE INDEX idx_itinerary_answers_question_id ON itinerary_answers(question_id);
CREATE INDEX idx_itinerary_answers_seller_id ON itinerary_answers(seller_id);

-- Enable Row Level Security
ALTER TABLE itinerary_questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE itinerary_answers ENABLE ROW LEVEL SECURITY;

-- Create policies for questions
CREATE POLICY "Anyone can view itinerary questions"
    ON itinerary_questions FOR SELECT
    USING (true);

CREATE POLICY "Users can create their own questions"
    ON itinerary_questions FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own questions"
    ON itinerary_questions FOR UPDATE
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own questions"
    ON itinerary_questions FOR DELETE
    USING (auth.uid() = user_id);

-- Create policies for answers
CREATE POLICY "Anyone can view answers"
    ON itinerary_answers FOR SELECT
    USING (true);

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

CREATE POLICY "Sellers can update their own answers"
    ON itinerary_answers FOR UPDATE
    USING (seller_id = auth.uid())
    WITH CHECK (seller_id = auth.uid());

CREATE POLICY "Sellers can delete their own answers"
    ON itinerary_answers FOR DELETE
    USING (seller_id = auth.uid());

-- Create functions to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_itinerary_questions_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE OR REPLACE FUNCTION update_itinerary_answers_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers to automatically update updated_at
CREATE TRIGGER update_itinerary_questions_updated_at
    BEFORE UPDATE ON itinerary_questions
    FOR EACH ROW
    EXECUTE FUNCTION update_itinerary_questions_updated_at();

CREATE TRIGGER update_itinerary_answers_updated_at
    BEFORE UPDATE ON itinerary_answers
    FOR EACH ROW
    EXECUTE FUNCTION update_itinerary_answers_updated_at(); 