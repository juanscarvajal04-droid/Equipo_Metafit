# 🗺️ Roadmap

> Estado actual y próximos pasos del proyecto MetaFit

---

## ✅ v1.0 — Completado

- [x] Backend Node.js con Express y MySQL
- [x] CRUD de afiliados con transacciones
- [x] Autenticación JWT con roles (RBAC)
- [x] Planes de entrenamiento y nutrición
- [x] Catálogo de ejercicios, alimentos y restricciones
- [x] Registro de pagos con facturación por correo
- [x] Frontend React con 10 vistas
- [x] Docker Compose para desarrollo local
- [x] Swagger UI para documentación de API
- [x] phpMyAdmin para inspección de BD

## ✅ v2.0 — Completado

- [x] App móvil React Native (Expo) para afiliados
- [x] Push notifications (Expo Push Token)
- [x] Fotos de perfil (Cloudinary + fallback local)
- [x] Seguimiento diario (ejercicios, agua, alimentos)
- [x] Modo oscuro/claro en web y móvil
- [x] Cron de recordatorios de pago (cada hora)
- [x] Migraciones JavaScript idempotentes (al arrancar)
- [x] Dashboard con KPIs (afiliados, ciclos, restricciones, objetivos)
- [x] Finanzas admin (ingresos por mes, métricas por recepcionista)
- [x] GA4 + Google Tag Manager
- [x] Storybook (5 historias: Badge, Button, Card, Modal, Avatar)
- [x] 74 tests verdes (30 FE + 25 BE + 19 Móvil)
- [x] CI/CD con GitHub Actions
- [x] Despliegue en Render (BE) + Railway (DB)

## 🔜 v2.1 — Próximo

- [ ] Reactivar CORS whitelist (actualmente `origin: '*'`)
- [ ] Crear `.env.example` con todas las variables documentadas
- [ ] Despliegue del frontend en Render (build + nginx)
- [ ] Tests de integración E2E con Playwright
- [ ] Rate limiting en endpoints além de `/login`
- [ ] Paginación del frontend (actualmente carga todo)

## 💡 v3.0 — Futuro

- [ ] PWA para el frontend web
- [ ] Suscripciones in-app (Google Play / App Store)
- [ ] Chat entre entrenador y afiliado
- [ ] Exportación de planes en PDF
- [ ] Gamificación (logros, rachas, rankings)
- [ ] Dashboard analytics con filtros por rango de fechas
- [ ] Backup automático de MySQL a S3

---

## 📎 Notas Relacionadas

- [[Visión general]]
- [[Historial de bugs]]
- [[CI-CD]]
- [[Render]]
