import { getCurrentUserProfile, logoutUser } from '../services/auth-service.js';
import { fetchTasks, fetchAllTasks, createTask, updateTask, deleteTask } from '../services/tasks-service.js';
import { fetchProjects } from '../services/projects-service.js';
import { uploadUserFile, listUserFiles, getUserFileDownloadUrl } from '../services/user-files-service.js';
import { fetchAllUsers } from '../services/admin-service.js';
import { success, error, info } from '../services/notifications-service.js';
import { formatDate, isOverdue } from '../utils/date-utils.js';
import { qs, qsa, setAlert, clearAlert, setLoading } from '../utils/dom-utils.js';
import { applyTimeTheme } from '../utils/time-theme.js';

const alertBox = qs('#dashboard-alert');
const tasksTableBody = qs('#tasks-table-body');
const tasksCards = qs('#tasks-cards');
const tasksEmpty = qs('#tasks-empty');
const tasksPanel = qs('#tasks-panel');
const myTasksView = qs('#my-tasks-view');
const allTasksView = qs('#all-tasks-view');
const allTasksCards = qs('#all-tasks-cards');
const allTasksEmpty = qs('#all-tasks-empty');
const taskViewButtons = qsa('[data-task-view]');
const allTasksToggle = qs('#all-tasks-toggle');
const tasksListView = qs('#tasks-list-view');
const tasksBoardView = qs('#tasks-board-view');
const displayViewButtons = qsa('[data-display-view]');
const tasksViewSwitcher = qs('#tasks-view-switcher');
const tasksChipCount = qs('#tasks-chip-count');
const tasksChipFilter = qs('#tasks-chip-filter');
const tasksChipSort = qs('#tasks-chip-sort');
const tasksChipView = qs('#tasks-chip-view');
const tasksChipUpdated = qs('#tasks-chip-updated');
const sortButton = qs('#sort-deadline');
const taskForm = qs('#task-form');
const projectSelect = qs('#task-project');
const summaryTotal = qs('#summary-total');
const summaryOpen = qs('#summary-open');
const summaryCompleted = qs('#summary-completed');
const summaryOverdue = qs('#summary-overdue');
const tasksSummaryTotal = qs('#tasks-summary-total');
const tasksSummaryOpen = qs('#tasks-summary-open');
const tasksSummaryCompleted = qs('#tasks-summary-completed');
const tasksSummaryOverdue = qs('#tasks-summary-overdue');
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
const calendarMonthView = qs('#calendar-month-view');
const calendarAgendaView = qs('#calendar-agenda-view');
const calendarViewButtons = qsa('[data-cal-view]');
const calendarStatusFilter = qs('#calendar-status-filter');
const calendarPriorityFilter = qs('#calendar-priority-filter');
const projectsGrid = qs('#projects-grid');
const projectsEmpty = qs('#projects-empty');
const newProjectBtn = qs('#new-project-btn');
const navTasksCount = qs('#nav-tasks-count');
const navCalendarCount = qs('#nav-calendar-count');
const navFilesCount = qs('#nav-files-count');
const navProjectsCount = qs('#nav-projects-count');

// Sidebar and navigation
const sidebarToggle = qs('#sidebar-toggle');
const sidebar = qs('.dmq-sidebar');
const sidebarOverlay = qs('#sidebarOverlay');
const sidebarToggleDesktop = qs('#sidebar-toggle-desktop');
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
let allTasks = [];
let projects = [];
let activeFilter = 'all';
let sortDirection = 'asc';
let currentUserId = null;
let currentUserRole = null;
let currentUserName = '';
let selectedProjectId = null;
let selectedCalendarDay = null;
let calendarDayModal = null;
let activeTaskView = 'mine';
let activeDisplayView = 'list';
let calendarView = 'month';
let calendarFilters = {
  status: 'all',
  priority: 'all',
};
let usersById = {};

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

function updateNavCounts(filesCount = null) {
  if (navTasksCount) navTasksCount.textContent = tasks.length;
  if (navCalendarCount) {
    const datedTasks = tasks.filter((task) => task.deadline).length;
    navCalendarCount.textContent = datedTasks;
  }
  if (navProjectsCount) navProjectsCount.textContent = projects.length;
  if (navFilesCount && filesCount !== null) navFilesCount.textContent = filesCount;
}

