# Runbook de despliegue — MetaFit en AWS EC2

**Objetivo:** desplegar MetaFit (backend + MariaDB) en una instancia EC2 con Docker Compose, verificar salud/CORS y dejar el procedimiento repetible.

**No incluye:** credenciales reales, cambios de esquema, cambios de lógica ni configuración Oracle.

---

## 1. Prerrequisitos

- Instancia EC2 `t3.micro` o superior con Amazon Linux 2023.
- Security Group con:
  - `22/tcp` restringido a la IP del administrador.
  - `3001/tcp` para la API (idealmente restringido a la IP de evaluación).
  - `3306/tcp` **cerrado** a Internet.
- Docker Engine y Compose V2.
- Repositorio clonado en la instancia.
- `.env.prod` creado localmente, con permisos `600`.

## 2. Preparar la instancia

```bash
sudo dnf update -y
sudo dnf install -y docker git
sudo systemctl enable --now docker
sudo usermod -aG docker ec2-user
# Cerrar y volver a entrar para aplicar el grupo docker
docker --version
docker compose version
```

## 3. Obtener el código

```bash
git clone https://github.com/juanscarvajal04-droid/Equipo_Metafit.git
cd Equipo_Metafit
git checkout feature/sofia-astudillo
```

> Trabajar en la rama de la práctica. No modificar `main` ni reescribir el historial.

## 4. Configurar variables

```bash
cd deploy
cp .env.prod.example .env.prod
chmod 600 .env.prod
nano .env.prod
```

Completar:

- `MYSQL_ROOT_PASSWORD` y `DB_PASSWORD` con el mismo valor seguro.
- `JWT_SECRET` generado con `openssl rand -hex 32`.
- `CORS_ORIGINS` con la URL del panel y orígenes de desarrollo necesarios.
- `BREVO_API_KEY`, SMTP y Cloudinary si se usan.
- `URL_APK` y `FRONTEND_URL` con la IP o dominio vigente.

No pegar secretos en el chat, en issues ni en capturas.

## 5. Desplegar

```bash
cd /home/ec2-user/Equipo_Metafit/deploy
docker compose --env-file .env.prod -f docker-compose.prod.yml up -d --build
docker compose --env-file .env.prod -f docker-compose.prod.yml ps
```

Resultado esperado:

- `metafit_db` en estado `healthy`.
- `metafit_backend` activo.
- Solo el puerto `3001` publicado.

## 6. Verificar

```bash
curl -fsS http://<IP_PUBLICA_EC2>:3001/health
```

Respuesta esperada:

```json
{"status":"ok","db":"MySQL conectado"}
```

Verificar CORS:

```bash
curl -i -H "Origin: http://localhost:8081" http://<IP_PUBLICA_EC2>:3001/health
curl -i -H "Origin: http://evil.example" http://<IP_PUBLICA_EC2>:3001/health
```

- Origen permitido: `200` con `Access-Control-Allow-Origin`.
- Origen desconocido: `403`.

## 7. App móvil

En el entorno de build:

```bash
EXPO_PUBLIC_API_URL=http://<IP_PUBLICA_EC2>:3001
```

Compilar el APK:

```bash
cd movil
npx eas build -p android --profile preview
```

Si cambia la IP:

1. Actualizar `CORS_ORIGINS` en `.env.prod`.
2. Recrear el backend: `docker compose ... up -d`.
3. Actualizar `EXPO_PUBLIC_API_URL` y recompilar el APK.
4. Actualizar la documentación con la nueva IP.

## 8. Respaldar y restaurar

Respaldo:

```bash
docker exec metafit_db sh -c 'mariadb-dump -u root -p"$MYSQL_ROOT_PASSWORD" metafit' > respaldo_$(date +%F).sql
```

Restauración (probar en un entorno controlado):

```bash
docker exec -i metafit_db sh -c 'mariadb -u root -p"$MYSQL_ROOT_PASSWORD" metafit' < respaldo_YYYY-MM-DD.sql
```

Guardar una copia fuera de la instancia (S3, disco cifrado o almacenamiento institucional) y registrar fecha, responsable y resultado.

## 9. Operación diaria

```bash
docker compose --env-file .env.prod -f docker-compose.prod.yml logs -f backend
docker compose --env-file .env.prod -f docker-compose.prod.yml restart backend
docker compose --env-file .env.prod -f docker-compose.prod.yml down
```

No usar `down -v` en producción: elimina el volumen `metafit_db_data`.

## 10. Solución de problemas

| Síntoma | Causa probable | Acción |
|---|---|---|
| `ECONNREFUSED` | BD no lista | Revisar `docker compose ps` y logs de `db` |
| CORS 403 | Origen no permitido | Agregar origen a `CORS_ORIGINS` y recrear backend |
| App móvil no conecta | IP desactualizada | Actualizar `EXPO_PUBLIC_API_URL` y recompilar |
| Correos no llegan | Brevo/SMTP mal configurado | Revisar claves y logs; usar API HTTPS de Brevo |
| Datos desaparecen | Volumen eliminado | Restaurar respaldo; no usar `down -v` |
| Health falla | Backend no conecta a DB | Verificar `DB_HOST=db` y credenciales |

## 11. Checklist de cierre

- [ ] `/health` responde 200.
- [ ] `metafit_db` healthy.
- [ ] CORS permitido para el panel y la app.
- [ ] CORS desconocido devuelve 403.
- [ ] `.env.prod` con permisos 600.
- [ ] Respaldo reciente y copia fuera de la instancia.
- [ ] App móvil apunta a la IP vigente.
- [ ] Documentación actualizada con la IP y fecha.
