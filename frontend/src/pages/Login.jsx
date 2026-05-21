import React, { useState, useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import PasswordStrengthInput from '../components/PasswordStrengthInput';

const Login = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState('');
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  const { login, register } = useContext(AuthContext);
  const navigate = useNavigate();

  // Şifre güç kuralları (kayıt modunda)
  const passwordRules = {
    length:    password.length >= 8,
    uppercase: /[A-Z]/.test(password),
    number:    /\d/.test(password),
    special:   /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?`~]/.test(password),
  };
  const allRulesPassed = Object.values(passwordRules).every(Boolean);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setError('Lütfen geçerli bir e-posta adresi giriniz.');
      return;
    }

    if (!isLogin && !allRulesPassed) {
      setError('Şifreniz tüm güvenlik kurallarını karşılamalıdır.');
      return;
    }

    if (isLogin && password.length < 6) {
      setError('Şifreniz en az 6 karakter olmalıdır.');
      return;
    }

    if (!isLogin && username.trim().length < 3) {
      setError('Kullanıcı adı en az 3 karakter olmalıdır.');
      return;
    }

    try {
      if (isLogin) {
        await login(email, password);
        navigate('/dashboard');
      } else {
        await register(username, email, password);
        setSuccess('Kayıt başarılı! Şimdi giriş yapabilirsiniz.');
        setIsLogin(true);
        setPassword('');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Bir hata oluştu.');
    }
  };

  const switchMode = () => {
    setIsLogin(!isLogin);
    setError(null);
    setSuccess(null);
    setPassword('');
  };

  return (
    <div className="auth-page container-fluid min-vh-100 d-flex align-items-center justify-content-center py-4">
      <div className="row justify-content-center w-100">
        <div className="col-md-8 col-lg-5">
          <div className="auth-card card p-3 p-md-4">
            <div className="card-body">
              <div className="text-center mb-4">
                <div className="auth-logo" style={{
                  width: '64px',
                  height: '64px',
                  background: 'linear-gradient(135deg, var(--custom-primary), var(--custom-secondary))',
                  borderRadius: '16px',
                  margin: '0 auto 16px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'white',
                  fontSize: '28px',
                  boxShadow: '0 8px 16px rgba(99, 102, 241, 0.3)'
                }}>
                  ✨
                </div>
                <h3 className="card-title fw-bold" style={{ color: 'var(--custom-text)' }}>
                  {isLogin ? 'Hoş Geldiniz' : 'Hesap Oluşturun'}
                </h3>
                <p className="text-muted mb-0">
                  {isLogin ? 'Devam etmek için giriş yapın' : 'Uygulamaya katılmak için formu doldurun'}
                </p>
              </div>

              {error   && <div className="alert alert-danger py-2"   style={{ fontSize: '13px', borderRadius: '10px' }}>⚠️ {error}</div>}
              {success && <div className="alert alert-success py-2" style={{ fontSize: '13px', borderRadius: '10px' }}>✅ {success}</div>}

              <form onSubmit={handleSubmit}>
                {!isLogin && (
                  <div className="mb-3">
                    <label className="form-label">Kullanıcı Adı</label>
                    <input
                      type="text"
                      className="form-control"
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      required
                      placeholder="En az 3 karakter"
                    />
                  </div>
                )}

                <div className="mb-3">
                  <label className="form-label">E-posta</label>
                  <input
                    type="email"
                    className="form-control"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    placeholder="ornek@email.com"
                  />
                </div>

                {/* Şifre Alanı: Kayıtta güçlü validator, girişte sade */}
                <div className="mb-4">
                  {!isLogin ? (
                    <PasswordStrengthInput
                      id="password"
                      label="Şifre"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                    />
                  ) : (
                    <div>
                      <label className="form-label">Şifre</label>
                      <input
                        type="password"
                        className="form-control"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                        placeholder="Şifrenizi giriniz"
                      />
                    </div>
                  )}
                </div>

                <button
                  type="submit"
                  className="btn btn-primary w-100 fw-semibold"
                  style={{ borderRadius: '10px', padding: '10px' }}
                  disabled={!isLogin && !allRulesPassed}
                >
                  {isLogin ? '🚀 Giriş Yap' : '✨ Kayıt Ol'}
                </button>
              </form>

              <div className="text-center mt-3">
                <button
                  className="btn btn-link text-decoration-none"
                  style={{ fontSize: '13px' }}
                  onClick={switchMode}
                >
                  {isLogin
                    ? 'Hesabınız yok mu? Kayıt Olun →'
                    : '← Zaten hesabınız var mı? Giriş Yapın'}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
