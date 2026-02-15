import { getCurrentUserProfile, logoutUser } from '../services/auth-service.js';
import { fetchTasks, fetchAllTasks, createTask, updateTask, deleteTask } from '../services/tasks-service.js';
import { fetchProjects } from '../services/projects-service.js';
import { uploadUserFile, listUserFiles, getUserFileDownloadUrl } from '../services/user-files-service.js';
import { success, error, info } from '../services/notifications-service.js';
import { formatDate, isOverdue } from '../utils/date-utils.js';
import { qs, qsa, setAlert, clearAlert, setLoading } from '../utils/dom-utils.js';
import { applyTimeTheme } from '../utils/time-theme.js';

const alertBox = qs('#dashboard-alert');
const tasksTableBody = qs('#tasks-table-body');
const tasksCards = qs('#tasks-cards');
const tasksEmpty = qs('#tasks-empty');
const sortButton = qs('#sort-deadline');
const taskForm = qs('#task-form');
const projectSelect = qs('#task-project');
const summaryTotal = qs('#summary-total');
const summaryOpen = qs('#summary-open');
const summaryCompleted = qs('#summary-completed');
const summaryOverdue = qs('#summary-overdue');
const greeting = qs('#user-greeting');
const adminLink = qs('#admin-link');
const kanbanBoard = qs('#kanban-board');
const userFileForm = qs('#user-file-form');
const userFileInput = qs('#user-file-input');
const userFilesList = qs('#user-files-list');
const calendarDays = qs('#calendar-days');
const calendarMonth = qs('#cal-month');
const calendarPrev = qs('#cal-prev');
const calendarNext = qs('#cal-next');
const projectsGrid = qs('#projects-grid');
const projectsEmpty = qs('#projects-empty');
const newProjectBtn = qs('#new-project-btn');

// Sidebar and navigation
const sidebarToggle = qs('#sidebar-toggle');
const sidebar = qs('.dmq-sidebar');
const sidebarOverlay = qs('#sidebarOverlay');
const sectionTitle = qs('#section-title');
const navLinks = qsa('.sidebar-nav .nav-link');
const dashboardSections = qsa('.dashboard-section');

// Calendar state
let currentCalendarDate = new Date();

const STATUS_LABELS = {
  not_started: 'To Do',
  in_progress: 'In Progress',
  done: 'Complete',
};

let tasks = [];
let projects = [];
let activeFilter = 'all';
let sortDirection = 'asc';
let currentUserId = null;
let currentUserRole = null;
let selectedProjectId = null;
let selectedCalendarDay = null;
let calendarDayModal = null;

function formatFileSize(bytes) {
  if (!bytes || bytes <= 0) return '0 B';
  const units = ['B', 'KB', 'MB', 'GB'];
  let size = bytes;
  let unitIndex = 0;

  while (size >= 1024 && unitIndex < units.length - 1) {
    size /= 1024;
    unitIndex += 1;
  }

  const rounded = size >= 10 ? Math.round(size) : size.toFixed(1);
  return `${rounded} ${units[unitIndex]}`;
}

function getTaskStatusForCalendar(task) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  if (!task.deadline) return null;
  
  const deadline = new Date(task.deadline);
  deadline.setHours(0, 0, 0, 0);
  
  if (task.status === 'done') return 'done';
  if (deadline < today) return 'overdue';
  if (deadline.getTime() === today.getTime()) return 'today';
  if ((deadline - today) / (1000 * 60 * 60 * 24) <= 7) return 'due-soon';
  return null;
}

