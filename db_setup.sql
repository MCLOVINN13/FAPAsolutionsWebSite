-- ALERTA: Ejecuta esto en el "SQL Editor" de Supabase para crear tus tablas

-- 1. Tabla de Usuarios (Datos del perfil público)
CREATE TABLE IF NOT EXISTS usuarios (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT,
    username TEXT UNIQUE,
    fullname TEXT,
    profile_pic TEXT,
    cover_pic TEXT,
    location TEXT,
    bio TEXT,
    numero_cotizaciones INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Tabla de Cotizaciones
CREATE TABLE IF NOT EXISTS cotizaciones (
    id SERIAL PRIMARY KEY,
    user_id UUID REFERENCES usuarios(id) ON DELETE SET NULL,
    device_model TEXT,
    problem_description TEXT,
    estimated_price DECIMAL,
    status TEXT DEFAULT 'Pendiente',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Habilitar Seguridad (RLS)
ALTER TABLE usuarios ENABLE ROW LEVEL SECURITY;
ALTER TABLE cotizaciones ENABLE ROW LEVEL SECURITY;

-- 4. Políticas de Acceso (¿Quién puede ver/editar qué?)

-- Usuarios: Cualquiera puede ver perfiles (para que el frontend funcione)
CREATE POLICY "Public profiles are viewable by everyone" 
ON usuarios FOR SELECT USING (true);

-- Usuarios: Solo el dueño puede editar su propio perfil
CREATE POLICY "Users can insert their own profile" 
ON usuarios FOR INSERT WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update own profile" 
ON usuarios FOR UPDATE USING (auth.uid() = id);

-- Cotizaciones: Cualquiera puede crear una (incluso anónimos si quisieras, pero aquí restringimos a insert)
CREATE POLICY "Anyone can create quotes" 
ON cotizaciones FOR INSERT WITH CHECK (true);

-- Cotizaciones: Solo el dueño puede ver sus historiales
CREATE POLICY "Users can view own quotes" 
ON cotizaciones FOR SELECT USING (auth.uid() = user_id);
