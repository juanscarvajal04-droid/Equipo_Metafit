-- ============================================================================================================================
-- 04_datos_iniciales.sql — Datos de Metafit (DML unificado)
--
-- Unifica los antiguos 02_seed.sql + 03_datos_demo.sql + 06_seed_data_completo.sql en UN solo archivo.
-- Idempotente: todos los INSERT usan INSERT IGNORE (se puede re-ejecutar sin errores ni duplicados).
--
-- REGLA CRITICA DE SEGURIDAD (AUTH):
--   Las contrasenas (Admin123!, Laura123!, etc.) se almacenan como hashes bcrypt de 12 rondas
--   generados con Node.js/bcryptjs. NUNCA se inserta texto plano. Los afiliados demo comparten
--   la contrasena inicial MetaFit2025! (el hash bcrypt usado en el seed original).
--
-- ORDEN DE EJECUCION (renumerado por dependencias: lexicografico = orden correcto):
--   01_estructura -> 02_migracion_movil -> 03_mejoras_estructura -> 04_datos_iniciales -> 05_password_reset
--   Este archivo corre en 4a posicion, despues de 02_migracion_movil (PROGRESO_EJERCICIO_DIARIO,
--   REGISTRO_AGUA, CONSUMO_ALIMENTO_DIARIO) y 03_mejoras_estructura (REGISTRO_EJERCICIO,
--   CONSUMO_ALIMENTO_REAL, PROGRESO_DIARIO y las 3 columnas nuevas de AFILIADO).
--   => funciona igual en Docker (initdb lexicografico) y en backend/start.sh (orden explicito).
--
-- RANGOS DE IDS (sin colisiones entre las fuentes fusionadas):
--   1-9    personal + afiliados historicos (origen 02_seed)
--   100    afiliado demo "Carlos Demo"         (origen 03_datos_demo)
--   200-202 afiliados nuevos                   (origen 06_seed_data_completo)
--
-- MAPEO NoSQL -> SQL (origen: metafit_nosql.json -> relacional 3FN):
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
--   Hoja de vida diaria (movil + Fase 0) -> PROGRESO_EJERCICIO_DIARIO, REGISTRO_AGUA,
--                                           CONSUMO_ALIMENTO_DIARIO, REGISTRO_EJERCICIO,
--                                           CONSUMO_ALIMENTO_REAL, PROGRESO_DIARIO
-- ============================================================================================================================

USE `metafit`;
SET NAMES utf8mb4;
SET FOREIGN_KEY_CHECKS = 0;

-- ============================================================================================================================
-- BLOQUE 1 — USUARIO (personal del gimnasio y afiliados)
-- ============================================================================================================================
-- Contrasenas personal hasheadas con bcrypt 12 rondas:
--   Admin123!   -> $2a$12$c3mF4PBqzZSAALCUeXknzecZFAMRqNZYosm321UorUZeYZJSx4s26
--   Laura123!   -> $2a$12$Cs67Wg35r7WkBfeiMFks2Otx83btxjsDCJl6kov4NHlylqmecfvTO
--   Andres123!  -> $2a$12$ssliZmFyCgI1.HOD7pfHA.ckCWRhTY2vEfJ3avOw452JMX0JJF2Ga
--   Maria123!   -> $2a$12$5i/3x.d50ERZoiRdCzDWhufoMWekLpJClNDir5YC4xeUq6RVPynKy
--   Pedro123!   -> $2a$12$Q5dKo5MtOptifVr7Vkmx.OAiQj4kBB/iD.A.9.OQCmFF07pkMxhPq
-- Afiliados usan contrasena inicial MetaFit2025! (deben cambiarla en su primer acceso).

INSERT IGNORE INTO `USUARIO`
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

  -- ── Afiliados historicos (rol=Afiliado, contrasena inicial individual) ──
  (6,  'Juan',  'Martínez', 'juan@gmail.com',
   '$2a$12$VyQI5vdVoepQqwPySKKGXO9I4X89GceDV/Q9RBx2Xds1waAlvgGxy',
   'Afiliado', 'Activo', '2024-01-08 08:00:00'),

  (7,  'Ana',   'Rodríguez','ana@gmail.com',
   '$2a$12$VyQI5vdVoepQqwPySKKGXO9I4X89GceDV/Q9RBx2Xds1waAlvgGxy',
   'Afiliado', 'Activo', '2024-02-01 08:00:00'),

  (8,  'Luis',  'Herrera',  'luis@gmail.com',
   '$2a$12$VyQI5vdVoepQqwPySKKGXO9I4X89GceDV/Q9RBx2Xds1waAlvgGxy',
   'Afiliado', 'Activo', '2024-01-15 08:00:00'),

  (9,  'Sofía', 'Castro',   'sofia@gmail.com',
   '$2a$12$VyQI5vdVoepQqwPySKKGXO9I4X89GceDV/Q9RBx2Xds1waAlvgGxy',
   'Afiliado', 'Activo', '2024-04-01 08:00:00'),

  -- ── Afiliado demo (origen 03_datos_demo) ──────────────────────
  (100, 'Carlos', 'Demo', 'carlos.demo@test.com',
   '$2a$12$c3mF4PBqzZSAALCUeXknzecZFAMRqNZYosm321UorUZeYZJSx4s26',
   'Afiliado', 'Activo', '2026-06-01 08:00:00'),

  -- ── Afiliados nuevos (registro web) ───────────────────────────
  (200, 'Diana', 'Peña',   'diana@gmail.com',
   '$2a$12$VyQI5vdVoepQqwPySKKGXO9I4X89GceDV/Q9RBx2Xds1waAlvgGxy',
   'Afiliado', 'Activo', '2026-08-01 08:00:00'),
  (201, 'Miguel', 'Rojas', 'miguel@gmail.com',
   '$2a$12$VyQI5vdVoepQqwPySKKGXO9I4X89GceDV/Q9RBx2Xds1waAlvgGxy',
   'Afiliado', 'Activo', '2026-08-05 08:00:00'),
  (202, 'Camila', 'Vargas','camila@gmail.com',
   '$2a$12$VyQI5vdVoepQqwPySKKGXO9I4X89GceDV/Q9RBx2Xds1waAlvgGxy',
   'Afiliado', 'Activo', '2026-08-10 08:00:00');


-- ============================================================================================================================
-- BLOQUE 2 — CATALOGO DE RESTRICCIONES MEDICAS
-- ============================================================================================================================

