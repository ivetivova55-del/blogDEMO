-- Create categories table
CREATE TABLE IF NOT EXISTS categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL UNIQUE,
  slug VARCHAR(255) NOT NULL UNIQUE,
  description TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Enable RLS
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for categories
CREATE POLICY "Anyone can view categories" ON categories
  FOR SELECT USING (true);

CREATE POLICY "Only admins can create categories" ON categories
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Insert sample categories
INSERT INTO categories (name, slug, description) VALUES
  ('Technology', 'technology', 'Latest technology news and updates'),
  ('Marketing', 'marketing', 'Digital marketing strategies and trends'),
  ('Business', 'business', 'Business insights and analytics'),
  ('Career', 'career', 'Career advice and professional development'),
  ('Tutorial', 'tutorial', 'How-to guides and tutorials')
ON CONFLICT DO NOTHING;
