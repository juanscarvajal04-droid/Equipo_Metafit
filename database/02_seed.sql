-- ============================================================================================================================
-- MetaFit — Semilla de Datos (DML)
-- Origen    : Migrado desde metafit_nosql.json (estructura documental -> relacional 3FN)
-- Version   : 4.0 | Docker-ready: compatible con /docker-entrypoint-initdb.d/
-- ============================================================================================================================
--
-- REGLA CRITICA DE SEGURIDAD (AUTH):
-- Las contrasenas en el JSON (Admin123!, Laura123!, etc.) se almacenan como hashes
-- bcrypt de 12 rondas generados en tiempo real con Node.js/bcryptjs.
-- NUNCA se inserta texto plano. El sistema de login funciona sin modificaciones.
--
-- MAPEO NoSQL -> SQL (resumen):
--   JSON.users[]              -> USUARIO (personal: Admin, Entrenador, Recepcionista)
--   JSON.afiliados[]          -> USUARIO (rol=Afiliado) + AFILIADO
--   JSON.restricciones        -> RESTRICCION (catalogo)
--   JSON.ejercicios[]         -> EJERCICIO + EJERCICIO_RESTRICCION_EXCLUIDA
--   JSON.alimentos[]          -> ALIMENTO + ALIMENTO_RESTRICCION_EXCLUIDA
--   JSON.afiliados[].restricciones[]   -> AFILIADO_RESTRICCION
--   JSON.afiliados[].ciclos[]          -> CICLO
--   JSON.ciclos[].plan_entrenamiento   -> PLAN_ENTRENAMIENTO
--   JSON.plan_entrenamiento.rutinas[]  -> RUTINA + RUTINA_EJERCICIO
--   JSON.ciclos[].plan_nutricional     -> PLAN_NUTRICIONAL + DETALLE_NUTRICIONAL
--   JSON.ciclos[].progreso_fisico[]    -> PROGRESO_FISICO
--   JSON.membresia                     -> (descartado, fuera del alcance del schema actual)
-- ============================================================================================================================

USE `metafit`;
SET FOREIGN_KEY_CHECKS = 0;
SET NAMES utf8mb4;

-- ============================================================================================================================
-- BLOQUE 1 — USUARIO (personal del gimnasio)
-- ============================================================================================================================
-- Contrasenas hasheadas con bcrypt 12 rondas (generadas via Node.js/bcryptjs):
--   Admin123!   -> $2a$12$c3mF4PBqzZSAALCUeXknzecZFAMRqNZYosm321UorUZeYZJSx4s26
--   Laura123!   -> $2a$12$Cs67Wg35r7WkBfeiMFks2Otx83btxjsDCJl6kov4NHlylqmecfvTO
--   Andres123!  -> $2a$12$ssliZmFyCgI1.HOD7pfHA.ckCWRhTY2vEfJ3avOw452JMX0JJF2Ga
--   Maria123!   -> $2a$12$5i/3x.d50ERZoiRdCzDWhufoMWekLpJClNDir5YC4xeUq6RVPynKy
--   Pedro123!   -> $2a$12$Q5dKo5MtOptifVr7Vkmx.OAiQj4kBB/iD.A.9.OQCmFF07pkMxhPq
-- Afiliados usan contrasena inicial MetaFit2025! (deben cambiarla en primer acceso):
--   MetaFit2025! -> hashes individuales por usuario (no reusar el mismo hash)

INSERT INTO `USUARIO`
  (id_usuario, nombres, apellidos, correo, contrasena, rol, estado, fecha_registro)
VALUES
  -- ── Personal del gimnasio ────────────────────────────────────
  (1, 'Carlos',  'Ramírez', 'carlos@metafit.com',
   '$2a$12$c3mF4PBqzZSAALCUeXknzecZFAMRqNZYosm321UorUZeYZJSx4s26',
   'Administrador', 'Activo',    '2024-01-01 08:00:00'),

  (2, 'Laura',   'Gómez',   'laura@metafit.com',
   '$2a$12$Cs67Wg35r7WkBfeiMFks2Otx83btxjsDCJl6kov4NHlylqmecfvTO',
   'Entrenador',    'Activo',    '2024-01-01 08:00:00'),

  (3, 'Andrés',  'Torres',  'andres@metafit.com',
   '$2a$12$ssliZmFyCgI1.HOD7pfHA.ckCWRhTY2vEfJ3avOw452JMX0JJF2Ga',
   'Entrenador',    'Activo',    '2024-01-01 08:00:00'),

  (4, 'María',   'López',   'maria@metafit.com',
   '$2a$12$5i/3x.d50ERZoiRdCzDWhufoMWekLpJClNDir5YC4xeUq6RVPynKy',
   'Recepcionista', 'Activo',    '2024-01-01 08:00:00'),

  (5, 'Pedro',   'Suárez',  'pedro@metafit.com',
   '$2a$12$Q5dKo5MtOptifVr7Vkmx.OAiQj4kBB/iD.A.9.OQCmFF07pkMxhPq',
   'Recepcionista', 'Pendiente', '2024-01-02 08:00:00'),

  -- ── Afiliados (rol=Afiliado, contrasena inicial individual) ──
  (6,  'Juan',  'Martínez', 'juan@gmail.com',
   '$2a$12$9Z9XY1M1wFf/mcPlNJOK2OfZp3WNuVMvdmDsLh.oKZl/VZvW0ordO',
   'Afiliado', 'Activo', '2024-01-08 08:00:00'),

  (7,  'Ana',   'Rodríguez','ana@gmail.com',
   '$2a$12$/OvH1.U9Z8nEIBclUeSYQeknyJvCMG6BpGHeE5dXAFryLXCfwhaQO',
   'Afiliado', 'Activo', '2024-02-01 08:00:00'),

  (8,  'Luis',  'Herrera',  'luis@gmail.com',
   '$2a$12$mc.uLJ5DLfAX8.wy42P9deJVqXbu8bbJWu2OUoncBxCBZcrpy5t.C',
   'Afiliado', 'Activo', '2024-01-15 08:00:00'),

  (9,  'Sofía', 'Castro',   'sofia@gmail.com',
   '$2a$12$x6tpLYgFMA5e0Vu/3SbqceVv/ZFUjGVdowdVcf9Osr11Vt7FIqhqO',
   'Afiliado', 'Activo', '2024-04-01 08:00:00');


