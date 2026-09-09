// routes/afiliadoRoutes.js
'use strict';

const express              = require('express');
const router               = express.Router();
const AfiliadoController   = require('../controllers/afiliadoController');
const RegistroController   = require('../controllers/registroController');
const { requireAuth, requireAdmin, requireAdminOrEntrenador, requireAdminOrRecepcionista, requireStaff } = require('../middlewares/auth');
const { uploadFoto }       = require('../middlewares/uploadFoto');

/**
 * @swagger
 * tags:
 *   name: Afiliados
 *   description: Gestión de afiliados del gimnasio (CRUD + ciclos + restricciones + progreso)
 */

// ─────────────────────────────────────────────────────────────
// AFILIADOS — CRUD
// ─────────────────────────────────────────────────────────────

/**
 * @swagger
 * /afiliados:
 *   get:
 *     summary: Listar todos los afiliados
 *     description: >
 *       Devuelve la lista completa de afiliados con su perfil, restricciones médicas
 *       y ciclo activo (si tiene uno). Requiere cualquier rol autenticado.
 *       Optimizado: usa 4 queries planas en lugar de N+1.
 *     tags: [Afiliados]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Lista de afiliados
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Afiliado'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       500:
 *         $ref: '#/components/responses/InternalError'
 */
router.get('/', requireAuth, requireStaff, AfiliadoController.getAll);

/**
 * @swagger
 * /afiliados/me:
 *   get:
 *     summary: Obtener mi perfil (afiliado autenticado)
 *     description: Usa automáticamente el id del token JWT. No requiere parámetro :id.
 *     tags: [Afiliados]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Perfil completo del afiliado autenticado
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Afiliado'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 *       500:
 *         $ref: '#/components/responses/InternalError'
 */
router.get('/me', requireAuth, AfiliadoController.getMe);

// Parte 3: Notas del afiliado sobre ejercicios (ANTES de las rutas /:id paramétricas)
router.post('/me/notas-ejercicio', requireAuth, AfiliadoController.crearNotaEjercicio);
router.get('/me/notas-ejercicio', requireAuth, AfiliadoController.getMisNotasEjercicio);
router.patch('/me/notas-ejercicio/:id_nota', requireAuth, AfiliadoController.actualizarNotaEjercicio);
router.delete('/me/notas-ejercicio/:id_nota', requireAuth, AfiliadoController.eliminarNotaEjercicio);

/**
 * @swagger
 * /afiliados/me:
 *   patch:
 *     summary: Actualizar mi perfil (afiliado autenticado)
 *     description: >
 *       Actualiza SOLO los campos del perfil del afiliado autenticado.
 *       · peso (kg)    → PROGRESO_FISICO del ciclo activo (rango 20–300).
 *       · talla (cm)   → AFILIADO.estatura_cm (rango 1–300).
 *       · telefono     → AFILIADO.telefono.
 *       · correo       → USUARIO.correo (debe ser único).
 *       Responde el IMC recalculado a partir de peso y estatura.
 *     tags: [Afiliados]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               peso:
 *                 type: number
 *                 description: Peso en kg (20–300) — se guarda como progreso del día
 *               talla:
 *                 type: number
 *                 description: Altura en cm (1–300)
 *               telefono:
 *                 type: string
 *                 maxLength: 20
 *               correo:
 *                 type: string
 *                 format: email
 *     responses:
 *       200:
 *         description: Perfil actualizado correctamente
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message: { type: string }
 *                 imc: { type: number, nullable: true }
 *                 perfil:
 *                   type: object
 *                   properties:
 *                     id_usuario: { type: integer }
 *                     telefono: { type: string }
 *                     estatura_cm: { type: number }
 *                     correo: { type: string }
 *                     peso_kg: { type: number }
 *       400:
 *         description: Campos inválidos, sin ciclo activo o correo en uso
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       500:
 *         $ref: '#/components/responses/InternalError'
 */
router.patch('/me', requireAuth, AfiliadoController.updateMe);

/**
 * @swagger
 * /afiliados/me/ciclos:
 *   get:
 *     summary: Obtener mis ciclos (afiliado autenticado)
 *     tags: [Afiliados]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Lista de ciclos del afiliado autenticado
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Ciclo'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       500:
 *         $ref: '#/components/responses/InternalError'
 */
