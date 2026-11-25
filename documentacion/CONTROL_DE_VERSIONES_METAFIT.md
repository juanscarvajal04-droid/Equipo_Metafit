# Control de Versiones — MetaFit

**Fecha de actualización:** 2026-11-25  
**Rama examinada:** `feature/sofia-astudillo`  
**HEAD:** `d12875c`  
**Fuente:** comandos `git` ejecutados en esta sesión y `.github/workflows/ci.yml`.

> Todas las cifras se midieron con `git` en la fecha indicada. Lo no verificable se marca como tal. **No se modificó `main` ni se reescribió el historial.**

---

## 1. Repositorio

| Dato | Valor |
|---|---|
| Remoto `origin` | `https://github.com/juanscarvajal04-droid/Equipo_Metafit.git` |
| Rama por defecto (`origin/HEAD`) | `main` |
| Rama activa | `feature/sofia-astudillo` |
| HEAD | `d12875c` |
| Primer commit | `ddbcc3d` — "Initial commit", 2025-11-26 |
| Commits totales en la rama | 254 |
| PRs visibles en el historial | 6 (`#1`, `#2`, `#6`, `#7`, `#8`, `#9`) |
| Tags / releases | Ninguno verificable |

## 2. Estado actual de la rama

Medido el 2026-11-25 con `git rev-list --left-right --count A...B`:

| Comparación | Solo en A | Solo en B | Lectura |
|---|---:|---:|---|
| `origin/main...HEAD` | 60 | 18 | `main` tiene 60 commits que la rama no tiene; la rama aporta 18 commits |
| `origin/develop...HEAD` | 2 | 205 | La rama está 205 commits por delante de `develop` |
| `origin/main...origin/develop` | 247 | 2 | `main` está 247 commits por delante de `develop` |

### 2.1 Interpretación

- La rama activa está **60 commits detrás** de `origin/main`; una integración requeriría actualización y resolución de conflictos.
- La rama activa aporta **18 commits** propios, incluidos cambios de despliegue AWS y documentación.
- `develop` está **247 commits atrás** de `main` y conserva 2 commits propios; no debe usarse como línea de integración sin una sincronización planificada.
- `origin/main` contiene **0 archivos** de `documentacion/entregables/`; los entregables viven en la rama de trabajo.
- El Árbol de trabajo tiene cambios locales preexistentes en `backend/server.js` y `movil/src/services/api.js`; no forman parte de esta actualización documental y no deben mezclarse sin revisión.

## 3. Ramas remotas

| Rama | Rol observado |
|---|---|
| `main` | Entrega y despliegue legado |
| `develop` | Congelada; 247 commits atrás de `main` |
| `feature/sofia-astudillo` | Rama activa de la práctica |
| `feature/juan-carvajal` | CI en push; usada para integración |
| `feature/isabella-caldas` | Trabajo paralelo; sin PR visible |
| `feature/carlos-rodriguez` | Trabajo paralelo; sin PR visible |
| `feature/kevin-garcia` | Trabajo paralelo; sin PR visible |
| `feature/n8n-integration` | Integración n8n; contiene un `.env` histórico sensible |
| `juanscarvajal04-droid-patch-1` | Rama generada por la edición web de GitHub |

## 4. Convenciones observadas

| Patrón | Ejemplos | Observación |
|---|---|---|
| `feature/` + persona | `feature/sofia-astudillo`, `feature/juan-carvajal` | Convención mayoritaria |
| `feature/` + tema | `feature/n8n-integration` | Excepción temática |
| Mensajes libres | `back`, `no`, `30`, `..` | Dificultan la trazabilidad; evitar |
| Prefijos parciales | `feat(HU17)`, `fix(HU43)`, `docs:` | Recomendados, pero no obligatorios |

No existe una política escrita previa de ramificación; este documento y `CONTRIBUTING.md` la formalizan.

## 5. Estrategia de integración observada

```text
develop (247 atrás de main, 2 propios)
   └── congelada

feature/juan-carvajal ──PR #6, #8, #9──► main
feature/sofia-astudillo ──PR #7────────► main
feature/isabella-caldas, feature/kevin-garcia,
feature/carlos-rodriguez, feature/n8n-integration
   └── sin PR visible en el historial

main ──► Render (CD legado)
feature/sofia-astudillo ──► AWS EC2 (despliegue manual documentado)
```

