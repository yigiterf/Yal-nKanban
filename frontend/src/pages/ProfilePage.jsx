import React, { useState, useEffect, useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import api from '../services/api';

const ProfilePage = () => {
  const { user } = useContext(AuthContext);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState(null);

  // Profil düzenleme
  const [editingProfile, setEditingProfile] = useState(false);
  const [newUsername, setNewUsername] = useState('');
  const [profileSaving, setProfileSaving] = useState(false);

  // Şifre değiştirme
  const [showPasswordForm, setShowPasswordForm] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordError, setPasswordError] = useState(null);
  const [passwordSaving, setPasswordSaving] = useState(false);

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  const fetchProfile = async () => {
    try {
      const res = await api.get('/users/me');
      setProfile(res.data);
      setNewUsername(res.data.username);
    } catch (err) {
      console.error('Profil yüklenemedi:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProfile();
  }, []);

  const handleSaveProfile = async (e) => {
    e.preventDefault();
    if (!newUsername.trim() || newUsername.trim().length < 3) {
      showToast('Kullanıcı adı en az 3 karakter olmalıdır.', 'danger');
      return;
    }

    setProfileSaving(true);
    try {
      await api.patch('/users/me', { username: newUsername.trim() });
      setProfile((prev) => ({ ...prev, username: newUsername.trim() }));
      setEditingProfile(false);
      showToast('Profil güncellendi!');
    } catch (err) {
      showToast(err.response?.data?.message || 'Güncelleme başarısız.', 'danger');
    } finally {
      setProfileSaving(false);
    }
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    setPasswordError(null);

    if (newPassword.length < 6) {
      setPasswordError('Yeni şifre en az 6 karakter olmalıdır.');
      return;
    }
    if (!/\d/.test(newPassword)) {
      setPasswordError('Yeni şifre en az bir rakam içermelidir.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setPasswordError('Şifreler eşleşmiyor.');
      return;
    }

    setPasswordSaving(true);
    try {
      await api.patch('/users/me/password', { currentPassword, newPassword });
      setShowPasswordForm(false);
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      showToast('Şifre başarıyla değiştirildi!');
    } catch (err) {
      setPasswordError(err.response?.data?.message || 'Şifre değiştirilemedi.');
    } finally {
      setPasswordSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="container-fluid px-0 h-100 d-flex flex-column gap-4">
        <div className="skeleton" style={{ width: '200px', height: '36px' }}></div>
        <div className="card p-4 border-0">
          <div className="skeleton mb-3" style={{ width: '80px', height: '80px', borderRadius: '50%' }}></div>
          <div className="skeleton mb-2" style={{ width: '200px', height: '24px' }}></div>
          <div className="skeleton" style={{ width: '250px', height: '16px' }}></div>
        </div>
      </div>
    );
  }

  const getInitials = (name) => {
    if (!name) return '??';
    return name.split(' ').map((n) => n[0]).join('').toUpperCase().substring(0, 2);
  };

  return (
    <div className="container-fluid px-0 h-100 d-flex flex-column">
      {/* Toast */}
      {toast && (
        <div className="position-fixed top-0 end-0 p-3" style={{ zIndex: 9999 }}>
          <div
            className={`alert alert-${toast.type} alert-dismissible shadow-lg border-0 fade show`}
            role="alert"
            style={{ borderRadius: '12px', fontSize: '14px', minWidth: '250px' }}
          >
            {toast.type === 'success' ? '✅' : '⚠️'} {toast.message}
          </div>
        </div>
      )}

      {/* Başlık */}
      <div className="d-flex justify-content-between align-items-center mb-4 pb-3 border-bottom">
        <div>
          <h3 className="fw-bold mb-1" style={{ color: 'var(--custom-text)', letterSpacing: '-0.5px' }}>
            👤 Profil
          </h3>
          <p className="text-muted mb-0 small">Hesap bilgilerinizi görüntüleyin ve düzenleyin.</p>
        </div>
      </div>

      <div className="row g-4">
        {/* Profil Kartı */}
        <div className="col-md-6">
          <div className="card border-0 shadow-sm p-4" style={{ borderRadius: '16px' }}>
            <div className="d-flex align-items-center gap-3 mb-4">
              <div
                className="rounded-circle d-flex align-items-center justify-content-center fw-bold"
                style={{
                  width: 72,
                  height: 72,
                  background: 'linear-gradient(135deg, var(--custom-primary), var(--custom-secondary))',
                  color: 'white',
                  fontSize: '24px',
                }}
              >
                {getInitials(profile?.username)}
              </div>
              <div>
                {editingProfile ? (
                  <form onSubmit={handleSaveProfile} className="d-flex gap-2">
                    <input
                      type="text"
                      className="form-control form-control-sm"
                      value={newUsername}
                      onChange={(e) => setNewUsername(e.target.value)}
                      autoFocus
                      style={{ width: '200px' }}
                    />
                    <button
                      type="submit"
                      className="btn btn-primary btn-sm"
                      disabled={profileSaving}
                    >
                      {profileSaving ? '...' : 'Kaydet'}
                    </button>
                    <button
                      type="button"
                      className="btn btn-light btn-sm"
                      onClick={() => {
                        setEditingProfile(false);
                        setNewUsername(profile?.username || '');
                      }}
                    >
                      İptal
                    </button>
                  </form>
                ) : (
                  <>
                    <h4 className="fw-bold mb-0" style={{ color: 'var(--custom-text)' }}>
                      {profile?.username}
                    </h4>
                    <button
                      className="btn btn-sm btn-link p-0 text-muted"
                      style={{ fontSize: '12px' }}
                      onClick={() => setEditingProfile(true)}
                    >
                      ✏️ Düzenle
                    </button>
                  </>
                )}
              </div>
            </div>

            <div className="d-flex flex-column gap-3">
              <div className="d-flex align-items-center gap-2 p-3 bg-light rounded-3">
                <span style={{ fontSize: '18px' }}>📧</span>
                <div>
                  <small className="text-muted d-block" style={{ fontSize: '11px' }}>E-posta</small>
                  <span className="fw-medium" style={{ fontSize: '14px', color: 'var(--custom-text)' }}>
                    {profile?.email}
                  </span>
                </div>
              </div>

              <div className="d-flex align-items-center gap-2 p-3 bg-light rounded-3">
                <span style={{ fontSize: '18px' }}>📅</span>
                <div>
                  <small className="text-muted d-block" style={{ fontSize: '11px' }}>Kayıt Tarihi</small>
                  <span className="fw-medium" style={{ fontSize: '14px', color: 'var(--custom-text)' }}>
                    {profile?.created_at
                      ? new Date(profile.created_at).toLocaleDateString('tr-TR', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric',
                        })
                      : '-'}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Şifre Değiştirme */}
        <div className="col-md-6">
          <div className="card border-0 shadow-sm p-4" style={{ borderRadius: '16px' }}>
            <h5 className="fw-bold mb-3" style={{ color: 'var(--custom-text)', fontSize: '16px' }}>
              🔒 Şifre Değiştir
            </h5>

            {showPasswordForm ? (
              <form onSubmit={handleChangePassword} className="d-flex flex-column gap-3">
                {passwordError && (
                  <div className="alert alert-danger py-2" style={{ fontSize: '13px', borderRadius: '8px' }}>
                    ⚠️ {passwordError}
                  </div>
                )}
                <div>
                  <label className="form-label small">Mevcut Şifre</label>
                  <input
                    type="password"
                    className="form-control"
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    required
                  />
                </div>
                <div>
                  <label className="form-label small">Yeni Şifre</label>
                  <input
                    type="password"
                    className="form-control"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    required
                    placeholder="En az 6 karakter, 1 rakam"
                  />
                </div>
                <div>
                  <label className="form-label small">Yeni Şifre (Tekrar)</label>
                  <input
                    type="password"
                    className="form-control"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                  />
                </div>
                <div className="d-flex gap-2">
                  <button
                    type="submit"
                    className="btn btn-primary fw-medium"
                    disabled={passwordSaving}
                  >
                    {passwordSaving ? 'Kaydediliyor...' : 'Şifreyi Değiştir'}
                  </button>
                  <button
                    type="button"
                    className="btn btn-light fw-medium"
                    onClick={() => {
                      setShowPasswordForm(false);
                      setPasswordError(null);
                      setCurrentPassword('');
                      setNewPassword('');
                      setConfirmPassword('');
                    }}
                  >
                    İptal
                  </button>
                </div>
              </form>
            ) : (
              <div>
                <p className="text-muted small mb-3">
                  Güvenliğiniz için şifrenizi düzenli olarak değiştirmenizi öneriyoruz.
                </p>
                <button
                  className="btn btn-light fw-medium"
                  onClick={() => setShowPasswordForm(true)}
                >
                  🔑 Şifremi Değiştir
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfilePage;