router.get('/me/ciclos', requireAuth, AfiliadoController.getMisCiclos);

/**
 * @swagger
 * /afiliados/me/progreso:
 *   get:
 *     summary: Obtener mi progreso físico (afiliado autenticado)
 *     tags: [Afiliados]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Lista de registros de progreso del afiliado autenticado
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       500:
 *         $ref: '#/components/responses/InternalError'
 */
router.get('/me/progreso', requireAuth, AfiliadoController.getMiProgreso);

/**
 * @swagger
 * /afiliados/me/restricciones:
 *   get:
 *     summary: Obtener mis restricciones médicas (afiliado autenticado)
 *     tags: [Afiliados]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Lista de restricciones activas del afiliado autenticado
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       500:
 *         $ref: '#/components/responses/InternalError'
 */
router.get('/me/restricciones', requireAuth, AfiliadoController.getMisRestricciones);

// ─────────────────────────────────────────────────────────────
// REGISTRO REAL (FASE 1) — app móvil
// ─────────────────────────────────────────────────────────────

/**
 * @swagger
 * /afiliados/me/ejercicios-disponibles:
 *   get:
 *     summary: Ejercicios disponibles para el afiliado autenticado (excluye los prohibidos por sus restricciones)
 *     tags: [Afiliados]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: grupo_muscular
 *         schema: { type: string }
 *         description: Filtro opcional por grupo muscular
 *     responses:
 *       200:
 *         description: Lista de ejercicios permitidos para el afiliado
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       500:
 *         $ref: '#/components/responses/InternalError'
 */
router.get('/me/ejercicios-disponibles', requireAuth, RegistroController.getEjerciciosDisponibles);

/**
 * @swagger
 * /afiliados/me/alimentos-disponibles:
 *   get:
 *     summary: Alimentos disponibles para el afiliado autenticado (excluye los prohibidos por sus restricciones)
 *     description: Enriquecidos con calorías por 100 g (vista v_alimento_calorias).
 *     tags: [Afiliados]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: max_kcal
 *         schema: { type: number }
 *         description: Filtro opcional de calorías máximas por 100 g
 *       - in: query
 *         name: min_proteinas
 *         schema: { type: number }
 *         description: Filtro opcional de proteína mínima (g/100 g)
 *     responses:
 *       200:
 *         description: Lista de alimentos permitidos para el afiliado
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       500:
 *         $ref: '#/components/responses/InternalError'
 */
router.get('/me/alimentos-disponibles', requireAuth, RegistroController.getAlimentosDisponibles);

/**
 * @swagger
 * /afiliados/me/registro-ejercicio:
 *   post:
 *     summary: Registrar ejecución real de un ejercicio (series, reps y peso)
 *     description: >
 *       Guarda un registro en REGISTRO_EJERCICIO para el afiliado autenticado.
 *       Requiere id_ciclo, id_rutina, orden, fecha, series y repeticiones.
 *       Se valida que el ciclo le pertenezca y que el ejercicio esté en la rutina.
 *     tags: [Afiliados]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [id_ciclo, id_rutina, orden, fecha, series, repeticiones]
 *             properties:
 *               id_ciclo:          { type: integer }
 *               id_rutina:         { type: integer }
 *               orden:             { type: integer }
 *               fecha:             { type: string, format: date }
 *               series:            { type: integer, minimum: 1 }
 *               repeticiones:      { type: integer, minimum: 1 }
 *               peso_utilizado_kg: { type: number, example: 60.0 }
 *               notas:             { type: string }
 *     responses:
 *       201:
 *         description: Ejercicio registrado correctamente
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:      { type: string }
 *                 id_registro:  { type: integer }
 *                 resumen:      { type: object, description: Resumen diario actualizado }
 *       400:
 *         description: Datos faltantes/inválidos o ejercicio fuera de la rutina
 *       403:
 *         description: El ciclo no pertenece al afiliado
 *       404:
 *         description: Ciclo no encontrado
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       409:
 *         description: Ya existe un registro idéntico para esa fecha
 *       500:
 *         $ref: '#/components/responses/InternalError'
 */
router.post('/me/registro-ejercicio', requireAuth, RegistroController.registerEjercicio);

