# 🔄 CI/CD

> GitHub Actions — 74 tests automatizados

---

## 📄 Pipeline (.github/workflows/ci.yml)

```yaml
# Ejecuta en cada push y PR a main
# 3 jobs en paralelo:
#   1. test-frontend  → vitest (30 tests)
#   2. test-backend   → jest (25 tests)
#   3. test-movil     → jest (19 tests)
```

---

## 🧪 Tests por Módulo

| Módulo | Framework | Tests | Comando |
|---|---|---|---|
| **Frontend** | Vitest + Testing Library + jsdom | 30 | `npm run test` |
| **Backend** | Jest + supertest | 25 | `npm test` |
| **Móvil** | Jest + jest-expo + Testing Library RN | 19 | `npm test` |
| **Total** | — | **74** | — |

---

## 📦 Scripts de Test

### Frontend (Vite)
```json
"scripts": {
  "test": "vitest run",
  "test:watch": "vitest"
}
```

### Backend (Node.js)
```json
"scripts": {
  "test": "jest --runInBand --forceExit"
}
```

### Móvil (Expo)
```json
"scripts": {
  "test": "jest",
  "test:watch": "jest --watch"
}
```

---

## 📚 Storybook

```json
"scripts": {
  "storybook": "storybook dev -p 6006",
  "build-storybook": "storybook build"
}
```

5 historias documentadas:
- Badge
- Button
- Card
- Modal
- Avatar

---

## ⚠️ Notas

- **No hay deploy automático** — el despliegue en Render es manual o por webhook
- **No hay linting en CI** — considerar agregar ESLint al pipeline
- Los tests corren en paralelo para mayor velocidad

---

## 📎 Notas Relacionadas

- [[Render]]
- [[Frontend React]]
- [[Backend Node.js]]
- [[App Móvil React Native]]