function buildUserMap(users) {
  return (users || []).reduce((acc, user) => {
    acc[user.id] = user;
    return acc;
  }, {});
}

function getUserLabel(userId) {
  const user = usersById[userId];
  if (!user) return 'Unknown user';
  return user.full_name || user.email || 'Unknown user';
}

function setTaskView(view) {
  activeTaskView = view;
  taskViewButtons.forEach((button) => {
    button.classList.toggle('active', button.dataset.taskView === view);
  });

  if (myTasksView) {
    myTasksView.classList.toggle('d-none', view !== 'mine');
  }

  if (allTasksView) {
    allTasksView.classList.toggle('d-none', view !== 'all');
  }

  if (tasksViewSwitcher) {
    tasksViewSwitcher.classList.toggle('d-none', view !== 'mine');
  }
}

function setDisplayView(view) {
  activeDisplayView = view;
  displayViewButtons.forEach((button) => {
    button.classList.toggle('active', button.dataset.displayView === view);
  });

  if (tasksListView) {
    tasksListView.classList.toggle('d-none', view !== 'list');
  }

  if (tasksBoardView) {
    tasksBoardView.classList.toggle('d-none', view !== 'board');
  }

  updateTasksVisualization(applyFilterSort(tasks));
}

function getFilterLabel(filterValue) {
  if (filterValue === 'incomplete') return 'Incomplete';
  if (filterValue === 'not_started') return 'To Do';
  if (filterValue === 'done') return 'Complete';
  return 'All';
}

function updateTasksVisualization(viewTasks) {
  if (!tasksChipCount || !tasksChipFilter || !tasksChipSort || !tasksChipView || !tasksChipUpdated) return;

  tasksChipCount.textContent = `Showing ${viewTasks.length} of ${tasks.length}`;
  tasksChipFilter.textContent = `Filter: ${getFilterLabel(activeFilter)}`;
  tasksChipSort.textContent = `Sort: ${sortDirection.toUpperCase()}`;
  tasksChipView.textContent = `View: ${activeDisplayView === 'board' ? 'Board' : 'List'}`;
  tasksChipUpdated.textContent = `Updated: ${new Date().toLocaleTimeString('en-GB')}`;
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

function formatShortDate(value) {
  if (!value) return '';
  return new Date(value).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
  });
}

function applyCalendarFilters(items) {
  return items.filter((task) => {
    if (calendarFilters.status !== 'all' && task.status !== calendarFilters.status) {
      return false;
    }
    if (calendarFilters.priority !== 'all' && task.priority !== calendarFilters.priority) {
      return false;
    }
    return Boolean(task.deadline);
  });
}

function setCalendarView(view) {
  calendarView = view;
  calendarViewButtons.forEach((button) => {
    button.classList.toggle('active', button.dataset.calView === view);
  });
  renderCalendar();
}

async function handleCalendarDrop(taskId, dateStr) {
  if (!taskId || !dateStr) return;

  try {
    await updateTask(taskId, { deadline: dateStr });
    success('Task rescheduled.');
    await refreshDashboard();
  } catch (err) {
    error(err.message || 'Unable to reschedule task.');
  }
}

function renderCalendarMonth(viewTasks) {
  const year = currentCalendarDate.getFullYear();
  const month = currentCalendarDate.getMonth();

  const monthNames = ['January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'];
  calendarMonth.textContent = `${monthNames[month]} ${year}`;

  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const daysInPrevMonth = new Date(year, month, 0).getDate();

  const tasksByDate = {};
  viewTasks.forEach((task) => {
    const dateKey = task.deadline;
    if (!tasksByDate[dateKey]) tasksByDate[dateKey] = [];
    tasksByDate[dateKey].push(task);
  });

  calendarDays.innerHTML = '';

  for (let i = firstDay - 1; i >= 0; i--) {
    const day = daysInPrevMonth - i;
    const dayElement = createCalendarDay(day, true, []);
    calendarDays.appendChild(dayElement);
  }

  for (let day = 1; day <= daysInMonth; day++) {
    const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    const dayTasks = tasksByDate[dateStr] || [];
    const dayElement = createCalendarDay(day, false, dayTasks);
    calendarDays.appendChild(dayElement);
  }

  const totalCells = calendarDays.children.length;
  const remainingCells = 42 - totalCells;
  for (let day = 1; day <= remainingCells; day++) {
    const dayElement = createCalendarDay(day, true, []);
    calendarDays.appendChild(dayElement);
  }
}

