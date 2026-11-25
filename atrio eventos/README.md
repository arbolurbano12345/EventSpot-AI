# Atrio Eventos

Sistema web dinámico para la gestión de **salones de eventos** y **proveedores de servicios para celebraciones**, con catálogo CRUD completo, mapa interactivo en **OpenStreetMap** con exportación directa a **Google Maps**, base de datos en **Supabase**, despliegue en **Render** desde **GitHub** y asistente inteligente integrado con **Gemini API**.

## Arquitectura del Sistema

- **Frontend:** React 19, TypeScript, Tailwind CSS v4, Leaflet (OpenStreetMap).
- **Backend:** Express + Node.js (`server.ts`) con rutas REST `/api/venues` y `/api/assistant/chat`.
- **Base de datos:** Supabase PostgreSQL (`@supabase/supabase-js`) con respaldo automático local en `data/venues_store.json` cuando las variables de entorno de Supabase aún no están configuradas.
- **IA:** `@google/genai` (`gemini-4-hydrogen`) consultando en tiempo real los registros reales del catálogo.

## Variables de Entorno

Configura estas variables en `.env` (local), **Settings > Secrets** (AI Studio) o **Environment** (Render):

```env
GEMINI_API_KEY="tu_api_key_de_gemini"
SUPABASE_URL="https://tu-proyecto.supabase.co"
SUPABASE_SERVICE_ROLE_KEY="tu_service_role_key"
```

## Configuración de Supabase

1. Crea un proyecto en [Supabase](https://supabase.com).
2. Abre el **SQL Editor** y ejecuta el contenido completo de `supabase/schema.sql` para crear la tabla `venues`, políticas RLS y los 8 registros iniciales.
3. Copia tu `Project URL` (`SUPABASE_URL`) y `service_role` key (`SUPABASE_SERVICE_ROLE_KEY`) a tus variables de entorno del servidor.

## Publicación en GitHub y Render

1. Sube este repositorio a GitHub:
   ```bash
   git init
   git add .
   git commit -m "Sistema web Atrio Eventos con Supabase, OpenStreetMap y Gemini"
   git branch -M main
   git remote add origin https://github.com/TU_USUARIO/atrio-eventos.git
   git push -u origin main
   ```
2. En [Render](https://render.com), selecciona **New + > Blueprint** (detectará `render.yaml`) o **Web Service** conectado a tu repositorio:
   - **Build Command:** `npm install && npm run build`
   - **Start Command:** `npm start`
   - **Variables de entorno:** `GEMINI_API_KEY`, `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `NODE_ENV=production`.
