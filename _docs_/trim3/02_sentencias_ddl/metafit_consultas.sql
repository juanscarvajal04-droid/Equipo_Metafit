/* ==================================================================================== */
/* ================================== MetaFit DB ===================================== */
/* ============= DDL + DML — CONSULTAS CON PREGUNTA, RESPUESTA Y CÓDIGO ============= */
/* ==================================================================================== */

USE `metafit`;

/* ==================================================================================== */
/* ============================= SECCIÓN A — DDL ===================================== */
/* ========================= DATA DEFINITION LANGUAGE ================================ */
/* ==================================================================================== */

-- ------------------------------------------------------------------------------------ --
-- DDL 01. Mostrar BBDDs — SHOW DATABASES                                              --
-- ------------------------------------------------------------------------------------ --
-- PREGUNTA : ¿Qué bases de datos existen en el servidor MySQL?
-- RESPUESTA : Con SHOW DATABASES se listan todas las bases de datos disponibles en el
--             servidor. Aquí veremos metafit junto a las demás que haya creadas.

SHOW DATABASES;


-- ------------------------------------------------------------------------------------ --
-- DDL 02. Usar BBDD — USE                                                             --
-- ------------------------------------------------------------------------------------ --
-- PREGUNTA : ¿Cómo seleccionar la base de datos metafit para empezar a trabajar?
-- RESPUESTA : USE indica al servidor qué base de datos usar en todas las consultas
--             siguientes. Sin esto, MySQL no sabe a qué tablas nos referimos.

USE metafit;


-- ------------------------------------------------------------------------------------ --
-- DDL 03. Eliminar BBDD — DROP DATABASE                                              --
-- ------------------------------------------------------------------------------------ --
-- PREGUNTA : ¿Cómo eliminar completamente la base de datos metafit del servidor?
-- RESPUESTA : DROP DATABASE borra la base de datos y TODAS sus tablas de forma
--             permanente. Esta operación es irreversible — usar con extremo cuidado.
-- ⚠️  ADVERTENCIA: Solo ejecutar en ambiente de pruebas. Borra todo MetaFit.

-- DROP DATABASE metafit;


-- ------------------------------------------------------------------------------------ --
-- DDL 04. Mostrar Tablas — SHOW TABLES                                               --
-- ------------------------------------------------------------------------------------ --
-- PREGUNTA : ¿Qué tablas contiene la base de datos metafit?
-- RESPUESTA : SHOW TABLES lista todas las tablas de la base de datos actualmente
--             seleccionada. MetaFit tiene 15 tablas más 2 VIEWs.

SHOW TABLES;


-- ------------------------------------------------------------------------------------ --
-- DDL 05. Mostrar Columnas — SHOW COLUMNS / DESCRIBE                                 --
-- ------------------------------------------------------------------------------------ --
-- PREGUNTA : ¿Cuáles son las columnas, tipos de datos y restricciones de la tabla AFILIADO?
-- RESPUESTA : SHOW COLUMNS y DESCRIBE hacen lo mismo: muestran cada columna con su tipo,
--             si acepta NULL, si tiene valor por defecto y si tiene índice.

SHOW COLUMNS FROM AFILIADO;
DESCRIBE EJERCICIO;


-- ------------------------------------------------------------------------------------ --
-- DDL 06. Agregar Columna — ALTER TABLE ADD                                          --
-- ------------------------------------------------------------------------------------ --
-- PREGUNTA : ¿Cómo agregar una columna de contacto de emergencia a la tabla AFILIADO?
-- RESPUESTA : ALTER TABLE ADD permite agregar una nueva columna a una tabla existente
--             sin perder los datos que ya tiene. Se agrega al final por defecto.

ALTER TABLE AFILIADO ADD contacto_emergencia VARCHAR(15) NULL;


-- ------------------------------------------------------------------------------------ --
-- DDL 07. Renombrar Columna — ALTER TABLE CHANGE                                     --
-- ------------------------------------------------------------------------------------ --
-- PREGUNTA : ¿Cómo renombrar la columna contacto_emergencia a telefono_emergencia
--             y cambiar su tipo a VARCHAR(20)?
-- RESPUESTA : ALTER TABLE CHANGE permite renombrar una columna y/o cambiar su tipo.
--             Se escribe: nombre_viejo, nombre_nuevo, tipo_nuevo.

ALTER TABLE AFILIADO CHANGE contacto_emergencia telefono_emergencia VARCHAR(20) NULL;


-- ------------------------------------------------------------------------------------ --
-- DDL 08. Eliminar Columna — ALTER TABLE DROP                                        --
-- ------------------------------------------------------------------------------------ --
-- PREGUNTA : ¿Cómo eliminar la columna telefono_emergencia de la tabla AFILIADO?
-- RESPUESTA : ALTER TABLE DROP elimina permanentemente una columna y todos sus datos.
--             No se puede deshacer. Dejar el schema limpio como estaba.

ALTER TABLE AFILIADO DROP telefono_emergencia;


-- ------------------------------------------------------------------------------------ --
-- DDL 09. Agregar Valor por Defecto — ALTER TABLE ALTER SET DEFAULT                  --
-- ------------------------------------------------------------------------------------ --
-- PREGUNTA : ¿Cómo asignar el valor por defecto 3 a la columna
--             disponibilidad_semanal_afiliado en AFILIADO?
-- RESPUESTA : ALTER TABLE ALTER ... SET DEFAULT asigna un valor por defecto a una
--             columna existente. Los registros ya guardados NO cambian; solo afecta
--             a los INSERT futuros que no especifiquen ese campo.

ALTER TABLE AFILIADO ALTER disponibilidad_semanal_afiliado SET DEFAULT 3;


-- ------------------------------------------------------------------------------------ --
-- DDL 10. Eliminar Valor por Defecto — ALTER TABLE ALTER DROP DEFAULT                --
-- ------------------------------------------------------------------------------------ --
-- PREGUNTA : ¿Cómo eliminar el valor por defecto de disponibilidad_semanal_afiliado?
-- RESPUESTA : ALTER TABLE ALTER ... DROP DEFAULT quita el valor por defecto. Desde ese
--             momento el campo queda obligatorio en cada INSERT (si es NOT NULL).

ALTER TABLE AFILIADO ALTER disponibilidad_semanal_afiliado DROP DEFAULT;


-- ------------------------------------------------------------------------------------ --
-- DDL 11. Mostrar Creación Tabla — SHOW CREATE TABLE                                 --
-- ------------------------------------------------------------------------------------ --
-- PREGUNTA : ¿Cómo ver el SQL completo con el que fue creada la tabla CICLO,
--             incluyendo sus constraints, índices y FKs?
-- RESPUESTA : SHOW CREATE TABLE muestra el CREATE TABLE exacto que MySQL usaría para
--             recrear la tabla. Es útil para documentar, migrar o depurar el schema.

SHOW CREATE TABLE CICLO;
SHOW CREATE TABLE PLAN_NUTRICIONAL;
SHOW CREATE TABLE PROGRESO_FISICO;


-- ------------------------------------------------------------------------------------ --
-- DDL 12. Eliminar Restricción — ALTER TABLE DROP CONSTRAINT                         --
-- ------------------------------------------------------------------------------------ --
-- PREGUNTA : ¿Cómo eliminar la FK fk_ciclo_afiliado de la tabla CICLO?
-- RESPUESTA : ALTER TABLE DROP CONSTRAINT elimina una restricción (FK, CHECK, UNIQUE).
--             Después de esto se podría insertar id_afiliado que no exista en AFILIADO.
-- ⚠️  ADVERTENCIA: Solo demostrativo. Dejamos la FK intacta luego (DDL 23 la restaura).

ALTER TABLE CICLO DROP CONSTRAINT fk_ciclo_afiliado;
ALTER TABLE CICLO DROP CONSTRAINT chk_ciclo_fechas;


-- ------------------------------------------------------------------------------------ --
-- DDL 13. Eliminar Índice — ALTER TABLE DROP INDEX                                   --
-- ------------------------------------------------------------------------------------ --
-- PREGUNTA : ¿Cómo eliminar el índice uq_ciclo_afiliado_inicio de la tabla CICLO?
-- RESPUESTA : ALTER TABLE DROP INDEX elimina un índice sin borrar la columna ni los
--             datos. La columna sigue existiendo pero ya sin la restricción de unicidad.
-- ⚠️  ADVERTENCIA: Solo demostrativo. DDL 22 lo restaura como UNIQUE INDEX.

ALTER TABLE CICLO DROP INDEX uq_ciclo_afiliado_inicio;


-- ------------------------------------------------------------------------------------ --
-- DDL 14. Eliminar Llave Primaria — ALTER TABLE DROP PRIMARY KEY                     --
-- ------------------------------------------------------------------------------------ --
-- PREGUNTA : ¿Cómo eliminar la llave primaria de la tabla EJERCICIO?
-- RESPUESTA : ALTER TABLE DROP PRIMARY KEY elimina la PK. Si la columna era
--             AUTO_INCREMENT, MySQL exige quitarle ese atributo primero.
-- ⚠️  ADVERTENCIA: Solo demostrativo. DDL 19 la restaura.

ALTER TABLE EJERCICIO MODIFY id_ejercicio INT NOT NULL;
ALTER TABLE EJERCICIO DROP PRIMARY KEY;


-- ------------------------------------------------------------------------------------ --
-- DDL 15. Limpiar Registros — TRUNCATE                                               --
-- ------------------------------------------------------------------------------------ --
-- PREGUNTA : ¿Cómo borrar todos los registros de PROGRESO_FISICO manteniendo
--             la estructura de la tabla intacta?
-- RESPUESTA : TRUNCATE elimina todos los registros rápidamente y reinicia el
--             AUTO_INCREMENT. A diferencia de DELETE sin WHERE, no se puede deshacer.
-- ⚠️  ADVERTENCIA: Solo demostrativo. Borra TODOS los progresos físicos.

-- TRUNCATE PROGRESO_FISICO;


-- ------------------------------------------------------------------------------------ --
-- DDL 16. Eliminar Tabla — DROP TABLE                                                --
-- ------------------------------------------------------------------------------------ --
-- PREGUNTA : ¿Cómo eliminar completamente la tabla RUTINA_EJERCICIO del schema?
-- RESPUESTA : DROP TABLE borra la tabla, su estructura y todos sus datos de forma
--             permanente. Si otras tablas la referencian con FK, primero hay que
--             eliminar esas restricciones.
-- ⚠️  ADVERTENCIA: Solo demostrativo. No ejecutar sobre MetaFit real.

-- DROP TABLE RUTINA_EJERCICIO;


-- ------------------------------------------------------------------------------------ --
-- DDL 17. Crear Tabla — CREATE TABLE                                                 --
-- ------------------------------------------------------------------------------------ --
-- PREGUNTA : ¿Cómo crear una tabla REPORTE_MENSUAL para que los entrenadores registren
--             un resumen mensual del rendimiento de cada afiliado?
-- RESPUESTA : CREATE TABLE define la estructura de una nueva tabla con sus columnas,
--             tipos, restricciones e índices. Se crea vacía, lista para recibir datos.

