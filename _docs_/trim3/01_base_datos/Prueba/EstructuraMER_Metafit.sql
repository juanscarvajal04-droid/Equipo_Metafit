-- -----------------------------------------------------
-- Schema mydb
-- -----------------------------------------------------
CREATE SCHEMA IF NOT EXISTS `mydb` DEFAULT CHARACTER SET utf8 ;
USE `mydb` ;

-- -----------------------------------------------------
-- Table `mydb`.`USUARIO`
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS `mydb`.`USUARIO` (
  `id_usuario` INT NOT NULL AUTO_INCREMENT COMMENT 'Identificador único de cada usuario (entrenador, recepcionista, administrador)',
  `nombres_usuario` VARCHAR(45) NOT NULL COMMENT 'Nombres de cada usuario (Entrenador, Recepcionista o Administrador)',
  `apellidos_usuario` VARCHAR(45) NOT NULL COMMENT 'Apellidos de cada usuario (Entrenador, Recepcionista o Administrador)',
  `correo_usuario` VARCHAR(100) NOT NULL COMMENT 'Correo electrónico de cada usuario',
  `contrasena_usuario` VARCHAR(200) NOT NULL COMMENT 'Contraseña para cada usuario ',
  `rol_usuario` ENUM('Recepcionista', 'Entrenador', 'Administrador') NOT NULL COMMENT 'Tipo de usuario (Entrenador, Recepcionista o Administrador)',
  `estado_cuenta_usuario` ENUM('Pendiente', 'Activo', 'Rechazado') NOT NULL DEFAULT 'Pendiente' COMMENT 'Con qué estado se encuentra el usuario ',
  `fecha_registro` DATETIME NOT NULL COMMENT 'Fecha en la que se refleja el resgistro de el usuario (Entrenador, Recepcionista o Administrador) en el sistema.',
  PRIMARY KEY (`id_usuario`),
  UNIQUE INDEX `correo_usuario_UNIQUE` (`correo_usuario` ASC) )
ENGINE = InnoDB;


-- -----------------------------------------------------
-- Table `mydb`.`AFILIADO`
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS `mydb`.`AFILIADO` (
  `id_afiliado` INT NOT NULL AUTO_INCREMENT COMMENT 'identificador único de cada cliente afiliado',
  `nombres_afiliado` VARCHAR(45) NOT NULL,
  `apellidos_afiliado` VARCHAR(45) NOT NULL,
  `documento_afiliado` BIGINT(20) NOT NULL,
  `fecha_nacimiento_afiliado` DATE NOT NULL,
  `sexo_afiliado` ENUM('Femenino', 'Masculino') NOT NULL,
  `correo_afiliado` VARCHAR(100) NOT NULL,
  `direccion_afiliado` VARCHAR(70) NOT NULL,
  `telefono_afiliado` VARCHAR(10) NOT NULL,
  `peso_afiliado` DECIMAL(5,2) NOT NULL,
  `estatura_afiliado` DECIMAL(5,2) NOT NULL,
  `porcentaje_grasa_afiliado` DECIMAL(4,2) NULL,
  `objetivo_fisico_afiliado` ENUM('Pérdida de grasa', 'Aumento de masa', 'Mantenimiento') NOT NULL,
  `grupo_muscular_prioritario_afiliado` ENUM('Piernas', 'Pecho', 'Espalda', 'Hombros', 'Bíceps', 'Tríceps', 'Core', 'Glúteos') NULL DEFAULT NULL,
  `nivel_experiencia_afiliado` ENUM('Principiante', 'Intermedio', 'Avanzado') NOT NULL,
  `disponiblidiad_semanal_afiliado` TINYINT(4) NOT NULL,
  `estado_afiliacion` ENUM('Activo', 'Inactivo') NOT NULL DEFAULT 'Activo',
  `fecha_registro_afiliado` DATE NOT NULL,
  `fecha_ultima_modificacion` DATETIME NULL,
  `fecha_último_cambio_estado_afiliado` DATETIME NULL,
  `cambiado_por` INT NULL,
  `registrado_por` INT NOT NULL,
  PRIMARY KEY (`id_afiliado`),
  UNIQUE INDEX `documento_afiliado_UNIQUE` (`documento_afiliado` ASC) ,
  UNIQUE INDEX `correo_afiliado_UNIQUE` (`correo_afiliado` ASC) ,
  INDEX `fk_afiliado_registrado_por_idx` (`registrado_por` ASC) ,
  INDEX `fk_afiliado_cambiado_por_idx` (`cambiado_por` ASC) ,
  CONSTRAINT `fk_afiliado_registrado_por`
    FOREIGN KEY (`registrado_por`)
    REFERENCES `mydb`.`USUARIO` (`id_usuario`)
    ON DELETE RESTRICT
    ON UPDATE CASCADE,
  CONSTRAINT `fk_afiliado_cambiado_por`
    FOREIGN KEY (`cambiado_por`)
    REFERENCES `mydb`.`USUARIO` (`id_usuario`)
    ON DELETE RESTRICT
    ON UPDATE CASCADE)