INSERT IGNORE INTO `RESTRICCION`
  (id_restriccion, nombre_restriccion, tipo, efecto_relevante)
VALUES
  (1, 'Diabetes tipo 2',        'Enfermedad',   'Evitar ejercicio de alta intensidad sin supervision'),
  (2, 'Hipertension arterial',  'Enfermedad',   'Controlar frecuencia cardiaca durante el ejercicio'),
  (3, 'Lesion rodilla derecha', 'Lesion',        NULL),
  (4, 'Alergia al gluten',      'Alergia',       NULL),
  (5, 'Intolerancia a lactosa', 'Alergia',       NULL),
  (6, 'Metformina',             'Medicamento',   'Puede causar hipoglucemia en ejercicio intenso');


-- ============================================================================================================================
-- BLOQUE 3 — CATALOGO DE EJERCICIOS (19 + 6 nuevos = 25)
-- ============================================================================================================================

INSERT IGNORE INTO `EJERCICIO`
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
   (9, 'Zancadas',              'Piernas',  NULL, 'Intermedio'),
  (10, 'Plancha',               'Core',     NULL, 'Principiante'),
  (11, 'Remo con barra',        'Espalda',  NULL, 'Intermedio'),
  (12, 'Press inclinado',       'Pecho',    NULL, 'Intermedio'),
  (13, 'Sentadilla bulgara',    'Piernas',  NULL, 'Avanzado'),
  (14, 'Elevaciones laterales', 'Hombros',  NULL, 'Principiante'),
  (15, 'Curl martillo',         'Biceps',   NULL, 'Intermedio'),
  (16, 'Fondos en paralelas',   'Triceps',  NULL, 'Avanzado'),
  (17, 'Peso muerto rumano',    'Gluteos',  NULL, 'Intermedio'),
  (18, 'Abdominales',           'Core',     NULL, 'Principiante'),
  (19, 'Jalon al pecho',        'Espalda',  NULL, 'Principiante'),
  (20, 'Remo con mancuerna',    'Espalda',  NULL, 'Intermedio'),
  (21, 'Curl araña',            'Biceps',   NULL, 'Principiante'),
  (22, 'Patada de gluteo',      'Gluteos',  NULL, 'Principiante'),
  (23, 'Crunch con polea',      'Core',     NULL, 'Intermedio'),
  (24, 'Fondos en banco',       'Triceps',  NULL, 'Principiante'),
  (25, 'Sentadilla goblet',     'Piernas',  NULL, 'Principiante');


-- ── Instrucciones de ejecución (HU43 CA3) ─────────────────────
-- Solo los ejercicios de las rutinas 22-24 (Sofía, ciclo activo) para demostrar la HU.

UPDATE `EJERCICIO` SET `descripcion` =
  'Colócate con los pies al ancho de los hombros y la espalda neutra. Baja flexionando rodillas y cadera como si fueras a sentarte, manteniendo el pecho arriba. Empuja con todo el pie para volver a la posición inicial.'
  WHERE `id_ejercicio` = 1;

UPDATE `EJERCICIO` SET `descripcion` =
  'Acuéstate en el banco con los pies firmes en el suelo. Baja la barra hasta el pecho con control y empújala hacia arriba hasta extender los brazos, sin bloquear los codos.'
  WHERE `id_ejercicio` = 2;

UPDATE `EJERCICIO` SET `descripcion` =
  'De pie o sentado, toma la barra a la altura de los hombros. Empuja hacia arriba hasta extender los brazos y baja con control hasta los hombros.'
  WHERE `id_ejercicio` = 4;

UPDATE `EJERCICIO` SET `descripcion` =
  'De pie, con los codos pegados al torso, flexiona los codos levantando las mancuernas hacia los hombros. Baja con control sin balancear el torso.'
  WHERE `id_ejercicio` = 5;

UPDATE `EJERCICIO` SET `descripcion` =
  'De pie o sentado, extiende los codos llevando las mancuernas o polea hacia abajo hasta bloquear los brazos. Vuelve a la posición inicial con control.'
  WHERE `id_ejercicio` = 6;

UPDATE `EJERCICIO` SET `descripcion` =
  'Recuéstate boca arriba con la espalda apoyada en el banco y la barra o disco sobre la cadera. Empuja con la cadera hacia arriba apretando los glúteos y baja con control.'
  WHERE `id_ejercicio` = 7;

UPDATE `EJERCICIO` SET `descripcion` =
  'De pie, da un paso largo hacia adelante y baja hasta que ambas rodillas formen 90 grados. Empuja con el pie delantero para volver y alterna las piernas.'
  WHERE `id_ejercicio` = 9;


-- ============================================================================================================================
-- BLOQUE 4 — CATALOGO DE ALIMENTOS (macros por 100g; 20 + 6 nuevos = 26)
-- Calorias NO se almacenan -> VIEW v_alimento_calorias (Atwater).
-- ============================================================================================================================

INSERT IGNORE INTO `ALIMENTO`
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
   (10, 'Quinoa',              14.00, 64.00, 6.00),
   (11, 'Salmon',              20.00,  0.00,13.00),
   (12, 'Yogur griego',        10.00,  3.60, 5.00),
   (13, 'Espinacas',            2.90,  3.60, 0.40),
   (14, 'Papa',                 2.00, 17.00, 0.10),
   (15, 'Aguacate',             2.00,  9.00,15.00),
   (16, 'Lentejas',             9.00, 20.00, 0.40),
   (17, 'Pechuga de pavo',     22.00,  0.00, 1.00),
   (18, 'Queso cottage',       11.00,  3.40, 4.30),
   (19, 'Platano',              1.10, 23.00, 0.30),
   (20, 'Arroz integral',       2.60, 23.00, 0.90),
   (21, 'Tilapia',             20.00,  0.00, 1.00),
   (22, 'Chia',                16.50, 42.10,30.70),
   (23, 'Garbanzos',            8.90, 27.40, 2.60),
   (24, 'Pimiento',             0.99,  6.00, 0.30),
   (25, 'Mango',                0.80, 15.00, 0.40),
   (26, 'Hummus',               7.90, 14.30, 9.60);


-- ============================================================================================================================
-- BLOQUE 5 — PIVOTS DE RESTRICCIONES EXCLUIDAS (por ejercicio / alimento)
-- ============================================================================================================================

INSERT IGNORE INTO `EJERCICIO_RESTRICCION_EXCLUIDA`
  (id_ejercicio, id_restriccion)
