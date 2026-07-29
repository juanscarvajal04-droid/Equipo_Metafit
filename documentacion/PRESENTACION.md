# PRESENTACIÓN — MetaFit (Guion de Sustentación)

**Duración estimada:** 15-20 minutos  
**Audiencia:** Jurado académico, cliente (Sport Gym Sede 80)

---

## Diapositiva 1 — Portada (1 min)

**Título:** MetaFit — Sistema de Gestión Deportiva  
**Subtítulo:** Automatización integral para Sport Gym Sede 80

**Contenido visual:**
- Logo / nombre del proyecto
- Integrantes: Sofia Astudillo, Kevin S. Robayo, Carlos Rodrigues, Juan S. Carvajal
- Cliente: Sport Gym Sede 80, Bogotá
- Fecha: Junio 2026

**Guion:**
> "Buenos días. Somos el equipo MetaFit y hoy les presentamos nuestro sistema de gestión deportiva integral desarrollado para el gimnasio Sport Gym Sede 80 de Bogotá."

---

## Diapositiva 2 — Problema Identificado (1.5 min)

**Título:** ¿Qué problema resolvemos?

**Contenido visual:**
- Bullet points con iconos:
  - 📋 Gestión manual de afiliados (cuadernos, hojas de cálculo)
  - 💰 Control de pagos inexacto (membresías vencidas no detectadas)
  - 🏋️ Rutinas genéricas (sin considerar lesiones/objetivos individuales)
  - 📱 Sin acceso móvil para afiliados
  - 📊 Sin métricas de negocio en tiempo real
  - 🔄 Duplicación de esfuerzos entre recepción y entrenadores

**Guion:**
> "Sport Gym Sede 80 manejaba sus 200+ afiliados en planillas de Excel y cuadernos físicos. Los entrenadores asignaban rutinas genéricas sin considerar lesiones. No existía un sistema de alertas de vencimiento de membresías. Y los afiliados no tenían forma de consultar su progreso sin ir al gimnasio."

---

## Diapositiva 3 — Solución Propuesta (1.5 min)

**Título:** MetaFit — Una plataforma, cuatro frentes

**Contenido visual:**
```
  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐
  │  Web Admin  │  │  Web Recep  │  │  Web Entren │  │ App Afiliado│
  │ Dashboard   │  │ Afiliados   │  │ Rutinas     │  │ Mi Perfil   │
  │ KPIs        │  │ Pagos       │  │ Dietas      │  │ Mi Rutina   │
  │ Personal    │  │ Crear Afil. │  │ Progreso    │  │ Mi Dieta    │
  │ Precios     │  │             │  │             │  │ Mi Progreso │
  └─────────────┘  └─────────────┘  └─────────────┘  └─────────────┘
```

**Guion:**
> "MetaFit es una solución integral con cuatro interfaces adaptadas a cada rol. El administrador tiene un dashboard con KPIs del negocio. El recepcionista gestiona afiliados y pagos. El entrenador asigna rutinas y dietas personalizadas. Y el afiliado consulta todo desde su celular."

---

## Diapositiva 4 — Arquitectura del Sistema (2 min)

**Título:** Arquitectura: Web + API + Móvil + Base de Datos

**Contenido visual:**
```
  [Frontend Web] ──── [API REST] ──── [MySQL 8.0]
  React 19            Node.js/Express   17 tablas
  Vite 6              JWT + Swagger     3FN + vistas
  Bootstrap 5         MVC + Services    1 trigger

  [App Móvil]
  React Native 0.83
  Expo SDK 55
  4 pantallas (tabs)
```

**Explicar:**
- **Frontend Web** (React 19 + Vite): Interfaz responsive para staff. Roles RBAC. CSS Modules + Bootstrap.
- **Backend API** (Node.js + Express): Patrón MVC, 48 endpoints REST, Swagger en /api-docs, middlewares JWT por ruta.
- **App Móvil** (React Native + Expo): 4 tabs (Perfil, Rutina, Dieta, Progreso). Autenticación JWT. Navegación condicional.
- **Base de Datos** (MySQL 8.0): 17 tablas en 3FN, 5 vistas, 18 FK, herencia USUARIO → AFILIADO.

**Guion:**
> "La arquitectura sigue un diseño en capas. Frontend y backend están completamente desacoplados via API REST. La base de datos está normalizada en tercera forma formal con un patrón de herencia super-tipo/sub-tipo para usuarios y afiliados. La app móvil se conecta a la misma API, garantizando consistencia."

---

## Diapositiva 5 — Stack Tecnológico (1 min)

**Título:** Tecnologías utilizadas

**Contenido visual (tabla):**

