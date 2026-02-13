-- Create attachments table for task files

CREATE TABLE IF NOT EXISTS public.attachments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id UUID NOT NULL REFERENCES public.tasks(id) ON DELETE CASCADE,
  file_url TEXT NOT NULL,
  file_name TEXT NOT NULL,
  uploaded_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_attachments_task_id ON public.attachments(task_id);
CREATE INDEX IF NOT EXISTS idx_attachments_uploaded_at ON public.attachments(uploaded_at DESC);

ALTER TABLE public.attachments ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'attachments' AND policyname = 'Users can view own task attachments'
  ) THEN
    CREATE POLICY "Users can view own task attachments" ON public.attachments
      FOR SELECT USING (
        EXISTS (
          SELECT 1 FROM public.tasks t
          WHERE t.id = attachments.task_id
            AND (
              t.user_id = auth.uid()
              OR EXISTS (
                SELECT 1 FROM public.users u
                WHERE u.id = auth.uid() AND u.role = 'admin'
              )
            )
        )
      );
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'attachments' AND policyname = 'Users can create own task attachments'
  ) THEN
    CREATE POLICY "Users can create own task attachments" ON public.attachments
      FOR INSERT WITH CHECK (
        EXISTS (
          SELECT 1 FROM public.tasks t
          WHERE t.id = attachments.task_id
            AND t.user_id = auth.uid()
        )
      );
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'attachments' AND policyname = 'Users can delete own task attachments'
  ) THEN
    CREATE POLICY "Users can delete own task attachments" ON public.attachments
      FOR DELETE USING (
        EXISTS (
          SELECT 1 FROM public.tasks t
          WHERE t.id = attachments.task_id
            AND (
              t.user_id = auth.uid()
              OR EXISTS (
                SELECT 1 FROM public.users u
                WHERE u.id = auth.uid() AND u.role = 'admin'
              )
            )
        )
      );
  END IF;
END $$;
