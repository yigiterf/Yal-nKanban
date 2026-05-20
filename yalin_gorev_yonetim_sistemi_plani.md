# Yalın Görev Yönetim Sistemi - MVP Planı ve Teknik Mimari

## 1. MVP Özellik Seti (Scope)
İki kişilik bir ekibin hızla çıkarabileceği, işin özüne (core value) odaklı özellikler:
İKİ KİŞİLİK BİR EKİP OLDUĞUMUZ İÇİN VE BİRİMİZ LİNUX DİĞERİ DE MAC KULLANACAĞI İÇİN BU PROJEDE DOCKER KULLANMAMIZ GEREKİYOR. AYRICA PROJEYİ DOCKER'A TAŞIRKEN MYSQL VERİTABANINI DA DOCKER İÇİNDE ÇALIŞTIRMAMIZ GEREKİYOR.

**Kapsama Dahil Olanlar:**
1. **Kullanıcı Kayıt & Giriş (Auth):** Basit e-posta ve şifre (JWT entegreli) ile güvenli giriş.
2. **Proje (Board) Yönetimi:** Kullanıcının farklı projeler/board'lar oluşturup listeleyebilmesi.
3. **Görev (Task) CRUD:** Görev oluşturma, başlık ve açıklama düzenleme, silme.
4. **Mini Kanban Sistemi:** Görevlerin "Yapılacak" (Todo), "Devam Ediyor" (In Progress), "Tamamlandı" (Done) sütunlarında gösterilmesi ve durum güncellemelerinin yapılması.
5. **Görev Atama:** Mevcut (aynı projedeki) kullanıcılar içinden görevi birine atayabilme (Assignee).

**Kapsam Dışı Bırakılanlar (Feature Creep Önlemleri):**
- Rol ve Karmaşık Yetki Yönetimi (Sadece Proje Yaratıcısı ve Üyeler yeterli).
- Yorumlar ve Dosya/Ek yükleme modülleri.
- Zaman Takibi (Time tracking), Timeline, Gantt grafikleri ve Gelişmiş Raporlar.
- Üçüncü parti entegrasyonlar (Slack, GitHub bildirimleri vb.).

---

## 2. Veritabanı Şeması (MySQL)
İlişkisel yapıda (Relational) basit ve sağlam bir kurgu oluşturulmalıdır.

- **Users** Tablosu
  - `id` (INT, PK, Auto Increment)
  - `username` (VARCHAR)
  - `email` (VARCHAR, Unique)
  - `password_hash` (VARCHAR)
  - `created_at` (TIMESTAMP)

- **Projects** Tablosu
  - `id` (INT, PK, Auto Increment)
  - `name` (VARCHAR)
  - `description` (TEXT)
  - `created_by` (INT, FK -> Users.id)
  - `created_at` (TIMESTAMP)

- **Tasks** Tablosu
  - `id` (INT, PK, Auto Increment)
  - `project_id` (INT, FK -> Projects.id)
  - `title` (VARCHAR)
  - `description` (TEXT, Nullable)
  - `status` (ENUM: 'todo', 'in_progress', 'done') DEFAULT 'todo'
  - `assigned_to` (INT, FK -> Users.id, Nullable)
  - `created_at` (TIMESTAMP)

*Not: İki görevlinin ve eklenecek üyelerin erişimini kontrol etmek için MVP kapsamında "projects" tablosuna bağlı bir `project_members` tablosu oluşturalabilir veya direkt `created_by` mantığı üzerinden basit yetkilendirmelere gidilebilir.*

---

## 3. Teknik Mimari ve Dosya Yapısı

### Backend (Node.js/Express.js) - MVC Modeli
```text
backend/
├── src/
│   ├── config/          # db.js (MySQL bağlantı havuzu), env vars
│   ├── controllers/     # authController.js, projectController.js, taskController.js
│   ├── middlewares/     # authMiddleware.js (JWT doğrulama vb.)
│   ├── models/          # userModel.js, projectModel.js, taskModel.js (SQL sorguları)
│   ├── routes/          # authRoutes.js, projectRoutes.js, taskRoutes.js
│   └── start.js         # Express app başlangıcı
├── package.json
└── .env
```

### Frontend (React.js)
```text
frontend/
├── src/
│   ├── components/      # Navbar.jsx, TaskCard.jsx, KanbanBoard.jsx
│   ├── pages/           # Login.jsx, Dashboard.jsx, ProjectDetails.jsx
│   ├── services/        # api.js (Axios instance, Interceptor ve fetch çağrıları)
│   ├── context/         # AuthContext.jsx (Global kullanıcı durumu)
│   ├── App.jsx          # Router yapısı
│   └── main.jsx         
├── package.json
└── src/index.css        # Özelleştirilmiş Bootstrap override'ları
```

