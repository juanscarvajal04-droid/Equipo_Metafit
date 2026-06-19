// ============================================================
// src/views/Login.jsx — MetaFit Auth View
//
// RESPONSABILIDAD: Vista pura (ISO 25000 - MVC / SoC)
//   ✅ Maneja únicamente: renderizado JSX + estado local de UI
//   ❌ NO contiene: llamadas a API, lógica de negocio, estilos inline
//
// Dependencias externas:
//   - authService.js  → toda la comunicación con el backend
//   - Login.css       → todos los estilos visuales
//   - AuthContext     → estado global de sesión
// ============================================================

import { useState, useEffect } from 'react';
import { useAuth }             from '../context/AuthContext';
import PublicLayout            from '../components/PublicLayout';
import {
  loginUser,
  persistUserRole,
  AVAILABLE_ROLES,
  ROLE_REDIRECT_MAP,
}                              from '../services/authService';
import                              './Login.css';

/* ── Mapa de clase CSS por rol (SoC: lógica visual, no estilo) ── */
const ROLE_SELECT_CLASS = {
  Administrador: 'login-form__select login-form__select--admin',
  Entrenador:    'login-form__select login-form__select--trainer',
  Recepcionista: 'login-form__select login-form__select--receptionist',
};

/* ────────────────────────────────────────────────────────────── */

export default function Login() {
  const { login } = useAuth();

  /* ── Estado local de UI ── */
  const [form, setForm] = useState({
    meta_user: '',
    meta_pass: '',
    rol:       'Administrador',
  });
  const [error,   setError]   = useState('');
  const [loading, setLoading] = useState(false);

  /**
   * Táctica anti-autocompletado del navegador:
   * el campo de contraseña se renderiza como "text" por 800 ms
   * y luego el interceptor onFocus lo convierte a "password".
   * Esto evita que los gestores de contraseñas rellenen el campo
   * antes de que el usuario interactúe.
   */
  const [passType, setPassType] = useState('text');
  const [isReady,  setIsReady]  = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setIsReady(true), 800);
    return () => clearTimeout(timer);
  }, []);

  /* ── Handlers de formulario ── */
  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
    setError('');
  };

  const handlePasswordFocus = () => setPassType('password');

  /**
   * handleSubmit: delega la autenticación a authService.
   * Si tiene éxito, persiste el rol y redirige según ROLE_REDIRECT_MAP.
   * En caso de error, muestra el mensaje correspondiente al status HTTP.
   */
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const userData = await login({
        correo:    form.meta_user,
        contrasena: form.meta_pass,
      });

      persistUserRole(userData?.role);

      const destino = ROLE_REDIRECT_MAP[userData?.role] || '/afiliados';
      window.location.href = destino;

    } catch (err) {
      const status = err?.response?.status;
      if (status === 400 || status === 401) {
        setError('Correo o contraseña incorrectos.');
      } else {
        setError('Error de conexión. Verifica que el servidor esté activo en el puerto 3001.');
      }
      setLoading(false);
    }
  };

  /* ── Clase dinámica del selector de rol ── */
  const selectClass = ROLE_SELECT_CLASS[form.rol] || 'login-form__select';

  /* ────────────────────────────── RENDER ────────────────────── */
  return (
    <PublicLayout>
      <div className="login-wrapper">

        {/* ── Glow radial de fondo ── */}
        <div className="login-bg-glow" aria-hidden="true" />

        {/* ── Card principal ── */}
        <div className="login-card">

          {/* ── Cabecera ── */}
          <div className="login-card__header">
            <div className="login-card__header-circle--top"  aria-hidden="true" />
            <div className="login-card__header-circle--bottom" aria-hidden="true" />
            <div className="login-card__icon" aria-hidden="true">💪</div>
            <h1 className="login-card__title">MetaFit</h1>
            <p  className="login-card__subtitle">Sistema de Gestión Deportiva</p>
          </div>

          {/* ── Cuerpo ── */}
          <div className="login-card__body">
            <h2 className="login-card__body-title">Iniciar Sesión</h2>

            {/* Mensaje de error */}
            {error && (
              <div className="login-error" role="alert">
                ⚠️ {error}
              </div>
            )}

            <form onSubmit={handleSubmit} noValidate autoComplete="off">

              {/* Honeypots anti-autocompletado */}
              <input
                className="login-form__honeypot"
                type="text"
                name="username_trap"
                tabIndex={-1}
                aria-hidden="true"
                autoComplete="username"
                readOnly
              />
              <input
                className="login-form__honeypot"
                type="password"
                name="password_trap"
                tabIndex={-1}
                aria-hidden="true"
                autoComplete="current-password"
                readOnly
              />

              {/* ── Selector de Rol ── */}
              <div className="login-form__group">
                <label htmlFor="rol" className="login-form__label">
                  Tipo de usuario
                </label>
                <select
                  id="rol"
                  name="rol"
                  value={form.rol}
                  onChange={handleChange}
                  className={selectClass}
                >
                  {AVAILABLE_ROLES.map((r) => (
                    <option key={r.value} value={r.value} className="login-form__option">
                      {r.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* ── Carga diferida (anti-autocompletado) ── */}
              {!isReady ? (
                <div className="login-skeleton" aria-label="Cargando formulario...">
                  <div className="login-spinner" role="status" />
                </div>
              ) : (
                <>
                  {/* ── Email ── */}
                  <div className="login-form__group">
                    <label htmlFor="meta_user" className="login-form__label">
                      Correo Electrónico
                    </label>
                    <input
                      type="text"
                      id="meta_user"
                      name="meta_user"
                      value={form.meta_user}
                      onChange={handleChange}
                      placeholder="Ingresa tu correo electrónico"
                      className="login-form__input"
                      required
                      autoComplete="new-password"
                    />
                  </div>

                  {/* ── Contraseña ── */}
                  <div className="login-form__group login-form__group--last">
                    <label htmlFor="meta_pass" className="login-form__label">
                      Contraseña
                    </label>
                    <input
                      type={passType}
                      id="meta_pass"
                      name="meta_pass"
                      value={form.meta_pass}
                      onChange={handleChange}
                      onFocus={handlePasswordFocus}
                      placeholder="Ingresa tu contraseña"
                      className="login-form__input"
                      required
                      autoComplete="new-password"
                    />
                  </div>
                </>
              )}

              {/* ── Botón de submit ── */}
              <button
                id="btn-login"
                type="submit"
                disabled={loading || !isReady}
                className="login-btn"
              >
                {loading ? (
                  <>
                    <div className="login-spinner login-spinner--sm" role="status" aria-label="Iniciando sesión..." />
                    Ingresando...
                  </>
                ) : (
                  <>
                    Ingresar al Sistema
                    <span className="login-btn__arrow" aria-hidden="true">→</span>
                  </>
                )}
              </button>

            </form>
          </div>

          {/* ── Footer del card ── */}
          <div className="login-card__footer">
            MetaFit v1.0 &nbsp;·&nbsp; {new Date().getFullYear()} &nbsp;·&nbsp; Sport Gym Sede 80
          </div>

        </div>
      </div>
    </PublicLayout>
  );
}