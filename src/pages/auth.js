import { registerUser, loginUser, getCurrentUserProfile } from '../services/auth-service.js';
import { qs, qsa, setAlert, clearAlert, setLoading } from '../utils/dom-utils.js';

const loginForm = qs('#login-form');
const registerForm = qs('#register-form');
const alertBox = qs('#auth-alert');
const toggleButtons = qsa('[data-auth-toggle]');

let activeMode = 'login';
let isSubmitting = false;

function showAlert(message, variant = 'danger') {
  setAlert(alertBox, message, variant);
}

function setToggleState(mode) {
  toggleButtons.forEach((button) => {
    const isActive = button.dataset.authToggle === mode;
    button.classList.toggle('btn-dark', isActive);
    button.classList.toggle('btn-outline-dark', !isActive);
    button.setAttribute('aria-pressed', String(isActive));
    button.disabled = isSubmitting;
  });
}

function setAuthDisabled(disabled) {
  isSubmitting = disabled;
  setToggleState(activeMode);
}

function validateEmail(email) {
  return /^\S+@\S+\.\S+$/.test(email);
}

function validateLogin({ email, password }) {
  if (!email || !password) {
    return 'Please fill in email and password.';
  }

  if (!validateEmail(email)) {
    return 'Please enter a valid email address.';
  }

  if (password.length < 6) {
    return 'Password must be at least 6 characters.';
  }

  return null;
}

function validateRegister({ fullName, email, password }) {
  if (!fullName || !email || !password) {
    return 'Please fill in all required fields.';
  }

  if (fullName.trim().length < 2) {
    return 'Full name must be at least 2 characters.';
  }

  if (!validateEmail(email)) {
    return 'Please enter a valid email address.';
  }

  if (password.length < 6) {
    return 'Password must be at least 6 characters.';
  }

  return null;
}

function toggleForms(mode, options = {}) {
  const { preserveAlert = false } = options;
  activeMode = mode === 'register' ? 'register' : 'login';

  if (mode === 'register') {
    loginForm.classList.add('d-none');
    registerForm.classList.remove('d-none');
  } else {
    registerForm.classList.add('d-none');
    loginForm.classList.remove('d-none');
  }

  setToggleState(activeMode);
  if (!preserveAlert) {
    clearAlert(alertBox);
  }
}

toggleButtons.forEach((button) => {
  button.addEventListener('click', () => {
    if (isSubmitting) return;
    toggleForms(button.dataset.authToggle);
  });
});

loginForm.addEventListener('submit', async (event) => {
  event.preventDefault();
  if (isSubmitting) return;

  clearAlert(alertBox);

  const formData = new FormData(loginForm);
  const payload = {
    email: formData.get('email').trim().toLowerCase(),
    password: formData.get('password').trim(),
  };

  const validationError = validateLogin(payload);
  if (validationError) {
    showAlert(validationError, 'danger');
    return;
  }

  const submitButton = loginForm.querySelector('button[type="submit"]');
  setAuthDisabled(true);
  setLoading(submitButton, true, 'Signing in...');

  try {
    await loginUser(payload);
    showAlert('Login successful. Redirecting to dashboard...', 'success');
    window.setTimeout(() => {
      window.location.href = './dashboard.html';
    }, 350);
  } catch (error) {
    showAlert(error.message || 'Unable to sign in.', 'danger');
  } finally {
    setLoading(submitButton, false);
    setAuthDisabled(false);
  }
});

registerForm.addEventListener('submit', async (event) => {
  event.preventDefault();
  if (isSubmitting) return;

  clearAlert(alertBox);

  const formData = new FormData(registerForm);
  const payload = {
    fullName: formData.get('fullName').trim(),
    email: formData.get('email').trim().toLowerCase(),
    password: formData.get('password').trim(),
  };

  const validationError = validateRegister(payload);
  if (validationError) {
    showAlert(validationError, 'danger');
    return;
  }

  const submitButton = registerForm.querySelector('button[type="submit"]');
  setAuthDisabled(true);
  setLoading(submitButton, true, 'Creating...');

  try {
    await registerUser(payload);
    showAlert('Account created successfully. You can now sign in.', 'success');
    registerForm.reset();
    toggleForms('login', { preserveAlert: true });
  } catch (error) {
    showAlert(error.message || 'Unable to register.', 'danger');
  } finally {
    setLoading(submitButton, false);
    setAuthDisabled(false);
  }
});

(async () => {
  try {
    const user = await getCurrentUserProfile();
    if (user) {
      window.location.href = './dashboard.html';
    }
  } catch {
    clearAlert(alertBox);
  }
})();

setToggleState(activeMode);
