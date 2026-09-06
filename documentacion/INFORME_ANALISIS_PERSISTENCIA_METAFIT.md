# INFORME DE ANÁLISIS — METAFIT

**Fecha:** 2026-09-06
**Rama analizada:** `feature/sofia-astudillo`
**Autor del análisis:** Automatizado (opencode)

---

## 1. RESUMEN EJECUTIVO

| Aspecto | Estado |
|---------|--------|
| Repositorio | ✅ Limpio, 1 commit sin push (docs: README APK) |
| Contenedores locales | ✅ 5/5 Up (db, backend, frontend, phpmyadmin, n8n) |
| Base de datos | ✅ 29 tablas + 5 vistas, columnas nuevas confirmadas |
| Persistencia de datos | ✅ Editar, crear, foto y ejercicio todo persiste |
| Coherencia web↔móvil↔BD | ✅ Cambios en web se ven en móvil y viceversa |
| Producción (Render) | ✅ Backend 200, Frontend 200, Login OK, env vars OK |
| APK en web | ✅ Link correcto (EAS/Expo, 94.8 MB, descargable) |
| Config portátil | ✅ .env.example, docker-compose, README, scripts |
| **¿Listo para sustentación?** | **✅ Sí** |

---

## 2. ESTADO DEL REPOSITORIO

- **Rama actual:** `feature/sofia-astudillo`
- **Último commit:** `d104cf3` — docs: actualizar README de APK para reflejar descarga via build EAS (Expo)
- **Commits sin pushear:** 1 (`d104cf3`)
- **Archivos modificados:** Ninguno (`nothing to commit, working tree clean`)

**Últimos 5 commits:**
```
d104cf3 docs: actualizar README de APK para reflejar descarga via build EAS (Expo)
32b3f72 fix: actualizar enlace de descarga APK en LandingPage y documentacion
1b84156 feat: completar FASES A–E — perfil editable online, macros al consumir, rutina por día
52ea819 feat: actualizar APK FASE 3 y añadir eas-cli como devDependency
6d76920 Merge branch 'feature/sofia-astudillo'
```

---

## 3. CONTENEDORES LOCALES

| Servicio | Contenedor | Puerto | Estado |
|----------|-----------|--------|--------|
| MariaDB 11 | metafit_db | 3307→3306 | ✅ Up (healthy) |
| Backend Node.js | metafit_backend | 3001 | ✅ Up |
| Frontend React | metafit_frontend | 5173 | ✅ Up |
| phpMyAdmin | metafit_phpmyadmin | 8080 | ✅ Up |
| n8n | metafit_n8n | 5678 | ✅ Up |

Todos los servicios respondiendo 200 en sus puertos asignados.

---

## 4. BASE DE DATOS

### 4.1 Tablas existentes (29 + 5 vistas)

```
AFILIADO                    ALIMENTO                         ALIMENTO_RESTRICCION_EXCLUIDA
AFILIADO_RESTRICCION        CICLO                            CONFIGURACION
CONSUMO_ALIMENTO_DIARIO     CONSUMO_ALIMENTO_REAL            DETALLE_NUTRICIONAL
EJERCICIO                   EJERCICIO_RESTRICCION_EXCLUIDA   PAGO
PASSWORD_RESET              PLAN_ENTRENAMIENTO               PLAN_NUTRICIONAL
PROGRESO_DIARIO             PROGRESO_EJERCICIO_DIARIO        PROGRESO_FISICO
REGISTRO_AGUA               REGISTRO_EJERCICIO               RESTRICCION
RUTINA                      RUTINA_EJERCICIO                 USUARIO

Vistas: v_alimento_calorias, v_catalogo_ejercicios_disponibles,
        v_ciclo_activo_afiliado, v_perfil_afiliado, v_ultimo_progreso
```

### 4.2 Columnas nuevas confirmadas

| Tabla | Columna | Tipo |
|-------|---------|------|
| AFILIADO | `foto` | varchar(255) |
| USUARIO | `push_token` | varchar(255) |

### 4.3 Datos de prueba existentes

| Tabla | Registros |
|-------|-----------|
| USUARIO | 13 |
| AFILIADO | 8 |
| CICLO | 12 |
| REGISTRO_EJERCICIO | 10 |
| CONSUMO_ALIMENTO_DIARIO | 24 |
| CONSUMO_ALIMENTO_REAL | 24 |
| PROGRESO_FISICO | 16 |
| PROGRESO_EJERCICIO_DIARIO | 35 |
| RUTINA_EJERCICIO | 98 |
| PAGO | 42 |
| REGISTRO_AGUA | 5 |
| PROGRESO_DIARIO | 4 |

