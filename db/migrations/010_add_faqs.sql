-- Create FAQ table + safe counters

CREATE TABLE IF NOT EXISTS public.faqs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  question TEXT NOT NULL,
  answer TEXT NOT NULL,
  category VARCHAR(50) NOT NULL DEFAULT 'tasks',
  tags TEXT[] NOT NULL DEFAULT '{}',
  views INTEGER NOT NULL DEFAULT 0,
  helpful_yes INTEGER NOT NULL DEFAULT 0,
  helpful_no INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

ALTER TABLE public.faqs ENABLE ROW LEVEL SECURITY;

-- Everyone can read FAQs
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'faqs' AND policyname = 'Anyone can view faqs'
  ) THEN
    CREATE POLICY "Anyone can view faqs" ON public.faqs
      FOR SELECT USING (true);
  END IF;
END $$;

-- Only admins can create/update/delete FAQ content
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'faqs' AND policyname = 'Admins can manage faqs'
  ) THEN
    CREATE POLICY "Admins can manage faqs" ON public.faqs
      FOR ALL
      USING (
        EXISTS (
          SELECT 1 FROM public.users u
          WHERE u.id = auth.uid() AND u.role = 'admin'
        )
      )
      WITH CHECK (
        EXISTS (
          SELECT 1 FROM public.users u
          WHERE u.id = auth.uid() AND u.role = 'admin'
        )
      );
  END IF;
END $$;

-- Safe counter increments via RPC (no direct UPDATE permissions needed)
CREATE OR REPLACE FUNCTION public.increment_faq_views(faq_id UUID)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.faqs
  SET views = views + 1,
      updated_at = now()
  WHERE id = faq_id;
END;
$$;

CREATE OR REPLACE FUNCTION public.vote_faq_helpful(faq_id UUID, is_yes BOOLEAN)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF is_yes THEN
    UPDATE public.faqs
    SET helpful_yes = helpful_yes + 1,
        updated_at = now()
    WHERE id = faq_id;
  ELSE
    UPDATE public.faqs
    SET helpful_no = helpful_no + 1,
        updated_at = now()
    WHERE id = faq_id;
  END IF;
END;
$$;

GRANT EXECUTE ON FUNCTION public.increment_faq_views(UUID) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.vote_faq_helpful(UUID, BOOLEAN) TO anon, authenticated;
