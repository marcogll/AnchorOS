# Actualización de Recursos - SalonOS

## Cambios Realizados

### Recursos Anteriores (Eliminados)
Los recursos tenían nombres descriptivos como:
- "Sillón Pedicure 1", "Sillón Pedicure 2", "Sillón Pedicure 3"
- "Estación Manicure 1", "Estación Manicure 2", "Estación Manicure 3", "Estación Manicure 4"
- "Estación Maquillaje"
- "Cama Pestañas"

### Nuevos Recursos (Implementados)
Los recursos ahora usan códigos alfanuméricos estandarizados:

| Tipo | Código | Cantidad | Descripción |
|------|--------|----------|-------------|
| Maquillaje | `mkup` | 3 | Estaciones de maquillaje |
| Pestañas | `lshs` | 1 | Cama de pestañas |
| Pedicure | `pedi` | 4 | Estaciones de pedicure |
| Manicure | `mani` | 4 | Estaciones de manicure |

### Formato de Nombres
Los recursos siguen el patrón: `{código}-{número}`

Ejemplos:
- `mkup-01`, `mkup-02`, `mkup-03`
- `lshs-01`
- `pedi-01`, `pedi-02`, `pedi-03`, `pedi-04`
- `mani-01`, `mani-02`, `mani-03`, `mani-04`

## Detalles por Tipo

### Maquillaje (`mkup`)
- **Total:** 3 estaciones por location
- **Tipo:** station
- **Capacidad:** 1 persona por estación
- **Uso:** Servicios de maquillaje profesional

### Pestañas (`lshs`)
- **Total:** 1 cama por location
- **Tipo:** station
- **Capacidad:** 1 persona
- **Uso:** Extensiones de pestañas

### Pedicure (`pedi`)
- **Total:** 4 estaciones por location
- **Tipo:** station
- **Capacidad:** 1 persona por estación
- **Uso:** Servicios de pedicure

### Manicure (`mani`)
- **Total:** 4 estaciones por location
- **Tipo:** station
- **Capacidad:** 1 persona por estación
- **Uso:** Servicios de manicure

## Impacto en el Sistema

### Bookings Eliminados
⚠️ **IMPORTANTE:** Debido a la restricción `CASCADE DELETE` en la tabla `resources`, todos los bookings que referenciaban los recursos anteriores han sido eliminados.

Esto significa que:
- No hay bookings activos en el sistema
- Los clientes deberán reprogramar sus citas
- Se debe informar a los usuarios del cambio

### Cómo Afecta al Kiosko
El kiosko ahora asignará recursos usando los nuevos códigos:
- Cuando un cliente solicita maquillaje → asigna `mkup-XX`
- Cuando un cliente solicita pestañas → asigna `lshs-01`
- Cuando un cliente solicita pedicure → asigna `pedi-XX`
- Cuando un cliente solicita manicure → asigna `mani-XX`

### Mapeo de Servicios a Recursos

Para mantener la consistencia, los servicios deberían asignarse a los recursos correctos:

| Servicio | Recurso Recomendado | Notas |
|----------|---------------------|-------|
| Maquillaje Profesional | `mkup-XX` | Cualquiera de las 3 estaciones |
| Extensión de Pestañas | `lshs-01` | Único recurso disponible |
| Pedicure Spa | `pedi-XX` | Cualquiera de las 4 estaciones |
| Manicure Gel | `mani-XX` | Cualquiera de las 4 estaciones |
| Uñas Acrílicas | `mani-XX` | Cualquiera de las 4 estaciones |

## Ejecutar la Migración

### Opción 1: Via Supabase Dashboard

1. Ve a: https://supabase.com/dashboard/project/pvvwbnybkadhreuqijsl/sql
2. Copia el contenido de `supabase/migrations/20260116010000_update_resources.sql`
3. Pega en el SQL Editor
4. Haz clic en "Run"
5. Verifica el output en la consola

### Opción 2: Via CLI (si está configurado)

```bash
supabase db push
```

## Verificar la Migración

### Consulta SQL para Ver Recursos

```sql
SELECT 
    l.name AS location,
    r.name AS resource_code,
    r.type AS resource_type,
    r.capacity,
    r.is_active
FROM resources r
JOIN locations l ON l.id = r.location_id
WHERE l.is_active = true
ORDER BY l.name, r.name;
```

### Resultado Esperado

