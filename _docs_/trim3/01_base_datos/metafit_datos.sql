-- =====================================================================
-- MetaFit DB — Datos de Prueba
-- Compatible con: metafit_3fn.sql v8
-- Orden de inserción respeta todas las FKs del schema.
-- Todos los valores cumplen los CHECK constraints de la v8.
-- =====================================================================

USE `metafit`;

-- =====================================================================
-- 1. USUARIO (5 registros)
--    Roles: 1 Administrador, 2 Entrenadores, 2 Recepcionistas
--    contrasena_usuario: SHA2('contraseña',256) — hash real
-- =====================================================================
INSERT INTO `USUARIO`
  (`nombres_usuario`, `apellidos_usuario`, `correo_usuario`,
   `contrasena_usuario`, `rol_usuario`, `estado_cuenta_usuario`)
VALUES
  ('Carlos',   'Ramírez Peña',   'carlos@metafit.com',
   SHA2('Admin123!', 256),    'Administrador', 'Activo'),
  ('Laura',    'Gómez Vargas',   'laura@metafit.com',
   SHA2('Laura456!', 256),    'Entrenador',    'Activo'),
  ('Andrés',   'Torres Salcedo', 'andres@metafit.com',
   SHA2('Andres789!', 256),   'Entrenador',    'Activo'),
  ('María',    'López Rojas',    'maria@metafit.com',
   SHA2('Maria111!', 256),    'Recepcionista', 'Activo'),
  ('Pedro',    'Suárez Cano',    'pedro@metafit.com',
   SHA2('Pedro222!', 256),    'Recepcionista', 'Pendiente');

-- =====================================================================
-- 2. RESTRICCION (6 registros)
-- =====================================================================
INSERT INTO `RESTRICCION`
  (`nombre_restriccion`, `tipo_restriccion`, `efecto_relevante`)
VALUES
  ('Diabetes tipo 2',        'Enfermedad',  'Evitar ejercicio de alta intensidad sin supervisión'),
  ('Hipertensión arterial',  'Enfermedad',  'Controlar frecuencia cardíaca durante el ejercicio'),
  ('Lesión rodilla derecha', 'Lesión',      'Evitar carga axial directa sobre rodilla derecha'),
  ('Alergia al gluten',      'Alergia',      NULL),
  ('Intolerancia a lactosa', 'Alergia',      NULL),
  ('Metformina',             'Medicamento', 'Puede causar hipoglucemia en ejercicio intenso');

-- =====================================================================
-- 3. EJERCICIO (10 registros)
-- =====================================================================
INSERT INTO `EJERCICIO`
  (`nombre_ejercicio`, `grupo_muscular`, `descripcion`, `nivel_minimo`)
VALUES
  ('Sentadilla',           'Piernas',  'Ejercicio compuesto de miembro inferior con barra',      'Principiante'),
  ('Press de banca',       'Pecho',    'Empuje horizontal con barra en banco plano',               'Principiante'),
  ('Peso muerto',          'Espalda',  'Ejercicio de cadena posterior con barra desde el suelo',  'Intermedio'),
  ('Press militar',        'Hombros',  'Empuje vertical sobre cabeza con barra de pie',           'Intermedio'),
  ('Curl de bíceps',       'Bíceps',   'Flexión de codo con mancuerna en posición de pie',        'Principiante'),
  ('Extensión de tríceps', 'Tríceps',  'Extensión de codo en polea alta con cuerda',              'Principiante'),
  ('Hip thrust',           'Glúteos',  'Empuje de cadera con barra apoyada en banco',             'Intermedio'),
  ('Dominadas',            'Espalda',  'Jalón con peso corporal en barra fija pronada',           'Avanzado'),
  ('Zancadas',             'Piernas',  'Paso largo alternado con mancuernas en cada mano',        'Intermedio'),
  ('Plancha abdominal',    'Core',     'Contracción isométrica de core en posición prona',        'Principiante');

-- =====================================================================
-- 4. ALIMENTO (10 registros — macros en g/100g, sin calorías: van en VIEW)
-- =====================================================================
INSERT INTO `ALIMENTO`
  (`nombre_alimento`, `proteinas`, `carbohidratos`, `grasas`)
