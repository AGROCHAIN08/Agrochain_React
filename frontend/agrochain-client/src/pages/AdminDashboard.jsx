import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';

import { useAuth } from '../hooks/useAuth';
import api from '../services/api';
import '../assets/css/admin.css';

const formatDateTime = (value) => {
  if (!value) return 'Not available';
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? 'Not available' : date.toLocaleString();
};

const formatDate = (value) => {
  if (!value) return 'Not available';
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? 'Not available' : date.toLocaleDateString();
};

const AdminNavbar = ({ activeSection, onNavigate, onSignout }) => {
  const tabClass = (tab) => `nav-btn ${activeSection === tab ? 'active' : ''}`;

  return (
    <nav className="navbar">
      <div className="nav-left">
        <img
          src="https://ik.imagekit.io/a2wpi1kd9/imgToUrl/image-to-url_ThyEiMVLh"
          className="logo"
          alt="AgroChain Logo"
        />
        <span className="brand-name">
          Agro<span className="chain-text">Chain</span>
        </span>
      </div>

      <div className="nav-center">
        <button className={tabClass('analytics')} onClick={() => onNavigate('analytics')}>
          System Analytics
        </button>
        <button className={tabClass('core')} onClick={() => onNavigate('core')}>
          User Management
        </button>
        <button className={tabClass('activity')} onClick={() => onNavigate('activity')}>
          User Activity
        </button>
        <button className={tabClass('representatives')} onClick={() => onNavigate('representatives')}>
          Representatives
        </button>
      </div>

      <div className="nav-right">
        <span className="admin-badge">Admin</span>
        <button className="logout-btn" onClick={onSignout}>
          Sign Out
        </button>
      </div>
    </nav>
  );
};

