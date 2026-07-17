// ==========================================================================
// A. STATE MANAGEMENT (Membaca Data Awal dari LocalStorage)
// ==========================================================================
let currentTheme = localStorage.getItem('theme') || 'light';
let userName = localStorage.getItem('userName') || 'Friend';
let todos = JSON.parse(localStorage.getItem('todos')) || [];
let links = JSON.parse(localStorage.getItem('links')) || [];

// State untuk Timer
let timerInterval = null;
let timerMinutes = 25;
let timeLeft = timerMinutes * 60;
let isTimerRunning = false;

// Menyimpan ID item todo yang sedang diedit secara temporer
let editingTodoId = null;

// ==========================================================================
// B. DOM ELEMENTS SELECTOR (Menghubungkan ke Elemen HTML Kiro)
// ==========================================================================
// Theme & Greeting
const themeToggle = document.getElementById('themeToggle');
const datetimeDisplay = document.getElementById('datetime');
const greetingDisplay = document.getElementById('greeting');
const displayName = document.getElementById('displayName');
const editNameBtn = document.getElementById('editNameBtn');
const nameModal = document.getElementById('nameModal');
const nameInput = document.getElementById('nameInput');
const saveNameBtn = document.getElementById('saveNameBtn');
const cancelNameBtn = document.getElementById('cancelNameBtn');

// Focus Timer
const timerDisplay = document.getElementById('timerDisplay');
const timerMinutesInput = document.getElementById('timerMinutes');
const applyTimerBtn = document.getElementById('applyTimerBtn');
const startBtn = document.getElementById('startBtn');
const stopBtn = document.getElementById('stopBtn');
const resetBtn = document.getElementById('resetBtn');
const timerStatus = document.getElementById('timerStatus');

// To-Do List
const sortSelect = document.getElementById('sortSelect');
const taskInput = document.getElementById('taskInput');
const addTaskBtn = document.getElementById('addTaskBtn');
const todoError = document.getElementById('todoError');
const taskList = document.getElementById('taskList');
const emptyTodo = document.getElementById('emptyTodo');

// Quick Links
const linkNameInput = document.getElementById('linkName');
const linkUrlInput = document.getElementById('linkUrl');
const addLinkBtn = document.getElementById('addLinkBtn');
const linkError = document.getElementById('linkError');
const linkGrid = document.getElementById('linkGrid');
const emptyLinks = document.getElementById('emptyLinks');

// Edit Modal
const editModal = document.getElementById('editModal');
const editTaskInput = document.getElementById('editTaskInput');
const saveEditBtn = document.getElementById('saveEditBtn');
const cancelEditBtn = document.getElementById('cancelEditBtn');

