import { qs, qsa, setAlert, clearAlert, setLoading } from '../utils/dom-utils.js';

const loginForm = qs('#login-form');
const registerForm = qs('#register-form');
const alertBox = qs('#auth-alert');
const toggleButtons = qsa('[data-auth-toggle]');

const ALLOWED_EMAILS = ['svi@gmail.com', 'maria@gmail.com', 'peter@gmail.com'];
const DEMO_PASSWORD = 'pass123';

let activeMode = 'login';
let isSubmitting = false;
let authModulePromise = null;

async function getAuthModule() {
  if (!authModulePromise) {
    authModulePromise = import('../services/auth-service.js').catch((error) => {
      authModulePromise = null;
      throw error;
    });
  }

  return authModulePromise;
}

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

function isAllowedDemoEmail(email) {
  return ALLOWED_EMAILS.includes((email || '').toLowerCase());
}

function isDuplicateUserError(error) {
  const message = [error?.message, error?.details, error?.hint, error?.code]
    .filter(Boolean)
    .join(' ')
    .toLowerCase();

  return (
    message.includes('already') ||
    message.includes('registered') ||
    message.includes('duplicate')
  );
}

function validateLogin({ email, password }) {
  if (!email || !password) {
    return 'Please fill in email and password.';
  }

  if (!validateEmail(email)) {
    return 'Please enter a valid email address.';
  }

  if (!isAllowedDemoEmail(email)) {
    return 'Use one of the demo accounts: svi@gmail.com, maria@gmail.com, peter@gmail.com.';
  }

  if (password !== DEMO_PASSWORD) {
    return 'Use the demo password: pass123.';
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

  if (!isAllowedDemoEmail(email)) {
    return 'Registration is limited to demo accounts: svi@gmail.com, maria@gmail.com, peter@gmail.com.';
  }

  if (password !== DEMO_PASSWORD) {
    return 'For demo mode, password must be pass123.';
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
    const { loginUser } = await getAuthModule();
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
    const { registerUser } = await getAuthModule();
    await registerUser(payload);
    showAlert('Account created successfully. You can now sign in.', 'success');
    registerForm.reset();
    toggleForms('login', { preserveAlert: true });
  } catch (error) {
    if (isDuplicateUserError(error)) {
      showAlert('This demo account already exists. Please sign in with pass123.', 'info');
      toggleForms('login', { preserveAlert: true });
      return;
    }

    showAlert(error.message || 'Unable to register.', 'danger');
  } finally {
    setLoading(submitButton, false);
    setAuthDisabled(false);
  }
});

(async () => {
  try {
    const { getCurrentUserProfile } = await getAuthModule();
    const user = await getCurrentUserProfile();
    if (user) {
      window.location.href = './dashboard.html';
    }
  } catch {
    showAlert('Auth configuration is missing or invalid. Please check environment settings.', 'warning');
  }
})();

setToggleState(activeMode);
