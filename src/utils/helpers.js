export function formatDate(dateString) {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

export function formatDatetime(dateString) {
  const date = new Date(dateString);
  return date.toLocaleString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function truncateText(text, maxLength = 150) {
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength) + '...';
}

export function generateSlug(text) {
  return text
    .toLowerCase()
    .replace(/[^\w\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .trim();
}

export function isLoggedIn() {
  return !!localStorage.getItem('supabase_auth_token');
}

export function showNotification(message, type = 'success') {
  const alertClass = `alert-${type}`;
  const alertHTML = `
    <div class="alert ${alertClass} alert-dismissible fade show" role="alert" style="position: fixed; top: 20px; right: 20px; z-index: 9999; max-width: 400px;">
      ${message}
      <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
    </div>
  `;
  
  const alertElement = document.createElement('div');
  alertElement.innerHTML = alertHTML;
  document.body.appendChild(alertElement);
  
  setTimeout(() => {
    alertElement.remove();
  }, 4000);
}

export function showConfirmDialog(message, onConfirm, onCancel = null) {
  const confirmHTML = `
    <div class="modal fade show" id="confirmModal" style="display: block; background-color: rgba(0,0,0,0.5);">
      <div class="modal-dialog">
        <div class="modal-content">
          <div class="modal-header">
            <h5 class="modal-title">Confirm</h5>
            <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
          </div>
          <div class="modal-body">
            ${message}
          </div>
          <div class="modal-footer">
            <button type="button" class="btn btn-secondary" id="cancelBtn">Cancel</button>
            <button type="button" class="btn btn-primary" id="confirmBtn">Confirm</button>
          </div>
        </div>
      </div>
    </div>
  `;
  
  const modal = document.createElement('div');
  modal.innerHTML = confirmHTML;
  document.body.appendChild(modal);
  
  document.getElementById('confirmBtn').addEventListener('click', () => {
    onConfirm();
    modal.remove();
  });
  
  document.getElementById('cancelBtn').addEventListener('click', () => {
    if (onCancel) onCancel();
    modal.remove();
  });
}

export function escapeHtml(text) {
  const map = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#039;',
  };
  return text.replace(/[&<>"']/g, (m) => map[m]);
}
