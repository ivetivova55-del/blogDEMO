import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseAnonKey);

// SEO/Content Sprint specific tasks
const SEO_SPRINT_TASKS = [
  {
    title: 'SEO audit - competitor analysis',
    description: 'Analyze top 10 competitors for keywords, backlinks, and content strategy',
    priority: 'high',
    daysFromNow: 5,
  },
  {
    title: 'Keyword research and clustering',
    description: 'Research 50+ keywords, group them into clusters with search volume and intent',
    priority: 'high',
    daysFromNow: 7,
  },
  {
    title: 'Create pillar content outline',
    description: 'Design pillar pages for main keyword clusters with supporting articles',
    priority: 'high',
    daysFromNow: 10,
  },
  {
    title: 'Technical SEO audit',
    description: 'Check site speed, mobile responsiveness, crawlability, and schema markup',
    priority: 'medium',
    daysFromNow: 8,
  },
  {
    title: 'Internal linking strategy',
    description: 'Plan internal linking structure to distribute authority and improve crawl depth',
    priority: 'medium',
    daysFromNow: 12,
  },
  {
    title: 'Write pillar page content',
    description: '3000+ word comprehensive guide for primary keyword cluster',
    priority: 'high',
    daysFromNow: 20,
  },
  {
    title: 'Create supporting blog posts',
    description: 'Write 5 blog posts targeting secondary and long-tail keywords (1500-2000 words each)',
    priority: 'medium',
    daysFromNow: 25,
  },
  {
    title: 'Meta description optimization',
    description: 'Optimize meta descriptions for all pages with focus on CTR improvement',
    priority: 'medium',
    daysFromNow: 18,
  },
  {
    title: 'Landing page optimization',
    description: 'Enhance landing pages with targeted keywords, clear CTA, and schema markup',
    priority: 'high',
    daysFromNow: 22,
  },
  {
    title: 'Backlink research',
    description: 'Identify 20+ high-quality backlink opportunities in industry publications',
    priority: 'medium',
    daysFromNow: 15,
  },
  {
    title: 'Outreach for guest posts',
    description: 'Create outreach templates and contact 30+ relevant websites',
    priority: 'medium',
    daysFromNow: 28,
  },
  {
    title: 'Site speed optimization',
    description: 'Implement caching, compress images, minify CSS/JS, optimize server response time',
    priority: 'high',
    daysFromNow: 16,
  },
  {
    title: 'Mobile usability testing',
    description: 'Test all pages and forms on mobile devices, fix responsive issues',
    priority: 'medium',
    daysFromNow: 17,
  },
  {
    title: 'Content calendar planning',
    description: 'Plan editorial calendar for next 6 months with publishing schedule',
    priority: 'low',
    daysFromNow: 14,
  },
  {
    title: 'Schema markup implementation',
    description: 'Add structured data for articles, products, FAQs, and organization',
    priority: 'medium',
    daysFromNow: 19,
  },
  {
    title: 'Track and report metrics',
    description: 'Setup Google Analytics, Search Console, and create monthly reporting dashboard',
    priority: 'low',
    daysFromNow: 30,
  },
];