VALUES
  ('Pechuga de pollo',   31.00,  0.00,  3.60),
  ('Arroz blanco',        2.70, 28.00,  0.30),
  ('Huevo entero',       13.00,  1.10, 11.00),
  ('Avena',              17.00, 66.00,  7.00),
  ('Brócoli',             2.80,  7.00,  0.40),
  ('Atún en agua',       29.00,  0.00,  0.50),
  ('Batata',              1.60, 20.00,  0.10),
  ('Almendras',          21.00, 22.00, 50.00),
  ('Leche deslactosada',  3.40,  4.80,  3.60),
  ('Quinoa',             14.00, 64.00,  6.00);

-- =====================================================================
-- 5. EJERCICIO_RESTRICCION_EXCLUIDA (7 registros)
-- =====================================================================
INSERT INTO `EJERCICIO_RESTRICCION_EXCLUIDA`
  (`id_ejercicio`, `id_restriccion`)
VALUES
  (1, 3),  -- Sentadilla        excluida si: Lesión rodilla derecha
  (7, 3),  -- Hip thrust        excluida si: Lesión rodilla derecha
  (9, 3),  -- Zancadas          excluidas si: Lesión rodilla derecha
  (3, 2),  -- Peso muerto       excluido  si: Hipertensión arterial
  (4, 2),  -- Press militar     excluido  si: Hipertensión arterial
  (3, 1),  -- Peso muerto       excluido  si: Diabetes tipo 2
  (8, 1);  -- Dominadas         excluidas si: Diabetes tipo 2

-- =====================================================================
-- 6. ALIMENTO_RESTRICCION_EXCLUIDA (4 registros)
-- =====================================================================
INSERT INTO `ALIMENTO_RESTRICCION_EXCLUIDA`
  (`id_alimento`, `id_restriccion`)
VALUES
  (9, 5),  -- Leche deslactosada excluida si: Intolerancia a lactosa
  (4, 4),  -- Avena              excluida si: Alergia al gluten
  (2, 1),  -- Arroz blanco       excluido  si: Diabetes tipo 2
  (7, 1);  -- Batata             excluida  si: Diabetes tipo 2

-- =====================================================================
-- 7. AFILIADO (10 registros)
--    estatura BETWEEN 100 AND 250 | disponibilidad BETWEEN 1 AND 7
--    fecha_nacimiento >= '1900-01-01' | registrado_por FK → USUARIO
-- =====================================================================
INSERT INTO `AFILIADO`
  (`nombres_afiliado`, `apellidos_afiliado`, `documento_afiliado`,
   `fecha_nacimiento_afiliado`, `sexo_afiliado`, `correo_afiliado`,
   `direccion_afiliado`, `telefono_afiliado`, `estatura_afiliado`,
   `objetivo_fisico_afiliado`, `grupo_muscular_prioritario`,
   `nivel_experiencia_afiliado`, `disponibilidad_semanal_afiliado`,
   `estado_afiliacion`, `fecha_registro_afiliado`,
   `fecha_ultima_modificacion`, `fecha_ultimo_cambio_estado`,
   `registrado_por`)