/**
 * @swagger
 * /afiliados/me/registro-ejercicio/historial:
 *   get:
 *     summary: Historial de registros reales de ejercicios (máx. 300)
 *     tags: [Afiliados]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: id_ciclo
 *         schema: { type: integer }
 *       - in: query
 *         name: fechaInicio
 *         schema: { type: string, format: date }
 *       - in: query
 *         name: fechaFin
 *         schema: { type: string, format: date }
 *     responses:
 *       200:
 *         description: Lista de registros con ejercicio, volumen calculado y fecha
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 */
router.get('/me/registro-ejercicio/historial', requireAuth, RegistroController.getHistorialEjercicios);

/**
 * @swagger
 * /afiliados/me/consumo-alimento-real:
 *   post:
 *     summary: Registrar consumo real de un alimento del plan
 *     description: >
 *       Guarda en CONSUMO_ALIMENTO_REAL. Las calorías se calculan con la fórmula Atwater
 *       sobre los macros reales del alimento y la cantidad. El alimento debe pertenecer
 *       al plan nutricional del ciclo (FK compuesta a DETALLE_NUTRICIONAL).
 *     tags: [Afiliados]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [id_ciclo, num_comida, id_alimento, fecha, cantidad_g_consumida]
 *             properties:
 *               id_ciclo:             { type: integer }
 *               num_comida:           { type: integer, description: Número de comida (1..4) }
 *               id_alimento:          { type: integer }
 *               fecha:                { type: string, format: date }
 *               cantidad_g_consumida: { type: number, example: 150 }
 *     responses:
 *       201:
 *         description: Consumo registrado correctamente
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:               { type: string }
 *                 id_consumo:            { type: integer }
 *                 calorias_consumidas:   { type: number }
 *                 resumen:               { type: object, description: Resumen diario actualizado }
 *       400:
 *         description: Datos faltantes/inválidos o alimento fuera del plan
 *       403:
 *         description: El ciclo no pertenece al afiliado
 *       404:
 *         description: Ciclo no encontrado
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       409:
 *         description: Ya existe un registro idéntico para esa fecha
 *       500:
 *         $ref: '#/components/responses/InternalError'
 */
router.post('/me/consumo-alimento-real', requireAuth, RegistroController.registerConsumoAlimento);

/**
 * @swagger
 * /afiliados/me/consumo-alimento-real/historial:
 *   get:
 *     summary: Historial de consumos reales de alimentos (máx. 300)
 *     tags: [Afiliados]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: id_ciclo
 *         schema: { type: integer }
 *       - in: query
 *         name: fechaInicio
 *         schema: { type: string, format: date }
 *       - in: query
 *         name: fechaFin
 *         schema: { type: string, format: date }
 *     responses:
 *       200:
 *         description: Lista de consumos con alimento, cantidad y calorías
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 */
router.get('/me/consumo-alimento-real/historial', requireAuth, RegistroController.getHistorialConsumos);

/**
 * @swagger
 * /afiliados/{id}:
 *   get:
 *     summary: Obtener un afiliado por ID
 *     description: Devuelve el perfil completo con restricciones, ciclo activo, planes y progreso.
 *     tags: [Afiliados]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - $ref: '#/components/parameters/idParam'
 *     responses:
 *       200:
 *         description: Perfil completo del afiliado
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Afiliado'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 *       500:
 *         $ref: '#/components/responses/InternalError'
 */
router.get('/:id', requireAuth, requireStaff, AfiliadoController.getById);

/**
 * @swagger
 * /afiliados:
 *   post:
 *     summary: Registrar un nuevo afiliado
 *     description: >
 *       Crea el usuario base en USUARIO (rol=Afiliado) y el perfil en AFILIADO
 *       en una sola transacción. Disponible para cualquier usuario autenticado
 *       (Recepcionista registra al afiliado en mostrador).
 *     tags: [Afiliados]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/AfiliadoCreate'
 *     responses:
 *       201:
 *         description: Afiliado creado correctamente
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 id:      { type: integer, example: 10 }
 *                 message: { type: string,  example: Afiliado creado correctamente }
 *       400:
 *         description: Datos faltantes o documento/correo duplicado
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             example:
 *               error: Ya existe un afiliado con ese documento o correo
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       500:
 *         $ref: '#/components/responses/InternalError'
 */
