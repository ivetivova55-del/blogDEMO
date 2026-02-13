export function qs(selector, root = document) {
  return root.querySelector(selector);
}

export function qsa(selector, root = document) {
  return Array.from(root.querySelectorAll(selector));
}

export function setAlert(element, message, variant = 'danger') {
  if (!element) return;
  element.className = `alert alert-${variant}`;
  element.textContent = message;
  element.classList.remove('d-none');
}

export function clearAlert(element) {
  if (!element) return;
  element.classList.add('d-none');
  element.textContent = '';
}

export function setLoading(button, isLoading, label) {
  if (!button) return;
  if (isLoading) {
    button.dataset.originalText = button.textContent;
    button.textContent = label || 'Loading...';
    button.disabled = true;
  } else {
    button.textContent = button.dataset.originalText || button.textContent;
    button.disabled = false;
  }
}
