-- 1. Habilitar Realtime para la tabla Cotizaciones
-- Para que el cliente reciba cambios en vivo
ALTER PUBLICATION supabase_realtime ADD TABLE cotizaciones;

-- 2. Crear Política para "Admins"
-- (Simplificado: Permitimos leer TODAS las cotizaciones si el email es 'tu_email')
-- REEMPLAZA 'tu_email@ejemplo.com' con TU CORREO REAL que usas al loguearte
CREATE POLICY "Admins can view all" 
ON cotizaciones FOR SELECT 
USING (
    -- Opción simple: Hardcodea tu email admin aquí
    auth.jwt() ->> 'email' IN ('erikgamer192@gmail.com', 'admin@fapa.com')
    OR
    -- Opción flexible: Usar una tabla de roles (más avanzado, lo dejamos para después)
    auth.uid() = user_id -- (El usuario normal sigue viendo solo lo suyo)
);

-- Si la política anterior de SELECT (users view own quotes) entra en conflicto, 
-- Supabase usa "OR" (si alguna política permite, pasa). 
-- Pero debemos asegurarnos de que la anterior no restrinja demasiado si ya existe.
-- La anterior era: auth.uid() = user_id. Esta NUEVA se suma.

-- 3. Permitir UPDATE a Admins
CREATE POLICY "Admins can update status" 
ON cotizaciones FOR UPDATE 
USING (
    auth.jwt() ->> 'email' IN ('erikgamer192@gmail.com', 'admin@fapa.com')
    OR
    auth.uid() = user_id
);

-- 4. Permitir DELETE a Admins
CREATE POLICY "Admins can delete" 
ON cotizaciones FOR DELETE 
USING (
    auth.jwt() ->> 'email' IN ('erikgamer192@gmail.com', 'admin@fapa.com')
);
