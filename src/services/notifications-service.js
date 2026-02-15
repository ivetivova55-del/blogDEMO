let notificationContainer = null;
const activeNotifications = [];
const NOTIFICATION_DURATION = 4000;

function ensureContainer() {
  if (notificationContainer) return;

  notificationContainer = document.createElement('div');
  notificationContainer.id = 'notification-container';
  notificationContainer.className = 'notification-container';
  document.body.appendChild(notificationContainer);
}

function getIcon(type) {
  const icons = {
    success: '✓',
    error: '✕',
    info: 'ℹ',
    warning: '⚠',
  };
  return icons[type] || icons.info;
}

export function showNotification(message, type = 'info', duration = NOTIFICATION_DURATION) {
  ensureContainer();

  const id = `notification-${Date.now()}-${Math.random()}`;
  const icon = getIcon(type);

  const notification = document.createElement('div');
  notification.id = id;
  notification.className = `notification notification-${type}`;
  notification.innerHTML = `
    <div class="notification-icon">${icon}</div>
    <div class="notification-content">
      <div class="notification-message">${message}</div>
    </div>
    <button class="notification-close" type="button" aria-label="Close notification">×</button>
  `;

  notification.addEventListener('click', (e) => {
    if (e.target.closest('.notification-close')) {
      closeNotification(id);
    }
  });

  notificationContainer.appendChild(notification);
  activeNotifications.push(id);

  // Trigger animation
  requestAnimationFrame(() => {
    notification.classList.add('show');
  });

  if (duration > 0) {
    setTimeout(() => {
      closeNotification(id);
    }, duration);
  }

  return id;
}

export function closeNotification(id) {
  const notification = document.getElementById(id);
  if (!notification) return;

  notification.classList.remove('show');

  setTimeout(() => {
    notification.remove();
    const index = activeNotifications.indexOf(id);
    if (index > -1) {
      activeNotifications.splice(index, 1);
    }
  }, 300);
}

export function closeAll() {
  const ids = [...activeNotifications];
  ids.forEach(id => closeNotification(id));
}

export function success(message, duration) {
  return showNotification(message, 'success', duration);
}

export function error(message, duration) {
  return showNotification(message, 'error', duration);
}

export function info(message, duration) {
  return showNotification(message, 'info', duration);
}

export function warning(message, duration) {
  return showNotification(message, 'warning', duration);
}
