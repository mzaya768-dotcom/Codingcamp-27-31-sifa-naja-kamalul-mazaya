/* ============================================
   LIFE DASHBOARD — app.js
   Features:
   MVP:
   - Greeting with time & date
   - Focus Timer (start/stop/reset)
   - To-Do List (add/edit/mark/delete + LocalStorage)
   - Quick Links (add/delete + LocalStorage)
   Challenges (3 of 5):
   - Light / Dark mode
   - Custom name in greeting
   - Change Pomodoro time
   Bonus:
   - Prevent duplicate tasks
   - Sort tasks
============================================ */

'use strict';

/* ---- UTILS ---- */
function $(id) { return document.getElementById(id); }

function showToast(msg) {
  let toast = document.querySelector('.toast');
  if (!toast) {
    toast = document.createElement('div');
    toast.className = 'toast';
    document.body.appendChild(toast);
  }
  toast.textContent = msg;
  toast.classList.add('show');
  clearTimeout(toast._timer);
  toast._timer = setTimeout(() => toast.classList.remove('show'), 2500);
}

/* ================================================================
   1. THEME — Light / Dark mode (Challenge #1)
================================================================ */
const themeToggle  = $('theme-toggle');
const htmlEl       = document.documentElement;

function applyTheme(theme) {
  htmlEl.setAttribute('data-theme', theme);
  themeToggle.textContent = theme === 'dark' ? '☀️' : '🌙';
  localStorage.setItem('theme', theme);
}

themeToggle.addEventListener('click', () => {
  const current = htmlEl.getAttribute('data-theme');
  applyTheme(current === 'dark' ? 'light' : 'dark');
});

// Load saved theme
applyTheme(localStorage.getItem('theme') || 'dark');


/* ================================================================
   2. GREETING + DATE/TIME
================================================================ */
const greetingEl  = $('greeting');
const datetimeEl  = $('datetime');
const nameDisplay = $('user-name-display');

function getGreeting(hour) {
  if (hour >= 5  && hour < 12) return '🌅 Good Morning';
  if (hour >= 12 && hour < 17) return '☀️ Good Afternoon';
  if (hour >= 17 && hour < 21) return '🌇 Good Evening';
  return '🌙 Good Night';
}

function updateDateTime() {
  const now  = new Date();
  const hour = now.getHours();
  const name = localStorage.getItem('userName');

  greetingEl.textContent = getGreeting(hour) + (name ? `, ${name}` : '!');

  const dateStr = now.toLocaleDateString('en-US', {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
  });
  const timeStr = now.toLocaleTimeString('en-US', {
    hour: '2-digit', minute: '2-digit', second: '2-digit'
  });
  datetimeEl.textContent = `${dateStr} · ${timeStr}`;
}

setInterval(updateDateTime, 1000);
updateDateTime();


/* ================================================================
   3. CUSTOM NAME — Challenge #2
================================================================ */
const editNameBtn   = $('edit-name-btn');
const nameModal     = $('name-modal');
const nameInput     = $('name-input');
const saveNameBtn   = $('save-name-btn');
const cancelNameBtn = $('cancel-name-btn');

function loadUserName() {
  const name = localStorage.getItem('userName');
  if (name) {
    nameDisplay.textContent = name;
  }
}

editNameBtn.addEventListener('click', () => {
  nameInput.value = localStorage.getItem('userName') || '';
  nameModal.classList.remove('hidden');
  nameInput.focus();
});

saveNameBtn.addEventListener('click', saveName);
nameInput.addEventListener('keydown', e => {
  if (e.key === 'Enter') saveName();
  if (e.key === 'Escape') closeNameModal();
});
cancelNameBtn.addEventListener('click', closeNameModal);
nameModal.addEventListener('click', e => {
  if (e.target === nameModal) closeNameModal();
});

