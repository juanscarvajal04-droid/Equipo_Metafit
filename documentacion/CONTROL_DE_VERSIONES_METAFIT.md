# Control de Versiones — MetaFit

**Fecha de elaboración:** 2026-10-08
**Estado examinado:** rama local `feature/sofia-astudillo`, HEAD `763a088`
**Fuente:** comandos `git` ejecutados en esta sesión y `.github/workflows/ci.yml`.

> Todas las cifras de este documento fueron medidas con `git` en la fecha indicada. Lo que no pudo comprobarse se marca como **no verificable**.

---

## 1. Repositorio

| Dato | Valor |
|---|---|
| Remoto `origin` | `https://github.com/juanscarvajal04-droid/Equipo_Metafit.git` |
| Rama por defecto (`origin/HEAD`) | `main` |
| Rama activa en el árbol de trabajo | `feature/sofia-astudillo` |
| Primer commit | `ddbcc3d` — "Initial commit", `Sebas07$`, 2025-11-26 |
| Último commit de HEAD | `763a088` — "Update AppNavigator.js", `isabella198913`, 2026-09-19 |
| Commits totales | `feature/sofia-astudillo` 254 · `origin/develop` 65 · `origin/main` 289 |

---

## 2. Ramas y quién trabaja en qué

### 2.1 Inventario de ramas

| Rama | Último commit | Fecha | Autor del último commit | Autoría dominante |
|---|---|---|---|---|
| `origin/main` | `e11916b` | 2026-09-29 | isabella198913 | juanscarvajal04-droid (168), isabella198913 (50) |
| `origin/develop` | `6da5263` | 2026-05-31 | juanscarvajal04-droid | juanscarvajal04-droid (28), sofiaastudilo (18) |
| `origin/feature/juan-carvajal` | `docs` | 2026-09-17 | juanscarvajal04-droid | juanscarvajal04-droid (170) |
| `origin/feature/sofia-astudillo` (HEAD) | `763a088` | 2026-09-19 | isabella198913 | juanscarvajal04-droid y Sofia mezclados |
| `origin/feature/isabella-caldas` | `Add files via upload` | 2026-09-22 | isabella198913 | isabella198913 (58) |
| `origin/feature/carlos-rodriguez` | `guía de estudio completa…` | 2026-09-08 | Sofia | juanscarvajal04-droid (168) |
| `origin/feature/kevin-garcia` | `no` | 2026-06-30 | sebastianrobayo1109-droid | juanscarvajal04-droid (27) |
| `origin/feature/n8n-integration` | `Agregar n8n: Telegram…` | 2026-08-20 | juanscarvajal04-droid | juanscarvajal04-droid (151) |
| `origin/juanscarvajal04-droid-patch-1` | `Create asynt storague` | 2026-07-15 | Sebas07$ | rama patch de GitHub |

### 2.2 Observaciones sobre la autoría

- Las ramas **no están aisladas por persona**: `feature/carlos-rodriguez` contiene 168 commits de `juanscarvajal04-droid` y sus dos últimos commits son de `Sofia`; `feature/kevin-garcia` la escriben `juanscarvajal04-droid` y `sebastianrobayo1109-droid`. La asignación rama↔persona es **unívoca sólo por nombre**, no por autoría.
- Identidades duplicadas: `juanscarvajal04-droid` y `Sebas07$` comparten el correo `juanscarvajal.04@gmail.com`; el commit firmado como "Kevin Garcia" usa el correo de `sebastianrobayo1109-droid`. **No verificable** quién escribió realmente cada commit en esos casos.

---

## 3. Convenciones de nombres observadas