router.post('/', requireAuth, requireAdminOrRecepcionista, AfiliadoController.create);

/**
 * @swagger
 * /afiliados/{id}:
 *   patch:
 *     summary: Actualizar datos de un afiliado
 *     description: Actualización parcial. Solo se modifican los campos enviados en el body.
 *     tags: [Afiliados]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - $ref: '#/components/parameters/idParam'
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/AfiliadoCreate'
 *     responses:
 *       200:
 *         description: Afiliado actualizado correctamente
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message: { type: string }
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 *       500:
 *         $ref: '#/components/responses/InternalError'
 */
router.patch('/:id', requireAuth, requireAdminOrRecepcionista, AfiliadoController.update);

/**
 * @swagger
 * /afiliados/{id}:
 *   delete:
 *     summary: Eliminar un afiliado (solo Administrador)
 *     description: >
 *       Elimina el afiliado y su usuario base. Si tiene ciclos, planes o progreso
 *       asociados, MySQL rechaza la operación por integridad referencial (ON DELETE RESTRICT).
 *     tags: [Afiliados]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - $ref: '#/components/parameters/idParam'
 *     responses:
 *       200:
 *         description: Afiliado eliminado correctamente
 *       400:
 *         description: No se puede eliminar — tiene registros asociados
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             example:
 *               error: 'No se puede eliminar: el afiliado tiene datos asociados'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 *       500:
 *         $ref: '#/components/responses/InternalError'
 */
router.delete('/:id', requireAuth, requireAdmin, AfiliadoController.delete);

// ─────────────────────────────────────────────────────────────
// FOTO DE PERFIL
// ─────────────────────────────────────────────────────────────

/**
 * @swagger
 * /afiliados/me/foto:
 *   post:
 *     summary: Subir mi foto de perfil (afiliado autenticado)
 *     description: >
 *       Multipart/form-data, campo "foto" (PNG/JPG/WEBP/GIF, máx. 5 MB).
 *       El archivo queda en backend/uploads y AFILIADO.foto guarda la ruta relativa.
 *     tags: [Afiliados]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               foto:
 *                 type: string
 *                 format: binary
 *     responses:
 *       200:
 *         description: Foto actualizada
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message: { type: string }
 *                 foto: { type: string }
 *                 url: { type: string }
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       500:
 *         $ref: '#/components/responses/InternalError'
 */
router.post('/me/foto', requireAuth, uploadFoto, AfiliadoController.subirFoto);

/**
 * @swagger
 * /afiliados/{id}/foto:
 *   post:
 *     summary: Subir foto de perfil de un afiliado (Admin/Recepcionista)
 *     description: Multipart/form-data en el campo "foto" (PNG/JPG/WEBP/GIF, máx. 5 MB).
 *     tags: [Afiliados]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - $ref: '#/components/parameters/idParam'
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               foto:
 *                 type: string
 *                 format: binary
 *     responses:
 *       200:
 *         description: Foto actualizada
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message: { type: string }
 *                 foto: { type: string }
 *                 url: { type: string }
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 *       500:
 *         $ref: '#/components/responses/InternalError'
 */
router.post('/:id/foto', requireAuth, requireAdminOrRecepcionista, uploadFoto, AfiliadoController.subirFoto);

// ─────────────────────────────────────────────────────────────
// CICLOS
// ─────────────────────────────────────────────────────────────

/**
 * @swagger
 * /afiliados/{id}/ciclos:
 *   get:
 *     summary: Listar ciclos de un afiliado
 *     description: Devuelve todos los ciclos históricos del afiliado ordenados por fecha desc.
 *     tags: [Afiliados]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - $ref: '#/components/parameters/idParam'
 *     responses:
 *       200:
 *         description: Lista de ciclos
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Ciclo'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       500:
 *         $ref: '#/components/responses/InternalError'
 */
router.get('/:id/ciclos', requireAuth, requireStaff, AfiliadoController.getCiclos);

/**
 * @swagger
 * /afiliados/{id}/notas-ejercicio:
 *   get:
 *     summary: Listar las notas de ejercicios de un afiliado (staff)
 *     tags: [Afiliados]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         schema: { type: integer }
 *     responses:
 *       200:
 *         description: Lista de notas con nombre del ejercicio
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 */
router.get('/:id/notas-ejercicio', requireAuth, requireStaff, AfiliadoController.getNotasEjercicioAfiliado);

