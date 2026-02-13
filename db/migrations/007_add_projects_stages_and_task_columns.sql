-- Create projects and project stages, and align tasks with project workflow

CREATE TABLE IF NOT EXISTS public.projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(user_id, name)
);

CREATE TABLE IF NOT EXISTS public.project_stages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  name VARCHAR(80) NOT NULL,
  position INTEGER NOT NULL DEFAULT 1,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(project_id, name),
  UNIQUE(project_id, position)
);

ALTER TABLE public.tasks
  ADD COLUMN IF NOT EXISTS project_id UUID REFERENCES public.projects(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS stage_id UUID REFERENCES public.project_stages(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS status VARCHAR(50) DEFAULT 'not_started',
  ADD COLUMN IF NOT EXISTS deadline TIMESTAMPTZ;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'tasks_status_check'
  ) THEN
    ALTER TABLE public.tasks
      ADD CONSTRAINT tasks_status_check
      CHECK (status IN ('not_started', 'in_progress', 'done'));
  END IF;
END $$;

UPDATE public.tasks
SET deadline = COALESCE(deadline, due_date)
WHERE deadline IS NULL;

UPDATE public.tasks
SET status = CASE WHEN completed THEN 'done' ELSE 'not_started' END
WHERE status IS NULL OR status = '';

CREATE INDEX IF NOT EXISTS idx_projects_user_id ON public.projects(user_id);
CREATE INDEX IF NOT EXISTS idx_project_stages_project_id ON public.project_stages(project_id);
CREATE INDEX IF NOT EXISTS idx_tasks_project_id ON public.tasks(project_id);
CREATE INDEX IF NOT EXISTS idx_tasks_stage_id ON public.tasks(stage_id);
CREATE INDEX IF NOT EXISTS idx_tasks_status ON public.tasks(status);
CREATE INDEX IF NOT EXISTS idx_tasks_deadline ON public.tasks(deadline);

ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.project_stages ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'projects' AND policyname = 'Users can view own projects'
  ) THEN
    CREATE POLICY "Users can view own projects" ON public.projects
      FOR SELECT USING (
        auth.uid() = user_id OR EXISTS (
          SELECT 1 FROM public.users u WHERE u.id = auth.uid() AND u.role = 'admin'
        )
      );
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'projects' AND policyname = 'Users can create own projects'
  ) THEN
    CREATE POLICY "Users can create own projects" ON public.projects
      FOR INSERT WITH CHECK (auth.uid() = user_id);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'projects' AND policyname = 'Users can update own projects'
  ) THEN
    CREATE POLICY "Users can update own projects" ON public.projects
      FOR UPDATE USING (
        auth.uid() = user_id OR EXISTS (
          SELECT 1 FROM public.users u WHERE u.id = auth.uid() AND u.role = 'admin'
        )
      );
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'projects' AND policyname = 'Users can delete own projects'
  ) THEN
    CREATE POLICY "Users can delete own projects" ON public.projects
      FOR DELETE USING (
        auth.uid() = user_id OR EXISTS (
          SELECT 1 FROM public.users u WHERE u.id = auth.uid() AND u.role = 'admin'
        )
      );
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'project_stages' AND policyname = 'Users can view own project stages'
  ) THEN
    CREATE POLICY "Users can view own project stages" ON public.project_stages
      FOR SELECT USING (
        EXISTS (
          SELECT 1 FROM public.projects p
          WHERE p.id = project_stages.project_id
            AND (
              p.user_id = auth.uid() OR EXISTS (
                SELECT 1 FROM public.users u WHERE u.id = auth.uid() AND u.role = 'admin'
              )
            )
        )
      );
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'project_stages' AND policyname = 'Users can create own project stages'
  ) THEN
    CREATE POLICY "Users can create own project stages" ON public.project_stages
      FOR INSERT WITH CHECK (
        EXISTS (
          SELECT 1 FROM public.projects p
          WHERE p.id = project_stages.project_id
            AND p.user_id = auth.uid()
        )
      );
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'project_stages' AND policyname = 'Users can update own project stages'
  ) THEN
    CREATE POLICY "Users can update own project stages" ON public.project_stages
      FOR UPDATE USING (
        EXISTS (
          SELECT 1 FROM public.projects p
          WHERE p.id = project_stages.project_id
            AND (
              p.user_id = auth.uid() OR EXISTS (
                SELECT 1 FROM public.users u WHERE u.id = auth.uid() AND u.role = 'admin'
              )
            )
        )
      );
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'project_stages' AND policyname = 'Users can delete own project stages'
  ) THEN
    CREATE POLICY "Users can delete own project stages" ON public.project_stages
      FOR DELETE USING (
        EXISTS (
          SELECT 1 FROM public.projects p
          WHERE p.id = project_stages.project_id
            AND (
              p.user_id = auth.uid() OR EXISTS (
                SELECT 1 FROM public.users u WHERE u.id = auth.uid() AND u.role = 'admin'
              )
            )
        )
      );
  END IF;
END $$;