| Patrón | Ejemplos | Observación |
|---|---|---|
| `feature/` + nombre de la persona | `feature/juan-carvajal`, `feature/sofia-astudillo`, `feature/isabella-caldas`, `feature/carlos-rodriguez`, `feature/kevin-garcia` | Convención mayoritaria (5 ramas) |
| `feature/` + tema | `feature/n8n-integration` | Excepción temática |
| `develop` | — | Rama de integración nominal, congelada desde 2026-05-31 |
| `main` | — | Rama de entrega y despliegue |
| `<usuario>-patch-N` | `juanscarvajal04-droid-patch-1` | Generada por la edición web de GitHub |
| Nombres sin prefijo en commits | `Trazabilidad`, `cambiooos`, `Más cositas`, `no`, `30`, `..` | Mensajes de commit sin convención |

No hay evidencia de prefijos obligatorios (`feat:`, `fix:`, `docs:`) ni de un `CONTRIBUTING.md` en el repositorio: **no verificable** la existencia de una política escrita de ramificación.

---

## 4. Estrategia de ramificación (deducida de la historia real)

### 4.1 Diagrama de integración efectivo

```
develop (congelada 2026-05-31, 65 commits)
   └─(226 commits de diferencia con main)─┐
                                          │
feature/juan-carvajal ──PR#6,#8,#9──► main ◄──(39/4 vs HEAD)
feature/sofia-astudillo ──PR#7──► main         │
                                                └─ merges directos hacia feature/* (0ce019e, 8d10b11, bcb4f5e…)
feature/isabella-caldas, feature/kevin-garcia, feature/n8n-integration → sin PR visible
```

### 4.2 Reglas deducidas **[git]**

1. **`main` es la rama de integración y de despliegue real**, no `develop`: es la única que dispara CD (`.github/workflows/ci.yml:51`) y la que acumula 289 commits.
2. **Las ramas `feature/*` se integran de dos formas mezcladas:**
   - Pull Requests (`#1`, `#2`, `#6`, `#7`, `#8`, `#9` → merge commits `1f06e26`, `a1f1d4e`, `3164790`, `c1f5092`, `c65aedc`, `2a4d5c4`).
   - Fusiones directas entre ramas de trabajo: `0ce019e` (juan-carvajal → sofia-astudillo), `8d10b11`, `bcb4f5e`, `8733dce` (ídem), `a32ea1c` (origin/main → juan-carvajal), `7bced8f` (ídem, con mensaje de resolución de conflictos), `4cd76b0` (`Merge feature/juan-carvajal into main`).
3. **`develop` quedó rezagada**: su último commit es `6da5263` (2026-05-31, "normalización v.2") y su divergencia con `main` es de 226 commits. No recibe merges desde entonces; el trabajo de integración migró a `main`.
4. **El ciclo de entrega observado** es `feature/juan-carvajal` ↔ `feature/sofia-astudillo` (integración mutua) → `main` → despliegue a Render.

---

## 5. Estados de divergencia actuales

Medido el 2026-10-08 con `git rev-list --left-right --count A...B`:

| Comparación | Commits solo en A | Commits solo en B | Significado |
|---|---|---|---|
| `origin/develop` vs `HEAD` (`feature/sofia-astudillo`) | **2** | **191** | La rama de trabajo tiene 191 commits que `develop` no tiene; `develop` tiene 2 (`6da5263` "normalización v.2", `947019f` "docs: configurar README de integración para la rama develop") |
| `origin/main` vs `HEAD` | **39** | **4** | `main` está 39 commits por delante de la rama actual; la rama actual sólo aporta 4 commits nuevos (`763a088`, `c793cff`, `0ce019e`, `ce262fb`) |
| `origin/main` vs `origin/develop` | **226** | **2** | `main` está 226 commits por delante de `develop`, que sólo tiene 2 commits propios no integrados |

### 5.1 Implicaciones para la entrega

