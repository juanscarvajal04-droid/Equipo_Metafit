# GUION DE VIDEO DEMO — MetaFit (3 a 5 minutos)

Objetivo: mostrar el valor real del sistema (Gestión de afiliados, pagos, entrenamiento, nutrición,
app móvil y extras 1000/10: modo claro/oscuro, push, analítica, monitoreo).

## Formato

- **Duración**: 3–5 min · **Resolución**: 1080p · **Idioma**: español.
- **3 roles**: 🎙️ Narrador (off), 🧑‍💼 Admin (pantalla web), 📱 Afiliado (pantalla móvil).
- Recomendado: OBS Studio para capturar + cualquier editor (CapCut / DaVinci).

---

## ESCENA 1 — Introducción (0:00–0:30)

🎙️: "MetaFit es el sistema de gestión de Sport Gym Sede 80: afiliados, pagos, rutinas y dietas en un
solo lugar. Te mostramos el flujo completo en 3 minutos."

Pantalla: Landing page (logo + hero). Zoom al botón "Descargar APK".

🎙️: "Para el afiliado, todo está en su celular: su perfil, su entrenamiento, su dieta y su progreso."

---

## ESCENA 2 — Login del Admin (0:30–1:00)

🧑‍💼 Ingresa con `carlos@metafit.com` / `Admin123!`.

🎙️: "El admin inicia sesión con JWT protegido. El panel muestra indicadores en vivo del gimnasio."

Resalte: tarjetas del dashboard (ingresos del mes, afiliados, pagos por vencer).

---

## ESCENA 3 — Crear afiliado + correo de bienvenida (1:00–1:40)

🧑‍💼 Abre "Afiliados → Crear", llena el formulario, sube una **foto de perfil**, guarda.

🎙️: "Al crear el afiliado, el sistema le envía automáticamente su correo de bienvenida con sus
credenciales (Brevo) y lo registra en analítica (GA4)."

Recorte breve: bandeja del correo recibido (plantilla púrpura MetaFit).

---

## ESCENA 4 — Asignar rutina y dieta (1:40–2:20)

🧑‍💼 En "Planes de Entrenamiento" asigna ejercicios a un ciclo; en "Dietas" asigna alimentos.

🎙️: "El entrenador asigna la rutina, y el afiliado recibe una **notificación push** en su celular al
instante."

📱 (móvil): el banner de la push aparece ("🏋️ Nueva rutina asignada"). Abre "Rutina" y muestra el plan.

---

## ESCENA 5 — App móvil del afiliado (2:20–3:00)

📱 Navega: Perfil (foto, edad, peso) → toggle **☀️/🌙 modo claro** → Progreso.

🎙️: "El afiliado consulta su perfil, cambia el tema de la app, registra su progreso… y si no renueva,
le llega un recordatorio de pago automático (cron + Brevo)."

---

## ESCENA 6 — Cierre técnico (3:00–4:00)

🧑‍💼 Terminal: `npm test` (25 backend + 30 web + 19 móvil → 74 verdes). Storybook con las historias.
Dashboard CI/CD de GitHub Actions. UptimeRobot en verde.

🎙️: "Calidad garantizada: 74 tests en CI, Storybook para diseñar componentes, monitoreo 24/7 y
despliegue automático a Render. MetaFit: tecnología al servicio del deporte."

---

## Check-list de producción

- [ ] Grabar en 1080p, audio limpio (micrófono dedicado).
- [ ] Tener listos ambos navegadores/devices antes de grabar.
- [ ] Ocultar datos personales que no correspondan a usuarios demo.
- [ ] Cerrar con pantalla final de marca (URL del portal).