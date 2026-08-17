# Database Changes
## Supabase Script
bash
```
-- =====================================================
-- MarketFlip v2 — Phase 1: Data Foundation
-- =====================================================
-- This migration creates:
-- 1. categories table
-- 2. request_events table
-- 3. Extends profiles table
-- 4. Extends requests table
-- 5. Migrates existing category data
-- =====================================================

-- =====================================================
-- 1. CREATE categories TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    parent_category_id UUID REFERENCES categories(id),
    field_schema JSONB,
    created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_categories_parent_id ON categories(parent_category_id);
CREATE UNIQUE INDEX IF NOT EXISTS idx_categories_name_parent ON categories(name, COALESCE(parent_category_id, '00000000-0000-0000-0000-000000000000'));

-- =====================================================
-- RLS Policies for categories
-- =====================================================
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist (to make script re-runnable)
DROP POLICY IF EXISTS "Users can read categories" ON categories;

-- Read: All authenticated users can read
CREATE POLICY "Users can read categories" ON categories
    FOR SELECT
    TO authenticated
    USING (true);

-- Write: Service role only (no user write policies)

-- =====================================================
-- Insert default categories (based on existing POC data)
-- =====================================================
INSERT INTO categories (id, name, parent_category_id, field_schema) VALUES
    (gen_random_uuid(), 'Electronics', NULL, '{"brand": "text", "model": "text"}'::JSONB),
    (gen_random_uuid(), 'Furniture', NULL, '{"dimensions": "text", "material": "text"}'::JSONB),
    (gen_random_uuid(), 'Clothing', NULL, '{"size": "text", "color": "text", "brand": "text"}'::JSONB),
    (gen_random_uuid(), 'Books', NULL, '{"author": "text", "publisher": "text"}'::JSONB),
    (gen_random_uuid(), 'Home & Kitchen', NULL, NULL),
    (gen_random_uuid(), 'Beauty & Personal Care', NULL, NULL),
    (gen_random_uuid(), 'Sports & Fitness', NULL, NULL),
    (gen_random_uuid(), 'Toys & Games', NULL, NULL),
    (gen_random_uuid(), 'Automotive', NULL, NULL),
    (gen_random_uuid(), 'Pet Supplies', NULL, NULL)
ON CONFLICT DO NOTHING;

-- =====================================================
-- 2. CREATE request_events TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS request_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    request_id UUID NOT NULL REFERENCES requests(id) ON DELETE CASCADE,
    event_type TEXT NOT NULL CHECK (event_type IN (
        'viewed', 
        'bid_placed', 
        'selected', 
        'expired', 
        'completed', 
        'deleted',
        'bid_withdrawn',
        'bid_rejected',
        'purchased'
    )),
    actor_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
    metadata JSONB,
    created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_request_events_request_id ON request_events(request_id);
CREATE INDEX IF NOT EXISTS idx_request_events_actor_id ON request_events(actor_id);
CREATE INDEX IF NOT EXISTS idx_request_events_created_at ON request_events(created_at);
CREATE INDEX IF NOT EXISTS idx_request_events_event_type ON request_events(event_type);

-- =====================================================
-- RLS Policies for request_events
-- =====================================================
ALTER TABLE request_events ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist (to make script re-runnable)
DROP POLICY IF EXISTS "Users can read own events" ON request_events;
DROP POLICY IF EXISTS "Users can create own events" ON request_events;

-- Read: Users can read their own events only
CREATE POLICY "Users can read own events" ON request_events
    FOR SELECT
    TO authenticated
    USING (actor_id = auth.uid());

-- Insert: Users can insert events where they are the actor
CREATE POLICY "Users can create own events" ON request_events
    FOR INSERT
    TO authenticated
    WITH CHECK (actor_id = auth.uid());

-- No UPDATE or DELETE policies (events are immutable, service role only)

-- =====================================================
-- 3. EXTEND profiles TABLE
-- =====================================================
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS full_name TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS date_of_birth DATE;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS gender TEXT CHECK (gender IN ('male', 'female', 'other', 'prefer_not_to_say'));
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS profile_photo_url TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS bio TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS business_hours JSONB;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS years_in_business INTEGER;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS preferred_categories JSONB;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS avg_response_time_minutes INTEGER;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS total_transactions INTEGER DEFAULT 0;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS completed_transactions INTEGER DEFAULT 0;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS is_verified BOOLEAN DEFAULT false;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS last_active_at TIMESTAMPTZ;

-- Note: DOB, gender remain optional (not required)
-- Note: Existing profiles will have NULL for new columns initially

-- =====================================================
-- 4. EXTEND requests TABLE
-- =====================================================
ALTER TABLE requests ADD COLUMN IF NOT EXISTS views_count INTEGER DEFAULT 0;
ALTER TABLE requests ADD COLUMN IF NOT EXISTS urgency TEXT CHECK (urgency IN ('flexible', 'soon', 'urgent'));
ALTER TABLE requests ADD COLUMN IF NOT EXISTS preferred_contact_time TEXT;
ALTER TABLE requests ADD COLUMN IF NOT EXISTS delivery_confirmed_by_shop BOOLEAN DEFAULT NULL;
ALTER TABLE requests ADD COLUMN IF NOT EXISTS delivery_response_at TIMESTAMPTZ;
ALTER TABLE requests ADD COLUMN IF NOT EXISTS image_urls JSONB;
ALTER TABLE requests ADD COLUMN IF NOT EXISTS category_id UUID REFERENCES categories(id);

-- Create index for category_id
CREATE INDEX IF NOT EXISTS idx_requests_category_id ON requests(category_id);

-- =====================================================
-- 5. MIGRATE existing category data (Phase 1.5)
-- =====================================================
-- This migrates existing string categories to the new category_id reference
-- Uses the captured category_id variable directly for cleaner update
DO $$
DECLARE
    category_record RECORD;
    matching_category_id UUID;
BEGIN
    -- Iterate through distinct existing categories in requests
    FOR category_record IN 
        SELECT DISTINCT category FROM requests WHERE category IS NOT NULL
    LOOP
        -- Insert category if it doesn't exist in categories table
        INSERT INTO categories (name, created_at)
        SELECT category_record.category, now()
        WHERE NOT EXISTS (
            SELECT 1 FROM categories WHERE name = category_record.category AND parent_category_id IS NULL
        )
        RETURNING id INTO matching_category_id;
        
        -- If we inserted a new category or found an existing one, update the requests
        IF matching_category_id IS NOT NULL THEN
            UPDATE requests 
            SET category_id = matching_category_id
            WHERE category = category_record.category;
        ELSE
            -- Fallback: re-query if the INSERT didn't return an ID (race condition)
            -- This handles the case where the category was inserted by another concurrent transaction
            UPDATE requests 
            SET category_id = (SELECT id FROM categories WHERE name = category_record.category AND parent_category_id IS NULL)
            WHERE category = category_record.category;
        END IF;
    END LOOP;
END $$;

```