VALUES
  (1, 3),   -- Sentadilla       excluida por Lesion rodilla derecha
  (3, 1),   -- Peso muerto      excluido por Diabetes tipo 2
  (3, 2),   -- Peso muerto      excluido por Hipertension arterial
  (4, 2),   -- Press militar    excluido por Hipertension arterial
  (7, 3),   -- Hip thrust       excluido por Lesion rodilla derecha
  (8, 1),   -- Dominadas        excluidas por Diabetes tipo 2
  (9, 3);   -- Zancadas         excluidas por Lesion rodilla derecha

INSERT IGNORE INTO `ALIMENTO_RESTRICCION_EXCLUIDA`
  (id_alimento, id_restriccion)
VALUES
  (2, 1),   -- Arroz blanco       excluido por Diabetes tipo 2
  (4, 4),   -- Avena              excluida por Alergia al gluten
  (7, 1),   -- Batata             excluida por Diabetes tipo 2
  (9, 5);   -- Leche deslactosada excluida por Intolerancia a lactosa


-- ============================================================================================================================
-- BLOQUE 6 — AFILIADO (sub-tipo de USUARIO)
-- NOTA: las 3 columnas nuevas (objetivo_fisico, nivel_experiencia, disponibilidad_semanal_dias)
-- vienen de 03_mejoras_estructura.sql; guardan el valor del formulario de registro (CICLO = fuente por ciclo).
-- ============================================================================================================================

INSERT IGNORE INTO `AFILIADO`
  (id_usuario, documento, fecha_nacimiento, sexo, telefono, direccion,
   estatura_cm, estado_afiliacion, fecha_registro, fecha_ultima_modificacion, registrado_por,
   objetivo_fisico, nivel_experiencia, disponibilidad_semanal_dias)
VALUES
  -- Juan Martínez | registrado_por: María (id=4)
  (6,  1001234567, '1990-03-15', 'Masculino', '3001234567', 'Bogotá, Calle 10 # 5-20',
   175.50, 'Activo', '2024-01-08', '2026-04-08 21:42:04', 4,
   'Perdida de grasa', 'Intermedio', 3),

  -- Ana Rodríguez | registrado_por: María (id=4)
  (7,  1002345678, '1995-07-22', 'Femenino',  '3012345678', 'Bogotá, Carrera 15 # 8-30',
   162.00, 'Activo', '2024-02-01', '2026-04-08 21:42:15', 4,
   'Aumento de masa',  'Intermedio', 5),

  -- Luis Herrera | registrado_por: Pedro (id=5)
  (8,  1003456789, '1988-11-05', 'Masculino', '3023456789', 'Bogotá, Av 20 # 3-10',
   180.00, 'Activo', '2024-01-15', NULL, 5,
   'Mantenimiento',    'Avanzado', 6),

  -- Sofía Castro | registrado_por: Pedro (id=5)
  (9,  1004567890, '2000-01-30', 'Femenino',  '3034567890', 'Bogotá, Calle 25 # 12-5',
   158.50, 'Activo', '2024-04-01', NULL, 5,
   'Perdida de grasa', 'Principiante', 4),

  -- Carlos Demo | registrado_por: María (id=4) | origen 03_datos_demo
  (100, 999888777, '1992-08-15', 'Masculino', '3009998887',
   'Carrera 7 # 72-41, Bogotá', 170.00, 'Activo', '2026-06-01', NULL, 4,
   'Perdida de grasa', 'Intermedio', 4),

  -- Diana Peña / Miguel Rojas / Camila Vargas | registrado_por: María (id=4)
  (200, 1002003001, '1994-04-12', 'Femenino',  '3012345001', 'Bogotá, Calle 30 # 8-15',
   165.00, 'Activo', '2026-08-01', NULL, 4,
   'Perdida de grasa', 'Principiante', 3),
  (201, 1002003002, '1991-09-18', 'Masculino', '3012345002', 'Bogotá, Carrera 50 # 12-3',
   178.00, 'Activo', '2026-08-05', NULL, 4,
   'Aumento de masa',  'Intermedio', 4),
  (202, 1002003003, '1987-02-25', 'Masculino', '3012345003', 'Bogotá, Av Boyacá # 98-5',
   183.00, 'Activo', '2026-08-10', NULL, 4,
   'Mantenimiento',    'Avanzado', 2);


-- ============================================================================================================================
-- BLOQUE 7 — PIVOT: AFILIADO_RESTRICCION
-- ============================================================================================================================

INSERT IGNORE INTO `AFILIADO_RESTRICCION`
  (id_usuario, id_restriccion)
VALUES
  (6, 2),   -- Juan : Hipertension arterial
  (7, 5),   -- Ana  : Intolerancia a lactosa
  (8, 1),   -- Luis : Diabetes tipo 2
  (8, 6);   -- Luis : Metformina
  -- Sofía : sin restricciones registradas

-- Restricciones del afiliado demo (busca por nombre, como en el original)
INSERT IGNORE INTO `AFILIADO_RESTRICCION`
  (id_usuario, id_restriccion)
SELECT 100, id_restriccion FROM `RESTRICCION`
WHERE nombre_restriccion IN ('Hipertension arterial', 'Intolerancia a lactosa');


-- ============================================================================================================================
-- BLOQUE 8 — CICLOS (historia 2024 + demo + nuevos)
-- objetivo_fisico: mapeo NoSQL -> ENUM sin tildes. registrado_por: Entrenador Laura (id=2)/Andrés (id=3).
-- ============================================================================================================================

INSERT IGNORE INTO `CICLO`
  (id_ciclo, id_usuario, fecha_inicio, fecha_fin, activo,
   objetivo_fisico, grupo_muscular_prioritario, nivel_experiencia, disponibilidad_dias,
   observaciones, fecha_creacion, registrado_por)
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
   'Perdida de grasa', NULL,      'Principiante', 4, NULL, '2024-07-01 08:00:00', 2),

  -- ── Carlos Demo (id_usuario=100) | origen 03_datos_demo ────
  (100, 100, '2026-06-01', '2026-08-31', 1,
   'Perdida de grasa', 'Pecho', 'Intermedio',
   4, 'Ciclo de prueba generado por datos demo', NOW(), 2),

  -- ── Afiliados nuevos ───────────────────────────────────────
  (200, 200, '2026-08-01', '2026-10-31', 1,
   'Perdida de grasa', 'Pecho',   'Principiante', 3, NULL, '2026-08-01 08:00:00', 2),
  (201, 201, '2026-08-05', '2026-11-05', 1,
   'Aumento de masa',  'Gluteos', 'Intermedio',   4, 'Enfoque en tren inferior', '2026-08-05 08:00:00', 2),
  (202, 202, '2026-08-10', '2026-10-10', 1,
   'Mantenimiento',    'Espalda', 'Avanzado',     2, 'Mantenimiento 2 dias/semana', '2026-08-10 08:00:00', 2);


