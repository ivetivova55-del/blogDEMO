const APP_DESCRIPTION =
  "DigitalMarketingQUILL Tasker е уеб приложение, създадено за дигитални маркетолози и блогъри, за да организират лесно работния си процес. Приложението изисква регистрация и вход. След успешен логин, потребителят получава достъп до персонален панел (Dashboard). Там той може да създава маркетингови задачи (например: 'Писане на SEO статия'), да им задава описание и краен срок (deadline), и да ги преглежда в удобен табличен вид. Всяка задача може да бъде променяна със статус 'Отворена' (Open) или 'Завършена' (Completed).";

const STATUS_LABELS = {
  OPEN: "Отворена",
  COMPLETED: "Завършена",
};

const USER_ROLES = {
  USER: "USER",
  ADMIN: "ADMIN",
};

const ROLE_LABELS = {
  USER: "Потребител",
  ADMIN: "Админ",
};

const SPECIAL_USERS = [
  {
    name: "DigiQuill Admin",
    email: "admin@digiquill.com",
    password: "admin123456",
    role: USER_ROLES.ADMIN,
  },
  {
    name: "DigiQuill Demo",
    email: "demo@digiquill.com",
    password: "demo123456",
    role: USER_ROLES.USER,
  },
];

const FILTER_LABELS = {
  ALL: "Всички",
  OPEN: "Отворени",
  COMPLETED: "Завършени",
};

const STORAGE_KEYS = {
  USERS: "dmq_users",
  SESSION: "dmq_session",
  TASKS: "dmq_tasks",
};

const app = document.getElementById("app");

let activeFilter = "ALL";
let sortDirection = "asc";
let editingTaskId = null;