/**
 * @swagger
 * /afiliados/ciclos:
 *   post:
 *     summary: Crear un nuevo ciclo (Admin o Entrenador)
 *     description: >
 *       Crea un nuevo ciclo de entrenamiento para el afiliado.
 *       El ciclo anterior activo se cierra automáticamente (trigger `trg_ciclo_un_activo_insert`).
 *       El trigger `trg_ciclo_no_solapamiento_insert` rechaza ciclos con fechas que se crucen.
 *     tags: [Afiliados]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [id_usuario, fecha_inicio, fecha_fin, objetivo_fisico, nivel_experiencia, disponibilidad_dias]
 *             properties:
 *               id_usuario:                  { type: integer, example: 10 }
 *               fecha_inicio:                { type: string, format: date, example: '2025-01-01' }
 *               fecha_fin:                   { type: string, format: date, example: '2025-03-31' }
 *               objetivo_fisico:             { type: string, enum: [Perdida de grasa, Aumento de masa, Mantenimiento, Rehabilitacion] }
 *               nivel_experiencia:           { type: string, enum: [Principiante, Intermedio, Avanzado] }
 *               disponibilidad_dias:         { type: integer, minimum: 1, maximum: 7 }
 *               grupo_muscular_prioritario:
 *                 type: string
 *                 nullable: true
 *               observaciones:
 *                 type: string
 *                 nullable: true
 *     responses:
 *       201:
 *         description: Ciclo creado correctamente
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 id_ciclo: { type: integer }
 *                 message:  { type: string }
 *       400:
 *         description: Datos faltantes o solapamiento de fechas detectado por trigger
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             example:
 *               error: El ciclo se solapa con un ciclo existente del afiliado.
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 *       500:
 *         $ref: '#/components/responses/InternalError'
 */
router.post('/ciclos', requireAuth, requireAdminOrEntrenador, AfiliadoController.createCiclo);

// ─────────────────────────────────────────────────────────────
// RESTRICCIONES MÉDICAS
// ─────────────────────────────────────────────────────────────

/**
 * @swagger
 * /afiliados/{id}/restricciones:
 *   get:
 *     summary: Restricciones médicas del afiliado
 *     tags: [Afiliados]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - $ref: '#/components/parameters/idParam'
 *     responses:
 *       200:
 *         description: Lista de restricciones activas del afiliado
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Restriccion'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       500:
 *         $ref: '#/components/responses/InternalError'
 */
router.get('/:id/restricciones', requireAuth, requireStaff, AfiliadoController.getRestricciones);

/**
 * @swagger
 * /afiliados/{id}/restricciones:
 *   post:
 *     summary: Asignar restricción médica al afiliado (rol staff)
 *     description: >
 *       Disponible para Administrador, Entrenador y Recepcionista.
 *       La Recepcionista lo usa al registrar un afiliado nuevo (crear → asignar).
 *     tags: [Afiliados]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - $ref: '#/components/parameters/idParam'
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [id_restriccion]
 *             properties:
 *               id_restriccion: { type: integer, example: 3 }
 *     responses:
 *       201:
 *         description: Restricción asignada correctamente
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 *       500:
 *         $ref: '#/components/responses/InternalError'
 */
router.post('/:id/restricciones', requireAuth, requireStaff, AfiliadoController.addRestriccion);

/**
 * @swagger
 * /afiliados/{id}/restricciones/{id_restriccion}:
 *   delete:
 *     summary: Remover restricción médica de un afiliado (rol staff)
 *     tags: [Afiliados]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - $ref: '#/components/parameters/idParam'
 *       - name: id_restriccion
 *         in: path
 *         required: true
 *         schema: { type: integer }
 *         description: ID de la restricción a remover
 *     responses:
 *       200:
 *         description: Restricción removida correctamente
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 *       500:
 *         $ref: '#/components/responses/InternalError'
 */
router.delete('/:id/restricciones/:id_restriccion', requireAuth, requireStaff, AfiliadoController.removeRestriccion);

// ─────────────────────────────────────────────────────────────
// CATÁLOGOS FILTRADOS POR RESTRICCIONES DEL AFILIADO
// ─────────────────────────────────────────────────────────────

