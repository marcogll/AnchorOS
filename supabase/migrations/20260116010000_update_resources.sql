-- ============================================
-- ACTUALIZACIÓN DE RECURSOS - SALONOS
-- Reemplazar recursos existentes con nueva estructura
-- ============================================

-- 1. ELIMINAR TODOS LOS RECURSOS EXISTENTES
DELETE FROM resources;

-- 2. CREAR NUEVOS RECURSOS PARA CADA LOCATION
DO $$
DECLARE
    location_record RECORD;
    i INTEGER;
BEGIN
    FOR location_record IN SELECT id, name FROM locations WHERE is_active = true LOOP
        
        -- 3 Estaciones de Maquillaje (mkup)
        FOR i IN 1..3 LOOP
            INSERT INTO resources (location_id, name, type, capacity, is_active)
            VALUES (
                location_record.id,
                'mkup-' || LPAD(i::TEXT, 2, '0'),
                'station',
                1,
                true
            );
        END LOOP;
        
        -- 1 Cama de Pestañas (lshs)
        INSERT INTO resources (location_id, name, type, capacity, is_active)
        VALUES (
            location_record.id,
            'lshs-01',
            'station',
            1,
            true
        );
        
        -- 4 Estaciones de Pedicure (pedi)
        FOR i IN 1..4 LOOP
            INSERT INTO resources (location_id, name, type, capacity, is_active)
            VALUES (
                location_record.id,
                'pedi-' || LPAD(i::TEXT, 2, '0'),
                'station',
                1,
                true
            );
        END LOOP;
        
        -- 4 Estaciones de Manicure (mani)
        FOR i IN 1..4 LOOP
            INSERT INTO resources (location_id, name, type, capacity, is_active)
            VALUES (
                location_record.id,
                'mani-' || LPAD(i::TEXT, 2, '0'),
                'station',
                1,
                true
            );
        END LOOP;
        
        RAISE NOTICE 'Recursos creados para location: %', location_record.name;
    END LOOP;
END $$;

-- 3. VERIFICACIÓN Y RESUMEN
DO $$
DECLARE
    location_record RECORD;
BEGIN
    RAISE NOTICE '==========================================';
    RAISE NOTICE 'ACTUALIZACIÓN DE RECURSOS COMPLETADA';
    RAISE NOTICE '==========================================';
    RAISE NOTICE 'Total de Resources: %', (SELECT COUNT(*) FROM resources);
    RAISE NOTICE 'Locations activas: %', (SELECT COUNT(*) FROM locations WHERE is_active = true);
    RAISE NOTICE '==========================================';
    RAISE NOTICE 'Recursos por tipo:';
    RAISE NOTICE '  - mkup (Maquillaje): %', (SELECT COUNT(*) FROM resources WHERE name LIKE 'mkup-%');
    RAISE NOTICE '  - lshs (Pestañas): %', (SELECT COUNT(*) FROM resources WHERE name LIKE 'lshs-%');
    RAISE NOTICE '  - pedi (Pedicure): %', (SELECT COUNT(*) FROM resources WHERE name LIKE 'pedi-%');
    RAISE NOTICE '  - mani (Manicure): %', (SELECT COUNT(*) FROM resources WHERE name LIKE 'mani-%');
    RAISE NOTICE '==========================================';
    RAISE NOTICE 'Recursos por location:';

    FOR location_record IN
        SELECT l.id, l.name, COUNT(r.id) as resource_count
        FROM locations l
        LEFT JOIN resources r ON r.location_id = l.id
        WHERE l.is_active = true
        GROUP BY l.id, l.name
        ORDER BY l.name
    LOOP
        RAISE NOTICE '  %: % recursos', location_record.name, location_record.resource_count;
    END LOOP;

    RAISE NOTICE '==========================================';
    RAISE NOTICE 'NOMBRES DE RECURSOS CREADOS:';
    RAISE NOTICE '  mkup-01, mkup-02, mkup-03 (Maquillaje)';
    RAISE NOTICE '  lshs-01 (Pestañas)';
    RAISE NOTICE '  pedi-01, pedi-02, pedi-03, pedi-04 (Pedicure)';
    RAISE NOTICE '  mani-01, mani-02, mani-03, mani-04 (Manicure)';
    RAISE NOTICE '==========================================';
    RAISE NOTICE 'ADVERTENCIA: Todos los bookings existentes que';
    RAISE NOTICE 'referenciaban los recursos anteriores han sido';
    RAISE NOTICE 'eliminados en cascada por la restricción CASCADE.';
    RAISE NOTICE '==========================================';
END
$$;
