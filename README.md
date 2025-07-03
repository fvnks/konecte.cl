# Konecte - Plataforma Inmobiliaria

Bienvenido a Konecte, una aplicación moderna para descubrir, listar y discutir propiedades en arriendo o venta. Construida con Next.js, React, ShadCN UI, Tailwind CSS y Genkit para funcionalidades de IA.

## Características Principales

### 1. Listados de Propiedades
- **Visualización Clara:** Muestra propiedades disponibles para arriendo o venta con un diseño atractivo de tarjetas informativas.
- **Detalles Completos:** Cada listado incluye título, descripción, tipo, categoría, precio, ubicación, características, imágenes y más.
- **Navegación y Filtros:** Incluye opciones para filtrar y ordenar propiedades.

### 2. Solicitudes de Propiedades
- **Publica tu Búsqueda:** Los usuarios pueden crear y publicar solicitudes específicas de lo que están buscando.
- **Detalles de Solicitud:** Incluye todos los criterios relevantes para la búsqueda de propiedades.

### 3. Foros de Discusión (Estilo Reddit)
- **Interacción por Listado/Solicitud:** Cada propiedad y solicitud tiene su propia sección de discusión.
- **Comentarios y Votos:** Sistema de comentarios y votos para las discusiones.

### 4. Perfiles de Usuario
- Gestión de perfiles para rastrear listados, solicitudes y actividad en los foros.

### 5. Emparejamiento de Propiedades con IA
- **Sugerencias Inteligentes:** Herramienta de IA para sugerir listados de propiedades que coincidan con las solicitudes.
- **Puntuación y Razonamiento:** La IA proporciona una puntuación de coincidencia y explicaciones.

### 6. Integración con WhatsApp (Botito)
- **Bot de WhatsApp:** Integración con el proyecto Botito para comunicación vía WhatsApp.
- **Sincronización de Mensajes:** Los mensajes se sincronizan entre la plataforma web y WhatsApp.

## Stack Tecnológico
- **Framework Frontend:** Next.js (con App Router)
- **Librería UI:** React
- **Componentes UI:** ShadCN UI
- **Estilos:** Tailwind CSS
- **Inteligencia Artificial:** Genkit (con Google AI / Gemini)
- **Base de Datos:** MySQL con Drizzle ORM
- **Formularios:** React Hook Form con Zod para validación
- **Idioma Principal:** Español (Chile)

## Cómo Empezar
1. Clona el repositorio:
   ```
   git clone https://github.com/fvnks/konecte.cl.git
   cd konecte.cl
   ```

2. Instala las dependencias:
   ```
   npm install
   ```

3. Configura las variables de entorno en un archivo `.env.local`:
   ```
   MYSQL_HOST=your_mysql_host
   MYSQL_PORT=your_mysql_port
   MYSQL_USER=your_mysql_user
   MYSQL_PASSWORD=your_mysql_password
   MYSQL_DATABASE=your_mysql_database_name
   WHATSAPP_BOT_WEBHOOK_URL=your_whatsapp_bot_webhook_url
   ```

4. Ejecuta el servidor de desarrollo:
   ```
   npm run dev
   ```

5. Abre [http://localhost:9002](http://localhost:9002) en tu navegador.

## Integración con Botito (Bot de WhatsApp)
Este proyecto se integra con [Botito](https://github.com/fvnks/botito), un bot de WhatsApp que permite la comunicación entre usuarios de WhatsApp y la plataforma Konecte.

## Estructura del Proyecto
- `src/app/`: Rutas principales de la aplicación (páginas)
- `src/components/`: Componentes reutilizables de React
- `src/actions/`: Server Actions de Next.js
- `src/ai/`: Lógica relacionada con Genkit y flujos de IA
- `src/lib/`: Utilidades, tipos de datos y configuración de la base de datos

## Contribuir
Las contribuciones son bienvenidas. Por favor, asegúrate de seguir las convenciones de código existentes y añadir pruebas para las nuevas funcionalidades.

## Licencia
Este proyecto está licenciado bajo la licencia ISC.
