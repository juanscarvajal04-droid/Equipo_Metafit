-- ============================================================================================================================
-- 03_mejoras_estructura.sql — FASE 0: Mejoras de estructura Metafit
--
-- Implementa el borrador "FASE 0" del equipo adaptado al esquema REAL del repo.
-- NO crea las tablas base: asume 01_estructura.sql y 02_migracion_movil.sql aplicados.
--
-- Correcciones aplicadas respecto al borrador original:
--   1) AFILIADO: columnas renombradas al contrato real del front (afiliadosService.js):
--        objetivo / nivel / disponibilidad_semanal  ->  objetivo_fisico / nivel_experiencia / disponibilidad_semanal_dias
--      Reutilizan los ENUM de CICLO (mismo vocabulario). Son NULLables y quedan documentadas como
--      desnormalizacion parcial a 3FN: CICLO sigue siendo la fuente por ciclo; estas columnas persisten
--      el valor capturado en el formulario de registro y sirven de inicial/fallback del primer ciclo.
--   2) REGISTRO_EJERCICIO: RUTINA_EJERCICIO NO tiene columna id (PK real = (id_rutina, orden)).
--      La pseudocolumna id_rutina_ejercicio se sustituye por la PK compuesta (id_rutina, orden).
--   3) CONSUMO_ALIMENTO_REAL: DETALLE_NUTRICIONAL NO tiene id (PK real = (id_ciclo, num_comida, id_alimento)),
--      se usa FK compuesta real. calorias_consumidas NO puede ser columna GENERATED con subquery
--      (prohibido en MySQL y MariaDB): es una columna normal calculada en el INSERT con la MISMA
--      formula Atwater de la VIEW v_alimento_calorias: (P*4)+(C*4)+(G*9) por cada 100g.
--   4) id_afiliado -> id_usuario (AFILIADO hereda de USUARIO 1:1; su PK ES USUARIO.id_usuario).
--   5) ALTER TABLE idempotente via INFORMATION_SCHEMA + PREPARE/EXECUTE:
--      MariaDB soporta ADD COLUMN IF NOT EXISTS, MySQL 8.0 NO. Este patron funciona en ambos.
--   6) Sin DEFAULT (CURRENT_DATE) en tablas nuevas (solo MySQL 8.0.13+/MariaDB 10.2+);
--      las fechas se pasan explicitamente en 04_datos_iniciales.sql.
-- ============================================================================================================================

USE `metafit`;

-- Desactivar checks durante creacion para evitar conflictos de orden de FK
SET FOREIGN_KEY_CHECKS = 0;


-- ============================================================================================================================
-- BLOQUE 1 — AFILIADO: objetivo / nivel / disponibilidad (capturados en el registro web)
-- Desnormalizacion deliberada y NULLable: no rompe la 3FN de CICLO, solo persiste el formulario
-- (auditoria de flujos: la web captura estos 3 campos pero NO los guardaba en ningun lado).
-- ============================================================================================================================

SET @sql_add = IF(
  NOT EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS
               WHERE TABLE_SCHEMA = 'metafit' AND TABLE_NAME = 'AFILIADO'
                 AND COLUMN_NAME = 'objetivo_fisico'),
  'ALTER TABLE `AFILIADO`
     ADD COLUMN `objetivo_fisico` ENUM(''Perdida de grasa'',''Aumento de masa'',''Mantenimiento'',''Rehabilitacion'') NULL
     COMMENT ''Meta capturada en el registro. CICLO es la fuente por ciclo (3FN).'' AFTER `estatura_cm`',
  'SELECT 1');
PREPARE stmt FROM @sql_add; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @sql_add = IF(
  NOT EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS
               WHERE TABLE_SCHEMA = 'metafit' AND TABLE_NAME = 'AFILIADO'
                 AND COLUMN_NAME = 'nivel_experiencia'),
  'ALTER TABLE `AFILIADO`
     ADD COLUMN `nivel_experiencia` ENUM(''Principiante'',''Intermedio'',''Avanzado'') NULL
     COMMENT ''Nivel capturado en el registro. CICLO es la fuente por ciclo (3FN).'' AFTER `objetivo_fisico`',
  'SELECT 1');
PREPARE stmt FROM @sql_add; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @sql_add = IF(
  NOT EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS
               WHERE TABLE_SCHEMA = 'metafit' AND TABLE_NAME = 'AFILIADO'
                 AND COLUMN_NAME = 'disponibilidad_semanal_dias'),
  'ALTER TABLE `AFILIADO`
     ADD COLUMN `disponibilidad_semanal_dias` TINYINT NULL
     COMMENT ''Dias/semana capturados en el registro. CICLO es la fuente por ciclo (3FN).''
     CHECK (`disponibilidad_semanal_dias` BETWEEN 1 AND 7) AFTER `nivel_experiencia`',
  'SELECT 1');