| Capa | Tecnología | Versión |
|---|---|---|
| Frontend Web | React + Vite + Bootstrap | 19 / 6 / 5.3 |
| Backend API | Node.js + Express | 22+ / 4.18 |
| Base de Datos | MySQL | 8.0 |
| App Móvil | React Native + Expo | 0.83 / 55 |
| Autenticación | JWT + bcryptjs | 9.0 / 2.4 |
| Documentación | Swagger JSDoc | 6.2 |
| Pruebas | Jest + Supertest | 30.4 / 7.2 |
| Infraestructura | Docker Compose | V2 |

**Guion:**
> "Elegimos tecnologías modernas y robustas. React con Vite para un frontend rápido. Node.js con Express para el backend, con JWT y bcrypt para seguridad. MySQL por su madurez relacional. React Native con Expo para la app móvil. Todo orquestado con Docker para despliegue reproducible."

---

## Diapositiva 6 — Demo: Login y Dashboard (2 min)

**Título:** Demo — Administrador

**Guion:**
> "Vamos a la demo. Primero, como administrador. Ingreso a http://localhost:5173, selecciono 'Administrador', y uso las credenciales carlos@metafit.com / Admin123!."

**Pasos en vivo:**
1. http://localhost:5173 → Landing Page
2. Clic "Iniciar Sesión" → Login form
3. Seleccionar "Administrador", ingresar credenciales
4. Dashboard con KPIs: total afiliados, ingresos, próximos vencimientos
5. Sección "Precio de Membresía" editable
6. Gráfico de distribución por objetivo físico

**Punto clave:**
> "Noten que el dashboard muestra datos en tiempo real. Los ingresos, afiliados activos, ciclos en curso, todo se calcula desde la base de datos."

---

## Diapositiva 7 — Demo: Crear Afiliado (1.5 min)

**Título:** Demo — Recepcionista (Creación de Afiliado)

**Guion:**
> "Ahora como recepcionista. Cierro sesión, selecciono 'Recepcionista', ingreso con maria@metafit.com / Maria123!."

**Pasos en vivo:**
1. Login como Recepcionista → redirigido a /afiliados
2. Clic "Nuevo Afiliado"
3. Completar formulario: nombre, documento, fecha nacimiento, sexo, teléfono, dirección, estatura
4. Agregar restricciones médicas: "Asma, Lesión de hombro"
5. Guardar → afiliado aparece en la tabla

**Punto clave:**
> "El sistema genera automáticamente la contraseña inicial del afiliado: MF_documento@2025. Además, las restricciones médicas se vinculan inmediatamente al perfil."

---

## Diapositiva 8 — Demo: Asignar Rutina y Dieta (2 min)

**Título:** Demo — Entrenador

**Guion:**
> "Ahora como entrenador. Cierro sesión, selecciono 'Entrenador', ingreso con laura@metafit.com / Laura123!."

**Pasos en vivo (Rutina):**
1. Ir a "Rutinas"
2. El afiliado recién creado aparece sin rutina (resaltado)
3. Clic "Asignar Rutina"
4. Configurar ciclo: objetivo "Aumento de masa", nivel "Principiante", 4 días/semana
5. Seleccionar ejercicios por día (notar que ejercicios perjudiciales para asma/lesión hombro están filtrados)
6. Guardar

**Pasos en vivo (Dieta):**
1. Ir a "Dietas"
2. Seleccionar mismo afiliado → "Asignar Dieta"
3. Configurar calorías objetivo 2500 kcal, 5 comidas
4. Agregar alimentos (filtrados por restricciones)
5. Guardar

**Punto clave:**
> "El filtrado por restricciones es automático. El entrenador no puede asignar un ejercicio que empeore una lesión existente. Esto es posible gracias a las tablas pivote EJERCICIO_RESTRICCION_EXCLUIDA y ALIMENTO_RESTRICCION_EXCLUIDA."

---

## Diapositiva 9 — Demo: App Móvil (2 min)

**Título:** Demo — Afiliado (App Móvil)

**Guion:**
> "Finalmente, veamos la experiencia del afiliado desde su celular. Abrimos la app Expo."

**Pasos en vivo:**
1. Landing screen → clic "Iniciar Sesión"
2. Ingresar credenciales del afiliado creado
3. **Perfil**: muestra datos personales, restricciones (Asma, Lesión de hombro), estado activo
4. **Rutina**: muestra el plan con ejercicios por día, series y repeticiones
5. **Dieta**: muestra las comidas con alimentos y macros
6. **Progreso**: inicialmente vacío (el entrenador registrará mediciones)

**Punto clave:**
> "El afiliado solo ve sus propios datos. No hay riesgo de que un afiliado acceda a información de otro. Los endpoints /me garantizan el aislamiento."

---

## Diapositiva 10 — Seguridad Implementada (1 min)

**Título:** Seguridad en cada capa

**Contenido visual:**
| Capa | Medida |
|---|---|
| Red | Helmet (headers HTTP seguros), CORS restrictivo, rate limiting |
| API | JWT (8h exp), bcrypt (12 rondas), validación Content-Type |
| Rutas | 5 middlewares progresivos (auth, admin, entrenador, recepcionista, propietario) |
| Frontend | ProtectedRoute, redirección por rol, token en header |
| Móvil | AsyncStorage, interceptor 401 → auto-logout |
| BD | Prepared statements (mysql2), CHECK constraints, ON DELETE RESTRICT |

