-- =====================================================
-- MetaFit DB — Esquema Normalizado 3FN (FINAL v8)
-- 15 tablas + 2 VIEWs
-- Ronda 1: calorias_por_100g derivada, peso/grasa redundantes
-- Ronda 2: numero_ciclo calculable, 3 UNIQUE faltantes,
--          comentario desactualizado
-- Ronda 3: UNIQUE nombre_ejercicio/alimento/restriccion,
--          UNIQUE ciclo+inicio, UNIQUE ciclo+fecha progreso,
--          registrado_por NOT NULL
-- Ronda 4: BUG SQL roto, BUG GROUP BY VIEW,
--          utf8→utf8mb4, UNIQUE nombre_restriccion,
--          CHECK disponibilidad/dia_numero/num_comidas/numero_comida
-- Ronda 5: DEFAULT fechas automáticas, VARCHAR(255) contraseña,
--          VARCHAR(15) teléfono, CHECK estatura/macros/fechas/
--          calorias/series/reps/orden/cantidad/peso/grasa/medidas
-- Ronda 6: surrogate id_rutina_ejercicio eliminado
--          (PK natural id_rutina+id_ejercicio),
--          surrogate id_detalle eliminado
--          (PK natural plan+alimento+comida)
-- Ronda 7: surrogate id_progreso eliminado
--          (PK natural id_ciclo+fecha_registro)
-- Ronda 8: CHECK booleanos activo/es_automatico IN(0,1),
--          CHECK fecha_nacimiento >= '1900-01-01',
--          comentarios descriptivos en tablas pivot 4/6/8
-- ======================================================

CREATE SCHEMA IF NOT EXISTS `metafit` DEFAULT CHARACTER SET utf8mb4;
USE `metafit`;