PREPARE stmt FROM @sql_add; EXECUTE stmt; DEALLOCATE PREPARE stmt;


-- ============================================================================================================================
-- BLOQUE 2 — REGISTRO_EJERCICIO: ejecucion REAL de un ejercicio dentro de la rutina
-- Reemplaza el booleano de PROGRESO_EJERCICIO_DIARIO por datos de volumen (series, reps, peso).
-- La FK es la PK compuesta real de RUTINA_EJERCICIO: (id_rutina, orden).
-- series / repeticiones / peso_utilizado_kg = valores EJECUTADOS (no los objetivos de la rutina).
-- ============================================================================================================================

CREATE TABLE IF NOT EXISTS `REGISTRO_EJERCICIO` (
  `id_registro`        INT          NOT NULL AUTO_INCREMENT,
  `id_usuario`         INT          NOT NULL COMMENT 'PK real de AFILIADO (herencia USUARIO 1:1)',
  `id_ciclo`           INT          NOT NULL,
  `id_rutina`          INT          NOT NULL,
  `orden`              INT          NOT NULL,
  `fecha`              DATE         NOT NULL,
  `series`             INT          NULL CHECK (`series`       >= 1),
  `repeticiones`       INT          NULL CHECK (`repeticiones` >= 1),
  `peso_utilizado_kg`  DECIMAL(5,2) NULL CHECK (`peso_utilizado_kg` IS NULL OR `peso_utilizado_kg` > 0),
  `notas`              VARCHAR(400) NULL,
  `created_at`         DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,

  PRIMARY KEY (`id_registro`),
  UNIQUE INDEX `uk_registro_ejercicio_dia` (`id_usuario`, `id_ciclo`, `id_rutina`, `orden`, `fecha`),

  INDEX `idx_rejec_usuario_fecha` (`id_usuario`, `fecha`),
  INDEX `idx_rejec_rutina`        (`id_rutina`, `orden`),

  CONSTRAINT `fk_rejec_usuario`
    FOREIGN KEY (`id_usuario`)
    REFERENCES `USUARIO` (`id_usuario`)
    ON DELETE CASCADE ON UPDATE CASCADE,

  CONSTRAINT `fk_rejec_ciclo`
    FOREIGN KEY (`id_ciclo`)
    REFERENCES `CICLO` (`id_ciclo`)
    ON DELETE CASCADE ON UPDATE CASCADE,

  CONSTRAINT `fk_rejec_rutejec`
    FOREIGN KEY (`id_rutina`, `orden`)
    REFERENCES `RUTINA_EJERCICIO` (`id_rutina`, `orden`)
    ON DELETE RESTRICT ON UPDATE CASCADE

) ENGINE = InnoDB
  COMMENT = 'Alto volumen. Ejecucion real (series/reps/peso) del ejercicio en la rutina. FK compuesta a RUTINA_EJERCICIO.';


-- ============================================================================================================================
-- BLOQUE 3 — CONSUMO_ALIMENTO_REAL: lo que el afiliado REALMENTE consumio de su plan
-- FK a la PK natural triple de DETALLE_NUTRICIONAL: (id_ciclo, num_comida, id_alimento).
-- calorias_consumidas: NO es columna GENERATED con subquery (ilegal en MySQL/MariaDB).
-- Se calcula en el INSERT con la formula Atwater de v_alimento_calorias:
--   ((proteinas*4)+(carbohidratos*4)+(grasas*9)) * cantidad_g_consumida / 100
-- (ver 04_datos_iniciales.sql, que la deriva automaticamente del detalle del plan).
-- ============================================================================================================================

