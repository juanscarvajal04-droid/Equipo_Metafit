# Contribuir a MetaFit

**Rama activa de la práctica:** `feature/sofia-astudillo`  
**Rama de integración:** `main`  
**Fecha:** 2026-11-25

---

## 1. Reglas de trabajo

1. Trabajar únicamente en la rama asignada (`feature/sofia-astudillo` en esta práctica).
2. No hacer push directo a `main` ni a `develop`.
3. No reescribir el historial de Git (`rebase -i`, `filter-repo`, `push --force`) sin autorización y coordinación.
4. No incluir secretos, credenciales, `.env`, claves ni capturas sensibles.
5. No modificar la configuración Oracle de `main`.
6. No alterar la lógica funcional sin una tarea y pruebas asociadas.

## 2. Flujo recomendado

```bash
git checkout feature/sofia-astudillo
git pull origin feature/sofia-astudillo
# trabajar
git status
git diff
git add <archivos>
git commit -m "docs(pruebas): completar matriz y evidencia"
git push origin feature/sofia-astudillo
```

Abrir PR de `feature/sofia-astudillo` hacia `main` solo cuando el líder técnico lo solicite. El PR debe incluir:

- Resumen del cambio.
- Archivos afectados.
- Evidencia de pruebas.
- Riesgos y rollback.
- Confirmación de que no hay secretos.

## 3. Convención de commits

Formato sugerido:

```text
tipo(alcance): descripción breve

Cuerpo opcional: qué y por qué.
```

Tipos:

- `feat`: funcionalidad.
- `fix`: corrección.
- `docs`: documentación.
- `test`: pruebas.
- `ci`: pipeline.
- `chore`: mantenimiento.
- `refactor`: refactorización sin cambio funcional.

Ejemplos:

```text
docs(aws): actualizar manual de instalación a EC2
test(api): agregar casos de pagos y dashboard
ci: ejecutar pruebas en todas las ramas feature
```

Evitar mensajes de un solo token (`back`, `no`, `30`, `..`).

## 4. Pruebas antes de commit

```bash
cd backend && npm test
cd ../frontend_web && npm test && npm run build
cd ../movil && npm test
```

Resultado esperado en la línea base: **134/134**.

Si se modifica documentación, verificar que:

- Las cifras coincidan con `documentacion/INFORME_CALIDAD_QA_ISO25010.md`.
- No se introduzcan credenciales.
- Los enlaces relativos existan.
- Los documentos `.docx` no incluyan contraseñas.

## 5. Documentación

- Los planes, manuales y diagramas viven en `documentacion/`.
- Los soportes de prueba viven en `documentacion/pruebas/`.
- La arquitectura de despliegue vive en `documentacion/ARQUITECTURA_DESPLIEGUE_METAFIT.md`.
- Las métricas de calidad viven en `documentacion/MODELO_DE_CALIDAD_METAFIT.md` y `documentacion/metricas_calidad_metafit.csv`.

Al actualizar un documento:

1. Indicar versión/fecha.
2. Revisar coherencia con el código real.
3. Evitar duplicar cifras contradictorias.
4. Enlazar la fuente de verdad.

## 6. Checklist de PR

- [ ] Rama correcta y sin cambios en `main`.
- [ ] Sin secretos en el diff.
- [ ] Pruebas ejecutadas y evidencia adjunta.
- [ ] Documentación actualizada.
- [ ] Sin cambios funcionales no solicitados.
- [ ] Sin configuración Oracle alterada.
- [ ] Descripción con riesgos y rollback.
- [ ] Revisión del líder técnico.

## 7. Seguridad

Leer `SECURITY.md` antes de agregar variables de entorno, ejemplos o capturas. Usar marcadores `<CAMBIAR_...>` en archivos de ejemplo.

## 8. Estilo

- JavaScript/React: seguir el estilo existente del proyecto.
- Documentación: español claro, tablas para datos repetibles y enlaces relativos.
- No agregar comentarios innecesarios al código.
- No agregar dependencias sin justificar y sin actualizar `package-lock.json`.