async function addSprintTasks() {
  try {
    console.log('🔍 Finding admin user and Q2 SEO Content Sprint2 project...\n');

    // Sign in as admin to have proper auth context
    const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
      email: 'admin@digiquill.com',
      password: 'pass123',
    });

    if (signInError || !signInData.user) {
      console.error('❌ Could not sign in as admin:', signInError?.message);
      return;
    }

    const adminUser = signInData.user;
    console.log('✅ Signed in as admin user:', adminUser.id);

    // Get all projects first
    const { data: allProjects } = await supabase
      .from('projects')
      .select('id, name, user_id');

    console.log('\n📋 Available projects:');
    if (allProjects && allProjects.length > 0) {
      allProjects.forEach(p => console.log(`   - ${p.name}`));
    } else {
      console.log('   (none found)');
    }

    // Get the project
    const { data: projectList, error: projectError } = await supabase
      .from('projects')
      .select('id, name')
      .or("name.ilike.%Q2 SEO Content Sprint%");

    if (projectError) {
      console.error('❌ Error querying projects:', projectError.message);
      return;
    }

    let project;
    if (!projectList || projectList.length === 0) {
      // Create the project if it doesn't exist
      console.log('\n📝 Project not found. Creating "Q2 SEO Content Sprint2"...');
      
      const { data: newProject, error: createError } = await supabase
        .from('projects')
        .insert([
          {
            user_id: adminUser.id,
            name: 'Q2 SEO Content Sprint2',
            description: 'SEO articles, keyword research, and landing-page optimization for Q2.',
          }
        ])
        .select()
        .single();

      if (createError) {
        console.error('❌ Error creating project:', createError.message);
        return;
      }

      project = newProject;
      console.log('✅ Project created:', project.name);
    } else {
      project = projectList[0];
      console.log('✅ Found project:', project.name);
    }

    // Get project stages
    const { data: stages, error: stagesError } = await supabase
      .from('project_stages')
      .select('id, name, position')
      .eq('project_id', project.id)
      .order('position', { ascending: true });

    if (stagesError) {
      console.error('❌ Error fetching stages:', stagesError.message);
      return;
    }

    console.log(`✅ Found ${stages?.length || 0} stages\n`);

    // Create tasks with distributed statuses
    let completedCount = 0;
    let inProgressCount = 0;
    let notStartedCount = 0;

    const tasksToCreate = SEO_SPRINT_TASKS.map((task, index) => {
      let stageId = null;
      let status = 'not_started';
      
      // Distribute tasks: 30% done, 50% in progress, 20% not started
      if (index < 5) {
        // Done (30%)
        stageId = stages?.find(s => s.name === 'Done')?.id;
        status = 'done';
        completedCount++;
      } else if (index < 13) {
        // In Progress (50%)
        stageId = stages?.find(s => s.name === 'In Progress')?.id;
        status = 'in_progress';
        inProgressCount++;
      } else {
        // Not Started (20%)
        stageId = stages?.find(s => s.name === 'Not Started')?.id;
        status = 'not_started';
        notStartedCount++;
      }

      // Calculate deadline
      const deadline = new Date();
      deadline.setDate(deadline.getDate() + task.daysFromNow);

      return {
        user_id: adminUser.id,
        project_id: project.id,
        stage_id: stageId,
        title: task.title,
        description: task.description,
        priority: task.priority,
        status: status,
        deadline: deadline.toISOString(),
        completed: status === 'done',
        due_date: deadline.toISOString(),
      };
    });

    console.log(`📊 Task Distribution:`);
    console.log(`   - Done: ${completedCount} tasks`);
    console.log(`   - In Progress: ${inProgressCount} tasks`);
    console.log(`   - Not Started: ${notStartedCount} tasks\n`);

    // Insert tasks
    const { data: createdTasks, error: insertError } = await supabase
      .from('tasks')
      .insert(tasksToCreate)
      .select();

    if (insertError) {
      console.error('❌ Error creating tasks:', insertError.message);
      return;
    }

    console.log(`✅ Successfully created ${createdTasks?.length || 0} tasks for ${project.name}!\n`);

    console.log('📋 Sample tasks created:');
    createdTasks?.slice(0, 5).forEach((task, i) => {
      console.log(`   ${i + 1}. [${task.priority}] ${task.title}`);
    });
    if ((createdTasks?.length || 0) > 5) {
      console.log(`   ... and ${(createdTasks?.length || 0) - 5} more tasks`);
    }

    console.log('\n✅ Dashboard is ready with realistic sample tasks!');
    console.log('🌐 Refresh your browser to see the new tasks in action.');

  } catch (error) {
    console.error('❌ Unexpected error:', error.message);
  }
}

addSprintTasks();