// ==========================================================================
// C. FITUR 1: JAM REALTIME & UCAPAN SALAM (GREETING) + KUSTOM NAMA
// ==========================================================================
function updateClockAndGreeting() {
  const now = new Date();
  
  // Format Tanggal & Waktu Indonesia
  const timeString = now.toLocaleTimeString('id-ID', { hour12: false });
  const dateString = now.toLocaleDateString('id-ID', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
  
  datetimeDisplay.textContent = `${dateString} | ${timeString}`;
  
  // Logika Ucapan Salam Otomatis
  const hour = now.getHours();
  let greetingText = "Good Night";
  if (hour >= 5 && hour < 12) greetingText = "Good Morning";
  else if (hour >= 12 && hour < 17) greetingText = "Good Afternoon";
  else if (hour >= 17 && hour < 21) greetingText = "Good Evening";
  
  greetingDisplay.textContent = greetingText;
}

// Inisialisasi Nama Tampilan
displayName.textContent = userName;

// Event Handler Modal Nama
editNameBtn.addEventListener('click', () => {
  nameInput.value = userName;
  nameModal.classList.add('active');
});
cancelNameBtn.addEventListener('click', () => nameModal.classList.remove('active'));
saveNameBtn.addEventListener('click', () => {
  const trimmedName = nameInput.value.trim();
  if (trimmedName) {
    userName = trimmedName;
    localStorage.setItem('userName', userName);
    displayName.textContent = userName;
    nameModal.classList.remove('active');
  }
});

// ==========================================================================
// D. FITUR 2: LIGHT / DARK MODE THEME TOGGLE
// ==========================================================================
document.documentElement.setAttribute('data-theme', currentTheme);
themeToggle.querySelector('.theme-icon').innerHTML = currentTheme === 'dark' ? '&#x2600;&#xFE0F;' : '&#x1F319;';

themeToggle.addEventListener('click', () => {
  if (document.documentElement.getAttribute('data-theme') === 'light') {
    currentTheme = 'dark';
    themeToggle.querySelector('.theme-icon').innerHTML = '&#x2600;&#xFE0F;'; // Icon matahari untuk mode gelap
  } else {
    currentTheme = 'light';
    themeToggle.querySelector('.theme-icon').innerHTML = '&#x1F319;'; // Icon bulan untuk mode terang
  }
  document.documentElement.setAttribute('data-theme', currentTheme);
  localStorage.setItem('theme', currentTheme);
});

// ==========================================================================
// E. FITUR 3: FOCUS TIMER (POMODORO) DENGAN DURASI KUSTOM
// ==========================================================================
function updateTimerDisplay() {
  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;
  timerDisplay.textContent = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
}

applyTimerBtn.addEventListener('click', () => {
  if (isTimerRunning) return;
  const newMinutes = parseInt(timerMinutesInput.value);
  if (newMinutes >= 1 && newMinutes <= 99) {
    timerMinutes = newMinutes;
    timeLeft = timerMinutes * 60;
    updateTimerDisplay();
    timerStatus.textContent = `Duration set to ${timerMinutes} minutes.`;
  }
});

startBtn.addEventListener('click', () => {
  if (isTimerRunning) return;
  isTimerRunning = true;
  startBtn.disabled = true;
  stopBtn.disabled = false;
  applyTimerBtn.disabled = true;
  timerStatus.textContent = "Focusing...";

  timerInterval = setInterval(() => {
    timeLeft--;
    updateTimerDisplay();

    if (timeLeft <= 0) {
      clearInterval(timerInterval);
      isTimerRunning = false;
      startBtn.disabled = false;
      stopBtn.disabled = true;
      applyTimerBtn.disabled = false;
      timerStatus.textContent = "Time is up! Take a break.";
      alert("Focus session complete!");
      timeLeft = timerMinutes * 60;
      updateTimerDisplay();
    }
  }, 1000);
});

stopBtn.addEventListener('click', () => {
  clearInterval(timerInterval);
  isTimerRunning = false;
  startBtn.disabled = false;
  stopBtn.disabled = true;
  timerStatus.textContent = "Timer paused.";
});

resetBtn.addEventListener('click', () => {
  clearInterval(timerInterval);
  isTimerRunning = false;
  startBtn.disabled = false;
  stopBtn.disabled = true;
  applyTimerBtn.disabled = false;
  timeLeft = timerMinutes * 60;
  updateTimerDisplay();
  timerStatus.textContent = "Timer reset.";
});

// ==========================================================================
// F. FITUR 4: TO-DO LIST (CRUD, MENCEGAH DUPLIKAT, & SORTING)
// ==========================================================================
function saveAndRenderTodos() {
  localStorage.setItem('todos', JSON.stringify(todos));
  renderTodos();
}

function renderTodos() {
  taskList.innerHTML = '';
  todoError.textContent = '';
  
  if (todos.length === 0) {
    emptyTodo.style.display = 'block';
    return;
  }
  emptyTodo.style.display = 'none';

  // Salin state array untuk disortir tanpa merusak urutan asli data LocalStorage
  let processedTodos = [...todos];

  const sortValue = sortSelect.value;
  if (sortValue === 'az') {
    processedTodos.sort((a, b) => a.text.localeCompare(b.text));
  } else if (sortValue === 'za') {
    processedTodos.sort((a, b) => b.text.localeCompare(a.text));
  } else if (sortValue === 'done') {
    processedTodos.sort((a, b) => a.completed - b.completed);
  }

  processedTodos.forEach(todo => {
    const li = document.createElement('li');
    li.className = 'task-item';

    li.innerHTML = `
      <div class="task-item-left" onclick="toggleTodo('${todo.id}')">
        <input type="checkbox" ${todo.completed ? 'checked' : ''} style="cursor:pointer;">
        <span class="task-text ${todo.completed ? 'completed' : ''}">${todo.text}</span>
      </div>
      <div class="task-actions">
        <button class="btn-icon" onclick="openEditModal('${todo.id}', '${todo.text}')" title="Edit">&#x1F4DD;</button>
        <button class="btn-icon" onclick="deleteTodo('${todo.id}')" title="Hapus" style="color:var(--danger-color);">&#x1F5D1;</button>
      </div>
    `;
    taskList.appendChild(li);
  });
}

// Tambah Todo Baru + Proteksi Duplikat (Tantangan)
addTaskBtn.addEventListener('click', () => {
  const text = taskInput.value.trim();
  if (!text) return;

  // Cek duplikat secara case-insensitive
  const isDuplicate = todos.some(todo => todo.text.toLowerCase() === text.toLowerCase());
  if (isDuplicate) {
    todoError.textContent = 'Task already exists! Please write another task.';
    return;
  }

  todos.push({
    id: Date.now().toString(),
    text: text,
    completed: false
  });

  taskInput.value = '';
  saveAndRenderTodos();
});

window.toggleTodo = function(id) {
  todos = todos.map(todo => todo.id === id ? { ...todo, completed: !todo.completed } : todo);
  saveAndRenderTodos();
};

window.deleteTodo = function(id) {
  todos = todos.filter(todo => todo.id !== id);
  saveAndRenderTodos();
};

// Pengaturan Modal Edit Todo
window.openEditModal = function(id, text) {
  editingTodoId = id;
  editTaskInput.value = text;
  editModal.classList.add('active');
};
cancelEditBtn.addEventListener('click', () => editModal.classList.remove('active'));
saveEditBtn.addEventListener('click', () => {
  const newText = editTaskInput.value.trim();
  if (newText) {
    todos = todos.map(todo => todo.id === editingTodoId ? { ...todo, text: newText } : todo);
    saveAndRenderTodos();
    editModal.classList.remove('active');
  }
});

sortSelect.addEventListener('change', renderTodos);

// ==========================================================================
// G. FITUR 5: QUICK LINKS MENGGUNAKAN LOCAL STORAGE
// ==========================================================================
function saveAndRenderLinks() {
  localStorage.setItem('links', JSON.stringify(links));
  renderLinks();
}

function renderLinks() {
  linkGrid.innerHTML = '';
  linkError.textContent = '';

  if (links.length === 0) {
    emptyLinks.style.display = 'block';
    return;
  }
  emptyLinks.style.display = 'none';

  links.forEach(link => {
    const a = document.createElement('a');
    a.href = link.url;
    a.target = '_blank';
    a.className = 'link-item';
    a.textContent = link.name;

    const delBtn = document.createElement('button');
    delBtn.className = 'delete-link-btn';
    delBtn.innerHTML = '&times;';
    delBtn.title = 'Remove link';
    delBtn.onclick = (e) => {
      e.preventDefault(); // Mencegah link terbuka saat tombol silang di-klik
      deleteLink(link.id);
    };

    a.appendChild(delBtn);
    linkGrid.appendChild(a);
  });
}

addLinkBtn.addEventListener('click', () => {
  const name = linkNameInput.value.trim();
  let url = linkUrlInput.value.trim();

  if (!name || !url) return;

  // Validasi format URL dasar
  if (!url.startsWith('http://') && !url.startsWith('https://')) {
    url = 'https://' + url;
  }

  links.push({
    id: Date.now().toString(),
    name: name,
    url: url
  });

  linkNameInput.value = '';
  linkUrlInput.value = '';
  saveAndRenderLinks();
});

function deleteLink(id) {
  links = links.filter(link => link.id !== id);
  saveAndRenderLinks();
}

// ==========================================================================
// H. INITIAL RUNNING (Menjalankan Fungsi saat Halaman Dimuat)
// ==========================================================================
setInterval(updateClockAndGreeting, 1000);
updateClockAndGreeting();
updateTimerDisplay();
renderTodos();
renderLinks();