import { getCurrentUserProfile, logoutUser } from '../services/auth-service.js';
import { qs, setAlert, clearAlert } from '../utils/dom-utils.js';
import { applyTimeTheme } from '../utils/time-theme.js';

const adminLink = qs('#contact-admin-link');
const logoutButton = qs('#contact-logout-button');
const alertBox = qs('#contact-alert');

function showSentNoticeIfNeeded() {
  const params = new URLSearchParams(window.location.search);
  if (params.get('sent') !== '1') return;
  setAlert(alertBox, 'Message sent successfully. Thanks — we’ll reply soon.', 'success');

  // Clean URL (optional, best-effort)
  try {
    const url = new URL(window.location.href);
    url.searchParams.delete('sent');
    window.history.replaceState({}, '', url.toString());
  } catch {
    // ignore
  }
}

async function initAuthUi() {
  try {
    const user = await getCurrentUserProfile();

    if (adminLink) {
      adminLink.classList.toggle('d-none', user?.role !== 'admin');
    }

    if (logoutButton) {
      logoutButton.classList.toggle('d-none', !user);
    }

    if (logoutButton) {
      logoutButton.addEventListener('click', async () => {
        clearAlert(alertBox);
        try {
          await logoutUser();
        } finally {
          window.location.href = './index.html';
        }
      });
    }
  } catch (err) {
    if (adminLink) adminLink.classList.add('d-none');
    if (logoutButton) logoutButton.classList.add('d-none');
  }
}

async function init() {
  applyTimeTheme();
  showSentNoticeIfNeeded();
  await initAuthUi();
}

init();
