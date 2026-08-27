# 🐛 Historial de Bugs

> Bugs conocidos y cómo se resolvieron

---

## BUG-001: CORS bloqueado en red SENA

**Síntoma:** El frontend no podía comunicarse con el backend desde otra máquina en la red del SENA.

**Causa:** CORS configurado con whitelist estricta que solo incluía localhost.

**Solución:** Temporalmente se abrió a `origin: '*'` para pruebas en red. La configuración correcta está comentada en `server.js`:
```js
// app.use(cors({ origin: '*' }));  // Temporal para pruebas en red
// Configuración correcta:
// const DEFAULT_CORS_ORIGIN = [
//   'https://metafit-frontend-78x6.onrender.com',
//   'http://localhost:5173',
// ].join(',');
```

**Estado:** Pendiente reactivar whitelist para producción.

---

## BUG-003: Content-Type falso negativo

**Síntoma:** Requests POST/PUT fallaban con 415 incluso enviando JSON válido.

**Causa:** El middleware de validación de Content-Type no excluía las rutas de Swagger.

**Solución:** Se agregó bypass para paths de Swagger:
```js
const isSwaggerPath = req.path.startsWith('/api-docs') || req.path.startsWith('/swagger');
```

---

## BUG-004: React 18 batching causaba estado inconsistente

**Síntoma:** Al hacer login, el estado de auth no se actualizaba a tiempo, causando parpadeos o redirects incorrectos.

**Causa:** React 18 batching de state updates causaba que `setToken` y `setUser` se ejecutaran de forma asíncrona.

**Solución:** Se usó `flushSync` de React 18 para forzar actualizaciones síncronas:
```jsx
flushSync(() => {
  setToken(accessToken);
  setUser(userData);
  setIsAuthReady(true);
});
```

---

## BUG-005: Race condition con localStorage

**Síntoma:** Al recargar la página, ProtectedRoute no encontraba el token porque aún no se había leído de localStorage.

**Causa:** El estado inicial de `token` era `null` antes de completar la lectura de localStorage.

**Solución:** Lazy initialization de useState con lectura síncrona:
```jsx
const [token, setToken] = useState(() => loadStoredToken() || null);
const [user, setUser] = useState(() => loadStoredUser());
```
Más fallback en ProtectedRoute:
```jsx
const token = ctxToken || localStorage.getItem("metafit_token");
```

---

## BUG-006: Tema oscuro/claro no persiste en móvil

**Síntoma:** Al cerrar y abrir la app, el tema volvía al modo oscuro.

**Causa:** `swapPalette` mutaba `COLORS` en-lugar pero no guardaba la preferencia.

**Solución:** Se agregó persistencia con AsyncStorage y se usa `key={isDark ? 'd' : 'l'}` en el Navigator para forzar remontaje completo al cambiar tema.

---

## BUG-007: Admin podía desactivarse a sí mismo

**Síntoma:** Un admin podía hacer `DELETE` o `PATCH` con `estado: 'Inactivo'` sobre su propio usuario.

**Solución:** Se agregó validación en el controller:
```js
// Admin no puede desactivarse a sí mismo
if (req.user.sub == id && body.estado === 'Inactivo') {
  return res.status(400).json({ error: 'No puedes desactivarte a ti mismo' });
}
```

---

## 📎 Notas Relacionadas

- [[Lecciones aprendidas]]
- [[Backend Node.js]]
- [[Frontend React]]
- [[App Móvil React Native]]