**Estado:** ✅ Tablas pobladas con datos de prueba realistas.

---

## 5. PERSISTENCIA DE DATOS

### 5.1 Editar perfil (móvil → BD)

| Paso | Resultado |
|------|-----------|
| Login local Juan (`juan@gmail.com`) | ✅ Token JWT generado |
| Phone original en BD | `3001234567` |
| PATCH `/afiliados/me` → phone=`3009999999` | ✅ API responde 200 |
| Verificar en BD | `3009999999` persistido, `fecha_ultima_modificacion` actualizada |

**Resultado:** ✅ Persistencia móvil→BD confirmada.

### 5.2 Editar perfil (web admin → BD → móvil)

| Paso | Resultado |
|------|-----------|
| Login admin local (`carlos@metafit.com`) | ✅ Token JWT generado |
| Admin PATCH `/afiliados/6` → phone=`3001234567` | ✅ API responde 200 |
| Verificar en BD | `3001234567` restaurado |
| Re-leer via `/afiliados/me` (móvil) | ✅ phone=`3001234567` |

**Resultado:** ✅ Web admin→BD→móvil coherente.

### 5.3 Crear afiliado desde web

| Paso | Resultado |
|------|-----------|
| POST `/afiliados` (admin token, payload completo) | ✅ Creado id=203 |
| Verificar en USUARIO | ✅ Registro insertado |
| Verificar en AFILIADO | ✅ Registro insertado (documento, telefono) |
| DELETE `/afiliados/203` (cleanup) | ✅ Eliminado, 0 registros restantes |

**Resultado:** ✅ Crear desde web persiste en BD.

### 5.4 Subir foto de perfil

| Paso | Resultado |
|------|-----------|
| POST `/afiliados/me/foto` (multipart, imagen PNG) | ✅ Responde con URL `/uploads/...` |
| Verificar AFILIADO.foto en BD | `/uploads/1788710988804-5c780b7f.png` |
| Verificar archivo en disco del contenedor | ✅ 69 bytes en `uploads/` |
| Cleanup: foto=NULL + borrar archivo | ✅ Restaurado |

**Resultado:** ✅ Foto persiste (disco local; en producción → Cloudinary).

### 5.5 Registrar ejercicio real

| Paso | Resultado |
|------|-----------|
| POST `/afiliados/me/registro-ejercicio` (payload válido) | ✅ Creado id_registro=11 |
| Verificar en BD | ✅ `REGISTRO_EJERCICIO` row existente |
| PROGRESO_DIARIO sincronizado | ✅ id=5, ejercicios_realizados=1 |
| Cleanup: DELETE registros de prueba | ✅ Eliminados |

**Resultado:** ✅ Registro de ejercicio persiste y sincroniza progreso diario.

---

## 6. APK EN WEB

- **Enlace en LandingPage.jsx (línea 530):**
  `https://expo.dev/artifacts/eas/3mCh0-T8CEI3jK_APZUO6rM6-Al1ryP4kxRezmF-i7k.apk`
- **Última versión:** ✅ (build EAS/Expo actualizada)
- **Descarga desde producción:** ✅ HTTP 200, 94,876,132 bytes (94.8 MB)
- **README actualizado:** ✅ (`d104cf3` — refleja descarga vía EAS)

---

## 7. RENDER Y PRODUCCIÓN

### 7.1 Servicios en Render

| Servicio | Tipo | URL | Estado |
|----------|------|-----|--------|
| metafit-frontend | static_site | https://metafit-frontend-78x6.onrender.com | ✅ 200, not_suspended |
| metafit-backend-rr18 | web_service (Docker) | https://metafit-backend-rr18.onrender.com | ✅ 200, not_suspended |
| Equipo_Metafit (legacy) | web_service | https://equipo-metafit.onrender.com | ✅ not_suspended |

### 7.2 Health check backend

```json
{"status":"ok","db":"MySQL conectado","timestamp":"2026-09-06T15:52:53.198Z"}
```

### 7.3 Login en producción

| Credencial | Token | Rol |
|------------|-------|-----|
| `carlos@metafit.com` / `Admin123!` | ✅ JWT válido (8h) | Administrador |
| `juan@gmail.com` / `MetaFit2025!` | ✅ JWT válido (8h) | Afiliado |