function renderCalendar() {
  if (!calendarDays || !tasks.length) return;

  const year = currentCalendarDate.getFullYear();
  const month = currentCalendarDate.getMonth();
  
  // Update month/year display
  const monthNames = ['January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'];
  calendarMonth.textContent = `${monthNames[month]} ${year}`;

  // Get first day of month and number of days
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const daysInPrevMonth = new Date(year, month, 0).getDate();

  // Group tasks by deadline date
  const tasksByDate = {};
  tasks.forEach((task) => {
    if (task.deadline) {
      const dateKey = task.deadline; // Format: YYYY-MM-DD
      if (!tasksByDate[dateKey]) tasksByDate[dateKey] = [];
      tasksByDate[dateKey].push(task);
    }
  });

  calendarDays.innerHTML = '';

  // Previous month's days (grayed out)
  for (let i = firstDay - 1; i >= 0; i--) {
    const day = daysInPrevMonth - i;
    const dayElement = createCalendarDay(day, true, []);
    calendarDays.appendChild(dayElement);
  }

  // Current month's days
  for (let day = 1; day <= daysInMonth; day++) {
    const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    const dayTasks = tasksByDate[dateStr] || [];
    const dayElement = createCalendarDay(day, false, dayTasks);
    calendarDays.appendChild(dayElement);
  }

  // Next month's days (grayed out)
  const totalCells = calendarDays.children.length;
  const remainingCells = 42 - totalCells; // 6 rows × 7 days
  for (let day = 1; day <= remainingCells; day++) {
    const dayElement = createCalendarDay(day, true, []);
    calendarDays.appendChild(dayElement);
  }
}

function createCalendarDay(dayNum, isOtherMonth, dayTasks) {
  const day = document.createElement('div');
  day.className = 'calendar-day';
  
  if (isOtherMonth) {
    day.classList.add('other-month');
  }

  // Check if today
  const today = new Date();
  let isToday = false;
  if (!isOtherMonth) {
    if (dayNum === today.getDate() &&
        currentCalendarDate.getMonth() === today.getMonth() &&
        currentCalendarDate.getFullYear() === today.getFullYear()) {
      day.classList.add('today');
      isToday = true;
    }
  }

  // Store date info for click handler
  const dateStr = `${currentCalendarDate.getFullYear()}-${String(currentCalendarDate.getMonth() + 1).padStart(2, '0')}-${String(dayNum).padStart(2, '0')}`;
  day.dataset.date = dateStr;
  day.dataset.dayNum = dayNum;

  const dayNumber = document.createElement('div');
  dayNumber.className = 'calendar-day-number';
  dayNumber.textContent = dayNum;
  day.appendChild(dayNumber);

  const tasksContainer = document.createElement('div');
  tasksContainer.className = 'calendar-day-tasks';

  // Show up to 2 task indicators with priority coloring
  dayTasks.slice(0, 2).forEach((task) => {
    const status = getTaskStatusForCalendar(task);
    if (!status) return;

    const taskItem = document.createElement('div');
    const priorityClass = `priority-${task.priority || 'medium'}`;
    taskItem.className = `calendar-task-item ${status} ${priorityClass}`;
    
    const dot = document.createElement('span');
    dot.className = 'calendar-task-dot';
    
    // Color by priority
    if (task.priority === 'high') dot.style.background = '#ef4444';
    else if (task.priority === 'low') dot.style.background = '#3b82f6';
    else dot.style.background = '#f59e0b'; // medium

    const title = document.createElement('span');
    title.textContent = task.title;
    title.style.overflow = 'hidden';
    title.style.textOverflow = 'ellipsis';
    title.title = task.title; // Hover tooltip

    taskItem.appendChild(dot);
    taskItem.appendChild(title);
    tasksContainer.appendChild(taskItem);
  });

  if (dayTasks.length > 2) {
    const moreLabel = document.createElement('div');
    moreLabel.className = 'calendar-task-item multiple';
    moreLabel.textContent = `+${dayTasks.length - 2} more`;
    tasksContainer.appendChild(moreLabel);
  }

  day.appendChild(tasksContainer);

  // Show task count badge
  if (dayTasks.length > 0 && !isOtherMonth) {
    const count = document.createElement('div');
    count.className = 'calendar-task-count';
    count.textContent = dayTasks.length;
    day.appendChild(count);
  }

  // Add click handler to show day details
  if (!isOtherMonth && dayTasks.length > 0) {
    day.addEventListener('click', () => showCalendarDayDetails(dateStr, dayNum, dayTasks));
  }

  return day;
}

