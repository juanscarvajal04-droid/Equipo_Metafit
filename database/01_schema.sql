-- ============================================================================================================================
-- TITULO DE INVESTIGACION:
-- "Disenar, Normalizar e Implementar un Esquema de Base de Datos Relacional en Tercera Forma Normal
--  para Gestionar Afiliados, Ciclos de Entrenamiento y Planes Nutricionales del Sistema MetaFit
--  Aplicando Patrones de Herencia de Entidades, Indices de Rendimiento e Integridad Referencial
--  como Soporte Tecnologico al Gimnasio Sport Gym Sede 80, Bogota, 2025."
-- ============================================================================================================================
-- Proyecto      : MetaFit - Sistema de Gestion Deportiva
-- Cliente       : Sport Gym Sede 80, Bogota, Colombia
-- Equipo        : Sofia Astudillo - Kevin S. Robayo - Carlos Rodrigues - Juan S. Carvajal
-- Version       : 4.0 - Arquitectura de Produccion (Migrado desde NoSQL)
-- Motor         : MySQL 8.0+ (InnoDB, utf8mb4)
-- Normalizacion : 3FN estricta
-- Patron        : Herencia Super-tipo / Sub-tipo (USUARIO -> AFILIADO)
-- Docker        : Compatible con /docker-entrypoint-initdb.d/ (ejecutado automaticamente)
-- Fecha         : 2026
-- ============================================================================================================================
--
-- DECISIONES ARQUITECTURALES:
--
-- [A1] HERENCIA USUARIO/AFILIADO
--      USUARIO centraliza autenticacion para todo el personal y afiliados.
--      AFILIADO.id_usuario es PK y FK -> USUARIO. Patron sub-tipo/super-tipo.
--
-- [A2] ANTIPATRON YAGNI ELIMINADO
--      Se elimino el campo es_automatico del JSON NoSQL. El entrenador crea todo
--      manualmente. El sistema solo asiste bloqueando ejercicios/alimentos
--      incompatibles con restricciones medicas.
--
-- [A3] CAMPOS CALCULADOS -> VISTAS Y BACKEND (no se almacenan en tablas fisicas)
--      - edad          : TIMESTAMPDIFF(YEAR, fecha_nacimiento, CURDATE())
--      - imc           : peso_kg / POW(estatura_cm/100, 2)
--      - calorias/100g : (proteinas*4) + (carbohidratos*4) + (grasas*9)  -> VIEW v_alimento_calorias
--      - numero_ciclo  : COUNT de ciclos anteriores del afiliado          -> VIEW v_ciclo_activo_afiliado
--      - dias_restantes: DATEDIFF(fecha_fin, CURDATE())                   -> VIEW v_ciclo_activo_afiliado
--
-- [A4] ON DELETE RESTRICT en todas las relaciones criticas
--      Los borrados se controlan desde la API, no en cascada por la BD.
--
-- [A5] INDICES EXPLICITOS en FKs de tablas de alto volumen
--      MySQL NO crea indices automaticamente en FKs. Sin ellos los JOINs son O(n).
--
-- [A6] NORMALIZACION DEL JSON NoSQL (documentos anidados -> tablas relacionales)
--      JSON.afiliados[].restricciones        -> AFILIADO_RESTRICCION (pivot N:M)
--      JSON.afiliados[].ciclos[]             -> CICLO (1:N con AFILIADO)
--      JSON.ciclos[].plan_entrenamiento      -> PLAN_ENTRENAMIENTO (1:1 con CICLO via PK=FK)
--      JSON.plan_entrenamiento.rutinas[]     -> RUTINA (1:N con PLAN_ENTRENAMIENTO)
--      JSON.rutinas[].ejercicios[]           -> RUTINA_EJERCICIO (pivot N:M con orden)
--      JSON.ciclos[].plan_nutricional        -> PLAN_NUTRICIONAL (1:1 con CICLO via PK=FK)
--      JSON.plan_nutricional.detalle[]       -> DETALLE_NUTRICIONAL (1:N con PLAN_NUTRICIONAL)
--      JSON.ciclos[].progreso_fisico[]       -> PROGRESO_FISICO (1:N con CICLO)
--      JSON.ejercicios[].restricciones_excl  -> EJERCICIO_RESTRICCION_EXCLUIDA (pivot N:M)
--      JSON.alimentos[].restricciones_excl   -> ALIMENTO_RESTRICCION_EXCLUIDA (pivot N:M)
--
-- ============================================================================================================================

-- Compatibilidad Docker: crear y seleccionar la BD de forma idempotente
CREATE SCHEMA IF NOT EXISTS `metafit` DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE `metafit`;

-- Desactivar checks durante la creacion para evitar conflictos de orden de FK
SET FOREIGN_KEY_CHECKS = 0;


