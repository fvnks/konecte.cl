# konecte - Tu Plataforma Inmobiliaria

Bienvenido a konecte, una aplicación moderna para descubrir, listar y discutir propiedades en arriendo o venta. Construida con Next.js, React, ShadCN UI, Tailwind CSS y Genkit para funcionalidades de IA.

## Características Principales

### 1. Listados de Propiedades
- **Visualización Clara:** Muestra propiedades disponibles para arriendo o venta. El diseño se asemeja a tarjetas informativas (similar a Product Hunt), presentando cada propiedad de forma individual y atractiva.
- **Detalles Completos:** Cada listado incluye título, descripción, tipo (arriendo/venta), categoría (departamento, casa, etc.), precio (CLP o UF), dirección, ciudad, país, número de dormitorios y baños, superficie en m², imágenes, información del autor, características destacadas (ej: "Estacionamiento", "Piscina") y un slug único para la URL.
- **Navegación y Filtros:**
    - Página `/properties`: Muestra todos los listados de propiedades.
    - Filtros (placeholder): Funcionalidad para filtrar y ordenar propiedades (ej: por precio, más recientes).
    - Paginación (placeholder): Navegación entre múltiples páginas de resultados.

### 2. Solicitudes de Propiedades
- **Publica tu Búsqueda:** Los usuarios pueden crear y publicar solicitudes específicas de lo que están buscando (ej: "Busco departamento de 3 dormitorios en Las Condes para arriendo").
- **Detalles de Solicitud:** Cada solicitud incluye título, descripción, tipo de transacción deseada (arriendo/venta), categorías de propiedad deseadas, ubicación preferida (ciudad, barrio), número mínimo de dormitorios/baños y presupuesto máximo.
- **Navegación y Filtros:**
    - Página `/requests`: Muestra todas las solicitudes de propiedades.
    - Filtros y ordenación (placeholder): Similar a los listados de propiedades.

### 3. Foros de Discusión (Estilo Reddit)
- **Interacción por Listado/Solicitud:** Cada propiedad listada y cada solicitud de propiedad tiene su propia sección de discusión (actualmente simulada con comentarios de ejemplo).
- **Comentarios y Votos:** Los usuarios pueden comentar, responder a comentarios y votar (upvotes) en las discusiones.

### 4. Perfiles de Usuario (Conceptual)
- Los usuarios (actualmente simulados con `placeholderUser`) pueden crear y gestionar perfiles para rastrear sus listados, solicitudes y actividad en los foros. (La autenticación y gestión de perfiles reales no está implementada).

### 5. Emparejamiento de Propiedades con IA (Conceptual)
- **Sugerencias Inteligentes:** Una herramienta de IA (definida en `src/ai/flows/property-matching.ts`) está diseñada para sugerir listados de propiedades que coincidan con las solicitudes de búsqueda de los usuarios, y viceversa.
- **Puntuación y Razonamiento:** La IA proporciona una puntuación de coincidencia y una explicación para sus sugerencias.
- **Página Dedicada:** `/ai-matching` (actualmente un placeholder, la interfaz para usar esta herramienta no está completamente implementada en el frontend).

### 6. Integración con Google Sheets
- **Visualización de Datos Externos:** La página de inicio puede mostrar datos directamente desde una Google Sheet pública.
- **Configuración de Administrador:**
    - Una sección de administración (`/admin/settings`) permite configurar el ID de la Google Sheet, el nombre de la pestaña (hoja) y las columnas (nombres de encabezado) que se mostrarán.
    - Los datos se obtienen utilizando la URL de exportación CSV de Google Sheets (no requiere API Key, pero la hoja debe ser pública).

## Estilo y Diseño
- **Paleta de Colores:**
    - Primario: Azul suave (`#64B5F6`) para confianza.
    - Fondo: Gris claro (`#EEEEEE`) para limpieza.
    - Acento: Naranja cálido (`#FFB74D`) para llamados a la acción.
- **Tipografía:** 'Inter' (sans-serif) para una interfaz moderna y legible.
- **Layout:** Basado en tarjetas y listas, con un diseño limpio y profesional.
- **Iconografía:** Se utilizan iconos de `lucide-react`.
- **Componentes:** Se utilizan componentes de ShadCN UI, personalizados con Tailwind CSS.

## Stack Tecnológico
- **Framework Frontend:** Next.js (con App Router)
- **Librería UI:** React
- **Componentes UI:** ShadCN UI
- **Estilos:** Tailwind CSS
- **Inteligencia Artificial:** Genkit (con Google AI / Gemini)
- **Formularios:** React Hook Form con Zod para validación.
- **Idioma Principal:** Español (Chile)

## Estructura del Proyecto (Resumen)
- `src/app/`: Contiene las rutas principales de la aplicación (páginas).
    - `(auth)/`: Páginas de autenticación (simuladas).
    - `admin/`: Panel de administración.
    - `properties/`: Listado, detalle y envío de propiedades.
    - `requests/`: Listado, detalle y envío de solicitudes.
- `src/components/`: Componentes reutilizables de React.
    - `layout/`: Componentes de estructura general (Navbar, Footer).
    - `property/`: Componentes específicos para propiedades.
    - `request/`: Componentes específicos para solicitudes.
    - `ui/`: Componentes de ShadCN UI.
- `src/actions/`: Server Actions de Next.js para interactuar con el backend (simulado).
- `src/ai/`: Lógica relacionada con Genkit y flujos de IA.
    - `flows/`: Define los flujos de Genkit (ej: `property-matching.ts`).
- `src/lib/`: Utilidades y tipos de datos.
    - `types.ts`: Define las interfaces y tipos principales de la aplicación.
    - `utils.ts`: Funciones de utilidad (ej: `cn` para clases de Tailwind).
- `src/hooks/`: Hooks personalizados de React.
- `public/`: Archivos estáticos.
- `docs/`: Documentación adicional (como `database_schema.md`).

## Cómo Empezar
1. Clona el repositorio.
2. Instala las dependencias: `npm install`
3. Configura las variables de entorno en un archivo `.env` (basado en `.env.example` si existe, o las instrucciones dadas). Para la base de datos MySQL, las variables son:
   ```
   DB_HOST=your_mysql_host
   DB_PORT=your_mysql_port
   DB_USER=your_mysql_user
   DB_PASSWORD=your_mysql_password
   DB_NAME=your_mysql_database_name 
   ```
   (Ejemplo para `DB_NAME`: `konecte_db`)
4. Ejecuta el servidor de desarrollo: `npm run dev`
5. Abre [http://localhost:9002](http://localhost:9002) en tu navegador.

## Próximos Pasos (Desarrollo)
- Implementar la conexión real a la base de datos MySQL.
- Desarrollar la lógica de autenticación de usuarios.
- Completar la integración frontend para la herramienta de emparejamiento con IA.
- Implementar la funcionalidad completa de foros/discusiones.
- Añadir más filtros y opciones de ordenación a los listados.
