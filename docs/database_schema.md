

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
    id VARCHAR(36) PRIMARY KEY,                          -- Identificador único para el rol (ej: 'admin', 'user', 'broker')
    name VARCHAR(255) NOT NULL UNIQUE,                   -- Nombre legible del rol (ej: 'Administrador', 'Usuario Estándar')
    description TEXT,                                    -- Descripción opcional del rol
    permissions TEXT DEFAULT NULL COMMENT 'JSON array of permission strings', -- Permisos asociados al rol
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Insertar roles iniciales
INSERT INTO roles (id, name, description, permissions) VALUES
('admin', 'Administrador', 'Acceso total a todas las funcionalidades y configuraciones del sistema.', '["*"]'),
('user', 'Usuario', 'Usuario estándar con capacidad para publicar y comentar.', '["property:create", "property:edit_own", "property:delete_own", "request:create", "request:edit_own", "request:delete_own", "comment:create", "comment:delete_own", "chat:initiate", "visit:request", "user:edit_profile_own"]'),
('broker', 'Corredor', 'Usuario corredor de propiedades con acceso a funcionalidades de colaboración y planes pagos.', '["property:create", "property:edit_own", "property:delete_own", "request:create", "request:edit_own", "request:delete_own", "comment:create", "comment:delete_own", "chat:initiate", "visit:request", "crm:access_own", "collaboration:propose", "collaboration:manage", "visit:manage_own_property_visits", "ai:use_matching_tools", "user:edit_profile_own"]');
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
    max_properties_allowed INT DEFAULT NULL,
    max_requests_allowed INT DEFAULT NULL,
    max_ai_searches_monthly INT DEFAULT NULL,
    
    can_view_contact_data BOOLEAN DEFAULT FALSE,         
    manual_searches_daily_limit INT DEFAULT NULL, 
    automated_alerts_enabled BOOLEAN DEFAULT FALSE,     
    advanced_dashboard_access BOOLEAN DEFAULT FALSE,    
    daily_profile_views_limit INT DEFAULT NULL,   
    weekly_matches_reveal_limit INT DEFAULT NULL, 
    
    can_feature_properties BOOLEAN DEFAULT FALSE,
    property_listing_duration_days INT DEFAULT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    is_publicly_visible BOOLEAN DEFAULT TRUE,
    is_enterprise_plan BOOLEAN DEFAULT FALSE, 
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

```

---

## Tabla: `users` (Usuarios)

Almacena la información de los usuarios registrados.

```sql
CREATE TABLE users (
    id VARCHAR(36) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    avatar_url VARCHAR(2048) DEFAULT NULL,
    role_id VARCHAR(36) NOT NULL,
    plan_id VARCHAR(36) DEFAULT NULL,
    plan_expires_at TIMESTAMP DEFAULT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    -- Campos Comunes Opcionales
    phone_number VARCHAR(50) DEFAULT NULL COMMENT 'Teléfono de contacto general o WhatsApp. Requerido por la aplicación.',
    rut_tin VARCHAR(20) DEFAULT NULL COMMENT 'RUT (Chile) o Tax ID. Requerido para Corredor/Inmobiliaria.',

    -- Campos Específicos de Corredor/Inmobiliaria
    company_name VARCHAR(255) DEFAULT NULL COMMENT 'Corredor/Inmobiliaria: Nombre de la empresa',
    main_operating_region VARCHAR(100) DEFAULT NULL COMMENT 'Corredor/Inmobiliaria: Región principal de operación',
    main_operating_commune VARCHAR(100) DEFAULT NULL COMMENT 'Corredor/Inmobiliaria: Comuna principal de operación',
    properties_in_portfolio_count INT DEFAULT NULL COMMENT 'Corredor/Inmobiliaria: Cantidad de propiedades en cartera',
    website_social_media_link VARCHAR(2048) DEFAULT NULL COMMENT 'Corredor/Inmobiliaria: Enlace a sitio web o red social',

    FOREIGN KEY (role_id) REFERENCES roles(id) ON DELETE RESTRICT,
    FOREIGN KEY (plan_id) REFERENCES plans(id) ON DELETE SET NULL
);

-- Índices
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_role_id ON users(role_id);
CREATE INDEX idx_users_plan_id ON users(plan_id);
CREATE INDEX idx_users_rut_tin ON users(rut_tin);
CREATE INDEX idx_users_phone_number ON users(phone_number);
CREATE INDEX idx_users_company_name ON users(company_name); 
CREATE INDEX idx_users_main_operating_region ON users(main_operating_region); 
```

---

## Tabla: `properties` (Propiedades)
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
    total_area_sq_meters DECIMAL(10,2) NOT NULL,       -- Renamed from area_sq_meters
    useful_area_sq_meters DECIMAL(10,2) DEFAULT NULL,  -- New
    parking_spaces INT DEFAULT 0,                      -- New
    pets_allowed BOOLEAN DEFAULT FALSE,                -- New
    furnished BOOLEAN DEFAULT FALSE,                   -- New
    commercial_use_allowed BOOLEAN DEFAULT FALSE,      -- New
    has_storage BOOLEAN DEFAULT FALSE,                 -- New
    orientation VARCHAR(50) DEFAULT NULL,              -- New (e.g., 'North', 'Southeast')
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
-- Índices existentes
CREATE INDEX idx_properties_slug ON properties(slug);
CREATE INDEX idx_properties_user_id ON properties(user_id);
CREATE INDEX idx_properties_city ON properties(city);
CREATE INDEX idx_properties_property_type ON properties(property_type);
CREATE INDEX idx_properties_category ON properties(category);
CREATE INDEX idx_properties_upvotes ON properties(upvotes);
-- Nuevos índices
CREATE INDEX idx_properties_orientation ON properties(orientation);
CREATE INDEX idx_properties_pets_allowed ON properties(pets_allowed);
CREATE INDEX idx_properties_furnished ON properties(furnished);
CREATE INDEX idx_properties_parking_spaces ON properties(parking_spaces);
```