-- =====================================================
-- 1. USUARIO
--    Todos los atributos dependen directamente de
--    id_usuario. contrasena_usuario VARCHAR(255)
--    cubre cualquier algoritmo de hash moderno.
--    fecha_registro con DEFAULT CURRENT_TIMESTAMP
--    para captura automática sin depender de la app.
-- =====================================================
CREATE TABLE IF NOT EXISTS `USUARIO` (
  `id_usuario`            INT NOT NULL AUTO_INCREMENT,
  `nombres_usuario`       VARCHAR(45) NOT NULL,
  `apellidos_usuario`     VARCHAR(45) NOT NULL,
  `correo_usuario`        VARCHAR(100) NOT NULL,
  `contrasena_usuario`    VARCHAR(255) NOT NULL,
  `rol_usuario`           ENUM('Recepcionista', 'Entrenador', 'Administrador') NOT NULL,
  `estado_cuenta_usuario` ENUM('Pendiente', 'Activo', 'Rechazado') NOT NULL DEFAULT 'Pendiente',
  `fecha_registro`        DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id_usuario`),
  UNIQUE INDEX `correo_usuario_UNIQUE` (`correo_usuario` ASC)
) ENGINE = InnoDB;


-- =====================================================
-- 2. AFILIADO
--    Todos los atributos dependen directamente de
--    id_afiliado. Los campos de auditoría
--    (fecha_ultima_modificacion, fecha_ultimo_cambio_estado,
--    registrado_por) son hechos propios del afiliado,
--    no hay dependencia transitiva.
--    peso y porcentaje_grasa eliminados (redundantes
--    con PROGRESO_FISICO). estatura se conserva
--    porque no cambia y no está en PROGRESO_FISICO.
-- =====================================================
CREATE TABLE IF NOT EXISTS `AFILIADO` (
  `id_afiliado`                     INT NOT NULL AUTO_INCREMENT,
  `nombres_afiliado`                VARCHAR(45) NOT NULL,
  `apellidos_afiliado`              VARCHAR(45) NOT NULL,
  `documento_afiliado`              BIGINT(20) NOT NULL,
  `fecha_nacimiento_afiliado`       DATE NOT NULL CHECK (`fecha_nacimiento_afiliado` >= '1900-01-01'),
  `sexo_afiliado`                   ENUM('Femenino', 'Masculino') NOT NULL,
  `correo_afiliado`                 VARCHAR(100) NOT NULL,
  `direccion_afiliado`              VARCHAR(70) NOT NULL,
  `telefono_afiliado`               VARCHAR(15) NOT NULL,
  `estatura_afiliado`               DECIMAL(5,2) NOT NULL CHECK (`estatura_afiliado` BETWEEN 100.00 AND 250.00),
  -- peso y porcentaje_grasa se eliminan: son redundantes con PROGRESO_FISICO.
  -- El primer registro de PROGRESO_FISICO (ciclo 1) sirve como baseline.
  -- estatura_afiliado se conserva porque NO cambia y no está en PROGRESO_FISICO.
  `objetivo_fisico_afiliado`        ENUM('Pérdida de grasa','Aumento de masa','Mantenimiento') NOT NULL,
  `grupo_muscular_prioritario`      ENUM('Piernas','Pecho','Espalda','Hombros','Bíceps','Tríceps','Core','Glúteos') NULL,
  `nivel_experiencia_afiliado`      ENUM('Principiante','Intermedio','Avanzado') NOT NULL,
  `disponibilidad_semanal_afiliado` TINYINT(4) NOT NULL CHECK (`disponibilidad_semanal_afiliado` BETWEEN 1 AND 7),
  `estado_afiliacion`               ENUM('Activo','Inactivo') NOT NULL DEFAULT 'Activo',
  `fecha_registro_afiliado`         DATE NOT NULL DEFAULT (CURRENT_DATE),
  `fecha_ultima_modificacion`       DATETIME NULL,
  `fecha_ultimo_cambio_estado`      DATETIME NULL,
  `registrado_por`                  INT NOT NULL,
  PRIMARY KEY (`id_afiliado`),
  UNIQUE INDEX `documento_afiliado_UNIQUE` (`documento_afiliado` ASC),
  UNIQUE INDEX `correo_afiliado_UNIQUE` (`correo_afiliado` ASC),
  CONSTRAINT `fk_afiliado_registrado_por`
    FOREIGN KEY (`registrado_por`) REFERENCES `USUARIO` (`id_usuario`)
    ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE = InnoDB;


-- =====================================================
-- 3. RESTRICCION
--    efecto_relevante depende directamente de
--    id_restriccion, no de tipo_restriccion.
--    nombre_restriccion con UNIQUE para evitar
--    duplicados que generarían ambigüedad en el
--    motor automático de planes.
-- =====================================================
CREATE TABLE IF NOT EXISTS `RESTRICCION` (
  `id_restriccion`     INT NOT NULL AUTO_INCREMENT,
  `nombre_restriccion` VARCHAR(100) NOT NULL,
  `tipo_restriccion`   ENUM('Enfermedad','Lesión','Alergia','Medicamento','Otra') NOT NULL,
  `efecto_relevante`   VARCHAR(100) NULL,
  PRIMARY KEY (`id_restriccion`),
  UNIQUE INDEX `nombre_restriccion_UNIQUE` (`nombre_restriccion` ASC)
) ENGINE = InnoDB;


-- =====================================================
-- 4. AFILIADO_RESTRICCION
--    Tabla pivot N:M entre AFILIADO y RESTRICCION.
--    Registra qué restricciones médicas, lesiones,
--    alergias o medicamentos tiene cada afiliado.
--    PK compuesta garantiza que cada par
--    (afiliado, restriccion) sea único.
-- =====================================================
CREATE TABLE IF NOT EXISTS `AFILIADO_RESTRICCION` (
  `id_afiliado`    INT NOT NULL,
  `id_restriccion` INT NOT NULL,
  PRIMARY KEY (`id_afiliado`, `id_restriccion`),
  CONSTRAINT `fk_afilrest_afiliado`
    FOREIGN KEY (`id_afiliado`) REFERENCES `AFILIADO` (`id_afiliado`)
    ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT `fk_afilrest_restriccion`
    FOREIGN KEY (`id_restriccion`) REFERENCES `RESTRICCION` (`id_restriccion`)
    ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE = InnoDB;


-- =====================================================
-- 5. EJERCICIO
--    nombre_ejercicio con UNIQUE para evitar duplicados
--    que romperían el motor automático de rutinas.
-- =====================================================
CREATE TABLE IF NOT EXISTS `EJERCICIO` (
  `id_ejercicio`     INT NOT NULL AUTO_INCREMENT,
  `nombre_ejercicio` VARCHAR(45) NOT NULL,
  `grupo_muscular`   ENUM('Piernas','Pecho','Espalda','Hombros','Bíceps','Tríceps','Core','Glúteos') NOT NULL,
  `descripcion`      VARCHAR(120) NULL,
  `nivel_minimo`     ENUM('Principiante','Intermedio','Avanzado') NOT NULL,
  PRIMARY KEY (`id_ejercicio`),
  UNIQUE INDEX `nombre_ejercicio_UNIQUE` (`nombre_ejercicio` ASC)
) ENGINE = InnoDB;


-- =====================================================
-- 6. EJERCICIO_RESTRICCION_EXCLUIDA
--    Tabla pivot N:M entre EJERCICIO y RESTRICCION.
--    Indica qué ejercicios deben excluirse cuando un
--    afiliado tiene una restricción determinada.
--    El motor automático consulta esta tabla para
--    filtrar ejercicios incompatibles con el perfil.
-- =====================================================
CREATE TABLE IF NOT EXISTS `EJERCICIO_RESTRICCION_EXCLUIDA` (
  `id_ejercicio`   INT NOT NULL,
  `id_restriccion` INT NOT NULL,
  PRIMARY KEY (`id_ejercicio`, `id_restriccion`),
  CONSTRAINT `fk_ejrest_ejercicio`
    FOREIGN KEY (`id_ejercicio`) REFERENCES `EJERCICIO` (`id_ejercicio`)
    ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT `fk_ejrest_restriccion`
    FOREIGN KEY (`id_restriccion`) REFERENCES `RESTRICCION` (`id_restriccion`)
    ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE = InnoDB;


-- =====================================================
-- 7. ALIMENTO
--    calorias_por_100g eliminado (atributo derivado,
--    viola 3FN). Se calcula en VIEW alimento_con_calorias.
--    nombre_alimento con UNIQUE para evitar duplicados
--    que confundirían al motor nutricional automático.
-- =====================================================
CREATE TABLE IF NOT EXISTS `ALIMENTO` (
  `id_alimento`       INT NOT NULL AUTO_INCREMENT,
  `nombre_alimento`   VARCHAR(50) NOT NULL,
  -- calorias_por_100g se elimina: es atributo DERIVADO (viola 3FN).
  -- Dependencia transitiva: id_alimento → {proteinas, carbohidratos, grasas} → calorias
  -- Fórmula: (proteinas × 4) + (carbohidratos × 4) + (grasas × 9)
  -- Se calcula mediante la VIEW alimento_con_calorias definida más abajo.
  `proteinas`         DECIMAL(5,2) NOT NULL CHECK (`proteinas` >= 0),
  `carbohidratos`     DECIMAL(5,2) NOT NULL CHECK (`carbohidratos` >= 0),
  `grasas`            DECIMAL(5,2) NOT NULL CHECK (`grasas` >= 0),
  PRIMARY KEY (`id_alimento`),
  UNIQUE INDEX `nombre_alimento_UNIQUE` (`nombre_alimento` ASC)
) ENGINE = InnoDB;

-- VIEW que expone las calorías calculadas sin almacenarlas
-- Usar esta vista en cualquier consulta que necesite calorías
CREATE OR REPLACE VIEW `alimento_con_calorias` AS
  SELECT
    `id_alimento`,
    `nombre_alimento`,
    `proteinas`,
    `carbohidratos`,
    `grasas`,
    ROUND((`proteinas` * 4) + (`carbohidratos` * 4) + (`grasas` * 9), 2) AS `calorias_por_100g`
  FROM `ALIMENTO`;


-- =====================================================
-- 8. ALIMENTO_RESTRICCION_EXCLUIDA
--    Tabla pivot N:M entre ALIMENTO y RESTRICCION.
--    Indica qué alimentos deben excluirse cuando un
--    afiliado tiene una restricción determinada
--    (alergias, intolerancias, interacciones con
--    medicamentos, etc.).
-- =====================================================
CREATE TABLE IF NOT EXISTS `ALIMENTO_RESTRICCION_EXCLUIDA` (
  `id_alimento`    INT NOT NULL,
  `id_restriccion` INT NOT NULL,
  PRIMARY KEY (`id_alimento`, `id_restriccion`),
  CONSTRAINT `fk_alrest_alimento`
    FOREIGN KEY (`id_alimento`) REFERENCES `ALIMENTO` (`id_alimento`)
    ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT `fk_alrest_restriccion`
    FOREIGN KEY (`id_restriccion`) REFERENCES `RESTRICCION` (`id_restriccion`)
    ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE = InnoDB;


-- =====================================================
-- 9. CICLO
--    Describe el período de entrenamiento de un
--    afiliado. Se eliminó numero_ciclo: es un dato
--    calculable (COUNT de ciclos anteriores del
--    afiliado) y su almacenamiento genera anomalías
--    de inserción. Se obtiene con la app o una VIEW.
-- =====================================================
CREATE TABLE IF NOT EXISTS `CICLO` (
  `id_ciclo`           INT NOT NULL AUTO_INCREMENT,
  `id_afiliado`        INT NOT NULL,
  `fecha_inicio_ciclo` DATE NOT NULL,
  `fecha_fin_ciclo`    DATE NOT NULL,
  `activo`             TINYINT(1) NOT NULL DEFAULT 1 CHECK (`activo` IN (0, 1)),
  `fecha_creacion`     DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id_ciclo`),
  -- Un afiliado no puede tener dos ciclos que empiecen el mismo día
  UNIQUE INDEX `uq_ciclo_afiliado_inicio` (`id_afiliado`, `fecha_inicio_ciclo`),
  -- La fecha de fin siempre debe ser posterior a la de inicio
  CONSTRAINT `chk_ciclo_fechas` CHECK (`fecha_fin_ciclo` > `fecha_inicio_ciclo`),
  CONSTRAINT `fk_ciclo_afiliado`
    FOREIGN KEY (`id_afiliado`) REFERENCES `AFILIADO` (`id_afiliado`)
    ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE = InnoDB;

