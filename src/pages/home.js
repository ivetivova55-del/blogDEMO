import { qs, qsa } from '../utils/dom-utils.js';
import { applyTimeTheme } from '../utils/time-theme.js';

const homeAdminLink = qs('#home-admin-link');

const previewButtons = qsa('[data-home-preview]');
const previewButtonsWrap = qs('#home-preview-buttons');

const kicker = qs('#home-preview-kicker');
const title = qs('#home-preview-title');
const subtitle = qs('#home-preview-subtitle');
const bulletsWrap = qs('#home-preview-bullets');
const snippetWrap = qs('#home-preview-snippet');

const PREVIEWS = {
  tasks: {
    kicker: 'Tasks',
    title: 'Task Management',
    subtitle: 'Creation, priorities, deadlines, statuses',
    bullets: [
      'Create tasks in seconds and keep ownership clear.',
      'Prioritize work (urgent / high / normal) and avoid last-minute rush.',
      'Move tasks on Kanban: To Do → In Progress → Completed.',
    ],
    snippet: [
      { pill: 'To Do', text: 'Write campaign brief' },
      { pill: 'In Progress', text: 'Design ad creatives' },
      { pill: 'Done', text: 'Publish landing page' },
    ],
  },
  calendar: {
    kicker: 'Calendar',
    title: 'Smart Calendar',
    subtitle: 'Drag & Drop, time blocking, deadline alerts',
    bullets: [
      'See deadlines by day/week and stay ahead of bottlenecks.',
      'Reschedule by drag & drop to update deadlines instantly.',
      'Use agenda-style planning to avoid missed due dates.',
    ],
    snippet: [
      { pill: 'Mon', text: 'Time block: Content review (10:00–11:00)' },
      { pill: 'Wed', text: 'Deadline: Meta Ads refresh' },
      { pill: 'Fri', text: 'Move: Launch email sequence' },
    ],
  },
  analytics: {
    kicker: 'Projects',
    title: 'Project Analytics',
    subtitle: 'Completion rate, performance metrics, overdue insights',
    bullets: [
      'Track progress per project and keep stakeholders aligned.',
      'Spot overdue work early with clear signals and counts.',
      'Use completion rate to forecast workload and delivery risk.',
    ],
    snippet: [
      { pill: '72%', text: 'Campaign: Spring Sale' },
      { pill: '3', text: 'Overdue tasks' },
      { pill: '9', text: 'Open tasks' },
    ],
  },
  assistant: {
    kicker: 'AI',
    title: 'AI Assistant',
    subtitle: 'Creating tasks via chat, smart suggestions',
    bullets: [
      'Ask questions and get quick answers and shortcuts.',
      'Turn intent into action: draft tasks and next steps faster.',
      'Get context-aware suggestions based on tasks and deadlines.',
    ],
    snippet: [
      { pill: 'You', text: '“Create a task to review creatives tomorrow”' },
      { pill: 'AI', text: 'Drafted task + deadline suggestion' },
      { pill: 'AI', text: 'Suggested next step: assign owner' },
    ],
  },
  team: {
    kicker: 'Team',
    title: 'Team Collaboration',
    subtitle: 'Assign tasks, comments, activity feed',
    bullets: [
      'Assign tasks to keep accountability obvious.',
      'Keep updates near the work so context is never lost.',
      'Coordinate across projects without spreadsheets.',
    ],
    snippet: [
      { pill: 'Owner', text: 'Assign: Maria → Landing page QA' },
      { pill: 'Update', text: 'Peter moved task to In Progress' },
      { pill: 'Note', text: 'Add comment with launch checklist' },
    ],
  },
  notifications: {
    kicker: 'Alerts',
    title: 'Smart Notifications',
    subtitle: 'Deadline alerts, progress reminders',
    bullets: [
      'Get notified when deadlines are approaching.',
      'Follow up automatically when work stalls.',
      'Keep the team on pace without micromanagement.',
    ],
    snippet: [
      { pill: 'Alert', text: 'Deadline in 24h: Campaign brief' },
      { pill: 'Reminder', text: 'Task hasn’t moved in 3 days' },
      { pill: 'Tip', text: 'Reschedule in calendar to avoid overdue' },
    ],
  },
};

function renderBullets(items) {
  if (!bulletsWrap) return;
  bulletsWrap.innerHTML = `
    <ul class="dmq-home-bullets">
      ${items.map((item) => `<li>${item}</li>`).join('')}
    </ul>
  `;
}

function renderSnippet(lines) {
  if (!snippetWrap) return;
  snippetWrap.innerHTML = lines
    .map((line) => `
      <div class="dmq-home-snippet-line">
        <span class="dmq-home-snippet-pill">${line.pill}</span>
        ${line.text}
      </div>
    `)
    .join('');
}

function setActivePreview(key, options = {}) {
  const { scrollToPreview = false } = options;
  const preview = PREVIEWS[key] || PREVIEWS.tasks;

  if (kicker) kicker.textContent = preview.kicker;
  if (title) title.textContent = preview.title;
  if (subtitle) subtitle.textContent = preview.subtitle;

  renderBullets(preview.bullets);
  renderSnippet(preview.snippet);

  previewButtons.forEach((btn) => {
    const isActive = btn.dataset.homePreview === key;
    btn.classList.toggle('btn-dark', isActive && btn.classList.contains('dmq-preview-btn'));
    btn.classList.toggle('btn-outline-dark', !isActive && btn.classList.contains('dmq-preview-btn'));
    btn.classList.toggle('is-active', isActive && btn.classList.contains('dmq-feature-card'));
    btn.setAttribute('aria-selected', String(isActive));
  });

  if (scrollToPreview) {
    const previewSection = qs('#preview');
    if (previewSection) previewSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }
}

function initPreview() {
  const defaultKey = 'tasks';
  setActivePreview(defaultKey);

  if (previewButtonsWrap) {
    previewButtonsWrap.addEventListener('click', (event) => {
      const button = event.target.closest('[data-home-preview]');
      if (!button) return;
      setActivePreview(button.dataset.homePreview);
    });
  }

  // Feature cards also jump to preview
  qsa('.dmq-feature-card[data-home-preview]').forEach((card) => {
    card.addEventListener('click', () => {
      setActivePreview(card.dataset.homePreview, { scrollToPreview: true });
    });
  });
}

async function initAdminLink() {
  if (!homeAdminLink) return;
  try {
    const { getCurrentUserProfile } = await import('../services/auth-service.js');
    const user = await getCurrentUserProfile();
    homeAdminLink.classList.toggle('d-none', user?.role !== 'admin');
  } catch {
    // keep hidden
  }
}

function init() {
  applyTimeTheme();
  initPreview();
  initAdminLink();
}

init();
