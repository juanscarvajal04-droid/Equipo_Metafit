// backend/config/swagger.js
// ─── Configuración central de Swagger / OpenAPI 3.0 ──────────
'use strict';

const swaggerJsdoc = require('swagger-jsdoc');

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'MetaFit API',
      version: '1.0.0',
      description: `
## MetaFit — Sistema de Gestión Deportiva

API REST para la gestión de afiliados, ciclos de entrenamiento,
planes nutricionales y personal del gimnasio Sport Gym Sede 80 (Bogotá, 2025).

### Autenticación
Todos los endpoints protegidos requieren un **Bearer Token JWT**.
1. Usa \`POST /login\` para obtener tu token.
2. Haz clic en **Authorize** (candado) e ingresa: \`Bearer <tu_token>\`.
      `,
      contact: {
        name: 'Equipo MetaFit',
        email: 'soporte@metafit.com',
      },
      license: {
        name: 'MIT',
      },
    },
    servers: [
      {
        url: process.env.API_BASE_URL || 'http://localhost:3001',
        description: 'Servidor de desarrollo',
      },
    ],
    // ── Esquema de seguridad JWT (bearerAuth) ─────────────────
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
          description: 'Token JWT obtenido en `POST /login`. Formato: `Bearer <token>`',
        },
      },
      // ── Schemas reutilizables ────────────────────────────────
      schemas: {
        ErrorResponse: {
          type: 'object',
          properties: {
            error: { type: 'string', example: 'Descripción del error' },
          },
        },
        LoginRequest: {
          type: 'object',
          required: ['email', 'password'],
          properties: {
            email:    { type: 'string', format: 'email', example: 'admin@metafit.com' },
            password: { type: 'string', format: 'password', example: 'Admin123!' },
          },
        },
        LoginResponse: {
          type: 'object',
          properties: {
            accessToken: { type: 'string', description: 'JWT de 8h de validez' },
            user: {
              type: 'object',
              properties: {
                id:        { type: 'integer', example: 1 },
                email:     { type: 'string',  example: 'admin@metafit.com' },
                role:      { type: 'string',  enum: ['Administrador', 'Recepcionista', 'Entrenador', 'Afiliado'] },
                nombres:   { type: 'string',  example: 'Carlos' },
                apellidos: { type: 'string',  example: 'Rodríguez' },
              },
            },
          },
        },
        Usuario: {
          type: 'object',
          properties: {
            id_usuario:  { type: 'integer', example: 1 },
            nombres:     { type: 'string',  example: 'Carlos' },
            apellidos:   { type: 'string',  example: 'Rodríguez' },
            correo:      { type: 'string',  format: 'email' },
            rol:         { type: 'string',  enum: ['Administrador', 'Recepcionista', 'Entrenador'] },
            estado:      { type: 'string',  enum: ['Activo', 'Inactivo', 'Pendiente'] },
            fecha_registro: { type: 'string', format: 'date-time' },
          },
        },
        UsuarioCreate: {
          type: 'object',
          required: ['nombres', 'apellidos', 'correo', 'contrasena', 'rol'],
          properties: {
            nombres:    { type: 'string',  example: 'María' },
            apellidos:  { type: 'string',  example: 'García' },
            correo:     { type: 'string',  format: 'email', example: 'maria@metafit.com' },
            contrasena: { type: 'string',  format: 'password', example: 'Maria123!' },
            rol:        { type: 'string',  enum: ['Administrador', 'Recepcionista', 'Entrenador'] },
            estado:     { type: 'string',  enum: ['Activo', 'Inactivo', 'Pendiente'], default: 'Pendiente' },
          },
        },
        Afiliado: {
          type: 'object',
          properties: {
            id_usuario:        { type: 'integer', example: 10 },
            nombres:           { type: 'string',  example: 'Juan' },
            apellidos:         { type: 'string',  example: 'Pérez' },
            correo:            { type: 'string',  format: 'email' },
            documento:         { type: 'integer', example: 1234567890 },
            fecha_nacimiento:  { type: 'string',  format: 'date', example: '1995-03-15' },
            sexo:              { type: 'string',  enum: ['Masculino', 'Femenino', 'Otro'] },
            telefono:          { type: 'string',  example: '3001234567' },
            direccion:         { type: 'string',  example: 'Cra 80 #50-20, Bogotá' },
            estatura_cm:       { type: 'number',  example: 175.5 },
            estado_afiliacion: { type: 'string',  enum: ['Activo', 'Inactivo', 'Suspendido'] },
            edad:              { type: 'integer', example: 30, description: 'Calculado en tiempo real' },
            restricciones:     { type: 'array', items: { $ref: '#/components/schemas/Restriccion' } },
            ciclo_activo:      { $ref: '#/components/schemas/Ciclo', nullable: true },
          },
        },
        AfiliadoCreate: {
          type: 'object',
          required: ['nombres', 'apellidos', 'correo', 'documento', 'fecha_nacimiento', 'sexo', 'telefono', 'direccion', 'estatura_cm'],
          properties: {
            nombres:          { type: 'string',  example: 'Juan' },
            apellidos:        { type: 'string',  example: 'Pérez' },
            correo:           { type: 'string',  format: 'email', example: 'juan@gmail.com' },
            contrasena:       { type: 'string',  format: 'password', example: 'Temp2025!' },
            documento:        { type: 'integer', example: 1234567890 },
            fecha_nacimiento: { type: 'string',  format: 'date', example: '1995-03-15' },
            sexo:             { type: 'string',  enum: ['Masculino', 'Femenino', 'Otro'] },
            telefono:         { type: 'string',  example: '3001234567' },
            direccion:        { type: 'string',  example: 'Cra 80 #50-20, Bogotá' },
            estatura_cm:      { type: 'number',  example: 175.5 },
            estado_afiliacion:{ type: 'string',  enum: ['Activo', 'Inactivo', 'Suspendido'], default: 'Activo' },
          },
        },
        Ciclo: {
          type: 'object',
          properties: {
            id_ciclo:                    { type: 'integer', example: 1 },
            id_usuario:                  { type: 'integer', example: 10 },
            fecha_inicio:                { type: 'string', format: 'date' },
            fecha_fin:                   { type: 'string', format: 'date' },
            activo:                      { type: 'integer', enum: [0, 1] },
            objetivo_fisico:             { type: 'string', enum: ['Perdida de grasa', 'Aumento de masa', 'Mantenimiento', 'Rehabilitacion'] },
            nivel_experiencia:           { type: 'string', enum: ['Principiante', 'Intermedio', 'Avanzado'] },
            disponibilidad_dias:         { type: 'integer', minimum: 1, maximum: 7 },
            grupo_muscular_prioritario:  { type: 'string', nullable: true },
            numero_ciclo:                { type: 'integer', description: 'Calculado: posición histórica del ciclo' },
            dias_restantes:              { type: 'integer', description: 'Calculado: días hasta fecha_fin' },
          },
        },
        Restriccion: {
          type: 'object',
          properties: {
            id_restriccion:    { type: 'integer', example: 1 },
            nombre_restriccion:{ type: 'string',  example: 'Hipertensión arterial' },
            tipo:              { type: 'string',  enum: ['Enfermedad', 'Lesion', 'Alergia', 'Medicamento', 'Otra'] },
            efecto_relevante:  { type: 'string',  nullable: true },
          },
        },
        DashboardKPIs: {
          type: 'object',
          properties: {
            total_afiliados:      { type: 'integer', example: 1247 },
            afiliados_activos:    { type: 'integer', example: 1189 },
            afiliados_inactivos:  { type: 'integer', example: 58 },
            entrenadores:         { type: 'integer', example: 20 },
            recepcionistas:       { type: 'integer', example: 5 },
            ciclos_en_curso:      { type: 'integer', example: 834 },
            con_restricciones:    { type: 'integer', example: 312 },
            pagos_registrados:    { type: 'integer', example: 3891 },
            ingresos:             { type: 'integer', example: 58750000 },
            proximos_vencimientos:{ type: 'integer', example: 47 },
            por_objetivo: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  objetivo:  { type: 'string' },
                  cantidad:  { type: 'integer' },
                },
              },
            },
          },
        },
      },
      // ── Parámetros reutilizables ─────────────────────────────
      parameters: {
        idParam: {
          name: 'id',
          in: 'path',
          required: true,
          schema: { type: 'integer' },
          description: 'ID numérico del recurso',
        },
      },
      // ── Respuestas de error reutilizables ────────────────────
      responses: {
        Unauthorized: {
          description: 'Token ausente o inválido',
          content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' }, example: { error: 'Token requerido' } } },
        },
        Forbidden: {
          description: 'Permisos insuficientes para este rol',
          content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' }, example: { error: 'Acceso denegado: se requiere rol Administrador' } } },
        },
        NotFound: {
          description: 'Recurso no encontrado',
          content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' }, example: { error: 'Afiliado no encontrado' } } },
        },
        InternalError: {
          description: 'Error interno del servidor',
          content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' }, example: { error: 'Error interno del servidor' } } },
        },
      },
    },
  },
  // ── Archivos donde swagger-jsdoc buscará comentarios JSDoc ──
  apis: [
    './routes/authRoutes.js',
    './routes/usuarioRoutes.js',
    './routes/afiliadoRoutes.js',
    './routes/planRoutes.js',
    './routes/catalogoRoutes.js',
    './routes/dashboardRoutes.js',
    './routes/pagoRoutes.js',
    './routes/configuracionRoutes.js',
    './routes/notificacionRoutes.js',
  ],
};

const swaggerSpec = swaggerJsdoc(options);

module.exports = swaggerSpec;
