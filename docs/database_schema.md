

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
('broker', 'Corredor', 'Usuario corredor de propiedades con acceso a funcionalidades de colaboración y planes pagos.');
```

---
## Tabla: `plans` (Planes de Suscripción para Corredores)

Almacena los detalles de los diferentes planes de suscripción para corredores.

```sql
CREATE TABLE plans (
    id VARCHAR(36) PRIMARY KEY,
    name VARCHAR(255) NOT NULL UNIQUE,
    description TEXT,
    price_monthly DECIMAL(10,2) DEFAULT 0.00,
    price_currency VARCHAR(3) DEFAULT 'CLP',

    -- Límites de publicación
    max_properties_allowed INT DEFAULT NULL,         -- NULL para ilimitado
    max_requests_allowed INT DEFAULT NULL,           -- NULL para ilimitado
    property_listing_duration_days INT DEFAULT NULL, -- NULL para indefinido
    can_feature_properties BOOLEAN DEFAULT FALSE,

    -- Permisos de visualización y búsqueda
    can_view_contact_data BOOLEAN DEFAULT FALSE,     -- Si puede ver datos de contacto según reglas
    manual_searches_daily_limit INT DEFAULT NULL,    -- Límite diario de búsquedas manuales (NULL para sin límite específico del plan)

    -- Funcionalidades Avanzadas
    automated_alerts_enabled BOOLEAN DEFAULT FALSE,  -- Para alertas IA + WhatsApp
    max_ai_searches_monthly INT DEFAULT NULL,        -- Límite mensual de búsquedas/alertas IA
    advanced_dashboard_access BOOLEAN DEFAULT FALSE, -- Acceso a dashboard avanzado con filtros

    -- Límites de Uso (Protección)
    daily_profile_views_limit INT DEFAULT NULL,      -- Límite de visualizaciones de perfiles/propiedades por día
    weekly_matches_reveal_limit INT DEFAULT NULL,    -- Límite de "revelaciones de coincidencias" (contactos) por semana
    
    -- Flags del Plan
    is_active BOOLEAN DEFAULT TRUE,                  -- Si el plan está activo para nuevas suscripciones
    is_publicly_visible BOOLEAN DEFAULT TRUE,      -- Si el plan se muestra en la página de planes
    is_enterprise_plan BOOLEAN DEFAULT FALSE,        -- Para planes corporativos especiales

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Insertar planes iniciales (Gratis, PRO, PREMIUM)
INSERT INTO plans (id, name, description, price_monthly, max_properties_allowed, max_requests_allowed, property_listing_duration_days, can_feature_properties, can_view_contact_data, manual_searches_daily_limit, automated_alerts_enabled, max_ai_searches_monthly, advanced_dashboard_access, daily_profile_views_limit, weekly_matches_reveal_limit, is_active, is_publicly_visible, is_enterprise_plan) VALUES
(UUID(), 'Gratis Corredor', 'Publicación gratuita de propiedades y solicitudes. Sin acceso a datos de contacto de personas naturales.', 0.00, 5, 5, 30, FALSE, FALSE, 5, FALSE, 0, FALSE, 20, 5, TRUE, TRUE, FALSE),
(UUID(), 'PRO Corredor', 'Ideal para corredores que inician. Acceso limitado a datos y búsquedas.', 14900.00, 20, 20, 60, TRUE, TRUE, 50, FALSE, 10, FALSE, 100, 20, TRUE, TRUE, FALSE),
(UUID(), 'PREMIUM Corredor', 'Funcionalidad completa, alertas IA y panel avanzado para corredores activos.', 24900.00, NULL, NULL, 90, TRUE, TRUE, NULL, TRUE, 50, TRUE, NULL, 100, TRUE, TRUE, FALSE);
```

---

## Tabla: `users` (Usuarios)

Almacena la información de los usuarios registrados.

```sql
CREATE TABLE users (
    id VARCHAR(36) PRIMARY KEY,                           -- UUID o similar
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,                 -- Hash de la contraseña
    rut_tin VARCHAR(20) DEFAULT NULL,                    -- RUT (Chile) o Tax ID Number
    phone_number VARCHAR(50) DEFAULT NULL,               -- Número de teléfono
    avatar_url VARCHAR(2048) DEFAULT NULL,
    role_id VARCHAR(36) NOT NULL,                        -- FK a roles.id ('user' para persona natural, 'broker' para corredor)
    plan_id VARCHAR(36) DEFAULT NULL,                    -- FK a plans.id (NULL si es persona natural o corredor en plan gratuito implícito)
    plan_expires_at TIMESTAMP DEFAULT NULL,              -- Fecha de expiración del plan actual (para corredores)
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    FOREIGN KEY (role_id) REFERENCES roles(id) ON DELETE RESTRICT,
    FOREIGN KEY (plan_id) REFERENCES plans(id) ON DELETE SET NULL
);

-- Índices
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_role_id ON users(role_id);
CREATE INDEX idx_users_plan_id ON users(plan_id);
CREATE INDEX idx_users_rut_tin ON users(rut_tin);
CREATE INDEX idx_users_phone_number ON users(phone_number);
```

---

## Tabla: `properties` (Propiedades)
(Sin cambios significativos en esta tabla basados en el nuevo modelo de negocio, más allá de cómo se accede a sus datos)
```sql
CREATE TABLE properties (
    id VARCHAR(36) PRIMARY KEY,
    user_id VARCHAR(36) NOT NULL,
    title VARCHAR(255) NOT NULL,
    slug VARCHAR(255) UNIQUE NOT NULL,
    description TEXT NOT NULL,
    property_type ENUM('rent', 'sale') NOT NULL,
    category ENUM('apartment', 'house', 'condo', 'land', 'commercial', 'other') NOT NULL,
    price DECIMAL(15,2) NOT NULL,
    currency VARCHAR(3) NOT NULL,
    address VARCHAR(255) NOT NULL,
    city VARCHAR(100) NOT NULL,
    country VARCHAR(100) NOT NULL,
    bedrooms INT NOT NULL DEFAULT 0,
    bathrooms INT NOT NULL DEFAULT 0,
    area_sq_meters DECIMAL(10,2) NOT NULL,
    images JSON,
    features JSON,
    upvotes INT DEFAULT 0,
    comments_count INT DEFAULT 0,
    views_count INT DEFAULT 0,
    inquiries_count INT DEFAULT 0,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Índices
CREATE INDEX idx_properties_slug ON properties(slug);
CREATE INDEX idx_properties_user_id ON properties(user_id);
-- (Otros índices existentes se mantienen)
```

---

## Tabla: `property_requests` (Solicitudes de Propiedad)
(Sin cambios significativos en esta tabla basados en el nuevo modelo de negocio)
```sql
CREATE TABLE property_requests (
    id VARCHAR(36) PRIMARY KEY,
    user_id VARCHAR(36) NOT NULL,
    title VARCHAR(255) NOT NULL,
    slug VARCHAR(255) UNIQUE NOT NULL,
    description TEXT NOT NULL,
    desired_property_type_rent BOOLEAN DEFAULT FALSE,
    desired_property_type_sale BOOLEAN DEFAULT FALSE,
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
-- (Otros índices existentes se mantienen)
```

---

## Tabla: `comments` (Comentarios)
(Sin cambios)
```sql
CREATE TABLE comments (
    id VARCHAR(36) PRIMARY KEY,
    user_id VARCHAR(36) NOT NULL,
    content TEXT NOT NULL,
    parent_id VARCHAR(36) DEFAULT NULL,
    property_id VARCHAR(36) DEFAULT NULL,
    request_id VARCHAR(36) DEFAULT NULL,
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
-- Índices existentes se mantienen
```
---

## Tabla: `user_comment_interactions` (Interacciones con Comentarios)
(Sin cambios)
```sql
CREATE TABLE user_comment_interactions (
    id VARCHAR(36) PRIMARY KEY,
    user_id VARCHAR(36) NOT NULL,
    comment_id VARCHAR(36) NOT NULL,
    interaction_type ENUM('like') NOT NULL DEFAULT 'like',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (comment_id) REFERENCES comments(id) ON DELETE CASCADE,
    UNIQUE KEY uq_user_comment_interaction (user_id, comment_id, interaction_type)
);
-- Índices existentes se mantienen
```
---

## Tabla: `google_sheet_configs` (Configuración de Google Sheets - para Análisis WhatsBot)
(Sin cambios estructurales, solo el propósito de la sección que la usa)
```sql
CREATE TABLE google_sheet_configs (
    id INT PRIMARY KEY DEFAULT 1,
    sheet_id VARCHAR(255) DEFAULT NULL,
    sheet_name VARCHAR(255) DEFAULT NULL,
    columns_to_display TEXT DEFAULT NULL,
    is_configured BOOLEAN DEFAULT FALSE,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT id_must_be_1_google_sheet CHECK (id = 1)
);
-- Insert inicial se mantiene
```
---

## Tabla: `site_settings` (Configuración del Sitio)
(Actualizar comentario para `landing_sections_order` para reflejar `analisis_whatsbot`)
```sql
CREATE TABLE site_settings (
    id INT PRIMARY KEY DEFAULT 1,
    site_title VARCHAR(255) DEFAULT 'konecte - Encuentra Tu Próxima Propiedad',
    logo_url VARCHAR(2048) DEFAULT NULL,
    show_featured_listings_section BOOLEAN DEFAULT TRUE,
    show_ai_matching_section BOOLEAN DEFAULT TRUE,
    show_google_sheet_section BOOLEAN DEFAULT TRUE, -- El nombre de la columna en BD se mantiene por ahora como "google_sheet"
    landing_sections_order TEXT DEFAULT NULL, -- JSON array: e.g., '["featured_list_requests", "ai_matching", "analisis_whatsbot"]'
    announcement_bar_text TEXT DEFAULT NULL,
    announcement_bar_link_url VARCHAR(2048) DEFAULT NULL,
    announcement_bar_link_text VARCHAR(255) DEFAULT NULL,
    announcement_bar_is_active BOOLEAN DEFAULT FALSE,
    announcement_bar_bg_color VARCHAR(20) DEFAULT '#FFB74D', 
    announcement_bar_text_color VARCHAR(20) DEFAULT '#18181b', 
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT id_must_be_1_site_settings CHECK (id = 1)
);

-- Insertar/Actualizar configuración inicial para site_settings
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
    '["featured_list_requests", "ai_matching", "analisis_whatsbot"]', -- Actualizado
    FALSE, 
    '#FFB74D', 
    '#18181b'  
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

UPDATE site_settings
SET landing_sections_order = '["featured_list_requests", "ai_matching", "analisis_whatsbot"]' -- Asegurar consistencia
WHERE id = 1 AND (landing_sections_order IS NULL OR landing_sections_order != '["featured_list_requests", "ai_matching", "analisis_whatsbot"]');
```
---

## Sección CRM (Sin cambios)
(Las tablas `contacts` y `contact_interactions` se mantienen como están)
```sql
-- contacts
-- contact_interactions
```
---
## Sección Mensajería Directa (Chat) (Sin cambios)
(Las tablas `chat_conversations` y `chat_messages` se mantienen como están)
```sql
-- chat_conversations
-- chat_messages
```
---
## Tabla: `editable_texts` (Textos Editables del Sitio) (Sin cambios)
```sql
-- editable_texts
```
---
## Sección Seguimiento de Leads (Sin cambios)
(Las tablas `property_views` y `property_inquiries` se mantienen como están)
```sql
-- property_views
-- property_inquiries
```
---
## Sección Agenda de Visitas (Sin cambios)
(La tabla `property_visits` se mantiene como está)
```sql
-- property_visits
```
---
## Sección Colaboración entre Corredores (Sin cambios)
(La tabla `broker_collaborations` se mantiene como está)
```sql
-- broker_collaborations
```
---
## Tabla: `contact_form_submissions` (Sin cambios)
```sql
-- contact_form_submissions
```
---
## Tabla: `user_listing_interactions` (Sin cambios)
```sql
-- user_listing_interactions
```
---
## Tabla: `user_usage_metrics` (NUEVA TABLA)
Registra acciones de usuario que cuentan contra los límites del plan. Reemplaza `user_ai_search_usage`.

```sql
CREATE TABLE user_usage_metrics (
    id VARCHAR(36) PRIMARY KEY,
    user_id VARCHAR(36) NOT NULL,
    plan_id_at_usage VARCHAR(36) DEFAULT NULL,     -- El plan que tenía el usuario al momento de la acción
    metric_type ENUM(
        'profile_view',                          -- Vista de perfil/detalle de propiedad/solicitud
        'match_reveal',                          -- Cuando se revela info de contacto de un match
        'ai_search',                             -- Ejecución de una búsqueda con IA (cualquier flujo)
        'manual_search_executed'                 -- Ejecución de una búsqueda manual con filtros
    ) NOT NULL,
    reference_id VARCHAR(36) DEFAULT NULL,         -- ID de la entidad relacionada (ej: property_id, user_id del contacto revelado)
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (plan_id_at_usage) REFERENCES plans(id) ON DELETE SET NULL,

    INDEX idx_user_usage_user_metric_time (user_id, metric_type, timestamp),
    INDEX idx_user_usage_plan_id (plan_id_at_usage)
);
```
---
## Tabla: `user_action_logs` (NUEVA TABLA)
Registra acciones generales del usuario para auditoría y posible detección de anomalías.

```sql
CREATE TABLE user_action_logs (
    id VARCHAR(36) PRIMARY KEY,
    user_id VARCHAR(36) NOT NULL,
    action_type ENUM(
        -- Acciones de visualización
        'view_property_details',
        'view_request_details',
        'view_user_profile',
        'view_contact_info_property',
        'view_contact_info_request',
        -- Acciones de búsqueda
        'execute_manual_property_search',
        'execute_manual_request_search',
        'execute_ai_match_search',        -- Búsqueda general IA desde landing u otra
        'execute_ai_find_requests_for_property',
        'execute_ai_find_properties_for_request',
        -- Acciones de creación/modificación
        'create_property',
        'update_property',
        'delete_property',
        'create_request',
        'update_request',
        'delete_request',
        'create_comment',
        'update_comment',
        'delete_comment',
        'create_crm_contact',
        'update_crm_contact',
        'log_crm_interaction',
        -- Acciones de autenticación y seguridad
        'user_login_success',
        'user_login_fail',
        'user_logout',
        'user_registration',
        'password_reset_request',
        'password_reset_success',
        -- Acciones de interacción
        'listing_like',
        'listing_dislike',
        'listing_skip',
        'comment_like',
        -- Acciones de cuenta/plan
        'plan_subscription_change',
        -- Otras/Anomalías
        'unusual_activity_detected',
        'account_locked_temporarily',
        'admin_action' -- Para acciones realizadas por un admin sobre un usuario/recurso
    ) NOT NULL,
    target_entity_id VARCHAR(36) DEFAULT NULL,   -- ID de la entidad afectada (property, request, user, comment, etc.)
    target_entity_type VARCHAR(50) DEFAULT NULL, -- 'property', 'request', 'user', 'comment'
    ip_address VARCHAR(45) DEFAULT NULL,
    user_agent TEXT DEFAULT NULL,
    details JSON DEFAULT NULL,                    -- Para contexto adicional (ej: criterios de búsqueda, descripción de anomalía)
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE, -- O SET NULL si se quiere mantener el log tras eliminar usuario

    INDEX idx_user_action_logs_user_action_time (user_id, action_type, created_at),
    INDEX idx_user_action_logs_target_entity (target_entity_type, target_entity_id)
);
```
---
Este es un esquema inicial. Lo podemos refinar a medida que construimos las funcionalidades. Por ejemplo, las `features` e `images` en la tabla `properties` podrían moverse a tablas separadas para una relación muchos-a-muchos si se vuelve más complejo (ej: `property_features` y `property_images`). Lo mismo para `desired_categories` y `desired_property_type` en `property_requests` que actualmente usan campos booleanos individuales.
