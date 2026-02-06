import { validateEmail, validatePassword } from '../utils/validators.js';
import { showNotification } from '../utils/helpers.js';
import { register } from '../services/auth-service.js';

export async function initRegister() {
  // Setup registration event listeners
}

export async function renderRegister() {
  return `
    <div class="container" style="max-width: 450px; padding: 2rem 0;">
      <div class="card">
        <div class="card-header">
          <h3 class="card-title mb-0">Create Account</h3>
        </div>
        <div class="card-body">
          <form id="registerForm">
            <div class="mb-3">
              <label for="fullName" class="form-label">Full Name</label>
              <input type="text" class="form-control" id="fullName" name="fullName" required>
              <div class="invalid-feedback"></div>
            </div>

            <div class="mb-3">
              <label for="email" class="form-label">Email Address</label>
              <input type="email" class="form-control" id="email" name="email" required>
              <div class="invalid-feedback"></div>
            </div>

            <div class="mb-3">
              <label for="password" class="form-label">Password</label>
              <input type="password" class="form-control" id="password" name="password" required>
              <small class="form-text text-muted">Minimum 6 characters</small>
              <div class="invalid-feedback"></div>
            </div>

            <div class="mb-3">
              <label for="confirmPassword" class="form-label">Confirm Password</label>
              <input type="password" class="form-control" id="confirmPassword" name="confirmPassword" required>
              <div class="invalid-feedback"></div>
            </div>

            <div class="mb-3 form-check">
              <input type="checkbox" class="form-check-input" id="terms" name="terms" required>
              <label class="form-check-label" for="terms">
                I agree to the Terms and Conditions
              </label>
            </div>

            <button type="submit" class="btn btn-primary w-100">Create Account</button>

            <div class="mt-3 text-center">
              <p class="mb-0">Already have an account? <a href="#/login">Login here</a></p>
            </div>
          </form>
        </div>
      </div>
    </div>
  `;

  // Initialize form after rendering
  setTimeout(() => {
    const form = document.getElementById('registerForm');
    if (form) {
      form.addEventListener('submit', handleRegister);
    }
  }, 0);
}

async function handleRegister(e) {
  e.preventDefault();

  const fullName = document.getElementById('fullName').value;
  const email = document.getElementById('email').value;
  const password = document.getElementById('password').value;
  const confirmPassword = document.getElementById('confirmPassword').value;
  const terms = document.getElementById('terms').checked;

  // Validate
  if (!fullName || fullName.length < 2) {
    showNotification('Please enter a valid name', 'danger');
    return;
  }

  if (!validateEmail(email)) {
    showNotification('Please enter a valid email', 'danger');
    return;
  }

  if (!validatePassword(password)) {
    showNotification('Password must be at least 6 characters', 'danger');
    return;
  }

  if (password !== confirmPassword) {
    showNotification('Passwords do not match', 'danger');
    return;
  }

  if (!terms) {
    showNotification('You must agree to the Terms and Conditions', 'danger');
    return;
  }

  try {
    await register(email, password, fullName);
    showNotification('Registration successful! Please login.', 'success');
    setTimeout(() => {
      window.location.hash = '#/login';
    }, 1500);
  } catch (error) {
    showNotification('Registration failed: ' + error.message, 'danger');
  }
}
