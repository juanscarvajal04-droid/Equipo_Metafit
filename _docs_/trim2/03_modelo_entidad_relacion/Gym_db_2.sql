-- -----------------------------------------------------
-- DDL: Estructura Completa Gym_db (Versión Extendida)
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
-- TABLA Plan_Nuricional 
-- -----------------------------------------------------
CREATE TABLE Plan_Nuricional (
    id_plan INT NOT NULL,
    id_usuario INT NOT NULL,
    tipo_planl ENUM('definicion', 'volumen', 'equilibrado', 'vegetariano', 'keto'),
    calorias_diarias INT NOT NULL,
    proteinas_g INT NOT NULL,
    carbohidratos_g INT NOT NULL,
    grasas_g INT NOT NULL,
    comidas_dia INT NOT NULL,
    observaciones VARCHAR(45),
    fecha_creacion DATE,
    PRIMARY KEY (id_plan)
) ENGINE = InnoDB;

-- -----------------------------------------------------
-- TABLA Perfil_Salud
-- -----------------------------------------------------
CREATE TABLE Perfil_Salud (
    id_perfil INT NOT NULL,
    edad INT NOT NULL,
    sexo ENUM('masculino', 'femenino', 'otro') NOT NULL,
    peso DECIMAL(5,2) NOT NULL,
    altura DECIMAL(5,2) NOT NULL,
    nivel_experiencia ENUM('principiante', 'intermedio', 'avanzado') NOT NULL,
    objetivo ENUM('bajar_peso', 'ganar_masa', 'tonificar', 'salud', 'rendimiento') NOT NULL,
    enfermedades VARCHAR(45) NOT NULL,
    medicamentos INT NOT NULL,
    fecha_actualizacion VARCHAR(45) NOT NULL,
    observaciones VARCHAR(45) NOT NULL,
    plan_nutricional_id_plan INT NOT NULL,
    id_usuario VARCHAR(45) NOT NULL,
    PRIMARY KEY (id_perfil),
    INDEX fk_Perfil_Salud_Plan_Nutricional_idx (plan_nutricional_id_plan ASC),
    CONSTRAINT fk_Perfil_Salud_Plan_Nutricional
        FOREIGN KEY (plan_nutricional_id_plan)
        REFERENCES Gym_db.Plan_Nuricional (id_plan)
        ON DELETE CASCADE
        ON UPDATE CASCADE
) ENGINE = InnoDB;

-- -----------------------------------------------------
-- TABLA Usuario
-- -----------------------------------------------------
CREATE TABLE Usuario (
    id_usuario INT NOT NULL,
    email VARCHAR(100) NOT NULL,
    contraseña VARCHAR(255) NOT NULL,
    fecha_registro DATE NOT NULL,
    metodo_registro ENUM('email', 'google', 'apple') NOT NULL,
    estado ENUM('activo', 'inactivo', 'suspendido') NOT NULL,
    ultimo_acceso DATETIME,
    id_rol INT NOT NULL,
    perfil_salud_id_perfil INT NOT NULL,
    nombre VARCHAR(45),
    PRIMARY KEY (id_usuario, perfil_salud_id_perfil),
    INDEX fk_id_rol_idx (id_rol ASC),
    CONSTRAINT fk_Usuario_Rol
        FOREIGN KEY (id_rol)
        REFERENCES Gym_db.Rol (id_rol)
        ON DELETE CASCADE
        ON UPDATE CASCADE
) ENGINE = InnoDB;

-- -----------------------------------------------------
-- TABLA Perfil_Salud_Has_Usuario (Relación Muchos a Muchos)
-- -----------------------------------------------------
CREATE TABLE Perfil_Salud_Has_Usuario (
    perfil_salud_id_perfil INT NOT NULL,
    usuario_id_usuario INT NOT NULL,
    usuario_id_rol INT NOT NULL,
    usuario_perfil_salud_id_perfil INT NOT NULL,
    PRIMARY KEY (perfil_salud_id_perfil, usuario_id_usuario),
    INDEX fk_Perfil_Salud_Has_Usuario_Perfil_Salud_idx (perfil_salud_id_perfil ASC),
    INDEX fk_Perfil_Salud_Has_Usuario_Usuario_idx (usuario_id_usuario ASC, usuario_id_rol ASC),
    CONSTRAINT fk_PSHU_Perfil_Salud
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