/**
 * @swagger
 * /afiliados/{id}/ejercicios-disponibles:
 *   get:
 *     summary: Ejercicios disponibles para el afiliado (excluye los prohibidos por sus restricciones)
 *     tags: [Afiliados]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - $ref: '#/components/parameters/idParam'
 *     responses:
 *       200:
 *         description: Lista de ejercicios permitidos para el afiliado
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       500:
 *         $ref: '#/components/responses/InternalError'
 */
router.get('/:id/ejercicios-disponibles', requireAuth, requireStaff, AfiliadoController.getEjerciciosDisponibles);

/**
 * @swagger
 * /afiliados/{id}/alimentos-disponibles:
 *   get:
 *     summary: Alimentos disponibles para el afiliado (excluye los prohibidos por sus restricciones)
 *     tags: [Afiliados]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - $ref: '#/components/parameters/idParam'
 *     responses:
 *       200:
 *         description: Lista de alimentos permitidos para el afiliado
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       500:
 *         $ref: '#/components/responses/InternalError'
 */
router.get('/:id/alimentos-disponibles', requireAuth, requireStaff, AfiliadoController.getAlimentosDisponibles);

// ─────────────────────────────────────────────────────────────
// PROGRESO FÍSICO
// ─────────────────────────────────────────────────────────────

/**
 * @swagger
 * /afiliados/{id}/progreso:
 *   get:
 *     summary: Historial de progreso físico del afiliado e incluye las observaciones de sus registros de ejercicio
 *     description: Devuelve las mediciones registradas (con IMC calculado, ordenadas por fecha desc) junto con los registros de ejercicio que contienen las notas del afiliado.
 *     tags: [Afiliados]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - $ref: '#/components/parameters/idParam'
 *     responses:
 *       200:
 *         description: Progreso físico + observaciones de ejercicios
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 historial:
 *                   type: array
 *                   description: Mediciones de PROGRESO_FISICO (peso, IMC, medidas)
 *                   items:
 *                     type: object
 *                     properties:
 *                       id_ciclo:         { type: integer }
 *                       fecha_registro:   { type: string, format: date }
 *                       peso_kg:          { type: number, example: 75.5 }
 *                       imc:              { type: number, example: 24.8, description: 'Calculado: peso_kg / (estatura_cm/100)²' }
 *                       porcentaje_grasa:
 *                         type: number
 *                         nullable: true
 *                       medida_cintura:
 *                         type: number
 *                         nullable: true
 *                       medida_brazo:
 *                         type: number
 *                         nullable: true
 *                       medida_pierna:
 *                         type: number
 *                         nullable: true
 *                 registros:
 *                   type: array
 *                   description: REGISTRO_EJERCICIO con las notas/observaciones digitales por el afiliado
 *                   items:
 *                     type: object
 *                     properties:
 *                       id_registro:       { type: integer }
 *                       id_ciclo:          { type: integer }
 *                       fecha:             { type: string, format: date }
 *                       id_rutina:         { type: integer }
 *                       orden:             { type: integer }
 *                       series:            { type: integer }
 *                       repeticiones:      { type: integer }
 *                       peso_utilizado_kg:
 *                         type: number
 *                         nullable: true
 *                       notas:
 *                         type: string
 *                         nullable: true
 *                         description: Observación escrita por el afiliado
 *                       id_ejercicio:      { type: integer }
 *                       nombre_ejercicio:  { type: string }
 *                       grupo_muscular:    { type: string }
 *                       volumen:           { type: number }
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       500:
 *         $ref: '#/components/responses/InternalError'
 */
router.get('/:id/progreso', requireAuth, requireStaff, AfiliadoController.getProgreso);

