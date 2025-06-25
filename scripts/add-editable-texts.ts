import mysql, { type Pool, type PoolOptions } from 'mysql2/promise';
import readline from 'readline/promises';
import dotenv from 'dotenv';

dotenv.config();

// --- Helper para obtener credenciales ---
async function getCredentials(rl: readline.Interface): Promise<PoolOptions> {
  console.log('\n--- Configuración de la Base de Datos ---');
  const host = await rl.question('Host de MySQL (ej: localhost): ') || process.env.MYSQL_HOST || 'localhost';
  const portStr = await rl.question('Puerto de MySQL (ej: 3306): ') || process.env.MYSQL_PORT || '3306';
  const user = await rl.question('Usuario de MySQL (ej: root): ') || process.env.MYSQL_USER || 'root';
  const password = await rl.question('Contraseña de MySQL: ') || process.env.MYSQL_PASSWORD || '';
  const database = await rl.question('Nombre de la Base de Datos (ej: konecte_db): ') || process.env.MYSQL_DATABASE || 'konecte_db';

  const port = parseInt(portStr, 10);
  if (isNaN(port)) {
    throw new Error('El puerto debe ser un número válido.');
  }

  return { host, port, user, password, database, connectionLimit: 5, waitForConnections: true };
}

// --- Lista de textos editables organizados por sección ---
const editableTexts = [
  // Landing Page
  { id: 'landing:hero-title', content_current: 'Encuentra tu próximo hogar', page_path: 'landing', component_id: 'hero-title' },
  { id: 'landing:hero-subtitle', content_current: 'La plataforma que conecta propietarios, corredores y compradores', page_path: 'landing', component_id: 'hero-subtitle' },
  { id: 'landing:featured-listings-title', content_current: 'Propiedades Destacadas', page_path: 'landing', component_id: 'featured-listings-title' },
  { id: 'landing:featured-listings-subtitle', content_current: 'Descubre las mejores opciones disponibles', page_path: 'landing', component_id: 'featured-listings-subtitle' },
  { id: 'landing:featured-requests-title', content_current: 'Solicitudes Destacadas', page_path: 'landing', component_id: 'featured-requests-title' },
  { id: 'landing:featured-requests-subtitle', content_current: 'Personas buscando propiedades como la tuya', page_path: 'landing', component_id: 'featured-requests-subtitle' },
  { id: 'landing:ai-matching-title', content_current: 'IA: Describe tu Búsqueda Ideal', page_path: 'landing', component_id: 'ai-matching-title' },
  { id: 'landing:ai-matching-subtitle', content_current: 'Nuestra inteligencia artificial encontrará las mejores opciones para ti', page_path: 'landing', component_id: 'ai-matching-subtitle' },
  { id: 'landing:plans-title', content_current: 'Planes para Profesionales', page_path: 'landing', component_id: 'plans-title' },
  { id: 'landing:plans-subtitle', content_current: 'Potencia tu negocio inmobiliario con nuestras herramientas', page_path: 'landing', component_id: 'plans-subtitle' },
  { id: 'landing:whatsbot-title', content_current: 'Publica desde WhatsApp', page_path: 'landing', component_id: 'whatsbot-title' },
  { id: 'landing:whatsbot-subtitle', content_current: 'Gestiona tus propiedades fácilmente desde tu teléfono', page_path: 'landing', component_id: 'whatsbot-subtitle' },
  
  // Header
  { id: 'header:login-button', content_current: 'Iniciar Sesión', page_path: 'header', component_id: 'login-button' },
  { id: 'header:register-button', content_current: 'Registrarse', page_path: 'header', component_id: 'register-button' },
  { id: 'header:properties-link', content_current: 'Propiedades', page_path: 'header', component_id: 'properties-link' },
  { id: 'header:requests-link', content_current: 'Solicitudes', page_path: 'header', component_id: 'requests-link' },
  { id: 'header:publish-button', content_current: 'Publicar', page_path: 'header', component_id: 'publish-button' },
  { id: 'header:search-placeholder', content_current: 'Buscar propiedades...', page_path: 'header', component_id: 'search-placeholder' },
  
  // Footer
  { id: 'footer:about-us', content_current: 'Sobre Nosotros', page_path: 'footer', component_id: 'about-us' },
  { id: 'footer:contact', content_current: 'Contacto', page_path: 'footer', component_id: 'contact' },
  { id: 'footer:privacy-policy', content_current: 'Política de Privacidad', page_path: 'footer', component_id: 'privacy-policy' },
  { id: 'footer:terms-of-service', content_current: 'Términos de Servicio', page_path: 'footer', component_id: 'terms-of-service' },
  { id: 'footer:copyright', content_current: '© 2023 Konecte. Todos los derechos reservados.', page_path: 'footer', component_id: 'copyright' },
  
  // Authentication
  { id: 'auth:login-title', content_current: 'Iniciar Sesión', page_path: 'auth', component_id: 'login-title' },
  { id: 'auth:login-subtitle', content_current: 'Ingresa a tu cuenta para acceder a todas las funcionalidades', page_path: 'auth', component_id: 'login-subtitle' },
  { id: 'auth:register-title', content_current: 'Crear Cuenta', page_path: 'auth', component_id: 'register-title' },
  { id: 'auth:register-subtitle', content_current: 'Únete a nuestra comunidad inmobiliaria', page_path: 'auth', component_id: 'register-subtitle' },
  { id: 'auth:forgot-password', content_current: '¿Olvidaste tu contraseña?', page_path: 'auth', component_id: 'forgot-password' },
  { id: 'auth:no-account', content_current: '¿No tienes cuenta?', page_path: 'auth', component_id: 'no-account' },
  { id: 'auth:already-account', content_current: '¿Ya tienes cuenta?', page_path: 'auth', component_id: 'already-account' },
  
  // Properties
  { id: 'properties:list-title', content_current: 'Propiedades Disponibles', page_path: 'properties', component_id: 'list-title' },
  { id: 'properties:list-subtitle', content_current: 'Encuentra tu próximo hogar entre nuestras opciones', page_path: 'properties', component_id: 'list-subtitle' },
  { id: 'properties:filter-title', content_current: 'Filtros', page_path: 'properties', component_id: 'filter-title' },
  { id: 'properties:create-title', content_current: 'Publicar Propiedad', page_path: 'properties', component_id: 'create-title' },
  { id: 'properties:edit-title', content_current: 'Editar Propiedad', page_path: 'properties', component_id: 'edit-title' },
  { id: 'properties:detail-contact-title', content_current: 'Contactar al Propietario', page_path: 'properties', component_id: 'detail-contact-title' },
  { id: 'properties:detail-features-title', content_current: 'Características', page_path: 'properties', component_id: 'detail-features-title' },
  { id: 'properties:detail-location-title', content_current: 'Ubicación', page_path: 'properties', component_id: 'detail-location-title' },
  { id: 'properties:detail-comments-title', content_current: 'Comentarios', page_path: 'properties', component_id: 'detail-comments-title' },
  
  // Requests
  { id: 'requests:list-title', content_current: 'Solicitudes de Propiedades', page_path: 'requests', component_id: 'list-title' },
  { id: 'requests:list-subtitle', content_current: 'Personas buscando propiedades como la tuya', page_path: 'requests', component_id: 'list-subtitle' },
  { id: 'requests:create-title', content_current: 'Crear Solicitud', page_path: 'requests', component_id: 'create-title' },
  { id: 'requests:edit-title', content_current: 'Editar Solicitud', page_path: 'requests', component_id: 'edit-title' },
  { id: 'requests:detail-contact-title', content_current: 'Contactar al Solicitante', page_path: 'requests', component_id: 'detail-contact-title' },
  
  // Profile
  { id: 'profile:title', content_current: 'Mi Perfil', page_path: 'profile', component_id: 'title' },
  { id: 'profile:edit-title', content_current: 'Editar Perfil', page_path: 'profile', component_id: 'edit-title' },
  { id: 'profile:my-properties-title', content_current: 'Mis Propiedades', page_path: 'profile', component_id: 'my-properties-title' },
  { id: 'profile:my-requests-title', content_current: 'Mis Solicitudes', page_path: 'profile', component_id: 'my-requests-title' },
  { id: 'profile:my-messages-title', content_current: 'Mis Mensajes', page_path: 'profile', component_id: 'my-messages-title' },
  { id: 'profile:change-password-title', content_current: 'Cambiar Contraseña', page_path: 'profile', component_id: 'change-password-title' },
  
  // Admin
  { id: 'admin:dashboard-title', content_current: 'Panel de Administración', page_path: 'admin', component_id: 'dashboard-title' },
  { id: 'admin:users-title', content_current: 'Gestión de Usuarios', page_path: 'admin', component_id: 'users-title' },
  { id: 'admin:properties-title', content_current: 'Gestión de Propiedades', page_path: 'admin', component_id: 'properties-title' },
  { id: 'admin:requests-title', content_current: 'Gestión de Solicitudes', page_path: 'admin', component_id: 'requests-title' },
  { id: 'admin:settings-title', content_current: 'Configuración del Sitio', page_path: 'admin', component_id: 'settings-title' },
  { id: 'admin:content-title', content_current: 'Gestión de Contenido', page_path: 'admin', component_id: 'content-title' },
  
  // Buttons
  { id: 'buttons:save', content_current: 'Guardar', page_path: 'buttons', component_id: 'save' },
  { id: 'buttons:cancel', content_current: 'Cancelar', page_path: 'buttons', component_id: 'cancel' },
  { id: 'buttons:edit', content_current: 'Editar', page_path: 'buttons', component_id: 'edit' },
  { id: 'buttons:delete', content_current: 'Eliminar', page_path: 'buttons', component_id: 'delete' },
  { id: 'buttons:create', content_current: 'Crear', page_path: 'buttons', component_id: 'create' },
  { id: 'buttons:search', content_current: 'Buscar', page_path: 'buttons', component_id: 'search' },
  { id: 'buttons:filter', content_current: 'Filtrar', page_path: 'buttons', component_id: 'filter' },
  { id: 'buttons:clear', content_current: 'Limpiar', page_path: 'buttons', component_id: 'clear' },
  { id: 'buttons:submit', content_current: 'Enviar', page_path: 'buttons', component_id: 'submit' },
  { id: 'buttons:next', content_current: 'Siguiente', page_path: 'buttons', component_id: 'next' },
  { id: 'buttons:previous', content_current: 'Anterior', page_path: 'buttons', component_id: 'previous' },
  { id: 'buttons:contact', content_current: 'Contactar', page_path: 'buttons', component_id: 'contact' },
  { id: 'buttons:like', content_current: 'Me gusta', page_path: 'buttons', component_id: 'like' },
  { id: 'buttons:comment', content_current: 'Comentar', page_path: 'buttons', component_id: 'comment' },
  { id: 'buttons:share', content_current: 'Compartir', page_path: 'buttons', component_id: 'share' },
  { id: 'buttons:view-more', content_current: 'Ver más', page_path: 'buttons', component_id: 'view-more' },
  { id: 'buttons:view-all', content_current: 'Ver todos', page_path: 'buttons', component_id: 'view-all' },
  
  // Forms
  { id: 'forms:name-label', content_current: 'Nombre', page_path: 'forms', component_id: 'name-label' },
  { id: 'forms:email-label', content_current: 'Correo electrónico', page_path: 'forms', component_id: 'email-label' },
  { id: 'forms:password-label', content_current: 'Contraseña', page_path: 'forms', component_id: 'password-label' },
  { id: 'forms:confirm-password-label', content_current: 'Confirmar contraseña', page_path: 'forms', component_id: 'confirm-password-label' },
  { id: 'forms:phone-label', content_current: 'Teléfono', page_path: 'forms', component_id: 'phone-label' },
  { id: 'forms:address-label', content_current: 'Dirección', page_path: 'forms', component_id: 'address-label' },
  { id: 'forms:city-label', content_current: 'Ciudad', page_path: 'forms', component_id: 'city-label' },
  { id: 'forms:region-label', content_current: 'Región', page_path: 'forms', component_id: 'region-label' },
  { id: 'forms:country-label', content_current: 'País', page_path: 'forms', component_id: 'country-label' },
  { id: 'forms:title-label', content_current: 'Título', page_path: 'forms', component_id: 'title-label' },
  { id: 'forms:description-label', content_current: 'Descripción', page_path: 'forms', component_id: 'description-label' },
  { id: 'forms:price-label', content_current: 'Precio', page_path: 'forms', component_id: 'price-label' },
  { id: 'forms:bedrooms-label', content_current: 'Dormitorios', page_path: 'forms', component_id: 'bedrooms-label' },
  { id: 'forms:bathrooms-label', content_current: 'Baños', page_path: 'forms', component_id: 'bathrooms-label' },
  { id: 'forms:area-label', content_current: 'Área total (m²)', page_path: 'forms', component_id: 'area-label' },
  { id: 'forms:useful-area-label', content_current: 'Área útil (m²)', page_path: 'forms', component_id: 'useful-area-label' },
  { id: 'forms:parking-label', content_current: 'Estacionamientos', page_path: 'forms', component_id: 'parking-label' },
  { id: 'forms:storage-label', content_current: 'Bodega', page_path: 'forms', component_id: 'storage-label' },
  { id: 'forms:pets-allowed-label', content_current: 'Se permiten mascotas', page_path: 'forms', component_id: 'pets-allowed-label' },
  { id: 'forms:furnished-label', content_current: 'Amoblado', page_path: 'forms', component_id: 'furnished-label' },
  
  // Notifications
  { id: 'notifications:success-title', content_current: 'Éxito', page_path: 'notifications', component_id: 'success-title' },
  { id: 'notifications:error-title', content_current: 'Error', page_path: 'notifications', component_id: 'error-title' },
  { id: 'notifications:warning-title', content_current: 'Advertencia', page_path: 'notifications', component_id: 'warning-title' },
  { id: 'notifications:info-title', content_current: 'Información', page_path: 'notifications', component_id: 'info-title' },
  { id: 'notifications:login-success', content_current: 'Has iniciado sesión correctamente', page_path: 'notifications', component_id: 'login-success' },
  { id: 'notifications:logout-success', content_current: 'Has cerrado sesión correctamente', page_path: 'notifications', component_id: 'logout-success' },
  { id: 'notifications:save-success', content_current: 'Cambios guardados correctamente', page_path: 'notifications', component_id: 'save-success' },
  { id: 'notifications:delete-success', content_current: 'Elemento eliminado correctamente', page_path: 'notifications', component_id: 'delete-success' },
  { id: 'notifications:create-success', content_current: 'Elemento creado correctamente', page_path: 'notifications', component_id: 'create-success' },
  { id: 'notifications:update-success', content_current: 'Elemento actualizado correctamente', page_path: 'notifications', component_id: 'update-success' },
  
  // Errors
  { id: 'errors:404-title', content_current: 'Página no encontrada', page_path: 'errors', component_id: '404-title' },
  { id: 'errors:404-message', content_current: 'Lo sentimos, la página que estás buscando no existe.', page_path: 'errors', component_id: '404-message' },
  { id: 'errors:500-title', content_current: 'Error del servidor', page_path: 'errors', component_id: '500-title' },
  { id: 'errors:500-message', content_current: 'Lo sentimos, ha ocurrido un error en el servidor.', page_path: 'errors', component_id: '500-message' },
  { id: 'errors:403-title', content_current: 'Acceso denegado', page_path: 'errors', component_id: '403-title' },
  { id: 'errors:403-message', content_current: 'No tienes permisos para acceder a esta página.', page_path: 'errors', component_id: '403-message' },
  { id: 'errors:go-back', content_current: 'Volver', page_path: 'errors', component_id: 'go-back' },
  { id: 'errors:go-home', content_current: 'Ir al inicio', page_path: 'errors', component_id: 'go-home' },
];