const AdminDashboard = () => {
  const { logout } = useAuth();
  const navigate = useNavigate();

  const [activeSection, setActiveSection] = useState('analytics');
  const [users, setUsers] = useState([]);
  const [stats, setStats] = useState(null);
  const [representatives, setRepresentatives] = useState([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [repEmail, setRepEmail] = useState('');
  const [repNote, setRepNote] = useState('');
  const [repLoading, setRepLoading] = useState(false);
  const [repStatus, setRepStatus] = useState({ msg: '', type: '' });

  const [userSearch, setUserSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');

  const [selectedActivityUserEmail, setSelectedActivityUserEmail] = useState('');
  const [activityTimeline, setActivityTimeline] = useState([]);
  const [activityMeta, setActivityMeta] = useState(null);
  const [activityLoading, setActivityLoading] = useState(false);
  const [activityError, setActivityError] = useState('');
  const [activityUserSearch, setActivityUserSearch] = useState('');
  const [activityUserRoleFilter, setActivityUserRoleFilter] = useState('all');
  const [activityTypeFilter, setActivityTypeFilter] = useState('all');
  const [activityTextFilter, setActivityTextFilter] = useState('');
  const [activityFromDate, setActivityFromDate] = useState('');
  const [activityToDate, setActivityToDate] = useState('');

  const loadAllData = useCallback(async (showLoading = false) => {
    if (showLoading) setLoading(true);
    try {
      const [usersRes, repsRes, statsRes] = await Promise.all([
        api.get('/admin/users'),
        api.get('/admin/representatives'),
        api.get('/admin/stats'),
      ]);

      setUsers(usersRes.data || []);
      setRepresentatives(repsRes.data || []);
      setStats(statsRes.data || null);
      setError('');
    } catch (err) {
      if (showLoading) {
        setError(err.response?.data?.msg || err.message || 'Failed to load admin data');
      }
    } finally {
      if (showLoading) setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadAllData(true);

    const intervalId = setInterval(() => {
      loadAllData(false);
    }, 10000);

    return () => clearInterval(intervalId);
  }, [loadAllData]);

  const filteredUsers = useMemo(() => {
    return users.filter((user) => {
      const search = userSearch.toLowerCase();
      const matchesSearch =
        !userSearch ||
        `${user.firstName || ''} ${user.lastName || ''}`.toLowerCase().includes(search) ||
        user.email?.toLowerCase().includes(search);
      const matchesRole = roleFilter === 'all' || user.role === roleFilter;
      return matchesSearch && matchesRole;
    });
  }, [users, userSearch, roleFilter]);

  const activityUsers = useMemo(() => {
    return users.filter((user) => {
      const search = activityUserSearch.toLowerCase();
      const matchesSearch =
        !activityUserSearch ||
        `${user.firstName || ''} ${user.lastName || ''}`.toLowerCase().includes(search) ||
        user.email?.toLowerCase().includes(search);
      const matchesRole = activityUserRoleFilter === 'all' || user.role === activityUserRoleFilter;
      return matchesSearch && matchesRole;
    });
  }, [users, activityUserSearch, activityUserRoleFilter]);

  useEffect(() => {
    if (!activityUsers.length) {
      setSelectedActivityUserEmail('');
      return;
    }

    const selectedStillVisible = activityUsers.some((user) => user.email === selectedActivityUserEmail);
    if (!selectedActivityUserEmail || !selectedStillVisible) {
      setSelectedActivityUserEmail(activityUsers[0].email);
    }
  }, [activityUsers, selectedActivityUserEmail]);

  useEffect(() => {
    if (activeSection !== 'activity' || !selectedActivityUserEmail) return;

    let cancelled = false;

    const loadActivity = async () => {
      setActivityLoading(true);
      setActivityError('');
      try {
        const res = await api.get(`/admin/user-activity/${encodeURIComponent(selectedActivityUserEmail)}`, {
          params: {
            type: activityTypeFilter,
            q: activityTextFilter,
            from: activityFromDate,
            to: activityToDate,
          },
        });

        if (!cancelled) {
          setActivityMeta(res.data || null);
          setActivityTimeline(res.data?.activities || []);
        }
      } catch (err) {
        if (!cancelled) {
          setActivityMeta(null);
          setActivityTimeline([]);
          setActivityError(err.response?.data?.msg || 'Failed to load user activity');
        }
      } finally {
        if (!cancelled) setActivityLoading(false);
      }
    };

    loadActivity();

    return () => {
      cancelled = true;
    };
  }, [
    activeSection,
    selectedActivityUserEmail,
    activityTypeFilter,
    activityTextFilter,
    activityFromDate,
    activityToDate,
  ]);

  const selectedActivityUser = useMemo(
    () => users.find((user) => user.email === selectedActivityUserEmail) || null,
    [users, selectedActivityUserEmail]
  );

  const activityTypeOptions = activityMeta?.availableTypes || [];

  const handleSignout = () => {
    if (window.confirm('Are you sure you want to sign out?')) {
      logout();
      navigate('/login');
    }
  };

  const handleDeleteUser = async (userId, email) => {
    if (!window.confirm(`Delete user ${email}? This cannot be undone.`)) return;
    try {
      await api.delete(`/admin/users/${userId}`);
      setUsers((prev) => prev.filter((user) => user._id !== userId));
    } catch (err) {
      alert(err.response?.data?.msg || 'Failed to delete user');
    }
  };

  const handleToggleUserActive = async (userId) => {
    try {
      const res = await api.put(`/admin/deactivate/${userId}`);
      setUsers((prev) =>
        prev.map((user) => (user._id === userId ? { ...user, isActive: res.data.isActive } : user))
      );
    } catch (err) {
      alert(err.response?.data?.msg || 'Failed to update user status');
    }
  };

  const handleAddRepresentative = async () => {
    if (!repEmail.trim()) return;

    setRepLoading(true);
    setRepStatus({ msg: '', type: '' });
    try {
      const res = await api.post('/admin/representatives', {
        email: repEmail.trim(),
        note: repNote.trim(),
      });
      setRepresentatives((prev) => [res.data.representative, ...prev]);
      setRepEmail('');
      setRepNote('');
      setRepStatus({ msg: 'Representative added successfully.', type: 'success' });
    } catch (err) {
      setRepStatus({
        msg: err.response?.data?.msg || 'Failed to add representative',
        type: 'error',
      });
    } finally {
      setRepLoading(false);
    }
  };

  const handleDeleteRepresentative = async (repId, email) => {
    if (!window.confirm(`Remove ${email} as a representative?`)) return;
    try {
      await api.delete(`/admin/representatives/${repId}`);
      setRepresentatives((prev) => prev.filter((rep) => rep._id !== repId));
    } catch (err) {
      alert(err.response?.data?.msg || 'Failed to remove representative');
    }
  };

  return (
    <>
      <AdminNavbar
        activeSection={activeSection}
        onNavigate={setActiveSection}
        onSignout={handleSignout}
      />

      <main className="main-container" style={{ display: 'block' }}>
        {loading && <p className="loading-text">Synchronizing data...</p>}
        {error && <p style={{ color: 'red', marginBottom: '10px' }}>{error}</p>}

        {activeSection === 'analytics' && stats && (
          <div className="admin-analytics-container" style={{ width: '100%', marginBottom: '40px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '25px' }}>
              <h2>Live Platform Performance</h2>
              <button className="refresh-btn" onClick={() => loadAllData(true)}>Refresh Stats</button>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '20px', width: '100%' }}>
              <div className="analytics-card" style={{ borderTop: '4px solid #10b981', padding: '25px', background: '#fff', borderRadius: '12px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)' }}>
                <p style={{ color: '#64748b', fontSize: '14px', fontWeight: '700', textTransform: 'uppercase', marginBottom: '10px' }}>Platform Revenue</p>
                <h1 style={{ margin: '0', color: '#065f46', fontSize: '32px' }}>Rs {(stats.totalAmount || 0).toLocaleString('en-IN')}</h1>
                <p style={{ fontSize: '12px', color: '#94a3b8', marginTop: '10px' }}>Total transaction value</p>
              </div>

              <div className="analytics-card" style={{ borderTop: '4px solid #3b82f6', padding: '25px', background: '#fff', borderRadius: '12px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)' }}>
                <p style={{ color: '#64748b', fontSize: '14px', fontWeight: '700', textTransform: 'uppercase', marginBottom: '10px' }}>Order Volume</p>
                <h1 style={{ margin: '0', color: '#1e40af', fontSize: '32px' }}>{stats.orders || 0}</h1>
                <div style={{ marginTop: '10px', display: 'flex', justifyContent: 'space-between', fontSize: '13px', gap: '12px', flexWrap: 'wrap' }}>
                  <span style={{ color: '#059669' }}>{stats.completedOrders || 0} Completed</span>
                  <span style={{ color: '#d97706' }}>{stats.pendingOrders || 0} Active</span>
                </div>
              </div>

              <div className="analytics-card" style={{ borderTop: '4px solid #f59e0b', padding: '25px', background: '#fff', borderRadius: '12px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)' }}>
                <p style={{ color: '#64748b', fontSize: '14px', fontWeight: '700', textTransform: 'uppercase', marginBottom: '10px' }}>User Ecosystem</p>
                <h1 style={{ margin: '0', color: '#b45309', fontSize: '32px' }}>{stats.activeUsers || 0}</h1>
                <div style={{ marginTop: '10px', display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '5px', fontSize: '11px', textAlign: 'center' }}>
                  <div style={{ background: '#fef3c7', padding: '4px', borderRadius: '4px' }}>Farmers {stats.farmers || 0}</div>
                  <div style={{ background: '#dbeafe', padding: '4px', borderRadius: '4px' }}>Dealers {stats.dealers || 0}</div>
                  <div style={{ background: '#d1fae5', padding: '4px', borderRadius: '4px' }}>Retailers {stats.retailers || 0}</div>
                </div>
              </div>

              <div className="analytics-card" style={{ borderTop: '4px solid #8b5cf6', padding: '25px', background: '#fff', borderRadius: '12px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)' }}>
                <p style={{ color: '#64748b', fontSize: '14px', fontWeight: '700', textTransform: 'uppercase', marginBottom: '10px' }}>Market Listings</p>
                <h1 style={{ margin: '0', color: '#5b21b6', fontSize: '32px' }}>{stats.products || 0}</h1>
                <p style={{ fontSize: '12px', color: '#94a3b8', marginTop: '10px' }}>Verified products live</p>
              </div>
            </div>

            <div style={{ marginTop: '30px' }}>
              <h3 style={{ color: '#1e293b', fontWeight: '700', marginBottom: '16px', fontSize: '16px' }}>
                Financial &amp; Order Insights
              </h3>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px' }}>
                <div className="analytics-card" style={{ padding: '20px', background: '#fff', borderRadius: '12px', boxShadow: '0 2px 8px rgba(0,0,0,0.08)', borderLeft: '4px solid #10b981' }}>
                  <p style={{ margin: 0, fontSize: '12px', fontWeight: '700', color: '#64748b', textTransform: 'uppercase', marginBottom: '10px' }}>Avg Order Value</p>
                  <h2 style={{ margin: 0, color: '#065f46', fontSize: '26px' }}>Rs {(stats.avgOrderValue || 0).toLocaleString('en-IN')}</h2>
                  <p style={{ margin: '6px 0 0', fontSize: '11px', color: '#94a3b8' }}>Per transaction average</p>
                </div>

                <div className="analytics-card" style={{ padding: '20px', background: '#fff', borderRadius: '12px', boxShadow: '0 2px 8px rgba(0,0,0,0.08)', borderLeft: '4px solid #3b82f6' }}>
                  <p style={{ margin: 0, fontSize: '12px', fontWeight: '700', color: '#64748b', textTransform: 'uppercase', marginBottom: '10px' }}>Bid Acceptance Rate</p>
                  <h2 style={{ margin: 0, color: '#1e40af', fontSize: '26px' }}>{stats.bidAcceptanceRate || 0}%</h2>
                  <div style={{ marginTop: '8px', background: '#e2e8f0', borderRadius: '99px', height: '6px', overflow: 'hidden' }}>
                    <div style={{ width: `${stats.bidAcceptanceRate || 0}%`, background: '#3b82f6', height: '100%', borderRadius: '99px' }} />
                  </div>
                  <p style={{ margin: '6px 0 0', fontSize: '11px', color: '#94a3b8' }}>{stats.bidAccepted || 0} accepted · {stats.bidRejected || 0} rejected</p>
                </div>

                <div className="analytics-card" style={{ padding: '20px', background: '#fff', borderRadius: '12px', boxShadow: '0 2px 8px rgba(0,0,0,0.08)', borderLeft: '4px solid #f59e0b' }}>
                  <p style={{ margin: 0, fontSize: '12px', fontWeight: '700', color: '#64748b', textTransform: 'uppercase', marginBottom: '10px' }}>Pending Payment</p>
                  <h2 style={{ margin: 0, color: '#b45309', fontSize: '26px' }}>Rs {(stats.paymentPendingValue || 0).toLocaleString('en-IN')}</h2>
                  <p style={{ margin: '6px 0 0', fontSize: '11px', color: '#94a3b8' }}>Awaiting payment clearance</p>
                </div>

                <div className="analytics-card" style={{ padding: '20px', background: '#fff', borderRadius: '12px', boxShadow: '0 2px 8px rgba(0,0,0,0.08)', borderLeft: '4px solid #06b6d4' }}>
                  <p style={{ margin: 0, fontSize: '12px', fontWeight: '700', color: '#64748b', textTransform: 'uppercase', marginBottom: '10px' }}>In Transit</p>
                  <h2 style={{ margin: 0, color: '#0e7490', fontSize: '26px' }}>{stats.inTransitOrders || 0}</h2>
                  <p style={{ margin: '6px 0 0', fontSize: '11px', color: '#94a3b8' }}>Active deliveries right now</p>
                </div>

                <div className="analytics-card" style={{ padding: '20px', background: '#fff', borderRadius: '12px', boxShadow: '0 2px 8px rgba(0,0,0,0.08)', borderLeft: '4px solid #ef4444' }}>
                  <p style={{ margin: 0, fontSize: '12px', fontWeight: '700', color: '#64748b', textTransform: 'uppercase', marginBottom: '10px' }}>Cancellation Rate</p>
                  <h2 style={{ margin: 0, color: '#b91c1c', fontSize: '26px' }}>{stats.cancelledRate || 0}%</h2>
                  <div style={{ marginTop: '8px', background: '#e2e8f0', borderRadius: '99px', height: '6px', overflow: 'hidden' }}>
                    <div style={{ width: `${stats.cancelledRate || 0}%`, background: '#ef4444', height: '100%', borderRadius: '99px' }} />
                  </div>
                  <p style={{ margin: '6px 0 0', fontSize: '11px', color: '#94a3b8' }}>{stats.cancelledOrders || 0} cancelled orders total</p>
                </div>
              </div>
            </div>

            <div style={{ marginTop: '30px' }}>
              <h3 style={{ color: '#1e293b', fontWeight: '700', marginBottom: '16px', fontSize: '16px' }}>
                User Growth &amp; Health
              </h3>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px' }}>
                <div className="analytics-card" style={{ padding: '20px', background: '#fff', borderRadius: '12px', boxShadow: '0 2px 8px rgba(0,0,0,0.08)', borderLeft: '4px solid #10b981' }}>
                  <p style={{ margin: 0, fontSize: '12px', fontWeight: '700', color: '#64748b', textTransform: 'uppercase', marginBottom: '10px' }}>New Today</p>
                  <h2 style={{ margin: 0, color: '#065f46', fontSize: '26px' }}>{stats.newUsersToday || 0}</h2>
                  <p style={{ margin: '6px 0 0', fontSize: '11px', color: '#94a3b8' }}>Registrations in last 24 hrs</p>
                </div>

                <div className="analytics-card" style={{ padding: '20px', background: '#fff', borderRadius: '12px', boxShadow: '0 2px 8px rgba(0,0,0,0.08)', borderLeft: '4px solid #8b5cf6' }}>
                  <p style={{ margin: 0, fontSize: '12px', fontWeight: '700', color: '#64748b', textTransform: 'uppercase', marginBottom: '10px' }}>New This Week</p>
                  <h2 style={{ margin: 0, color: '#5b21b6', fontSize: '26px' }}>{stats.newUsersThisWeek || 0}</h2>
                  <p style={{ margin: '6px 0 0', fontSize: '11px', color: '#94a3b8' }}>Registrations in last 7 days</p>
                </div>

                <div className="analytics-card" style={{ padding: '20px', background: '#fff', borderRadius: '12px', boxShadow: '0 2px 8px rgba(0,0,0,0.08)', borderLeft: '4px solid #f97316' }}>
                  <p style={{ margin: 0, fontSize: '12px', fontWeight: '700', color: '#64748b', textTransform: 'uppercase', marginBottom: '10px' }}>Deactivated</p>
                  <h2 style={{ margin: 0, color: '#c2410c', fontSize: '26px' }}>{stats.inactiveUsers || 0}</h2>
                  <p style={{ margin: '6px 0 0', fontSize: '11px', color: '#94a3b8' }}>Accounts currently suspended</p>
                </div>

                <div className="analytics-card" style={{ padding: '20px', background: '#fff', borderRadius: '12px', boxShadow: '0 2px 8px rgba(0,0,0,0.08)', borderLeft: '4px solid #3b82f6' }}>
                  <p style={{ margin: 0, fontSize: '12px', fontWeight: '700', color: '#64748b', textTransform: 'uppercase', marginBottom: '10px' }}>Email Verified</p>
                  <h2 style={{ margin: 0, color: '#1e40af', fontSize: '26px' }}>{stats.emailVerificationRate || 0}%</h2>
                  <div style={{ marginTop: '8px', background: '#e2e8f0', borderRadius: '99px', height: '6px', overflow: 'hidden' }}>
                    <div style={{ width: `${stats.emailVerificationRate || 0}%`, background: '#3b82f6', height: '100%', borderRadius: '99px' }} />
                  </div>
                  <p style={{ margin: '6px 0 0', fontSize: '11px', color: '#94a3b8' }}>{stats.verifiedEmailUsers || 0} of {stats.totalUsers || 0} users verified</p>
                </div>

                <div className="analytics-card" style={{ padding: '20px', background: '#fff', borderRadius: '12px', boxShadow: '0 2px 8px rgba(0,0,0,0.08)', borderLeft: '4px solid #f59e0b' }}>
                  <p style={{ margin: 0, fontSize: '12px', fontWeight: '700', color: '#64748b', textTransform: 'uppercase', marginBottom: '10px' }}>Google Sign-In</p>
                  <h2 style={{ margin: 0, color: '#b45309', fontSize: '26px' }}>{stats.googleAuthUsers || 0}</h2>
                  <p style={{ margin: '6px 0 0', fontSize: '11px', color: '#94a3b8' }}>Users via Google OAuth</p>
                </div>
              </div>
            </div>

            <div className="analytics-card" style={{ marginTop: '25px', padding: '25px', background: '#fff', borderRadius: '12px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)' }}>
              <h3 style={{ marginBottom: '20px', color: '#334155', borderBottom: '1px solid #f1f5f9', paddingBottom: '10px' }}>Top Trending Product Categories</h3>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '15px' }}>
                {(stats.topProducts || []).length === 0 && (
                  <p style={{ color: '#94a3b8', fontSize: '14px' }}>No product data available yet.</p>
                )}
                {(stats.topProducts || []).map((product, index) => (
                  <div
                    key={`${product.name}-${index}`}
                    style={{
                      background: '#f8fafc',
                      padding: '10px 18px',
                      borderRadius: '8px',
                      fontSize: '14px',
                      border: '1px solid #e2e8f0',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '10px',
                    }}
                  >
                    <span style={{ fontWeight: '600', color: '#334155' }}>{product.name}</span>
                    <span style={{ background: '#3b82f6', color: '#fff', padding: '2px 8px', borderRadius: '4px', fontSize: '12px' }}>{product.count}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        <section
          id="coreSection"
          className={activeSection === 'core' ? 'section active' : 'section'}
          style={{ width: '100%' }}
        >
          <h2>User Management and Control</h2>

          <div className="filter-bar">
            <input
              type="text"
              placeholder="Search by name or email..."
              value={userSearch}
              onChange={(e) => setUserSearch(e.target.value)}
            />
            <select value={roleFilter} onChange={(e) => setRoleFilter(e.target.value)}>
              <option value="all">All Roles</option>
              <option value="farmer">Farmers</option>
              <option value="dealer">Dealers</option>
              <option value="retailer">Retailers</option>
              <option value="admin">Admins</option>
            </select>
            <button className="refresh-btn" onClick={() => loadAllData(true)}>
              Refresh
            </button>
          </div>

          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Email</th>
                  <th>Role</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredUsers.length === 0 && (
                  <tr>
                    <td colSpan="5" style={{ textAlign: 'center' }}>No users found.</td>
                  </tr>
                )}
                {filteredUsers.map((user) => (
                  <tr key={user._id}>
                    <td><strong>{user.firstName} {user.lastName || ''}</strong></td>
                    <td>{user.email}</td>
                    <td><span className={`role-badge role-${user.role || 'other'}`}>{user.role}</span></td>
                    <td>
                      <span className={`status-badge ${user.isActive === false ? 'status-inactive' : 'status-active'}`}>
                        {user.isActive === false ? 'Inactive' : 'Active'}
                      </span>
                    </td>
                    <td>
                      <button className="action-btn deactivate" onClick={() => handleToggleUserActive(user._id)}>
                        {user.isActive === false ? 'Activate' : 'Deactivate'}
                      </button>
                      <button className="action-btn delete" onClick={() => handleDeleteUser(user._id, user.email)}>
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <section
          id="activitySection"
          className={activeSection === 'activity' ? 'section active' : 'section'}
          style={{ width: '100%' }}
        >
          <div className="activity-header">
            <div>
              <h2>User Activity Explorer</h2>
              <p className="activity-subtitle">
                Click any user to inspect a filtered timeline of their activity across the platform.
              </p>
            </div>
            <button className="refresh-btn" onClick={() => loadAllData(true)}>
              Refresh
            </button>
          </div>

          <div className="activity-explorer">
            <aside className="activity-users-panel">
              <div className="activity-panel-header">
                <h3>Users</h3>
                <span>{activityUsers.length} visible</span>
              </div>

              <div className="activity-filter-stack">
                <input
                  type="text"
                  placeholder="Search name or email..."
                  value={activityUserSearch}
                  onChange={(e) => setActivityUserSearch(e.target.value)}
                />
                <select
                  value={activityUserRoleFilter}
                  onChange={(e) => setActivityUserRoleFilter(e.target.value)}
                >
                  <option value="all">All Roles</option>
                  <option value="farmer">Farmers</option>
                  <option value="dealer">Dealers</option>
                  <option value="retailer">Retailers</option>
                  <option value="admin">Admins</option>
                </select>
              </div>

              <div className="activity-user-list">
                {activityUsers.length === 0 && (
                  <div className="activity-empty-state">No users match the current filters.</div>
                )}

                {activityUsers.map((user) => (
                  <button
                    key={user._id}
                    type="button"
                    className={`activity-user-card ${selectedActivityUserEmail === user.email ? 'selected' : ''}`}
                    onClick={() => setSelectedActivityUserEmail(user.email)}
                  >
                    <div className="activity-user-top">
                      <strong>{user.firstName} {user.lastName || ''}</strong>
                      <span className={`role-badge role-${user.role || 'other'}`}>{user.role}</span>
                    </div>
                    <div className="activity-user-email">{user.email}</div>
                    <div className="activity-user-meta">
                      <span>{user.isActive === false ? 'Inactive' : 'Active'}</span>
                      <span>{formatDate(user.createdAt)}</span>
                    </div>
                  </button>
                ))}
              </div>
            </aside>

            <div className="activity-detail-panel">
              {!selectedActivityUser && (
                <div className="activity-empty-state">Select a user to view activity.</div>
              )}

              {selectedActivityUser && (
                <>
                  <div className="activity-detail-hero">
                    <div>
                      <h3>{selectedActivityUser.firstName} {selectedActivityUser.lastName || ''}</h3>
                      <p>{selectedActivityUser.email}</p>
                    </div>
                    <div className="activity-hero-badges">
                      <span className={`role-badge role-${selectedActivityUser.role || 'other'}`}>{selectedActivityUser.role}</span>
                      <span className={`status-badge ${selectedActivityUser.isActive === false ? 'status-inactive' : 'status-active'}`}>
                        {selectedActivityUser.isActive === false ? 'Inactive' : 'Active'}
                      </span>
                    </div>
                  </div>

                  <div className="users-stats-summary">
                    <div className="summary-item">
                      <span>Total Activities</span>
                      <strong>{activityMeta?.totalActivities || 0}</strong>
                    </div>
                    <div className="summary-item">
                      <span>Latest Activity</span>
                      <strong className="success">{formatDateTime(activityMeta?.latestActivityAt)}</strong>
                    </div>
                  </div>

                  <div className="filter-bar">
                    <input
                      type="text"
                      placeholder="Search activity details..."
                      value={activityTextFilter}
                      onChange={(e) => setActivityTextFilter(e.target.value)}
                    />
                    <select
                      value={activityTypeFilter}
                      onChange={(e) => setActivityTypeFilter(e.target.value)}
                    >
                      <option value="all">All Activity Types</option>
                      {activityTypeOptions.map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                    <input type="date" value={activityFromDate} onChange={(e) => setActivityFromDate(e.target.value)} />
                    <input type="date" value={activityToDate} onChange={(e) => setActivityToDate(e.target.value)} />
                  </div>

                  {activityLoading && <p className="loading-text">Loading user activity...</p>}
                  {activityError && <p style={{ color: '#b91c1c', marginBottom: '16px' }}>{activityError}</p>}

                  {!activityLoading && !activityError && activityTimeline.length === 0 && (
                    <div className="activity-empty-state">No activity found for the selected filters.</div>
                  )}

                  {!activityLoading && !activityError && activityTimeline.length > 0 && (
                    <div className="activity-timeline">
                      {activityTimeline.map((activity, index) => (
                        <div key={`${activity.timestamp}-${index}`} className="activity-entry">
                          <div className="activity-entry-top">
                            <div className="activity-entry-left">
                              <span className={`log-action log-${activity.type}`}>{activity.type}</span>
                              <strong>{activity.title}</strong>
                            </div>
                            <time>{formatDateTime(activity.timestamp)}</time>
                          </div>
                          <p>{activity.details}</p>
                          <div className="activity-source">Source: {activity.source}</div>
                        </div>
                      ))}
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        </section>

        <section
          id="representativesSection"
          className={activeSection === 'representatives' ? 'section active' : 'section'}
          style={{ width: '100%' }}
        >
          <h2>Representative Access Management</h2>
          <p style={{ color: '#64748b', marginBottom: '24px' }}>
            Add email addresses here to grant representative access.
          </p>

          <div className="analytics-card" style={{ marginBottom: '28px', padding: '25px', background: '#fff', borderRadius: '12px' }}>
            <h3 style={{ marginBottom: '16px' }}>Add Representative Email</h3>
            <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', alignItems: 'flex-end' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', flex: '1 1 240px' }}>
                <label style={{ fontSize: '13px', fontWeight: 600, color: '#374151' }}>Email Address *</label>
                <input
                  type="email"
                  placeholder="representative@example.com"
                  value={repEmail}
                  onChange={(e) => setRepEmail(e.target.value)}
                  disabled={repLoading}
                  onKeyDown={(e) => e.key === 'Enter' && handleAddRepresentative()}
                  style={{ padding: '10px 14px', borderRadius: '8px', border: '1px solid #d1d5db', fontSize: '14px', outline: 'none' }}
                />
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', flex: '1 1 200px' }}>
                <label style={{ fontSize: '13px', fontWeight: 600, color: '#374151' }}>Note (optional)</label>
                <input
                  type="text"
                  placeholder="e.g. Field representative - North Zone"
                  value={repNote}
                  onChange={(e) => setRepNote(e.target.value)}
                  disabled={repLoading}
                  onKeyDown={(e) => e.key === 'Enter' && handleAddRepresentative()}
                  style={{ padding: '10px 14px', borderRadius: '8px', border: '1px solid #d1d5db', fontSize: '14px', outline: 'none' }}
                />
              </div>
              <button
                onClick={handleAddRepresentative}
                disabled={repLoading || !repEmail.trim()}
                style={{
                  padding: '10px 22px',
                  borderRadius: '8px',
                  background: repLoading || !repEmail.trim() ? '#9ca3af' : '#10b981',
                  color: '#fff',
                  fontWeight: 600,
                  fontSize: '14px',
                  border: 'none',
                  cursor: repLoading || !repEmail.trim() ? 'not-allowed' : 'pointer',
                  height: '42px',
                  alignSelf: 'flex-end',
                }}
              >
                {repLoading ? 'Adding...' : 'Add Representative'}
              </button>
            </div>

            {repStatus.msg && (
              <div
                style={{
                  marginTop: '14px',
                  padding: '10px 16px',
                  borderRadius: '8px',
                  background: repStatus.type === 'success' ? '#d1fae5' : '#fee2e2',
                  color: repStatus.type === 'success' ? '#065f46' : '#991b1b',
                  fontSize: '14px',
                  fontWeight: 500,
                }}
              >
                {repStatus.msg}
              </div>
            )}
          </div>

          <div className="analytics-card" style={{ padding: '25px', background: '#fff', borderRadius: '12px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h3>Authorized Representatives ({representatives.length})</h3>
              <button className="refresh-btn" onClick={() => loadAllData(true)}>Refresh</button>
            </div>

            <div className="table-container">
              <table>
                <thead>
                  <tr>
                    <th>#</th>
                    <th>Email</th>
                    <th>Note</th>
                    <th>Added By</th>
                    <th>Date Added</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {representatives.length === 0 && (
                    <tr>
                      <td colSpan="6" style={{ textAlign: 'center', color: '#6b7280', padding: '32px' }}>
                        No representatives added yet.
                      </td>
                    </tr>
                  )}

                  {representatives.map((rep, index) => (
                    <tr key={rep._id}>
                      <td style={{ color: '#9ca3af' }}>{index + 1}</td>
                      <td><strong>{rep.email}</strong></td>
                      <td style={{ color: '#6b7280', fontStyle: rep.note ? 'normal' : 'italic' }}>{rep.note || '-'}</td>
                      <td>{rep.addedBy}</td>
                      <td>{formatDate(rep.createdAt)}</td>
                      <td>
                        <button className="action-btn delete" onClick={() => handleDeleteRepresentative(rep._id, rep.email)}>
                          Remove
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </section>
      </main>
    </>
  );
};

export default AdminDashboard;
