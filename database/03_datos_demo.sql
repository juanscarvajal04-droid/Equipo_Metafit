-- ============================================================================================================================
-- MetaFit — Datos de Demostración (DML)
-- Crea un afiliado de prueba con restricciones, ciclo activo, plan de entrenamiento y plan nutricional completos.
-- Autocontenido: usa búsquedas por nombre/email para evitar depender de IDs fijos.
-- Idempotente: se puede ejecutar múltiples veces sin duplicar datos.
-- ============================================================================================================================

USE `metafit`;
SET FOREIGN_KEY_CHECKS = 0;

-- ============================================================================================================================
-- 1. Crear afiliado demo si no existe
-- ============================================================================================================================

INSERT IGNORE INTO `USUARIO`
  (id_usuario, nombres, apellidos, correo, contrasena, rol, estado, fecha_registro)
VALUES
  (100, 'Carlos', 'Demo', 'carlos.demo@test.com',
   '$2a$12$c3mF4PBqzZSAALCUeXknzecZFAMRqNZYosm321UorUZeYZJSx4s26',
   'Afiliado', 'Activo', '2026-06-01 08:00:00');

INSERT IGNORE INTO `AFILIADO`
  (id_usuario, documento, fecha_nacimiento, sexo, telefono, direccion,
   estatura_cm, estado_afiliacion, fecha_registro, registrado_por)
VALUES
  (100, 999888777, '1992-08-15', 'Masculino', '3009998887',
   'Carrera 7 # 72-41, Bogotá', 170.00, 'Activo', '2026-06-01', 4);

-- ============================================================================================================================
-- 2. Asignar restricciones médicas (busca por nombre de restricción)
-- ============================================================================================================================

INSERT IGNORE INTO `AFILIADO_RESTRICCION`
  (id_usuario, id_restriccion)
SELECT 100, id_restriccion FROM `RESTRICCION`
WHERE nombre_restriccion IN ('Hipertension arterial', 'Intolerancia a lactosa');

-- ============================================================================================================================
-- 3. Crear ciclo activo (usando @variables para tracking)
-- ============================================================================================================================

INSERT INTO `CICLO`
  (id_ciclo, id_usuario, fecha_inicio, fecha_fin, activo,
   objetivo_fisico, grupo_muscular_prioritario, nivel_experiencia,
   disponibilidad_dias, observaciones, fecha_creacion, registrado_por)
VALUES
  (100, 100, '2026-06-01', '2026-08-31', 1,
   'Perdida de grasa', 'Pecho', 'Intermedio',
   4, 'Ciclo de prueba generado por datos demo', NOW(), 2);

SET @demo_ciclo_id = 100;

-- ============================================================================================================================
-- 4. Crear plan de entrenamiento (1:1 con ciclo)
-- ============================================================================================================================

INSERT IGNORE INTO `PLAN_ENTRENAMIENTO`
  (id_ciclo, modificado_por, observaciones)
VALUES
  (100, 2, 'Plan demo — 3 días/semana');

-- ============================================================================================================================
-- 5. Crear rutinas con ejercicios
-- ============================================================================================================================

INSERT INTO `RUTINA`
  (id_rutina, id_ciclo, nombre_rutina, enfoque_muscular, dia_numero)
VALUES
  (100, 100, 'Día 1 — Pecho y Tríceps',  'Pecho',   1),
  (101, 100, 'Día 2 — Espalda y Bíceps', 'Espalda', 3),
  (102, 100, 'Día 3 — Piernas y Core',   'Piernas', 5);

-- Insertar ejercicios en rutina 100 (Pecho y Tríceps)
-- Busca id_ejercicio por nombre
INSERT INTO `RUTINA_EJERCICIO`
  (id_rutina, orden, id_ejercicio, series, repeticiones)
SELECT 100, 1, id_ejercicio, 4, 12 FROM `EJERCICIO` WHERE nombre_ejercicio = 'Press de banca'
UNION ALL SELECT 100, 2, id_ejercicio, 3, 15 FROM `EJERCICIO` WHERE nombre_ejercicio = 'Extension de triceps';

-- Insertar ejercicios en rutina 101 (Espalda y Bíceps)
INSERT INTO `RUTINA_EJERCICIO`
  (id_rutina, orden, id_ejercicio, series, repeticiones)
SELECT 101, 1, id_ejercicio, 4, 10 FROM `EJERCICIO` WHERE nombre_ejercicio = 'Peso muerto'
UNION ALL SELECT 101, 2, id_ejercicio, 3, 12 FROM `EJERCICIO` WHERE nombre_ejercicio = 'Curl de biceps';

-- Insertar ejercicios en rutina 102 (Piernas y Core)
INSERT INTO `RUTINA_EJERCICIO`
  (id_rutina, orden, id_ejercicio, series, repeticiones)
SELECT 102, 1, id_ejercicio, 4, 15 FROM `EJERCICIO` WHERE nombre_ejercicio = 'Sentadilla'
UNION ALL SELECT 102, 2, id_ejercicio, 3, 12 FROM `EJERCICIO` WHERE nombre_ejercicio = 'Hip thrust'
UNION ALL SELECT 102, 3, id_ejercicio, 3, 15 FROM `EJERCICIO` WHERE nombre_ejercicio = 'Zancadas';

-- ============================================================================================================================
-- 6. Crear plan nutricional (1:1 con ciclo)
-- ============================================================================================================================

INSERT IGNORE INTO `PLAN_NUTRICIONAL`
  (id_ciclo, calorias_objetivo, num_comidas, modificado_por, observaciones)
VALUES
  (100, 2200.00, 4, 2, 'Plan nutricional demo — déficit calórico moderado');

-- ============================================================================================================================
-- 7. Insertar detalle nutricional (4 comidas)
-- ============================================================================================================================

INSERT INTO `DETALLE_NUTRICIONAL`
  (id_ciclo, num_comida, id_alimento, cantidad_g)
SELECT 100, 1, id_alimento, 150.00 FROM `ALIMENTO` WHERE nombre_alimento = 'Huevo entero'
UNION ALL SELECT 100, 1, id_alimento,  80.00 FROM `ALIMENTO` WHERE nombre_alimento = 'Avena'
UNION ALL SELECT 100, 2, id_alimento, 200.00 FROM `ALIMENTO` WHERE nombre_alimento = 'Pechuga de pollo'
UNION ALL SELECT 100, 2, id_alimento, 120.00 FROM `ALIMENTO` WHERE nombre_alimento = 'Arroz blanco'
UNION ALL SELECT 100, 3, id_alimento, 120.00 FROM `ALIMENTO` WHERE nombre_alimento = 'Atun en agua'
UNION ALL SELECT 100, 3, id_alimento, 100.00 FROM `ALIMENTO` WHERE nombre_alimento = 'Quinoa'
UNION ALL SELECT 100, 4, id_alimento,  40.00 FROM `ALIMENTO` WHERE nombre_alimento = 'Almendras'
UNION ALL SELECT 100, 4, id_alimento, 200.00 FROM `ALIMENTO` WHERE nombre_alimento = 'Brocoli';

-- ============================================================================================================================
-- 8. Ajustar AUTO_INCREMENT para evitar conflictos con futuros inserts
-- ============================================================================================================================

SET FOREIGN_KEY_CHECKS = 1;

ALTER TABLE `USUARIO`   AUTO_INCREMENT = 101;
ALTER TABLE `CICLO`     AUTO_INCREMENT = 101;
ALTER TABLE `RUTINA`    AUTO_INCREMENT = 103;