/**
 * @swagger
 * /afiliados/progreso:
 *   post:
 *     summary: Registrar medición de progreso físico (Admin o Entrenador)
 *     tags: [Afiliados]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [id_ciclo, fecha_registro, peso_kg]
 *             properties:
 *               id_ciclo:         { type: integer,  example: 1 }
 *               fecha_registro:   { type: string,   format: date, example: '2025-02-15' }
 *               peso_kg:          { type: number,   example: 75.5 }
 *               porcentaje_grasa:
 *                 type: number
 *                 nullable: true
 *                 example: 18.5
 *               medida_cintura:
 *                 type: number
 *                 nullable: true
 *                 example: 82.0
 *               medida_brazo:
 *                 type: number
 *                 nullable: true
 *                 example: 35.0
 *               medida_pierna:
 *                 type: number
 *                 nullable: true
 *                 example: 55.0
 *               observaciones:
 *                 type: string
 *                 nullable: true
 *     responses:
 *       201:
 *         description: Progreso registrado correctamente
 *       400:
 *         description: Datos faltantes o registro duplicado para esa fecha y ciclo
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             example:
 *               error: Ya existe un registro de progreso para ese ciclo en esa fecha
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 *       500:
 *         $ref: '#/components/responses/InternalError'
 */
router.post('/progreso', requireAuth, requireAdminOrEntrenador, AfiliadoController.createProgreso);

// ─────────────────────────────────────────────────────────────
// SEGUIMIENTO DIARIO (app móvil)
// ─────────────────────────────────────────────────────────────

/**
 * @swagger
 * /afiliados/me/progreso-ejercicio:
 *   post:
 *     summary: Guardar progreso diario de ejercicios (app móvil)
 *     description: Marca ejercicios como completados/no completados para un ciclo y fecha específicos.
 *     tags: [Afiliados]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [id_ciclo, fecha, ejercicios]
 *             properties:
 *               id_ciclo:   { type: integer }
 *               fecha:      { type: string, format: date }
 *               ejercicios:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     id_ejercicio: { type: integer }
 *                     completado:  { type: boolean }
 *     responses:
 *       201:
 *         description: Progreso guardado correctamente
 *       400:
 *         description: Datos faltantes
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       500:
 *         $ref: '#/components/responses/InternalError'
 */
router.post('/me/progreso-ejercicio', requireAuth, AfiliadoController.saveProgresoEjercicio);

/**
 * @swagger
 * /afiliados/me/progreso-ejercicio/{idCiclo}/{fecha}:
 *   get:
 *     summary: Obtener progreso de ejercicios de un día específico (app móvil)
 *     tags: [Afiliados]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: idCiclo
 *         in: path
 *         required: true
 *         schema: { type: integer }
 *       - name: fecha
 *         in: path
 *         required: true
 *         schema: { type: string, format: date }
 *     responses:
 *       200:
 *         description: Lista de ejercicios con estado de completado
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       500:
 *         $ref: '#/components/responses/InternalError'
 */
router.get('/me/progreso-ejercicio/:idCiclo/:fecha', requireAuth, AfiliadoController.getProgresoEjercicio);

/**
 * @swagger
 * /afiliados/me/agua:
 *   post:
 *     summary: Registrar consumo de agua (app móvil)
 *     tags: [Afiliados]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [fecha, vasos]
 *             properties:
 *               fecha:  { type: string, format: date }
 *               vasos:  { type: integer, minimum: 0, maximum: 20 }
 *     responses:
 *       201:
 *         description: Agua registrada correctamente
 *       400:
 *         description: Datos faltantes
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       500:
 *         $ref: '#/components/responses/InternalError'
 */
router.post('/me/agua', requireAuth, AfiliadoController.saveAgua);

/**
 * @swagger
 * /afiliados/me/agua/{fecha}:
 *   get:
 *     summary: Obtener consumo de agua de una fecha (app móvil)
 *     tags: [Afiliados]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: fecha
 *         in: path
 *         required: true
 *         schema: { type: string, format: date }
 *     responses:
 *       200:
 *         description: Vasos de agua registrados para esa fecha
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 vasos: { type: integer }
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       500:
 *         $ref: '#/components/responses/InternalError'
 */
router.get('/me/agua/:fecha', requireAuth, AfiliadoController.getAgua);

/**
 * @swagger
 * /afiliados/me/consumo-alimento:
 *   post:
 *     summary: Guardar consumo diario de alimentos (app móvil)
 *     tags: [Afiliados]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [id_ciclo, fecha, alimentos]
 *             properties:
 *               id_ciclo:   { type: integer }
 *               fecha:      { type: string, format: date }
 *               alimentos:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     id_alimento: { type: integer }
 *                     num_comida:  { type: integer }
 *                     consumido:   { type: boolean }
 *     responses:
 *       201:
 *         description: Consumo guardado correctamente
 *       400:
 *         description: Datos faltantes
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       500:
 *         $ref: '#/components/responses/InternalError'
 */
