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
const token = localStorage.getItem('token');

if (!token) window.location.href = '/';
let i=0;

let user = null;
let tasks = ["First Task Is To Plough","This Is Second Task","Third Task","Fourth Task"];

logoutBtn.addEventListener('click', () => {
  localStorage.removeItem('token');
  window.location.href = '/';
});

submitBtn.addEventListener('click', completeTask);

async function loadAll() {
  try {
    const [taskRes, userRes] = await Promise.all([
      fetch('/api/tasks'),
      fetch('/api/user', { headers: { 'Authorization': 'Bearer ' + token } })
    ]);

    tasks = await taskRes.json();
    if (!userRes.ok) return window.location.href = '/';

    user = await userRes.json();
    welcomeTxt.innerText = `Welcome, ${user.name}`;
    render();
  } catch (err) {
    console.error(err);
    alert('Failed to load dashboard.');
  }
}

function render() {
  const idx = user.currentTaskIndex || 0;
  updateProgress();
  pointsDisplay.innerText = user.points || 0;

  if (idx >= tasks.length) {
    taskSection.style.display = 'none';
    finishedMsg.style.display = 'block';
  } else {
    taskSection.style.display = 'block';
    finishedMsg.style.display = 'none';
    taskText.innerText = tasks[i++] || `Task #${i+1}`;
  }

  completedList.innerHTML = '';
  (user.tasksCompleted || []).slice().reverse().forEach(c => {
    const li = document.createElement('li');
    li.innerHTML = `<strong>Task:</strong> ${tasks[c.taskIndex]?.trim() || 'Task'} <br/>
                    <small>${new Date(c.completedAt).toLocaleString()}</small><br/>
                    <a href="${c.photoPath}" target="_blank">View photo</a>`;
    completedList.appendChild(li);
  });
}

function updateProgress() {
  const idx = user.currentTaskIndex || 0;
  const percent = tasks.length ? Math.round((idx / tasks.length) * 100) : 0;
  progressEl.value = percent;
  progressText.innerText = percent + '%';
}

async function completeTask() {
  const file = taskPhoto.files[0];
  if (!file) return alert('Attach a photo.');

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

    const fresh = await fetch('/api/user', { headers: { 'Authorization': 'Bearer ' + token } });
    if (fresh.ok) {
      user = await fresh.json();
      taskPhoto.value = '';
      render();
    }
  } catch (err) {
    console.error(err);
    submitBtn.disabled = false;
    submitBtn.innerText = 'Submit Photo & Complete';
    alert('Upload error');
  }
}

loadAll();
