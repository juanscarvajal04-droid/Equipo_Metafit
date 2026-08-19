# 🔔 Notificaciones

> Push notifications (Expo), notificaciones por rol, recordatorios

---

## 📋 Endpoints

| # | Método | Ruta | Middleware | Descripción |
|---|---|---|---|---|
| 1 | **GET** | `/notificaciones` | Auth | Notificaciones filtradas por rol |
| 2 | **PUT** | `/usuarios/me/push-token` | Auth | Guardar Expo Push Token |

---

## 📱 Push Notifications (Expo)

### Flujo completo

```
1. App móvil inicia sesión
2. Solicita permisos de notificación
3. Obtiene Expo Push Token
4. PUT /usuarios/me/push-token → guarda en USUARIO.push_token
5. Backend envía push cuando:
   - Se crea un plan de entrenamiento → screen: 'Rutina'
   - Se crea un plan nutricional → screen: 'Dieta'
   - Vence una membresía en 3 días → recordatorio
```

### Configuración Expo

```js
// movil/src/services/notifications.js
export async function activarPushNotifications() {
  const { status } = await Notifications.requestPermissionsAsync();
  if (status !== 'granted') return null;

  const token = await Notifications.getExpoPushTokenAsync({
    projectId: 'a5336580-cafa-4055-9614-00390522dd8a',
  });

  await api.put('/usuarios/me/push-token', { push_token: token.data });
  return token.data;
}
```

### Envío desde Backend

```js
// Servicio: enviarPushAUsuarioDelCiclo(idCiclo, payload)
// 1. Busca afiliado del ciclo
// 2. Obtiene push_token del USUARIO
// 3. POST https://exp.host/--/api/v2/push/send
// Body: {
//   to: 'ExponentPushToken[xxx]',
//   title: 'Nueva rutina asignada',
//   body: 'Tu entrenador te asignó un plan...',
//   data: { screen: 'Rutina' }
// }
```

---

## ⏰ Recordatorios de Pago (Cron)

```js
// cron/recordatorioPagos.js
// Frecuencia: cada hora (0 * * * *)
// 1. Busca pagos con vencimiento en ≤3 días
// 2. Consulta tabla PAGO_RECORDATORIO para evitar reenvíos
// 3. Si no se envió hoy → envía correo por Brevo
// 4. Registra en PAGO_RECORDATORIO
```

---

## 📧 Notificaciones por Correo

| Tipo | Template | Trigger |
|---|---|---|
| Bienvenida | — | POST /afiliados (nuevo afiliado) |
| Recuperar contraseña | `recuperar-password.html` | POST /auth/recuperar-password |
| Factura de pago | `factura-pago.html` | POST /afiliados/:id/pagos |
| Recordatorio pago | — | Cron cada hora |

---

## 📎 Notas Relacionadas

- [[PlanEntrenamiento y Nutrición|Planes]]
- [[Brevo]]
- [[App Móvil React Native]]
- [[Autenticación]]