function showCalendarDayDetails(dateStr, dayNum, dayTasks) {
  selectedCalendarDay = dateStr;
  
  // Update modal title
  const dateObj = new Date(dateStr);
  const monthNames = ['January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'];
  const dayName = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][dateObj.getDay()];
  const title = qs('#calendarDayTitle');
  title.textContent = `${dayName}, ${monthNames[dateObj.getMonth()]} ${dayNum}`;

  // Build task details
  const tasksContainer = qs('#calendarDayTasks');
  tasksContainer.innerHTML = '';

  const summary = document.createElement('div');
  summary.className = 'calendar-quickview';
  summary.innerHTML = `
    <div class="calendar-day-summary"><strong>${dayTasks.length}</strong> task${dayTasks.length !== 1 ? 's' : ''} on this day</div>
  `;
  tasksContainer.appendChild(summary);

  dayTasks.forEach((task) => {
    const card = document.createElement('div');
    const priorityClass = `${task.priority || 'medium'}-priority`;
    card.className = `calendar-day-task-card ${priorityClass}`;
    
    const statusLabel = STATUS_LABELS[task.status] || task.status;
    const isCompleted = task.status === 'done';
    const taskDeadline = formatDate(task.deadline);

    card.innerHTML = `
      <div class="calendar-task-title">${task.title}</div>
      <div class="calendar-task-meta">
        <span class="calendar-task-meta-item">
          <span class="calendar-task-badge status-${task.status}">${statusLabel}</span>
        </span>
        <span class="calendar-task-meta-item">
          <span>Priority:</span>
          <strong>${task.priority ? task.priority.charAt(0).toUpperCase() + task.priority.slice(1) : 'Medium'}</strong>
        </span>
        <span class="calendar-task-meta-item">
          📅 ${taskDeadline}
        </span>
      </div>
      ${task.description ? `<div style="font-size: 0.85rem; color: var(--ink-secondary); margin-bottom: 8px;">${task.description}</div>` : ''}
      <div class="calendar-task-actions">
        <button class="calendar-task-action-btn ${isCompleted ? 'complete' : ''}" data-action="view" data-id="${task.id}">
          View Details
        </button>
        <button class="calendar-task-action-btn ${isCompleted ? 'complete' : ''}" data-action="quick-toggle" data-id="${task.id}">
          ${isCompleted ? '✓ Completed' : 'Mark Complete'}
        </button>
      </div>
    `;

    // Add event listeners
    const viewBtn = card.querySelector('[data-action="view"]');
    const toggleBtn = card.querySelector('[data-action="quick-toggle"]');

    viewBtn.addEventListener('click', () => {
      const modal = bootstrap.Modal.getInstance(document.getElementById('calendarDayModal'));
      if (modal) modal.hide();
      window.location.href = `./task-details.html?id=${task.id}`;
    });

    toggleBtn.addEventListener('click', async () => {
      const newStatus = isCompleted ? 'not_started' : 'done';
      try {
        await updateTask(task.id, { status: newStatus });
        success(`Task ${newStatus === 'done' ? 'completed' : 'reopened'}.`);
        const modal = bootstrap.Modal.getInstance(document.getElementById('calendarDayModal'));
        if (modal) modal.hide();
        await refreshDashboard();
      } catch (err) {
        error(err.message || 'Failed to update task.');
      }
    });

    tasksContainer.appendChild(card);
  });

  // Show modal
  if (!calendarDayModal) {
    calendarDayModal = new bootstrap.Modal(document.getElementById('calendarDayModal'));
  }
  calendarDayModal.show();
}