-- ============================================================================================================================
-- BLOQUE 2 — CATALOGO DE RESTRICCIONES MEDICAS
-- Originado en JSON.afiliados[].restricciones[] y JSON.ejercicios[].restricciones_excluidas[]
-- ============================================================================================================================

INSERT INTO `RESTRICCION`
  (id_restriccion, nombre_restriccion, tipo, efecto_relevante)
VALUES
  (1, 'Diabetes tipo 2',        'Enfermedad',   'Evitar ejercicio de alta intensidad sin supervision'),
  (2, 'Hipertension arterial',  'Enfermedad',   'Controlar frecuencia cardiaca durante el ejercicio'),
  (3, 'Lesion rodilla derecha', 'Lesion',        NULL),
  (4, 'Alergia al gluten',      'Alergia',       NULL),
  (5, 'Intolerancia a lactosa', 'Alergia',       NULL),
  (6, 'Metformina',             'Medicamento',   'Puede causar hipoglucemia en ejercicio intenso');


-- ============================================================================================================================
-- BLOQUE 3 — CATALOGO DE EJERCICIOS
-- Originado en JSON.ejercicios[]. Tildes en nombre_ejercicio eliminadas en ENUM grupo_muscular.
-- ============================================================================================================================

INSERT INTO `EJERCICIO`
  (id_ejercicio, nombre_ejercicio, grupo_muscular, descripcion, nivel_minimo)
VALUES
  (1, 'Sentadilla',            'Piernas',  NULL, 'Principiante'),
  (2, 'Press de banca',        'Pecho',    NULL, 'Principiante'),
  (3, 'Peso muerto',           'Espalda',  NULL, 'Intermedio'),
  (4, 'Press militar',         'Hombros',  NULL, 'Intermedio'),
  (5, 'Curl de biceps',        'Biceps',   NULL, 'Principiante'),
  (6, 'Extension de triceps',  'Triceps',  NULL, 'Principiante'),
  (7, 'Hip thrust',            'Gluteos',  NULL, 'Intermedio'),
  (8, 'Dominadas',             'Espalda',  NULL, 'Avanzado'),
  (9, 'Zancadas',              'Piernas',  NULL, 'Intermedio');


-- ============================================================================================================================
-- BLOQUE 4 — CATALOGO DE ALIMENTOS (macros por 100g)
-- Originado en JSON.alimentos[]. calorias_calculadas DESCARTADA (es campo derivado -> VIEW).
-- ============================================================================================================================

INSERT INTO `ALIMENTO`
  (id_alimento, nombre_alimento, proteinas, carbohidratos, grasas)
VALUES
  (1,  'Pechuga de pollo',    31.00,  0.00, 3.60),
  (2,  'Arroz blanco',         2.70, 28.00, 0.30),
  (3,  'Huevo entero',        13.00,  1.10,11.00),
  (4,  'Avena',               17.00, 66.00, 7.00),
  (5,  'Brocoli',              2.80,  7.00, 0.40),
  (6,  'Atun en agua',        29.00,  0.00, 0.50),
  (7,  'Batata',               1.60, 20.00, 0.10),
  (8,  'Almendras',           21.00, 22.00,50.00),
  (9,  'Leche deslactosada',   3.40,  4.80, 3.60),
  (10, 'Quinoa',              14.00, 64.00, 6.00);


-- ============================================================================================================================
-- BLOQUE 5 — PIVOT: EJERCICIO_RESTRICCION_EXCLUIDA
-- Originado en JSON.ejercicios[].restricciones_excluidas[]
-- ============================================================================================================================

INSERT INTO `EJERCICIO_RESTRICCION_EXCLUIDA`
  (id_ejercicio, id_restriccion)
