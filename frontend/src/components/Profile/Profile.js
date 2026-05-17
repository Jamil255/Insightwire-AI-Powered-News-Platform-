import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { LogOut, Bookmark, Settings, User as UserIcon, Activity } from 'lucide-react';
import './Profile.css';

const Profile = () => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    // Scroll to top on load
    window.scrollTo(0, 0);
    fetchUserProfile();
  }, []);

  const fetchUserProfile = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        setLoading(false);
        return;
      }

      const response = await fetch('http://localhost:5000/api/auth/profile', {
        headers: {
          'x-auth-token': token
        }
      });

      if (response.ok) {
        const userData = await response.json();
        setUser(userData);
      } else {
        // Token might be invalid/expired
        localStorage.removeItem('token');
        localStorage.removeItem('user');
      }
    } catch (error) {
      console.error('Error fetching profile:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
    navigate('/');
    window.location.reload();
  };

  if (loading) {
    return (
      <div className="profile-container" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
        <div className="loading-spinner"></div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="auth-warning">
        <h2>Authentication Required</h2>
        <p>Please log in to view your profile and personalized settings.</p>
      </div>
    );
  }

  // Get first letter of username for avatar fallback
  const initial = user.userName ? user.userName.charAt(0).toUpperCase() : 'U';

  return (
    <div className="profile-container">
      <div className="profile-content">
        <div className="profile-header">
          <h1>Your Profile</h1>
          <p>Manage your account and preferences</p>
        </div>

        <div className="profile-grid">
          {/* Left Column: User Info */}
          <div className="profile-sidebar">
            <div className="user-card">
              <div className="user-avatar">
                {user.profilePic ? (
                  <img src={user.profilePic} alt={user.userName} />
                ) : (
                  <span>{initial}</span>
                )}
              </div>
              <div className="user-info">
                <h2>{user.userName}</h2>
                <p>{user.email}</p>
                <span className="auth-badge">{user.authType || 'Local'} Account</span>
              </div>

              <button className="logout-btn" onClick={handleLogout}>
                <LogOut size={18} />
                Sign Out
              </button>
            </div>
          </div>

          {/* Right Column: Activity & Settings */}
          <div className="profile-activity">
            <div className="activity-card">
              <h3><Bookmark size={20} /> Saved Articles</h3>
              <div className="empty-state">
                <Bookmark size={40} />
                <p>You haven't saved any articles yet.</p>
              </div>
            </div>

            <div className="activity-card">
              <h3><Settings size={20} /> Preferences</h3>
              <div className="empty-state">
                <Settings size={40} />
                <p>Personalized feed preferences will appear here.</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile;
