import React, { useState, useMemo } from 'react';

// ─── Kural Tanımları ──────────────────────────────────────────────────────────
const RULES = [
  {
    id: 'length',
    label: 'En az 8 karakter',
    test: (p) => p.length >= 8,
    icon: '📏',
  },
  {
    id: 'uppercase',
    label: 'En az 1 büyük harf',
    test: (p) => /[A-Z]/.test(p),
    icon: 'Aa',
  },
  {
    id: 'number',
    label: 'En az 1 rakam',
    test: (p) => /\d/.test(p),
    icon: '123',
  },
  {
    id: 'special',
    label: 'En az 1 özel karakter (!@#$...)',
    test: (p) => /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?`~]/.test(p),
    icon: '!@',
  },
];

// ─── Güç Hesaplama ─────────────────────────────────────────────────────────────
const getStrength = (password, passed) => {
  if (!password) return null;
  if (passed < 2)  return { level: 'Zayıf',   score: 1, width: '33%',  gradient: 'linear-gradient(90deg, #ef4444, #f97316)' };
  if (passed < 4)  return { level: 'Orta',    score: 2, width: '66%',  gradient: 'linear-gradient(90deg, #f97316, #eab308, #4F46E5)' };
  return                 { level: 'Güçlü',   score: 3, width: '100%', gradient: 'linear-gradient(90deg, #4F46E5, #06b6d4, #22c55e)' };
};

// ─── Göz İkonu SVG ─────────────────────────────────────────────────────────────
const EyeIcon = ({ open }) =>
  open ? (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
      <circle cx="12" cy="12" r="3"/>
    </svg>
  ) : (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19m-6.72-1.07a3 3 0 11-4.24-4.24"/>
      <line x1="1" y1="1" x2="23" y2="23"/>
    </svg>
  );

// ─── Ana Bileşen ───────────────────────────────────────────────────────────────
const PasswordStrengthInput = ({ value, onChange, id = 'password', label = 'Şifre', required = false }) => {
  const [showPassword, setShowPassword] = useState(false);
  const [touched, setTouched]           = useState(false);
  const [shakingRules, setShakingRules] = useState([]);

  // Kaç kural geçildi
  const results = useMemo(() =>
    RULES.map((r) => ({ ...r, passed: r.test(value) })),
    [value]
  );
  const passedCount = results.filter((r) => r.passed).length;
  const strength    = getStrength(value, passedCount);

  // Şifre değişince geçilmeyen kuralları salla
  const handleChange = (e) => {
    const newVal = e.target.value;
    onChange(e);
    if (!touched) setTouched(true);

    // Henüz sağlanmayan kuralları belirle ve shake animasyonu tetikle
    const failing = RULES.filter((r) => !r.test(newVal)).map((r) => r.id);
    setShakingRules(failing);
    setTimeout(() => setShakingRules([]), 500);
  };

  return (
    <div style={{ fontFamily: 'inherit' }}>
      {/* ── Label ── */}
      {label && (
        <label
          htmlFor={id}
          className="form-label"
          style={{ color: 'var(--custom-text)', fontWeight: 600, fontSize: '14px' }}
        >
          {label}
        </label>
      )}

      {/* ── Input Wrapper ── */}
      <div style={{ position: 'relative' }}>
        <input
          id={id}
          type={showPassword ? 'text' : 'password'}
          className="form-control"
          value={value}
          onChange={handleChange}
          required={required}
          autoComplete="new-password"
          style={{
            paddingRight: '44px',
            background: '#21262D',
            border: '1px solid',
            borderColor: touched
              ? strength?.score === 3 ? '#22c55e'
              : strength?.score === 2 ? '#eab308'
              : strength?.score === 1 ? '#ef4444'
              : '#30363D'
              : '#30363D',
            color: '#E6EDF3',
            borderRadius: '10px 10px',
            transition: 'border-color 0.3s ease-out',
          }}
        />

        {/* Göz Butonu */}
        <button
          type="button"
          onClick={() => setShowPassword((p) => !p)}
          tabIndex={-1}
          style={{
            position: 'absolute',
            right: '12px',
            top: '50%',
            transform: 'translateY(-50%)',
            background: 'none',
            border: 'none',
            padding: '2px',
            color: '#8B949E',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            transition: 'transform 0.15s ease, color 0.15s ease',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = 'translateY(-50%) scale(1.15)';
            e.currentTarget.style.color = '#E6EDF3';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = 'translateY(-50%) scale(1)';
            e.currentTarget.style.color = '#8B949E';
          }}
          aria-label={showPassword ? 'Şifreyi gizle' : 'Şifreyi göster'}
        >
          <EyeIcon open={showPassword} />
        </button>

        {/* ── Gradient Progress Bar ── */}
        <div
          style={{
            position: 'absolute',
            bottom: 0,
            left: 0,
            right: 0,
            height: '3px',
            borderRadius: '0 0 10px 10px',
            background: '#30363D',
            overflow: 'hidden',
          }}
        >
          <div
            style={{
              height: '100%',
              width: strength ? strength.width : '0%',
              background: strength ? strength.gradient : 'transparent',
              transition: 'width 0.35s cubic-bezier(0.34, 1.56, 0.64, 1), background 0.35s ease-out',
              borderRadius: '0 0 10px 10px',
            }}
          />
        </div>
      </div>

      {/* ── Güç Etiketi ── */}
      {touched && value && (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            marginTop: '8px',
            fontSize: '12px',
            fontWeight: 600,
            color: strength?.score === 3 ? '#22c55e' : strength?.score === 2 ? '#eab308' : '#ef4444',
            transition: 'color 0.3s ease-out',
          }}
        >
          <span style={{
            display: 'inline-block',
            width: '6px',
            height: '6px',
            borderRadius: '50%',
            background: 'currentColor',
          }} />
          Şifre Gücü: {strength?.level}
        </div>
      )}

      {/* ── Kural Listesi ── */}
      {touched && (
        <div
          style={{
            marginTop: '10px',
            padding: '12px',
            background: 'rgba(22, 27, 34, 0.8)',
            border: '1px solid #30363D',
            borderRadius: '10px',
            display: 'flex',
            flexDirection: 'column',
            gap: '6px',
          }}
        >
          {results.map((rule) => {
            const isShaking = shakingRules.includes(rule.id) && !rule.passed;
            return (
              <div
                key={rule.id}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  fontSize: '12px',
                  fontWeight: 500,
                  color: rule.passed ? '#22c55e' : '#8B949E',
                  transition: 'color 0.25s ease',
                  animation: isShaking ? 'shake 0.4s ease' : 'none',
                }}
              >
                {/* Checkmark / Cross */}
                <span
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    width: '18px',
                    height: '18px',
                    borderRadius: '50%',
                    background: rule.passed ? 'rgba(34,197,94,0.15)' : 'rgba(139,148,158,0.1)',
                    border: `1.5px solid ${rule.passed ? '#22c55e' : '#30363D'}`,
                    fontSize: '10px',
                    fontWeight: 700,
                    transition: 'all 0.25s ease',
                    flexShrink: 0,
                  }}
                >
                  {rule.passed ? '✓' : '–'}
                </span>
                {rule.label}
              </div>
            );
          })}
        </div>
      )}

      {/* ── Shake Keyframes (inline) ── */}
      <style>{`
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          20%       { transform: translateX(-4px); }
          40%       { transform: translateX(4px); }
          60%       { transform: translateX(-3px); }
          80%       { transform: translateX(3px); }
        }
      `}</style>
    </div>
  );
};

export default PasswordStrengthInput;