VALUES
  (1, 3),   -- Sentadilla       excluida por Lesion rodilla derecha
  (3, 1),   -- Peso muerto      excluido por Diabetes tipo 2
  (3, 2),   -- Peso muerto      excluido por Hipertension arterial
  (4, 2),   -- Press militar    excluido por Hipertension arterial
  (7, 3),   -- Hip thrust       excluido por Lesion rodilla derecha
  (8, 1),   -- Dominadas        excluidas por Diabetes tipo 2
  (9, 3);   -- Zancadas         excluidas por Lesion rodilla derecha


-- ============================================================================================================================
-- BLOQUE 6 — PIVOT: ALIMENTO_RESTRICCION_EXCLUIDA
-- Originado en JSON.alimentos[].restricciones_excluidas[]
-- ============================================================================================================================

INSERT INTO `ALIMENTO_RESTRICCION_EXCLUIDA`
  (id_alimento, id_restriccion)
VALUES
  (2, 1),   -- Arroz blanco       excluido por Diabetes tipo 2
  (4, 4),   -- Avena              excluida por Alergia al gluten
  (7, 1),   -- Batata             excluida por Diabetes tipo 2
  (9, 5);   -- Leche deslactosada excluida por Intolerancia a lactosa


-- ============================================================================================================================
-- BLOQUE 7 — AFILIADO (sub-tipo de USUARIO)
-- Originado en JSON.afiliados[].
-- NOTA: objetivo_fisico, nivel_experiencia, disponibilidad_semanal_dias -> CICLO (no almacenar aqui, violaría 3FN).
-- ============================================================================================================================

INSERT INTO `AFILIADO`
  (id_usuario, documento,   fecha_nacimiento, sexo,       telefono,     direccion,
   estatura_cm, estado_afiliacion, fecha_registro, fecha_ultima_modificacion, registrado_por)
VALUES
  -- Juan Martínez | registrado_por: María (id=4)
  (6,  1001234567, '1990-03-15', 'Masculino', '3001234567', 'Bogotá, Calle 10 # 5-20',
   175.50, 'Activo', '2024-01-08', '2026-04-08 21:42:04', 4),

  -- Ana Rodríguez | registrado_por: María (id=4)
  (7,  1002345678, '1995-07-22', 'Femenino',  '3012345678', 'Bogotá, Carrera 15 # 8-30',
   162.00, 'Activo', '2024-02-01', '2026-04-08 21:42:15', 4),

  -- Luis Herrera | registrado_por: Pedro (id=5)
  (8,  1003456789, '1988-11-05', 'Masculino', '3023456789', 'Bogotá, Av 20 # 3-10',
   180.00, 'Activo', '2024-01-15', NULL, 5),

  -- Sofía Castro | registrado_por: Pedro (id=5)
  (9,  1004567890, '2000-01-30', 'Femenino',  '3034567890', 'Bogotá, Calle 25 # 12-5',
   158.50, 'Activo', '2024-04-01', NULL, 5);


-- ============================================================================================================================
-- BLOQUE 8 — PIVOT: AFILIADO_RESTRICCION
-- Originado en JSON.afiliados[].restricciones[]
-- ============================================================================================================================

INSERT INTO `AFILIADO_RESTRICCION`
  (id_usuario, id_restriccion)
VALUES
  (6, 2),   -- Juan   : Hipertension arterial
  (7, 5),   -- Ana    : Intolerancia a lactosa
  (8, 1),   -- Luis   : Diabetes tipo 2
  (8, 6);   -- Luis   : Metformina
  -- Sofía  : sin restricciones registradas


-- ============================================================================================================================
-- BLOQUE 9 — CICLOS
-- Originado en JSON.afiliados[].ciclos[].
-- objetivo_fisico: mapeo NoSQL -> ENUM sin tildes ni espacios especiales.
--   "Pérdida de grasa" -> 'Perdida de grasa'
-- registrado_por: no explicitado en JSON -> se asigna entrenador responsable (Laura=2).
-- ============================================================================================================================

INSERT INTO `CICLO`
  (id_ciclo, id_usuario, fecha_inicio, fecha_fin, activo,
   objetivo_fisico,    grupo_muscular_prioritario, nivel_experiencia, disponibilidad_dias,
   observaciones, fecha_creacion,       registrado_por)
VALUES
  -- ── Juan Martínez (id_usuario=6) ──────────────────────────
  (1, 6, '2024-01-08', '2024-03-17', 0,
   'Perdida de grasa', 'Pecho',   'Intermedio',   3, NULL, '2024-01-08 08:00:00', 2),

  (2, 6, '2024-04-04', '2024-05-31', 1,
   'Perdida de grasa', 'Pecho',   'Intermedio',   3, NULL, '2024-04-04 08:00:00', 2),

  -- ── Ana Rodríguez (id_usuario=7) ─────────────────────────
  (3, 7, '2024-02-01', '2024-04-09', 0,
   'Aumento de masa',  'Gluteos', 'Intermedio',   5, NULL, '2024-02-01 08:00:00', 2),

  (4, 7, '2024-04-22', '2024-07-16', 1,
   'Aumento de masa',  'Gluteos', 'Intermedio',   5, NULL, '2024-04-22 08:00:00', 2),

  -- ── Luis Herrera (id_usuario=8) ──────────────────────────
  (5, 8, '2024-01-15', '2024-03-18', 0,
   'Mantenimiento',    'Espalda', 'Avanzado',     6, NULL, '2024-01-15 08:00:00', 3),

  (6, 8, '2024-03-30', '2024-06-13', 1,
   'Mantenimiento',    'Espalda', 'Avanzado',     6, NULL, '2024-03-30 08:00:00', 3),

  -- ── Sofía Castro (id_usuario=9) ──────────────────────────
  (7, 9, '2024-04-01', '2024-06-30', 0,
   'Perdida de grasa', NULL,      'Principiante', 4, NULL, '2024-04-01 08:00:00', 2),

  (8, 9, '2024-07-01', '2024-09-30', 1,
   'Perdida de grasa', NULL,      'Principiante', 4, NULL, '2024-07-01 08:00:00', 2);