**Guion:**
> "La seguridad es multicapa. Desde helmet en las respuestas HTTP hasta prepared statements que previenen inyección SQL. Los JWT expiran en 8 horas y las contraseñas se almacenan con bcrypt a 12 rondas. Cada endpoint verifica el rol del usuario antes de ejecutar cualquier operación."

---

## Diapositiva 11 — Pruebas y Calidad (1 min)

**Título:** Calidad ISO 25000

**Contenido visual:**

```
  ✅ 16 TESTS PASANDO (Jest + Supertest)
  ┌─────────────────────────────────────────────┐
  │ Test Suites: 2 passed, 2 total              │
  │ Tests:       16 passed, 16 total            │
  └─────────────────────────────────────────────┘

  ISO 25000 — Cumplimiento:
  ┌──────────────────┬──────────────────────────┐
  │ Mantenibilidad   │ MVC + responsabilidad    │
  │                  │ única por archivo        │
  ├──────────────────┼──────────────────────────┤
  │ Seguridad        │ JWT + bcrypt + helmet    │
  ├──────────────────┼──────────────────────────┤
  │ Capacidad prueba │ 16 tests, servicios      │
  │                  │ sin dependencias de red  │
  ├──────────────────┼──────────────────────────┤
  │ Modularidad      │ Frontend/backend         │
  │                  │ desacoplados por API     │
  └──────────────────┴──────────────────────────┘
```

**Guion:**
> "Implementamos pruebas unitarias e integración con Jest y Supertest. 16 casos de prueba cubren login exitoso y fallido, acceso denegado por rol, CRUD de afiliados, pagos y normalización de fechas. El proyecto cumple con los estándares ISO 25000 de mantenibilidad, seguridad, modularidad y capacidad de prueba."

---

## Diapositiva 12 — Conclusiones y Aprendizajes (1.5 min)

**Título:** ¿Qué aprendimos?

**Contenido visual (bullet points):**
- 🏗️ **Arquitectura en capas**: Desacoplar frontend/backend facilita el mantenimiento y la escalabilidad
- 🔐 **Seguridad por diseño**: JWT + roles desde el inicio, no después
- 🗄️ **Normalización 3FN**: Evita redundancias y garantiza integridad referencial
- 📱 **Multiplataforma**: Una sola API sirve a web y móvil sin duplicar lógica
- 🧪 **Pruebas tempranas**: Detectar errores de integración antes del deploy
- 🤝 **Trabajo en equipo**: Git Flow, PRs, código review

**Guion:**
> "Este proyecto nos dejó aprendizajes clave. La arquitectura en capas nos permitió desarrollar frontend y backend en paralelo. La seguridad por diseño evitó refactors dolorosos. La normalización 3FN nos obligó a pensar bien las relaciones desde el día uno. Y las pruebas tempranas nos salvaron de varios errores de integración."

---

## Diapositiva 13 — Preguntas Frecuentes Anticipadas (1 min)

**Título:** Posibles preguntas del jurado

### P: ¿Cómo se maneja la concurrencia si dos recepcionistas crean un afiliado al mismo tiempo?
**R:** MySQL maneja la concurrencia a nivel de transacciones. El correo y el documento tienen UNIQUE INDEX, por lo que el segundo INSERT recibirá un error de duplicado, que el backend captura y devuelve como mensaje al usuario.

### P: ¿Qué pasa si el backend se cae?
**R:** Docker Compose reinicia automáticamente el contenedor. Además, el frontend muestra un mensaje de error amigable ("Error de conexión, verifica que el servidor esté activo").

### P: ¿Se puede escalar a múltiples sedes?
**R:** Sí. Solo agregar un campo `id_sede` a las tablas principales (USUARIO, AFILIADO, PAGO) y filtrar por sede en los endpoints. La arquitectura está preparada.

### P: ¿Cómo se recupera una contraseña olvidada?
**R:** Actualmente es presencial (el admin cambia la contraseña). Una mejora futura sería implementar flujo de recuperación por correo (JWT de reset + nodemailer).

---

## Diapositiva 14 — Cierre

**Título:** Gracias

**Contenido visual:**
- MetaFit logo
- "¿Preguntas?"
- Contacto: Sport Gym Sede 80 — Bogotá
- Repositorio: [URL del proyecto]

**Guion:**
> "MetaFit transforma la gestión de Sport Gym Sede 80. Reemplazamos hojas de cálculo por un sistema integral, rutinas genéricas por planes personalizados con filtrado inteligente, y la falta de información por métricas en tiempo real. Estamos orgullosos del resultado y abiertos a sus preguntas. Muchas gracias."
