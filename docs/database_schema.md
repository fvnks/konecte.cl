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

## Tabla: `users` (Usuarios)

Almacena la información de los usuarios registrados.

```sql
CREATE TABLE users (
    id VARCHAR(36) PRIMARY KEY,                           -- UUID o similar, si no es autoincremental
    -- user_id INT AUTO_INCREMENT PRIMARY KEY,            -- Alternativa con ID numérico
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,                 -- Hash de la contraseña
    avatar_url VARCHAR(2048),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);
```

---

## Tabla: `properties` (Propiedades)

Almacena los listados de propiedades.

```sql
CREATE TABLE properties (
    id VARCHAR(36) PRIMARY KEY,
    -- property_id INT AUTO_INCREMENT PRIMARY KEY,
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
    images TEXT,                                           -- URLs de imágenes, separadas por comas o JSON array
    features TEXT,                                         -- Características, separadas por comas o JSON array
    upvotes INT DEFAULT 0,
    comments_count INT DEFAULT 0,                          -- Se puede actualizar con triggers o lógica de app
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    is_active BOOLEAN DEFAULT TRUE,                        -- Para activar/desactivar listados
    
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
    -- request_id INT AUTO_INCREMENT PRIMARY KEY,
    user_id VARCHAR(36) NOT NULL,                          -- FK a users.id
    title VARCHAR(255) NOT NULL,
    slug VARCHAR(255) UNIQUE NOT NULL,
    description TEXT NOT NULL,
    desired_property_type_rent BOOLEAN DEFAULT FALSE,      -- Si busca para arriendo
    desired_property_type_sale BOOLEAN DEFAULT FALSE,      -- Si busca para venta
    -- Alternativa para desired_property_type: VARCHAR(255) para 'rent,sale' o tabla de unión

    desired_category_apartment BOOLEAN DEFAULT FALSE,
    desired_category_house BOOLEAN DEFAULT FALSE,
    desired_category_condo BOOLEAN DEFAULT FALSE,
    desired_category_land BOOLEAN DEFAULT FALSE,
    desired_category_commercial BOOLEAN DEFAULT FALSE,
    desired_category_other BOOLEAN DEFAULT FALSE,
    -- Alternativa para desired_categories: VARCHAR(255) o tabla de unión

    desired_location_city VARCHAR(100) NOT NULL,
    desired_location_neighborhood VARCHAR(100),
    min_bedrooms INT,
    min_bathrooms INT,
    budget_max DECIMAL(15,2),
    -- budget_currency VARCHAR(3) DEFAULT 'CLP', -- Si el presupuesto puede ser en diferentes monedas
    comments_count INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    is_active BOOLEAN DEFAULT TRUE,

    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Índices
CREATE INDEX idx_property_requests_slug ON property_requests(slug);
CREATE INDEX idx_property_requests_user_id ON property_requests(user_id);
CREATE INDEX idx_property_requests_city ON property_requests(desired_location_city);

```
*Nota sobre `desired_property_type` y `desired_categories` en `property_requests`:*
Usar campos booleanos individuales es simple para un número fijo de opciones. Si las opciones pueden crecer o se necesita más flexibilidad, una tabla de unión (muchos a muchos) entre `property_requests` y `property_types`/`categories` sería una mejor solución. Por ejemplo:
`request_property_types (request_id, property_type_value)`
`request_categories (request_id, category_value)`

---

## Tabla: `comments` (Comentarios)

Almacena comentarios para propiedades y solicitudes.

```sql
CREATE TABLE comments (
    id VARCHAR(36) PRIMARY KEY,
    -- comment_id INT AUTO_INCREMENT PRIMARY KEY,
    user_id VARCHAR(36) NOT NULL,                          -- FK a users.id
    content TEXT NOT NULL,
    parent_id VARCHAR(36),                                 -- Para comentarios anidados (referencia a comments.id)
    
    -- Para vincular el comentario a una propiedad O una solicitud
    property_id VARCHAR(36),                               -- FK a properties.id (NULL si es para una solicitud)
    request_id VARCHAR(36),                                -- FK a property_requests.id (NULL si es para una propiedad)

    upvotes INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (parent_id) REFERENCES comments(id) ON DELETE SET NULL, -- O CASCADE
    FOREIGN KEY (property_id) REFERENCES properties(id) ON DELETE CASCADE,
    FOREIGN KEY (request_id) REFERENCES property_requests(id) ON DELETE CASCADE,

    -- Asegura que un comentario pertenezca a una propiedad O una solicitud, pero no a ambas (y no a ninguna)
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

## Tabla: `property_upvotes` (Votos para Propiedades - Ejemplo)

Si se desea un sistema de votos más detallado (quién votó qué).

```sql
-- CREATE TABLE property_upvotes (
--     user_id VARCHAR(36) NOT NULL,
--     property_id VARCHAR(36) NOT NULL,
--     created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
--     PRIMARY KEY (user_id, property_id),
--     FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
--     FOREIGN KEY (property_id) REFERENCES properties(id) ON DELETE CASCADE
-- );
```

---

Este es un esquema inicial. Lo podemos refinar a medida que construimos las funcionalidades. Por ejemplo, las `features` e `images` en la tabla `properties` podrían moverse a tablas separadas para una relación muchos-a-muchos si se vuelve más complejo (ej: `property_features` y `property_images`). Lo mismo para `desired_categories` y `desired_property_type` en `property_requests`.

Avísame cuando quieras definir la primera tabla y te ayudaré a generar el comando `CREATE TABLE` específico que podrás ejecutar.