-- ============================================================================================================================
-- BLOQUE 10 — PLAN_ENTRENAMIENTO (1:1 con CICLO via PK=FK)
-- es_automatico del JSON DESCARTADO (antipatron YAGNI).
-- modificado_por: null en todos los casos del JSON (nadie lo modificó manualmente).
-- ============================================================================================================================

INSERT INTO `PLAN_ENTRENAMIENTO`
  (id_ciclo, modificado_por, observaciones)
VALUES
  (1, NULL, NULL),   -- Juan Ciclo 1
  (2, NULL, NULL),   -- Juan Ciclo 2
  (3, NULL, NULL),   -- Ana  Ciclo 1
  (4, NULL, NULL),   -- Ana  Ciclo 2
  (5, NULL, NULL),   -- Luis Ciclo 1
  (6, NULL, NULL),   -- Luis Ciclo 2
  (7, NULL, NULL),   -- Sofía Ciclo 1
  (8, NULL, NULL);   -- Sofía Ciclo 2


-- ============================================================================================================================
-- BLOQUE 11 — RUTINAS
-- Originado en JSON.ciclos[].plan_entrenamiento.rutinas[]
-- dia_semana DESCARTADO (era derivado de dia_numero -> viola 3FN).
-- enfoque_muscular: mapeo tildes -> ENUM sin tildes.
--   "Tríceps" -> 'Triceps', "Glúteos" -> 'Gluteos', "Bíceps" -> 'Biceps'
-- ============================================================================================================================

INSERT INTO `RUTINA`
  (id_rutina, id_ciclo, nombre_rutina, enfoque_muscular, dia_numero)
VALUES
  -- ── Juan Ciclo 1 (id_ciclo=1) ─────────────────────────────
  (1,  1, 'Día 1 — Pecho y Tríceps',    'Pecho',   1),
  (2,  1, 'Día 2 — Espalda y Bíceps',   'Espalda', 2),
  (3,  1, 'Día 3 — Piernas y Glúteos',  'Piernas', 4),

  -- ── Juan Ciclo 2 (id_ciclo=2) ─────────────────────────────
  (4,  2, 'Día 1 — Pecho y Tríceps',    'Pecho',   1),
  (5,  2, 'Día 2 — Espalda y Bíceps',   'Espalda', 4),
  (6,  2, 'Día 3 — Piernas y Glúteos',  'Piernas', 7),

  -- ── Ana Ciclo 1 (id_ciclo=3) ──────────────────────────────
  (7,  3, 'Día 1 — Pecho y Tríceps',    'Pecho',   1),
  (8,  3, 'Día 2 — Espalda y Bíceps',   'Espalda', 2),
  (9,  3, 'Día 3 — Piernas y Glúteos',  'Piernas', 4),

  -- ── Ana Ciclo 2 (id_ciclo=4) ──────────────────────────────
  (10, 4, 'Día 1 — Pecho y Tríceps',    'Pecho',   5),
  (11, 4, 'Día 2 — Espalda y Bíceps',   'Espalda', 6),
  (12, 4, 'Día 3 — Piernas y Glúteos',  'Piernas', 7),

  -- ── Luis Ciclo 1 (id_ciclo=5) ─────────────────────────────
  (13, 5, 'Día 1 — Pecho y Tríceps',    'Pecho',   1),
  (14, 5, 'Día 2 — Espalda y Bíceps',   'Espalda', 2),
  (15, 5, 'Día 3 — Piernas y Glúteos',  'Piernas', 6),

  -- ── Luis Ciclo 2 (id_ciclo=6) ─────────────────────────────
  (16, 6, 'Día 1 — Pecho y Tríceps',    'Pecho',   3),
  (17, 6, 'Día 2 — Espalda y Bíceps',   'Espalda', 4),
  (18, 6, 'Día 3 — Piernas y Glúteos',  'Piernas', 5),

  -- ── Sofía Ciclo 1 (id_ciclo=7) ────────────────────────────
  (19, 7, 'Día 1 — Pecho y Tríceps',    'Pecho',   2),
  (20, 7, 'Día 2 — Espalda y Bíceps',   'Espalda', 3),
  (21, 7, 'Día 3 — Piernas y Glúteos',  'Piernas', 5),

  -- ── Sofía Ciclo 2 (id_ciclo=8) ────────────────────────────
  (22, 8, 'Día 1 — Full Body A',        'Pecho',   1),
  (23, 8, 'Día 2 — Full Body B',        'Espalda', 3),
  (24, 8, 'Día 3 — Piernas y Core',     'Piernas', 5);


