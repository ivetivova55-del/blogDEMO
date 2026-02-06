import { MAX_FILE_SIZE, ALLOWED_IMAGE_TYPES } from './constants.js';

export function validateEmail(email) {
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return re.test(email);
}

export function validatePassword(password) {
  return password && password.length >= 6;
}

export function validateImage(file) {
  if (!file) return false;

  if (file.size > MAX_FILE_SIZE) {
    return { valid: false, error: 'File size must be less than 5MB' };
  }

  if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
    return { valid: false, error: 'Only JPEG, PNG, and WebP images are allowed' };
  }

  return { valid: true };
}

export function validateArticleForm(formData) {
  const errors = {};

  if (!formData.title || formData.title.trim().length < 3) {
    errors.title = 'Title must be at least 3 characters';
  }

  if (!formData.content || formData.content.trim().length < 10) {
    errors.content = 'Content must be at least 10 characters';
  }

  if (!formData.category_id) {
    errors.category_id = 'Please select a category';
  }

  if (formData.excerpt && formData.excerpt.length > 500) {
    errors.excerpt = 'Excerpt must be less than 500 characters';
  }

  return errors;
}

export function displayFormErrors(errors, formId) {
  const form = document.getElementById(formId);
  if (!form) return;

  // Clear previous errors
  form.querySelectorAll('.invalid-feedback').forEach((el) => {
    el.style.display = 'none';
  });
  form.querySelectorAll('.is-invalid').forEach((el) => {
    el.classList.remove('is-invalid');
  });

  // Display new errors
  Object.entries(errors).forEach(([field, message]) => {
    const input = form.querySelector(`[name="${field}"]`);
    if (input) {
      input.classList.add('is-invalid');
      const feedback = input.nextElementSibling;
      if (feedback && feedback.classList.contains('invalid-feedback')) {
        feedback.textContent = message;
        feedback.style.display = 'block';
      }
    }
  });
}
