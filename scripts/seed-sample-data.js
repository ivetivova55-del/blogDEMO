import { createClient } from '@supabase/supabase-js';
import fs from 'node:fs';
import path from 'node:path';

const SAMPLE_USERS = [
  { email: 'svi@gmail.com', password: 'pass123', fullName: 'Svi Marketer' },
  { email: 'maria@gmail.com', password: 'pass123', fullName: 'Maria Petrova' },
  { email: 'peter@gmail.com', password: 'pass123', fullName: 'Peter Ivanov' },
];

const PROJECT_DEFINITIONS = [
  {
    ownerEmail: 'svi@gmail.com',
    name: 'Q2 SEO Content Sprint',
    description: 'SEO articles, keyword research, and landing-page optimization for Q2.',
  },
  {
    ownerEmail: 'maria@gmail.com',
    name: 'Email Nurture Revamp',
    description: 'Refresh drip sequences, subject lines, and conversion-focused automations.',
  },
  {
    ownerEmail: 'peter@gmail.com',
    name: 'Social Ads Optimization',
    description: 'Improve ROAS with better creatives, audiences, and budget allocation.',
  },
  {
    ownerEmail: 'maria@gmail.com',
    name: 'Blog Authority Buildout',
    description: 'Increase organic visibility with pillar pages and interlinking strategy.',
  },
];

const DEFAULT_STAGES = [
  { name: 'Not Started', position: 1 },
  { name: 'In Progress', position: 2 },
  { name: 'Done', position: 3 },
];

const TASK_BLUEPRINTS = [
  { title: 'Define campaign goals', stage: 'Not Started', priority: 'high' },
  { title: 'Collect baseline metrics', stage: 'Not Started', priority: 'medium' },
  { title: 'Create work breakdown', stage: 'Not Started', priority: 'medium' },
  { title: 'Prepare asset checklist', stage: 'Not Started', priority: 'low' },
  { title: 'Draft first deliverable', stage: 'In Progress', priority: 'high' },
  { title: 'Review competitor examples', stage: 'In Progress', priority: 'medium' },
  { title: 'Align with stakeholder feedback', stage: 'In Progress', priority: 'medium' },
  { title: 'Run quality assurance pass', stage: 'In Progress', priority: 'high' },
  { title: 'Publish final deliverable', stage: 'Done', priority: 'high' },
  { title: 'Document key learnings', stage: 'Done', priority: 'low' },
  { title: 'Archive resources and notes', stage: 'Done', priority: 'low' },
];

const STATUS_BY_STAGE = {
  'Not Started': ['not_started', 'open', 'IDEAS'],
  'In Progress': ['in_progress', 'open', 'IN_PROGRESS'],
  Done: ['done', 'completed', 'DONE'],
};

function loadLocalEnv() {
  const envPath = path.resolve(process.cwd(), '.env');
  if (!fs.existsSync(envPath)) return;

  const content = fs.readFileSync(envPath, 'utf8');
  content.split(/\r?\n/).forEach((line) => {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) return;

    const index = trimmed.indexOf('=');
    if (index === -1) return;

    const key = trimmed.slice(0, index).trim();
    const rawValue = trimmed.slice(index + 1).trim();
    const value = rawValue.replace(/^['"]|['"]$/g, '');

    if (key && !(key in process.env)) {
      process.env[key] = value;
    }
  });
}

function getEnv(nameList) {
  for (const name of nameList) {
    if (process.env[name]) return process.env[name];
  }
  return null;
}

function isMissingRelationError(error) {
  const message = [error?.message, error?.details, error?.hint, error?.code]
    .filter(Boolean)
    .join(' ')
    .toLowerCase();
  return (
    message.includes('does not exist') ||
    message.includes('relation') ||
    message.includes('could not find the table') ||
    message.includes('schema cache')
  );
}

function isMissingColumnError(error) {
  const message = (error?.message || '').toLowerCase();
  return message.includes('column') && message.includes('does not exist');
}

function isDuplicateAuthError(error) {
  const message = (error?.message || '').toLowerCase();
  return (
    message.includes('already been registered') ||
    message.includes('already registered') ||
    message.includes('duplicate')
  );
}

async function hasTable(supabase, tableName) {
  const { error } = await supabase.from(tableName).select('id', { head: true, count: 'exact' }).limit(1);
  if (!error) return true;
  if (isMissingRelationError(error)) return false;
  throw error;
}

async function hasColumn(supabase, tableName, columnName) {
  const { error } = await supabase.from(tableName).select(columnName).limit(1);
  if (!error) return true;
  if (isMissingColumnError(error)) return false;
  if (isMissingRelationError(error)) return false;
  throw error;
}

async function findAuthUserByEmail(supabase, email) {
  let page = 1;
  const perPage = 200;

  while (true) {
    const { data, error } = await supabase.auth.admin.listUsers({ page, perPage });
    if (error) throw error;

    const users = data?.users || [];
    const found = users.find((user) => user.email?.toLowerCase() === email.toLowerCase());
    if (found) return found;

    if (users.length < perPage) return null;
    page += 1;
  }
}

async function ensureAuthUser(supabase, { email, password, fullName }) {
  const createResult = await supabase.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { full_name: fullName },
  });

  if (!createResult.error && createResult.data?.user) {
    return createResult.data.user;
  }

  if (!isDuplicateAuthError(createResult.error)) {
    throw createResult.error;
  }

  const existing = await findAuthUserByEmail(supabase, email);
  if (!existing) {
    throw new Error(`Auth user exists but could not be fetched: ${email}`);
  }

  const { data, error } = await supabase.auth.admin.updateUserById(existing.id, {
    password,
    email_confirm: true,
    user_metadata: { full_name: fullName },
  });

  if (error) throw error;
  return data.user;
}