VALUES
  ('Juan',      'Martínez García',  1001234567, '1990-03-15', 'Masculino',
   'juan.martinez@gmail.com',  'Calle 10 # 5-20, Bogotá',     '3001234567',
   175.50, 'Pérdida de grasa', 'Pecho',   'Intermedio',   3,
   'Activo',  '2024-01-07', '2024-03-11 10:00:00', NULL,                     4),

  ('Ana',       'Rodríguez Mora',   1002345678, '1995-07-22', 'Femenino',
   'ana.rodriguez@gmail.com',  'Carrera 15 # 8-30, Medellín', '3012345678',
   162.00, 'Aumento de masa',  'Glúteos', 'Intermedio',   5,
   'Activo',  '2024-02-01', NULL,                  NULL,                     4),

  ('Luis',      'Herrera Ospina',   1003456789, '1988-11-05', 'Masculino',
   'luis.herrera@gmail.com',   'Av 20 # 3-10, Cali',          '3023456789',
   180.00, 'Mantenimiento',    'Espalda', 'Avanzado',     6,
   'Activo',  '2024-01-14', NULL,                  NULL,                     5),

  ('Sofía',     'Castro Reyes',     1004567890, '2000-01-30', 'Femenino',
   'sofia.castro@gmail.com',   'Calle 25 # 12-5, Bogotá',     '3034567890',
   158.50, 'Pérdida de grasa', NULL,      'Principiante', 4,
   'Activo',  '2024-03-31', NULL,                  NULL,                     5),

  ('Diego',     'Vargas Jiménez',   1005678901, '1993-05-18', 'Masculino',
   'diego.vargas@gmail.com',   'Carrera 7 # 45-20, Pereira',  '3045678901',
   172.00, 'Aumento de masa',  'Piernas', 'Intermedio',   4,
   'Activo',  '2024-02-19', NULL,                  NULL,                     4),

  ('Valentina', 'Mora Cardona',     1006789012, '1997-09-12', 'Femenino',
   'valentina.mora@gmail.com', 'Calle 50 # 20-15, Manizales', '3056789012',
   165.00, 'Mantenimiento',    'Core',    'Principiante', 3,
   'Inactivo','2024-01-20', NULL,                  '2024-03-01 09:00:00',    4),

  ('Camilo',    'Jiménez Bernal',   1007890123, '1985-02-28', 'Masculino',
   'camilo.jimenez@gmail.com', 'Av 30 # 15-8, Bucaramanga',   '3067890123',
   183.00, 'Pérdida de grasa', 'Hombros', 'Avanzado',     5,
   'Activo',  '2024-02-29', NULL,                  NULL,                     5),

  ('Daniela',   'Reyes Quintero',   1008901234, '2002-06-10', 'Femenino',
   'daniela.reyes@gmail.com',  'Carrera 20 # 10-30, Ibagué',  '3078901234',
   160.00, 'Pérdida de grasa', 'Bíceps',  'Principiante', 2,
   'Activo',  '2024-04-04', NULL,                  NULL,                     4),

  ('Ricardo',   'Montoya Acosta',   1009012345, '1992-08-17', 'Masculino',
   'ricardo.montoya@gmail.com','Calle 80 # 30-5, Bogotá',     '3089012345',
   176.00, 'Aumento de masa',  'Espalda', 'Principiante', 3,
   'Activo',  '2024-04-10', NULL,                  NULL,                     4),

  ('Paola',     'Gutiérrez Sierra', 1010123456, '1998-12-03', 'Femenino',
   'paola.gutierrez@gmail.com','Carrera 50 # 8-22, Cali',     '3090123456',
   163.00, 'Mantenimiento',    'Glúteos', 'Intermedio',   4,
   'Activo',  '2024-04-10', NULL,                  NULL,                     5);

-- =====================================================================
-- 8. AFILIADO_RESTRICCION (7 registros)
-- =====================================================================
INSERT INTO `AFILIADO_RESTRICCION`
  (`id_afiliado`, `id_restriccion`)
VALUES
  (1, 2),  -- Juan     → Hipertensión arterial
  (2, 5),  -- Ana      → Intolerancia a lactosa
  (3, 1),  -- Luis     → Diabetes tipo 2
  (3, 6),  -- Luis     → Metformina
  (5, 3),  -- Diego    → Lesión rodilla derecha
  (7, 2),  -- Camilo   → Hipertensión arterial
  (8, 4);  -- Daniela  → Alergia al gluten

-- =====================================================================
-- 9. CICLO (8 registros)
--    fecha_fin > fecha_inicio (CHECK) | activo IN (0,1) (CHECK)
--    UNIQUE (id_afiliado, fecha_inicio_ciclo)
--    Juan tiene 2 ciclos: id=1 cerrado, id=3 activo
-- =====================================================================
INSERT INTO `CICLO`
  (`id_afiliado`, `fecha_inicio_ciclo`, `fecha_fin_ciclo`, `activo`)