---

## Tabla: `property_requests` (Solicitudes de Propiedad)
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
-- Índices existentes se mantienen
```

---

## Tabla: `comments` (Comentarios)
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
## Tabla: `google_sheet_configs` (Configuración de Google Sheets)
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
```sql
CREATE TABLE site_settings (
    id INT PRIMARY KEY DEFAULT 1,
    site_title VARCHAR(255) DEFAULT 'konecte - Encuentra Tu Próxima Propiedad',
    logo_url VARCHAR(2048) DEFAULT NULL,
    show_featured_listings_section BOOLEAN DEFAULT TRUE,
    show_featured_plans_section BOOLEAN DEFAULT TRUE, -- NUEVO
    show_ai_matching_section BOOLEAN DEFAULT TRUE,
    show_google_sheet_section BOOLEAN DEFAULT TRUE,
    landing_sections_order TEXT DEFAULT NULL,
    announcement_bar_text TEXT DEFAULT NULL,
    announcement_bar_link_url VARCHAR(2048) DEFAULT NULL,
    announcement_bar_link_text VARCHAR(255) DEFAULT NULL,
    announcement_bar_is_active BOOLEAN DEFAULT FALSE,
    announcement_bar_bg_color VARCHAR(20) DEFAULT '#FFB74D', 
    announcement_bar_text_color VARCHAR(20) DEFAULT '#18181b', 
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT id_must_be_1_site_settings CHECK (id = 1)
);
-- Insert inicial se mantiene
```
---

## Sección CRM
```sql
-- contacts
-- contact_interactions
-- (Estas tablas se mantienen como estaban)
```
---
## Sección Mensajería Directa (Chat)
```sql
-- chat_conversations
-- chat_messages
-- (Estas tablas se mantienen como estaban)
```
---
## Tabla: `editable_texts` (Textos Editables del Sitio)
```sql
-- editable_texts
-- (Esta tabla se mantiene como estaba)
```
---
## Sección Seguimiento de Leads
```sql
-- property_views
-- property_inquiries
-- (Estas tablas se mantienen como estaban)
```
---
## Sección Agenda de Visitas
```sql
-- property_visits
-- (Esta tabla se mantiene como estaban)
```
---
## Sección Colaboración entre Corredores
```sql
-- broker_collaborations
-- (Esta tabla se mantiene como estaban)
```
---
## Tabla: `contact_form_submissions`
```sql
-- contact_form_submissions
-- (Esta tabla se mantiene como estaban)
```
---
## Tabla: `user_listing_interactions`
```sql
-- user_listing_interactions
-- (Esta tabla se mantiene como estaban)
```
---
## Tabla: `user_ai_search_usage` (Reemplazada por user_usage_metrics)
```sql
-- Se elimina user_ai_search_usage y se reemplaza por user_usage_metrics
```
---
## Tabla: `user_usage_metrics`
```sql
CREATE TABLE user_usage_metrics (
    id VARCHAR(36) PRIMARY KEY,
    user_id VARCHAR(36) NOT NULL,
    plan_id_at_usage VARCHAR(36) DEFAULT NULL,
    metric_type ENUM('profile_view', 'match_reveal', 'ai_search', 'manual_search_executed') NOT NULL,
    reference_id VARCHAR(36) DEFAULT NULL,
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (plan_id_at_usage) REFERENCES plans(id) ON DELETE SET NULL,
    INDEX idx_user_usage_user_metric_time (user_id, metric_type, timestamp),
    INDEX idx_user_usage_plan_id (plan_id_at_usage)
);
```
---
## Tabla: `user_action_logs`
```sql
CREATE TABLE user_action_logs (
    id VARCHAR(36) PRIMARY KEY,
    user_id VARCHAR(36) NOT NULL,
    action_type ENUM(
        'view_property_details', 'view_request_details', 'view_user_profile', 'view_contact_info_property', 'view_contact_info_request',
        'execute_manual_property_search', 'execute_manual_request_search', 'execute_ai_match_search', 'execute_ai_find_requests_for_property', 'execute_ai_find_properties_for_request',
        'create_property', 'update_property', 'delete_property', 'create_request', 'update_request', 'delete_request',
        'create_comment', 'update_comment', 'delete_comment', 'create_crm_contact', 'update_crm_contact', 'log_crm_interaction',
        'user_login_success', 'user_login_fail', 'user_logout', 'user_registration', 'password_reset_request', 'password_reset_success',
        'listing_like', 'listing_dislike', 'listing_skip', 'comment_like',
        'plan_subscription_change',
        'unusual_activity_detected', 'account_locked_temporarily', 'admin_action'
    ) NOT NULL,
    target_entity_id VARCHAR(36) DEFAULT NULL,
    target_entity_type VARCHAR(50) DEFAULT NULL,
    ip_address VARCHAR(45) DEFAULT NULL,
    user_agent TEXT DEFAULT NULL,
    details JSON DEFAULT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_user_action_logs_user_action_time (user_id, action_type, created_at),
    INDEX idx_user_action_logs_target_entity (target_entity_type, target_entity_id)
);
```

