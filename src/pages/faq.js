import { getCurrentUserProfile } from '../services/auth-service.js';
import { fetchTasks } from '../services/tasks-service.js';
import { fetchProjects } from '../services/projects-service.js';
import { isOverdue } from '../utils/date-utils.js';
import { qs, qsa, setAlert, clearAlert } from '../utils/dom-utils.js';
import { applyTimeTheme } from '../utils/time-theme.js';
import { fetchFaqs, incrementFaqView, voteFaqHelpful } from '../services/faq-service.js';

const alertBox = qs('#faq-alert');
const searchInput = qs('#faq-search');
const autocomplete = qs('#faq-autocomplete');
const clearButton = qs('#faq-clear');
const refreshButton = qs('#faq-refresh');
const resultsCount = qs('#faq-results-count');
const sortSelect = qs('#faq-sort');
const filtersClearButton = qs('#faq-filters-clear');
const tagsWrap = qs('#faq-tags');

const expandAllButton = qs('#faq-expand-all');
const collapseAllButton = qs('#faq-collapse-all');

const statusText = qs('#faq-status-text');

const categoriesList = qs('#faq-categories');
const categoryTabs = qs('#faq-category-tabs');
const accordion = qs('#faq-accordion');
const emptyState = qs('#faq-empty');

const recentWrap = qs('#faq-recent');
const favoritesWrap = qs('#faq-favorites');
const suggestionsWrap = qs('#faq-suggestions');

const assistantChat = qs('#faq-chat');
const assistantForm = qs('#faq-assistant-form');
const assistantClear = qs('#faq-assistant-clear');

const STORAGE_KEYS = {
  RECENT: 'dmq_faq_recent',
  FAVORITES: 'dmq_faq_favorites',
  TAGS: 'dmq_faq_tags',
  SORT: 'dmq_faq_sort',
  MULTI: 'dmq_faq_multi_open',
};

const DEFAULT_CATEGORIES = [
  { key: 'all', label: 'All', icon: '📚' },
  { key: 'tasks', label: 'Tasks', icon: '🗂️' },
  { key: 'calendar', label: 'Calendar', icon: '📅' },
  { key: 'projects', label: 'Projects', icon: '📊' },
  { key: 'team', label: 'Team', icon: '👥' },
  { key: 'account', label: 'Account', icon: '🔐' },
  { key: 'settings', label: 'Settings', icon: '⚙️' },
  { key: 'billing', label: 'Billing', icon: '💳' },
];

const FALLBACK_FAQS = [
  {
    id: 'local-add-task',
    question: 'How do I add a task?',
    answer: 'Go to Tasks → create a new task. Set a deadline and priority, then save. You can also add tasks directly from Calendar day view.',
    category: 'tasks',
    tags: ['create', 'task', 'deadline'],
    views: 0,
    helpful_yes: 0,
    helpful_no: 0,
  },
  {
    id: 'local-move-calendar',
    question: 'How do I reschedule a task in the calendar?',
    answer: 'Open Calendar and drag & drop a task to a new date. The deadline updates immediately.',
    category: 'calendar',
    tags: ['calendar', 'drag', 'drop', 'deadline'],
    views: 0,
    helpful_yes: 0,
    helpful_no: 0,
  },
  {
    id: 'local-kanban',
    question: 'How do I update status on the Kanban board?',
    answer: 'Go to Tasks → Board View and move the card between columns (To Do / In Progress / Completed).',
    category: 'tasks',
    tags: ['kanban', 'status'],
    views: 0,
    helpful_yes: 0,
    helpful_no: 0,
  },
  {
    id: 'local-files',
    question: 'Where can I find my uploaded files?',
    answer: 'Go to Files. You can search, sort, open, download, copy a link, or delete files stored in Supabase Storage.',
    category: 'settings',
    tags: ['files', 'uploads', 'storage'],
    views: 0,
    helpful_yes: 0,
    helpful_no: 0,
  },
  {
    id: 'local-admin',
    question: 'How do I access the Admin panel?',
    answer: 'Sign in with an admin account. When your role is admin, you will see Admin in the navigation and can open admin-only views.',
    category: 'account',
    tags: ['admin', 'role'],
    views: 0,
    helpful_yes: 0,
    helpful_no: 0,
  },
];

let faqs = [];
let activeCategory = 'all';
let searchTerm = '';
let sortMode = 'relevance';
let selectedTags = [];
let multiOpenEnabled = false;
let suppressViewIncrement = false;

function getStored(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
}

function setStored(key, value) {
  localStorage.setItem(key, JSON.stringify(value));
}

function normalizeCategory(value) {
  const normalized = String(value || '').trim().toLowerCase();
  return normalized || 'other';
}