-- ============================================================================================================================
-- BLOQUE 9 — PLANES DE ENTRENAMIENTO (1:1 con CICLO via PK=FK)
-- ============================================================================================================================

INSERT IGNORE INTO `PLAN_ENTRENAMIENTO`
  (id_ciclo, modificado_por, observaciones)
VALUES
  (1,   NULL, NULL),                  -- Juan Ciclo 1
  (2,   NULL, NULL),                  -- Juan Ciclo 2
  (3,   NULL, NULL),                  -- Ana  Ciclo 1
  (4,   NULL, NULL),                  -- Ana  Ciclo 2
  (5,   NULL, NULL),                  -- Luis Ciclo 1
  (6,   NULL, NULL),                  -- Luis Ciclo 2
  (7,   NULL, NULL),                  -- Sofía Ciclo 1
  (8,   NULL, NULL),                  -- Sofía Ciclo 2
  (100, 2, 'Plan demo — 3 días/semana'),     -- Carlos Demo
  (200, 2, 'Plan 3 dias/semana'),            -- Diana
  (201, 2, 'Plan 4 dias/semana'),            -- Miguel
  (202, 2, 'Plan 2 dias/semana');            -- Camila


-- ============================================================================================================================
-- BLOQUE 10 — RUTINAS (historia 2024 1-24 + demo 100-102 + nuevos 200-205)
-- dia_semana fue derivado de dia_numero (eliminado, 3FN). enfoque_muscular sin tildes.
-- ============================================================================================================================

INSERT IGNORE INTO `RUTINA`
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
  (24, 8, 'Día 3 — Piernas y Core',     'Piernas', 5),

  -- ── Carlos Demo (id_ciclo=100) | origen 03_datos_demo ─────
  (100, 100, 'Día 1 — Pecho y Tríceps',  'Pecho',   1),
  (101, 100, 'Día 2 — Espalda y Bíceps', 'Espalda', 3),
  (102, 100, 'Día 3 — Piernas y Core',   'Piernas', 5),

  -- ── Afiliados nuevos ───────────────────────────────────────
  (200, 200, 'Día 1 — Pecho y Tríceps',  'Pecho',   1),
  (201, 200, 'Día 2 — Espalda y Bíceps', 'Espalda', 3),
  (202, 201, 'Día 1 — Piernas y Glúteos','Piernas', 1),
  (203, 201, 'Día 2 — Pecho y Tríceps',  'Pecho',   3),
  (204, 202, 'Día 1 — Espalda y Core',   'Espalda', 2),
  (205, 202, 'Día 2 — Piernas',          'Piernas', 4);


-- ============================================================================================================================
-- BLOQUE 11 — RUTINA_EJERCICIO (PK compuesta id_rutina, orden)
-- ============================================================================================================================

INSERT IGNORE INTO `RUTINA_EJERCICIO`
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

-- Rutinas del afiliado demo (busca por nombre del ejercicio)
INSERT IGNORE INTO `RUTINA_EJERCICIO`
  (id_rutina, orden, id_ejercicio, series, repeticiones)
SELECT 100, 1, id_ejercicio, 4, 12 FROM `EJERCICIO` WHERE nombre_ejercicio = 'Press de banca'
UNION ALL SELECT 100, 2, id_ejercicio, 3, 15 FROM `EJERCICIO` WHERE nombre_ejercicio = 'Extension de triceps'
UNION ALL SELECT 101, 1, id_ejercicio, 4, 10 FROM `EJERCICIO` WHERE nombre_ejercicio = 'Peso muerto'
UNION ALL SELECT 101, 2, id_ejercicio, 3, 12 FROM `EJERCICIO` WHERE nombre_ejercicio = 'Curl de biceps'
UNION ALL SELECT 102, 1, id_ejercicio, 4, 15 FROM `EJERCICIO` WHERE nombre_ejercicio = 'Sentadilla'
UNION ALL SELECT 102, 2, id_ejercicio, 3, 12 FROM `EJERCICIO` WHERE nombre_ejercicio = 'Hip thrust'
UNION ALL SELECT 102, 3, id_ejercicio, 3, 15 FROM `EJERCICIO` WHERE nombre_ejercicio = 'Zancadas';

-- Rutinas de los afiliados nuevos (con peso/descanso predefinidos)
INSERT IGNORE INTO `RUTINA_EJERCICIO`
  (id_rutina, orden, id_ejercicio, series, repeticiones, peso_kg, descanso_seg)
VALUES
  -- Diana (ciclo 200)
  (200, 1, 2,  4, 12, 30.00, 90),    -- Press de banca
  (200, 2, 6,  3, 15, 15.00, 60),    -- Extension de triceps
  (200, 3, 24, 3, 10, NULL, 60),     -- Fondos en banco
  (201, 1, 20, 4, 10, NULL, 90),     -- Remo con mancuerna
  (201, 2, 5,  3, 12, NULL, 60),     -- Curl de biceps
  (201, 3, 21, 3, 12, NULL, 60),     -- Curl araña
  -- Miguel (ciclo 201)
  (202, 1, 1,  4, 12, 40.00, 90),    -- Sentadilla
  (202, 2, 7,  4, 10, 60.00, 120),   -- Hip thrust
  (202, 3, 22, 3, 15, NULL, 60),     -- Patada de gluteo
  (203, 1, 2,  4, 12, 30.00, 90),    -- Press de banca
  (203, 2, 6,  3, 12, 15.00, 60),    -- Extension de triceps
  (203, 3, 21, 3, 10, 10.00, 60),    -- Curl araña
  -- Camila (ciclo 202)
  (204, 1, 8,  3,  8, NULL, 120),    -- Dominadas
  (204, 2, 3,  3,  8, 50.00, 120),   -- Peso muerto
  (204, 3, 23, 4, 15, NULL, 60),     -- Crunch con polea
  (205, 1, 1,  4, 15, 60.00, 90),    -- Sentadilla
  (205, 2, 7,  3, 12, 80.00, 120);   -- Hip thrust