ENGINE = InnoDB;


-- -----------------------------------------------------
-- Table `mydb`.`CONDICION_MEDICA`
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS `mydb`.`CONDICION_MEDICA` (
  `id_condicion_medica` INT NOT NULL AUTO_INCREMENT,
  `nombre_condicion_medica` VARCHAR(100) NOT NULL,
  `tipo_condicion_medica` ENUM('Enfermedad', 'Lesión', 'Alergia', 'Otra') NOT NULL,
  PRIMARY KEY (`id_condicion_medica`))
ENGINE = InnoDB;


-- -----------------------------------------------------
-- Table `mydb`.`MEDICAMENTO`
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS `mydb`.`MEDICAMENTO` (
  `id_medicamento` INT NOT NULL AUTO_INCREMENT,
  `nombre_medicamento` VARCHAR(45) NOT NULL,
  `efecto_relevante_medicamento` VARCHAR(45) NOT NULL,
  PRIMARY KEY (`id_medicamento`))
ENGINE = InnoDB;


-- -----------------------------------------------------
-- Table `mydb`.`AFILIADO_CONDICION`
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS `mydb`.`AFILIADO_CONDICION` (
  `id_afiliado` INT NOT NULL,
  `id_condicion_medica` INT NOT NULL,
  PRIMARY KEY (`id_afiliado`, `id_condicion_medica`),
  INDEX `fk_afilcon_condicion_idx` (`id_condicion_medica` ASC) ,
  CONSTRAINT `fk_afilcon_afiliado`
    FOREIGN KEY (`id_afiliado`)
    REFERENCES `mydb`.`AFILIADO` (`id_afiliado`)
    ON DELETE RESTRICT
    ON UPDATE CASCADE,
  CONSTRAINT `fk_afilcon_condicion`
    FOREIGN KEY (`id_condicion_medica`)
    REFERENCES `mydb`.`CONDICION_MEDICA` (`id_condicion_medica`)
    ON DELETE RESTRICT
    ON UPDATE CASCADE)
ENGINE = InnoDB;


-- -----------------------------------------------------
-- Table `mydb`.`AFILIADO_MEDICAMENTO`
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS `mydb`.`AFILIADO_MEDICAMENTO` (
  `id_afiliado` INT NOT NULL,
  `id_medicamento` INT NOT NULL,
  PRIMARY KEY (`id_afiliado`, `id_medicamento`),
  INDEX `fk_afilmed_medicamento_idx` (`id_medicamento` ASC) ,
  CONSTRAINT `fk_afilmed_afiliado`
    FOREIGN KEY (`id_afiliado`)
    REFERENCES `mydb`.`AFILIADO` (`id_afiliado`)
    ON DELETE RESTRICT
    ON UPDATE CASCADE,
  CONSTRAINT `fk_afilmed_medicamento`
    FOREIGN KEY (`id_medicamento`)
    REFERENCES `mydb`.`MEDICAMENTO` (`id_medicamento`)
    ON DELETE RESTRICT
    ON UPDATE CASCADE)
ENGINE = InnoDB;


-- -----------------------------------------------------
-- Table `mydb`.`EJERCICIO`
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS `mydb`.`EJERCICIO` (
  `id_ejercicio` INT NOT NULL AUTO_INCREMENT,
  `nombre_ejercicio` VARCHAR(45) NOT NULL,
  `grupo_muscular` ENUM('Piernas', 'Pecho', 'Espalda', 'Hombros', 'Bíceps', 'Tríceps', 'Core', 'Glúteos') NOT NULL,
  `descripcion` VARCHAR(120) NULL,
  `nivel_minimo` ENUM('Principiante', 'Intermedio', 'Avanzado') NOT NULL,
  PRIMARY KEY (`id_ejercicio`))
ENGINE = InnoDB;