async function renderUserFiles() {
  if (!userFilesList || !currentUserId) return;

  const files = await listUserFiles(currentUserId);
  userFilesList.innerHTML = '';

  if (!files.length) {
    userFilesList.innerHTML = '<div class="dmq-empty">No files uploaded yet.</div>';
    return;
  }

  files.forEach((file) => {
    const item = document.createElement('div');
    item.className = 'd-flex justify-content-between align-items-center border rounded-3 p-2 mb-2 gap-2';
    item.innerHTML = `
      <div class="text-truncate">
        <div class="fw-semibold text-truncate">${file.name}</div>
        <div class="small text-muted">${formatFileSize(file.size)} · ${formatDate(file.created_at)}</div>
      </div>
      <button class="btn btn-sm btn-outline-dark" data-file-download="${file.path}" data-file-name="${file.name}">
        Download
      </button>
    `;
    userFilesList.appendChild(item);
  });
}

function applyFilterSort(items) {
  const filtered = activeFilter === 'all'
    ? items
    : activeFilter === 'incomplete'
      ? items.filter((task) => task.status !== 'done')
      : items.filter((task) => task.status === activeFilter);

  return [...filtered].sort((a, b) => {
    const aDate = new Date(a.deadline || 0);
    const bDate = new Date(b.deadline || 0);
    return sortDirection === 'asc' ? aDate - bDate : bDate - aDate;
  });
}

/* ========== Sidebar Navigation & Section Switching ========== */

function switchSection(sectionName) {
  // Hide all sections
  dashboardSections.forEach((section) => {
    section.classList.add('d-none');
  });

  // Show selected section
  const selectedSection = qs(`[data-section="${sectionName}"]`);
  if (selectedSection) {
    selectedSection.classList.remove('d-none');
  }

  // Update active nav link
  navLinks.forEach((link) => {
    link.classList.toggle('active', link.dataset.section === sectionName);
  });

  // Update title
  const sectionTitles = {
    overview: 'Dashboard Overview',
    tasks: 'All Tasks',
    calendar: 'Deadline Calendar',
    board: 'Task Board (Kanban)',
    files: 'My Files',
    projects: 'My Projects',
  };
  sectionTitle.textContent = sectionTitles[sectionName] || 'Dashboard';

  // Load projects if switching to projects section
  if (sectionName === 'projects') {
    renderProjectsList();
  }

  // Close sidebar on mobile
  if (window.innerWidth <= 1024) {
    closeSidebar();
  }
}

function toggleSidebar() {
  sidebar.classList.toggle('show');
  sidebarOverlay.classList.toggle('show');
}

function closeSidebar() {
  sidebar.classList.remove('show');
  sidebarOverlay.classList.remove('show');
}

function renderSummary() {
  const total = tasks.length;
  const open = tasks.filter((task) => task.status !== 'done').length;
  const completed = tasks.filter((task) => task.status === 'done').length;
  const overdue = tasks.filter((task) => isOverdue(task)).length;
  summaryTotal.textContent = total;
  summaryOpen.textContent = open;
  summaryCompleted.textContent = completed;
  summaryOverdue.textContent = overdue;
}

function statusBadgeClass(status) {
  if (status === 'done') return 'status-completed';
  if (status === 'in_progress') return 'status-open';
  return 'status-open';
}

function getToggleLabel(status) {
  return status === 'done' ? 'Reopen' : 'Complete';
}

function getToggledStatus(status) {
  return status === 'done' ? 'not_started' : 'done';
}

function renderKanban() {
  const columns = qsa('[data-board-list]', kanbanBoard);
  columns.forEach((column) => {
    column.innerHTML = '';
  });

  const sorted = [...tasks].sort((a, b) => new Date(a.deadline || 0) - new Date(b.deadline || 0));

  sorted.forEach((task) => {
    const status = STATUS_LABELS[task.status] ? task.status : 'not_started';
    const column = qs(`[data-board-status="${status}"]`, kanbanBoard);
    if (!column) return;

    const card = document.createElement('div');
    card.className = 'task-card mb-2';
    card.draggable = true;
    card.dataset.taskId = task.id;
    card.innerHTML = `
      <div class="task-title">${task.title}</div>
      <div class="task-meta">${formatDate(task.deadline)}</div>
      <div><span class="status-badge ${statusBadgeClass(task.status)}">${STATUS_LABELS[status]}</span></div>
    `;
    column.appendChild(card);
  });
}

