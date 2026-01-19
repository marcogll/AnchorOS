-- ============================================
-- FIX: Actualizar TODOS los horarios de negocio incorrectos
-- Date: 20260119
-- Description: Fix all locations with incorrect business hours (22:00-23:00)
-- ============================================

-- Verificar horarios actuales antes de la corrección
SELECT id, name, business_hours FROM locations;

-- Actualizar TODOS los horarios incorrectos (incluyendo 22:00-23:00)
UPDATE locations
SET business_hours = '{
  "monday": {"open": "10:00", "close": "19:00", "is_closed": false},
  "tuesday": {"open": "10:00", "close": "19:00", "is_closed": false},
  "wednesday": {"open": "10:00", "close": "19:00", "is_closed": false},
  "thursday": {"open": "10:00", "close": "19:00", "is_closed": false},
  "friday": {"open": "10:00", "close": "19:00", "is_closed": false},
  "saturday": {"open": "10:00", "close": "18:00", "is_closed": false},
  "sunday": {"is_closed": true}
}'::jsonb
WHERE
  -- Horarios que contienen 22:00 (hora incorrecta)
  business_hours::text LIKE '%"22:00"%' OR
  -- Horarios que contienen 23:00 (hora incorrecta)
  business_hours::text LIKE '%"23:00"%' OR
  -- Horarios completamente vacíos o con datos incorrectos
  business_hours IS NULL OR
  business_hours = '{}'::jsonb OR
  -- Horarios que no tienen la estructura correcta
  jsonb_typeof(business_hours) != 'object';

-- Verificar que los horarios se actualizaron correctamente
SELECT id, name, business_hours FROM locations;

-- Log para confirmar la corrección
DO $$
DECLARE
  updated_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO updated_count FROM locations
  WHERE business_hours::text LIKE '%"10:00"%';

  RAISE NOTICE 'Updated % locations with correct business hours (10:00-19:00)', updated_count;
END $$;