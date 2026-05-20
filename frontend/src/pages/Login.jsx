import React, { useState, useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';

const Login = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState('');
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  
  const { login, register } = useContext(AuthContext);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    // Frontend validations
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setError('Lütfen geçerli bir e-posta adresi giriniz.');
      return;
    }

    if (password.length < 6) {
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
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Bir hata oluştu.');
    }
  };

  return (
    <div className="container min-vh-100 d-flex align-items-center justify-content-center py-4">
      <div className="row justify-content-center w-100">
        <div className="col-md-8 col-lg-5">
          <div className="card p-3 p-md-4">
            <div className="card-body">
              <div className="text-center mb-4">
                <div style={{
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

              {error && <div className="alert alert-danger">{error}</div>}
              {success && <div className="alert alert-success">{success}</div>}

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
                  />
                </div>

                <div className="mb-3">
                  <label className="form-label">Şifre</label>
                  <input 
                    type="password" 
                    className="form-control" 
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required 
                  />
                </div>

                <button type="submit" className="btn btn-primary w-100">
                  {isLogin ? 'Giriş Yap' : 'Kayıt Ol'}
                </button>
              </form>

              <div className="text-center mt-3">
                <button 
                  className="btn btn-link text-decoration-none" 
                  onClick={() => setIsLogin(!isLogin)}
                >
                  {isLogin 
                    ? 'Hesabınız yok mu? Kayıt Olun' 
                    : 'Zaten hesabınız var mı? Giriş Yapın'}
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
