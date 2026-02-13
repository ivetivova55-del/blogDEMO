-- Create storage bucket and policies for task attachments

INSERT INTO storage.buckets (id, name, public)
VALUES ('task-attachments', 'task-attachments', false)
ON CONFLICT (id) DO NOTHING;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'storage' AND tablename = 'objects' AND policyname = 'Users can view own task attachment objects'
  ) THEN
    CREATE POLICY "Users can view own task attachment objects"
      ON storage.objects
      FOR SELECT
      USING (
        bucket_id = 'task-attachments'
        AND (
          (storage.foldername(name))[1] = auth.uid()::text
          OR EXISTS (
            SELECT 1 FROM public.users u
            WHERE u.id = auth.uid() AND u.role = 'admin'
          )
        )
      );
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'storage' AND tablename = 'objects' AND policyname = 'Users can upload own task attachment objects'
  ) THEN
    CREATE POLICY "Users can upload own task attachment objects"
      ON storage.objects
      FOR INSERT
      WITH CHECK (
        bucket_id = 'task-attachments'
        AND (storage.foldername(name))[1] = auth.uid()::text
      );
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'storage' AND tablename = 'objects' AND policyname = 'Users can delete own task attachment objects'
  ) THEN
    CREATE POLICY "Users can delete own task attachment objects"
      ON storage.objects
      FOR DELETE
      USING (
        bucket_id = 'task-attachments'
        AND (
          (storage.foldername(name))[1] = auth.uid()::text
          OR EXISTS (
            SELECT 1 FROM public.users u
            WHERE u.id = auth.uid() AND u.role = 'admin'
          )
        )
      );
  END IF;
END $$;