function escapeHtml(value) {
  return String(value || '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

function getSearchParts(term) {
  return String(term || '')
    .trim()
    .toLowerCase()
    .split(/\s+/)
    .filter((part) => part && part.length >= 2)
    .slice(0, 6);
}

function findHighlightRanges(text, parts) {
  const source = String(text || '');
  const lower = source.toLowerCase();
  const ranges = [];

  parts.forEach((part) => {
    let startIndex = 0;
    while (startIndex < lower.length) {
      const matchIndex = lower.indexOf(part, startIndex);
      if (matchIndex === -1) break;
      ranges.push([matchIndex, matchIndex + part.length]);
      startIndex = matchIndex + part.length;
    }
  });

  if (!ranges.length) return [];
  ranges.sort((a, b) => a[0] - b[0]);

  const merged = [ranges[0]];
  for (let i = 1; i < ranges.length; i += 1) {
    const [start, end] = ranges[i];
    const last = merged[merged.length - 1];
    if (start <= last[1]) {
      last[1] = Math.max(last[1], end);
    } else {
      merged.push([start, end]);
    }
  }

  return merged;
}

function highlightText(text, term) {
  const parts = getSearchParts(term);
  if (!parts.length) return escapeHtml(text);

  const source = String(text || '');
  const ranges = findHighlightRanges(source, parts);
  if (!ranges.length) return escapeHtml(source);

  let html = '';
  let cursor = 0;
  ranges.forEach(([start, end]) => {
    if (cursor < start) html += escapeHtml(source.slice(cursor, start));
    html += `<mark class="dmq-faq-mark">${escapeHtml(source.slice(start, end))}</mark>`;
    cursor = end;
  });
  if (cursor < source.length) html += escapeHtml(source.slice(cursor));
  return html;
}

function scoreFaq(faq, term) {
  const t = String(term || '').trim().toLowerCase();
  if (!t) return 0;

  const question = String(faq.question || '').toLowerCase();
  const answer = String(faq.answer || '').toLowerCase();
  const category = normalizeCategory(faq.category);
  const tags = Array.isArray(faq.tags) ? faq.tags.join(' ').toLowerCase() : String(faq.tags || '').toLowerCase();

  let score = 0;
  if (question.includes(t)) score += 6;
  if (answer.includes(t)) score += 3;
  if (category.includes(t)) score += 2;
  if (tags.includes(t)) score += 2;

  // bonus if query matches any word
  const parts = t.split(/\s+/).filter(Boolean);
  parts.forEach((part) => {
    if (question.includes(part)) score += 2;
    if (answer.includes(part)) score += 1;
    if (tags.includes(part)) score += 1;
  });

  return score;
}

function getViewFaqs() {
  const term = String(searchTerm || '').trim().toLowerCase();

  const filteredByCategory = activeCategory === 'all'
    ? faqs
    : faqs.filter((faq) => normalizeCategory(faq.category) === activeCategory);

  const filteredByTags = selectedTags.length
    ? filteredByCategory.filter((faq) => {
      const tags = Array.isArray(faq.tags) ? faq.tags : [];
      const tagSet = new Set(tags.map((t) => String(t || '').trim().toLowerCase()).filter(Boolean));
      return selectedTags.every((tag) => tagSet.has(tag));
    })
    : filteredByCategory;

  if (!term) {
    return [...filteredByTags].sort(getSortComparator());
  }

  const matches = filteredByTags
    .map((faq) => ({ faq, score: scoreFaq(faq, term) }))
    .filter((entry) => entry.score > 0);

  if (String(sortMode) === 'relevance') {
    return matches
      .sort((a, b) => {
        if (b.score !== a.score) return b.score - a.score;
        return Number(b.faq.views || 0) - Number(a.faq.views || 0);
      })
      .map((entry) => entry.faq);
  }

  const comparator = getSortComparator();
  return matches
    .map((entry) => entry.faq)
    .sort(comparator);
}

function getHelpfulScore(faq) {
  const yes = Number(faq.helpful_yes || 0);
  const no = Number(faq.helpful_no || 0);
  return yes - no;
}

function getSortComparator() {
  const mode = String(sortMode || 'relevance');
  if (mode === 'az') {
    return (a, b) => String(a.question || '').localeCompare(String(b.question || ''), undefined, { sensitivity: 'base' });
  }

  if (mode === 'newest') {
    return (a, b) => {
      const aTime = Date.parse(a.created_at || a.updated_at || '') || 0;
      const bTime = Date.parse(b.created_at || b.updated_at || '') || 0;
      return bTime - aTime;
    };
  }

  if (mode === 'helpful') {
    return (a, b) => {
      const diff = getHelpfulScore(b) - getHelpfulScore(a);
      if (diff !== 0) return diff;
      return Number(b.views || 0) - Number(a.views || 0);
    };
  }

  // popular (default when no search)
  return (a, b) => Number(b.views || 0) - Number(a.views || 0);
}

function renderCategories() {
  if (!categoriesList) return;
  categoriesList.innerHTML = '';

  const counts = faqs.reduce((acc, faq) => {
    const key = normalizeCategory(faq.category);
    acc[key] = (acc[key] || 0) + 1;
    return acc;
  }, {});
  const totalCount = faqs.length;

  DEFAULT_CATEGORIES.forEach((category) => {
    const count = category.key === 'all' ? totalCount : (counts[category.key] || 0);
    const button = document.createElement('button');
    button.type = 'button';
    button.className = `list-group-item list-group-item-action d-flex align-items-center justify-content-between ${activeCategory === category.key ? 'active' : ''}`;
    button.dataset.category = category.key;
    button.innerHTML = `
      <span class="d-flex align-items-center gap-2">
        <span>${category.icon}</span>
        <span>${escapeHtml(category.label)}</span>
      </span>
      <span class="badge text-bg-light border">${count}</span>
    `;

    categoriesList.appendChild(button);
  });
}

function renderCategoryTabs() {
  if (!categoryTabs) return;
  categoryTabs.innerHTML = '';

  const counts = faqs.reduce((acc, faq) => {
    const key = normalizeCategory(faq.category);
    acc[key] = (acc[key] || 0) + 1;
    return acc;
  }, {});
  const totalCount = faqs.length;

  DEFAULT_CATEGORIES.slice(0, 5).forEach((category) => {
    const count = category.key === 'all' ? totalCount : (counts[category.key] || 0);
    const button = document.createElement('button');
    button.type = 'button';
    button.className = `btn btn-sm ${activeCategory === category.key ? 'btn-dark' : 'btn-outline-dark'}`;
    button.dataset.categoryTab = category.key;
    button.textContent = `${category.label} (${count})`;
    categoryTabs.appendChild(button);
  });
}

function renderAutocomplete() {
  if (!autocomplete || !searchInput) return;

  const term = String(searchInput.value || '').trim();
  if (!term) {
    autocomplete.classList.add('d-none');
    autocomplete.innerHTML = '';
    return;
  }

  const matches = faqs
    .map((faq) => ({ faq, score: scoreFaq(faq, term) }))
    .filter((entry) => entry.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, 6)
    .map((entry) => entry.faq);

  if (!matches.length) {
    autocomplete.classList.add('d-none');
    autocomplete.innerHTML = '';
    return;
  }

  autocomplete.classList.remove('d-none');
  autocomplete.innerHTML = matches
    .map((faq) => {
      const category = normalizeCategory(faq.category);
      return `
        <button type="button" class="dmq-faq-suggest" data-faq-id="${escapeHtml(faq.id)}" role="option">
          <div class="dmq-faq-suggest-title">${highlightText(faq.question, term)}</div>
          <div class="dmq-faq-suggest-meta">${escapeHtml(category)}</div>
        </button>
      `;
    })
    .join('');
}

function getAllTags() {
  const map = new Map();
  const scopeFaqs = activeCategory === 'all'
    ? faqs
    : faqs.filter((faq) => normalizeCategory(faq.category) === activeCategory);

  scopeFaqs.forEach((faq) => {
    const tags = Array.isArray(faq.tags) ? faq.tags : [];
    tags.forEach((tag) => {
      const key = String(tag || '').trim().toLowerCase();
      if (!key) return;
      map.set(key, (map.get(key) || 0) + 1);
    });
  });

  return [...map.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 16)
    .map(([tag]) => tag);
}

function renderTagFilters() {
  if (!tagsWrap) return;
  tagsWrap.innerHTML = '';

  const tags = getAllTags();
  if (!tags.length) {
    tagsWrap.innerHTML = '<div class="small text-muted">No tags available.</div>';
    return;
  }

  tags.forEach((tag) => {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = `dmq-faq-tag ${selectedTags.includes(tag) ? 'active' : ''}`;
    button.dataset.tag = tag;
    button.textContent = `#${tag}`;
    tagsWrap.appendChild(button);
  });
}

function setSelectedTags(next) {
  selectedTags = (Array.isArray(next) ? next : [])
    .map((t) => String(t || '').trim().toLowerCase())
    .filter(Boolean)
    .slice(0, 5);
  setStored(STORAGE_KEYS.TAGS, selectedTags);
}

function toggleTag(tag) {
  const key = String(tag || '').trim().toLowerCase();
  if (!key) return;

  const next = selectedTags.includes(key)
    ? selectedTags.filter((t) => t !== key)
    : [...selectedTags, key].slice(0, 5);
  setSelectedTags(next);
}

function setSortMode(mode) {
  sortMode = String(mode || 'relevance');
  setStored(STORAGE_KEYS.SORT, sortMode);
}

function setMultiOpen(enabled) {
  multiOpenEnabled = Boolean(enabled);
  setStored(STORAGE_KEYS.MULTI, multiOpenEnabled);
}

function getFavorites() {
  return getStored(STORAGE_KEYS.FAVORITES, []);
}

function isFavorite(id) {
  return getFavorites().includes(id);
}

function toggleFavorite(id) {
  const current = getFavorites();
  const next = current.includes(id)
    ? current.filter((item) => item !== id)
    : [id, ...current].slice(0, 50);
  setStored(STORAGE_KEYS.FAVORITES, next);
}

function addRecent(id) {
  const current = getStored(STORAGE_KEYS.RECENT, []);
  const next = [id, ...current.filter((item) => item !== id)].slice(0, 3);
  setStored(STORAGE_KEYS.RECENT, next);
}

function renderRecentAndFavorites() {
  if (!recentWrap || !favoritesWrap) return;

  const recentIds = getStored(STORAGE_KEYS.RECENT, []);
  const favoriteIds = getFavorites();

  const byId = faqs.reduce((acc, faq) => {
    acc[faq.id] = faq;
    return acc;
  }, {});

  const renderList = (wrap, ids, emptyText, options = {}) => {
    const { allowRemove = false, allowUnsave = false } = options;
    wrap.innerHTML = '';
    if (!ids.length) {
      wrap.innerHTML = `<div class="small text-muted">${escapeHtml(emptyText)}</div>`;
      return;
    }

    ids.forEach((id) => {
      const faq = byId[id];
      if (!faq) return;
      const item = document.createElement('div');
      item.className = 'dmq-card p-2';
      item.innerHTML = `
        <div class="fw-semibold" style="font-size: 0.85rem;">${escapeHtml(faq.question)}</div>
        <div class="d-flex gap-2 flex-wrap mt-2">
          <button class="btn btn-sm btn-outline-dark" type="button" data-jump-faq="${escapeHtml(id)}">Open</button>
          <button class="btn btn-sm btn-outline-secondary" type="button" data-copy-faq="${escapeHtml(id)}">Copy link</button>
          ${allowRemove ? `<button class="btn btn-sm btn-outline-secondary" type="button" data-remove-recent="${escapeHtml(id)}">Remove</button>` : ''}
          ${allowUnsave ? `<button class="btn btn-sm btn-outline-danger" type="button" data-unsave-faq="${escapeHtml(id)}">Unsave</button>` : ''}
        </div>
      `;
      wrap.appendChild(item);
    });
  };

  renderList(recentWrap, recentIds, 'Open a question to see it here.', { allowRemove: true });
  renderList(favoritesWrap, favoriteIds, 'Save a question to pin it here.', { allowUnsave: true });
}

function faqToAnchorId(faqId) {
  return `faq-${String(faqId).replaceAll(/[^a-zA-Z0-9_-]/g, '-')}`;
}

function openFaqById(faqId) {
  const id = String(faqId || '').trim();
  if (!id) return;

  const faq = faqs.find((item) => String(item.id) === id);
  const category = faq ? normalizeCategory(faq.category) : 'all';
  const faqTags = faq && Array.isArray(faq.tags)
    ? new Set(faq.tags.map((t) => String(t || '').trim().toLowerCase()).filter(Boolean))
    : new Set();

  // Ensure the FAQ is visible (avoid cases like Billing(0) which makes the list empty)
  activeCategory = category;
  renderCategories();
  renderCategoryTabs();

  if (selectedTags.length) {
    const isVisibleWithTags = selectedTags.every((tag) => faqTags.has(tag));
    if (!isVisibleWithTags) {
      setSelectedTags([]);
      renderTagFilters();
    }
  }

  // Clear search so the item is not filtered out
  searchTerm = '';
  if (searchInput) searchInput.value = '';
  renderAutocomplete();

  renderFaqs();

  // Jump + expand
  const anchorId = faqToAnchorId(id);
  window.location.hash = `#${anchorId}`;

  window.setTimeout(() => {
    const accordionButton = qs(`[data-faq-open="${CSS.escape(id)}"]`);
    if (accordionButton && accordionButton.classList.contains('collapsed')) {
      accordionButton.click();
    }

    const target = qs(`#${CSS.escape(anchorId)}`);
    if (target) {
      target.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }, 0);
}

function renderFaqs() {
  if (!accordion) return;

  const viewFaqs = getViewFaqs();
  if (resultsCount) resultsCount.textContent = String(viewFaqs.length);

  accordion.innerHTML = '';

  if (!viewFaqs.length) {
    if (emptyState) {
      emptyState.classList.remove('d-none');
      const categoryLabel = activeCategory === 'all' ? 'All' : (DEFAULT_CATEGORIES.find((c) => c.key === activeCategory)?.label || activeCategory);
      const activeTags = selectedTags.length ? selectedTags.map((t) => `#${t}`).join(', ') : null;
      emptyState.innerHTML = `
        <div class="fw-semibold">No FAQs found</div>
        <div class="small text-muted mt-1">Category: <strong>${escapeHtml(categoryLabel)}</strong>${activeTags ? ` · Tags: <strong>${escapeHtml(activeTags)}</strong>` : ''}${searchTerm ? ` · Search: <strong>${escapeHtml(searchTerm)}</strong>` : ''}</div>
        <div class="dmq-faq-empty-actions mt-3">
          <button class="btn btn-sm btn-outline-dark" type="button" data-empty-action="show-all">Show all</button>
          <button class="btn btn-sm btn-outline-dark" type="button" data-empty-action="clear-search">Clear search</button>
          <button class="btn btn-sm btn-outline-dark" type="button" data-empty-action="clear-filters">Clear filters</button>
        </div>
      `;
    }
    return;
  }

  if (emptyState) {
    emptyState.classList.add('d-none');
    emptyState.textContent = 'No FAQs found.';
  }

  viewFaqs.forEach((faq, index) => {
    const itemId = faqToAnchorId(faq.id);
    const collapseId = `${itemId}-collapse`;
    const headerId = `${itemId}-header`;

    const category = normalizeCategory(faq.category);
    const tags = Array.isArray(faq.tags) ? faq.tags : [];
    const views = Number(faq.views || 0);
    const yes = Number(faq.helpful_yes || 0);
    const no = Number(faq.helpful_no || 0);

    const favLabel = isFavorite(faq.id) ? '★ Saved' : '☆ Save';

    const item = document.createElement('div');
    item.className = 'accordion-item';
    item.id = itemId;

    const showSingle = !multiOpenEnabled;
    const parentAttr = showSingle ? 'data-bs-parent="#faq-accordion"' : '';
    const favStar = isFavorite(faq.id) ? '★' : '';

    item.innerHTML = `
      <h2 class="accordion-header" id="${headerId}">
        <button class="accordion-button ${index === 0 ? '' : 'collapsed'}" type="button" data-bs-toggle="collapse" data-bs-target="#${collapseId}" aria-expanded="${index === 0 ? 'true' : 'false'}" aria-controls="${collapseId}" data-faq-open="${escapeHtml(faq.id)}">
          <span class="dmq-faq-q">${favStar ? `<span class="me-2">${favStar}</span>` : ''}${highlightText(faq.question, searchTerm)}</span>
          <span class="dmq-faq-pill badge text-bg-light border ms-2">${escapeHtml(category)}</span>
        </button>
      </h2>
      <div id="${collapseId}" class="accordion-collapse collapse ${index === 0 ? 'show' : ''}" aria-labelledby="${headerId}" ${parentAttr}>
        <div class="accordion-body">
          <div class="dmq-faq-answer">${highlightText(String(faq.answer || ''), searchTerm).replaceAll('\n', '<br/>')}</div>
          ${tags.length ? `<div class="mt-3 small text-muted">Tags: ${tags.map((t) => `<span class=\"badge text-bg-light border me-1\">${escapeHtml(t)}</span>`).join('')}</div>` : ''}

          <div class="d-flex justify-content-between align-items-center flex-wrap gap-2 mt-3">
            <div class="small text-muted">Views: <strong>${views}</strong> · Helpful: <strong>${yes}</strong> / <strong>${no}</strong></div>
            <div class="d-flex gap-2 flex-wrap">
              <button class="btn btn-sm btn-outline-dark" type="button" data-faq-copy="${escapeHtml(faq.id)}">Copy link</button>
              <button class="btn btn-sm btn-outline-dark" type="button" data-faq-copy-answer="${escapeHtml(faq.id)}">Copy answer</button>
              <button class="btn btn-sm btn-outline-dark" type="button" data-faq-fav="${escapeHtml(faq.id)}">${favLabel}</button>
            </div>
          </div>

          <div class="dmq-faq-helpful mt-3">
            <div class="small text-muted">Was this helpful?</div>
            <div class="d-flex gap-2">
              <button class="btn btn-sm btn-outline-dark" type="button" data-faq-helpful="yes" data-id="${escapeHtml(faq.id)}">Yes</button>
              <button class="btn btn-sm btn-outline-dark" type="button" data-faq-helpful="no" data-id="${escapeHtml(faq.id)}">No</button>
            </div>
          </div>
        </div>
      </div>
    `;

    accordion.appendChild(item);
  });

  renderRecentAndFavorites();
}

function updateSuggestions({ overdueCount, projectsCount }) {
  if (!suggestionsWrap) return;

  const suggestions = [];

  if (projectsCount === 0) {
    suggestions.push({ label: 'Create your first project', category: 'projects', query: 'create project' });
  }

  if (overdueCount > 0) {
    suggestions.push({ label: 'Manage overdue tasks', category: 'calendar', query: 'overdue' });
  }

  suggestions.push({ label: 'Move tasks on Kanban', category: 'tasks', query: 'kanban status' });
  suggestions.push({ label: 'Reschedule via calendar', category: 'calendar', query: 'drag drop calendar' });

  suggestionsWrap.innerHTML = '';
  suggestions.slice(0, 4).forEach((item) => {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'btn btn-sm btn-outline-dark';
    button.dataset.suggestCategory = item.category;
    button.dataset.suggestQuery = item.query;
    button.textContent = item.label;
    suggestionsWrap.appendChild(button);
  });
}

function addChatMessage(role, text, options = {}) {
  if (!assistantChat) return;
  const item = document.createElement('div');
  item.className = `dmq-faq-chat-msg ${role}`;

  const extra = options.links?.length
    ? `
      <div class="dmq-faq-chat-links">
        ${options.links
          .map((l) => {
            const openFaqId = l.openFaqId ? `data-open-faq="${escapeHtml(l.openFaqId)}"` : '';
            return `<a href="${escapeHtml(l.href)}" class="btn btn-sm btn-outline-dark" data-chat-link ${openFaqId}>${escapeHtml(l.label)}</a>`;
          })
          .join('')}
      </div>
    `
    : '';

  item.innerHTML = `
    <div class="dmq-faq-chat-bubble">
      <div class="dmq-faq-chat-text">${escapeHtml(text).replaceAll('\n', '<br/>')}</div>
      ${extra}
    </div>
  `;

  assistantChat.appendChild(item);
  assistantChat.scrollTop = assistantChat.scrollHeight;
}

function runAssistant(query) {
  const q = String(query || '').trim();
  if (!q) return;

  const ranked = faqs
    .map((faq) => ({ faq, score: scoreFaq(faq, q) }))
    .sort((a, b) => b.score - a.score)
    .filter((entry) => entry.score > 0)
    .slice(0, 3)
    .map((entry) => entry.faq);

  if (!ranked.length) {
    addChatMessage('assistant', 'I couldn’t find an exact match in the FAQ. Try rephrasing your question, or contact support.', {
      links: [
        { href: 'mailto:support@digiquill.com', label: 'Contact support' },
        { href: './dashboard.html', label: 'Dashboard' },
      ],
    });
    return;
  }

  addChatMessage('assistant', 'Here are the closest FAQ answers I found:');
  ranked.forEach((faq) => {
    addChatMessage('assistant', faq.question, {
      links: [{ href: `#${faqToAnchorId(faq.id)}`, label: 'Open answer', openFaqId: faq.id }],
    });
  });
}

async function handleFaqOpen(faqId) {
  const id = String(faqId || '').trim();
  if (!id) return;

  addRecent(id);
  renderRecentAndFavorites();

  // only increment views for real UUIDs (DB entries)
  if (/^[0-9a-fA-F-]{36}$/.test(id)) {
    await incrementFaqView(id);
  }
}

function setCategory(category) {
  activeCategory = String(category || 'all');
  renderCategories();
  renderCategoryTabs();
  renderTagFilters();
  renderFaqs();
}

async function loadFaqData() {
  clearAlert(alertBox);

  const remote = await fetchFaqs();
  faqs = remote && remote.length ? remote : FALLBACK_FAQS;

  if (statusText) {
    if (remote === null) statusText.textContent = 'FAQ database not configured (using local FAQs)';
    else statusText.textContent = 'Live FAQ loaded';
  }

  renderCategories();
  renderCategoryTabs();
  renderTagFilters();
  renderFaqs();
}

async function initSuggestions() {
  try {
    const user = await getCurrentUserProfile();
    if (!user?.id) {
      updateSuggestions({ overdueCount: 0, projectsCount: 0 });
      return;
    }

    const [tasks, projects] = await Promise.all([
      fetchTasks(user.id).catch(() => []),
      fetchProjects(user.id).catch(() => []),
    ]);

    const overdueCount = (tasks || []).filter((task) => isOverdue(task)).length;
    const projectsCount = Array.isArray(projects) ? projects.length : 0;

    updateSuggestions({ overdueCount, projectsCount });
  } catch {
    updateSuggestions({ overdueCount: 0, projectsCount: 0 });
  }
}

function initEvents() {
  let autocompleteIndex = -1;

  const closeAutocomplete = () => {
    if (!autocomplete) return;
    autocomplete.classList.add('d-none');
    autocompleteIndex = -1;
  };

  const getAutocompleteButtons = () => (autocomplete ? qsa('.dmq-faq-suggest', autocomplete) : []);

  const setAutocompleteActive = (nextIndex) => {
    const buttons = getAutocompleteButtons();
    if (!buttons.length) {
      autocompleteIndex = -1;
      return;
    }

    const index = Math.max(0, Math.min(buttons.length - 1, nextIndex));
    autocompleteIndex = index;
    buttons.forEach((btn, i) => {
      if (i === index) btn.classList.add('active');
      else btn.classList.remove('active');
    });
  };

  if (searchInput) {
    searchInput.addEventListener('input', () => {
      searchTerm = searchInput.value;
      renderAutocomplete();
      autocompleteIndex = -1;
      renderFaqs();
    });

    searchInput.addEventListener('focus', () => {
      renderAutocomplete();
    });

    document.addEventListener('click', (event) => {
      if (!autocomplete) return;
      if (autocomplete.contains(event.target) || searchInput.contains(event.target)) return;
      closeAutocomplete();
    });

    searchInput.addEventListener('keydown', (event) => {
      if (!autocomplete || autocomplete.classList.contains('d-none')) return;
      const buttons = getAutocompleteButtons();
      if (!buttons.length) return;

      if (event.key === 'ArrowDown') {
        event.preventDefault();
        setAutocompleteActive(autocompleteIndex + 1);
      }

      if (event.key === 'ArrowUp') {
        event.preventDefault();
        setAutocompleteActive(Math.max(0, autocompleteIndex - 1));
      }

      if (event.key === 'Enter' && autocompleteIndex >= 0) {
        event.preventDefault();
        const btn = buttons[autocompleteIndex];
        if (btn?.dataset?.faqId) {
          closeAutocomplete();
          openFaqById(btn.dataset.faqId);
        }
      }

      if (event.key === 'Escape') {
        event.preventDefault();
        closeAutocomplete();
      }
    });
  }

  if (autocomplete) {
    autocomplete.addEventListener('click', (event) => {
      const button = event.target.closest('[data-faq-id]');
      if (!button) return;
      const id = button.dataset.faqId;
      closeAutocomplete();
      openFaqById(id);
    });
  }

  if (clearButton) {
    clearButton.addEventListener('click', () => {
      searchTerm = '';
      if (searchInput) searchInput.value = '';
      renderAutocomplete();
      renderFaqs();
    });
  }

  if (filtersClearButton) {
    filtersClearButton.addEventListener('click', () => {
      setSelectedTags([]);
      renderTagFilters();
      renderFaqs();
    });
  }

  if (sortSelect) {
    sortSelect.addEventListener('change', () => {
      setSortMode(sortSelect.value);
      renderFaqs();
    });
  }

  if (tagsWrap) {
    tagsWrap.addEventListener('click', (event) => {
      const button = event.target.closest('[data-tag]');
      if (!button) return;
      toggleTag(button.dataset.tag);
      renderTagFilters();
      renderFaqs();
    });
  }

  if (refreshButton) {
    refreshButton.addEventListener('click', async () => {
      try {
        await loadFaqData();
      } catch (error) {
        setAlert(alertBox, error.message || 'Unable to refresh FAQs.');
      }
    });
  }

  if (categoriesList) {
    categoriesList.addEventListener('click', (event) => {
      const button = event.target.closest('[data-category]');
      if (!button) return;
      setCategory(button.dataset.category);
    });
  }

  if (categoryTabs) {
    categoryTabs.addEventListener('click', (event) => {
      const button = event.target.closest('[data-category-tab]');
      if (!button) return;
      setCategory(button.dataset.categoryTab);
    });
  }

  if (accordion) {
    accordion.addEventListener('click', async (event) => {
      const copyButton = event.target.closest('[data-faq-copy]');
      const copyAnswerButton = event.target.closest('[data-faq-copy-answer]');
      const favButton = event.target.closest('[data-faq-fav]');
      const helpfulButton = event.target.closest('[data-faq-helpful]');
      const openButton = event.target.closest('[data-faq-open]');

      if (copyButton) {
        const id = copyButton.dataset.faqCopy;
        const url = `${window.location.origin}${window.location.pathname}#${faqToAnchorId(id)}`;
        if (navigator.clipboard?.writeText) {
          await navigator.clipboard.writeText(url);
        } else {
          window.prompt('Copy this link:', url);
        }
        return;
      }

      if (copyAnswerButton) {
        const id = copyAnswerButton.dataset.faqCopyAnswer;
        const entry = faqs.find((faq) => String(faq.id) === String(id));
        const answer = String(entry?.answer || '').trim();
        if (!answer) return;

        if (navigator.clipboard?.writeText) {
          await navigator.clipboard.writeText(answer);
        } else {
          window.prompt('Copy this answer:', answer);
        }
        return;
      }

      if (favButton) {
        const id = favButton.dataset.faqFav;
        toggleFavorite(id);
        renderFaqs();
        return;
      }

      if (helpfulButton) {
        const id = helpfulButton.dataset.id;
        const kind = helpfulButton.dataset.faqHelpful;
        const isYes = kind === 'yes';

        // vote only for real UUIDs
        if (/^[0-9a-fA-F-]{36}$/.test(String(id))) {
          await voteFaqHelpful(id, isYes);
        }

        // optimistic local UI update
        const entry = faqs.find((faq) => String(faq.id) === String(id));
        if (entry) {
          if (isYes) entry.helpful_yes = Number(entry.helpful_yes || 0) + 1;
          else entry.helpful_no = Number(entry.helpful_no || 0) + 1;
        }

        renderFaqs();
        return;
      }

      if (openButton) {
        const id = openButton.dataset.faqOpen;
        const isExpanded = openButton.getAttribute('aria-expanded') === 'true';
        if (!isExpanded) {
          // will expand; count view once per click
          if (!suppressViewIncrement) {
            await handleFaqOpen(id);
          }
        }
      }
    });
  }

  if (emptyState) {
    emptyState.addEventListener('click', (event) => {
      const button = event.target.closest('[data-empty-action]');
      if (!button) return;
      const action = button.dataset.emptyAction;

      if (action === 'show-all') {
        setCategory('all');
      }

      if (action === 'clear-search') {
        searchTerm = '';
        if (searchInput) searchInput.value = '';
        renderAutocomplete();
        renderFaqs();
      }

      if (action === 'clear-filters') {
        setSelectedTags([]);
        renderTagFilters();
        renderFaqs();
      }
    });
  }

  if (recentWrap) {
    recentWrap.addEventListener('click', (event) => {
      const openButton = event.target.closest('[data-jump-faq]');
      const copyButton = event.target.closest('[data-copy-faq]');
      const removeButton = event.target.closest('[data-remove-recent]');

      if (removeButton) {
        const id = removeButton.dataset.removeRecent;
        const current = getStored(STORAGE_KEYS.RECENT, []);
        setStored(STORAGE_KEYS.RECENT, current.filter((item) => item !== id));
        renderRecentAndFavorites();
        return;
      }

      if (copyButton) {
        const id = copyButton.dataset.copyFaq;
        const url = `${window.location.origin}${window.location.pathname}#${faqToAnchorId(id)}`;
        if (navigator.clipboard?.writeText) {
          navigator.clipboard.writeText(url);
        } else {
          window.prompt('Copy this link:', url);
        }
        return;
      }

      if (openButton) {
        openFaqById(openButton.dataset.jumpFaq);
      }
    });
  }

  if (favoritesWrap) {
    favoritesWrap.addEventListener('click', (event) => {
      const openButton = event.target.closest('[data-jump-faq]');
      const copyButton = event.target.closest('[data-copy-faq]');
      const unsaveButton = event.target.closest('[data-unsave-faq]');

      if (unsaveButton) {
        const id = unsaveButton.dataset.unsaveFaq;
        toggleFavorite(id);
        renderRecentAndFavorites();
        renderFaqs();
        return;
      }

      if (copyButton) {
        const id = copyButton.dataset.copyFaq;
        const url = `${window.location.origin}${window.location.pathname}#${faqToAnchorId(id)}`;
        if (navigator.clipboard?.writeText) {
          navigator.clipboard.writeText(url);
        } else {
          window.prompt('Copy this link:', url);
        }
        return;
      }

      if (openButton) {
        openFaqById(openButton.dataset.jumpFaq);
      }
    });
  }

  if (suggestionsWrap) {
    suggestionsWrap.addEventListener('click', (event) => {
      const button = event.target.closest('[data-suggest-category]');
      if (!button) return;
      const category = button.dataset.suggestCategory;
      const query = button.dataset.suggestQuery;
      setCategory(category);
      searchTerm = query;
      if (searchInput) searchInput.value = query;
      renderAutocomplete();
      renderFaqs();
    });
  }

  if (assistantClear) {
    assistantClear.addEventListener('click', () => {
      if (assistantChat) assistantChat.innerHTML = '';
      addChatMessage('assistant', 'Hi! Ask me anything about tasks, calendar, projects, or account access.');
    });
  }

  if (assistantForm) {
    assistantForm.addEventListener('submit', (event) => {
      event.preventDefault();
      const formData = new FormData(assistantForm);
      const message = String(formData.get('message') || '').trim();
      if (!message) return;

      addChatMessage('user', message);
      assistantForm.reset();

      runAssistant(message);
    });
  }

  if (assistantChat) {
    assistantChat.addEventListener('click', (event) => {
      const link = event.target.closest('[data-open-faq]');
      if (!link) return;
      event.preventDefault();
      openFaqById(link.dataset.openFaq);
    });
  }

  if (expandAllButton) {
    expandAllButton.addEventListener('click', () => {
      setMultiOpen(true);
      renderFaqs();
      suppressViewIncrement = true;
      qsa('#faq-accordion [data-faq-open]').forEach((button) => {
        if (button.getAttribute('aria-expanded') !== 'true') button.click();
      });
      window.setTimeout(() => {
        suppressViewIncrement = false;
      }, 0);
    });
  }

  if (collapseAllButton) {
    collapseAllButton.addEventListener('click', () => {
      setMultiOpen(true);
      renderFaqs();
      qsa('#faq-accordion [data-faq-open]').forEach((button) => {
        if (button.getAttribute('aria-expanded') === 'true') button.click();
      });
    });
  }

  document.addEventListener('keydown', (event) => {
    const target = event.target;
    const isTyping = target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable);

    if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'k') {
      event.preventDefault();
      if (searchInput) searchInput.focus();
      return;
    }

    if (!isTyping && event.key === '/') {
      event.preventDefault();
      if (searchInput) searchInput.focus();
      return;
    }

    if (event.key === 'Escape') {
      if (autocomplete && !autocomplete.classList.contains('d-none')) {
        closeAutocomplete();
        return;
      }
    }
  });
}

async function init() {
  applyTimeTheme();
  addChatMessage('assistant', 'Hi! Ask me anything about tasks, calendar, projects, or account access.');

  // Restore preferences
  setSelectedTags(getStored(STORAGE_KEYS.TAGS, []));
  setSortMode(getStored(STORAGE_KEYS.SORT, 'relevance'));
  setMultiOpen(getStored(STORAGE_KEYS.MULTI, false));

  if (sortSelect) sortSelect.value = sortMode;

  try {
    await loadFaqData();
  } catch (error) {
    setAlert(alertBox, error.message || 'Unable to load FAQs.');
    faqs = FALLBACK_FAQS;
    renderCategories();
    renderCategoryTabs();
    renderFaqs();
  }

  await initSuggestions();
  initEvents();

  // if there is a hash, try to open the matching FAQ
  if (window.location.hash) {
    const raw = window.location.hash.replace(/^#/, '');
    const match = faqs.find((faq) => faqToAnchorId(faq.id) === raw);
    if (match) openFaqById(match.id);
    else {
      const target = qs(window.location.hash);
      if (target) target.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }
}

init();