-- VIEW auxiliar 9b: número de ciclo calculado por afiliado
-- (numero_ciclo fue eliminado de CICLO por ser dato calculable)
CREATE OR REPLACE VIEW `ciclo_con_numero` AS
  SELECT
    c1.`id_ciclo`,
    c1.`id_afiliado`,
    c1.`fecha_inicio_ciclo`,
    c1.`fecha_fin_ciclo`,
    c1.`activo`,
    c1.`fecha_creacion`,
    COUNT(c2.`id_ciclo`) AS `numero_ciclo`
  FROM `CICLO` c1
  JOIN `CICLO` c2
    ON c2.`id_afiliado` = c1.`id_afiliado`
   AND c2.`fecha_inicio_ciclo` <= c1.`fecha_inicio_ciclo`
  GROUP BY
    c1.`id_ciclo`,
    c1.`id_afiliado`,
    c1.`fecha_inicio_ciclo`,
    c1.`fecha_fin_ciclo`,
    c1.`activo`,
    c1.`fecha_creacion`;


-- =====================================================
-- 10. PLAN_ENTRENAMIENTO
--     NUEVO (extraído de CICLO).
--     Relación 1:1 con CICLO.
--     Cada ciclo tiene exactamente un plan de
--     entrenamiento con sus propios atributos y
--     su propio modificado_por independiente.
-- =====================================================
CREATE TABLE IF NOT EXISTS `PLAN_ENTRENAMIENTO` (
  `id_plan_entrenamiento` INT NOT NULL AUTO_INCREMENT,
  `id_ciclo`              INT NOT NULL,
  `es_automatico`         TINYINT(1) NOT NULL DEFAULT 1 CHECK (`es_automatico` IN (0, 1)),
  `modificado_por`        INT NULL,
  `observaciones`         VARCHAR(300) NULL,
  PRIMARY KEY (`id_plan_entrenamiento`),
  UNIQUE INDEX `id_ciclo_UNIQUE` (`id_ciclo` ASC),
  CONSTRAINT `fk_planen_ciclo`
    FOREIGN KEY (`id_ciclo`) REFERENCES `CICLO` (`id_ciclo`)
    ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT `fk_planen_usuario`
    FOREIGN KEY (`modificado_por`) REFERENCES `USUARIO` (`id_usuario`)
    ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE = InnoDB;


-- =====================================================
-- 11. PLAN_NUTRICIONAL
--     NUEVO (extraído de CICLO).
--     Relación 1:1 con CICLO.
--     Cada ciclo tiene exactamente un plan
--     nutricional con sus propios atributos y
--     su propio modificado_por independiente.
-- =====================================================
CREATE TABLE IF NOT EXISTS `PLAN_NUTRICIONAL` (
  `id_plan_nutricional` INT NOT NULL AUTO_INCREMENT,
  `id_ciclo`            INT NOT NULL,
  `calorias_estimadas`  DECIMAL(7,2) NOT NULL CHECK (`calorias_estimadas` BETWEEN 500.00 AND 10000.00),
  `num_comidas_diarias` TINYINT(4) NOT NULL CHECK (`num_comidas_diarias` BETWEEN 1 AND 10),
  `es_automatico`       TINYINT(1) NOT NULL DEFAULT 1 CHECK (`es_automatico` IN (0, 1)),
  `modificado_por`      INT NULL,
  `observaciones`       VARCHAR(300) NULL,
  PRIMARY KEY (`id_plan_nutricional`),
  UNIQUE INDEX `id_ciclo_UNIQUE` (`id_ciclo` ASC),
  CONSTRAINT `fk_plannut_ciclo`
    FOREIGN KEY (`id_ciclo`) REFERENCES `CICLO` (`id_ciclo`)
    ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT `fk_plannut_usuario`
    FOREIGN KEY (`modificado_por`) REFERENCES `USUARIO` (`id_usuario`)
    ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE = InnoDB;


-- =====================================================
-- 12. RUTINA
--     CAMBIO 3FN: Se eliminó dia_semana porque es
--     un atributo derivado:
--       dia_semana = f(fecha_inicio_ciclo, dia_numero)
--     Es decir: id_rutina → id_plan → id_ciclo →
--     fecha_inicio_ciclo + dia_numero → dia_semana.
--     Almacenarlo genera anomalías de actualización
--     (si cambia fecha_inicio_ciclo, dia_semana
--     quedaría desactualizado). Se calcula en la app.
--
--     Ahora referencia PLAN_ENTRENAMIENTO directamente.
-- =====================================================
CREATE TABLE IF NOT EXISTS `RUTINA` (
  `id_rutina`             INT NOT NULL AUTO_INCREMENT,
  `id_plan_entrenamiento` INT NOT NULL,
  `nombre_rutina`         VARCHAR(100) NOT NULL,
  `enfoque_muscular`      ENUM('Piernas','Pecho','Espalda','Hombros','Bíceps','Tríceps','Core','Glúteos','Full Body','Empuje','Jale') NOT NULL,
  `dia_numero`            TINYINT(4) NOT NULL CHECK (`dia_numero` BETWEEN 1 AND 7),
  PRIMARY KEY (`id_rutina`),
  -- Un plan no puede tener dos rutinas asignadas al mismo día
  UNIQUE INDEX `uq_rutina_plan_dia` (`id_plan_entrenamiento`, `dia_numero`),
  CONSTRAINT `fk_rutina_plan`
    FOREIGN KEY (`id_plan_entrenamiento`) REFERENCES `PLAN_ENTRENAMIENTO` (`id_plan_entrenamiento`)
    ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE = InnoDB;


-- =====================================================
-- 13. RUTINA_EJERCICIO
--     PK natural: (id_rutina, id_ejercicio).
--     El surrogate id_rutina_ejercicio se elimina:
--     ninguna tabla lo referenciaba como FK y la
--     clave natural ya identifica cada fila sin
--     ambigüedad. Además, usar la clave natural como
--     PK previene que el motor automático asigne el
--     mismo ejercicio dos veces en la misma rutina
--     (sería redundancia de dato).
--     UNIQUE (id_rutina, orden) garantiza que no haya
--     dos ejercicios en la misma posición.
-- =====================================================
CREATE TABLE IF NOT EXISTS `RUTINA_EJERCICIO` (
  `id_rutina`    INT NOT NULL,
  `id_ejercicio` INT NOT NULL,
  `series`       INT NOT NULL CHECK (`series` >= 1),
  `repeticiones` INT NOT NULL CHECK (`repeticiones` >= 1),
  `orden`        INT NOT NULL CHECK (`orden` >= 1),
  PRIMARY KEY (`id_rutina`, `id_ejercicio`),
  -- No pueden existir dos ejercicios en la misma posición de la misma rutina
  UNIQUE INDEX `uq_rutejec_rutina_orden` (`id_rutina`, `orden`),
  CONSTRAINT `fk_rutejec_rutina`
    FOREIGN KEY (`id_rutina`) REFERENCES `RUTINA` (`id_rutina`)
    ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT `fk_rutejec_ejercicio`
    FOREIGN KEY (`id_ejercicio`) REFERENCES `EJERCICIO` (`id_ejercicio`)
    ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE = InnoDB;


-- =====================================================
-- 14. DETALLE_NUTRICIONAL
--     PK natural: (id_plan_nutricional, id_alimento,
--     numero_comida). El surrogate id_detalle se
--     elimina: ninguna tabla lo referenciaba como FK
--     y la clave natural ya identifica cada fila.
--     Referencia PLAN_NUTRICIONAL (no CICLO) siguiendo
--     la separación de entidades correcta.
-- =====================================================
CREATE TABLE IF NOT EXISTS `DETALLE_NUTRICIONAL` (
  `id_plan_nutricional` INT NOT NULL,
  `id_alimento`         INT NOT NULL,
  `numero_comida`       TINYINT(4) NOT NULL CHECK (`numero_comida` >= 1),
  `cantidad`            DECIMAL(6,2) NOT NULL CHECK (`cantidad` > 0),
  PRIMARY KEY (`id_plan_nutricional`, `id_alimento`, `numero_comida`),
  CONSTRAINT `fk_detnut_plan`
    FOREIGN KEY (`id_plan_nutricional`) REFERENCES `PLAN_NUTRICIONAL` (`id_plan_nutricional`)
    ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT `fk_detnut_alimento`
    FOREIGN KEY (`id_alimento`) REFERENCES `ALIMENTO` (`id_alimento`)
    ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE = InnoDB;


-- =====================================================
-- 15. PROGRESO_FISICO
--     3FN: id_afiliado eliminado (transitivo via CICLO).
--     PK natural: (id_ciclo, fecha_registro).
--     El surrogate id_progreso se elimina: ninguna
--     tabla lo referenciaba como FK, y la clave
--     natural (id_ciclo, fecha_registro) identifica
--     unívocamente cada medición — mismo patrón
--     corregido en RUTINA_EJERCICIO y DETALLE_NUTRICIONAL.
--     registrado_por NOT NULL para auditoría completa.
-- =====================================================
CREATE TABLE IF NOT EXISTS `PROGRESO_FISICO` (
  `id_ciclo`         INT NOT NULL,
  `fecha_registro`   DATE NOT NULL,
  `peso`             DECIMAL(5,2) NOT NULL CHECK (`peso` BETWEEN 20.00 AND 300.00),
  `porcentaje_grasa` DECIMAL(4,2) NULL CHECK (`porcentaje_grasa` BETWEEN 3.00 AND 60.00),
  `medida_cintura`   DECIMAL(5,2) NULL CHECK (`medida_cintura` > 0),
  `medida_brazo`     DECIMAL(5,2) NULL CHECK (`medida_brazo` > 0),
  `medida_pierna`    DECIMAL(5,2) NULL CHECK (`medida_pierna` > 0),
  `observaciones`    VARCHAR(300) NULL,
  `registrado_por`   INT NOT NULL,
  PRIMARY KEY (`id_ciclo`, `fecha_registro`),
  CONSTRAINT `fk_progreso_ciclo`
    FOREIGN KEY (`id_ciclo`) REFERENCES `CICLO` (`id_ciclo`)
    ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT `fk_progreso_usuario`
    FOREIGN KEY (`registrado_por`) REFERENCES `USUARIO` (`id_usuario`)
    ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE = InnoDB;
