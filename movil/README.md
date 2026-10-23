# App móvil MetaFit — Expo / React Native

Aplicación Android para los afiliados de **Sport Gym Sede Santa Rosita**. Permite consultar el perfil, la rutina, la dieta y el progreso, además de registrar ejercicio, consumo de alimentos, agua y notas personales.

- **APK de producción:** https://metafit-frontend-78x6.onrender.com/app/metafit.apk
- **Backend de producción:** https://metafit-backend-rr18.onrender.com
- **Expo web local:** http://localhost:8081

---

## Stack

| Tecnología | Uso |
|---|---|
| **Expo SDK 55** | Toolchain y APIs nativas |
| **React Native 0.83** | Interfaz móvil |
| **React Navigation 7** | Stack + tabs |
| **AsyncStorage** | Persistencia del token, usuario y tema |
| **Axios** | Cliente HTTP con interceptor JWT |
| **expo-notifications** | Notificaciones push |
| **expo-image-picker** | Selección de foto de perfil |
| **react-native-chart-kit** | Gráficos de progreso |
| **Jest + jest-expo + RNTL** | Pruebas unitarias y de componentes |

La app **no usa Expo Router**: la navegación está definida en `src/navigation/AppNavigator.js` con React Navigation.

---

## Requisitos

- Node.js 20 o 22
- npm 10+
- Expo Go en el teléfono (opcional, para pruebas rápidas)
- Android Studio + SDK (opcional, para compilar en local)
- Cuenta de Expo/EAS (para generar el APK en la nube)

---

## Instalación

```bash
cd movil
npm ci
```

---

## Ejecutar la app

### 1. Expo web — http://localhost:8081

```bash
cd movil
npm run web
```

Este comando ejecuta `expo start --web`. Abre **http://localhost:8081** en el navegador. Es útil para probar la interfaz y la integración con el backend local.

Si el puerto está ocupado:

```bash
npx expo start --web --port 8081
```

### 2. Expo Go o emulador

```bash
cd movil
npm start
```

Expo muestra un código QR y las opciones para abrir la app en Expo Go, un emulador Android o un development build. Algunas funciones nativas pueden requerir un development build en lugar de Expo Go.

### 3. Android nativo

```bash
cd movil
npm run android
```

Este comando ejecuta `expo run:android` y requiere Android Studio, un SDK configurado y un emulador o dispositivo conectado.

---

## URL del backend

La URL se decide en `src/services/api.js` según la plataforma:

| Entorno | URL |
|---|---|
| Expo web | `EXPO_PUBLIC_API_URL` o `http://localhost:3001` por defecto |
| Android (Expo Go o APK) | `https://metafit-backend-rr18.onrender.com` |

Para cambiar la URL de Expo web, crea `movil/.env`:

```env
EXPO_PUBLIC_API_URL=http://localhost:3001
```

> El APK compilado apunta al backend de producción. Si necesitas cambiar ese destino, debe coordinarse una nueva compilación.

---

## Estructura de carpetas

```text
movil/
├── assets/                  Íconos, splash y recursos
├── src/
│   ├── components/          Componentes reutilizables
│   ├── context/             AuthContext y ThemeContext
│   ├── hooks/               useApi, useMutation, useAutoRefresh
│   ├── navigation/          AppNavigator (stack + tabs)
│   ├── screens/             Pantallas de la app
│   ├── services/            Cliente Axios y llamadas a la API
│   ├── utils/               Formateadores, errores y ciclos
│   └── theme.js             Paleta y tokens visuales
├── App.js                   Punto de entrada
├── app.json                 Configuración de Expo
├── eas.json                 Perfiles de EAS Build
├── jest.setup.js            Configuración de Jest
├── babel.config.js
└── package.json
```

### Pantallas principales