- **Riesgo alto de pérdida de trabajo en `develop`:** al estar 226 commits atrás de `main`, cualquier fusión de `develop` hacia `main` aporta casi nada, y una fusión inversa (si se resolviera "de lado de develop") podría sobrescribir 226 commits de trabajo ya entregado.
- **`feature/sofia-astudillo` sólo aporta 4 commits a `main`:** prácticamente todo su contenido ya está en `main`; lo que falta publicar es apenas eso (documentación JSDoc `ce262fb`, "Trazabilidad" `c793cff`, merge `0ce019e` y `Update AppNavigator.js` `763a088`).
- **La rama activa no corre CI:** ver sección 6.
- **Los entregables académicos no están en ninguna rama activa:** ver sección 7.

---

## 6. Commits y mensajes

### 6.1 Frecuencia (commits con autoría de HEAD, 254 en total) **[git]**

| Mes | Commits |
|---|---|
| 2025-11 | 1 |
| 2025-12 | 4 |
| 2026-02 | 15 |
| 2026-03 | 1 |
| 2026-04 | 24 |
| 2026-05 | 28 |
| 2026-06 | 33 |
| 2026-07 | 33 |
| 2026-08 | 90 |
| 2026-09 | 25 (hasta el día 19) |

Rachas visibles: actividad mínima en 2025-11/12 y 2026-03; pico en 2026-08 (90 commits, coincide con la auditoría HU y el cierre de brechas).

### 6.2 Estilo de mensajes **[git]**

Clasificación de los últimos 80 mensajes:

| Cantidad | Categoría | Ejemplos |
|---|---|---|
| 11 | `Merge ...` | `Merge pull request #9 from …`, `Merge origin/main into feature/juan-carvajal: resolver conflictos en AfiliadosView` |
| 48 | Texto libre en español (sin prefijo) | `Trazabilidad`, `cambiooos`, `Más cositas`, `back`, `no`, `Nuevo APK con CRUD ciclos…` |
| 4 | `feat:` | `feat: CRUD ciclos, edición granular de planes y notas del afiliado` |
| 4 | `Fix` / `fix:` | `Fix: notas del afiliado visibles en Progreso web…`, `fix(ci): sincronizar package-lock.json…` |
| 3 | `docs:` | `docs: documentación JSDoc completa en backend, frontend_web y movil` |
| ~5 | Prefijos variados | `chore(apk):`, `fix(AfiliadosView):`, `fix(HU43):`, `feat(HU17):`, `fix push-token` |

Observaciones:

- **No hay convención de mensajes obligatoria**: predominan los mensajes libres en español (48/80) frente a los convencionales (`feat`/`fix`/`docs` ≈ 12/80).
- Algunos mensajes son ambiguos o no descriptivos (`back`, `no`, `30`, `..`, `cambiooos`, `2`), lo que dificulta la trazabilidad.
- Sí se observan referencias a HU en los mensajes (`feat(HU17)`, `fix(HU43)`, "fix: cerrar brechas HU" en `2ca91a8`), lo que permite trazar trabajo con la numeración Jira/móvil, pero no con HU1–HU10.
- No hay evidencia de firmas GPG, etiquetas (`git tag`) ni de versiones semánticas: **no verificable** un esquema de releases.

---

## 7. CI/CD: `.github/workflows/ci.yml` (74 líneas)

### 7.1 Disparadores **[archivo]**

| Líneas | Evento | Ramas | Resultado |
|---|---|---|---|
| 6-8 | `push` | `main`, `feature/juan-carvajal` | Ejecuta job `ci` |
| 9-10 | `pull_request` | hacia `main` | Ejecuta job `ci` |
| 51 | condición del job `deploy` | `github.ref == 'refs/heads/main'` | CD sólo en `main` |

> **Advertencia crítica:** un `push` a `feature/sofia-astudillo` (la rama activa), ni a `feature/isabella-caldas`, `feature/carlos-rodriguez`, `feature/kevin-garcia`, `feature/n8n-integration` ni `develop`, **no dispara la canalización**: ni los tests corren ni se despliega. Sólo `main` y `feature/juan-carvajal` tienen CI en push, y los PRs sólo generan CI cuando su destino es `main`.

### 7.2 Job `ci` (líneas 13-47)