-- -----------------------------------------------------
-- Table `mydb`.`EJERCICIO_CONDICION_EXCLUIDA`
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS `mydb`.`EJERCICIO_CONDICION_EXCLUIDA` (
  `id_ejercicio` INT NOT NULL,
  `id_condicion_medica` INT NOT NULL,
  PRIMARY KEY (`id_ejercicio`, `id_condicion_medica`),
  INDEX `fk_ejcond_condicion_idx` (`id_condicion_medica` ASC) ,
  CONSTRAINT `fk_ejcond_ejercicio`
    FOREIGN KEY (`id_ejercicio`)
    REFERENCES `mydb`.`EJERCICIO` (`id_ejercicio`)
    ON DELETE RESTRICT
    ON UPDATE CASCADE,
  CONSTRAINT `fk_ejcond_condicion`
    FOREIGN KEY (`id_condicion_medica`)
    REFERENCES `mydb`.`CONDICION_MEDICA` (`id_condicion_medica`)
    ON DELETE RESTRICT
    ON UPDATE CASCADE)
ENGINE = InnoDB;


-- -----------------------------------------------------
-- Table `mydb`.`ALIMENTO`
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS `mydb`.`ALIMENTO` (
  `id_alimento` INT NOT NULL AUTO_INCREMENT,
  `nombre_alimento` VARCHAR(50) NOT NULL,
  `calorias_por_100g` DECIMAL(6,2) NOT NULL,
  `proteinas` DECIMAL(5,2) NOT NULL,
  `carbohidratos` DECIMAL(5,2) NOT NULL,
  `grasas` DECIMAL(5,2) NOT NULL,
  PRIMARY KEY (`id_alimento`))
ENGINE = InnoDB;


-- -----------------------------------------------------
-- Table `mydb`.`ALIMENTO_CONDICION_EXCLUIDA`
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS `mydb`.`ALIMENTO_CONDICION_EXCLUIDA` (
  `id_alimento` INT NOT NULL,
  `id_condicion_medica` INT NOT NULL,
  PRIMARY KEY (`id_alimento`, `id_condicion_medica`),
  INDEX `fk_alcon_condicion_idx` (`id_condicion_medica` ASC) ,
  CONSTRAINT `fk_alcon_alimento`
    FOREIGN KEY (`id_alimento`)
    REFERENCES `mydb`.`ALIMENTO` (`id_alimento`)
    ON DELETE RESTRICT
    ON UPDATE CASCADE,
  CONSTRAINT `fk_alcon_condicion`
    FOREIGN KEY (`id_condicion_medica`)
    REFERENCES `mydb`.`CONDICION_MEDICA` (`id_condicion_medica`)
    ON DELETE RESTRICT
    ON UPDATE CASCADE)
ENGINE = InnoDB;


-- -----------------------------------------------------
-- Table `mydb`.`ALIMENTO_MEDICAMENTO_EXCLUIDO`
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS `mydb`.`ALIMENTO_MEDICAMENTO_EXCLUIDO` (
  `id_alimento` INT NOT NULL,
  `id_medicamento` INT NOT NULL,
  PRIMARY KEY (`id_alimento`, `id_medicamento`),
  INDEX `fk_almed_medicamento_idx` (`id_medicamento` ASC) ,
  CONSTRAINT `fk_almed_alimento`
    FOREIGN KEY (`id_alimento`)
    REFERENCES `mydb`.`ALIMENTO` (`id_alimento`)
    ON DELETE RESTRICT
    ON UPDATE CASCADE,
  CONSTRAINT `fk_almed_medicamento`
    FOREIGN KEY (`id_medicamento`)
    REFERENCES `mydb`.`MEDICAMENTO` (`id_medicamento`)
    ON DELETE RESTRICT
    ON UPDATE CASCADE)
ENGINE = InnoDB;


-- -----------------------------------------------------
-- Table `mydb`.`PLANTILLA_DISTRIBUCION`
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS `mydb`.`PLANTILLA_DISTRIBUCION` (
  `id_plantilla` INT NOT NULL AUTO_INCREMENT,
  `dias_disponibles` TINYINT(4) NOT NULL,
  `objetivo_fisico` ENUM('Pérdida de grasa', 'Aumento de masa', 'Mantenimiento') NOT NULL,
  `dia_numero` TINYINT(4) NOT NULL,
  `enfoque_muscular` ENUM('Piernas', 'Pecho', 'Espalda', 'Hombros', 'Bíceps', 'Tríceps', 'Core', 'Glúteos', 'Full Body', 'Empuje', 'Jale') NOT NULL,
  `es_prioritario` TINYINT(1) NOT NULL,
  PRIMARY KEY (`id_plantilla`))
ENGINE = InnoDB;