-- ============================================================================================================================
-- BLOQUE 12 — RUTINA_EJERCICIO
-- Originado en JSON.rutinas[].ejercicios[] (arrays anidados -> tabla pivot con orden)
-- PK=(id_rutina, orden): el mismo ejercicio puede aparecer en posiciones distintas.
-- ============================================================================================================================

INSERT INTO `RUTINA_EJERCICIO`
  (id_rutina, orden, id_ejercicio, series, repeticiones)
VALUES
  -- ── Rutina 1: Juan C1 — Pecho y Tríceps ──────────────────
  (1, 1, 2, 5, 15),   -- Press de banca
  (1, 2, 9, 3, 15),   -- Zancadas
  (1, 3, 6, 4, 15),   -- Extension de triceps

  -- ── Rutina 2: Juan C1 — Espalda y Bíceps ─────────────────
  (2, 1, 2, 4, 10),   -- Press de banca
  (2, 2, 5, 3, 10),   -- Curl de biceps
  (2, 3, 1, 3, 11),   -- Sentadilla

  -- ── Rutina 3: Juan C1 — Piernas y Glúteos ────────────────
  (3, 1, 5, 5, 15),   -- Curl de biceps
  (3, 2, 7, 3, 12),   -- Hip thrust
  (3, 3, 8, 4,  8),   -- Dominadas
  (3, 4, 2, 4, 14),   -- Press de banca

  -- ── Rutina 4: Juan C2 — Pecho y Tríceps ──────────────────
  (4, 1, 6, 4, 15),   -- Extension de triceps
  (4, 2, 5, 5, 12),   -- Curl de biceps
  (4, 3, 7, 3,  8),   -- Hip thrust

  -- ── Rutina 5: Juan C2 — Espalda y Bíceps ─────────────────
  (5, 1, 2, 4, 10),   -- Press de banca
  (5, 2, 5, 3,  9),   -- Curl de biceps
  (5, 3, 1, 4, 12),   -- Sentadilla
  (5, 4, 9, 3, 14),   -- Zancadas

  -- ── Rutina 6: Juan C2 — Piernas y Glúteos ────────────────
  (6, 1, 7, 3, 13),   -- Hip thrust
  (6, 2, 1, 5,  8),   -- Sentadilla
  (6, 3, 6, 5, 15),   -- Extension de triceps
  (6, 4, 2, 5, 11),   -- Press de banca

  -- ── Rutina 7: Ana C1 — Pecho y Tríceps ───────────────────
  (7, 1, 8, 4,  8),   -- Dominadas
  (7, 2, 1, 4, 14),   -- Sentadilla
  (7, 3, 7, 3,  9),   -- Hip thrust

  -- ── Rutina 8: Ana C1 — Espalda y Bíceps ──────────────────
  (8, 1, 4, 5, 13),   -- Press militar
  (8, 2, 6, 5, 15),   -- Extension de triceps
  (8, 3, 7, 5,  9),   -- Hip thrust
  (8, 4, 2, 5,  9),   -- Press de banca

  -- ── Rutina 9: Ana C1 — Piernas y Glúteos ─────────────────
  (9, 1, 6, 5, 10),   -- Extension de triceps
  (9, 2, 7, 5, 15),   -- Hip thrust
  (9, 3, 3, 3,  9),   -- Peso muerto
  (9, 4, 2, 4,  9),   -- Press de banca

  -- ── Rutina 10: Ana C2 — Pecho y Tríceps ──────────────────
  (10, 1, 6, 4, 10),  -- Extension de triceps
  (10, 2, 2, 3, 13),  -- Press de banca

  -- ── Rutina 11: Ana C2 — Espalda y Bíceps ─────────────────
  (11, 1, 8, 5, 12),  -- Dominadas
  (11, 2, 9, 4, 10),  -- Zancadas

  -- ── Rutina 12: Ana C2 — Piernas y Glúteos ────────────────
  (12, 1, 5, 5,  8),  -- Curl de biceps
  (12, 2, 1, 3, 11),  -- Sentadilla
  (12, 3, 6, 4, 10),  -- Extension de triceps

  -- ── Rutina 13: Luis C1 — Pecho y Tríceps ─────────────────
  (13, 1, 7, 3,  8),  -- Hip thrust
  (13, 2, 2, 3, 13),  -- Press de banca
  (13, 3, 5, 5, 13),  -- Curl de biceps

  -- ── Rutina 14: Luis C1 — Espalda y Bíceps ────────────────
  (14, 1, 6, 4, 13),  -- Extension de triceps
  (14, 2, 7, 5,  8),  -- Hip thrust

  -- ── Rutina 15: Luis C1 — Piernas y Glúteos ───────────────
  (15, 1, 9, 4, 11),  -- Zancadas
  (15, 2, 2, 4, 11),  -- Press de banca
  (15, 3, 6, 4,  9),  -- Extension de triceps
  (15, 4, 1, 4,  9),  -- Sentadilla

  -- ── Rutina 16: Luis C2 — Pecho y Tríceps ─────────────────
  (16, 1, 6, 3, 10),  -- Extension de triceps
  (16, 2, 5, 4,  8),  -- Curl de biceps
  (16, 3, 7, 4, 12),  -- Hip thrust
  (16, 4, 1, 5, 13),  -- Sentadilla

  -- ── Rutina 17: Luis C2 — Espalda y Bíceps ────────────────
  (17, 1, 4, 3,  9),  -- Press militar
  (17, 2, 7, 3, 12),  -- Hip thrust

  -- ── Rutina 18: Luis C2 — Piernas y Glúteos ───────────────
  (18, 1, 6, 4, 11),  -- Extension de triceps
  (18, 2, 2, 5, 15),  -- Press de banca
  (18, 3, 4, 3, 15),  -- Press militar
  (18, 4, 7, 3, 14),  -- Hip thrust

  -- ── Rutina 19: Sofía C1 — Pecho y Tríceps ────────────────
  (19, 1, 4, 4,  8),  -- Press militar
  (19, 2, 9, 5, 12),  -- Zancadas

  -- ── Rutina 20: Sofía C1 — Espalda y Bíceps ───────────────
  (20, 1, 6, 4,  9),  -- Extension de triceps
  (20, 2, 3, 4,  8),  -- Peso muerto

  -- ── Rutina 21: Sofía C1 — Piernas y Glúteos ──────────────
  (21, 1, 1, 3, 12),  -- Sentadilla
  (21, 2, 5, 4, 15),  -- Curl de biceps
  (21, 3, 6, 3, 12),  -- Extension de triceps

  -- ── Rutina 22: Sofía C2 — Full Body A ────────────────────
  (22, 1, 2, 3, 12),  -- Press de banca
  (22, 2, 1, 3, 10),  -- Sentadilla
  (22, 3, 5, 3, 12),  -- Curl de biceps

  -- ── Rutina 23: Sofía C2 — Full Body B ────────────────────
  (23, 1, 6, 3, 12),  -- Extension de triceps
  (23, 2, 9, 3, 10),  -- Zancadas
  (23, 3, 4, 3, 10),  -- Press militar

  -- ── Rutina 24: Sofía C2 — Piernas y Core ─────────────────
  (24, 1, 1, 4, 12),  -- Sentadilla
  (24, 2, 7, 3, 12),  -- Hip thrust
  (24, 3, 6, 3, 15);  -- Extension de triceps


