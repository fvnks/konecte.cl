# Esquema de la Base de Datos PropSpot (MySQL)

Este documento describe la estructura propuesta para las tablas de la base de datos de PropSpot.
A medida que la aplicación evolucione, este esquema se actualizará.

**Convenciones:**
- Los nombres de las tablas y columnas estarán en `snake_case`.
- `VARCHAR(255)` es un valor predeterminado común, ajustar según sea necesario.
- `TEXT` para descripciones largas.
- `DECIMAL(15,2)` para precios, ajustar precisión según las necesidades (ej: para UF podría ser `DECIMAL(10,4)`).
- `TIMESTAMP` o `DATETIME` para fechas, `DEFAULT CURRENT_TIMESTAMP` es útil.

---

## Tabla: `roles` (Roles de Usuario)

Almacena los diferentes roles que un usuario puede tener.

```sql
CREATE TABLE roles (
    id VARCHAR(36) PRIMARY KEY,                          -- Identificador único para el rol (ej: 'admin', 'user', 'editor')
    name VARCHAR(255) NOT NULL UNIQUE,                   -- Nombre legible del rol (ej: 'Administrador', 'Usuario Estándar')
    description TEXT,                                    -- Descripción opcional del rol
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Insertar roles iniciales
INSERT INTO roles (id, name, description) VALUES 
('admin', 'Administrador', 'Acceso total a todas las funcionalidades y configuraciones del sistema.'),
('user', 'Usuario', 'Usuario estándar con capacidad para publicar y comentar.');
```

---
## Tabla: `plans` (Planes de Suscripción)

Almacena los detalles de los diferentes planes de suscripción o uso.

```sql
CREATE TABLE plans (
    id VARCHAR(36) PRIMARY KEY,
    name VARCHAR(255) NOT NULL UNIQUE,
    description TEXT,
    price_monthly DECIMAL(10,2) DEFAULT 0.00,
    price_currency VARCHAR(3) DEFAULT 'CLP',
    max_properties_allowed INT DEFAULT NULL,         -- NULL para ilimitado
    max_requests_allowed INT DEFAULT NULL,           -- NULL para ilimitado
    can_feature_properties BOOLEAN DEFAULT FALSE,
    property_listing_duration_days INT DEFAULT NULL, -- NULL para indefinido
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Insertar plan gratuito por defecto (opcional, puede ser gestionado desde la app)
INSERT INTO plans (id, name, description, price_monthly, max_properties_allowed, max_requests_allowed, property_listing_duration_days) VALUES
(UUID(), 'Gratuito', 'Plan básico con funcionalidades limitadas.', 0.00, 1, 1, 30);
```

---

## Tabla: `users` (Usuarios)

Almacena la información de los usuarios registrados.

```sql
-- Si la tabla 'users' ya existe y necesitas modificarla para que coincida con este esquema:
-- 1. Primero elimina la tabla existente SI NO CONTIENE DATOS IMPORTANTES:
--    DROP TABLE users;
-- 2. Luego ejecuta el CREATE TABLE a continuación.
-- Si necesitas conservar datos, tendrás que usar ALTER TABLE para añadir las columnas faltantes
-- y la clave foránea.

CREATE TABLE users (
    id VARCHAR(36) PRIMARY KEY,                           -- UUID o similar
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,                 -- Hash de la contraseña
    avatar_url VARCHAR(2048),
    role_id VARCHAR(36) NOT NULL,                        -- FK a roles.id
    plan_id VARCHAR(36) DEFAULT NULL,                    -- FK a plans.id, NULL si no tiene plan o para plan por defecto no asignado explícitamente
    plan_expires_at TIMESTAMP DEFAULT NULL,              -- Fecha de expiración del plan actual
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    FOREIGN KEY (role_id) REFERENCES roles(id) ON DELETE RESTRICT, -- O SET DEFAULT si tienes un rol por defecto seguro
    FOREIGN KEY (plan_id) REFERENCES plans(id) ON DELETE SET NULL  -- Si se elimina un plan, el usuario queda sin plan o se le podría asignar uno por defecto vía lógica de app.
);

-- Índices
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_role_id ON users(role_id);
CREATE INDEX idx_users_plan_id ON users(plan_id);

-- Ejemplo para insertar un usuario administrador (ejecutar después de crear las tablas 'roles' y 'users'):
-- Contraseña: "admin123" (hasheada con bcrypt, salt rounds: 10)
-- El hash es: $2a$10$V2sLg0n9jR8iO.xP9v.G8.U0z9iE.h1nQ.o0sP1cN2wE3kF4lG5tS
-- Asegúrate de que el rol 'admin' exista en la tabla 'roles'.
-- INSERT INTO users (id, name, email, password_hash, role_id) VALUES 
-- (UUID(), 'Admin PropSpot', 'admin@propspot.cl', '$2a$10$V2sLg0n9jR8iO.xP9v.G8.U0z9iE.h1nQ.o0sP1cN2wE3kF4lG5tS', 'admin');
```

