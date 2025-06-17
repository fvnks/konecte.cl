

# Esquema de la Base de Datos konecte (MySQL)

Este documento describe la estructura propuesta para las tablas de la base de datos de konecte.
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
('user', 'Usuario', 'Usuario estándar con capacidad para publicar y comentar.'),
('broker', 'Corredor', 'Usuario corredor de propiedades con acceso a funcionalidades de colaboración.');
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
    max_ai_searches_monthly INT DEFAULT NULL,        -- Límite de búsquedas IA por mes (NULL o 0 para sin límite/base, >0 para límite específico)
    whatsapp_bot_enabled BOOLEAN DEFAULT FALSE,      -- NUEVO: Permite al usuario usar el chat con el bot de WhatsApp
    can_feature_properties BOOLEAN DEFAULT FALSE,
    property_listing_duration_days INT DEFAULT NULL, -- NULL para indefinido
    is_active BOOLEAN DEFAULT TRUE,
    is_publicly_visible BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Insertar plan gratuito por defecto (opcional, puede ser gestionado desde la app)
INSERT INTO plans (id, name, description, price_monthly, max_properties_allowed, max_requests_allowed, property_listing_duration_days, max_ai_searches_monthly, whatsapp_bot_enabled, is_publicly_visible) VALUES
(UUID(), 'Gratuito', 'Plan básico con funcionalidades limitadas.', 0.00, 1, 1, 30, 5, FALSE, TRUE);
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
    rut_tin VARCHAR(20) DEFAULT NULL,                    -- RUT (Chile) o Tax ID Number
    phone_number VARCHAR(50) DEFAULT NULL,               -- Número de teléfono
    avatar_url VARCHAR(2048) DEFAULT NULL,
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
CREATE INDEX idx_users_rut_tin ON users(rut_tin);
CREATE INDEX idx_users_phone_number ON users(phone_number);

-- Ejemplo para insertar un usuario administrador (ejecutar después de crear las tablas 'roles' y 'users'):
-- Contraseña: "admin123" (hasheada con bcrypt, salt rounds: 10)
-- El hash es: $2a$10$V2sLg0n9jR8iO.xP9v.G8.U0z9iE.h1nQ.o0sP1cN2wE3kF4lG5tS
-- Asegúrate de que el rol 'admin' exista en la tabla 'roles'.
-- INSERT INTO users (id, name, email, password_hash, role_id) VALUES
-- (UUID(), 'Admin konecte', 'admin@konecte.cl', '$2a$10$V2sLg0n9jR8iO.xP9v.G8.U0z9iE.h1nQ.o0sP1cN2wE3kF4lG5tS', 'admin');
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
    views_count INT DEFAULT 0,                             -- Contador de vistas (actualizado por lógica de app)
    inquiries_count INT DEFAULT 0,                         -- Contador de consultas (actualizado por lógica de app)
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
CREATE INDEX idx_properties_upvotes ON properties(upvotes);
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
    desired_location_neighborhood VARCHAR(100) DEFAULT NULL,
    min_bedrooms INT DEFAULT NULL,
    min_bathrooms INT DEFAULT NULL,
    budget_max DECIMAL(15,2) DEFAULT NULL,
    -- budget_currency VARCHAR(3) DEFAULT 'CLP', -- Considerar si el presupuesto puede ser en diferentes monedas
    open_for_broker_collaboration BOOLEAN DEFAULT FALSE,
    comments_count INT DEFAULT 0,
    upvotes INT DEFAULT 0,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Índices