-- ── Peso y descanso por ejercicio en la rutina de Sofía (ciclo activo, id_ciclo=8) ──
UPDATE `RUTINA_EJERCICIO` SET `peso_kg` = 20.00, `descanso_seg` =  90 WHERE `id_rutina` = 22 AND `orden` = 1;  -- Press de banca
UPDATE `RUTINA_EJERCICIO` SET `peso_kg` = 25.00, `descanso_seg` =  90 WHERE `id_rutina` = 22 AND `orden` = 2;  -- Sentadilla
UPDATE `RUTINA_EJERCICIO` SET `peso_kg` =  8.00, `descanso_seg` =  60 WHERE `id_rutina` = 22 AND `orden` = 3;  -- Curl de biceps
UPDATE `RUTINA_EJERCICIO` SET `peso_kg` = 12.00, `descanso_seg` =  60 WHERE `id_rutina` = 23 AND `orden` = 1;  -- Extension de triceps
UPDATE `RUTINA_EJERCICIO` SET `peso_kg` = 20.00, `descanso_seg` =  90 WHERE `id_rutina` = 23 AND `orden` = 2;  -- Zancadas
UPDATE `RUTINA_EJERCICIO` SET `peso_kg` = 15.00, `descanso_seg` =  90 WHERE `id_rutina` = 23 AND `orden` = 3;  -- Press militar
UPDATE `RUTINA_EJERCICIO` SET `peso_kg` = 25.00, `descanso_seg` =  90 WHERE `id_rutina` = 24 AND `orden` = 1;  -- Sentadilla
UPDATE `RUTINA_EJERCICIO` SET `peso_kg` = 30.00, `descanso_seg` = 120 WHERE `id_rutina` = 24 AND `orden` = 2;  -- Hip thrust
UPDATE `RUTINA_EJERCICIO` SET `peso_kg` = 12.00, `descanso_seg` =  60 WHERE `id_rutina` = 24 AND `orden` = 3;  -- Extension de triceps


-- ============================================================================================================================
-- BLOQUE 12 — PLANES NUTRICIONALES (1:1 con CICLO)
-- ============================================================================================================================

INSERT IGNORE INTO `PLAN_NUTRICIONAL`
  (id_ciclo, calorias_objetivo, num_comidas, modificado_por, observaciones)
VALUES
  (1,   1556.48, 3, NULL, NULL),        -- Juan  Ciclo 1
  (2,   1899.56, 4, NULL, NULL),        -- Juan  Ciclo 2
  (3,   2884.09, 4, NULL, NULL),        -- Ana   Ciclo 1
  (4,   3012.07, 4, NULL, NULL),        -- Ana   Ciclo 2
  (5,   2383.66, 3, NULL, NULL),        -- Luis  Ciclo 1
  (6,   2050.11, 3, NULL, NULL),        -- Luis  Ciclo 2
  (7,   1800.00, 4, NULL, NULL),        -- Sofía Ciclo 1
  (8,   1750.00, 4, NULL, NULL),        -- Sofía Ciclo 2
  (100, 2200.00, 4, 2, 'Plan nutricional demo — déficit calórico moderado'),  -- Carlos Demo
  (200, 2250.00, 4, 2, 'Deficit calórico moderado'),                          -- Diana
  (201, 2700.00, 5, 2, 'Superavit para aumento de masa'),                     -- Miguel
  (202, 2000.00, 3, 2, 'Mantenimiento');                                      -- Camila


-- ============================================================================================================================
-- BLOQUE 13 — DETALLE_NUTRICIONAL (PK natural triple id_ciclo, num_comida, id_alimento)
-- ============================================================================================================================

INSERT IGNORE INTO `DETALLE_NUTRICIONAL`
  (id_ciclo, num_comida, id_alimento, cantidad_g)