-- ============================================================================================================================
-- BLOQUE 1 - USUARIO (super-tipo central de autenticacion)
-- Cubre: personal del gym (Administrador, Recepcionista, Entrenador) y Afiliados.
-- La autenticacion de TODOS los roles pasa por esta tabla.
-- ============================================================================================================================

CREATE TABLE IF NOT EXISTS `USUARIO` (
  `id_usuario`     INT          NOT NULL AUTO_INCREMENT,
  `nombres`        VARCHAR(60)  NOT NULL,
  `apellidos`      VARCHAR(60)  NOT NULL,
  `correo`         VARCHAR(100) NOT NULL,
  `contrasena`     VARCHAR(255) NOT NULL COMMENT 'Hash bcrypt 12 rondas. Nunca texto plano.',
  `rol`            ENUM('Administrador','Recepcionista','Entrenador','Afiliado') NOT NULL,
  `estado`         ENUM('Activo','Inactivo','Pendiente') NOT NULL DEFAULT 'Pendiente',
  `fecha_registro` DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,

  PRIMARY KEY (`id_usuario`),
  UNIQUE INDEX `uq_usuario_correo` (`correo`)

) ENGINE = InnoDB
  COMMENT = 'Super-tipo central. Herencia hacia AFILIADO para clientes del gym. Passwords en bcrypt.';


-- ============================================================================================================================
-- BLOQUE 2 - CATALOGOS BASE
-- Tablas maestras independientes: no tienen FK hacia otras tablas de negocio.
-- Orden de creacion: primero los catalogos, luego las tablas que los referencian.
-- ============================================================================================================================

-- RESTRICCION: catalogo unificado de condiciones medicas, lesiones, alergias y medicamentos.
-- Originado en JSON.afiliados[].restricciones[].tipo y JSON.ejercicios[].restricciones_excluidas[].tipo
CREATE TABLE IF NOT EXISTS `RESTRICCION` (
  `id_restriccion`     INT          NOT NULL AUTO_INCREMENT,
  `nombre_restriccion` VARCHAR(120) NOT NULL,
  `tipo`               ENUM('Enfermedad','Lesion','Alergia','Medicamento','Otra') NOT NULL,
  `efecto_relevante`   VARCHAR(200) NULL,

  PRIMARY KEY (`id_restriccion`),
  UNIQUE INDEX `uq_restriccion_nombre` (`nombre_restriccion`)

) ENGINE = InnoDB
  COMMENT = 'Catalogo de condiciones medicas, lesiones, alergias y medicamentos.';


-- EJERCICIO: catalogo maestro de ejercicios.
-- Originado en JSON.ejercicios[]. El campo restricciones_excluidas[] se normaliza
-- en la tabla pivot EJERCICIO_RESTRICCION_EXCLUIDA.
CREATE TABLE IF NOT EXISTS `EJERCICIO` (
  `id_ejercicio`     INT          NOT NULL AUTO_INCREMENT,
  `nombre_ejercicio` VARCHAR(80)  NOT NULL,
  `grupo_muscular`   ENUM('Piernas','Pecho','Espalda','Hombros','Biceps','Triceps','Core','Gluteos') NOT NULL,
  `descripcion`      VARCHAR(200) NULL,
  `nivel_minimo`     ENUM('Principiante','Intermedio','Avanzado') NOT NULL DEFAULT 'Principiante',

  PRIMARY KEY (`id_ejercicio`),
  UNIQUE INDEX `uq_ejercicio_nombre` (`nombre_ejercicio`)

) ENGINE = InnoDB
  COMMENT = 'Catalogo de ejercicios. El entrenador selecciona al armar rutinas.';


-- ALIMENTO: catalogo con macros por 100g.
-- Las calorias se calculan con formula Atwater en la VIEW v_alimento_calorias (no se almacenan).
-- Originado en JSON.alimentos[]. El campo restricciones_excluidas[] se normaliza
-- en ALIMENTO_RESTRICCION_EXCLUIDA.
CREATE TABLE IF NOT EXISTS `ALIMENTO` (
  `id_alimento`     INT          NOT NULL AUTO_INCREMENT,
  `nombre_alimento` VARCHAR(80)  NOT NULL,
  `proteinas`       DECIMAL(6,2) NOT NULL CHECK (`proteinas`     >= 0),
  `carbohidratos`   DECIMAL(6,2) NOT NULL CHECK (`carbohidratos` >= 0),
  `grasas`          DECIMAL(6,2) NOT NULL CHECK (`grasas`        >= 0),

  PRIMARY KEY (`id_alimento`),
  UNIQUE INDEX `uq_alimento_nombre` (`nombre_alimento`)

) ENGINE = InnoDB
  COMMENT = 'Macros por 100g. Calorias calculadas en VIEW v_alimento_calorias (Atwater). No se almacenan.';


