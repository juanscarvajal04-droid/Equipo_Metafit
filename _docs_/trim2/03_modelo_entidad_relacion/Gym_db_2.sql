-- -----------------------------------------------------
-- DDL: Estructura Completa Gym_db (Versión Corregida)
-- -----------------------------------------------------
DROP SCHEMA IF EXISTS Gym_db;
CREATE SCHEMA Gym_db DEFAULT CHARACTER SET utf8;
USE Gym_db;

-- -----------------------------------------------------
-- TABLA Rol
-- -----------------------------------------------------
CREATE TABLE Rol (
    id_rol INT NOT NULL,
    nombre_rol VARCHAR(50) NOT NULL,
    descripcion VARCHAR(100) NOT NULL,
    PRIMARY KEY (id_rol)
) ENGINE = InnoDB;

-- -----------------------------------------------------
-- TABLA Plan_Nutricional
-- -----------------------------------------------------
CREATE TABLE Plan_Nutricional (
    id_plan INT NOT NULL,
    id_usuario INT NOT NULL,
    tipo_plan ENUM('definicion', 'volumen', 'equilibrado', 'vegetariano', 'keto'),
    calorias_diarias INT NOT NULL,
    proteinas_g INT NOT NULL,
    carbohidratos_g INT NOT NULL,
    grasas_g INT NOT NULL,
    comidas_dia INT NOT NULL,
    observaciones VARCHAR(100),
    fecha_creacion DATE,
    PRIMARY KEY (id_plan)
) ENGINE = InnoDB;

-- -----------------------------------------------------
-- TABLA Perfil_Salud
-- -----------------------------------------------------
CREATE TABLE Perfil_Salud (
    id_perfil INT NOT NULL,
    id_usuario INT NOT NULL,
    edad INT NOT NULL,
    sexo ENUM('masculino', 'femenino', 'otro') NOT NULL,
    peso DECIMAL(5,2) NOT NULL,
    altura DECIMAL(5,2) NOT NULL,
    nivel_experiencia ENUM('principiante', 'intermedio', 'avanzado') NOT NULL,
    objetivo ENUM('bajar_peso', 'ganar_masa', 'tonificar', 'salud', 'rendimiento') NOT NULL,
    enfermedades VARCHAR(100),
    medicamentos VARCHAR(100),
    fecha_actualizacion DATETIME,
    observaciones VARCHAR(100),
    plan_nutricional_id_plan INT,

    PRIMARY KEY (id_perfil),

    INDEX fk_perfil_usuario_idx (id_usuario),
    INDEX fk_perfil_plan_idx (plan_nutricional_id_plan),

    CONSTRAINT fk_Perfil_Usuario
        FOREIGN KEY (id_usuario)
        REFERENCES Gym_db.Usuario (id_usuario)
        ON DELETE CASCADE
        ON UPDATE CASCADE,

    CONSTRAINT fk_Perfil_Plan
        FOREIGN KEY (plan_nutricional_id_plan)
        REFERENCES Gym_db.Plan_Nutricional (id_plan)
        ON DELETE SET NULL
        ON UPDATE CASCADE
) ENGINE = InnoDB;

-- -----------------------------------------------------
-- TABLA Usuario
-- -----------------------------------------------------
CREATE TABLE Usuario (
    id_usuario INT NOT NULL,
    email VARCHAR(100) NOT NULL,
    contrasena VARCHAR(255) NOT NULL,
    fecha_registro DATE NOT NULL,
    metodo_registro ENUM('email', 'google', 'apple') NOT NULL,
    estado ENUM('activo', 'inactivo', 'suspendido') NOT NULL,
    ultimo_acceso DATETIME,
    id_rol INT NOT NULL,
    nombre VARCHAR(45),

    PRIMARY KEY (id_usuario),

    INDEX fk_id_rol_idx (id_rol),

    CONSTRAINT fk_Usuario_Rol
        FOREIGN KEY (id_rol)
        REFERENCES Gym_db.Rol (id_rol)
        ON DELETE CASCADE
        ON UPDATE CASCADE
) ENGINE = InnoDB;

-- -----------------------------------------------------
-- TABLA Perfil_Salud_Has_Usuario
-- -----------------------------------------------------
CREATE TABLE Perfil_Salud_Has_Usuario (
    perfil_salud_id_perfil INT NOT NULL,
    usuario_id_usuario INT NOT NULL,

    PRIMARY KEY (perfil_salud_id_perfil, usuario_id_usuario),

    INDEX fk_ps_idx (perfil_salud_id_perfil),
    INDEX fk_usr_idx (usuario_id_usuario),

    CONSTRAINT fk_PSHU_Perfil
        FOREIGN KEY (perfil_salud_id_perfil)
        REFERENCES Gym_db.Perfil_Salud (id_perfil)
        ON DELETE CASCADE
        ON UPDATE CASCADE,

    CONSTRAINT fk_PSHU_Usuario
        FOREIGN KEY (usuario_id_usuario)
        REFERENCES Gym_db.Usuario (id_usuario)
        ON DELETE CASCADE
        ON UPDATE CASCADE
) ENGINE = InnoDB;
