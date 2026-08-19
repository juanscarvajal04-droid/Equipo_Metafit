# 📚 Lecciones Aprendidas

> Mejores prácticas descubiertas durante el desarrollo de MetaFit

---

## 🔒 Seguridad

### 1. Rate Limiting en Login
> Implementar rate limiting desde el primer día. 10 intentos / 15 min con `skipSuccessfulRequests: true` previene fuerza bruta sin bloquear usuarios legítimos.

### 2. JWT de Un Solo Uso para Reset
> Los tokens de recuperación de contraseña deben ser de un solo uso y expirar rápido (15 min). Guardar el hash en BD y marcar como usado en transacción.

### 3. Nunca Revelar si un Correo Existe
> El endpoint de recuperación siempre devuelve 200, independientemente de si el correo existe. Esto previene enumeration attacks.

### 4. CORS: Lista Blanca, No Wildcard
> `origin: '*'` es solo para desarrollo. En producción, usar lista explícita de dominios.

---

## 🏗️ Arquitectura

### 5. Migraciones Idempotentes al Arrancar
> Las migraciones JS (`ALTER TABLE ... ADD COLUMN IF NOT EXISTS`) permiten que el esquema evolucione sin scripts manuales. Se ejecutan al iniciar el servidor.

### 6. MySQL sin ORM = Control Total
> Usar `mysql2/promise` directo da control total sobre las queries, pero requiere disciplina con la sanitización de inputs y la estructura de modelos.

### 7. Patrón Fire-and-Forget para Correos
> Los correos transaccionales (bienvenida, facturas) se envían en un bloque `async` separado que no bloquea la respuesta HTTP. Si falla, la operación principal continúa.

```js
// Fire-and-forget
(async () => {
  await enviarCorreo(datos);
})();
return res.status(201).json(resultado);
```

---

## 🎨 Frontend

### 8. flushSync para Estados Críticos
> React 18 batching puede causar estados intermedios inconsistentes. Para auth y temas, usar `flushSync` para actualizaciones síncronas.

### 9. Lazy Init de useState
> Siempre inicializar estado desde localStorage con lazy init:
> ```jsx
> const [token, setToken] = useState(() => localStorage.getItem('token'));
> ```
> Esto evita race conditions en el primer render.

### 10. CSS Modules > CSS Global
> CSS Modules evita conflictos de nombres y permite estilos por componente. Combinado con Custom Properties para theming, es una combinación poderosa.

---

## 📱 Móvil

### 11. AsyncStorage para Persistencia
> En React Native, AsyncStorage es el equivalente a localStorage. Siempre usar `multiSet`/`multiRemove` para operaciones atómicas.

### 12. Remontaje al Cambiar Tema
> En React Navigation, usar `key={isDark ? 'd' : 'l'}` en el Navigator fuerza remontaje completo, evitando bugs visuales al cambiar de tema.

---

## 🚀 Despliegue

### 13. Docker All-in-One para MVP
> El patrón de embeber MariaDB en el mismo contenedor que Node.js funciona para MVPs y demos, pero no es recomendado para producción. Separar servicios en contenedores distintos.

### 14. Variables de Entorno como Contrato
> Crear `.env.example` desde el primer día como contrato documentado de todas las variables necesarias. Evita problemas en despliegue.

---

## 🧪 Testing

### 15. Tests por Módulo, No Monolíticos
> Mantener tests separados por módulo (frontend, backend, móvil) con sus propios frameworks (Vitest, Jest, jest-expo). Facilita el CI/CD paralelo.

---

## 📎 Notas Relacionadas

- [[Historial de bugs]]
- [[CI-CD]]
- [[Visión general]]
- [[Roadmap]]