-- ============================================================================================================================
-- BLOQUE 3 - AFILIADO (sub-tipo de USUARIO)
-- Su PK es id_usuario, que apunta a USUARIO. Patron herencia 1:1.
-- Solo contiene datos estaticos del afiliado.
-- Datos dinamicos (objetivo, nivel, disponibilidad) van en CICLO (evita dependencia transitiva -> 3FN).
-- Originado en JSON.afiliados[]. Los campos objetivo_fisico, nivel_experiencia,
-- disponibilidad_semanal_dias se mueven a CICLO por ser dependientes del ciclo, no del afiliado.
-- ============================================================================================================================

CREATE TABLE IF NOT EXISTS `AFILIADO` (
  `id_usuario`                INT          NOT NULL,
  `documento`                 VARCHAR(20)  NULL,
  `fecha_nacimiento`          DATE         NULL,
  `sexo`                      ENUM('Masculino','Femenino','Otro') NOT NULL,
  `telefono`                  VARCHAR(20)  NULL DEFAULT '',
  `direccion`                 VARCHAR(100) NULL DEFAULT '',
  `estatura_cm`               DECIMAL(5,2) NULL,
  `estado_afiliacion`         ENUM('Activo','Inactivo','Suspendido') NOT NULL DEFAULT 'Activo',
  `fecha_registro`            DATE         NOT NULL DEFAULT (CURRENT_DATE),
  `fecha_ultima_modificacion` DATETIME     NULL,
  `registrado_por`            INT          NOT NULL,

  PRIMARY KEY (`id_usuario`),
  UNIQUE INDEX `uq_afiliado_documento` (`documento`),

  CONSTRAINT `fk_afiliado_usuario`
    FOREIGN KEY (`id_usuario`)
    REFERENCES `USUARIO` (`id_usuario`)
    ON DELETE RESTRICT ON UPDATE CASCADE,

  CONSTRAINT `fk_afiliado_registrado_por`
    FOREIGN KEY (`registrado_por`)
    REFERENCES `USUARIO` (`id_usuario`)
    ON DELETE RESTRICT ON UPDATE CASCADE

) ENGINE = InnoDB
  COMMENT = 'Sub-tipo de USUARIO. Solo datos estaticos. Objetivo/nivel/disponibilidad en CICLO (3FN).';


-- ============================================================================================================================
-- BLOQUE 4 - TABLAS PIVOT DE RESTRICCIONES MEDICAS
-- Normalizan los arrays anidados del JSON (restricciones_excluidas[]) a relaciones N:M.
-- ============================================================================================================================

-- Restricciones activas de cada afiliado (ingresadas por la recepcionista al registro).
-- Originado en JSON.afiliados[].restricciones[]
CREATE TABLE IF NOT EXISTS `AFILIADO_RESTRICCION` (
  `id_usuario`     INT NOT NULL,
  `id_restriccion` INT NOT NULL,

  PRIMARY KEY (`id_usuario`, `id_restriccion`),

  CONSTRAINT `fk_afilrest_afiliado`
    FOREIGN KEY (`id_usuario`)
    REFERENCES `AFILIADO` (`id_usuario`)
    ON DELETE RESTRICT ON UPDATE CASCADE,

  CONSTRAINT `fk_afilrest_restriccion`
    FOREIGN KEY (`id_restriccion`)
    REFERENCES `RESTRICCION` (`id_restriccion`)
    ON DELETE RESTRICT ON UPDATE CASCADE

) ENGINE = InnoDB
  COMMENT = 'Restricciones activas del afiliado. Consultada por middleware antes de asignar ejercicios.';


-- Ejercicios prohibidos por cada restriccion medica.
-- Originado en JSON.ejercicios[].restricciones_excluidas[]
CREATE TABLE IF NOT EXISTS `EJERCICIO_RESTRICCION_EXCLUIDA` (
  `id_ejercicio`   INT NOT NULL,
  `id_restriccion` INT NOT NULL,

  PRIMARY KEY (`id_ejercicio`, `id_restriccion`),

  CONSTRAINT `fk_ejrest_ejercicio`
    FOREIGN KEY (`id_ejercicio`)
    REFERENCES `EJERCICIO` (`id_ejercicio`)
    ON DELETE RESTRICT ON UPDATE CASCADE,

  CONSTRAINT `fk_ejrest_restriccion`
    FOREIGN KEY (`id_restriccion`)
    REFERENCES `RESTRICCION` (`id_restriccion`)
    ON DELETE RESTRICT ON UPDATE CASCADE

) ENGINE = InnoDB
  COMMENT = 'Ejercicios prohibidos por restriccion. Consultada por middleware antes de asignar rutinas.';