-- -----------------------------------------------------
-- Table `mydb`.`CICLO`
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS `mydb`.`CICLO` (
  `id_ciclo` INT NOT NULL AUTO_INCREMENT,
  `id_afiliado` INT NOT NULL,
  `numero_ciclo` TINYINT(4) NOT NULL,
  `fecha_inicio_ciclo` DATE NOT NULL,
  `fecha_fin_ciclo` DATE NOT NULL,
  `activo` TINYINT(1) NOT NULL,
  PRIMARY KEY (`id_ciclo`),
  INDEX `fk_ciclo_afiliado_idx` (`id_afiliado` ASC) ,
  CONSTRAINT `fk_ciclo_afiliado`
    FOREIGN KEY (`id_afiliado`)
    REFERENCES `mydb`.`AFILIADO` (`id_afiliado`)
    ON DELETE RESTRICT
    ON UPDATE CASCADE)
ENGINE = InnoDB;


-- -----------------------------------------------------
-- Table `mydb`.`PLAN_ENTRENAMIENTO`
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS `mydb`.`PLAN_ENTRENAMIENTO` (
  `id_plan_entrenamiento` INT NOT NULL AUTO_INCREMENT,
  `id_ciclo` INT NOT NULL,
  `fecha_creacion` DATETIME NULL,
  `activo` TINYINT(1) NOT NULL,
  `es_automatico` TINYINT(1) NOT NULL,
  `modificado_por` INT NULL,
  `obervaciones` VARCHAR(300) NULL,
  PRIMARY KEY (`id_plan_entrenamiento`),
  INDEX `fk_planen_ciclo_idx` (`id_ciclo` ASC) ,
  INDEX `fk_planen_usuario_idx` (`modificado_por` ASC) ,
  CONSTRAINT `fk_planen_ciclo`
    FOREIGN KEY (`id_ciclo`)
    REFERENCES `mydb`.`CICLO` (`id_ciclo`)
    ON DELETE RESTRICT
    ON UPDATE CASCADE,
  CONSTRAINT `fk_planen_usuario`
    FOREIGN KEY (`modificado_por`)
    REFERENCES `mydb`.`USUARIO` (`id_usuario`)
    ON DELETE RESTRICT
    ON UPDATE CASCADE)
ENGINE = InnoDB;


-- -----------------------------------------------------
-- Table `mydb`.`RUTINA`
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS `mydb`.`RUTINA` (
  `id_rutina` INT NOT NULL AUTO_INCREMENT,
  `id_plan_entrenamiento` INT NOT NULL,
  `nombre_rutina` VARCHAR(100) NOT NULL,
  `enfoque_muscular` ENUM('Piernas', 'Pecho', 'Espalda', 'Hombros', 'Bíceps', 'Tríceps', 'Core', 'Glúteos', 'Full Body', 'Empuje', 'Jale') NOT NULL,
  `dia_numero` TINYINT(4) NOT NULL,
  `dia_semana` ENUM('Lunes', 'Martes', 'Miercoles', 'Jueves', 'Viernes', 'Sabado', 'Domingo') NULL,
  PRIMARY KEY (`id_rutina`),
  INDEX `fk_rutina_plan_idx` (`id_plan_entrenamiento` ASC) ,
  CONSTRAINT `fk_rutina_plan`
    FOREIGN KEY (`id_plan_entrenamiento`)
    REFERENCES `mydb`.`PLAN_ENTRENAMIENTO` (`id_plan_entrenamiento`)
    ON DELETE RESTRICT
    ON UPDATE CASCADE)
ENGINE = InnoDB;


-- -----------------------------------------------------
-- Table `mydb`.`RUTINA_EJERCICIO`
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS `mydb`.`RUTINA_EJERCICIO` (
  `id_rutina_ejercicio` INT NOT NULL AUTO_INCREMENT,
  `id_rutina` INT NOT NULL,
  `id_ejercicio` INT NOT NULL,
  `series` INT NOT NULL,
  `repeticiones` INT NOT NULL,
  `orden` INT NOT NULL,
  PRIMARY KEY (`id_rutina_ejercicio`),
  INDEX `fk_rutejec_rutina_idx` (`id_rutina` ASC) ,
  INDEX `fk_rutejec_ejercicio_idx` (`id_ejercicio` ASC) ,
  CONSTRAINT `fk_rutejec_rutina`
    FOREIGN KEY (`id_rutina`)
    REFERENCES `mydb`.`RUTINA` (`id_rutina`)
    ON DELETE RESTRICT
    ON UPDATE CASCADE,
  CONSTRAINT `fk_rutejec_ejercicio`
    FOREIGN KEY (`id_ejercicio`)
    REFERENCES `mydb`.`EJERCICIO` (`id_ejercicio`)
    ON DELETE RESTRICT
    ON UPDATE CASCADE)
