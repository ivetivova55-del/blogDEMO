const APP_DESCRIPTION =
  "DigitalMarketingQUILL Tasker е уеб приложение, създадено за дигитални маркетолози и блогъри, за да организират лесно работния си процес. Приложението изисква регистрация и вход. След успешен логин, потребителят получава достъп до персонален панел (Dashboard). Там той може да създава маркетингови задачи (например: 'Писане на SEO статия'), да им задава описание и краен срок (deadline), и да ги преглежда в удобен табличен вид. Всяка задача може да бъде променяна със статус 'Отворена' (Open) или 'Завършена' (Completed).";

const STATUS_LABELS = {
  OPEN: "Отворена",
  COMPLETED: "Завършена",
};

const STORAGE_KEYS = {
  USERS: "dmq_users",
  SESSION: "dmq_session",
  TASKS: "dmq_tasks",
};

const app = document.getElementById("app");

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

const getUsers = () => getStored(STORAGE_KEYS.USERS, []);
const setUsers = (users) => setStored(STORAGE_KEYS.USERS, users);

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

const renderAuth = (variant = "login", error = "") => {
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

      users.push({ name, email, password });
      setUsers(users);
      setSession({ name, email });
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

    setSession({ name: user.name, email: user.email });
    renderDashboard();
  });
};

const renderDashboard = () => {
  const session = getSession();
  if (!session) {
    renderAuth("login");
    return;
  }

  const tasks = getTasksByUser(session.email);

  app.innerHTML = `
    <header>
      <p>Dashboard</p>
      <h1>Здравей, ${session.name}</h1>
      <div class="subtitle">Влезнал си като ${session.email}</div>
      <button class="action-btn" id="logout" type="button">Изход</button>
    </header>

    <section class="grid">
      <div class="card">
        <h2>Създай задача</h2>
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
          <button type="submit">Добави задача</button>
        </form>
      </div>

      <div class="card">
        <h2>Текущи задачи</h2>
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
              tasks.length
                ? tasks
                    .map((task) => {
                      const overdue = isOverdue(task);
                      return `
                        <tr data-id="${task.id}">
                          <td>${task.title}</td>
                          <td>${task.description}</td>
                          <td class="${overdue ? "overdue" : ""}">${formatDate(
                        task.deadline
                      )}</td>
                          <td>
                            <span class="status ${task.status.toLowerCase()}">
                              ${STATUS_LABELS[task.status]}
                            </span>
                          </td>
                          <td>
                            <button class="action-btn" data-action="toggle">
                              Превключи
                            </button>
                          </td>
                        </tr>
                      `;
                    })
                    .join("")
                : `<tr><td class="empty" colspan="5">Няма задачи. Създай първата си задача.</td></tr>`
            }
          </tbody>
        </table>
      </div>
    </section>
  `;

  document.getElementById("logout").addEventListener("click", () => {
    setSession(null);
    renderAuth("login");
  });

  const form = document.getElementById("task-form");
  form.addEventListener("submit", (event) => {
    event.preventDefault();
    const formData = new FormData(form);
    const newTask = {
      id: `task-${Date.now()}`,
      title: formData.get("title").trim(),
      description: formData.get("description").trim(),
      deadline: formData.get("deadline"),
      status: "OPEN",
    };

    const updatedTasks = [newTask, ...tasks];
    setTasksByUser(session.email, updatedTasks);
    renderDashboard();
  });

  app.querySelectorAll("[data-action='toggle']").forEach((button) => {
    button.addEventListener("click", () => {
      const row = button.closest("tr");
      const id = row?.dataset.id;
      const task = tasks.find((item) => item.id === id);
      if (!task) return;
      const updatedTasks = tasks.map((item) =>
        item.id === id
          ? { ...item, status: item.status === "OPEN" ? "COMPLETED" : "OPEN" }
          : item
      );
      setTasksByUser(session.email, updatedTasks);
      renderDashboard();
    });
  });
};

const init = () => {
  const session = getSession();
  if (session?.email) {
    renderDashboard();
  } else {
    renderAuth("login");
  }
};

init();