-- ============================================================================================================================
-- BLOQUE 13 — PLAN_NUTRICIONAL (1:1 con CICLO via PK=FK)
-- calorias_objetivo <- JSON.calorias_estimadas (renombrado: es una META del entrenador)
-- num_comidas       <- JSON.num_comidas_diarias
-- ============================================================================================================================

INSERT INTO `PLAN_NUTRICIONAL`
  (id_ciclo, calorias_objetivo, num_comidas, modificado_por, observaciones)
VALUES
  (1, 1556.48, 3, NULL, NULL),   -- Juan  Ciclo 1
  (2, 1899.56, 4, NULL, NULL),   -- Juan  Ciclo 2
  (3, 2884.09, 4, NULL, NULL),   -- Ana   Ciclo 1
  (4, 3012.07, 4, NULL, NULL),   -- Ana   Ciclo 2
  (5, 2383.66, 3, NULL, NULL),   -- Luis  Ciclo 1
  (6, 2050.11, 3, NULL, NULL),   -- Luis  Ciclo 2
  (7, 1800.00, 4, NULL, NULL),   -- Sofía Ciclo 1
  (8, 1750.00, 4, NULL, NULL);   -- Sofía Ciclo 2


-- ============================================================================================================================
-- BLOQUE 14 — DETALLE_NUTRICIONAL
-- Originado en JSON.plan_nutricional.detalle[]
-- num_comida  <- JSON.numero_comida (renombrado, snake_case consistente)
-- cantidad_g  <- JSON.cantidad_g
-- PK natural triple: (id_ciclo, num_comida, id_alimento)
-- ============================================================================================================================

INSERT INTO `DETALLE_NUTRICIONAL`
  (id_ciclo, num_comida, id_alimento, cantidad_g)