function saveName() {
  const name = nameInput.value.trim();
  if (name) {
    localStorage.setItem('userName', name);
    nameDisplay.textContent = name;
  } else {
    localStorage.removeItem('userName');
    nameDisplay.textContent = '';
  }
  closeNameModal();
  updateDateTime();
}

function closeNameModal() {
  nameModal.classList.add('hidden');
}

loadUserName();


/* ================================================================
   4. FOCUS TIMER — Challenge #3 (change Pomodoro time)
================================================================ */
const timerDisplay  = $('timer-display');
const timerStart    = $('timer-start');
const timerStop     = $('timer-stop');
const timerReset    = $('timer-reset');
const timerStatus   = $('timer-status');
const timerMinInput = $('timer-minutes');
const applyTimerBtn = $('apply-timer-btn');

let timerDuration = parseInt(localStorage.getItem('timerDuration') || '25', 10);
let timerSeconds  = timerDuration * 60;
let timerInterval = null;
let timerRunning  = false;

function formatTime(secs) {
  const m = String(Math.floor(secs / 60)).padStart(2, '0');
  const s = String(secs % 60).padStart(2, '0');
  return `${m}:${s}`;
}

function renderTimer() {
  timerDisplay.textContent = formatTime(timerSeconds);
  timerMinInput.value = timerDuration;
}

function startTimer() {
  if (timerRunning) return;
  if (timerSeconds === 0) return;
  timerRunning = true;
  timerDisplay.classList.add('running');
  timerDisplay.classList.remove('finished');
  timerStatus.textContent = 'Focus! 🔥';

  timerInterval = setInterval(() => {
    timerSeconds--;
    renderTimer();
    if (timerSeconds <= 0) {
      clearInterval(timerInterval);
      timerRunning = false;
      timerDisplay.classList.remove('running');
      timerDisplay.classList.add('finished');
      timerStatus.textContent = '🎉 Time\'s up! Great work!';
    }
  }, 1000);
}

function stopTimer() {
  if (!timerRunning) return;
  clearInterval(timerInterval);
  timerRunning = false;
  timerDisplay.classList.remove('running');
  timerStatus.textContent = 'Paused ⏸';
}

function resetTimer() {
  clearInterval(timerInterval);
  timerRunning  = false;
  timerSeconds  = timerDuration * 60;
  timerDisplay.classList.remove('running', 'finished');
  timerStatus.textContent = '';
  renderTimer();
}

applyTimerBtn.addEventListener('click', () => {
  const val = parseInt(timerMinInput.value, 10);
  if (isNaN(val) || val < 1 || val > 99) {
    showToast('Please enter a valid number of minutes (1–99)');
    return;
  }
  timerDuration = val;
  localStorage.setItem('timerDuration', val);
  resetTimer();
  timerStatus.textContent = `Timer set to ${val} min ✓`;
});

timerStart.addEventListener('click', startTimer);
timerStop.addEventListener('click',  stopTimer);
timerReset.addEventListener('click', resetTimer);

renderTimer();


/* ================================================================
   5. TO-DO LIST (add / edit / mark done / delete + LocalStorage)
      Bonus: Prevent duplicates + Sort tasks
================================================================ */
const todoInput    = $('todo-input');
const todoAddBtn   = $('todo-add-btn');
const todoListEl   = $('todo-list');
const todoCountEl  = $('todo-count');
const clearDoneBtn = $('clear-done-btn');
const todoSort     = $('todo-sort');
const todoFilter   = $('todo-filter');

let todos = JSON.parse(localStorage.getItem('todos') || '[]');

function saveTodos() {
  localStorage.setItem('todos', JSON.stringify(todos));
}

function getFilteredSorted() {
  let list = [...todos];

  // Filter
  const filter = todoFilter.value;
  if (filter === 'active') list = list.filter(t => !t.done);
  if (filter === 'done')   list = list.filter(t =>  t.done);

  // Sort
  const sort = todoSort.value;
  if (sort === 'az')   list.sort((a, b) => a.text.localeCompare(b.text));
  if (sort === 'za')   list.sort((a, b) => b.text.localeCompare(a.text));
  if (sort === 'done') list.sort((a, b) => Number(a.done) - Number(b.done));

  return list;
}