```
location          | resource_code | resource_type | capacity | is_active
------------------|---------------|---------------|----------|----------
ANCHOR:23 - Via KLAVA | lshs-01       | station       | 1        | true
ANCHOR:23 - Via KLAVA | mani-01       | station       | 1        | true
ANCHOR:23 - Via KLAVA | mani-02       | station       | 1        | true
ANCHOR:23 - Via KLAVA | mani-03       | station       | 1        | true
ANCHOR:23 - Via KLAVA | mani-04       | station       | 1        | true
ANCHOR:23 - Via KLAVA | mkup-01       | station       | 1        | true
ANCHOR:23 - Via KLAVA | mkup-02       | station       | 1        | true
ANCHOR:23 - Via KLAVA | mkup-03       | station       | 1        | true
ANCHOR:23 - Via KLAVA | pedi-01       | station       | 1        | true
ANCHOR:23 - Via KLAVA | pedi-02       | station       | 1        | true
ANCHOR:23 - Via KLAVA | pedi-03       | station       | 1        | true
ANCHOR:23 - Via KLAVA | pedi-04       | station       | 1        | true
TEST - Salón Principal | lshs-01       | station       | 1        | true
TEST - Salón Principal | mani-01       | station       | 1        | true
TEST - Salón Principal | mani-02       | station       | 1        | true
TEST - Salón Principal | mani-03       | station       | 1        | true
TEST - Salón Principal | mani-04       | station       | 1        | true
TEST - Salón Principal | mkup-01       | station       | 1        | true
TEST - Salón Principal | mkup-02       | station       | 1        | true
TEST - Salón Principal | mkup-03       | station       | 1        | true
TEST - Salón Principal | pedi-01       | station       | 1        | true
TEST - Salón Principal | pedi-02       | station       | 1        | true
TEST - Salón Principal | pedi-03       | station       | 1        | true
TEST - Salón Principal | pedi-04       | station       | 1        | true
```

## Actualizar el Seed Data (Opcional)

Si deseas mantener el archivo de seed consistente, actualiza la sección de recursos en `20260115235900_seed_data.sql`:

```sql
-- REEMPLAZAR ESTA SECCIÓN EN EL SEED
-- 2. Crear Resources (solo si no existen)
DO $$
BEGIN
    -- Para ANCHOR:23 - Via KLAVA
    FOR i IN 1..3 LOOP
        IF NOT EXISTS (
            SELECT 1 FROM resources r
            JOIN locations l ON l.id = r.location_id
            WHERE l.name = 'ANCHOR:23 - Via KLAVA' AND r.name = 'mkup-' || LPAD(i::TEXT, 2, '0')
        ) THEN
            INSERT INTO resources (location_id, name, type, capacity, is_active)
            SELECT id, 'mkup-' || LPAD(i::TEXT, 2, '0'), 'station', 1, true
            FROM locations WHERE name = 'ANCHOR:23 - Via KLAVA';
        END IF;
    END LOOP;

    INSERT INTO resources (location_id, name, type, capacity, is_active)
    SELECT id, 'lshs-01', 'station', 1, true
    FROM locations l
    WHERE l.name = 'ANCHOR:23 - Via KLAVA'
    AND NOT EXISTS (
        SELECT 1 FROM resources r 
        WHERE r.location_id = l.id AND r.name = 'lshs-01'
    );

    FOR i IN 1..4 LOOP
        IF NOT EXISTS (
            SELECT 1 FROM resources r
            JOIN locations l ON l.id = r.location_id
            WHERE l.name = 'ANCHOR:23 - Via KLAVA' AND r.name = 'pedi-' || LPAD(i::TEXT, 2, '0')
        ) THEN
            INSERT INTO resources (location_id, name, type, capacity, is_active)
            SELECT id, 'pedi-' || LPAD(i::TEXT, 2, '0'), 'station', 1, true
            FROM locations WHERE name = 'ANCHOR:23 - Via KLAVA';
        END IF;
    END LOOP;

    FOR i IN 1..4 LOOP
        IF NOT EXISTS (
            SELECT 1 FROM resources r
            JOIN locations l ON l.id = r.location_id
            WHERE l.name = 'ANCHOR:23 - Via KLAVA' AND r.name = 'mani-' || LPAD(i::TEXT, 2, '0')
        ) THEN
            INSERT INTO resources (location_id, name, type, capacity, is_active)
            SELECT id, 'mani-' || LPAD(i::TEXT, 2, '0'), 'station', 1, true
            FROM locations WHERE name = 'ANCHOR:23 - Via KLAVA';
        END IF;
    END LOOP;

    -- Repetir mismo patrón para otras locations...
END $$;
```

## Notas Importantes

### IDs de Resources
Cada location tendrá sus propios recursos con IDs únicos. Por ejemplo:
- ANCHOR:23 - Via KLAVA → `mkup-01` tiene un ID específico
- TEST - Salón Principal → `mkup-01` tiene un ID diferente

### Agregar Nuevas Locations
Cuando agregues una nueva location, la migración de actualización de recursos (`20260116010000_update_resources.sql`) creará automáticamente los 12 recursos para ella:
- 3 mkup
- 1 lshs
- 4 pedi
- 4 mani

### Modificar Cantidades
Si necesitas cambiar las cantidades en el futuro, modifica la migración:

```sql
-- Ejemplo: cambiar a 5 estaciones de maquillaje
FOR i IN 1..5 LOOP
    INSERT INTO resources ...
END LOOP;
```

## Soporte y Troubleshooting

### Error: "Resources table is empty"
- Ejecuta la migración de actualización de recursos
- Verifica que las locations estén activas

### Error: "Booking references non-existent resource"
- Esto es normal después de la migración
- Los bookings anteriores fueron eliminados por CASCADE DELETE
- Crea nuevos bookings con el sistema actualizado

### Consulta para Ver Locations sin Recursos
```sql
SELECT l.id, l.name 
FROM locations l
LEFT JOIN resources r ON r.location_id = l.id
WHERE l.is_active = true 
AND r.id IS NULL;
```