router.post('/me/consumo-alimento', requireAuth, AfiliadoController.saveConsumoAlimento);

// ─────────────────────────────────────────────────────────────
// HISTORIAL (app móvil)
// ─────────────────────────────────────────────────────────────

/**
 * @swagger
 * /afiliados/me/agua/historial:
 *   get:
 *     summary: Historial de consumo de agua (últimos 30 días)
 *     tags: [Afiliados]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: fechaInicio
 *         schema: { type: string, format: date }
 *       - in: query
 *         name: fechaFin
 *         schema: { type: string, format: date }
 *     responses:
 *       200:
 *         description: Lista de registros de agua
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 */
router.get('/me/agua/historial', requireAuth, AfiliadoController.getAguaHistorial);

/**
 * @swagger
 * /afiliados/me/consumo/historial:
 *   get:
 *     summary: Historial de consumo de alimentos (últimos 100 registros)
 *     tags: [Afiliados]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: fechaInicio
 *         schema: { type: string, format: date }
 *       - in: query
 *         name: fechaFin
 *         schema: { type: string, format: date }
 *     responses:
 *       200:
 *         description: Lista de registros de consumo
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 */
router.get('/me/consumo/historial', requireAuth, AfiliadoController.getConsumoHistorial);

/**
 * @swagger
 * /afiliados/me/progreso-ejercicio/historial:
 *   get:
 *     summary: Historial de progreso de ejercicios (últimos 200 registros)
 *     tags: [Afiliados]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: id_ciclo
 *         schema: { type: integer }
 *       - in: query
 *         name: fechaInicio
 *         schema: { type: string, format: date }
 *       - in: query
 *         name: fechaFin
 *         schema: { type: string, format: date }
 *     responses:
 *       200:
 *         description: Lista de progreso de ejercicios
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 */
router.get('/me/progreso-ejercicio/historial', requireAuth, AfiliadoController.getProgresoEjercicioHistorial);

/**
 * @swagger
 * /afiliados/me/notas-ejercicio:
 *   post:
 *     summary: Guardar/actualizar la nota del afiliado sobre un ejercicio (upsert por día)
 *     description: Crea la nota si no existe para (ejercicio, ciclo, día) y la actualiza si ya existe.
 *     tags: [Afiliados]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [id_ejercicio, id_ciclo, nota]
 *             properties:
 *               id_ejercicio: { type: integer, example: 1 }
 *               id_ciclo:     { type: integer, example: 2 }
 *               nota:         { type: string, example: "Me cuesta el hombro con este ejercicio" }
 *               fecha_nota:   { type: string, format: date, description: 'Opcional, hoy por defecto' }
 *     responses:
 *       201:
 *         description: Nota guardada correctamente
 *       400:
 *         description: Faltan campos o ejercicio/ciclo no existe
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *   get:
 *     summary: Listar mis notas de ejercicios (opcional filtrar por id_ciclo)
 *     tags: [Afiliados]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: id_ciclo
 *         in: query
 *         required: false
 *         schema: { type: integer }
 *     responses:
 *       200:
 *         description: Lista de notas con nombre del ejercicio
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 */
/**
 * @swagger
 * /afiliados/me/notas-ejercicio/{id_nota}:
 *   patch:
 *     summary: Editar una de mis notas (solo la propia)
 *     tags: [Afiliados]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: id_nota
 *         in: path
 *         required: true
 *         schema: { type: integer }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [nota]
 *             properties:
 *               nota: { type: string, example: "Ya no me molesta, mejoré" }
 *     responses:
 *       200:
 *         description: Nota actualizada correctamente
 *       400:
 *         description: Falta el campo nota
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       404:
 *         description: Nota no encontrada
 *   delete:
 *     summary: Eliminar una de mis notas (solo la propia)
 *     tags: [Afiliados]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: id_nota
 *         in: path
 *         required: true
 *         schema: { type: integer }
 *     responses:
 *       200:
 *         description: Nota eliminada correctamente
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       404:
 *         description: Nota no encontrada
 */
module.exports = router;