Reglas deducidas:

1. `main` es la rama de integración y de despliegue legado.
2. Las ramas `feature/*` se integraron por PR y también por merges directos.
3. `develop` dejó de recibir merges y quedó rezagada.
4. La práctica actual usa `feature/sofia-astudillo` y despliegue manual en AWS EC2.

## 6. CI/CD

Archivo: `.github/workflows/ci.yml` (74 líneas), Node 20.

| Evento | Ramas | Resultado |
|---|---|---|
| `push` | `main`, `feature/juan-carvajal` | Ejecuta `ci` |
| `pull_request` | hacia `main` | Ejecuta `ci` |
| `deploy` | `main` | Despliegue a Render (legado) |

Jobs del CI:

- Backend: `npm ci && npm test` → 69 pruebas.
- Frontend: `npm ci && npm test && npm run build` → 30 pruebas + build.
- Móvil: `npm ci && npm test` → 35 pruebas.

> **Advertencia:** un `push` a `feature/sofia-astudillo` **no dispara CI**. Para validar en CI hay que abrir un PR hacia `main` o ampliar los disparadores. La línea base se ejecutó localmente: 134/134.

## 7. Lección: pérdida de `_docs_/`

| Dato | Valor |
|---|---|
| Commit | `d15a3cd` — mensaje `back`, 2026-05-19 |
| Efecto | Eliminó toda la carpeta `_docs_/` (entregables de trimestres I–VI) |
| Supervivencia | 97 archivos en `origin/develop`; 101 en `origin/feature/isabella-caldas`; 0 en `main` y en la rama activa |

Buenas prácticas derivadas:

- Los borrados masivos deben ir en un PR visible con `git show --stat`.
- Proteger `main` con revisión obligatoria y status checks.
- No usar mensajes de un solo token para cambios destructivos.
- Recuperar entregables en una rama dedicada, sin tocar `main` sin autorización.

## 8. Riesgos de control de versiones

| Riesgo | Impacto | Mitigación |
|---|---|---|
| Rama 60 commits detrás de `main` | Conflictos al integrar | Actualizar y resolver en PR controlado |
| CI no corre en `feature/sofia-astudillo` | Regresiones no detectadas en push | PR a `main` o ampliar `on.push` |
| `develop` 247 commits atrás | Pérdida de trabajo si se fusiona mal | Archivarla o sincronizarla con revisión |
| Secretos en historia/ramas remotas | Exposición pública | Rotar y purgar con coordinación (`SECURITY.md`) |
| Cambios locales sin commit | Mezcla accidental | Revisar `git diff` y separar por tarea |
| Sin tags/releases | Difícil reproducir entregas | Etiquetar versiones de entrega |

## 9. Recomendaciones

1. Abrir PR de `feature/sofia-astudillo` hacia `main` solo cuando el líder técnico lo autorice.
2. Ampliar CI a `feature/sofia-astudillo` o a `feature/**` para que los push validen 134 pruebas.
3. No fusionar `develop` hacia ramas activas sin leer sus 2 commits propios.
4. Proteger `main` y exigir revisión.
5. Etiquetar la entrega con `v1.0.0` cuando el PR esté aprobado.
6. No ejecutar `filter-repo`, BFG ni `push --force` sin respaldo y autorización.
7. Revisar que los documentos no contengan credenciales antes de cada commit.

## 10. Resumen verificable

| Métrica | Valor |
|---|---|
| Rama activa | `feature/sofia-astudillo` |
| HEAD | `d12875c` |
| Divergencia con `origin/main` | 60 atrás / 18 adelante |
| Divergencia con `origin/develop` | 2 atrás / 205 adelante |
| Divergencia `main` ↔ `develop` | 247 / 2 |
| PRs visibles | 6 |
| CI en push | `main`, `feature/juan-carvajal` |
| CI en PR | hacia `main` |
| Pruebas de la línea base | 134/134 |
| Entregables en `origin/main` | 0 |
| Protección de ramas / CODEOWNERS / tags | No verificables |