### Arayüz ve Tasarım İpuçları (Bootstrap 5 ile Basitlik)
- **Minimalizm:** Arayüz tamamen "temiz" kalmalıdır. Navbar sadece logo, bulunduğun sayfanın adı ve çıkış yap butonundan oluşmalıdır.
- **Kart Tasarımları:** Görevler için `.card` ve `.shadow-sm` sınıfları kullanılmalı. Renk cümbüşünden kaçınılarak statü durumlarında ince detaylar verilmeli (Todo: `bg-light border`, In Progress: `border-primary`, Done: `border-success` gibi).
- **Modallar:** Görev Ekleme/Düzenleme işlemleri apayrı bir route (sayfalandırma) yerine, pratiklik (hız) hedefinden dolayı Bootstrap `Modal` veya `Offcanvas` bileşenleri kullanılarak çözülmelidir.

---

## 4. Geliştirme Aşamaları (Roadmap) - 4 Haftalık Plan
İki kişilik bir ekipten (örn. Yazılımcı A: Backend, Yazılımcı B: Frontend) en iyi verimi alacak eşzamanlı plan:

- **Hafta 1: Çatı Kurulumu ve Veritabanı**
  - Git depolarının ve projenin klasör yapısının (Backend/Node.js, Frontend/React) hazırlanması.
  - MySQL veritabanı tablolarının ayağa kaldırılması ve SQL senaryolarının bağlanması.
  - Temel Express Route'larının ve statik HTML/React bileşenlerinin (Layout, Navbar) renderlanması.

- **Hafta 2: Backend API ve Kimlik Doğrulama (Auth)**
  - Auth sistemi (Kayıt, Giriş, ve Bcrypt/JWT token işlemlerinin) entegrasyonu.
  - Projeler (Projects) ve Görevler (Tasks) için tam CRUD RESTful endpoint'lerinin oluşturulması. Postman ile test edilmesi.
  - Frontend kısmında Routing (Sayfalar arası geçişler) ve Login ekranı entegrasyonu.

- **Hafta 3: Frontend Geliştirme ve Veri Entegrasyonu**
  - Token'ın localStorage/cookie içinde tutulması, Frontend'de private rotaların korunması (AuthContext).
  - Axios ile API'den güncel Dashboard & Board verilerinin çekilmesi.
  - Kanban Board yapısının (3 kolon sistemi) kodlanması ve görevlerin kolonlara listelenmesi.

- **Hafta 4: Deneyim İyileştirme (UX), Test ve Dağıtım**
  - Sürükle ve Bırak veya Statü değiştirme özelliklerinin Backend tarafı ile asenkron / kesintisiz mutasyona bağlanması.
  - Frontend form doğrulamaları (Örn: Boş isimle task oluşturulamaması).
  - UI cilalanması (Hatalı durumlarda Bootstrap Alert, başarılı işlemlerde Toast bildirimi).
  - Hata ayıklama, kod review ve Vercel/Render benzeri platformlar üzerine ücretsiz dağılım (Deployment) yapılarak projenin canlıya alınması.

---

## 5. Kritik Başarı Faktörleri ve Kısıtlamalar

1. **Sayfa Yenilenmesini Engelleme (SPA Kuralı):** 
   Sistemin ana vaadi "Hızlılık" olduğu için özellikle görev sürükleme, silme ve durum güncelleme eylemlerinde sayfa (browser) baştan aşağıya yenilenmemelidir (`window.location.reload` kullanılmamalıdır). İstekler Axios/Fetch ile atılarak DOM React state'leri aracılığıyla güncellenmelidir.

2. **Optimistic UI (İyimser Güncelleme):** 
   Bir görev "Tamamlandı" sütununa taşındığında, React tarafında sütun anında güncellenmeli (kullanıcıda hızlı hissi yaratmalı), arkaplânda ise Axios ile asenkron API isteği atılmalıdır. Backend hata verirse görev UI üzerinde gerialınmalıdır.

3. **Zarif Hata Yönetimi:** 
   Özellikle Backend'den dönen hatalarda (Login fail, Timeout vb.) kullanıcıya teknik İngilizce hatalar yerine, basit Toast/Alert bildirimleri halinde geri dönüşler yapılmalıdır (Ör. "Bağlantı kurulamadı, yeniden deneniyor...").

4. **Odak Konusundan Sapmamak:** 
   Ekipler özelliklere kapılmamalıdır (örn: Karanlık TEMA, Avatar resimleri falan) ancak eğer MVP özellikleri bitip tam sorunsuz çalışır hale getirilirse ekstra olarak tasarıma bu eklentiler katılabilir.