VALUES
  -- ── Juan Ciclo 1 (id_ciclo=1) | 3 comidas ────────────────
  (1, 1, 10,  83.00),   -- Comida 1: Quinoa
  (1, 1,  3, 213.00),   -- Comida 1: Huevo entero
  (1, 1,  4, 168.00),   -- Comida 1: Avena
  (1, 2,  4,  86.00),   -- Comida 2: Avena
  (1, 2, 10, 150.00),   -- Comida 2: Quinoa
  (1, 3,  3, 205.00),   -- Comida 3: Huevo entero

  -- ── Juan Ciclo 2 (id_ciclo=2) | 4 comidas ────────────────
  (2, 1,  4,  99.00),   -- Comida 1: Avena
  (2, 2,  5, 171.00),   -- Comida 2: Brocoli
  (2, 3, 10, 192.00),   -- Comida 3: Quinoa
  (2, 3,  4, 211.00),   -- Comida 3: Avena
  (2, 3,  3, 219.00),   -- Comida 3: Huevo entero
  (2, 4,  1, 177.00),   -- Comida 4: Pechuga de pollo
  (2, 4,  5,  94.00),   -- Comida 4: Brocoli
  (2, 4, 10,  98.00),   -- Comida 4: Quinoa

  -- ── Ana Ciclo 1 (id_ciclo=3) | 4 comidas ─────────────────
  (3, 1,  6, 160.00),   -- Comida 1: Atun en agua
  (3, 1,  3, 114.00),   -- Comida 1: Huevo entero
  (3, 1,  8, 195.00),   -- Comida 1: Almendras
  (3, 2, 10, 243.00),   -- Comida 2: Quinoa
  (3, 3,  6, 143.00),   -- Comida 3: Atun en agua
  (3, 3,  2,  52.00),   -- Comida 3: Arroz blanco
  (3, 4,  1, 176.00),   -- Comida 4: Pechuga de pollo
  (3, 4,  2, 145.00),   -- Comida 4: Arroz blanco
  (3, 4,  6, 237.00),   -- Comida 4: Atun en agua

  -- ── Ana Ciclo 2 (id_ciclo=4) | 4 comidas ─────────────────
  (4, 1,  1, 100.00),   -- Comida 1: Pechuga de pollo
  (4, 1,  6, 167.00),   -- Comida 1: Atun en agua
  (4, 2, 10, 205.00),   -- Comida 2: Quinoa
  (4, 2,  6,  88.00),   -- Comida 2: Atun en agua
  (4, 3,  5, 235.00),   -- Comida 3: Brocoli
  (4, 3,  8, 134.00),   -- Comida 3: Almendras
  (4, 3,  4, 204.00),   -- Comida 3: Avena
  (4, 4,  3, 219.00),   -- Comida 4: Huevo entero

  -- ── Luis Ciclo 1 (id_ciclo=5) | 3 comidas ────────────────
  (5, 1,  6,  85.00),   -- Comida 1: Atun en agua
  (5, 1,  3, 238.00),   -- Comida 1: Huevo entero
  (5, 1,  9,  76.00),   -- Comida 1: Leche deslactosada
  (5, 2,  3,  58.00),   -- Comida 2: Huevo entero
  (5, 2,  6,  57.00),   -- Comida 2: Atun en agua
  (5, 2,  5,  73.00),   -- Comida 2: Brocoli
  (5, 3,  5, 179.00),   -- Comida 3: Brocoli

  -- ── Luis Ciclo 2 (id_ciclo=6) | 3 comidas ────────────────
  (6, 1,  4, 250.00),   -- Comida 1: Avena
  (6, 1,  5, 240.00),   -- Comida 1: Brocoli
  (6, 1,  9, 162.00),   -- Comida 1: Leche deslactosada
  (6, 2, 10, 115.00),   -- Comida 2: Quinoa
  (6, 2,  9, 112.00),   -- Comida 2: Leche deslactosada
  (6, 3,  8, 175.00),   -- Comida 3: Almendras

  -- ── Sofía Ciclo 1 (id_ciclo=7) | 4 comidas ───────────────
  (7, 1,  1, 150.00),   -- Comida 1: Pechuga de pollo
  (7, 1,  5, 120.00),   -- Comida 1: Brocoli
  (7, 2,  4,  80.00),   -- Comida 2: Avena
  (7, 2,  3, 100.00),   -- Comida 2: Huevo entero
  (7, 3,  6, 120.00),   -- Comida 3: Atun en agua
  (7, 3, 10,  90.00),   -- Comida 3: Quinoa
  (7, 4,  5, 200.00),   -- Comida 4: Brocoli
  (7, 4,  1, 100.00),   -- Comida 4: Pechuga de pollo

  -- ── Sofía Ciclo 2 (id_ciclo=8) | 4 comidas ───────────────
  (8, 1,  3, 150.00),   -- Comida 1: Huevo entero
  (8, 1,  4,  60.00),   -- Comida 1: Avena
  (8, 2,  1, 160.00),   -- Comida 2: Pechuga de pollo
  (8, 2,  5, 150.00),   -- Comida 2: Brocoli
  (8, 3, 10, 100.00),   -- Comida 3: Quinoa
  (8, 3,  6,  80.00),   -- Comida 3: Atun en agua
  (8, 4,  8,  30.00),   -- Comida 4: Almendras
  (8, 4,  3, 100.00);   -- Comida 4: Huevo entero


-- ============================================================================================================================
-- BLOQUE 15 — PROGRESO_FISICO
-- Originado en JSON.afiliados[].ciclos[].progreso_fisico[]
-- medida_cintura <- JSON.medidas_cm.cintura  (objeto anidado aplanado -> columnas separadas 3FN)
-- medida_brazo   <- JSON.medidas_cm.brazo
-- medida_pierna  <- JSON.medidas_cm.pierna
-- registrado_por <- JSON.registrado_por_id (referencia a USUARIO.id_usuario)
-- IMC NO SE ALMACENA: calculado en backend -> peso_kg / POW(estatura_cm/100, 2)
-- ============================================================================================================================