ENGINE = InnoDB;


-- -----------------------------------------------------
-- Table `mydb`.`PLAN_NUTRICIONAL`
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS `mydb`.`PLAN_NUTRICIONAL` (
  `id_plan_nutricional` INT NOT NULL AUTO_INCREMENT,
  `id_ciclo` INT NOT NULL,
  `calorias_estimadas` DECIMAL(7,2) NOT NULL,
  `num_comidas_diarias` TINYINT(4) NOT NULL,
  `activo` TINYINT(1) NOT NULL,
  `fecha_creacion` DATETIME NULL,
  `es_automatico` TINYINT(1) NOT NULL,
  `modificado_por` INT NULL,
  `observaciones` VARCHAR(300) NULL,
  PRIMARY KEY (`id_plan_nutricional`),
  INDEX `fk_plannut_ciclo_idx` (`id_ciclo` ASC) ,
  INDEX `fk_plannut_usuario_idx` (`modificado_por` ASC) ,
  CONSTRAINT `fk_plannut_ciclo`
    FOREIGN KEY (`id_ciclo`)
    REFERENCES `mydb`.`CICLO` (`id_ciclo`)
    ON DELETE RESTRICT
    ON UPDATE CASCADE,
  CONSTRAINT `fk_plannut_usuario`
    FOREIGN KEY (`modificado_por`)
    REFERENCES `mydb`.`USUARIO` (`id_usuario`)
    ON DELETE RESTRICT
    ON UPDATE CASCADE)
ENGINE = InnoDB;


-- -----------------------------------------------------
-- Table `mydb`.`PLAN_NUTRICIONAL_DETALLE`
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS `mydb`.`PLAN_NUTRICIONAL_DETALLE` (
  `id_detalle_plan_nutricional` INT NOT NULL AUTO_INCREMENT,
  `id_plan_nutricional` INT NOT NULL,
  `id_alimento` INT NOT NULL,
  `numero_comida` TINYINT(4) NOT NULL,
  `cantidad` DECIMAL(6,2) NOT NULL,
  PRIMARY KEY (`id_detalle_plan_nutricional`),
  INDEX `fk_plannutdet_plan_idx` (`id_plan_nutricional` ASC) ,
  INDEX `fk_plannutdet_alimento_idx` (`id_alimento` ASC) ,
  CONSTRAINT `fk_plannutdet_plan`
    FOREIGN KEY (`id_plan_nutricional`)
    REFERENCES `mydb`.`PLAN_NUTRICIONAL` (`id_plan_nutricional`)
    ON DELETE RESTRICT
    ON UPDATE CASCADE,
  CONSTRAINT `fk_plannutdet_alimento`
    FOREIGN KEY (`id_alimento`)
    REFERENCES `mydb`.`ALIMENTO` (`id_alimento`)
    ON DELETE RESTRICT
    ON UPDATE CASCADE)
ENGINE = InnoDB;


-- -----------------------------------------------------
-- Table `mydb`.`PROGRESO_FISICO`
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS `mydb`.`PROGRESO_FISICO` (
  `id_progreso` INT NOT NULL AUTO_INCREMENT,
  `id_afiliado` INT NOT NULL,
  `id_ciclo` INT NOT NULL,
  `fecha_registro` DATE NULL,
  `peso` DECIMAL(5,2) NOT NULL,
  `porcentaje_grasa` DECIMAL(4,2) NULL,
  `medida_cintura` DECIMAL(5,2) NULL,
  `medida_brazo` DECIMAL(5,2) NULL,
  `medida_pierna` DECIMAL(5,2) NULL,
  `Observaciones` VARCHAR(300) NULL,
  PRIMARY KEY (`id_progreso`),
  INDEX `fk_progreso_afiliado_idx` (`id_afiliado` ASC) ,
  INDEX `fk_progreso_ciclo_idx` (`id_ciclo` ASC) ,
  CONSTRAINT `fk_progreso_afiliado`
    FOREIGN KEY (`id_afiliado`)
    REFERENCES `mydb`.`AFILIADO` (`id_afiliado`)
    ON DELETE RESTRICT
    ON UPDATE CASCADE,
  CONSTRAINT `fk_progreso_ciclo`
    FOREIGN KEY (`id_ciclo`)
    REFERENCES `mydb`.`CICLO` (`id_ciclo`)
    ON DELETE RESTRICT
    ON UPDATE CASCADE)
ENGINE = InnoDB;