VALUES
  -- ── Juan Ciclo 1 (id_ciclo=1) | 3 comidas ────────────────
  (1, 1, 10,  83.00),   -- Quinoa
  (1, 1,  3, 213.00),   -- Huevo entero
  (1, 1,  4, 168.00),   -- Avena
  (1, 2,  4,  86.00),   -- Avena
  (1, 2, 10, 150.00),   -- Quinoa
  (1, 3,  3, 205.00),   -- Huevo entero
  -- ── Juan Ciclo 2 (id_ciclo=2) | 4 comidas ────────────────
  (2, 1,  4,  99.00),   -- Avena
  (2, 2,  5, 171.00),   -- Brocoli
  (2, 3, 10, 192.00),   -- Quinoa
  (2, 3,  4, 211.00),   -- Avena
  (2, 3,  3, 219.00),   -- Huevo entero
  (2, 4,  1, 177.00),   -- Pechuga de pollo
  (2, 4,  5,  94.00),   -- Brocoli
  (2, 4, 10,  98.00),   -- Quinoa
  -- ── Ana Ciclo 1 (id_ciclo=3) | 4 comidas ─────────────────
  (3, 1,  6, 160.00),   -- Atun en agua
  (3, 1,  3, 114.00),   -- Huevo entero
  (3, 1,  8, 195.00),   -- Almendras
  (3, 2, 10, 243.00),   -- Quinoa
  (3, 3,  6, 143.00),   -- Atun en agua
  (3, 3,  2,  52.00),   -- Arroz blanco
  (3, 4,  1, 176.00),   -- Pechuga de pollo
  (3, 4,  2, 145.00),   -- Arroz blanco
  (3, 4,  6, 237.00),   -- Atun en agua
  -- ── Ana Ciclo 2 (id_ciclo=4) | 4 comidas ─────────────────
  (4, 1,  1, 100.00),   -- Pechuga de pollo
  (4, 1,  6, 167.00),   -- Atun en agua
  (4, 2, 10, 205.00),   -- Quinoa
  (4, 2,  6,  88.00),   -- Atun en agua
  (4, 3,  5, 235.00),   -- Brocoli
  (4, 3,  8, 134.00),   -- Almendras
  (4, 3,  4, 204.00),   -- Avena
  (4, 4,  3, 219.00),   -- Huevo entero
  -- ── Luis Ciclo 1 (id_ciclo=5) | 3 comidas ────────────────
  (5, 1,  6,  85.00),   -- Atun en agua
  (5, 1,  3, 238.00),   -- Huevo entero
  (5, 1,  9,  76.00),   -- Leche deslactosada
  (5, 2,  3,  58.00),   -- Huevo entero
  (5, 2,  6,  57.00),   -- Atun en agua
  (5, 2,  5,  73.00),   -- Brocoli
  (5, 3,  5, 179.00),   -- Brocoli
  -- ── Luis Ciclo 2 (id_ciclo=6) | 3 comidas ────────────────
  (6, 1,  4, 250.00),   -- Avena
  (6, 1,  5, 240.00),   -- Brocoli
  (6, 1,  9, 162.00),   -- Leche deslactosada
  (6, 2, 10, 115.00),   -- Quinoa
  (6, 2,  9, 112.00),   -- Leche deslactosada
  (6, 3,  8, 175.00),   -- Almendras
  -- ── Sofía Ciclo 1 (id_ciclo=7) | 4 comidas ───────────────
  (7, 1,  1, 150.00),   -- Pechuga de pollo
  (7, 1,  5, 120.00),   -- Brocoli
  (7, 2,  4,  80.00),   -- Avena
  (7, 2,  3, 100.00),   -- Huevo entero
  (7, 3,  6, 120.00),   -- Atun en agua
  (7, 3, 10,  90.00),   -- Quinoa
  (7, 4,  5, 200.00),   -- Brocoli
  (7, 4,  1, 100.00),   -- Pechuga de pollo
  -- ── Sofía Ciclo 2 (id_ciclo=8) | 4 comidas ───────────────
  (8, 1,  3, 150.00),   -- Huevo entero
  (8, 1,  4,  60.00),   -- Avena
  (8, 2,  1, 160.00),   -- Pechuga de pollo
  (8, 2,  5, 150.00),   -- Brocoli
  (8, 3, 10, 100.00),   -- Quinoa
  (8, 3,  6,  80.00),   -- Atun en agua
  (8, 4,  8,  30.00),   -- Almendras
  (8, 4,  3, 100.00),   -- Huevo entero
  -- ── Carlos Demo (id_ciclo=100) | 4 comidas ────────────────
  (100, 1, 3, 150.00),  -- Huevo entero
  (100, 1, 4,  80.00),  -- Avena
  (100, 2, 1, 200.00),  -- Pechuga de pollo
  (100, 2, 2, 120.00),  -- Arroz blanco
  (100, 3, 6, 120.00),  -- Atun en agua
  (100, 3, 10,100.00),  -- Quinoa
  (100, 4, 8,  40.00),  -- Almendras
  (100, 4, 5, 200.00),  -- Brocoli
  -- ── Diana (id_ciclo=200) | 4 comidas ──────────────────────
  (200, 1, 3,  120.00), -- Huevo entero
  (200, 1, 4,   60.00), -- Avena
  (200, 2, 1,  180.00), -- Pechuga de pollo
  (200, 2, 2,  150.00), -- Arroz blanco
  (200, 3, 6,  140.00), -- Atun en agua
  (200, 3, 10, 120.00), -- Quinoa
  (200, 4, 8,   30.00), -- Almendras
  -- ── Miguel (id_ciclo=201) | 5 comidas ─────────────────────
  (201, 1, 4,   80.00), -- Avena
  (201, 2, 1,  200.00), -- Pechuga de pollo
  (201, 2, 2,  160.00), -- Arroz blanco
  (201, 3, 6,  150.00), -- Atun en agua
  (201, 4, 8,   40.00), -- Almendras
  (201, 5, 11, 150.00), -- Salmon
  -- ── Camila (id_ciclo=202) | 3 comidas ─────────────────────
  (202, 1, 3,  120.00), -- Huevo entero
  (202, 2, 1,  170.00), -- Pechuga de pollo
  (202, 2, 16, 150.00), -- Lentejas
  (202, 3, 13, 100.00); -- Espinacas


-- ============================================================================================================================
-- BLOQUE 14 — PROGRESO_FISICO (PK compuesta id_ciclo, fecha_registro)
-- IMC NO se almacena (se calcula en backend/VIEW). Fechas de la historia 2024.
-- ============================================================================================================================

INSERT IGNORE INTO `PROGRESO_FISICO`
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
  -- ── Sofía Ciclo 2 (id_ciclo=8) + fechas posteriores (Fase 0) ──
  (8, '2024-07-01', 60.10, 24.50, 75.20, 27.40, 53.50,
   'Buen inicio de segundo ciclo',                2),
  (8, '2024-07-16', 59.80, 24.10, 74.50, 27.20, 53.00,
   'Progreso estable',                            2),
  (8, '2024-08-01', 59.20, 23.70, 73.90, 27.00, 52.60,
   'Buena adherencia',                            2);


-- ============================================================================================================================
-- BLOQUE 15 — PAGOS (panel de finanzas) y CONFIGURACION
-- ============================================================================================================================

