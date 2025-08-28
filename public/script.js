// Toggle forms
const signupForm = document.getElementById('signupForm');
const signinForm = document.getElementById('signinForm');
document.getElementById('toSignin').addEventListener('click', (e) => { e.preventDefault(); showSignin(); });
document.getElementById('toSignup').addEventListener('click', (e) => { e.preventDefault(); showSignup(); });

function showSignin() {
  signupForm.classList.remove('active');
  signinForm.classList.add('active');
}
function showSignup() {
  signinForm.classList.remove('active');
  signupForm.classList.add('active');
}

// start with signup visible
showSignup();

// Signup handler
signupForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  const payload = {
    name: document.getElementById('signupName').value.trim(),
    phoneNo: document.getElementById('signupPhone').value.trim(),
    password: document.getElementById('signupPassword').value,
    farmSize: document.getElementById('signupFarmSize').value.trim(),
    location: document.getElementById('signupLocation').value.trim()
  };
  try {
    const res = await fetch('/api/signup', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    const data = await res.json();
    if (!res.ok) return alert(data.message || 'Signup failed');
    localStorage.setItem('token', data.token);
    window.location.href = '/dashboard.html';
  } catch (err) {
    console.error(err);
    alert('Signup error');
  }
});

// Signin handler
signinForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  const payload = {
    phoneNo: document.getElementById('signinPhone').value.trim(),
    password: document.getElementById('signinPassword').value
  };
  try {
    const res = await fetch('/api/signin', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    const data = await res.json();
    if (!res.ok) return alert(data.message || 'Signin failed');
    localStorage.setItem('token', data.token);
    window.location.href = '/dashboard.html';
  } catch (err) {
    console.error(err);
    alert('Signin error');
  }
});
