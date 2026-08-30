// routes/afiliadoRoutes.js
'use strict';

const express              = require('express');
const router               = express.Router();
const AfiliadoController   = require('../controllers/afiliadoController');
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
 *     summary: Asignar restricción médica al afiliado (Admin o Entrenador)
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
router.post('/:id/restricciones', requireAuth, requireAdminOrEntrenador, AfiliadoController.addRestriccion);

/**
 * @swagger
 * /afiliados/{id}/restricciones/{id_restriccion}:
 *   delete:
 *     summary: Remover restricción médica de un afiliado (Admin o Entrenador)
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
router.delete('/:id/restricciones/:id_restriccion', requireAuth, requireAdminOrEntrenador, AfiliadoController.removeRestriccion);

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
 *     summary: Historial de progreso físico del afiliado
 *     description: Devuelve todas las mediciones registradas, con IMC calculado, ordenadas por fecha desc.
 *     tags: [Afiliados]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - $ref: '#/components/parameters/idParam'
 *     responses:
 *       200:
 *         description: Lista de registros de progreso
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   id_ciclo:         { type: integer }
 *                   fecha_registro:   { type: string, format: date }
 *                   peso_kg:          { type: number, example: 75.5 }
 *                   imc:              { type: number, example: 24.8, description: 'Calculado: peso_kg / (estatura_cm/100)²' }
 *                   porcentaje_grasa:
 *                     type: number
 *                     nullable: true
 *                   medida_cintura:
 *                     type: number
 *                     nullable: true
 *                   medida_brazo:
 *                     type: number
 *                     nullable: true
 *                   medida_pierna:
 *                     type: number
 *                     nullable: true
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

module.exports = router;