function renderTasks() {
  const viewTasks = applyFilterSort(tasks);
  tasksTableBody.innerHTML = '';
  tasksCards.innerHTML = '';

  if (!viewTasks.length) {
    tasksEmpty.classList.remove('d-none');
    return;
  }

  tasksEmpty.classList.add('d-none');

  viewTasks.forEach((task) => {
    const overdue = isOverdue(task);
    const statusBadge = statusBadgeClass(task.status);
    const userName = task.users?.full_name || task.users?.email || 'Unknown';
    const userDisplay = currentUserRole === 'admin' ? `<td class="text-muted small">${userName}</td>` : '';

    const row = document.createElement('tr');
    row.innerHTML = `
      <td>${task.title}</td>
      <td class="text-muted">${task.description || '-'}</td>
      <td class="${overdue ? 'status-overdue' : ''}">${formatDate(task.deadline)}</td>
      ${userDisplay}
      <td><span class="status-badge ${statusBadge}">${STATUS_LABELS[task.status] || STATUS_LABELS.not_started}</span></td>
      <td>
        <div class="d-flex gap-2 flex-wrap">
          <button class="btn btn-sm btn-outline-dark" data-action="view" data-id="${task.id}">View</button>
          <button class="btn btn-sm btn-outline-secondary" data-action="toggle" data-id="${task.id}">
            ${getToggleLabel(task.status)}
          </button>
          <button class="btn btn-sm btn-outline-danger" data-action="delete" data-id="${task.id}">Delete</button>
        </div>
      </td>
    `;
    tasksTableBody.appendChild(row);

    const card = document.createElement('div');
    card.className = 'task-card';
    const userInfo = currentUserRole === 'admin' ? `<div class="task-meta text-muted small">Assigned to: ${userName}</div>` : '';
    card.innerHTML = `
      <div class="task-title">${task.title}</div>
      <div class="task-meta">${task.description || '-'}</div>
      <div class="task-meta ${overdue ? 'status-overdue' : ''}">Deadline: ${formatDate(task.deadline)}</div>
      ${userInfo}
      <div><span class="status-badge ${statusBadge}">${STATUS_LABELS[task.status] || STATUS_LABELS.not_started}</span></div>
      <div class="d-flex gap-2 flex-wrap">
        <button class="btn btn-sm btn-outline-dark" data-action="view" data-id="${task.id}">View</button>
        <button class="btn btn-sm btn-outline-secondary" data-action="toggle" data-id="${task.id}">
          ${getToggleLabel(task.status)}
        </button>
        <button class="btn btn-sm btn-outline-danger" data-action="delete" data-id="${task.id}">Delete</button>
      </div>
    `;
    tasksCards.appendChild(card);
  });

  renderKanban();
}

function renderProjectsDrop() {
  projectSelect.innerHTML = '<option value="">No project</option>';
  projects.forEach((project) => {
    const option = document.createElement('option');
    option.value = project.id;
    option.textContent = project.name;
    projectSelect.appendChild(option);
  });
}

function renderProjectsList() {
  if (!projectsGrid) return;

  if (!projects || projects.length === 0) {
    projectsGrid.innerHTML = '';
    projectsEmpty.classList.remove('d-none');
    return;
  }

  projectsEmpty.classList.add('d-none');
  projectsGrid.innerHTML = projects.map((project) => {
    const taskCount = tasks.filter(t => t.project_id === project.id).length;
    const completedCount = tasks.filter(t => t.project_id === project.id && t.status === 'done').length;
    const progressPercent = taskCount > 0 ? Math.round((completedCount / taskCount) * 100) : 0;

    return `
      <div class="col-md-6 col-lg-4">
        <div class="dmq-card h-100 p-3" style="cursor: pointer; transition: transform 0.2s;" onclick="window.location.href='./projects.html?id=${project.id}'">
          <h5 class="card-title">${project.name}</h5>
          <p class="card-text text-muted small">${project.description || 'No description'}</p>
          <div class="progress mb-2" style="height: 6px;">
            <div class="progress-bar" style="width: ${progressPercent}%;"></div>
          </div>
          <small class="text-muted">
            ${completedCount}/${taskCount} tasks complete
          </small>
        </div>
      </div>
    `;
  }).join('');
}