-- Alimentos prohibidos por cada restriccion medica.
-- Originado en JSON.alimentos[].restricciones_excluidas[]
CREATE TABLE IF NOT EXISTS `ALIMENTO_RESTRICCION_EXCLUIDA` (
  `id_alimento`    INT NOT NULL,
  `id_restriccion` INT NOT NULL,

  PRIMARY KEY (`id_alimento`, `id_restriccion`),

  CONSTRAINT `fk_alrest_alimento`
    FOREIGN KEY (`id_alimento`)
    REFERENCES `ALIMENTO` (`id_alimento`)
    ON DELETE RESTRICT ON UPDATE CASCADE,

  CONSTRAINT `fk_alrest_restriccion`
    FOREIGN KEY (`id_restriccion`)
    REFERENCES `RESTRICCION` (`id_restriccion`)
    ON DELETE RESTRICT ON UPDATE CASCADE

) ENGINE = InnoDB
  COMMENT = 'Alimentos prohibidos por restriccion. Consultada por middleware antes de asignar planes.';


-- ============================================================================================================================
-- BLOQUE 5 - CICLO (perfil dinamico del afiliado por macrociclo)
-- Originado en JSON.afiliados[].ciclos[].
-- Contiene objetivo, nivel y disponibilidad porque CAMBIAN en cada ciclo.
-- Almacenarlos en AFILIADO seria una dependencia transitiva -> viola 3FN.
-- ============================================================================================================================

CREATE TABLE IF NOT EXISTS `CICLO` (
  `id_ciclo`                   INT          NOT NULL AUTO_INCREMENT,
  `id_usuario`                 INT          NOT NULL,
  `fecha_inicio`               DATE         NOT NULL,
  `fecha_fin`                  DATE         NOT NULL,
  `activo`                     TINYINT(1)   NOT NULL DEFAULT 1 CHECK (`activo` IN (0, 1)),
  `objetivo_fisico`            ENUM('Perdida de grasa','Aumento de masa','Mantenimiento','Rehabilitacion') NOT NULL,
  `grupo_muscular_prioritario` ENUM('Piernas','Pecho','Espalda','Hombros','Biceps','Triceps','Core','Gluteos') NULL,
  `nivel_experiencia`          ENUM('Principiante','Intermedio','Avanzado') NOT NULL,
  `disponibilidad_dias`        TINYINT      NOT NULL CHECK (`disponibilidad_dias` BETWEEN 1 AND 7),
  `observaciones`              VARCHAR(400) NULL,
  `fecha_creacion`             DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `registrado_por`             INT          NOT NULL,

  PRIMARY KEY (`id_ciclo`),
  UNIQUE INDEX `uq_ciclo_afiliado_inicio` (`id_usuario`, `fecha_inicio`),

  INDEX `idx_ciclo_usuario` (`id_usuario`),
  INDEX `idx_ciclo_activo`  (`activo`),

  CONSTRAINT `chk_ciclo_fechas` CHECK (`fecha_fin` > `fecha_inicio`),

  CONSTRAINT `fk_ciclo_afiliado`
    FOREIGN KEY (`id_usuario`)
    REFERENCES `AFILIADO` (`id_usuario`)
    ON DELETE RESTRICT ON UPDATE CASCADE,

  CONSTRAINT `fk_ciclo_registrado_por`
    FOREIGN KEY (`registrado_por`)
    REFERENCES `USUARIO` (`id_usuario`)
    ON DELETE RESTRICT ON UPDATE CASCADE

) ENGINE = InnoDB
  COMMENT = 'Macrociclo de entrenamiento. Objetivo/nivel/disponibilidad cambian por ciclo (3FN).';


-- ============================================================================================================================
-- BLOQUE 6 - PLANES 1:1 CON EL CICLO
-- PK = id_ciclo (tambien FK). Garantiza relacion 1:1 sin surrogate innecesario.
-- Eliminado: campo es_automatico (JSON lo tenia, pero es antipatron YAGNI).
-- ============================================================================================================================

-- Originado en JSON.afiliados[].ciclos[].plan_entrenamiento
CREATE TABLE IF NOT EXISTS `PLAN_ENTRENAMIENTO` (
  `id_ciclo`       INT          NOT NULL,
  `modificado_por` INT          NULL,
  `observaciones`  VARCHAR(400) NULL,

  PRIMARY KEY (`id_ciclo`),

  CONSTRAINT `fk_planen_ciclo`
    FOREIGN KEY (`id_ciclo`)
    REFERENCES `CICLO` (`id_ciclo`)
    ON DELETE RESTRICT ON UPDATE CASCADE,

  CONSTRAINT `fk_planen_modificado`
    FOREIGN KEY (`modificado_por`)
    REFERENCES `USUARIO` (`id_usuario`)
    ON DELETE RESTRICT ON UPDATE CASCADE

) ENGINE = InnoDB
  COMMENT = '1:1 con CICLO via PK=FK. es_automatico eliminado (antipatron YAGNI).';