// --- Función principal ---
async function addEditableTexts() {
  console.log('=== Script para añadir textos editables a la base de datos ===');
  
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });
  
  try {
    // Obtener credenciales de la base de datos
    const credentials = await getCredentials(rl);
    
    // Conectar a la base de datos
    console.log('\nConectando a la base de datos...');
    const connection = await mysql.createConnection(credentials);
    console.log('Conexión establecida con éxito.');
    
    // Verificar si la tabla editable_texts existe
    console.log('\nVerificando si la tabla editable_texts existe...');
    const [tables] = await connection.query(`SHOW TABLES LIKE 'editable_texts'`);
    const tableExists = Array.isArray(tables) && tables.length > 0;
    
    if (!tableExists) {
      console.log('La tabla editable_texts no existe. Creándola...');
      await connection.query(`
        CREATE TABLE editable_texts (
          id VARCHAR(255) PRIMARY KEY,
          content_current TEXT,
          content_default TEXT NULL,
          page_path VARCHAR(255) NOT NULL,
          component_id VARCHAR(255) NOT NULL,
          description VARCHAR(255) NULL,
          page_group VARCHAR(100) NULL,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
        )
      `);
      console.log('Tabla editable_texts creada con éxito.');
    } else {
      // Verificar si la tabla tiene las columnas necesarias
      console.log('Verificando si la tabla tiene todas las columnas necesarias...');
      const [columns] = await connection.query(`SHOW COLUMNS FROM editable_texts`);
      const columnNames = (columns as any[]).map(col => col.Field);
      
      if (!columnNames.includes('content_default')) {
        console.log('Añadiendo columna content_default...');
        await connection.query(`ALTER TABLE editable_texts ADD COLUMN content_default TEXT NULL AFTER content_current`);
      }
      
      if (!columnNames.includes('description')) {
        console.log('Añadiendo columna description...');
        await connection.query(`ALTER TABLE editable_texts ADD COLUMN description VARCHAR(255) NULL AFTER component_id`);
      }
      
      if (!columnNames.includes('page_group')) {
        console.log('Añadiendo columna page_group...');
        await connection.query(`ALTER TABLE editable_texts ADD COLUMN page_group VARCHAR(100) NULL AFTER description`);
      }
      
      // Renombrar columna text a content_current si existe
      if (columnNames.includes('text') && !columnNames.includes('content_current')) {
        console.log('Renombrando columna text a content_current...');
        await connection.query(`ALTER TABLE editable_texts CHANGE COLUMN text content_current TEXT`);
      }
    }
    
    // Insertar o actualizar los textos editables
    console.log('\nInsertando o actualizando textos editables...');
    let insertedCount = 0;
    let updatedCount = 0;
    let skippedCount = 0;
    
    for (const text of editableTexts) {
      // Verificar si el texto ya existe
      const [existingTexts] = await connection.query(
        'SELECT * FROM editable_texts WHERE id = ?',
        [text.id]
      );
      
      const exists = Array.isArray(existingTexts) && existingTexts.length > 0;
      
      if (exists) {
        // Si ya existe, actualizar solo si se especifica
        const shouldUpdate = await rl.question(`El texto '${text.id}' ya existe. ¿Deseas actualizarlo? (s/N): `);
        
        if (shouldUpdate.toLowerCase() === 's') {
          await connection.query(
            'UPDATE editable_texts SET content_default = ?, page_path = ?, component_id = ?, description = ? WHERE id = ?',
            [text.content_current, text.page_path, text.component_id, generateDescription(text.id), text.id]
          );
          console.log(`✓ Texto '${text.id}' actualizado.`);
          updatedCount++;
        } else {
          console.log(`✓ Texto '${text.id}' omitido.`);
          skippedCount++;
        }
      } else {
        // Si no existe, insertarlo
        await connection.query(
          'INSERT INTO editable_texts (id, content_current, content_default, page_path, component_id, description, page_group) VALUES (?, ?, ?, ?, ?, ?, ?)',
          [text.id, text.content_current, text.content_current, text.page_path, text.component_id, generateDescription(text.id), text.page_path]
        );
        console.log(`✓ Texto '${text.id}' insertado.`);
        insertedCount++;
      }
    }
    
    // Mostrar resumen
    console.log('\n=== Resumen ===');
    console.log(`Textos insertados: ${insertedCount}`);
    console.log(`Textos actualizados: ${updatedCount}`);
    console.log(`Textos omitidos: ${skippedCount}`);
    console.log(`Total de textos procesados: ${editableTexts.length}`);
    
    // Cerrar conexión
    await connection.end();
    console.log('\nConexión a la base de datos cerrada.');
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    rl.close();
  }
}

// Función para generar una descripción amigable a partir del ID
function generateDescription(id: string): string {
  const parts = id.split(':');
  if (parts.length > 1) {
    const section = parts[0];
    const key = parts.slice(1).join(':');
    
    // Transformar el key en una descripción legible
    return key
      .replace(/-/g, ' ')
      .replace(/_/g, ' ')
      .replace(/([A-Z])/g, ' $1')
      .replace(/\b\w/g, c => c.toUpperCase());
  }
  return id.replace(/-/g, ' ').replace(/_/g, ' ');
}

// Ejecutar el script
addEditableTexts().catch(console.error); 