async function upsertPublicUserTables(supabase, authUser, fullName) {
  const usersTableExists = await hasTable(supabase, 'users').catch((error) => {
    if (isMissingRelationError(error)) return false;
    throw error;
  });

  if (usersTableExists) {
    try {
      const { error } = await supabase.from('users').upsert(
        [
          {
            id: authUser.id,
            email: authUser.email,
            full_name: fullName,
            role: 'user',
          },
        ],
        { onConflict: 'id' }
      );
      if (error) {
        if (isMissingRelationError(error)) return;
        throw error;
      }
    } catch (error) {
      if (!isMissingRelationError(error)) throw error;
    }
  }

  const profilesTableExists = await hasTable(supabase, 'profiles').catch((error) => {
    if (isMissingRelationError(error)) return false;
    throw error;
  });

  if (profilesTableExists) {
    try {
      const { error } = await supabase.from('profiles').upsert(
        [
          {
            id: authUser.id,
            email: authUser.email,
            full_name: fullName,
            role: 'user',
          },
        ],
        { onConflict: 'id' }
      );
      if (error) {
        if (isMissingRelationError(error)) return;
        throw error;
      }
    } catch (error) {
      if (!isMissingRelationError(error)) throw error;
    }
  }
}

async function ensureProject(supabase, project) {
  const { data: existing, error: selectError } = await supabase
    .from('projects')
    .select('id, name')
    .eq('user_id', project.user_id)
    .eq('name', project.name)
    .maybeSingle();

  if (selectError) throw selectError;
  if (existing) return existing;

  const { data, error } = await supabase
    .from('projects')
    .insert([project])
    .select('id, name')
    .single();

  if (error) throw error;
  return data;
}

async function ensureStage(supabase, tableName, stagePayload) {
  const { data: existing, error: selectError } = await supabase
    .from(tableName)
    .select('id, name')
    .eq('project_id', stagePayload.project_id)
    .eq('name', stagePayload.name)
    .maybeSingle();

  if (selectError) throw selectError;
  if (existing) return existing;

  const { data, error } = await supabase
    .from(tableName)
    .insert([stagePayload])
    .select('id, name')
    .single();

  if (error) throw error;
  return data;
}

async function taskExists(supabase, userId, projectId, title) {
  const query = supabase
    .from('tasks')
    .select('id')
    .eq('user_id', userId)
    .eq('title', title);

  if (projectId) {
    query.eq('project_id', projectId);
  }

  const { data, error } = await query.limit(1);
  if (error) throw error;
  return Boolean(data?.length);
}

async function insertTaskWithFallback(supabase, basePayload, supports) {
  const statusCandidates = basePayload.stageName
    ? STATUS_BY_STAGE[basePayload.stageName] || ['not_started', 'open', 'IDEAS']
    : ['not_started', 'open', 'IDEAS'];

  const payloadTemplate = {
    user_id: basePayload.user_id,
    title: basePayload.title,
    description: basePayload.description,
  };

  if (supports.taskProjectId && basePayload.project_id) {
    payloadTemplate.project_id = basePayload.project_id;
  }

  if (supports.taskPriority && basePayload.priority) {
    payloadTemplate.priority = basePayload.priority;
  }

  if (supports.taskDeadline && basePayload.deadline) {
    payloadTemplate.deadline = basePayload.deadline;
  }

  if (supports.taskDueDate && basePayload.deadline) {
    payloadTemplate.due_date = basePayload.deadline;
  }

  if (supports.taskStageId && basePayload.stage_id) {
    payloadTemplate.stage_id = basePayload.stage_id;
  }

  const attempts = [];

  if (supports.taskStatus) {
    statusCandidates.forEach((status) => {
      attempts.push({ ...payloadTemplate, status });
    });
  }

  if (supports.taskCompleted) {
    attempts.push({
      ...payloadTemplate,
      completed: basePayload.stageName === 'Done',
    });
  }

  if (!attempts.length) {
    attempts.push(payloadTemplate);
  }

  let lastError = null;
  for (const payload of attempts) {
    const { error } = await supabase.from('tasks').insert([payload]);
    if (!error) return;
    lastError = error;
  }

  throw lastError || new Error('Unable to insert task');
}