---

## Tabla: `properties` (Propiedades)

Almacena los listados de propiedades.

```sql
CREATE TABLE properties (
    id VARCHAR(36) PRIMARY KEY,
    user_id VARCHAR(36) NOT NULL,                          -- FK a users.id
    title VARCHAR(255) NOT NULL,
    slug VARCHAR(255) UNIQUE NOT NULL,                     -- Para URLs amigables
    description TEXT NOT NULL,
    property_type ENUM('rent', 'sale') NOT NULL,           -- 'arriendo', 'venta'
    category ENUM('apartment', 'house', 'condo', 'land', 'commercial', 'other') NOT NULL,
    price DECIMAL(15,2) NOT NULL,
    currency VARCHAR(3) NOT NULL,                          -- 'CLP', 'UF'
    address VARCHAR(255) NOT NULL,
    city VARCHAR(100) NOT NULL,
    country VARCHAR(100) NOT NULL,
    bedrooms INT NOT NULL DEFAULT 0,
    bathrooms INT NOT NULL DEFAULT 0,
    area_sq_meters DECIMAL(10,2) NOT NULL,
    images JSON,                                           -- JSON array de URLs de imágenes
    features JSON,                                         -- JSON array de características
    upvotes INT DEFAULT 0,
    comments_count INT DEFAULT 0,                          -- Se puede actualizar con triggers o lógica de app
    is_active BOOLEAN DEFAULT TRUE,                        -- Para activar/desactivar listados
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Índices para mejorar búsquedas
CREATE INDEX idx_properties_slug ON properties(slug);
CREATE INDEX idx_properties_user_id ON properties(user_id);
CREATE INDEX idx_properties_city ON properties(city);
CREATE INDEX idx_properties_property_type ON properties(property_type);
CREATE INDEX idx_properties_category ON properties(category);
```

---

## Tabla: `property_requests` (Solicitudes de Propiedad)

Almacena las solicitudes de búsqueda de propiedades de los usuarios.

```sql
CREATE TABLE property_requests (
    id VARCHAR(36) PRIMARY KEY,
    user_id VARCHAR(36) NOT NULL,                          -- FK a users.id
    title VARCHAR(255) NOT NULL,
    slug VARCHAR(255) UNIQUE NOT NULL,
    description TEXT NOT NULL,
    
    -- Tipos de transacción deseados (booleanos para simplificar)
    desired_property_type_rent BOOLEAN DEFAULT FALSE,      
    desired_property_type_sale BOOLEAN DEFAULT FALSE,      

    -- Categorías de propiedad deseadas (booleanos)
    desired_category_apartment BOOLEAN DEFAULT FALSE,
    desired_category_house BOOLEAN DEFAULT FALSE,
    desired_category_condo BOOLEAN DEFAULT FALSE,
    desired_category_land BOOLEAN DEFAULT FALSE,
    desired_category_commercial BOOLEAN DEFAULT FALSE,
    desired_category_other BOOLEAN DEFAULT FALSE,
    
    desired_location_city VARCHAR(100) NOT NULL,
    desired_location_neighborhood VARCHAR(100),
    min_bedrooms INT,
    min_bathrooms INT,
    budget_max DECIMAL(15,2),
    -- budget_currency VARCHAR(3) DEFAULT 'CLP', -- Considerar si el presupuesto puede ser en diferentes monedas
    comments_count INT DEFAULT 0,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Índices
CREATE INDEX idx_property_requests_slug ON property_requests(slug);
CREATE INDEX idx_property_requests_user_id ON property_requests(user_id);
CREATE INDEX idx_property_requests_city ON property_requests(desired_location_city);
```