CREATE TABLE IF NOT EXISTS `REPORTE_MENSUAL` (
  `id_reporte`   INT NOT NULL AUTO_INCREMENT,
  `id_afiliado`  INT NOT NULL,
  `id_usuario`   INT NOT NULL,
  `mes`          TINYINT(2) NOT NULL,
  `anio`         YEAR NOT NULL,
  `observacion`  VARCHAR(500) NULL,
  `fecha_emision` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE = InnoDB;


-- ------------------------------------------------------------------------------------ --
-- DDL 18. Renombrar Tabla — RENAME TABLE                                             --
-- ------------------------------------------------------------------------------------ --
-- PREGUNTA : ¿Cómo renombrar la tabla REPORTE_MENSUAL a REPORTE_GYM?
-- RESPUESTA : RENAME TABLE cambia el nombre de una tabla sin tocar sus datos ni
--             su estructura. Si otras tablas tienen FKs hacia ella, esas FKs se
--             actualizan automáticamente.

RENAME TABLE REPORTE_MENSUAL TO REPORTE_GYM;
RENAME TABLE REPORTE_GYM TO REPORTE_MENSUAL;


-- ------------------------------------------------------------------------------------ --
-- DDL 19. Crear Llave Primaria — ALTER TABLE ADD PRIMARY KEY                         --
-- ------------------------------------------------------------------------------------ --
-- PREGUNTA : ¿Cómo restaurar la llave primaria de EJERCICIO después de haberla
--             eliminado en DDL 14?
-- RESPUESTA : ALTER TABLE ADD PRIMARY KEY define la columna o conjunto de columnas
--             que identificarán cada fila de forma única. Se puede hacer después de
--             crear la tabla con ALTER.

ALTER TABLE EJERCICIO ADD PRIMARY KEY (id_ejercicio);
ALTER TABLE EJERCICIO MODIFY id_ejercicio INT NOT NULL AUTO_INCREMENT;


-- ------------------------------------------------------------------------------------ --
-- DDL 20. Crear Índice por Campo — CREATE INDEX                                      --
-- ------------------------------------------------------------------------------------ --
-- PREGUNTA : ¿Cómo crear un índice en AFILIADO sobre el campo estado_afiliacion
--             para acelerar las búsquedas de afiliados activos o inactivos?
-- RESPUESTA : CREATE INDEX crea un índice en una columna. No impide duplicados
--             (para eso se usa UNIQUE INDEX). Mejora el rendimiento de consultas
--             SELECT con WHERE en esa columna.

CREATE INDEX ind_estado_afiliacion ON AFILIADO (estado_afiliacion);


-- ------------------------------------------------------------------------------------ --
-- DDL 21. Crear Índice Multicampo — CREATE INDEX multicampo                          --
-- ------------------------------------------------------------------------------------ --
-- PREGUNTA : ¿Cómo crear un índice compuesto en CICLO sobre (id_afiliado, activo)
--             para acelerar consultas de ciclos activos por afiliado?
-- RESPUESTA : Un índice compuesto cubre consultas que filtran por ambas columnas
--             a la vez (WHERE id_afiliado = x AND activo = 1). Es más eficiente
--             que dos índices separados para ese patrón de consulta.

CREATE INDEX ind_ciclo_afiliado_activo ON CICLO (id_afiliado, activo);


-- ------------------------------------------------------------------------------------ --
-- DDL 22. Crear Índice Único — CREATE UNIQUE INDEX                                   --
-- ------------------------------------------------------------------------------------ --
-- PREGUNTA : ¿Cómo restaurar el índice único (id_afiliado, fecha_inicio_ciclo)
--             en CICLO que fue eliminado en DDL 13?
-- RESPUESTA : CREATE UNIQUE INDEX crea un índice que además impide duplicados.
--             Equivale a una restricción UNIQUE sobre esa columna o combinación.

CREATE UNIQUE INDEX uq_ciclo_afiliado_inicio
ON CICLO (id_afiliado, fecha_inicio_ciclo);


-- ------------------------------------------------------------------------------------ --
-- DDL 23. Crear Restricción FK — ALTER TABLE ADD CONSTRAINT FOREIGN KEY              --
-- ------------------------------------------------------------------------------------ --
-- PREGUNTA : ¿Cómo restaurar la FK fk_ciclo_afiliado en CICLO que fue eliminada
--             en DDL 12, incluyendo el CHECK de fechas?
-- RESPUESTA : ALTER TABLE ADD CONSTRAINT permite agregar FKs y CHECKs después de
--             crear la tabla. ON DELETE RESTRICT impide borrar un afiliado si tiene
--             ciclos. ON UPDATE CASCADE propaga cambios del id.

ALTER TABLE CICLO ADD
CONSTRAINT fk_ciclo_afiliado
  FOREIGN KEY (id_afiliado)
  REFERENCES AFILIADO (id_afiliado)
  ON DELETE RESTRICT
  ON UPDATE CASCADE;

ALTER TABLE CICLO ADD
CONSTRAINT chk_ciclo_fechas
  CHECK (fecha_fin_ciclo > fecha_inicio_ciclo);


/* ==================================================================================== */
/* ============================= SECCIÓN B — DML ===================================== */
/* ======================== DATA MANIPULATION LANGUAGE =============================== */
/* ========================= UNA TABLA — INSERCIÓN =================================== */
/* ==================================================================================== */

/* ==================================================================================== */
/* ------------------- 1.1.1 INSERT INTO — DATOS CORRECTOS --------------------------- */
/* ==================================================================================== */

-- ------------------------------------------------------------------------------------ --
-- DML 1.1.1-A. Insertar usuarios del sistema
-- ------------------------------------------------------------------------------------ --
-- PREGUNTA : ¿Cómo registrar los usuarios del personal de MetaFit (administradores,
--             entrenadores y recepcionistas)?
-- RESPUESTA : INSERT INTO con múltiples filas en un solo statement es más eficiente
--             que varios INSERT separados. Los campos con DEFAULT no se necesitan
--             especificar si se usa la sintaxis de columnas explícitas.

INSERT INTO USUARIO
  (nombres_usuario, apellidos_usuario, correo_usuario,
   contrasena_usuario, rol_usuario, estado_cuenta_usuario)
VALUES
  ('Carlos',     'Ramírez',  'carlos@metafit.com',    SHA2('admin123',256),  'Administrador', 'Activo'),
  ('Laura',      'Gómez',    'laura@metafit.com',     SHA2('train456',256),  'Entrenador',    'Activo'),
  ('Andrés',     'Torres',   'andres@metafit.com',    SHA2('train789',256),  'Entrenador',    'Activo'),
  ('María',      'López',    'maria@metafit.com',     SHA2('recep111',256),  'Recepcionista', 'Activo'),
  ('Pedro',      'Suárez',   'pedro@metafit.com',     SHA2('recep222',256),  'Recepcionista', 'Pendiente');


-- ------------------------------------------------------------------------------------ --
-- DML 1.1.1-B. Insertar afiliados del gimnasio
-- ------------------------------------------------------------------------------------ --
-- PREGUNTA : ¿Cómo registrar varios afiliados nuevos en el gimnasio en una sola
--             operación?
-- RESPUESTA : Se especifican todas las columnas NOT NULL. Los campos NULL opcionales
--             (grupo_muscular_prioritario, fecha_ultima_modificacion) se pasan como NULL.
--             registrado_por referencia el id de la recepcionista que los ingresó.

INSERT INTO AFILIADO
  (nombres_afiliado, apellidos_afiliado, documento_afiliado,
   fecha_nacimiento_afiliado, sexo_afiliado, correo_afiliado,
   direccion_afiliado, telefono_afiliado, estatura_afiliado,
   objetivo_fisico_afiliado, grupo_muscular_prioritario,
   nivel_experiencia_afiliado, disponibilidad_semanal_afiliado,
   estado_afiliacion, registrado_por)
VALUES
  ('Juan',      'Martínez', 1001234567, '1990-03-15', 'Masculino', 'juan@gmail.com',
   'Calle 10 # 5-20',      '3001234567', 175.50, 'Pérdida de grasa', 'Pecho',    'Principiante', 3, 'Activo',   4),
  ('Ana',       'Rodríguez',1002345678, '1995-07-22', 'Femenino',  'ana@gmail.com',
   'Carrera 15 # 8-30',    '3012345678', 162.00, 'Aumento de masa',  'Glúteos',  'Intermedio',   5, 'Activo',   4),
  ('Luis',      'Herrera',  1003456789, '1988-11-05', 'Masculino', 'luis@gmail.com',
   'Av 20 # 3-10',         '3023456789', 180.00, 'Mantenimiento',    'Espalda',  'Avanzado',     6, 'Activo',   5),
  ('Sofía',     'Castro',   1004567890, '2000-01-30', 'Femenino',  'sofia@gmail.com',
   'Calle 25 # 12-5',      '3034567890', 158.50, 'Pérdida de grasa', NULL,       'Principiante', 4, 'Activo',   5),
  ('Diego',     'Vargas',   1005678901, '1993-05-18', 'Masculino', 'diego@gmail.com',
   'Carrera 7 # 45-20',    '3045678901', 172.00, 'Aumento de masa',  'Piernas',  'Intermedio',   4, 'Activo',   4),
  ('Valentina', 'Mora',     1006789012, '1997-09-12', 'Femenino',  'valentina@gmail.com',
   'Calle 50 # 20-15',     '3056789012', 165.00, 'Mantenimiento',    'Core',     'Principiante', 3, 'Inactivo', 4),
  ('Camilo',    'Jiménez',  1007890123, '1985-02-28', 'Masculino', 'camilo@gmail.com',
   'Av 30 # 15-8',         '3067890123', 183.00, 'Pérdida de grasa', 'Hombros',  'Avanzado',     5, 'Activo',   5),
  ('Daniela',   'Reyes',    1008901234, '2002-06-10', 'Femenino',  'daniela@gmail.com',
   'Carrera 20 # 10-30',   '3078901234', 160.00, 'Pérdida de grasa', 'Bíceps',   'Principiante', 2, 'Activo',   4);


-- ------------------------------------------------------------------------------------ --
-- DML 1.1.1-C. Insertar restricciones médicas y medicamentos
-- ------------------------------------------------------------------------------------ --
-- PREGUNTA : ¿Cómo cargar el catálogo de restricciones médicas, lesiones, alergias
--             y medicamentos que maneja MetaFit?
-- RESPUESTA : efecto_relevante es NULL cuando la restricción no tiene un efecto
--             farmacológico específico (por ejemplo, alergias simples).

INSERT INTO RESTRICCION
  (nombre_restriccion, tipo_restriccion, efecto_relevante)
VALUES
  ('Diabetes tipo 2',        'Enfermedad',  'Evitar ejercicio de alta intensidad sin supervisión'),
  ('Hipertensión arterial',  'Enfermedad',  'Controlar frecuencia cardíaca durante el ejercicio'),
  ('Lesión rodilla derecha', 'Lesión',      'Evitar carga axial sobre rodilla derecha'),
  ('Alergia al gluten',      'Alergia',     NULL),
  ('Intolerancia a lactosa', 'Alergia',     NULL),
  ('Metformina',             'Medicamento', 'Puede causar hipoglucemia en ejercicio intenso');


-- ------------------------------------------------------------------------------------ --
-- DML 1.1.1-D. Insertar restricciones de afiliados (tabla pivot)
-- ------------------------------------------------------------------------------------ --
-- PREGUNTA : ¿Cómo registrar qué restricciones tiene cada afiliado?
-- RESPUESTA : AFILIADO_RESTRICCION es una tabla pivot N:M. Solo contiene las FKs.
--             Juan (1) tiene hipertensión (2). Ana (2) tiene intolerancia a lactosa (5).

INSERT INTO AFILIADO_RESTRICCION (id_afiliado, id_restriccion) VALUES
  (1, 2),
  (2, 5),
  (3, 1),
  (3, 6),
  (7, 3);


-- ------------------------------------------------------------------------------------ --
-- DML 1.1.1-E. Insertar catálogo de ejercicios
-- ------------------------------------------------------------------------------------ --
-- PREGUNTA : ¿Cómo cargar el catálogo de ejercicios disponibles en MetaFit?
-- RESPUESTA : descripcion es NULL opcional. nivel_minimo indica el nivel de experiencia
--             mínimo que debe tener un afiliado para que el motor le asigne ese ejercicio.

INSERT INTO EJERCICIO
  (nombre_ejercicio, grupo_muscular, descripcion, nivel_minimo)
VALUES
  ('Sentadilla',           'Piernas',  'Ejercicio compuesto de miembro inferior',           'Principiante'),
  ('Press de banca',       'Pecho',    'Empuje horizontal con barra en banco plano',         'Principiante'),
  ('Peso muerto',          'Espalda',  'Ejercicio de cadena posterior con barra',            'Intermedio'),
  ('Press militar',        'Hombros',  'Empuje vertical sobre cabeza con barra',             'Intermedio'),
  ('Curl de bíceps',       'Bíceps',   'Flexión de codo con mancuerna',                     'Principiante'),
  ('Extensión de tríceps', 'Tríceps',  'Extensión de codo en polea alta',                   'Principiante'),
  ('Plancha isométrica',   'Core',     'Contracción isométrica de core en posición prona',   'Principiante'),
  ('Hip thrust',           'Glúteos',  'Empuje de cadera con barra sobre banco',             'Intermedio'),
  ('Dominadas',            'Espalda',  'Jalón con peso corporal en barra fija',              'Avanzado'),
  ('Zancadas',             'Piernas',  'Paso largo alternado con mancuernas',                'Intermedio');


-- ------------------------------------------------------------------------------------ --
-- DML 1.1.1-F. Insertar exclusiones ejercicio-restricción
-- ------------------------------------------------------------------------------------ --
-- PREGUNTA : ¿Cómo registrar qué ejercicios deben excluirse para cada restricción?
-- RESPUESTA : El motor automático de planes consulta esta tabla para no asignar
--             ejercicios incompatibles con las restricciones del afiliado.

INSERT INTO EJERCICIO_RESTRICCION_EXCLUIDA (id_ejercicio, id_restriccion) VALUES
  (1, 3),  -- Sentadilla excluida si hay lesión de rodilla
  (8, 3),  -- Hip thrust excluida si hay lesión de rodilla
  (10, 3), -- Zancadas excluidas si hay lesión de rodilla
  (3, 2),  -- Peso muerto excluido si hay hipertensión
  (4, 2),  -- Press militar excluido si hay hipertensión
  (3, 1),  -- Peso muerto excluido si hay diabetes tipo 2
  (9, 1);  -- Dominadas excluidas si hay diabetes tipo 2


-- ------------------------------------------------------------------------------------ --
-- DML 1.1.1-G. Insertar catálogo de alimentos
-- ------------------------------------------------------------------------------------ --
-- PREGUNTA : ¿Cómo registrar los alimentos del catálogo nutricional de MetaFit?
-- RESPUESTA : Los macros (proteínas, carbohidratos, grasas) se expresan en gramos
--             por 100g del alimento. Las calorías NO se almacenan — se calculan
--             automáticamente en la VIEW alimento_con_calorias.

INSERT INTO ALIMENTO
  (nombre_alimento, proteinas, carbohidratos, grasas)
VALUES
  ('Pechuga de pollo', 31.00,  0.00, 3.60),
  ('Arroz blanco',      2.70, 28.00, 0.30),
  ('Huevo entero',     13.00,  1.10,11.00),
  ('Avena',            17.00, 66.00, 7.00),
  ('Brócoli',           2.80,  7.00, 0.40),
  ('Atún en agua',     29.00,  0.00, 0.50),
  ('Batata',            1.60, 20.00, 0.10),
  ('Almendras',        21.00, 22.00,50.00),
  ('Leche deslactosada', 3.40, 4.80, 3.60),
  ('Quinoa',           14.00, 64.00, 6.00);


-- ------------------------------------------------------------------------------------ --
-- DML 1.1.1-H. Insertar exclusiones alimento-restricción
-- ------------------------------------------------------------------------------------ --
-- PREGUNTA : ¿Cómo registrar qué alimentos deben excluirse para cada restricción?
-- RESPUESTA : El motor nutricional consulta esta tabla para no incluir alimentos
--             incompatibles con las restricciones/medicamentos del afiliado.

INSERT INTO ALIMENTO_RESTRICCION_EXCLUIDA (id_alimento, id_restriccion) VALUES
  (9, 5),  -- Leche deslactosada excluida si intolerancia a lactosa
  (4, 5),  -- Avena excluida si alergia al gluten
  (2, 1),  -- Arroz blanco (alto índice glucémico) excluido en diabetes
  (7, 1);  -- Batata excluida en diabetes tipo 2


-- ------------------------------------------------------------------------------------ --
-- DML 1.1.1-I. Insertar ciclos de entrenamiento
-- ------------------------------------------------------------------------------------ --
-- PREGUNTA : ¿Cómo registrar los ciclos de entrenamiento de los afiliados?
-- RESPUESTA : Cada CICLO pertenece a un afiliado y define el período del plan.
--             fecha_creacion se llena automáticamente con CURRENT_TIMESTAMP.

INSERT INTO CICLO
  (id_afiliado, fecha_inicio_ciclo, fecha_fin_ciclo, activo)
VALUES
  (1, '2024-01-08', '2024-03-08', 0),
  (2, '2024-02-01', '2024-04-01', 0),
  (1, '2024-03-11', '2024-05-11', 1),
  (3, '2024-01-15', '2024-03-15', 1),
  (5, '2024-02-20', '2024-04-20', 1),
  (7, '2024-03-01', '2024-04-30', 1),
  (4, '2024-04-01', '2024-06-01', 1);


-- ------------------------------------------------------------------------------------ --
-- DML 1.1.1-J. Insertar planes de entrenamiento
-- ------------------------------------------------------------------------------------ --
-- PREGUNTA : ¿Cómo registrar los planes de entrenamiento de cada ciclo?
-- RESPUESTA : Relación 1:1 con CICLO (UNIQUE en id_ciclo). modificado_por es NULL
--             si el plan fue generado automáticamente sin intervención de entrenador.

INSERT INTO PLAN_ENTRENAMIENTO
  (id_ciclo, es_automatico, modificado_por, observaciones)
VALUES
  (1, 1, NULL,  NULL),
  (2, 1, NULL,  NULL),
  (3, 0, 2,     'Plan ajustado manualmente por entrenadora para énfasis en pecho'),
  (4, 1, NULL,  NULL),
  (5, 1, NULL,  NULL),
  (6, 0, 3,     'Plan avanzado con énfasis en hombros y espalda'),
  (7, 1, NULL,  NULL);


-- ------------------------------------------------------------------------------------ --
-- DML 1.1.1-K. Insertar planes nutricionales
-- ------------------------------------------------------------------------------------ --
-- PREGUNTA : ¿Cómo registrar los planes nutricionales de cada ciclo?
-- RESPUESTA : calorias_estimadas es el objetivo calórico diario. num_comidas_diarias
--             define cuántas comidas tendrá el plan. El motor distribuye los alimentos.

INSERT INTO PLAN_NUTRICIONAL
  (id_ciclo, calorias_estimadas, num_comidas_diarias, es_automatico, modificado_por, observaciones)
VALUES
  (1, 2000.00, 5, 1, NULL,  NULL),
  (2, 1800.00, 4, 1, NULL,  NULL),
  (3, 2200.00, 5, 0, 3,     'Plan ajustado: mayor proteína para fase de volumen'),
  (4, 2500.00, 6, 1, NULL,  NULL),
  (5, 2800.00, 5, 1, NULL,  NULL),
  (6, 2400.00, 5, 0, 2,     'Restricción de carbohidratos simples por diabetes'),
  (7, 1700.00, 4, 1, NULL,  NULL);


-- ------------------------------------------------------------------------------------ --
-- DML 1.1.1-L. Insertar rutinas
-- ------------------------------------------------------------------------------------ --
-- PREGUNTA : ¿Cómo registrar las rutinas diarias de un plan de entrenamiento?
-- RESPUESTA : Cada RUTINA pertenece a un PLAN_ENTRENAMIENTO y se asigna a un día
--             de la semana (1=lunes...7=domingo). UNIQUE (id_plan, dia_numero) impide
--             asignar dos rutinas al mismo día del mismo plan.

INSERT INTO RUTINA
  (id_plan_entrenamiento, nombre_rutina, enfoque_muscular, dia_numero)
VALUES
  (1, 'Día 1 — Pecho y Bíceps',    'Pecho',     1),
  (1, 'Día 2 — Piernas',           'Piernas',   3),
  (1, 'Día 3 — Espalda y Tríceps', 'Espalda',   5),
  (3, 'Día A — Full Body Empuje',  'Empuje',    1),
  (3, 'Día B — Full Body Jale',    'Jale',      4),
  (6, 'Día 1 — Hombros y Core',    'Hombros',   2),
  (6, 'Día 2 — Espalda Completa',  'Espalda',   4),
  (7, 'Día 1 — Cuerpo Completo A', 'Full Body', 2),
  (7, 'Día 2 — Cuerpo Completo B', 'Full Body', 5);


-- ------------------------------------------------------------------------------------ --
-- DML 1.1.1-M. Insertar ejercicios en rutinas
-- ------------------------------------------------------------------------------------ --
-- PREGUNTA : ¿Cómo asignar ejercicios a las rutinas con sus series, repeticiones
--             y orden de ejecución?
-- RESPUESTA : PK natural (id_rutina, id_ejercicio) impide repetir el mismo ejercicio
--             en la misma rutina. UNIQUE (id_rutina, orden) impide posiciones repetidas.

INSERT INTO RUTINA_EJERCICIO
  (id_rutina, id_ejercicio, series, repeticiones, orden)
VALUES
  (1, 2, 4, 10, 1),  -- Rutina 1: Press de banca, 4x10
  (1, 5, 3, 12, 2),  -- Rutina 1: Curl de bíceps, 3x12
  (1, 7, 3, 30, 3),  -- Rutina 1: Plancha 3x30seg
  (2, 1, 4, 12, 1),  -- Rutina 2: Sentadilla, 4x12
  (2, 10, 3, 15, 2), -- Rutina 2: Zancadas, 3x15
  (3, 3, 4,  8, 1),  -- Rutina 3: Peso muerto, 4x8
  (3, 9, 3,  8, 2),  -- Rutina 3: Dominadas, 3x8
  (3, 6, 3, 12, 3),  -- Rutina 3: Extensión tríceps, 3x12
  (4, 2, 3,  8, 1),  -- Rutina 4: Press de banca, 3x8
  (4, 1, 3, 10, 2),  -- Rutina 4: Sentadilla, 3x10
  (4, 4, 3,  8, 3),  -- Rutina 4: Press militar, 3x8
  (5, 3, 3,  8, 1),  -- Rutina 5: Peso muerto, 3x8
  (5, 9, 3,  6, 2),  -- Rutina 5: Dominadas, 3x6
  (5, 8, 3, 12, 3);  -- Rutina 5: Hip thrust, 3x12


-- ------------------------------------------------------------------------------------ --
-- DML 1.1.1-N. Insertar detalle nutricional
-- ------------------------------------------------------------------------------------ --
-- PREGUNTA : ¿Cómo asignar alimentos a cada comida de un plan nutricional?
-- RESPUESTA : PK natural (id_plan, id_alimento, numero_comida) garantiza que el mismo
--             alimento no aparezca dos veces en la misma comida del mismo plan.
--             cantidad se expresa en gramos.

INSERT INTO DETALLE_NUTRICIONAL
  (id_plan_nutricional, id_alimento, numero_comida, cantidad)
VALUES
  -- Plan 1 (Juan, ciclo 1) — 5 comidas
  (1, 3, 1, 200.00), -- Comida 1: Huevo entero 200g
  (1, 4, 1,  80.00), -- Comida 1: Avena 80g
  (1, 1, 2, 150.00), -- Comida 2: Pechuga de pollo 150g
  (1, 2, 2, 100.00), -- Comida 2: Arroz blanco 100g
  (1, 5, 2, 100.00), -- Comida 2: Brócoli 100g
  (1, 8, 3,  30.00), -- Comida 3 (snack): Almendras 30g
  (1, 1, 4, 150.00), -- Comida 4: Pechuga de pollo 150g
  (1, 7, 4, 150.00), -- Comida 4: Batata 150g
  (1, 6, 5, 120.00), -- Comida 5: Atún en agua 120g
  (1, 5, 5, 100.00), -- Comida 5: Brócoli 100g
  -- Plan 3 (Juan, ciclo 3) — 5 comidas ajustadas
  (3, 3, 1, 250.00), -- Comida 1: Huevo entero 250g
  (3, 4, 1,  60.00), -- Comida 1: Avena 60g
  (3, 1, 2, 200.00), -- Comida 2: Pechuga 200g
  (3, 10,2, 100.00), -- Comida 2: Quinoa 100g
  (3, 6, 3, 150.00), -- Comida 3: Atún 150g
  (3, 5, 3, 150.00); -- Comida 3: Brócoli 150g


-- ------------------------------------------------------------------------------------ --
-- DML 1.1.1-O. Insertar progreso físico
-- ------------------------------------------------------------------------------------ --
-- PREGUNTA : ¿Cómo registrar el progreso físico de un afiliado durante su ciclo?
-- RESPUESTA : PK natural (id_ciclo, fecha_registro) impide registrar dos mediciones
--             el mismo día dentro del mismo ciclo. registrado_por es el entrenador
--             o administrador que tomó las medidas.

INSERT INTO PROGRESO_FISICO
  (id_ciclo, fecha_registro, peso, porcentaje_grasa,
   medida_cintura, medida_brazo, medida_pierna, observaciones, registrado_por)
VALUES
  (1, '2024-01-08', 85.00, 22.50, 92.00, 35.00, 58.00, 'Medición inicial del ciclo', 4),
  (1, '2024-01-29', 83.50, 21.80, 90.50, 35.50, 58.50, 'Progreso positivo en grasa',  2),
  (1, '2024-02-19', 82.00, 21.00, 89.00, 36.00, 59.00, NULL,                           2),
  (2, '2024-02-01', 65.00, 28.00, 75.00, 28.00, 52.00, 'Medición inicial del ciclo',  4),
  (2, '2024-02-22', 66.00, 27.50, 75.50, 28.50, 52.50, NULL,                           2),
  (3, '2024-03-11', 81.50, 20.50, 88.00, 36.50, 59.50, 'Inicio ciclo 2 de Juan',       2),
  (4, '2024-01-15', 90.00, 18.00, 95.00, 40.00, 62.00, 'Medición inicial Luis',        2),
  (5, '2024-02-20', 78.00, 16.50, 84.00, 38.00, 60.00, 'Medición inicial Diego',       3),
  (6, '2024-03-01', 88.00, 17.00, 92.00, 42.00, 63.00, 'Medición inicial Camilo',      3),
  (6, '2024-04-01', 86.00, 16.00, 90.00, 43.00, 63.50, 'Progreso en pérdida de grasa', 2);


/* ==================================================================================== */
/* ------------------- 1.1.2 INSERT INTO — DATOS INCORRECTOS ------------------------- */
/* ==================================================================================== */

-- ------------------------------------------------------------------------------------ --
-- DML 1.1.2-A. Violación de CHECK — estatura fuera de rango
-- ------------------------------------------------------------------------------------ --
-- PREGUNTA : ¿Qué pasa si se intenta registrar un afiliado con una estatura
--             imposible como 50 cm o 300 cm?
-- RESPUESTA : MySQL rechaza el INSERT con ERROR 3819 porque CHECK (estatura BETWEEN
--             100.00 AND 250.00) no se cumple. El registro no se guarda.

-- INSERT INTO AFILIADO
--   (nombres_afiliado, apellidos_afiliado, documento_afiliado, fecha_nacimiento_afiliado,
--    sexo_afiliado, correo_afiliado, direccion_afiliado, telefono_afiliado,
--    estatura_afiliado, objetivo_fisico_afiliado, nivel_experiencia_afiliado,
--    disponibilidad_semanal_afiliado, registrado_por)
-- VALUES
--   ('Test', 'Error', 9999999999, '1990-01-01', 'Masculino', 'test@gmail.com',
--    'Calle 0', '3000000000', 300.00, 'Mantenimiento', 'Principiante', 3, 1);
-- ERROR 3819 (HY000): Check constraint 'afiliado_chk_1' is violated.


-- ------------------------------------------------------------------------------------ --
-- DML 1.1.2-B. Violación de UNIQUE — correo duplicado
-- ------------------------------------------------------------------------------------ --
-- PREGUNTA : ¿Qué pasa si se intenta registrar un afiliado con un correo que ya
--             existe en la tabla?
-- RESPUESTA : MySQL rechaza el INSERT con ERROR 1062 (Duplicate entry) porque
--             UNIQUE INDEX correo_afiliado_UNIQUE no permite dos iguales.

-- INSERT INTO AFILIADO
--   (nombres_afiliado, apellidos_afiliado, documento_afiliado, fecha_nacimiento_afiliado,
--    sexo_afiliado, correo_afiliado, direccion_afiliado, telefono_afiliado,
--    estatura_afiliado, objetivo_fisico_afiliado, nivel_experiencia_afiliado,
--    disponibilidad_semanal_afiliado, registrado_por)
-- VALUES
--   ('Otro', 'Persona', 1111111111, '1990-01-01', 'Masculino', 'juan@gmail.com',
--    'Calle 1', '3001111111', 170.00, 'Mantenimiento', 'Principiante', 3, 1);
-- ERROR 1062 (23000): Duplicate entry 'juan@gmail.com' for key 'correo_afiliado_UNIQUE'


-- ------------------------------------------------------------------------------------ --
-- DML 1.1.2-C. Violación de CHECK — fecha_fin antes que fecha_inicio en CICLO
-- ------------------------------------------------------------------------------------ --
-- PREGUNTA : ¿Qué pasa si se registra un ciclo donde la fecha de fin es anterior
--             a la de inicio?
-- RESPUESTA : MySQL rechaza el INSERT con ERROR 3819 porque CHECK (fecha_fin_ciclo
--             > fecha_inicio_ciclo) no se cumple. Imposible crear un ciclo que
--             termina antes de empezar.

-- INSERT INTO CICLO (id_afiliado, fecha_inicio_ciclo, fecha_fin_ciclo, activo)
-- VALUES (1, '2024-06-01', '2024-05-01', 1);
-- ERROR 3819 (HY000): Check constraint 'chk_ciclo_fechas' is violated.


-- ------------------------------------------------------------------------------------ --
-- DML 1.1.2-D. Violación de FK — usuario que no existe como registrado_por
-- ------------------------------------------------------------------------------------ --
-- PREGUNTA : ¿Qué pasa si se intenta registrar un afiliado señalando un id de
--             usuario que no existe en la tabla USUARIO?
-- RESPUESTA : MySQL rechaza el INSERT con ERROR 1452 porque fk_afiliado_registrado_por
--             exige que registrado_por exista en USUARIO.id_usuario.

-- INSERT INTO AFILIADO
--   (nombres_afiliado, apellidos_afiliado, documento_afiliado, fecha_nacimiento_afiliado,
--    sexo_afiliado, correo_afiliado, direccion_afiliado, telefono_afiliado,
--    estatura_afiliado, objetivo_fisico_afiliado, nivel_experiencia_afiliado,
--    disponibilidad_semanal_afiliado, registrado_por)
-- VALUES
--   ('Sin', 'Usuario', 7777777777, '1990-01-01', 'Masculino', 'sinusuario@gmail.com',
--    'Calle X', '3007777777', 170.00, 'Mantenimiento', 'Principiante', 3, 999);
-- ERROR 1452 (23000): Cannot add or update a child row: a foreign key constraint fails


-- ------------------------------------------------------------------------------------ --
-- DML 1.1.2-E. Violación de disponibilidad fuera de rango (CHECK 1-7)
-- ------------------------------------------------------------------------------------ --
-- PREGUNTA : ¿Qué pasa si se registra un afiliado con disponibilidad = 0 días
--             o 10 días a la semana?
-- RESPUESTA : MySQL rechaza el INSERT con ERROR 3819 porque CHECK
--             (disponibilidad_semanal_afiliado BETWEEN 1 AND 7) no se cumple.

-- INSERT INTO AFILIADO (..., disponibilidad_semanal_afiliado, ...)
-- VALUES (..., 10, ...);
-- ERROR 3819 (HY000): Check constraint 'afiliado_chk_2' is violated.


/* ==================================================================================== */
/* ------------------- 1.2 UPDATE — ACTUALIZAR --------------------------------------- */
/* ==================================================================================== */

-- ------------------------------------------------------------------------------------ --
-- DML 1.2-A. Actualizar estado de afiliación
-- ------------------------------------------------------------------------------------ --
-- PREGUNTA : ¿Cómo desactivar la cuenta de la afiliada Valentina Mora (id=6)
--             y registrar la fecha del cambio?
-- RESPUESTA : UPDATE con SET modifica columnas específicas de las filas que cumplen
--             el WHERE. Sin WHERE, afectaría TODOS los registros de la tabla.

UPDATE AFILIADO SET
  estado_afiliacion          = 'Inactivo',
  fecha_ultimo_cambio_estado = NOW()
WHERE id_afiliado = 6;


-- ------------------------------------------------------------------------------------ --
-- DML 1.2-B. Actualizar nivel de experiencia de un afiliado
-- ------------------------------------------------------------------------------------ --
-- PREGUNTA : ¿Cómo actualizar el nivel de experiencia de Juan Martínez (id=1)
--             de Principiante a Intermedio después de completar su primer ciclo?
-- RESPUESTA : Se actualiza nivel_experiencia_afiliado y se registra la fecha de
--             modificación para auditoría del cambio.

UPDATE AFILIADO SET
  nivel_experiencia_afiliado = 'Intermedio',
  fecha_ultima_modificacion  = NOW()
WHERE id_afiliado = 1;


-- ------------------------------------------------------------------------------------ --
-- DML 1.2-C. Actualizar plan de entrenamiento para marcarlo como modificado
-- ------------------------------------------------------------------------------------ --
-- PREGUNTA : ¿Cómo marcar un plan de entrenamiento como modificado manualmente
--             y asignar qué entrenador lo editó?
-- RESPUESTA : Es_automatico pasa a 0 (modificado manualmente) y se registra
--             el id del entrenador que hizo el cambio en modificado_por.

UPDATE PLAN_ENTRENAMIENTO SET
  es_automatico  = 0,
  modificado_por = 2,
  observaciones  = 'Plan ajustado: mayor volumen en pecho por solicitud del afiliado'
WHERE id_plan_entrenamiento = 1;


-- ------------------------------------------------------------------------------------ --
-- DML 1.2-D. Actualizar ciclo inactivo
-- ------------------------------------------------------------------------------------ --
-- PREGUNTA : ¿Cómo cerrar un ciclo activo cambiando su estado a inactivo?
-- RESPUESTA : Se actualiza el campo activo del ciclo. Los ciclos inactivos son
--             historial — sus datos se conservan pero ya no se usan para generar planes.

UPDATE CICLO SET activo = 0
WHERE id_ciclo = 4;


/* ==================================================================================== */
/* ------------------- 1.3 DELETE — ELIMINAR ---------------------------------------- */
/* ==================================================================================== */

-- ------------------------------------------------------------------------------------ --
-- DML 1.3-A. Eliminar un ejercicio del catálogo
-- ------------------------------------------------------------------------------------ --
-- PREGUNTA : ¿Cómo eliminar el ejercicio "Plancha isométrica" (id=7) del catálogo
--             si no está asignado a ninguna rutina?
-- RESPUESTA : DELETE FROM elimina filas que cumplen el WHERE. Si el ejercicio estuviera
--             en RUTINA_EJERCICIO, MySQL lanzaría ERROR 1451 por la FK (ON DELETE RESTRICT).

DELETE FROM EJERCICIO
WHERE id_ejercicio = 7;


-- ------------------------------------------------------------------------------------ --
-- DML 1.3-B. Eliminar el progreso físico de un registro específico
-- ------------------------------------------------------------------------------------ --
-- PREGUNTA : ¿Cómo eliminar un registro de progreso físico ingresado por error
--             (ciclo 2, fecha 2024-02-22)?
-- RESPUESTA : Se usa la PK compuesta (id_ciclo, fecha_registro) en el WHERE para
--             identificar exactamente qué fila eliminar sin afectar otros registros.

DELETE FROM PROGRESO_FISICO
WHERE id_ciclo = 2 AND fecha_registro = '2024-02-22';


/* ==================================================================================== */
/* ==================================================================================== */
/* ============================= DML — CONSULTAS DE SELECCIÓN ======================== */
/* ==================================================================================== */
/* ==================================================================================== */

/* ==================================================================================== */
/* ------------------- 2.1 SELECT * — GENERALES -------------------------------------- */
/* ==================================================================================== */

-- ------------------------------------------------------------------------------------ --
-- DML 2.1-A.
-- ------------------------------------------------------------------------------------ --
-- PREGUNTA : ¿Cómo consultar todos los registros y columnas de la tabla AFILIADO?
-- RESPUESTA : SELECT * FROM devuelve TODAS las columnas de todos los registros.
--             Es útil para explorar datos, pero en producción es mejor especificar
--             las columnas que se necesitan.

SELECT * FROM AFILIADO;


-- ------------------------------------------------------------------------------------ --
-- DML 2.1-B.
-- ------------------------------------------------------------------------------------ --
-- PREGUNTA : ¿Cómo ver todos los ejercicios del catálogo de MetaFit?
-- RESPUESTA : SELECT * FROM EJERCICIO devuelve el catálogo completo con todos sus
--             atributos: nombre, grupo muscular, descripción y nivel mínimo.

SELECT * FROM EJERCICIO;
SELECT * FROM ALIMENTO;
SELECT * FROM RESTRICCION;
SELECT * FROM CICLO;
SELECT * FROM PLAN_NUTRICIONAL;
SELECT * FROM PROGRESO_FISICO;


/* ==================================================================================== */
/* ------------------- 2.2 SELECT específico — COLUMNAS ESPECÍFICAS ------------------ */
/* ==================================================================================== */

-- ------------------------------------------------------------------------------------ --
-- DML 2.2-A.
-- ------------------------------------------------------------------------------------ --
-- PREGUNTA : ¿Cómo consultar solo el nombre completo, correo y estado de cada afiliado
--             sin traer todas las columnas de la tabla?
-- RESPUESTA : Especificar columnas en el SELECT reduce la cantidad de datos transferidos
--             y hace la consulta más legible. Buena práctica en producción.

SELECT
  nombres_afiliado,
  apellidos_afiliado,
  correo_afiliado,
  estado_afiliacion
FROM AFILIADO;


-- ------------------------------------------------------------------------------------ --
-- DML 2.2-B.
-- ------------------------------------------------------------------------------------ --
-- PREGUNTA : ¿Cómo consultar solo el nombre del ejercicio, el grupo muscular
--             y el nivel mínimo requerido de cada ejercicio?
-- RESPUESTA : Se seleccionan únicamente las columnas relevantes para el reporte
--             de ejercicios disponibles en el catálogo.

SELECT
  nombre_ejercicio,
  grupo_muscular,
  nivel_minimo
FROM EJERCICIO;


/* ==================================================================================== */
/* ------------------- 2.3 SELECT WHERE — CON CRITERIOS ----------------------------- */
/* ==================================================================================== */

-- ------------------------------------------------------------------------------------ --
-- DML 2.3-A.
-- ------------------------------------------------------------------------------------ --
-- PREGUNTA : ¿Cómo consultar únicamente los afiliados que están activos en el gimnasio?
-- RESPUESTA : WHERE filtra los registros según una condición. Solo devuelve las filas
--             donde estado_afiliacion es exactamente 'Activo'.

SELECT
  id_afiliado,
  nombres_afiliado,
  apellidos_afiliado,
  objetivo_fisico_afiliado,
  nivel_experiencia_afiliado
FROM AFILIADO
WHERE estado_afiliacion = 'Activo';


-- ------------------------------------------------------------------------------------ --
-- DML 2.3-B.
-- ------------------------------------------------------------------------------------ --
-- PREGUNTA : ¿Cómo consultar solo los ciclos que están actualmente activos?
-- RESPUESTA : activo = 1 filtra solo los ciclos vigentes. Los ciclos inactivos (0)
--             son historial y no se muestran en esta consulta.

SELECT
  id_ciclo,
  id_afiliado,
  fecha_inicio_ciclo,
  fecha_fin_ciclo
FROM CICLO
WHERE activo = 1;


/* ==================================================================================== */
/* ------------------- 2.4 OPERADORES LÓGICOS — OR, AND, NOT ------------------------- */
/* ==================================================================================== */

-- ------------------------------------------------------------------------------------ --
-- DML 2.4.1 — OR
-- ------------------------------------------------------------------------------------ --
-- PREGUNTA : ¿Cómo consultar los afiliados cuyo objetivo sea "Pérdida de grasa"
--             O "Aumento de masa" (excluyendo Mantenimiento)?
-- RESPUESTA : OR devuelve filas que cumplan AL MENOS UNA de las condiciones.
--             Un afiliado con cualquiera de los dos objetivos aparece en el resultado.

SELECT
  nombres_afiliado,
  apellidos_afiliado,
  objetivo_fisico_afiliado,
  nivel_experiencia_afiliado
FROM AFILIADO
WHERE objetivo_fisico_afiliado = 'Pérdida de grasa'
   OR objetivo_fisico_afiliado = 'Aumento de masa';


-- ------------------------------------------------------------------------------------ --
-- DML 2.4.2 — AND
-- ------------------------------------------------------------------------------------ --
-- PREGUNTA : ¿Cómo consultar los afiliados que están activos Y son de nivel Principiante?
-- RESPUESTA : AND exige que AMBAS condiciones se cumplan. Solo aparecen afiliados
--             que son activos Y principiantes al mismo tiempo.

SELECT
  nombres_afiliado,
  apellidos_afiliado,
  nivel_experiencia_afiliado,
  disponibilidad_semanal_afiliado
FROM AFILIADO
WHERE estado_afiliacion        = 'Activo'
  AND nivel_experiencia_afiliado = 'Principiante';


-- ------------------------------------------------------------------------------------ --
-- DML 2.4.3 — NOT
-- ------------------------------------------------------------------------------------ --
-- PREGUNTA : ¿Cómo consultar los afiliados cuyo objetivo NO sea "Mantenimiento"?
-- RESPUESTA : NOT IN filtra excluyendo los valores indicados en la lista. Devuelve
--             todos los afiliados que no tienen ese objetivo físico.

SELECT
  nombres_afiliado,
  apellidos_afiliado,
  objetivo_fisico_afiliado
FROM AFILIADO
WHERE objetivo_fisico_afiliado NOT IN ('Mantenimiento');


/* ==================================================================================== */
/* ------------------- 2.5 OPERADORES DE COMPARACIÓN --------------------------------- */
/* ==================================================================================== */

-- ------------------------------------------------------------------------------------ --
-- DML 2.5.1 — Diferente <>
-- ------------------------------------------------------------------------------------ --
-- PREGUNTA : ¿Cómo consultar los ejercicios que NO sean de nivel Principiante?
-- RESPUESTA : <> (distinto de) devuelve filas donde el valor no es igual al indicado.
--             Equivale a usar NOT = o NOT IN con un solo valor.

SELECT nombre_ejercicio, grupo_muscular, nivel_minimo
FROM EJERCICIO
WHERE nivel_minimo <> 'Principiante';


-- ------------------------------------------------------------------------------------ --
-- DML 2.5.2 — Menor que <
-- ------------------------------------------------------------------------------------ --
-- PREGUNTA : ¿Cómo consultar los alimentos con menos de 5 gramos de grasas por 100g?
-- RESPUESTA : < devuelve filas donde el valor de la columna es estrictamente menor
--             al número indicado. Útil para filtrar alimentos bajos en grasa.

SELECT nombre_alimento, proteinas, carbohidratos, grasas
FROM ALIMENTO
WHERE grasas < 5.00;


-- ------------------------------------------------------------------------------------ --
-- DML 2.5.3 — Mayor que >
-- ------------------------------------------------------------------------------------ --
-- PREGUNTA : ¿Cómo consultar los alimentos con más de 20 gramos de proteínas por 100g?
-- RESPUESTA : > devuelve filas donde el valor es estrictamente mayor al número dado.
--             Ideal para encontrar fuentes proteicas altas en el catálogo.

SELECT nombre_alimento, proteinas, carbohidratos, grasas
FROM ALIMENTO
WHERE proteinas > 20.00;


-- ------------------------------------------------------------------------------------ --
-- DML 2.5.4 — Menor o igual <=
-- ------------------------------------------------------------------------------------ --
-- PREGUNTA : ¿Cómo consultar los afiliados con disponibilidad de máximo 3 días
--             a la semana para entrenar?
-- RESPUESTA : <= incluye tanto el valor exacto como los menores. Un afiliado con
--             disponibilidad de 1, 2 o 3 días aparece en el resultado.

SELECT
  nombres_afiliado,
  apellidos_afiliado,
  disponibilidad_semanal_afiliado,
  objetivo_fisico_afiliado
FROM AFILIADO
WHERE disponibilidad_semanal_afiliado <= 3;


-- ------------------------------------------------------------------------------------ --
-- DML 2.5.5 — Mayor o igual >=
-- ------------------------------------------------------------------------------------ --
-- PREGUNTA : ¿Cómo consultar los planes nutricionales con 2200 o más calorías estimadas?
-- RESPUESTA : >= incluye el valor exacto y los mayores. Útil para filtrar planes de
--             mayor demanda calórica (volumen o alta actividad).

SELECT
  id_plan_nutricional,
  id_ciclo,
  calorias_estimadas,
  num_comidas_diarias
FROM PLAN_NUTRICIONAL
WHERE calorias_estimadas >= 2200.00;


/* ==================================================================================== */
/* ------------------- 2.6 OTROS OPERADORES — LIKE, BETWEEN, IN --------------------- */
/* ==================================================================================== */

-- ------------------------------------------------------------------------------------ --
-- DML 2.6.1 — LIKE
-- ------------------------------------------------------------------------------------ --
-- PREGUNTA : ¿Cómo consultar los afiliados cuyo primer nombre empiece con la letra 'A'?
-- RESPUESTA : LIKE con el comodín % busca patrones en texto. 'A%' significa que el
--             valor empieza con A y puede tener cualquier cosa después.

SELECT
  nombres_afiliado,
  apellidos_afiliado,
  correo_afiliado
FROM AFILIADO
WHERE nombres_afiliado LIKE 'A%';


-- ------------------------------------------------------------------------------------ --
-- DML 2.6.1-B — LIKE con comodín en el medio
-- ------------------------------------------------------------------------------------ --
-- PREGUNTA : ¿Cómo consultar los ejercicios cuyo nombre contenga la palabra "de"
--             en cualquier posición?
-- RESPUESTA : '%de%' busca el texto "de" en cualquier parte del nombre.
--             El % antes y después indica que puede haber cualquier texto alrededor.

SELECT nombre_ejercicio, grupo_muscular
FROM EJERCICIO
WHERE nombre_ejercicio LIKE '%de%';


-- ------------------------------------------------------------------------------------ --
-- DML 2.6.2 — BETWEEN
-- ------------------------------------------------------------------------------------ --
-- PREGUNTA : ¿Cómo consultar los ciclos que iniciaron entre el 1 de enero y el
--             28 de febrero de 2024?
-- RESPUESTA : BETWEEN ... AND ... es inclusivo en ambos extremos. Equivale a usar
--             >= fecha1 AND <= fecha2, pero es más legible.

SELECT
  id_ciclo,
  id_afiliado,
  fecha_inicio_ciclo,
  fecha_fin_ciclo,
  activo
FROM CICLO
WHERE fecha_inicio_ciclo BETWEEN '2024-01-01' AND '2024-02-28';


-- ------------------------------------------------------------------------------------ --
-- DML 2.6.3 — IN
-- ------------------------------------------------------------------------------------ --
-- PREGUNTA : ¿Cómo consultar los ejercicios que trabajen Piernas, Espalda o Glúteos?
-- RESPUESTA : IN acepta una lista de valores y devuelve las filas que coincidan
--             con cualquiera de ellos. Es más limpio que varios OR seguidos.

SELECT
  nombre_ejercicio,
  grupo_muscular,
  nivel_minimo
FROM EJERCICIO
WHERE grupo_muscular IN ('Piernas', 'Espalda', 'Glúteos');


/* ==================================================================================== */
/* ------------------- 2.7 ORDENADAS — ORDER BY ------------------------------------- */
/* ==================================================================================== */

-- ------------------------------------------------------------------------------------ --
-- DML 2.7.1 — ASC (Ascendente)
-- ------------------------------------------------------------------------------------ --
-- PREGUNTA : ¿Cómo listar los alimentos ordenados de menor a mayor cantidad de
--             proteínas por 100g?
-- RESPUESTA : ORDER BY columna ASC ordena de menor a mayor. ASC es el orden por
--             defecto, se puede omitir pero es buena práctica escribirlo.

SELECT nombre_alimento, proteinas, carbohidratos, grasas
FROM ALIMENTO
ORDER BY proteinas ASC;


-- ------------------------------------------------------------------------------------ --
-- DML 2.7.2 — DESC (Descendente)
-- ------------------------------------------------------------------------------------ --
-- PREGUNTA : ¿Cómo listar los planes nutricionales ordenados de mayor a menor
--             cantidad de calorías estimadas?
-- RESPUESTA : ORDER BY columna DESC ordena de mayor a menor. Útil para identificar
--             los planes más exigentes o los afiliados con mayor demanda calórica.

SELECT
  id_plan_nutricional,
  calorias_estimadas,
  num_comidas_diarias
FROM PLAN_NUTRICIONAL
ORDER BY calorias_estimadas DESC;


-- ------------------------------------------------------------------------------------ --
-- DML 2.7.3 — Combinado (ASC + DESC)
-- ------------------------------------------------------------------------------------ --
-- PREGUNTA : ¿Cómo listar los afiliados ordenados primero por nivel de experiencia
--             (A-Z) y luego por disponibilidad semanal de mayor a menor?
-- RESPUESTA : Se pueden combinar varios criterios de orden. El primero es el principal;
--             el segundo se aplica cuando el primero tiene valores iguales.

SELECT
  nombres_afiliado,
  apellidos_afiliado,
  nivel_experiencia_afiliado,
  disponibilidad_semanal_afiliado,
  objetivo_fisico_afiliado
FROM AFILIADO
ORDER BY nivel_experiencia_afiliado ASC,
         disponibilidad_semanal_afiliado DESC;


/* ==================================================================================== */
/* ------------------- 2.8 FUNCIONES AGREGADAS — GROUP BY --------------------------- */
/* ==================================================================================== */

-- ------------------------------------------------------------------------------------ --
-- DML 2.8.1 — SUM
-- ------------------------------------------------------------------------------------ --
-- PREGUNTA : ¿Cuántas calorías totales están estimadas en todos los planes
--             nutricionales de MetaFit?
-- RESPUESTA : SUM suma los valores de una columna numérica. Sin GROUP BY devuelve
--             un solo valor: la suma de toda la tabla.

SELECT SUM(calorias_estimadas) FROM PLAN_NUTRICIONAL;

-- PREGUNTA : ¿Cuántas series totales tiene asignadas cada rutina?
-- RESPUESTA : Con GROUP BY se agrupa por rutina y SUM suma las series de cada una.

SELECT id_rutina, SUM(series) AS total_series
FROM RUTINA_EJERCICIO
GROUP BY id_rutina;


-- ------------------------------------------------------------------------------------ --
-- DML 2.8.2 — AVG
-- ------------------------------------------------------------------------------------ --
-- PREGUNTA : ¿Cuál es el promedio de calorías estimadas entre todos los planes
--             nutricionales activos?
-- RESPUESTA : AVG calcula el promedio aritmético de los valores de la columna.

SELECT AVG(calorias_estimadas) FROM PLAN_NUTRICIONAL;

-- PREGUNTA : ¿Cuál es el peso promedio de los afiliados por objetivo físico?
-- RESPUESTA : Se une PROGRESO_FISICO con CICLO y AFILIADO, se agrupa por objetivo
--             y se calcula el AVG del peso registrado.

SELECT id_ciclo, AVG(peso) AS peso_promedio
FROM PROGRESO_FISICO
GROUP BY id_ciclo;


-- ------------------------------------------------------------------------------------ --
-- DML 2.8.3 — MAX
-- ------------------------------------------------------------------------------------ --
-- PREGUNTA : ¿Cuál es el mayor peso registrado en toda la tabla de progreso físico?
-- RESPUESTA : MAX devuelve el valor más alto de la columna especificada.

SELECT MAX(peso) AS mayor_peso FROM PROGRESO_FISICO;

-- PREGUNTA : ¿Cuál es la mayor cantidad de calorías de los planes nutricionales
--             agrupados por si son automáticos o manuales?
-- RESPUESTA : MAX con GROUP BY devuelve el máximo dentro de cada grupo.

SELECT es_automatico, MAX(calorias_estimadas) AS max_calorias
FROM PLAN_NUTRICIONAL
GROUP BY es_automatico;


-- ------------------------------------------------------------------------------------ --
-- DML 2.8.4 — MIN
-- ------------------------------------------------------------------------------------ --
-- PREGUNTA : ¿Cuál es el menor número de repeticiones asignado en todas las rutinas?
-- RESPUESTA : MIN devuelve el valor mínimo de la columna.

SELECT MIN(repeticiones) AS min_repeticiones FROM RUTINA_EJERCICIO;

-- PREGUNTA : ¿Cuál es el plan nutricional con menos calorías por tipo (automático/manual)?
-- RESPUESTA : MIN con GROUP BY devuelve el mínimo dentro de cada grupo.

SELECT es_automatico, MIN(calorias_estimadas) AS min_calorias
FROM PLAN_NUTRICIONAL
GROUP BY es_automatico;


-- ------------------------------------------------------------------------------------ --
-- DML 2.8.5 — COUNT
-- ------------------------------------------------------------------------------------ --
-- PREGUNTA : ¿Cuántos afiliados hay por objetivo físico en MetaFit?
-- RESPUESTA : COUNT(*) cuenta todas las filas. GROUP BY agrupa por objetivo antes
--             de contar, dando el total por cada categoría.

SELECT objetivo_fisico_afiliado, COUNT(*) AS cantidad_afiliados
FROM AFILIADO
GROUP BY objetivo_fisico_afiliado;

-- PREGUNTA : ¿Cuántos ejercicios hay por grupo muscular en el catálogo?
-- RESPUESTA : COUNT(*) con GROUP BY cuenta los ejercicios de cada grupo muscular.

SELECT grupo_muscular, COUNT(*) AS cantidad_ejercicios
FROM EJERCICIO
GROUP BY grupo_muscular;


/* ==================================================================================== */
/* ------------------- 2.9 ALIAS — AS ----------------------------------------------- */
/* ==================================================================================== */

-- ------------------------------------------------------------------------------------ --
-- DML 2.9-A.
-- ------------------------------------------------------------------------------------ --
-- PREGUNTA : ¿Cómo mostrar estadísticas de planes nutricionales con nombres
--             descriptivos en las columnas calculadas?
-- RESPUESTA : AS le da un alias (nombre) a una columna calculada o a una columna
--             existente. El alias aparece como nombre de columna en el resultado.

SELECT
  COUNT(*)                    AS total_planes,
  AVG(calorias_estimadas)     AS promedio_calorias,
  MAX(calorias_estimadas)     AS plan_mas_calorico,
  MIN(calorias_estimadas)     AS plan_menos_calorico,
  SUM(calorias_estimadas)     AS calorias_totales
FROM PLAN_NUTRICIONAL;


-- ------------------------------------------------------------------------------------ --
-- DML 2.9-B.
-- ------------------------------------------------------------------------------------ --
-- PREGUNTA : ¿Cómo listar el total de series por rutina con nombres de columna
--             descriptivos, ordenado de mayor a menor carga?
-- RESPUESTA : El alias total_series se usa en el ORDER BY para ordenar el resultado.
--             Esto solo funciona en el ORDER BY, no en el WHERE.

SELECT
  id_rutina        AS numero_rutina,
  SUM(series)      AS total_series,
  SUM(repeticiones) AS total_repeticiones,
  COUNT(*)         AS cantidad_ejercicios
FROM RUTINA_EJERCICIO
GROUP BY id_rutina
ORDER BY total_series DESC;


/* ==================================================================================== */
/* ------------------- 2.10 HAVING — CONDICIONANTES AGRUPADAS ----------------------- */
/* ==================================================================================== */

-- ------------------------------------------------------------------------------------ --
-- DML 2.10-A.
-- ------------------------------------------------------------------------------------ --
-- PREGUNTA : ¿Cómo mostrar solo los grupos musculares que tienen más de 2 ejercicios
--             en el catálogo?
-- RESPUESTA : HAVING filtra DESPUÉS de agrupar con GROUP BY. A diferencia del WHERE
--             (que filtra antes de agrupar), HAVING puede usar funciones agregadas.

SELECT
  grupo_muscular,
  COUNT(*) AS cantidad_ejercicios
FROM EJERCICIO
GROUP BY grupo_muscular
HAVING COUNT(*) > 2;


-- ------------------------------------------------------------------------------------ --
-- DML 2.10-B.
-- ------------------------------------------------------------------------------------ --
-- PREGUNTA : ¿Cómo mostrar los ciclos donde el peso promedio registrado supera los
--             80 kg y hay más de una medición registrada?
-- RESPUESTA : HAVING filtra grupos completos. Aquí exigimos que el ciclo tenga más
--             de una medición Y que su peso promedio supere 80 kg.

SELECT
  id_ciclo,
  COUNT(*)     AS cantidad_registros,
  AVG(peso)    AS peso_promedio,
  MIN(peso)    AS peso_inicial,
  MAX(peso)    AS peso_maximo
FROM PROGRESO_FISICO
GROUP BY id_ciclo
HAVING COUNT(*) > 1 AND AVG(peso) > 80;


/* ==================================================================================== */
/* ------------------- 2.11 OPERADORES CALCULADOS ----------------------------------- */
/* ==================================================================================== */

-- ------------------------------------------------------------------------------------ --
-- DML 2.11-A.
-- ------------------------------------------------------------------------------------ --
-- PREGUNTA : ¿Cómo calcular las calorías de cada alimento usando la fórmula de
--             macronutrientes directamente en el SELECT?
-- RESPUESTA : Se pueden usar operadores aritméticos (+, *, /) en el SELECT.
--             La fórmula de Atwater: proteínas×4 + carbohidratos×4 + grasas×9.

SELECT
  nombre_alimento,
  proteinas,
  carbohidratos,
  grasas,
  ROUND((proteinas * 4) + (carbohidratos * 4) + (grasas * 9), 2) AS calorias_por_100g
FROM ALIMENTO
ORDER BY calorias_por_100g DESC;


-- ------------------------------------------------------------------------------------ --
-- DML 2.11-B.
-- ------------------------------------------------------------------------------------ --
-- PREGUNTA : ¿Cómo calcular la pérdida de peso de cada afiliado entre su primera
--             y última medición registrada?
-- RESPUESTA : Con MAX y MIN del peso se puede calcular la diferencia. Un valor
--             positivo indica pérdida, negativo indica ganancia de peso.

SELECT
  id_ciclo,
  MAX(peso)               AS peso_inicial,
  MIN(peso)               AS peso_final,
  ROUND(MAX(peso) - MIN(peso), 2) AS variacion_peso_kg
FROM PROGRESO_FISICO
GROUP BY id_ciclo
ORDER BY variacion_peso_kg DESC;


/* ==================================================================================== */
/* ------------------- 2.12 FECHAS — NOW(), DATE_FORMAT(), TIMESTAMPDIFF() ----------- */
/* ==================================================================================== */

-- ------------------------------------------------------------------------------------ --
-- DML 2.12.1 — NOW()
-- ------------------------------------------------------------------------------------ --
-- PREGUNTA : ¿Cómo consultar los ciclos activos mostrando también la fecha y hora
--             actual del servidor junto a cada registro?
-- RESPUESTA : NOW() devuelve la fecha y hora actual del servidor MySQL en el momento
--             en que se ejecuta la consulta.

SELECT
  id_ciclo,
  id_afiliado,
  fecha_inicio_ciclo,
  fecha_fin_ciclo,
  NOW() AS fecha_consulta
FROM CICLO
WHERE activo = 1;


-- ------------------------------------------------------------------------------------ --
-- DML 2.12.2 — DATE_FORMAT()
-- ------------------------------------------------------------------------------------ --
-- PREGUNTA : ¿Cómo mostrar la fecha de registro de cada afiliado en formato
--             "día/mes/año" (DD/MM/YYYY)?
-- RESPUESTA : DATE_FORMAT() formatea una fecha con el patrón especificado.
--             %d = día, %m = mes, %Y = año con 4 dígitos.

SELECT
  nombres_afiliado,
  apellidos_afiliado,
  DATE_FORMAT(fecha_registro_afiliado, '%d/%m/%Y') AS fecha_ingreso
FROM AFILIADO
ORDER BY fecha_registro_afiliado ASC;


-- ------------------------------------------------------------------------------------ --
-- DML 2.12.3 — TIMESTAMPDIFF()
-- ------------------------------------------------------------------------------------ --
-- PREGUNTA : ¿Cuántos días llevan activos los ciclos actuales, contados desde
--             su fecha de inicio hasta hoy?
-- RESPUESTA : TIMESTAMPDIFF(unidad, fecha_inicio, fecha_fin) calcula la diferencia
--             entre dos fechas en la unidad indicada (DAY, MONTH, YEAR).

SELECT
  id_ciclo,
  id_afiliado,
  fecha_inicio_ciclo,
  DATE_FORMAT(NOW(), '%Y-%m-%d')             AS hoy,
  TIMESTAMPDIFF(DAY,  fecha_inicio_ciclo, NOW()) AS dias_activo,
  TIMESTAMPDIFF(WEEK, fecha_inicio_ciclo, NOW()) AS semanas_activo
FROM CICLO
WHERE activo = 1
ORDER BY dias_activo DESC;


/* ==================================================================================== */
/* ==================================================================================== */
/* ========================== DML — MULTITABLA / UNIÓN =============================== */
/* ==================================================================================== */
/* ==================================================================================== */

/* ==================================================================================== */
/* ------------------- 1.1 Crear Tabla desde otra — CREATE TABLE SELECT -------------- */
/* ==================================================================================== */

-- ------------------------------------------------------------------------------------ --
-- DML Multi 1.1.
-- ------------------------------------------------------------------------------------ --
-- PREGUNTA : ¿Cómo crear una tabla temporal AFILIADOS_INACTIVOS a partir de los
--             afiliados que actualmente tienen estado 'Inactivo'?
-- RESPUESTA : CREATE TABLE ... SELECT crea una tabla nueva con la estructura y datos
--             del resultado del SELECT. Es útil para crear backups o tablas de trabajo
--             temporal sin afectar la tabla original.

CREATE TABLE AFILIADOS_INACTIVOS
SELECT * FROM AFILIADO
WHERE estado_afiliacion = 'Inactivo';


-- ------------------------------------------------------------------------------------ --
-- DML Multi 1.2. Insertar datos de una tabla en otra — INSERT INTO SELECT          --
-- ------------------------------------------------------------------------------------ --
-- PREGUNTA : Después de reactivar los afiliados inactivos en la tabla original,
--             ¿cómo restaurar los registros de la tabla temporal AFILIADOS_INACTIVOS
--             de vuelta a AFILIADO?
-- RESPUESTA : INSERT INTO ... SELECT inserta en la tabla destino el resultado completo
--             de un SELECT. Luego se elimina la tabla temporal con DROP TABLE.

INSERT INTO AFILIADO
SELECT * FROM AFILIADOS_INACTIVOS;

DROP TABLE AFILIADOS_INACTIVOS;


/* ==================================================================================== */
/* ------------------- 2.1 UNION — UNIÓN EXTERNA ------------------------------------ */
/* ==================================================================================== */

-- ------------------------------------------------------------------------------------ --
-- DML Multi 2.1.1 — UNION (sin duplicados)
-- ------------------------------------------------------------------------------------ --
-- PREGUNTA : ¿Cómo obtener una lista de todos los correos electrónicos en el sistema
--             (tanto de usuarios del personal como de afiliados) sin repetir?
-- RESPUESTA : UNION combina resultados de dos SELECT y ELIMINA duplicados automáticamente.
--             Ambos SELECT deben tener el mismo número de columnas con tipos compatibles.

SELECT correo_usuario AS correo, 'Personal' AS tipo
FROM USUARIO
UNION
SELECT correo_afiliado AS correo, 'Afiliado' AS tipo
FROM AFILIADO
ORDER BY tipo, correo;


-- ------------------------------------------------------------------------------------ --
-- DML Multi 2.1.2 — UNION ALL (con duplicados)
-- ------------------------------------------------------------------------------------ --
-- PREGUNTA : ¿Cómo obtener el mismo listado de correos pero mostrando TODOS
--             incluyendo posibles repetidos?
-- RESPUESTA : UNION ALL no elimina duplicados. Es más rápido que UNION porque no
--             necesita hacer la operación de deduplicación. Si un correo aparece en
--             ambas tablas, se mostrará dos veces.

SELECT correo_usuario AS correo, 'Personal' AS tipo
FROM USUARIO
UNION ALL
SELECT correo_afiliado AS correo, 'Afiliado' AS tipo
FROM AFILIADO
ORDER BY tipo, correo;


/* ==================================================================================== */
/* ------------------- 2.2 INNER JOIN, LEFT JOIN, RIGHT JOIN ------------------------- */
/* ==================================================================================== */

-- ------------------------------------------------------------------------------------ --
-- DML Multi 2.2.1.1 — INNER JOIN con repeticiones
-- ------------------------------------------------------------------------------------ --
-- PREGUNTA : ¿Cómo consultar los ciclos activos mostrando también los datos del
--             afiliado al que pertenece cada ciclo?
-- RESPUESTA : INNER JOIN une dos tablas por una columna común y devuelve solo las
--             filas que tienen coincidencia en AMBAS tablas. Aquí une CICLO con AFILIADO
--             a través de id_afiliado.

SELECT
  C.id_ciclo,
  A.nombres_afiliado,
  A.apellidos_afiliado,
  A.nivel_experiencia_afiliado,
  C.fecha_inicio_ciclo,
  C.fecha_fin_ciclo
FROM CICLO AS C
INNER JOIN AFILIADO AS A
  ON C.id_afiliado = A.id_afiliado
WHERE C.activo = 1;


-- ------------------------------------------------------------------------------------ --
-- DML Multi 2.2.1.2 — INNER JOIN sin repeticiones (DISTINCT)
-- ------------------------------------------------------------------------------------ --
-- PREGUNTA : ¿Cómo obtener la lista de afiliados (sin repetir) que tienen al menos
--             un ciclo registrado en el sistema?
-- RESPUESTA : DISTINCT elimina filas duplicadas del resultado. Sin él, un afiliado
--             con varios ciclos aparecería varias veces.

SELECT DISTINCT
  A.id_afiliado,
  A.nombres_afiliado,
  A.apellidos_afiliado
FROM AFILIADO AS A
INNER JOIN CICLO AS C
  ON A.id_afiliado = C.id_afiliado;


-- ------------------------------------------------------------------------------------ --
-- DML Multi 2.2.1.3 — INNER JOIN condicionado (WHERE + ORDER BY)
-- ------------------------------------------------------------------------------------ --
-- PREGUNTA : ¿Cómo consultar el historial completo de progreso físico de cada afiliado,
--             mostrando su nombre y ordenado por fecha de registro descendente?
-- RESPUESTA : Se encadenan múltiples INNER JOIN. Primero se une PROGRESO_FISICO con
--             CICLO, luego CICLO con AFILIADO. WHERE y ORDER BY se aplican al resultado
--             combinado.

SELECT
  A.nombres_afiliado,
  A.apellidos_afiliado,
  PF.fecha_registro,
  PF.peso,
  PF.porcentaje_grasa,
  PF.medida_cintura
FROM PROGRESO_FISICO AS PF
INNER JOIN CICLO AS C
  ON PF.id_ciclo = C.id_ciclo
INNER JOIN AFILIADO AS A
  ON C.id_afiliado = A.id_afiliado
ORDER BY A.apellidos_afiliado ASC, PF.fecha_registro DESC;


-- ------------------------------------------------------------------------------------ --
-- DML Multi 2.2.1.3-B — INNER JOIN múltiple con condición
-- ------------------------------------------------------------------------------------ --
-- PREGUNTA : ¿Cómo ver el detalle completo de los planes nutricionales activos:
--             afiliado, plan, calorías y alimentos asignados con sus cantidades?
-- RESPUESTA : Se encadenan cuatro INNER JOINs: CICLO → AFILIADO, PLAN_NUTRICIONAL,
--             DETALLE_NUTRICIONAL, ALIMENTO. WHERE filtra solo ciclos activos.

SELECT
  A.nombres_afiliado,
  A.apellidos_afiliado,
  PN.calorias_estimadas,
  PN.num_comidas_diarias,
  AL.nombre_alimento,
  DN.numero_comida,
  DN.cantidad
FROM CICLO AS C
INNER JOIN AFILIADO AS A
  ON C.id_afiliado = A.id_afiliado
INNER JOIN PLAN_NUTRICIONAL AS PN
  ON C.id_ciclo = PN.id_ciclo
INNER JOIN DETALLE_NUTRICIONAL AS DN
  ON PN.id_plan_nutricional = DN.id_plan_nutricional
INNER JOIN ALIMENTO AS AL
  ON DN.id_alimento = AL.id_alimento
WHERE C.activo = 1
ORDER BY A.apellidos_afiliado, DN.numero_comida;


-- ------------------------------------------------------------------------------------ --
-- DML Multi 2.2.2 — LEFT JOIN
-- ------------------------------------------------------------------------------------ --
-- PREGUNTA : ¿Cómo ver TODOS los afiliados, estén o no registrados en un ciclo
--             de entrenamiento?
-- RESPUESTA : LEFT JOIN devuelve TODAS las filas de la tabla izquierda (AFILIADO)
--             aunque no haya coincidencia en la derecha (CICLO). Los afiliados sin
--             ciclo muestran NULL en las columnas de CICLO.

SELECT
  A.id_afiliado,
  A.nombres_afiliado,
  A.apellidos_afiliado,
  A.estado_afiliacion,
  C.id_ciclo,
  C.fecha_inicio_ciclo,
  C.activo
FROM AFILIADO AS A
LEFT JOIN CICLO AS C
  ON A.id_afiliado = C.id_afiliado;


-- ------------------------------------------------------------------------------------ --
-- DML Multi 2.2.2-B — LEFT JOIN para encontrar afiliados SIN ciclo
-- ------------------------------------------------------------------------------------ --
-- PREGUNTA : ¿Cómo identificar qué afiliados activos NUNCA han tenido un ciclo
--             de entrenamiento registrado en MetaFit?
-- RESPUESTA : LEFT JOIN + WHERE ciclo IS NULL filtra exactamente los afiliados que
--             no tienen ninguna fila coincidente en CICLO.

SELECT
  A.id_afiliado,
  A.nombres_afiliado,
  A.apellidos_afiliado,
  A.correo_afiliado
FROM AFILIADO AS A
LEFT JOIN CICLO AS C
  ON A.id_afiliado = C.id_afiliado
WHERE C.id_ciclo IS NULL
  AND A.estado_afiliacion = 'Activo';


-- ------------------------------------------------------------------------------------ --
-- DML Multi 2.2.3 — RIGHT JOIN
-- ------------------------------------------------------------------------------------ --
-- PREGUNTA : ¿Cómo ver todos los ciclos registrados, incluyendo aquellos cuyo
--             afiliado ya no exista en la tabla AFILIADO?
-- RESPUESTA : RIGHT JOIN devuelve TODAS las filas de la tabla derecha (CICLO) aunque
--             no haya coincidencia en la izquierda (AFILIADO). Los ciclos huérfanos
--             mostrarían NULL en las columnas del afiliado.

SELECT
  A.nombres_afiliado,
  A.apellidos_afiliado,
  C.id_ciclo,
  C.fecha_inicio_ciclo,
  C.fecha_fin_ciclo,
  C.activo
FROM AFILIADO AS A
RIGHT JOIN CICLO AS C
  ON A.id_afiliado = C.id_afiliado;


/* ==================================================================================== */
/* ------------------- 2.3 SUBCONSULTAS — IN, NOT IN, EXISTS ------------------------- */
/* ==================================================================================== */

-- ------------------------------------------------------------------------------------ --
-- DML Multi 2.3.1 — Subconsulta Escalonada (IN)
-- ------------------------------------------------------------------------------------ --
-- PREGUNTA : ¿Cómo encontrar los afiliados que tienen registrada al menos una
--             restricción médica, usando una subconsulta?
-- RESPUESTA : La subconsulta interna devuelve la lista de id_afiliado que aparecen
--             en AFILIADO_RESTRICCION. La externa filtra los afiliados con IN.

SELECT
  nombres_afiliado,
  apellidos_afiliado,
  objetivo_fisico_afiliado
FROM AFILIADO
WHERE id_afiliado IN (
  SELECT id_afiliado
  FROM AFILIADO_RESTRICCION
);


-- ------------------------------------------------------------------------------------ --
-- DML Multi 2.3.2 — Subconsulta de Lista (NOT IN)
-- ------------------------------------------------------------------------------------ --
-- PREGUNTA : ¿Cómo encontrar los alimentos del catálogo que NUNCA han sido incluidos
--             en ningún plan nutricional?
-- RESPUESTA : NOT IN con subconsulta devuelve los alimentos cuyo id NO aparece
--             en la tabla DETALLE_NUTRICIONAL. Útil para identificar alimentos
--             en desuso en el catálogo.

SELECT
  id_alimento,
  nombre_alimento,
  proteinas,
  carbohidratos,
  grasas
FROM ALIMENTO
WHERE id_alimento NOT IN (
  SELECT DISTINCT id_alimento
  FROM DETALLE_NUTRICIONAL
);


-- ------------------------------------------------------------------------------------ --
-- DML Multi 2.3.3 — Subconsulta Correlacionada (EXISTS)
-- ------------------------------------------------------------------------------------ --
-- PREGUNTA : ¿Cómo encontrar los afiliados activos que tienen al menos un ciclo
--             activo en este momento, usando EXISTS?
-- RESPUESTA : EXISTS es CORRELACIONADA: la subconsulta usa datos de la consulta
--             externa (A.id_afiliado). Devuelve TRUE si la subconsulta retorna
--             al menos una fila, y esa fila "activa" el registro externo.

SELECT
  A.id_afiliado,
  A.nombres_afiliado,
  A.apellidos_afiliado,
  A.objetivo_fisico_afiliado
FROM AFILIADO AS A
WHERE A.estado_afiliacion = 'Activo'
  AND EXISTS (
    SELECT 1
    FROM CICLO AS C
    WHERE C.id_afiliado = A.id_afiliado
      AND C.activo = 1
  );


-- ------------------------------------------------------------------------------------ --
-- DML Multi 2.3.4 — Subconsulta en SELECT (escalar)
-- ------------------------------------------------------------------------------------ --
-- PREGUNTA : ¿Cómo mostrar cada plan nutricional junto con el promedio general de
--             calorías de TODOS los planes para comparar si está por encima o por debajo?
-- RESPUESTA : Una subconsulta en el SELECT devuelve un único valor (escalar) que se
--             repite en cada fila. Aquí calcula el promedio global una sola vez y lo
--             muestra al lado de cada plan individual.

SELECT
  id_plan_nutricional,
  id_ciclo,
  calorias_estimadas,
  ROUND((SELECT AVG(calorias_estimadas) FROM PLAN_NUTRICIONAL), 2) AS promedio_global,
  ROUND(calorias_estimadas - (SELECT AVG(calorias_estimadas) FROM PLAN_NUTRICIONAL), 2)
    AS diferencia_vs_promedio
FROM PLAN_NUTRICIONAL
ORDER BY calorias_estimadas DESC;


-- ------------------------------------------------------------------------------------ --
-- DML Multi 2.3.5 — Subconsulta en FROM (tabla derivada)
-- ------------------------------------------------------------------------------------ --
-- PREGUNTA : ¿Cómo obtener estadísticas de ejercicios por grupo muscular y calcular
--             el porcentaje que representa cada grupo sobre el total del catálogo?
-- RESPUESTA : La subconsulta en el FROM actúa como una tabla temporal (tabla derivada).
--             La consulta externa la usa como si fuera una tabla normal.

SELECT
  stats.grupo_muscular,
  stats.cantidad,
  ROUND(stats.cantidad / (SELECT COUNT(*) FROM EJERCICIO) * 100, 1) AS porcentaje
FROM (
  SELECT
    grupo_muscular,
    COUNT(*) AS cantidad
  FROM EJERCICIO
  GROUP BY grupo_muscular
) AS stats
ORDER BY stats.cantidad DESC;


/* ==================================================================================== */
/* ------------------- 3. CONSULTAS DE ACCIÓN FINAL ---------------------------------- */
/* ==================================================================================== */

-- ------------------------------------------------------------------------------------ --
-- DML Multi Final 3.1 — DELETE con JOIN
-- ------------------------------------------------------------------------------------ --
-- PREGUNTA : ¿Cómo eliminar todos los ciclos inactivos que no tienen ningún plan de
--             entrenamiento asociado (ciclos vacíos sin uso)?
-- RESPUESTA : DELETE con LEFT JOIN + IS NULL elimina solo las filas de la tabla
--             izquierda (CICLO) que no tienen coincidencia en la derecha (PLAN_ENTRENAMIENTO).
--             Es más preciso que un DELETE con subconsulta para casos multitabla.

DELETE CICLO FROM CICLO
LEFT JOIN PLAN_ENTRENAMIENTO
  ON CICLO.id_ciclo = PLAN_ENTRENAMIENTO.id_ciclo
WHERE PLAN_ENTRENAMIENTO.id_ciclo IS NULL
  AND CICLO.activo = 0;


-- ------------------------------------------------------------------------------------ --
-- DML Multi Final 3.2 — INSERT con fecha calculada
-- ------------------------------------------------------------------------------------ --
-- PREGUNTA : ¿Cómo registrar un nuevo progreso físico de Juan (ciclo 3) con la
--             fecha actual del servidor calculada automáticamente?
-- RESPUESTA : DATE_FORMAT(NOW(), '%Y-%m-%d') formatea la fecha actual. Así no depende
--             de que la app envíe la fecha correcta — la toma directamente del servidor.

INSERT INTO PROGRESO_FISICO
  (id_ciclo, fecha_registro, peso, porcentaje_grasa,
   medida_cintura, medida_brazo, medida_pierna, observaciones, registrado_por)
VALUES
  (3,
   DATE_FORMAT(NOW(), '%Y-%m-%d'),
   80.50, 20.00, 87.50, 36.80, 60.00,
   'Medición registrada automáticamente con fecha del servidor',
   2);


/* ==================================================================================== */
/* ==================================================================================== */
/* =================== CONSULTAS EXTRA — VIEWs DEL SCHEMA =========================== */
/* ==================================================================================== */
/* ==================================================================================== */

-- ------------------------------------------------------------------------------------ --
-- VIEW Extra 1.
-- ------------------------------------------------------------------------------------ --
-- PREGUNTA : ¿Cómo consultar las calorías calculadas de cada alimento usando la
--             VIEW alimento_con_calorias sin necesidad de escribir la fórmula?
-- RESPUESTA : La VIEW alimento_con_calorias ya tiene la fórmula (P×4 + C×4 + G×9)
--             integrada. Consultarla es igual que consultar una tabla normal.

SELECT * FROM alimento_con_calorias
ORDER BY calorias_por_100g DESC;

SELECT nombre_alimento, calorias_por_100g
FROM alimento_con_calorias
WHERE calorias_por_100g > 200
ORDER BY calorias_por_100g DESC;


-- ------------------------------------------------------------------------------------ --
-- VIEW Extra 2.
-- ------------------------------------------------------------------------------------ --
-- PREGUNTA : ¿Cómo saber el número de ciclo que está cursando cada afiliado
--             usando la VIEW ciclo_con_numero?
-- RESPUESTA : La VIEW ciclo_con_numero calcula el número de ciclo de forma dinámica
--             contando cuántos ciclos anteriores tiene el mismo afiliado.

SELECT * FROM ciclo_con_numero
ORDER BY id_afiliado, numero_ciclo;

SELECT id_afiliado, MAX(numero_ciclo) AS ciclos_completados
FROM ciclo_con_numero
GROUP BY id_afiliado
ORDER BY ciclos_completados DESC;


/* ==================================================================================== */
/* ==================================================================================== */
/* ========================= FIN DEL ARCHIVO DE CONSULTAS ============================ */
/* ==================================================================================== */
/* ==================================================================================== */