async function refreshDashboard() {
  clearAlert(alertBox);
  tasks = currentUserRole === 'admin' ? await fetchAllTasks() : await fetchTasks(currentUserId);
  renderSummary();
  renderTasks();
  renderCalendar();
  renderProjectsList();
}

async function initDashboard() {
  const user = await getCurrentUserProfile();
  if (!user) {
    window.location.href = './index.html';
    return;
  }
  currentUserId = user.id;
  currentUserRole = user.role;
  greeting.textContent = `Welcome, ${user.full_name || user.email}`;
  if (currentUserRole === 'admin') {
    greeting.textContent += ' (Admin - Viewing all tasks)';
    // Show admin column header
    const adminColumnHeader = qs('.admin-column-header');
    if (adminColumnHeader) {
      adminColumnHeader.classList.remove('d-none');
    }
  }
  if (adminLink) {
    adminLink.classList.toggle('d-none', user.role !== 'admin');
  }

  try {
    projects = await fetchProjects(currentUserId);
    renderProjectsDrop();

    const params = new URLSearchParams(window.location.search);
    const queryProject = params.get('project');
    if (queryProject && projects.some((project) => project.id === queryProject)) {
      selectedProjectId = queryProject;
      projectSelect.value = selectedProjectId;
      info('Project selected. Create or manage tasks for this project.');
    }

    await refreshDashboard();
    await renderUserFiles();
  } catch (error) {
    error(error.message || 'Unable to load dashboard data.');
  }
}

qsa('[data-filter]').forEach((button) => {
  button.addEventListener('click', () => {
    qsa('[data-filter]').forEach((btn) => btn.classList.remove('active'));
    button.classList.add('active');
    activeFilter = button.dataset.filter;
    renderTasks();
  });
});

kanbanBoard.addEventListener('dragstart', (event) => {
  const card = event.target.closest('[data-task-id]');
  if (!card) return;
  event.dataTransfer.effectAllowed = 'move';
  event.dataTransfer.setData('text/plain', card.dataset.taskId);
});

qsa('[data-board-status]', kanbanBoard).forEach((column) => {
  column.addEventListener('dragover', (event) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = 'move';
    column.classList.add('kanban-drop-active');
  });

  column.addEventListener('dragleave', () => {
    column.classList.remove('kanban-drop-active');
  });

  column.addEventListener('drop', async (event) => {
    event.preventDefault();
    column.classList.remove('kanban-drop-active');

    const taskId = event.dataTransfer.getData('text/plain');
    const nextStatus = column.dataset.boardStatus;
    if (!taskId || !nextStatus) return;

    const task = tasks.find((item) => item.id === taskId);
    if (!task || task.status === nextStatus) return;

    try {
      await updateTask(taskId, { status: nextStatus });
      await refreshDashboard();
    } catch (error) {
      error(error.message || 'Unable to move task on board.');
    }
  });
});

sortButton.addEventListener('click', () => {
  sortDirection = sortDirection === 'asc' ? 'desc' : 'asc';
  sortButton.textContent = `Sort: ${sortDirection.toUpperCase()}`;
  renderTasks();
});

// Calendar navigation
if (calendarPrev) {
  calendarPrev.addEventListener('click', () => {
    currentCalendarDate.setMonth(currentCalendarDate.getMonth() - 1);
    renderCalendar();
  });
}