-- Originado en JSON.afiliados[].ciclos[].plan_nutricional
-- calorias_objetivo <- JSON.plan_nutricional.calorias_estimadas (renombrado: el valor es una META)
-- num_comidas       <- JSON.plan_nutricional.num_comidas_diarias
CREATE TABLE IF NOT EXISTS `PLAN_NUTRICIONAL` (
  `id_ciclo`          INT          NOT NULL,
  `calorias_objetivo` DECIMAL(8,2) NOT NULL CHECK (`calorias_objetivo` BETWEEN 500.00 AND 10000.00),
  `num_comidas`       TINYINT      NOT NULL CHECK (`num_comidas` BETWEEN 1 AND 10),
  `modificado_por`    INT          NULL,
  `observaciones`     VARCHAR(400) NULL,

  PRIMARY KEY (`id_ciclo`),

  CONSTRAINT `fk_plannut_ciclo`
    FOREIGN KEY (`id_ciclo`)
    REFERENCES `CICLO` (`id_ciclo`)
    ON DELETE RESTRICT ON UPDATE CASCADE,

  CONSTRAINT `fk_plannut_modificado`
    FOREIGN KEY (`modificado_por`)
    REFERENCES `USUARIO` (`id_usuario`)
    ON DELETE RESTRICT ON UPDATE CASCADE

) ENGINE = InnoDB
  COMMENT = '1:1 con CICLO. calorias_objetivo es meta del entrenador, no un valor calculado.';


-- ============================================================================================================================
-- BLOQUE 7 - RUTINAS Y EJERCICIOS
-- Originado en JSON.ciclos[].plan_entrenamiento.rutinas[]
-- dia_numero (1=Lunes...7=Domingo). dia_semana eliminado (era derivado -> viola 3FN).
-- ============================================================================================================================

CREATE TABLE IF NOT EXISTS `RUTINA` (
  `id_rutina`        INT          NOT NULL AUTO_INCREMENT,
  `id_ciclo`         INT          NOT NULL,
  `nombre_rutina`    VARCHAR(100) NOT NULL,
  `enfoque_muscular` ENUM('Piernas','Pecho','Espalda','Hombros','Biceps','Triceps','Core','Gluteos','Full Body','Empuje','Jale') NOT NULL,
  `dia_numero`       TINYINT      NOT NULL CHECK (`dia_numero` BETWEEN 1 AND 7),

  PRIMARY KEY (`id_rutina`),
  UNIQUE INDEX `uq_rutina_ciclo_dia` (`id_ciclo`, `dia_numero`),

  CONSTRAINT `fk_rutina_plan`
    FOREIGN KEY (`id_ciclo`)
    REFERENCES `PLAN_ENTRENAMIENTO` (`id_ciclo`)
    ON DELETE RESTRICT ON UPDATE CASCADE

) ENGINE = InnoDB
  COMMENT = 'Dia de entrenamiento. dia_numero 1=Lunes...7=Domingo. dia_semana eliminado (derivado, 3FN).';


-- Originado en JSON.rutinas[].ejercicios[]
-- PK (id_rutina, orden): permite repetir el mismo ejercicio en distintas posiciones.
-- peso_kg / descanso_seg: configuración del ejercicio DENTRO de la rutina (HU43 CA2).
--   Pertenecen aquí (no a EJERCICIO) porque varían por rutina: el mismo ejercicio
--   puede pedir 20 kg en una rutina y 30 kg en otra.
--   NULL = sin carga (ejercicio a peso corporal) / sin descanso definido.
CREATE TABLE IF NOT EXISTS `RUTINA_EJERCICIO` (
  `id_rutina`    INT NOT NULL,
  `orden`        INT NOT NULL CHECK (`orden` >= 1),
  `id_ejercicio` INT NOT NULL,
  `series`       INT NOT NULL CHECK (`series`       >= 1),
  `repeticiones` INT NOT NULL CHECK (`repeticiones` >= 1),
  `peso_kg`      DECIMAL(5,2) NULL CHECK (`peso_kg`      IS NULL OR `peso_kg`      > 0),
  `descanso_seg` INT          NULL CHECK (`descanso_seg` IS NULL OR `descanso_seg` >= 0),

  PRIMARY KEY (`id_rutina`, `orden`),
  INDEX `idx_rutejec_ejercicio` (`id_ejercicio`),

  CONSTRAINT `fk_rutejec_rutina`
    FOREIGN KEY (`id_rutina`)
    REFERENCES `RUTINA` (`id_rutina`)
    ON DELETE RESTRICT ON UPDATE CASCADE,

  CONSTRAINT `fk_rutejec_ejercicio`
    FOREIGN KEY (`id_ejercicio`)
    REFERENCES `EJERCICIO` (`id_ejercicio`)
    ON DELETE RESTRICT ON UPDATE CASCADE

) ENGINE = InnoDB
  COMMENT = 'Alto volumen. PK=(rutina,orden). Mismo ejercicio puede aparecer en distintas posiciones.';