VALUES
  (1, '2024-01-08', '2024-03-08', 0),  -- ciclo 1  Juan — cerrado
  (2, '2024-02-01', '2024-04-01', 0),  -- ciclo 2  Ana  — cerrado
  (1, '2024-03-11', '2024-05-11', 1),  -- ciclo 3  Juan — activo (su 2° ciclo)
  (3, '2024-01-15', '2024-03-15', 1),  -- ciclo 4  Luis
  (4, '2024-04-01', '2024-06-01', 1),  -- ciclo 5  Sofía
  (5, '2024-02-20', '2024-04-20', 1),  -- ciclo 6  Diego
  (7, '2024-03-01', '2024-04-30', 1),  -- ciclo 7  Camilo
  (8, '2024-04-05', '2024-06-05', 1);  -- ciclo 8  Daniela

-- =====================================================================
-- 10. PLAN_ENTRENAMIENTO (8 registros — 1:1 con CICLO)
--     es_automatico IN (0,1) (CHECK)
-- =====================================================================
INSERT INTO `PLAN_ENTRENAMIENTO`
  (`id_ciclo`, `es_automatico`, `modificado_por`, `observaciones`)
VALUES
  (1, 1, NULL, NULL),
  (2, 1, NULL, NULL),
  (3, 0, 2,    'Mayor volumen en pecho para ciclo 2 de Juan'),
  (4, 1, NULL, NULL),
  (5, 1, NULL, NULL),
  (6, 1, NULL, NULL),
  (7, 0, 3,    'Plan avanzado con énfasis en hombros y espalda — Camilo'),
  (8, 1, NULL, NULL);

-- =====================================================================
-- 11. PLAN_NUTRICIONAL (8 registros — 1:1 con CICLO)
--     calorias BETWEEN 500 AND 10000 | comidas BETWEEN 1 AND 10
--     es_automatico IN (0,1)  (todos CHECK)
-- =====================================================================
INSERT INTO `PLAN_NUTRICIONAL`
  (`id_ciclo`, `calorias_estimadas`, `num_comidas_diarias`,
   `es_automatico`, `modificado_por`, `observaciones`)
VALUES
  (1, 2000.00, 5, 1, NULL, NULL),
  (2, 1800.00, 4, 1, NULL, NULL),
  (3, 2200.00, 5, 0, 3,   'Mayor proteína para fase de volumen — ciclo 2 Juan'),
  (4, 2500.00, 6, 0, 2,   'Sin arroz ni batata por diabetes tipo 2 — Luis'),
  (5, 1700.00, 4, 1, NULL, NULL),
  (6, 2800.00, 5, 1, NULL, NULL),
  (7, 2400.00, 5, 0, 2,   'Ajuste calórico especial — Camilo'),
  (8, 1900.00, 4, 1, NULL, NULL);

-- =====================================================================
-- 12. RUTINA (17 registros)
--     dia_numero BETWEEN 1 AND 7 (CHECK)
--     UNIQUE (id_plan_entrenamiento, dia_numero)
-- =====================================================================
INSERT INTO `RUTINA`
  (`id_plan_entrenamiento`, `nombre_rutina`, `enfoque_muscular`, `dia_numero`)
