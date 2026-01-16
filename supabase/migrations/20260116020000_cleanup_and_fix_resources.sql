-- ============================================
-- LIMPIEZA Y REESTRUCTURACIÓN DE RECURSOS
-- Elimina duplicados y establece formato estándar
-- ============================================

-- 1. OBTENER INFORMACIÓN DE LO QUE SERÁ ELIMINADO
DO $$
DECLARE
    resources_count INTEGER;
    locations_count INTEGER;
    bookings_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO resources_count FROM resources;
    SELECT COUNT(*) INTO locations_count FROM locations WHERE is_active = true;
    SELECT COUNT(*) INTO bookings_count FROM bookings;

    RAISE NOTICE '==========================================';
    RAISE NOTICE 'ANTES DE LA MIGRACIÓN:';
    RAISE NOTICE '==========================================';
    RAISE NOTICE 'Resources existentes: %', resources_count;
    RAISE NOTICE 'Locations activas: %', locations_count;
    RAISE NOTICE 'Bookings activos: %', bookings_count;
    RAISE NOTICE '==========================================';
    RAISE NOTICE 'ADVERTENCIA: Todos estos recursos';
    RAISE NOTICE 'serán eliminados.';
    RAISE NOTICE '==========================================';
END
$$;

-- 2. ELIMINAR TODOS LOS RECURSOS EXISTENTES
DELETE FROM resources;

-- 3. CREAR NUEVOS RECURSOS PARA CADA LOCATION ACTIVA
DO $$
DECLARE
    location_record RECORD;
    i INTEGER;
    resource_name TEXT;
BEGIN
    FOR location_record IN SELECT id, name FROM locations WHERE is_active = true LOOP
        
        RAISE NOTICE 'Creando recursos para: %', location_record.name;
        
        -- 3 Estaciones de Maquillaje (mkup)
        FOR i IN 1..3 LOOP
            resource_name := 'mkup-' || LPAD(i::TEXT, 2, '0');
            INSERT INTO resources (location_id, name, type, capacity, is_active)
            VALUES (
                location_record.id,
                resource_name,
                'station',
                1,
                true
            );
            RAISE NOTICE '  - Creado: %', resource_name;
        END LOOP;
        
        -- 1 Cama de Pestañas (lshs)
        resource_name := 'lshs-01';
        INSERT INTO resources (location_id, name, type, capacity, is_active)
        VALUES (
            location_record.id,
            resource_name,
            'station',
            1,
            true
        );
        RAISE NOTICE '  - Creado: %', resource_name;
        
        -- 4 Estaciones de Pedicure (pedi)
        FOR i IN 1..4 LOOP
            resource_name := 'pedi-' || LPAD(i::TEXT, 2, '0');
            INSERT INTO resources (location_id, name, type, capacity, is_active)
            VALUES (
                location_record.id,
                resource_name,
                'station',
                1,
                true
            );
            RAISE NOTICE '  - Creado: %', resource_name;
        END LOOP;
        
        -- 4 Estaciones de Manicure (mani)
        FOR i IN 1..4 LOOP
            resource_name := 'mani-' || LPAD(i::TEXT, 2, '0');
            INSERT INTO resources (location_id, name, type, capacity, is_active)
            VALUES (
                location_record.id,
                resource_name,
                'station',
                1,
                true
            );
            RAISE NOTICE '  - Creado: %', resource_name;
        END LOOP;
        
        RAISE NOTICE 'Completado para location: %', location_record.name;
        RAISE NOTICE '==========================================';
    END LOOP;
END $$;

-- 4. VERIFICACIÓN Y RESUMEN
DO $$
DECLARE
    total_resources INTEGER;
    total_locations INTEGER;
    location_record RECORD;
BEGIN
    SELECT COUNT(*) INTO total_resources FROM resources;
    SELECT COUNT(*) INTO total_locations FROM locations WHERE is_active = true;

    RAISE NOTICE '==========================================';
    RAISE NOTICE 'MIGRACIÓN DE RECURSOS COMPLETADA';
    RAISE NOTICE '==========================================';
    RAISE NOTICE 'Total de Resources: %', total_resources;
    RAISE NOTICE 'Total de Locations: %', total_locations;
    RAISE NOTICE '==========================================';
    RAISE NOTICE 'Recursos por tipo (global):';
    RAISE NOTICE '  - mkup (Maquillaje): %', (SELECT COUNT(*) FROM resources WHERE name LIKE 'mkup-%');
    RAISE NOTICE '  - lshs (Pestañas): %', (SELECT COUNT(*) FROM resources WHERE name LIKE 'lshs-%');
    RAISE NOTICE '  - pedi (Pedicure): %', (SELECT COUNT(*) FROM resources WHERE name LIKE 'pedi-%');
    RAISE NOTICE '  - mani (Manicure): %', (SELECT COUNT(*) FROM resources WHERE name LIKE 'mani-%');
    RAISE NOTICE '==========================================';
    RAISE NOTICE 'Recursos por location:';
    
    FOR location_record IN 
        SELECT l.id, l.name, COUNT(r.id) as resource_count 
        FROM locations l 
        JOIN resources r ON r.location_id = l.id 
        WHERE l.is_active = true 
        GROUP BY l.id, l.name 
        ORDER BY l.name
    LOOP
        RAISE NOTICE '  % (% recursos)', location_record.name, location_record.resource_count;
    END LOOP;
    
    RAISE NOTICE '==========================================';
    RAISE NOTICE 'FORMATO DE NOMBRES:';
    RAISE NOTICE '  Maquillaje: mkup-01, mkup-02, mkup-03';
    RAISE NOTICE '  Pestañas:   lshs-01';
    RAISE NOTICE '  Pedicure:   pedi-01, pedi-02, pedi-03, pedi-04';
    RAISE NOTICE '  Manicure:   mani-01, mani-02, mani-03, mani-04';
    RAISE NOTICE '==========================================';
    RAISE NOTICE 'ESTADO: Listo para usar';
    RAISE NOTICE '==========================================';
END
$$;