const formatDate = (value) => {
  if (!value) return "-";
  const date = new Date(value);
  return date.toLocaleDateString("bg-BG", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
};

const isOverdue = (task) => {
  if (task.status !== "OPEN") return false;
  const today = new Date();
  const todayDay = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  const deadline = new Date(task.deadline);
  const deadlineDay = new Date(
    deadline.getFullYear(),
    deadline.getMonth(),
    deadline.getDate()
  );
  return deadlineDay < todayDay;
};

const getStored = (key, fallback) => {
  try {
    const stored = localStorage.getItem(key);
    return stored ? JSON.parse(stored) : fallback;
  } catch (error) {
    return fallback;
  }
};

const setStored = (key, value) => {
  localStorage.setItem(key, JSON.stringify(value));
};

const getSession = () => getStored(STORAGE_KEYS.SESSION, null);
const setSession = (session) => setStored(STORAGE_KEYS.SESSION, session);

const normalizeUser = (user) => ({
  ...user,
  role: user?.role === USER_ROLES.ADMIN ? USER_ROLES.ADMIN : USER_ROLES.USER,
});

const getUsers = () => getStored(STORAGE_KEYS.USERS, []).map(normalizeUser);
const setUsers = (users) => setStored(STORAGE_KEYS.USERS, users);

const isProtectedUser = (email) =>
  SPECIAL_USERS.some((user) => user.email === email);

const ensureSpecialUsers = () => {
  const users = getUsers();
  let hasChanges = false;

  SPECIAL_USERS.forEach((specialUser) => {
    const existing = users.find((user) => user.email === specialUser.email);
    if (!existing) {
      users.push({ ...specialUser });
      hasChanges = true;
      return;
    }

    if (existing.role !== specialUser.role) {
      existing.role = specialUser.role;
      hasChanges = true;
    }
  });

  if (hasChanges) {
    setUsers(users);
  }
};

const getTaskMap = () => getStored(STORAGE_KEYS.TASKS, {});

const getTaskCountByEmail = (email) => {
  const taskMap = getTaskMap();
  return Array.isArray(taskMap[email]) ? taskMap[email].length : 0;
};

const getTasksByUser = (email) => {
  const allTasks = getStored(STORAGE_KEYS.TASKS, {});
  if (!allTasks[email]) {
    allTasks[email] = [
      {
        id: `task-${Date.now()}`,
        title: "Писане на SEO статия",
        description: "Създай структура, ключови думи и CTA за новата кампания.",
        deadline: "2026-02-14",
        status: "OPEN",
      },
      {
        id: `task-${Date.now() + 1}`,
        title: "Одит на имейл кампания",
        description: "Провери click-through и сегментация за Q1 серията.",
        deadline: "2026-02-08",
        status: "COMPLETED",
      },
      {
        id: `task-${Date.now() + 2}`,
        title: "Планиране на блог календар",
        description: "Подготви 4 теми за март и предложи автори.",
        deadline: "2026-02-20",
        status: "OPEN",
      },
    ];
    setStored(STORAGE_KEYS.TASKS, allTasks);
  }
  return allTasks[email];
};

const setTasksByUser = (email, tasks) => {
  const allTasks = getStored(STORAGE_KEYS.TASKS, {});
  allTasks[email] = tasks;
  setStored(STORAGE_KEYS.TASKS, allTasks);
};

const getFilteredSortedTasks = (tasks) => {
  const filtered =
    activeFilter === "ALL"
      ? tasks
      : tasks.filter((task) => task.status === activeFilter);

  return [...filtered].sort((a, b) => {
    const aDate = new Date(a.deadline);
    const bDate = new Date(b.deadline);
    return sortDirection === "asc" ? aDate - bDate : bDate - aDate;
  });
};

const icon = {
  check: () =>
    `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6 9 17l-5-5"/></svg>`,
  undo: () =>
    `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 7v6h6"/><path d="M21 17a9 9 0 0 0-9-9H3"/></svg>`,
  edit: () =>
    `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 20h9"/><path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z"/></svg>`,
  trash: () =>
    `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 6h18"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/></svg>`,
  clipboard: () =>
    `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect x="9" y="2" width="6" height="4" rx="1"/><path d="M4 6a2 2 0 0 1 2-2h2"/><path d="M18 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6"/></svg>`,
  sort: (direction) =>
    direction === "asc"
      ? "▲"
      : "▼",
};

const renderAuth = (variant = "login", error = "") => {
  ensureSpecialUsers();

  app.innerHTML = `
    <header>
      <p>DigitalMarketingQUILL</p>
      <h1>Вход и регистрация</h1>
      <div class="subtitle">${APP_DESCRIPTION}</div>
    </header>

    <section class="grid">
      <div class="card">
        <h2>${variant === "login" ? "Вход" : "Регистрация"}</h2>
        <form id="auth-form">
          ${
            variant === "register"
              ? `
                <div>
                  <label for="name">Име</label>
                  <input id="name" name="name" required placeholder="Мария Иванова" />
                </div>
              `
              : ""
          }
          <div>
            <label for="email">Имейл</label>
            <input id="email" name="email" type="email" required placeholder="maria@agency.bg" />
          </div>
          <div>
            <label for="password">Парола</label>
            <input id="password" name="password" type="password" required />
          </div>
          ${
            error
              ? `<div class="empty" role="alert">${error}</div>`
              : ""
          }
          <button type="submit">${
            variant === "login" ? "Влез" : "Регистрирай"
          }</button>
        </form>
        <p class="subtitle" style="margin-top: 12px;">
          ${
            variant === "login"
              ? "Нямаш профил?"
              : "Имаш профил?"
          }
          <button class="action-btn" id="toggle-auth" type="button" style="margin-left: 8px;">
            ${variant === "login" ? "Регистрация" : "Вход"}
          </button>
        </p>
        ${
          variant === "login"
            ? `
              <p class="subtitle" style="margin-top: 12px;">
                Специални профили: demo@digiquill.com / demo123456 и admin@digiquill.com / admin123456
              </p>
            `
            : ""
        }
      </div>
    </section>
  `;

  document.getElementById("toggle-auth").addEventListener("click", () => {
    renderAuth(variant === "login" ? "register" : "login");
  });

  document.getElementById("auth-form").addEventListener("submit", (event) => {
    event.preventDefault();
    const formData = new FormData(event.target);
    const email = formData.get("email").trim().toLowerCase();
    const password = formData.get("password").trim();
    const name = formData.get("name")?.trim();

    if (!email || !password || (variant === "register" && !name)) {
      renderAuth(variant, "Моля, попълни всички полета.");
      return;
    }

    const users = getUsers();

    if (variant === "register") {
      const exists = users.some((user) => user.email === email);
      if (exists) {
        renderAuth("register", "Този имейл вече е регистриран.");
        return;
      }

      users.push({ name, email, password, role: USER_ROLES.USER });
      setUsers(users);
      setSession({ name, email, role: USER_ROLES.USER });
      renderDashboard();
      return;
    }

    const user = users.find(
      (entry) => entry.email === email && entry.password === password
    );

    if (!user) {
      renderAuth("login", "Невалиден имейл или парола.");
      return;
    }

    setSession({ name: user.name, email: user.email, role: user.role });
    renderDashboard();
  });
};

const renderAdminPanel = () => {
  const session = getSession();
  if (!session) {
    renderAuth("login");
    return;
  }

  if (session.role !== USER_ROLES.ADMIN) {
    renderDashboard();
    return;
  }

  ensureSpecialUsers();
  const users = getUsers();

  app.innerHTML = `
    <header>
      <p>Admin Panel</p>
      <h1>Управление на потребители и роли</h1>
      <div class="subtitle">Влезнал си като ${session.email} (${ROLE_LABELS[session.role]})</div>
      <div style="display: flex; gap: 10px; flex-wrap: wrap; margin-top: 12px;">
        <button class="action-btn" id="back-dashboard" type="button">Към Dashboard</button>
        <button class="action-btn" id="logout" type="button">Изход</button>
      </div>
    </header>

    <section class="grid">
      <div class="card">
        <h2>Потребители</h2>
        <table>
          <thead>
            <tr>
              <th>Име</th>
              <th>Имейл</th>
              <th>Роля</th>
              <th>Задачи</th>
              <th>Действия</th>
            </tr>
          </thead>
          <tbody>
            ${users
              .map((user) => {
                const isSelf = user.email === session.email;
                const isProtected = isProtectedUser(user.email);

                return `
                  <tr data-user-email="${user.email}">
                    <td>${user.name}</td>
                    <td>${user.email}</td>
                    <td>
                      <span class="status ${user.role === USER_ROLES.ADMIN ? "completed" : "open"}">
                        ${ROLE_LABELS[user.role]}
                      </span>
                    </td>
                    <td>${getTaskCountByEmail(user.email)}</td>
                    <td>
                      <div class="icon-btns">
                        <button
                          class="icon-btn"
                          data-admin-action="toggle-role"
                          ${isProtected ? "disabled" : ""}
                          title="${
                            user.role === USER_ROLES.ADMIN
                              ? "Направи потребител"
                              : "Направи админ"
                          }"
                        >
                          ${icon.edit()}
                        </button>
                        <button
                          class="icon-btn danger"
                          data-admin-action="delete-user"
                          ${isProtected || isSelf ? "disabled" : ""}
                          title="Изтриване"
                        >
                          ${icon.trash()}
                        </button>
                      </div>
                    </td>
                  </tr>
                `;
              })
              .join("")}
          </tbody>
        </table>
      </div>

      <div class="card">
        <h2>Специални потребители</h2>
        <p class="subtitle" style="margin-bottom: 12px;">Тези акаунти са защитени и винаги съществуват в системата.</p>
        <ul>
          ${SPECIAL_USERS.map(
            (user) => `
              <li style="margin: 8px 0;">
                <strong>${user.email}</strong> — ${ROLE_LABELS[user.role]}
              </li>
            `
          ).join("")}
        </ul>
      </div>
    </section>
  `;

  document.getElementById("back-dashboard").addEventListener("click", () => {
    renderDashboard();
  });

  document.getElementById("logout").addEventListener("click", () => {
    setSession(null);
    renderAuth("login");
  });

  app.querySelectorAll("[data-admin-action]").forEach((button) => {
    button.addEventListener("click", () => {
      const row = button.closest("tr");
      const email = row?.dataset.userEmail;
      if (!email) return;

      if (button.dataset.adminAction === "toggle-role") {
        if (isProtectedUser(email)) return;

        const usersList = getUsers();
        const updatedUsers = usersList.map((user) => {
          if (user.email !== email) return user;
          return {
            ...user,
            role:
              user.role === USER_ROLES.ADMIN
                ? USER_ROLES.USER
                : USER_ROLES.ADMIN,
          };
        });

        setUsers(updatedUsers);

        const updatedSessionUser = updatedUsers.find(
          (user) => user.email === session.email
        );
        if (updatedSessionUser) {
          setSession({
            name: updatedSessionUser.name,
            email: updatedSessionUser.email,
            role: updatedSessionUser.role,
          });
        }

        renderAdminPanel();
        return;
      }

      if (button.dataset.adminAction === "delete-user") {
        if (isProtectedUser(email) || email === session.email) return;

        const confirmed = window.confirm(
          "Сигурни ли сте, че искате да изтриете потребителя?"
        );
        if (!confirmed) return;

        const usersList = getUsers();
        const updatedUsers = usersList.filter((user) => user.email !== email);
        setUsers(updatedUsers);

        const taskMap = getTaskMap();
        if (taskMap[email]) {
          delete taskMap[email];
          setStored(STORAGE_KEYS.TASKS, taskMap);
        }

        renderAdminPanel();
      }
    });
  });
};