- Runner `ubuntu-latest`, Node **20** con caché npm sobre los tres `package-lock.json` (líneas 20-28).
- `backend`: `npm ci` + `npm test` → `jest --runInBand --forceExit` (`backend/package.json:9`).
- `frontend_web`: `npm ci` + `npm test` + `npm run build` → `vitest run` (`frontend_web/package.json:11`).
- `movil`: `npm ci` + `npm test` → `jest` (`movil/package.json:57`).

### 7.3 Job `deploy` (líneas 49-74)

- `needs: ci` (línea 52): sólo corre si los tests pasan.
- Dispara dos deploys vía API REST a **Render** con `RENDER_API_TOKEN`:
  - Backend: `POST /v1/services/srv-d9ieq2rtqb8s738q2180/deploys` (líneas 62-65).
  - Frontend: `POST /v1/services/srv-d9kbkdm1egvs7385ofu0/deploys` (líneas 71-74).
- El estado actual de esos servicios y la existencia del secreto **no son verificables** desde el repositorio.

---

## 8. Lección de control de versiones: pérdida de `_docs_/`

### 8.1 Lo que ocurrió **[git]**

| Dato | Valor |
|---|---|
| Commit | `d15a3cd` — mensaje `back`, autor `juanscarvajal04-droid`, fecha **2026-05-19** |
| Efecto | Eliminó **toda** la carpeta `_docs_/` (entregables de los trimestres I–VI: presentaciones, diagramas, MER, diccionarios, normalización, SQL, frontend del trim3, etc.) |
| Archivos `_docs_/` en `origin/develop` | **97** |
| Archivos `_docs_/` en `origin/feature/isabella-caldas` | **101** |
| Archivos `_docs_/` en `HEAD` (`feature/sofia-astudillo`) | **0** |
| Archivos `_docs_/` en `origin/main` | **0** |

### 8.2 Por qué fue problemático

1. **Commit de una sola línea (`back`) sin describir un borrado masivo**: nada en el mensaje indica que se eliminaron decenas de entregables académicos.
2. **Se hizo en la línea que luego se usó para integrar**: como `feature/sofia-astudillo` y `main` absorbieron ese historial, el borrado quedó propagado a las ramas activas; hoy sólo sobrevive en `origin/develop` (97 archivos) y `origin/feature/isabella-caldas` (101).
3. **Sin revisión de PR**: el commit `d15a3cd` no aparece como parte de un Pull Request visible en el historial (los PRs registrados son `#1`, `#2`, `#6`–`#9`), es decir, el borrado no pasó por revisión.
4. **Sin protección de ruta**: no existe (no verificable) ninguna regla de CODEOWNERS o de protección de ramas que impidiera borrar `_docs_/`.

### 8.3 Cómo evitarlo

- Recuperar el contenido en una rama dedicada desde `origin/develop` o `origin/feature/isabella-caldas` (ver comandos en 9.3).
- Exigir que los borrados amplios se hagan en PR visible, con el listado de archivos en la descripción.
- Regla de revisión: `git show --stat <commit>` obligatorio antes de aprobar un PR que borre más de N archivos.
- Proteger `main` (y preferiblemente `develop`) en GitHub con revisión obligatoria y sin borrado directo.

---

## 9. Recomendaciones concretas con el estado actual

### 9.1 Cerrar la divergencia con `develop`

`develop` tiene 2 commits que nadie más tiene (`6da5263`, `947019f`) y está 226 atrás de `main`. Opciones, en orden de riesgo:

```bash
# Opción A (recomendada): actualizar develop desde main sin tocar main
git fetch origin
git checkout develop
git pull origin develop
git merge --no-ff origin/main -m "merge: sincronizar develop con main (226 commits)"
git push origin develop

# Opción B: si se quiere conservar develop como rama de integración real,
# hacerla avanzar hacia main y documentar que el trabajo ya vive en main
```

