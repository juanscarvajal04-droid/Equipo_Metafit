# Manual de Generación y Despliegue del APK de MetaFit

## Guía completa para construir, compilar y distribuir la aplicación móvil de MetaFit para Android

---

**Versión del documento:** 1.0  
**Fecha:** Julio 2026  
**Proyecto:** MetaFit — Sport Gym Sede 80  
**Plataforma objetivo:** Android (APK)  
**Herramienta principal:** Expo Application Services (EAS)

---

## Índice

1. [Introducción](#1-introducción)
2. [Requisitos Previos](#2-requisitos-previos)
3. [Configuración de EAS (Expo Application Services)](#3-configuración-de-eas-expo-application-services)
4. [Archivos de Configuración Necesarios](#4-archivos-de-configuración-necesarios)
5. [Perfiles de Build](#5-perfiles-de-build)
6. [Primera Compilación (Build)](#6-primera-compilación-build)
7. [Errores Comunes y Cómo los Solucionamos](#7-errores-comunes-y-cómo-los-solucionamos)
8. [Build Exitosa (5bc1190d)](#8-build-exitosa-5bc1190d)
9. [Descarga del APK](#9-descarga-del-apk)
10. [Integración con el Frontend Web](#10-integración-con-el-frontend-web)
11. [Despliegue en Render](#11-despliegue-en-render)
12. [Cómo Actualizar el APK en el Futuro](#12-cómo-actualizar-el-apk-en-el-futuro)
13. [Preguntas Frecuentes (FAQ)](#13-preguntas-frecuentes-faq)
14. [Glosario](#14-glosario)
15. [Apéndice: Comandos Útiles](#15-apéndice-comandos-útiles)
16. [Apéndice: Archivos Creados o Modificados](#16-apéndice-archivos-creados-o-modificados)

---

## 1. Introducción

### 1.1 ¿Qué es un APK y para qué sirve?

APK significa **Android Package Kit** (Paquete de Aplicación de Android). Es el formato de archivo que usa el sistema operativo Android para distribuir e instalar aplicaciones. Piensa en un APK como el equivalente al instalador `.exe` en Windows: es el archivo que descargas e instalas en tu teléfono para que una aplicación funcione.

Cuando desarrollas una aplicación móvil con herramientas como Expo o React Native, el código que escribes (JavaScript, JSX, CSS) no se puede ejecutar directamente en un teléfono. Necesitas **compilarlo** —es decir, transformarlo— en un formato que Android entienda. Ese formato es el APK.

Un APK contiene:

- **Código compilado (DEX)**: el JavaScript de tu app traducido a instrucciones que Android puede ejecutar.
- **Recursos**: imágenes, fuentes, sonidos, diseños de pantalla.
- **Manifiesto**: un archivo XML que le dice a Android el nombre de la app, los permisos que necesita (cámara, internet, almacenamiento), la versión, y más.
- **Librerías nativas**: código escrito en C/C++ para funcionalidades como procesamiento de imágenes o renderizado.
- **Certificado de firma**: una firma digital que garantiza que la app no ha sido modificada y que tú eres su creador.

### 1.2 ¿Por qué MetaFit necesita un APK descargable desde la web?

MetaFit es una aplicación que permite a los afiliados de Sport Gym Sede 80 acceder a sus rutinas de entrenamiento, planes nutricionales, y seguimiento de progreso desde su teléfono Android.

La razón principal por la que necesitamos un APK descargable desde la web (en vez de publicarlo en Google Play Store) es que MetaFit está en una etapa de desarrollo y pruebas. Publicar en Google Play Store requiere:

- Una cuenta de desarrollador de pago ($25 USD única vez)
- Pasar por un proceso de revisión que puede tomar días
- Cumplir con políticas específicas de contenido y privacidad

Al ofrecer el APK directamente desde la página web de MetaFit, podemos:

1. **Distribuir actualizaciones inmediatamente** — sin esperar revisiones de terceros.
2. **Probar con usuarios reales** antes de un lanzamiento oficial en Play Store.
3. **Mantener el control total** sobre quién y cómo descarga la aplicación.
4. **Iterar rápidamente** — podemos generar y publicar una nueva versión en menos de 30 minutos.

### 1.3 Resumen general del proceso

El proceso completo para generar y publicar el APK de MetaFit sigue estos pasos:

```
  [Código fuente]          [Servidores de Expo]       [Archivo APK]
  ┌──────────────┐         ┌──────────────────┐      ┌────────────┐
  │ movil/       │ ──────> │ EAS Build        │ ──>  │ metafit.apk│
  │ App.js       │  sube   │ • Instala deps   │      │ (~84 MB)   │
  │ package.json │  código │ • Compila Gradle │      └────┬───────┘
  │ eas.json     │         │ • Genera APK      │           │
  │ app.json     │         └──────────────────┘           │
  └──────────────┘                                         ▼
                                                  ┌────────────────┐
                                                  │ Render.com     │
                                                  │ (Frontend Web) │
                                                  │ sirve el APK   │
                                                  │ como estático  │
                                                  └────────────────┘
                                                         │
                                                         ▼
                                                  ┌────────────────┐
                                                  │ Usuario final  │
                                                  │ descarga desde │
                                                  │ la landing page│
                                                  └────────────────┘
```

En términos simples:

1. **Preparas el código** — Configuras los archivos necesarios (eas.json, app.json, package.json).
2. **Inicias la compilación** — Ejecutas un comando que sube tu código a los servidores de Expo.
3. **Expo compila por ti** — Los servidores de Expo instalan dependencias, compilan con Gradle, y generan el APK.
4. **Descargas el APK** — Obtienes el archivo desde la URL que Expo te proporciona.
5. **Lo publicas** — Colocas el APK en la carpeta pública del frontend web para que los usuarios lo descarguen.
6. **Render lo sirve** — El servicio de Render.com actualiza automáticamente el sitio web con el nuevo APK.

Todo este proceso, desde que ejecutas el comando hasta que el APK está disponible en la web, toma aproximadamente **15 a 25 minutos** (dependiendo del tiempo de espera en la cola de compilación de Expo).

---

## 2. Requisitos Previos

Antes de comenzar, necesitas tener instaladas y configuradas las siguientes herramientas. Explicamos cada una con detalle para que entiendas qué son y por qué las necesitas.

### 2.1 Node.js (versión 18 o superior)

**¿Qué es?** Node.js es un entorno de ejecución que permite que JavaScript se ejecute fuera del navegador. Es la base sobre la que funcionan tanto Expo como React Native.

**¿Por qué lo necesitamos?** Expo CLI y EAS CLI son programas escritos en JavaScript que se ejecutan con Node.js. Sin Node.js, no podemos usar estos comandos.

**Cómo verificar si lo tienes instalado:**
```bash
node --version
node -v    # versión corta
```

Si el comando devuelve algo como `v18.20.0` o `v22.x.x`, lo tienes instalado.

**Cómo instalarlo (si no lo tienes):**
- Ve a https://nodejs.org/
- Descarga la versión LTS (Long Term Support — Soporte a Largo Plazo)
- Ejecuta el instalador y sigue los pasos
- Verifica con `node --version` y `npm --version`

### 2.2 npm (viene con Node.js)

**¿Qué es?** npm significa Node Package Manager — es el gestor de paquetes de Node.js. Se usa para instalar librerías, herramientas y dependencias.

**¿Por qué lo necesitamos?** Para instalar Expo CLI, EAS CLI, y todas las dependencias del proyecto React Native.

**Cómo verificar:**
```bash
npm --version
```

### 2.3 Cuenta de Expo (expo.dev)

**¿Qué es?** Expo es una plataforma para desarrollar aplicaciones React Native de forma más sencilla. Expo Application Services (EAS) es su servicio de compilación en la nube.

**¿Por qué la necesitamos?** Para usar EAS Build (que es el servicio que compila el APK en la nube), necesitas una cuenta en expo.dev. La compilación ocurre en los servidores de Expo, no en tu computadora.

**Cómo crearla:**
1. Ve a https://expo.dev/signup
2. Regístrate con tu correo electrónico, GitHub o Google
3. Confirma tu correo electrónico
4. Inicia sesión en https://expo.dev

**Datos de la cuenta usada para MetaFit:**
- **Usuario:** `sebas-carva07`
- **Proyecto:** `@sebas-carva07/movil`
- **Token de acceso:** `WYXqDP0MsU5tEWA6Sp5CpNpmuwIA5o0ilJnFSVnI`

### 2.4 Git

**¿Qué es?** Git es un sistema de control de versiones que permite rastrear cambios en el código y colaborar con otras personas.

**¿Por qué lo necesitamos?** El proyecto MetaFit está en GitHub. Necesitas Git para clonar el repositorio, hacer cambios y subirlos.

**Cómo verificar:**
```bash
git --version
```

**Cómo clonar el proyecto MetaFit:**
```bash
git clone https://github.com/juanscarvajal04-droid/Equipo_Metafit.git
cd Equipo_Metafit
```

### 2.5 Docker (opcional, para probar localmente)

**¿Qué es?** Docker es una herramienta que permite ejecutar aplicaciones en "contenedores" —entornos aislados que incluyen todo lo necesario para que la aplicación funcione.

**¿Por qué es opcional?** No necesitas Docker para compilar el APK. Lo mencionamos porque el proyecto MetaFit incluye un archivo `docker-compose.yml` que levanta todos los servicios (frontend web, backend, base de datos) para pruebas locales.

**Cómo verificar:**
```bash
docker --version
docker-compose --version   # o docker compose version
```

### 2.6 Sistema operativo

**Nota importante:** A diferencia del desarrollo nativo de Android (que requiere Android Studio y solo funciona en Windows, macOS o Linux), Expo EAS Build compila **en la nube**. Esto significa que puedes generar un APK desde **cualquier sistema operativo** —Windows, macOS o Linux— porque la compilación no ocurre en tu computadora sino en los servidores de Expo.

---

## 3. Configuración de EAS (Expo Application Services)

### 3.1 ¿Qué es EAS y por qué lo usamos?

EAS (Expo Application Services) es un conjunto de servicios en la nube ofrecidos por Expo para facilitar el desarrollo y despliegue de aplicaciones React Native. El servicio que nos interesa es **EAS Build**, que permite compilar aplicaciones para Android e iOS sin necesidad de instalar Android Studio, Xcode, o configurar entornos de compilación local.

**¿Por qué usamos EAS Build en lugar de compilar localmente?**

| Aspecto | Compilación local | EAS Build (nube) |
|---------|------------------|------------------|
| Configuración inicial | Instalar Android Studio (~2 GB), SDKs, JDK, Gradle | Solo instalar Node.js y EAS CLI |
| Tiempo de configuración | Horas o días | Minutos |
| Recursos de computadora | Usa tu CPU/RAM (procesos pesados) | Usa servidores de Expo |
| Consistencia | Depende de tu sistema operativo y versiones | Entorno controlado y reproducible |
| iOS | Solo en macOS | Compila en servidores macOS de Expo |

Para MetaFit, elegimos EAS Build porque:
- No necesitamos instalar Android Studio ni el JDK.
- La compilación es consistente (siempre se usa el mismo entorno).
- Podemos generar actualizaciones rápidamente.
- Es gratuito para proyectos pequeños (hasta 30 builds por mes en el plan gratuito).

### 3.2 Instalación de EAS CLI

EAS CLI es la herramienta de línea de comandos que usamos para interactuar con los servicios de EAS.

**Forma recomendada (global):**
```bash
npm install -g eas-cli
```

La bandera `-g` significa "global" —instala el comando `eas` en todo el sistema para que puedas usarlo desde cualquier carpeta.

**Forma alternativa (con npx):**
```bash
npx eas-cli [comando]
```

`npx` ejecuta el comando sin instalarlo permanentemente. Es útil si no quieres instalar nada globalmente. En el proyecto MetaFit, usamos `npx eas-cli` en lugar de `eas` porque:
- No requiere instalación global.
- Siempre usa la última versión disponible.
- Evita conflictos de versiones entre proyectos.

**Verificación de la instalación:**
```bash
eas --version
# o
npx eas-cli --version
```

### 3.3 Inicio de sesión

Para usar EAS Build, necesitas autenticarte con tu cuenta de Expo.

**Método interactivo (con navegador):**
```bash
eas login
```

Este comando abre una ventana en tu navegador para que inicies sesión con tu cuenta de Expo.

**Método con token (para CI/CD o terminal sin navegador):**
```bash
export EXPO_TOKEN="tu_token_de_acceso"
```

El token de acceso se genera desde la página de configuración de Expo:
1. Ve a https://expo.dev/settings/access-tokens
2. Crea un nuevo token con los permisos necesarios
3. Copia el token y úsalo como variable de entorno

**Token de MetaFit:**
```
EXPO_TOKEN="WYXqDP0MsU5tEWA6Sp5CpNpmuwIA5o0ilJnFSVnI"
```

Siempre que veas un comando con `EXPO_TOKEN=` al inicio, significa que estamos usando este método de autenticación.

### 3.4 Verificación: eas whoami

Para confirmar que la sesión está activa y funcionando:
```bash
eas whoami
```

Si todo está bien, este comando devuelve el nombre de usuario de tu cuenta de Expo:
```
sebas-carva07
```

**Con token:**
```bash
EXPO_TOKEN="WYXqDP0MsU5tEWA6Sp5CpNpmuwIA5o0ilJnFSVnI" npx eas-cli whoami
```

### 3.5 Explicación de cada comando

Resumen de los comandos de EAS que usamos:

| Comando | Qué hace |
|---------|----------|
| `eas login` | Inicia sesión en tu cuenta de Expo |
| `eas logout` | Cierra la sesión |
| `eas whoami` | Muestra el usuario autenticado actualmente |
| `eas build:list` | Lista las compilaciones recientes del proyecto |
| `eas build:view <ID>` | Muestra los detalles de una compilación específica |
| `eas build -p android --profile preview` | Inicia una compilación para Android usando el perfil "preview" |
| `eas build:version get` | Muestra la versión actual de la app y el número de build |

---

## 4. Archivos de Configuración Necesarios

Para que EAS Build funcione correctamente, necesitamos tres archivos de configuración clave en la carpeta `movil/` del proyecto. Cada uno tiene un propósito específico.

### 4.1 movil/eas.json

**¿Qué es?** Es el archivo de configuración de EAS Build. Le dice a EAS cómo debe compilar la aplicación: qué tipo de archivo generar (APK o App Bundle), qué versión de CLI usar, y qué perfil de compilación aplicar.

**¿Dónde se encuentra?** En la raíz de la carpeta `movil/` del proyecto.

**Estructura completa del archivo usado en MetaFit:**

```json
{
  "cli": {
    "version": ">= 3.0.0"
  },
  "build": {
    "preview": {
      "android": {
        "buildType": "apk",
        "gradleCommand": ":app:assembleRelease"
      }
    },
    "production": {
      "android": {
        "buildType": "app-bundle"
      }
    }
  }
}
```

**Explicación campo por campo:**

- **`cli.version`**: Especifica la versión mínima de EAS CLI que se debe usar para compilar. El valor `">= 3.0.0"` significa "cualquier versión 3.0.0 o superior". Esto asegura compatibilidad. Si intentas compilar con una versión muy antigua de EAS CLI, el sistema te advertirá.

- **`build`**: Contiene los diferentes "perfiles" de compilación. Cada perfil es una configuración distinta para diferentes propósitos.

- **`build.preview`**: Es el perfil que usamos para generar el APK de prueba. El nombre "preview" significa "vista previa" —es para versiones de prueba que no van a la Play Store.

  - **`build.preview.android.buildType`**: El tipo de archivo a generar. `"apk"` significa que queremos un archivo APK tradicional que se pueda instalar directamente en cualquier Android. La otra opción es `"app-bundle"` que genera un `.aab` (Android App Bundle), que es el formato requerido por Google Play Store.

  - **`build.preview.android.gradleCommand`**: Especifica qué comando de Gradle ejecutar. `":app:assembleRelease"` es el comando estándar para compilar una versión de lanzamiento (release) de la aplicación. La versión "release" está optimizada para producción (código ofuscado, recursos comprimidos). La alternativa sería `":app:assembleDebug"` para una versión de depuración (debug), que es más grande y contiene información adicional para desarrolladores.

- **`build.production`**: Es el perfil para cuando publiquemos la app en Google Play Store.

  - **`build.production.android.buildType`**: Usamos `"app-bundle"` porque Google Play Store ya no acepta APK directamente (desde agosto de 2021). Requiere Android App Bundles (`.aab`).

**¿Por qué no usamos el perfil "production"?** Porque MetaFit aún no está en Google Play Store. Mientras esté en fase de pruebas, el perfil "preview" es suficiente para distribuir el APK directamente desde la web.

### 4.2 movil/app.json

**¿Qué es?** Es el archivo de configuración de la aplicación Expo. Contiene metadatos como el nombre, la versión, el icono, la pantalla de bienvenida, y configuraciones específicas de cada plataforma (Android e iOS).

**¿Dónde se encuentra?** En `movil/app.json`.

**Campos relevantes para la compilación del APK:**

```json
{
  "expo": {
    "name": "MetaFit",
    "slug": "movil",
    "version": "1.0.0",
    "orientation": "portrait",
    "icon": "./assets/images/icon.png",
    "userInterfaceStyle": "light",
    "splash": { ... },
    "ios": { ... },
    "android": {
      "adaptiveIcon": { ... },
      "package": "com.metafit.app"
    },
    "owner": "sebas-carva07",
    "extra": {
      "eas": {
        "projectId": "a5336580-cafa-4055-9614-00390522dd8a"
      }
    },
    "plugins": [ ... ]
  }
}
```

**Explicación de los campos clave para la build:**

- **`expo.name`**: El nombre visible de la aplicación en el dispositivo del usuario. Cuando alguien instale el APK, verá "MetaFit" en su lista de aplicaciones.

- **`expo.slug`**: Es el identificador único del proyecto en Expo. Se usa en las URLs de Expo (ej. `expo.dev/accounts/sebas-carva07/projects/movil`). Debe coincidir con el nombre del proyecto en tu cuenta de Expo.

- **`expo.version`**: La versión de la aplicación. Sigue el formato semver (major.minor.patch). Cuando publiques una actualización importante, debes incrementar este número.

- **`expo.android.package`**: Este es **el identificador único de la aplicación en Android**. También se llama "application ID". Sigue el formato de nombres de paquetes de Java (en reversa). Para MetaFit, usamos `"com.metafit.app"`.

  **¿Por qué es importante?**
  - Es un identificador único a nivel mundial — no pueden existir dos aplicaciones con el mismo package en el mismo dispositivo.
  - Si cambias este valor después de publicar, Android lo tratará como una aplicación diferente (no podrás actualizar la anterior, tendrás que instalar la nueva aparte).
  - Se usa para la firma digital y para la integración con servicios como Google Maps o Firebase.

  **¿Cómo elegimos "com.metafit.app"?**
  - La convención es: `com.[empresa/proyecto].[aplicacion]`
  - `com` = "comercial" (también existen `org` para organizaciones, `io` para startups, etc.)
  - `metafit` = el nombre del proyecto/producto
  - `app` = identifica que es la aplicación móvil (podría haber `web`, `admin`, etc.)

- **`expo.owner`**: El nombre de usuario de Expo que es dueño del proyecto. Esto es necesario cuando el proyecto está bajo una organización o cuenta específica. En nuestro caso, `"sebas-carva07"`.

- **`expo.extra.eas.projectId`**: El identificador único del proyecto en EAS. Se genera automáticamente cuando vinculamos el proyecto local con EAS (con `eas init` o `eas build:configure`). El valor `"a5336580-cafa-4055-9614-00390522dd8a"` identifica al proyecto MetaFit en los servidores de Expo.

  **¿Para qué sirve?** Vincula tu código local con el proyecto en la nube de Expo, permitiendo que EAS Build sepa a qué proyecto pertenece cada compilación.

### 4.3 movil/package.json

**¿Qué es?** Es el archivo de configuración de npm para el proyecto. Define las dependencias (librerías que usa la aplicación), scripts, y metadatos del proyecto.

**¿Dónde se encuentra?** En `movil/package.json`.

**Dependencias clave para la compilación del APK:**

```json
{
  "name": "movil",
  "version": "1.0.0",
  "main": "expo/AppEntry.js",
  "dependencies": {
    "expo": "~55.0.28",
    "react": "19.2.0",
    "react-native": "0.83.10",
    "react-native-reanimated": "4.2.1",
    "react-native-worklets": "0.7.4",
    "react-native-gesture-handler": "~2.30.0",
    "react-native-safe-area-context": "~5.6.2",
    "react-native-screens": "~4.23.0",
    "@react-navigation/native": "^7.3.3",
    "@react-navigation/bottom-tabs": "^7.18.2",
    "@react-navigation/native-stack": "^7.17.5",
    "axios": "^1.18.0",
    "expo-constants": "~55.0.17",
    "expo-status-bar": "~55.0.0",
    "expo-linear-gradient": "~55.0.16",
    "expo-device": "~55.0.19",
    "expo-image-picker": "~55.0.22",
    "expo-image": "~55.0.11",
    "@react-native-async-storage/async-storage": "2.2.0"
  },
  "devDependencies": {
    "typescript": "~5.9.2",
    "@types/react": "~19.2.2"
  }
}
```

**Explicación de las dependencias más importantes:**

- **`expo`**: El núcleo de Expo. Versión `~55.0.28`. Expo SDK 55 es la plataforma base sobre la que construimos la app.

- **`react-native`**: El framework de React Native. Versión `0.83.10` para Expo SDK 55.

- **`react-native-reanimated`**: Librería de animaciones de alto rendimiento. Versión `4.2.1`. **Esta librería fue la causa de los errores iniciales de compilación** (lo explicamos en detalle en la sección de errores).

- **`react-native-worklets`**: Librería que permite ejecutar código en hilos separados (worklets) para mejorar el rendimiento. **La versión `0.7.4` fue clave para solucionar el error de compilación.** Inicialmente se había instalado la versión `0.8.3` que era incompatible con `react-native-reanimated@4.2.1`.

- **`react-native-gesture-handler`**: Librería para manejar gestos táctiles (deslizamientos, pellizcos, etc.).

**El tilde `~` vs el caret `^`:**

En npm, estos símbolos tienen significados específicos:
- `~1.2.3` — permite actualizaciones de parche: 1.2.4, 1.2.5, pero NO 1.3.0
- `^1.2.3` — permite actualizaciones menores: 1.3.0, 1.4.0, pero NO 2.0.0
- `"1.2.3"` — versión exacta, no permite ninguna actualización

**El conflicto de react-native-worklets:**

Cuando usas Expo SDK 55 con React Native Reanimated 4.2.1, necesitas una versión específica de react-native-worklets:

| react-native-reanimated | react-native-worklets compatible |
|------------------------|----------------------------------|
| 4.2.1 | 0.7.x (0.7.0 a 0.7.4) |
| 4.3.0+ | 0.8.x (0.8.0+) |

Inicialmente, npm instaló automáticamente la última versión disponible de `react-native-worklets` (0.8.3) porque en `package.json` no estaba listada como dependencia directa. npm la resolvió como "la última versión compatible con React Native 0.83". Pero Reanimated 4.2.1 tiene una **verificación interna** que rechaza versiones de worklets superiores a 0.7.x.

La solución fue agregar `react-native-worklets` como dependencia directa con la versión exacta `0.7.4`, forzando a npm a usar esa versión en lugar de la 0.8.3.

---

## 5. Perfiles de Build

### 5.1 ¿Qué es un perfil de build?

Un perfil de build es una configuración predefinida que le dice a EAS cómo debe compilar la aplicación. Piensa en los perfiles como "recetas de compilación": cada receta produce un tipo diferente de archivo, con diferentes configuraciones.

### 5.2 Diferencia entre "preview" (APK) y "production" (App Bundle)

Los dos perfiles principales que definimos en MetaFit:

| Característica | Preview (APK) | Production (AAB) |
|---------------|---------------|------------------|
| **Archivo generado** | `.apk` | `.aab` |
| **Tamaño** | ~84 MB | ~40-50 MB (optimizado) |
| **Instalación directa** | Sí, en cualquier Android | No, solo a través de Play Store |
| **Uso principal** | Pruebas, distribución directa | Publicación oficial en Google Play |
| **Actualizaciones** | El usuario descarga e instala manualmente | Play Store maneja las actualizaciones |
| **Firma** | Firma automática de EAS | Requiere firma de publicación propia |

**¿Qué es un Android App Bundle (.aab)?**

El formato `.aab` es más moderno que el APK. En lugar de ser un archivo completo, es un "contenedor" que Google Play Store usa para generar APKs optimizados para cada dispositivo específico. Por ejemplo:
- Un usuario con un teléfono de alta resolución recibe solo los recursos gráficos que necesita (no descarga los de baja y media resolución).
- Un usuario con un procesador ARM64 recibe solo las librerías nativas para su arquitectura.

Esto reduce significativamente el tamaño de la descarga.

### 5.3 ¿Por qué elegimos "preview" para MetaFit?

Usamos el perfil "preview" porque:

1. **MetaFit no está en Google Play Store.** Para distribuir un `.aab`, necesitas subirlo a Play Store, que es el único lugar que sabe cómo procesar este formato. Como nosotros distribuimos el APK directamente desde la web, necesitamos un APK tradicional.

2. **Los usuarios instalan directamente.** Al descargar un APK desde la web, el usuario abre el archivo y Android lo instala. Esto no funciona con `.aab`.

3. **Simplicidad.** El perfil "preview" no requiere configurar firma de publicación (keystore de release). EAS genera una firma automática para builds de preview. Para producción, necesitarías un keystore propio que debes guardar de forma segura.

### 5.4 Cómo crear o modificar perfiles en eas.json

Para agregar un nuevo perfil o modificar uno existente, editas el archivo `movil/eas.json`.

**Ejemplo: agregar un perfil "debug" para probar más rápido:**

```json
{
  "build": {
    "preview": { ... },
    "debug": {
      "android": {
        "buildType": "apk",
        "gradleCommand": ":app:assembleDebug"
      }
    },
    "production": { ... }
  }
}
```

**Ejemplo: agregar variables de entorno específicas para un perfil:**

```json
{
  "build": {
    "preview": {
      "android": {
        "buildType": "apk",
        "gradleCommand": ":app:assembleRelease"
      },
      "env": {
        "API_URL": "https://metafit-backend-rr18.onrender.com"
      }
    }
  }
}
```

Las variables de entorno en `env` se inyectan durante la compilación y están disponibles en tu código como `process.env.API_URL`.

---

## 6. Primera Compilación (Build)

### 6.1 Comando exacto

Para compilar el APK de MetaFit, ejecutamos el siguiente comando desde la carpeta `movil/` del proyecto:

```bash
cd movil/
EXPO_TOKEN="WYXqDP0MsU5tEWA6Sp5CpNpmuwIA5o0ilJnFSVnI" npx eas-cli build -p android --profile preview --non-interactive
```

**Desglose del comando:**

- `EXPO_TOKEN="..."` — establece la variable de entorno con el token de acceso a Expo. Esto autentica la sesión sin necesidad de `eas login`.

- `npx eas-cli` — ejecuta EAS CLI sin instalarlo globalmente. npx descarga automáticamente la última versión si no está en caché.

- `build` — subcomando que inicia una compilación.

- `-p android` — especifica la plataforma. Solo compilamos para Android. La opción sería `-p ios` o `--platform ios` para iOS.

- `--profile preview` — elige el perfil de compilación "preview" que definimos en `eas.json`. Sin esta bandera, EAS usa el perfil por defecto (que suele ser "production").

- `--non-interactive` — evita que el comando pregunte cosas durante la ejecución. Útil para automatización y scripts.

### 6.2 ¿Qué hace este comando por dentro?

Cuando ejecutas el comando, ocurren varias cosas en orden. Explicamos cada paso:

#### Paso 1: Verificación de credenciales

```
✔ Using remote Android credentials (Expo server)
✔ Using Keystore from configuration: Build Credentials
```

EAS verifica que tengas sesión iniciada y que el proyecto tenga credenciales de Android configuradas (keystore para firmar el APK). Si es la primera vez, EAS genera automáticamente un keystore.

#### Paso 2: Compresión y subida del código

```
Compressing project files and uploading to EAS Build.
- Uploading to EAS Build (0 / 3.7 MB)
✔ Uploaded to EAS
```

EAS comprime todo el contenido de la carpeta `movil/` (excluyendo `node_modules/` y archivos ignorados por `.gitignore`) y lo sube a los servidores de Expo. El tamaño típico es de 3 a 5 MB comprimido (sin incluir node_modules).

#### Paso 3: Cálculo de fingerprint

```
- Computing project fingerprint
✔ Computed project fingerprint
```

EAS calcula un "fingerprint" (huella digital) del proyecto, que es un hash único basado en el contenido de los archivos. Esto permite:
- Identificar builds duplicadas (si subes el mismo código dos veces, detecta que es idéntico)
- Vincular la build con el commit de Git

#### Paso 4: Encolamiento

```
See logs: https://expo.dev/accounts/sebas-carva07/projects/movil/builds/[ID]

Waiting for build to complete.
```

La build entra en una cola. Dependiendo de la demanda, puede esperar desde unos segundos hasta varias horas. EAS procesa las builds en orden de llegada, pero los usuarios con plan de pago tienen prioridad.

En el plan gratuito de Expo, los tiempos de espera típicos son:
- Sin espera (baja demanda): 0-2 minutos
- Demanda normal: 5-15 minutos
- Alta demanda: 30-60 minutos

#### Paso 5: Instalación de dependencias (en el servidor)

```
npm install
npx expo install --check
```

El servidor de EAS ejecuta `npm install` para instalar todas las dependencias listadas en `package.json`. También ejecuta `expo doctor` para verificar que las versiones sean compatibles.

#### Paso 6: Prebuild

```
npx expo prebuild
```

Expo genera los archivos nativos necesarios para la compilación (carpetas `android/` e `ios/`). Esto incluye:
- El proyecto de Android (build.gradle, settings.gradle, AndroidManifest.xml)
- El proyecto de iOS (si aplica)
- Los archivos de configuración de cada plugin nativo

#### Paso 7: Compilación con Gradle

```
./gradlew :app:assembleRelease
```

Este es el paso más importante y el que más tiempo toma. Gradle es el sistema de compilación de Android que:
1. Compila el código Java/Kotlin de las librerías nativas
2. Compila los recursos (imágenes, layouts, etc.)
3. Transforma el JavaScript de React Native en código DEX (Dalvik Executable)
4. Empaqueta todo en un APK
5. Firma el APK con el keystore

#### Paso 8: Generación del APK

```
✔ Build finished successfully
```

Gradle termina y EAS obtiene el APK generado. Lo almacena en los servidores de Expo y te proporciona una URL de descarga.

### 6.3 Monitorear el progreso

Durante la compilación, EAS muestra una URL en la consola:

```
See logs: https://expo.dev/accounts/sebas-carva07/projects/movil/builds/5bc1190d-537a-4c57-a219-6d9f08754e25
```

Puedes abrir esta URL en tu navegador para ver:
- El progreso en tiempo real (barras de avance)
- Los logs completos de cada fase
- Los errores detallados si algo falla
- La URL de descarga cuando termine

También puedes ver el estado desde la terminal:

```bash
EXPO_TOKEN="WYXqDP0MsU5tEWA6Sp5CpNpmuwIA5o0ilJnFSVnI" npx eas-cli build:view [BUILD_ID] --json
```

### 6.4 Tiempos estimados

Estos son los tiempos reales observados durante la compilación de MetaFit:

| Fase | Duración |
|------|----------|
| Espera en cola (queue) | 5 - 25 minutos |
| Carga de código | ~5 segundos |
| Instalación de dependencias | ~30 segundos |
| Expo doctor | ~10 segundos |
| Prebuild | ~20 segundos |
| Compilación Gradle | ~2 minutos |
| Post-procesamiento | ~10 segundos |
| **Total aproximado** | **8 - 28 minutos** |

---

## 7. Errores Comunes y Cómo los Solucionamos

Durante el proceso de compilación del APK de MetaFit, nos encontramos con varios errores. Esta sección documenta cada uno, cómo diagnosticarlo y cómo solucionarlo.

### 7.1 Error de Worklets vs Reanimated

Este fue el error principal que impidió las primeras 4 compilaciones.

#### Síntoma

El build falla con:

```
EAS_BUILD_UNKNOWN_GRADLE_ERROR
Gradle build failed with unknown error.
```

Y en los logs detallados de la fase "Run gradlew" encontramos:

```
Execution failed for task ':react-native-reanimated:assertWorkletsVersionTask'.
[Reanimated] Your installed version of Worklets (0.8.3) is not compatible
with installed version of Reanimated (4.2.1). Please install the latest
supported version of Worklets 0.7.x or older.
```

#### Causa

React Native Reanimated es una librería para animaciones fluidas en React Native. A partir de la versión 4, Reanimated utiliza `react-native-worklets` como una dependencia separada para ejecutar código en hilos de trabajo (worklets).

El problema es que `react-native-worklets` no estaba listado como dependencia directa en `package.json`. npm, al resolver las dependencias, instaló la **última versión disponible** (0.8.3), asumiendo que era la correcta. Sin embargo, Reanimated 4.2.1 tiene una **verificación explícita** que rechaza versiones de worklets superiores a 0.7.x.

**¿Por qué existe esta verificación?** Porque entre worklets 0.7.x y 0.8.x hubo cambios importantes en la API que no son compatibles con versiones anteriores (breaking changes). La verificación evita que la aplicación compile con versiones incompatibles y luego falle misteriosamente en tiempo de ejecución.

#### Solución

La solución consistió en agregar `react-native-worklets` como dependencia directa en `package.json` con la versión compatible:

```bash
npm install react-native-worklets@0.7.4
```

Este comando:
1. Agrega `"react-native-worklets": "0.7.4"` a `package.json` (sección `dependencies`)
2. Descarga e instala la versión exacta 0.7.4
3. Actualiza `package-lock.json` con la versión correcta

Después de esto, hay que:
1. Hacer commit y push de los cambios (`package.json` y `package-lock.json`)
2. Volver a ejecutar la compilación

#### Cómo lo hicimos paso a paso

```bash
# 1. Instalar la versión compatible de react-native-worklets
cd movil/
npm install react-native-worklets@0.7.4

# 2. Verificar que se instaló correctamente
npm ls react-native-worklets
# → react-native-worklets@0.7.4

# 3. Verificar que reanimated está contento
npm ls react-native-reanimated
# → react-native-reanimated@4.2.1

# 4. Hacer commit y push
cd ..
git add movil/package.json movil/package-lock.json
git commit -m "Fix: pin react-native-worklets@0.7.4 para compatibilidad con reanimated"
git push

# 5. Recompilar
EXPO_TOKEN="WYXqDP0MsU5tEWA6Sp5CpNpmuwIA5o0ilJnFSVnI" npx eas-cli build -p android --profile preview
```

### 7.2 Error de dependencias desactualizadas (expo doctor)

#### Síntoma

El build falla con errores de Gradle, y en los logs de "expo doctor" vemos:

```
17/19 checks passed. 2 checks failed.

✖ Check that packages match versions required by installed Expo SDK
  Major version mismatches:
    babel-preset-expo     expected ~55.0.8    found 57.0.4
  Patch version mismatches:
    expo                  expected ~55.0.28   found 55.0.26
    react-native          expected 0.83.10    found 0.83.6
    ...y otros 7 paquetes
```

#### Causa

Cuando instalamos paquetes manualmente con `npm install` (sin usar `npx expo install`), podemos instalar versiones que no coinciden con las que Expo SDK 55 espera. Cada versión del SDK de Expo tiene versiones específicas de paquetes que han sido probadas juntas. Usar versiones diferentes puede causar errores de compilación o comportamiento inesperado.

#### Solución

Usar el comando `expo install --check` para detectar y corregir discrepancias:

```bash
cd movil/
npx expo install --check
```

Este comando:
1. Compara las versiones instaladas con las versiones esperadas para el SDK actual
2. Muestra una lista de paquetes desactualizados
3. Sugiere los comandos para actualizarlos

Luego ejecutamos:

```bash
npx expo install expo@~55.0.28 expo-constants@~55.0.17 \
  expo-device@~55.0.19 expo-linear-gradient@~55.0.16 \
  expo-linking@~55.0.16 expo-splash-screen@~55.0.23 \
  expo-system-ui@~55.0.20 expo-web-browser@~55.0.18 \
  react-native@0.83.10
```

Y para el paquete con versión major incorrecta:

```bash
npm uninstall babel-preset-expo
npx expo install babel-preset-expo@~55.0.8
```

**Importante:** Siempre que necesites instalar un paquete relacionado con Expo, usa `npx expo install` en lugar de `npm install`, porque `expo install` selecciona la versión exacta compatible con tu SDK.

#### Cómo leer los logs de EAS para diagnosticar

Cuando una compilación falla, puedes obtener los logs detallados de dos formas:

**Opción 1: Desde el navegador**
1. Ve a la URL de la build que aparece en la terminal:
   `https://expo.dev/accounts/[usuario]/projects/[proyecto]/builds/[ID]`
2. Busca la fase "Run gradlew" o "expo doctor"
3. Haz clic para expandir y ver los detalles

**Opción 2: Desde la terminal**
```bash
# Ver el resumen de la build
EXPO_TOKEN="..." npx eas-cli build:view [BUILD_ID] --json

# El JSON incluye URLs de logs
# "logFiles": ["https://storage.googleapis.com/..."]
```

**Cómo interpretar los logs:**
- Busca la palabra "FAILED" o "ERROR"
- Encuentra el task de Gradle que falló (ej. `:react-native-reanimated:assertWorkletsVersionTask FAILED`)
- Lee el mensaje de error completo (suele explicar la causa y la solución)
- Si el error no es claro, busca en Google el mensaje exacto

### 7.3 Otros errores posibles y cómo prevenirlos

#### Error: "babel-preset-expo" no encontrado

**Síntoma:** La compilación falla porque no encuentra el preset de Babel.

**Causa:** No existe `babel.config.js` o está mal configurado, o `babel-preset-expo` no está instalado.

**Solución:**
```bash
# Crear el archivo babel.config.js
echo 'module.exports = function(api) {
  api.cache(true);
  return { presets: ["babel-preset-expo"] };
};' > movil/babel.config.js

# Instalar el preset
cd movil/
npx expo install babel-preset-expo
```

#### Error: "react-native-gesture-handler" no importado

**Síntoma:** La aplicación falla al iniciar con errores de gestos.

**Causa:** `react-native-gesture-handler` requiere ser importado al inicio de la aplicación, antes que cualquier otro componente.

**Solución:** Agregar el import al principio de `App.js`:
```javascript
import 'react-native-gesture-handler';
// El resto de la aplicación...
```

#### Error: "package" no definido en app.json

**Síntoma:** EAS no puede compilar porque falta el identificador de Android.

**Causa:** El campo `android.package` no está configurado en `app.json`.

**Solución:** Agregar el package en `app.json`:
```json
{
  "expo": {
    "android": {
      "package": "com.metafit.app"
    }
  }
}
```

#### Error de espacio en disco en EAS

**Síntoma:** La compilación falla con errores de "No space left on device" o "Out of memory".

**Causa:** Los builds gratuitos tienen límites de recursos. Si tu proyecto tiene muchas dependencias pesadas, puede exceder estos límites.

**Prevención:**
- Mantén las dependencias al mínimo necesario
- Usa `expo install` para instalar solo las versiones necesarias
- No incluyas archivos grandes innecesarios en el proyecto

---

## 8. Build Exitosa (5bc1190d)

### 8.1 Cómo confirmar que la build terminó bien

Después de ejecutar el comando de build, puedes verificar el estado de varias formas:

**Desde la terminal (esperando la build):**
```bash
EXPO_TOKEN="WYXqDP0MsU5tEWA6Sp5CpNpmuwIA5o0ilJnFSVnI" npx eas-cli build -p android --profile preview
```

Si la build es exitosa, el último mensaje será:
```
✔ Build finished successfully

🤖 Android build:
  Application Archive: https://expo.dev/artifacts/eas/1bfCWUQ6rMFIYkJLU15dgp_dBaZvyGu2D1GSWh67pSo.apk
```

**Verificando una build específica:**
```bash
EXPO_TOKEN="WYXqDP0MsU5tEWA6Sp5CpNpmuwIA5o0ilJnFSVnI" npx eas-cli build:view 5bc1190d-537a-4c57-a219-6d9f08754e25 --json
```

**Desde la página web de Expo:**
Abre la URL de la build en tu navegador. Una build exitosa muestra un checkmark verde y el botón "Download" para el APK.

### 8.2 Datos de la build exitosa de MetaFit

| Campo | Valor |
|-------|-------|
| ID de build | `5bc1190d-537a-4c57-a219-6d9f08754e25` |
| Estado | `FINISHED` |
| Perfil | `preview` |
| Plataforma | Android |
| SDK de Expo | 55.0.0 |
| Versión de la app | 1.0.0 (build 1) |
| Commit de Git | `5d89f1e` — "Fix APK build: pin react-native-worklets@0.7.4, fix expo deps versions" |
| Fecha de creación | 2026-07-29T01:29:27Z |
| Fecha de finalización | 2026-07-29T01:48:29Z |
| Duración total | ~19 minutos (incluyendo cola) |
| APK URL | `https://expo.dev/artifacts/eas/1bfCWUQ6rMFIYkJLU15dgp_dBaZvyGu2D1GSWh67pSo.apk` |

### 8.3 Tamaño esperado del APK

Para MetaFit, el APK generado pesa aproximadamente **84 MB** (87,666,113 bytes). Este tamaño es normal para una aplicación React Native con Expo SDK 55 que incluye:

- El motor de JavaScript (Hermes)
- Librerías nativas (Reanimated, Gesture Handler, Async Storage, etc.)
- Recursos gráficos (iconos, splash screen, imágenes)
- Código de la aplicación (pantallas, navegación, servicios)

**Nota:** El tamaño puede variar ligeramente entre builds si se agregan o quitan dependencias o recursos.

### 8.4 Cómo verificar que es un APK real (no un placeholder)

Usa el comando `file` en Linux/macOS para verificar el tipo de archivo:

```bash
file metafit.apk
```

La salida debe ser similar a:
```
metafit.apk: Android package (APK), with gradle app-metadata.properties
```

Si en cambio ves algo como `ASCII text` o `HTML document`, el archivo es un placeholder y no un APK real.

También puedes verificar el tamaño:
```bash
ls -lh metafit.apk
```

Un APK real de MetaFit debe pesar aproximadamente 84 MB. Un placeholder típicamente pesa menos de 1 KB.

---

## 9. Descarga del APK

### 9.1 Cómo descargar el APK desde la URL de Expo

Una vez que la build ha terminado exitosamente, Expo te proporciona una URL de descarga. Hay varias formas de descargar el archivo.

### 9.2 Usando el navegador (descarga manual)

1. Abre la URL de la build: `https://expo.dev/accounts/sebas-carva07/projects/movil/builds/5bc1190d-537a-4c57-a219-6d9f08754e25`
2. Inicia sesión con tu cuenta de Expo si es necesario
3. Busca la sección "Artifacts" o "Build artifacts"
4. Haz clic en el botón "Download" junto al archivo APK
5. El navegador descargará el archivo a tu carpeta de descargas

### 9.3 Usando curl (descarga por terminal)

Para descargar el APK directamente desde la terminal sin necesidad de abrir un navegador:

```bash
curl -L --max-time 120 -o metafit.apk "https://expo.dev/artifacts/eas/1bfCWUQ6rMFIYkJLU15dgp_dBaZvyGu2D1GSWh67pSo.apk"
```

**Desglose del comando:**
- `curl` — herramienta de línea de comandos para transferir datos desde/hacia servidores
- `-L` — sigue redirecciones (Expo redirige la URL varias veces antes de llegar al archivo real en Google Cloud Storage)
- `--max-time 120` — tiempo máximo de espera de 120 segundos (2 minutos). El APK pesa 84 MB y puede tomar tiempo en descargarse
- `-o metafit.apk` — guarda el archivo con el nombre `metafit.apk` en la carpeta actual
- La URL entre comillas — la URL del APK proporcionada por Expo

**Salida esperada durante la descarga:**
```
  % Total    % Received % Xferd  Average Speed   Time    Time     Time  Current
                                 Dload  Upload   Total   Spent    Left  Speed
100 83.6M  100 83.6M    0     0  21.7M      0  0:00:03  0:00:03 --:--:-- 31.2M
```

### 9.4 Verificación después de la descarga

Una vez descargado el archivo, verifica que sea correcto:

```bash
# Verificar el tamaño
ls -lh metafit.apk
# Debe mostrar: -rw-rw-r-- 1 usuario usuario 84M fecha metafit.apk

# Verificar el tipo de archivo
file metafit.apk
# Debe mostrar: Android package (APK), with gradle app-metadata.properties

# Verificar el checksum (opcional, para asegurar integridad)
md5sum metafit.apk
sha256sum metafit.apk
```

---

## 10. Integración con el Frontend Web

### 10.1 Dónde se guarda el APK

El APK se almacena en la carpeta `public` del frontend web de MetaFit:

```
Equipo_Metafit/
└── frontend_web/
    └── public/
        └── app/
            └── metafit.apk      ← El APK descargado de EAS
```

### 10.2 ¿Por qué en esa carpeta?

En los proyectos de **Vite** (la herramienta que usamos para construir el frontend web de MetaFit), la carpeta `public/` tiene una propiedad especial: **todo su contenido se sirve como archivos estáticos** en la raíz del sitio web.

Esto significa que:
- Un archivo en `public/favicon.svg` se sirve en `https://metafit-frontend-78x6.onrender.com/favicon.svg`
- Un archivo en `public/app/metafit.apk` se sirve en `https://metafit-frontend-78x6.onrender.com/app/metafit.apk`

No necesitas configurar nada adicional —Vite copia automáticamente el contenido de `public/` al directorio de compilación final (`dist/`) intacto, sin procesarlo ni modificarlo. Esto es ideal para archivos binarios como APKs, PDFs, o imágenes que deben servirse tal cual.

### 10.3 Cómo se enlaza desde la landing page

En la landing page de MetaFit, hay una sección "App Móvil" que promociona la aplicación. El botón de descarga usa el siguiente código HTML/JSX:

```jsx
<a
  href="/app/metafit.apk"
  download
  className={s.btnAppDownload}
>
  📥 Descargar APK para Android
</a>
```

**Explicación del enlace:**

- **`href="/app/metafit.apk"`**: La ruta relativa donde se encuentra el APK. Al ser relativa, funciona tanto en desarrollo local (`http://localhost:5173/app/metafit.apk`) como en producción (`https://metafit-frontend-78x6.onrender.com/app/metafit.apk`).

- **`download`**: Este atributo HTML le indica al navegador que debe descargar el archivo en lugar de intentar abrirlo. Sin este atributo, algunos navegadores podrían intentar mostrar el APK como texto (lo cual no funcionaría). Con `download`, el navegador abre el diálogo "Guardar como..." y sugiere el nombre del archivo.

- **`className={s.btnAppDownload}`**: Clase CSS para estilizar el botón (colores, bordes redondeados, animaciones hover).

Hay una línea adicional que muestra la versión:

```jsx
<div className={s.appVersion}>Versión 1.0 · Solo Android · Gratis</div>
```

### 10.4 Cómo Render sirve el archivo estático

Render (la plataforma donde está desplegado el frontend web) construye el proyecto usando el plan de "Static Site". Durante el proceso de build:

1. Render ejecuta `npm install` para instalar las dependencias del frontend.
2. Render ejecuta `npm run build` (que corre `vite build`) para compilar el proyecto.
3. Vite copia todo el contenido de `public/` (incluyendo `app/metafit.apk`) al directorio `dist/`.
4. Render toma el contenido de `dist/` y lo sirve a través de su CDN global (Cloudflare).

Cuando un usuario visita `https://metafit-frontend-78x6.onrender.com/app/metafit.apk`, Render:
1. Recibe la solicitud HTTP GET
2. Busca el archivo `app/metafit.apk` en el directorio estático
3. Responde con HTTP 200 y el contenido del archivo
4. Incluye el header `Content-Type: application/vnd.android.package-archive` para que el navegador sepa que es un APK de Android
5. Incluye el header `Content-Length: 87666113` para que el navegador sepa el tamaño

---

## 11. Despliegue en Render

### 11.1 ¿Qué hace Render cuando hacemos git push?

Render está configurado para **auto-deploy** (despliegue automático). Esto significa que cada vez que hacemos push a la rama `main` del repositorio en GitHub, Render detecta el cambio y automáticamente:

1. **Detecta el cambio** — Render recibe un webhook de GitHub notificando que hay nuevos commits en `main`.
2. **Clona el repositorio** — Descarga la última versión del código.
3. **Construye el proyecto** — Ejecuta los comandos definidos en el plan de despliegue (generalmente `npm install && npm run build`).
4. **Publica** — Toma el contenido de la carpeta `dist/` (o la que esté configurada como directorio de publicación) y lo sirve como sitio estático.
5. **Actualiza el CDN** — Cloudflare, el CDN de Render, distribuye los nuevos archivos a sus servidores alrededor del mundo.

### 11.2 Auto-deploy del Static Site

El frontend de MetaFit está desplegado como un **Static Site** en Render. Esto significa que Render solo sirve archivos estáticos (HTML, CSS, JavaScript, imágenes, APK) —no hay un servidor backend para el frontend (el backend real está en otro servicio).

La URL del frontend es: `https://metafit-frontend-78x6.onrender.com`

Cuando haces push de un nuevo APK, el proceso es:

```bash
# 1. Reemplazar el APK antiguo con el nuevo
cp /ruta/al/nuevo/metafit.apk frontend_web/public/app/metafit.apk

# 2. Hacer commit y push
git add frontend_web/public/app/metafit.apk
git commit -m "Actualizar APK a versión X.Y.Z"
git push origin main
# ↑ Esto activa el auto-deploy en Render

# 3. Esperar a que Render termine de desplegar
# (normalmente 1-3 minutos para un Static Site)
```

### 11.3 Verificación del APK en Render

Una vez que Render ha terminado de desplegar, puedes verificar que el APK está siendo servido correctamente:

```bash
curl -I "https://metafit-frontend-78x6.onrender.com/app/metafit.apk"
```

La respuesta debe ser similar a:

```
HTTP/2 200
content-type: application/vnd.android.package-archive
content-length: 87666113
cache-control: public, max-age=0, s-maxage=300
accept-ranges: bytes
last-modified: Wed, 29 Jul 2026 01:51:21 UTC
```

**Qué verificar en la respuesta:**

- **HTTP/2 200**: El archivo existe y se sirve correctamente (código 200 = OK). Si ves 404, el archivo no está en la ubicación correcta.
- **content-type**: Debe ser `application/vnd.android.package-archive`. Este es el tipo MIME oficial para APKs de Android.
- **content-length**: Debe coincidir con el tamaño de tu APK (aproximadamente 87,666,113 bytes para MetaFit).
- **last-modified**: La fecha y hora de la última modificación del archivo. Debe coincidir con el momento en que hiciste el deploy.

### 11.4 Despliegue manual desde el dashboard de Render

Si por alguna razón el auto-deploy no funciona, puedes forzar un despliegue manual desde el dashboard de Render:

1. Ve a https://dashboard.render.com/
2. Inicia sesión con tu cuenta
3. Selecciona el servicio "metafit-frontend"
4. Haz clic en "Manual Deploy" → "Deploy latest commit"
5. Render construirá y publicará el sitio con el último commit de la rama configurada

---

## 12. Cómo Actualizar el APK en el Futuro

### 12.1 Paso a paso para generar una nueva versión

Cuando hagas cambios en la aplicación móvil (nuevas funcionalidades, corrección de errores, cambios en la interfaz) y quieras generar un nuevo APK, sigue estos pasos:

#### Paso 1: Prepara el código

```bash
# Asegúrate de estar en la rama correcta
git checkout feature/juan-carvajal  # o la rama donde estés trabajando

# Haz tus cambios en el código de la app móvil
# (modificar pantallas, agregar funcionalidades, etc.)
```

#### Paso 2: Actualiza la versión (opcional pero recomendado)

Edita `movil/app.json` y actualiza el número de versión:

```json
{
  "expo": {
    "version": "1.1.0",    // ← Incrementa según la magnitud del cambio
    "android": {
      "versionCode": 2      // ← Incrementa en 1 por cada build
    }
  }
}
```

**Reglas de versionado semántico (semver):**
- **Major (1.x.x)**: Cambios que rompen compatibilidad hacia atrás
- **Minor (x.1.x)**: Nuevas funcionalidades, compatibles con versiones anteriores
- **Patch (x.x.1)**: Corrección de errores, cambios menores

`versionCode` es un número entero que Android usa internamente para determinar si una actualización es más reciente. Debe incrementarse en 1 por cada nueva versión del APK.

#### Paso 3: Verifica las dependencias

```bash
cd movil/

# Verificar que todas las dependencias estén actualizadas
npx expo install --check

# Si hay discrepancias, corregirlas
npx expo install [paquetes...]
```

#### Paso 4: Haz commit de los cambios

```bash
git add movil/
git commit -m "Versión 1.1.0: [descripción de los cambios]"
git push
```

#### Paso 5: Compila el nuevo APK

```bash
EXPO_TOKEN="WYXqDP0MsU5tEWA6Sp5CpNpmuwIA5o0ilJnFSVnI" npx eas-cli build -p android --profile preview --non-interactive
```

#### Paso 6: Espera a que termine la compilación

La compilación puede tomar entre 5 y 30 minutos dependiendo de la cola. Puedes monitorear el progreso desde la URL que EAS muestra en la terminal.

### 12.2 Reemplazar el archivo en public/app/

Una vez que la build ha terminado exitosamente:

```bash
# 1. Obtener la URL del APK de la build exitosa
# Puedes obtenerla con:
EXPO_TOKEN="..." npx eas-cli build:view [BUILD_ID] --json

# 2. Descargar el nuevo APK
curl -L --max-time 120 -o /tmp/nuevo_metafit.apk "URL_DEL_APK"

# 3. Verificar que es un APK válido
file /tmp/nuevo_metafit.apk
# Debe decir: Android package (APK)

# 4. Reemplazar el APK antiguo
mv /tmp/nuevo_metafit.apk frontend_web/public/app/metafit.apk
```

### 12.3 Subir a GitHub y esperar auto-deploy

```bash
# 1. Hacer commit del nuevo APK
git add frontend_web/public/app/metafit.apk
git commit -m "Actualizar APK a versión 1.1.0"

# 2. Fusionar a main (Render despliega desde main)
git checkout main
git merge feature/juan-carvajal
git push origin main

# 3. Verificar el despliegue en Render
# Espera 1-3 minutos y luego verifica:
curl -I "https://metafit-frontend-78x6.onrender.com/app/metafit.apk"
# Debe responder HTTP 200
```

### 12.4 Cómo evitar builds fallidas

Para minimizar la probabilidad de errores en futuras compilaciones:

1. **Usa `expo install` en lugar de `npm install`** para instalar paquetes relacionados con Expo. `expo install` selecciona automáticamente la versión compatible con tu SDK.

2. **Mantén las dependencias actualizadas**:
   ```bash
   cd movil/
   npx expo install --check
   ```
   Ejecuta esto periódicamente para detectar discrepancias.

3. **No instales paquetes incompatibles** con Expo SDK 55. Verifica la documentación de cada paquete para asegurarte de que es compatible.

4. **Prueba localmente antes de compilar**:
   ```bash
   cd movil/
   npx expo start
   ```
   Esto inicia un servidor de desarrollo. Puedes escanear el código QR con la app "Expo Go" en tu teléfono para probar los cambios antes de compilar.

5. **Mantén un registro de las versiones** de las dependencias que funcionan. Si algo falla después de una actualización, puedes revertir a las versiones anteriores.

---

## 13. Preguntas Frecuentes (FAQ)

### 13.1 ¿Necesito regenerar el APK cada vez que cambio algo en el móvil?

**Depende del tipo de cambio:**

- **Cambios en el código JavaScript** (pantallas, lógica, estilos): No necesitas regenerar el APK si usas **Expo Updates**. Con Expo Updates, puedes publicar actualizaciones "Over The Air" (OTA) que se descargan cuando el usuario abre la app. Sin embargo, para MetaFit, como no tenemos configurado Expo Updates, **sí necesitas generar un nuevo APK** para cada cambio.

- **Cambios en configuración nativa** (plugins, app.json, package.json): Sí, definitivamente necesitas regenerar el APK.

- **Cambios en el backend**: No. El backend y el móvil son independientes. Si el backend cambia, el móvil funciona igual siempre que la API sea compatible.

**Regla general:** Si modificas archivos dentro de `movil/src/`, necesitas generar un nuevo APK.

### 13.2 ¿El APK se actualiza automáticamente?

**No.** El APK no tiene actualización automática. Cuando descargas un APK desde la web e instalas la aplicación, Android no sabe que existe una versión más nueva. El usuario debe:

1. Visitar la página web de MetaFit
2. Descargar el nuevo APK manualmente
3. Abrir el archivo descargado para instalar la actualización

Para tener actualizaciones automáticas en el futuro, hay dos opciones:

- **Publicar en Google Play Store**: Play Store maneja las actualizaciones automáticamente.
- **Implementar un actualizador interno**: Usar librerías como `react-native-update-app` o `expo-updates` para que la app verifique y descargue actualizaciones automáticamente.

### 13.3 ¿Puedo instalar el APK en iPhone?

**No.** Los APK son exclusivos de Android. Los iPhones usan un formato diferente llamado IPA (iOS App Store Package). Para distribuir en iPhone necesitas:

1. Una cuenta de desarrollador de Apple ($99/año)
2. Compilar con Xcode en macOS
3. Publicar en la App Store o usar TestFlight para pruebas

EAS Build también puede compilar para iOS si tienes una cuenta de Apple Developer, pero no es el caso actual de MetaFit.

### 13.4 ¿Qué hago si la build se queda en cola por horas?

Las builds gratuitas de EAS pueden tener tiempos de espera largos durante horas pico. Si tu build ha estado en cola por más de 30-60 minutos:

1. **No canceles la build** — perderías tu lugar en la cola.
2. **Verifica el estado** desde la página web de Expo.
3. **Considera actualizar al plan "EAS Starter"** ($8.99/mes) que tiene prioridad en la cola.
4. **Compila en horas de baja demanda** — temprano en la mañana o fines de semana suele ser más rápido.
5. **Verifica que no haya errores** en tu configuración que estén causando reintentos.

### 13.5 ¿Puedo usar el mismo APK en cualquier celular Android?

**Sí, con algunas consideraciones:**

- **Versión de Android**: El APK de MetaFit requiere Android 7.0 (API 24) o superior, que es compatible con la gran mayoría de dispositivos actuales.
- **Arquitectura del procesador**: El APK incluye librerías nativas para las arquitecturas más comunes: ARM64 (la mayoría de los teléfonos modernos) y ARM (teléfonos más antiguos).
- **Permisos**: Al instalar, la app solicitará permisos de almacenamiento (para guardar datos) e internet (para conectarse al backend). El usuario debe aceptarlos.
- **Instalación desde fuentes desconocidas**: En Android 8 y superiores, el usuario debe habilitar "Instalar desde fuentes desconocidas" o "Instalar desde esta fuente" (para el navegador) en la configuración de seguridad.

### 13.6 ¿Cuánto cuesta usar EAS Build?

EAS Build tiene un plan gratuito y planes de pago:

| Plan | Precio | Builds/mes | Prioridad en cola | Características |
|------|--------|-----------|-------------------|-----------------|
| Free | $0 | 30 | Baja | Compilaciones básicas |
| Starter | $8.99/mes | 100 | Media | + EAS Update, + Builds más rápidos |
| Plus | $33.99/mes | 500 | Alta | + Más recursos de compilación |
| Enterprise | A medida | Ilimitado | Máxima | Para empresas |

Para MetaFit, el plan gratuito es suficiente durante el desarrollo.

### 13.7 ¿Puedo probar la app en mi teléfono sin compilar un APK?

**Sí**, usando **Expo Go**. Expo Go es una aplicación gratuita que puedes instalar desde Google Play Store que te permite ejecutar proyectos de Expo directamente desde tu computadora sin compilar un APK:

```bash
cd movil/
npx expo start
```

Esto muestra un código QR. Escanéalo con la app Expo Go en tu teléfono (asegúrate de que ambos estén en la misma red WiFi) y la aplicación se cargará directamente en tu teléfono.

**Limitaciones:** Expo Go no soporta todos los plugins nativos. Si tu app usa módulos nativos que requieren compilación (como `expo-image-picker` o `react-native-reanimated`), algunas funcionalidades pueden no funcionar en Expo Go.

---

## 14. Glosario

| Término | Definición |
|---------|-----------|
| **APK** | Android Package Kit. Formato de archivo para distribuir aplicaciones en Android. |
| **AAB** | Android App Bundle. Formato de publicación para Google Play Store, más eficiente que APK. |
| **Build** | Compilación. Proceso de transformar código fuente en un archivo ejecutable (APK/AAB). |
| **EAS** | Expo Application Services. Conjunto de servicios en la nube de Expo para compilar, actualizar y distribuir apps. |
| **EAS Build** | Servicio de compilación en la nube de Expo. |
| **EAS CLI** | Interfaz de línea de comandos para interactuar con EAS. |
| **Expo** | Plataforma de código abierto para desarrollar aplicaciones React Native. |
| **Expo SDK** | Conjunto de librerías y APIs que Expo proporciona para acceder a funcionalidades nativas del dispositivo. |
| **Gradle** | Sistema de compilación automatizada para proyectos Android. |
| **Gradlew** | Gradle Wrapper. Script que descarga y ejecuta la versión correcta de Gradle para un proyecto. |
| **Keystore** | Archivo que contiene las claves criptográficas para firmar digitalmente un APK. |
| **npm** | Node Package Manager. Gestor de paquetes para Node.js. |
| **npx** | Ejecutor de paquetes de npm. Permite ejecutar un comando sin instalarlo globalmente. |
| **Perfil de build** | Configuración predefinida que define cómo se compila la aplicación (APK, AAB, debug, release). |
| **React Native** | Framework de JavaScript para construir aplicaciones móviles nativas. |
| **SDK** | Software Development Kit. Conjunto de herramientas de desarrollo. |
| **Semver** | Versionado semántico. Sistema de versiones formato MAJOR.MINOR.PATCH. |
| **Worklets** | Hilos de ejecución separados para código JavaScript de alto rendimiento. |
| **React Native Reanimated** | Librería de animaciones de alto rendimiento para React Native. |
| **Expo Doctor** | Herramienta que verifica la compatibilidad de las dependencias del proyecto Expo. |
| **Expo Prebuild** | Proceso que genera los archivos nativos (android/, ios/) a partir de la configuración de Expo. |
| **Fingerprint** | Huella digital del proyecto. Hash único que identifica una versión específica del código. |
| **OTA Update** | Over-The-Air Update. Actualización de la app sin necesidad de descargar un nuevo APK. |
| **CDN** | Content Delivery Network. Red de servidores que distribuyen contenido estático globalmente. |
| **CI/CD** | Continuous Integration / Continuous Deployment. Automatización de compilación y despliegue. |
| **MIME type** | Tipo de medio estándar que identifica el formato de un archivo en internet. |
| **CRON** | (No aplica directamente) Programador de tareas periódicas. |

---

## 15. Apéndice: Comandos Útiles

### 15.1 Comandos de EAS CLI

```bash
# === AUTENTICACIÓN ===

# Iniciar sesión (interactivo)
eas login

# Iniciar sesión con token
EXPO_TOKEN="WYXqDP0MsU5tEWA6Sp5CpNpmuwIA5o0ilJnFSVnI" npx eas-cli whoami

# Cerrar sesión
eas logout


# === COMPILACIÓN ===

# Compilar APK para Android (perfil preview)
EXPO_TOKEN="WYXqDP0MsU5tEWA6Sp5CpNpmuwIA5o0ilJnFSVnI" npx eas-cli build -p android --profile preview

# Compilar sin preguntar (non-interactive)
EXPO_TOKEN="WYXqDP0MsU5tEWA6Sp5CpNpmuwIA5o0ilJnFSVnI" npx eas-cli build -p android --profile preview --non-interactive

# Compilar App Bundle para producción
EXPO_TOKEN="..." npx eas-cli build -p android --profile production

# Compilar para iOS (requiere cuenta de Apple Developer)
EXPO_TOKEN="..." npx eas-cli build -p ios --profile preview


# === CONSULTAR BUILDS ===

# Listar builds recientes (últimas 5)
EXPO_TOKEN="..." npx eas-cli build:list --json --limit=5

# Ver detalles de una build específica
EXPO_TOKEN="..." npx eas-cli build:view 5bc1190d-537a-4c57-a219-6d9f08754e25

# Ver detalles en formato JSON (útil para scripting)
EXPO_TOKEN="..." npx eas-cli build:view 5bc1190d-537a-4c57-a219-6d9f08754e25 --json
```

### 15.2 Comandos de Git

```bash
# === TRABAJO CON RAMAS ===

# Ver ramas locales y remotas
git branch -a

# Cambiar a una rama
git checkout feature/juan-carvajal

# Crear y cambiar a una nueva rama
git checkout -b feature/nueva-funcionalidad

# Fusionar una rama a la actual
git merge feature/juan-carvajal


# === COMMIT Y PUSH ===

# Ver cambios pendientes
git status
git diff

# Agregar archivos al stage
git add movil/package.json movil/package-lock.json

# Hacer commit
git commit -m "Descripción clara de los cambios"

# Subir cambios a GitHub
git push origin feature/juan-carvajal

# Subir a main (después de fusionar)
git push origin main


# === HISTORIAL ===

# Ver historial de commits
git log --oneline -10

# Ver cambios de un commit específico
git show 5d89f1e

# Ver el commit actual en el que estamos
git log --oneline -1
```

### 15.3 Comandos de curl

```bash
# === DESCARGAR ARCHIVOS ===

# Descargar APK desde EAS
curl -L --max-time 120 -o metafit.apk "URL_DEL_APK"

# Descargar con barra de progreso visible (verbose)
curl -L --max-time 120 -o metafit.apk "URL_DEL_APK" --progress-bar


# === VERIFICAR SERVIDORES ===

# Verificar que un archivo existe y ver sus headers
curl -I "https://metafit-frontend-78x6.onrender.com/app/metafit.apk"

# Verificar que el sitio web funciona
curl -sI "https://metafit-frontend-78x6.onrender.com"

# Verificar que el backend responde
curl -s "https://metafit-backend-rr18.onrender.com/health"
```

### 15.4 Comandos de npm

```bash
# === GESTIÓN DE PAQUETES ===

# Instalar una dependencia
npm install react-native-worklets@0.7.4

# Instalar dependencias de Expo (usa la versión compatible con tu SDK)
npx expo install react-native-reanimated

# Verificar dependencias de Expo
npx expo install --check

# Ver dependencias instaladas
npm ls react-native-reanimated
npm ls react-native-worklets

# Eliminar un paquete
npm uninstall eas-cli

# Actualizar todos los paquetes a las versiones permitidas por package.json
npm update


# === DESARROLLO LOCAL ===

# Iniciar servidor de desarrollo Expo
npx expo start

# Iniciar con limpieza de caché
npx expo start -c

# Ver el estado de Expo Doctor
npx expo-doctor
```

### 15.5 Comandos de Linux/macOS

```bash
# === VERIFICACIÓN DE ARCHIVOS ===

# Ver tipo de archivo
file metafit.apk
# → Android package (APK), with gradle app-metadata.properties

# Ver tamaño del archivo
ls -lh metafit.apk
# → -rw-rw-r-- 1 user user 84M jul 28 20:51 metafit.apk

# Ver checksums (para verificar integridad)
md5sum metafit.apk
sha256sum metafit.apk


# === COMPRESIÓN ===

# Comprimir el APK para compartir (opcional)
gzip -k metafit.apk

# Descomprimir
gunzip metafit.apk.gz
```

---

## 16. Apéndice: Archivos Creados o Modificados

### 16.1 Archivos de configuración creados

| Archivo | Descripción |
|---------|-------------|
| `movil/babel.config.js` | Configuración de Babel. Define que el proyecto usa el preset de Expo para transformar el código JavaScript. Sin este archivo, la compilación falla porque Babel no sabe cómo procesar el código moderno de React Native. |
| `movil/eas.json` | Configuración de EAS Build. Define los perfiles de compilación: "preview" para generar APK (distribución directa) y "production" para generar AAB (publicación en Play Store). |
| `scripts/monitorear_apk.sh` | Script para monitorear automáticamente el estado de una build de EAS y descargar el APK cuando esté lista. Útil para automatización. |

### 16.2 Archivos modificados

| Archivo | Cambio realizado | Propósito |
|---------|-----------------|-----------|
| `movil/app.json` | Se agregó `android.package: "com.metafit.app"`, `owner: "sebas-carva07"`, y `extra.eas.projectId`. | Estos campos son necesarios para que EAS Build pueda compilar la aplicación. El package es el identificador único de la app en Android. El owner vincula el proyecto con la cuenta de Expo. |
| `movil/App.js` | Se agregó `import 'react-native-gesture-handler'` al inicio del archivo. | `react-native-gesture-handler` requiere ser importado antes que cualquier otro módulo de la aplicación. Sin esta importación, la app puede fallar al iniciar con errores de gestos. |
| `movil/package.json` | Se agregó `"react-native-worklets": "0.7.4"` como dependencia directa. Se actualizaron las versiones de Expo SDK, react-native, y otros paquetes a las versiones correctas. | La adición de `react-native-worklets@0.7.4` soluciona el conflicto de versiones con `react-native-reanimated@4.2.1`. Las actualizaciones de dependencias aseguran compatibilidad con Expo SDK 55. |
| `movil/package-lock.json` | Se actualizó automáticamente al ejecutar `npm install`. | Este archivo mantiene un registro de las versiones exactas de todas las dependencias instaladas, asegurando que todos los desarrolladores y el servidor de EAS usen las mismas versiones. |
| `frontend_web/src/views/LandingPage.jsx` | Se agregó la sección "App Móvil" con el botón de descarga del APK. | Permite a los usuarios descargar la aplicación directamente desde la landing page de MetaFit. |

### 16.3 Archivos descargados

| Archivo | Descripción |
|---------|-------------|
| `frontend_web/public/app/metafit.apk` | El APK generado por EAS Build (~84 MB). Se coloca en la carpeta `public/` del frontend web para que Render lo sirva como archivo estático. Los usuarios descargan este archivo desde la landing page. |

### 16.4 Archivos eliminados

| Archivo | Razón |
|---------|-------|
| `movil/node_modules/eas-cli` | Se eliminó `eas-cli` de las dependencias de desarrollo (`devDependencies`). `expo doctor` recomienda no tener EAS CLI instalado localmente; debe usarse globalmente o con `npx`. |

---

> **Fin del manual.**  
> Este documento fue generado en julio de 2026 como parte de la documentación técnica del proyecto MetaFit — Sport Gym Sede 80.  
> Para preguntas o actualizaciones, contacta al equipo de desarrollo.
