-- Insert demo users
-- Note: These must be created via Supabase Auth first, then add to users table manually
-- For testing, use:
-- demo@example.com / demo123456
-- admin@example.com / admin123456

-- After creating auth users, insert into users table:
-- INSERT INTO users (id, email, full_name, role) VALUES
--   ('user-uuid-here', 'demo@example.com', 'Demo User', 'user'),
--   ('admin-uuid-here', 'admin@example.com', 'Admin User', 'admin');

-- Insert sample articles with educational IT news and images
INSERT INTO articles (title, content, excerpt, category_id, author_id, status, views, cover_image_url, created_at) 
SELECT 
  'Getting Started with AI Development: A Beginner\'s Guide',
  'Artificial Intelligence is reshaping the tech industry. Learn how to get started with AI development and build your first machine learning project. This comprehensive guide covers the basics of Python, popular frameworks like TensorFlow and PyTorch, and best practices for AI development. Discover how neural networks work, explore deep learning concepts, and understand supervised vs unsupervised learning. We''ll walk you through setting up your development environment, creating your first AI model, and deploying it to production.',
  'Discover how to begin your journey into artificial intelligence development with this beginner-friendly guide covering fundamentals, tools, and practical examples.',
  (SELECT id FROM categories WHERE slug = 'tutorial'),
  users.id,
  'published',
  245,
  'https://images.unsplash.com/photo-1677442d019d3a49dc433cf128d374885e308faba3107d5a27429e85ec3e4c32?w=800&q=80',
  NOW() - INTERVAL '5 days'
FROM users WHERE email = 'demo@example.com'
ON CONFLICT DO NOTHING;

INSERT INTO articles (title, content, excerpt, category_id, author_id, status, views, cover_image_url, created_at)
SELECT
  'Modern Web Development Trends 2026: What You Need to Know',
  'Explore the latest trends in web development including serverless architecture, edge computing, and modern JavaScript frameworks. The landscape of web development is constantly evolving. In 2026, we are seeing major shifts toward performance optimization, improved developer experience, and a focus on building sustainable and accessible web applications. This article covers emerging technologies like WebAssembly, progressive web apps, low-code/no-code solutions, and the continued rise of AI-assisted development. Stay ahead of the curve and understand what technologies will shape the future of web development.',
  'Learn about the cutting-edge technologies, frameworks, and best practices that are transforming web development in 2026 and beyond.',
  (SELECT id FROM categories WHERE slug = 'technology'),
  users.id,
  'published',
  403,
  'https://images.unsplash.com/photo-1633356122544-f134324ef6db?w=800&q=80',
  NOW() - INTERVAL '3 days'
FROM users WHERE email = 'demo@example.com'
ON CONFLICT DO NOTHING;

INSERT INTO articles (title, content, excerpt, category_id, author_id, status, views, cover_image_url, created_at)
SELECT
  'Digital Marketing Strategy for Startups: The Complete Roadmap',
  'Building an effective digital marketing strategy is crucial for startup success. Learn how to leverage social media, content marketing, and email campaigns to grow your startup without breaking the bank. This comprehensive guide covers customer acquisition, retention strategies, brand building, and measuring ROI. We explore practical tactics for utilizing platforms like LinkedIn, Twitter, Instagram, and email marketing. Discover how to create compelling content, build an engaged community, and track your marketing metrics effectively.',
  'A practical guide to creating an effective digital marketing strategy tailored for early-stage startups with limited budgets.',
  (SELECT id FROM categories WHERE slug = 'marketing'),
  users.id,
  'published',
  189,
  'https://images.unsplash.com/photo-1552664730-d307ca884978?w=800&q=80',
  NOW() - INTERVAL '7 days'
FROM users WHERE email = 'demo@example.com'
ON CONFLICT DO NOTHING;

INSERT INTO articles (title, content, excerpt, category_id, author_id, status, views, cover_image_url, created_at)
SELECT
  'Mastering Cloud Computing: AWS, Azure, and Google Cloud Fundamentals',
  'Understanding cloud computing is essential for modern software development. Learn about AWS, Google Cloud, and Azure and discover which platform is right for your needs. This in-depth guide covers infrastructure as a service (IaaS), platform as a service (PaaS), and software as a service (SaaS). We explore core services from each provider, cost optimization strategies, security best practices, and real-world use cases. Whether you''re building scalable applications, managing big data, or deploying machine learning models, cloud computing offers powerful solutions.',
  'A comprehensive introduction to cloud computing, major cloud service providers, and how to choose the best platform for your projects.',
  (SELECT id FROM categories WHERE slug = 'technology'),
  users.id,
  'published',
  534,
  'https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=800&q=80',
  NOW() - INTERVAL '1 day'
FROM users WHERE email = 'demo@example.com'
ON CONFLICT DO NOTHING;

INSERT INTO articles (title, content, excerpt, category_id, author_id, status, views, cover_image_url, created_at)
SELECT
  'Career Growth in Tech: Essential Skills for 2026',
  'Discover the essential skills you need to advance your career in technology. From soft skills to technical expertise, learn what employers are looking for and how to position yourself for success. This article covers in-demand programming languages, emerging technologies like AI and blockchain, leadership skills, and the importance of continuous learning. We discuss certification programs, networking strategies, mentorship, and how to build your personal brand in the tech industry. Whether you''re starting your tech career or aiming for a senior position, this guide provides actionable insights.',
  'Master the technical and soft skills that will accelerate your career growth and make you an attractive candidate to top tech companies.',
  (SELECT id FROM categories WHERE slug = 'career'),
  users.id,
  'published',
  367,
  'https://images.unsplash.com/photo-1552664730-d307ca884978?w=800&q=80',
  NOW() - INTERVAL '2 days'
FROM users WHERE email = 'demo@example.com'
ON CONFLICT DO NOTHING;

INSERT INTO articles (title, content, excerpt, category_id, author_id, status, views, cover_image_url, created_at)
SELECT
  'Cybersecurity Best Practices: Protecting Your Digital Assets',
  'In an increasingly digital world, cybersecurity is more important than ever. Learn essential strategies to protect your applications, data, and infrastructure from malicious attacks. This comprehensive guide covers password security, multi-factor authentication, encryption, network security, and incident response planning. We discuss common vulnerabilities like SQL injection, cross-site scripting, and CSRF attacks, and provide practical solutions. Explore security frameworks, compliance requirements like GDPR and CCPA, and the role of security testing in your development pipeline.',
  'Discover critical cybersecurity practices and strategies to safeguard your digital assets and ensure compliance with industry standards.',
  (SELECT id FROM categories WHERE slug = 'tutorial'),
  users.id,
  'published',
  412,
  'https://images.unsplash.com/photo-1614008375890-cb53b6c5f8d5?w=800&q=80',
  NOW() - INTERVAL '4 days'
FROM users WHERE email = 'demo@example.com'
ON CONFLICT DO NOTHING;