function getWeekStart(date) {
  const start = new Date(date);
  const day = start.getDay();
  start.setDate(start.getDate() - day);
  start.setHours(0, 0, 0, 0);
  return start;
}

function renderCalendarAgenda(viewTasks) {
  if (!calendarAgendaView) return;

  const isWeek = calendarView === 'week';
  const startDate = isWeek ? getWeekStart(currentCalendarDate) : new Date(currentCalendarDate);
  const dayCount = isWeek ? 7 : 1;
  const endDate = new Date(startDate);
  endDate.setDate(startDate.getDate() + dayCount - 1);

  calendarMonth.textContent = isWeek
    ? `Week of ${formatShortDate(startDate)}`
    : formatDate(startDate);

  calendarAgendaView.innerHTML = '';

  for (let i = 0; i < dayCount; i += 1) {
    const dayDate = new Date(startDate);
    dayDate.setDate(startDate.getDate() + i);
    const dateStr = dayDate.toISOString().split('T')[0];
    const dayTasks = viewTasks.filter((task) => task.deadline === dateStr);

    const dayCard = document.createElement('div');
    dayCard.className = 'calendar-agenda-day';
    dayCard.dataset.date = dateStr;

    const title = document.createElement('div');
    title.className = 'calendar-agenda-title';
    title.innerHTML = `
      <span>${dayDate.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}</span>
      <span>${dayTasks.length} task${dayTasks.length !== 1 ? 's' : ''}</span>
    `;

    const list = document.createElement('div');
    list.className = 'calendar-agenda-list';

    if (!dayTasks.length) {
      const empty = document.createElement('div');
      empty.className = 'text-muted small';
      empty.textContent = 'No tasks';
      list.appendChild(empty);
    } else {
      dayTasks.forEach((task) => {
        const item = document.createElement('div');
        item.className = 'calendar-task-pill';
        item.draggable = true;
        item.dataset.taskId = task.id;

        const dot = document.createElement('span');
        dot.className = 'calendar-task-dot';
        if (task.priority === 'high') dot.style.background = '#ef4444';
        else if (task.priority === 'low') dot.style.background = '#3b82f6';
        else dot.style.background = '#f59e0b';

        const titleText = document.createElement('span');
        titleText.textContent = task.title;

        item.appendChild(dot);
        item.appendChild(titleText);

        item.addEventListener('dragstart', (event) => {
          event.dataTransfer.effectAllowed = 'move';
          event.dataTransfer.setData('text/plain', task.id);
        });

        list.appendChild(item);
      });
    }

    dayCard.appendChild(title);
    dayCard.appendChild(list);

    dayCard.addEventListener('dragover', (event) => {
      event.preventDefault();
      event.dataTransfer.dropEffect = 'move';
      dayCard.classList.add('kanban-drop-active');
    });

    dayCard.addEventListener('dragleave', () => {
      dayCard.classList.remove('kanban-drop-active');
    });

    dayCard.addEventListener('drop', async (event) => {
      event.preventDefault();
      dayCard.classList.remove('kanban-drop-active');
      const taskId = event.dataTransfer.getData('text/plain');
      await handleCalendarDrop(taskId, dateStr);
    });

    calendarAgendaView.appendChild(dayCard);
  }
}