-- ============================================================================================================================
-- BLOQUE 8 - DETALLE NUTRICIONAL
-- Originado en JSON.plan_nutricional.detalle[]
-- PK natural triple: (id_ciclo, num_comida, id_alimento). Sin surrogate innecesario.
-- cantidad_g <- JSON.detalle[].cantidad_g
-- num_comida <- JSON.detalle[].numero_comida (renombrado a snake_case consistente)
-- ============================================================================================================================

CREATE TABLE IF NOT EXISTS `DETALLE_NUTRICIONAL` (
  `id_ciclo`    INT          NOT NULL,
  `num_comida`  TINYINT      NOT NULL CHECK (`num_comida` >= 1),
  `id_alimento` INT          NOT NULL,
  `cantidad_g`  DECIMAL(7,2) NOT NULL CHECK (`cantidad_g` > 0),

  PRIMARY KEY (`id_ciclo`, `num_comida`, `id_alimento`),
  INDEX `idx_detnut_alimento` (`id_alimento`),

  CONSTRAINT `fk_detnut_plan`
    FOREIGN KEY (`id_ciclo`)
    REFERENCES `PLAN_NUTRICIONAL` (`id_ciclo`)
    ON DELETE RESTRICT ON UPDATE CASCADE,

  CONSTRAINT `fk_detnut_alimento`
    FOREIGN KEY (`id_alimento`)
    REFERENCES `ALIMENTO` (`id_alimento`)
    ON DELETE RESTRICT ON UPDATE CASCADE

) ENGINE = InnoDB
  COMMENT = 'Alto volumen. PK natural triple. INDEX en id_alimento.';


-- ============================================================================================================================
-- BLOQUE 9 - PROGRESO FISICO
-- Originado en JSON.afiliados[].ciclos[].progreso_fisico[]
-- Tabla de mayor volumen del sistema.
-- id_afiliado NO esta aqui (seria transitivo: progreso->ciclo->afiliado -> viola 3FN).
-- IMC calculado en backend: peso_kg / POW(estatura_cm/100, 2)
-- medida_cintura <- JSON.medidas_cm.cintura
-- medida_brazo   <- JSON.medidas_cm.brazo
-- medida_pierna  <- JSON.medidas_cm.pierna
-- ============================================================================================================================

CREATE TABLE IF NOT EXISTS `PROGRESO_FISICO` (
  `id_ciclo`         INT          NOT NULL,
  `fecha_registro`   DATE         NOT NULL,
  `peso_kg`          DECIMAL(5,2) NOT NULL CHECK (`peso_kg`          BETWEEN 20.00 AND 300.00),
  `porcentaje_grasa` DECIMAL(5,2) NULL      CHECK (`porcentaje_grasa` BETWEEN  3.00 AND  60.00),
  `medida_cintura`   DECIMAL(5,2) NULL      CHECK (`medida_cintura`  > 0),
  `medida_brazo`     DECIMAL(5,2) NULL      CHECK (`medida_brazo`    > 0),
  `medida_pierna`    DECIMAL(5,2) NULL      CHECK (`medida_pierna`   > 0),
  `observaciones`    VARCHAR(400) NULL,
  `registrado_por`   INT          NOT NULL,

  PRIMARY KEY (`id_ciclo`, `fecha_registro`),

  INDEX `idx_progreso_ciclo` (`id_ciclo`),
  INDEX `idx_progreso_fecha` (`fecha_registro`),

  CONSTRAINT `fk_progreso_ciclo`
    FOREIGN KEY (`id_ciclo`)
    REFERENCES `CICLO` (`id_ciclo`)
    ON DELETE RESTRICT ON UPDATE CASCADE,

  CONSTRAINT `fk_progreso_registrado`
    FOREIGN KEY (`registrado_por`)
    REFERENCES `USUARIO` (`id_usuario`)
    ON DELETE RESTRICT ON UPDATE CASCADE

) ENGINE = InnoDB
  COMMENT = 'Mayor volumen del sistema. IMC calculado en backend/VIEW. id_afiliado eliminado (transitivo, 3FN).';


-- ============================================================================================================================
-- BLOQUE 10 - VISTAS (datos derivados que no se almacenan en tablas fisicas)
-- ============================================================================================================================

-- Calorias calculadas con formula Atwater: (P*4)+(C*4)+(G*9)
CREATE OR REPLACE VIEW `v_alimento_calorias` AS
  SELECT
    `id_alimento`,
    `nombre_alimento`,
    `proteinas`,
    `carbohidratos`,
    `grasas`,
    ROUND((`proteinas` * 4) + (`carbohidratos` * 4) + (`grasas` * 9), 2) AS `calorias_por_100g`
  FROM `ALIMENTO`
  ORDER BY `nombre_alimento`;


