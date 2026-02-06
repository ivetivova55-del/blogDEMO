import { validateEmail, validatePassword } from '../utils/validators.js';
import { showNotification } from '../utils/helpers.js';
import { login } from '../services/auth-service.js';

export async function initLogin() {
  // Setup login event listeners
}

export async function renderLogin() {
  return `
    <div class="container" style="max-width: 400px; padding: 2rem 0;">
      <div class="card">
        <div class="card-header">
          <h3 class="card-title mb-0">Login to BlogDemo</h3>
        </div>
        <div class="card-body">
          <form id="loginForm">
            <div class="mb-3">
              <label for="email" class="form-label">Email Address</label>
              <input type="email" class="form-control" id="email" name="email" required>
              <div class="invalid-feedback"></div>
            </div>

            <div class="mb-3">
              <label for="password" class="form-label">Password</label>
              <input type="password" class="form-control" id="password" name="password" required>
              <div class="invalid-feedback"></div>
            </div>

            <div class="mb-3 form-check">
              <input type="checkbox" class="form-check-input" id="remember" name="remember">
              <label class="form-check-label" for="remember">Remember me</label>
            </div>

            <button type="submit" class="btn btn-primary w-100">Login</button>

            <div class="mt-3 text-center">
              <p class="mb-0">Don't have an account? <a href="#/register">Register here</a></p>
            </div>
          </form>

          <div class="alert alert-info mt-3">
            <strong>Demo Account:</strong><br>
            Email: demo@example.com<br>
            Password: demo123456
          </div>
        </div>
      </div>
    </div>
  `;

  // Initialize form after rendering
  setTimeout(() => {
    const form = document.getElementById('loginForm');
    if (form) {
      form.addEventListener('submit', handleLogin);
    }
  }, 0);
}

async function handleLogin(e) {
  e.preventDefault();

  const email = document.getElementById('email').value;
  const password = document.getElementById('password').value;
  const remember = document.getElementById('remember').checked;

  // Validate
  if (!validateEmail(email)) {
    showNotification('Please enter a valid email', 'danger');
    return;
  }

  if (!validatePassword(password)) {
    showNotification('Password must be at least 6 characters', 'danger');
    return;
  }

  try {
    const user = await login(email, password);
    if (remember) {
      localStorage.setItem('rememberEmail', email);
    }
    showNotification('Login successful!', 'success');
    setTimeout(() => {
      window.location.hash = '#/';
      location.reload();
    }, 1000);
  } catch (error) {
    showNotification('Login failed: ' + error.message, 'danger');
  }
}