function renderCalendar() {
  if (!calendarDays || !calendarMonth) return;

  const viewTasks = applyCalendarFilters(tasks);

  if (calendarView === 'month') {
    if (calendarMonthView) calendarMonthView.classList.remove('d-none');
    if (calendarAgendaView) calendarAgendaView.classList.add('d-none');
    renderCalendarMonth(viewTasks);
    return;
  }

  if (calendarMonthView) calendarMonthView.classList.add('d-none');
  if (calendarAgendaView) calendarAgendaView.classList.remove('d-none');
  renderCalendarAgenda(viewTasks);
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
    taskItem.draggable = true;
    taskItem.dataset.taskId = task.id;
    
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

    taskItem.addEventListener('dragstart', (event) => {
      event.dataTransfer.effectAllowed = 'move';
      event.dataTransfer.setData('text/plain', task.id);
    });
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

  if (!isOtherMonth) {
    day.addEventListener('dragover', (event) => {
      event.preventDefault();
      event.dataTransfer.dropEffect = 'move';
      day.classList.add('kanban-drop-active');
    });

    day.addEventListener('dragleave', () => {
      day.classList.remove('kanban-drop-active');
    });

    day.addEventListener('drop', async (event) => {
      event.preventDefault();
      day.classList.remove('kanban-drop-active');
      const taskId = event.dataTransfer.getData('text/plain');
      await handleCalendarDrop(taskId, dateStr);
    });
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
    updateNavCounts(0);
    return;
  }

  updateNavCounts(files.length);

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
  const isMobile = window.innerWidth <= 1024;
  if (isMobile) {
    sidebar.classList.toggle('show');
    sidebarOverlay.classList.toggle('show');
    return;
  }

  document.body.classList.toggle('sidebar-collapsed');
}

