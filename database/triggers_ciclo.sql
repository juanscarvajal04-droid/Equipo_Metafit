-- ============================================================
-- MetaFit — Triggers de Integridad para la tabla CICLO
-- Archivo: database/triggers_ciclo.sql
-- Motor:   MySQL 8.0+ (InnoDB)
--
-- CORRECCIONES DE AUDITORÍA:
--
-- [FIX-1] Columnas corregidas al schema real:
--         fecha_inicio  (era fecha_inicio_ciclo en cicloModel)
--         fecha_fin     (era fecha_fin_ciclo)
--         id_usuario    (CICLO.id_usuario, FK → AFILIADO)
--
-- [FIX-2] Trigger 3 (BEFORE INSERT + UPDATE de la misma tabla):
--         MySQL lanza ER_CANT_UPDATE_TABLE_IN_TRIGGER si un BEFORE INSERT
--         intenta hacer UPDATE sobre la misma tabla siendo insertada.
--         Solución: convertir en AFTER INSERT.
--         Con AFTER INSERT el nuevo registro ya existe → el UPDATE excluye
--         al propio registro usando id_ciclo <> NEW.id_ciclo.
--
-- [FIX-3] Solapamiento: excluir ciclos INACTIVOS del chequeo.
--         Solo tiene sentido validar solapamiento contra ciclos activos
--         o contra todos (política de negocio). Aquí validamos contra TODOS
--         (activos e históricos) para garantizar integridad histórica total.
-- ============================================================

USE metafit;

DROP TRIGGER IF EXISTS trg_ciclo_no_solapamiento_insert;
DROP TRIGGER IF EXISTS trg_ciclo_no_solapamiento_update;
DROP TRIGGER IF EXISTS trg_ciclo_un_activo_insert;
DROP TRIGGER IF EXISTS trg_ciclo_un_activo_update;

DELIMITER $$

-- ============================================================
-- TRIGGER 1: Bloquear solapamiento al INSERTAR
-- BEFORE INSERT: la fila aún no existe → SELECT no la ve → seguro.
-- ============================================================
CREATE TRIGGER trg_ciclo_no_solapamiento_insert
BEFORE INSERT ON CICLO
FOR EACH ROW
BEGIN
  DECLARE v_solapamiento INT DEFAULT 0;

  SELECT COUNT(*) INTO v_solapamiento
  FROM CICLO
  WHERE id_usuario = NEW.id_usuario
    AND (
      NEW.fecha_inicio BETWEEN fecha_inicio AND fecha_fin
      OR
      NEW.fecha_fin   BETWEEN fecha_inicio AND fecha_fin
      OR
      (NEW.fecha_inicio <= fecha_inicio AND NEW.fecha_fin >= fecha_fin)
    );

  IF v_solapamiento > 0 THEN
    SIGNAL SQLSTATE '45000'
      SET MESSAGE_TEXT = 'El ciclo se solapa con un ciclo existente del afiliado.';
  END IF;
END$$


-- ============================================================
-- TRIGGER 2: Bloquear solapamiento al ACTUALIZAR fechas
-- BEFORE UPDATE: seguro, la fila sigue existiendo con OLD.*
-- ============================================================
CREATE TRIGGER trg_ciclo_no_solapamiento_update
BEFORE UPDATE ON CICLO
FOR EACH ROW
BEGIN
  DECLARE v_solapamiento INT DEFAULT 0;

  IF NEW.fecha_inicio <> OLD.fecha_inicio OR NEW.fecha_fin <> OLD.fecha_fin THEN
    SELECT COUNT(*) INTO v_solapamiento
    FROM CICLO
    WHERE id_usuario = NEW.id_usuario
      AND id_ciclo   <> OLD.id_ciclo        -- excluir el propio registro (usar OLD.id_ciclo en UPDATE)
      AND (
        NEW.fecha_inicio BETWEEN fecha_inicio AND fecha_fin
        OR
        NEW.fecha_fin   BETWEEN fecha_inicio AND fecha_fin
        OR
        (NEW.fecha_inicio <= fecha_inicio AND NEW.fecha_fin >= fecha_fin)
      );

    IF v_solapamiento > 0 THEN
      SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'El ciclo actualizado se solapa con un ciclo existente del afiliado.';
    END IF;
  END IF;
END$$


-- ============================================================
-- TRIGGER 3: Garantizar máximo 1 ciclo activo — al INSERTAR
--
-- [FIX-2] DEBE ser AFTER INSERT, no BEFORE INSERT.
-- MySQL lanza ER_CANT_UPDATE_TABLE_IN_TRIGGER si se intenta
-- UPDATE sobre la misma tabla en un BEFORE INSERT.
-- Con AFTER INSERT, el nuevo ciclo ya tiene id_ciclo asignado
-- y podemos excluirlo del UPDATE con id_ciclo <> NEW.id_ciclo.
-- ============================================================
CREATE TRIGGER trg_ciclo_un_activo_insert
AFTER INSERT ON CICLO
FOR EACH ROW
BEGIN
  IF NEW.activo = 1 THEN
    UPDATE CICLO
    SET activo = 0
    WHERE id_usuario = NEW.id_usuario
      AND id_ciclo   <> NEW.id_ciclo   -- no tocar el recién insertado
      AND activo     = 1;
  END IF;
END$$


-- ============================================================
-- TRIGGER 4: Garantizar máximo 1 ciclo activo — al ACTUALIZAR
-- BEFORE UPDATE está permitido aquí porque la tabla es la misma
-- pero estamos en un contexto de UPDATE (no INSERT).
-- MySQL permite UPDATE sobre la misma tabla en BEFORE UPDATE
-- siempre que no sea la misma fila siendo modificada.
-- ============================================================
CREATE TRIGGER trg_ciclo_un_activo_update
BEFORE UPDATE ON CICLO
FOR EACH ROW
BEGIN
  IF NEW.activo = 1 AND OLD.activo = 0 THEN
    UPDATE CICLO
    SET activo = 0
    WHERE id_usuario = NEW.id_usuario
      AND id_ciclo   <> OLD.id_ciclo
      AND activo     = 1;
  END IF;
END$$

DELIMITER ;

-- ── Verificación post-creación ────────────────────────────────
SELECT trigger_name, event_manipulation, action_timing, event_object_table
FROM information_schema.TRIGGERS
WHERE trigger_schema = 'metafit'
  AND event_object_table = 'CICLO'
ORDER BY trigger_name;
