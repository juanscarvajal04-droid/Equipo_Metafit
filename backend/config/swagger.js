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
        description: 'Servidor de desarrollo (local)',
      },
      {
        url: 'https://metafit-backend-rr18.onrender.com',
        description: 'Servidor de producción (Render)',
      },
    ],
    // ── Tags globales (orden de los módulos en la UI) ────────
    tags: [
      { name: 'Autenticación', description: 'Login y recuperación de contraseña' },
      { name: 'Usuarios (Personal)', description: 'Gestión del personal del gimnasio' },
      { name: 'Afiliados', description: 'CRUD de afiliados, ciclos, restricciones y progreso' },
      { name: 'Ciclos', description: 'Actualizar y eliminar ciclos de entrenamiento' },
      { name: 'Planes', description: 'Planes de entrenamiento y nutricionales por ciclo' },
      { name: 'Pagos', description: 'Pagos de membresía y métricas financieras' },
      { name: 'Dashboard', description: 'KPIs y métricas del gimnasio (solo Admin)' },
      { name: 'Notificaciones', description: 'Notificaciones contextuales por rol' },
      { name: 'Catálogos', description: 'Ejercicios, alimentos y restricciones médicas' },
      { name: 'Configuración', description: 'Parámetros del sistema editables por Admin' },
      { name: 'Progreso', description: 'Progreso diario, historial y evolución del afiliado' },
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
        Ejercicio: {
          type: 'object',
          required: ['nombre_ejercicio', 'grupo_muscular', 'nivel_minimo'],
          properties: {
            id_ejercicio:     { type: 'integer', example: 1 },
            nombre_ejercicio: { type: 'string',  example: 'Sentadilla Búlgara' },
            grupo_muscular:   { type: 'string',  enum: ['Piernas', 'Pecho', 'Espalda', 'Hombros', 'Biceps', 'Triceps', 'Core', 'Gluteos'] },
            nivel_minimo:     { type: 'string',  enum: ['Principiante', 'Intermedio', 'Avanzado'] },
            descripcion:      { type: 'string',  nullable: true, example: 'Posición de zancada con pierna trasera elevada' },
          },
        },
        Alimento: {
          type: 'object',
          required: ['nombre_alimento', 'proteinas', 'carbohidratos', 'grasas'],
          properties: {
            id_alimento:       { type: 'integer', example: 1 },
            nombre_alimento:   { type: 'string',  example: 'Pechuga de pollo' },
            proteinas:         { type: 'number',  example: 31.0, description: 'g por cada 100 g' },
            carbohidratos:     { type: 'number',  example: 0.0,  description: 'g por cada 100 g' },
            grasas:            { type: 'number',  example: 3.6,  description: 'g por cada 100 g' },
            calorias_por_100g: { type: 'number',  example: 158.0, description: 'Calculado con la fórmula Atwater (view v_alimento_calorias)' },
          },
        },
        PlanEntrenamiento: {
          type: 'object',
          properties: {
            id_ciclo:      { type: 'integer', example: 1 },
            observaciones: { type: 'string', nullable: true },
            rutinas: {
              type: 'array',
              items: { $ref: '#/components/schemas/Rutina' },
            },
          },
        },
        PlanNutricional: {
          type: 'object',
          properties: {
            id_ciclo:          { type: 'integer', example: 1 },
            calorias_objetivo: { type: 'number', example: 2200.0, description: 'Meta diaria en kcal (500–10000)' },
            num_comidas:       { type: 'integer', example: 5, description: 'Comidas al día (1–10)' },
            observaciones:     { type: 'string', nullable: true },
            detalle: {
              type: 'array',
              description: 'Alimentos por comida del plan',
              items: { $ref: '#/components/schemas/DetalleNutricional' },
            },
          },
        },
        DetalleNutricional: {
          type: 'object',
          properties: {
            id_ciclo:        { type: 'integer', example: 1 },
            num_comida:      { type: 'integer', example: 2 },
            id_alimento:     { type: 'integer', example: 3 },
            nombre_alimento: { type: 'string',  example: 'Arroz blanco' },
            cantidad_g:      { type: 'number',  example: 200.0 },
          },
        },
        Rutina: {
          type: 'object',
          properties: {
            id_rutina:        { type: 'integer', example: 1 },
            id_ciclo:         { type: 'integer', example: 1 },
            nombre_rutina:    { type: 'string',  example: 'Día de Piernas' },
            enfoque_muscular: { type: 'string',  enum: ['Piernas', 'Pecho', 'Espalda', 'Hombros', 'Biceps', 'Triceps', 'Core', 'Gluteos', 'Full Body', 'Empuje', 'Jale'] },
            dia_numero:       { type: 'integer', minimum: 1, maximum: 7, description: '1=Lunes … 7=Domingo' },
            ejercicios: {
              type: 'array',
              items: { $ref: '#/components/schemas/RutinaEjercicio' },
            },
          },
        },
        RutinaEjercicio: {
          type: 'object',
          properties: {
            id_rutina:        { type: 'integer', example: 1 },
            orden:            { type: 'integer', example: 1 },
            id_ejercicio:     { type: 'integer', example: 5 },
            nombre_ejercicio: { type: 'string',  example: 'Sentadilla Búlgara' },
            series:           { type: 'integer', example: 4 },
            repeticiones:     { type: 'integer', example: 12 },
            peso_kg:          { type: 'number', example: 20.0, nullable: true },
            descanso_seg:     { type: 'integer', example: 90, nullable: true },
          },
        },
        Pago: {
          type: 'object',
          properties: {
            id_pago:           { type: 'integer', example: 1 },
            id_usuario:        { type: 'integer', example: 10 },
            fecha_pago:        { type: 'string',  format: 'date', example: '2025-01-15' },
            valor_pagado:      { type: 'number',  example: 80000.0 },
            estado:            { type: 'string',  enum: ['Pagado', 'Vencido', 'Pendiente'] },
            fecha_vencimiento: { type: 'string',  format: 'date', example: '2025-02-14' },
            observaciones:     { type: 'string', nullable: true },
            registrado_por:    { type: 'integer', nullable: true, description: 'id_usuario de quien registró el pago' },
            fecha_creacion:    { type: 'string',  format: 'date-time' },
            nombres_afiliado:  { type: 'string', description: 'Solo en respuestas con JOIN', example: 'Juan' },
            apellidos_afiliado:{ type: 'string', description: 'Solo en respuestas con JOIN', example: 'Pérez' },
          },
        },
        PagoCreate: {
          type: 'object',
          required: ['fecha_pago', 'valor_pagado'],
          properties: {
            fecha_pago:        { type: 'string', format: 'date', example: '2025-01-15' },
            valor_pagado:      { type: 'number', example: 80000, minimum: 0 },
            estado:            { type: 'string', enum: ['Pagado', 'Vencido', 'Pendiente'], default: 'Pagado' },
            fecha_vencimiento: { type: 'string', format: 'date', description: 'Opcional; si se omite se calcula fecha_pago + 30 días' },
            observaciones:     { type: 'string', nullable: true },
            metodo_pago:       { type: 'string', example: 'Efectivo', description: 'Usado para la factura por correo' },
          },
        },
        NotaEjercicio: {
          type: 'object',
          properties: {
            id_nota:         { type: 'integer', example: 1 },
            id_usuario:      { type: 'integer', example: 10 },
            id_ejercicio:    { type: 'integer', example: 5 },
            id_ciclo:        { type: 'integer', example: 2 },
            nota:            { type: 'string', nullable: true, example: 'Me cuesta el hombro con este ejercicio' },
            fecha_nota:      { type: 'string', format: 'date' },
            nombre_ejercicio:{ type: 'string', description: 'Solo en respuestas con JOIN' },
          },
        },
        Notificacion: {
          type: 'object',
          properties: {
            tipo:     { type: 'string', example: 'membresias_por_vencer' },
            mensaje:  { type: 'string', example: 'Membresías por vencer esta semana' },
            cantidad: { type: 'integer', example: 7 },
            icono:    { type: 'string', example: '💳' },
            ruta:     { type: 'string', example: '/pagos' },
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
    './routes/pagoAdminRoutes.js',
    './routes/configuracionRoutes.js',
    './routes/notificacionRoutes.js',
    './routes/progresoRoutes.js',
    './routes/cicloRoutes.js',
  ],
};

const swaggerSpec = swaggerJsdoc(options);

module.exports = swaggerSpec;