Antes de fusionar, verificar que los 2 commits propios de `develop` (`6da5263` "normalización v.2", `947019f` "README de integración") no chocan con el contenido equivalente ya presente en `main`.

### 9.2 Qué fusionar a `main`

Sólo 4 commits separan `feature/sofia-astudillo` de `main`:

```bash
git fetch origin
git log --oneline origin/main..HEAD     # 763a088, c793cff, 0ce019e, ce262fb
git checkout main
git pull origin main
git merge --no-ff feature/sofia-astudillo -m "merge: JSDoc, trazabilidad y AppNavigator desde feature/sofia-astudillo"
# Resolver conflictos si los hay, ejecutar los tests localmente:
cd backend && npm test ; cd ../frontend_web && npm test ; cd ../movil && npm test
git push origin main                     # esto sí dispara CI + CD (ci.yml:8,51)
```

Verificar además que no haya trabajo sin integrar en las otras ramas:

```bash
git log --oneline origin/main..origin/feature/isabella-caldas
git log --oneline origin/main..origin/feature/n8n-integration
git log --oneline origin/main..origin/feature/kevin-garcia
```

### 9.3 Recuperar los entregables `_docs_/`

```bash
git checkout -b feature/recuperar-entregables
git checkout origin/develop -- _docs_
git commit -m "docs: recuperar entregables _docs_/ eliminados en d15a3cd"
git push origin feature/recuperar-entregables
# Abrir PR hacia main (y hacia develop) para que el borrado quede revertido en ambas
```

Diferencia útil entre las dos fuentes de supervivencia: `git diff --stat origin/develop origin/feature/isabella-caldas -- _docs_` (97 vs 101 archivos).

### 9.4 Ajustes al control de versiones

1. **Ampliar los disparadores de CI** en `.github/workflows/ci.yml:7-8` para que también corra en `push` a las ramas `feature/*` activas (al menos `feature/sofia-astudillo` y `feature/isabella-caldas`), o exigir PR a `main` para todo el trabajo.
2. **Unificar la rama de integración**: decidir si `develop` sigue viva; si no, archivarla (`git branch -m develop develop-archivada`) para evitar merges hacia una línea 226 commits atrasada.
3. **Proteger `main`** en GitHub: revisión obligatoria, verificación de status checks del job `ci` y bloqueo de fusión directa.
4. **Convención de mensajes**: adoptar `tipo(HUxx): descripción` (ya usada puntualmente en `feat(HU17)`, `fix(HU43)`) y prohibir mensajes de un solo token (`back`, `no`, `30`).
5. **Revisión de borrados**: checklist de PR que incluya `git show --stat` cuando el diff supere un umbral de archivos eliminados.
6. **No fusionar `develop` hacia ninguna rama activa antes de leer sus 2 commits**; en cambio, sí fusionar `main` hacia `develop` (sección 9.1).

---

## 10. Resumen verificable

| Métrica | Valor |
|---|---|
| Ramas remotas | 9 (`main`, `develop`, 5× `feature/*`, `feature/n8n-integration`, `*-patch-1`) |
| Divergencia `develop` ↔ rama activa | 2 / 191 commits |
| Divergencia `main` ↔ rama activa | 39 / 4 commits |
| Divergencia `main` ↔ `develop` | 226 / 2 commits |
| PRs visibles en historial | 6 (`#1`, `#2`, `#6`, `#7`, `#8`, `#9`) |
| Commits por mes (pico) | 90 en 2026-08 |
| Disparadores de CI | `push` a `main` y `feature/juan-carvajal`; PR a `main` |
| Disparadores de CD | `push` a `main` (tras `ci`), condición `github.ref == 'refs/heads/main'` |
| Entregables `_docs_/` perdidos en ramas activas | 0 en `main` y en `feature/sofia-astudillo`; 97 en `develop`; 101 en `feature/isabella-caldas` |
| Protección de ramas / CODEOWNERS / tags / releases | **No verificables** desde el repositorio |
