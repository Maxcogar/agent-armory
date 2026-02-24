import { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useApi } from '@/hooks/useApi';
import { usersApi } from '@/services/api';

export default function UserProfile() {
  const { user } = useAuth();
  const { execute: updateUser, loading: saving } = useApi(usersApi.update);
  const { execute: changePassword, loading: changingPw } = useApi(usersApi.changePassword);

  const [name, setName] = useState(user?.name || '');
  const [avatar, setAvatar] = useState(user?.avatar || '');
  const [message, setMessage] = useState(null);
  const [error, setError] = useState(null);

  const [currentPw, setCurrentPw] = useState('');
  const [newPw, setNewPw] = useState('');

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    setMessage(null);
    setError(null);
    try {
      await updateUser(user._id, { name, avatar: avatar || undefined });
      setMessage('Profile updated successfully');
    } catch (err) {
      setError(err.message);
    }
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    setMessage(null);
    setError(null);
    try {
      await changePassword(user._id, { currentPassword: currentPw, newPassword: newPw });
      setMessage('Password changed successfully');
      setCurrentPw('');
      setNewPw('');
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div className="user-profile">
      <h1>Profile</h1>

      {message && <div className="success-message">{message}</div>}
      {error && <div className="error-message">{error}</div>}

      <section className="profile-section">
        <h2>Account Details</h2>
        <form onSubmit={handleUpdateProfile}>
          <div className="form-group">
            <label htmlFor="profile-email">Email</label>
            <input id="profile-email" type="email" value={user?.email || ''} disabled />
          </div>
          <div className="form-group">
            <label htmlFor="profile-name">Name</label>
            <input
              id="profile-name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </div>
          <div className="form-group">
            <label htmlFor="profile-avatar">Avatar URL</label>
            <input
              id="profile-avatar"
              type="url"
              value={avatar}
              onChange={(e) => setAvatar(e.target.value)}
              placeholder="https://example.com/avatar.jpg"
            />
          </div>
          <button type="submit" className="btn-primary" disabled={saving}>
            {saving ? 'Saving...' : 'Save Changes'}
          </button>
        </form>
      </section>

      <section className="profile-section">
        <h2>Change Password</h2>
        <form onSubmit={handleChangePassword}>
          <div className="form-group">
            <label htmlFor="current-pw">Current Password</label>
            <input
              id="current-pw"
              type="password"
              value={currentPw}
              onChange={(e) => setCurrentPw(e.target.value)}
              required
            />
          </div>
          <div className="form-group">
            <label htmlFor="new-pw">New Password</label>
            <input
              id="new-pw"
              type="password"
              value={newPw}
              onChange={(e) => setNewPw(e.target.value)}
              required
              minLength={8}
            />
          </div>
          <button type="submit" className="btn-primary" disabled={changingPw}>
            {changingPw ? 'Changing...' : 'Change Password'}
          </button>
        </form>
      </section>
    </div>
  );
}