const renderDashboard = () => {
  const session = getSession();
  if (!session) {
    renderAuth("login");
    return;
  }

  const tasks = getTasksByUser(session.email);
  const viewTasks = getFilteredSortedTasks(tasks);

  app.innerHTML = `
    <header>
      <p>Dashboard</p>
      <h1>Здравей, ${session.name}</h1>
      <div class="subtitle">Влезнал си като ${session.email} (${ROLE_LABELS[session.role] || ROLE_LABELS.USER})</div>
      <div style="display: flex; gap: 10px; flex-wrap: wrap; margin-top: 12px;">
        ${
          session.role === USER_ROLES.ADMIN
            ? `<button class="action-btn" id="open-admin" type="button">Админ панел</button>`
            : ""
        }
        <button class="action-btn" id="logout" type="button">Изход</button>
      </div>
    </header>

    <section class="grid">
      <div class="card">
        <h2>${editingTaskId ? "Редакция на задача" : "Създай задача"}</h2>
        <form id="task-form">
          <div>
            <label for="title">Заглавие</label>
            <input id="title" name="title" required placeholder="Напр. Писане на SEO статия" />
          </div>
          <div>
            <label for="description">Описание</label>
            <textarea id="description" name="description" required></textarea>
          </div>
          <div>
            <label for="deadline">Краен срок</label>
            <input id="deadline" name="deadline" type="date" required />
          </div>
          <button type="submit">${
            editingTaskId ? "Запази" : "Добави задача"
          }</button>
          ${
            editingTaskId
              ? `<button type="button" class="action-btn" id="cancel-edit">Откажи</button>`
              : ""
          }
        </form>
      </div>

      <div class="card">
        <h2>Текущи задачи</h2>
        <div class="toolbar">
          <div class="filters" role="tablist">
            ${Object.entries(FILTER_LABELS)
              .map(
                ([key, label]) => `
                  <button
                    class="filter-btn ${activeFilter === key ? "active" : ""}"
                    data-filter="${key}"
                    type="button"
                  >
                    ${label}
                  </button>
                `
              )
              .join("")}
          </div>
          <button class="filter-btn" id="sort-deadline" type="button">
            Краен срок ${icon.sort(sortDirection)}
          </button>
        </div>
        <table>
          <thead>
            <tr>
              <th>Заглавие</th>
              <th>Описание</th>
              <th>Краен срок</th>
              <th>Статус</th>
              <th>Действия</th>
            </tr>
          </thead>
          <tbody>
            ${
              viewTasks.length
                ? viewTasks
                    .map((task) => {
                      const overdue = isOverdue(task);
                      return `
                        <tr data-id="${task.id}" class="${
                          task.status === "COMPLETED" ? "row-completed" : ""
                        }">
                          <td class="task-title">${task.title}</td>
                          <td title="${task.description}">
                            <div class="truncate-2">${task.description}</div>
                          </td>
                          <td class="${overdue ? "overdue" : ""}">${formatDate(
                        task.deadline
                      )}</td>
                          <td>
                            <span class="status ${task.status.toLowerCase()}">
                              ${STATUS_LABELS[task.status]}
                            </span>
                          </td>
                          <td>
                            <div class="icon-btns">
                              <button class="icon-btn" data-action="toggle" title="${
                                task.status === "OPEN" ? "Маркирай като завършена" : "Отвори отново"
                              }">
                                ${task.status === "OPEN" ? icon.check() : icon.undo()}
                              </button>
                              <button class="icon-btn" data-action="edit" title="Редакция">
                                ${icon.edit()}
                              </button>
                              <button class="icon-btn danger" data-action="delete" title="Изтриване">
                                ${icon.trash()}
                              </button>
                            </div>
                          </td>
                        </tr>
                      `;
                    })
                    .join("")
                : `
                  <tr>
                    <td colspan="5">
                      <div class="empty-state">
                        <div class="empty-icon">${icon.clipboard()}</div>
                        <div>Все още нямате задачи. Създайте първата си задача от формата вляво!</div>
                      </div>
                    </td>
                  </tr>
                `
            }
          </tbody>
        </table>

        <div class="cards">
          ${
            viewTasks.length
              ? viewTasks
                  .map((task) => {
                    const overdue = isOverdue(task);
                    return `
                      <div class="task-card ${
                        task.status === "COMPLETED" ? "row-completed" : ""
                      }" data-id="${task.id}">
                        <div class="task-title">${task.title}</div>
                        <div class="task-meta">${task.description}</div>
                        <div class="task-meta ${overdue ? "overdue" : ""}">
                          Краен срок: ${formatDate(task.deadline)}
                        </div>
                        <div>
                          <span class="status ${task.status.toLowerCase()}">
                            ${STATUS_LABELS[task.status]}
                          </span>
                        </div>
                        <div class="icon-btns">
                          <button class="icon-btn" data-action="toggle" title="${
                            task.status === "OPEN" ? "Маркирай като завършена" : "Отвори отново"
                          }">
                            ${task.status === "OPEN" ? icon.check() : icon.undo()}
                          </button>
                          <button class="icon-btn" data-action="edit" title="Редакция">
                            ${icon.edit()}
                          </button>
                          <button class="icon-btn danger" data-action="delete" title="Изтриване">
                            ${icon.trash()}
                          </button>
                        </div>
                      </div>
                    `;
                  })
                  .join("")
              : ""
          }
        </div>
      </div>
    </section>
  `;

  document.getElementById("logout").addEventListener("click", () => {
    setSession(null);
    renderAuth("login");
  });

  if (session.role === USER_ROLES.ADMIN) {
    document.getElementById("open-admin").addEventListener("click", () => {
      renderAdminPanel();
    });
  }

  const form = document.getElementById("task-form");
  if (editingTaskId) {
    const current = tasks.find((task) => task.id === editingTaskId);
    if (current) {
      form.querySelector("#title").value = current.title;
      form.querySelector("#description").value = current.description;
      form.querySelector("#deadline").value = current.deadline;
    }
  }

  if (editingTaskId) {
    document.getElementById("cancel-edit").addEventListener("click", () => {
      editingTaskId = null;
      renderDashboard();
    });
  }

  form.addEventListener("submit", (event) => {
    event.preventDefault();
    const formData = new FormData(form);
    const newTask = {
      title: formData.get("title").trim(),
      description: formData.get("description").trim(),
      deadline: formData.get("deadline"),
      status: "OPEN",
    };

    let updatedTasks = [...tasks];
    if (editingTaskId) {
      updatedTasks = updatedTasks.map((task) =>
        task.id === editingTaskId
          ? { ...task, ...newTask }
          : task
      );
      editingTaskId = null;
    } else {
      updatedTasks = [{ id: `task-${Date.now()}`, ...newTask }, ...updatedTasks];
    }
    setTasksByUser(session.email, updatedTasks);
    renderDashboard();
  });

  document.querySelectorAll("[data-filter]").forEach((button) => {
    button.addEventListener("click", () => {
      activeFilter = button.dataset.filter;
      renderDashboard();
    });
  });

  document.getElementById("sort-deadline").addEventListener("click", () => {
    sortDirection = sortDirection === "asc" ? "desc" : "asc";
    renderDashboard();
  });

  app.querySelectorAll("[data-action]").forEach((button) => {
    button.addEventListener("click", () => {
      const parent = button.closest("tr") || button.closest(".task-card");
      const id = parent?.dataset.id;
      if (!id) return;

      if (button.dataset.action === "toggle") {
        const updatedTasks = tasks.map((item) =>
          item.id === id
            ? {
                ...item,
                status: item.status === "OPEN" ? "COMPLETED" : "OPEN",
              }
            : item
        );
        setTasksByUser(session.email, updatedTasks);
        renderDashboard();
        return;
      }

      if (button.dataset.action === "edit") {
        editingTaskId = id;
        renderDashboard();
        return;
      }

      if (button.dataset.action === "delete") {
        const confirmed = window.confirm("Сигурни ли сте, че искате да изтриете задачата?");
        if (!confirmed) return;
        const updatedTasks = tasks.filter((item) => item.id !== id);
        setTasksByUser(session.email, updatedTasks);
        renderDashboard();
      }
    });
  });
};

const init = () => {
  ensureSpecialUsers();
  const session = getSession();
  if (session?.email) {
    if (!session.role) {
      const user = getUsers().find((entry) => entry.email === session.email);
      if (user) {
        setSession({ name: user.name, email: user.email, role: user.role });
      }
    }
    renderDashboard();
  } else {
    renderAuth("login");
  }
};

init();