VALUES
  -- Plan 1: Juan ciclo 1 (3 días)
  (1, 'Día 1 — Pecho y Bíceps',    'Pecho',     1),
  (1, 'Día 2 — Piernas',           'Piernas',   3),
  (1, 'Día 3 — Espalda y Tríceps', 'Espalda',   5),
  -- Plan 3: Juan ciclo 2 (Full Body 2 días)
  (3, 'Día A — Full Body Empuje',  'Empuje',    1),
  (3, 'Día B — Full Body Jale',    'Jale',      4),
  -- Plan 4: Luis — avanzado (3 días)
  (4, 'Día 1 — Hombros y Core',    'Hombros',   1),
  (4, 'Día 2 — Espalda Completa',  'Espalda',   3),
  (4, 'Día 3 — Piernas Pesado',    'Piernas',   5),
  -- Plan 5: Sofía — principiante (Full Body 2 días)
  (5, 'Día 1 — Cuerpo Completo A', 'Full Body', 2),
  (5, 'Día 2 — Cuerpo Completo B', 'Full Body', 5),
  -- Plan 6: Diego — lesión rodilla (sin sentadilla/hip thrust/zancadas)
  (6, 'Día 1 — Push Day',          'Empuje',    1),
  (6, 'Día 2 — Pull Day',          'Jale',      3),
  (6, 'Día 3 — Tren Superior',     'Pecho',     5),
  -- Plan 7: Camilo — avanzado (2 días)
  (7, 'Día 1 — Hombros y Tríceps', 'Hombros',   2),
  (7, 'Día 2 — Espalda y Bíceps',  'Espalda',   4),
  -- Plan 8: Daniela — principiante (2 días)
  (8, 'Día 1 — Glúteos y Core',    'Glúteos',   1),
  (8, 'Día 2 — Tren Superior',     'Pecho',     4);

-- =====================================================================
-- 13. RUTINA_EJERCICIO (40 registros)
--     PK: (id_rutina, id_ejercicio) — mismo ejercicio 1 sola vez/rutina
--     UNIQUE: (id_rutina, orden)    — posiciones únicas por rutina
--     series >= 1 | repeticiones >= 1 | orden >= 1  (CHECK)
-- =====================================================================
INSERT INTO `RUTINA_EJERCICIO`
  (`id_rutina`, `id_ejercicio`, `series`, `repeticiones`, `orden`)
VALUES
  -- Rutina 1: Pecho y Bíceps
  (1,  2,  4, 10, 1),  -- Press de banca     4×10
  (1,  5,  3, 12, 2),  -- Curl de bíceps     3×12
  (1,  10, 3, 30, 3),  -- Plancha abdominal  3×30 s
  -- Rutina 2: Piernas
  (2,  1,  4, 12, 1),  -- Sentadilla         4×12
  (2,  9,  3, 15, 2),  -- Zancadas           3×15
  -- Rutina 3: Espalda y Tríceps
  (3,  3,  4,  8, 1),  -- Peso muerto        4×8
  (3,  8,  3,  8, 2),  -- Dominadas          3×8
  (3,  6,  3, 12, 3),  -- Extensión tríceps  3×12
  -- Rutina 4: Full Body Empuje (Juan ciclo 2)
  (4,  2,  3,  8, 1),  -- Press de banca     3×8
  (4,  4,  3, 10, 2),  -- Press militar      3×10
  (4,  1,  3, 10, 3),  -- Sentadilla         3×10
  -- Rutina 5: Full Body Jale (Juan ciclo 2)
  (5,  3,  3,  8, 1),  -- Peso muerto        3×8
  (5,  8,  3,  6, 2),  -- Dominadas          3×6
  (5,  7,  3, 12, 3),  -- Hip thrust         3×12
  -- Rutina 6: Hombros y Core (Luis)
  (6,  4,  4, 10, 1),  -- Press militar      4×10
  (6,  10, 3, 45, 2),  -- Plancha abdominal  3×45 s
  -- Rutina 7: Espalda Completa (Luis)
  (7,  8,  4,  8, 1),  -- Dominadas          4×8
  (7,  3,  4,  6, 2),  -- Peso muerto        4×6
  -- Rutina 8: Piernas Pesado (Luis)
  (8,  1,  5,  5, 1),  -- Sentadilla         5×5
  (8,  9,  4,  8, 2),  -- Zancadas           4×8
  -- Rutina 9: Cuerpo Completo A (Sofía)
  (9,  2,  3, 10, 1),  -- Press de banca     3×10
  (9,  1,  3, 12, 2),  -- Sentadilla         3×12
  (9,  10, 3, 30, 3),  -- Plancha abdominal  3×30 s
  -- Rutina 10: Cuerpo Completo B (Sofía)
  (10, 5,  3, 12, 1),  -- Curl de bíceps     3×12
  (10, 6,  3, 12, 2),  -- Extensión tríceps  3×12
  (10, 7,  3, 15, 3),  -- Hip thrust         3×15
  -- Rutina 11: Push Day (Diego — lesión rodilla, evita sentadilla)
  (11, 2,  4, 10, 1),  -- Press de banca     4×10
  (11, 4,  3, 10, 2),  -- Press militar      3×10
  (11, 6,  3, 12, 3),  -- Extensión tríceps  3×12
  -- Rutina 12: Pull Day (Diego)
  (12, 8,  4,  8, 1),  -- Dominadas          4×8
  (12, 3,  3,  8, 2),  -- Peso muerto        3×8
  (12, 5,  3, 12, 3),  -- Curl de bíceps     3×12
  -- Rutina 13: Tren Superior (Diego)
  (13, 2,  3, 10, 1),  -- Press de banca     3×10
  (13, 4,  3, 10, 2),  -- Press militar      3×10
  (13, 5,  3, 12, 3),  -- Curl de bíceps     3×12
  -- Rutina 14: Hombros y Tríceps (Camilo — sin press militar por hipertensión)
  (14, 6,  4, 15, 1),  -- Extensión tríceps  4×15
  (14, 5,  3, 12, 2),  -- Curl de bíceps     3×12
  -- Rutina 15: Espalda y Bíceps (Camilo)
  (15, 8,  4,  8, 1),  -- Dominadas          4×8
  (15, 5,  3, 12, 2),  -- Curl de bíceps     3×12
  -- Rutina 16: Glúteos y Core (Daniela)
  (16, 7,  4, 12, 1),  -- Hip thrust         4×12
  (16, 10, 3, 45, 2),  -- Plancha abdominal  3×45 s
  -- Rutina 17: Tren Superior (Daniela)
  (17, 2,  3, 10, 1),  -- Press de banca     3×10
  (17, 4,  3, 10, 2),  -- Press militar      3×10
  (17, 5,  3, 12, 3);  -- Curl de bíceps     3×12

