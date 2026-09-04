# MetaFit — Base de Datos (carpeta `database/`)

Scripts SQL del motor **MariaDB 11** (mismo motor en Docker y producción). Se numeran **01 a 05 por dependencias** para que el orden lexicográfico sea también el orden correcto de ejecución (funciona igual en Docker `initdb` y en `backend/start.sh`).

## Estructura y orden

| # | Archivo | Qué hace | Depende de |
|---|---------|----------|------------|
| 01 | `01_estructura.sql` | Tablas base de la 3FN (USUARIO, AFILIADO, CICLO, RUTINA, PLAN_*, PROGRESO_FISICO, PAGO, CONFIGURACION…) + vistas derivadas | — |
| 02 | `02_migracion_movil.sql` | Tablas de la app móvil: PROGRESO_EJERCICIO_DIARIO, REGISTRO_AGUA, CONSUMO_ALIMENTO_DIARIO | 01 |
| 03 | `03_mejoras_estructura.sql` | Fase 0: 3 columnas nuevas de AFILIADO (objetivo_fisico, nivel_experiencia, disponibilidad_semanal_dias) + REGISTRO_EJERCICIO, CONSUMO_ALIMENTO_REAL, PROGRESO_DIARIO. Idempotente (INFORMATION_SCHEMA + PREPARE/EXECUTE). | 01, 02 |
| 04 | `04_datos_iniciales.sql` | **Todos** los datos: administración + afiliados (históricos, demo y nuevos) + catálogos + planes + datos diarios móviles y Fase 0 | 01, 02, 03 |
| 05 | `05_password_reset.sql` | Tabla PASSWORD_RESET para recuperación de contraseña | 01 |

```
01_estructura.sql  ->  02_migracion_movil.sql  ->  03_mejoras_estructura.sql
                    ->  04_datos_iniciales.sql ->  05_password_reset.sql
```

> Requisito clave: `04_datos_iniciales.sql` inserta en tablas creadas por 02 y 03, por eso **nunca** debe ejecutarse antes que ellas.

## Origen de los archivos (unificado)

`04_datos_iniciales.sql` reemplaza y unifica los antiguos `02_seed.sql`, `03_datos_demo.sql` y `06_seed_data_completo.sql`:

- **Idempotente**: todos los `INSERT` usan `INSERT IGNORE`, por lo que puede re-ejecutarse sin errores ni duplicados. Los `UPDATE` ya son idempotentes.
- **Rangos de IDs** (sin colisiones entre las fuentes fusionadas):
  - `1–9` — personal del gimnasio + afiliados históricos (Juan, Ana, Luis, Sofía)
  - `100` — afiliado demo "Carlos Demo" (origen `03_datos_demo`)
  - `200–202` — afiliados nuevos del registro web (Diana, Miguel, Camila)
  - `AUTO_INCREMENT` reiniciado al final según el máximo de cada tabla.
- **Catálogos**: 25 ejercicios, 26 alimentos (macros por 100 g; calorías calculadas por Atwater en la vista `v_alimento_calorias`).
- **Datos de hoy siempre visibles**: los datos diarios de Sofía (ciclos, progreso, agua, consumos) usan fechas relativas `CURDATE() - INTERVAL n DAY`.

## Convenciones

- Contraseñas siempre como **hash bcrypt de 12 rondas**, nunca texto plano (ver cabecera de `04_datos_iniciales.sql`).
- IMC y calorías no se almacenan: se calculan en vistas (`v_perfil_afiliado`, `v_alimento_calorias`) o en backend.
- `CICLO` es la **fuente de verdad** de objetivo/nivel/disponibilidad por ciclo; las columnas nuevas de `AFILIADO` guardan el valor del formulario de registro (desnormalización deliberada, ver `03_mejoras_estructura.sql`).

## Ejecución

- **Docker**: `docker compose up -d --build` — MySQL/MariaDB ejecuta los `.sql` automáticamente en la primera inicialización del volumen. Para re-inicializar: `docker compose down -v && docker compose up -d`.
- **Manualmente**:
  ```bash
  mysql --socket="$MYSQL_SOCK" metafit < database/01_estructura.sql
  mysql --socket="$MYSQL_SOCK" metafit < database/02_migracion_movil.sql
  mysql --socket="$MYSQL_SOCK" metafit < database/03_mejoras_estructura.sql
  mysql --socket="$MYSQL_SOCK" metafit < database/04_datos_iniciales.sql
  mysql --socket="$MYSQL_SOCK" metafit < database/05_password_reset.sql
  ```
- En la cabecera de `04_datos_iniciales.sql` hay un bloque de consultas para verificar los conteos esperados por tabla (o `SELECT * FROM v_alimento_calorias;`).

## Nota sobre documentación histórica

Los documentos en `documentacion/` y `documentacion/brain/` pueden referirse a los antiguos nombres (`01_schema.sql`, `02_seed.sql`, `04_migracion_app_movil.sql`, `05_mejoras_estructura.sql`, `06_seed_data_completo.sql`); se conservan tal cual como referencia histórica.