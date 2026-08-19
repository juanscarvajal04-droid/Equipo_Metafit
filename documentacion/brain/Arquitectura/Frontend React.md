# ⚛️ Frontend React

> Panel de administración — React 19 + Vite 6 — Puerto 5173

---

## 📁 Estructura

```
frontend_web/src/
├── App.jsx                    # HashRouter + RBAC + lazy loading
├── main.jsx                   # Entry point
├── index.css                  # Tokens CSS globales (dark/light) — 329 líneas
├── App.css                    # Estilos base
├── components/
│   ├── AppLayout.jsx          # Layout: Sidebar + Header + contenido + Footer
│   ├── Sidebar.jsx            # Navegación RBAC por rol
│   ├── Header.jsx             # Breadcrumb, tema, notificaciones, avatar
│   ├── ProtectedRoute.jsx     # Guard RBAC con role redirect
│   ├── Footer.jsx
│   ├── PublicLayout.jsx       # Layout rutas públicas
│   └── ErrorBoundary.jsx
├── views/
│   ├── LandingPage.jsx        # Landing pública (956 líneas CSS)
│   ├── Login.jsx
│   ├── RecuperarPassword.jsx
│   ├── ResetPassword.jsx
│   ├── AdminDashboard.jsx     # KPIs + gráficas Chart.js
│   ├── AfiliadosView.jsx      # CRUD completo
│   ├── GestionPersonal.jsx    # CRUD staff
│   ├── RutinasView.jsx        # Planes de entrenamiento
│   ├── DietasView.jsx         # Planes nutricionales
│   ├── PagosView.jsx          # Pagos por afiliado
│   └── FinanzasView.jsx       # Métricas admin
├── context/
│   └── AuthContext.jsx        # Token + user + flushSync
├── hooks/
│   ├── useAfiliados.js        # CRUD afiliados
│   ├── useDashboard.js        # KPIs dashboard
│   └── useToast.js            # Notificaciones toast
├── services/
│   ├── api.js                 # Axios client + interceptors JWT
│   ├── authService.js         # Login, persistencia, roles
│   └── afiliadosService.js    # Helpers de afiliados + constantes
├── utils/
│   ├── theme.js               # Toggle dark/light (localStorage)
│   └── analytics.js           # GA4 via GTM (dataLayer)
└── stories/
    ├── metaFit.stories.jsx    # 5 historias Storybook
    └── metaFit.css
```

---

## 🔐 RBAC — Control de Acceso por Rol

```jsx
// App.jsx
const ADMIN = ["Administrador"];
const ADMIN_RECEP = ["Administrador", "Recepcionista"];
const ADMIN_TRAIN = ["Administrador", "Entrenador"];
const ALL_ROLES = ["Administrador", "Recepcionista", "Entrenador"];

// Rutas protegidas con code-splitting:
<Route element={<ProtectedRoute allowedRoles={ADMIN} />}>
  <Route path="/dashboard" element={<AdminDashboard />} />
  <Route path="/personal" element={<GestionPersonal />} />
  <Route path="/finanzas" element={<FinanzasView />} />
</Route>
```

### ProtectedRoute.jsx

```jsx
const ROLE_HOME = {
  Administrador: "/dashboard",
  Recepcionista: "/afiliados",
  Entrenador:    "/rutinas",
};

export default function ProtectedRoute({ allowedRoles }) {
  const { token, user, isAuthReady } = useAuth();
  if (!isAuthReady) return <AuthSpinner />;
  if (!token || !user) return <Navigate to="/login" replace />;
  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return <Navigate to={ROLE_HOME[user.role] || "/login"} replace />;
  }
  return <Outlet />;
}
```

---

## 🔑 AuthContext

```jsx
export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => loadStoredUser());
  const [token, setToken] = useState(() => loadStoredToken());

  const login = async ({ correo, contrasena }) => {
    const { accessToken, user } = await loginUser({ correo, contrasena });
    persistSession(accessToken, user);        // localStorage primero
    flushSync(() => {                          // fuerza setState síncrono
      setToken(accessToken);
      setUser(user);
    });
    return user;
  };

  return (
    <AuthContext.Provider value={{ user, token, login, logout, authAxios }}>
      {children}
    </AuthContext.Provider>
  );
}
```

---

## 📡 API Client (services/api.js)

```jsx
const BASE_URL = import.meta.env.VITE_API_URL || 'https://metafit-backend-rr18.onrender.com';
const api = axios.create({ baseURL: BASE_URL, timeout: 10000 });

// Interceptor REQUEST: inyecta JWT desde localStorage
api.interceptors.request.use(config => {
  const token = localStorage.getItem('metafit_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Interceptor RESPONSE: manejo 401 global (excepto /login)
api.interceptors.response.use(
  res => res,
  err => {
    if (err.response?.status === 401 && !err.config.url.includes('/login')) {
      clearSession();
      window.location.hash = '#/login';
    }
    return Promise.reject(err);
  }
);
```

---

## 📦 Navegación por Rol (Sidebar)

```jsx
const NAV_OPERATIVO = {
  Administrador: [
    { to: "/dashboard", label: "Dashboard" },
    { to: "/finanzas",  label: "Finanzas" },
    { to: "/afiliados", label: "Afiliados" },
    { to: "/rutinas",   label: "Rutinas" },
    { to: "/dietas",    label: "Dietas" },
  ],
  Recepcionista: [
    { to: "/afiliados", label: "Gestión de Afiliados" },
    { to: "/pagos",     label: "Pagos" },
  ],
  Entrenador: [
    { to: "/rutinas",   label: "Planes de Entreno" },
    { to: "/dietas",    label: "Dietas" },
    { to: "/afiliados", label: "Afiliados (Ver)" },
  ],
};
```

---

## 📦 Dependencias Principales

| Paquete | Versión | Uso |
|---|---|---|
| react | 19.2.4 | UI library |
| react-router-dom | 7.14.0 | HashRouter + RBAC |
| axios | 1.14.0 | HTTP client |
| bootstrap | 5.3.8 | CSS base |
| chart.js | 4.5.1 | Gráficas dashboard |
| jspdf | — | Exportación PDF |
| lucide-react | 0.511.0 | Iconos |
| vitest | 4.1.10 | Tests |
| storybook | 10.5.7 | Documentación componentes |

---

## 📎 Notas Relacionadas

- [[Diagrama general]]
- [[Backend Node.js]]
- [[Paleta de colores]]
- [[Tokens CSS]]
- [[Favicon e iconos]]
- [[CI-CD]]