-- =====================================================================
-- 14. DETALLE_NUTRICIONAL (47 registros)
--     PK: (id_plan_nutricional, id_alimento, numero_comida)
--     numero_comida >= 1 (CHECK) | cantidad > 0 (CHECK)
--     Se respetan las exclusiones por restricción:
--       Luis (plan 4)    : sin arroz (2) ni batata (7)
--       Daniela (plan 8) : sin avena (4)
-- =====================================================================
INSERT INTO `DETALLE_NUTRICIONAL`
  (`id_plan_nutricional`, `id_alimento`, `numero_comida`, `cantidad`)
VALUES
  -- Plan 1 — Juan ciclo 1 (2000 kcal, 5 comidas)
  (1, 3, 1, 200.00),  -- C1: Huevo entero     200 g
  (1, 4, 1,  80.00),  -- C1: Avena             80 g
  (1, 1, 2, 150.00),  -- C2: Pechuga          150 g
  (1, 2, 2, 100.00),  -- C2: Arroz blanco      100 g
  (1, 5, 2, 100.00),  -- C2: Brócoli           100 g
  (1, 8, 3,  30.00),  -- C3: Almendras (snack)  30 g
  (1, 1, 4, 150.00),  -- C4: Pechuga          150 g
  (1, 7, 4, 150.00),  -- C4: Batata            150 g
  (1, 6, 5, 120.00),  -- C5: Atún en agua      120 g
  (1, 5, 5, 100.00),  -- C5: Brócoli           100 g

  -- Plan 3 — Juan ciclo 2 (2200 kcal, 5 comidas, más proteína)
  (3, 3,  1, 250.00), -- C1: Huevo entero     250 g
  (3, 4,  1,  60.00), -- C1: Avena             60 g
  (3, 1,  2, 200.00), -- C2: Pechuga          200 g
  (3, 10, 2, 100.00), -- C2: Quinoa           100 g
  (3, 6,  3, 150.00), -- C3: Atún en agua      150 g
  (3, 5,  3, 150.00), -- C3: Brócoli           150 g
  (3, 1,  4, 180.00), -- C4: Pechuga          180 g
  (3, 7,  4, 120.00), -- C4: Batata            120 g
  (3, 8,  5,  40.00), -- C5: Almendras (snack)  40 g

  -- Plan 4 — Luis (2500 kcal, 6 comidas, SIN arroz ni batata)
  (4, 3,  1, 300.00), -- C1: Huevo entero     300 g
  (4, 1,  2, 200.00), -- C2: Pechuga          200 g
  (4, 10, 2, 100.00), -- C2: Quinoa           100 g
  (4, 5,  3, 200.00), -- C3: Brócoli           200 g
  (4, 6,  3, 150.00), -- C3: Atún en agua      150 g
  (4, 1,  4, 200.00), -- C4: Pechuga          200 g
  (4, 8,  5,  50.00), -- C5: Almendras (snack)  50 g
  (4, 6,  6, 120.00), -- C6: Atún en agua      120 g

  -- Plan 5 — Sofía (1700 kcal, 4 comidas)
  (5, 3, 1, 150.00),  -- C1: Huevo entero     150 g
  (5, 4, 1,  60.00),  -- C1: Avena             60 g
  (5, 1, 2, 120.00),  -- C2: Pechuga          120 g
  (5, 2, 2,  80.00),  -- C2: Arroz blanco       80 g
  (5, 5, 2, 100.00),  -- C2: Brócoli           100 g
  (5, 6, 3, 100.00),  -- C3: Atún en agua      100 g
  (5, 7, 3, 100.00),  -- C3: Batata            100 g
  (5, 8, 4,  25.00),  -- C4: Almendras (snack)  25 g

  -- Plan 7 — Camilo (2400 kcal, 5 comidas)
  (7, 3,  1, 200.00), -- C1: Huevo entero     200 g
  (7, 4,  1,  80.00), -- C1: Avena             80 g
  (7, 1,  2, 180.00), -- C2: Pechuga          180 g
  (7, 10, 2, 100.00), -- C2: Quinoa           100 g
  (7, 6,  3, 150.00), -- C3: Atún en agua      150 g
  (7, 5,  4, 200.00), -- C4: Brócoli           200 g
  (7, 1,  4, 180.00), -- C4: Pechuga          180 g
  (7, 8,  5,  40.00), -- C5: Almendras (snack)  40 g

  -- Plan 8 — Daniela (1900 kcal, 4 comidas, SIN avena)
  (8, 3, 1, 180.00),  -- C1: Huevo entero     180 g
  (8, 1, 2, 130.00),  -- C2: Pechuga          130 g
  (8, 2, 2,  80.00),  -- C2: Arroz blanco       80 g
  (8, 5, 2, 100.00),  -- C2: Brócoli           100 g
  (8, 6, 3, 100.00),  -- C3: Atún en agua      100 g
  (8, 7, 3, 120.00),  -- C3: Batata            120 g
  (8, 8, 4,  30.00);  -- C4: Almendras (snack)  30 g

