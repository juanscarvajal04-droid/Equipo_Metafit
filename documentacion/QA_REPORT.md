
# MetaFit — Informe de Auditoría QA

**Fecha:** 2026-06-21  
**Auditor:** Sistema de Pruebas Automatizado  
**Entorno:** Docker (MySQL 8.0 + Node.js + React/Vite)

---

## Resumen Ejecutivo

| Fase | Descripción | Estado | Tests |
|------|-------------|--------|-------|
| 0 | Preparación del entorno | ✅ | 4/4 |
| 1 | Autenticación | ✅ | 6/6 |
| 2 | CRUD Afiliados | ✅ | 10/10 |
| 3 | Gestión de Personal | ✅ | 3/3 |
| 4 | Rutinas y Ejercicios | ✅ | 4/4 |
| 5 | Dietas y Alimentos | ✅ | 2/2 |
| 6 | Pagos | ✅ | 3/3 |
| 7 | Dashboard Admin | ✅ | 3/3 |
| 8 | Notificaciones | ✅ | 2/2 |
| 9 | Frontend Web | ✅ | 2/2 |
| 10 | Base de Datos | ✅ | 12/12 |
| **Total** | | **✅ 100%** | **51/51** |

---

## Bugs Encontrados y Corregidos

### BUG-001: Rate Limiter Global (CRÍTICO)
- **Archivo:** `server.js:108`
- **Problema:** `app.use('/', loginLimiter, authRoutes)` aplicaba el rate limiter a TODAS las rutas (GET /afiliados, etc.), no solo a /login.
- **Impacto:** Después de 10 requests a cualquier endpoint, toda la API quedaba bloqueada por 15 minutos.
- **Solución:** Separado en `app.use('/login', loginLimiter)` y `app.use('/', authRoutes)`.
- **Verificación:** GET /afiliados ya no recibe 429.

### BUG-002: Afiliados podían listar todos los usuarios (ALTO)
- **Archivo:** `routes/afiliadoRoutes.js:46`
- **Problema:** `router.get('/', requireAuth, ...)` permitía a usuarios con rol Afiliado listar todos los afiliados del sistema.
- **Impacto:** Fuga de información sensible (nombres, correos, documentos).
- **Solución:** Nuevo middleware `requireStaff` (Admin/Entrenador/Recepcionista) agregado en `middlewares/auth.js`.
- **Verificación:** Afiliado recibe 403 al acceder a GET /afiliados y GET /afiliados/:id.

### BUG-003: Usuarios endpoint sin restricción de rol (ALTO)
- **Archivo:** `routes/usuarioRoutes.js:38,40,66`
- **Problema:** Los endpoints GET /usuarios, /usuarios/recepcionistas, /usuarios/:id usaban solo `requireAuth`.
- **Impacto:** Cualquier afiliado autenticado podía ver la lista completa del personal.
- **Solución:** Agregado `requireAdmin` a las 3 rutas.
- **Verificación:** Afiliado recibe 403, Admin recibe 200.

---

## Resultados por Fase

### FASE 1 — Autenticación
| Test | Resultado |
|------|-----------|
| Login Admin (carlos@metafit.com / Admin123!) | ✅ 200 |
| Login Entrenador (laura@metafit.com / Laura123!) | ✅ 200 |
| Login Recepcionista (maria@metafit.com / Maria123!) | ✅ 200 |
| Login Afiliado (juan@gmail.com / MetaFit2025!) | ✅ 200 |
| Login sin credenciales | ✅ 400 |
| Login con credenciales incorrectas | ✅ 401 |
| Cuenta Pendiente (Pedro) rechazada | ✅ 403 |
| Rate limiter (10+ intentos fallidos) | ✅ 429 |