CREATE INDEX idx_property_requests_slug ON property_requests(slug);
CREATE INDEX idx_property_requests_user_id ON property_requests(user_id);
CREATE INDEX idx_property_requests_city ON property_requests(desired_location_city);
CREATE INDEX idx_property_requests_broker_collab ON property_requests(open_for_broker_collaboration);
CREATE INDEX idx_property_requests_upvotes ON property_requests(upvotes);
```

---

## Tabla: `comments` (Comentarios)

Almacena comentarios para propiedades y solicitudes.

```sql
CREATE TABLE comments (
    id VARCHAR(36) PRIMARY KEY,
    user_id VARCHAR(36) NOT NULL,                          -- FK a users.id
    content TEXT NOT NULL,
    parent_id VARCHAR(36) DEFAULT NULL,                    -- Para comentarios anidados (referencia a comments.id)

    property_id VARCHAR(36) DEFAULT NULL,                  -- FK a properties.id (NULL si es para una solicitud)
    request_id VARCHAR(36) DEFAULT NULL,                   -- FK a property_requests.id (NULL si es para una propiedad)

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

## Tabla: `user_comment_interactions` (Interacciones con Comentarios)
Almacena las interacciones de los usuarios con los comentarios, como "me gusta".

```sql
CREATE TABLE user_comment_interactions (
    id VARCHAR(36) PRIMARY KEY,
    user_id VARCHAR(36) NOT NULL,
    comment_id VARCHAR(36) NOT NULL,
    interaction_type ENUM('like') NOT NULL DEFAULT 'like', -- Puede expandirse a otros tipos de interacción en el futuro
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (comment_id) REFERENCES comments(id) ON DELETE CASCADE,
    UNIQUE KEY uq_user_comment_interaction (user_id, comment_id, interaction_type) -- Un usuario solo puede tener una interacción de un tipo por comentario
);

-- Índices
CREATE INDEX idx_user_comment_interactions_user_comment ON user_comment_interactions(user_id, comment_id);
CREATE INDEX idx_user_comment_interactions_comment ON user_comment_interactions(comment_id);
```

---

## Tabla: `google_sheet_configs` (Configuración de Google Sheets)
Almacena la configuración para la integración con Google Sheets. Se espera que haya una sola fila.

```sql
CREATE TABLE google_sheet_configs (
    id INT PRIMARY KEY DEFAULT 1, -- Asumimos una única fila de configuración global
    sheet_id VARCHAR(255) DEFAULT NULL,
    sheet_name VARCHAR(255) DEFAULT NULL,
    columns_to_display TEXT DEFAULT NULL,      -- Nombres de encabezados separados por coma
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
    site_title VARCHAR(255) DEFAULT 'konecte - Encuentra Tu Próxima Propiedad',
    logo_url VARCHAR(2048) DEFAULT NULL,
    show_featured_listings_section BOOLEAN DEFAULT TRUE,
    show_ai_matching_section BOOLEAN DEFAULT TRUE,
    show_google_sheet_section BOOLEAN DEFAULT TRUE,
    landing_sections_order TEXT DEFAULT NULL, -- JSON array: e.g., '["featured_list_requests", "ai_matching", "google_sheet"]'
    announcement_bar_text TEXT DEFAULT NULL,
    announcement_bar_link_url VARCHAR(2048) DEFAULT NULL,
    announcement_bar_link_text VARCHAR(255) DEFAULT NULL,
    announcement_bar_is_active BOOLEAN DEFAULT FALSE,
    announcement_bar_bg_color VARCHAR(20) DEFAULT '#FFB74D', -- Naranja de acento por defecto
    announcement_bar_text_color VARCHAR(20) DEFAULT '#18181b', -- Foreground oscuro por defecto
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT id_must_be_1_site_settings CHECK (id = 1)
);

-- Insertar configuración inicial para site_settings (incluyendo nuevos campos)
-- Los valores existentes se mantienen gracias a ON DUPLICATE KEY UPDATE y COALESCE para los campos actualizables
INSERT INTO site_settings (
    id, site_title, logo_url,
    show_featured_listings_section, show_ai_matching_section, show_google_sheet_section,
    landing_sections_order,
    announcement_bar_is_active, announcement_bar_bg_color, announcement_bar_text_color
)
VALUES (
    1,
    'konecte - Encuentra Tu Próxima Propiedad',
    NULL,
    TRUE,
    TRUE,
    TRUE,
    '["featured_list_requests", "ai_matching", "google_sheet"]', -- Valor por defecto para el orden
    FALSE, -- announcement_bar_is_active
    '#FFB74D', -- announcement_bar_bg_color
    '#18181b'  -- announcement_bar_text_color
)
ON DUPLICATE KEY UPDATE
    site_title = VALUES(site_title),
    logo_url = VALUES(logo_url),
    show_featured_listings_section = VALUES(show_featured_listings_section),
    show_ai_matching_section = VALUES(show_ai_matching_section),
    show_google_sheet_section = VALUES(show_google_sheet_section),
    landing_sections_order = COALESCE(site_settings.landing_sections_order, VALUES(landing_sections_order)),
    announcement_bar_text = COALESCE(site_settings.announcement_bar_text, VALUES(announcement_bar_text)),
    announcement_bar_link_url = COALESCE(site_settings.announcement_bar_link_url, VALUES(announcement_bar_link_url)),
    announcement_bar_link_text = COALESCE(site_settings.announcement_bar_link_text, VALUES(announcement_bar_link_text)),
    announcement_bar_is_active = VALUES(announcement_bar_is_active),
    announcement_bar_bg_color = VALUES(announcement_bar_bg_color),
    announcement_bar_text_color = VALUES(announcement_bar_text_color),
    updated_at = CURRENT_TIMESTAMP;

-- Asegurar que landing_sections_order tenga un valor por defecto si es NULL después de una posible inserción/actualización
UPDATE site_settings
SET landing_sections_order = '["featured_list_requests", "ai_matching", "google_sheet"]'
WHERE id = 1 AND landing_sections_order IS NULL;
```

---

## Sección CRM

### Tabla: `contacts` (Contactos del CRM)
Almacena la información de los contactos gestionados por los usuarios. Cada contacto pertenece a un `user` de konecte.

```sql
CREATE TABLE contacts (
    id VARCHAR(36) PRIMARY KEY,                          -- UUID
    user_id VARCHAR(36) NOT NULL,                        -- FK a users.id (El usuario de konecte dueño de este contacto)
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) DEFAULT NULL,
    phone VARCHAR(50) DEFAULT NULL,
    company_name VARCHAR(255) DEFAULT NULL,
    status ENUM('new', 'contacted', 'qualified', 'proposal_sent', 'negotiation', 'won', 'lost', 'on_hold', 'unqualified') DEFAULT 'new',
    source VARCHAR(100) DEFAULT NULL,                    -- Origen del contacto (ej: 'Referido', 'Web konecte', 'Llamada entrante')
    notes TEXT DEFAULT NULL,
    last_contacted_at TIMESTAMP NULL DEFAULT NULL,       -- Se podría actualizar con un trigger o desde la app
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE, -- Si se elimina el usuario, se eliminan sus contactos CRM

    INDEX idx_contacts_user_id_status (user_id, status),
    INDEX idx_contacts_user_id_email (user_id, email)
);
```

### Tabla: `contact_interactions` (Interacciones con Contactos del CRM)
Almacena el historial de conversaciones/interacciones con cada contacto. Cada interacción pertenece a un `contact` y fue registrada por un `user`.

```sql
CREATE TABLE contact_interactions (
    id VARCHAR(36) PRIMARY KEY,                          -- UUID
    contact_id VARCHAR(36) NOT NULL,                     -- FK a contacts.id
    user_id VARCHAR(36) NOT NULL,                        -- FK a users.id (Quién registró la interacción, usualmente el dueño del contacto)
    interaction_type ENUM('note', 'email_sent', 'email_received', 'call_made', 'call_received', 'meeting', 'message_sent', 'message_received', 'task_completed', 'property_viewing', 'offer_made', 'other') NOT NULL,
    interaction_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    subject VARCHAR(255) DEFAULT NULL,                   -- Asunto (ej: para emails o reuniones)
    description TEXT NOT NULL,                           -- Detalles de la interacción
    outcome VARCHAR(255) DEFAULT NULL,                   -- Resultado de la interacción (ej: 'Interesado', 'Necesita seguimiento', 'No interesado')
    follow_up_needed BOOLEAN DEFAULT FALSE,
    follow_up_date DATE DEFAULT NULL,                    -- Solo fecha para el seguimiento

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    FOREIGN KEY (contact_id) REFERENCES contacts(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,

    INDEX idx_interactions_contact_id_date (contact_id, interaction_date DESC),
    INDEX idx_interactions_user_id (user_id),
    INDEX idx_interactions_follow_up_date (follow_up_date)
);
```
---
## Sección Mensajería Directa (Chat)

### Tabla: `chat_conversations` (Conversaciones de Chat)
Almacena las conversaciones entre dos usuarios, opcionalmente vinculadas a una propiedad o solicitud.

```sql
CREATE TABLE chat_conversations (
    id VARCHAR(36) PRIMARY KEY,
    property_id VARCHAR(36) DEFAULT NULL,
    request_id VARCHAR(36) DEFAULT NULL,
    user_a_id VARCHAR(36) NOT NULL,
    user_b_id VARCHAR(36) NOT NULL,
    user_a_unread_count INT UNSIGNED NOT NULL DEFAULT 0,
    user_b_unread_count INT UNSIGNED NOT NULL DEFAULT 0,
    last_message_at TIMESTAMP NULL DEFAULT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    FOREIGN KEY (property_id) REFERENCES properties(id) ON DELETE SET NULL,
    FOREIGN KEY (request_id) REFERENCES property_requests(id) ON DELETE SET NULL,
    FOREIGN KEY (user_a_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (user_b_id) REFERENCES users(id) ON DELETE CASCADE,

    CONSTRAINT uq_conversation_participants UNIQUE (user_a_id, user_b_id, property_id, request_id),
    CONSTRAINT chk_different_users CHECK (user_a_id <> user_b_id)
);

-- Índices para chat_conversations
CREATE INDEX idx_chat_conversations_user_a ON chat_conversations(user_a_id, last_message_at DESC);
CREATE INDEX idx_chat_conversations_user_b ON chat_conversations(user_b_id, last_message_at DESC);
CREATE INDEX idx_chat_conversations_property ON chat_conversations(property_id);
CREATE INDEX idx_chat_conversations_request ON chat_conversations(request_id);
```

### Tabla: `chat_messages` (Mensajes de Chat)
Almacena los mensajes individuales de cada conversación.

```sql
CREATE TABLE chat_messages (
    id VARCHAR(36) PRIMARY KEY,
    conversation_id VARCHAR(36) NOT NULL,
    sender_id VARCHAR(36) NOT NULL,
    receiver_id VARCHAR(36) NOT NULL,
    content TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    read_at TIMESTAMP NULL DEFAULT NULL,

    FOREIGN KEY (conversation_id) REFERENCES chat_conversations(id) ON DELETE CASCADE,
    FOREIGN KEY (sender_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (receiver_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Índices para chat_messages
CREATE INDEX idx_chat_messages_conversation_created ON chat_messages(conversation_id, created_at DESC);
CREATE INDEX idx_chat_messages_sender ON chat_messages(sender_id);
CREATE INDEX idx_chat_messages_receiver_read ON chat_messages(receiver_id, read_at);
```
---
## Tabla: `editable_texts` (Textos Editables del Sitio)
Almacena textos del sitio que pueden ser modificados desde el panel de administración.

```sql
CREATE TABLE editable_texts (
    id VARCHAR(255) PRIMARY KEY,                             -- Identificador único para el texto (ej: 'home_hero_title', 'auth_signin_description')
    page_group VARCHAR(100) NOT NULL,                        -- Grupo al que pertenece el texto (ej: 'home', 'auth', 'plans')
    description TEXT NOT NULL,                               -- Descripción para el administrador sobre qué es este texto
    content_default TEXT,                                    -- Valor original/por defecto del texto (puede ser útil para revertir)
    content_current TEXT,                                    -- Contenido actual editable por el administrador
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Índices
CREATE INDEX idx_editable_texts_page_group ON editable_texts(page_group);

-- Textos iniciales de ejemplo (se insertan a través del script setup-db.ts)
-- Ejemplo:
-- INSERT IGNORE INTO editable_texts (id, page_group, description, content_default, content_current) VALUES
--   ('home_hero_title', 'home', 'Título principal de la página de inicio', 'Encuentra Tu Espacio Ideal en konecte', 'Encuentra Tu Espacio Ideal en konecte'),
--   ('plans_page_main_title', 'plans_page', 'Título principal de la página de planes', '¡Contratación 100% online!', '¡Contratación 100% online!');
```

---
## Sección Seguimiento de Leads

### Tabla: `property_views` (Vistas de Propiedad)
Registra las vistas de las páginas de detalle de propiedades.

```sql
CREATE TABLE property_views (
    id VARCHAR(36) PRIMARY KEY,
    property_id VARCHAR(36) NOT NULL,
    user_id VARCHAR(36) DEFAULT NULL,                      -- FK a users.id (si el usuario está logueado)
    ip_address VARCHAR(45) DEFAULT NULL,                   -- Para seguimiento anónimo básico
    user_agent TEXT DEFAULT NULL,                          -- Para análisis
    viewed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (property_id) REFERENCES properties(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL -- Si se elimina el usuario, la vista permanece anónima
);

-- Índices
CREATE INDEX idx_property_views_property_id ON property_views(property_id);
CREATE INDEX idx_property_views_user_id ON property_views(user_id);
CREATE INDEX idx_property_views_viewed_at ON property_views(viewed_at);
```

### Tabla: `property_inquiries` (Consultas sobre Propiedades)
Almacena las consultas realizadas a través del formulario de contacto de una propiedad.

```sql
CREATE TABLE property_inquiries (
    id VARCHAR(36) PRIMARY KEY,
    property_id VARCHAR(36) NOT NULL,
    property_owner_id VARCHAR(36) NOT NULL,                -- FK a users.id (dueño de la propiedad al momento de la consulta)
    user_id VARCHAR(36) DEFAULT NULL,                      -- FK a users.id (si el que consulta está logueado)
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL,
    phone VARCHAR(50) DEFAULT NULL,
    message TEXT NOT NULL,
    submitted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    is_read BOOLEAN DEFAULT FALSE,                         -- Para que el dueño de la propiedad marque como leída

    FOREIGN KEY (property_id) REFERENCES properties(id) ON DELETE CASCADE,
    FOREIGN KEY (property_owner_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
);

-- Índices
CREATE INDEX idx_property_inquiries_property_id ON property_inquiries(property_id);
CREATE INDEX idx_property_inquiries_property_owner_id ON property_inquiries(property_owner_id);
CREATE INDEX idx_property_inquiries_user_id ON property_inquiries(user_id);
CREATE INDEX idx_property_inquiries_submitted_at ON property_inquiries(submitted_at);
```
---

## Sección Agenda de Visitas

### Tabla: `property_visits` (Agenda de Visitas a Propiedades)
Almacena las solicitudes y programaciones de visitas a las propiedades.

```sql
CREATE TABLE property_visits (
    id VARCHAR(36) PRIMARY KEY,
    property_id VARCHAR(36) NOT NULL,
    visitor_user_id VARCHAR(36) NOT NULL,
    property_owner_user_id VARCHAR(36) NOT NULL,

    proposed_datetime DATETIME NOT NULL,
    confirmed_datetime DATETIME DEFAULT NULL,

    status ENUM(
        'pending_confirmation',
        'confirmed',
        'cancelled_by_visitor',
        'cancelled_by_owner',
        'rescheduled_by_owner',
        'completed',
        'visitor_no_show',
        'owner_no_show'
    ) NOT NULL DEFAULT 'pending_confirmation',

    visitor_notes TEXT DEFAULT NULL,
    owner_notes TEXT DEFAULT NULL,
    cancellation_reason TEXT DEFAULT NULL,

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    FOREIGN KEY (property_id) REFERENCES properties(id) ON DELETE CASCADE,
    FOREIGN KEY (visitor_user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (property_owner_user_id) REFERENCES users(id) ON DELETE CASCADE,

    INDEX idx_visits_property_id_status (property_id, status),
    INDEX idx_visits_visitor_id_status (visitor_user_id, status),
    INDEX idx_visits_owner_id_status (property_owner_user_id, status),
    INDEX idx_visits_proposed_datetime (proposed_datetime),
    INDEX idx_visits_confirmed_datetime (confirmed_datetime)
);
```
---

## Sección Colaboración entre Corredores

### Tabla: `broker_collaborations` (Colaboraciones entre Corredores)
Almacena las propuestas y acuerdos de colaboración entre corredores para propiedades y solicitudes de clientes.

```sql
CREATE TABLE broker_collaborations (
    id VARCHAR(36) PRIMARY KEY,
    property_request_id VARCHAR(36) NOT NULL,    -- ID de la solicitud del cliente buscador (publicada por Corredor A)
    requesting_broker_id VARCHAR(36) NOT NULL,   -- ID del Corredor A (quien tiene el cliente buscador)
    property_id VARCHAR(36) NOT NULL,            -- ID de la propiedad ofrecida (de la cartera del Corredor B)
    offering_broker_id VARCHAR(36) NOT NULL,     -- ID del Corredor B (quien ofrece la propiedad)
    status ENUM('pending', 'accepted', 'rejected', 'deal_in_progress', 'deal_closed_success', 'deal_failed') DEFAULT 'pending',
    commission_terms TEXT DEFAULT NULL,          -- JSON o texto describiendo el acuerdo de comisión (ej: {"split_type": "percentage", "offering_broker_share": 50, "requesting_broker_share": 50, "notes": "..."})
    chat_conversation_id VARCHAR(36) DEFAULT NULL, -- FK a chat_conversations (opcional, si se crea un chat dedicado)
    proposed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    accepted_at TIMESTAMP DEFAULT NULL,
    closed_at TIMESTAMP DEFAULT NULL,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    FOREIGN KEY (property_request_id) REFERENCES property_requests(id) ON DELETE CASCADE,
    FOREIGN KEY (requesting_broker_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (property_id) REFERENCES properties(id) ON DELETE CASCADE,
    FOREIGN KEY (offering_broker_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (chat_conversation_id) REFERENCES chat_conversations(id) ON DELETE SET NULL,

    CONSTRAINT uq_collaboration_request_property UNIQUE (property_request_id, property_id),
    CONSTRAINT chk_different_brokers CHECK (requesting_broker_id <> offering_broker_id) -- Asegura que los dos corredores sean diferentes
);

-- Índices para broker_collaborations
CREATE INDEX idx_broker_collaborations_requesting_broker ON broker_collaborations(requesting_broker_id, status);
CREATE INDEX idx_broker_collaborations_offering_broker ON broker_collaborations(offering_broker_id, status);
CREATE INDEX idx_broker_collaborations_request_id ON broker_collaborations(property_request_id);
CREATE INDEX idx_broker_collaborations_property_id ON broker_collaborations(property_id);
```
---
## Tabla: `contact_form_submissions` (Envíos del Formulario de Contacto Público)
Almacena los mensajes enviados a través del formulario de contacto general del sitio.

```sql
CREATE TABLE contact_form_submissions (
    id VARCHAR(36) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL,
    phone VARCHAR(50) DEFAULT NULL,
    subject VARCHAR(255) DEFAULT NULL,
    message TEXT NOT NULL,
    submitted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    is_read BOOLEAN DEFAULT FALSE,
    admin_notes TEXT DEFAULT NULL, -- Notas internas del administrador
    replied_at TIMESTAMP DEFAULT NULL, -- Fecha en que se marcó como respondido

    INDEX idx_contact_submissions_submitted_at (submitted_at),
    INDEX idx_contact_submissions_is_read (is_read)
);
```
---
## Tabla: `user_listing_interactions` (Interacciones tipo "Like/Dislike" con Listados)
Almacena las preferencias (me gusta/no me gusta) de los usuarios sobre propiedades o solicitudes.

```sql
CREATE TABLE user_listing_interactions (
    id VARCHAR(36) PRIMARY KEY,
    user_id VARCHAR(36) NOT NULL,
    listing_id VARCHAR(36) NOT NULL,
    listing_type ENUM('property', 'request') NOT NULL,
    interaction_type ENUM('like', 'dislike', 'skip') NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    -- No se pueden añadir FK directas a properties.id y property_requests.id en una sola columna.
    -- Se manejará la integridad a nivel de aplicación o con triggers si es necesario.
    -- O considerar dos tablas separadas: user_property_interactions y user_request_interactions.
    -- Por simplicidad inicial, se usa una sola tabla.

    UNIQUE KEY uq_user_listing_interaction (user_id, listing_id, listing_type)
    -- Un usuario solo puede tener una interacción registrada (like, dislike, o skip) por listado.
    -- Si se permite cambiar de opinión (ej. de dislike a like), la acción debe ser un UPDATE.
);

-- Índices
CREATE INDEX idx_user_listing_interactions_user_listing ON user_listing_interactions(user_id, listing_type, listing_id);
CREATE INDEX idx_user_listing_interactions_listing ON user_listing_interactions(listing_type, listing_id, interaction_type);
```
---
## Tabla: `user_ai_search_usage` (Uso de Búsquedas con IA por Usuario)
Registra cada vez que un usuario realiza una búsqueda con IA, para controlar límites según su plan.

```sql
CREATE TABLE user_ai_search_usage (
    id VARCHAR(36) PRIMARY KEY,
    user_id VARCHAR(36) NOT NULL,
    plan_id_at_search VARCHAR(36) DEFAULT NULL, -- El plan que tenía el usuario al momento de la búsqueda
    flow_name VARCHAR(255) NOT NULL,            -- Nombre del flujo Genkit invocado (ej: 'findListingsForFreeTextSearchFlow')
    search_timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (plan_id_at_search) REFERENCES plans(id) ON DELETE SET NULL,

    INDEX idx_user_ai_usage_user_month (user_id, search_timestamp) -- Para contar búsquedas por mes fácilmente
);
```

---
Este es un esquema inicial. Lo podemos refinar a medida que construimos las funcionalidades. Por ejemplo, las `features` e `images` en la tabla `properties` podrían moverse a tablas separadas para una relación muchos-a-muchos si se vuelve más complejo (ej: `property_features` y `property_images`). Lo mismo para `desired_categories` y `desired_property_type` en `property_requests` que actualmente usan campos booleanos individuales.


