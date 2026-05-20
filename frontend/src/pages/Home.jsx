import React from 'react';
import { Link } from 'react-router-dom';

const Home = () => {
  return (
    <div className="min-vh-100 d-flex flex-column" style={{ backgroundColor: 'var(--custom-bg)', color: 'var(--custom-text)' }}>
      {/* Navbar (Optional, minimal) */}
      <nav className="navbar navbar-expand-lg navbar-light py-3 px-4 px-md-5">
        <Link className="navbar-brand fw-bold fs-4 d-flex align-items-center gap-2" to="/" style={{ color: 'var(--custom-primary)' }}>
          <span style={{ fontSize: '1.5rem' }}>✨</span> YalınKanban
        </Link>
        <div className="ms-auto">
          <Link to="/login" className="btn btn-outline-primary fw-medium px-4">Giriş Yap</Link>
        </div>
      </nav>

      {/* 1. Hero Section */}
      <section className="flex-grow-1 d-flex align-items-center py-5">
        <div className="container text-center">
          <div className="row justify-content-center">
            <div className="col-lg-8">
              <span className="badge rounded-pill bg-white border border-primary px-3 py-2 mb-4 text-primary shadow-sm" style={{ fontWeight: 500 }}>
                🚀 Yeni Nesil Proje Yönetimi
              </span>
              <h1 className="display-4 fw-bold mb-4" style={{ letterSpacing: '-0.03em', color: 'var(--custom-text)' }}>
                Ekibiniz İçin En <span style={{ color: 'var(--custom-primary)' }}>Yalın</span> Kanban Deneyimi.
              </h1>
              <p className="lead mb-5 px-md-5 text-muted" style={{ lineHeight: '1.8' }}>
                İş akışınızı görselleştirin, görevleri takip edin ve hedeflerinize daha hızlı ulaşın. Karmaşık ayarlar yok, sadece verimlilik var.
              </p>
              <div className="d-flex flex-column flex-sm-row justify-content-center gap-3">
                <Link to="/login" className="btn btn-primary btn-lg shadow-sm px-5 py-3 rounded-pill fw-semibold">
                  Hemen Ücretsiz Başla
                </Link>
                <a href="#nasil-calisir" className="btn btn-light btn-lg px-5 py-3 rounded-pill fw-semibold shadow-sm border">
                  Nasıl Çalışır?
                </a>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 2. Özellikler (Features) Section */}
      <section id="nasil-calisir" className="py-5 bg-white">
        <div className="container py-5">
          <div className="text-center mb-5">
            <h2 className="fw-bold mb-3">Sevdiğiniz Özellikler, Yalınlaştı.</h2>
            <p className="text-muted">Projenizi hızlandırmak için ihtiyacınız olan her şey.</p>
          </div>
          <div className="row g-4">
            {/* Feature 1 */}
            <div className="col-md-6 col-lg-3">
              <div className="card h-100 p-4 border-0 shadow-sm text-center card-hover-modern">
                <div className="d-inline-flex align-items-center justify-content-center bg-light rounded-circle mb-4 mx-auto" style={{ width: '64px', height: '64px', color: 'var(--custom-primary)', fontSize: '24px' }}>
                  📌
                </div>
                <h5 className="fw-bold">Sürükle-Bırak Panolar</h5>
                <p className="text-muted small mb-0">Görevleri durumlar arasında kolayca taşıyın.</p>
              </div>
            </div>
            {/* Feature 2 */}
            <div className="col-md-6 col-lg-3">
              <div className="card h-100 p-4 border-0 shadow-sm text-center card-hover-modern">
                <div className="d-inline-flex align-items-center justify-content-center bg-light rounded-circle mb-4 mx-auto" style={{ width: '64px', height: '64px', color: 'var(--custom-accent)', fontSize: '24px' }}>
                  ⚡
                </div>
                <h5 className="fw-bold">Gerçek Zamanlı İşbirliği</h5>
                <p className="text-muted small mb-0">Ekibinizle anlık güncellemelerle senkronize kalın.</p>
              </div>
            </div>
            {/* Feature 3 */}
            <div className="col-md-6 col-lg-3">
              <div className="card h-100 p-4 border-0 shadow-sm text-center card-hover-modern">
                <div className="d-inline-flex align-items-center justify-content-center bg-light rounded-circle mb-4 mx-auto" style={{ width: '64px', height: '64px', color: 'var(--custom-secondary)', fontSize: '24px' }}>
                  🎯
                </div>
                <h5 className="fw-bold">Önceliklendirme</h5>
                <p className="text-muted small mb-0">Hangi işin acil olduğunu tek bakışta görün.</p>
              </div>
            </div>
            {/* Feature 4 */}
            <div className="col-md-6 col-lg-3">
              <div className="card h-100 p-4 border-0 shadow-sm text-center card-hover-modern">
                <div className="d-inline-flex align-items-center justify-content-center bg-light rounded-circle mb-4 mx-auto" style={{ width: '64px', height: '64px', color: '#6ee7b7', fontSize: '24px' }}>
                  📊
                </div>
                <h5 className="fw-bold">Basit Analizler</h5>
                <p className="text-muted small mb-0">Projenin ilerleyişini grafiklerle takip edin.</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 3. Neden YalınKanban? (Comparison) */}
      <section className="py-5" style={{ backgroundColor: 'var(--custom-secondary)' }}>
        <div className="container py-5">
          <div className="row align-items-center justify-content-center">
            <div className="col-lg-8 text-center text-white">
              <h1 className="display-5 fw-bold mb-4">Jira Çok mu Karmaşık Geliyor?</h1>
              <p className="lead mb-5 px-md-5" style={{ color: 'rgba(255,255,255,0.9)' }}>
                Eğitim almanıza gerek kalmadan, 30 saniye içinde ilk projenizi oluşturun. Biz hıza ve odaklanmaya inanıyoruz.
              </p>
              <Link to="/login" className="btn btn-light btn-lg px-5 py-3 rounded-pill fw-semibold text-primary shadow">
                Hemen Farkı Görün
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* 4. Teknik Alt Yapı (Showcase) */}
      <section className="py-5 bg-white">
        <div className="container py-5 text-center">
          <h3 className="fw-bold mb-5" style={{ color: 'var(--custom-text)' }}>Modern Teknoloji ile Güçlendirildi.</h3>
          <div className="d-flex flex-wrap justify-content-center align-items-center gap-5 opacity-75">
            <div className="d-flex flex-column align-items-center">
              <img src="https://upload.wikimedia.org/wikipedia/commons/a/a7/React-icon.svg" alt="React" height="50" className="mb-2" />
              <span className="fw-medium text-muted">React</span>
            </div>
            <div className="d-flex flex-column align-items-center">
              <img src="https://upload.wikimedia.org/wikipedia/commons/d/d9/Node.js_logo.svg" alt="Node.js" height="50" className="mb-2" />
              <span className="fw-medium text-muted">Node.js</span>
            </div>
            <div className="d-flex flex-column align-items-center">
              <img src="https://upload.wikimedia.org/wikipedia/en/d/dd/MySQL_logo.svg" alt="MySQL" height="50" className="mb-2" />
              <span className="fw-medium text-muted">MySQL</span>
            </div>
          </div>
        </div>
      </section>

      {/* 5. Footer */}
      <footer className="py-4 border-top" style={{ backgroundColor: 'var(--custom-bg)' }}>
        <div className="container text-center">
          <div className="d-flex justify-content-center gap-4 mb-3">
            <a href="https://github.com/numanyolcu" target="_blank" rel="noopener noreferrer" className="text-muted text-decoration-none hover-primary">GitHub</a>
            <a href="https://linkedin.com/in/numanyolcu" target="_blank" rel="noopener noreferrer" className="text-muted text-decoration-none hover-primary">LinkedIn</a>
            <a href="#" className="text-muted text-decoration-none hover-primary">Dokümantasyon</a>
          </div>
          <p className="text-muted small mb-0">&copy; {new Date().getFullYear()} YalınKanban. Tüm hakları saklıdır.</p>
        </div>
      </footer>
    </div>
  );
};

export default Home;