CREATE TABLE IF NOT EXISTS `CONSUMO_ALIMENTO_REAL` (
  `id_consumo`            INT          NOT NULL AUTO_INCREMENT,
  `id_usuario`            INT          NOT NULL COMMENT 'PK real de AFILIADO (herencia USUARIO 1:1)',
  `id_ciclo`              INT          NOT NULL,
  `num_comida`            TINYINT      NOT NULL,
  `id_alimento`           INT          NOT NULL,
  `fecha`                 DATE         NOT NULL,
  `cantidad_g_consumida`  DECIMAL(7,2) NOT NULL CHECK (`cantidad_g_consumida` > 0),
  `calorias_consumidas`   DECIMAL(8,2) NOT NULL CHECK (`calorias_consumidas` >= 0),
  `proteinas_consumidas`     DECIMAL(8,2) NOT NULL DEFAULT 0 COMMENT 'Atwater: proteinas_por_100g x gramos / 100',
  `carbohidratos_consumidos` DECIMAL(8,2) NOT NULL DEFAULT 0 COMMENT 'Atwater: carbohidratos_por_100g x gramos / 100',
  `grasas_consumidas`        DECIMAL(8,2) NOT NULL DEFAULT 0 COMMENT 'Atwater: grasas_por_100g x gramos / 100',
  `created_at`            DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,

  PRIMARY KEY (`id_consumo`),
  UNIQUE INDEX `uk_consumo_real_dia` (`id_usuario`, `id_ciclo`, `num_comida`, `id_alimento`, `fecha`),

  INDEX `idx_creal_usuario_fecha` (`id_usuario`, `fecha`),
  INDEX `idx_creal_id_alimento`   (`id_alimento`),

  CONSTRAINT `fk_creal_usuario`
    FOREIGN KEY (`id_usuario`)
    REFERENCES `USUARIO` (`id_usuario`)
    ON DELETE CASCADE ON UPDATE CASCADE,

  CONSTRAINT `fk_creal_ciclo`
    FOREIGN KEY (`id_ciclo`)
    REFERENCES `CICLO` (`id_ciclo`)
    ON DELETE CASCADE ON UPDATE CASCADE,

  CONSTRAINT `fk_creal_detalle`
    FOREIGN KEY (`id_ciclo`, `num_comida`, `id_alimento`)
    REFERENCES `DETALLE_NUTRICIONAL` (`id_ciclo`, `num_comida`, `id_alimento`)
    ON DELETE RESTRICT ON UPDATE CASCADE

) ENGINE = InnoDB
  COMMENT = 'Alto volumen. Consumo real por alimento del plan. Calorias y macros = Atwater calculadas en INSERT.';


-- ============================================================================================================================
-- BLOQUE 4 — PROGRESO_DIARIO: resumen diario del afiliado (energia, animo, volumen, nutricion, agua)
-- Agrega los registros del dia (REGISTRO_EJERCICIO, CONSUMO_ALIMENTO_REAL, REGISTRO_AGUA)
-- para alimentar el "Progreso diario" de la app. agua en vasos (unidad real: REGISTRO_AGUA.vasos).
-- ============================================================================================================================

CREATE TABLE IF NOT EXISTS `PROGRESO_DIARIO` (
  `id_progreso_diario`    INT          NOT NULL AUTO_INCREMENT,
  `id_usuario`            INT          NOT NULL COMMENT 'PK real de AFILIADO (herencia USUARIO 1:1)',
  `fecha`                 DATE         NOT NULL,
  `calorias_consumidas`   DECIMAL(8,2) NOT NULL DEFAULT 0,
  `agua_vasos`            TINYINT      NOT NULL DEFAULT 0 CHECK (`agua_vasos` BETWEEN 0 AND 50),
  `ejercicios_realizados` TINYINT      NOT NULL DEFAULT 0,
  `duracion_minutos`      INT          NULL CHECK (`duracion_minutos` IS NULL OR `duracion_minutos` > 0),
  `nivel_energia`         TINYINT      NULL CHECK (`nivel_energia` BETWEEN 1 AND 5),
  `estado_animo`          ENUM('Excelente','Bueno','Normal','Cansado','Agotado') NULL,
  `observaciones`         VARCHAR(400) NULL,
  `created_at`            DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at`            DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  PRIMARY KEY (`id_progreso_diario`),
  UNIQUE INDEX `uk_progreso_diario` (`id_usuario`, `fecha`),

  CONSTRAINT `fk_pdiario_usuario`
    FOREIGN KEY (`id_usuario`)
    REFERENCES `USUARIO` (`id_usuario`)
    ON DELETE CASCADE ON UPDATE CASCADE

) ENGINE = InnoDB
  COMMENT = 'Resumen diario por afiliado (1 fila por dia). Fuente: REGISTRO_EJERCICIO + CONSUMO_ALIMENTO_REAL + REGISTRO_AGUA.';


SET FOREIGN_KEY_CHECKS = 1;

-- ============================================================================================================================
-- VERIFICACION RAPIDA (ejecutar manualmente)
-- ============================================================================================================================
-- SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS
--  WHERE TABLE_SCHEMA='metafit' AND TABLE_NAME='AFILIADO'
--  ORDER BY ORDINAL_POSITION;              -- debe listar las 3 columnas nuevas
-- SHOW TABLES;                              -- REGISTRO_EJERCICIO, CONSUMO_ALIMENTO_REAL, PROGRESO_DIARIO
-- ============================================================================================================================