-- Perfil completo del afiliado: USUARIO + AFILIADO + edad calculada (no almacenada)
CREATE OR REPLACE VIEW `v_perfil_afiliado` AS
  SELECT
    u.`id_usuario`,
    u.`nombres`,
    u.`apellidos`,
    u.`correo`,
    u.`estado`,
    u.`fecha_registro`       AS `fecha_registro_sistema`,
    a.`documento`,
    a.`fecha_nacimiento`,
    TIMESTAMPDIFF(YEAR, a.`fecha_nacimiento`, CURDATE()) AS `edad`,
    a.`sexo`,
    a.`telefono`,
    a.`direccion`,
    a.`estatura_cm`,
    a.`estado_afiliacion`,
    a.`fecha_registro`       AS `fecha_registro_afiliado`,
    a.`registrado_por`
  FROM `USUARIO`  u
  JOIN `AFILIADO` a ON u.`id_usuario` = a.`id_usuario`;


-- Ciclo activo con numero_ciclo calculado (no almacenado), dias restantes y % avance
CREATE OR REPLACE VIEW `v_ciclo_activo_afiliado` AS
  SELECT
    c.`id_ciclo`,
    c.`id_usuario`,
    c.`fecha_inicio`,
    c.`fecha_fin`,
    c.`objetivo_fisico`,
    c.`nivel_experiencia`,
    c.`disponibilidad_dias`,
    c.`grupo_muscular_prioritario`,
    (
      SELECT COUNT(*)
      FROM `CICLO` c2
      WHERE c2.`id_usuario`   = c.`id_usuario`
        AND c2.`fecha_inicio` <= c.`fecha_inicio`
    ) AS `numero_ciclo`,
    DATEDIFF(c.`fecha_fin`, CURDATE()) AS `dias_restantes`,
    ROUND(
      DATEDIFF(CURDATE(), c.`fecha_inicio`) * 100.0 /
      NULLIF(DATEDIFF(c.`fecha_fin`, c.`fecha_inicio`), 0), 1
    ) AS `porcentaje_avance`
  FROM `CICLO` c
  WHERE c.`activo` = 1;


-- Ultima medicion de progreso por ciclo + IMC calculado + clasificacion OMS
CREATE OR REPLACE VIEW `v_ultimo_progreso` AS
  SELECT
    pf.`id_ciclo`,
    pf.`fecha_registro`,
    pf.`peso_kg`,
    pf.`porcentaje_grasa`,
    pf.`medida_cintura`,
    pf.`medida_brazo`,
    pf.`medida_pierna`,
    af.`estatura_cm`,
    ROUND(pf.`peso_kg` / POW(af.`estatura_cm` / 100.0, 2), 2) AS `imc`,
    CASE
      WHEN pf.`peso_kg` / POW(af.`estatura_cm` / 100.0, 2) < 18.5 THEN 'Bajo peso'
      WHEN pf.`peso_kg` / POW(af.`estatura_cm` / 100.0, 2) < 25.0 THEN 'Normal'
      WHEN pf.`peso_kg` / POW(af.`estatura_cm` / 100.0, 2) < 30.0 THEN 'Sobrepeso'
      ELSE 'Obesidad'
    END AS `clasificacion_imc`
  FROM `PROGRESO_FISICO` pf
  JOIN `CICLO`    c  ON pf.`id_ciclo`  = c.`id_ciclo`
  JOIN `AFILIADO` af ON c.`id_usuario` = af.`id_usuario`
  WHERE (pf.`id_ciclo`, pf.`fecha_registro`) IN (
    SELECT `id_ciclo`, MAX(`fecha_registro`)
    FROM   `PROGRESO_FISICO`
    GROUP BY `id_ciclo`
  );


-- Ejercicios disponibles filtrados por restricciones del afiliado
CREATE OR REPLACE VIEW `v_catalogo_ejercicios_disponibles` AS
  SELECT
    af.`id_usuario`  AS `id_usuario_afiliado`,
    e.`id_ejercicio`,
    e.`nombre_ejercicio`,
    e.`grupo_muscular`,
    e.`nivel_minimo`,
    e.`descripcion`
  FROM `AFILIADO`  af
  JOIN `EJERCICIO` e
  WHERE NOT EXISTS (
    SELECT 1
    FROM   `AFILIADO_RESTRICCION`           ar
    JOIN   `EJERCICIO_RESTRICCION_EXCLUIDA` ere
           ON ar.`id_restriccion` = ere.`id_restriccion`
    WHERE  ar.`id_usuario`    = af.`id_usuario`
      AND  ere.`id_ejercicio` = e.`id_ejercicio`
  );


