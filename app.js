const APP_DESCRIPTION =
  "DigitalMarketingQUILL Tasker е уеб приложение, създадено за дигитални маркетолози и блогъри, за да организират лесно работния си процес. Приложението изисква регистрация и вход. След успешен логин, потребителят получава достъп до персонален панел (Dashboard). Там той може да създава маркетингови задачи (например: 'Писане на SEO статия'), да им задава описание и краен срок (deadline), и да ги преглежда в удобен табличен вид. Всяка задача може да бъде променяна със статус 'Отворена' (Open) или 'Завършена' (Completed).";

const STATUS_LABELS = {
  OPEN: "Отворена",
  COMPLETED: "Завършена",
};

const tasks = [
  {
    id: "task-1",
    title: "Писане на SEO статия",
    description: "Създай структура, ключови думи и CTA за новата кампания.",
    deadline: "2026-02-14",
    status: "OPEN",
  },
  {
    id: "task-2",
    title: "Одит на имейл кампания",
    description: "Провери click-through и сегментация за Q1 серията.",
    deadline: "2026-02-08",
    status: "COMPLETED",
  },
  {
    id: "task-3",
    title: "Планиране на блог календар",
    description: "Подготви 4 теми за март и предложи автори.",
    deadline: "2026-02-20",
    status: "OPEN",
  },
];

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

const render = () => {
  app.innerHTML = `
    <header>
      <p>DigitalMarketingQUILL</p>
      <h1>Контролен център за маркетингови задачи</h1>
      <div class="subtitle">${APP_DESCRIPTION}</div>
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

    tasks.unshift(newTask);
    render();
  });

  app.querySelectorAll("[data-action='toggle']").forEach((button) => {
    button.addEventListener("click", () => {
      const row = button.closest("tr");
      const id = row?.dataset.id;
      const task = tasks.find((item) => item.id === id);
      if (!task) return;
      task.status = task.status === "OPEN" ? "COMPLETED" : "OPEN";
      render();
    });
  });
};

render();