function closeSidebar() {
  sidebar.classList.remove('show');
  sidebarOverlay.classList.remove('show');
  document.body.classList.remove('sidebar-collapsed');
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

  if (tasksSummaryTotal) tasksSummaryTotal.textContent = total;
  if (tasksSummaryOpen) tasksSummaryOpen.textContent = open;
  if (tasksSummaryCompleted) tasksSummaryCompleted.textContent = completed;
  if (tasksSummaryOverdue) tasksSummaryOverdue.textContent = overdue;
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

function renderKanban(viewTasks) {
  const columns = qsa('[data-board-list]', kanbanBoard);
  columns.forEach((column) => {
    column.innerHTML = '';
  });

  const sorted = [...viewTasks].sort((a, b) => new Date(a.deadline || 0) - new Date(b.deadline || 0));
  const grouped = {
    not_started: [],
    in_progress: [],
    done: [],
  };

  sorted.forEach((task) => {
    const status = STATUS_LABELS[task.status] ? task.status : 'not_started';
    grouped[status].push(task);
  });

  Object.keys(grouped).forEach((statusKey) => {
    const column = qs(`[data-board-status="${statusKey}"]`, kanbanBoard);
    if (!column) return;

    const limit = Number(column.dataset.wipLimit || 0);
    const countMeta = qs(`[data-kanban-count="${statusKey}"]`, kanbanBoard);
    if (countMeta) {
      countMeta.textContent = grouped[statusKey].length;
      const metaWrap = countMeta.closest('.kanban-meta');
      if (metaWrap) {
        metaWrap.classList.toggle('is-over', limit > 0 && grouped[statusKey].length > limit);
      }
    }

    const priorityOrder = ['high', 'medium', 'low'];
    priorityOrder.forEach((priority) => {
      const lane = document.createElement('div');
      lane.className = 'kanban-lane';
      lane.innerHTML = `<div class="kanban-lane-title">${priority} priority</div>`;

      grouped[statusKey]
        .filter((task) => (task.priority || 'medium') === priority)
        .forEach((task) => {
          const card = document.createElement('div');
          card.className = 'task-card kanban-task-card mb-2';
          card.draggable = true;
          card.dataset.taskId = task.id;

          card.innerHTML = `
            <div class="task-title">${task.title}</div>
            <div class="task-meta">Deadline: ${formatDate(task.deadline)}</div>
            <div class="task-meta">Priority: ${priority}</div>
            <div class="task-meta">Assignee: ${currentUserName || 'You'}</div>
            <div><span class="status-badge ${statusBadgeClass(task.status)}">${STATUS_LABELS[statusKey]}</span></div>
          `;

          lane.appendChild(card);
        });

      column.appendChild(lane);
    });
  });
}

function renderTasks() {
  const viewTasks = applyFilterSort(tasks);
  tasksTableBody.innerHTML = '';
  tasksCards.innerHTML = '';

  if (!viewTasks.length) {
    tasksEmpty.classList.remove('d-none');
    renderKanban(viewTasks);
    updateTasksVisualization(viewTasks);
    return;
  }

  tasksEmpty.classList.add('d-none');

  viewTasks.forEach((task) => {
    const overdue = isOverdue(task);
    const statusBadge = statusBadgeClass(task.status);

    const row = document.createElement('tr');
    row.innerHTML = `
      <td>${task.title}</td>
      <td class="text-muted">${task.description || '-'}</td>
      <td class="${overdue ? 'status-overdue' : ''}">${formatDate(task.deadline)}</td>
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
    card.innerHTML = `
      <div class="task-title">${task.title}</div>
      <div class="task-meta">${task.description || '-'}</div>
      <div class="task-meta ${overdue ? 'status-overdue' : ''}">Deadline: ${formatDate(task.deadline)}</div>
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

  renderKanban(viewTasks);
  updateTasksVisualization(viewTasks);
}

function renderAllTasks() {
  if (!allTasksCards || !allTasksView) return;

  const viewTasks = applyFilterSort(allTasks);
  allTasksCards.innerHTML = '';

  if (!viewTasks.length) {
    if (allTasksEmpty) allTasksEmpty.classList.remove('d-none');
    return;
  }

  if (allTasksEmpty) allTasksEmpty.classList.add('d-none');

  viewTasks.forEach((task) => {
    const user = usersById[task.user_id] || {};
    const statusLabel = STATUS_LABELS[task.status] || STATUS_LABELS.not_started;
    const card = document.createElement('div');
    card.className = 'task-detail-card';
    card.innerHTML = `
      <div class="task-detail-header">
        <div>
          <div class="task-title">${task.title}</div>
          <div class="task-meta">${task.description || 'No description'}</div>
        </div>
        <span class="status-badge ${statusBadgeClass(task.status)}">${statusLabel}</span>
      </div>
      <div class="task-detail-grid">
        <div class="task-detail-item">
          <span class="label">Assignee</span>
          <span class="value">${user.full_name || user.email || 'Unknown user'}</span>
        </div>
        <div class="task-detail-item">
          <span class="label">Email</span>
          <span class="value">${user.email || '-'}</span>
        </div>
        <div class="task-detail-item">
          <span class="label">Role</span>
          <span class="value">${user.role || 'user'}</span>
        </div>
        <div class="task-detail-item">
          <span class="label">Priority</span>
          <span class="value">${task.priority || 'medium'}</span>
        </div>
        <div class="task-detail-item">
          <span class="label">Deadline</span>
          <span class="value">${formatDate(task.deadline)}</span>
        </div>
        <div class="task-detail-item">
          <span class="label">Project</span>
          <span class="value">${task.project_id || '-'}</span>
        </div>
        <div class="task-detail-item">
          <span class="label">Created</span>
          <span class="value">${formatDate(task.created_at)}</span>
        </div>
        <div class="task-detail-item">
          <span class="label">Updated</span>
          <span class="value">${formatDate(task.updated_at)}</span>
        </div>
        <div class="task-detail-item">
          <span class="label">User ID</span>
          <span class="value">${task.user_id}</span>
        </div>
      </div>
    `;
    allTasksCards.appendChild(card);
  });
}

function renderProjectsDrop() {
  if (!projectSelect) return;
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
    updateNavCounts();
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
  updateNavCounts();
}

async function refreshDashboard() {
  clearAlert(alertBox);
  tasks = await fetchTasks(currentUserId);

  if (currentUserRole === 'admin') {
    const [users, systemTasks] = await Promise.all([
      fetchAllUsers(),
      fetchAllTasks(),
    ]);
    usersById = buildUserMap(users);
    allTasks = systemTasks;
    renderAllTasks();
  }
  renderSummary();
  renderTasks();
  renderCalendar();
  renderProjectsList();
  updateNavCounts();
}

async function initDashboard() {
  const user = await getCurrentUserProfile();
  if (!user) {
    window.location.href = './index.html';
    return;
  }
  currentUserId = user.id;
  currentUserRole = String(user.role || '').toLowerCase();
  currentUserName = user.full_name || user.email || 'You';
  greeting.textContent = `Welcome, ${user.full_name || user.email}`;
  if (currentUserRole === 'admin') {
    greeting.textContent += ' (Admin)';
  }
  if (adminLink) {
    adminLink.classList.toggle('d-none', currentUserRole !== 'admin');
  }
  if (allTasksToggle) {
    allTasksToggle.classList.toggle('d-none', currentUserRole !== 'admin');
  }
  setTaskView('mine');
  setDisplayView('list');

  try {
    projects = await fetchProjects(currentUserId);
    renderProjectsDrop();

    const params = new URLSearchParams(window.location.search);
    const queryProject = params.get('project');
    if (queryProject && projectSelect && projects.some((project) => project.id === queryProject)) {
      selectedProjectId = queryProject;
      projectSelect.value = selectedProjectId;
      info('Project selected. Create or manage tasks for this project.');
    }

    await refreshDashboard();
    await renderUserFiles();
  } catch (err) {
    error(err.message || 'Unable to load dashboard data.');
  }
}

qsa('[data-filter]').forEach((button) => {
  button.addEventListener('click', () => {
    qsa('[data-filter]').forEach((btn) => btn.classList.remove('active'));
    button.classList.add('active');
    activeFilter = button.dataset.filter;
    renderTasks();
    if (currentUserRole === 'admin') {
      renderAllTasks();
    }
  });
});

taskViewButtons.forEach((button) => {
  button.addEventListener('click', () => {
    setTaskView(button.dataset.taskView);
  });
});

displayViewButtons.forEach((button) => {
  button.addEventListener('click', () => {
    setDisplayView(button.dataset.displayView);
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
    } catch (err) {
      error(err.message || 'Unable to move task on board.');
    }
  });
});

sortButton.addEventListener('click', () => {
  sortDirection = sortDirection === 'asc' ? 'desc' : 'asc';
  sortButton.textContent = `Sort: ${sortDirection.toUpperCase()}`;
  renderTasks();
  if (currentUserRole === 'admin') {
    renderAllTasks();
  }
});

// Calendar navigation
if (calendarPrev) {
  calendarPrev.addEventListener('click', () => {
    if (calendarView === 'month') {
      currentCalendarDate.setMonth(currentCalendarDate.getMonth() - 1);
    } else if (calendarView === 'week') {
      currentCalendarDate.setDate(currentCalendarDate.getDate() - 7);
    } else {
      currentCalendarDate.setDate(currentCalendarDate.getDate() - 1);
    }
    renderCalendar();
  });
}

if (calendarNext) {
  calendarNext.addEventListener('click', () => {
    if (calendarView === 'month') {
      currentCalendarDate.setMonth(currentCalendarDate.getMonth() + 1);
    } else if (calendarView === 'week') {
      currentCalendarDate.setDate(currentCalendarDate.getDate() + 7);
    } else {
      currentCalendarDate.setDate(currentCalendarDate.getDate() + 1);
    }
    renderCalendar();
  });
}

calendarViewButtons.forEach((button) => {
  button.addEventListener('click', () => {
    setCalendarView(button.dataset.calView);
  });
});

if (calendarStatusFilter) {
  calendarStatusFilter.addEventListener('change', () => {
    calendarFilters.status = calendarStatusFilter.value;
    renderCalendar();
  });
}

if (calendarPriorityFilter) {
  calendarPriorityFilter.addEventListener('change', () => {
    calendarFilters.priority = calendarPriorityFilter.value;
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
  } catch (err) {
    error(err.message || 'Unable to create task.');
  } finally {
    setLoading(submitButton, false);
  }
});

if (tasksPanel) {
  tasksPanel.addEventListener('click', async (event) => {
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
    } catch (err) {
      error(err.message || 'Action failed.');
    }
  });
}

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
    } catch (err) {
      error(err.message || 'Unable to upload file.');
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
    } catch (err) {
      error(err.message || 'Unable to download file.');
    } finally {
      button.disabled = false;
    }
  });
}

/* ========== Sidebar Navigation Event Listeners ========== */

if (sidebarToggle) {
  sidebarToggle.addEventListener('click', toggleSidebar);
}

if (sidebarToggleDesktop) {
  sidebarToggleDesktop.addEventListener('click', toggleSidebar);
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