---

## Tabla: `comments` (Comentarios)

Almacena comentarios para propiedades y solicitudes.

```sql
CREATE TABLE comments (
    id VARCHAR(36) PRIMARY KEY,
    user_id VARCHAR(36) NOT NULL,                          -- FK a users.id
    content TEXT NOT NULL,
    parent_id VARCHAR(36),                                 -- Para comentarios anidados (referencia a comments.id)
    
    property_id VARCHAR(36),                               -- FK a properties.id (NULL si es para una solicitud)
    request_id VARCHAR(36),                                -- FK a property_requests.id (NULL si es para una propiedad)

    upvotes INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (parent_id) REFERENCES comments(id) ON DELETE SET NULL, 
    FOREIGN KEY (property_id) REFERENCES properties(id) ON DELETE CASCADE,
    FOREIGN KEY (request_id) REFERENCES property_requests(id) ON DELETE CASCADE,

    CONSTRAINT chk_comment_target CHECK (
        (property_id IS NOT NULL AND request_id IS NULL) OR 
        (property_id IS NULL AND request_id IS NOT NULL)
    )
);

-- Índices
CREATE INDEX idx_comments_user_id ON comments(user_id);
CREATE INDEX idx_comments_property_id ON comments(property_id);
CREATE INDEX idx_comments_request_id ON comments(request_id);
CREATE INDEX idx_comments_parent_id ON comments(parent_id);
```
---

## Tabla: `google_sheet_configs` (Configuración de Google Sheets)
Almacena la configuración para la integración con Google Sheets. Se espera que haya una sola fila.

```sql
CREATE TABLE google_sheet_configs (
    id INT PRIMARY KEY DEFAULT 1, -- Asumimos una única fila de configuración global
    sheet_id VARCHAR(255),
    sheet_name VARCHAR(255),
    columns_to_display TEXT,      -- Nombres de encabezados separados por coma
    is_configured BOOLEAN DEFAULT FALSE,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT id_must_be_1_google_sheet CHECK (id = 1) -- Asegura que solo exista la fila con id=1
);

-- Insertar configuración inicial (vacía o con valores por defecto)
INSERT INTO google_sheet_configs (id, is_configured) VALUES (1, FALSE)
ON DUPLICATE KEY UPDATE id = 1; -- Para evitar error si se ejecuta múltiples veces
```

---
## Tabla: `site_settings` (Configuración del Sitio)
Almacena configuraciones globales del sitio, como título, logo y visibilidad de secciones. Se espera una única fila.

```sql
CREATE TABLE site_settings (
    id INT PRIMARY KEY DEFAULT 1,
    site_title VARCHAR(255) DEFAULT 'PropSpot - Encuentra Tu Próxima Propiedad',
    logo_url VARCHAR(2048) DEFAULT NULL, -- URL para el logo personalizado
    show_featured_listings_section BOOLEAN DEFAULT TRUE,
    show_ai_matching_section BOOLEAN DEFAULT TRUE,
    show_google_sheet_section BOOLEAN DEFAULT TRUE,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT id_must_be_1_site_settings CHECK (id = 1)
);

-- Insertar configuración inicial para site_settings
INSERT INTO site_settings (id, site_title, logo_url, show_featured_listings_section, show_ai_matching_section, show_google_sheet_section) 
VALUES (1, 'PropSpot - Encuentra Tu Próxima Propiedad', NULL, TRUE, TRUE, TRUE)
ON DUPLICATE KEY UPDATE id = 1;
```

---
Este es un esquema inicial. Lo podemos refinar a medida que construimos las funcionalidades. Por ejemplo, las `features` e `images` en la tabla `properties` podrían moverse a tablas separadas para una relación muchos-a-muchos si se vuelve más complejo (ej: `property_features` y `property_images`). Lo mismo para `desired_categories` y `desired_property_type` en `property_requests` que actualmente usan campos booleanos individuales.

```