| Pantalla | Función |
|---|---|
| `LandingScreen` | Presentación de la app |
| `LoginScreen` | Inicio de sesión del afiliado |
| `RecuperarPasswordScreen` | Recuperación de contraseña |
| `MiPerfilScreen` | Datos del afiliado |
| `EditarPerfilScreen` | Edición de perfil y foto |
| `MiRutinaScreen` | Rutina asignada por el entrenador |
| `MiDietaScreen` | Plan nutricional |
| `MiProgresoScreen` | Progreso, agua y evolución |
| `RegistroEjercicioScreen` | Registro de ejercicios realizados |
| `RegistroConsumoScreen` | Registro de alimentos consumidos |

La app usa un **stack de autenticación** (Landing, Login, Recuperar) y, una vez autenticado, un **stack raíz** con tabs de Perfil, Rutina, Dieta y Progreso, más las pantallas de registro y edición.

---

## Pruebas

```bash
cd movil
npm test
```

- Framework: **Jest**
- Preset: **jest-expo**
- Utilidades: **React Native Testing Library**
- Cobertura actual: **99.37% de líneas** (944/950)

Para generar el reporte de cobertura:

```bash
npm run test:coverage
```

Configuración relevante en `package.json`:

- `preset: "jest-expo"`
- `setupFiles: ["./jest.setup.js"]`
- `transformIgnorePatterns` para módulos de Expo y React Native
- Mock oficial de AsyncStorage

La suite cubre login, contexto de autenticación, interceptor JWT, restauración de sesión, pantallas y utilidades.

---

## Generar el APK con Expo / EAS

El perfil `preview` de `eas.json` genera un **APK instalable**:

```bash
cd movil
npx eas-cli login
npx eas-cli build --platform android --profile preview
```

Al finalizar, EAS muestra un enlace de descarga. Copia el APK al directorio que sirve la web:

```bash
cp <ruta-del-apk>.apk ../frontend_web/public/app/metafit.apk
```

En PowerShell:

```powershell
Copy-Item <ruta-del-apk>.apk ..\frontend_web\public\app\metafit.apk
```

La descarga pública queda en:

```text
https://metafit-frontend-78x6.onrender.com/app/metafit.apk
```

### Instalación en Android

1. Descarga el APK desde la URL anterior.
2. Activa la instalación desde **orígenes desconocidos** si Android lo solicita.
3. Instala y abre **MetaFit**.
4. Inicia sesión con la cuenta de afiliado.

Si el APK no instala, desinstala una versión anterior con firma distinta y vuelve a intentarlo.

> El procedimiento detallado de compilación, firma y publicación está en [`../documentacion/manual_apk_movil.md`](../documentacion/manual_apk_movil.md).

---

## Comandos disponibles

| Comando | Descripción |
|---|---|
| `npm start` | Inicia el servidor de Expo |
| `npm run web` | Ejecuta Expo web en http://localhost:8081 |
| `npm run android` | Compila y ejecuta en Android |
| `npm run ios` | Compila y ejecuta en iOS (requiere macOS) |
| `npm run lint` | Ejecuta ESLint |
| `npm test` | Ejecuta Jest |
| `npm run test:watch` | Jest en modo watch |
| `npm run test:coverage` | Jest con reporte de cobertura |

---

## Troubleshooting

| Problema | Solución |
|---|---|
| Expo web no refleja cambios | `npx expo start -c` para limpiar caché |
| El puerto 8081 está ocupado | `npx expo start --web --port 8081` o detener el proceso anterior |
| La app no conecta al backend local | Verificar `EXPO_PUBLIC_API_URL` y que el backend esté en `http://localhost:3001` |
| El APK no instala | Permitir orígenes desconocidos y desinstalar la versión anterior |
| Notificaciones push no llegan en Expo Go | Probar con un development build o APK en dispositivo físico |
| El backend de Render tarda en responder | El servicio gratuito puede estar despertando; esperar unos segundos |

---

## Documentación relacionada

- [`../README.md`](../README.md) — presentación del proyecto y enlaces de producción.
- [`../README_DEV.md`](../README_DEV.md) — entorno local completo y flujo de trabajo.
- [`../documentacion/manual_apk_movil.md`](../documentacion/manual_apk_movil.md) — compilación y firma del APK.
- [`../backend/README.md`](../backend/README.md) — API y endpoints.
- [`../frontend_web/README.md`](../frontend_web/README.md) — frontend web del personal.
