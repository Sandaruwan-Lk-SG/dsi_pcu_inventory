/* app.js
 - Minimal, dependency-free.
 - Assumes backend sets HttpOnly cookies on successful login.
 - Uses credentials: 'include' to allow cookies.
 - After successful login, calls /api/auth/me to get user role and redirects accordingly.
*/

(() => {
  const form = document.getElementById('loginForm');
  const usernameEl = document.getElementById('username');
  const passwordEl = document.getElementById('password');
  const msgEl = document.getElementById('msg');
  const togglePwd = document.getElementById('togglePwd');
  const submitBtn = document.getElementById('submitBtn');

  // button ripple
  submitBtn.addEventListener('click', (ev) => {
    const r = submitBtn.querySelector('.ripple');
    const rect = submitBtn.getBoundingClientRect();
    const x = ev.clientX - rect.left;
    const y = ev.clientY - rect.top;
    r.style.left = x + 'px';
    r.style.top = y + 'px';
    r.style.width = r.style.height = '200px';
    r.style.opacity = '1';
    setTimeout(()=> { r.style.width = r.style.height = '0'; r.style.opacity = '0'; }, 400);
  });

  togglePwd.addEventListener('click', () => {
    const t = passwordEl.getAttribute('type') === 'password' ? 'text' : 'password';
    passwordEl.setAttribute('type', t);
    togglePwd.textContent = t === 'text' ? '🙈' : '👁️';
  });

  function showMessage(text, type='') {
    msgEl.textContent = text;
    msgEl.className = 'msg' + (type ? ' ' + type : '');
  }

  async function postLogin(payload) {
    try {
      showMessage('Logging in...');
      // IMPORTANT: credentials: 'include' — backend must set cookie with HttpOnly & Secure and allow credentials
      const res = await fetch(`${API_BASE}/api/auth/login`, {
        method: 'POST',
        credentials: 'include',
        headers: {'Content-Type':'application/json'},
        body: JSON.stringify(payload)
      });

      const data = await res.json().catch(()=> null);

      if (!res.ok) {
        const err = (data && data.message) ? data.message : `Login failed (${res.status})`;
        showMessage(err, 'error');
        return null;
      }

      // backend should set HttpOnly cookie; here we can request user info
      showMessage('Login successful. Redirecting...', 'success');

      // fetch user info to determine role
      const me = await fetch(`${API_BASE}/api/auth/me`, {
        credentials: 'include'
      }).then(r => r.ok ? r.json() : null);

      // fallback: if API doesn't provide, use server response
      const role = (me && me.role) ? me.role : (data && data.role) ? data.role : 'user';

      // redirect depending on role
      if (role === 'admin') {
        window.location.href = '/admin-dashboard.html';
      } else {
        window.location.href = '/user-dashboard.html';
      }

    } catch (err) {
      console.error(err);
      showMessage('Network error. Check backend URL & CORS.', 'error');
    }
  }

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const username = usernameEl.value.trim();
    const password = passwordEl.value;
    if (!username || !password) {
      showMessage('Enter username and password', 'error');
      return;
    }
    postLogin({username, password});
  });

  // small UX: enter focuses next, escape clears
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      usernameEl.value = ''; passwordEl.value = ''; showMessage('');
    }
  });
})();