function buildTaskPayloads(projectName) {
  const projectPrefix = projectName.split(' ').slice(0, 2).join(' ');

  return TASK_BLUEPRINTS.map((template, index) => {
    const dayOffset = 2 + index * 2;
    const deadline = new Date();
    deadline.setDate(deadline.getDate() + dayOffset);

    return {
      title: `${projectPrefix}: ${template.title}`,
      description: `Task ${index + 1} for ${projectName}.`,
      stageName: template.stage,
      priority: template.priority,
      deadline: deadline.toISOString(),
    };
  });
}

async function main() {
  loadLocalEnv();

  const supabaseUrl = getEnv(['SUPABASE_URL', 'VITE_SUPABASE_URL']);
  const serviceRoleKey = getEnv([
    'SUPABASE_SERVICE_ROLE_KEY',
    'SERVICE_ROLE_KEY',
    'VITE_SUPABASE_SERVICE_ROLE_KEY',
  ]);

  if (!supabaseUrl || !serviceRoleKey) {
    throw new Error(
      'Missing Supabase credentials. Required: SUPABASE_URL (or VITE_SUPABASE_URL) and SUPABASE_SERVICE_ROLE_KEY.'
    );
  }

  const supabase = createClient(supabaseUrl, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });

  const projectsTableExists = await hasTable(supabase, 'projects');
  const tasksTableExists = await hasTable(supabase, 'tasks');

  if (!projectsTableExists) {
    throw new Error('Missing public.projects table. Create it before running this seed script.');
  }

  if (!tasksTableExists) {
    throw new Error('Missing public.tasks table. Create it before running this seed script.');
  }

  const stageTableCandidates = ['project_stages', 'stages'];
  let stageTableName = null;
  for (const candidate of stageTableCandidates) {
    if (await hasTable(supabase, candidate)) {
      stageTableName = candidate;
      break;
    }
  }

  const supports = {
    taskProjectId: await hasColumn(supabase, 'tasks', 'project_id'),
    taskStatus: await hasColumn(supabase, 'tasks', 'status'),
    taskPriority: await hasColumn(supabase, 'tasks', 'priority'),
    taskDeadline: await hasColumn(supabase, 'tasks', 'deadline'),
    taskDueDate: await hasColumn(supabase, 'tasks', 'due_date'),
    taskCompleted: await hasColumn(supabase, 'tasks', 'completed'),
    taskStageId: await hasColumn(supabase, 'tasks', 'stage_id'),
  };

  const userMap = new Map();

  console.log('Seeding sample auth users...');
  for (const sampleUser of SAMPLE_USERS) {
    const authUser = await ensureAuthUser(supabase, sampleUser);
    await upsertPublicUserTables(supabase, authUser, sampleUser.fullName);
    userMap.set(sampleUser.email, authUser);
    console.log(`- user ready: ${sampleUser.email}`);
  }

  let insertedProjects = 0;
  let insertedStages = 0;
  let insertedTasks = 0;

  console.log('Seeding projects, stages, and tasks...');

  for (const projectDefinition of PROJECT_DEFINITIONS) {
    const owner = userMap.get(projectDefinition.ownerEmail);
    if (!owner) {
      throw new Error(`Owner not found for project: ${projectDefinition.name}`);
    }

    const projectRecord = await ensureProject(supabase, {
      user_id: owner.id,
      name: projectDefinition.name,
      description: projectDefinition.description,
    });

    insertedProjects += 1;

    const stagesByName = new Map();
    if (stageTableName) {
      for (const stage of DEFAULT_STAGES) {
        const stageRecord = await ensureStage(supabase, stageTableName, {
          project_id: projectRecord.id,
          name: stage.name,
          position: stage.position,
        });
        stagesByName.set(stage.name, stageRecord.id);
        insertedStages += 1;
      }
    }

    const taskPayloads = buildTaskPayloads(projectDefinition.name);

    for (const task of taskPayloads) {
      const exists = await taskExists(
        supabase,
        owner.id,
        supports.taskProjectId ? projectRecord.id : null,
        task.title
      );

      if (exists) continue;

      await insertTaskWithFallback(
        supabase,
        {
          user_id: owner.id,
          project_id: projectRecord.id,
          stage_id: stagesByName.get(task.stageName) || null,
          title: task.title,
          description: task.description,
          deadline: task.deadline,
          priority: task.priority,
          stageName: task.stageName,
        },
        supports
      );

      insertedTasks += 1;
    }
  }

  console.log('Seed complete.');
  console.log(`Projects processed: ${insertedProjects}`);
  console.log(`Stages processed: ${insertedStages}`);
  console.log(`Tasks inserted: ${insertedTasks}`);
  console.log('Sample user credentials: svi@gmail.com, maria@gmail.com, peter@gmail.com / pass123');
}

main().catch((error) => {
  console.error('Seed failed:', error.message || error);
  process.exitCode = 1;
});
