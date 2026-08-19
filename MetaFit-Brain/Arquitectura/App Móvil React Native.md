# 📱 App Móvil React Native

> App para afiliados — Expo SDK 55 + React Native 0.83

---

## 📁 Estructura

```
movil/
├── App.js                     # ThemeProvider + AuthProvider + AppNavigator
├── app.json                   # Config Expo (slug, paquete, plugins)
├── eas.json                   # EAS Build (dev, preview, production)
├── assets/images/
│   ├── favicon.png
│   ├── icon.png
│   └── logo-glow.png
└── src/
    ├── navigation/
    │   └── AppNavigator.js    # Stack auth + BottomTabs
    ├── screens/
    │   ├── LandingScreen.js
    │   ├── LoginScreen.js
    │   ├── RecuperarPasswordScreen.js
    │   ├── MiPerfilScreen.js
    │   ├── MiRutinaScreen.js
    │   ├── MiDietaScreen.js
    │   └── MiProgresoScreen.js
    ├── context/
    │   ├── AuthContext.js     # AsyncStorage para sesión
    │   └── ThemeContext.jsx   # Dark/Light con swapPalette
    ├── services/
    │   ├── api.js             # Axios + AsyncStorage interceptor
    │   └── notifications.js   # Expo Push Notifications
    └── theme.js               # COLORS, GRADIENTS, FONTS, SPACING
```

---

## 🔄 Navegación

```js
// Auth stack (sin token):
//   LandingScreen → LoginScreen → RecuperarPasswordScreen
//
// Main tabs (con token):
//   Perfil (MiPerfilScreen)
//   Rutina (MiRutinaScreen)
//   Dieta (MiDietaScreen)
//   Progreso (MiProgresoScreen)
//
// Tab bar: COLORS.bgSecondary, active=purpleLight, inactive=textMuted
// key={isDark ? 'd' : 'l'} → remontaje al cambiar tema
```

---

## 🔑 AuthContext (AsyncStorage)

```js
export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Restore session desde AsyncStorage
    const restore = async () => {
      const t = await AsyncStorage.getItem('token');
      const u = await AsyncStorage.getItem('user');
      if (t && u) { setToken(t); setUser(JSON.parse(u)); }
      setLoading(false);
    };
    restore();
  }, []);

  const login = useCallback(async (correo, contrasena) => {
    const { data } = await loginRequest({ correo, contrasena });
    await AsyncStorage.multiSet([
      ['token', data.accessToken],
      ['user', JSON.stringify(data.user)],
    ]);
    setToken(data.accessToken);
    setUser(data.user);
  }, []);

  const logout = useCallback(async () => {
    await AsyncStorage.multiRemove(['token', 'user', 'pushToken']);
    setToken(null);
    setUser(null);
  }, []);
}
```

---

## 🎨 Theme — Modo Oscuro/Claro

```js
// theme.js
export const COLORS = {
  bg: '#0a0a0f',           bgSecondary: '#12121e',    bgCard: '#1a1a2e',
  text: '#ffffff',         textSecondary: 'rgba(255,255,255,0.5)',
  red: '#e31c25',          purple: '#8b5cf6',
  success: '#059669',      warning: '#f59e0b',        error: '#e31c25',
  water: '#3b82f6',        check: '#10b981',
};

// ThemeContext.jsx — swapPalette muta COLORS en-lugar
const LIGHT_PALETTE = {
  bg: '#f2f4f9', bgSecondary: '#e9ecf4', bgCard: '#ffffff',
  text: '#0f172a', textSecondary: 'rgba(15,23,42,0.6)',
  border: 'rgba(15,23,42,0.1)', inputBg: '#ffffff',
};
export function swapPalette(isDark) {
  Object.assign(COLORS, isDark ? {} : LIGHT_PALETTE);
}
```

---

## 📡 API Client

```js
const API_URL = 'https://metafit-backend-rr18.onrender.com';

// Interceptor REQUEST: AsyncStorage → Authorization header
api.interceptors.request.use(async config => {
  const token = await AsyncStorage.getItem('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Interceptor RESPONSE: 401 → limpiar sesión
api.interceptors.response.use(
  res => res,
  async err => {
    if (err.response?.status === 401) {
      await AsyncStorage.multiRemove(['token', 'user', 'pushToken']);
    }
    return Promise.reject(err);
  }
);
```

---

## 🔔 Push Notifications

```js
// notifications.js
export async function activarPushNotifications() {
  const { status } = await Notifications.requestPermissionsAsync();
  if (status !== 'granted') return null;

  const token = await Notifications.getExpoPushTokenAsync({
    projectId: 'a5336580-cafa-4055-9614-00390522dd8a',
  });

  // Registrar en backend
  await api.put('/usuarios/me/push-token', { push_token: token.data });
  return token.data;
}
```

---

## 📦 Dependencias Principales

| Paquete | Versión | Uso |
|---|---|---|
| expo | ~55.0.28 | Runtime |
| react-native | 0.83.10 | UI framework |
| @react-navigation/native | 7.3.3 | Navegación |
| @react-native-async-storage | 2.2.0 | Storage local |
| expo-notifications | ~55.0.25 | Push notifications |
| expo-image-picker | — | Selección de fotos |
| axios | 1.18.0 | HTTP client |
| jest-expo | — | Tests |

---

## 📎 Notas Relacionadas

- [[Diagrama general]]
- [[Frontend React]]
- [[Paleta de colores]]
- [[Notificaciones]]
- [[Render]]
