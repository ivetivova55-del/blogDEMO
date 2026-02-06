-- Insert demo users
-- Note: These must be created via Supabase Auth first, then add to users table manually
-- For testing, use:
-- demo@example.com / demo123456
-- admin@example.com / admin123456

-- After creating auth users, insert into users table:
-- INSERT INTO users (id, email, full_name, role) VALUES
--   ('user-uuid-here', 'demo@example.com', 'Demo User', 'user'),
--   ('admin-uuid-here', 'admin@example.com', 'Admin User', 'admin');

-- Insert sample articles
INSERT INTO articles (title, content, excerpt, category_id, author_id, status, views, created_at) 
SELECT 
  'Getting Started with AI Development',
  'Artificial Intelligence is reshaping the tech industry. Learn how to get started with AI development and build your first machine learning project. This comprehensive guide covers the basics of Python, popular frameworks, and best practices for AI development.',
  'Discover how to begin your journey into artificial intelligence development with this beginner-friendly guide.',
  (SELECT id FROM categories WHERE slug = 'tutorial'),
  users.id,
  'published',
  145,
  NOW() - INTERVAL '5 days'
FROM users WHERE email = 'demo@example.com'
ON CONFLICT DO NOTHING;

INSERT INTO articles (title, content, excerpt, category_id, author_id, status, views, created_at)
SELECT
  'Modern Web Development Trends 2026',
  'Explore the latest trends in web development including serverless architecture, edge computing, and modern JavaScript frameworks. Stay ahead of the curve and understand what technologies will shape the future of web development.',
  'Learn about the cutting-edge technologies and frameworks that are transforming web development in 2026.',
  (SELECT id FROM categories WHERE slug = 'technology'),
  users.id,
  'published',
  203,
  NOW() - INTERVAL '3 days'
FROM users WHERE email = 'demo@example.com'
ON CONFLICT DO NOTHING;

INSERT INTO articles (title, content, excerpt, category_id, author_id, status, views, created_at)
SELECT
  'Digital Marketing Strategy for Startups',
  'Building an effective digital marketing strategy is crucial for startup success. Learn how to leverage social media, content marketing, and email campaigns to grow your startup without breaking the bank.',
  'A practical guide to creating an effective digital marketing strategy tailored for early-stage startups.',
  (SELECT id FROM categories WHERE slug = 'marketing'),
  users.id,
  'published',
  89,
  NOW() - INTERVAL '7 days'
FROM users WHERE email = 'demo@example.com'
ON CONFLICT DO NOTHING;

INSERT INTO articles (title, content, excerpt, category_id, author_id, status, views, created_at)
SELECT
  'Career Growth in Tech: Skills You Need',
  'Discover the essential skills you need to advance your career in technology. From soft skills to technical expertise, learn what employers are looking for and how to position yourself for success.',
  'Master the skills that will accelerate your career growth in the technology industry.',
  (SELECT id FROM categories WHERE slug = 'career'),
  users.id,
  'published',
  167,
  NOW() - INTERVAL '2 days'
FROM users WHERE email = 'demo@example.com'
ON CONFLICT DO NOTHING;

INSERT INTO articles (title, content, excerpt, category_id, author_id, status, views, created_at)
SELECT
  'Cloud Computing Fundamentals',
  'Understand the basics of cloud computing and how it can benefit your business. Learn about AWS, Google Cloud, and Azure, and discover which platform is right for your needs.',
  'A comprehensive introduction to cloud computing and the major cloud service providers.',
  (SELECT id FROM categories WHERE slug = 'technology'),
  users.id,
  'published',
  234,
  NOW() - INTERVAL '1 day'
FROM users WHERE email = 'demo@example.com'
ON CONFLICT DO NOTHING;