-- ============================================================================================================================
-- BLOQUE 9B - PAGOS (Manejo de membresías en efectivo)
-- ============================================================================================================================
CREATE TABLE IF NOT EXISTS `PAGO` (
  `id_pago`           INT          NOT NULL AUTO_INCREMENT,
  `id_usuario`        INT          NOT NULL,
  `fecha_pago`        DATE         NOT NULL,
  `valor_pagado`      DECIMAL(10,2) NOT NULL DEFAULT 80000.00 CHECK (`valor_pagado` >= 0),
  `estado`            ENUM('Pagado','Vencido','Pendiente') NOT NULL DEFAULT 'Pagado',
  `fecha_vencimiento` DATE         NOT NULL,
  `observaciones`     VARCHAR(200) NULL,
  `registrado_por`    INT          NULL COMMENT 'id_usuario de quien registró el pago (Admin/Recepcionista)',
  `fecha_creacion`    DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,

  PRIMARY KEY (`id_pago`),
  INDEX `idx_pago_afiliado` (`id_usuario`),
  INDEX `idx_pago_fecha` (`fecha_pago`),
  INDEX `idx_pago_registrado_por` (`registrado_por`),

  CONSTRAINT `fk_pago_afiliado`
    FOREIGN KEY (`id_usuario`)
    REFERENCES `AFILIADO` (`id_usuario`)
    ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE = InnoDB
  COMMENT = 'Registro de pagos de membresia en efectivo. Valor mensual unico.';


-- ============================================================================================================================
-- BLOQUE 10 — CONFIGURACION DEL SISTEMA (clave-valor)
-- Parametros editables por el Administrador desde el Dashboard.
-- ============================================================================================================================

CREATE TABLE IF NOT EXISTS `CONFIGURACION` (
  `clave` VARCHAR(50)  NOT NULL,
  `valor` VARCHAR(255) NOT NULL,

  PRIMARY KEY (`clave`)

) ENGINE = InnoDB
  COMMENT = 'Parametros configurables del sistema (ej: precio_membresia).';

-- ============================================================================================================================
-- BLOQUE 11 — TRIGGERS
-- ============================================================================================================================

-- NOTA: Los triggers sobre CICLO fueron eliminados porque:
--   - trg_ciclo_un_activo_insert: causaba MySQL error 1442 (UPDATE sobre CICLO dentro de BEFORE INSERT)
--   - trg_ciclo_no_solapamiento_insert: causaba MySQL error 1442 (SELECT sobre CICLO dentro de BEFORE
--     INSERT después de que la transacción ya modificó CICLO via UPDATE en cicloModel.create)
--   La desactivación del ciclo anterior se maneja en cicloModel.create (capa de aplicación),
--   y la validación de fechas está garantizada por CHECK constraints y lógica de negocio en el service.

-- Reactivar checks de FK
SET FOREIGN_KEY_CHECKS = 1;


-- ============================================================================================================================
-- RESUMEN DEL ESQUEMA v4.1
-- ============================================================================================================================
-- TABLAS (17): USUARIO, RESTRICCION, EJERCICIO, ALIMENTO, AFILIADO,
--              AFILIADO_RESTRICCION, EJERCICIO_RESTRICCION_EXCLUIDA, ALIMENTO_RESTRICCION_EXCLUIDA,
--              CICLO, PLAN_ENTRENAMIENTO, PLAN_NUTRICIONAL, RUTINA, RUTINA_EJERCICIO,
--              DETALLE_NUTRICIONAL, PROGRESO_FISICO, PAGO, CONFIGURACION
--
-- VISTAS (5):  v_alimento_calorias, v_perfil_afiliado, v_ciclo_activo_afiliado,
--              v_ultimo_progreso, v_catalogo_ejercicios_disponibles
--
-- INDICES EXPLICITOS (6): idx_ciclo_usuario, idx_ciclo_activo, idx_rutejec_ejercicio,
--                         idx_detnut_alimento, idx_progreso_ciclo, idx_progreso_fecha
--
-- RELACIONES PRINCIPALES:
--   USUARIO (1) ----< (N) roles                                [ENUM en USUARIO.rol]
--   USUARIO (1) ----> (1) AFILIADO                            [herencia super/sub-tipo]
--   AFILIADO (1) ---< (N) CICLO                               [un afiliado tiene N ciclos]
--   AFILIADO (N) >--< (N) RESTRICCION  via AFILIADO_RESTRICCION
--   CICLO (1) -----> (1) PLAN_ENTRENAMIENTO                   [PK=FK, relacion 1:1]
--   CICLO (1) -----> (1) PLAN_NUTRICIONAL                     [PK=FK, relacion 1:1]
--   CICLO (1) ----->( N) PROGRESO_FISICO                      [1 ciclo tiene N registros]
--   PLAN_ENTRENAMIENTO (1) ---< (N) RUTINA
--   RUTINA (N) >--< (N) EJERCICIO     via RUTINA_EJERCICIO    [con campo orden]
--   PLAN_NUTRICIONAL (1) ---< (N) DETALLE_NUTRICIONAL
--   EJERCICIO (N) >--< (N) RESTRICCION via EJERCICIO_RESTRICCION_EXCLUIDA
--   ALIMENTO  (N) >--< (N) RESTRICCION via ALIMENTO_RESTRICCION_EXCLUIDA
-- ============================================================================================================================
