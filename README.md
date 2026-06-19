# 🚀 MetaFit - Sistema de Gestión Deportiva

Bienvenido a la rama de trabajo de la dirección del proyecto. Esta sección es administrada por el líder técnico para garantizar la integridad del código.

## 👤 Perfil del Integrante
**Nombre:** Juan Sebastián Carvajal 
ilidades Técnicas:**
    * Gestión y mantenimiento de la rama de Producción (`main`)
    * Integración de código en la rama de Desarrollo (`develop`)
    * Supervisión de Pull Requests y control de versiones mediante Git Flow
    * Coordinación de los módulos de Administrador y Recepción 

## 🛠️ Estado de la Rama
Esta rama se encuentra sincronizada con la base estable de **MetaFit v2.0**. Aquí se realizan las validaciones finales antes de realizar los despliegues a las ramas globales del equipo.

---

## 🐳 Levantar el proyecto con Docker

```bash
# Clonar el repositorio
git clone <repo-url>
cd Equipo_Metafit

# Iniciar todos los servicios (MySQL + Backend + Frontend + phpMyAdmin)
docker compose up -d --build

# Verificar que los contenedores estén corriendo
docker compose ps
```

Los scripts SQL (`01_schema.sql`, `02_seed.sql`) se ejecutan automáticamente al iniciar MySQL por primera vez.

## 🔌 Puertos

| Servicio   | Puerto | URL                        |
|------------|--------|----------------------------|
| Frontend   | 5173   | http://localhost:5173       |
| Backend    | 3001   | http://localhost:3001       |
| phpMyAdmin | 8080   | http://localhost:8080       |
| MySQL      | 3306   | localhost:3306              |

## 👤 Credenciales de prueba

| Rol             | Email                    | Contraseña    |
|-----------------|--------------------------|---------------|
| Administrador   | carlos@metafit.com       | Admin123!     |
| Recepcionista   | maria@metafit.com        | Maria123!     |
| Entrenador      | laura@metafit.com        | Laura123!     |
| Entrenador      | andres@metafit.com       | Andres123!    |

---
*MetaFit Inc. · Sport Gym Sede 80 · Bogotá, Colombia* 