INSERT IGNORE INTO `PAGO` (id_usuario, fecha_pago, valor_pagado, estado, fecha_vencimiento, observaciones, registrado_por)
VALUES
  -- Juan Martínez (id=6)
  (6, '2025-06-10', 80000.00, 'Pagado', '2025-07-10', 'Pago mensual junio',       4),
  (6, '2025-07-10', 80000.00, 'Pagado', '2025-08-10', 'Pago mensual julio',       4),
  (6, '2025-08-10', 80000.00, 'Pagado', '2025-09-10', 'Pago mensual agosto',      4),
  (6, '2025-09-10', 80000.00, 'Pagado', '2025-10-10', 'Pago mensual septiembre',  1),
  (6, '2025-10-10', 80000.00, 'Pagado', '2025-11-10', 'Pago mensual octubre',     4),
  (6, '2025-11-10', 80000.00, 'Pagado', '2025-12-10', 'Pago mensual noviembre',   4),
  (6, '2025-12-10', 80000.00, 'Pagado', '2026-01-10', 'Pago mensual diciembre',   4),
  (6, '2026-01-10', 80000.00, 'Pagado', '2026-02-10', 'Pago mensual enero',       4),
  (6, '2026-02-10', 80000.00, 'Pagado', '2026-03-10', 'Pago mensual febrero',     4),
  (6, '2026-03-10', 80000.00, 'Pagado', '2026-04-10', 'Pago mensual marzo',       4),
  (6, '2026-04-10', 80000.00, 'Pagado', '2026-05-10', 'Pago mensual abril',       4),
  (6, '2026-05-10', 80000.00, 'Pagado', '2026-06-10', 'Pago mensual mayo',        4),
  -- Ana Rodríguez (id=7)
  (7, '2025-07-05', 80000.00, 'Pagado', '2025-08-05', 'Pago mensual julio',       4),
  (7, '2025-08-05', 80000.00, 'Pagado', '2025-09-05', 'Pago mensual agosto',      4),
  (7, '2025-09-05', 80000.00, 'Pagado', '2025-10-05', 'Pago mensual septiembre',  4),
  (7, '2025-10-05', 80000.00, 'Pagado', '2025-11-05', 'Pago mensual octubre',     1),
  (7, '2025-11-05', 80000.00, 'Pagado', '2025-12-05', 'Pago mensual noviembre',   4),
  (7, '2025-12-05', 80000.00, 'Pagado', '2026-01-05', 'Pago mensual diciembre',   4),
  (7, '2026-01-05', 80000.00, 'Pagado', '2026-02-05', 'Pago mensual enero',       4),
  (7, '2026-02-05', 80000.00, 'Pagado', '2026-03-05', 'Pago mensual febrero',     4),
  (7, '2026-03-05', 80000.00, 'Pagado', '2026-04-05', 'Pago mensual marzo',       4),
  (7, '2026-04-05', 80000.00, 'Pagado', '2026-05-05', 'Pago mensual abril',       4),
  (7, '2026-05-05', 80000.00, 'Pagado', '2026-06-05', 'Pago mensual mayo',        4),
  -- Luis Herrera (id=8)
  (8, '2025-08-15', 80000.00, 'Pagado',  '2025-09-15', 'Pago mensual agosto',      4),
  (8, '2025-09-15', 80000.00, 'Pagado',  '2025-10-15', 'Pago mensual septiembre',  4),
  (8, '2025-10-15', 80000.00, 'Pagado',  '2025-11-15', 'Pago mensual octubre',     4),
  (8, '2025-11-15', 80000.00, 'Pagado',  '2025-12-15', 'Pago mensual noviembre',   4),
  (8, '2025-12-15', 80000.00, 'Vencido', '2026-01-15', 'Se venció, no pagó diciembre a tiempo', 4),
  (8, '2026-01-20', 80000.00, 'Pagado',  '2026-02-20', 'Pago atrasado de enero',   1),
  (8, '2026-02-15', 80000.00, 'Pagado',  '2026-03-15', 'Pago mensual febrero',     4),
  (8, '2026-03-15', 80000.00, 'Pagado',  '2026-04-15', 'Pago mensual marzo',       4),
  (8, '2026-04-15', 80000.00, 'Pagado',  '2026-05-15', 'Pago mensual abril',       4),
  (8, '2026-05-15', 80000.00, 'Pagado',  '2026-06-15', 'Pago mensual mayo',        4),
  -- Sofía Castro (id=9)
  (9, '2025-09-01', 80000.00, 'Pagado',  '2025-10-01', 'Pago mensual septiembre',  4),
  (9, '2025-10-01', 80000.00, 'Pagado',  '2025-11-01', 'Pago mensual octubre',     4),
  (9, '2025-11-01', 80000.00, 'Pagado',  '2025-12-01', 'Pago mensual noviembre',   4),
  (9, '2025-12-01', 80000.00, 'Pagado',  '2026-01-01', 'Pago mensual diciembre',   4),
  (9, '2026-01-01', 80000.00, 'Pagado',  '2026-02-01', 'Pago mensual enero',       4),
  (9, '2026-02-01', 80000.00, 'Pagado',  '2026-03-01', 'Pago mensual febrero',     4),
  (9, '2026-03-01', 80000.00, 'Pagado',  '2026-04-01', 'Pago mensual marzo',       4),
  (9, '2026-04-01', 80000.00, 'Pagado',  '2026-05-01', 'Pago mensual abril',       4),
  (9, '2026-05-01', 80000.00, 'Pagado',  '2026-06-01', 'Pago mensual mayo',        4);

INSERT IGNORE INTO `CONFIGURACION` (`clave`, `valor`)
VALUES ('precio_membresia', '80000');


-- ============================================================================================================================
-- BLOQUE 16 — DATOS DIARIOS MOVILES (tablas de 02_migracion_movil.sql)
-- Sofía (usuario 9, ciclo 8). Fechas RELATIVAS a CURDATE(): "hoy / esta semana" siempre con datos.
-- ============================================================================================================================

-- Progreso de ejercicios del dia (ejercicios de las rutinas 22, 23 y 24, ultimos 5 dias)
INSERT IGNORE INTO `PROGRESO_EJERCICIO_DIARIO`
  (id_usuario, id_ciclo, id_ejercicio, fecha, completado)
SELECT 9, 8, re.id_ejercicio, CURDATE() - INTERVAL d.offset_day DAY, 1
FROM `RUTINA_EJERCICIO` re
JOIN (SELECT 22 AS id_rutina UNION ALL SELECT 23 UNION ALL SELECT 24) rr
  ON rr.id_rutina = re.id_rutina
CROSS JOIN (SELECT 0 AS offset_day UNION ALL SELECT 1 UNION ALL SELECT 2
                 UNION ALL SELECT 3 UNION ALL SELECT 4) d;

-- Agua diaria (unidad real de la app: vasos)
INSERT IGNORE INTO `REGISTRO_AGUA`
  (id_usuario, fecha, vasos)
SELECT 9, CURDATE() - INTERVAL d.offset_day DAY, d.vasos
FROM (SELECT 0 AS offset_day, 7 AS vasos UNION ALL SELECT 1, 8 UNION ALL SELECT 2, 6
           UNION ALL SELECT 3, 8 UNION ALL SELECT 4, 5) d;

-- Consumo de alimentos marcado como "consumido" (espejo del plan del ciclo 8)
INSERT IGNORE INTO `CONSUMO_ALIMENTO_DIARIO`
  (id_usuario, id_ciclo, id_alimento, num_comida, fecha, consumido)
SELECT 9, 8, det.id_alimento, det.num_comida, CURDATE() - INTERVAL d.offset_day DAY, 1
FROM `DETALLE_NUTRICIONAL` det
CROSS JOIN (SELECT 0 AS offset_day UNION ALL SELECT 1 UNION ALL SELECT 2) d
WHERE det.id_ciclo = 8;


-- ============================================================================================================================
-- BLOQUE 17 — DATOS DE LA FASE 0 (tablas de 03_mejoras_estructura.sql)
-- ============================================================================================================================

-- Registro REAL de ejecucion (series/reps/peso) en las rutinas 22, 23 y 24 de Sofía.
-- Los pesos coinciden con los configurados arriba para esas rutinas.
INSERT IGNORE INTO `REGISTRO_EJERCICIO`
  (id_usuario, id_ciclo, id_rutina, orden, fecha, series, repeticiones, peso_utilizado_kg, notas)
