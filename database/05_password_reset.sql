-- ============================================================
-- 05_password_reset.sql — Recuperación de contraseña
-- Tabla de tokens JWT de un solo uso (válidos 15 minutos).
--
-- NOTA: el backend crea esta tabla automáticamente al arrancar
-- (index.js → passwordResetModel.ensureTable). Este script es
-- la versión documentada para entornos donde se gestiona el
-- esquema de forma manual.
-- ============================================================

USE `metafit`;

CREATE TABLE IF NOT EXISTS `PASSWORD_RESET` (
  `id`         INT          NOT NULL AUTO_INCREMENT,
  `usuario_id` INT          NOT NULL,
  `token`      VARCHAR(512) NOT NULL,
  `expiracion` DATETIME     NOT NULL,
  `usado`      TINYINT(1)   NOT NULL DEFAULT 0,
  `creado`     DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,

  PRIMARY KEY (`id`),
  KEY `idx_reset_token` (`token`),
  CONSTRAINT `fk_reset_usuario`
    FOREIGN KEY (`usuario_id`) REFERENCES `USUARIO` (`id_usuario`)
    ON DELETE CASCADE
) ENGINE = InnoDB
  COMMENT = 'Tokens JWT de un solo uso para recuperación de contraseña (15 min)';