if (calendarNext) {
  calendarNext.addEventListener('click', () => {
    currentCalendarDate.setMonth(currentCalendarDate.getMonth() + 1);
    renderCalendar();
  });
}

taskForm.addEventListener('submit', async (event) => {
  event.preventDefault();
  clearAlert(alertBox);
  const submitButton = taskForm.querySelector('button[type="submit"]');
  setLoading(submitButton, true, 'Saving...');

  try {
    const formData = new FormData(taskForm);
    await createTask({
      user_id: currentUserId,
      project_id: formData.get('project') || null,
      title: formData.get('title').trim(),
      description: formData.get('description').trim(),
      deadline: formData.get('deadline'),
      status: formData.get('status'),
      priority: formData.get('priority'),
    });
    taskForm.reset();
    await refreshDashboard();
    success('Task created successfully.');
  } catch (error) {
    error(error.message || 'Unable to create task.');
  } finally {
    setLoading(submitButton, false);
  }
});

qs('#tasks-panel').addEventListener('click', async (event) => {
  const target = event.target.closest('[data-action]');
  if (!target) return;

  const taskId = target.dataset.id;
  if (!taskId) return;

  try {
    if (target.dataset.action === 'view') {
      window.location.href = `./task-details.html?id=${taskId}`;
      return;
    }

    if (target.dataset.action === 'toggle') {
      const task = tasks.find((item) => item.id === taskId);
      if (!task) return;
      const status = getToggledStatus(task.status);
      await updateTask(taskId, { status });
      await refreshDashboard();
      success('Task status updated.');
      return;
    }

    if (target.dataset.action === 'delete') {
      const confirmed = window.confirm('Delete this task?');
      if (!confirmed) return;
      await deleteTask(taskId);
      await refreshDashboard();
      success('Task deleted.');
    }
  } catch (error) {
    error(error.message || 'Action failed.');
  }
});

qs('#logout-button').addEventListener('click', async () => {
  await logoutUser();
  window.location.href = './index.html';
});

if (userFileForm && userFileInput && userFilesList) {
  userFileForm.addEventListener('submit', async (event) => {
    event.preventDefault();
    clearAlert(alertBox);

    const file = userFileInput.files?.[0];
    if (!file) {
      error('Select a file first.');
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      error('Max file size is 10MB.');
      return;
    }

    const submitButton = userFileForm.querySelector('button[type="submit"]');
    setLoading(submitButton, true, 'Uploading...');

    try {
      await uploadUserFile(currentUserId, file);
      userFileInput.value = '';
      await renderUserFiles();
      success('File uploaded successfully.');
    } catch (error) {
      error(error.message || 'Unable to upload file.');
    } finally {
      setLoading(submitButton, false);
    }
  });

  userFilesList.addEventListener('click', async (event) => {
    const button = event.target.closest('[data-file-download]');
    if (!button) return;

    const filePath = button.dataset.fileDownload;
    const fileName = button.dataset.fileName || 'download';
    if (!filePath) return;

    button.disabled = true;
    try {
      const url = await getUserFileDownloadUrl(filePath);
      const link = document.createElement('a');
      link.href = url;
      link.download = fileName;
      link.click();
      info('File download started.');
    } catch (error) {
      error(error.message || 'Unable to download file.');
    } finally {
      button.disabled = false;
    }
  });
}

/* ========== Sidebar Navigation Event Listeners ========== */

if (sidebarToggle) {
  sidebarToggle.addEventListener('click', toggleSidebar);
}

if (sidebarOverlay) {
  sidebarOverlay.addEventListener('click', closeSidebar);
}

if (newProjectBtn) {
  newProjectBtn.addEventListener('click', () => {
    window.location.href = './projects.html';
  });
}

// Section switcher buttons
qsa('[data-section]').forEach((element) => {
  if (element.classList.contains('nav-link')) {
    element.addEventListener('click', (e) => {
      e.preventDefault();
      const section = element.dataset.section;
      switchSection(section);
    });
  }
});

initDashboard();
applyTimeTheme();
