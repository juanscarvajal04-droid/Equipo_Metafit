# Checklist de demo — Sustentación MetaFit

> Guía paso a paso para la sustentación final. Todo se ejecuta en **LOCAL**
> (entorno Docker). Los datos quedan visibles en **phpMyAdmin** (BD local).
> Ver `entornos.md` para la separación LOCAL/PROD.

---

## Antes de empezar

- [ ] `docker compose up -d` (LOCAL funcionando)
- [ ] http://localhost:5173 carga
- [ ] http://localhost:3001/api-docs carga
- [ ] http://localhost:8080 carga (phpMyAdmin)

---

## Demo 1 — Crear afiliado (Recepcionista)

- [ ] Login: `maria@metafit.com` / `Maria123!`
- [ ] Crear afiliado con datos reales
- [ ] Mostrar fila en phpMyAdmin → tabla `USUARIO`
- [ ] Mostrar correo de bienvenida (si Brevo activo)

> Afiliado de demostración ya creado (si no se crea uno nuevo):
> **Demo Sustentación** — `demo.sust@test.com` / `MF_9999999@2025`
> (documento 9999999, teléfono 3009999999, dir "Calle 80 11-22").

---

## Demo 2 — Asignar plan (Entrenador)

- [ ] Login: `laura@metafit.com` / `Laura123!`
- [ ] Asignar ciclo, rutina y dieta al afiliado nuevo
- [ ] Mostrar en phpMyAdmin → `CICLO`, `PLAN_ENTRENAMIENTO`

> El ciclo del afiliado demo ya fue editado a **💪 Aumento de masa**,
> nivel Principiante, 3 días/semana, fechas del próximo mes (oct 2026).
> Rutina con 2 ejercicios y plan nutricional con 3 comidas listos.

---

## Demo 3 — Vista del afiliado (App móvil)

- [ ] Expo web: http://localhost:8081
- [ ] Login con el afiliado nuevo
- [ ] Mostrar tabs: **Perfil, Rutina, Dieta, Progreso**
- [ ] Explicar que el APK usa la misma API pero en producción

> En la tab **Perfil** se ve el ciclo actual (objetivo, fechas, días).
> **Rutina** muestra los ejercicios con series × repeticiones.
> **Dieta** muestra las comidas con alimentos y kcal.
> **Progreso** puede estar vacío si aún no se registró evolución (normal).

---

## Demo 4 — Swagger API

- [ ] http://localhost:3001/api-docs
- [ ] Authorize con token Admin
- [ ] Try it out: `GET /afiliados` → 200
- [ ] Try it out: `GET /dashboard/kpis` → 200

---

## Frase clave para el instructor

> *"Todo lo que se hace en la web se guarda en la misma BD que
> consume el móvil. Son dos clientes del mismo backend."*