function renderTodos() {
  const list = getFilteredSorted();
  todoListEl.innerHTML = '';

  if (list.length === 0) {
    todoListEl.innerHTML = '<li style="color:var(--text-muted);font-size:0.87rem;text-align:center;padding:20px 0;">No tasks yet. Add one above!</li>';
  } else {
    list.forEach(todo => {
      const li = createTodoItem(todo);
      todoListEl.appendChild(li);
    });
  }

  const total  = todos.length;
  const done   = todos.filter(t => t.done).length;
  todoCountEl.textContent = `${total} task${total !== 1 ? 's' : ''} · ${done} done`;
}

function createTodoItem(todo) {
  const li = document.createElement('li');
  li.className = `todo-item${todo.done ? ' done' : ''}`;
  li.dataset.id = todo.id;

  // Checkbox
  const cb = document.createElement('input');
  cb.type = 'checkbox';
  cb.className = 'todo-checkbox';
  cb.checked = todo.done;
  cb.setAttribute('aria-label', 'Mark as done');
  cb.addEventListener('change', () => toggleDone(todo.id));

  // Text span
  const span = document.createElement('span');
  span.className = 'todo-text';
  span.textContent = todo.text;

  // Actions
  const actions = document.createElement('div');
  actions.className = 'todo-actions';

  const editBtn = document.createElement('button');
  editBtn.className = 'btn-edit';
  editBtn.textContent = '✏️';
  editBtn.setAttribute('aria-label', 'Edit task');
  editBtn.addEventListener('click', () => startEdit(todo.id, li, span));

  const delBtn = document.createElement('button');
  delBtn.className = 'btn btn-danger';
  delBtn.textContent = '✕';
  delBtn.setAttribute('aria-label', 'Delete task');
  delBtn.addEventListener('click', () => deleteTodo(todo.id));

  actions.appendChild(editBtn);
  actions.appendChild(delBtn);

  li.appendChild(cb);
  li.appendChild(span);
  li.appendChild(actions);

  return li;
}

function startEdit(id, li, span) {
  const todo = todos.find(t => t.id === id);
  if (!todo) return;

  const input = document.createElement('input');
  input.type = 'text';
  input.className = 'todo-edit-input';
  input.value = todo.text;
  input.maxLength = 100;

  span.replaceWith(input);
  input.focus();
  input.select();

  function commit() {
    const newText = input.value.trim();
    if (!newText) {
      input.replaceWith(span);
      return;
    }
    // Check duplicate (excluding self)
    const duplicate = todos.some(t => t.id !== id && t.text.toLowerCase() === newText.toLowerCase());
    if (duplicate) {
      showToast('A task with that name already exists!');
      input.focus();
      return;
    }
    todo.text = newText;
    span.textContent = newText;
    input.replaceWith(span);
    saveTodos();
    renderTodos();
  }

  input.addEventListener('blur', commit);
  input.addEventListener('keydown', e => {
    if (e.key === 'Enter')  { input.blur(); }
    if (e.key === 'Escape') { input.replaceWith(span); }
  });
}

function addTodo() {
  const text = todoInput.value.trim();
  if (!text) {
    showToast('Please enter a task!');
    return;
  }

  // Prevent duplicate
  const duplicate = todos.some(t => t.text.toLowerCase() === text.toLowerCase());
  if (duplicate) {
    showToast('That task already exists!');
    todoInput.select();
    return;
  }

  todos.push({ id: Date.now().toString(), text, done: false });
  saveTodos();
  todoInput.value = '';
  todoInput.focus();
  renderTodos();
}