-- =====================================================================
-- 15. PROGRESO_FISICO (14 registros)
--     PK: (id_ciclo, fecha_registro) — 1 registro por ciclo por día
--     peso BETWEEN 20 AND 300 (CHECK)
--     porcentaje_grasa BETWEEN 3 AND 60 (CHECK)
--     medidas > 0 (CHECK) | registrado_por FK → USUARIO
-- =====================================================================
INSERT INTO `PROGRESO_FISICO`
  (`id_ciclo`, `fecha_registro`, `peso`, `porcentaje_grasa`,
   `medida_cintura`, `medida_brazo`, `medida_pierna`,
   `observaciones`, `registrado_por`)
VALUES
  -- Ciclo 1 — Juan ciclo 1 (cerrado, 3 mediciones)
  (1, '2024-01-08', 85.00, 22.50, 92.00, 35.00, 58.00,
   'Medición inicial del ciclo',                          4),
  (1, '2024-01-29', 83.50, 21.80, 90.50, 35.50, 58.50,
   'Progreso positivo en grasa corporal',                 2),
  (1, '2024-02-19', 82.00, 21.00, 89.00, 36.00, 59.00,
   NULL,                                                   2),

  -- Ciclo 2 — Ana ciclo 1 (cerrado, 2 mediciones)
  (2, '2024-02-01', 65.00, 28.00, 75.00, 28.00, 52.00,
   'Medición inicial',                                    4),
  (2, '2024-02-22', 66.00, 27.50, 75.50, 28.50, 52.50,
   NULL,                                                   2),

  -- Ciclo 3 — Juan ciclo 2 (activo, 2 mediciones)
  (3, '2024-03-11', 81.50, 20.50, 88.00, 36.50, 59.50,
   'Inicio del segundo ciclo, buena progresión',          2),
  (3, '2024-04-01', 80.00, 20.00, 87.00, 37.00, 60.00,
   'Mejora constante en composición corporal',            2),

  -- Ciclo 4 — Luis (activo, 2 mediciones)
  (4, '2024-01-15', 90.00, 18.00, 95.00, 40.00, 62.00,
   'Medición inicial, control glucémico estable',         2),
  (4, '2024-02-05', 89.00, 17.50, 94.00, 40.50, 62.50,
   'Buena adherencia al plan hipocalórico',                3),

  -- Ciclo 6 — Diego (activo, 2 mediciones)
  (6, '2024-02-20', 78.00, 16.50, 84.00, 38.00, 60.00,
   'Inicio de ciclo, rodilla estable sin dolor',          3),
  (6, '2024-03-12', 77.00, 16.00, 83.00, 38.50, 60.50,
   NULL,                                                   2),

  -- Ciclo 7 — Camilo (activo, 2 mediciones)
  (7, '2024-03-01', 88.00, 17.00, 92.00, 42.00, 63.00,
   'Medición inicial, tensión arterial controlada',       3),
  (7, '2024-04-01', 86.00, 16.00, 90.00, 43.00, 63.50,
   'Excelente progreso en pérdida de grasa',              2),

  -- Ciclo 8 — Daniela (activo, 1 medición inicial)
  (8, '2024-04-05', 62.00, 26.00, 72.00, 27.00, 50.00,
   'Medición inicial del primer ciclo',                   4);

