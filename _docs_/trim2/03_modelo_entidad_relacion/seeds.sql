-- -----------------------------------------------------
-- SEEDS PARA Gym_db
-- -----------------------------------------------------
USE Gym_db_2;

-- 1. Primero los Roles (No dependen de nadie)
INSERT INTO Rol (id_rol, nombre_rol, descripcion) VALUES 
(1, 'Administrador', 'Control total del gimnasio'),
(2, 'Entrenador', 'Asigna planes y monitorea'),
(3, 'Cliente', 'Usuario final que entrena');

-- 2. Planes Nutricionales (Necesarios para el perfil de salud)
INSERT INTO Plan_Nuricional (id_plan, id_usuario, tipo_planl, calorias_diarias, proteinas_g, carbohidratos_g, grasas_g, comidas_dia, observaciones, fecha_creacion) VALUES 
(100, 1, 'volumen', 3000, 180, 400, 80, 5, 'Enfoque en masa muscular', '2026-02-19'),
(200, 2, 'definicion', 1800, 160, 120, 50, 4, 'Bajo en carbohidratos', '2026-02-19');

-- 3. Perfiles de Salud 
INSERT INTO Perfil_Salud (id_perfil, edad, sexo, peso, altura, nivel_experiencia, objetivo, enfermedades, medicamentos, fecha_actualizacion, observaciones, plan_nutricional_id_plan, id_usuario) VALUES 
(500, 25, 'masculino', 75.5, 1.78, 'intermedio', 'ganar_masa', 'Ninguna', 0, '2026-02-19', 'Todo en orden', 100, '1'),
(600, 30, 'femenino', 62.0, 1.65, 'avanzado', 'tonificar', 'Asma', 1, '2026-02-19', 'Usa inhalador', 200, '2');

-- 4. Usuarios 
INSERT INTO Usuario (id_usuario, email, contraseña, fecha_registro, metodo_registro, estado, ultimo_acceso, id_rol, perfil_salud_id_perfil, nombre) VALUES 
(1, 'carlos@gym.com', 'hash_password_123', '2026-01-01', 'email', 'activo', NOW(), 3, 500, 'Carlos Ruiz'),
(2, 'admin@gym.com', 'admin_secure_789', '2026-01-01', 'email', 'activo', NOW(), 1, 600, 'Admin Supremo');

-- 5. Tabla Relacional 
INSERT INTO Perfil_Salud_Has_Usuario (perfil_salud_id_perfil, usuario_id_usuario, usuario_id_rol, usuario_perfil_salud_id_perfil) VALUES 
(500, 1, 3, 500),
(600, 2, 1, 600);