function toggleDone(id) {
  const todo = todos.find(t => t.id === id);
  if (todo) {
    todo.done = !todo.done;
    saveTodos();
    renderTodos();
  }
}

function deleteTodo(id) {
  todos = todos.filter(t => t.id !== id);
  saveTodos();
  renderTodos();
}

todoAddBtn.addEventListener('click', addTodo);
todoInput.addEventListener('keydown', e => { if (e.key === 'Enter') addTodo(); });
clearDoneBtn.addEventListener('click', () => {
  todos = todos.filter(t => !t.done);
  saveTodos();
  renderTodos();
});
todoSort.addEventListener('change',   renderTodos);
todoFilter.addEventListener('change', renderTodos);

renderTodos();


/* ================================================================
   6. QUICK LINKS (add / delete + LocalStorage)
================================================================ */
const linkNameInput = $('link-name-input');
const linkUrlInput  = $('link-url-input');
const linkAddBtn    = $('link-add-btn');
const linksGrid     = $('links-grid');

let links = JSON.parse(localStorage.getItem('quickLinks') || '[]');

// Default links if none saved
if (links.length === 0) {
  links = [
    { id: '1', name: 'GitHub', url: 'https://github.com' },
    { id: '2', name: 'Google', url: 'https://google.com' },
    { id: '3', name: 'YouTube', url: 'https://youtube.com' },
  ];
  localStorage.setItem('quickLinks', JSON.stringify(links));
}

function saveLinks() {
  localStorage.setItem('quickLinks', JSON.stringify(links));
}

function getFaviconUrl(url) {
  try {
    const origin = new URL(url).origin;
    return `https://www.google.com/s2/favicons?domain=${origin}&sz=32`;
  } catch {
    return '';
  }
}

function renderLinks() {
  linksGrid.innerHTML = '';

  if (links.length === 0) {
    linksGrid.innerHTML = '<p style="color:var(--text-muted);font-size:0.87rem;">No links yet. Add one above!</p>';
    return;
  }

  links.forEach(link => {
    const chip = document.createElement('div');
    chip.className = 'link-chip';

    const favicon = document.createElement('img');
    favicon.className = 'favicon';
    favicon.src = getFaviconUrl(link.url);
    favicon.alt = '';
    favicon.onerror = () => { favicon.style.display = 'none'; };

    const a = document.createElement('a');
    a.href = link.url;
    a.target = '_blank';
    a.rel = 'noopener noreferrer';
    a.textContent = link.name;

    const delBtn = document.createElement('button');
    delBtn.className = 'link-delete-btn';
    delBtn.textContent = '✕';
    delBtn.setAttribute('aria-label', `Remove ${link.name}`);
    delBtn.addEventListener('click', () => {
      links = links.filter(l => l.id !== link.id);
      saveLinks();
      renderLinks();
    });

    chip.appendChild(favicon);
    chip.appendChild(a);
    chip.appendChild(delBtn);
    linksGrid.appendChild(chip);
  });
}

function addLink() {
  const name = linkNameInput.value.trim();
  const url  = linkUrlInput.value.trim();

  if (!name || !url) {
    showToast('Please enter both a label and a URL!');
    return;
  }

  // Basic URL validation
  let fullUrl = url;
  if (!/^https?:\/\//i.test(url)) {
    fullUrl = 'https://' + url;
  }

  try {
    new URL(fullUrl);
  } catch {
    showToast('Please enter a valid URL!');
    return;
  }

  links.push({ id: Date.now().toString(), name, url: fullUrl });
  saveLinks();
  linkNameInput.value = '';
  linkUrlInput.value  = '';
  linkNameInput.focus();
  renderLinks();
}

linkAddBtn.addEventListener('click', addLink);
linkUrlInput.addEventListener('keydown', e => { if (e.key === 'Enter') addLink(); });
linkNameInput.addEventListener('keydown', e => { if (e.key === 'Enter') linkUrlInput.focus(); });

renderLinks();