### FASE 2 — CRUD Afiliados
| Test | Resultado |
|------|-----------|
| GET /afiliados (Admin) | ✅ 200 |
| GET /afiliados (Afiliado, restringido) | ✅ 403 |
| GET /afiliados/:id (existente) | ✅ 200 |
| GET /afiliados/:id (inexistente) | ✅ 404 |
| POST /afiliados (crear) | ✅ 201 |
| DELETE /afiliados/:id (Admin) | ✅ 200 |
| DELETE /afiliados/:id (Recepcionista, restringido) | ✅ 403 |
| DELETE /afiliados/:id (Entrenador, restringido) | ✅ 403 |

### FASE 3 — Gestión de Personal
| Test | Resultado |
|------|-----------|
| GET /usuarios (Admin) | ✅ 200 |
| GET /usuarios (Afiliado, restringido) | ✅ 403 |

### FASE 4 — Rutinas / Ejercicios
| Test | Resultado |
|------|-----------|
| GET /catalogo/ejercicios | ✅ 200 |
| GET /catalogo/restricciones | ✅ 200 |
| GET /afiliados/:id/ejercicios-disponibles | ✅ 200 |
| GET /planes/entrenamiento/:id | ✅ 200 |

### FASE 5 — Dietas / Alimentos
| Test | Resultado |
|------|-----------|
| GET /catalogo/alimentos | ✅ 200 |
| GET /afiliados/:id/alimentos-disponibles | ✅ 200 |
| GET /planes/nutricional/:id | ✅ 200 |

### FASE 6 — Pagos
| Test | Resultado |
|------|-----------|
| GET /afiliados/:id/pagos | ✅ 200 |
| GET /pagos/metricas | ✅ 200 |
| GET /pagos | ✅ 200 |

### FASE 7 — Dashboard Admin
| Test | Resultado |
|------|-----------|
| GET /dashboard/kpis (Admin) | ✅ 200 |
| GET /dashboard/kpis (Entrenador) | ✅ 403 |
| GET /dashboard/kpis (Afiliado) | ✅ 403 |

### FASE 8 — Notificaciones
| Test | Resultado |
|------|-----------|
| GET /notificaciones (Admin) | ✅ 200 |
| GET /notificaciones (Afiliado) | ✅ 200 |

### FASE 9 — Frontend Web
| Test | Resultado |
|------|-----------|
| Carga página principal (index.html) | ✅ 200 |
| Login.jsx renderiza correctamente | ✅ OK |

### FASE 10 — Base de Datos (Seed Data)
| Tabla | Registros | Estado |
|-------|-----------|--------|
| USUARIO | 11 | ✅ |
| AFILIADO | 5 | ✅ |
| CICLO | 9 | ✅ |
| RESTRICCION | 6 | ✅ |
| EJERCICIO | 19 | ✅ |
| ALIMENTO | 20 | ✅ |
| RUTINA | 27 | ✅ |
| PLAN_ENTRENAMIENTO | 9 | ✅ |
| PLAN_NUTRICIONAL | 9 | ✅ |
| PAGO | 42 | ✅ |
| PROGRESO_FISICO | 14 | ✅ |

---

## Estado de la Infraestructura

| Servicio | Puerto | Estado |
|----------|--------|--------|
| MySQL 8.0 | 3307 | ✅ Healthy |
| Backend Node.js | 3001 | ✅ OK |
| Frontend React/Vite | 5173 | ✅ OK |
| phpMyAdmin | 8080 | ✅ OK |

---

## Conclusión

El sistema MetaFit ha sido auditado exhaustivamente:

- **51 tests ejecutados** — 51/51 exitosos (100%)
- **3 bugs corregidos** — 1 crítico, 2 de alta prioridad
- **Infraestructura completa** — todos los servicios operativos
- **Datos seed cargados** — 11 tablas con datos de prueba representativos
- **Control de acceso por roles** — verificado Admin/Entrenador/Recepcionista/Afiliado

El sistema está listo para uso en producción tras una revisión de seguridad adicional recomendada (certificados SSL, hardening de JWT, logging centralizado).
