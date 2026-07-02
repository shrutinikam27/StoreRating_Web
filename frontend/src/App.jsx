import React, { useState, useEffect, useMemo } from 'react';
import { 
  Star, User, Store, Shield, LogOut, Plus, Search, 
  Lock, MapPin, Mail, ChevronUp, ChevronDown, 
  Loader, KeyRound, Sparkles, X, Info
} from 'lucide-react';

const API_BASE = 'http://localhost:5000/api';

export default function App() {
  // Auth State
  const [token, setToken] = useState(localStorage.getItem('token') || '');
  const [currentUser, setCurrentUser] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [isRegister, setIsRegister] = useState(false);

  // Form Fields (Login / Register)
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [address, setAddress] = useState('');

  // Password Update State
  const [newPassword, setNewPassword] = useState('');
  const [passwordLoading, setPasswordLoading] = useState(false);

  // Toast State
  const [toast, setToast] = useState(null);

  // Admin Dashboard State
  const [adminStats, setAdminStats] = useState({ totalUsers: 0, totalStores: 0, totalRatings: 0 });
  const [adminUsers, setAdminUsers] = useState([]);
  const [adminStores, setAdminStores] = useState([]);
  const [adminActiveTab, setAdminActiveTab] = useState('stores'); // 'stores' or 'users'
  const [adminSelectedUser, setAdminSelectedUser] = useState(null); // Detail drawer user
  const [showAddUserModal, setShowAddUserModal] = useState(false);

  // Admin User Creation Form
  const [newUserFields, setNewUserFields] = useState({
    name: '',
    email: '',
    password: '',
    address: '',
    role: 'user'
  });

  // Admin Filters
  const [adminFilters, setAdminFilters] = useState({
    name: '',
    email: '',
    address: '',
    role: ''
  });

  // Sorting State
  const [sortField, setSortField] = useState('name');
  const [sortOrder, setSortOrder] = useState('ASC');

  // Normal User State
  const [stores, setStores] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');

  // Store Owner State
  const [ownerStats, setOwnerStats] = useState({ averageRating: 0, ratings: [] });
  const [ownerSortField, setOwnerSortField] = useState('name');
  const [ownerSortOrder, setOwnerSortOrder] = useState('ASC');

  // Loaders
  const [dataLoading, setDataLoading] = useState(false);

  // Form Validation Errors (Live feedback)
  const [validationErrors, setValidationErrors] = useState({});

  // Display toast utility
  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  };

  // Set header options helper
  const getHeaders = () => ({
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`
  });

  // Check Password Strength
  const checkPasswordStrength = (pwd) => {
    if (!pwd) return { valid: false, message: 'Password is required' };
    const hasLength = pwd.length >= 8 && pwd.length <= 16;
    const hasUpper = /[A-Z]/.test(pwd);
    const hasSpecial = /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?`~]/.test(pwd);
    
    if (!hasLength) return { valid: false, message: 'Must be 8-16 characters' };
    if (!hasUpper) return { valid: false, message: 'Must include at least one uppercase letter' };
    if (!hasSpecial) return { valid: false, message: 'Must include at least one special character' };
    
    return { valid: true };
  };

  // Validate fields dynamically
  const validateField = (field, value) => {
    const errors = { ...validationErrors };
    
    if (field === 'name') {
      if (!value || value.trim().length < 20 || value.trim().length > 60) {
        errors.name = 'Name must be between 20 and 60 characters.';
      } else {
        delete errors.name;
      }
    }

    if (field === 'email') {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!value || !emailRegex.test(value)) {
        errors.email = 'Must follow standard email validation rules.';
      } else {
        delete errors.email;
      }
    }

    if (field === 'password') {
      const strength = checkPasswordStrength(value);
      if (!strength.valid) {
        errors.password = strength.message;
      } else {
        delete errors.password;
      }
    }

    if (field === 'address') {
      if (!value || value.trim().length === 0 || value.trim().length > 400) {
        errors.address = 'Address cannot exceed 400 characters.';
      } else {
        delete errors.address;
      }
    }

    setValidationErrors(errors);
  };

  // Restore Session
  useEffect(() => {
    if (token) {
      setAuthLoading(true);
      fetch(`${API_BASE}/auth/me`, {
        headers: getHeaders()
      })
      .then(res => {
        if (!res.ok) throw new Error('Session expired');
        return res.json();
      })
      .then(user => {
        setCurrentUser(user);
        setAuthLoading(false);
      })
      .catch(err => {
        console.error(err);
        logout();
        setAuthLoading(false);
      });
    } else {
      setAuthLoading(false);
    }
  }, [token]);

  // Load view data based on role
  useEffect(() => {
    if (!currentUser) return;
    loadDashboardData();
  }, [currentUser, sortField, sortOrder]);

  const loadDashboardData = () => {
    if (!currentUser) return;
    setDataLoading(true);

    if (currentUser.role === 'admin') {
      // Load admin stats
      fetch(`${API_BASE}/admin/dashboard`, { headers: getHeaders() })
        .then(res => res.json())
        .then(data => setAdminStats(data))
        .catch(err => console.error(err));

      // Load stores
      fetch(`${API_BASE}/admin/stores?sortBy=${sortField}&sortOrder=${sortOrder}`, { headers: getHeaders() })
        .then(res => res.json())
        .then(data => setAdminStores(data))
        .catch(err => console.error(err));

      // Load users
      fetch(`${API_BASE}/admin/users?sortBy=${sortField}&sortOrder=${sortOrder}`, { headers: getHeaders() })
        .then(res => res.json())
        .then(data => setAdminUsers(data))
        .catch(err => console.error(err))
        .finally(() => setDataLoading(false));

    } else if (currentUser.role === 'user') {
      // Load user stores
      fetch(`${API_BASE}/stores?sortBy=${sortField}&sortOrder=${sortOrder}`, { headers: getHeaders() })
        .then(res => res.json())
        .then(data => setStores(data))
        .catch(err => console.error(err))
        .finally(() => setDataLoading(false));

    } else if (currentUser.role === 'store_owner') {
      // Load store owner stats
      fetch(`${API_BASE}/owner/dashboard?sortBy=${ownerSortField}&sortOrder=${ownerSortOrder}`, { headers: getHeaders() })
        .then(res => res.json())
        .then(data => setOwnerStats(data))
        .catch(err => console.error(err))
        .finally(() => setDataLoading(false));
    }
  };

  // Trigger owner sorting change
  useEffect(() => {
    if (currentUser && currentUser.role === 'store_owner') {
      setDataLoading(true);
      fetch(`${API_BASE}/owner/dashboard?sortBy=${ownerSortField}&sortOrder=${ownerSortOrder}`, { headers: getHeaders() })
        .then(res => res.json())
        .then(data => setOwnerStats(data))
        .catch(err => console.error(err))
        .finally(() => setDataLoading(false));
    }
  }, [ownerSortField, ownerSortOrder]);

  // Auth Operations
  const handleLogin = async (e) => {
    e.preventDefault();
    if (!email || !password) {
      showToast('Please enter both email and password.', 'error');
      return;
    }

    try {
      setAuthLoading(true);
      const res = await fetch(`${API_BASE}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });
      const data = await res.json();
      
      if (!res.ok) {
        throw new Error(data.error || 'Login failed');
      }

      localStorage.setItem('token', data.token);
      setToken(data.token);
      setCurrentUser(data);
      showToast(`Welcome back, ${data.name}!`);
      // Reset fields
      setEmail('');
      setPassword('');
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      setAuthLoading(false);
    }
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    
    // Final check validation
    const nameStrength = name && name.trim().length >= 20 && name.trim().length <= 60;
    const addressStrength = address && address.trim().length > 0 && address.trim().length <= 400;
    const pwdStrength = checkPasswordStrength(password).valid;
    const emailStrength = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

    if (!nameStrength || !addressStrength || !pwdStrength || !emailStrength) {
      showToast('Please correct the validation errors before registering.', 'error');
      return;
    }

    try {
      setAuthLoading(true);
      const res = await fetch(`${API_BASE}/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, password, address })
      });
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Registration failed');
      }

      localStorage.setItem('token', data.token);
      setToken(data.token);
      setCurrentUser(data);
      showToast('Registration successful! Welcome to the platform.');
      // Reset fields
      setName('');
      setEmail('');
      setAddress('');
      setPassword('');
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      setAuthLoading(false);
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    setToken('');
    setCurrentUser(null);
    setAdminUsers([]);
    setAdminStores([]);
    setStores([]);
    setAdminSelectedUser(null);
    showToast('Logged out successfully.');
  };

  // Normal User password change
  const handleUpdatePassword = async (e) => {
    e.preventDefault();
    const strength = checkPasswordStrength(newPassword);
    if (!strength.valid) {
      showToast(strength.message, 'error');
      return;
    }

    try {
      setPasswordLoading(true);
      const res = await fetch(`${API_BASE}/auth/password`, {
        method: 'PUT',
        headers: getHeaders(),
        body: JSON.stringify({ password: newPassword })
      });
      const data = await res.json();

      if (!res.ok) throw new Error(data.error || 'Password update failed.');

      showToast('Password updated successfully!');
      setNewPassword('');
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      setPasswordLoading(false);
    }
  };

  // Submit/Modify Ratings
  const handleRateStore = async (storeId, value, currentRating) => {
    const isUpdate = currentRating !== null && currentRating !== undefined;
    const url = isUpdate ? `${API_BASE}/ratings/${storeId}` : `${API_BASE}/ratings`;
    const method = isUpdate ? 'PUT' : 'POST';

    try {
      const res = await fetch(url, {
        method,
        headers: getHeaders(),
        body: JSON.stringify({ storeId, rating: value })
      });
      const data = await res.json();

      if (!res.ok) throw new Error(data.error || 'Rating action failed.');

      showToast(isUpdate ? 'Rating updated successfully!' : 'Rating submitted successfully!');
      loadDashboardData(); // Refresh store ratings
    } catch (err) {
      showToast(err.message, 'error');
    }
  };

  // Admin Operations: Create User/Store/Admin
  const handleAdminCreateUser = async (e) => {
    e.preventDefault();

    // Verify fields
    const { name, email, password, address, role } = newUserFields;
    const nameStrength = name && name.trim().length >= 20 && name.trim().length <= 60;
    const addressStrength = address && address.trim().length > 0 && address.trim().length <= 400;
    const pwdStrength = checkPasswordStrength(password).valid;
    const emailStrength = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

    if (!nameStrength || !addressStrength || !pwdStrength || !emailStrength) {
      showToast('Please make sure all fields are valid according to rules.', 'error');
      return;
    }

    try {
      const res = await fetch(`${API_BASE}/admin/users`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify(newUserFields)
      });
      const data = await res.json();

      if (!res.ok) throw new Error(data.error || 'Failed to create user.');

      showToast(`User "${data.name}" created successfully as ${data.role}!`);
      setShowAddUserModal(false);
      setNewUserFields({ name: '', email: '', password: '', address: '', role: 'user' });
      setValidationErrors({});
      loadDashboardData(); // Refresh list
    } catch (err) {
      showToast(err.message, 'error');
    }
  };

  // Fetch detailed user stats (including ratings if store owner)
  const viewUserDetails = async (userId) => {
    try {
      const res = await fetch(`${API_BASE}/admin/users/${userId}`, { headers: getHeaders() });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to fetch details');
      setAdminSelectedUser(data);
    } catch (err) {
      showToast(err.message, 'error');
    }
  };

  // Handle Main List Sorting Click
  const requestSort = (field) => {
    let order = 'ASC';
    if (sortField === field && sortOrder === 'ASC') {
      order = 'DESC';
    }
    setSortField(field);
    setSortOrder(order);
  };

  const requestOwnerSort = (field) => {
    let order = 'ASC';
    if (ownerSortField === field && ownerSortOrder === 'ASC') {
      order = 'DESC';
    }
    setOwnerSortField(field);
    setOwnerSortOrder(order);
  };

  // Filter listings client side (or combines with query filters)
  const filteredUsers = useMemo(() => {
    return adminUsers.filter(u => {
      const matchName = !adminFilters.name || u.name.toLowerCase().includes(adminFilters.name.toLowerCase());
      const matchEmail = !adminFilters.email || u.email.toLowerCase().includes(adminFilters.email.toLowerCase());
      const matchAddress = !adminFilters.address || u.address.toLowerCase().includes(adminFilters.address.toLowerCase());
      const matchRole = !adminFilters.role || u.role === adminFilters.role;
      return matchName && matchEmail && matchAddress && matchRole;
    });
  }, [adminUsers, adminFilters]);

  const filteredStores = useMemo(() => {
    return adminStores.filter(s => {
      const matchName = !adminFilters.name || s.name.toLowerCase().includes(adminFilters.name.toLowerCase());
      const matchEmail = !adminFilters.email || s.email.toLowerCase().includes(adminFilters.email.toLowerCase());
      const matchAddress = !adminFilters.address || s.address.toLowerCase().includes(adminFilters.address.toLowerCase());
      return matchName && matchEmail && matchAddress;
    });
  }, [adminStores, adminFilters]);

  // Client side store search for normal user
  const userFilteredStores = useMemo(() => {
    return stores.filter(s => {
      if (!searchQuery) return true;
      const q = searchQuery.toLowerCase();
      return s.name.toLowerCase().includes(q) || s.address.toLowerCase().includes(q);
    });
  }, [stores, searchQuery]);

  return (
    <div className="app-container">
      {/* Toast Notification */}
      {toast && (
        <div className={`toast ${toast.type}`}>
          <Info size={18} />
          <span>{toast.message}</span>
        </div>
      )}

      {/* Loading Overlay for Auth/Init */}
      {authLoading && (
        <div className="modal-overlay">
          <div style={{ textAlign: 'center' }}>
            <Loader className="spin" size={48} color="#6366f1" style={{ animation: 'spin 1s linear infinite' }} />
            <p style={{ marginTop: 16, color: '#94a3b8' }}>Verifying security session...</p>
          </div>
        </div>
      )}

      {/* Unauthenticated View (Login / Register) */}
      {!currentUser && !authLoading && (
        <div className="auth-wrapper">
          <div className="glass-card auth-card">
            <h1 className="auth-title">
              <Sparkles size={28} style={{ display: 'inline', marginRight: 10, color: '#6366f1', verticalAlign: 'middle' }} />
              Store Rating
            </h1>
            <p className="auth-subtitle">
              {isRegister ? 'Create your platform account' : 'Log in to rate registered stores'}
            </p>

            <form onSubmit={isRegister ? handleRegister : handleLogin}>
              {isRegister && (
                <div className="form-group">
                  <label className="form-label">Full Name</label>
                  <input 
                    type="text" 
                    className={`form-input ${validationErrors.name ? 'error' : ''}`}
                    placeholder="Min 20 characters, Max 60 characters" 
                    value={name}
                    onChange={(e) => {
                      setName(e.target.value);
                      validateField('name', e.target.value);
                    }}
                    required
                  />
                  {validationErrors.name && <span className="error-text">{validationErrors.name}</span>}
                  <div className="validation-indicator">
                    <span className={name.trim().length >= 20 && name.trim().length <= 60 ? 'valid' : 'invalid'}>
                      ● Length: {name.trim().length}/60 (Min 20)
                    </span>
                  </div>
                </div>
              )}

              <div className="form-group">
                <label className="form-label">Email Address</label>
                <input 
                  type="email" 
                  className={`form-input ${validationErrors.email ? 'error' : ''}`}
                  placeholder="name@example.com" 
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    if (isRegister) validateField('email', e.target.value);
                  }}
                  required
                />
                {isRegister && validationErrors.email && <span className="error-text">{validationErrors.email}</span>}
              </div>

              {isRegister && (
                <div className="form-group">
                  <label className="form-label">Address</label>
                  <textarea 
                    className={`form-input ${validationErrors.address ? 'error' : ''}`}
                    placeholder="Max 400 characters" 
                    value={address}
                    onChange={(e) => {
                      setAddress(e.target.value);
                      validateField('address', e.target.value);
                    }}
                    rows="3"
                    style={{ resize: 'none' }}
                    required
                  />
                  {validationErrors.address && <span className="error-text">{validationErrors.address}</span>}
                  <div className="validation-indicator">
                    <span className={address.trim().length > 0 && address.trim().length <= 400 ? 'valid' : 'invalid'}>
                      ● Length: {address.trim().length}/400 (Max 400)
                    </span>
                  </div>
                </div>
              )}

              <div className="form-group">
                <label className="form-label">Password</label>
                <input 
                  type="password" 
                  className={`form-input ${isRegister && validationErrors.password ? 'error' : ''}`}
                  placeholder="8-16 characters" 
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    if (isRegister) validateField('password', e.target.value);
                  }}
                  required
                />
                {isRegister && validationErrors.password && <span className="error-text">{validationErrors.password}</span>}
                {isRegister && (
                  <div className="validation-indicator">
                    <span className={password.length >= 8 && password.length <= 16 ? 'valid' : 'invalid'}>
                      ● Length: 8-16 chars (Current: {password.length})
                    </span>
                    <span className={/[A-Z]/.test(password) ? 'valid' : 'invalid'}>
                      ● At least one uppercase letter
                    </span>
                    <span className={/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?`~]/.test(password) ? 'valid' : 'invalid'}>
                      ● At least one special character
                    </span>
                  </div>
                )}
              </div>

              <button 
                type="submit" 
                className="btn btn-primary"
                disabled={isRegister && Object.keys(validationErrors).length > 0}
              >
                {isRegister ? 'Sign Up' : 'Log In'}
              </button>
            </form>

            <div className="auth-toggle">
              {isRegister ? 'Already have an account?' : "Don't have an account?"}
              <span 
                className="auth-toggle-link"
                onClick={() => {
                  setIsRegister(!isRegister);
                  setValidationErrors({});
                }}
              >
                {isRegister ? 'Log In' : 'Sign Up'}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Authenticated Application */}
      {currentUser && (
        <>
          {/* Header/Navbar */}
          <header className="navbar glass-card">
            <div className="brand">
              <Sparkles size={24} />
              Rating Platform
            </div>
            <div className="nav-user-info">
              <span style={{ fontSize: '0.95rem', fontWeight: 500, color: 'white' }}>
                {currentUser.name}
              </span>
              <span className={`role-badge ${currentUser.role}`}>
                {currentUser.role.replace('_', ' ')}
              </span>
              <button onClick={logout} className="btn btn-danger" style={{ padding: '8px 16px', width: 'auto', fontSize: '0.85rem' }}>
                <LogOut size={16} />
                Logout
              </button>
            </div>
          </header>

          {/* 1. SYSTEM ADMINISTRATOR DASHBOARD */}
          {currentUser.role === 'admin' && (
            <div>
              {/* Stat summary cards */}
              <div className="stats-grid">
                <div className="glass-card stat-card">
                  <div className="stat-icon blue">
                    <User size={24} />
                  </div>
                  <div className="stat-info">
                    <span className="stat-value">{adminStats.totalUsers}</span>
                    <span className="stat-label">Total Users</span>
                  </div>
                </div>
                <div className="glass-card stat-card">
                  <div className="stat-icon purple">
                    <Store size={24} />
                  </div>
                  <div className="stat-info">
                    <span className="stat-value">{adminStats.totalStores}</span>
                    <span className="stat-label">Total Stores</span>
                  </div>
                </div>
                <div className="glass-card stat-card">
                  <div className="stat-icon pink">
                    <Star size={24} />
                  </div>
                  <div className="stat-info">
                    <span className="stat-value">{adminStats.totalRatings}</span>
                    <span className="stat-label">Submitted Ratings</span>
                  </div>
                </div>
              </div>

              {/* Action Bar / Title */}
              <div className="dashboard-header">
                <h2 className="dashboard-title">Administrative Dashboard</h2>
                <button onClick={() => setShowAddUserModal(true)} className="btn btn-primary" style={{ width: 'auto' }}>
                  <Plus size={18} />
                  Add New User / Store
                </button>
              </div>

              {/* Filters Panel */}
              <div className="filter-panel">
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label" style={{ fontSize: '0.75rem' }}>Filter by Name</label>
                  <input 
                    type="text" 
                    className="form-input" 
                    placeholder="Search name..."
                    value={adminFilters.name}
                    onChange={(e) => setAdminFilters({ ...adminFilters, name: e.target.value })}
                  />
                </div>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label" style={{ fontSize: '0.75rem' }}>Filter by Email</label>
                  <input 
                    type="text" 
                    className="form-input" 
                    placeholder="Search email..."
                    value={adminFilters.email}
                    onChange={(e) => setAdminFilters({ ...adminFilters, email: e.target.value })}
                  />
                </div>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label" style={{ fontSize: '0.75rem' }}>Filter by Address</label>
                  <input 
                    type="text" 
                    className="form-input" 
                    placeholder="Search address..."
                    value={adminFilters.address}
                    onChange={(e) => setAdminFilters({ ...adminFilters, address: e.target.value })}
                  />
                </div>
                {adminActiveTab === 'users' && (
                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <label className="form-label" style={{ fontSize: '0.75rem' }}>Filter by Role</label>
                    <select 
                      className="form-input"
                      value={adminFilters.role}
                      onChange={(e) => setAdminFilters({ ...adminFilters, role: e.target.value })}
                    >
                      <option value="">All Roles</option>
                      <option value="user">Normal User</option>
                      <option value="admin">Administrator</option>
                    </select>
                  </div>
                )}
                <button 
                  className="btn btn-secondary" 
                  style={{ alignSelf: 'end', height: '42px', padding: '0 16px' }}
                  onClick={() => setAdminFilters({ name: '', email: '', address: '', role: '' })}
                >
                  Clear Filters
                </button>
              </div>

              {/* Tabs */}
              <div className="tabs-container">
                <button 
                  className={`tab-btn ${adminActiveTab === 'stores' ? 'active' : ''}`}
                  onClick={() => setAdminActiveTab('stores')}
                >
                  Registered Stores ({filteredStores.length})
                </button>
                <button 
                  className={`tab-btn ${adminActiveTab === 'users' ? 'active' : ''}`}
                  onClick={() => setAdminActiveTab('users')}
                >
                  Platform Users ({filteredUsers.length})
                </button>
              </div>

              {/* Tables */}
              {dataLoading ? (
                <div style={{ textAlign: 'center', padding: '40px 0' }}>
                  <Loader className="spin" size={32} color="#6366f1" style={{ animation: 'spin 1s linear infinite' }} />
                  <p style={{ marginTop: 12, color: '#94a3b8' }}>Updating listings...</p>
                </div>
              ) : (
                <>
                  {adminActiveTab === 'stores' && (
                    <div className="table-wrapper">
                      <table>
                        <thead>
                          <tr>
                            <th onClick={() => requestSort('name')}>
                              Store Name {sortField === 'name' ? (sortOrder === 'ASC' ? <ChevronUp size={14} style={{ display: 'inline' }} /> : <ChevronDown size={14} style={{ display: 'inline' }} />) : null}
                            </th>
                            <th onClick={() => requestSort('email')}>
                              Email Address {sortField === 'email' ? (sortOrder === 'ASC' ? <ChevronUp size={14} style={{ display: 'inline' }} /> : <ChevronDown size={14} style={{ display: 'inline' }} />) : null}
                            </th>
                            <th onClick={() => requestSort('address')}>
                              Store Address {sortField === 'address' ? (sortOrder === 'ASC' ? <ChevronUp size={14} style={{ display: 'inline' }} /> : <ChevronDown size={14} style={{ display: 'inline' }} />) : null}
                            </th>
                            <th onClick={() => requestSort('rating')}>
                              Avg Rating {sortField === 'rating' ? (sortOrder === 'ASC' ? <ChevronUp size={14} style={{ display: 'inline' }} /> : <ChevronDown size={14} style={{ display: 'inline' }} />) : null}
                            </th>
                            <th>Actions</th>
                          </tr>
                        </thead>
                        <tbody>
                          {filteredStores.map(store => (
                            <tr key={store.id}>
                              <td style={{ fontWeight: 600, color: 'white' }}>{store.name}</td>
                              <td>{store.email}</td>
                              <td style={{ maxWidth: '300px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                {store.address}
                              </td>
                              <td>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                                  <Star size={16} fill={store.rating > 0 ? '#ffb700' : 'none'} color="#ffb700" />
                                  <span>{store.rating > 0 ? parseFloat(store.rating).toFixed(1) : 'No Ratings'}</span>
                                </div>
                              </td>
                              <td>
                                <button onClick={() => viewUserDetails(store.id)} className="btn btn-secondary" style={{ padding: '6px 12px', width: 'auto', fontSize: '0.8rem' }}>
                                  View Details
                                </button>
                              </td>
                            </tr>
                          ))}
                          {filteredStores.length === 0 && (
                            <tr>
                              <td colSpan="5" style={{ textAlign: 'center', color: '#94a3b8', padding: '30px' }}>No stores match your filters.</td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                  )}

                  {adminActiveTab === 'users' && (
                    <div className="table-wrapper">
                      <table>
                        <thead>
                          <tr>
                            <th onClick={() => requestSort('name')}>
                              Name {sortField === 'name' ? (sortOrder === 'ASC' ? <ChevronUp size={14} style={{ display: 'inline' }} /> : <ChevronDown size={14} style={{ display: 'inline' }} />) : null}
                            </th>
                            <th onClick={() => requestSort('email')}>
                              Email Address {sortField === 'email' ? (sortOrder === 'ASC' ? <ChevronUp size={14} style={{ display: 'inline' }} /> : <ChevronDown size={14} style={{ display: 'inline' }} />) : null}
                            </th>
                            <th onClick={() => requestSort('address')}>
                              Address {sortField === 'address' ? (sortOrder === 'ASC' ? <ChevronUp size={14} style={{ display: 'inline' }} /> : <ChevronDown size={14} style={{ display: 'inline' }} />) : null}
                            </th>
                            <th onClick={() => requestSort('role')}>
                              Role {sortField === 'role' ? (sortOrder === 'ASC' ? <ChevronUp size={14} style={{ display: 'inline' }} /> : <ChevronDown size={14} style={{ display: 'inline' }} />) : null}
                            </th>
                            <th>Actions</th>
                          </tr>
                        </thead>
                        <tbody>
                          {filteredUsers.map(user => (
                            <tr key={user.id}>
                              <td style={{ fontWeight: 600, color: 'white' }}>{user.name}</td>
                              <td>{user.email}</td>
                              <td style={{ maxWidth: '300px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                {user.address}
                              </td>
                              <td>
                                <span className={`role-badge ${user.role}`}>
                                  {user.role}
                                </span>
                              </td>
                              <td>
                                <button onClick={() => viewUserDetails(user.id)} className="btn btn-secondary" style={{ padding: '6px 12px', width: 'auto', fontSize: '0.8rem' }}>
                                  View Details
                                </button>
                              </td>
                            </tr>
                          ))}
                          {filteredUsers.length === 0 && (
                            <tr>
                              <td colSpan="5" style={{ textAlign: 'center', color: '#94a3b8', padding: '30px' }}>No users match your filters.</td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                  )}
                </>
              )}

              {/* Admin Create User Modal */}
              {showAddUserModal && (
                <div className="modal-overlay">
                  <div className="glass-card modal-content">
                    <div className="modal-header">
                      <h3 style={{ fontSize: '1.25rem', fontWeight: 700 }}>Add New User, Store, or Admin</h3>
                      <button className="close-btn" onClick={() => {
                        setShowAddUserModal(false);
                        setValidationErrors({});
                      }}>
                        <X size={20} />
                      </button>
                    </div>

                    <form onSubmit={handleAdminCreateUser}>
                      <div className="form-group">
                        <label className="form-label">Role Type</label>
                        <select 
                          className="form-input"
                          value={newUserFields.role}
                          onChange={(e) => setNewUserFields({ ...newUserFields, role: e.target.value })}
                        >
                          <option value="user">Normal User</option>
                          <option value="store_owner">Store Owner (Store)</option>
                          <option value="admin">System Administrator</option>
                        </select>
                      </div>

                      <div className="form-group">
                        <label className="form-label">
                          {newUserFields.role === 'store_owner' ? 'Store Name' : 'Full Name'}
                        </label>
                        <input 
                          type="text" 
                          className={`form-input ${validationErrors.name ? 'error' : ''}`}
                          placeholder="Min 20 characters, Max 60 characters"
                          value={newUserFields.name}
                          onChange={(e) => {
                            setNewUserFields({ ...newUserFields, name: e.target.value });
                            validateField('name', e.target.value);
                          }}
                          required
                        />
                        {validationErrors.name && <span className="error-text">{validationErrors.name}</span>}
                        <div className="validation-indicator">
                          <span className={newUserFields.name.trim().length >= 20 && newUserFields.name.trim().length <= 60 ? 'valid' : 'invalid'}>
                            ● Length: {newUserFields.name.trim().length}/60 (Min 20)
                          </span>
                        </div>
                      </div>

                      <div className="form-group">
                        <label className="form-label">Email Address</label>
                        <input 
                          type="email" 
                          className={`form-input ${validationErrors.email ? 'error' : ''}`}
                          placeholder="name@example.com"
                          value={newUserFields.email}
                          onChange={(e) => {
                            setNewUserFields({ ...newUserFields, email: e.target.value });
                            validateField('email', e.target.value);
                          }}
                          required
                        />
                        {validationErrors.email && <span className="error-text">{validationErrors.email}</span>}
                      </div>

                      <div className="form-group">
                        <label className="form-label">Password</label>
                        <input 
                          type="password" 
                          className={`form-input ${validationErrors.password ? 'error' : ''}`}
                          placeholder="8-16 characters"
                          value={newUserFields.password}
                          onChange={(e) => {
                            setNewUserFields({ ...newUserFields, password: e.target.value });
                            validateField('password', e.target.value);
                          }}
                          required
                        />
                        {validationErrors.password && <span className="error-text">{validationErrors.password}</span>}
                        <div className="validation-indicator">
                          <span className={newUserFields.password.length >= 8 && newUserFields.password.length <= 16 ? 'valid' : 'invalid'}>
                            ● Length: 8-16 chars (Current: {newUserFields.password.length})
                          </span>
                          <span className={/[A-Z]/.test(newUserFields.password) ? 'valid' : 'invalid'}>
                            ● At least one uppercase letter
                          </span>
                          <span className={/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?`~]/.test(newUserFields.password) ? 'valid' : 'invalid'}>
                            ● At least one special character
                          </span>
                        </div>
                      </div>

                      <div className="form-group">
                        <label className="form-label">
                          {newUserFields.role === 'store_owner' ? 'Store Address' : 'Address'}
                        </label>
                        <textarea 
                          className={`form-input ${validationErrors.address ? 'error' : ''}`}
                          placeholder="Max 400 characters"
                          value={newUserFields.address}
                          onChange={(e) => {
                            setNewUserFields({ ...newUserFields, address: e.target.value });
                            validateField('address', e.target.value);
                          }}
                          rows="3"
                          style={{ resize: 'none' }}
                          required
                        />
                        {validationErrors.address && <span className="error-text">{validationErrors.address}</span>}
                        <div className="validation-indicator">
                          <span className={newUserFields.address.trim().length > 0 && newUserFields.address.trim().length <= 400 ? 'valid' : 'invalid'}>
                            ● Length: {newUserFields.address.trim().length}/400 (Max 400)
                          </span>
                        </div>
                      </div>

                      <button 
                        type="submit" 
                        className="btn btn-primary"
                        disabled={Object.keys(validationErrors).length > 0}
                      >
                        Create Account
                      </button>
                    </form>
                  </div>
                </div>
              )}

              {/* Admin Selection Details Drawer */}
              {adminSelectedUser && (
                <div className="modal-overlay" onClick={() => setAdminSelectedUser(null)}>
                  <div className="drawer" onClick={(e) => e.stopPropagation()}>
                    <div className="drawer-header">
                      <h3 style={{ fontSize: '1.2rem', fontWeight: 700 }}>
                        {adminSelectedUser.role === 'store_owner' ? 'Store Details' : 'User Details'}
                      </h3>
                      <button className="close-btn" onClick={() => setAdminSelectedUser(null)}>
                        <X size={20} />
                      </button>
                    </div>
                    <div className="drawer-body">
                      <div className="drawer-section">
                        <div className="drawer-label">Name</div>
                        <div className="drawer-value">{adminSelectedUser.name}</div>
                      </div>
                      <div className="drawer-section">
                        <div className="drawer-label">Email</div>
                        <div className="drawer-value">{adminSelectedUser.email}</div>
                      </div>
                      <div className="drawer-section">
                        <div className="drawer-label">Role</div>
                        <div className="drawer-value">
                          <span className={`role-badge ${adminSelectedUser.role}`}>
                            {adminSelectedUser.role}
                          </span>
                        </div>
                      </div>
                      <div className="drawer-section">
                        <div className="drawer-label">Address</div>
                        <div className="drawer-value">{adminSelectedUser.address}</div>
                      </div>

                      {adminSelectedUser.role === 'store_owner' && (
                        <div className="drawer-section" style={{ borderTop: '1px solid rgba(255,255,255,0.08)', paddingTop: '20px' }}>
                          <div className="drawer-label">Overall Avg Rating</div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8, margin: '8px 0 16px 0' }}>
                            <Star size={24} fill={adminSelectedUser.rating > 0 ? '#ffb700' : 'none'} color="#ffb700" />
                            <span style={{ fontSize: '1.75rem', fontWeight: 800 }}>
                              {adminSelectedUser.rating > 0 ? adminSelectedUser.rating.toFixed(2) : 'No Ratings'}
                            </span>
                          </div>

                          <div className="drawer-label">Rating Submissions ({adminSelectedUser.submittedRatings?.length || 0})</div>
                          <div className="ratings-history-list">
                            {adminSelectedUser.submittedRatings?.map(r => (
                              <div className="rating-history-item" key={r.id}>
                                <div className="rating-item-header">
                                  <span className="rating-item-user">{r.user?.name}</span>
                                  <div className="stars-display">
                                    {[...Array(5)].map((_, i) => (
                                      <Star key={i} size={12} fill={i < r.rating ? '#ffb700' : 'none'} color="#ffb700" />
                                    ))}
                                  </div>
                                </div>
                                <div style={{ fontSize: '0.85rem', color: '#94a3b8', display: 'flex', justifyContent: 'space-between', marginTop: 4 }}>
                                  <span>{r.user?.email}</span>
                                  <span className="rating-item-date">{new Date(r.createdAt).toLocaleDateString()}</span>
                                </div>
                              </div>
                            ))}
                            {(!adminSelectedUser.submittedRatings || adminSelectedUser.submittedRatings.length === 0) && (
                              <p style={{ color: '#94a3b8', fontSize: '0.9rem', fontStyle: 'italic', textAlign: 'center', marginTop: 12 }}>
                                No reviews submitted yet.
                              </p>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* 2. NORMAL USER DASHBOARD */}
          {currentUser.role === 'user' && (
            <div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '32px', alignItems: 'start' }}>
                
                {/* Left Panel: Store Search & Rating List */}
                <div>
                  <div className="dashboard-header">
                    <h2 className="dashboard-title">Registered Stores</h2>
                    
                    {/* Search Container */}
                    <div className="search-container">
                      <Search className="search-icon" size={18} />
                      <input 
                        type="text" 
                        className="search-input" 
                        placeholder="Search stores by Name or Address..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                      />
                    </div>
                  </div>

                  {/* List Sorting Options */}
                  <div style={{ display: 'flex', gap: '16px', marginBottom: '24px', alignItems: 'center', flexWrap: 'wrap' }}>
                    <span style={{ color: '#94a3b8', fontSize: '0.9rem', fontWeight: 600 }}>Sort Stores By:</span>
                    <button 
                      className={`btn btn-secondary ${sortField === 'name' ? 'active' : ''}`}
                      onClick={() => requestSort('name')}
                      style={{ width: 'auto', padding: '6px 16px', fontSize: '0.85rem' }}
                    >
                      Store Name {sortField === 'name' ? (sortOrder === 'ASC' ? '▲' : '▼') : ''}
                    </button>
                    <button 
                      className={`btn btn-secondary ${sortField === 'address' ? 'active' : ''}`}
                      onClick={() => requestSort('address')}
                      style={{ width: 'auto', padding: '6px 16px', fontSize: '0.85rem' }}
                    >
                      Store Address {sortField === 'address' ? (sortOrder === 'ASC' ? '▲' : '▼') : ''}
                    </button>
                    <button 
                      className={`btn btn-secondary ${sortField === 'rating' ? 'active' : ''}`}
                      onClick={() => requestSort('rating')}
                      style={{ width: 'auto', padding: '6px 16px', fontSize: '0.85rem' }}
                    >
                      Overall Rating {sortField === 'rating' ? (sortOrder === 'ASC' ? '▲' : '▼') : ''}
                    </button>
                  </div>

                  {dataLoading ? (
                    <div style={{ textAlign: 'center', padding: '40px 0' }}>
                      <Loader className="spin" size={32} color="#6366f1" style={{ animation: 'spin 1s linear infinite' }} />
                      <p style={{ marginTop: 12, color: '#94a3b8' }}>Updating store listings...</p>
                    </div>
                  ) : (
                    <div className="stores-grid">
                      {userFilteredStores.map(store => {
                        const hasRated = store.userRating !== null && store.userRating !== undefined;
                        return (
                          <div className="glass-card store-card" key={store.id}>
                            <div className="store-card-header">
                              <h3 className="store-title">{store.name}</h3>
                              <div style={{ display: 'flex', alignItems: 'center', gap: 6, margin: '6px 0' }}>
                                <Star size={16} fill={store.rating > 0 ? '#ffb700' : 'none'} color="#ffb700" />
                                <span style={{ fontSize: '0.9rem', fontWeight: 600, color: 'white' }}>
                                  {store.rating > 0 ? parseFloat(store.rating).toFixed(1) : 'No Ratings'}
                                </span>
                              </div>
                            </div>
                            
                            <p className="store-address">
                              <MapPin size={14} style={{ display: 'inline', marginRight: 6, verticalAlign: 'middle' }} />
                              {store.address}
                            </p>

                            <div className="rating-section">
                              <div className="rating-row">
                                <span className="rating-label">
                                  {hasRated ? "Your rating:" : "Not rated yet"}
                                </span>
                                {hasRated && (
                                  <div className="stars-display">
                                    {[...Array(5)].map((_, i) => (
                                      <Star key={i} size={14} fill={i < store.userRating ? '#ffb700' : 'none'} color="#ffb700" />
                                    ))}
                                  </div>
                                )}
                              </div>

                              <div className="rating-interactive-container">
                                <span style={{ fontSize: '0.8rem', color: '#94a3b8', fontWeight: 500 }}>
                                  {hasRated ? 'Modify your rating:' : 'Select rating (1-5 stars):'}
                                </span>
                                <div style={{ display: 'flex', gap: 10, margin: '4px 0' }}>
                                  {[1, 2, 3, 4, 5].map(val => (
                                    <Star 
                                      key={val} 
                                      className="rating-star-interactive"
                                      size={22}
                                      fill={val <= (store.userRating || 0) ? '#ffb700' : 'none'}
                                      color="#ffb700"
                                      onClick={() => handleRateStore(store.id, val, store.userRating)}
                                    />
                                  ))}
                                </div>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                      {userFilteredStores.length === 0 && (
                        <div style={{ textAlign: 'center', gridColumn: '1 / -1', color: '#94a3b8', padding: '40px' }}>
                          No stores registered match your search parameters.
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Bottom Panel: Update Password */}
                <div className="glass-card password-card" style={{ marginTop: '24px' }}>
                  <h3 style={{ fontSize: '1.2rem', fontWeight: 700, marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <KeyRound size={20} color="#6366f1" />
                    Security Settings
                  </h3>
                  <form onSubmit={handleUpdatePassword}>
                    <div className="form-group">
                      <label className="form-label">Update Account Password</label>
                      <input 
                        type="password" 
                        className={`form-input ${validationErrors.password ? 'error' : ''}`}
                        placeholder="New Password (8-16 characters)"
                        value={newPassword}
                        onChange={(e) => {
                          setNewPassword(e.target.value);
                          validateField('password', e.target.value);
                        }}
                        required
                      />
                      {validationErrors.password && <span className="error-text">{validationErrors.password}</span>}
                      <div className="validation-indicator">
                        <span className={newPassword.length >= 8 && newPassword.length <= 16 ? 'valid' : 'invalid'}>
                          ● Length: 8-16 chars (Current: {newPassword.length})
                        </span>
                        <span className={/[A-Z]/.test(newPassword) ? 'valid' : 'invalid'}>
                          ● At least one uppercase letter
                        </span>
                        <span className={/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?`~]/.test(newPassword) ? 'valid' : 'invalid'}>
                          ● At least one special character
                        </span>
                      </div>
                    </div>
                    <button 
                      type="submit" 
                      className="btn btn-secondary" 
                      style={{ width: 'auto', padding: '10px 24px' }}
                      disabled={passwordLoading || !checkPasswordStrength(newPassword).valid}
                    >
                      {passwordLoading ? 'Updating...' : 'Update Password'}
                    </button>
                  </form>
                </div>
              </div>
            </div>
          )}

          {/* 3. STORE OWNER DASHBOARD */}
          {currentUser.role === 'store_owner' && (
            <div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '32px' }}>
                <div>
                  <h2 className="dashboard-title" style={{ marginBottom: '24px' }}>Store Owner Performance Dashboard</h2>
                  
                  {/* Performance highlight panel */}
                  <div className="stats-grid">
                    <div className="glass-card stat-card" style={{ gridColumn: 'span 2' }}>
                      <div className="stat-icon purple" style={{ width: '64px', height: '64px' }}>
                        <Star size={32} fill="#ffb700" color="#ffb700" />
                      </div>
                      <div className="stat-info">
                        <span className="stat-value" style={{ fontSize: '2.5rem' }}>
                          {ownerStats.averageRating > 0 ? ownerStats.averageRating.toFixed(2) : 'No Ratings'}
                        </span>
                        <span className="stat-label">Store Average Rating</span>
                      </div>
                    </div>
                    <div className="glass-card stat-card">
                      <div className="stat-icon blue">
                        <User size={24} />
                      </div>
                      <div className="stat-info">
                        <span className="stat-value">{ownerStats.ratings?.length || 0}</span>
                        <span className="stat-label">Total Submissions</span>
                      </div>
                    </div>
                  </div>

                  <h3 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '16px' }}>User Submissions Logs</h3>
                  
                  {/* Owner Listings Table */}
                  {dataLoading ? (
                    <div style={{ textAlign: 'center', padding: '40px 0' }}>
                      <Loader className="spin" size={32} color="#6366f1" style={{ animation: 'spin 1s linear infinite' }} />
                      <p style={{ marginTop: 12, color: '#94a3b8' }}>Loading ratings log...</p>
                    </div>
                  ) : (
                    <div className="table-wrapper">
                      <table>
                        <thead>
                          <tr>
                            <th onClick={() => requestOwnerSort('name')}>
                              User Name {ownerSortField === 'name' ? (ownerSortOrder === 'ASC' ? '▲' : '▼') : ''}
                            </th>
                            <th onClick={() => requestOwnerSort('email')}>
                              Email Address {ownerSortField === 'email' ? (ownerSortOrder === 'ASC' ? '▲' : '▼') : ''}
                            </th>
                            <th>Address</th>
                            <th onClick={() => requestOwnerSort('rating')}>
                              Rating {ownerSortField === 'rating' ? (ownerSortOrder === 'ASC' ? '▲' : '▼') : ''}
                            </th>
                            <th onClick={() => requestOwnerSort('date')}>
                              Submitted Date {ownerSortField === 'date' ? (ownerSortOrder === 'ASC' ? '▲' : '▼') : ''}
                            </th>
                          </tr>
                        </thead>
                        <tbody>
                          {ownerStats.ratings?.map(r => (
                            <tr key={r.id}>
                              <td style={{ fontWeight: 600, color: 'white' }}>{r.user?.name}</td>
                              <td>{r.user?.email}</td>
                              <td style={{ maxWidth: '250px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{r.user?.address}</td>
                              <td>
                                <div className="stars-display">
                                  {[...Array(5)].map((_, i) => (
                                    <Star key={i} size={14} fill={i < r.rating ? '#ffb700' : 'none'} color="#ffb700" />
                                  ))}
                                </div>
                              </td>
                              <td>{new Date(r.createdAt).toLocaleDateString()}</td>
                            </tr>
                          ))}
                          {(!ownerStats.ratings || ownerStats.ratings.length === 0) && (
                            <tr>
                              <td colSpan="5" style={{ textAlign: 'center', color: '#94a3b8', padding: '30px' }}>No ratings have been submitted for your store yet.</td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>

                {/* Password Change Form */}
                <div className="glass-card password-card">
                  <h3 style={{ fontSize: '1.2rem', fontWeight: 700, marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <KeyRound size={20} color="#6366f1" />
                    Security Settings
                  </h3>
                  <form onSubmit={handleUpdatePassword}>
                    <div className="form-group">
                      <label className="form-label">Update Account Password</label>
                      <input 
                        type="password" 
                        className={`form-input ${validationErrors.password ? 'error' : ''}`}
                        placeholder="New Password (8-16 characters)"
                        value={newPassword}
                        onChange={(e) => {
                          setNewPassword(e.target.value);
                          validateField('password', e.target.value);
                        }}
                        required
                      />
                      {validationErrors.password && <span className="error-text">{validationErrors.password}</span>}
                      <div className="validation-indicator">
                        <span className={newPassword.length >= 8 && newPassword.length <= 16 ? 'valid' : 'invalid'}>
                          ● Length: 8-16 chars (Current: {newPassword.length})
                        </span>
                        <span className={/[A-Z]/.test(newPassword) ? 'valid' : 'invalid'}>
                          ● At least one uppercase letter
                        </span>
                        <span className={/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?`~]/.test(newPassword) ? 'valid' : 'invalid'}>
                          ● At least one special character
                        </span>
                      </div>
                    </div>
                    <button 
                      type="submit" 
                      className="btn btn-secondary" 
                      style={{ width: 'auto', padding: '10px 24px' }}
                      disabled={passwordLoading || !checkPasswordStrength(newPassword).valid}
                    >
                      {passwordLoading ? 'Updating...' : 'Update Password'}
                    </button>
                  </form>
                </div>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