### 7.4 Variables de entorno del backend (producción)

| Variable | Valor |
|----------|-------|
| NODE_ENV | production |
| PORT | 3001 |
| DB_HOST | localhost (en el container) |
| DB_NAME | metafit |
| DB_SSL | false |
| JWT_SECRET | ✅ Configurado |
| JWT_EXPIRES_IN | 8h |
| CORS_ORIGINS | * |
| CLOUDINARY_CLOUD_NAME | llaq9vyl ✅ |
| CLOUDINARY_API_KEY | ✅ Configurado |
| CLOUDINARY_API_SECRET | ✅ Configurado |
| BREVO_API_KEY | ✅ Configurado |
| SMTP_HOST | smtp-relay.sendinblue.com |
| FRONTEND_URL | https://metafit-frontend-78x6.onrender.com |

**Estado:** ✅ Todas las variables configuradas correctamente.

---

## 8. CONFIGURACIÓN PARA CUALQUIER EQUIPO

| Verificación | Estado | Notas |
|--------------|--------|-------|
| Variables de entorno portables | ✅ | `.env.example` con las 12 variables necesarias; `.env` para valores reales |
| `docker-compose.yml` funciona | ✅ | 5 servicios, DB Persistent (`metafit_db_data`), networks, healthchecks |
| Scripts de inicio (`start.sh`) | ✅ | `backend/start.sh` (100644) y `start-tunnel.sh` (100755 ejecutable) |
| README con instrucciones | ✅ | 183 líneas: instalación local, Docker, puertos, credenciales, tests, Postman |
| Dockerfiles | ✅ | Presentes en `backend/` y `frontend_web/` |

**Observación menor:** `backend/start.sh` tiene modo `100644` (no ejecutable). No es crítico porque se invoca vía `bash start.sh` en el Dockerfile, pero para portabilidad completa en Linux podría mejorarse con `chmod +x` o un alias en el compose.

---

## 9. PROBLEMAS ENCONTRADOS

| # | Severidad | Descripción |
|---|-----------|-------------|
| 1 | 🟡 Menor | **1 commit sin pushear** (`d104cf3` — README APK). Pushear antes de sustentación para que Render haga deploy automático (si hay auto-deploy en la rama). |
| 2 | 🟡 Menor | **Servicio legacy** `Equipo_Metafit` en `equipo-metafit.onrender.com` sigue activo. Podría confundir; considerar suspenderlo si no se usa. |
| 3 | 🟡 Menor | **`start.sh` no tiene bit ejecutable** (100644). Funciona en Docker (invocado con `bash`) pero ideal sería 100755. |
| 4 | ⚪ Info | **`foto_ultima_modificacion` no se actualiza** cuando un admin edita vía `PATCH /:id` (el `update` genérico no toca esa columna). Solo se actualiza con `PATCH /me`. |
| 5 | ⚪ Info | **Backend en Render puede apagarse por inactividad** (plan gratuito). Al despertar tarda ~30-60s. No afecta sustentación pero es conocido. |

---

## 10. RECOMENDACIONES

| # | Prioridad | Recomendación |
|---|-----------|---------------|
| 1 | 🔴 Alta | **Pushear el commit `d104cf3`** antes de la sustentación para que el README actualizado y el deploy estén sincronizados. |
| 2 | 🟡 Media | Suspender el servicio legacy `Equipo_Metafit` en Render para evitar confusión. |
| 3 | 🟡 Media | Verificar que el deploy de Render (main) esté actualizado con la última versión del código de `feature/sofia-astudillo`. |
| 4 | ⚪ Opcional | Considerar Warmify o similar para evitar cold starts en Render (plan gratuito). |

---

## 11. ¿LISTO PARA SUSTENTACIÓN?

**✅ SÍ — El proyecto está listo.**

**Observaciones:**
- Persistencia verificada end-to-end: móvil↔web↔BD, con lecturas y escrituras confirmadas.
- Backend y frontend desplegados en Render, ambos respondiendo 200.
- APK de Expo descargable (94.8 MB) y enlace correcto en la landing.
- BD local con todas las tablas y columnas nuevas (foto, push_token, registros de ejercicio/alimentos).
- Config portátil: `.env.example`, `docker-compose.yml` y README instructivo presentes.
- Último paso pendiente: **push del commit `d104cf3`** para sincronizar el deploy.
