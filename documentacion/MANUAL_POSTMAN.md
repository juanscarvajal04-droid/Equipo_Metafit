# Manual de Postman para MetaFit

> Guía paso a paso para probar la API de MetaFit con Postman.
> Pensado para personas sin experiencia previa en Postman.

---

## Índice

1. [¿Qué es Postman y para qué sirve en MetaFit?](#1-qué-es-postman-y-para-qué-sirve-en-metafit)
2. [Abrir Postman e importar las colecciones](#2-abrir-postman-e-importar-las-colecciones)
3. [Configurar el entorno](#3-configurar-el-entorno)
4. [Hacer login y obtener el token automáticamente](#4-hacer-login-y-obtener-el-token-automáticamente)
5. [Probar endpoints protegidos (Web)](#5-probar-endpoints-protegidos-web)
6. [Probar endpoints del móvil](#6-probar-endpoints-del-móvil)
7. [Errores comunes y cómo solucionarlos](#7-errores-comunes-y-cómo-solucionarlos)
8. [Consejos para la sustentación](#8-consejos-para-la-sustentación)

---

## 1. ¿Qué es Postman y para qué sirve en MetaFit?

**Postman** es una herramienta que permite hacer peticiones a una API (el "idioma" que usa el backend para comunicarse) sin necesidad de escribir código. Con Postman puedes:

- Enviar solicitudes al servidor de MetaFit (`GET`, `POST`, `PATCH`, `DELETE`)
- Ver las respuestas que devuelve el servidor (en formato JSON)
- Probar el inicio de sesión, la consulta de afiliados, el dashboard, etc.
- Verificar que todo funcione antes de usarlo desde la aplicación web o móvil

En MetaFit hay **dos colecciones** de Postman ya preparadas:

| Colección | ¿Quién la usa? | ¿Qué permite hacer? |
|---|---|---|
| `MetaFit_API_Web` | Administradores, Entrenadores, Recepcionistas | Gestionar usuarios, afiliados, planes, catálogos, dashboard, pagos |
| `MetaFit_API_Movil` | Afiliados (miembros del gimnasio) | Ver perfil propio, ciclos, progreso, planes asignados |

---

## 2. Abrir Postman e importar las colecciones

### 2.1. Descargar e instalar Postman (si no lo tienes)

1. Ve a [https://www.postman.com/downloads/](https://www.postman.com/downloads/)
2. Descarga la versión para tu sistema operativo (Windows, macOS o Linux)
3. Instálala como cualquier otro programa
4. Ábrela. No necesitas crear una cuenta; puedes hacer clic en **"Skip and go to the app"** o **"Skip signing in"**

### 2.2. Importar los archivos del proyecto

En la raíz del proyecto MetaFit hay **3 archivos** que debes importar:

- `MetaFit_API_Web.postman_collection.json`
- `MetaFit_API_Movil.postman_collection.json`
- `MetaFit_Environment.postman_environment.json`

**Pasos para importar:**

1. En Postman, haz clic en el botón **"Import"** (arriba a la izquierda)
2. Se abrirá una ventana. Haz clic en **"Files"** y luego en **"Upload Files"**
3. Selecciona los **3 archivos** a la vez (mantén presionada la tecla Ctrl/Cmd mientras haces clic en cada uno)
4. Haz clic en **"Open"** y luego en **"Import"**

También puedes arrastrar los 3 archivos directamente desde la carpeta del proyecto hacia la ventana de Postman.

Después de importar, verás en el panel izquierdo:

- **Collections** → `MetaFit API Web` y `MetaFit API Móvil`
- **Environments** → `MetaFit Environment`

---

## 3. Configurar el entorno

El entorno guarda variables como la dirección del servidor (`base_url`), las contraseñas y el token de autenticación. Esto evita tener que escribir esos datos una y otra vez.

### 3.1. Seleccionar el entorno

1. En la esquina superior derecha de Postman, verás un desplegable que dice **"No Environment"**
2. Haz clic y selecciona **"MetaFit Environment"**

### 3.2. Verificar las variables

Haz clic en el icono del ojo (👁️) al lado del desplegable de entornos para ver las variables. Deberías ver:

| Variable | Valor | ¿Qué es? |
|---|---|---|
| `base_url` | `http://localhost:3001` | Dirección del servidor de MetaFit |
| `token` | *(vacío)* | Se llena automáticamente al hacer login |
| `password_admin` | `Admin123!` | Contraseña del administrador (Carlos) |
| `password_recepcionista` | `Maria123!` | Contraseña de la recepcionista (María) |
| `password_entrenador` | `Laura123!` | Contraseña del entrenador (Laura) |
| `password_afiliado` | `MetaFit2025!` | Contraseña de los afiliados (Juan, Ana, etc.) |
| `id_afiliado_test` | `6` | ID de un afiliado de prueba (Juan Martínez) |
| `id_ciclo_test` | `2` | ID de un ciclo de prueba |

> **Nota importante:** Si el backend está corriendo en otro puerto o en una IP diferente (por ejemplo, en una máquina virtual), cambia el valor de `base_url` haciendo clic en el valor y escribiendo la nueva dirección.

---

## 4. Hacer login y obtener el token automáticamente

Muchos endpoints de MetaFit requieren un **token** (una especie de "credencial digital") que demuestra quién eres y qué permisos tienes. Este token se obtiene al iniciar sesión.

### 4.1. ¿Cómo funciona el guardado automático del token?

Dentro de la colección, las peticiones de login tienen un **script** en la pestaña **"Tests"** que se ejecuta automáticamente después de recibir la respuesta:

```javascript
if (pm.response.code === 200) {
    var json = pm.response.json();
    pm.environment.set("token", json.accessToken);
}
```

Este script hace lo siguiente:

1. Si la respuesta es exitosa (código 200), extrae el `accessToken` del JSON que devuelve el servidor
2. Lo guarda en la variable de entorno `token`
3. A partir de ese momento, todas las demás peticiones usan ese token automáticamente

### 4.2. Hacer login como Administrador

1. En el panel izquierdo, expande la colección **"MetaFit API Web"**
2. Expande la carpeta **"🔐 Auth"**
3. Haz clic en la petición **"Login Admin"**
4. Verás que en la pestaña **"Body"** ya está escrita esta información:
   ```json
   {
     "email": "carlos@metafit.com",
     "password": "{{password_admin}}"
   }
   ```
   `{{password_admin}}` es una variable que Postman reemplaza automáticamente por `Admin123!`.
5. Haz clic en el botón azul **"Send"**
6. Abajo deberías ver la respuesta. Si todo sale bien, verás algo como:
   ```json
   {
     "accessToken": "eyJhbGciOiJIUzI1NiIs...",
     "user": {
       "id": 1,
       "email": "carlos@metafit.com",
       "role": "Administrador",
       "nombres": "Carlos",
       "apellidos": "Ramirez"
     }
   }
   ```
7. El token se guardó automáticamente en la variable de entorno. Para verificarlo, haz clic en el ojo (👁️) y verás que `token` ya no está vacío.

### 4.3. Hacer login con otros roles

Repite el mismo proceso para probar otros roles:

| Petición | Email | Rol |
|---|---|---|
| **Login Recepcionista** | `maria@metafit.com` | Recepcionista |
| **Login Entrenador** | `laura@metafit.com` | Entrenador |

Cada vez que hagas login, el token se sobrescribe con el del nuevo usuario.

---

## 5. Probar endpoints protegidos (Web)

Una vez que tienes el token (después de hacer login), puedes probar los endpoints protegidos. El token se envía automáticamente en el encabezado `Authorization: Bearer {{token}}` de cada petición.

### 5.1. GET /usuarios — Listar personal del gimnasio

1. Asegúrate de haber hecho login como **Administrador** (solo este rol puede ver usuarios)
2. En la colección **"MetaFit API Web"**, expande **"👥 Usuarios / Personal"**
3. Haz clic en **"Listar Usuarios"**
4. Haz clic en **"Send"**
5. Deberías ver una lista con todos los empleados del gimnasio (Carlos, Laura, Andrés, María, Pedro)

### 5.2. GET /afiliados — Listar afiliados

1. Asegúrate de tener un token válido (login como Administrador, Entrenador o Recepcionista)
2. En la colección **"MetaFit API Web"**, expande **"🧑‍🤝‍🧑 Afiliados"**
3. Haz clic en **"Listar Afiliados"**
4. Haz clic en **"Send"**
5. Deberías ver los 4 afiliados registrados: Juan, Ana, Luis y Sofía

La respuesta incluye nombre, documento, estado de afiliación, restricciones médicas, ciclo activo y más.

### 5.3. POST /afiliados — Crear un nuevo afiliado

1. Mantén el token de Administrador o Entrenador activo
2. En **"🧑‍🤝‍🧑 Afiliados"**, haz clic en **"Crear Afiliado"**
3. En la pestaña **"Body"** verás los datos del nuevo afiliado:
   ```json
   {
     "nombres": "Nuevo",
     "apellidos": "Afiliado",
     "correo": "nuevo.afiliado@email.com",
     "contrasena": "MetaFit2025!",
     "documento": 1009999999,
     "fecha_nacimiento": "1995-05-15",
     "sexo": "Masculino",
     "telefono": "3009999999",
     "direccion": "Calle Principal",
     "estatura_cm": 170.0
   }
   ```
4. Puedes modificar los valores (por ejemplo, cambiar el nombre o el correo)
5. Haz clic en **"Send"**
6. Si todo sale bien, recibirás como respuesta los datos del afiliado recién creado, incluyendo su `id_usuario`

### 5.4. GET /dashboard/kpis — Ver indicadores del dashboard

1. Asegúrate de haber hecho login como **Administrador** (solo este rol puede ver KPIs)
2. En la colección **"MetaFit API Web"**, expande **"📊 Dashboard"**
3. Haz clic en **"Obtener KPIs"**
4. Haz clic en **"Send"**
5. Verás las estadísticas del gimnasio:
   ```json
   {
     "total_afiliados": 4,
     "afiliados_activos": 4,
     "entrenadores": 2,
     "recepcionistas": 2,
     "ciclos_en_curso": 4,
     "ingresos": 3360000,
     "por_objetivo": [
       { "objetivo": "Aumento de masa", "cantidad": 2 },
       { "objetivo": "Mantenimiento", "cantidad": 1 },
       { "objetivo": "Perdida de grasa", "cantidad": 1 }
     ]
   }
   ```

### 5.5. Otras peticiones útiles para probar

| Petición | Método | Ruta | ¿Qué hace? |
|---|---|---|---|
| Obtener Afiliado por ID | GET | `/afiliados/{{id_afiliado_test}}` | Muestra los datos completos del afiliado 6 (Juan) |
| Listar Ciclos | GET | `/afiliados/{{id_afiliado_test}}/ciclos` | Muestra los ciclos del afiliado 6 |
| Listar Ejercicios | GET | `/catalogo/ejercicios` | Muestra todos los ejercicios disponibles |
| Listar Alimentos | GET | `/catalogo/alimentos` | Muestra todos los alimentos disponibles |
| Listar Restricciones | GET | `/catalogo/restricciones` | Muestra las restricciones médicas |
| Health Check | GET | `/health` | Verifica que el servidor esté funcionando |

---

## 6. Probar los endpoints del móvil

La colección **"MetaFit API Móvil"** contiene las peticiones que usa la aplicación móvil. Todas requieren token de **Afiliado**.

### 6.1. Login como Afiliado

1. En el panel izquierdo, expande la colección **"MetaFit API Móvil"**
2. Expande **"🔐 Auth"** y haz clic en **"Login Afiliado"**
3. Verifica que el cuerpo de la petición sea:
   ```json
   {
     "email": "juan@gmail.com",
     "password": "{{password_afiliado}}"
   }
   ```
4. Haz clic en **"Send"**
5. El token se guarda automáticamente (igual que en la web)

Ahora puedes probar los endpoints que un afiliado ve desde su celular:

### 6.2. GET /afiliados/me — Ver mi perfil

1. En **"👤 Mi Perfil"**, haz clic en **"Obtener Mi Perfil"**
2. Haz clic en **"Send"**
3. Verás los datos personales de Juan Martínez (el afiliado con el que iniciaste sesión)

### 6.3. GET /afiliados/me/ciclos — Ver mis ciclos

1. En **"🔄 Mis Ciclos"**, haz clic en **"Obtener Mis Ciclos"**
2. Haz clic en **"Send"**
3. Verás los ciclos de entrenamiento asignados a Juan

### 6.4. GET /afiliados/me/progreso — Ver mi progreso

1. En **"📈 Mi Progreso"**, haz clic en **"Obtener Mi Progreso"**
2. Haz clic en **"Send"**
3. Verás las mediciones de progreso físico registradas

### 6.5. GET /afiliados/me/restricciones — Ver mis restricciones

1. En **"⚠️ Mis Restricciones"**, haz clic en **"Obtener Mis Restricciones"**
2. Haz clic en **"Send"**
3. Verás las restricciones médicas asociadas al afiliado

### 6.6. Plan de entrenamiento y nutricional

| Petición | Ruta | ¿Qué hace? |
|---|---|---|
| Plan de Entrenamiento | `GET /planes/entrenamiento/{{id_ciclo_test}}` | Muestra las rutinas y ejercicios del ciclo 2 |
| Plan Nutricional | `GET /planes/nutricional/{{id_ciclo_test}}` | Muestra el plan de comidas del ciclo 2 |

---

## 7. Errores comunes y cómo solucionarlos

### 7.1. 401 Unauthorized — "No autorizado"

**¿Qué significa?** El token no se envió, es inválido o está vencido.

**Cómo solucionarlo:**

1. Haz login nuevamente para obtener un token nuevo
2. Verifica que el entorno `MetaFit Environment` esté seleccionado (arriba a la derecha)
3. Haz clic en el ojo (👁️) para verificar que la variable `token` contenga un valor largo (no esté vacía)
4. En la pestaña **"Authorization"** de la petición, verifica que el **Type** sea `Bearer Token` y que el **Token** sea `{{token}}`

### 7.2. 403 Forbidden — "Prohibido"

**¿Qué significa?** Iniciaste sesión correctamente pero tu rol no tiene permiso para ese endpoint.

**Ejemplos:**

- Quieres ver `/dashboard/kpis` pero tienes token de **Recepcionista** (solo **Administrador** puede)
- Quieres ver `/usuarios` pero tienes token de **Afiliado** (solo **Administrador** puede)

**Cómo solucionarlo:**

Haz login con el usuario que tenga el rol adecuado:

| Endpoint | Rol necesario |
|---|---|
| `GET /usuarios` | Administrador |
| `GET /dashboard/kpis` | Administrador |
| `POST /usuarios` | Administrador |
| `POST /catalogo/ejercicios` | Administrador o Entrenador |
| `GET /pagos/metricas` | Administrador |
| `GET /afiliados` | Administrador, Entrenador o Recepcionista |

### 7.3. 500 Internal Server Error

**¿Qué significa?** Algo salió mal en el servidor. Puede ser un error de conexión a la base de datos o un problema en el código.

**Cómo solucionarlo:**

1. Revisa que la base de datos esté corriendo (phpMyAdmin o el contenedor de Docker)
2. Verifica que el backend esté funcionando: envía una petición a **`GET /health`** (está en la colección Web dentro de la carpeta **"🟢 Health Check"**). Deberías recibir:
   ```json
   { "status": "ok", "message": "API MetaFit funcionando correctamente" }
   ```
3. Si `/health` falla, el backend no está corriendo. Ejecuta `docker-compose up` en la terminal (dentro de la carpeta del proyecto)
4. Revisa los logs del backend para ver el error específico

### 7.4. "Could not get any response"

**¿Qué significa?** Postman no pudo conectar con el servidor.

**Cómo solucionarlo:**

1. Verifica que el backend esté encendido (revisa la terminal donde lo ejecutaste)
2. Confirma que la variable `base_url` en el entorno sea correcta (`http://localhost:3001`)
3. Revisa que el puerto no esté bloqueado por un firewall
4. Si usas Docker, asegúrate de que los contenedores estén funcionando:
   ```bash
   docker-compose ps
   ```

### 7.5. Error de conexión a la base de datos

Si ves mensajes como `ECONNREFUSED` o `connect ECONNREFUSED 127.0.0.1:3306`:

1. Verifica que MySQL esté corriendo
2. Si usas Docker, revisa que el contenedor `db` esté activo
3. Si usas MySQL local, verifica las credenciales en el archivo `backend/.env`

---

## 8. Consejos para la sustentación

### 8.1. Orden sugerido de la demostración

1. **Health Check** (`GET /health`) — Muestra que el servidor está funcionando
2. **Login Admin** — Inicia sesión como Carlos (Administrador)
3. **Dashboard KPIs** (`GET /dashboard/kpis`) — Muestra las estadísticas generales
4. **Listar Usuarios** (`GET /usuarios`) — Muestra el personal del gimnasio
5. **Listar Afiliados** (`GET /afiliados`) — Muestra los miembros registrados
6. **Crear Afiliado** (`POST /afiliados`) — Crea un nuevo miembro (cambia el nombre y el correo antes)
7. **Login Afiliado** — Cambia a la colección móvil, inicia sesión como Juan
8. **Mi Perfil** (`GET /afiliados/me`) — Muestra que el afiliado ve sus propios datos
9. **Mis Ciclos** (`GET /afiliados/me/ciclos`) — Muestra los ciclos del afiliado

### 8.2. Trucos para una presentación más profesional

- **Prepara las peticiones con anticipación.** Antes de la sustentación, haz cada petición al menos una vez para asegurarte de que funcionen.
- **Usa datos distintos.** Al crear un afiliado, cambia el nombre y el correo a algo diferente para que se note que realmente se está creando un registro nuevo.
- **Muestra el error controlado.** Haz una petición sin token (borra la variable `token` del entorno) para mostrar que el sistema devuelve `401 Unauthorized` correctamente.
- **Muestra el cambio de roles.** Haz login como Recepcionista e intenta acceder al dashboard para mostrar el `403 Forbidden`.
- **Usa la vista previa bonita.** Asegúrate de que la respuesta esté en formato JSON y haz clic en **"Pretty"** (en la parte de abajo, donde se ve la respuesta) para que se vea ordenada con colores.
- **Pantalla completa.** Presiona `Ctrl+Shift+F` (Windows/Linux) o `Cmd+Shift+F` (macOS) para poner Postman en pantalla completa durante la presentación.

### 8.3. Si algo falla en la sustentación

- **Mantén la calma.** Los errores son parte de una demostración técnica. Explica qué está ocurriendo.
- **Revisa el token.** El 90% de los errores en vivo son por token vencido o no renovado. Vuelve a hacer login.
- **Si el servidor se cayó**, muestra el error 500 y explica qué podría estar pasando (esto demuestra que entiendes el sistema, no que fallaste).
- **Ten una terminal abierta** con `docker-compose logs --tail=50` o similar para ver los logs en tiempo real.

---

> **Documento creado para el proyecto MetaFit — Sistema de Gestión de Gimnasio**
