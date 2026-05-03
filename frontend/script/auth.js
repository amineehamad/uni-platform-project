const Auth = (() => {

  // ── Config ────────────────────────────────────────────────────────────────
  const API_BASE  = 'http://localhost/web/backend';
  const TOKEN_KEY  = 'em_token';
  const USER_KEY   = 'em_user';

  // ── Request helper ─────────────────────────────────────────────────────────
  async function request(endpoint, method = 'GET', body = null) {
    const headers = { 'Content-Type': 'application/json' };

    const token = getToken();
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const options = { method, headers };

    if (body) {
      options.body = JSON.stringify(body);
    }

    const response = await fetch(`${API_BASE}${endpoint}`, options);
    const data = await response.json();

    return { ok: response.ok, status: response.status, data };
  }

  // ── Storage ────────────────────────────────────────────────────────────────
  function saveSession(token, user) {
    localStorage.setItem(TOKEN_KEY, token);
    localStorage.setItem(USER_KEY, JSON.stringify(user));
  }

  function clearSession() {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
  }

  function getToken() {
    return localStorage.getItem(TOKEN_KEY);
  }

  function getUser() {
    const raw = localStorage.getItem(USER_KEY);
    return raw ? JSON.parse(raw) : null;
  }

  function isLoggedIn() {
    return !!getToken();
  }

  // ── REGISTER ───────────────────────────────────────────────────────────────
  async function register(formData) {
    try {
      const payload = {
        first_name: formData.first_name,
        last_name: formData.last_name,
        email: formData.email,
        birthdate: formData.birthdate,
        academic_year: formData.academic_year,
        password: formData.password,
        password_confirmation: formData.password_confirmation,
      };

      const { ok, data, status } =
        await request('/auth/register', 'POST', payload);

      if (ok && data.success) {
        saveSession(data.token, data.user);
        return { success: true, user: data.user, message: data.message };
      }

      return {
        success: false,
        message: data.message || 'Registration failed',
        errors: data.errors || {},
        status
      };

    } catch (err) {
      return {
        success: false,
        message: 'Network error',
        errors: {}
      };
    }
  }

  // ── LOGIN ──────────────────────────────────────────────────────────────────
  async function login(credentials) {
    try {
      const { ok, data, status } =
        await request('/auth/login', 'POST', credentials);

      if (ok && data.success) {
        saveSession(data.token, data.user);
        return { success: true, user: data.user, message: data.message };
      }

      return {
        success: false,
        message: data.message || 'Login failed',
        errors: data.errors || {},
        status
      };

    } catch (err) {
      return {
        success: false,
        message: 'Network error',
        errors: {}
      };
    }
  }

  // ── LOGOUT ─────────────────────────────────────────────────────────────────
  function logout(redirectTo = 'login.html') {
    clearSession();
    window.location.href = redirectTo;
  }

  // ── PROFILE ────────────────────────────────────────────────────────────────
  async function fetchProfile() {
    try {
      const { ok, data } = await request('/auth/me', 'GET');

      if (ok && data.success) {
        localStorage.setItem(USER_KEY, JSON.stringify(data.user));
        return data.user;
      }

      return null;
    } catch {
      return null;
    }
  }

  // ── GUARDS ────────────────────────────────────────────────────────────────
  function requireAuth(loginPage = 'login.html') {
    if (!isLoggedIn()) {
      window.location.href = loginPage;
    }
  }

  function requireGuest(dashboard = 'dashboard.html') {
    if (isLoggedIn()) {
      window.location.href = dashboard;
    }
  }

  function formatErrors(errors) {
    return Object.values(errors).flat().join('\n');
  }

  // ── EXPORT ────────────────────────────────────────────────────────────────
  return {
    register,
    login,
    logout,
    fetchProfile,
    requireAuth,
    requireGuest,
    getToken,
    getUser,
    isLoggedIn,
    formatErrors,
  };

})();