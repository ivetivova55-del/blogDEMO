import { registerUser, loginUser, getCurrentUserProfile } from '../services/auth-service.js';
import { qs, qsa, setAlert, clearAlert, setLoading } from '../utils/dom-utils.js';

const loginForm = qs('#login-form');
const registerForm = qs('#register-form');
const alertBox = qs('#auth-alert');

function toggleForms(mode) {
  if (mode === 'register') {
    loginForm.classList.add('d-none');
    registerForm.classList.remove('d-none');
  } else {
    registerForm.classList.add('d-none');
    loginForm.classList.remove('d-none');
  }
  clearAlert(alertBox);
}

qsa('[data-auth-toggle]').forEach((button) => {
  button.addEventListener('click', () => {
    toggleForms(button.dataset.authToggle);
  });
});

loginForm.addEventListener('submit', async (event) => {
  event.preventDefault();
  clearAlert(alertBox);
  const submitButton = loginForm.querySelector('button[type="submit"]');
  setLoading(submitButton, true, 'Signing in...');

  try {
    const formData = new FormData(loginForm);
    await loginUser({
      email: formData.get('email').trim(),
      password: formData.get('password').trim(),
    });
    window.location.href = './dashboard.html';
  } catch (error) {
    setAlert(alertBox, error.message || 'Unable to sign in.');
  } finally {
    setLoading(submitButton, false);
  }
});

registerForm.addEventListener('submit', async (event) => {
  event.preventDefault();
  clearAlert(alertBox);
  const submitButton = registerForm.querySelector('button[type="submit"]');
  setLoading(submitButton, true, 'Creating...');

  try {
    const formData = new FormData(registerForm);
    await registerUser({
      fullName: formData.get('fullName').trim(),
      email: formData.get('email').trim(),
      password: formData.get('password').trim(),
    });
    setAlert(alertBox, 'Account created. Check your email to confirm, then sign in.', 'success');
    toggleForms('login');
  } catch (error) {
    setAlert(alertBox, error.message || 'Unable to register.');
  } finally {
    setLoading(submitButton, false);
  }
});

(async () => {
  const user = await getCurrentUserProfile();
  if (user) {
    window.location.href = './dashboard.html';
  }
})();