VALUES
  (9, 8, 22, 1, CURDATE() - INTERVAL 4 DAY, 3, 12, 20.00, NULL),
  (9, 8, 24, 1, CURDATE() - INTERVAL 3 DAY, 4, 12, 25.00, NULL),
  (9, 8, 24, 2, CURDATE() - INTERVAL 3 DAY, 3, 12, 30.00, NULL),
  (9, 8, 24, 3, CURDATE() - INTERVAL 3 DAY, 3, 15, 12.00, NULL),
  (9, 8, 22, 1, CURDATE() - INTERVAL 2 DAY, 3, 12, 20.00, 'RPE 8'),
  (9, 8, 22, 2, CURDATE() - INTERVAL 2 DAY, 3, 10, 25.00, NULL),
  (9, 8, 22, 3, CURDATE() - INTERVAL 2 DAY, 3, 12,  8.00, 'Buena ejecucion'),
  (9, 8, 23, 1, CURDATE() - INTERVAL 1 DAY, 3, 12, 12.00, NULL),
  (9, 8, 23, 2, CURDATE() - INTERVAL 1 DAY, 3, 10, 20.00, 'Peso controlado'),
  (9, 8, 23, 3, CURDATE() - INTERVAL 1 DAY, 3, 10, 15.00, NULL);

-- Consumo REAL derivado del detalle del plan (ciclo 8):
--   - simula que consumio el 90% de cada racion
--   - calorias_consumidas = Atwater ((P*4)+(C*4)+(G*9)) x g/100, misma formula de v_alimento_calorias
INSERT IGNORE INTO `CONSUMO_ALIMENTO_REAL`
  (id_usuario, id_ciclo, num_comida, id_alimento, fecha, cantidad_g_consumida, calorias_consumidas)
SELECT 9, 8, det.num_comida, det.id_alimento, CURDATE() - INTERVAL d.offset_day DAY,
       det.cantidad_g * 0.90,
       ROUND(((a.proteinas * 4) + (a.carbohidratos * 4) + (a.grasas * 9))
             * det.cantidad_g * 0.90 / 100, 2)
FROM `DETALLE_NUTRICIONAL` det
JOIN `ALIMENTO` a ON a.id_alimento = det.id_alimento
CROSS JOIN (SELECT 0 AS offset_day UNION ALL SELECT 1 UNION ALL SELECT 2) d
WHERE det.id_ciclo = 8;

-- Resumen diario (PROGRESO_DIARIO) coherente con los registros de arriba
INSERT IGNORE INTO `PROGRESO_DIARIO`
  (id_usuario, fecha, calorias_consumidas, agua_vasos, ejercicios_realizados,
   duracion_minutos, nivel_energia, estado_animo, observaciones)
VALUES
  (9, CURDATE() - INTERVAL 4 DAY, 1380.00, 5, 1, 20, 4, 'Bueno',     'Sesión de full body A'),
  (9, CURDATE() - INTERVAL 3 DAY, 1320.00, 8, 3, 50, 4, 'Bueno',     'Sesión de piernas y core'),
  (9, CURDATE() - INTERVAL 2 DAY, 1350.00, 7, 3, 45, 3, 'Normal',    'Sesión de full body A'),
  (9, CURDATE() - INTERVAL 1 DAY, 1280.00, 8, 3, 40, 5, 'Excelente', 'Sesión de full body B');


-- ============================================================================================================================
-- BLOQUE 18 — RESET AUTOMATICO DE AUTO_INCREMENT (max ID + 1 por tabla)
-- ============================================================================================================================

ALTER TABLE `USUARIO`   AUTO_INCREMENT = 203;
ALTER TABLE `EJERCICIO` AUTO_INCREMENT = 26;
ALTER TABLE `ALIMENTO`  AUTO_INCREMENT = 27;
ALTER TABLE `RESTRICCION` AUTO_INCREMENT = 7;
ALTER TABLE `CICLO`     AUTO_INCREMENT = 203;
ALTER TABLE `RUTINA`    AUTO_INCREMENT = 206;

SET FOREIGN_KEY_CHECKS = 1;

-- ============================================================================================================================
-- VERIFICACION RAPIDA (ejecutar manualmente)
-- ============================================================================================================================
-- SELECT COUNT(*) AS total_usuarios   FROM USUARIO;            -- 13 (1-9 staff+afiliados + 100 demo + 200-202)
-- SELECT COUNT(*) AS total_afiliados  FROM AFILIADO;           -- 8  (6-9, 100, 200-202)
-- SELECT COUNT(*) AS total_ciclos     FROM CICLO;              -- 12
-- SELECT COUNT(*) AS total_rutinas    FROM RUTINA;             -- 33 (1-24, 100-102, 200-205)
-- SELECT COUNT(*) AS total_ejerc_rut  FROM RUTINA_EJERCICIO;   -- 98 (74 historia + 7 demo + 17 nuevos)
-- SELECT COUNT(*) AS total_planes_nut FROM PLAN_NUTRICIONAL;   -- 12
-- SELECT COUNT(*) AS total_detalle    FROM DETALLE_NUTRICIONAL;-- 85 (60 historia + 8 demo + 17 nuevos)
-- SELECT COUNT(*) AS total_progreso   FROM PROGRESO_FISICO;    -- 16 (14 historia + 2 extra)
-- SELECT COUNT(*) AS total_ejerc_dia  FROM PROGRESO_EJERCICIO_DIARIO; -- 35 (7 unicos x 5 dias)
-- SELECT COUNT(*) AS total_agua       FROM REGISTRO_AGUA;      -- 5
-- SELECT COUNT(*) AS total_consumo    FROM CONSUMO_ALIMENTO_DIARIO;  -- 24 (8 alimentos x 3 dias)
-- SELECT COUNT(*) AS total_reg_ejerc  FROM REGISTRO_EJERCICIO; -- 10
-- SELECT COUNT(*) AS total_consumo_r  FROM CONSUMO_ALIMENTO_REAL;   -- 24 (8 alimentos x 3 dias)
-- SELECT COUNT(*) AS total_prog_dia   FROM PROGRESO_DIARIO;    -- 4
-- SELECT * FROM v_alimento_calorias;
-- SELECT * FROM v_perfil_afiliado;
-- SELECT * FROM v_ciclo_activo_afiliado;
-- SELECT * FROM v_ultimo_progreso;
-- ============================================================================================================================