// Elements
const welcomeTxt = document.getElementById('welcomeTxt');
const taskText = document.getElementById('taskText');
const taskPhoto = document.getElementById('taskPhoto');
const submitBtn = document.getElementById('submitPhotoBtn');
const progressEl = document.getElementById('taskProgress');
const progressText = document.getElementById('progressText');
const completedList = document.getElementById('completedList');
const finishedMsg = document.getElementById('finishedMsg');
const taskSection = document.getElementById('taskSection');
const pointsDisplay = document.getElementById('pointsDisplay');
const logoutBtn = document.getElementById('logoutBtn');
const task=["Plough Your Land","Plant The Seeds","Water it","Time To Put The Pestiside"]
let i=0;

logoutBtn.addEventListener('click', logout);
submitBtn.addEventListener('click', completeTask);

let tasks = [];
let user = null;
const token = localStorage.getItem('token');

if (!token) {
  window.location.href = '/';
}

// Load tasks and user info
async function loadAll() {
  try {
    const [taskRes, userRes] = await Promise.all([
      fetch('/api/tasks'),
      fetch('/api/user', { headers: { 'Authorization': 'Bearer ' + token } })
    ]);

    tasks = await taskRes.json();

    if (!userRes.ok) {
      localStorage.removeItem('token');
      return window.location.href = '/';
    }

    user = await userRes.json();
    welcomeTxt.innerText = `Welcome, ${user.name}`;
    render();
  } catch (err) {
    console.error(err);
    alert('Failed to load dashboard.');
  }
}

// Render dashboard
function render() {
  const idx = user.currentTaskIndex || 0;
  updateProgress();

  // Update reward points display
  pointsDisplay.innerText = user.points || 0;

  // Show current task or finished
  if (idx >= tasks.length) {
    taskSection.style.display = 'none';
    finishedMsg.style.display = 'block';
  } else {
    taskSection.style.display = 'block';
    finishedMsg.style.display = 'none';
    taskText.innerText = tasks[idx].title || `${task[i++]}`;
  }

  // Display completed tasks
  completedList.innerHTML = '';
  (user.tasksCompleted || []).slice().reverse().forEach(c => {
    const li = document.createElement('li');
    li.innerHTML = `
      <strong>Task:</strong> ${tasks[c.taskIndex]?.title || 'Task #' + (c.taskIndex + 1)} <br/>
      <small>${new Date(c.completedAt).toLocaleString()}</small><br/>
      <a href="${c.photoPath}" target="_blank">View photo</a>
    `;
    completedList.appendChild(li);
  });
}

// Update progress bar
function updateProgress() {
  const idx = user.currentTaskIndex || 0;
  const percent = tasks.length ? Math.round((idx / tasks.length) * 100) : 0;
  progressEl.value = percent;
  progressText.innerText = percent + '%';
}

// Complete task with photo upload
async function completeTask() {
  const file = taskPhoto.files[0];
  if (!file) return alert('Please attach a photo to complete the task.');

  const formData = new FormData();
  formData.append('photo', file);

  try {
    submitBtn.disabled = true;
    submitBtn.innerText = 'Uploading...';

    const res = await fetch('/api/complete-task', {
      method: 'POST',
      headers: { 'Authorization': 'Bearer ' + token },
      body: formData
    });

    const data = await res.json();
    submitBtn.disabled = false;
    submitBtn.innerText = 'Submit Photo & Complete';

    if (!res.ok) return alert(data.message || 'Upload failed');

    // Fetch fresh user data from backend
    const fresh = await fetch('/api/user', { headers: { 'Authorization': 'Bearer ' + token } });
    if (fresh.ok) {
      user = await fresh.json();
      taskPhoto.value = '';
      render();
    } else {
      alert('Task completed but failed to refresh user data');
    }

  } catch (err) {
    console.error(err);
    submitBtn.disabled = false;
    submitBtn.innerText = 'Submit Photo & Complete';
    alert('Upload error');
  }
}

// Logout
function logout() {
  localStorage.removeItem('token');
  window.location.href = '/';
}

// Initialize dashboard
loadAll();