INSERT INTO `PROGRESO_FISICO`
  (id_ciclo, fecha_registro, peso_kg, porcentaje_grasa,
   medida_cintura, medida_brazo, medida_pierna,
   observaciones, registrado_por)
VALUES
  -- ── Juan Ciclo 1 (id_ciclo=1) ─────────────────────────────
  (1, '2024-01-08', 75.84, 24.43, 90.58, 33.58, 63.93,
   'Buena adherencia al plan',                    2),

  (1, '2024-02-02', 75.09, 24.29, 71.80, 31.89, 53.87,
   'Se nota mejoria en composicion corporal',     3),

  -- ── Juan Ciclo 2 (id_ciclo=2) ─────────────────────────────
  (2, '2024-04-04', 81.13, 17.48, 70.84, 28.78, 66.46,
   'Buena adherencia al plan',                    2),

  (2, '2024-04-27', 80.92, 17.40,100.23, 43.16, 67.70,
   'Buena adherencia al plan',                    2),

  -- ── Ana Ciclo 1 (id_ciclo=3) ──────────────────────────────
  (3, '2024-02-01', 71.27, 23.44, 75.88, 34.76, 49.80,
   'Se nota mejoria en composicion corporal',     1),

  -- ── Ana Ciclo 2 (id_ciclo=4) ──────────────────────────────
  (4, '2024-04-22', 73.66, 14.42, 86.87, 27.48, 54.16,
   NULL,                                          1),

  -- ── Luis Ciclo 1 (id_ciclo=5) ─────────────────────────────
  (5, '2024-01-15', 96.62, 27.25,104.13, 26.09, 63.96,
   NULL,                                          2),

  (5, '2024-02-08', 95.19, 26.83,104.30, 40.97, 66.27,
   'Se nota mejoria en composicion corporal',     2),

  -- ── Luis Ciclo 2 (id_ciclo=6) ─────────────────────────────
  (6, '2024-03-30', 58.30, 18.60, 88.25, 28.90, 69.24,
   'Se nota mejoria en composicion corporal',     2),

  (6, '2024-04-17', 58.13, 18.23, 73.87, 30.77, 63.23,
   'Progreso dentro de lo esperado',              2),

  (6, '2024-05-12', 56.77, 17.84, 68.55, 40.40, 56.06,
   NULL,                                          2),

  -- ── Sofía Ciclo 1 (id_ciclo=7) ────────────────────────────
  (7, '2024-04-01', 62.50, 26.10, 78.40, 28.50, 55.20,
   'Inicio de ciclo. Buena actitud.',             2),

  (7, '2024-05-15', 61.20, 25.40, 76.80, 27.90, 54.10,
   'Progreso dentro de lo esperado',              2),

  -- ── Sofía Ciclo 2 (id_ciclo=8) ────────────────────────────
  (8, '2024-07-01', 60.10, 24.50, 75.20, 27.40, 53.50,
   'Buen inicio de segundo ciclo',                2);


-- ============================================================================================================================
-- Reactivar FK checks y resetear AUTO_INCREMENT para futuros inserts
-- ============================================================================================================================

SET FOREIGN_KEY_CHECKS = 1;

ALTER TABLE `USUARIO`   AUTO_INCREMENT = 10;
ALTER TABLE `EJERCICIO` AUTO_INCREMENT = 10;
ALTER TABLE `ALIMENTO`  AUTO_INCREMENT = 11;
ALTER TABLE `RESTRICCION` AUTO_INCREMENT = 7;
ALTER TABLE `CICLO`     AUTO_INCREMENT = 9;
ALTER TABLE `RUTINA`    AUTO_INCREMENT = 25;

-- ============================================================================================================================
-- VERIFICACION RAPIDA (ejecutar manualmente para validar la carga)
-- ============================================================================================================================
-- SELECT COUNT(*) AS total_usuarios   FROM USUARIO;           -- Esperado: 9
-- SELECT COUNT(*) AS total_afiliados  FROM AFILIADO;          -- Esperado: 4
-- SELECT COUNT(*) AS total_ciclos     FROM CICLO;             -- Esperado: 8
-- SELECT COUNT(*) AS total_rutinas    FROM RUTINA;            -- Esperado: 24
-- SELECT COUNT(*) AS total_ejerc_rut  FROM RUTINA_EJERCICIO;  -- Esperado: 68
-- SELECT COUNT(*) AS total_planes_nut FROM PLAN_NUTRICIONAL;  -- Esperado: 8
-- SELECT COUNT(*) AS total_detalle    FROM DETALLE_NUTRICIONAL;-- Esperado: 54
-- SELECT COUNT(*) AS total_progreso   FROM PROGRESO_FISICO;   -- Esperado: 14
-- SELECT * FROM v_alimento_calorias;
-- SELECT * FROM v_perfil_afiliado;
-- SELECT * FROM v_ciclo_activo_afiliado;
-- SELECT * FROM v_ultimo_progreso;
-- ============================================================================================================================