-- =====================================================================
-- VERIFICACIÓN RÁPIDA (descomentar y ejecutar tras los INSERTs)
-- =====================================================================
-- SELECT COUNT(*) AS usuarios           FROM USUARIO;                       -- 5
-- SELECT COUNT(*) AS restricciones      FROM RESTRICCION;                   -- 6
-- SELECT COUNT(*) AS ejercicios         FROM EJERCICIO;                     -- 10
-- SELECT COUNT(*) AS alimentos          FROM ALIMENTO;                      -- 10
-- SELECT COUNT(*) AS afiliados          FROM AFILIADO;                      -- 10
-- SELECT COUNT(*) AS afil_restriccion   FROM AFILIADO_RESTRICCION;          -- 7
-- SELECT COUNT(*) AS ejerc_restriccion  FROM EJERCICIO_RESTRICCION_EXCLUIDA;-- 7
-- SELECT COUNT(*) AS alim_restriccion   FROM ALIMENTO_RESTRICCION_EXCLUIDA; -- 4
-- SELECT COUNT(*) AS ciclos             FROM CICLO;                         -- 8
-- SELECT COUNT(*) AS planes_ent         FROM PLAN_ENTRENAMIENTO;            -- 8
-- SELECT COUNT(*) AS planes_nut         FROM PLAN_NUTRICIONAL;              -- 8
-- SELECT COUNT(*) AS rutinas            FROM RUTINA;                        -- 17
-- SELECT COUNT(*) AS rutina_ejercicio   FROM RUTINA_EJERCICIO;              -- 40
-- SELECT COUNT(*) AS detalles_nut       FROM DETALLE_NUTRICIONAL;           -- 47
-- SELECT COUNT(*) AS progresos          FROM PROGRESO_FISICO;               -- 14

-- Vista de calorías calculadas (sin almacenarlas):
-- SELECT * FROM alimento_con_calorias ORDER BY calorias_por_100g DESC;

-- Número de ciclo calculado dinámicamente:
-- SELECT * FROM ciclo_con_numero ORDER BY id_afiliado, numero_ciclo;
